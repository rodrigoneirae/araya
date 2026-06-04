import '../models/registro_articulo.dart';

enum SyncStatus {
  pending,
  synced,
  conflict,
}

enum SyncAction {
  create,
  update,
  delete,
}

class SyncRegistro {
  final int? id;
  final int? serverId;
  final int? folio;
  final String usuarioUsername;
  final String fechaHora;
  final String documento;
  final String estado;
  final String? tipoRegistro;
  final double? otNumero;
  final double? codencargado;
  final List<RegistroDetalle> detalles;
  final SyncStatus syncStatus;
  final SyncAction syncAction;
  final String? localId;
  final String? serverVersion;
  final String? localVersion;
  final DateTime createdAt;
  final DateTime updatedAt;

  SyncRegistro({
    this.id,
    this.serverId,
    this.folio,
    required this.usuarioUsername,
    required this.fechaHora,
    this.documento = '',
    required this.estado,
    this.tipoRegistro,
    this.otNumero,
    this.codencargado,
    required this.detalles,
    this.syncStatus = SyncStatus.pending,
    this.syncAction = SyncAction.create,
    this.localId,
    this.serverVersion,
    this.localVersion,
    required this.createdAt,
    required this.updatedAt,
  });

  factory SyncRegistro.fromRegistro(RegistroArticulo r, {SyncAction action = SyncAction.create}) {
    final now = DateTime.now();
    return SyncRegistro(
      serverId: r.id,
      folio: r.folio,
      usuarioUsername: r.usuarioUsername,
      fechaHora: r.fechaHora,
      documento: r.documento,
      estado: r.estado,
      detalles: r.detalles,
      syncStatus: SyncStatus.pending,
      syncAction: action,
      localId: r.id == 0 ? _generateLocalId() : null,
      createdAt: now,
      updatedAt: now,
    );
  }

  RegistroArticulo toRegistro() {
    return RegistroArticulo(
      id: serverId ?? 0,
      folio: folio,
      usuarioUsername: usuarioUsername,
      fechaHora: fechaHora,
      documento: documento,
      estado: estado,
      detalles: detalles,
    );
  }

  static String _generateLocalId() {
    return 'local_${DateTime.now().millisecondsSinceEpoch}';
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'server_id': serverId,
      'folio': folio,
      'usuario_username': usuarioUsername,
      'fecha_hora': fechaHora,
      'documento': documento,
      'estado': estado,
      'tipo_registro': tipoRegistro,
      'ot_numero': otNumero,
      'codencargado': codencargado,
      'sync_status': syncStatus.index,
      'sync_action': syncAction.index,
      'local_id': localId,
      'server_version': serverVersion,
      'local_version': localVersion,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  factory SyncRegistro.fromMap(Map<String, dynamic> map, List<RegistroDetalle> detalles) {
    return SyncRegistro(
      id: map['id'] as int?,
      serverId: map['server_id'] as int?,
      folio: map['folio'] as int?,
      usuarioUsername: map['usuario_username'] as String? ?? '',
      fechaHora: map['fecha_hora'] as String? ?? '',
      documento: map['documento'] as String? ?? '',
      estado: map['estado'] as String? ?? 'INGRESADO',
      tipoRegistro: map['tipo_registro'] as String?,
      otNumero: (map['ot_numero'] as num?)?.toDouble(),
      codencargado: (map['codencargado'] as num?)?.toDouble(),
      detalles: detalles,
      syncStatus: SyncStatus.values[map['sync_status'] as int? ?? 0],
      syncAction: SyncAction.values[map['sync_action'] as int? ?? 0],
      localId: map['local_id'] as String?,
      serverVersion: map['server_version'] as String?,
      localVersion: map['local_version'] as String?,
      createdAt: DateTime.parse(map['created_at'] as String),
      updatedAt: DateTime.parse(map['updated_at'] as String),
    );
  }

  SyncRegistro copyWith({
    int? id,
    int? serverId,
    int? folio,
    String? usuarioUsername,
    String? fechaHora,
    String? documento,
    String? estado,
    String? tipoRegistro,
    double? otNumero,
    double? codencargado,
    List<RegistroDetalle>? detalles,
    SyncStatus? syncStatus,
    SyncAction? syncAction,
    String? localId,
    String? serverVersion,
    String? localVersion,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return SyncRegistro(
      id: id ?? this.id,
      serverId: serverId ?? this.serverId,
      folio: folio ?? this.folio,
      usuarioUsername: usuarioUsername ?? this.usuarioUsername,
      fechaHora: fechaHora ?? this.fechaHora,
      documento: documento ?? this.documento,
      estado: estado ?? this.estado,
      tipoRegistro: tipoRegistro ?? this.tipoRegistro,
      otNumero: otNumero ?? this.otNumero,
      codencargado: codencargado ?? this.codencargado,
      detalles: detalles ?? this.detalles,
      syncStatus: syncStatus ?? this.syncStatus,
      syncAction: syncAction ?? this.syncAction,
      localId: localId ?? this.localId,
      serverVersion: serverVersion ?? this.serverVersion,
      localVersion: localVersion ?? this.localVersion,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}

class SyncChange {
  final int? id;
  final String entityType;
  final int entityId;
  final SyncAction action;
  final String payload;
  final DateTime createdAt;
  final int retryCount;

  SyncChange({
    this.id,
    required this.entityType,
    required this.entityId,
    required this.action,
    required this.payload,
    required this.createdAt,
    this.retryCount = 0,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'entity_type': entityType,
      'entity_id': entityId,
      'action': action.index,
      'payload': payload,
      'created_at': createdAt.toIso8601String(),
      'retry_count': retryCount,
    };
  }

  factory SyncChange.fromMap(Map<String, dynamic> map) {
    return SyncChange(
      id: map['id'] as int?,
      entityType: map['entity_type'] as String,
      entityId: map['entity_id'] as int,
      action: SyncAction.values[map['action'] as int],
      payload: map['payload'] as String,
      createdAt: DateTime.parse(map['created_at'] as String),
      retryCount: map['retry_count'] as int? ?? 0,
    );
  }
}