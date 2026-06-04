import 'package:flutter/material.dart';

import '../constants/araya_theme.dart';
import '../models/articulo.dart';
import '../models/registro_articulo.dart';
import '../models/orden_trabajo.dart';
import '../services/api_service.dart';
import '../services/sync_service.dart';
import '../services/theme_service.dart';

class RegistroFormScreen extends StatefulWidget {
  final ApiService apiService;
  final OrdenTrabajo? ordenTrabajo;
  final OrdenTrabajoDetalle? ordenTrabajoDetalle;

  const RegistroFormScreen({
    super.key,
    required this.apiService,
    this.ordenTrabajo,
    this.ordenTrabajoDetalle,
  });

  @override
  State<RegistroFormScreen> createState() => _RegistroFormScreenState();
}

class _RegistroFormScreenState extends State<RegistroFormScreen> {
  final _documentoController = TextEditingController();
  final _searchArticuloController = TextEditingController();
  final _searchArticuloFocus = FocusNode();
  final _searchEncargadoController = TextEditingController();

  bool _loading = false;
  bool _searchingArticulo = false;
  bool _searchingEncargado = false;
  bool _offline = false;
  String? _error;
  List<Articulo> _articulosResults = [];
  List<Empleado> _empleadosResults = [];
  final List<_LineaItem> _items = [];

  TipoRegistro _tipoSeleccionado = TipoRegistro.parteEntrada;
  Empleado? _encargadoSeleccionado;
  double? _otNumero;

  @override
  void initState() {
    super.initState();
    if (widget.ordenTrabajo != null) {
      _otNumero = widget.ordenTrabajo!.numero;
      _documentoController.text = 'OT ${_otNumero!.toInt()}';
    } else if (widget.ordenTrabajoDetalle != null) {
      _otNumero = widget.ordenTrabajoDetalle!.numero;
      _documentoController.text = 'OT ${_otNumero!.toInt()}';
      if (widget.ordenTrabajoDetalle!.encargado != null) {
        _encargadoSeleccionado = widget.ordenTrabajoDetalle!.encargado;
        _searchEncargadoController.text = _encargadoSeleccionado!.nombre;
      }
    }
  }

  @override
  void dispose() {
    for (final i in _items) {
      i.cantidadController.dispose();
      i.observacionController.dispose();
    }
    _documentoController.dispose();
    _searchArticuloController.dispose();
    _searchArticuloFocus.dispose();
    _searchEncargadoController.dispose();
    super.dispose();
  }

  Future<void> _searchArticulos(String query) async {
    if (query.length < 2) {
      setState(() {
        _articulosResults = [];
        _searchingArticulo = false;
      });
      return;
    }

    setState(() {
      _searchingArticulo = true;
      _offline = false;
    });

    try {
      final results = await widget.apiService.searchArticulos(query);
      if (!mounted) return;
      setState(() {
        _articulosResults = results;
        _searchingArticulo = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _searchingArticulo = false;
        _offline = true;
      });
    }
  }

  Future<void> _searchEncargados(String query) async {
    if (query.length < 2) {
      setState(() {
        _empleadosResults = [];
        _searchingEncargado = false;
      });
      return;
    }

    setState(() {
      _searchingEncargado = true;
    });

    try {
      final results = await widget.apiService.searchEmpleados(query);
      if (!mounted) return;
      setState(() {
        _empleadosResults = results;
        _searchingEncargado = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _searchingEncargado = false;
      });
    }
  }

  void _selectEncargado(Empleado emp) {
    setState(() {
      _encargadoSeleccionado = emp;
      _empleadosResults = [];
      _searchEncargadoController.text = emp.nombre;
    });
  }

  void _addArticulo(Articulo a) {
    _searchArticuloController.clear();
    _articulosResults = [];
    _offline = false;
    setState(() {
      _items.add(_LineaItem(articulo: a));
    });
    _searchArticuloFocus.requestFocus();
  }

  void _removeItem(int index) {
    setState(() {
      _items[index].cantidadController.dispose();
      _items[index].observacionController.dispose();
      _items.removeAt(index);
    });
  }

  Future<void> _submit() async {
    for (var i = 0; i < _items.length; i++) {
      final cant = double.tryParse(_items[i].cantidadController.text);
      if (cant == null || cant <= 0) {
        setState(() => _error = 'Cantidad requerida en el item ${i + 1}');
        return;
      }
    }

    if (_items.isEmpty) {
      setState(() => _error = 'Debe agregar al menos un artículo');
      return;
    }

    if (_encargadoSeleccionado == null) {
      setState(() => _error = 'Debe seleccionar un encargado');
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });

