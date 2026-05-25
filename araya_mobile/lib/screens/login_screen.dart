import 'package:flutter/material.dart';

import '../constants/araya_theme.dart';
import '../services/api_service.dart';
import '../services/config_service.dart';
import '../services/theme_service.dart';
import 'home_screen.dart';

class LoginScreen extends StatefulWidget {
  final String baseUrl;

  const LoginScreen({super.key, required this.baseUrl});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _userController = TextEditingController();
  final _passController = TextEditingController();
  bool _loading = false;
  String? _error;
  bool _obscurePass = true;

  @override
  void dispose() {
    _userController.dispose();
    _passController.dispose();
    super.dispose();
  }

  Future<void> _doLogin() async {
    final username = _userController.text.trim();
    final password = _passController.text;

    if (username.isEmpty || password.isEmpty) {
      setState(() => _error = 'Usuario y contraseña requeridos');
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });

    final api = ApiService(baseUrl: widget.baseUrl);
    final result = await api.login(username, password);
    api.dispose();

    if (!mounted) return;

    if (result.success) {
      final config = ConfigService();
      await config.setLoggedIn(true);
      await config.setLastUser(username);
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) => HomeScreen(
            apiService: ApiService(baseUrl: widget.baseUrl),
            username: username,
          ),
        ),
      );
    } else {
      setState(() {
        _loading = false;
        _error = result.message ?? 'Credenciales inválidas';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = ThemeService.instance.isDark;

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: Center(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: Image.asset(
                          'assets/images/logo.png',
                          height: 64,
                          fit: BoxFit.contain,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'ARAYA',
                        style: theme.textTheme.titleLarge?.copyWith(
                          color: theme.colorScheme.primary,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 4,
                        ),
                      ),
                      Text(
                        'Sistema de Gestión',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: isDark
                              ? ArayaColors.darkMuted
                              : ArayaColors.lightMuted,
                        ),
                      ),
                      const SizedBox(height: 20),
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              Text(
                                'Iniciar Sesión',
                                style: theme.textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              const SizedBox(height: 16),
                              TextField(
                                controller: _userController,
                                decoration: const InputDecoration(
                                  labelText: 'Usuario',
                                  prefixIcon: Icon(Icons.person_outline),
                                ),
                                textInputAction: TextInputAction.next,
                              ),
                              const SizedBox(height: 16),
                              TextField(
                                controller: _passController,
                                obscureText: _obscurePass,
                                decoration: InputDecoration(
                                  labelText: 'Contraseña',
                                  prefixIcon: const Icon(Icons.lock_outline),
                                  suffixIcon: IconButton(
                                    icon: Icon(
                                      _obscurePass
                                          ? Icons.visibility_off
                                          : Icons.visibility,
                                    ),
                                    onPressed: () => setState(
                                      () => _obscurePass = !_obscurePass,
                                    ),
                                  ),
                                ),
                                textInputAction: TextInputAction.done,
                                onSubmitted: (_) => _doLogin(),
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
                                      Icon(
                                        Icons.error_outline,
                                        size: 18,
                                        color: isDark
                                            ? Colors.red.shade300
                                            : Colors.red.shade700,
                                      ),
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
                              const SizedBox(height: 16),
                              SizedBox(
                                height: 48,
                                child: FilledButton(
                                  onPressed: _loading ? null : _doLogin,
                                  child: _loading
                                      ? const SizedBox(
                                          width: 22,
                                          height: 22,
                                          child: CircularProgressIndicator(
                                            strokeWidth: 2,
                                            color: Colors.white,
                                          ),
                                        )
                                      : const Text(
                                          'INGRESAR',
                                          style: TextStyle(
                                            fontSize: 15,
                                            fontWeight: FontWeight.w600,
                                            letterSpacing: 1,
                                          ),
                                        ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Column(
                children: [
                  IconButton(
                    icon: Icon(
                      isDark ? Icons.light_mode : Icons.dark_mode,
                      color: isDark
                          ? ArayaColors.darkAccent
                          : ArayaColors.lightAccent,
                    ),
                    onPressed: () => ThemeService.instance.toggle(),
                    tooltip: isDark ? 'Modo claro' : 'Modo oscuro',
                  ),
                  Text(
                    'v1.0.0',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: isDark
                          ? ArayaColors.darkMuted
                          : ArayaColors.lightMuted,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
