import 'package:flutter/material.dart';

import '../constants/araya_theme.dart';
import '../services/theme_service.dart';

class PrivacyPolicyScreen extends StatelessWidget {
  static const publicUrl = 'https://prod.arayaltda.cl/privacy-policy/';

  const PrivacyPolicyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = ThemeService.instance.isDark;
    final muted = isDark ? ArayaColors.darkMuted : ArayaColors.lightMuted;

    return Scaffold(
      appBar: AppBar(title: const Text('Política de privacidad')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            Text(
              'Política de Privacidad de Araya Móvil',
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              'Última actualización: 13 de octubre de 2026',
              style: TextStyle(color: muted),
            ),
            const SizedBox(height: 16),
            _section(
              'Datos tratados',
              'La app puede tratar credenciales o token de sesión, usuario, URL del servidor, órdenes de trabajo, artículos, cantidades, encargados, fechas, partes de entrada, vales de consumo y observaciones ingresadas.',
            ),
            _section(
              'Uso de datos',
              'Los datos se usan para autenticar usuarios, consultar y registrar información operacional, sincronizar registros móviles y mantener trazabilidad de documentos internos.',
            ),
            _section(
              'Almacenamiento local',
              'La app puede guardar configuración, token, último usuario y registros pendientes de sincronización en el dispositivo para permitir funcionamiento offline temporal.',
            ),
            _section(
              'Compartición',
              'Araya Móvil no vende datos ni los comparte con fines publicitarios. Los datos se envían al servidor corporativo configurado y pueden ser procesados por proveedores tecnológicos necesarios para operar el servicio.',
            ),
            _section(
              'Permisos',
              'La app utiliza conexión a Internet. No requiere ubicación precisa, cámara, micrófono, contactos ni archivos personales para su funcionamiento principal.',
            ),
            _section(
              'Versión web',
              'La política completa está disponible públicamente en:\n$publicUrl',
            ),
          ],
        ),
      ),
    );
  }

  Widget _section(String title, String body) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 6),
          Text(body, style: const TextStyle(fontSize: 14, height: 1.45)),
        ],
      ),
    );
  }
}
