import 'package:flutter/material.dart';

import '../constants/araya_theme.dart';
import '../services/api_service.dart';
import '../services/config_service.dart';
import '../services/theme_service.dart';
import 'login_screen.dart';
import 'registro_form_screen.dart';
import 'registros_list_screen.dart';

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
  final bool _loading = false;

  @override
  void initState() {
    super.initState();
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
            onPressed: () {},
            tooltip: 'Refrescar',
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: _logout,
            tooltip: 'Cerrar sesión',
          ),
        ],
      ),
      body: _loading
          ? Center(child: CircularProgressIndicator(color: cs.primary))
          : _buildMenu(theme, cs, isDark),
    );
  }

  Widget _buildMenu(ThemeData theme, ColorScheme cs, bool isDark) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          const SizedBox(height: 16),
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: Image.asset('assets/images/logo.png', height: 64),
          ),
          const SizedBox(height: 6),
          Text(
            'ARAYA',
            style: theme.textTheme.titleLarge?.copyWith(
              color: cs.primary,
              fontWeight: FontWeight.bold,
              letterSpacing: 4,
            ),
          ),
          if (widget.username != null)
            Text(
              widget.username!,
              style: TextStyle(
                fontSize: 13,
                color: isDark ? ArayaColors.darkMuted : ArayaColors.lightMuted,
              ),
            ),
          const SizedBox(height: 32),
          Card(
            child: Column(
              children: [
                _menuItem(
                  icon: Icons.add_circle_outline,
                  title: 'Nuevo Registro',
                  subtitle: 'Ingresar artículos',
                  color: cs.primary,
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => RegistroFormScreen(
                        apiService: widget.apiService,
                      ),
                    ),
                  ),
                ),
                Divider(height: 1, indent: 16, endIndent: 16,
                    color: isDark ? ArayaColors.darkBorder : ArayaColors.lightBorder),
                _menuItem(
                  icon: Icons.list_alt,
                  title: 'Mis Registros',
                  subtitle: 'Ver registros ingresados',
                  color: cs.primary,
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => RegistrosListScreen(
                        apiService: widget.apiService,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'v1.0.0',
            style: TextStyle(
              fontSize: 12,
              color: isDark ? ArayaColors.darkMuted : ArayaColors.lightMuted,
            ),
          ),
        ],
      ),
    );
  }

  Widget _menuItem({
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    required VoidCallback onTap,
  }) {
    return ListTile(
      leading: Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Icon(icon, color: color),
      ),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w500)),
      subtitle: Text(subtitle, style: const TextStyle(fontSize: 12)),
      trailing: const Icon(Icons.chevron_right, size: 20),
      onTap: onTap,
    );
  }


}
