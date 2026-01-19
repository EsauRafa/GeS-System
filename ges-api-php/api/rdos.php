<?php
// api/rdos.php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $usuario_id = $_GET['usuario_id'] ?? null;
    $admin = null;
    $params = [];
    $sql = 'SELECT * FROM rdos';
    if (isset($_GET['admin']) && $_GET['admin']) {
        // if admin param present, we'll rely on token to authorize
        $auth = require_auth($pdo);
        $admin = $auth['admin'];
    }
    if (!$admin) {
        if ($usuario_id) {
            $sql .= ' WHERE usuario_id = ?';
            $params[] = $usuario_id;
        }
    }
    $sql .= ' ORDER BY data DESC, id DESC';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();
    json_response($rows);
}

if ($method === 'POST') {
    $auth = require_auth($pdo);
    $b = get_json_input();
    $b['usuario_id'] = $auth['id'];
    $b['usuario_nome'] = $b['usuario_nome'] ?? $auth['nome'];

    $stmt = $pdo->prepare(
        'INSERT INTO rdos (data, projeto_id, natureza_servico, horarios, descricao_diaria, usuario_id, usuario_nome, projeto_nome, projeto_cliente, horas_extras, horas_noturnas, horas_normais_por_dia) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $b['data'] ?? date('Y-m-d'),
        $b['projeto_id'] ?? null,
        $b['natureza_servico'] ?? null,
        isset($b['horarios']) ? json_encode($b['horarios'], JSON_UNESCAPED_UNICODE) : null,
        $b['descricao_diaria'] ?? null,
        $b['usuario_id'],
        $b['usuario_nome'] ?? null,
        $b['projeto_nome'] ?? null,
        $b['projeto_cliente'] ?? null,
        floatval($b['horas_extras'] ?? 0),
        floatval($b['horas_noturnas'] ?? 0),
        floatval($b['horas_normais_por_dia'] ?? 8)
    ]);
    $id = $pdo->lastInsertId();
    $sel = $pdo->prepare('SELECT * FROM rdos WHERE id = ?');
    $sel->execute([$id]);
    json_response($sel->fetch(), 201);
}

if ($method === 'PUT') {
    $auth = require_auth($pdo);
    $b = get_json_input();
    $id = $b['id'] ?? null;
    if (!$id) json_response(['error' => 'ID obrigatório'], 400);
    // only admin or owner
    $sel = $pdo->prepare('SELECT usuario_id FROM rdos WHERE id = ?');
    $sel->execute([$id]);
    $row = $sel->fetch();
    if (!$row) json_response(['error' => 'RDO não encontrado'], 404);
    if (!$auth['admin'] && $auth['id'] != $row['usuario_id']) json_response(['error' => 'Não autorizado'], 403);

    $fields = [];
    $params = [];
    $possible = ['data','projeto_id','natureza_servico','horarios','descricao_diaria','projeto_nome','projeto_cliente','horas_extras','horas_noturnas','horas_normais_por_dia'];
    foreach ($possible as $f) {
        if (isset($b[$f])) {
            if ($f === 'horarios') $fields[] = "$f = ?" , $params[] = json_encode($b[$f], JSON_UNESCAPED_UNICODE);
            else { $fields[] = "$f = ?"; $params[] = $b[$f]; }
        }
    }
    if (empty($fields)) json_response(['error' => 'Nada para atualizar'], 400);
    $params[] = $id;
    $sql = 'UPDATE rdos SET ' . implode(', ', $fields) . ' WHERE id = ?';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $sel = $pdo->prepare('SELECT * FROM rdos WHERE id = ?');
    $sel->execute([$id]);
    json_response($sel->fetch());
}

if ($method === 'DELETE') {
    $auth = require_auth($pdo);
    $id = $_GET['id'] ?? null;
    if (!$id) json_response(['error' => 'ID é obrigatório'], 400);
    // check owner or admin
    $sel = $pdo->prepare('SELECT usuario_id FROM rdos WHERE id = ?');
    $sel->execute([$id]);
    $row = $sel->fetch();
    if (!$row) json_response(['error' => 'RDO não encontrado'], 404);
    if (!$auth['admin'] && $auth['id'] != $row['usuario_id']) json_response(['error' => 'Não autorizado'], 403);
    $stmt = $pdo->prepare('DELETE FROM rdos WHERE id = ?');
    $stmt->execute([$id]);
    json_response(['message' => 'Excluído com sucesso']);
}

json_response(['error' => 'Method not allowed'], 405);
