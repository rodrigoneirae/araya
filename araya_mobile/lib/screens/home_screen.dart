import 'package:flutter/material.dart';

import '../constants/araya_theme.dart';
import '../services/api_service.dart';
import '../services/config_service.dart';
import '../services/theme_service.dart';
import 'login_screen.dart';

class HomeScreen extends StatefulWidget {
  final ApiService apiService;
  final String? username;

  const HomeScreen({
    super.key,
    required this.apiService,
    this.username,
  });

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  BackendInfo? _info;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _check();
  }

  Future<void> _check() async {
    setState(() => _loading = true);
    final info = await widget.apiService.checkHealth();
    setState(() {
      _info = info;
      _loading = false;
    });
  }

  Future<void> _logout() async {
    await ConfigService().clearSession();
    if (!mounted) return;
    final config = ConfigService();
    final url = await config.getBackendUrl();
    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(
        builder: (_) => LoginScreen(baseUrl: url ?? ''),
      ),
      (route) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final isDark = ThemeService.instance.isDark;

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.asset('assets/images/logo.png', height: 28),
            ),
          ],
        ),
        actions: [
          if (widget.username != null)
            Padding(
              padding: const EdgeInsets.only(right: 4),
              child: Center(
                child: Text(
                  widget.username!,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: isDark ? ArayaColors.darkMuted : ArayaColors.lightMuted,
                  ),
                ),
              ),
            ),
          IconButton(
            icon: Icon(
              isDark ? Icons.light_mode : Icons.dark_mode,
              color: isDark ? ArayaColors.darkAccent : ArayaColors.lightAccent,
            ),
            onPressed: () => ThemeService.instance.toggle(),
            tooltip: isDark ? 'Modo claro' : 'Modo oscuro',
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _check,
            tooltip: 'Refrescar',
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: _logout,
            tooltip: 'Cerrar sesión',
          ),
        ],
      ),
      body: Center(
        child: _loading
            ? CircularProgressIndicator(color: cs.primary)
            : _buildStatus(theme, cs, isDark),
      ),
    );
  }

  Widget _buildStatus(ThemeData theme, ColorScheme cs, bool isDark) {
    final ok = _info?.isOk ?? false;
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            ok ? Icons.check_circle : Icons.error,
            size: 80,
            color: ok ? cs.primary : Colors.red,
          ),
          const SizedBox(height: 16),
          Text(
            ok ? 'Conectado' : 'Error de conexión',
            style: theme.textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            ok
                ? 'El backend REST Framework está funcionando'
                : _info?.detail ?? 'Error desconocido',
            textAlign: TextAlign.center,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: isDark ? ArayaColors.darkMuted : ArayaColors.lightMuted,
            ),
          ),
          const SizedBox(height: 32),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  _infoRow('Estado', ok ? 'Operativo' : 'Caído',
                      ok ? cs.primary : Colors.red, isDark),
                  const Divider(height: 20),
                  _infoRow('Servidor', widget.apiService.baseUrl, null, isDark),
                  const Divider(height: 20),
                  _infoRow('Usuario', widget.username ?? '-', null, isDark),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _infoRow(String label, String value, Color? valueColor, bool isDark) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            color: isDark ? ArayaColors.darkMuted : ArayaColors.lightMuted,
            fontSize: 13,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontWeight: FontWeight.w600,
            color: valueColor ??
                (isDark ? ArayaColors.darkText : ArayaColors.lightText),
            fontSize: 13,
          ),
        ),
      ],
    );
  }
}
