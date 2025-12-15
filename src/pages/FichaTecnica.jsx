import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { format } from 'date-fns';
import { exportFichaTecnicaToPDF } from '../utils/PDFExportFichaTecnica';
import { FileText } from 'lucide-react';
import { exportResumoADMToPDF } from '../utils/PDFExportResumoADM';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://192.168.2.138:4000';

const feriadosFixos = ['01-01', '21-04', '01-05', '07-09', '12-10', '02-11', '15-11', '25-12'];

const formatDateForInput = (dateString) => {
  if (!dateString) return format(new Date(), 'yyyy-MM-dd');
  return dateString.substring(0, 10);
};

const filtrarRdosPorMes = (rdos, mesAno) => {
  const [ano, mes] = mesAno.split('-').map(Number);
  const inicioMes = `${ano}-${String(mes).padStart(2, '0')}-01`;
  const fimMes = `${ano}-${String(mes).padStart(2, '0')}-31`;

  return rdos.filter((rdo) => {
    const dataRdo = formatDateForInput(rdo.data);
    return dataRdo >= inicioMes && dataRdo <= fimMes;
  });
};

function tempoParaDecimal(tempoStr) {
  if (!tempoStr) return 0;
  const [h, m] = tempoStr.split(':').map(Number);
  return h + m / 60;
}

function decimalParaTempo(decimal) {
  if (decimal <= 0) return '0:00';
  const h = Math.floor(decimal);
  const m = Math.round((decimal - h) * 60);
  return `${h}:${m.toString().padStart(2, '0')}`;
}

function calcularHorasNoturnas(inicio, fim) {
  function horaParaMinutos(horaStr) {
    if (!horaStr) return 0;
    const [h, m] = horaStr.split(':').map(Number);
    return h * 60 + m;
  }

  const inicioM = horaParaMinutos(inicio);
  const fimM = horaParaMinutos(fim);
  let total = 0;

  const noturnoInicio1 = 1320; // 22:00
  const noturnoFim1 = 1440; // 24:00
  const noturnoInicio2 = 0; // 00:00
  const noturnoFim2 = 360; // 06:00

  let fimAjustado = fimM >= inicioM ? fimM : fimM + 1440;

  function intervaloSobreposto(start1, end1, start2, end2) {
    const startMax = Math.max(start1, start2);
    const endMin = Math.min(end1, end2);
    return Math.max(0, endMin - startMax);
  }

  total += intervaloSobreposto(inicioM, fimAjustado, noturnoInicio1, noturnoFim1);
  total += intervaloSobreposto(inicioM, fimAjustado, noturnoInicio2, noturnoFim2);

  return total / 60;
}

// 🔥 SEM TIMEZONE - CÁLCULO MANUAL DEZEMBRO 2025
function getDiaSemana(dataStr) {
  const dia = parseInt(dataStr.split('-')[2]);
  // 01/12/2025 = seg (1), 15/12 = seg (15), 17/12 = qua (17)
  const dias = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'];
  return dias[(dia - 1) % 7];
}

function isSabado(dataStr) {
  const dia = parseInt(dataStr.split('-')[2]);
  return (dia - 1) % 7 === 5; // sábados
}

function isDomingo(dataStr) {
  const dia = parseInt(dataStr.split('-')[2]);
  return (dia - 1) % 7 === 6; // domingos
}

function isFeriado(dataStr) {
  return feriadosFixos.includes(dataStr.slice(8, 10) + '-' + dataStr.slice(5, 7));
}

