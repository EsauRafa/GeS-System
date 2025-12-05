import React, { useState, useEffect } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSaturday, isSunday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { exportFichaTecnicaToPDF } from "../utils/PDFExportFichaTecnica";
import { FileText } from "lucide-react";

const feriadosFixos = ["01-01", "21-04", "01-05", "07-09", "12-10", "02-11", "15-11", "25-12"];

function isFeriado(date) {
  return feriadosFixos.includes(format(date, "dd-MM"));
}

function tempoParaDecimal(tempoStr) {
  if (!tempoStr) return 0;
  const [h, m] = tempoStr.split(":").map(Number);
  return h + m / 60;
}

function decimalParaTempo(decimal) {
  if (decimal <= 0) return "0:00";
  const h = Math.floor(decimal);
  const m = Math.round((decimal - h) * 60);
  return `${h}:${m.toString().padStart(2, "0")}`;
}

function calcularHorasNoturnas(inicio, fim) {
  function horaParaMinutos(horaStr) {
    if (!horaStr) return 0;
    const [h, m] = horaStr.split(":").map(Number);
    return h * 60 + m;
  }
  
  const inicioM = horaParaMinutos(inicio);
  const fimM = horaParaMinutos(fim);
  let total = 0;

  const noturnoInicio1 = 1320;
  const noturnoFim1 = 1440;
  const noturnoInicio2 = 0;
  const noturnoFim2 = 360;

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

export default function FichaTecnica() {
  const [rdos] = useLocalStorage("rdos", []);
  const hoje = new Date();
  const [mesAno, setMesAno] = useState(format(hoje, "yyyy-MM"));
  const [dadosMes, setDadosMes] = useState([]);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    const [ano, mes] = mesAno.split("-").map(Number);
    const inicio = startOfMonth(new Date(ano, mes - 1));
    const fim = endOfMonth(new Date(ano, mes - 1));
    const diasDoMes = eachDayOfInterval({ start: inicio, end: fim });

    const resumoPorDia = diasDoMes.map(date => {
      const dataStr = format(date, "yyyy-MM-dd");
      const rdoDia = rdos.filter(r => r.data === dataStr);

      let inicioStr = "", terminoStr = "", deslocamento = 0, descanso = 0, 
          totalBruto = 0, totalSemDesloc = 0, totalPago = 0, 
          hhTreinamento = 0, hhEstudos = 0, hhPlataforma = 0, hhCampo = 0, hhNoturno = 0;

      if (rdoDia.length > 0) {
        const todosHorarios = rdoDia.flatMap(r => r.horarios.filter(h => h.hora_inicio && h.hora_fim));
        
        if (todosHorarios.length > 0) {
          const horariosInicio = todosHorarios.map(h => h.hora_inicio).sort();
          const horariosFim = todosHorarios.map(h => h.hora_fim).sort();
          inicioStr = horariosInicio[0];
          terminoStr = horariosFim[horariosFim.length - 1];

          const horaInicioVisual = tempoParaDecimal(inicioStr);
          const horaFimVisual = tempoParaDecimal(terminoStr);
          totalBruto = horaFimVisual - horaInicioVisual;

          todosHorarios.forEach(h => {
            const duracao = tempoParaDecimal(h.hora_fim) - tempoParaDecimal(h.hora_inicio);
            hhNoturno += calcularHorasNoturnas(h.hora_inicio, h.hora_fim);

            switch (h.atividade) {
              case "Deslocamento": deslocamento += duracao; break;
              case "Treinamento": hhTreinamento += duracao; break;
              case "Teste Supervisão":
              case "Teste Controle":
              case "Teste Proteção":
              case "Teste Funcional": hhEstudos += duracao; break;
              case "Parametrização":
              case "Problemas de Plataforma":
              case "PLATAFORMA": hhPlataforma += duracao; break;
              default: hhCampo += duracao;
            }
          });

          descanso = totalBruto >= 6 ? 1 : 0;
          totalSemDesloc = Math.max(0, totalBruto - deslocamento - descanso);
          totalPago = totalSemDesloc + deslocamento;
        }
      }

      return {
        data: dataStr,
        diaSemana: format(date, "eee", { locale: ptBR }),
        inicio: inicioStr,
        termino: terminoStr,
        deslocamento, descanso, totalSemDesloc, totalPago,
        hhTreinamento, hhEstudos, hhPlataforma, hhCampo,
        sabado: isSaturday(date) ? totalPago : 0,
        domingo: isSunday(date) ? totalPago : 0,
        feriado: isFeriado(date) ? totalPago : 0,
        hhNoturno
      };
    });

    setDadosMes(resumoPorDia);
  }, [mesAno, rdos]);

  const totais = dadosMes.reduce((acc, d) => {
    acc.deslocamento += d.deslocamento;
    acc.descanso += d.descanso;
    acc.totalSemDesloc += d.totalSemDesloc;
    acc.totalPago += d.totalPago;
    acc.hhTreinamento += d.hhTreinamento;
    acc.hhEstudos += d.hhEstudos;
    acc.hhPlataforma += d.hhPlataforma;
    acc.hhCampo += d.hhCampo;
    acc.hhNoturno += d.hhNoturno;
    acc.sabado += d.sabado;
    acc.domingo += d.domingo;
    acc.feriado += d.feriado;
    return acc;
  }, {
    deslocamento: 0, descanso: 0, totalSemDesloc: 0, totalPago: 0,
    hhTreinamento: 0, hhEstudos: 0, hhPlataforma: 0, hhCampo: 0,
    sabado: 0, domingo: 0, feriado: 0, hhNoturno: 0
  });

  const handleExportPDF = () => {
    if (dadosMes.length === 0) {
      alert("Nenhum dado para exportar!");
      return;
    }
    
    setIsGeneratingPDF(true);
    setTimeout(() => {
      exportFichaTecnicaToPDF(dadosMes, totais, mesAno, "Seu Nome");
      setIsGeneratingPDF(false);
    }, 100);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Ficha Técnica Mensal</h1>
          <label className="block text-sm text-gray-600">
            Mês/Ano: 
            <input
              type="month"
              className="ml-2 px-3 py-1 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={mesAno}
              onChange={e => setMesAno(e.target.value)}
            />
          </label>
        </div>
        
        <button
          onClick={handleExportPDF}
          disabled={isGeneratingPDF}
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

      <div className="overflow-x-auto shadow-xl border rounded-xl">
        <table className="w-full table-fixed border-collapse border-2 border-gray-400 text-xs font-mono">
          <thead className="bg-gradient-to-r from-gray-100 to-gray-200 sticky top-0">
            <tr>
              <th className="border border-gray-400 px-1 py-1 w-9">DATA</th>
              <th className="border border-gray-400 px-1 py-1 w-8">DIA</th>
              <th className="border border-gray-400 px-1 py-1 w-10">INÍCIO</th>
              <th className="border border-gray-400 px-1 py-1 w-10">TÉRMINO</th>
              <th className="border border-gray-400 px-1 py-1 w-8">DESLOC</th>
              <th className="border border-gray-400 px-1 py-1 w-7">DESC</th>
              <th className="border border-gray-400 px-1 py-1 w-11">S/DESLOC</th>
              <th className="border border-gray-400 px-1 py-1 w-8 font-semibold">PAGO</th>
              <th className="border border-gray-400 px-1 py-1 w-8">TREINA</th>
              <th className="border border-gray-400 px-1 py-1 w-8">ESTUD</th>
              <th className="border border-gray-400 px-1 py-1 w-8">PLATF</th>
              <th className="border border-gray-400 px-1 py-1 w-7">CAMPO</th>
              <th className="border border-gray-400 px-1 py-1 w-7 text-red-600 font-bold">SÁB</th>
              <th className="border border-gray-400 px-1 py-1 w-7 text-red-600 font-bold">DOM</th>
              <th className="border border-gray-400 px-1 py-1 w-7 text-red-600 font-bold">FER</th>
              <th className="border border-gray-400 px-1 py-1 w-10 text-purple-600 font-bold">NOTURNO</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {dadosMes.map(dia => (
              <tr key={dia.data} className={(dia.sabado > 0 || dia.domingo > 0 || dia.feriado > 0) ? "bg-yellow-50" : "hover:bg-gray-50"}>
                <td className="border border-gray-400 px-1 text-center font-semibold">{format(parseISO(dia.data), "dd/MM")}</td>
                <td className="border border-gray-400 px-1 text-center">{dia.diaSemana}</td>
                <td className="border border-gray-400 px-1 text-center">{dia.inicio || "--"}</td>
                <td className="border border-gray-400 px-1 text-center">{dia.termino || "--"}</td>
                <td className="border border-gray-400 px-1 text-right">{decimalParaTempo(dia.deslocamento)}</td>
                <td className="border border-gray-400 px-1 text-right">{decimalParaTempo(dia.descanso)}</td>
                <td className="border border-gray-400 px-1 text-right">{decimalParaTempo(dia.totalSemDesloc)}</td>
                <td className="border border-gray-400 px-1 text-right font-semibold text-gray-900">{decimalParaTempo(dia.totalPago)}</td>
                <td className="border border-gray-400 px-1 text-right">{decimalParaTempo(dia.hhTreinamento)}</td>
                <td className="border border-gray-400 px-1 text-right">{decimalParaTempo(dia.hhEstudos)}</td>
                <td className="border border-gray-400 px-1 text-right">{decimalParaTempo(dia.hhPlataforma)}</td>
                <td className="border border-gray-400 px-1 text-right">{decimalParaTempo(dia.hhCampo)}</td>
                <td className="border border-gray-400 px-1 text-right text-red-600 font-bold">{dia.sabado > 0 ? decimalParaTempo(dia.sabado) : ""}</td>
                <td className="border border-gray-400 px-1 text-right text-red-600 font-bold">{dia.domingo > 0 ? decimalParaTempo(dia.domingo) : ""}</td>
                <td className="border border-gray-400 px-1 text-right text-red-600 font-bold">{dia.feriado > 0 ? decimalParaTempo(dia.feriado) : ""}</td>
                <td className="border border-gray-400 px-1 text-right text-purple-600 font-bold">{decimalParaTempo(dia.hhNoturno)}</td>
              </tr>
            ))}
            <tr className="bg-gradient-to-r from-gray-200 to-gray-300 font-bold">
              <td colSpan={4} className="border border-gray-400 px-2 text-right">TOTAIS:</td>
              <td className="border border-gray-400 px-1 text-right">{decimalParaTempo(totais.deslocamento)}</td>
              <td className="border border-gray-400 px-1 text-right">{decimalParaTempo(totais.descanso)}</td>
              <td className="border border-gray-400 px-1 text-right">{decimalParaTempo(totais.totalSemDesloc)}</td>
              <td className="border border-gray-400 px-1 text-right">{decimalParaTempo(totais.totalPago)}</td>
              <td className="border border-gray-400 px-1 text-right">{decimalParaTempo(totais.hhTreinamento)}</td>
              <td className="border border-gray-400 px-1 text-right">{decimalParaTempo(totais.hhEstudos)}</td>
              <td className="border border-gray-400 px-1 text-right">{decimalParaTempo(totais.hhPlataforma)}</td>
              <td className="border border-gray-400 px-1 text-right">{decimalParaTempo(totais.hhCampo)}</td>
              <td className="border border-gray-400 px-1 text-right text-red-600 font-bold">{decimalParaTempo(totais.sabado)}</td>
              <td className="border border-gray-400 px-1 text-right text-red-600 font-bold">{decimalParaTempo(totais.domingo)}</td>
              <td className="border border-gray-400 px-1 text-right text-red-600 font-bold">{decimalParaTempo(totais.feriado)}</td>
              <td className="border border-gray-400 px-1 text-right text-purple-600 font-bold">{decimalParaTempo(totais.hhNoturno)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-8 pt-6 border-t-2 border-gray-300 space-y-3 text-sm">
        <p><strong>Nome do Coordenador:</strong> ____________________________________________________</p>
        <p><strong>Assinatura do Coordenador:</strong> ________________________________________________</p>
      </div>
    </div>
  );
}
