import 'dart:async';

import 'package:flutter/material.dart';

import '../constants/araya_theme.dart';
import '../models/orden_trabajo.dart';
import '../models/registro_articulo.dart';
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

class _OTDetailScreenState extends State<OTDetailScreen> with WidgetsBindingObserver {
  bool _loading = true;
  String? _error;
  OrdenTrabajoDetalle? _ot;
  List<RegistroArticulo> _registros = [];
  Timer? _refreshTimer;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _fetch();
    _refreshTimer = Timer.periodic(const Duration(seconds: 15), (_) => _fetch(silent: true));
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _fetch(silent: true);
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _refreshTimer?.cancel();
    super.dispose();
  }

  Future<void> _fetch({bool silent = false}) async {
    if (!silent) {
      setState(() {
        _loading = true;
        _error = null;
      });
    }

    try {
      final results = await Future.wait([
        widget.apiService.fetchOTDetalle(widget.numero),
        widget.apiService.fetchRegistrosByOT(widget.numero),
      ]);
      if (!mounted) return;
      setState(() {
        _ot = results[0] as OrdenTrabajoDetalle?;
        _registros = results[1] as List<RegistroArticulo>;
        _loading = false;
        if (!silent) _error = null;
      });
    } catch (e) {
      if (!mounted) return;
      if (!silent) {
        setState(() {
          _loading = false;
          _error = 'Error al cargar orden de trabajo';
        });
      }
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
      bottomNavigationBar: _ot == null ? null : _buildActionBar(isDark),
    );
  }

  Widget _buildActionBar(bool isDark) {
    final ot = _ot!;
    return SafeArea(
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isDark ? ArayaColors.darkSurface : ArayaColors.lightSurface,
          border: Border(
            top: BorderSide(
              color: isDark ? ArayaColors.darkBorder : ArayaColors.lightBorder,
            ),
          ),
        ),
        child: ot.estado == 'Abierto'
            ? Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => Navigator.of(context).pop(),
                      icon: const Icon(Icons.arrow_back),
                      label: const Text('Volver'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: FilledButton.icon(
                      onPressed: _openRegistroForm,
                      icon: const Icon(Icons.add),
                      label: const Text('Crear Registro'),
                    ),
                  ),
                ],
              )
            : OutlinedButton.icon(
                onPressed: () => Navigator.of(context).pop(),
                icon: const Icon(Icons.arrow_back),
                label: const Text('Volver'),
              ),
      ),
    );
  }

  Future<void> _openRegistroForm() async {
    final ot = _ot;
    if (ot == null) return;
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => RegistroFormScreen(
          apiService: widget.apiService,
          ordenTrabajoDetalle: ot,
        ),
      ),
    );
    _fetch();
  }

  Widget _buildContent(ThemeData theme, ColorScheme cs, bool isDark) {
    final ot = _ot!;
    final estadoColor = _estadoColor(ot.estado);

    return RefreshIndicator(
      onRefresh: _fetch,
      child: SingleChildScrollView(
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
                    if (ot.clienteNombre != null && ot.clienteNombre!.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      _infoRow(Icons.business, 'Cliente', ot.clienteNombre!, isDark),
                    ],
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
                      _infoRow(Icons.note, 'Referencia', ot.glosa!, isDark),
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
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              'Total: ${ot.stats.totalCantidad.toStringAsFixed(2)}',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: isDark ? ArayaColors.darkText : ArayaColors.lightText,
                              ),
                            ),
                            if (ot.stats.totalPendiente > 0)
                              Text(
                                'Pendiente: ${ot.stats.totalPendiente.toStringAsFixed(ot.stats.totalPendiente == ot.stats.totalPendiente.roundToDouble() ? 0 : 2)}',
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.orange,
                                ),
                              ),
                          ],
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
            if (ot.parteEntrada.isNotEmpty) ...[
              const SizedBox(height: 16),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(Icons.assignment_return, color: cs.primary, size: 20),
                          const SizedBox(width: 8),
                          Text(
                            'Parte de Entrada (${ot.parteEntrada.length})',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                              color: isDark ? ArayaColors.darkText : ArayaColors.lightText,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      const Divider(),
                      ...ot.parteEntrada.map((s) => _subitemItem(s, isDark, cs)),
                    ],
                  ),
                ),
              ),
            ],
            if (ot.valeConsumo.isNotEmpty) ...[
              const SizedBox(height: 16),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(Icons.outbox, color: cs.primary, size: 20),
                          const SizedBox(width: 8),
                          Text(
                            'Vale de Consumo (${ot.valeConsumo.length})',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                              color: isDark ? ArayaColors.darkText : ArayaColors.lightText,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      const Divider(),
                      ...ot.valeConsumo.map((s) => _subitemItem(s, isDark, cs)),
                    ],
                  ),
                ),
              ),
            ],
            if (_registros.isNotEmpty) ...[
              const SizedBox(height: 16),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(Icons.history, color: cs.primary, size: 20),
                          const SizedBox(width: 8),
                          Text(
                            'Historial de Registro (${_registros.length})',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                              color: isDark ? ArayaColors.darkText : ArayaColors.lightText,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      const Divider(),
                      ..._registros.map((r) => _registroItem(r, isDark, cs)),
                    ],
                  ),
                ),
              ),
            ],
            const SizedBox(height: 16),
          ],
        ),
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


  Widget _subitemItem(MovsSubitem s, bool isDark, ColorScheme cs) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      s.descr,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: isDark ? ArayaColors.darkText : ArayaColors.lightText,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        Text(
                          s.codigo,
                          style: TextStyle(
                            fontSize: 12,
                            color: isDark ? ArayaColors.darkMuted : ArayaColors.lightMuted,
                          ),
                        ),
                        if (s.encargadoNombre != null && s.encargadoNombre!.isNotEmpty) ...[
                          const SizedBox(width: 8),
                          Icon(Icons.person, size: 12,
                              color: isDark ? ArayaColors.darkMuted : ArayaColors.lightMuted),
                          const SizedBox(width: 3),
                          Text(
                            s.encargadoNombre!,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                              color: cs.primary,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
              Text(
                s.cantidad.toStringAsFixed(s.cantidad == s.cantidad.roundToDouble() ? 0 : 2),
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: isDark ? ArayaColors.darkText : ArayaColors.lightText,
                ),
              ),
            ],
          ),
          if (s.fecha != null) ...[
            const SizedBox(height: 4),
            Row(
              children: [
                Icon(Icons.calendar_today, size: 11,
                    color: isDark ? ArayaColors.darkMuted : ArayaColors.lightMuted),
                const SizedBox(width: 4),
                Text(
                  _formatFecha(s.fecha!),
                  style: TextStyle(
                    fontSize: 11,
                    color: isDark ? ArayaColors.darkMuted : ArayaColors.lightMuted,
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _registroItem(RegistroArticulo r, bool isDark, ColorScheme cs) {
    final tipoColor = r.tipoRegistro == 'PE' ? Colors.blue : Colors.orange;
    final tipoLabel = r.tipoRegistro == 'PE' ? 'PE' : 'VC';
    DateTime? fecha;
    try {
      fecha = DateTime.parse(r.fechaHora);
    } catch (_) {}

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: tipoColor.withValues(alpha: isDark ? 0.2 : 0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  tipoLabel,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: tipoColor,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  r.documento.isNotEmpty ? r.documento : 'Registro #${r.id}',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: isDark ? ArayaColors.darkText : ArayaColors.lightText,
                  ),
                ),
              ),
            ],
          ),
          if (fecha != null) ...[
            const SizedBox(height: 4),
            Row(
              children: [
                Icon(Icons.calendar_today, size: 12,
                    color: isDark ? ArayaColors.darkMuted : ArayaColors.lightMuted),
                const SizedBox(width: 4),
                Text(
                  _formatFecha(fecha),
                  style: TextStyle(
                    fontSize: 11,
                    color: isDark ? ArayaColors.darkMuted : ArayaColors.lightMuted,
                  ),
                ),
              ],
            ),
          ],
          if (r.encargadoNombre != null && r.encargadoNombre!.isNotEmpty) ...[
            const SizedBox(height: 4),
            Row(
              children: [
                Icon(Icons.person, size: 12,
                    color: isDark ? ArayaColors.darkMuted : ArayaColors.lightMuted),
                const SizedBox(width: 4),
                Text(
                  r.encargadoNombre!,
                  style: TextStyle(
                    fontSize: 12,
                    color: isDark ? ArayaColors.darkMuted : ArayaColors.lightMuted,
                  ),
                ),
              ],
            ),
          ],
          const SizedBox(height: 8),
          ...r.detalles.map((d) => Padding(
            padding: const EdgeInsets.only(bottom: 6),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        d.articuloDescr,
                        style: TextStyle(
                          fontSize: 13,
                          color: isDark ? ArayaColors.darkText : ArayaColors.lightText,
                        ),
                      ),
                      Text(
                        d.articuloCodigo,
                        style: TextStyle(
                          fontSize: 11,
                          color: isDark ? ArayaColors.darkMuted : ArayaColors.lightMuted,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  d.cantidad.toStringAsFixed(d.cantidad == d.cantidad.roundToDouble() ? 0 : 2),
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: isDark ? ArayaColors.darkText : ArayaColors.lightText,
                  ),
                ),
              ],
            ),
          )),
        ],
      ),
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
                if (d.docref == null) ...[
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(
                        d.pendiente > 0 ? Icons.schedule : Icons.check_circle_outline,
                        size: 13,
                        color: d.pendiente > 0 ? Colors.orange : Colors.green,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        d.pendiente > 0
                            ? 'Pendiente: ${d.pendiente.toStringAsFixed(d.pendiente == d.pendiente.roundToDouble() ? 0 : 2)}'
                            : 'Completo',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: d.pendiente > 0 ? Colors.orange : Colors.green,
                        ),
                      ),
                    ],
                  ),
                ],
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