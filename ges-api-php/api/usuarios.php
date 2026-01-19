<?php
// api/usuarios.php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // list users (only admin)
    $auth = require_auth($pdo);
    if (!$auth['admin']) json_response([], 200);
    $stmt = $pdo->query('SELECT id, nome, email, cpf, telefone, cargo, data_admissao AS dataAdmissao, jornada_diaria AS jornadaDiaria, departamento, admin, ativo, foto_perfil AS fotoPerfil FROM usuarios ORDER BY nome');
    $rows = $stmt->fetchAll();
    json_response($rows);
}

if ($method === 'POST') {
    // create user (open to admins or allow self sign-up? we'll allow admins only)
    $auth = require_auth($pdo);
    if (!$auth['admin']) json_response(['error' => 'Não autorizado'], 403);
    $body = get_json_input();
    $nome = trim($body['nome'] ?? '');
    $email = trim($body['email'] ?? '');
    $senha = $body['senha'] ?? '';
    $admin = !empty($body['admin']);
    if (!$nome || !$email || !$senha) json_response(['error' => 'Dados insuficientes'], 400);
    // check existing
    $check = $pdo->prepare('SELECT id FROM usuarios WHERE email = ?');
    $check->execute([$email]);
    if ($check->fetch()) json_response(['error' => 'Email já cadastrado'], 400);

    $hash = password_hash($senha, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare('INSERT INTO usuarios (nome, email, senha_hash, admin, ativo) VALUES (?, ?, ?, ?, 1)');
    $stmt->execute([$nome, $email, $hash, $admin ? 1 : 0]);
    $id = $pdo->lastInsertId();
    $sel = $pdo->prepare('SELECT id, nome, email, admin FROM usuarios WHERE id = ?');
    $sel->execute([$id]);
    $created = $sel->fetch();
    json_response($created, 201);
}

if ($method === 'PUT') {
    // update existing user
    $auth = require_auth($pdo);
    $body = get_json_input();
    $id = $body['id'] ?? null;
    if (!$id) json_response(['error' => 'ID é obrigatório'], 400);
    // Only admin or self
    if (!$auth['admin'] && $auth['id'] != $id) json_response(['error' => 'Não autorizado'], 403);
    $fields = [];
    $params = [];
    if (isset($body['nome'])) { $fields[] = 'nome = ?'; $params[] = $body['nome']; }
    if (isset($body['email'])) { $fields[] = 'email = ?'; $params[] = $body['email']; }
    if (isset($body['senha']) && $body['senha']) { $fields[] = 'senha_hash = ?'; $params[] = password_hash($body['senha'], PASSWORD_DEFAULT); }
    if (isset($body['admin']) && $auth['admin']) { $fields[] = 'admin = ?'; $params[] = $body['admin'] ? 1 : 0; }
    if (empty($fields)) json_response(['error' => 'Nada para atualizar'], 400);
    $params[] = $id;
    $sql = 'UPDATE usuarios SET ' . implode(', ', $fields) . ' WHERE id = ?';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $sel = $pdo->prepare('SELECT id, nome, email, admin FROM usuarios WHERE id = ?');
    $sel->execute([$id]);
    json_response($sel->fetch());
}

if ($method === 'DELETE') {
    $auth = require_auth($pdo);
    if (!$auth['admin']) json_response(['error' => 'Não autorizado'], 403);
    $id = $_GET['id'] ?? null;
    if (!$id) json_response(['error' => 'ID é obrigatório'], 400);
    $stmt = $pdo->prepare('DELETE FROM usuarios WHERE id = ?');
    $stmt->execute([$id]);
    json_response(['message' => 'Excluído com sucesso']);
}

json_response(['error' => 'Method not allowed'], 405);
