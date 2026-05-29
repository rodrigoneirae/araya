import 'package:flutter/material.dart';

import '../constants/araya_theme.dart';
import '../models/articulo.dart';
import '../models/registro_articulo.dart';
import '../services/api_service.dart';
import '../services/config_service.dart';
import '../services/theme_service.dart';

class RegistroFormScreen extends StatefulWidget {
  final ApiService apiService;

  const RegistroFormScreen({super.key, required this.apiService});

  @override
  State<RegistroFormScreen> createState() => _RegistroFormScreenState();
}

class _RegistroFormScreenState extends State<RegistroFormScreen> {
  final _documentoController = TextEditingController();
  final _searchController = TextEditingController();
  final _searchFocus = FocusNode();

  bool _loading = false;
  bool _searching = false;
  bool _offline = false;
  String? _error;
  List<Articulo> _searchResults = [];
  final List<_LineaItem> _items = [];

  @override
  void dispose() {
    for (final i in _items) {
      i.cantidadController.dispose();
      i.observacionController.dispose();
    }
    _documentoController.dispose();
    _searchController.dispose();
    _searchFocus.dispose();
    super.dispose();
  }

  Future<void> _searchArticulos(String query) async {
    if (query.length < 2) {
      setState(() {
        _searchResults = [];
        _searching = false;
      });
      return;
    }

    setState(() {
      _searching = true;
      _offline = false;
    });

    try {
      final results = await widget.apiService.searchArticulos(query);
      if (!mounted) return;
      final config = ConfigService();
      await config.cacheArticulos(results);
      setState(() {
        _searchResults = results;
        _searching = false;
      });
    } catch (_) {
      if (!mounted) return;
      final config = ConfigService();
      final cached = await config.searchCachedArticulos(query);
      if (!mounted) return;
      setState(() {
        _searchResults = cached;
        _searching = false;
        _offline = true;
      });
    }
  }

