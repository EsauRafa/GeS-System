// utils/PDFExportResumoADM.js
import jsPDF from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function exportResumoADMToPDF(funcionario, resumoADM, mesAno) {
  // mesAno vem como "yyyy-MM" (ex: 2025-12)
  const [ano, mes] = mesAno.split("-").map(Number);
  const dataRef = new Date(ano, mes - 1, 1);

  const mesFormatado = format(dataRef, "MMMM 'de' yyyy", { locale: ptBR });

  const doc = new jsPDF();

  doc.setFontSize(14);
  doc.text("Resumo de Horas - Administração", 20, 20);

  doc.setFontSize(11);
  doc.text(`Funcionário: ${funcionario?.nome || resumoADM.nome || "—"}`, 20, 32);
  doc.text(`Mês/Ano: ${mesFormatado}`, 20, 40);

  doc.setFontSize(12);
  let y = 55;

  const linha = (label, valor) => {
    doc.text(`${label}: ${valor}`, 20, y);
    y += 8;
  };

  linha(
    "Qntd hrs semanais/50% (PAGO + Descanso)",
    resumoADM.horasFormatadas
  );
  linha(
    "Domingo/Feriado 100%",
    resumoADM.domingoFeriadoFormatado
  );
  linha(
    "Adicional Noturno",
    resumoADM.adicionalNoturnoFormatado
  );

  doc.save(
    `Resumo_ADM_${(funcionario?.nome || resumoADM.nome || "funcionario")
      .replace(/\s+/g, "_")
      .slice(0, 30)}_${mesAno}.pdf`
  );
}
