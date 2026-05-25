import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;

class BackendInfo {
  final String status;
  final String? detail;

  BackendInfo({required this.status, this.detail});

  factory BackendInfo.fromJson(Map<String, dynamic> json) {
    return BackendInfo(
      status: json['status'] as String? ?? 'error',
      detail: json['detail'] as String?,
    );
  }

  bool get isOk => status == 'ok';
}

class LoginResult {
  final bool success;
  final String? message;

  LoginResult({required this.success, this.message});
}

class ApiService {
  final String baseUrl;
  final http.Client _client;

  ApiService({required this.baseUrl, http.Client? client})
      : _client = client ?? http.Client();

  String get _healthUrl => '$baseUrl/api/health/';
  String get _loginUrl => '$baseUrl/login/';

  Future<BackendInfo> checkHealth() async {
    try {
      final uri = Uri.parse(_healthUrl);
      final response = await _client
          .get(uri)
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final json = jsonDecode(response.body) as Map<String, dynamic>;
        return BackendInfo.fromJson(json);
      }
      return BackendInfo(
        status: 'error',
        detail: 'HTTP ${response.statusCode}',
      );
    } on SocketException {
      return BackendInfo(
        status: 'error',
        detail: 'No se pudo conectar al servidor',
      );
    } on HttpException {
      return BackendInfo(
        status: 'error',
        detail: 'Error de conexión HTTP',
      );
    } on FormatException {
      return BackendInfo(
        status: 'error',
        detail: 'Respuesta inválida del servidor',
      );
    } catch (e) {
      return BackendInfo(
        status: 'error',
        detail: 'Error: ${e.runtimeType}',
      );
    }
  }

  Future<LoginResult> login(String username, String password) async {
    try {
      final uri = Uri.parse(_loginUrl);
      final response = await _client
          .post(
            uri,
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            body: {'login': username, 'password': password},
          )
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final json = jsonDecode(response.body) as Map<String, dynamic>;
        if (json['status'] == 'success') {
          return LoginResult(success: true);
        }
        return LoginResult(
          success: false,
          message: json['message'] as String? ?? 'Error desconocido',
        );
      }

      String? message;
      try {
        final json = jsonDecode(response.body) as Map<String, dynamic>;
        message = json['message'] as String?;
      } catch (_) {}

      return LoginResult(
        success: false,
        message: message ?? 'HTTP ${response.statusCode}',
      );
    } on SocketException {
      return LoginResult(success: false, message: 'Sin conexión al servidor');
    } catch (e) {
      return LoginResult(success: false, message: 'Error: ${e.runtimeType}');
    }
  }

  void dispose() {
    _client.close();
  }
}
