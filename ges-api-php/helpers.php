<?php
require_once __DIR__ . '/jwt.php';

function json_response($data, $status = 200) {
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function get_json_input() {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return $data ?: [];
}

function get_bearer_token() {
    $hdr = null;
    if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $hdr = $_SERVER['HTTP_AUTHORIZATION'];
    } elseif (function_exists('apache_request_headers')) {
        $req = apache_request_headers();
        if (isset($req['Authorization'])) $hdr = $req['Authorization'];
    }
    if (!$hdr) return null;
    if (preg_match('/Bearer\s+(.*)$/i', $hdr, $m)) return $m[1];
    return null;
}

function require_auth($pdo) {
    $config = require __DIR__ . '/config.php';
    $token = get_bearer_token();
    if (!$token) json_response(['error' => 'Token missing'], 401);
    $payload = jwt_decode($token, $config['jwt_secret']);
    if (!$payload) json_response(['error' => 'Token inválido'], 401);
    // load user from DB to ensure exists
    $stmt = $pdo->prepare('SELECT id, nome, email, admin FROM usuarios WHERE id = ? AND ativo = 1');
    $stmt->execute([$payload['id']]);
    $user = $stmt->fetch();
    if (!$user) json_response(['error' => 'Usuário inválido'], 401);
    return $user;
}
