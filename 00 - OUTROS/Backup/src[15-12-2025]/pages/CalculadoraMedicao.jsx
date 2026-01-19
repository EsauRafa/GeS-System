import React, { useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

export default function CalculadoraMedicao() {
  const [projetos] = useLocalStorage('projetos', []);
  const [rdos] = useLocalStorage('rdos', []);

  const [projetoSelecionado, setProjetoSelecionado] = useState('');
  const [dataInicio, setDataInicio] = useState('2025-12-01');
  const [dataFim, setDataFim] = useState('2025-12-31');
  const [incluirDeslocamento, setIncluirDeslocamento] = useState(true);
  const [incluirNoturno, setIncluirNoturno] = useState(true);
  const [incluirHE, setIncluirHE] = useState(true);
  const [fatorMedicao, setFatorMedicao] = useState(1.2);
  const [deducoes, setDeducoes] = useState(0);

  // Projeto selecionado
  const projetoAtual = projetos.find(
    (p) => String(p.id) === String(projetoSelecionado)
  );
  const valorHora = Number(projetoAtual?.valorHora) || 50;
  const horasNormaisPorDiaProjeto = Number(projetoAtual?.horasNormais) || 8;

  // UTILITÁRIOS
  const toMinutes = (time) => {
    if (!time) return 0;
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const calcularDuracaoHorario = (inicio, fim) => {
    if (!inicio || !fim) return 0;
    let startMin = toMinutes(inicio);
    let endMin = toMinutes(fim);
    if (endMin <= startMin) endMin += 24 * 60;
    return (endMin - startMin) / 60;
  };

  const calcularHorasNoturnas = (inicio, fim) => {
    if (!inicio || !fim) return 0;

    let startMin = toMinutes(inicio);
    let endMin = toMinutes(fim);
    if (endMin <= startMin) endMin += 24 * 60;

    const noturnoInicio = 22 * 60; // 22:00
    const noturnoFim = 6 * 60 + 24 * 60; // 06:00 do dia seguinte

    const overlapInicio = Math.max(startMin, noturnoInicio);
    const overlapFim = Math.min(endMin, noturnoFim);
    return Math.max(0, overlapFim - overlapInicio) / 60;
  };

  // ✅ CÁLCULO DAS HORAS DE UM RDO (compatível com RDO novo e antigo)
  const calcularHorasRDO = (rdo) => {
    // Se o RDO novo já tem resumo calculado (como você salva em RDOs.jsx)
    if (rdo.horasExtras !== undefined && rdo.horasNoturnas !== undefined) {
      const horasNormaisDia =
        Number(rdo.horasNormaisPorDia) || horasNormaisPorDiaProjeto;
      const extras = Number(rdo.horasExtras || 0);
      const noturnas = Number(rdo.horasNoturnas || 0);

      // Deslocamento: calcula só com base nos horários (não vem salvo pronto)
      let horasDeslocamento = 0;
      (rdo.horarios || []).forEach((h) => {
        if (h.atividade === 'Deslocamento' && h.hora_inicio && h.hora_fim) {
          horasDeslocamento += calcularDuracaoHorario(
            h.hora_inicio,
            h.hora_fim
          );
        }
      });

      return {
        normais: horasNormaisDia,
        extras,
        desloc: horasDeslocamento,
        noturnas: noturnas,
      };
    }

    // ✅ FALLBACK: RDO antigo → calcula tudo na hora
    let totalHoras = 0;
    let horasNoturnas = 0;
    let horasDeslocamento = 0;

    (rdo.horarios || []).forEach((horario) => {
      const duracao = calcularDuracaoHorario(
        horario.hora_inicio,
        horario.hora_fim
      );
      totalHoras += duracao;
      horasNoturnas += calcularHorasNoturnas(
        horario.hora_inicio,
        horario.hora_fim
      );

      if (horario.atividade === 'Deslocamento') {
        horasDeslocamento += duracao;
      }
    });

    const limiteDia =
      Number(rdo.horasNormaisPorDia) || horasNormaisPorDiaProjeto;
    const horasNormais = Math.min(totalHoras, limiteDia);
    const horasExtras = Math.max(0, totalHoras - limiteDia);

    return {
      normais: horasNormais,
      extras: horasExtras,
      desloc: horasDeslocamento,
      noturnas: horasNoturnas,
    };
  };

  // ✅ FILTRA RDOs POR PROJETO + PERÍODO
  const rdosFiltrados = rdos.filter((rdo) => {
    const noProjeto =
      !projetoSelecionado ||
      String(rdo.projeto_id) === String(projetoSelecionado);

    const dataRdo = rdo.data ? new Date(rdo.data) : null;
    if (!dataRdo || Number.isNaN(dataRdo.getTime())) return false;

    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    // garantir fim no final do dia
    fim.setHours(23, 59, 59, 999);

    const noPeriodo = dataRdo >= inicio && dataRdo <= fim;
    return noProjeto && noPeriodo;
  });

  // ✅ AGREGAR TOTAIS
  const totais = rdosFiltrados.reduce(
    (acc, rdo) => {
      const horas = calcularHorasRDO(rdo);
      acc.normais += horas.normais;
      acc.extras += horas.extras;
      acc.desloc += horas.desloc;
      acc.noturnas += horas.noturnas;
      return acc;
    },
    { normais: 0, extras: 0, desloc: 0, noturnas: 0 }
  );

  // ✅ APLICAR CHECKBOXES
  // Normais sempre contam (base da medição)
  const horasNormais = totais.normais;
  const horasExtras = incluirHE ? totais.extras : 0;
  const horasDeslocamento = incluirDeslocamento ? totais.desloc : 0;
  const horasNoturnas = incluirNoturno ? totais.noturnas : 0;

  const horasTotais =
    horasNormais + horasExtras + horasDeslocamento + horasNoturnas;
  const medicaoBruta = horasTotais * valorHora;
  const medicaoLiquida = medicaoBruta * fatorMedicao - deducoes;
  const medicaoFinal = Math.max(0, Math.round(medicaoLiquida));

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="bg-white rounded-3xl shadow-2xl p-10">
        <div className="flex items-center space-x-6 mb-10">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-xl">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 7H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2m0 0h-2a2 2 0 00-2 2v2m0-4H9m3-6V5a2 2 0 00-2-2H7a2 2 0 00-2 2v6a2 2 0 002 2h2"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Medição por Projeto
            </h1>
            <p className="text-xl text-gray-600 mt-1">
              RDOs:{' '}
              <span className="font-bold text-blue-600">{rdos.length}</span> |
              Filtrados:{' '}
              <span className="font-bold text-emerald-600">
                {rdosFiltrados.length}
              </span>
            </p>
          </div>
        </div>

        {/* RESUMO / DEBUG */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200">
          <div>
            <h3 className="font-bold text-lg text-blue-800 mb-2">
              📊 Horas Calculadas
            </h3>
            <div className="space-y-1 text-sm">
              <div>
                Normais:{' '}
                <span className="font-bold text-blue-600">
                  {totais.normais.toFixed(1)}h
                </span>
              </div>
              <div>
                HE:{' '}
                <span className="font-bold text-orange-600">
                  {totais.extras.toFixed(1)}h
                </span>
              </div>
              <div>
                Desloc:{' '}
                <span className="font-bold text-purple-600">
                  {totais.desloc.toFixed(1)}h
                </span>
              </div>
              <div>
                Noturno:{' '}
                <span className="font-bold text-indigo-600">
                  {totais.noturnas.toFixed(1)}h
                </span>
              </div>
              <div className="font-bold text-2xl text-emerald-700 pt-2 border-t">
                {horasTotais.toFixed(1)}h TOTAL
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-lg text-blue-800 mb-2">
              🎯 Configuração
            </h3>
            <div className="space-y-1 text-sm">
              <div>
                Projeto:{' '}
                <span className="font-bold">
                  {projetoAtual?.nome || 'Todos'}
                </span>
              </div>
              <div>
                Normal/Dia:{' '}
                <span className="font-bold text-orange-600">
                  {horasNormaisPorDiaProjeto}h
                </span>
              </div>
              <div>
                Valor:{' '}
                <span className="font-bold text-emerald-700">
                  R$ {valorHora.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-lg text-blue-800 mb-2">
              📅 Período
            </h3>
            <div className="space-y-1 text-sm">
              <div>
                {dataInicio} → {dataFim}
              </div>
              <div>
                Fator:{' '}
                <span className="font-bold">×{fatorMedicao.toFixed(2)}</span>
              </div>
              <div>
                Deduções:{' '}
                <span className="font-bold text-red-500">
                  -R$ {deducoes.toLocaleString('pt-BR')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* PROJETO + VALOR */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <div>
            <label className="block text-lg font-bold text-gray-800 mb-4">
              🏗️ Projeto
            </label>
            <select
              className="w-full p-5 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-500 text-lg font-semibold"
              value={projetoSelecionado}
              onChange={(e) => setProjetoSelecionado(e.target.value)}
            >
              <option value="">📋 Todos os Projetos</option>
              {projetos.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  {proj.nome} - {proj.cliente} ({proj.horasNormais}h/dia, R${' '}
                  {proj.valorHora}/h)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-lg font-bold text-gray-800 mb-4">
              💰 Valor Hora
            </label>
            <div className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl text-center">
              <div className="text-3xl font-black text-emerald-700">
                R$ {valorHora.toFixed(2)}/h
              </div>
              <div className="text-sm text-emerald-600 font-medium">
                {projetoAtual?.nome || 'Sem projeto selecionado'} (
                {horasNormaisPorDiaProjeto}h normal)
              </div>
            </div>
          </div>
        </div>

        {/* PERÍODO + FATOR + DEDUÇÕES */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div>
            <label className="block font-semibold mb-2">📅 Início</label>
            <input
              type="date"
              className="w-full p-4 border-2 rounded-xl focus:ring-4 focus:ring-blue-500"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
            />
          </div>
          <div>
            <label className="block font-semibold mb-2">📅 Fim</label>
            <input
              type="date"
              className="w-full p-4 border-2 rounded-xl focus:ring-4 focus:ring-blue-500"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
            />
          </div>
          <div>
            <label className="block font-semibold mb-2">📈 Fator</label>
            <input
              type="number"
              step="0.05"
              className="w-full p-4 border-2 rounded-xl focus:ring-4 focus:ring-emerald-500 text-center text-lg"
              value={fatorMedicao}
              onChange={(e) => setFatorMedicao(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block font-semibold mb-2">
              ➖ Deduções (R$)
            </label>
            <input
              type="number"
              className="w-full p-4 border-2 rounded-xl focus:ring-4 focus:ring-red-500 text-center text-lg"
              value={deducoes}
              onChange={(e) => setDeducoes(Number(e.target.value))}
            />
          </div>
        </div>

        {/* CHECKBOXES */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 p-6 bg-gray-50 rounded-2xl">
          <label className="flex items-center space-x-3 p-4 bg-white rounded-xl shadow-sm cursor-pointer hover:shadow-md transition-all border-2 border-gray-200 hover:border-blue-300">
            <input
              type="checkbox"
              className="w-5 h-5 text-blue-600 rounded"
              checked={incluirHE}
              onChange={(e) => setIncluirHE(e.target.checked)}
            />
            <div>
              <div className="font-bold text-blue-800">⏰ Horas Extras</div>
              <div className="text-xs text-blue-600">
                Normais: {totais.normais.toFixed(1)}h | HE:{' '}
                {totais.extras.toFixed(1)}h
              </div>
            </div>
          </label>

          <label className="flex items-center space-x-3 p-4 bg-white rounded-xl shadow-sm cursor-pointer hover:shadow-md transition-all border-2 border-purple-200 hover:border-purple-300">
            <input
              type="checkbox"
              className="w-5 h-5 text-purple-600 rounded"
              checked={incluirDeslocamento}
              onChange={(e) => setIncluirDeslocamento(e.target.checked)}
            />
            <div>
              <div className="font-bold text-purple-800">🚗 Deslocamento</div>
              <div className="text-xs text-purple-600">
                {totais.desloc.toFixed(1)}h
              </div>
            </div>
          </label>

          <label className="flex items-center space-x-3 p-4 bg-white rounded-xl shadow-sm cursor-pointer hover:shadow-md transition-all border-2 border-indigo-200 hover:border-indigo-300">
            <input
              type="checkbox"
              className="w-5 h-5 text-indigo-600 rounded"
              checked={incluirNoturno}
              onChange={(e) => setIncluirNoturno(e.target.checked)}
            />
            <div>
              <div className="font-bold text-indigo-800">
                🌙 Noturno (22h-6h)
              </div>
              <div className="text-xs text-indigo-600">
                {totais.noturnas.toFixed(1)}h
              </div>
            </div>
          </label>

          <label className="flex items-center space-x-3 p-4 bg-white rounded-xl shadow-sm cursor-default border-2 border-emerald-200">
            <input
              type="checkbox"
              className="w-5 h-5 text-emerald-600 rounded"
              checked={true}
              disabled
            />
            <div>
              <div className="font-bold text-emerald-800">📊 Total Usado</div>
              <div className="text-xs text-emerald-600 font-bold">
                {horasTotais.toFixed(1)}h
              </div>
            </div>
          </label>
        </div>

        {/* RESULTADO FINAL */}
        <div className="bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-700 text-white p-12 rounded-3xl shadow-2xl text-center mb-12">
          <h2 className="text-4xl font-black mb-6 tracking-tight">
            MEDIÇÃO FINAL
          </h2>
          <div className="text-6xl font-black mb-6 drop-shadow-2xl">
            {medicaoFinal.toLocaleString('pt-BR')}{' '}
            <span className="text-4xl">R$</span>
          </div>

          <div className="grid md:grid-cols-5 gap-8 text-lg">
            <div className="bg-white/20 backdrop-blur-sm p-6 rounded-2xl">
              <div className="text-4xl font-black text-blue-100">
                {rdosFiltrados.length}
              </div>
              <div className="opacity-90">Dias</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm p-6 rounded-2xl">
              <div className="text-3xl font-black text-blue-100">
                {horasNormais.toFixed(1)}h
              </div>
              <div className="opacity-90">Normais</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm p-6 rounded-2xl">
              <div className="text-3xl font-black text-orange-100">
                {horasExtras.toFixed(1)}h
              </div>
              <div className="opacity-90">HE</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm p-6 rounded-2xl">
              <div className="text-3xl font-black text-purple-100">
                {horasDeslocamento.toFixed(1)}h
              </div>
              <div className="opacity-90">Desloc.</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm p-6 rounded-2xl">
              <div className="text-3xl font-black text-indigo-100">
                {horasNoturnas.toFixed(1)}h
              </div>
              <div className="opacity-90">Noturno</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          <button className="flex-1 lg:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-5 px-8 rounded-2xl text-xl shadow-2xl transition-all">
            📄 Exportar PDF Contabilidade
          </button>
          <button className="flex-1 lg:flex-none bg-blue-600 hover:bg-blue-700 text-white font-bold py-5 px-8 rounded-2xl text-xl shadow-2xl transition-all">
            📧 Enviar por Email
          </button>
        </div>
      </div>
    </div>
  );
}
