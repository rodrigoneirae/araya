import 'package:flutter/material.dart';

class ArayaColors {
  ArayaColors._();

  // Light mode
  static const Color lightBg = Color.fromRGBO(244, 247, 244, 1);
  static const Color lightSurface = Color.fromRGBO(255, 255, 255, 1);
  static const Color lightSurface2 = Color.fromRGBO(240, 244, 240, 1);
  static const Color lightBorder = Color.fromRGBO(209, 219, 209, 1);
  static const Color lightText = Color.fromRGBO(22, 31, 22, 1);
  static const Color lightMuted = Color.fromRGBO(95, 108, 95, 1);
  static const Color lightPrimary = Color.fromRGBO(74, 124, 89, 1);
  static const Color lightPrimarySoft = Color.fromRGBO(220, 235, 223, 1);
  static const Color lightAccent = Color.fromRGBO(201, 132, 45, 1);

  // Dark mode
  static const Color darkBg = Color.fromRGBO(12, 16, 20, 1);
  static const Color darkSurface = Color.fromRGBO(22, 28, 34, 1);
  static const Color darkSurface2 = Color.fromRGBO(30, 38, 44, 1);
  static const Color darkBorder = Color.fromRGBO(60, 70, 80, 1);
  static const Color darkText = Color.fromRGBO(230, 235, 240, 1);
  static const Color darkMuted = Color.fromRGBO(140, 150, 160, 1);
  static const Color darkPrimary = Color.fromRGBO(74, 140, 90, 1);
  static const Color darkPrimarySoft = Color.fromRGBO(40, 65, 48, 1);
  static const Color darkAccent = Color.fromRGBO(255, 200, 100, 1);
}

ThemeData buildArayaLightTheme() {
  final colorScheme = ColorScheme.fromSeed(
    seedColor: ArayaColors.lightPrimary,
    brightness: Brightness.light,
  );
  return ThemeData(
    useMaterial3: true,
    colorScheme: colorScheme.copyWith(
      surface: ArayaColors.lightBg,
    ),
    scaffoldBackgroundColor: ArayaColors.lightBg,
    appBarTheme: const AppBarTheme(
      backgroundColor: ArayaColors.lightSurface,
      surfaceTintColor: ArayaColors.lightSurface,
      foregroundColor: ArayaColors.lightText,
    ),
    cardTheme: CardThemeData(
      color: ArayaColors.lightSurface,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: ArayaColors.lightBorder),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: ArayaColors.lightPrimary,
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: ArayaColors.lightPrimary,
        side: const BorderSide(color: ArayaColors.lightPrimary),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: ArayaColors.lightBg,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: ArayaColors.lightBorder),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: ArayaColors.lightBorder),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: ArayaColors.lightPrimary, width: 2),
      ),
      labelStyle: const TextStyle(color: ArayaColors.lightMuted),
    ),
    dividerTheme: const DividerThemeData(
      color: ArayaColors.lightBorder,
      thickness: 1,
    ),
  );
}

ThemeData buildArayaDarkTheme() {
  final colorScheme = ColorScheme.fromSeed(
    seedColor: ArayaColors.darkPrimary,
    brightness: Brightness.dark,
  );
  return ThemeData(
    useMaterial3: true,
    colorScheme: colorScheme.copyWith(
      surface: ArayaColors.darkBg,
    ),
    scaffoldBackgroundColor: ArayaColors.darkBg,
    appBarTheme: const AppBarTheme(
      backgroundColor: ArayaColors.darkSurface,
      surfaceTintColor: ArayaColors.darkSurface,
      foregroundColor: ArayaColors.darkText,
    ),
    cardTheme: CardThemeData(
      color: ArayaColors.darkSurface,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: ArayaColors.darkBorder),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: ArayaColors.darkPrimary,
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: ArayaColors.darkPrimary,
        side: const BorderSide(color: ArayaColors.darkPrimary),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: ArayaColors.darkSurface2,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: ArayaColors.darkBorder),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: ArayaColors.darkBorder),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: ArayaColors.darkPrimary, width: 2),
      ),
      labelStyle: const TextStyle(color: ArayaColors.darkMuted),
    ),
    dividerTheme: const DividerThemeData(
      color: ArayaColors.darkBorder,
      thickness: 1,
    ),
  );
}
