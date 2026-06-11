import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;

import '../models/articulo.dart';
import '../models/registro_articulo.dart';
import '../models/orden_trabajo.dart';

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
  final String? token;
  final String? username;

  LoginResult({required this.success, this.message, this.token, this.username});
}

class ApiService {
  static final http.Client _sharedClient = http.Client();

  final String baseUrl;
  final String? token;
  final http.Client _client;

  ApiService({required this.baseUrl, this.token, http.Client? client})
      : _client = client ?? _sharedClient;

  String get _healthUrl => '$baseUrl/api/health/';
  String get _loginApiUrl => '$baseUrl/api/auth/login/';
  String get _articulosUrl => '$baseUrl/api/articulos/';
  String get _empleadosUrl => '$baseUrl/api/empleados/';
  String get _registrosUrl => '$baseUrl/api/registros/';
  String get _otUrl => '$baseUrl/api/ot/';

  Map<String, String> _headers({bool json = false}) {
    final h = <String, String>{};
    if (json) h['Content-Type'] = 'application/json';
    if (token != null && token!.isNotEmpty) {
      h['Authorization'] = 'Token $token';
    }
    return h;
  }

  Future<BackendInfo> checkHealth() async {
    try {
      final uri = Uri.parse(_healthUrl);
      final response = await _client
          .get(uri, headers: _headers())
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

  Future<LoginResult> loginWithToken(String username, String password) async {
    try {
      final uri = Uri.parse(_loginApiUrl);
      final response = await _client
          .post(
            uri,
            headers: _headers(json: true),
            body: jsonEncode({
              'username': username,
              'password': password,
            }),
          )
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final json = jsonDecode(response.body) as Map<String, dynamic>;
        if (json['status'] == 'success') {
          return LoginResult(
            success: true,
            token: json['token'] as String?,
            username: json['username'] as String?,
          );
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

  Future<List<Articulo>> searchArticulos(String query) async {
    final uri = Uri.parse(_articulosUrl).replace(
      queryParameters: {'q': query},
    );
    final response = await _client
        .get(uri, headers: _headers())
        .timeout(const Duration(seconds: 10));

    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body) as List<dynamic>;
      return data
          .map((e) => Articulo.fromJson(e as Map<String, dynamic>))
          .toList();
    }
    throw Exception('Error al buscar artículos');
  }

  Future<List<RegistroArticulo>> fetchRegistros({String? estado}) async {
    final params = <String, String>{};
    if (estado != null && estado.isNotEmpty) {
      params['estado'] = estado;
    }
    final uri = Uri.parse(_registrosUrl).replace(queryParameters: params);
    final response = await _client
        .get(uri, headers: _headers())
        .timeout(const Duration(seconds: 10));

    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body) as List<dynamic>;
      return data
          .map((e) => RegistroArticulo.fromJson(e as Map<String, dynamic>))
          .toList();
    }
    throw Exception('Error al cargar registros');
  }

  Future<RegistroArticulo?> createRegistro({
    required String documento,
    required List<RegistroDetalle> detalles,
    String tipoRegistro = 'PE',
    double? otNumero,
    double? codencargado,
  }) async {
    final uri = Uri.parse(_registrosUrl);

    final body = <String, dynamic>{
      'documento': documento,
      'tipo_registro': tipoRegistro,
      'detalles': detalles.map((d) => d.toJson()).toList(),
    };

    if (otNumero != null) body['ot_numero'] = otNumero;
    if (codencargado != null) body['codencargado'] = codencargado;

    final response = await _client
        .post(
          uri,
          headers: _headers(json: true),
          body: jsonEncode(body),
        )
        .timeout(const Duration(seconds: 15));

    if (response.statusCode == 201) {
      final json = jsonDecode(response.body) as Map<String, dynamic>;
      return RegistroArticulo.fromJson(json);
    }
    return null;
  }

  Future<List<Empleado>> searchEmpleados(String query) async {
    final uri = Uri.parse(_empleadosUrl).replace(
      queryParameters: {'q': query},
    );
    final response = await _client
        .get(uri, headers: _headers())
        .timeout(const Duration(seconds: 10));

    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body) as List<dynamic>;
      return data
          .map((e) => Empleado.fromJson(e as Map<String, dynamic>))
          .toList();
    }
    throw Exception('Error al buscar empleados');
  }

  Future<List<OrdenTrabajo>> fetchOTs({String? estado}) async {
    final params = <String, String>{};
    if (estado != null && estado.isNotEmpty) {
      params['estado'] = estado;
    }
    final uri = Uri.parse(_otUrl).replace(queryParameters: params);
    final response = await _client
        .get(uri, headers: _headers())
        .timeout(const Duration(seconds: 10));

    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body) as List<dynamic>;
      return data
          .map((e) => OrdenTrabajo.fromJson(e as Map<String, dynamic>))
          .toList();
    }
    throw Exception('Error al cargar órdenes de trabajo');
  }

  Future<List<RegistroArticulo>> fetchRegistrosByOT(double otNumero) async {
    final uri = Uri.parse(_registrosUrl).replace(
      queryParameters: {'ot_numero': otNumero.toString()},
    );
    final response = await _client
        .get(uri, headers: _headers())
        .timeout(const Duration(seconds: 10));

    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body) as List<dynamic>;
      return data
          .map((e) => RegistroArticulo.fromJson(e as Map<String, dynamic>))
          .toList();
    }
    throw Exception('Error al cargar registros de OT');
  }

  Future<OrdenTrabajoDetalle?> fetchOTDetalle(double numero) async {
    final uri = Uri.parse('$_otUrl$numero/');
    final response = await _client
        .get(uri, headers: _headers())
        .timeout(const Duration(seconds: 10));

    if (response.statusCode == 200) {
      final json = jsonDecode(response.body) as Map<String, dynamic>;
      return OrdenTrabajoDetalle.fromJson(json);
    }
    if (response.statusCode == 404) {
      return null;
    }
    throw Exception('Error al cargar detalle de OT');
  }

  void dispose() {
    if (_client != _sharedClient) {
      _client.close();
    }
  }
}
