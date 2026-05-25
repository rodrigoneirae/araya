import 'package:flutter/material.dart';

import 'constants/araya_theme.dart';
import 'screens/home_screen.dart';
import 'screens/login_screen.dart';
import 'screens/setup_screen.dart';
import 'services/api_service.dart';
import 'services/config_service.dart';
import 'services/theme_service.dart';


void main() {
  ThemeService.instance;
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ArayaApp());
}

class ArayaApp extends StatelessWidget {
  const ArayaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: ThemeService.instance,
      builder: (context, _) {
        return MaterialApp(
          title: 'Araya Móvil',
          debugShowCheckedModeBanner: false,
          theme: buildArayaLightTheme(),
          darkTheme: buildArayaDarkTheme(),
          themeMode: ThemeService.instance.mode,
          home: const StartupScreen(),
        );
      },
    );
  }
}

class StartupScreen extends StatefulWidget {
  const StartupScreen({super.key});

  @override
  State<StartupScreen> createState() => _StartupScreenState();
}

class _StartupScreenState extends State<StartupScreen> {
  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    final config = ConfigService();
    final savedUrl = await config.getBackendUrl();

    if (savedUrl == null || savedUrl.isEmpty) {
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const SetupScreen()),
      );
      return;
    }

    final api = ApiService(baseUrl: savedUrl);
    final info = await api.checkHealth();
    api.dispose();

    if (!info.isOk) {
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) => SetupScreen(initialUrl: savedUrl),
        ),
      );
      return;
    }

    final loggedIn = await config.isLoggedIn();

    if (loggedIn && mounted) {
      final username = await config.getLastUser();
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) => HomeScreen(
            apiService: ApiService(baseUrl: savedUrl),
            username: username,
          ),
        ),
      );
      return;
    }

    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (_) => LoginScreen(baseUrl: savedUrl),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: Image.asset('assets/images/logo.png', height: 100),
            ),
            const SizedBox(height: 16),
            Text(
              'ARAYA',
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                color: colors.primary,
                fontWeight: FontWeight.bold,
                letterSpacing: 4,
              ),
            ),
            const SizedBox(height: 24),
            CircularProgressIndicator(color: colors.primary),
          ],
        ),
      ),
    );
  }
}
