import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../models/articulo.dart';

class ConfigService {
  static const _keyBackendUrl = 'backend_url';
  static const _keyLoggedIn = 'logged_in';
  static const _keyLastUser = 'last_user';
  static const _keyToken = 'auth_token';
  static const _keyArticulosCache = 'articulos_cache';

  Future<String?> getBackendUrl() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_keyBackendUrl);
  }

  Future<void> setBackendUrl(String url) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyBackendUrl, url);
  }

  Future<void> clearBackendUrl() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_keyBackendUrl);
  }

  Future<bool> isLoggedIn() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_keyLoggedIn) ?? false;
  }

  Future<void> setLoggedIn(bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_keyLoggedIn, value);
  }

  Future<String?> getLastUser() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_keyLastUser);
  }

  Future<void> setLastUser(String username) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyLastUser, username);
  }

  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_keyToken);
  }

  Future<void> setToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyToken, token);
  }

  Future<void> cacheArticulos(List<Articulo> articulos) async {
    final prefs = await SharedPreferences.getInstance();
    final existing = await getCachedArticulos();
    final merged = <String, Articulo>{};
    for (final a in existing) {
      merged[a.codigo] = a;
    }
    for (final a in articulos) {
      merged[a.codigo] = a;
    }
    final list = merged.values.toList();
    final json = jsonEncode(list.map((a) => {
      'codigo': a.codigo,
      'descr': a.descr,
      'um': a.um,
    }).toList());
    await prefs.setString(_keyArticulosCache, json);
  }

  Future<List<Articulo>> getCachedArticulos() async {
    final prefs = await SharedPreferences.getInstance();
    final json = prefs.getString(_keyArticulosCache);
    if (json == null || json.isEmpty) return [];
    try {
      final List<dynamic> data = jsonDecode(json) as List<dynamic>;
      return data
          .map((e) => Articulo.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (_) {
      return [];
    }
  }

  Future<List<Articulo>> searchCachedArticulos(String query) async {
    final all = await getCachedArticulos();
    final q = query.toLowerCase();
    return all.where((a) =>
      a.codigo.toLowerCase().contains(q) ||
      a.descr.toLowerCase().contains(q)
    ).take(20).toList();
  }

  Future<void> clearSession() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_keyLoggedIn);
    await prefs.remove(_keyLastUser);
    await prefs.remove(_keyToken);
  }
}
