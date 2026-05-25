import 'package:flutter/material.dart';

import '../constants/araya_theme.dart';
import '../models/registro_articulo.dart';
import '../services/api_service.dart';
import '../services/theme_service.dart';

class RegistrosListScreen extends StatefulWidget {
  final ApiService apiService;

  const RegistrosListScreen({super.key, required this.apiService});

  @override
  State<RegistrosListScreen> createState() => _RegistrosListScreenState();
}

class _RegistrosListScreenState extends State<RegistrosListScreen> {
  bool _loading = true;
  String? _error;
  List<RegistroArticulo> _registros = [];
  String _estadoFiltro = '';

  static const _estados = [
    '',
    'INGRESADO',
    'PENDIENTE',
    'CERRADO',
  ];

  static const _estadoLabels = {
    '': 'Todos',
    'INGRESADO': 'Ingresado',
    'PENDIENTE': 'Pendiente',
    'CERRADO': 'Cerrado',
  };

  static const _estadoColors = {
    'INGRESADO': Colors.blue,
    'PENDIENTE': Colors.orange,
    'CERRADO': Colors.green,
  };

  @override
  void initState() {
    super.initState();
    _fetch();
  }

  Future<void> _fetch() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final registros =
          await widget.apiService.fetchRegistros(estado: _estadoFiltro);
      if (!mounted) return;
      setState(() {
        _registros = registros;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = 'Error al cargar registros';
      });
    }
  }

  String _formatFecha(String iso) {
    try {
      final dt = DateTime.parse(iso);
      final dia = dt.day.toString().padLeft(2, '0');
      final mes = dt.month.toString().padLeft(2, '0');
      final hora = dt.hour.toString().padLeft(2, '0');
      final min = dt.minute.toString().padLeft(2, '0');
      return '$dia/$mes/${dt.year} $hora:$min';
    } catch (_) {
      return iso;
    }
  }

  Color _estadoColor(String estado) {
    return _estadoColors[estado] ?? ArayaColors.lightMuted;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final isDark = ThemeService.instance.isDark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Mis Registros'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _fetch,
            tooltip: 'Refrescar',
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            Container(
              color: isDark ? ArayaColors.darkSurface : ArayaColors.lightSurface,
              child: Row(
                children: _estados.map((e) {
                  final selected = _estadoFiltro == e;
                  final label = _estadoLabels[e] ?? e;
                  return Expanded(
                    child: GestureDetector(
                      onTap: () {
                        setState(() => _estadoFiltro = e);
                        _fetch();
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        decoration: BoxDecoration(
                          border: Border(
                            bottom: BorderSide(
                              color: selected
                                  ? cs.primary
                                  : (isDark
                                      ? ArayaColors.darkBorder
                                      : Colors.transparent),
                              width: 2,
                            ),
                          ),
                        ),
                        child: Text(
                          label,
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight:
                                selected ? FontWeight.w600 : FontWeight.normal,
                            color: selected
                                ? cs.primary
                                : (isDark
                                    ? ArayaColors.darkMuted
                                    : ArayaColors.lightMuted),
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
            Expanded(
              child: _loading
                  ? Center(child: CircularProgressIndicator(color: cs.primary))
                  : _error != null
                      ? Center(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.error_outline,
                                  size: 48,
                                  color: isDark
                                      ? ArayaColors.darkMuted
                                      : ArayaColors.lightMuted),
                              const SizedBox(height: 8),
                              Text(
                                _error!,
                                style: TextStyle(
                                  color: isDark
                                      ? ArayaColors.darkMuted
                                      : ArayaColors.lightMuted,
                                ),
                              ),
                              const SizedBox(height: 12),
                              OutlinedButton.icon(
                                onPressed: _fetch,
                                icon: const Icon(Icons.refresh, size: 18),
                                label: const Text('Reintentar'),
                              ),
                            ],
                          ),
                        )
                      : _registros.isEmpty
                          ? Center(
                              child: Text(
                                'Sin registros',
                                style: TextStyle(
                                  color: isDark
                                      ? ArayaColors.darkMuted
                                      : ArayaColors.lightMuted,
                                ),
                              ),
                            )
                          : RefreshIndicator(
                              onRefresh: _fetch,
                              child: ListView.separated(
                                padding: const EdgeInsets.all(16),
                                itemCount: _registros.length,
                                separatorBuilder: (_, _) =>
    const SizedBox(height: 12),
                                itemBuilder: (context, i) {
                                  final r = _registros[i];
                                  final color = _estadoColor(r.estado);
                                  final totalItems = r.detalles.length;
                                  return Card(
                                    child: InkWell(
                                      borderRadius: BorderRadius.circular(16),
                                      onTap: () => _showDetalle(r),
                                      child: Padding(
                                        padding: const EdgeInsets.all(16),
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Row(
                                              children: [
                                                Container(
                                                  padding:
                                                      const EdgeInsets.symmetric(
                                                    horizontal: 8,
                                                    vertical: 3,
                                                  ),
                                                  decoration: BoxDecoration(
                                                    color: color.withValues(
                                                        alpha: isDark ? 0.2 : 0.1),
                                                    borderRadius:
                                                        BorderRadius.circular(
                                                            6),
                                                  ),
                                                  child: Text(
                                                    r.estado,
                                                    style: TextStyle(
                                                      fontSize: 11,
                                                      fontWeight:
                                                          FontWeight.w600,
                                                      color: color,
                                                    ),
                                                  ),
                                                ),
                                                const Spacer(),
                                                Text(
                                                  _formatFecha(r.fechaHora),
                                                  style: TextStyle(
                                                    fontSize: 12,
                                                    color: isDark
                                                        ? ArayaColors.darkMuted
                                                        : ArayaColors
                                                            .lightMuted,
                                                  ),
                                                ),
                                              ],
                                            ),
                                            const SizedBox(height: 8),
                                            Text(
                                              '$totalItems artículo${totalItems != 1 ? "s" : ""}',
                                              style: const TextStyle(
                                                fontSize: 14,
                                                fontWeight: FontWeight.w500,
                                              ),
                                            ),
                                            if (r.documento.isNotEmpty) ...[
                                              const SizedBox(height: 4),
                                              Text(
                                                'Doc: ${r.documento}',
                                                style: TextStyle(
                                                  fontSize: 12,
                                                  color: isDark
                                                      ? ArayaColors.darkMuted
                                                      : ArayaColors.lightMuted,
                                                ),
                                              ),
                                            ],
                                          ],
                                        ),
                                      ),
                                    ),
                                  );
                                },
                              ),
                            ),
            ),
          ],
        ),
      ),
    );
  }

  void _showDetalle(RegistroArticulo r) {
    final isDark = ThemeService.instance.isDark;
    final color = _estadoColor(r.estado);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return DraggableScrollableSheet(
          initialChildSize: 0.7,
          minChildSize: 0.4,
          maxChildSize: 0.9,
          expand: false,
          builder: (ctx, scrollCtrl) {
            return Padding(
              padding: const EdgeInsets.all(20),
              child: ListView(
                controller: scrollCtrl,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: isDark
                            ? ArayaColors.darkBorder
                            : ArayaColors.lightBorder,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color:
                              color.withValues(alpha: isDark ? 0.2 : 0.1),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          r.estado,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: color,
                          ),
                        ),
                      ),
                      const Spacer(),
                      Text(
                        _formatFecha(r.fechaHora),
                        style: TextStyle(
                          fontSize: 12,
                          color: isDark
                              ? ArayaColors.darkMuted
                              : ArayaColors.lightMuted,
                        ),
                      ),
                    ],
                  ),
                  if (r.documento.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Text(
                      'Documento: ${r.documento}',
                      style: TextStyle(
                        fontSize: 13,
                        color: isDark
                            ? ArayaColors.darkMuted
                            : ArayaColors.lightMuted,
                      ),
                    ),
                  ],
                  const SizedBox(height: 16),
                  const Divider(),
                  const SizedBox(height: 8),
                  Text(
                    'Artículos (${r.detalles.length})',
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 8),
                  ...r.detalles.map((d) {
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  d.articuloDescr,
                                  style: const TextStyle(fontSize: 14),
                                ),
                                Text(
                                  '$d.articuloCodigo · $d.articuloUm',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: isDark
                                        ? ArayaColors.darkMuted
                                        : ArayaColors.lightMuted,
                                  ),
                                ),
                                if (d.observacion.isNotEmpty)
                                  Text(
                                    d.observacion,
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontStyle: FontStyle.italic,
                                      color: isDark
                                          ? ArayaColors.darkMuted
                                          : ArayaColors.lightMuted,
                                    ),
                                  ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            d.cantidad.toStringAsFixed(
                                d.cantidad == d.cantidad.roundToDouble()
                                    ? 0
                                    : 2),
                            style: const TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    );
                  }),
                ],
              ),
            );
          },
        );
      },
    );
  }
}
