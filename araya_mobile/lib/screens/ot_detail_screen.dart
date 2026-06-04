import 'package:flutter/material.dart';

import '../constants/araya_theme.dart';
import '../models/orden_trabajo.dart';
import '../services/api_service.dart';
import '../services/theme_service.dart';
import 'registro_form_screen.dart';

class OTDetailScreen extends StatefulWidget {
  final ApiService apiService;
  final double numero;

  const OTDetailScreen({
    super.key,
    required this.apiService,
    required this.numero,
  });

  @override
  State<OTDetailScreen> createState() => _OTDetailScreenState();
}

class _OTDetailScreenState extends State<OTDetailScreen> {
  bool _loading = true;
  String? _error;
  OrdenTrabajoDetalle? _ot;

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
      final ot = await widget.apiService.fetchOTDetalle(widget.numero);
      if (!mounted) return;
      setState(() {
        _ot = ot;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = 'Error al cargar orden de trabajo';
      });
    }
  }

  String _formatFecha(DateTime dt) {
    final dia = dt.day.toString().padLeft(2, '0');
    final mes = dt.month.toString().padLeft(2, '0');
    final hora = dt.hour.toString().padLeft(2, '0');
    final min = dt.minute.toString().padLeft(2, '0');
    return '$dia/$mes/${dt.year} $hora:$min';
  }

  Color _estadoColor(String estado) {
    return estado == 'Abierto' ? Colors.blue : Colors.green;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final isDark = ThemeService.instance.isDark;

    return Scaffold(
      appBar: AppBar(
        title: Text('OT ${widget.numero.toInt()}'),
      ),
      body: SafeArea(
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
                : _ot == null
                    ? Center(
                        child: Text('Orden no encontrada',
                            style: TextStyle(color: isDark
                                ? ArayaColors.darkMuted
                                : ArayaColors.lightMuted)))
                    : _buildContent(theme, cs, isDark),
      ),
    );
  }

  Widget _buildContent(ThemeData theme, ColorScheme cs, bool isDark) {
    final ot = _ot!;
    final estadoColor = _estadoColor(ot.estado);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: estadoColor.withValues(alpha: isDark ? 0.2 : 0.1),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          ot.estado,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: estadoColor,
                          ),
                        ),
                      ),
                      const Spacer(),
                      Text(
                        'OT ${ot.numero.toInt()}',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: isDark ? ArayaColors.darkText : ArayaColors.lightText,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  const Divider(),
                  const SizedBox(height: 8),
                  _infoRow(Icons.calendar_today, 'Fecha', _formatFecha(ot.fecha), isDark),
                  if (ot.encargado != null) ...[
                    const SizedBox(height: 8),
                    _infoRow(Icons.person, 'Encargado', ot.encargado!.nombre, isDark),
                  ],
                  if (ot.procesoNombre != null) ...[
                    const SizedBox(height: 8),
                    _infoRow(Icons.build_outlined, 'Proceso', ot.procesoNombre!, isDark),
                  ],
                  if (ot.glosa != null && ot.glosa!.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    _infoRow(Icons.note, 'Glosa', ot.glosa!, isDark),
                  ],
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.list_alt, color: cs.primary, size: 20),
                      const SizedBox(width: 8),
                      Text(
                        'Detalles (${ot.detalles.length})',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: isDark ? ArayaColors.darkText : ArayaColors.lightText,
                        ),
                      ),
                      const Spacer(),
                      Text(
                        'Total: ${ot.stats.totalCantidad.toStringAsFixed(2)}',
                        style: TextStyle(
                          fontSize: 13,
                          color: isDark ? ArayaColors.darkMuted : ArayaColors.lightMuted,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  const Divider(),
                  ...ot.detalles.map((d) => _detalleItem(d, isDark)),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          if (ot.estado == 'Abierto')
            OutlinedButton.icon(
              onPressed: () {
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => RegistroFormScreen(
                      apiService: widget.apiService,
                      ordenTrabajoDetalle: ot,
                    ),
                  ),
                );
              },
              icon: const Icon(Icons.add),
              label: const Text('Crear Registro'),
            ),
          if (ot.estado == 'Abierto') const SizedBox(height: 8),
          FilledButton.icon(
            onPressed: () => Navigator.of(context).pop(),
            icon: const Icon(Icons.check),
            label: const Text('Cerrar'),
          ),
        ],
      ),
    );
  }

  Widget _infoRow(IconData icon, String label, String value, bool isDark) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 16, color: isDark ? ArayaColors.darkMuted : ArayaColors.lightMuted),
        const SizedBox(width: 8),
        SizedBox(
          width: 70,
          child: Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: isDark ? ArayaColors.darkMuted : ArayaColors.lightMuted,
            ),
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
              color: isDark ? ArayaColors.darkText : ArayaColors.lightText,
            ),
          ),
        ),
      ],
    );
  }

  Widget _detalleItem(OTDetalle d, bool isDark) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  d.descr,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: isDark ? ArayaColors.darkText : ArayaColors.lightText,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  '${d.codigo} · P.Unit: \$${d.punit.toStringAsFixed(2)}',
                  style: TextStyle(
                    fontSize: 12,
                    color: isDark ? ArayaColors.darkMuted : ArayaColors.lightMuted,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                d.cantidad.toStringAsFixed(d.cantidad == d.cantidad.roundToDouble() ? 0 : 2),
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: isDark ? ArayaColors.darkText : ArayaColors.lightText,
                ),
              ),
              Text(
                '\$${d.neto.toStringAsFixed(0)}',
                style: TextStyle(
                  fontSize: 12,
                  color: isDark ? ArayaColors.darkMuted : ArayaColors.lightMuted,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}