import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Plus, Trash2, Save, Clock, X } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://192.168.2.138:4000';

// locale imports removed (unused)

export default function RDOs() {
  const { usuario } = useAuth();
  const [rdos, setRdos] = useState([]);
  const [projetos, setProjetos] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);

  const formatDateForInput = (dateString) => {
    if (!dateString) return format(new Date(), 'yyyy-MM-dd');
    return dateString.slice(0, 10);
  };

  useEffect(() => {
    const carregarDados = async () => {
      try {
        setLoading(true);
        const [projetosRes, rdosRes] = await Promise.all([
          fetch(`${API_URL}/api/projetos`),
          fetch(
            `${API_URL}/api/rdos${usuario && !usuario.admin ? `?usuario_id=${usuario.id}` : ''}`
          ),
        ]);

        if (projetosRes.ok) setProjetos(await projetosRes.json());
        if (rdosRes.ok) setRdos(await rdosRes.json());
      } catch (err) {
        console.error('Erro ao carregar:', err);
      } finally {
        setLoading(false);
      }
    };
    if (usuario) carregarDados();
  }, [usuario]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const hoje = new Date();
  const [filtros, setFiltros] = useState({
    dataInicio: format(addDays(hoje, -14), 'yyyy-MM-dd'),
    dataFim: format(addDays(hoje, 7), 'yyyy-MM-dd'),
    projetoId: '',
    funcionarioId: '',
  });

  const [formData, setFormData] = useState({
    data: format(new Date(), 'yyyy-MM-dd'),
    projeto_id: '',
    natureza_servico: 'HOME OFFICE',
    horarios: [{ hora_inicio: '', hora_fim: '', titulo: '', atividade: 'Deslocamento' }],
    descricao_diaria: '',
  });

  if (loading || !usuario || projetos.length === 0) {
    return (
      <div
        className={`${
          isMobile
            ? 'min-h-dvh p-4 flex items-center justify-center'
            : 'min-h-screen p-8 flex items-center justify-center'
        }`}
      >
        <div className="text-xl font-semibold text-gray-600 text-center">Carregando...</div>
      </div>
    );
  }

  const isAdmin = !!usuario.admin;

  // FILTROS SIMPLES (SEM useMemo)
  const rdosFiltrados = rdos.filter((rdo) => {
    const dataRDO = new Date(rdo.data).getTime();
    const inicio = new Date(filtros.dataInicio).getTime();
    const fim = new Date(filtros.dataFim + 'T23:59:59').getTime();

    if (dataRDO < inicio || dataRDO > fim) return false;
    if (filtros.projetoId && String(rdo.projeto_id) !== filtros.projetoId) return false;
    if (isAdmin && filtros.funcionarioId && String(rdo.usuario_id) !== filtros.funcionarioId)
      return false;
    return true;
  });

  const rdosOrdenados = [...rdosFiltrados].sort(
    (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
  );

  const funcionariosUnicos = isAdmin
    ? [
        ...new Map(
          rdos.map((r) => [r.usuario_id, { id: r.usuario_id, nome: r.usuario_nome }])
        ).values(),
      ].sort((a, b) => a.nome.localeCompare(b.nome))
    : [];

  const atividades = [
    'Deslocamento',
    'Documentação',
    'Erro de Montagem',
    'Erro de Projeto',
    'Falha de Produto',
    'Falta Infraestrutura',
    'Faltam Informações do Cliente',
    'Faltam Materiais',
    'Faltam Painéis',
    'Faltam Recursos Externos',
    'Teste Supervisão',
    'Imposs. Trab. Dev. Clima',
    'Infraestrutura',
    'Modif. Solicit. p/ Cliente',
    'Outros (especifique)',
    'Parametrização',
    'Problemas de Plataforma',
    'Reprogamação de Atividades',
    'Reunião',
    'Suporte',
    'Teste Controle',
    'Teste Proteção',
    'Teste Funcional',
    'Treinamento',
    'Segurança do Trabalho',
    'Retrabalho',
    'Ociosidade',
    'Trabalho interno',
  ];

  const naturezasServico = ['CAMPO', 'PLATAFORMA', 'TREINAMENTO', 'ESCRITÓRIO', 'HOME OFFICE'];

  const toMinutes = (time) => {
    if (!time || time === '') return 0;
    const [h, m] = time.split(':').map(Number);
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
      const [h, m] = horaStr.split(':').map(Number);
      return h * 60 + m;
    };

    const inicioM = horaParaMinutos(inicio);
    const fimM = horaParaMinutos(fim);
    let total = 0;
    const noturnoInicio1 = 1320;
    const noturnoFim1 = 1440;
    const noturnoInicio2 = 0;
    const noturnoFim2 = 360;
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

    (horarios || []).forEach((h) => {
      if (h.hora_inicio && h.hora_fim) {
        const duracao = calcularDuracao(h.hora_inicio, h.hora_fim);
        totalHoras += duracao;
        horasNoturnas += calcularHorasNoturnas(h.hora_inicio, h.hora_fim);
        if (h.atividade === 'Deslocamento') horasDeslocamentoTotal += duracao;
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

    const projetoSelecionado = projetos.find((p) => String(p.id) === String(formData.projeto_id));
    if (!projetoSelecionado) {
      alert('❌ Selecione um projeto!');
      return;
    }

    const horasNormaisPorDia = Number(projetoSelecionado.horasNormais) || 8;
    const resumo = calcularResumoRDO(formData.horarios, horasNormaisPorDia);

    const rdoData = {
      ...formData,
      usuario_id: usuario.id,
      usuario_nome: usuario.nome,
      projeto_nome: projetoSelecionado.nome,
      projeto_cliente: projetoSelecionado.cliente,
      horas_extras: resumo.horasExtras,
      horas_noturnas: resumo.horasNoturnas,
      horas_normais_por_dia: horasNormaisPorDia,
    };

    try {
      let response;
      if (editingId) {
        response = await fetch(`${API_URL}/api/rdos/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(rdoData),
        });
      } else {
        response = await fetch(`${API_URL}/api/rdos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(rdoData),
        });
      }

      if (response.ok) {
        const novoRdo = await response.json();
        if (editingId) {
          setRdos(rdos.map((r) => (r.id === editingId ? novoRdo : r)));
        } else {
          setRdos([novoRdo, ...rdos]);
        }
        alert('✅ RDO salvo com sucesso!');
        setShowForm(false);
        setEditingId(null);
        setFormData({
          data: format(new Date(), 'yyyy-MM-dd'),
          projeto_id: '',
          natureza_servico: 'HOME OFFICE',
          horarios: [{ hora_inicio: '', hora_fim: '', titulo: '', atividade: 'Deslocamento' }],
          descricao_diaria: '',
        });
      } else {
        alert('❌ Erro ao salvar RDO');
      }
    } catch (err) {
      console.error(err);
      alert('❌ Erro de conexão');
    }
  };

  const addHorario = () => {
    setFormData({
      ...formData,
      horarios: [
        ...formData.horarios,
        { hora_inicio: '', hora_fim: '', titulo: '', atividade: 'Deslocamento' },
      ],
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

  const deleteRdo = async (id) => {
    if (!window.confirm('❌ Excluir este RDO?')) return;

    try {
      const response = await fetch(`${API_URL}/api/rdos/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setRdos(rdos.filter((r) => r.id !== id));
        alert('✅ RDO excluído!');
      }
    } catch (err) {
      console.error(err);
      alert('❌ Erro ao excluir');
    }
  };

  const projetoForm = projetos.find((p) => String(p.id) === String(formData.projeto_id));
  const horasNormaisForm = Number(projetoForm?.horasNormais) || 8;
  const resumoForm = projetoForm
    ? calcularResumoRDO(formData.horarios, horasNormaisForm)
    : { totalHoras: 0, horasExtras: 0, horasNoturnas: 0, horasNormais: 0 };

  const addHorarioNormal = () => {
    if (
      !window.confirm(
        'Este comando irá apagar TODOS os horários deste RDO e substituir por 08:00–12:00 e 13:00–17:00. Deseja continuar?'
      )
    )
      return;
    setFormData((prev) => ({
      ...prev,
      horarios: [
        { hora_inicio: '08:00', hora_fim: '12:00', titulo: '', atividade: 'Trabalho interno' },
        { hora_inicio: '13:00', hora_fim: '17:00', titulo: '', atividade: 'Trabalho interno' },
      ],
    }));
  };

  return (
    <>
      <div
        className={`
        ${
          isMobile
            ? 'min-h-dvh w-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-x-hidden p-2 sm:p-4 pb-20 sm:pb-24'
            : 'p-8 max-w-7xl mx-auto min-h-screen bg-gray-50'
        }
      `}
      >
        {/* HEADER RESPONSIVO */}
        <div
          className={`
          ${
            isMobile
              ? 'flex flex-col gap-6 mb-6 max-w-md mx-auto px-4'
              : 'flex flex-col gap-6 mb-8 max-w-7xl mx-auto'
          }
        `}
        >
          <div className="flex-1 min-w-0">
            <h1
              className={`
              ${isMobile ? 'text-2xl sm:text-3xl text-center' : 'text-4xl'}
              font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent
            `}
            >
              📋 Relatórios Diários (RDO)
            </h1>
            <p className="text-gray-600 mt-2 ${isMobile ? 'text-sm text-center' : 'text-base'}">
              Funcionário: <span className="font-semibold text-blue-600">{usuario.nome}</span>
            </p>
          </div>

          {/* FILTROS */}
          <div
            className={`
            flex flex-wrap gap-3 items-center justify-center lg:justify-start
            ${isMobile ? 'grid grid-cols-2 gap-2 w-full' : ''}
          `}
          >
            <input
              type="date"
              value={filtros.dataInicio}
              onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
              className="p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 flex-1 min-w-[140px] max-w-[160px] ${isMobile ? 'text-sm' : ''}"
            />
            <input
              type="date"
              value={filtros.dataFim}
              onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
              className="p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 flex-1 min-w-[140px] max-w-[160px] ${isMobile ? 'text-sm' : ''}"
            />
            <select
              value={filtros.projetoId}
              onChange={(e) => setFiltros({ ...filtros, projetoId: e.target.value })}
              className="p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 min-w-[180px] max-w-[200px] flex-1 ${isMobile ? 'text-sm' : ''}"
            >
              <option value="">Todos projetos</option>
              {projetos.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  {proj.nome}
                </option>
              ))}
            </select>
            {isAdmin && (
              <select
                value={filtros.funcionarioId}
                onChange={(e) => setFiltros({ ...filtros, funcionarioId: e.target.value })}
                className="p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 min-w-[180px] max-w-[200px] flex-1 ${isMobile ? 'text-sm' : ''}"
              >
                <option value="">Todos funcionários</option>
                {funcionariosUnicos.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex gap-3 items-center justify-center lg:justify-start mt-4 lg:mt-3">
            <button
              onClick={() => {
                const hoje = new Date();
                setFiltros({
                  dataInicio: format(hoje, 'yyyy-MM-dd'),
                  dataFim: format(addDays(hoje, 7), 'yyyy-MM-dd'),
                  projetoId: '',
                  funcionarioId: '',
                });
              }}
              className="bg-gray-600 text-white px-6 py-3 rounded-xl hover:bg-gray-700 font-medium transition-all text-sm whitespace-nowrap shadow-lg"
            >
              Limpar Filtros
            </button>
            <button
              onClick={() => {
                setEditingId(null);
                setShowForm(true);
              }}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl shadow-lg hover:bg-blue-700 flex items-center space-x-2 font-semibold transition-all text-sm whitespace-nowrap"
            >
              <Plus size={20} />
              <span>Novo RDO</span>
            </button>
          </div>
        </div>

        {/* CONTADOR */}
        <div
          className={`bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-${
            isMobile ? '4 sm:p-6' : '6'
          } rounded-2xl shadow-xl mb-6 sm:mb-8`}
        >
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div>
              <h2 className={`text-${isMobile ? 'xl sm:text-2xl' : '2xl'} font-bold`}>
                Total do Período
              </h2>
              <p className={`text-${isMobile ? 'base sm:text-lg' : 'lg'} opacity-90`}>
                {rdosFiltrados.length} registros encontrados
              </p>
            </div>
            {rdosFiltrados.length > 0 && (
              <div className={`text-${isMobile ? '2xl sm:text-3xl' : '3xl'} font-black`}>
                {rdosFiltrados
                  .reduce((sum, rdo) => {
                    const resumo = calcularResumoRDO(
                      rdo.horarios || [],
                      Number(rdo.horas_normais_por_dia) || 8
                    );
                    return sum + resumo.totalHoras;
                  }, 0)
                  .toFixed(1)}
                h
              </div>
            )}
          </div>
        </div>

        {/* LISTA/TABELA */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div
            className={`px-${
              isMobile ? '4 sm:px-6' : '6'
            } py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white`}
          >
            <div className="flex items-center justify-between">
              <h2 className={`text-${isMobile ? 'lg sm:text-xl' : 'xl'} font-bold`}>
                {isAdmin ? 'RDOs (Admin)' : 'Meus RDOs'}
              </h2>
              <span
                className={`text-${
                  isMobile ? 'xs sm:text-sm' : 'sm'
                } bg-blue-400 px-3 py-1 rounded-full`}
              >
                {rdosOrdenados.length} registros
              </span>
            </div>
          </div>

          {isMobile ? (
            <div className="divide-y divide-gray-100">
              {rdosOrdenados.map((rdo) => {
                const projeto = projetos.find((p) => String(p.id) === String(rdo.projeto_id));
                const horasNormaisRDO = Number(rdo.horas_normais_por_dia) || 8;
                const resumo = calcularResumoRDO(rdo.horarios || [], horasNormaisRDO);
                const dataRDODate = new Date(rdo.data);

                return (
                  <div key={rdo.id} className="p-4 hover:bg-gray-50 transition-colors">
                    {/* HEADER - DATA + USUÁRIO */}
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="text-lg font-bold text-gray-900">
                          {format(dataRDODate, 'dd/MM/yyyy (EEE)', { locale: ptBR })}
                        </div>
                        {isAdmin && (
                          <div className="text-sm text-gray-600 mt-1">
                            {rdo.usuario_nome || '—'}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-black text-emerald-600">
                          {resumo.totalHoras.toFixed(1)}h
                        </div>
                      </div>
                    </div>

                    {/* PROJETO + NATUREZA */}
                    <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                      <div className="font-semibold text-gray-900 text-sm mb-1">
                        {projeto?.nome || 'Sem projeto'}
                        <span className="text-gray-500 font-normal"> • {projeto?.cliente}</span>
                      </div>
                      <div className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full inline-block">
                        {rdo.natureza_servico || '—'}
                      </div>
                    </div>

                    {/* RESUMO HORAS */}
                    <div className="grid grid-cols-3 gap-2 mb-4 text-center p-2 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-bold text-orange-600 text-sm">
                          {resumo.horasExtras.toFixed(1)}h
                        </div>
                        <div className="text-xs text-gray-500">HE</div>
                      </div>
                      <div>
                        <div className="font-bold text-indigo-600 text-sm">
                          {resumo.horasNoturnas.toFixed(1)}h
                        </div>
                        <div className="text-xs text-gray-500">Noturno</div>
                      </div>
                      <div>
                        <div className="font-bold text-gray-700 text-sm">
                          {Number(rdo.horas_normais_por_dia || 8).toFixed(1)}h
                        </div>
                        <div className="text-xs text-gray-500">Normal</div>
                      </div>
                    </div>

                    {/* PRIMEIROS 2 HORÁRIOS */}
                    <div className="space-y-2 mb-4">
                      {rdo.horarios?.slice(0, 2).map((h, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-2 bg-white border rounded-lg text-xs"
                        >
                          <span className="truncate">{h.titulo || h.atividade || '—'}</span>
                          <span className="font-mono text-gray-600 min-w-[80px]">
                            {h.hora_inicio} - {h.hora_fim}
                          </span>
                        </div>
                      ))}
                      {rdo.horarios?.length > 2 && (
                        <div className="text-xs text-gray-500 text-center p-2 bg-gray-100 rounded-lg">
                          +{rdo.horarios.length - 2} horários
                        </div>
                      )}
                    </div>

                    {/* DESCRIÇÃO (truncada) */}
                    {rdo.descricao_diaria && (
                      <div className="mb-4 p-3 bg-indigo-50 rounded-lg">
                        <div className="text-xs text-gray-700 line-clamp-2 leading-relaxed">
                          {rdo.descricao_diaria}
                        </div>
                      </div>
                    )}

                    {/* BOTÕES COMPACTOS */}
                    <div className="pt-3 border-t border-gray-200 flex gap-2">
                      <button
                        onClick={() => {
                          setFormData({
                            data: formatDateForInput(rdo.data),
                            projeto_id: rdo.projeto_id,
                            natureza_servico: rdo.natureza_servico || 'HOME OFFICE',
                            horarios: rdo.horarios || [
                              {
                                hora_inicio: '',
                                hora_fim: '',
                                titulo: '',
                                atividade: 'Deslocamento',
                              },
                            ],
                            descricao_diaria: rdo.descricao_diaria || '',
                          });
                          setEditingId(rdo.id);
                          setShowForm(true);
                        }}
                        className="flex-1 p-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold shadow-md transition-all text-center h-14 flex flex-col items-center justify-center"
                      >
                        <div className="text-xl">✏️</div>
                        <div className="text-xs mt-0.5">Editar</div>
                      </button>

                      <button
                        onClick={() => deleteRdo(rdo.id)}
                        className="flex-1 p-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold shadow-md transition-all text-center h-14 flex flex-col items-center justify-center"
                      >
                        <div className="text-xl">🗑️</div>
                        <div className="text-xs mt-0.5">Excluir</div>
                      </button>
                    </div>
                  </div>
                );
              })}

              {rdosOrdenados.length === 0 && (
                <div className="px-6 py-12 text-center text-sm text-gray-500">
                  Nenhum RDO encontrado com os filtros atuais.
                </div>
              )}
            </div>
          ) : (
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
                    const projeto = projetos.find((p) => String(p.id) === String(rdo.projeto_id));
                    const horasNormaisRDO = Number(rdo.horas_normais_por_dia) || 8;
                    const resumo = calcularResumoRDO(rdo.horarios || [], horasNormaisRDO);
                    const dataRDODate = new Date(rdo.data);

                    return (
                      <tr key={rdo.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {format(dataRDODate, 'dd/MM/yyyy', { locale: ptBR })}
                        </td>
                        {isAdmin && (
                          <td className="px-6 py-3 text-sm text-gray-800">
                            {rdo.usuario_nome || '—'}
                          </td>
                        )}
                        <td className="px-6 py-3">
                          <div className="font-medium text-gray-900 text-sm">
                            {projeto?.nome || 'Sem projeto'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {projeto?.cliente || 'Sem cliente'}
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
                            .join(', ') || '—'}
                          {(rdo.horarios || []).length > 3 && ' +'}
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
                                <span className="ml-1 truncate max-w-[70px]">{h.atividade}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-xs text-blue-600 font-medium">
                          {rdo.natureza_servico || '—'}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => {
                              setFormData({
                                data: formatDateForInput(rdo.data),
                                projeto_id: rdo.projeto_id,
                                natureza_servico: rdo.natureza_servico || 'HOME OFFICE',
                                horarios: rdo.horarios || [
                                  {
                                    hora_inicio: '',
                                    hora_fim: '',
                                    titulo: '',
                                    atividade: 'Deslocamento',
                                  },
                                ],
                                descricao_diaria: rdo.descricao_diaria || '',
                              });
                              setEditingId(rdo.id);
                              setShowForm(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 p-1.5 rounded-lg hover:bg-blue-50 transition-all text-xs"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => deleteRdo(rdo.id)}
                            className="text-red-600 hover:text-red-900 p-1.5 rounded-lg hover:bg-red-50 transition-all"
                            aria-label="Excluir RDO"
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
          )}
        </div>

        {/* MOBILE */}
        {!showForm && isMobile && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
            <button
              onClick={() => {
                setEditingId(null);
                setShowForm(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center transition-all active:scale-95"
            >
              <Plus size={24} />
            </button>
          </div>
        )}
      </div>

      {/* MODAL FORM */}
      {showForm && (
        <div
          className={`
          fixed inset-0 z-50
          ${
            isMobile
              ? 'bg-black/60 backdrop-blur-sm p-4 flex items-end animate-in slide-in-from-bottom-4 duration-300'
              : 'bg-black/50 flex items-center justify-center p-8'
          }
        `}
        >
          <div
            className={`
            bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col
            ${
              isMobile
                ? 'w-full max-w-md max-h-[95dvh]'
                : 'p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto'
            }
          `}
          >
            <div
              className={`
              flex justify-between items-center mb-8
              ${isMobile ? 'p-6 border-b border-gray-200 sticky top-0 bg-white z-20' : ''}
            `}
            >
              <h2 className="text-2xl font-bold text-gray-900">
                {editingId ? '✏️ Editar RDO' : '➕ Novo RDO'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setFormData({
                    data: format(new Date(), 'yyyy-MM-dd'), // ← SEM rdo.data aqui!
                    projeto_id: '',
                    natureza_servico: 'HOME OFFICE',
                    horarios: [
                      { hora_inicio: '', hora_fim: '', titulo: '', atividade: 'Deslocamento' },
                    ],
                    descricao_diaria: '',
                  });
                }}
                className="p-2 hover:bg-gray-100 rounded-xl transition-all"
                aria-label="Fechar formulário"
              >
                <X size={24} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-6 px-0 sm:px-0 max-h-[70vh] overflow-y-auto"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">📅 Data *</label>
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
                <div className="p-6 bg-gradient-to-r from-emerald-50 to-indigo-50 border-2 border-emerald-200 rounded-2xl grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                  <div>
                    <div className="text-2xl md:text-3xl font-black text-emerald-700">
                      {resumoForm.totalHoras.toFixed(1)}h
                    </div>
                    <div className="text-xs text-gray-600 uppercase tracking-wide">Total</div>
                  </div>
                  <div>
                    <div className="text-xl md:text-2xl font-bold text-orange-600">
                      {resumoForm.horasExtras.toFixed(1)}h
                    </div>
                    <div className="text-xs text-gray-600 uppercase tracking-wide">HE</div>
                  </div>
                  <div>
                    <div className="text-xl md:text-2xl font-bold text-indigo-600">
                      {resumoForm.horasNoturnas.toFixed(1)}h
                    </div>
                    <div className="text-xs text-gray-600 uppercase tracking-wide">Noturno</div>
                  </div>
                  <div>
                    <div className="text-lg md:text-xl font-bold text-gray-700">
                      {horasNormaisForm}h
                    </div>
                    <div className="text-xs text-gray-600 uppercase tracking-wide">Normal/Dia</div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                  🏢 Natureza do Serviço
                </label>
                <select
                  name="natureza_servico"
                  value={formData.natureza_servico}
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
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6 gap-4">
                  <label className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                    <Clock size={24} />
                    <span>Horários e Atividades</span>
                  </label>
                  <div className="flex gap-3 flex-wrap">
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
                <div className="space-y-4 max-h-80 lg:max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-blue-100 rounded-lg p-4 bg-gray-50">
                  {formData.horarios.map((horario, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 p-6 rounded-2xl bg-white shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <h4 className="text-lg font-semibold text-gray-900">Horário {index + 1}</h4>
                        {formData.horarios.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeHorario(index)}
                            className="text-red-600 hover:text-red-800 p-2 rounded-xl hover:bg-red-50 transition-all"
                            aria-label="Remover horário"
                          >
                            <Trash2 size={20} />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Hora Início</label>
                          <input
                            type="time"
                            value={horario.hora_inicio}
                            onChange={(e) => updateHorario(index, 'hora_inicio', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Hora Fim</label>
                          <input
                            type="time"
                            value={horario.hora_fim}
                            onChange={(e) => updateHorario(index, 'hora_fim', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Duração</label>
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
                            onChange={(e) => updateHorario(index, 'titulo', e.target.value)}
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
                            onChange={(e) => updateHorario(index, 'atividade', e.target.value)}
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
                  name="descricao_diaria"
                  value={formData.descricao_diaria}
                  onChange={handleChange}
                  rows={6}
                  className="w-full p-5 border border-gray-300 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 resize-vertical font-medium"
                  placeholder="Descreva detalhadamente todas as atividades realizadas no dia..."
                />
              </div>

              <div className="flex space-x-4 pt-6">
                {/* 🖥️ DESKTOP - Horizontal */}
                <div className="hidden md:flex gap-3 w-full">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 text-white py-5 px-8 rounded-2xl shadow-xl hover:from-emerald-700 hover:to-green-700 font-bold text-lg flex items-center justify-center space-x-3 transition-all transform hover:-translate-y-1"
                  >
                    <Save size={24} />
                    <span>{editingId ? '✏️ Atualizar RDO' : '💾 Salvar RDO'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingId(null);
                      let soData = format(new Date(), 'yyyy-MM-dd');
                      if (editingId) {
                        const current = rdos.find((r) => String(r.id) === String(editingId));
                        if (current && current.data) soData = current.data.slice(0, 10);
                      }
                      setFormData({
                        data: soData,
                        projeto_id: '',
                        natureza_servico: 'HOME OFFICE',
                        horarios: [
                          { hora_inicio: '', hora_fim: '', titulo: '', atividade: 'Deslocamento' },
                        ],
                        descricao_diaria: '',
                      });
                    }}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-5 px-8 rounded-2xl font-bold text-lg transition-all"
                  >
                    ❌ Cancelar
                  </button>
                </div>

                {/* 📱 MOBILE - Fixed bottom */}
                <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-6 z-50">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setEditingId(null);
                      }}
                      className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-4 px-6 rounded-xl font-bold text-base transition-all"
                    >
                      ❌ Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 text-white py-4 px-6 rounded-xl shadow-lg hover:from-emerald-700 hover:to-green-700 font-bold text-base flex items-center justify-center space-x-2 transition-all"
                    >
                      <Save size={20} />
                      <span>{editingId ? 'Atualizar' : 'Salvar'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
