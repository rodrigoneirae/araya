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
  bool _otArticulosExpandido = true;
  String? _error;
  List<Articulo> _articulosResults = [];
  List<Empleado> _empleadosResults = [];
  final List<_LineaItem> _items = [];
  final Set<String> _articulosAnadidos = <String>{};

  TipoRegistro _tipoSeleccionado = TipoRegistro.parteEntrada;
  TipoRegistro? _tipoAutoDetectado;
  String? _tipoRazon;
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
      final deteccion = _detectarTipoRegistro(widget.ordenTrabajoDetalle!);
      _tipoSeleccionado = deteccion.tipo;
      _tipoAutoDetectado = deteccion.tipo;
      _tipoRazon = deteccion.razon;
    }
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      _precargarArticulosDeOT();
    });
  }

  _TipoDeteccion _detectarTipoRegistro(OrdenTrabajoDetalle ot) {
    final pePool = ot.detalles.where((d) => d.codigo.isNotEmpty && d.docref != null);
    final vcPool = ot.detalles.where((d) => d.codigo.isNotEmpty && d.docref == null);

    final pePendientes = pePool.where((d) => d.cantidad > 0).length;
    final vcPendientes = vcPool.where((d) => d.pendiente > 0).length;

    if (pePendientes == 0 && vcPendientes == 0) {
      return _TipoDeteccion(
        tipo: TipoRegistro.valeConsumo,
        razon: 'OT sin ítems pendientes · se asume Vale de Consumo',
      );
    }
    if (pePendientes > vcPendientes) {
      return _TipoDeteccion(
        tipo: TipoRegistro.parteEntrada,
        razon: '$pePendientes ítems de Orden de Recepción pendientes',
      );
    }
    if (vcPendientes > pePendientes) {
      return _TipoDeteccion(
        tipo: TipoRegistro.valeConsumo,
        razon: '$vcPendientes ítems del OT pendientes de consumo',
      );
    }
    return _TipoDeteccion(
      tipo: TipoRegistro.valeConsumo,
      razon: 'Igual cantidad de pendientes · se asume Vale de Consumo',
    );
  }

  void _precargarArticulosDeOT() {
    final ot = widget.ordenTrabajoDetalle;
    if (ot == null) return;

    final pool = _poolParaTipo(ot, _tipoSeleccionado);
    if (pool.isEmpty) return;

    setState(() {
      for (final i in _items) {
        i.cantidadController.dispose();
        i.cantidadFocus.dispose();
        i.observacionController.dispose();
      }
      _items.clear();
      _articulosAnadidos.clear();

      for (final d in pool) {
        final cant = _cantidadSugerida(d, _tipoSeleccionado);
        final cantStr = cant.toStringAsFixed(
          cant == cant.roundToDouble() ? 0 : 2,
        );
        _items.add(_LineaItem(
          articulo: Articulo(codigo: d.codigo, descr: d.descr, um: ''),
          cantidadInicial: cantStr,
        ));
        _articulosAnadidos.add(d.codigo);
      }
    });

    if (_items.isNotEmpty) {
      _searchArticuloFocus.unfocus();
      final lastItem = _items.last;
      final cantStr = lastItem.cantidadController.text;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        lastItem.cantidadFocus.requestFocus();
        lastItem.cantidadController.selection = TextSelection(
          baseOffset: 0,
          extentOffset: cantStr.length,
        );
      });
    }
  }

  List<OTDetalle> _poolParaTipo(OrdenTrabajoDetalle ot, TipoRegistro tipo) {
    final es = ot.detalles.where((d) => d.codigo.isNotEmpty);
    if (tipo == TipoRegistro.parteEntrada) {
      return es.where((d) => d.docref != null && d.cantidad > 0).toList();
    }
    return es.where((d) => d.docref == null && d.pendiente > 0).toList();
  }

  double _cantidadSugerida(OTDetalle d, TipoRegistro tipo) {
    if (tipo == TipoRegistro.parteEntrada) {
      return d.cantidad;
    }
    return d.pendiente > 0 ? d.pendiente : d.cantidad;
  }

  void _anadirArticuloDeOT(OTDetalle d) {
    if (_articulosAnadidos.contains(d.codigo)) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${d.descr} ya está agregado'),
          duration: const Duration(seconds: 1),
        ),
      );
      return;
    }
    if (widget.ordenTrabajoDetalle != null) {
      final pool = _poolParaTipo(widget.ordenTrabajoDetalle!, _tipoSeleccionado);
      final enPool = pool.any((p) => p.codigo == d.codigo);
      if (!enPool) {
        final msg = _tipoSeleccionado == TipoRegistro.parteEntrada
            ? 'Este ítem no proviene de Orden de Recepción'
            : 'Este ítem no es consumible directo del OT';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(msg), duration: const Duration(seconds: 2)),
        );
        return;
      }
    }
    final cant = _cantidadSugerida(d, _tipoSeleccionado);
    final cantStr = cant.toStringAsFixed(
      cant == cant.roundToDouble() ? 0 : 2,
    );
    final nuevoItem = _LineaItem(
      articulo: Articulo(codigo: d.codigo, descr: d.descr, um: ''),
      cantidadInicial: cantStr,
    );
    setState(() {
      _items.add(nuevoItem);
      _articulosAnadidos.add(d.codigo);
    });

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      nuevoItem.cantidadFocus.requestFocus();
      nuevoItem.cantidadController.selection = TextSelection(
        baseOffset: 0,
        extentOffset: cantStr.length,
      );
    });
  }

  @override
  void dispose() {
    for (final i in _items) {
      i.cantidadController.dispose();
      i.cantidadFocus.dispose();
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
      final codigo = _items[index].articulo.codigo;
      _items[index].cantidadController.dispose();
      _items[index].cantidadFocus.dispose();
      _items[index].observacionController.dispose();
      _items.removeAt(index);
      _articulosAnadidos.remove(codigo);
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

  Widget _buildOtArticulosSugeridos(ThemeData theme, bool isDark) {
    final ot = widget.ordenTrabajoDetalle!;
    final cs = theme.colorScheme;
    final pool = _poolParaTipo(ot, _tipoSeleccionado);
    if (pool.isEmpty) return const SizedBox.shrink();

    final origenLabel = _tipoSeleccionado == TipoRegistro.parteEntrada
        ? 'desde Orden de Recepción'
        : 'del OT';

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Card(
        color: cs.primary.withValues(alpha: isDark ? 0.15 : 0.06),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            InkWell(
              onTap: () => setState(() => _otArticulosExpandido = !_otArticulosExpandido),
              borderRadius: BorderRadius.circular(10),
              child: Padding(
                padding: const EdgeInsets.fromLTRB(12, 10, 8, 10),
                child: Row(
                  children: [
                    Icon(Icons.bolt, size: 18, color: cs.primary),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Ítems disponibles $origenLabel  ·  ${pool.length}',
                        style: theme.textTheme.titleSmall?.copyWith(
                          color: cs.primary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    Icon(
                      _otArticulosExpandido ? Icons.expand_less : Icons.expand_more,
                      color: cs.primary,
                    ),
                  ],
                ),
              ),
            ),
            if (_otArticulosExpandido) ...[
              const Divider(height: 1),
              ...pool.map((d) {
                final agregado = _articulosAnadidos.contains(d.codigo);
                final cant = _cantidadSugerida(d, _tipoSeleccionado);
                final cantTxt = cant.toStringAsFixed(
                  cant == cant.roundToDouble() ? 0 : 2,
                );
                final subtitle = _tipoSeleccionado == TipoRegistro.parteEntrada
                    ? '${d.codigo} · OR ref ${d.docref!.toInt()} · $cantTxt'
                    : '${d.codigo} · pendiente $cantTxt';
                return InkWell(
                  onTap: () => _anadirArticuloDeOT(d),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    child: Row(
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
                                subtitle,
                                style: TextStyle(
                                  fontSize: 12,
                                  color: isDark ? ArayaColors.darkMuted : ArayaColors.lightMuted,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Icon(
                          agregado ? Icons.check_circle : Icons.add_circle_outline,
                          color: agregado ? Colors.green : cs.primary,
                        ),
                      ],
                    ),
                  ),
                );
              }),
              const SizedBox(height: 6),
            ],
          ],
        ),
      ),
    );
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
                                        setState(() {
                                          _tipoSeleccionado = tipo;
                                          if (_tipoAutoDetectado != null &&
                                              tipo != _tipoAutoDetectado) {
                                            _tipoRazon = 'Selección manual del operador';
                                          }
                                        });
                                        if (widget.ordenTrabajoDetalle != null) {
                                          _precargarArticulosDeOT();
                                        }
                                      },
                                      selectedColor: cs.primary.withValues(alpha: 0.2),
                                    ),
                                  ),
                                );
                              }).toList(),
                            ),
                            if (_tipoRazon != null) ...[
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  Icon(
                                    _tipoSeleccionado == _tipoAutoDetectado
                                        ? Icons.auto_awesome
                                        : Icons.edit_note,
                                    size: 14,
                                    color: isDark ? ArayaColors.darkMuted : ArayaColors.lightMuted,
                                  ),
                                  const SizedBox(width: 4),
                                  Expanded(
                                    child: Text(
                                      _tipoRazon!,
                                      style: TextStyle(
                                        fontSize: 11,
                                        color: isDark ? ArayaColors.darkMuted : ArayaColors.lightMuted,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ],
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
                    if (widget.ordenTrabajoDetalle != null)
                      _buildOtArticulosSugeridos(theme, isDark),
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
                                            focusNode: item.cantidadFocus,
                                            keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                            decoration: const InputDecoration(
                                              labelText: 'Cantidad *',
                                              hintText: 'Editable',
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
  final FocusNode cantidadFocus;

  _LineaItem({required this.articulo, String? cantidadInicial})
      : cantidadController = TextEditingController(text: cantidadInicial ?? ''),
        observacionController = TextEditingController(),
        cantidadFocus = FocusNode();
}

class _TipoDeteccion {
  final TipoRegistro tipo;
  final String razon;
  const _TipoDeteccion({required this.tipo, required this.razon});
}