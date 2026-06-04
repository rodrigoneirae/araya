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

enum TipoRegistro {
  parteEntrada('PE', 'Parte de Entrada'),
  valeConsumo('VC', 'Vale de Consumo');

  final String codigo;
  final String label;
  const TipoRegistro(this.codigo, this.label);
}

class RegistroArticulo {
  final int id;
  final int? folio;
  final String usuarioUsername;
  final String fechaHora;
  final String documento;
  final String estado;
  final String? tipoRegistro;
  final double? otNumero;
  final double? codencargado;
  final List<RegistroDetalle> detalles;

  RegistroArticulo({
    required this.id,
    this.folio,
    required this.usuarioUsername,
    required this.fechaHora,
    this.documento = '',
    required this.estado,
    this.tipoRegistro,
    this.otNumero,
    this.codencargado,
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
      tipoRegistro: json['tipo_registro'] as String?,
      otNumero: (json['ot_numero'] as num?)?.toDouble(),
      codencargado: (json['codencargado'] as num?)?.toDouble(),
      detalles: (json['detalles'] as List<dynamic>?)
              ?.map((e) => RegistroDetalle.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }

  String get tipoRegistroLabel {
    if (tipoRegistro == 'PE') return 'Parte de Entrada';
    if (tipoRegistro == 'VC') return 'Vale de Consumo';
    return tipoRegistro ?? '';
  }

  @override
  String toString() => 'RegistroArticulo(#$id, $estado, ${detalles.length} items)';
}

class Empleado {
  final int cod;
  final String nombre;

  Empleado({required this.cod, required this.nombre});

  factory Empleado.fromJson(Map<String, dynamic> json) {
    return Empleado(
      cod: json['cod'] as int,
      nombre: json['nombre'] as String? ?? '',
    );
  }

  @override
  String toString() => 'Empleado($cod - $nombre)';
}