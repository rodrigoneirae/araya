import 'package:shared_preferences/shared_preferences.dart';

class ConfigService {
  static const _keyBackendUrl = 'backend_url';
  static const _keyLoggedIn = 'logged_in';
  static const _keyLastUser = 'last_user';

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

  Future<void> clearSession() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_keyLoggedIn);
    await prefs.remove(_keyLastUser);
  }
}