export default function FichaTecnica() {
  const { usuario } = useAuth();
  const [rdos, setRdos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [projetos, setProjetos] = useState([]);
  const [loading, setLoading] = useState(true);

  const hoje = new Date();
  const [mesAno, setMesAno] = useState(format(hoje, 'yyyy-MM'));
  const [dadosMes, setDadosMes] = useState([]);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const isAdmin = !!usuario?.admin;
  const [usuarioSelecionado, setUsuarioSelecionado] = useState('atual');

  useEffect(() => {
    const carregarDados = async () => {
      if (!usuario) return;

      try {
        setLoading(true);
        const [rdosRes, usuariosRes, projetosRes] = await Promise.all([
          fetch(`${API_URL}/api/rdos${!isAdmin ? `?usuario_id=${usuario.id}` : ''}`),
          fetch(`${API_URL}/api/usuarios`),
          fetch(`${API_URL}/api/projetos`),
        ]);

        if (rdosRes.ok) setRdos(await rdosRes.json());
        if (usuariosRes.ok) setUsuarios(await usuariosRes.json());
        if (projetosRes.ok) setProjetos(await projetosRes.json());
      } catch (err) {
        console.error('Erro ao carregar:', err);
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, [usuario, isAdmin]);

  const rdosDoUsuario = useMemo(() => {
    if (!usuario || rdos.length === 0) return [];

    let rdosFiltrados = rdos;

    if (isAdmin) {
      if (usuarioSelecionado === 'atual') {
        rdosFiltrados = rdos.filter((r) => String(r.usuario_id) === String(usuario.id));
      } else {
        rdosFiltrados = rdos.filter((r) => String(r.usuario_id) === String(usuarioSelecionado));
      }
    } else {
      rdosFiltrados = rdos.filter((r) => String(r.usuario_id) === String(usuario.id));
    }

    return filtrarRdosPorMes(rdosFiltrados, mesAno);
  }, [rdos, usuario, isAdmin, usuarioSelecionado, mesAno]);

  useEffect(() => {
    const [ano, mes] = mesAno.split('-').map(Number);
    const diasNoMes = new Date(ano, mes, 0).getDate();

    const resumoPorDia = [];

    for (let dia = 1; dia <= diasNoMes; dia++) {
      const dataStr = `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;

      const rdoDia = rdosDoUsuario.filter((r) => formatDateForInput(r.data) === dataStr);

      let inicioStr = '',
        terminoStr = '',
        deslocamento = 0,
        descanso = 0,
        totalBruto = 0,
        totalSemDesloc = 0,
        totalPago = 0,
        hhNoturno = 0,
        nomeProjeto = '';

      if (rdoDia.length > 0) {
        const todosHorarios = rdoDia.flatMap((r) =>
          (r.horarios || []).filter((h) => h.hora_inicio && h.hora_fim)
        );

        const projId = rdoDia[0]?.projeto_id;
        if (projId) {
          const proj = projetos.find((p) => String(p.id) === String(projId));
          nomeProjeto = proj?.nome || rdoDia[0]?.projeto_nome || '';
        }

        if (todosHorarios.length > 0) {
          const horariosInicio = todosHorarios.map((h) => h.hora_inicio).sort();
          const horariosFim = todosHorarios.map((h) => h.hora_fim).sort();
          inicioStr = horariosInicio[0];
          terminoStr = horariosFim[horariosFim.length - 1];

          const horaInicioVisual = tempoParaDecimal(inicioStr);
          const horaFimVisual = tempoParaDecimal(terminoStr);
          totalBruto = horaFimVisual - horaInicioVisual;

          todosHorarios.forEach((h) => {
            const duracao = tempoParaDecimal(h.hora_fim) - tempoParaDecimal(h.hora_inicio);
            hhNoturno += calcularHorasNoturnas(h.hora_inicio, h.hora_fim);

            if (h.atividade === 'Deslocamento') {
              deslocamento += duracao;
            }
          });

          descanso = totalBruto >= 6 ? 1 : 0;
          totalSemDesloc = Math.max(0, totalBruto - deslocamento - descanso);
          totalPago = totalSemDesloc + deslocamento;
        }
      }

      resumoPorDia.push({
        data: dataStr,
        diaSemana: getDiaSemana(dataStr),
        inicio: inicioStr,
        termino: terminoStr,
        projeto: nomeProjeto,
        deslocamento,
        descanso,
        totalSemDesloc,
        totalPago,
        sabado: isSabado(dataStr) ? totalPago : 0,
        domingo: isDomingo(dataStr) ? totalPago : 0,
        feriado: isFeriado(dataStr) ? totalPago : 0,
        hhNoturno,
      });
    }

    setDadosMes(resumoPorDia);
  }, [mesAno, rdosDoUsuario, projetos]);

  const totais = dadosMes.reduce(
    (acc, d) => {
      acc.deslocamento += d.deslocamento;
      acc.descanso += d.descanso;
      acc.totalSemDesloc += d.totalSemDesloc;
      acc.totalPago += d.totalPago;
      acc.hhNoturno += d.hhNoturno;
      acc.sabado += d.sabado;
      acc.domingo += d.domingo;
      acc.feriado += d.feriado;
      return acc;
    },
    {
      deslocamento: 0,
      descanso: 0,
      totalSemDesloc: 0,
      totalPago: 0,
      sabado: 0,
      domingo: 0,
      feriado: 0,
      hhNoturno: 0,
    }
  );

  const isAdminUser = isAdmin;
  const funcionarioSelecionado = useMemo(() => {
    if (!isAdminUser || !usuario) return usuario;
    if (usuarioSelecionado === 'atual') return usuario;
    return usuarios.find((u) => String(u.id) === String(usuarioSelecionado)) || usuario;
  }, [isAdminUser, usuario, usuarioSelecionado, usuarios]);

  const resumoADM = useMemo(() => {
    const horasSemanais50 = totais.totalPago + totais.descanso;
    const domingoFeriado100 = totais.domingo + totais.feriado;
    const adicionalNoturno = totais.hhNoturno;

    return {
      nome: funcionarioSelecionado?.nome || '—',
      horasSemanais50,
      domingoFeriado100,
      adicionalNoturno,
      horasFormatadas: decimalParaTempo(horasSemanais50),
      domingoFeriadoFormatado: decimalParaTempo(domingoFeriado100),
      adicionalNoturnoFormatado: decimalParaTempo(adicionalNoturno),
    };
  }, [funcionarioSelecionado, totais]);

  const handleExportPDF = useCallback(() => {
    if (dadosMes.length === 0) {
      alert('Nenhum dado para exportar!');
      return;
    }
    let nomeFicha = funcionarioSelecionado?.nome || 'Funcionário';
    setIsGeneratingPDF(true);
    setTimeout(() => {
      exportFichaTecnicaToPDF(dadosMes, totais, mesAno, nomeFicha);
      setIsGeneratingPDF(false);
    }, 100);
  }, [dadosMes, totais, mesAno, funcionarioSelecionado]);

  const handleExportResumoADM = useCallback(() => {
    if (!isAdminUser) return;
    exportResumoADMToPDF(funcionarioSelecionado, resumoADM, mesAno);
  }, [isAdminUser, funcionarioSelecionado, resumoADM, mesAno]);

  if (loading || !usuario) {
    return (
      <div className="p-8 flex items-center justify-center">
        <p>Carregando ficha técnica...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Ficha Técnica Mensal</h1>
          <label className="block text-sm text-gray-600 mb-2">
            Mês/Ano:
            <input
              type="month"
              className="ml-2 px-3 py-1 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={mesAno}
              onChange={(e) => setMesAno(e.target.value)}
            />
          </label>

          {isAdminUser && (
            <label className="block text-sm text-gray-600">
              Funcionário:
              <select
                className="ml-2 px-3 py-1 border rounded-lg focus:ring-2 focus:ring-blue-500"
                value={usuarioSelecionado}
                onChange={(e) => setUsuarioSelecionado(e.target.value)}
              >
                <option value="atual">Usuário atual ({usuario?.nome || '—'})</option>
                {usuarios
                  .filter((u) => u.ativo !== false)
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nome}
                    </option>
                  ))}
              </select>
            </label>
          )}

          {!isAdminUser && (
            <p className="text-sm text-gray-500 mt-1">
              Funcionário: <strong>{usuario?.nome}</strong>
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 items-end">
          {isAdminUser && (
            <button
              onClick={handleExportResumoADM}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl shadow-md hover:bg-blue-700 flex items-center space-x-2 text-sm font-medium"
            >
              <FileText size={18} />
              <span>Exportar Resumo - {resumoADM.nome}</span>
            </button>
          )}

          <button
            onClick={handleExportPDF}
            disabled={isGeneratingPDF || dadosMes.length === 0}
            className="bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg hover:bg-green-700 flex items-center space-x-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingPDF ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Gerando...</span>
              </>
            ) : (
              <>
                <FileText size={20} />
                <span>PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {isAdminUser && (
        <div className="mb-6 p-4 border rounded-xl bg-gray-50">
          <h2 className="text-lg font-semibold mb-2">Resumo para Administração</h2>
          <p className="text-sm mb-1">
            <strong>Nome do funcionário:</strong> {resumoADM.nome}
          </p>
          <p className="text-sm mb-1">
            <strong>Qntd hrs semanais/50% (PAGO + Descanso):</strong>{' '}
            {decimalParaTempo(resumoADM.horasSemanais50)}
          </p>
          <p className="text-sm mb-1">
            <strong>Domingo/Feriado 100%:</strong> {decimalParaTempo(resumoADM.domingoFeriado100)}
          </p>
          <p className="text-sm">
            <strong>Adicional Noturno:</strong> {decimalParaTempo(resumoADM.adicionalNoturno)}
          </p>
        </div>
      )}

      <div className="overflow-x-auto shadow-xl border rounded-xl">
        <table className="min-w-[1000px] w-full table-fixed border-collapse border-2 border-gray-400 text-[11px] sm:text-xs font-mono">
          <thead className="bg-gradient-to-r from-gray-100 to-gray-200 sticky top-0">
            <tr>
              <th className="border border-gray-400 px-1 py-1 whitespace-nowrap w-9">DATA</th>
              <th className="border border-gray-400 px-1 py-1 whitespace-nowrap w-8">DIA</th>
              <th className="border border-gray-400 px-1 py-1 whitespace-nowrap w-10">INÍCIO</th>
              <th className="border border-gray-400 px-1 py-1 whitespace-nowrap w-10">TÉRMINO</th>
              <th className="border border-gray-400 px-1 py-1 whitespace-nowrap w-24">PROJETO</th>
              <th className="border border-gray-400 px-1 py-1 whitespace-nowrap w-8">DESLOC</th>
              <th className="border border-gray-400 px-1 py-1 whitespace-nowrap w-9">Descanso</th>
              <th className="border border-gray-400 px-1 py-1 whitespace-nowrap w-11">S/DESLOC</th>
              <th className="border border-gray-400 px-1 py-1 whitespace-nowrap w-8 font-semibold">
                PAGO
              </th>
              <th className="border border-gray-400 px-2 py-1 whitespace-nowrap w-7 text-red-600 font-bold">
                SÁB
              </th>
              <th className="border border-gray-400 px-2 py-1 whitespace-nowrap w-7 text-red-600 font-bold">
                DOM
              </th>
              <th className="border border-gray-400 px-2 py-1 whitespace-nowrap w-7 text-red-600 font-bold">
                FER
              </th>
              <th className="border border-gray-400 px-1 py-1 whitespace-nowrap w-10 text-purple-600 font-bold">
                NOTURNO
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {dadosMes.map((dia) => (
              <tr
                key={dia.data}
                className={
                  dia.sabado > 0 || dia.domingo > 0 || dia.feriado > 0
                    ? 'bg-yellow-50'
                    : 'hover:bg-gray-50'
                }
              >
                <td className="border border-gray-400 px-1 text-center font-semibold whitespace-nowrap">
                  {dia.data.split('-').slice(1).reverse().join('/')}
                </td>
                <td className="border border-gray-400 px-1 text-center whitespace-nowrap">
                  {dia.diaSemana}
                </td>
                <td className="border border-gray-400 px-1 text-center whitespace-nowrap">
                  {dia.inicio || '--'}
                </td>
                <td className="border border-gray-400 px-1 text-center whitespace-nowrap">
                  {dia.termino || '--'}
                </td>
                <td className="border border-gray-400 px-1 truncate">{dia.projeto || '—'}</td>
                <td className="border border-gray-400 px-1 text-right whitespace-nowrap">
                  {decimalParaTempo(dia.deslocamento)}
                </td>
                <td className="border border-gray-400 px-1 text-right whitespace-nowrap">
                  {decimalParaTempo(dia.descanso)}
                </td>
                <td className="border border-gray-400 px-1 text-right whitespace-nowrap">
                  {decimalParaTempo(dia.totalSemDesloc)}
                </td>
                <td className="border border-gray-400 px-1 text-right font-semibold text-gray-900 whitespace-nowrap">
                  {decimalParaTempo(dia.totalPago)}
                </td>
                <td className="border border-gray-400 px-1 text-right text-red-600 font-bold whitespace-nowrap">
                  {dia.sabado > 0 ? decimalParaTempo(dia.sabado) : ''}
                </td>
                <td className="border border-gray-400 px-1 text-right text-red-600 font-bold whitespace-nowrap">
                  {dia.domingo > 0 ? decimalParaTempo(dia.domingo) : ''}
                </td>
                <td className="border border-gray-400 px-1 text-right text-red-600 font-bold whitespace-nowrap">
                  {dia.feriado > 0 ? decimalParaTempo(dia.feriado) : ''}
                </td>
                <td className="border border-gray-400 px-1 text-right text-purple-600 font-bold whitespace-nowrap">
                  {decimalParaTempo(dia.hhNoturno)}
                </td>
              </tr>
            ))}
            <tr className="bg-gradient-to-r from-gray-200 to-gray-300 font-bold">
              <td colSpan={5} className="border border-gray-400 px-2 text-right">
                TOTAIS:
              </td>
              <td className="border border-gray-400 px-1 text-right">
                {decimalParaTempo(totais.deslocamento)}
              </td>
              <td className="border border-gray-400 px-1 text-right">
                {decimalParaTempo(totais.descanso)}
              </td>
              <td className="border border-gray-400 px-1 text-right">
                {decimalParaTempo(totais.totalSemDesloc)}
              </td>
              <td className="border border-gray-400 px-1 text-right">
                {decimalParaTempo(totais.totalPago)}
              </td>
              <td className="border border-gray-400 px-1 text-right text-red-600 font-bold">
                {decimalParaTempo(totais.sabado)}
              </td>
              <td className="border border-gray-400 px-1 text-right text-red-600 font-bold">
                {decimalParaTempo(totais.domingo)}
              </td>
              <td className="border border-gray-400 px-1 text-right text-red-600 font-bold">
                {decimalParaTempo(totais.feriado)}
              </td>
              <td className="border border-gray-400 px-1 text-right text-purple-600 font-bold">
                {decimalParaTempo(totais.hhNoturno)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
