// src/pages/Painel.jsx
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { User, FileText, FolderKanban, Clock, TrendingUp, Award, Zap, Activity, Target, Plus, BarChart3, Users2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { format } from 'date-fns';

export default function Painel() {
  const { usuario } = useAuth();
  const [rdos] = useLocalStorage('rdos', []);
  const [projetos] = useLocalStorage('projetos', []);
  const navigate = useNavigate();

  const stats = React.useMemo(() => {
    const hoje = new Date();
    const mesAtual = format(hoje, 'yyyy-MM');

    const totalRdos = rdos.length;
    const rdosMesAtual = rdos.filter((r) => r.data?.startsWith(mesAtual)).length;

    const projetosAtivos = projetos.filter((p) => p.ativo !== false).length;

    let totalHorasMes = 0;
    let totalHorasExtras = 0;

    if (rdos.length > 0) {
      rdos.forEach((rdo) => {
        if (rdo.data?.startsWith(mesAtual)) {
          const resumo = rdo.resumoHoras || { totalHorasLiquidas: 0, horasExtras: 0 };
          totalHorasMes += resumo.totalHorasLiquidas || 0;
          totalHorasExtras += resumo.horasExtras || 0;
        }
      });
    }

    return {
      totalRdos,
      rdosMesAtual,
      totalHorasMes: Math.round(totalHorasMes * 10) / 10,
      totalProjetos: projetos.length,
      projetosAtivos,
      horasExtrasMes: Math.round(totalHorasExtras * 10) / 10,
    };
  }, [rdos, projetos]);

  const abrirNovoRDO = () => navigate('/rdos');
  const gerenciarProjetos = () => navigate('/projetos');
  const gerenciarUsuarios = () => navigate('/usuarios');

  return (
    <div className="px-3 py-4 sm:px-4 md:px-6 md:py-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* HEADER */}
      <div className="max-w-7xl mx-auto mb-10 sm:mb-12">
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center bg-white/80 backdrop-blur-xl px-5 sm:px-8 py-3 sm:py-4 rounded-3xl shadow-2xl border border-white/50 mb-6 sm:mb-8">
            <div className="w-3 h-3 bg-green-400 rounded-full mr-3 animate-pulse" />
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-2 sm:mb-4">
              Sistema G&amp;S
            </h1>
          </div>
          <p className="text-base sm:text-xl md:text-2xl text-gray-700 max-w-2xl mx-auto mb-6 sm:mb-8 leading-relaxed">
            Controle total dos seus Relatórios Diários de Obra.
            <span className="font-semibold text-blue-600">
              {' '} {stats.rdosMesAtual} RDOs neste mês
            </span>
          </p>

          {/* BLOCO DO USUÁRIO COM FOTO */}
          <div className="flex flex-wrap gap-4 justify-center max-w-2xl mx-auto">
            <div className="bg-white/70 backdrop-blur-xl px-6 py-3 rounded-2xl shadow-lg border border-white/50 text-sm flex items-center space-x-3">
              {usuario?.fotoPerfil ? (
                <img
                  src={usuario.fotoPerfil}
                  alt={usuario?.nome}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-300"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}

              <div>
                <div className="font-bold text-emerald-700">
                  {usuario?.nome}
                </div>
                <div className="text-xs text-gray-600">{usuario?.email}</div>
              </div>
            </div>

            {usuario?.admin && (
              <div className="bg-purple-100 px-6 py-3 rounded-2xl shadow-lg border border-purple-200 text-sm font-semibold text-purple-800">
                👑 MODO ADMIN
              </div>
            )}
          </div>
        </div>
      </div>

       {/* ESTATÍSTICAS */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 sm:gap-8 mb-10 sm:mb-16">
        <div className="group bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all border border-white/50 hover:-translate-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                RDOs Totais
              </p>
              <p className="text-4xl font-black text-gray-900">
                {stats.totalRdos.toLocaleString()}
              </p>
            </div>
            <FileText className="w-16 h-16 text-blue-500 opacity-75 group-hover:opacity-100 transition-all" />
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center text-sm text-emerald-600 font-semibold">
              <TrendingUp className="w-4 h-4 mr-1" />
              {stats.rdosMesAtual} neste mês
            </div>
          </div>
        </div>

        <div className="group bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all border border-white/50 hover:-translate-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Horas Trabalhadas
              </p>
              <p className="text-4xl font-black text-gray-900">
                {stats.totalHorasMes}h
              </p>
            </div>
            <Clock className="w-16 h-16 text-yellow-500 opacity-75 group-hover:opacity-100 transition-all" />
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-orange-600 font-semibold">
                {stats.horasExtrasMes}h
              </span>
              <span className="text-emerald-600">Horas Extras</span>
            </div>
          </div>
        </div>

        <div className="group bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all border border-white/50 hover:-translate-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Projetos</p>
              <p className="text-4xl font-black text-gray-900">
                {stats.totalProjetos}
              </p>
            </div>
            <FolderKanban className="w-16 h-16 text-indigo-500 opacity-75 group-hover:opacity-100 transition-all" />
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="text-sm text-indigo-600 font-semibold">
              {stats.projetosAtivos} ativos
            </div>
          </div>
        </div>

        <div className="group bg-gradient-to-br from-emerald-500 to-emerald-600 text-white p-8 rounded-3xl shadow-2xl hover:shadow-3xl transition-all border-0 hover:-translate-y-2 lg:col-span-2 xl:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-medium opacity-90 mb-2">
                Próximo RDO
              </p>
              <p className="text-3xl font-black mb-1">Hoje</p>
              <p className="text-emerald-100 text-sm">08:00 - 17:00</p>
            </div>
            <Zap className="w-20 h-20 opacity-80" />
          </div>
          <NavLink
            to="/rdos"
            className="mt-6 block w-full bg-white/20 backdrop-blur-sm text-white font-bold py-3 px-6 rounded-2xl text-center hover:bg-white/30 transition-all"
          >
            Criar RDO Agora
          </NavLink>
        </div>
      </div>

      {/* CARDS DE AÇÕES */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 mb-20 sm:mb-24">
        <div className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all border border-white/50 group hover:-translate-y-2">
          <FileText className="w-16 h-16 bg-blue-100 text-blue-600 p-4 rounded-2xl mb-6 group-hover:scale-110 transition-transform" />
          <h3 className="text-2xl font-bold text-gray-900 mb-3">RDOs Diários</h3>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Crie e gerencie seus relatórios diários com controle de horas,
            atividades e fotos
          </p>
          <NavLink
            to="/rdos"
            className="text-blue-600 font-bold text-lg hover:underline flex items-center"
          >
            Acessar RDOs <Activity className="ml-2 w-5 h-5" />
          </NavLink>
        </div>

        <div className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all border border-white/50 group hover:-translate-y-2">
          <FolderKanban className="w-16 h-16 bg-indigo-100 text-indigo-600 p-4 rounded-2xl mb-6 group-hover:scale-110 transition-transform" />
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Projetos</h3>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Gerencie todos os seus projetos e configure horas normais por
            projeto
          </p>
          <NavLink
            to="/projetos"
            className="text-indigo-600 font-bold text-lg hover:underline flex items-center"
          >
            Gerenciar Projetos <Target className="ml-2 w-5 h-5" />
          </NavLink>
        </div>

        <div className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all border border-white/50 group hover:-translate-y-2">
          <Clock className="w-16 h-16 bg-yellow-100 text-yellow-600 p-4 rounded-2xl mb-6 group-hover:scale-110 transition-transform" />
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Ficha Técnica
          </h3>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Controle mensal completo com horas extras, noturnas e sábados
          </p>
          <NavLink
            to="/ficha-tecnica"
            className="text-yellow-600 font-bold text-lg hover:underline flex items-center"
          >
            Ver Ficha <Award className="ml-2 w-5 h-5" />
          </NavLink>
        </div>
      </div>

      {/* BOTÕES FLUTUANTES */}
      <div className="fixed bottom-6 sm:bottom-8 right-6 sm:right-8 space-y-3 sm:space-y-4 z-50">
        <button
          onClick={abrirNovoRDO}
          className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-3xl shadow-2xl hover:shadow-3xl hover:scale-110 hover:-translate-y-1 transition-all duration-200 flex items-center justify-center text-xl font-bold"
          title="Novo RDO"
        >
          <Plus />
        </button>

        <div className="flex space-x-2">
          <button
            onClick={gerenciarProjetos}
            className="w-14 h-14 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 flex items-center justify-center"
            title="Gerenciar Projetos"
          >
            <FolderKanban size={18} />
          </button>

          {usuario?.admin && (
            <>
              <button
                onClick={gerenciarUsuarios}
                className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 flex items-center justify-center"
                title="Gerenciar Usuários"
              >
                <Users2 size={18} />
              </button>
              <button
                onClick={() => navigate('/relatorios')}
                className="w-14 h-14 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 flex items-center justify_center"
                title="Relatórios Admin"
              >
                <BarChart3 size={18} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
