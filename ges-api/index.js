import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db from './db.js';

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '5mb' })); // Aumentado para suportar foto de perfil em Base64

const DB_CLIENT = db.DB_CLIENT;

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token missing' });
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token missing' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

// Health Check
app.get('/api/health', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW() as now');
    res.json({ ok: true, server: 'G&S API Online', dbTime: result.rows[0]?.now || null, dbClient: DB_CLIENT });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Database Connection Error' });
  }
});

// ==========================================
// 🏗️ MÓDULO: PROJETOS
// ==========================================

app.get('/api/projetos', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, nome, cliente, codigo, valor_hora AS "valorHora", horas_normais AS "horasNormais", ativo, criado_em FROM projetos ORDER BY nome'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar projetos' });
  }
});

app.post('/api/projetos', async (req, res) => {
  const { nome, cliente, codigo, valorHora, horasNormais } = req.body;
  if (!nome || !cliente) return res.status(400).json({ error: 'Campos obrigatórios faltando' });

  try {
    if (DB_CLIENT === 'mysql') {
      const insert = await db.query(
        'INSERT INTO projetos (nome, cliente, codigo, valor_hora, horas_normais) VALUES ($1, $2, $3, $4, $5)',
        [nome.trim(), cliente.trim(), codigo, Number(valorHora) || 0, Number(horasNormais) || 8]
      );
      const id = insert.insertId;
      const sel = await db.query('SELECT id, nome, cliente, codigo, valor_hora AS "valorHora", horas_normais AS "horasNormais", ativo, criado_em FROM projetos WHERE id = $1', [id]);
      res.status(201).json(sel.rows[0]);
    } else {
      const result = await db.query(
        `INSERT INTO projetos (nome, cliente, codigo, valor_hora, horas_normais) 
         VALUES ($1, $2, $3, $4, $5) RETURNING id, nome`,
        [nome.trim(), cliente.trim(), codigo, Number(valorHora) || 0, Number(horasNormais) || 8]
      );
      res.status(201).json(result.rows[0]);
    }
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar projeto' });
  }
});

// ==========================================
// 👥 MÓDULO: USUÁRIOS
// ==========================================

