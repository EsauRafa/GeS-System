import React, { useState, useEffect } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useAuth } from '../contexts/AuthContext.jsx';
import { format, startOfMonth, endOfMonth, parseISO, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { exportRDOsToPDF } from "../utils/PDFExportRDO";
import { Users, Calendar, Download, Filter, Clock, FileText, Shield } from 'lucide-react';

export default function Relatorios() {
  const { usuario } = useAuth();
  const [rdos] = useLocalStorage("rdos", []);
  const [projetos] = useLocalStorage("projetos", []);
  const [usuarios] = useLocalStorage("usuarios", []);
  
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState("todos");
  const [projetoSelecionado, setProjetoSelecionado] = useState("todos");
  const [rdosFiltrados, setRdosFiltrados] = useState([]);
  const [isExporting, setIsExporting] = useState(false);
  const [totalHorasPeriodo, setTotalHorasPeriodo] = useState(0);

  // 🔐 PERMISSÃO: ID DO USUÁRIO ATUAL
  const usuarioIdAtual = usuario?.id;

  // 🔧 parseDate SEGURO
  const parseDate = (str) => {
    if (!str || typeof str !== 'string') return null;
    
    let date = new Date(str + "T00:00:00");
    if (!isNaN(date.getTime()) && date.getFullYear() > 1900) return date;
    
    const partes = str.split('/');
    if (partes.length === 3) {
      const dia = partes[0].padStart(2, '0');
      const mes = partes[1].padStart(2, '0');
      const ano = partes[2];
      date = new Date(`${ano}-${mes}-${dia}T00:00:00`);
      if (!isNaN(date.getTime()) && date.getFullYear() > 1900) return date;
    }
    
    return null;
  };

  const formatDateSafe = (date, formatStr = "dd/MM/yyyy") => {
    if (!date || !isValid(date)) return "—";
    try {
      return format(date, formatStr, { locale: ptBR });
    } catch {
      return "—";
    }
  };

  // Inicialização datas
  useEffect(() => {
    const hoje = new Date();
    setDataInicio(format(startOfMonth(hoje), "yyyy-MM-dd"));
    setDataFim(format(endOfMonth(hoje), "yyyy-MM-dd"));
  }, []);

  // 🔐 FILTRAGEM COM PERMISSÕES + PROJETO
  useEffect(() => {
    // 👤 USUÁRIO COMUM: SÓ SEUS PRÓPRIOS RDOs
    let rdosUsuarioAtual = rdos;
    if (!usuario?.admin && usuarioIdAtual) {
      rdosUsuarioAtual = rdos.filter(rdo => String(rdo.usuario_id) === String(usuarioIdAtual));
    }

    let filtrados = rdosUsuarioAtual.filter((rdo) => {
      const rdoDate = parseDate(rdo.data);
      const inicio = dataInicio ? parseISO(dataInicio) : null;
      const fim = dataFim ? parseISO(dataFim) : null;
      
      const dataOk =
        (!inicio || !rdoDate || rdoDate >= inicio) &&
        (!fim || !rdoDate || rdoDate <= fim);

      // 🔐 Filtro funcionário (apenas admin)
      const funcionarioOk = !usuario?.admin
        ? true
        : (funcionarioSelecionado === "todos" || String(rdo.usuario_id) === String(funcionarioSelecionado));

      // 🔧 Filtro projeto (todos / id específico)
      const projetoOk =
        projetoSelecionado === "todos" ||
        String(rdo.projeto_id) === String(projetoSelecionado);

      return dataOk && funcionarioOk && projetoOk;
    });

    // Ordenação decrescente
    filtrados = [...filtrados].sort((a, b) => {
      const dataA = parseDate(a.data)?.getTime() || 0;
      const dataB = parseDate(b.data)?.getTime() || 0;
      return dataB - dataA;
    });

    // Cálculo total horas SEGURO
    const totalHoras = filtrados.reduce((sum, rdo) => {
      if (!rdo.horarios?.length) return sum;
      
      const totalRDO = rdo.horarios.reduce((acc, h) => {
        if (!h.hora_inicio || !h.hora_fim) return acc;
        try {
          const start = new Date(`1970-01-01T${h.hora_inicio}`);
          const end = new Date(`1970-01-01T${h.hora_fim}`);
          if (isValid(start) && isValid(end)) {
            return acc + (end - start) / (1000 * 60 * 60);
          }
        } catch {}
        return acc;
      }, 0);
      return sum + totalRDO;
    }, 0);

    setRdosFiltrados(filtrados);
    setTotalHorasPeriodo(totalHoras);
  }, [
    rdos,
    projetos,
    usuarios,
    dataInicio,
    dataFim,
    funcionarioSelecionado,
    projetoSelecionado,
    usuario?.admin,
    usuarioIdAtual
  ]);

  const encontrarProjeto = (projetoId) => {
    if (!projetoId) return { nome: "Sem projeto", cliente: "—" };
    return (
      projetos.find((p) => String(p.id) === String(projetoId)) || {
        nome: "Projeto não encontrado",
        cliente: "—",
      }
    );
  };

  const encontrarUsuario = (usuarioId) => {
    if (!usuarioId) return { nome: "Usuário desconhecido" };
    return (
      usuarios.find((u) => String(u.id) === String(usuarioId)) || {
        nome: "Usuário não encontrado",
      }
    );
  };

  const handleExportPDF = async () => {
    if (rdosFiltrados.length === 0) {
      alert("❌ Nenhum RDO no período selecionado!");
      return;
    }

    setIsExporting(true);
    setTimeout(() => {
      try {
        const nomeFuncionario =
          funcionarioSelecionado === "todos"
            ? usuario?.admin
              ? "Todos_Funcionarios"
              : usuario?.nome?.replace(/[^a-zA-Z0-9]/g, "_")
            : encontrarUsuario(funcionarioSelecionado)?.nome?.replace(
                /[^a-zA-Z0-9]/g,
                "_"
              ) || "Relatorio";
        exportRDOsToPDF(rdosFiltrados, projetos, "/logo.png", nomeFuncionario);
      } catch (error) {
        console.error("Erro PDF:", error);
        alert("Erro ao gerar PDF");
      } finally {
        setIsExporting(false);
      }
    }, 100);
  };

  const limparFiltros = () => {
    const hoje = new Date();
    setDataInicio(format(startOfMonth(hoje), "yyyy-MM-dd"));
    setDataFim(format(endOfMonth(hoje), "yyyy-MM-dd"));
    setFuncionarioSelecionado("todos");
    setProjetoSelecionado("todos");
  };

  // 🔐 MOSTRA SELECT DE FUNCIONÁRIOS SÓ PARA ADM
  const podeVerOutrosFuncionarios = usuario?.admin === true;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* HEADER COM STATUS PERMISSÃO */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              📊 Relatórios RDO
            </h1>
            {podeVerOutrosFuncionarios && (
              <div className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full flex items-center space-x-1">
                <Shield size={14} />
                <span>MODO ADMIN</span>
              </div>
            )}
          </div>
          <p className="text-gray-600">
            {podeVerOutrosFuncionarios
              ? "👥 Admin: Veja RDOs de todos os funcionários"
              : `👤 ${usuario?.nome || "Usuário"}: Seus RDOs pessoais`}
          </p>
        </div>

        <div className="flex flex-wrap gap-3 items-end">
          <button
            onClick={limparFiltros}
            className="bg-gray-600 text-white px-6 py-3 rounded-xl hover:bg-gray-700 font-medium flex items-center space-x-2 transition-all"
          >
            <Filter size={18} />
            <span>Limpar</span>
          </button>

          <button
            onClick={handleExportPDF}
            disabled={isExporting || rdosFiltrados.length === 0}
            className="bg-gradient-to-r from-emerald-600 to-green-600 text-white px-8 py-4 rounded-2xl shadow-lg hover:from-emerald-700 hover:to-green-700 font-bold flex items-center space-x-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Gerando...</span>
              </>
            ) : (
              <>
                <Download size={20} />
                <span>PDF ({rdosFiltrados.length} RDOs)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* FILTROS */}
      <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
              <Calendar size={18} />
              <span>Data Início</span>
            </label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
              <Calendar size={18} />
              <span>Data Fim</span>
            </label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Filtro Projeto */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
              <FileText size={18} />
              <span>Projeto</span>
            </label>
            <select
              value={projetoSelecionado}
              onChange={(e) => setProjetoSelecionado(e.target.value)}
              className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="todos">Todos os projetos</option>
              {projetos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </div>

          {podeVerOutrosFuncionarios && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
                <Users size={18} />
                <span>Funcionário</span>
              </label>
              <select
                value={funcionarioSelecionado}
                onChange={(e) => setFuncionarioSelecionado(e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="todos">
                  👥 Todos os Funcionários ({rdos.length} RDOs)
                </option>
                {usuarios
                  .filter((u) => u.ativo !== false)
                  .map((user) => {
                    const rdosUsuario = rdos.filter(
                      (r) => String(r.usuario_id) === String(user.id)
                    );
                    return (
                      <option key={user.id} value={user.id}>
                        👤 {user.nome} ({rdosUsuario.length} RDOs)
                      </option>
                    );
                  })}
              </select>
            </div>
          )}
        </div>

        {/* STATUS DASHBOARD */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6 p-6 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-2xl">
          <div className="flex items-center space-x-3 p-4 bg-white rounded-xl shadow-sm">
            <div className="w-4 h-4 bg-emerald-500 rounded-full" />
            <div>
              <div className="text-2xl font-bold text-emerald-700">
                {usuario?.admin ? rdos.length : rdos.filter(r => String(r.usuario_id) === String(usuarioIdAtual)).length}
              </div>
              <div className="text-sm text-gray-600">Total RDOs {usuario?.admin ? '' : 'seus'}</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-4 bg-white rounded-xl shadow-sm">
            <div className="w-4 h-4 bg-blue-500 rounded-full" />
            <div>
              <div className="text-2xl font-bold text-blue-700">{rdosFiltrados.length}</div>
              <div className="text-sm text-gray-600">Filtrados</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-4 bg-white rounded-xl shadow-sm">
            <div className="w-4 h-4 bg-purple-500 rounded-full" />
            <div>
              <div className="text-2xl font-bold text-purple-700">{totalHorasPeriodo.toFixed(1)}h</div>
              <div className="text-sm text-gray-600">Total Horas</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-4 bg-white rounded-xl shadow-sm">
            <div className="w-4 h-4 bg-orange-500 rounded-full" />
            <div>
              <div className="text-2xl font-bold text-orange-700">{usuarios.filter(u => u.ativo !== false).length}</div>
              <div className="text-sm text-gray-600">Funcionários</div>
            </div>
          </div>
        </div>
      </div>

      {/* TABELA - MESMA PARA AMBOS */}
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-8 py-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center space-x-3">
                <FileText size={28} />
                <span>RDOs do Período</span>
              </h2>
              <p className="text-blue-100">
                {podeVerOutrosFuncionarios && funcionarioSelecionado === "todos" 
                  ? `${formatDateSafe(parseISO(dataInicio))} a ${formatDateSafe(parseISO(dataFim))}`
                  : podeVerOutrosFuncionarios 
                    ? `Funcionário: ${encontrarUsuario(funcionarioSelecionado)?.nome}`
                    : `${usuario?.nome || 'Você'}: ${formatDateSafe(parseISO(dataInicio))} a ${formatDateSafe(parseISO(dataFim))}`}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black">{rdosFiltrados.length}</div>
              <div className="text-blue-200 text-sm">registros encontrados</div>
            </div>
          </div>
        </div>

        {rdosFiltrados.length === 0 ? (
          <div className="p-16 text-center">
            <div className="text-6xl mb-6 opacity-25">📋</div>
            <h3 className="text-2xl font-bold text-gray-600 mb-2">Nenhum RDO encontrado</h3>
            <p className="text-gray-500 mb-6">
              {podeVerOutrosFuncionarios 
                ? "Ajuste os filtros ou crie novos RDOs em /rdos"
                : `Você ainda não tem RDOs neste período. Crie em <strong>/rdos</strong>`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase text-gray-600">Data</th>
                  {podeVerOutrosFuncionarios && (
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase text-gray-600">Funcionário</th>
                  )}
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase text-gray-600">Projeto</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase text-gray-600">Cliente</th>
                  <th className="px-8 py-4 text-left text-xs font-bold uppercase text-gray-600">Horas</th>
                  <th className="px-8 py-4 text-left text-xs font-bold uppercase text-gray-600">HE</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase text-gray-600">Horários</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase text-gray-600">Natureza</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rdosFiltrados.map((rdo) => {
                  const projeto = encontrarProjeto(rdo.projeto_id);
                  const usuarioRdo = encontrarUsuario(rdo.usuario_id);
                  
                  const totalHoras = rdo.horarios?.reduce((sum, h) => {
                    if (!h.hora_inicio || !h.hora_fim) return sum;
                    try {
                      const start = new Date(`1970-01-01T${h.hora_inicio}`);
                      const end = new Date(`1970-01-01T${h.hora_fim}`);
                      if (isValid(start) && isValid(end)) {
                        return sum + (end - start) / (1000 * 60 * 60);
                      }
                    } catch {}
                    return sum;
                  }, 0) || 0;

                  return (
                    <tr key={rdo.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatDateSafe(parseDate(rdo.data))}
                      </td>
                      {podeVerOutrosFuncionarios && (
                        <td className="px-6 py-4 text-sm font-medium text-blue-600 max-w-xs truncate">
                          {usuarioRdo?.nome || '—'}
                        </td>
                      )}
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 max-w-xs truncate">
                        {projeto.nome}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {projeto.cliente}
                      </td>
                      <td className="px-8 py-4 whitespace-nowrap text-sm font-bold text-emerald-600">
                        {totalHoras.toFixed(2)}h
                      </td>
                      <td className="px-8 py-4 whitespace-nowrap text-sm font-bold text-orange-600">
                        {(rdo.horasExtras || 0).toFixed(1)}h
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                        {rdo.horarios?.length || 0}
                      </td>
                      <td className="px-6 py-4 text-sm text-purple-600 font-medium">
                        {rdo.naturezaServico || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
