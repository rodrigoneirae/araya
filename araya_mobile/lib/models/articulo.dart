class Articulo {
  final String codigo;
  final String descr;
  final String um;

  Articulo({
    required this.codigo,
    required this.descr,
    required this.um,
  });

  factory Articulo.fromJson(Map<String, dynamic> json) {
    return Articulo(
      codigo: json['codigo'] as String? ?? '',
      descr: json['descr'] as String? ?? '',
      um: json['um'] as String? ?? '',
    );
  }
}