    final detalles = <RegistroDetalle>[];
    for (final item in _items) {
      final cant = double.parse(item.cantidadController.text);
      detalles.add(RegistroDetalle(
        articuloCodigo: item.articulo.codigo,
        articuloDescr: item.articulo.descr,
        cantidad: cant,
        observacion: item.observacionController.text.trim(),
      ));
    }

    final syncService = SyncService();
    try {
      print('Starting save...');
      final saved = await syncService.saveRegistroOfflineFromApi(
        documento: _documentoController.text.trim(),
        detalles: detalles,
        tipoRegistro: _tipoSeleccionado.codigo,
        otNumero: _otNumero,
        codencargado: _encargadoSeleccionado!.cod.toDouble(),
        apiService: widget.apiService,
      );

      print('Save completed: $saved');

      if (!mounted) return;

      setState(() => _loading = false);

      final message = 'Registro ${saved.folio != null ? 'N° ${saved.folio}' : 'local'} creado exitosamente';

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(message)),
      );
      Navigator.of(context).pop(true);
    } catch (e, stack) {
      print('Error saving: $e');
      print('Stack: $stack');
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = 'Error al guardar: ${e.toString()}';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final isDark = ThemeService.instance.isDark;

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.ordenTrabajo != null ? 'Registro desde OT' : 'Nuevo Registro'),
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Tipo de Registro', style: theme.textTheme.titleSmall),
                            const SizedBox(height: 8),
                            Row(
                              children: TipoRegistro.values.map((tipo) {
                                final selected = _tipoSeleccionado == tipo;
                                return Expanded(
                                  child: Padding(
                                    padding: const EdgeInsets.only(right: 8),
                                    child: ChoiceChip(
                                      label: Text(tipo.label),
                                      selected: selected,
                                      onSelected: (val) {
                                        setState(() => _tipoSeleccionado = tipo);
                                      },
                                      selectedColor: cs.primary.withValues(alpha: 0.2),
                                    ),
                                  ),
                                );
                              }).toList(),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _documentoController,
                      decoration: const InputDecoration(
                        labelText: 'Documento',
                        hintText: 'N° de documento',
                        prefixIcon: Icon(Icons.description_outlined),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Encargado *',
                          style: TextStyle(
                            fontSize: 12,
                            color: isDark ? ArayaColors.darkMuted : ArayaColors.lightMuted,
                          ),
                        ),
                        const SizedBox(height: 4),
                        TextField(
                          controller: _searchEncargadoController,
                          decoration: InputDecoration(
                            hintText: 'Buscar encargado...',
                            prefixIcon: const Icon(Icons.person_search),
                            suffixIcon: _searchingEncargado
                                ? const Padding(
                                    padding: EdgeInsets.all(12),
                                    child: SizedBox(
                                      width: 20,
                                      height: 20,
                                      child: CircularProgressIndicator(strokeWidth: 2),
                                    ),
                                  )
                                : null,
                          ),
                          onChanged: _searchEncargados,
                        ),
                        if (_empleadosResults.isNotEmpty)
                          Card(
                            margin: const EdgeInsets.only(top: 4),
                            child: ListView.separated(
                              shrinkWrap: true,
                              physics: const NeverScrollableScrollPhysics(),
                              itemCount: _empleadosResults.length,
                              separatorBuilder: (_, __) => Divider(
                                  height: 1, color: isDark ? ArayaColors.darkBorder : ArayaColors.lightBorder),
                              itemBuilder: (context, i) {
                                final emp = _empleadosResults[i];
                                return ListTile(
                                  dense: true,
                                  title: Text(emp.nombre, style: const TextStyle(fontSize: 14)),
                                  subtitle: Text('Cod: ${emp.cod}', style: TextStyle(fontSize: 12, color: isDark ? ArayaColors.darkMuted : ArayaColors.lightMuted)),
                                  trailing: const Icon(Icons.add_circle_outline),
                                  onTap: () => _selectEncargado(emp),
                                );
                              },
                            ),
                          ),
                        if (_encargadoSeleccionado != null && _empleadosResults.isEmpty)
                          Padding(
                            padding: const EdgeInsets.only(top: 4),
                            child: Row(
                              children: [
                                Icon(Icons.check_circle, size: 14, color: Colors.green),
                                const SizedBox(width: 4),
                                Text(
                                  'Seleccionado: ${_encargadoSeleccionado!.nombre}',
                                  style: TextStyle(fontSize: 12, color: Colors.green),
                                ),
                              ],
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Agregar Artículos',
                      style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _searchArticuloController,
                      focusNode: _searchArticuloFocus,
                      decoration: InputDecoration(
                        labelText: 'Buscar artículo',
                        prefixIcon: const Icon(Icons.search),
                        suffixIcon: _searchingArticulo
                            ? const Padding(
                                padding: EdgeInsets.all(12),
                                child: SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(strokeWidth: 2),
                                ),
                              )
                            : null,
                      ),
                      onChanged: _searchArticulos,
                    ),
                    if (_offline)
                      Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Row(
                          children: [
                            Icon(Icons.cloud_off, size: 14, color: isDark ? ArayaColors.darkAccent : ArayaColors.lightAccent),
                            const SizedBox(width: 4),
                            Text('Resultados locales (sin conexión)', style: TextStyle(fontSize: 11, color: isDark ? ArayaColors.darkAccent : ArayaColors.lightAccent)),
                          ],
                        ),
                      ),
                    if (_articulosResults.isNotEmpty)
                      Card(
                        margin: const EdgeInsets.only(top: 4),
                        child: ListView.separated(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: _articulosResults.length,
                          separatorBuilder: (_, __) => Divider(height: 1, color: isDark ? ArayaColors.darkBorder : ArayaColors.lightBorder),
                          itemBuilder: (context, i) {
                            final a = _articulosResults[i];
                            return ListTile(
                              dense: true,
                              title: Text(a.descr, style: const TextStyle(fontSize: 14)),
                              subtitle: Text('${a.codigo} · ${a.um}', style: TextStyle(fontSize: 12, color: isDark ? ArayaColors.darkMuted : ArayaColors.lightMuted)),
                              trailing: IconButton(
                                icon: const Icon(Icons.add_circle_outline),
                                color: cs.primary,
                                onPressed: () => _addArticulo(a),
                              ),
                            );
                          },
                        ),
                      ),
                    const SizedBox(height: 16),
                    if (_items.isNotEmpty)
                      Card(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Padding(
                              padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
                              child: Text(
                                'Artículos seleccionados (${_items.length})',
                                style: theme.textTheme.titleSmall?.copyWith(
                                  color: isDark ? ArayaColors.darkMuted : ArayaColors.lightMuted,
                                ),
                              ),
                            ),
                            const Divider(height: 1),
                            ..._items.asMap().entries.map((entry) {
                              final idx = entry.key;
                              final item = entry.value;
                              return Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Expanded(
                                          child: Text(
                                            '${idx + 1}. ${item.articulo.descr}',
                                            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
                                          ),
                                        ),
                                        IconButton(
                                          icon: const Icon(Icons.remove_circle_outline),
                                          iconSize: 20,
                                          color: Colors.red,
                                          onPressed: () => _removeItem(idx),
                                          padding: EdgeInsets.zero,
                                          constraints: const BoxConstraints(),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      '${item.articulo.codigo} · ${item.articulo.um}',
                                      style: TextStyle(fontSize: 12, color: isDark ? ArayaColors.darkMuted : ArayaColors.lightMuted),
                                    ),
                                    const SizedBox(height: 8),
                                    Row(
                                      children: [
                                        Expanded(
                                          flex: 2,
                                          child: TextField(
                                            controller: item.cantidadController,
                                            keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                            decoration: const InputDecoration(
                                              labelText: 'Cantidad *',
                                              isDense: true,
                                              contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                            ),
                                          ),
                                        ),
                                        const SizedBox(width: 12),
                                        Expanded(
                                          flex: 3,
                                          child: TextField(
                                            controller: item.observacionController,
                                            decoration: const InputDecoration(
                                              labelText: 'Observación',
                                              isDense: true,
                                              contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              );
                            }),
                          ],
                        ),
                      ),
                    if (_items.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 8),
                        child: Text(
                          'Busque más artículos arriba o presione Guardar',
                          textAlign: TextAlign.center,
                          style: TextStyle(fontSize: 12, color: isDark ? ArayaColors.darkMuted : ArayaColors.lightMuted),
                        ),
                      ),
                    if (_error != null) ...[
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: isDark ? Colors.red.shade900 : Colors.red.shade50,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.error_outline, size: 18, color: isDark ? Colors.red.shade300 : Colors.red.shade700),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(_error!, style: TextStyle(color: isDark ? Colors.red.shade300 : Colors.red.shade700, fontSize: 13)),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: SizedBox(
                width: double.infinity,
                height: 48,
                child: FilledButton.icon(
                  onPressed: (_loading || _items.isEmpty || _encargadoSeleccionado == null) ? null : _submit,
                  icon: _loading
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : const Icon(Icons.save),
                  label: Text(
                    _items.isEmpty
                        ? 'Agregue al menos un artículo'
                        : (_encargadoSeleccionado == null ? 'Seleccione un encargado' : (_loading ? 'Guardando...' : 'Guardar Registro')),
                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _LineaItem {
  final Articulo articulo;
  final TextEditingController cantidadController;
  final TextEditingController observacionController;

  _LineaItem({required this.articulo})
      : cantidadController = TextEditingController(),
        observacionController = TextEditingController();
}