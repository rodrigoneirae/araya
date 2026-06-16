import 'registro_articulo.dart';

class Proceso {
  final int cod;
  final String nombre;

  Proceso({required this.cod, required this.nombre});

  factory Proceso.fromJson(Map<String, dynamic> json) {
    return Proceso(
      cod: json['cod'] as int,
      nombre: json['nombre'] as String? ?? '',
    );
  }
}

class OTDetalle {
  final double linea;
  final String codigo;
  final String descr;
  final double? bodega;
  final double cantidad;
  final double punit;
  final double neto;
  final double pendiente;

  OTDetalle({
    required this.linea,
    required this.codigo,
    required this.descr,
    this.bodega,
    required this.cantidad,
    required this.punit,
    required this.neto,
    this.pendiente = 0,
  });

  factory OTDetalle.fromJson(Map<String, dynamic> json) {
    return OTDetalle(
      linea: (json['linea'] as num?)?.toDouble() ?? 0,
      codigo: json['codigo'] as String? ?? '',
      descr: json['descr'] as String? ?? '',
      bodega: (json['bodega'] as num?)?.toDouble(),
      cantidad: (json['cantidad'] as num?)?.toDouble() ?? 0,
      punit: (json['punit'] as num?)?.toDouble() ?? 0,
      neto: (json['neto'] as num?)?.toDouble() ?? 0,
      pendiente: (json['pendiente'] as num?)?.toDouble() ?? 0,
    );
  }
}

class OTStats {
  final int totalDetalle;
  final double totalCantidad;
  final double totalPendiente;

  OTStats({
    required this.totalDetalle,
    required this.totalCantidad,
    this.totalPendiente = 0,
  });

  factory OTStats.fromJson(Map<String, dynamic> json) {
    return OTStats(
      totalDetalle: json['total_detalle'] as int? ?? 0,
      totalCantidad: (json['total_cantidad'] as num?)?.toDouble() ?? 0,
      totalPendiente: (json['total_pendiente'] as num?)?.toDouble() ?? 0,
    );
  }
}

class OrdenTrabajo {
  final double numero;
  final DateTime fecha;
  final double codencargado;
  final String? encargadoNombre;
  final double? proceso;
  final String? procesoNombre;
  final String estado;
  final int totalDetalle;
  final double totalCantidad;
  final double registradoCantidad;
  final double pendienteCantidad;

  OrdenTrabajo({
    required this.numero,
    required this.fecha,
    required this.codencargado,
    this.encargadoNombre,
    this.proceso,
    this.procesoNombre,
    required this.estado,
    required this.totalDetalle,
    required this.totalCantidad,
    required this.registradoCantidad,
    required this.pendienteCantidad,
  });

  factory OrdenTrabajo.fromJson(Map<String, dynamic> json) {
    return OrdenTrabajo(
      numero: (json['numero'] as num?)?.toDouble() ?? 0,
      fecha: DateTime.parse(json['fecha'] as String),
      codencargado: (json['codencargado'] as num?)?.toDouble() ?? 0,
      encargadoNombre: json['encargado_nombre'] as String?,
      proceso: (json['proceso'] as num?)?.toDouble(),
      procesoNombre: json['proceso_nombre'] as String?,
      estado: json['estado'] as String? ?? 'Abierto',
      totalDetalle: json['total_detalle'] as int? ?? 0,
      totalCantidad: (json['total_cantidad'] as num?)?.toDouble() ?? 0,
      registradoCantidad: (json['registrado_cantidad'] as num?)?.toDouble() ?? 0,
      pendienteCantidad: (json['pendiente_cantidad'] as num?)?.toDouble() ?? 0,
    );
  }
}

class MovsSubitem {
  final int? tipoCod;
  final double linea;
  final String codigo;
  final String descr;
  final double cantidad;
  final DateTime? fecha;
  final double? codencargado;
  final String? encargadoNombre;

  MovsSubitem({
    this.tipoCod,
    required this.linea,
    required this.codigo,
    required this.descr,
    required this.cantidad,
    this.fecha,
    this.codencargado,
    this.encargadoNombre,
  });

  factory MovsSubitem.fromJson(Map<String, dynamic> json) {
    return MovsSubitem(
      tipoCod: json['tipo_cod'] as int?,
      linea: (json['linea'] as num?)?.toDouble() ?? 0,
      codigo: json['codigo'] as String? ?? '',
      descr: json['descr'] as String? ?? '',
      cantidad: (json['cantidad'] as num?)?.toDouble() ?? 0,
      fecha: json['fecha'] != null ? DateTime.parse(json['fecha'] as String) : null,
      codencargado: (json['codencargado'] as num?)?.toDouble(),
      encargadoNombre: json['encargado_nombre'] as String?,
    );
  }
}

class OrdenTrabajoDetalle {
  final double numero;
  final DateTime fecha;
  final double codencargado;
  final Empleado? encargado;
  final double? proceso;
  final String? procesoNombre;
  final String estado;
  final String? glosa;
  final List<OTDetalle> detalles;
  final List<MovsSubitem> parteEntrada;
  final List<MovsSubitem> valeConsumo;
  final OTStats stats;

  OrdenTrabajoDetalle({
    required this.numero,
    required this.fecha,
    required this.codencargado,
    this.encargado,
    this.proceso,
    this.procesoNombre,
    required this.estado,
    this.glosa,
    required this.detalles,
    this.parteEntrada = const [],
    this.valeConsumo = const [],
    required this.stats,
  });

  factory OrdenTrabajoDetalle.fromJson(Map<String, dynamic> json) {
    return OrdenTrabajoDetalle(
      numero: (json['numero'] as num?)?.toDouble() ?? 0,
      fecha: DateTime.parse(json['fecha'] as String),
      codencargado: (json['codencargado'] as num?)?.toDouble() ?? 0,
      encargado: json['encargado'] != null
          ? Empleado.fromJson(json['encargado'] as Map<String, dynamic>)
          : null,
      proceso: (json['proceso'] as num?)?.toDouble(),
      procesoNombre: json['proceso_nombre'] as String?,
      estado: json['estado'] as String? ?? 'Abierto',
      glosa: json['glosa'] as String?,
      detalles: (json['detalles'] as List<dynamic>?)
              ?.map((e) => OTDetalle.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      parteEntrada: (json['parte_entrada'] as List<dynamic>?)
              ?.map((e) => MovsSubitem.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      valeConsumo: (json['vale_consumo'] as List<dynamic>?)
              ?.map((e) => MovsSubitem.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      stats: OTStats.fromJson(json['stats'] as Map<String, dynamic>),
    );
  }
}