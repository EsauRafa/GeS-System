<?php
// api/projetos.php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->query('SELECT id, nome, cliente, codigo, valor_hora AS valorHora, horas_normais AS horasNormais, ativo, criado_em FROM projetos ORDER BY nome');
    json_response($stmt->fetchAll());
}

if ($method === 'POST') {
    $auth = require_auth($pdo);
    // require admin
    if (!$auth['admin']) json_response(['error' => 'Não autorizado'], 403);
    $body = get_json_input();
    $nome = trim($body['nome'] ?? '');
    $cliente = trim($body['cliente'] ?? '');
    $codigo = $body['codigo'] ?? null;
    $valorHora = floatval($body['valorHora'] ?? 0);
    $horasNormais = intval($body['horasNormais'] ?? 8);
    if (!$nome || !$cliente) json_response(['error' => 'Campos obrigatórios faltando'], 400);
    $stmt = $pdo->prepare('INSERT INTO projetos (nome, cliente, codigo, valor_hora, horas_normais) VALUES (?, ?, ?, ?, ?)');
    $stmt->execute([$nome, $cliente, $codigo, $valorHora, $horasNormais]);
    $id = $pdo->lastInsertId();
    $sel = $pdo->prepare('SELECT id, nome, cliente, codigo, valor_hora AS valorHora, horas_normais AS horasNormais, ativo, criado_em FROM projetos WHERE id = ?');
    $sel->execute([$id]);
    json_response($sel->fetch(), 201);
}

if ($method === 'PUT') {
    $auth = require_auth($pdo);
    if (!$auth['admin']) json_response(['error' => 'Não autorizado'], 403);
    $body = get_json_input();
    $id = $body['id'] ?? null;
    if (!$id) json_response(['error' => 'ID é obrigatório'], 400);
    $fields = [];
    $params = [];
    if (isset($body['nome'])) { $fields[] = 'nome = ?'; $params[] = $body['nome']; }
    if (isset($body['cliente'])) { $fields[] = 'cliente = ?'; $params[] = $body['cliente']; }
    if (isset($body['codigo'])) { $fields[] = 'codigo = ?'; $params[] = $body['codigo']; }
    if (isset($body['valorHora'])) { $fields[] = 'valor_hora = ?'; $params[] = floatval($body['valorHora']); }
    if (isset($body['horasNormais'])) { $fields[] = 'horas_normais = ?'; $params[] = intval($body['horasNormais']); }
    if (empty($fields)) json_response(['error' => 'Nada para atualizar'], 400);
    $params[] = $id;
    $sql = 'UPDATE projetos SET ' . implode(', ', $fields) . ' WHERE id = ?';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $sel = $pdo->prepare('SELECT id, nome, cliente, codigo, valor_hora AS valorHora, horas_normais AS horasNormais, ativo, criado_em FROM projetos WHERE id = ?');
    $sel->execute([$id]);
    json_response($sel->fetch());
}

if ($method === 'DELETE') {
    $auth = require_auth($pdo);
    if (!$auth['admin']) json_response(['error' => 'Não autorizado'], 403);
    $id = $_GET['id'] ?? null;
    if (!$id) json_response(['error' => 'ID é obrigatório'], 400);
    $stmt = $pdo->prepare('DELETE FROM projetos WHERE id = ?');
    $stmt->execute([$id]);
    json_response(['message' => 'Excluído com sucesso']);
}

json_response(['error' => 'Method not allowed'], 405);
