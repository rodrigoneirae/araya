import 'dart:async';

import 'package:connectivity_plus/connectivity_plus.dart';

import '../models/registro_articulo.dart';
import '../models/sync_models.dart';
import 'api_service.dart';
import 'database_service.dart';

enum SyncState {
  idle,
  syncing,
  error,
  offline,
}

class SyncService {
  static final SyncService _instance = SyncService._internal();
  factory SyncService() => _instance;
  SyncService._internal();

  final DatabaseService _db = DatabaseService();
  final Connectivity _connectivity = Connectivity();
  StreamSubscription<List<ConnectivityResult>>? _connectivitySubscription;

  final _syncStateController = StreamController<SyncState>.broadcast();
  final _pendingCountController = StreamController<int>.broadcast();
  final _lastSyncController = StreamController<DateTime?>.broadcast();

  Stream<SyncState> get syncStateStream => _syncStateController.stream;
  Stream<int> get pendingCountStream => _pendingCountController.stream;
  Stream<DateTime?> get lastSyncStream => _lastSyncController.stream;

  SyncState _currentState = SyncState.idle;
  SyncState get currentState => _currentState;

  int _pendingCount = 0;
  int get pendingCount => _pendingCount;

  DateTime? _lastSync;
  DateTime? get lastSync => _lastSync;

  bool _isInitialized = false;
  ApiService? _apiService;

  Future<void> initialize(ApiService apiService) async {
    if (_isInitialized) return;
    _apiService = apiService;
    _isInitialized = true;

    await _updatePendingCount();

    _connectivitySubscription = _connectivity.onConnectivityChanged.listen((results) async {
      final hasConnection = results.any((r) => r != ConnectivityResult.none);
      if (hasConnection) {
        await sync();
      } else {
        _setState(SyncState.offline);
      }
    });

    await _checkConnectivityAndSync();
  }

  Future<void> _checkConnectivityAndSync() async {
    final results = await _connectivity.checkConnectivity();
    final hasConnection = results.any((r) => r != ConnectivityResult.none);

    if (hasConnection) {
      await sync();
    } else {
      _setState(SyncState.offline);
    }
  }

  void _setState(SyncState state) {
    _currentState = state;
    _syncStateController.add(state);
  }

  Future<void> _updatePendingCount() async {
    final pending = await _db.getSyncRegistros(status: SyncStatus.pending);
    _pendingCount = pending.length;
    _pendingCountController.add(_pendingCount);
  }

  Future<void> sync() async {
    if (_apiService == null) return;
    if (_currentState == SyncState.syncing) return;

    final results = await _connectivity.checkConnectivity();
    final hasConnection = results.any((r) => r != ConnectivityResult.none);

    if (!hasConnection) {
      _setState(SyncState.offline);
      return;
    }

    _setState(SyncState.syncing);

    try {
      await _pushPendingChanges();
      await _pullServerUpdates();
      _lastSync = DateTime.now();
      _lastSyncController.add(_lastSync);
      _setState(SyncState.idle);
    } catch (e) {
      _setState(SyncState.error);
    } finally {
      await _updatePendingCount();
    }
  }

  Future<void> _pushPendingChanges() async {
    final pending = await _db.getSyncRegistros(status: SyncStatus.pending);

    for (final registro in pending) {
      try {
        if (registro.syncAction == SyncAction.create) {
          final serverRegistro = await _apiService!.createRegistro(
            documento: registro.documento,
            detalles: registro.detalles,
            tipoRegistro: registro.tipoRegistro ?? 'PE',
            otNumero: registro.otNumero,
            codencargado: registro.codencargado,
          );

          if (serverRegistro != null) {
            final synced = registro.copyWith(
              serverId: serverRegistro.id,
              folio: serverRegistro.folio,
              syncStatus: SyncStatus.synced,
              serverVersion: DateTime.now().toIso8601String(),
            );
            await _db.updateSyncRegistro(synced);
          }
        } else if (registro.syncAction == SyncAction.update && registro.serverId != null) {
          final serverRegistro = await _apiService!.updateRegistro(
            serverId: registro.serverId!,
            documento: registro.documento,
            detalles: registro.detalles,
          );

          if (serverRegistro != null) {
            final synced = registro.copyWith(
              folio: serverRegistro.folio,
              syncStatus: SyncStatus.synced,
              serverVersion: DateTime.now().toIso8601String(),
            );
            await _db.updateSyncRegistro(synced);
          }
        }
      } catch (e) {
        continue;
      }
    }
  }