app.get('/api/usuarios', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, nome, email, cpf, telefone, cargo, data_admissao AS "dataAdmissao", 
       jornada_diaria AS "jornadaDiaria", departamento, admin, ativo, foto_perfil AS "fotoPerfil" 
       FROM usuarios ORDER BY nome`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar usuários' });
  }
});

app.post('/api/usuarios', async (req, res) => {
  const { nome, email, senha, admin } = req.body;
  if (!nome || !email || !senha) return res.status(400).json({ error: 'Dados insuficientes' });

  try {
    const hashed = await bcrypt.hash(senha, 10);
    if (DB_CLIENT === 'mysql') {
      const insert = await db.query(
        `INSERT INTO usuarios (nome, email, senha_hash, admin, ativo) VALUES ($1, $2, $3, $4, true)`,
        [nome.trim(), email.trim(), hashed, !!admin]
      );
      const id = insert.insertId;
      const sel = await db.query('SELECT id, nome, email, admin FROM usuarios WHERE id = $1', [id]);
      res.status(201).json(sel.rows[0]);
    } else {
      const result = await db.query(
        `INSERT INTO usuarios (nome, email, senha_hash, admin, ativo) 
         VALUES ($1, $2, $3, $4, true) RETURNING id, nome, email, admin`,
        [nome.trim(), email.trim(), hashed, !!admin]
      );
      res.status(201).json(result.rows[0]);
    }
  } catch (err) {
    // Postgres unique violation
    if (err.code === '23505') return res.status(400).json({ error: 'Email ou CPF já cadastrado' });
    res.status(500).json({ error: 'Erro interno' });
  }
});

// ==========================================
// 📝 MÓDULO: RDO (Relatório Diário de Obra)
// ==========================================

app.get('/api/rdos', authenticate, async (req, res) => {
  try {
    const usuario_id = req.query.usuario_id;
    let query = 'SELECT * FROM rdos';
    let params = [];

    if (!req.user.admin) {
      query += ' WHERE usuario_id = $1';
      params = [req.user.id];
    } else if (usuario_id) {
      query += ' WHERE usuario_id = $1';
      params = [usuario_id];
    }

    query += ' ORDER BY data DESC, id DESC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar RDOs' });
  }
});

app.post('/api/rdos', authenticate, async (req, res) => {
  try {
    const b = req.body;
    // always set usuario_id from token
    b.usuario_id = req.user.id;
    b.usuario_nome = b.usuario_nome || req.user.nome || '';

    if (DB_CLIENT === 'mysql') {
      const insert = await db.query(
        `INSERT INTO rdos (
          data, projeto_id, natureza_servico, horarios, descricao_diaria,
          usuario_id, usuario_nome, projeto_nome, projeto_cliente,
          horas_extras, horas_noturnas, horas_normais_por_dia
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          b.data, b.projeto_id, b.natureza_servico, JSON.stringify(b.horarios || []),
          b.descricao_diaria, b.usuario_id, b.usuario_nome, b.projeto_nome,
          b.projeto_cliente, Number(b.horas_extras) || 0, 
          Number(b.horas_noturnas) || 0, Number(b.horas_normais_por_dia) || 8
        ]
      );
      const id = insert.insertId;
      const sel = await db.query('SELECT * FROM rdos WHERE id = $1', [id]);
      res.status(201).json(sel.rows[0]);
    } else {
      const result = await db.query(
        `INSERT INTO rdos (
          data, projeto_id, natureza_servico, horarios, descricao_diaria,
          usuario_id, usuario_nome, projeto_nome, projeto_cliente,
          horas_extras, horas_noturnas, horas_normais_por_dia
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
        [
          b.data, b.projeto_id, b.natureza_servico, JSON.stringify(b.horarios || []),
          b.descricao_diaria, b.usuario_id, b.usuario_nome, b.projeto_nome,
          b.projeto_cliente, Number(b.horas_extras) || 0, 
          Number(b.horas_noturnas) || 0, Number(b.horas_normais_por_dia) || 8
        ]
      );
      res.status(201).json(result.rows[0]);
    }
  } catch (err) {
    console.error('Erro RDO:', err);
    res.status(500).json({ error: 'Falha ao salvar RDO' });
  }
});

app.delete('/api/rdos/:id', authenticate, async (req, res) => {
  try {
    // only allow deletion if admin OR owner
    const { id } = req.params;
    const sel = await db.query('SELECT usuario_id FROM rdos WHERE id = $1', [id]);
    const row = sel.rows[0];
    if (!row) return res.status(404).json({ error: 'RDO não encontrado' });
    if (!req.user.admin && String(row.usuario_id) !== String(req.user.id)) {
      return res.status(403).json({ error: 'Não autorizado' });
    }

    if (DB_CLIENT === 'mysql') {
      await db.query('DELETE FROM rdos WHERE id = $1', [id]);
    } else {
      const del = await db.query('DELETE FROM rdos WHERE id = $1 RETURNING id', [id]);
      if (del.rowCount === 0) return res.status(404).json({ error: 'RDO não encontrado' });
    }

    res.json({ message: 'Excluído com sucesso' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir' });
  }
});

// 🔐 ROTA DE LOGIN
app.post('/api/login', async (req, res) => {
  const { email, senha } = req.body;
  try {
    if (!email || !senha) return res.status(400).json({ error: 'Dados insuficientes' });

    const result = await db.query('SELECT id, nome, email, admin, cargo, foto_perfil AS "fotoPerfil", senha_hash FROM usuarios WHERE email = $1 AND ativo = true', [email.trim()]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'E-mail ou senha incorretos' });

    const match = await bcrypt.compare(senha, user.senha_hash || '');
    if (!match) return res.status(401).json({ error: 'E-mail ou senha incorretos' });

    const token = jwt.sign({ id: user.id, admin: !!user.admin, nome: user.nome }, process.env.JWT_SECRET, { expiresIn: '8h' });
    const safeUser = { id: user.id, nome: user.nome, email: user.email, admin: !!user.admin };
    res.json({ token, user: safeUser });
  } catch (err) {
    console.error('Erro no Login:', err);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});



// Inicialização
const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
  🚀 Servidor G&S Rodando!
  📡 Porta: ${PORT}
  🔗 Local: http://localhost:${PORT}
  🌐 Rede: http://192.168.2.138:${PORT}
  `);
});