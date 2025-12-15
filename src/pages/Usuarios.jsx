import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, X, User, Shield, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export default function UsuariosPage() {
  const { usuario, usuarios, setUsuarios } = useAuth();
  const navigate = useNavigate();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    cpf: '',
    telefone: '',
    cargo: '',
    dataAdmissao: '',
    jornadaDiaria: 8,
    departamento: '',
    admin: false,
    ativo: true,
    fotoPerfil: null,
  });
  const [editingId, setEditingId] = useState(null);
  const [imagemPreview, setImagemPreview] = useState(null);

  // proteção admin
  useEffect(() => {
    if (!usuario?.admin) {
      navigate('/', { replace: true });
    }
  }, [usuario, navigate]);

  // carregar usuários do backend
  useEffect(() => {
    async function carregarUsuarios() {
      try {
        const res = await fetch(`${API_URL}/api/usuarios`);
        if (!res.ok) throw new Error('Falha ao carregar usuários');
        const data = await res.json();
        setUsuarios(data);
      } catch (err) {
        console.error(err);
        console.error('ALERTA AQUI', err);
      }
    }
    if (usuario?.admin) {
      carregarUsuarios();
    }
  }, [usuario, setUsuarios]);

  if (!usuario?.admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
        <div className="bg-white max-w-md w-full mx-auto p-8 rounded-2xl shadow-2xl text-center">
          <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <X className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">❌ Acesso Negado</h1>
          <p className="text-gray-600 mb-8">Você não tem permissão para gerenciar usuários.</p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl hover:bg-blue-700 font-semibold transition-all shadow-lg"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  // submit -> salva no backend
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nome || !formData.email || !formData.cpf) {
      alert('❌ Nome, Email e CPF são obrigatórios!');
      return;
    }

    if (usuarios.find((u) => u.email === formData.email && u.id !== editingId)) {
      alert('❌ Email já cadastrado!');
      return;
    }

    // mantém senha anterior se estiver editando e campo vier vazio
    let senhaFinal = formData.senha;
    if (editingId) {
      const usuarioOriginal = usuarios.find((u) => u.id === editingId);
      if (!formData.senha) {
        senhaFinal = usuarioOriginal?.senha || '';
      }
    }

    const payload = {
      ...formData,
      senha: senhaFinal,
      jornadaDiaria: formData.jornadaDiaria,
      fotoPerfil: imagemPreview || formData.fotoPerfil,
    };

    try {
      let salvo;
      if (editingId) {
        const res = await fetch(`${API_URL}/api/usuarios/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const erroBody = await res.json().catch(() => ({}));
          throw new Error(erroBody.error || 'Erro ao atualizar usuário');
        }
        salvo = await res.json();
        setUsuarios((prev) => prev.map((u) => (u.id === editingId ? salvo : u)));
      } else {
        const res = await fetch(`${API_URL}/api/usuarios`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const erroBody = await res.json().catch(() => ({}));
          throw new Error(erroBody.error || 'Erro ao criar usuário');
        }
        salvo = await res.json();
        setUsuarios((prev) => [salvo, ...prev]);
      }

      setShowForm(false);
      setEditingId(null);
      setFormData({
        nome: '',
        email: '',
        senha: '',
        cpf: '',
        telefone: '',
        cargo: '',
        dataAdmissao: '',
        jornadaDiaria: 8,
        departamento: '',
        admin: false,
        ativo: true,
        fotoPerfil: null,
      });
      setImagemPreview(null);
      alert('✅ Usuário salvo com sucesso!');
    } catch (err) {
      console.error(err);
      alert(err.message || 'Erro ao salvar usuário');
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('❌ Foto deve ter no máximo 5MB!');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagemPreview(reader.result);
        setFormData((prev) => ({ ...prev, fotoPerfil: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const editarUsuario = (user) => {
    setFormData({
      nome: user.nome || '',
      email: user.email || '',
      senha: user.senha || '',
      cpf: user.cpf || '',
      telefone: user.telefone || '',
      cargo: user.cargo || '',
      dataAdmissao: user.dataAdmissao || '',
      jornadaDiaria: user.jornadaDiaria || 8,
      departamento: user.departamento || '',
      admin: user.admin || false,
      ativo: user.ativo !== false,
      fotoPerfil: user.fotoPerfil || null,
    });
    setImagemPreview(user.fotoPerfil || null);
    setEditingId(user.id);
    setShowForm(true);
  };

  const excluirUsuario = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este usuário?')) return;

    try {
      const res = await fetch(`${API_URL}/api/usuarios/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok && res.status !== 204) {
        const erroBody = await res.json().catch(() => ({}));
        throw new Error(erroBody.error || 'Erro ao excluir usuário');
      }
      setUsuarios((prev) => prev.filter((u) => u.id !== id));
      if (editingId === id) {
        setShowForm(false);
        setEditingId(null);
      }
      alert('✅ Usuário excluído!');
    } catch (err) {
      console.error(err);
      alert(err.message || 'Erro ao excluir usuário');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            👥 Gerenciar Usuários
          </h1>
          <p className="text-gray-600 mt-2">
            Total: <span className="font-bold text-emerald-600">{usuarios.length}</span> | Ativos:{' '}
            <span className="font-bold text-emerald-600">
              {usuarios.filter((u) => u.ativo).length}
            </span>
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setFormData({
              nome: '',
              email: '',
              senha: '',
              cpf: '',
              telefone: '',
              cargo: '',
              dataAdmissao: '',
              jornadaDiaria: 8,
              departamento: '',
              admin: false,
              ativo: true,
              fotoPerfil: null,
            });
            setImagemPreview(null);
          }}
          className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-8 py-4 rounded-2xl shadow-xl flex items-center space-x-3 font-bold transition-all transform hover:-translate-y-1"
        >
          <Plus size={24} />
          <span>Novo Usuário</span>
        </button>
      </div>

      {/* TABELA USUÁRIOS */}
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Foto
                </th>
                <th className="px-6 py-5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Email/CPF
                </th>
                <th className="px-6 py-5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Cargo/Dept
                </th>
                <th className="px-6 py-5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Jornada
                </th>
                <th className="px-6 py-5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Admin
                </th>
                <th className="px-6 py-5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {usuarios.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-all">
                  <td className="px-6 py-4">
                    {user.fotoPerfil ? (
                      <img
                        src={user.fotoPerfil}
                        alt={user.nome}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-200"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-900 max-w-xs">{user.nome}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div>{user.email}</div>
                    <div className="font-mono text-xs">{user.cpf}</div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="font-medium">{user.cargo}</div>
                    <div className="text-xs text-gray-500">{user.departamento}</div>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono">{user.jornadaDiaria}h/dia</td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={
                        user.admin
                          ? 'px-2 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700'
                          : 'px-2 py-1 rounded-full text-xs text-gray-600'
                      }
                    >
                      {user.admin ? 'Admin' : 'Usuário'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap">
                    <span
                      className={`inline-flex items-center justify-center min-w-[90px] px-4 py-2 rounded-full text-xs font-bold flex-shrink-0 ${
                        user.ativo
                          ? 'bg-emerald-100 text-emerald-800 border-2 border-emerald-200'
                          : 'bg-red-100 text-red-800 border-2 border-red-200'
                      }`}
                    >
                      {user.ativo ? '✅ Ativo' : '❌ Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => editarUsuario(user)}
                      className="text-blue-600 hover:text-blue-900 hover:bg-blue-50 p-3 rounded-xl transition-all shadow-md"
                      title="Editar"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button
                      onClick={() => excluirUsuario(user.id)}
                      className="text-red-600 hover:text-red-900 hover:bg-red-50 p-3 rounded-xl transition-all shadow-md"
                      title="Excluir"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL FORMULÁRIO */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full mx-4 shadow-2xl max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                {editingId ? '✏️ Editar Usuário' : '👤 Novo Usuário'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setFormData({
                    nome: '',
                    email: '',
                    senha: '',
                    cpf: '',
                    telefone: '',
                    cargo: '',
                    dataAdmissao: '',
                    jornadaDiaria: 8,
                    departamento: '',
                    admin: false,
                    ativo: true,
                    fotoPerfil: null,
                  });
                  setImagemPreview(null);
                }}
                className="p-3 hover:bg-gray-100 rounded-2xl transition-all shadow-lg"
              >
                <X size={28} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* COLUNA 1 */}
              <div className="space-y-6">
                {/* FOTO */}
                <div>
                  <label className="block text-lg font-bold mb-4 flex items-center space-x-2 text-gray-900">
                    <ImageIcon size={24} />
                    <span>Foto Perfil</span>
                  </label>
                  <div className="space-y-3">
                    {imagemPreview && (
                      <div className="text-center">
                        <img
                          src={imagemPreview}
                          alt="Foto atual"
                          className="w-32 h-32 mx-auto rounded-3xl object-cover shadow-xl ring-2 ring-blue-200"
                        />
                        <p className="text-xs text-gray-500 mt-1">Foto atual</p>
                      </div>
                    )}
                    <div className="w-32 h-32 mx-auto rounded-3xl border-4 border-dashed border-gray-300 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 hover:border-emerald-400 transition-all cursor-pointer group relative">
                      {imagemPreview ? (
                        <div className="text-center text-emerald-600 group-hover:text-emerald-700">
                          <ImageIcon size={32} className="mx-auto mb-2" />
                          <div className="text-sm font-medium">🔄 Trocar foto</div>
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 group-hover:text-emerald-500 transition-all">
                          <User size={32} className="mx-auto mb-2" />
                          <div className="text-sm">Adicionar foto</div>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer rounded-3xl"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-3 flex items-center space-x-2 text-gray-900">
                    👤 Nome Completo *
                  </label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full p-4 border border-gray-300 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium"
                    placeholder="Nome completo do usuario"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-3 flex items-center space-x-2 text-gray-900">
                    📧 Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-4 border border-gray-300 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium"
                    placeholder="gs@solucoesges.com.br"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-3 flex items-center space-x-2 text-gray-900">
                    🆔 CPF/CNPJ
                  </label>
                  <input
                    type="text"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                    className="w-full p-4 border border-gray-300 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-mono"
                    placeholder="123.456.789-00"
                    maxLength={18}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-3 flex items-center space-x-2 text-gray-900">
                    📱 WhatsApp/Telefone
                  </label>
                  <input
                    type="tel"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    className="w-full p-4 border border-gray-300 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-mono"
                    placeholder="(11) 99988-7766"
                  />
                </div>
              </div>

              {/* COLUNA 2 */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-3 flex items-center space-x-2 text-gray-900">
                    💼 Cargo/Função
                  </label>
                  <input
                    type="text"
                    value={formData.cargo}
                    onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                    className="w-full p-4 border border-gray-300 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium"
                    placeholder="Desenvolvedor, Analista RH, Gerente de Projetos..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-3 flex items-center space-x-2 text-gray-900">
                    🏢 Departamento/Setor
                  </label>
                  <input
                    type="text"
                    value={formData.departamento}
                    onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
                    className="w-full p-4 border border-gray-300 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium"
                    placeholder="TI, Desenvolvimento, RH, Projetos Elétricos, Obras..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-3 flex items-center space-x-2 text-gray-900">
                      📅 Data Admissão
                    </label>
                    <input
                      type="date"
                      value={formData.dataAdmissao}
                      onChange={(e) => setFormData({ ...formData, dataAdmissao: e.target.value })}
                      className="w-full p-4 border border-gray-300 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-3 flex items-center space-x-2 text-gray-900">
                      ⏰ Jornada Diária (horas)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="24"
                      step="0.5"
                      value={formData.jornadaDiaria}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          jornadaDiaria: Number(e.target.value) || 8,
                        })
                      }
                      className="w-full p-4 border border-gray-300 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-mono text-lg text-center"
                      placeholder="8"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-3 flex items-center space-x-2 text-gray-900">
                    🔐 Senha (visível para o ADM)
                  </label>
                  <input
                    type="text"
                    value={formData.senha}
                    onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                    className="w-full p-4 border border-gray-300 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-mono"
                    placeholder="senha do usuário"
                  />
                </div>

                <div className="space-y-4 p-4 bg-gray-50 rounded-2xl">
                  <label className="flex items-center p-3 bg-white rounded-xl shadow-sm border hover:border-blue-200 transition-all cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.ativo}
                      onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                      className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500 mr-3"
                    />
                    <span className="font-semibold text-gray-900">✅ Usuário Ativo</span>
                  </label>

                  <label className="flex items-center p-3 bg-white rounded-xl shadow-sm border hover:border-emerald-200 transition-all cursor-pointer">
                    <input
                      type="checkbox"
                      id="admin"
                      checked={formData.admin}
                      onChange={(e) => setFormData({ ...formData, admin: e.target.checked })}
                      className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500 mr-3"
                    />
                    <span className="font-bold text-emerald-800 flex items-center space-x-2">
                      <Shield size={18} />
                      <span>🛡️ Administrador</span>
                    </span>
                  </label>
                </div>
              </div>
            </form>

            <div className="flex space-x-4 pt-8 border-t mt-8">
              <button
                type="submit"
                onClick={handleSubmit}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white py-5 px-8 rounded-2xl shadow-xl font-bold text-lg flex items-center justify-center space-x-3 transition-all transform hover:-translate-y-1"
              >
                <Plus size={24} />
                <span>{editingId ? '✏️ Atualizar Usuário' : '👤 Criar Usuário'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setFormData({
                    nome: '',
                    email: '',
                    senha: '',
                    cpf: '',
                    telefone: '',
                    cargo: '',
                    dataAdmissao: '',
                    jornadaDiaria: 8,
                    departamento: '',
                    admin: false,
                    ativo: true,
                    fotoPerfil: null,
                  });
                  setImagemPreview(null);
                }}
                className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white py-5 px-8 rounded-2xl font-bold text-lg shadow-xl transition-all"
              >
                ❌ Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
