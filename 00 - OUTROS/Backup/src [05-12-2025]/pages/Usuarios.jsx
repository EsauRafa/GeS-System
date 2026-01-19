import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

export default function UsuariosPage() {
  const { usuario, usuarios, setUsuarios } = useAuth();
  const navigate = useNavigate();
  
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    admin: false
  });
  const [editingId, setEditingId] = useState(null);

  // 🔒 PROTEÇÃO TOTAL - BLOQUEIA URL DIRETA
  useEffect(() => {
    if (!usuario?.admin) {
      navigate('/', { replace: true });
      return;
    }
  }, [usuario, navigate]);

  // ❌ PÁGINA DE ACESSO NEGADO (caso chegue aqui)
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

  // ✅ CÓDIGO ADMIN - SÓ EXECUTA SE FOR ADMIN
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (editingId) {
      // EDITAR USUÁRIO
      const novosUsuarios = usuarios.map(u => 
        u.id === editingId ? { ...u, ...formData } : u
      );
      setUsuarios(novosUsuarios);
    } else {
      // NOVO USUÁRIO
      if (usuarios.find(u => u.email === formData.email)) {
        alert('❌ Email já cadastrado!');
        return;
      }
      const novoUsuario = {
        id: Date.now(),
        ...formData
      };
      setUsuarios([...usuarios, novoUsuario]);
    }
    
    // RESET FORM
    setShowForm(false);
    setEditingId(null);
    setFormData({ nome: '', email: '', senha: '', admin: false });
    alert('✅ Usuário salvo com sucesso!');
  };

  const editarUsuario = (usuario) => {
    setFormData({
      nome: usuario.nome,
      email: usuario.email,
      senha: usuario.senha,
      admin: usuario.admin
    });
    setEditingId(usuario.id);
    setShowForm(true);
  };

  const excluirUsuario = (id) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
      setUsuarios(usuarios.filter(u => u.id !== id));
      if (editingId === id) {
        setShowForm(false);
        setEditingId(null);
      }
      alert('✅ Usuário excluído!');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciar Usuários</h1>
          <p className="text-gray-600 mt-1">Total: <span className="font-semibold">{usuarios.length}</span> usuário(s)</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setFormData({ nome: '', email: '', senha: '', admin: false });
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl shadow-lg flex items-center space-x-2 font-semibold transition-all"
        >
          <Plus size={20} />
          <span>Novo Usuário</span>
        </button>
      </div>

      {/* TABELA DE USUÁRIOS */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Nome</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {usuarios.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{user.nome}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      user.admin 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                        : 'bg-gray-100 text-gray-800 border border-gray-200'
                    }`}>
                      {user.admin ? '🛡️ Admin' : '👤 Usuário'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => editarUsuario(user)}
                      className="text-blue-600 hover:text-blue-900 hover:bg-blue-50 p-2 rounded-lg transition-all"
                      title="Editar usuário"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => excluirUsuario(user.id)}
                      className="text-red-600 hover:text-red-900 hover:bg-red-50 p-2 rounded-lg transition-all"
                      title="Excluir usuário"
                    >
                      <Trash2 size={16} />
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
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingId ? 'Editar Usuário' : 'Novo Usuário'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setFormData({ nome: '', email: '', senha: '', admin: false });
                }}
                className="p-2 hover:bg-gray-100 rounded-xl transition-all"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Digite o nome completo"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="usuario@empresa.com"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Senha</label>
                <input
                  type="password"
                  value={formData.senha}
                  onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                  className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
              
              <div className="flex items-center p-4 bg-gray-50 rounded-xl">
                <input
                  type="checkbox"
                  id="admin"
                  checked={formData.admin}
                  onChange={(e) => setFormData({ ...formData, admin: e.target.checked })}
                  className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <label htmlFor="admin" className="ml-3 text-sm font-semibold text-gray-900 cursor-pointer select-none">
                  🛡️ Tornar Administrador
                </label>
              </div>
              
              <div className="flex space-x-4 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-4 px-6 rounded-xl shadow-lg font-semibold text-lg transition-all flex items-center justify-center space-x-2"
                >
                  <Plus size={20} />
                  <span>{editingId ? 'Atualizar Usuário' : 'Criar Usuário'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData({ nome: '', email: '', senha: '', admin: false });
                  }}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-4 px-6 rounded-xl font-semibold text-lg transition-all"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
