import 'package:flutter/material.dart';

import '../constants/araya_theme.dart';
import '../models/orden_trabajo.dart';
import '../services/api_service.dart';
import '../services/theme_service.dart';
import 'ot_detail_screen.dart';

class OTListScreen extends StatefulWidget {
  final ApiService apiService;

  const OTListScreen({super.key, required this.apiService});

  @override
  State<OTListScreen> createState() => _OTListScreenState();
}

class _OTListScreenState extends State<OTListScreen> {
  bool _loading = true;
  String? _error;
  List<OrdenTrabajo> _ots = [];
  String _estadoFiltro = 'Abierto';

  static const _estados = ['Abierto', 'Cerrado'];

  static const _estadoLabels = {
    'Abierto': 'Abiertas',
    'Cerrado': 'Cerradas',
  };

  static const _estadoColors = {
    'Abierto': Colors.blue,
    'Cerrado': Colors.green,
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
      final ots = await widget.apiService.fetchOTs(estado: _estadoFiltro);
      if (!mounted) return;
      setState(() {
        _ots = ots;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = 'Error al cargar órdenes de trabajo';
      });
    }
  }

  String _formatFecha(DateTime dt) {
    final dia = dt.day.toString().padLeft(2, '0');
    final mes = dt.month.toString().padLeft(2, '0');
    return '$dia/$mes/${dt.year}';
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
        title: const Text('Órdenes de Trabajo'),
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
                                  : (isDark ? ArayaColors.darkBorder : Colors.transparent),
                              width: 2,
                            ),
                          ),
                        ),
                        child: Text(
                          label,
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
                            color: selected
                                ? cs.primary
                                : (isDark ? ArayaColors.darkMuted : ArayaColors.lightMuted),
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
                              Icon(Icons.error_outline, size: 48,
                                  color: isDark ? ArayaColors.darkMuted : ArayaColors.lightMuted),
                              const SizedBox(height: 8),
                              Text(_error!, style: TextStyle(
                                  color: isDark ? ArayaColors.darkMuted : ArayaColors.lightMuted)),
                              const SizedBox(height: 12),
                              OutlinedButton.icon(
                                onPressed: _fetch,
                                icon: const Icon(Icons.refresh, size: 18),
                                label: const Text('Reintentar'),
                              ),
                            ],
                          ),
                        )
                      : _ots.isEmpty
                          ? Center(
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(Icons.assignment_outlined, size: 48,
                                      color: isDark ? ArayaColors.darkMuted : ArayaColors.lightMuted),
                                  const SizedBox(height: 8),
                                  Text('Sin órdenes de trabajo',
                                      style: TextStyle(color: isDark
                                          ? ArayaColors.darkMuted
                                          : ArayaColors.lightMuted)),
                                ],
                              ),
                            )
                          : RefreshIndicator(
                              onRefresh: _fetch,
                              child: ListView.separated(
                                padding: const EdgeInsets.all(16),
                                itemCount: _ots.length,
                                separatorBuilder: (_, _) => const SizedBox(height: 12),
                                itemBuilder: (context, i) {
                                  final ot = _ots[i];
                                  final color = _estadoColor(ot.estado);
                                  return Card(
                                    child: InkWell(
                                      borderRadius: BorderRadius.circular(16),
                                      onTap: () => Navigator.of(context).push(
                                        MaterialPageRoute(
                                          builder: (_) => OTDetailScreen(
                                            apiService: widget.apiService,
                                            numero: ot.numero,
                                          ),
                                        ),
                                      ),
                                      child: Padding(
                                        padding: const EdgeInsets.all(16),
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Row(
                                              children: [
                                                Container(
                                                  padding: const EdgeInsets.symmetric(
                                                      horizontal: 8, vertical: 3),
                                                  decoration: BoxDecoration(
                                                    color: color.withValues(alpha: isDark ? 0.2 : 0.1),
                                                    borderRadius: BorderRadius.circular(6),
                                                  ),
                                                  child: Text(
                                                    ot.estado,
                                                    style: TextStyle(
                                                      fontSize: 11,
                                                      fontWeight: FontWeight.w600,
                                                      color: color,
                                                    ),
                                                  ),
                                                ),
                                                const Spacer(),
                                                Text(
                                                  'OT ${ot.numero.toInt()}',
                                                  style: TextStyle(
                                                    fontSize: 15,
                                                    fontWeight: FontWeight.bold,
                                                    color: isDark
                                                        ? ArayaColors.darkText
                                                        : ArayaColors.lightText,
                                                  ),
                                                ),
                                              ],
                                            ),
                                            const SizedBox(height: 8),
                                            Row(
                                              children: [
                                                Icon(Icons.calendar_today, size: 14,
                                                    color: isDark
                                                        ? ArayaColors.darkMuted
                                                        : ArayaColors.lightMuted),
                                                const SizedBox(width: 4),
                                                Text(
                                                  _formatFecha(ot.fecha),
                                                  style: TextStyle(
                                                    fontSize: 13,
                                                    color: isDark
                                                        ? ArayaColors.darkMuted
                                                        : ArayaColors.lightMuted,
                                                  ),
                                                ),
                                              ],
                                            ),
                                            if (ot.procesoNombre != null) ...[
                                              const SizedBox(height: 4),
                                              Row(
                                                children: [
                                                  Icon(Icons.build_outlined, size: 14,
                                                      color: isDark
                                                          ? ArayaColors.darkMuted
                                                          : ArayaColors.lightMuted),
                                                  const SizedBox(width: 4),
                                                  Text(
                                                    ot.procesoNombre!,
                                                    style: TextStyle(
                                                      fontSize: 13,
                                                      color: isDark
                                                          ? ArayaColors.darkMuted
                                                          : ArayaColors.lightMuted,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ],
                                            const SizedBox(height: 8),
                                            Row(
                                              children: [
                                                Icon(Icons.list, size: 14,
                                                    color: cs.primary),
                                                const SizedBox(width: 4),
                                                Text(
                                                  '${ot.totalDetalle} detalle${ot.totalDetalle != 1 ? "s" : ""}',
                                                  style: TextStyle(
                                                    fontSize: 13,
                                                    fontWeight: FontWeight.w500,
                                                    color: cs.primary,
                                                  ),
                                                ),
                                                if (ot.pendienteCantidad > 0) ...[
                                                  const SizedBox(width: 12),
                                                  Container(
                                                    padding: const EdgeInsets.symmetric(
                                                        horizontal: 6, vertical: 2),
                                                    decoration: BoxDecoration(
                                                      color: Colors.orange.withValues(alpha: isDark ? 0.3 : 0.15),
                                                      borderRadius: BorderRadius.circular(4),
                                                    ),
                                                    child: Text(
                                                      'Pendiente: ${ot.pendienteCantidad.toInt()}',
                                                      style: TextStyle(
                                                        fontSize: 11,
                                                        fontWeight: FontWeight.w600,
                                                        color: Colors.orange.shade700,
                                                      ),
                                                    ),
                                                  ),
                                                ],
                                              ],
                                            ),
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
}