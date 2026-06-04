import 'package:path/path.dart';
import 'package:sqflite/sqflite.dart';

import '../models/registro_articulo.dart';
import '../models/sync_models.dart';

class DatabaseService {
  static Database? _database;
  static const String _dbName = 'araya_offline.db';
  static const int _dbVersion = 2;

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDb();
    return _database!;
  }

  Future<Database> _initDb() async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, _dbName);
    print('Opening database at: $path');

    return await openDatabase(
      path,
      version: _dbVersion,
      onCreate: _onCreate,
      onUpgrade: _onUpgrade,
    ).catchError((e) {
      print('Error opening database: $e');
      throw e;
    });
  }

  Future<void> _onUpgrade(Database db, int oldVersion, int newVersion) async {
    print('Upgrading database from $oldVersion to $newVersion');

    try {
      await db.execute('ALTER TABLE sync_registros ADD COLUMN tipo_registro TEXT');
    } catch (e) {
      print('tipo_registro already exists or error: $e');
    }
    try {
      await db.execute('ALTER TABLE sync_registros ADD COLUMN ot_numero REAL');
    } catch (e) {
      print('ot_numero already exists or error: $e');
    }
    try {
      await db.execute('ALTER TABLE sync_registros ADD COLUMN codencargado REAL');
    } catch (e) {
      print('codencargado already exists or error: $e');
    }
  }

  Future<void> _onCreate(Database db, int version) async {
    await db.execute('''
      CREATE TABLE sync_registros (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        server_id INTEGER,
        folio INTEGER,
        usuario_username TEXT NOT NULL,
        fecha_hora TEXT NOT NULL,
        documento TEXT,
        estado TEXT NOT NULL,
        tipo_registro TEXT,
        ot_numero REAL,
        codencargado REAL,
        sync_status INTEGER NOT NULL DEFAULT 0,
        sync_action INTEGER NOT NULL DEFAULT 0,
        local_id TEXT,
        server_version TEXT,
        local_version TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    ''');

    await db.execute('''
      CREATE TABLE sync_detalle (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sync_registro_id INTEGER NOT NULL,
        articulo_codigo TEXT NOT NULL,
        articulo_descr TEXT,
        articulo_um TEXT,
        cantidad REAL NOT NULL,
        observacion TEXT,
        FOREIGN KEY (sync_registro_id) REFERENCES sync_registros(id) ON DELETE CASCADE
      )
    ''');

    await db.execute('''
      CREATE TABLE sync_changes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entity_type TEXT NOT NULL,
        entity_id INTEGER NOT NULL,
        action INTEGER NOT NULL,
        payload TEXT NOT NULL,
        created_at TEXT NOT NULL,
        retry_count INTEGER NOT NULL DEFAULT 0
      )
    ''');

    await db.execute('CREATE INDEX idx_sync_status ON sync_registros(sync_status)');
    await db.execute('CREATE INDEX idx_sync_local_id ON sync_registros(local_id)');
    await db.execute('CREATE INDEX idx_changes_entity ON sync_changes(entity_type, entity_id)');
  }

  Future<int> insertSyncRegistro(SyncRegistro registro) async {
    final db = await database;
    int? registroId;

    final map = <String, dynamic>{
      'server_id': registro.serverId,
      'folio': registro.folio,
      'usuario_username': registro.usuarioUsername,
      'fecha_hora': registro.fechaHora,
      'documento': registro.documento,
      'estado': registro.estado,
      'tipo_registro': registro.tipoRegistro,
      'ot_numero': registro.otNumero,
      'codencargado': registro.codencargado,
      'sync_status': registro.syncStatus.index,
      'sync_action': registro.syncAction.index,
      'local_id': registro.localId,
      'server_version': registro.serverVersion,
      'local_version': registro.localVersion,
      'created_at': registro.createdAt.toIso8601String(),
      'updated_at': registro.updatedAt.toIso8601String(),
    };

    await db.transaction((txn) async {
      registroId = await txn.insert('sync_registros', map);

      for (final detalle in registro.detalles) {
        await txn.insert('sync_detalle', {
          'sync_registro_id': registroId,
          'articulo_codigo': detalle.articuloCodigo,
          'articulo_descr': detalle.articuloDescr,
          'articulo_um': detalle.articuloUm,
          'cantidad': detalle.cantidad,
          'observacion': detalle.observacion,
        });
      }
    });

    return registroId!;
  }

  Future<List<SyncRegistro>> getSyncRegistros({SyncStatus? status}) async {
    final db = await database;

    String? whereClause;
    List<dynamic>? whereArgs;

    if (status != null) {
      whereClause = 'sync_status = ?';
      whereArgs = [status.index];
    }

    final registroMaps = await db.query(
      'sync_registros',
      where: whereClause,
      whereArgs: whereArgs,
      orderBy: 'created_at DESC',
    );

    final result = <SyncRegistro>[];
    for (final regMap in registroMaps) {
      final detalleMaps = await db.query(
        'sync_detalle',
        where: 'sync_registro_id = ?',
        whereArgs: [regMap['id']],
      );

      final detalles = detalleMaps.map((d) => RegistroDetalle(
        id: d['id'] as int?,
        articuloCodigo: d['articulo_codigo'] as String,
        articuloDescr: d['articulo_descr'] as String? ?? '',
        articuloUm: d['articulo_um'] as String? ?? '',
        cantidad: (d['cantidad'] as num).toDouble(),
        observacion: d['observacion'] as String? ?? '',
      )).toList();

      result.add(SyncRegistro.fromMap(regMap, detalles));
    }

    return result;
  }

  Future<SyncRegistro?> getSyncRegistroByServerId(int serverId) async {
    final db = await database;
    final registroMaps = await db.query(
      'sync_registros',
      where: 'server_id = ?',
      whereArgs: [serverId],
    );

    if (registroMaps.isEmpty) return null;

    final regMap = registroMaps.first;
    final detalleMaps = await db.query(
      'sync_detalle',
      where: 'sync_registro_id = ?',
      whereArgs: [regMap['id']],
    );

    final detalles = detalleMaps.map((d) => RegistroDetalle(
      id: d['id'] as int?,
      articuloCodigo: d['articulo_codigo'] as String,
      articuloDescr: d['articulo_descr'] as String? ?? '',
      articuloUm: d['articulo_um'] as String? ?? '',
      cantidad: (d['cantidad'] as num).toDouble(),
      observacion: d['observacion'] as String? ?? '',
    )).toList();

    return SyncRegistro.fromMap(regMap, detalles);
  }

  Future<SyncRegistro?> getSyncRegistroByLocalId(String localId) async {
    final db = await database;
    final registroMaps = await db.query(
      'sync_registros',
      where: 'local_id = ?',
      whereArgs: [localId],
    );

    if (registroMaps.isEmpty) return null;

    final regMap = registroMaps.first;
    final detalleMaps = await db.query(
      'sync_detalle',
      where: 'sync_registro_id = ?',
      whereArgs: [regMap['id']],
    );

    final detalles = detalleMaps.map((d) => RegistroDetalle(
      id: d['id'] as int?,
      articuloCodigo: d['articulo_codigo'] as String,
      articuloDescr: d['articulo_descr'] as String? ?? '',
      articuloUm: d['articulo_um'] as String? ?? '',
      cantidad: (d['cantidad'] as num).toDouble(),
      observacion: d['observacion'] as String? ?? '',
    )).toList();

    return SyncRegistro.fromMap(regMap, detalles);
  }

  Future<void> updateSyncRegistro(SyncRegistro registro) async {
    final db = await database;

    await db.transaction((txn) async {
      await txn.update(
        'sync_registros',
        registro.toMap(),
        where: 'id = ?',
        whereArgs: [registro.id],
      );

      await txn.delete(
        'sync_detalle',
        where: 'sync_registro_id = ?',
        whereArgs: [registro.id],
      );

      for (final detalle in registro.detalles) {
        await txn.insert('sync_detalle', {
          'sync_registro_id': registro.id,
          'articulo_codigo': detalle.articuloCodigo,
          'articulo_descr': detalle.articuloDescr,
          'articulo_um': detalle.articuloUm,
          'cantidad': detalle.cantidad,
          'observacion': detalle.observacion,
        });
      }
    });
  }

  Future<void> deleteSyncRegistro(int id) async {
    final db = await database;
    await db.delete(
      'sync_registros',
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  Future<int> insertSyncChange(SyncChange change) async {
    final db = await database;
    return await db.insert('sync_changes', change.toMap());
  }

  Future<List<SyncChange>> getPendingChanges() async {
    final db = await database;
    final maps = await db.query(
      'sync_changes',
      orderBy: 'created_at ASC',
    );
    return maps.map((m) => SyncChange.fromMap(m)).toList();
  }

  Future<void> deleteSyncChange(int id) async {
    final db = await database;
    await db.delete(
      'sync_changes',
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  Future<void> updateSyncChangeRetry(int id, int retryCount) async {
    final db = await database;
    await db.update(
      'sync_changes',
      {'retry_count': retryCount},
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  Future<void> clearSyncedRegistros() async {
    final db = await database;
    await db.delete(
      'sync_registros',
      where: 'sync_status = ?',
      whereArgs: [SyncStatus.synced.index],
    );
  }

  Future<void> clearAllData() async {
    final db = await database;
    await db.delete('sync_detalle');
    await db.delete('sync_registros');
    await db.delete('sync_changes');
  }

  Future<List<SyncRegistro>> getRegistrosForDisplay() async {
    final db = await database;

    final registroMaps = await db.query(
      'sync_registros',
      orderBy: 'fecha_hora DESC',
    );

    final result = <SyncRegistro>[];
    for (final regMap in registroMaps) {
      final detalleMaps = await db.query(
        'sync_detalle',
        where: 'sync_registro_id = ?',
        whereArgs: [regMap['id']],
      );

      final detalles = detalleMaps.map((d) => RegistroDetalle(
        id: d['id'] as int?,
        articuloCodigo: d['articulo_codigo'] as String,
        articuloDescr: d['articulo_descr'] as String? ?? '',
        articuloUm: d['articulo_um'] as String? ?? '',
        cantidad: (d['cantidad'] as num).toDouble(),
        observacion: d['observacion'] as String? ?? '',
      )).toList();

      result.add(SyncRegistro.fromMap(regMap, detalles));
    }

    return result;
  }

  Future<SyncRegistro> saveRegistroLocal(RegistroArticulo registro) async {
    final now = DateTime.now();
    final syncRegistro = SyncRegistro(
      usuarioUsername: registro.usuarioUsername,
      fechaHora: registro.fechaHora,
      documento: registro.documento,
      estado: registro.estado,
      detalles: registro.detalles,
      syncStatus: SyncStatus.pending,
      syncAction: SyncAction.create,
      localId: 'local_${now.millisecondsSinceEpoch}',
      createdAt: now,
      updatedAt: now,
    );

    final id = await insertSyncRegistro(syncRegistro);
    return syncRegistro.copyWith(id: id);
  }

  Future<SyncRegistro> updateRegistroLocal(SyncRegistro registro) async {
    final updated = registro.copyWith(
      updatedAt: DateTime.now(),
      syncStatus: SyncStatus.pending,
      syncAction: SyncAction.update,
    );
    await updateSyncRegistro(updated);
    return updated;
  }
}