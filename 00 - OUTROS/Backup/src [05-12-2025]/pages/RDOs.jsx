import React, { useState, useEffect } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { Plus, Trash2, Save, Clock, FileText, Image, Upload } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function RDOs() {
  const [rdos, setRdos] = useLocalStorage("rdos", []);
  const [projetos] = useLocalStorage("projetos", []);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    data: format(new Date(), "yyyy-MM-dd"),
    projeto_id: "",
    naturezaServico: "HOME OFFICE",
    horarios: [{ hora_inicio: "", hora_fim: "", titulo: "", atividade: "Deslocamento" }],
    descricaoDiaria: "",
    imagens: []
  });

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

  const naturezasServico = [
    "CAMPO", "PLATAFORMA", "TREINAMENTO", "ESCRITÓRIO", "HOME OFFICE"
  ];

  // ✅ UTILITÁRIOS
  const toMinutes = (time) => {
    if (!time || time === "") return 0;
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

  // ✅ LÓGICA DE NOTURNO DA FICHA TÉCNICA (22h-06h) - CORRETA E ROBUSTA
  const calcularHorasNoturnas = (inicio, fim) => {
    function horaParaMinutos(horaStr) {
      if (!horaStr) return 0;
      const [h, m] = horaStr.split(":").map(Number);
      return h * 60 + m;
    }
    
    const inicioM = horaParaMinutos(inicio);
    const fimM = horaParaMinutos(fim);
    let total = 0;

    // ✅ PERIODOS NOTURNOS: 22h-24h (1320-1440min) + 00h-06h (0-360min)
    const noturnoInicio1 = 1320;  // 22:00
    const noturnoFim1 = 1440;     // 24:00
    const noturnoInicio2 = 0;     // 00:00
    const noturnoFim2 = 360;      // 06:00

    let fimAjustado = fimM >= inicioM ? fimM : fimM + 1440;
    
    function intervaloSobreposto(start1, end1, start2, end2) {
      const startMax = Math.max(start1, start2);
      const endMin = Math.min(end1, end2);
      return Math.max(0, endMin - startMax);
    }

    total += intervaloSobreposto(inicioM, fimAjustado, noturnoInicio1, noturnoFim1);
    total += intervaloSobreposto(inicioM, fimAjustado, noturnoInicio2, noturnoFim2);

    return Math.round((total / 60) * 100) / 100;
  };

  const calcularResumoRDO = (horarios, horasNormaisPorDia) => {
    let totalHoras = 0;
    let horasNoturnas = 0;
    let horasDeslocamentoTotal = 0;
    
    horarios.forEach(h => {
      if (h.hora_inicio && h.hora_fim) {
        const duracao = calcularDuracao(h.hora_inicio, h.hora_fim);
        totalHoras += duracao;
        horasNoturnas += calcularHorasNoturnas(h.hora_inicio, h.hora_fim);
        if (h.atividade === "Deslocamento") {
          horasDeslocamentoTotal += duracao;
        }
      }
    });
    
    const horasNormais = Math.min(totalHoras, horasNormaisPorDia);
    const horasExtras = Math.max(0, totalHoras - horasNormaisPorDia);
    
    return {
      totalHoras,
      horasNormais,
      horasExtras,
      horasNoturnas,
      horasDeslocamentoTotal
    };
  };

  // FUNÇÕES DE IMAGEM
  const convertImageToBase64 = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      url: URL.createObjectURL(file),
      file: file
    }));
    setFormData(prev => ({
      ...prev,
      imagens: [...prev.imagens, ...newImages]
    }));
    e.target.value = "";
  };

  const removeImage = (imageId) => {
    setFormData(prev => ({
      ...prev,
      imagens: prev.imagens.filter(img => img.id !== imageId)
    }));
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const projetoSelecionado = projetos.find(p => String(p.id) === String(formData.projeto_id));
    if (!projetoSelecionado) {
      alert("Selecione um projeto!");
      return;
    }
    
    const horasNormaisPorDia = Number(projetoSelecionado.horasNormais) || 8;
    const resumo = calcularResumoRDO(formData.horarios, horasNormaisPorDia);
    
    const imagensBase64 = await Promise.all(
      formData.imagens.map(async (img) => {
        if (img.file) {
          const base64 = await convertImageToBase64(img.file);
          return { id: img.id, name: img.name, size: img.size, data: base64 };
        } else {
          return { id: img.id, name: img.name, size: img.size, data: img.data };
        }
      })
    );

    const rdoData = {
      ...formData,
      id: editingId || Date.now(),
      projeto_id: formData.projeto_id,
      projeto_nome: projetoSelecionado.nome || "",
      projeto_cliente: projetoSelecionado.cliente || "",
      horasExtras: resumo.horasExtras,
      horasNoturnas: resumo.horasNoturnas,
      horasNormaisPorDia,
      imagens: imagensBase64
    };

    if (editingId) {
      setRdos(rdos.map(r => (r.id === editingId ? rdoData : r)));
    } else {
      setRdos([rdoData, ...rdos]);
    }

    setShowForm(false);
    setEditingId(null);
    setFormData({
      data: format(new Date(), "yyyy-MM-dd"),
      projeto_id: "",
      naturezaServico: "HOME OFFICE",
      horarios: [{ hora_inicio: "", hora_fim: "", titulo: "", atividade: "Deslocamento" }],
      descricaoDiaria: "",
      imagens: []
    });
  };

  const addHorario = () => {
    setFormData({
      ...formData,
      horarios: [...formData.horarios, { hora_inicio: "", hora_fim: "", titulo: "", atividade: "Deslocamento" }]
    });
  };

  const removeHorario = (index) => {
    const novosHorarios = formData.horarios.filter((_, i) => i !== index);
    setFormData({ ...formData, horarios: novosHorarios });
  };

  const updateHorario = (index, field, value) => {
    const novosHorarios = formData.horarios.map((h, i) => (i === index ? { ...h, [field]: value } : h));
    setFormData({ ...formData, horarios: novosHorarios });
  };

  // RESUMO EM TEMPO REAL
  const projetoForm = projetos.find(p => String(p.id) === String(formData.projeto_id));
  const horasNormaisForm = Number(projetoForm?.horasNormais) || 8;
  const resumoForm = projetoForm ? calcularResumoRDO(formData.horarios, horasNormaisForm) : { 
    totalHoras: 0, horasExtras: 0, horasNoturnas: 0, horasNormais: 0 
  };

  const rdosOrdenados = [...rdos].sort((a, b) => {
    const dataA = new Date(a.data + 'T00:00:00').getTime();
    const dataB = new Date(b.data + 'T00:00:00').getTime();
    return dataB - dataA;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Relatórios Diários de Obra (RDO)</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl shadow-lg hover:bg-blue-700 flex items-center space-x-2 font-medium"
        >
          <Plus size={20} />
          <span>Novo RDO</span>
        </button>
      </div>

      {/* TABELA */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
        <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">RDOs</h2>
            <span className="text-sm bg-blue-400 px-3 py-1 rounded-full">{rdosOrdenados.length} total</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase text-gray-600">Data</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase text-gray-600">Projeto</th>
                <th className="px-4 py-4 text-left text-xs font-bold uppercase text-gray-600">Horas</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase text-gray-600">Atividades</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase text-gray-600">Horários</th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase text-gray-600">Imagens</th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase text-gray-600">Natureza</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rdosOrdenados.map((rdo) => {
                const projeto = projetos.find(p => String(p.id) === String(rdo.projeto_id));
                const horasNormaisRDO = Number(rdo.horasNormaisPorDia) || 8;
                const resumo = calcularResumoRDO(rdo.horarios || [], horasNormaisRDO);
                
                return (
                  <tr key={rdo.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {format(new Date(rdo.data + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR })}
                    </td>
                    <td className="px-6 py-3">
                      <div className="font-medium text-gray-900 text-sm">{projeto?.nome || 'Sem projeto'}</div>
                      <div className="text-xs text-gray-500">{projeto?.cliente || 'Sem cliente'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-lg font-bold text-emerald-600">
                        {resumo.totalHoras.toFixed(1)}h
                      </div>
                      <div className="flex space-x-2 text-xs mt-1">
                        <span className="font-semibold text-orange-600">{resumo.horasExtras.toFixed(1)}h HE</span>
                        <span className="font-semibold text-indigo-600">{resumo.horasNoturnas.toFixed(1)}h N</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-xs font-mono text-purple-600">
                      {(rdo.horarios || []).map(h => h.atividade).filter((v, i, a) => a.indexOf(v) === i).slice(0, 3).join(', ') || '—'}
                      {(rdo.horarios || []).length > 3 && ' +'}
                    </td>
                    <td className="px-6 py-2">
                      <div className="text-xs space-y-1 max-h-16 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-blue-100 rounded">
                        {(rdo.horarios || []).map((h, i) => (
                          <div key={i} className="flex items-center text-xs text-gray-700 bg-gray-50 px-2 py-1 rounded">
                            <Clock size={10} className="mr-1 flex-shrink-0" />
                            <span className="font-mono min-w-[35px]">{h.hora_inicio}-{h.hora_fim}</span>
                            <span className="ml-1 truncate max-w-[70px]">{h.atividade}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {rdo.imagens && rdo.imagens.length > 0 ? (
                          rdo.imagens.slice(0, 3).map((img, i) => (
                            <div key={i} className="w-6 h-6 bg-gray-200 rounded overflow-hidden flex items-center justify-center">
                              <Image size={10} className="text-gray-500" />
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                        {rdo.imagens && rdo.imagens.length > 3 && (
                          <span className="text-xs text-gray-500">+{rdo.imagens.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-blue-600 font-medium">
                      {rdo.naturezaServico || '—'}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => {
                          const imagensComPreview = (rdo.imagens || []).map(img => ({
                            id: img.id,
                            name: img.name,
                            size: img.size,
                            url: img.data,
                            data: img.data
                          }));
                          setFormData({
                            data: rdo.data,
                            projeto_id: rdo.projeto_id,
                            naturezaServico: rdo.naturezaServico || "HOME OFFICE",
                            horarios: rdo.horarios || [],
                            descricaoDiaria: rdo.descricaoDiaria || "",
                            imagens: imagensComPreview
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
                          if (window.confirm("Excluir este RDO?")) {
                            setRdos(rdos.filter(r => r.id !== rdo.id));
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
            </tbody>
          </table>
        </div>
      </div>

      {/* FORMULÁRIO COMPLETO */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <h2 className="text-2xl font-bold mb-8">
              {editingId ? "Editar RDO" : "Novo RDO"}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Data *</label>
                  <input
                    type="date"
                    name="data"
                    value={formData.data}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Projeto *</label>
                  <select
                    name="projeto_id"
                    value={formData.projeto_id}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
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
                    <div className="text-2xl font-black text-emerald-700">{resumoForm.totalHoras.toFixed(1)}h</div>
                    <div className="text-xs text-gray-600 uppercase tracking-wide">Total</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-orange-600">{resumoForm.horasExtras.toFixed(1)}h</div>
                    <div className="text-xs text-gray-600 uppercase tracking-wide">HE</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-indigo-600">{resumoForm.horasNoturnas.toFixed(1)}h</div>
                    <div className="text-xs text-gray-600 uppercase tracking-wide">Noturno</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-700">{horasNormaisForm}h</div>
                    <div className="text-xs text-gray-600 uppercase tracking-wide">Normal/Dia</div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Natureza do Serviço</label>
                <select
                  name="naturezaServico"
                  value={formData.naturezaServico}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                >
                  {naturezasServico.map((ns) => (
                    <option key={ns} value={ns}>{ns}</option>
                  ))}
                </select>
              </div>

              {/* IMAGENS */}
              <div>
                <label className="block text-lg font-semibold mb-4 flex items-center space-x-2">
                  <Image size={20} className="text-blue-600" />
                  <span>Fotos do Dia <span className="text-sm text-gray-500">({formData.imagens.length})</span></span>
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-blue-400 transition-all">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center space-y-2">
                    <Upload size={32} className="text-gray-400 hover:text-blue-500" />
                    <div className="text-lg font-medium text-gray-700">Clique para adicionar fotos</div>
                    <div className="text-sm text-gray-500">PNG, JPG até 5MB cada</div>
                  </label>
                </div>
                {formData.imagens.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    {formData.imagens.map(img => (
                      <div key={img.id} className="relative group">
                        <img 
                          src={img.url} 
                          alt={img.name} 
                          className="w-full h-24 object-cover rounded-lg shadow-md"
                        />
                        <button
                          onClick={() => removeImage(img.id)}
                          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                        >
                          <Trash2 size={12} />
                        </button>
                        <div className="mt-1 text-xs truncate text-gray-600">{img.name}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* HORÁRIOS */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="text-lg font-semibold">Horários e Atividades</label>
                  <button
                    type="button"
                    onClick={addHorario}
                    className="bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 flex items-center space-x-2 text-sm"
                  >
                    <Plus size={16} />
                    <span>Adicionar</span>
                  </button>
                </div>
                <div className="space-y-4 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-blue-100 rounded px-2">
                  {formData.horarios.map((horario, index) => (
                    <div key={index} className="border p-4 rounded-xl bg-gray-50">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold">Horário {index + 1}</h4>
                        {formData.horarios.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeHorario(index)}
                            className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Hora Início</label>
                          <input
                            type="time"
                            value={horario.hora_inicio}
                            onChange={(e) => updateHorario(index, "hora_inicio", e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Hora Fim</label>
                          <input
                            type="time"
                            value={horario.hora_fim}
                            onChange={(e) => updateHorario(index, "hora_fim", e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Duração</label>
                          <input
                            className="w-full p-2 bg-gray-100 border border-gray-300 rounded-lg text-center font-mono text-emerald-700 font-bold"
                            value={`${calcularDuracao(horario.hora_inicio, horario.hora_fim).toFixed(2)}h`}
                            readOnly
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Título da Atividade</label>
                          <input
                            type="text"
                            value={horario.titulo}
                            onChange={(e) => updateHorario(index, "titulo", e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg"
                            placeholder="Ex: Desenvolvimento LP"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Código da Atividade</label>
                          <select
                            value={horario.atividade}
                            onChange={(e) => updateHorario(index, "atividade", e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg"
                          >
                            {atividades.map((ativ) => (
                              <option key={ativ} value={ativ}>{ativ}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-lg font-semibold mb-2">Descrição Diária (Registro de Atividades)</label>
                <textarea
                  name="descricaoDiaria"
                  value={formData.descricaoDiaria}
                  onChange={handleChange}
                  rows={6}
                  className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 resize-vertical"
                  placeholder="Descreva detalhadamente tudo que foi feito no dia..."
                />
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-xl shadow-lg hover:from-blue-700 hover:to-blue-800 font-semibold flex items-center justify-center space-x-2"
                >
                  <Save size={20} />
                  <span>{editingId ? "Atualizar RDO" : "Salvar RDO"}</span>
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
                      horarios: [{ hora_inicio: "", hora_fim: "", titulo: "", atividade: "Deslocamento" }],
                      descricaoDiaria: "",
                      imagens: []
                    });
                  }}
                  className="flex-1 bg-gray-500 text-white py-4 px-6 rounded-xl hover:bg-gray-600 font-semibold"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
