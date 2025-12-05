import React, { useState, useEffect } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { exportRDOsToPDF } from "../utils/PDFExportRDO";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from '../contexts/AuthContext.jsx';

export default function Relatorios() {
  // ✅ Função para converter QUALQUER formato de data em Date válido
  const parseDate = (str) => {
    if (!str || typeof str !== 'string') return new Date(0);
    
    // Tenta formato YYYY-MM-DD primeiro (padrão do RDO)
    let date = new Date(str + "T00:00:00");
    if (!isNaN(date.getTime())) return date;
    
    // Tenta formato dd/MM/yyyy
    const partes = str.split('/');
    if (partes.length === 3) {
      const dia = partes[0].padStart(2, '0');
      const mes = partes[1].padStart(2, '0');
      const ano = partes[2];
      date = new Date(`${ano}-${mes}-${dia}T00:00:00`);
      if (!isNaN(date.getTime())) return date;
    }
    
    return new Date(0); // Data inválida
  };

  const { usuario } = useAuth();
  const [rdos] = useLocalStorage("rdos", []);
  const [projetos] = useLocalStorage("projetos", []);
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [rdosFiltrados, setRdosFiltrados] = useState([]);
  const [isExporting, setIsExporting] = useState(false);

  const usuarioAtualNome = usuario?.nome || "Usuário Desconhecido";

  useEffect(() => {
    const hoje = new Date();
    setDataInicio(format(startOfMonth(hoje), "yyyy-MM-dd"));
    setDataFim(format(endOfMonth(hoje), "yyyy-MM-dd"));
  }, []);

  useEffect(() => {
    // Filtragem
    let filtrados = rdos.filter((rdo) => {
      const rdoDate = parseDate(rdo.data);
      const inicio = dataInicio ? new Date(dataInicio + "T00:00:00") : null;
      const fim = dataFim ? new Date(dataFim + "T23:59:59") : null;
      return (!inicio || rdoDate >= inicio) && (!fim || rdoDate <= fim);
    });

    // ✅ INVERTIDO: ORDENação DECRESCENTE (mais recente primeiro)
    filtrados = [...filtrados].sort((a, b) => {
      const dataA = parseDate(a.data).getTime();
      const dataB = parseDate(b.data).getTime();
      return dataB - dataA; // ✅ Mais recente primeiro
    });

    setRdosFiltrados(filtrados);
  }, [rdos, dataInicio, dataFim]);

  const handleExportPDF = async () => {
    if (rdosFiltrados.length === 0) {
      alert("❌ Nenhum RDO no período selecionado!");
      return;
    }

    setIsExporting(true);

    setTimeout(() => {
      try {
        exportRDOsToPDF(rdosFiltrados, projetos, "/logo.png", usuarioAtualNome);
      } catch (error) {
        console.error("Erro PDF:", error);
        alert("Erro ao gerar PDF");
      } finally {
        setIsExporting(false);
      }
    }, 100);
  };

  const encontrarProjeto = (projetoId) => {
    if (!projetoId) return null;
    const projeto =
      projetos.find(
        (p) =>
          String(p.id) === String(projetoId) ||
          p.id === projetoId ||
          p.id == projetoId // eslint-disable-line eqeqeq
      ) || null;
    return projeto;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Relatórios RDO</h1>

      {/* FILTROS */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Início
            </label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Fim
            </label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="md:col-span-2">
            <button
              onClick={handleExportPDF}
              disabled={isExporting || rdosFiltrados.length === 0}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-4 px-6 rounded-xl shadow-lg font-semibold text-lg hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-all"
            >
              {isExporting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Gerando PDF...</span>
                </>
              ) : (
                <>📄 Exportar {rdosFiltrados.length} RDO(s) como PDF</>
              )}
            </button>
          </div>
        </div>

        {/* STATUS */}
        <div className="mt-6 p-4 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg border">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-full" />
              <span>Total RDOs: <strong>{rdos.length}</strong></span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full" />
              <span>Filtrados: <strong>{rdosFiltrados.length}</strong></span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full" />
              <span>Projetos: <strong>{projetos.length}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* TABELA */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border">
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b">
          <h2 className="text-xl font-bold text-gray-800">
            RDOs Selecionados (Mais Recente Primeiro)
          </h2> 
        </div>

        {rdosFiltrados.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-xl font-bold text-gray-600 mb-2">
              Nenhum RDO encontrado
            </h3>
            <p className="text-gray-500">
              Ajuste as datas ou crie novos RDOs em <strong>/rdos</strong>
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Projeto
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Horas
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Horários
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rdosFiltrados.map((rdo) => {
                  const projeto = encontrarProjeto(rdo.projeto_id);
                  const totalHoras = rdo.horarios.reduce((sum, h) => {
                    if (!h.hora_inicio || !h.hora_fim) return sum;
                    const start = new Date(`1970-01-01T${h.hora_inicio}`);
                    const end = new Date(`1970-01-01T${h.hora_fim}`);
                    return sum + (end - start) / (1000 * 60 * 60);
                  }, 0);

                  return (
                    <tr
                      key={rdo.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {format(parseDate(rdo.data), "dd/MM/yyyy", {
                          locale: ptBR,
                        })}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 max-w-xs truncate">
                        {projeto?.nome || "Sem projeto"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {projeto?.cliente || "Sem cliente"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-emerald-600">
                        {totalHoras.toFixed(2)}h
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {rdo.horarios.length}
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
