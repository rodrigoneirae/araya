class RegistroDetalle {
  final int? id;
  final String articuloCodigo;
  final String articuloDescr;
  final String articuloUm;
  final double cantidad;
  final String observacion;

  RegistroDetalle({
    this.id,
    required this.articuloCodigo,
    required this.articuloDescr,
    this.articuloUm = '',
    required this.cantidad,
    this.observacion = '',
  });

  factory RegistroDetalle.fromJson(Map<String, dynamic> json) {
    return RegistroDetalle(
      id: json['id'] as int?,
      articuloCodigo: json['articulo_codigo'] as String? ?? '',
      articuloDescr: json['articulo_descr'] as String? ?? '',
      articuloUm: json['articulo_um'] as String? ?? '',
      cantidad: (json['cantidad'] as num?)?.toDouble() ?? 0,
      observacion: json['observacion'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'articulo_codigo': articuloCodigo,
      'cantidad': cantidad,
      'observacion': observacion,
    };
  }

  @override
  String toString() =>
      'RegistroDetalle($articuloCodigo - $articuloDescr, x$cantidad)';
}

class RegistroArticulo {
  final int id;
  final int? folio;
  final String usuarioUsername;
  final String fechaHora;
  final String documento;
  final String estado;
  final List<RegistroDetalle> detalles;

  RegistroArticulo({
    required this.id,
    this.folio,
    required this.usuarioUsername,
    required this.fechaHora,
    this.documento = '',
    required this.estado,
    required this.detalles,
  });

  factory RegistroArticulo.fromJson(Map<String, dynamic> json) {
    return RegistroArticulo(
      id: json['id'] as int? ?? 0,
      folio: json['folio'] as int?,
      usuarioUsername: json['usuario_username'] as String? ?? '',
      fechaHora: json['fecha_hora'] as String? ?? '',
      documento: json['documento'] as String? ?? '',
      estado: json['estado'] as String? ?? 'INGRESADO',
      detalles: (json['detalles'] as List<dynamic>?)
              ?.map((e) => RegistroDetalle.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }

  @override
  String toString() => 'RegistroArticulo(#$id, $estado, ${detalles.length} items)';
}