  Future<void> _pullServerUpdates() async {
    try {
      final serverRegistros = await _apiService!.fetchRegistros();

      for (final serverReg in serverRegistros) {
        final local = await _db.getSyncRegistroByServerId(serverReg.id);

        if (local == null) {
          final syncReg = SyncRegistro(
            serverId: serverReg.id,
            folio: serverReg.folio,
            usuarioUsername: serverReg.usuarioUsername,
            fechaHora: serverReg.fechaHora,
            documento: serverReg.documento,
            estado: serverReg.estado,
            detalles: serverReg.detalles,
            syncStatus: SyncStatus.synced,
            syncAction: SyncAction.create,
            serverVersion: DateTime.now().toIso8601String(),
            createdAt: DateTime.now(),
            updatedAt: DateTime.now(),
          );
          await _db.insertSyncRegistro(syncReg);
        }
      }
    } catch (e) {
      // Server wins - ignore pull errors
    }
  }

  Future<SyncRegistro> saveRegistroOffline(RegistroArticulo registro) async {
    final saved = await _db.saveRegistroLocal(registro);
    await _updatePendingCount();

    final results = await _connectivity.checkConnectivity();
    final hasConnection = results.any((r) => r != ConnectivityResult.none);
    if (hasConnection) {
      sync();
    }

    return saved;
  }

  Future<SyncRegistro> saveRegistroOfflineFromApi({
    required String documento,
    required List<RegistroDetalle> detalles,
    required String tipoRegistro,
    double? otNumero,
    double? codencargado,
    required ApiService apiService,
  }) async {
    final now = DateTime.now();
    final syncRegistro = SyncRegistro(
      usuarioUsername: '',
      fechaHora: now.toIso8601String(),
      documento: documento,
      tipoRegistro: tipoRegistro,
      otNumero: otNumero,
      codencargado: codencargado,
      estado: 'INGRESADO',
      detalles: detalles,
      syncStatus: SyncStatus.pending,
      syncAction: SyncAction.create,
      localId: 'local_${now.millisecondsSinceEpoch}',
      createdAt: now,
      updatedAt: now,
    );

    int id;
    try {
      id = await _db.insertSyncRegistro(syncRegistro);
    } catch (e, stack) {
      print('Error inserting local: $e');
      print('Stack: $stack');
      throw Exception('Error inserting local: $e');
    }

    var saved = syncRegistro.copyWith(id: id);
    await _updatePendingCount();

    final results = await _connectivity.checkConnectivity();
    final hasConnection = results.any((r) => r != ConnectivityResult.none);

    if (hasConnection) {
      try {
        final serverRegistro = await apiService.createRegistro(
          documento: saved.documento,
          detalles: saved.detalles,
          tipoRegistro: saved.tipoRegistro ?? 'PE',
          otNumero: saved.otNumero,
          codencargado: saved.codencargado,
        );

        if (serverRegistro != null) {
          saved = saved.copyWith(
            serverId: serverRegistro.id,
            folio: serverRegistro.folio,
            syncStatus: SyncStatus.synced,
            serverVersion: DateTime.now().toIso8601String(),
          );
          await _db.updateSyncRegistro(saved);
          await _updatePendingCount();
        }
      } catch (e) {
        // Keep as pending, will sync later
      }
    }

    return saved;
  }

  Future<void> updateRegistroOffline(SyncRegistro registro) async {
    await _db.updateRegistroLocal(registro);
    await _updatePendingCount();

    final results = await _connectivity.checkConnectivity();
    final hasConnection = results.any((r) => r != ConnectivityResult.none);
    if (hasConnection) {
      sync();
    }
  }

  Future<List<SyncRegistro>> getLocalRegistros({String? estado}) async {
    final all = await _db.getRegistrosForDisplay();

    if (estado == null || estado.isEmpty || estado == 'ALL') {
      return all;
    }

    return all.where((r) => r.estado == estado).toList();
  }

  Future<void> forceSync() async {
    await sync();
  }

  void dispose() {
    _connectivitySubscription?.cancel();
    _syncStateController.close();
    _pendingCountController.close();
    _lastSyncController.close();
  }
}

extension SyncRegistroExtension on ApiService {
  Future<RegistroArticulo?> updateRegistro({
    required int serverId,
    required String documento,
    required List<RegistroDetalle> detalles,
  }) async {
    return null;
  }
}