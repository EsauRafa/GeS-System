<?php
// api/login.php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Method not allowed'], 405);
}

$body = get_json_input();
$email = trim($body['email'] ?? '');
$senha = $body['senha'] ?? '';
if (!$email || !$senha) json_response(['error' => 'Dados insuficientes'], 400);

$stmt = $pdo->prepare('SELECT id, nome, email, admin, senha_hash, foto_perfil FROM usuarios WHERE email = ? AND ativo = 1');
$stmt->execute([$email]);
$user = $stmt->fetch();
if (!$user) json_response(['error' => 'E-mail ou senha incorretos'], 401);

if (!password_verify($senha, $user['senha_hash'] ?? '')) json_response(['error' => 'E-mail ou senha incorretos'], 401);

$config = require __DIR__ . '/../config.php';
$token = jwt_encode(['id' => $user['id'], 'admin' => !!$user['admin'], 'nome' => $user['nome']], $config['jwt_secret']);
$safeUser = ['id' => $user['id'], 'nome' => $user['nome'], 'email' => $user['email'], 'admin' => !!$user['admin']];
json_response(['token' => $token, 'user' => $safeUser]);
