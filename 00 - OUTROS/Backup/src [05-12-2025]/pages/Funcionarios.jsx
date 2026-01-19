import React, { useState } from "react";
import { Plus, Trash2, Edit3 } from "lucide-react";

function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = React.useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  React.useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch {}
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}

export default function Funcionarios() {
  const [funcionarios, setFuncionarios] = useLocalStorage("funcionarios", []);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nome: "",
    cargo: "",
    status: "ativo",
    email: "",
    telefone: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.nome || !formData.email) {
      alert("Nome e Email são obrigatórios");
      return;
    }
    const funcionarioData = {
      ...formData,
      id: editingId || Date.now()
    };
    if (editingId) {
      setFuncionarios(funcionarios.map(f => (f.id === editingId ? funcionarioData : f)));
      setEditingId(null);
    } else {
      setFuncionarios([funcionarioData, ...funcionarios]);
    }
    setShowForm(false);
    setFormData({ nome: "", cargo: "", status: "ativo", email: "", telefone: "" });
  };

  const handleEdit = (func) => {
    setFormData({
      nome: func.nome,
      cargo: func.cargo,
      status: func.status,
      email: func.email,
      telefone: func.telefone
    });
    setEditingId(func.id);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Deseja realmente excluir este funcionário?")) {
      setFuncionarios(funcionarios.filter(f => f.id !== id));
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Funcionários</h1>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({ nome: "", cargo: "", status: "ativo", email: "", telefone: "" });
            setShowForm(true);
          }}
          className="bg-purple-600 text-white px-6 py-2 rounded-lg shadow-lg hover:bg-purple-700 flex items-center space-x-2"
        >
          <Plus size={20} /> <span>Novo Funcionário</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Cargo</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Telefone</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {funcionarios.map((func) => (
              <tr key={func.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{func.nome}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{func.cargo}</td>
                <td>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${func.status === "ativo" ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-800"}`}>
                    {func.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{func.email}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{func.telefone}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button onClick={() => handleEdit(func)} className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50" title="Editar">
                    <Edit3 size={18} />
                  </button>
                  <button onClick={() => handleDelete(func.id)} className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50" title="Excluir">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {funcionarios.length === 0 && (
              <tr>
                <td colSpan="6" className="py-12 text-center text-gray-500">
                  Nenhum funcionário cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">Novo Funcionário</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome *</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cargo</label>
                <input
                  type="text"
                  value={formData.cargo}
                  onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                <input
                  type="tel"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="submit" className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700">
                  {editingId ? "Atualizar Funcionário" : "Salvar Funcionário"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData({ nome: "", cargo: "", status: "ativo", email: "", telefone: "" });
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300"
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
