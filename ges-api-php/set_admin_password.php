<?php
// Script para definir senha do administrador via CLI/php (execute uma vez)
require_once __DIR__ . '/db.php';

$email = $argv[1] ?? null;
$senha = $argv[2] ?? null;
if (!$email || !$senha) {
    echo "Uso: php set_admin_password.php admin@exemplo.com novaSenha\n";
    exit(1);
}
$hash = password_hash($senha, PASSWORD_DEFAULT);
$stmt = $pdo->prepare('UPDATE usuarios SET senha_hash = ? WHERE email = ? AND admin = 1');
$stmt->execute([$hash, $email]);
if ($stmt->rowCount()) echo "Senha atualizada com sucesso\n"; else echo "Administrador não encontrado (verifique email)\n";