  void _addItem(Articulo a) {
    _searchController.clear();
    _searchResults = [];
    _offline = false;
    setState(() {
      _items.add(_LineaItem(articulo: a));
    });
    _searchFocus.requestFocus();
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

    final result = await widget.apiService.createRegistro(
      documento: _documentoController.text.trim(),
      detalles: detalles,
    );

    if (!mounted) return;

    if (result != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Registro N° ${result.id} creado exitosamente')),
      );
      Navigator.of(context).pop(true);
    } else {
      setState(() {
        _loading = false;
        _error = 'Error al crear el registro';
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
        title: const Text('Nuevo Registro'),
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
                    TextField(
                      controller: _documentoController,
                      decoration: const InputDecoration(
                        labelText: 'Documento',
                        hintText: 'N° de documento',
                        prefixIcon: Icon(Icons.description_outlined),
                      ),
                    ),
                    const SizedBox(height: 20),
                    Text(
                      'Agregar Artículos',
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _searchController,
                      focusNode: _searchFocus,
                      decoration: InputDecoration(
                        labelText: 'Buscar artículo',
                        prefixIcon: const Icon(Icons.search),
                        suffixIcon: _searching
                            ? const Padding(
                                padding: EdgeInsets.all(12),
                                child: SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                  ),
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
                            Icon(Icons.cloud_off,
                                size: 14,
                                color: isDark
                                    ? ArayaColors.darkAccent
                                    : ArayaColors.lightAccent),
                            const SizedBox(width: 4),
                            Text(
                              'Resultados locales (sin conexión)',
                              style: TextStyle(
                                fontSize: 11,
                                color: isDark
                                    ? ArayaColors.darkAccent
                                    : ArayaColors.lightAccent,
                              ),
                            ),
                          ],
                        ),
                      ),
                    if (_searchResults.isNotEmpty)
                      Card(
                        margin: const EdgeInsets.only(top: 4),
                        child: ListView.separated(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: _searchResults.length,
                          separatorBuilder: (_, _) =>
                              Divider(height: 1, color: isDark
                                  ? ArayaColors.darkBorder
                                  : ArayaColors.lightBorder),
                          itemBuilder: (context, i) {
                            final a = _searchResults[i];
                            return ListTile(
                              dense: true,
                              title: Text(a.descr,
                                  style: const TextStyle(fontSize: 14)),
                              subtitle: Text(
                                '${a.codigo} · ${a.um}',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: isDark
                                      ? ArayaColors.darkMuted
                                      : ArayaColors.lightMuted,
                                ),
                              ),
                              trailing: IconButton(
                                icon: const Icon(Icons.add_circle_outline),
                                color: cs.primary,
                                onPressed: () => _addItem(a),
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
                              padding: const EdgeInsets.fromLTRB(
                                  16, 12, 16, 4),
                              child: Text(
                                'Artículos seleccionados (${_items.length})',
                                style: theme.textTheme.titleSmall?.copyWith(
                                  color: isDark
                                      ? ArayaColors.darkMuted
                                      : ArayaColors.lightMuted,
                                ),
                              ),
                            ),
                            const Divider(height: 1),
                            ..._items.asMap().entries.map((entry) {
                              final idx = entry.key;
                              final item = entry.value;
                              return Padding(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 16, vertical: 8),
                                child: Column(
                                  crossAxisAlignment:
                                      CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Expanded(
                                          child: Text(
                                            '${idx + 1}. ${item.articulo.descr}',
                                            style: const TextStyle(
                                              fontSize: 14,
                                              fontWeight: FontWeight.w500,
                                            ),
                                          ),
                                        ),
                                        IconButton(
                                          icon: const Icon(
                                              Icons.remove_circle_outline),
                                          iconSize: 20,
                                          color: Colors.red,
                                          onPressed: () =>
                                              _removeItem(idx),
                                          padding: EdgeInsets.zero,
                                          constraints:
                                              const BoxConstraints(),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      '${item.articulo.codigo} · ${item.articulo.um}',
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: isDark
                                            ? ArayaColors.darkMuted
                                            : ArayaColors.lightMuted,
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    Row(
                                      children: [
                                        Expanded(
                                          flex: 2,
                                          child: TextField(
                                            controller:
                                                item.cantidadController,
                                            keyboardType:
                                                const TextInputType
                                                    .numberWithOptions(
                                                    decimal: true),
                                            decoration:
                                                const InputDecoration(
                                              labelText: 'Cantidad *',
                                              isDense: true,
                                              contentPadding:
                                                  EdgeInsets.symmetric(
                                                horizontal: 12,
                                                vertical: 10,
                                              ),
                                            ),
                                          ),
                                        ),
                                        const SizedBox(width: 12),
                                        Expanded(
                                          flex: 3,
                                          child: TextField(
                                            controller:
                                                item.observacionController,
                                            decoration:
                                                const InputDecoration(
                                              labelText: 'Observación',
                                              isDense: true,
                                              contentPadding:
                                                  EdgeInsets.symmetric(
                                                horizontal: 12,
                                                vertical: 10,
                                              ),
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
                          style: TextStyle(
                            fontSize: 12,
                            color: isDark
                                ? ArayaColors.darkMuted
                                : ArayaColors.lightMuted,
                          ),
                        ),
                      ),
                    if (_error != null) ...[
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: isDark
                              ? Colors.red.shade900
                              : Colors.red.shade50,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.error_outline,
                                size: 18,
                                color: isDark
                                    ? Colors.red.shade300
                                    : Colors.red.shade700),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                _error!,
                                style: TextStyle(
                                  color: isDark
                                      ? Colors.red.shade300
                                      : Colors.red.shade700,
                                  fontSize: 13,
                                ),
                              ),
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
                  onPressed: (_loading || _items.isEmpty) ? null : _submit,
                  icon: _loading
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Icon(Icons.save),
                  label: Text(
                    _items.isEmpty
                        ? 'Agregue al menos un artículo'
                        : (_loading ? 'Guardando...' : 'Guardar Registro'),
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                    ),
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
