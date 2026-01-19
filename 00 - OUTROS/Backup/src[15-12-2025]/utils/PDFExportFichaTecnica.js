// utils/PDFExportFichaTecnica.js
import { format, parseISO } from "date-fns";
import ptBR from "date-fns/locale/pt-BR";
import jsPDF from "jspdf";

export const exportFichaTecnicaToPDF = (
  dadosMes,
  totais,
  mesAno,
  nomeUsuario = "Usuário",
  logoUrl = "/GeS-System/logo.png"
) => {
  const doc = new jsPDF();

  const formatarTempo = (decimal) => {
    if (!decimal || decimal <= 0) return "0:00";
    const h = Math.floor(decimal);
    const m = Math.round((decimal - h) * 60);
    return `${h}:${m.toString().padStart(2, "0")}`;
  };

  // LOGO 
  try {
    doc.addImage(logoUrl, "PNG", 15, 8, 30, 20); 
  } catch (e) {
    console.warn("Logo não carregada na ficha técnica:", e);
  }

  // Cabeçalho
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("FICHA TÉCNICA MENSAL", 105, 20, { align: "center" });

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Mês: ${format(parseISO(`${mesAno}-01`), "MMMM/yyyy", { locale: ptBR })}`,
    105,
    32,
    { align: "center" }
  );
  doc.text(
    `Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm")}`,
    105,
    40,
    { align: "center" }
  );
  doc.text(`Funcionário: ${nomeUsuario}`, 105, 48, { align: "center" });

  let y = 60;
  const larguraColuna = 15;
  const xBase = 8;

  const headers = [
    "DATA",
    "DIA",
    "INI",
    "FIM",
    "PROJ",
    "DESL",
    "DESC",
    "S/DESL",
    "PAGO",
    "SÁB",
    "DOM",
    "FER",
    "NOT",
  ];

  const desenharHeader = (posY) => {
    headers.forEach((header, i) => {
      const x = xBase + i * larguraColuna;

      doc.setFillColor(70, 130, 180);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);

      doc.rect(x, posY, larguraColuna, 7, "F");
      const textoHeader = doc.splitTextToSize(header, larguraColuna - 3);
      doc.text(textoHeader, x + 2, posY + 5, { maxWidth: larguraColuna - 4 });
    });
  };

  desenharHeader(y);
  y += 9;

  // Linhas de dados
  dadosMes.forEach((dia, index) => {
    if (y > 272) {
      doc.addPage();
      y = 38;
      desenharHeader(y);
      y += 9;
    }

    let dataFormatada = "--";
    try {
      dataFormatada = format(parseISO(dia.data), "dd/MM");
    } catch { /* ignorar data inválida */ }

    const row = [
      dataFormatada,
      (dia.diaSemana || "").slice(0, 3),
      dia.inicio || "--",
      dia.termino || "--",
      dia.projeto || "",
      formatarTempo(dia.deslocamento),
      formatarTempo(dia.descanso),
      formatarTempo(dia.totalSemDesloc),
      formatarTempo(dia.totalPago),
      dia.sabado > 0 ? formatarTempo(dia.sabado) : "",
      dia.domingo > 0 ? formatarTempo(dia.domingo) : "",
      dia.feriado > 0 ? formatarTempo(dia.feriado) : "",
      formatarTempo(dia.hhNoturno),
    ];

    row.forEach((cell, i) => {
      const x = xBase + i * larguraColuna;

      doc.setFillColor(
        index % 2 === 0 ? 248 : 255,
        index % 2 === 0 ? 249 : 255,
        index % 2 === 0 ? 250 : 255
      );
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);

      doc.rect(x, y, larguraColuna, 5.5, "F");
      const textoCell = doc.splitTextToSize(cell || "", larguraColuna - 3);
      doc.text(textoCell, x + 1.5, y + 4, {
        maxWidth: larguraColuna - 3,
      });
    });

    y += 6;
  });

  // Linha de TOTAIS
  if (y > 265) {
    doc.addPage();
    y = 52;
  }

  doc.setFillColor(100, 149, 237);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);

  const numCols = headers.length;

  for (let i = 0; i < numCols; i++) {
    const x = xBase + i * larguraColuna;
    doc.rect(x, y, larguraColuna, 7, "F");
  }

  const colX = (idx) => xBase + idx * larguraColuna + 1;

  doc.text("TOTAIS:", xBase + 2, y + 5);

  doc.text(formatarTempo(totais.deslocamento), colX(5), y + 5);
  doc.text(formatarTempo(totais.descanso), colX(6), y + 5);
  doc.text(formatarTempo(totais.totalSemDesloc), colX(7), y + 5);
  doc.text(formatarTempo(totais.totalPago), colX(8), y + 5);
  doc.text(formatarTempo(totais.sabado), colX(9), y + 5);
  doc.text(formatarTempo(totais.domingo), colX(10), y + 5);
  doc.text(formatarTempo(totais.feriado), colX(11), y + 5);
  doc.text(formatarTempo(totais.hhNoturno), colX(12), y + 5);

  y += 10;

  // Legenda
  doc.setFontSize(7.5);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  const legenda = doc.splitTextToSize(
    "SÁB/DOM/FER: dobro | NOTURNO: 22h-6h | Descanso: 1h após 6h | DESL: pago",
    190
  );
  doc.text(legenda, xBase, y);
  y += legenda.length * 3.5 + 6;

  const nomeMes = format(parseISO(`${mesAno}-01`), "MMMM-yyyy", {
    locale: ptBR,
  });
  doc.save(`Ficha_Tecnica_${nomeMes}.pdf`);
};
