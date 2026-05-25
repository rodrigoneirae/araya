import 'package:flutter/material.dart';

import '../constants/araya_theme.dart';
import '../services/config_service.dart';
import '../services/api_service.dart';
import '../services/theme_service.dart';
import 'login_screen.dart';

class SetupScreen extends StatefulWidget {
  final String? initialUrl;

  const SetupScreen({super.key, this.initialUrl});

  @override
  State<SetupScreen> createState() => _SetupScreenState();
}

class _SetupScreenState extends State<SetupScreen> {
  final _urlController = TextEditingController();
  final _configService = ConfigService();
  bool _testing = false;
  String? _statusText;
  bool? _statusOk;

  @override
  void initState() {
    super.initState();
    _urlController.text = widget.initialUrl ?? 'http://10.0.2.2:8000';
  }

  @override
  void dispose() {
    _urlController.dispose();
    super.dispose();
  }

  Future<void> _testConnection() async {
    final url = _urlController.text.trim();
    if (url.isEmpty) return;

    setState(() {
      _testing = true;
      _statusText = null;
      _statusOk = null;
    });

    final api = ApiService(baseUrl: url);
    final info = await api.checkHealth();
    api.dispose();

    setState(() {
      _testing = false;
      _statusOk = info.isOk;
      _statusText = info.isOk
          ? 'Conexión exitosa'
          : info.detail ?? 'Error de conexión';
    });
  }

  Future<void> _saveAndContinue() async {
    final url = _urlController.text.trim();
    if (url.isEmpty) return;

    final api = ApiService(baseUrl: url);
    final info = await api.checkHealth();
    api.dispose();

    if (!info.isOk) {
      setState(() {
        _statusOk = false;
        _statusText = info.detail ?? 'No se puede conectar';
      });
      return;
    }

    await _configService.setBackendUrl(url);
    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (_) => LoginScreen(baseUrl: url),
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
        title: const Text('Configuración'),
        centerTitle: true,
        actions: [
          IconButton(
            icon: Icon(
              isDark ? Icons.light_mode : Icons.dark_mode,
              color: isDark ? ArayaColors.darkAccent : ArayaColors.lightAccent,
            ),
            onPressed: () => ThemeService.instance.toggle(),
            tooltip: isDark ? 'Modo claro' : 'Modo oscuro',
          ),
        ],
      ),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.cloud_outlined, size: 64, color: cs.primary),
              const SizedBox(height: 16),
              Text(
                'Conectar al servidor',
                style: theme.textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Ingresa la URL del backend de Araya',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: isDark ? ArayaColors.darkMuted : ArayaColors.lightMuted,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
              TextField(
                controller: _urlController,
                decoration: const InputDecoration(
                  labelText: 'URL del backend',
                  hintText: 'http://10.0.2.2:8000',
                  prefixIcon: Icon(Icons.link),
                ),
                keyboardType: TextInputType.url,
                textInputAction: TextInputAction.go,
                onSubmitted: (_) => _testConnection(),
              ),
              const SizedBox(height: 16),
              if (_statusText != null)
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: _statusOk == true
                        ? (isDark ? Colors.green.shade900 : Colors.green.shade50)
                        : (isDark ? Colors.red.shade900 : Colors.red.shade50),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        _statusOk == true ? Icons.check_circle : Icons.error,
                        color: _statusOk == true ? Colors.green : Colors.red,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _statusText!,
                          style: TextStyle(
                            color: _statusOk == true
                                ? (isDark ? Colors.green.shade300 : Colors.green.shade800)
                                : (isDark ? Colors.red.shade300 : Colors.red.shade800),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: OutlinedButton.icon(
                  onPressed: _testing ? null : _testConnection,
                  icon: _testing
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.wifi_find),
                  label: Text(_testing ? 'Probando...' : 'Probar conexión'),
                ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: FilledButton.icon(
                  onPressed: _testing ? null : _saveAndContinue,
                  icon: const Icon(Icons.arrow_forward),
                  label: const Text('Guardar y continuar'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
