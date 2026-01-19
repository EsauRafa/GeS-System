import React, { useState, useMemo } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useAuth } from "../contexts/AuthContext.jsx";
import { Plus, Trash2, Save, Clock, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function RDOs() {
  const { usuario } = useAuth();
  const [rdos, setRdos] = useLocalStorage("rdos", []);
  const [projetos] = useLocalStorage("projetos", []);
  const [usuarios] = useLocalStorage("usuarios", []);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const hoje = new Date();
  const daqui7dias = new Date();
  daqui7dias.setDate(hoje.getDate() + 14);

  const [filtros, setFiltros] = useState({
    dataInicio: format(hoje, "yyyy-MM-01"),
    dataFim: format(daqui7dias, "yyyy-MM-dd"),
    projetoId: "",
    funcionarioId: ""
  });

  

  const [formData, setFormData] = useState({
    data: format(new Date(), "yyyy-MM-dd"),
    projeto_id: "",
    naturezaServico: "HOME OFFICE",
    horarios: [
      { hora_inicio: "", hora_fim: "", titulo: "", atividade: "Deslocamento" }
    ],
    descricaoDiaria: ""
  });

  // helper para não ter bug de timezone
  const parseLocalDate = (yyyyMmDd) => {
    if (!yyyyMmDd) return null;
    const [y, m, d] = yyyyMmDd.split("-").map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  }; // [web:43][web:39]

  if (!usuario) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl font-semibold text-gray-600">Carregando...</div>
      </div>
    );
  }

  const isAdmin = !!usuario.admin;

  const rdosBase = useMemo(() => {
    if (isAdmin) return rdos;
    return rdos.filter((rdo) => rdo.usuario_id === usuario.id);
  }, [isAdmin, rdos, usuario.id]);

  const rdosFiltrados = useMemo(() => {
    const inicioDate = parseLocalDate(filtros.dataInicio);
    const fimDate = parseLocalDate(filtros.dataFim);

    return rdosBase.filter((rdo) => {
      const dataRDODate = parseLocalDate(rdo.data);
      if (!dataRDODate || !inicioDate || !fimDate) return false;

      const dataRDO = dataRDODate.getTime();
      const inicio = inicioDate.getTime();
      const fim = new Date(
        fimDate.getFullYear(),
        fimDate.getMonth(),
        fimDate.getDate(),
        23, 59, 59, 999
      ).getTime();

      if (dataRDO < inicio || dataRDO > fim) return false;

      if (filtros.projetoId && String(rdo.projeto_id) !== String(filtros.projetoId)) {
        return false;
      }

      if (
        isAdmin &&
        filtros.funcionarioId &&
        String(rdo.usuario_id) !== String(filtros.funcionarioId)
      ) {
        return false;
      }

      return true;
    });
  }, [rdosBase, filtros, isAdmin]);

  const funcionariosUnicos = useMemo(() => {
    if (!isAdmin) return [];
    const mapa = new Map();
    rdos.forEach((r) => {
      if (!mapa.has(r.usuario_id)) {
        mapa.set(r.usuario_id, { id: r.usuario_id, nome: r.usuario_nome });
      }
    });
    return Array.from(mapa.values()).sort((a, b) =>
      String(a.nome || "").localeCompare(String(b.nome || ""))
    );
  }, [isAdmin, rdos]);

  const atividades = [
    "Deslocamento", "Documentação", "Erro de Montagem", "Erro de Projeto",
    "Falha de Produto", "Falta Infraestrutura", "Faltam Informações do Cliente",
    "Faltam Materiais", "Faltam Painéis", "Faltam Recursos Externos",
    "Teste Supervisão", "Imposs. Trab. Dev. Clima", "Infraestrutura",
    "Modif. Solicit. p/ Cliente", "Outros (especifique)", "Parametrização",
    "Problemas de Plataforma", "Reprogamação de Atividades", "Reunião",
    "Suporte", "Teste Controle", "Teste Proteção", "Teste Funcional",
    "Treinamento", "Segurança do Trabalho", "Retrabalho", "Ociosidade",
    "Trabalho interno"
  ];

  const naturezasServico = ["CAMPO", "PLATAFORMA", "TREINAMENTO", "ESCRITÓRIO", "HOME OFFICE"];

  const toMinutes = (time) => {
    if (!time || time === "") return 0;
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };

  const calcularDuracao = (inicio, fim) => {
    if (!inicio || !fim) return 0;
    let startMin = toMinutes(inicio);
    let endMin = toMinutes(fim);
    if (endMin <= startMin) endMin += 24 * 60;
    return (endMin - startMin) / 60;
  };

  const calcularHorasNoturnas = (inicio, fim) => {
    const horaParaMinutos = (horaStr) => {
      if (!horaStr) return 0;
      const [h, m] = horaStr.split(":").map(Number);
      return h * 60 + m;
    };

    const inicioM = horaParaMinutos(inicio);
    const fimM = horaParaMinutos(fim);
    let total = 0;
    const noturnoInicio1 = 1320; // 22:00
    const noturnoFim1 = 1440; // 24:00
    const noturnoInicio2 = 0; // 00:00
    const noturnoFim2 = 360; // 06:00
    const fimAjustado = fimM >= inicioM ? fimM : fimM + 1440;

    const intervaloSobreposto = (start1, end1, start2, end2) => {
      const startMax = Math.max(start1, start2);
      const endMin = Math.min(end1, end2);
      return Math.max(0, endMin - startMax);
    };

    total += intervaloSobreposto(inicioM, fimAjustado, noturnoInicio1, noturnoFim1);
    total += intervaloSobreposto(inicioM, fimAjustado, noturnoInicio2, noturnoFim2);
    return Math.round((total / 60) * 100) / 100;
  };

  const calcularResumoRDO = (horarios, horasNormaisPorDia) => {
    let totalHoras = 0,
      horasNoturnas = 0,
      horasDeslocamentoTotal = 0;

    horarios.forEach((h) => {
      if (h.hora_inicio && h.hora_fim) {
        const duracao = calcularDuracao(h.hora_inicio, h.hora_fim);
        totalHoras += duracao;
        horasNoturnas += calcularHorasNoturnas(h.hora_inicio, h.hora_fim);
        if (h.atividade === "Deslocamento") horasDeslocamentoTotal += duracao;
      }
    });

    const horasNormais = Math.min(totalHoras, horasNormaisPorDia);
    const horasExtras = Math.max(0, totalHoras - horasNormaisPorDia);

    return { totalHoras, horasNormais, horasExtras, horasNoturnas, horasDeslocamentoTotal };
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const projetoSelecionado = projetos.find(
      (p) => String(p.id) === String(formData.projeto_id)
    );
    if (!projetoSelecionado) {
      alert("❌ Selecione um projeto!");
      return;
    }

    const horasNormaisPorDia = Number(projetoSelecionado.horasNormais) || 8;
    const resumo = calcularResumoRDO(formData.horarios, horasNormaisPorDia);

    const rdoData = {
      ...formData,
      id: editingId || Date.now(),
      usuario_id: usuario.id,
      usuario_nome: usuario.nome,
      projeto_nome: projetoSelecionado.nome,
      projeto_cliente: projetoSelecionado.cliente,
      horasExtras: resumo.horasExtras,
      horasNoturnas: resumo.horasNoturnas,
      horasNormaisPorDia
    };

    if (editingId) {
      setRdos(rdos.map((r) => (r.id === editingId ? rdoData : r)));
    } else {
      setRdos([rdoData, ...rdos]);
    }

    setShowForm(false);
    setEditingId(null);
    setFormData({
      data: format(new Date(), "yyyy-MM-dd"),
      projeto_id: "",
      naturezaServico: "HOME OFFICE",
      horarios: [
        { hora_inicio: "", hora_fim: "", titulo: "", atividade: "Deslocamento" }
      ],
      descricaoDiaria: ""
    });
    alert("✅ RDO salvo com sucesso!");
  };

  const addHorario = () => {
    setFormData({
      ...formData,
      horarios: [
        ...formData.horarios,
        { hora_inicio: "", hora_fim: "", titulo: "", atividade: "Deslocamento" }
      ]
    });
  };

  const removeHorario = (index) => {
    const novosHorarios = formData.horarios.filter((_, i) => i !== index);
    setFormData({ ...formData, horarios: novosHorarios });
  };

  const updateHorario = (index, field, value) => {
    const novosHorarios = formData.horarios.map((h, i) =>
      i === index ? { ...h, [field]: value } : h
    );
    setFormData({ ...formData, horarios: novosHorarios });
  };

  const projetoForm = projetos.find((p) => String(p.id) === String(formData.projeto_id));
  const horasNormaisForm = Number(projetoForm?.horasNormais) || 8;
  const resumoForm = projetoForm
    ? calcularResumoRDO(formData.horarios, horasNormaisForm)
    : { totalHoras: 0, horasExtras: 0, horasNoturnas: 0, horasNormais: 0 };

  const rdosOrdenados = [...rdosFiltrados].sort((a, b) => {
    const dataA = parseLocalDate(a.data)?.getTime() || 0;
    const dataB = parseLocalDate(b.data)?.getTime() || 0;
    return dataB - dataA;
  });

  const addHorarioNormal = () => {
  const ok = window.confirm(
    "Este comando irá apagar TODOS os horários deste RDO e substituir por 08:00–12:00 e 13:00–17:00. Deseja continuar?"
  );

  if (!ok) return;

  setFormData((prev) => ({
      ...prev,
      horarios: [
        {
          hora_inicio: "08:00",
          hora_fim: "12:00",
          titulo: "",
          atividade: "Trabalho interno",
        },
        {
          hora_inicio: "13:00",
          hora_fim: "17:00",
          titulo: "",
          atividade: "Trabalho interno",
        },
      ],
    }));
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6">
        <div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            📋 Relatórios Diários (RDO)
          </h1>
          <p className="text-gray-600 mt-2">
            Funcionário:{" "}
            <span className="font-semibold text-blue-600">{usuario.nome}</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="date"
            value={filtros.dataInicio}
            onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
            className="p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="date"
            value={filtros.dataFim}
            onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
            className="p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filtros.projetoId}
            onChange={(e) => setFiltros({ ...filtros, projetoId: e.target.value })}
            className="p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 min-w-[180px]"
          >
            <option value="">Todos os projetos</option>
            {projetos.map((proj) => (
              <option key={proj.id} value={proj.id}>
                {proj.nome}
              </option>
            ))}
          </select>
          {isAdmin && (
            <select
              value={filtros.funcionarioId}
              onChange={(e) =>
                setFiltros({ ...filtros, funcionarioId: e.target.value })
              }
              className="p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 min-w-[180px]"
            >
              <option value="">Todos os funcionários</option>
              {funcionariosUnicos.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() =>
              setFiltros({
                dataInicio: format(new Date(), "yyyy-MM-01"),
                dataFim: format(new Date(), "yyyy-MM-dd"),
                projetoId: "",
                funcionarioId: ""
              })
            }
            className="bg-gray-600 text-white px-6 py-3 rounded-xl hover:bg-gray-700 font-medium transition-all"
          >
            Limpar Filtros
          </button>

          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl shadow-lg hover:bg-blue-700 flex items-center space-x-2 font-semibold transition-all"
          >
            <Plus size={20} />
            <span>Novo RDO</span>
          </button>
        </div>
      </div>

      {/* CONTADOR */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-6 rounded-2xl shadow-xl mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Total do Período</h2>
            <p className="text-lg opacity-90">
              {rdosFiltrados.length} registros encontrados
            </p>
          </div>
          {rdosFiltrados.length > 0 && (
            <div className="text-3xl font-black">
              {rdosFiltrados
                .reduce((sum, rdo) => {
                  const resumo = calcularResumoRDO(
                    rdo.horarios || [],
                    Number(rdo.horasNormaisPorDia) || 8
                  );
                  return sum + resumo.totalHoras;
                }, 0)
                .toFixed(1)}
              h
            </div>
          )}
        </div>
      </div>

      {/* TABELA */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">
              {isAdmin ? "RDOs (Admin - Todos)" : "Meus RDOs"}
            </h2>
            <span className="text-sm bg-blue-400 px-3 py-1 rounded-full">
              {rdosOrdenados.length} registros
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase text-gray-600">
                  Data
                </th>
                {isAdmin && (
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase text-gray-600">
                    Funcionário
                  </th>
                )}
                <th className="px-6 py-4 text-left text-xs font-bold uppercase text-gray-600">
                  Projeto
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold uppercase text-gray-600">
                  Horas
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase text-gray-600">
                  Atividades
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase text-gray-600">
                  Horários
                </th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase text-gray-600">
                  Natureza
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase text-gray-600">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rdosOrdenados.map((rdo) => {
                const projeto = projetos.find(
                  (p) => String(p.id) === String(rdo.projeto_id)
                );
                const horasNormaisRDO = Number(rdo.horasNormaisPorDia) || 8;
                const resumo = calcularResumoRDO(rdo.horarios || [], horasNormaisRDO);

                const dataRDODate = parseLocalDate(rdo.data);

                return (
                  <tr key={rdo.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {dataRDODate
                        ? format(dataRDODate, "dd/MM/yyyy", { locale: ptBR })
                        : rdo.data}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-3 text-sm text-gray-800">
                        {rdo.usuario_nome || "—"}
                      </td>
                    )}
                    <td className="px-6 py-3">
                      <div className="font-medium text-gray-900 text-sm">
                        {projeto?.nome || "Sem projeto"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {projeto?.cliente || "Sem cliente"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-lg font-bold text-emerald-600">
                        {resumo.totalHoras.toFixed(1)}h
                      </div>
                      <div className="flex space-x-2 text-xs mt-1">
                        <span className="font-semibold text-orange-600">
                          {resumo.horasExtras.toFixed(1)}h HE
                        </span>
                        <span className="font-semibold text-indigo-600">
                          {resumo.horasNoturnas.toFixed(1)}h N
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-xs font-mono text-purple-600">
                      {(rdo.horarios || [])
                        .map((h) => h.atividade)
                        .filter((v, i, a) => a.indexOf(v) === i)
                        .slice(0, 3)
                        .join(", ") || "—"}
                      {(rdo.horarios || []).length > 3 && " +"}
                    </td>
                    <td className="px-6 py-2">
                      <div className="text-xs space-y-1 max-h-16 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-blue-100 rounded">
                        {(rdo.horarios || []).map((h, i) => (
                          <div
                            key={i}
                            className="flex items-center text-xs text-gray-700 bg-gray-50 px-2 py-1 rounded"
                          >
                            <Clock size={10} className="mr-1 flex-shrink-0" />
                            <span className="font-mono min-w-[35px]">
                              {h.hora_inicio}-{h.hora_fim}
                            </span>
                            <span className="ml-1 truncate max-w-[70px]">
                              {h.atividade}
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-blue-600 font-medium">
                      {rdo.naturezaServico || "—"}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => {
                          setFormData({
                            data: rdo.data,
                            projeto_id: rdo.projeto_id,
                            naturezaServico: rdo.naturezaServico || "HOME OFFICE",
                            horarios: rdo.horarios || [],
                            descricaoDiaria: rdo.descricaoDiaria || ""
                          });
                          setEditingId(rdo.id);
                          setShowForm(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 p-1.5 rounded-lg hover:bg-blue-50 transition-all text-xs"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm("❌ Excluir este RDO?")) {
                            setRdos(rdos.filter((r) => r.id !== rdo.id));
                            alert("✅ RDO excluído!");
                          }
                        }}
                        className="text-red-600 hover:text-red-900 p-1.5 rounded-lg hover:bg-red-50 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {rdosOrdenados.length === 0 && (
                <tr>
                  <td
                    colSpan={isAdmin ? 8 : 7}
                    className="px-6 py-6 text-center text-sm text-gray-500"
                  >
                    Nenhum RDO encontrado com os filtros atuais.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL FORM */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingId ? "✏️ Editar RDO" : "➕ Novo RDO"}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setFormData({
                    data: format(new Date(), "yyyy-MM-dd"),
                    projeto_id: "",
                    naturezaServico: "HOME OFFICE",
                    horarios: [
                      {
                        hora_inicio: "",
                        hora_fim: "",
                        titulo: "",
                        atividade: "Deslocamento"
                      }
                    ],
                    descricaoDiaria: ""
                  });
                }}
                className="p-2 hover:bg-gray-100 rounded-xl transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📅 Data *
                  </label>
                  <input
                    type="date"
                    name="data"
                    value={formData.data}
                    onChange={handleChange}
                    className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🏗️ Projeto *
                  </label>
                  <select
                    name="projeto_id"
                    value={formData.projeto_id}
                    onChange={handleChange}
                    className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  >
                    <option value="">Selecione um projeto</option>
                    {projetos.map((proj) => (
                      <option key={proj.id} value={proj.id}>
                        {proj.nome} - {proj.cliente} ({proj.horasNormais}h normal)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {projetoForm && (
                <div className="p-6 bg-gradient-to-r from-emerald-50 to-indigo-50 border-2 border-emerald-200 rounded-2xl grid md:grid-cols-4 gap-6 text-center">
                  <div>
                    <div className="text-2xl font-black text-emerald-700">
                      {resumoForm.totalHoras.toFixed(1)}h
                    </div>
                    <div className="text-xs text-gray-600 uppercase tracking-wide">
                      Total
                    </div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-orange-600">
                      {resumoForm.horasExtras.toFixed(1)}h
                    </div>
                    <div className="text-xs text-gray-600 uppercase tracking-wide">
                      HE
                    </div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-indigo-600">
                      {resumoForm.horasNoturnas.toFixed(1)}h
                    </div>
                    <div className="text-xs text-gray-600 uppercase tracking-wide">
                      Noturno
                    </div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-700">
                      {horasNormaisForm}h
                    </div>
                    <div className="text-xs text-gray-600 uppercase tracking-wide">
                      Normal/Dia
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                  🏢 Natureza do Serviço
                </label>
                <select
                  name="naturezaServico"
                  value={formData.naturezaServico}
                  onChange={handleChange}
                  className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  {naturezasServico.map((ns) => (
                    <option key={ns} value={ns}>
                      {ns}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-6">
                  <label className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                    <Clock size={24} />
                    <span>Horários e Atividades</span>
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={addHorario}
                      className="bg-green-600 text-white px-4 py-3 rounded-xl hover:bg-green-700 flex items-center space-x-2 font-semibold shadow-lg transition-all"
                    >
                      <Plus size={18} />
                      <span>Adicionar</span>
                    </button>

                    <button
                      type="button"
                      onClick={addHorarioNormal}
                      className="bg-blue-600 text-white px-4 py-3 rounded-xl hover:bg-blue-700 flex items-center space-x-2 font-semibold shadow-lg transition-all"
                    >
                      <Clock size={18} />
                      <span>Horário Normal</span>
                    </button>
                  </div>
                </div>
                <div className="space-y-4 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-blue-100 rounded-lg p-4 bg-gray-50">
                  {formData.horarios.map((horario, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 p-6 rounded-2xl bg-white shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <h4 className="text-lg font-semibold text-gray-900">
                          Horário {index + 1}
                        </h4>
                        {formData.horarios.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeHorario(index)}
                            className="text-red-600 hover:text-red-800 p-2 rounded-xl hover:bg-red-50 transition-all"
                          >
                            <Trash2 size={20} />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Hora Início
                          </label>
                          <input
                            type="time"
                            value={horario.hora_inicio}
                            onChange={(e) =>
                              updateHorario(index, "hora_inicio", e.target.value)
                            }
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Hora Fim
                          </label>
                          <input
                            type="time"
                            value={horario.hora_fim}
                            onChange={(e) =>
                              updateHorario(index, "hora_fim", e.target.value)
                            }
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Duração
                          </label>
                          <input
                            className="w-full p-3 bg-emerald-100 border border-emerald-300 rounded-xl text-center font-mono text-emerald-800 font-bold text-lg"
                            value={`${calcularDuracao(
                              horario.hora_inicio,
                              horario.hora_fim
                            ).toFixed(2)}h`}
                            readOnly
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Título da Atividade
                          </label>
                          <input
                            type="text"
                            value={horario.titulo}
                            onChange={(e) =>
                              updateHorario(index, "titulo", e.target.value)
                            }
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                            placeholder="Ex: Desenvolvimento LP"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Código da Atividade
                          </label>
                          <select
                            value={horario.atividade}
                            onChange={(e) =>
                              updateHorario(index, "atividade", e.target.value)
                            }
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                          >
                            {atividades.map((ativ) => (
                              <option key={ativ} value={ativ}>
                                {ativ}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xl font-bold mb-3 flex items-center space-x-2 text-gray-900">
                  📋 Descrição Diária (Registro de Atividades)
                </label>
                <textarea
                  name="descricaoDiaria"
                  value={formData.descricaoDiaria}
                  onChange={handleChange}
                  rows={6}
                  className="w-full p-5 border border-gray-300 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 resize-vertical font-medium"
                  placeholder="Descreva detalhadamente todas as atividades realizadas no dia..."
                />
              </div>

              <div className="flex space-x-4 pt-6">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 text-white py-5 px-8 rounded-2xl shadow-xl hover:from-emerald-700 hover:to-green-700 font-bold text-lg flex items-center justify-center space-x-3 transition-all transform hover:-translate-y-1"
                >
                  <Save size={24} />
                  <span>{editingId ? "✏️ Atualizar RDO" : "💾 Salvar RDO"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData({
                      data: format(new Date(), "yyyy-MM-dd"),
                      projeto_id: "",
                      naturezaServico: "HOME OFFICE",
                      horarios: [
                        {
                          hora_inicio: "",
                          hora_fim: "",
                          titulo: "",
                          atividade: "Deslocamento"
                        }
                      ],
                      descricaoDiaria: ""
                    });
                  }}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-5 px-8 rounded-2xl font-bold text-lg transition-all"
                >
                  ❌ Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
