import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit3, Trash2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export default function Projetos() {
  const [projetos, setProjetos] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    cliente: '',
    codigo: '',
    valorHora: '',
    horasNormais: '8',
  });
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    async function carregar() {
      try {
        setCarregando(true);
        setErro('');
        const res = await fetch(`${API_URL}/api/projetos`);
        if (!res.ok) throw new Error('Falha ao carregar projetos');
        const data = await res.json();
        setProjetos(data);
      } catch (err) {
        console.error(err);
        setErro('Erro ao carregar projetos');
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  const projetosOrdenados = useMemo(
    () => [...projetos].sort((a, b) => a.nome.localeCompare(b.nome)),
    [projetos]
  );

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');

    if (!formData.nome.trim() || !formData.cliente.trim()) {
      alert('Nome e Cliente são obrigatórios!');
      return;
    }

    const body = {
      nome: formData.nome.trim(),
      cliente: formData.cliente.trim(),
      codigo: formData.codigo || '',
      valorHora: Number(formData.valorHora) || 0,
      horasNormais: Number(formData.horasNormais) || 8,
    };

    try {
      if (editingId) {
        const res = await fetch(`${API_URL}/api/projetos/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const erroBody = await res.json().catch(() => ({}));
          throw new Error(erroBody.error || 'Erro ao atualizar projeto');
        }
        const atualizado = await res.json();
        setProjetos((prev) => prev.map((p) => (p.id === editingId ? atualizado : p)));
        setEditingId(null);
      } else {
        const res = await fetch(`${API_URL}/api/projetos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const erroBody = await res.json().catch(() => ({}));
          throw new Error(erroBody.error || 'Erro ao criar projeto');
        }
        const criado = await res.json();
        setProjetos((prev) => [...prev, criado]);
      }

      setFormData({
        nome: '',
        cliente: '',
        codigo: '',
        valorHora: '',
        horasNormais: '8',
      });
      setShowForm(false);
    } catch (err) {
      console.error(err);
      setErro(err.message || 'Erro ao salvar projeto');
    }
  }

  const editProjeto = (projeto) => {
    setFormData({
      nome: projeto.nome,
      cliente: projeto.cliente,
      codigo: projeto.codigo || '',
      valorHora:
        projeto.valorHora !== undefined && projeto.valorHora !== null
          ? String(projeto.valorHora)
          : '',
      horasNormais:
        projeto.horasNormais !== undefined && projeto.horasNormais !== null
          ? String(projeto.horasNormais)
          : '8',
    });
    setEditingId(projeto.id);
    setShowForm(true);
  };

  async function deleteProjeto(id) {
    if (!window.confirm('Excluir este projeto?')) return;
    try {
      const res = await fetch(`${API_URL}/api/projetos/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok && res.status !== 204) {
        const erroBody = await res.json().catch(() => ({}));
        throw new Error(erroBody.error || 'Erro ao excluir projeto');
      }
      setProjetos((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
      setErro(err.message || 'Erro ao excluir projeto');
    }
  }

  function fecharForm() {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      nome: '',
      cliente: '',
      codigo: '',
      valorHora: '',
      horasNormais: '8',
    });
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Cadastro de Projetos</h1>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
          }}
          className="bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg hover:bg-green-700 flex items-center space-x-2 font-semibold transition-all"
        >
          <Plus size={20} />
          <span>Novo Projeto</span>
        </button>
      </div>

      {erro && <div className="mb-4 bg-red-100 text-red-700 px-4 py-2 rounded">{erro}</div>}

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Projetos Cadastrados</h2>
            <span className="text-sm bg-emerald-400 px-3 py-1 rounded-full">
              {projetosOrdenados.length} projetos
            </span>
          </div>
        </div>

        {carregando ? (
          <div className="p-12 text-center">Carregando projetos...</div>
        ) : projetosOrdenados.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-4 text-gray-300">📋</div>
            <h3 className="text-xl font-bold text-gray-600 mb-2">Nenhum projeto cadastrado</h3>
            <p className="text-gray-500">Clique em &quot;Novo Projeto&quot; para começar</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase text-gray-600">
                    Nome
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase text-gray-600">
                    Cliente
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase text-gray-600">
                    Código
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase text-gray-600">
                    Valor Hora
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase text-gray-600">
                    Hrs Normais
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase text-gray-600">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {projetosOrdenados.map((projeto) => (
                  <tr key={projeto.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-semibold text-gray-900">{projeto.nome}</td>
                    <td className="px-6 py-4 text-gray-700">{projeto.cliente}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{projeto.codigo || '-'}</td>
                    <td className="px-6 py-4 font-medium text-emerald-700">
                      {projeto.valorHora != null
                        ? `R$ ${Number(projeto.valorHora).toFixed(2)}`
                        : '-'}
                    </td>
                    <td className="px-6 py-4 font-medium text-orange-600">
                      {projeto.horasNormais}h/dia
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => editProjeto(projeto)}
                        className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition-all"
                        title="Editar"
                        aria-label="Editar projeto"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => deleteProjeto(projeto.id)}
                        className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-all"
                        title="Excluir"
                        aria-label="Excluir projeto"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-bold mb-6">
              {editingId ? 'Editar Projeto' : 'Novo Projeto'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código (opcional)
                </label>
                <input
                  name="codigo"
                  value={formData.codigo}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="0001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Projeto *
                </label>
                <input
                  name="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  required
                  placeholder="SE PECEM"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cliente *</label>
                <input
                  name="cliente"
                  value={formData.cliente}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  required
                  placeholder="WEG"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  💰 Valor por Hora (R$)
                </label>
                <input
                  name="valorHora"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="55.00"
                  value={formData.valorHora}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ⏰ Horas Normais/Dia
                </label>
                <input
                  name="horasNormais"
                  type="number"
                  step="0.5"
                  min="1"
                  max="24"
                  placeholder="8"
                  value={formData.horasNormais}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                />
                <p className="text-xs text-gray-500 mt-1">Para cálculo de Horas Extras (HE)</p>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-3 px-6 rounded-xl font-semibold hover:from-emerald-700 hover:to-emerald-800 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <span>{editingId ? 'Atualizar' : 'Cadastrar'}</span>
                </button>
                <button
                  type="button"
                  onClick={fecharForm}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
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
