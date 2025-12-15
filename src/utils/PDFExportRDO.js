import jsPDF from 'jspdf';

export const exportRDOsToPDF = (
  rdosSelecionados,
  projetos,
  logoUrl = null,
  nomeUsuario = 'Usuário'
) => {
  if (rdosSelecionados.length === 0) {
    alert('Selecione pelo menos um RDO para exportar!');
    return;
  }

  const doc = new jsPDF();

  // ✅ ORDENAÇÃO POR DATA (corrigido para PostgreSQL ISO)
  const rdosOrdenados = [...rdosSelecionados].sort((a, b) => {
    const dataA = new Date(a.data).getTime();
    const dataB = new Date(b.data).getTime();
    return dataA - dataB; // Dia 1, Dia 2, Dia 3...
  });

  const formatarData = (dataStr) => {
    const data = new Date(dataStr);
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
  };

  const calcularDuracao = (inicio, fim) => {
    if (!inicio || !fim) return '0:00';
    const start = new Date(`1970-01-01T${inicio}`);
    const end = new Date(`1970-01-01T${fim}`);
    const diff = (end - start) / (1000 * 60 * 60);
    const horas = Math.floor(diff);
    const minutos = Math.floor((diff - horas) * 60);
    return `${horas}:${minutos.toString().padStart(2, '0')}`;
  };

  rdosOrdenados.forEach((rdo, index) => {
    if (index > 0) doc.addPage();

    // ✅ BUSCA PROJETO ROBUSTA (usa dados do banco se disponíveis)
    const projeto = rdo.projeto_nome
      ? {
          nome: rdo.projeto_nome,
          cliente: rdo.projeto_cliente,
          codigo: rdo.projeto_codigo || '0000',
        }
      : projetos.find(
          (p) =>
            String(p.id) === String(rdo.projeto_id) ||
            p.id === rdo.projeto_id ||
            p.id == rdo.projeto_id
        ) || {
          nome: 'Nenhum Projeto Encontrado',
          cliente: 'Cliente não encontrado',
          codigo: '0000',
        };

    // ✅ LOGO - SÓ SE EXISTIR E FOR VÁLIDA
    if (logoUrl) {
      try {
        doc.addImage(logoUrl, 'PNG', 15, 8, 30, 20);
      } catch (e) {
        console.warn('Logo não carregada:', e);
      }
    }

    // TÍTULO
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('RELATÓRIO DIÁRIO DE OBRA', 105, 25, { align: 'center' });

    // EMPRESA + DATA
    let yPos = 35;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('G & S SOLUÇÕES EM ENERGIA L.T.D.A.', 15, yPos);

    yPos += 8;
    doc.setFontSize(10);
    doc.text(`Data: ${formatarData(rdo.data)}`, 15, yPos);

    // CÓDIGO PROJETO
    yPos += 10;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Cód. Projeto: ${projeto.codigo || '0000'}`, 15, yPos);

    // PROJETO / CLIENTE / NATUREZA
    yPos += 12;
    doc.setFont('helvetica', 'normal');
    doc.text('NOME DO PROJETO:', 15, yPos);
    doc.setFont('helvetica', 'bold');
    doc.text(projeto.nome || 'Nenhum Projeto Encontrado', 60, yPos);

    yPos += 10;
    doc.setFont('helvetica', 'normal');
    doc.text('CLIENTE:', 15, yPos);
    doc.setFont('helvetica', 'bold');
    doc.text(projeto.cliente || 'Cliente não encontrado', 60, yPos);

    yPos += 10;
    doc.setFont('helvetica', 'normal');
    doc.text('NATUREZA DO SERVIÇO:', 15, yPos);
    doc.setFont('helvetica', 'bold');
    doc.text(rdo.natureza_servico || 'Não encontrado', 60, yPos); // ✅ corrigido nome campo

    // LEGENDA COMPACTA
    yPos += 8;
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    const legenda =
      '1=Desloc. 2=Doc. 3=Erro Mont. 4=Erro Proj. 5=Falha Prod. 6=Falta Infra. 7=Faltam Info. 8=Faltam Mat. 9=Faltam Painéis 10=Faltam Rec. 11=Teste Sup. 12=Clima 13=Infra. 14=Modif. Cli. 15=Outros 16=Param. 17=Plataf. 18=Reprog. 19=Reunião 20=Suporte 21=Teste Ctrl 22=Teste Prot 23=Teste Func 24=Train. 25=Seg. Trab. 26=Retrab. 27=Ocios.';
    const linhasLegenda = doc.splitTextToSize(legenda, 180);
    doc.text(linhasLegenda, 15, yPos);

    // HORAS TRABALHADAS
    yPos += 15;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('HORAS TRABALHADAS', 15, yPos);
    yPos += 8;

    // CABEÇALHO TABELA
    doc.setFontSize(8);
    doc.rect(15, yPos, 180, 6);
    doc.text('Nº', 17, yPos + 4);
    doc.text('DESCRIÇÃO', 25, yPos + 4);
    doc.text('INÍCIO', 105, yPos + 4);
    doc.text('FIM', 120, yPos + 4);
    doc.text('TOTAL', 135, yPos + 4);
    doc.text('ATIV.', 150, yPos + 4);
    yPos += 8;

    // LINHAS DOS HORÁRIOS
    rdo.horarios?.forEach((horario, i) => {
      const duracao = calcularDuracao(horario.hora_inicio, horario.hora_fim);
      doc.rect(15, yPos, 180, 10);
      doc.setFontSize(8);
      doc.text(`${i + 1}`, 17, yPos + 6);
      doc.setFontSize(7);
      const tituloCurto = (horario.titulo || '').substring(0, 25);
      doc.text(tituloCurto || '---', 25, yPos + 6);
      doc.setFontSize(8);
      doc.text(horario.hora_inicio || '', 105, yPos + 6);
      doc.text(horario.hora_fim || '', 120, yPos + 6);
      doc.text(duracao, 135, yPos + 6);
      doc.text(horario.atividade || '16', 150, yPos + 6);
      yPos += 12;
    });

    // HORAS LÍQUIDAS
    const totalHoras =
      rdo.horarios?.reduce((sum, h) => {
        if (!h.hora_inicio || !h.hora_fim) return sum;
        const start = new Date(`1970-01-01T${h.hora_inicio}`);
        const end = new Date(`1970-01-01T${h.hora_fim}`);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return sum;
        return sum + (end - start) / (1000 * 60 * 60);
      }, 0) || 0;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`HORAS LÍQUIDAS: ${totalHoras.toFixed(2)}h`, 15, yPos + 3);
    yPos += 12;

    // REGISTRO DE ATIVIDADES
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Registro de Atividades:', 15, yPos);
    yPos += 6;

    doc.setFontSize(8);
    const textoRegistro = doc.splitTextToSize(
      rdo.descricao_diaria || 'Descrição não informada',
      170
    );
    doc.text(textoRegistro, 15, yPos);
    yPos += textoRegistro.length * 4 + 8;

    // ASSINATURAS FIXAS
    const posAssinaturas = 220;
    doc.setFontSize(9);

    // ESQUERDA - CONTRATADA
    doc.setFont('helvetica', 'bold');
    doc.text('CONTRATADA:', 15, posAssinaturas);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('G & S SOLUÇÕES EM ENERGIA', 15, posAssinaturas + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('VISTO:', 15, posAssinaturas + 16);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('NOME:', 15, posAssinaturas + 26);
    doc.text(nomeUsuario, 35, posAssinaturas + 26);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('VISTO LT/PM:', 15, posAssinaturas + 38);
    doc.setFont('helvetica', 'normal');

    // DIREITA - FISCALIZAÇÃO
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('FISCALIZAÇÃO:', 100, posAssinaturas);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(projeto.cliente || 'Cliente', 100, posAssinaturas + 6);
    doc.setFontSize(8);
    doc.text('NOME:', 100, posAssinaturas + 16);
    doc.text('SETOR:', 100, posAssinaturas + 26);
    doc.text('ENTREGUE DIA:', 20, posAssinaturas + 60);
    doc.text('RETORNO DIA:', 90, posAssinaturas + 60);
  });

  doc.save(`RDOs_${formatarData(new Date())}.pdf`);
};
