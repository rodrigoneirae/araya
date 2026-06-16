import 'package:flutter/material.dart';

import '../constants/araya_theme.dart';
import '../services/api_service.dart';
import '../services/config_service.dart';
import '../services/sync_service.dart';
import '../services/theme_service.dart';
import 'login_screen.dart';
import 'ot_list_screen.dart';

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
  bool _loading = false;
  SyncState _syncState = SyncState.idle;
  int _pendingCount = 0;
  DateTime? _lastSync;

  @override
  void initState() {
    super.initState();
    _initSync();
  }

  Future<void> _initSync() async {
    final syncService = SyncService();
    await syncService.initialize(widget.apiService);

    syncService.syncStateStream.listen((state) {
      if (mounted) setState(() => _syncState = state);
    });

    syncService.pendingCountStream.listen((count) {
      if (mounted) setState(() => _pendingCount = count);
    });

    syncService.lastSyncStream.listen((dt) {
      if (mounted) setState(() => _lastSync = dt);
    });
  }

  Future<void> _sync() async {
    final syncService = SyncService();
    await syncService.forceSync();
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

  Color _syncColor(bool isDark) {
    switch (_syncState) {
      case SyncState.syncing:
        return Colors.blue;
      case SyncState.error:
        return Colors.red;
      case SyncState.offline:
        return isDark ? ArayaColors.darkAccent : ArayaColors.lightAccent;
      default:
        return Colors.green;
    }
  }

  IconData _syncIcon() {
    switch (_syncState) {
      case SyncState.syncing:
        return Icons.sync;
      case SyncState.error:
        return Icons.sync_problem;
      case SyncState.offline:
        return Icons.cloud_off;
      default:
        return Icons.cloud_done;
    }
  }

  String _syncLabel() {
    switch (_syncState) {
      case SyncState.syncing:
        return 'Sincronizando...';
      case SyncState.error:
        return 'Error de sync';
      case SyncState.offline:
        return 'Offline';
      default:
        if (_pendingCount > 0) {
          return '$_pendingCount pendientes';
        }
        if (_lastSync != null) {
          final diff = DateTime.now().difference(_lastSync!);
          if (diff.inMinutes < 1) return 'Sincronizado';
          if (diff.inMinutes < 60) return 'Hace ${diff.inMinutes}m';
          return 'Hace ${diff.inHours}h';
        }
        return 'Sincronizado';
    }
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
          Stack(
            alignment: Alignment.center,
            children: [
              IconButton(
                icon: Icon(_syncIcon(), color: _syncColor(isDark)),
                onPressed: _sync,
                tooltip: 'Sincronizar',
              ),
              if (_pendingCount > 0)
                Positioned(
                  right: 4,
                  top: 4,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(
                      color: Colors.orange,
                      shape: BoxShape.circle,
                    ),
                    constraints: const BoxConstraints(
                      minWidth: 18,
                      minHeight: 18,
                    ),
                    child: Text(
                      '$_pendingCount',
                      style: const TextStyle(
                        fontSize: 10,
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
            ],
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _sync,
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
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: _syncColor(isDark).withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(_syncIcon(), size: 16, color: _syncColor(isDark)),
                const SizedBox(width: 6),
                Text(
                  _syncLabel(),
                  style: TextStyle(
                    fontSize: 12,
                    color: _syncColor(isDark),
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Card(
            child: Column(
              children: [
                _menuItem(
                  icon: Icons.assignment,
                  title: 'Órdenes de Trabajo',
                  subtitle: 'Ver mis OT asignadas',
                  color: cs.primary,
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => OTListScreen(
                        apiService: widget.apiService,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const Spacer(),
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