-- Schema MySQL para G&S (adaptado do backend Node)
-- Importar via phpMyAdmin ou mysql client

CREATE DATABASE IF NOT EXISTS gs_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gs_db;

-- Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  senha_hash VARCHAR(255) NOT NULL,
  cpf VARCHAR(32) DEFAULT NULL,
  telefone VARCHAR(64) DEFAULT NULL,
  cargo VARCHAR(128) DEFAULT NULL,
  data_admissao DATE DEFAULT NULL,
  jornada_diaria FLOAT DEFAULT 8,
  departamento VARCHAR(128) DEFAULT NULL,
  admin TINYINT(1) DEFAULT 0,
  ativo TINYINT(1) DEFAULT 1,
  foto_perfil TEXT DEFAULT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Projetos
CREATE TABLE IF NOT EXISTS projetos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  cliente VARCHAR(255) NOT NULL,
  codigo VARCHAR(64) DEFAULT NULL,
  valor_hora DECIMAL(12,2) DEFAULT 0,
  horas_normais INT DEFAULT 8,
  ativo TINYINT(1) DEFAULT 1,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- RDOs
CREATE TABLE IF NOT EXISTS rdos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  data DATE NOT NULL,
  projeto_id INT DEFAULT NULL,
  natureza_servico VARCHAR(255) DEFAULT NULL,
  horarios JSON DEFAULT NULL,
  descricao_diaria TEXT DEFAULT NULL,
  usuario_id INT NOT NULL,
  usuario_nome VARCHAR(255) DEFAULT NULL,
  projeto_nome VARCHAR(255) DEFAULT NULL,
  projeto_cliente VARCHAR(255) DEFAULT NULL,
  horas_extras FLOAT DEFAULT 0,
  horas_noturnas FLOAT DEFAULT 0,
  horas_normais_por_dia FLOAT DEFAULT 8,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (projeto_id) REFERENCES projetos(id) ON DELETE SET NULL,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Índices úteis
CREATE INDEX idx_rdos_data ON rdos(data);
CREATE INDEX idx_rdos_usuario ON rdos(usuario_id);

-- Opcional: usuário admin inicial (senha não preenchida)
-- Use o script PHP `set_admin_password.php` para definir a senha segura do admin
INSERT INTO usuarios (nome, email, admin, ativo, senha_hash)
VALUES ('Administrador', 'admin@exemplo.com', 1, 1, '');

-- Fim do schema
