import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import { Plus, FileText, BarChart3, LogOut, User, Users, Settings, Home, FolderKanban, Clock, TrendingUp, DollarSign, Calendar, Activity, Target, Award, Zap, Eye, Users2, CalendarDays } from 'lucide-react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Login from './pages/Login.jsx';
import Cadastro from './pages/Cadastro.jsx';
import RDOs from './pages/RDOs.jsx';
import Relatorios from './pages/Relatorios.jsx';
import Usuarios from './pages/Usuarios.jsx';
import Projetos from './pages/Projetos.jsx'; 
import FichaTecnica from './pages/FichaTecnica.jsx';
import CalculadoraMedicao from './pages/CalculadoraMedicao.jsx';
import PaginaFutura from './pages/PaginaFutura.jsx';

// ✅ DASHBOARD COMPLETO
const HomePage = () => {
  const { usuario } = useAuth();
  const [rdos] = useLocalStorage("rdos", []);
  const [projetos] = useLocalStorage("projetos", []);
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    totalRdos: 0,
    rdosMesAtual: 0,
    totalHorasMes: 0,
    totalProjetos: 0,
    projetosAtivos: 0,
    horasExtrasMes: 0
  });

  useEffect(() => {
    const hoje = new Date();
    const mesAtual = format(hoje, "yyyy-MM");
    
    const totalRdos = rdos.length;
    const rdosMesAtual = rdos.filter(r => r.data.startsWith(mesAtual)).length;
    
    const projetosAtivos = projetos.filter(p => p.ativo !== false).length;
    
    let totalHorasMes = 0;
    let totalHorasExtras = 0;
    
    if (rdos.length > 0) {
      rdos.forEach(rdo => {
        if (rdo.data.startsWith(mesAtual)) {
          const resumo = rdo.resumoHoras || { totalHorasLiquidas: 0, horasExtras: 0 };
          totalHorasMes += resumo.totalHorasLiquidas || 0;
          totalHorasExtras += resumo.horasExtras || 0;
        }
      });
    }

    setStats({
      totalRdos,
      rdosMesAtual,
      totalHorasMes: Math.round(totalHorasMes * 10) / 10,
      totalProjetos: projetos.length,
      projetosAtivos,
      horasExtrasMes: Math.round(totalHorasExtras * 10) / 10
    });
  }, [rdos, projetos]);

  const abrirNovoRDO = () => navigate('/rdos');
  const gerenciarProjetos = () => navigate('/projetos');
  const gerenciarUsuarios = () => navigate('/usuarios');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-6">
      {/* HEADER */}
      <div className="max-w-7xl mx-auto mb-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center bg-white/80 backdrop-blur-xl px-8 py-4 rounded-3xl shadow-2xl border border-white/50 mb-8">
            <div className="w-3 h-3 bg-green-400 rounded-full mr-3 animate-pulse"></div>
            <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-4">
              Dashboard RDO
            </h1>
          </div>
          <p className="text-xl md:text-2xl text-gray-700 max-w-2xl mx-auto mb-8 leading-relaxed">
            Controle total dos seus Relatórios Diários de Obra. 
            <span className="font-semibold text-blue-600"> {stats.rdosMesAtual} RDOs neste mês</span>
          </p>
          <div className="flex flex-wrap gap-4 justify-center max-w-2xl mx-auto">
            <div className="bg-white/70 backdrop-blur-xl px-6 py-3 rounded-2xl shadow-lg border border-white/50 text-sm">
              <span className="font-bold text-emerald-700">{usuario?.nome}</span> • {usuario?.email}
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
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-8 mb-16">
        <div className="group bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all border border-white/50 hover:-translate-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">RDOs Totais</p>
              <p className="text-4xl font-black text-gray-900">{stats.totalRdos.toLocaleString()}</p>
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
              <p className="text-sm font-medium text-gray-600 mb-1">Horas Trabalhadas</p>
              <p className="text-4xl font-black text-gray-900">{stats.totalHorasMes}h</p>
            </div>
            <Clock className="w-16 h-16 text-yellow-500 opacity-75 group-hover:opacity-100 transition-all" />
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-orange-600 font-semibold">{stats.horasExtrasMes}h</span>
              <span className="text-emerald-600">Horas Extras</span>
            </div>
          </div>
        </div>

        <div className="group bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all border border-white/50 hover:-translate-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Projetos</p>
              <p className="text-4xl font-black text-gray-900">{stats.totalProjetos}</p>
            </div>
            <FolderKanban className="w-16 h-16 text-indigo-500 opacity-75 group-hover:opacity-100 transition-all" />
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="text-sm text-indigo-600 font-semibold">{stats.projetosAtivos} ativos</div>
          </div>
        </div>

        <div className="group bg-gradient-to-br from-emerald-500 to-emerald-600 text-white p-8 rounded-3xl shadow-2xl hover:shadow-3xl transition-all border-0 hover:-translate-y-2 lg:col-span-2 xl:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-medium opacity-90 mb-2">Próximo RDO</p>
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
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-24">
        <div className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all border border-white/50 group hover:-translate-y-2">
          <FileText className="w-16 h-16 bg-blue-100 text-blue-600 p-4 rounded-2xl mb-6 group-hover:scale-110 transition-transform" />
          <h3 className="text-2xl font-bold text-gray-900 mb-3">RDOs Diários</h3>
          <p className="text-gray-600 mb-6 leading-relaxed">Crie e gerencie seus relatórios diários com controle de horas, atividades e fotos</p>
          <NavLink to="/rdos" className="text-blue-600 font-bold text-lg hover:underline flex items-center">
            Acessar RDOs <Activity className="ml-2 w-5 h-5" />
          </NavLink>
        </div>

        <div className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all border border-white/50 group hover:-translate-y-2">
          <FolderKanban className="w-16 h-16 bg-indigo-100 text-indigo-600 p-4 rounded-2xl mb-6 group-hover:scale-110 transition-transform" />
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Projetos</h3>
          <p className="text-gray-600 mb-6 leading-relaxed">Gerencie todos os seus projetos e configure horas normais por projeto</p>
          <NavLink to="/projetos" className="text-indigo-600 font-bold text-lg hover:underline flex items-center">
            Gerenciar Projetos <Target className="ml-2 w-5 h-5" />
          </NavLink>
        </div>

        <div className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all border border-white/50 group hover:-translate-y-2">
          <Clock className="w-16 h-16 bg-yellow-100 text-yellow-600 p-4 rounded-2xl mb-6 group-hover:scale-110 transition-transform" />
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Ficha Técnica</h3>
          <p className="text-gray-600 mb-6 leading-relaxed">Controle mensal completo com horas extras, noturnas e sábados</p>
          <NavLink to="/ficha-tecnica" className="text-yellow-600 font-bold text-lg hover:underline flex items-center">
            Ver Ficha <Award className="ml-2 w-5 h-5" />
          </NavLink>
        </div>
      </div>

      {/* ✅ BOTÕES FLUTUANTES */}
      <div className="fixed bottom-8 right-8 space-y-4 z-50">
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
                className="w-14 h-14 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 flex items-center justify-center"
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
};

// ✅ MENU LATERAL
const MenuLateral = () => {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-blue-600 to-blue-800 text-white shadow-2xl z-40 flex flex-col overflow-hidden">
      <div className="p-6 border-b border-blue-500 h-20 flex-shrink-0 flex items-center">
        <div>
          <h1 className="text-xl font-bold mb-1">Sistema RDO</h1>
          <p className="text-blue-200 text-xs">G&S Soluções</p>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden p-4 pt-2">
        <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-blue-800 pr-2 space-y-2">
          <NavLink 
            to="/" 
            end
            className={({ isActive }) =>
              `flex items-center space-x-3 p-3 rounded-xl w-full transition-all font-medium block ${
                isActive ? 'bg-blue-400 text-white shadow-md' : 'hover:bg-blue-500 text-blue-100'
              }`
            }
          >
            <Home size={20} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink 
            to="/rdos" 
            className={({ isActive }) =>
              `flex items-center space-x-3 p-3 rounded-xl w-full transition-all font-medium block ${
                isActive ? 'bg-blue-400 text-white shadow-md' : 'hover:bg-blue-500 text-blue-100'
              }`
            }
          >
            <FileText size={20} />
            <span>Relatórios Diários</span>
          </NavLink>

          <NavLink 
            to="/relatorios" 
            className={({ isActive }) =>
              `flex items-center space-x-3 p-3 rounded-xl w-full transition-all font-semibold block ${
                isActive ? 'bg-emerald-500 text-white shadow-md border-r-4 border-emerald-300' : 'hover:bg-blue-500 text-blue-100'
              }`
            }
          >
            <BarChart3 size={20} />
            <span>Exportar Relatórios</span>
          </NavLink>

          <NavLink 
            to="/projetos" 
            className={({ isActive }) =>
              `flex items-center space-x-3 p-3 rounded-xl w-full transition-all font-medium block ${
                isActive ? 'bg-indigo-500 text-white shadow-md' : 'hover:bg-blue-500 text-blue-100'
              }`
            }
          >
            <FolderKanban size={20} />
            <span>Projetos</span>
          </NavLink>

          <NavLink 
            to="/ficha-tecnica" 
            className={({ isActive }) =>
              `flex items-center space-x-3 p-3 rounded-xl w-full transition-all font-medium block ${
                isActive ? 'bg-yellow-500 text-white shadow-md' : 'hover:bg-blue-500 text-blue-100'
              }`
            }
          >
            <Clock size={20} />
            <span>Ficha Técnica</span>
          </NavLink>

          <NavLink 
            to="/calculadora-medicao" 
            className={({ isActive }) =>
              `flex items-center space-x-3 p-3 rounded-xl w-full transition-all font-medium block ${
                isActive ? 'bg-teal-500 text-white shadow-md' : 'hover:bg-blue-500 text-blue-100'
              }`
            }
          >
            <BarChart3 size={20} />
            <span>Cálculo Medição</span>
          </NavLink>

          <NavLink 
            to="/pagina-futura" 
            className={({ isActive }) =>
              `flex items-center space-x-3 p-3 rounded-xl w-full transition-all font-medium block ${
                isActive ? 'bg-pink-500 text-white shadow-md' : 'hover:bg-blue-500 text-blue-100'
              }`
            }
          >
            <Settings size={20} />
            <span>Futura Adição</span>
          </NavLink>

          {usuario?.admin && (
            <NavLink 
              to="/usuarios" 
              className={({ isActive }) =>
                `flex items-center space-x-3 p-3 rounded-xl w-full transition-all font-medium block ${
                  isActive ? 'bg-purple-500 text-white shadow-md' : 'hover:bg-blue-500 text-blue-100'
                }`
              }
            >
              <Users size={20} />
              <span>Usuários</span>
            </NavLink>
          )}

          <NavLink 
            to="/configuracoes" 
            className={({ isActive }) =>
              `flex items-center space-x-3 p-3 rounded-xl w-full transition-all font-medium block ${
                isActive ? 'bg-orange-500 text-white shadow-md' : 'hover:bg-blue-500 text-blue-100'
              }`
            }
          >
            <Settings size={20} />
            <span>Configurações</span>
          </NavLink>
        </div>
      </div>

      <div className="p-4 border-t border-blue-500 bg-blue-700/50 backdrop-blur-sm flex-shrink-0">
        <div className="text-center mb-3 p-2">
          <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-2">
            <User size={16} />
          </div>
          <p className="font-medium text-sm truncate">{usuario?.nome}</p>
          <p className="text-xs text-blue-200 truncate">{usuario?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-2 p-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium transition-all text-sm shadow-md"
        >
          <LogOut size={18} />
          <span>Sair</span>
        </button>
      </div>
    </div>
  );
};

// ✅ LAYOUT PRINCIPAL
const LayoutPrincipal = ({ children }) => (
  <div className="flex">
    <MenuLateral />
    <div className="ml-64 flex-1 p-8 bg-gray-50 min-h-screen">
      {children}
    </div>
  </div>
);

// ✅ PROTECTED ROUTE
const ProtectedRoute = ({ children }) => {
  const { isAutenticado } = useAuth();
  return isAutenticado ? children : <Navigate to="/login" />;
};

// ✅ CONFIG PAGE
const ConfiguracoesPage = () => (
  <div className="max-w-4xl mx-auto p-8">
    <h1 className="text-3xl font-bold mb-6">Configurações</h1>
    <p>Configurações do sistema em desenvolvimento.</p>
  </div>
);

// ✅ APP CONTENT COMPLETO
function AppContent() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />

        <Route path="/" element={
          <ProtectedRoute>
            <LayoutPrincipal>
              <HomePage />
            </LayoutPrincipal>
          </ProtectedRoute>
        } />

        <Route path="/projetos" element={
          <ProtectedRoute>
            <LayoutPrincipal>
              <Projetos />
            </LayoutPrincipal>
          </ProtectedRoute>
        } />

        <Route path="/rdos" element={
          <ProtectedRoute>
            <LayoutPrincipal>
              <RDOs />
            </LayoutPrincipal>
          </ProtectedRoute>
        } />

        <Route path="/ficha-tecnica" element={
          <ProtectedRoute>
            <LayoutPrincipal>
              <FichaTecnica />
            </LayoutPrincipal>
          </ProtectedRoute>
        } />

        <Route path="/relatorios" element={
          <ProtectedRoute>
            <LayoutPrincipal>
              <Relatorios />
            </LayoutPrincipal>
          </ProtectedRoute>
        } />

        <Route path="/usuarios" element={
          <ProtectedRoute>
            <LayoutPrincipal>
              <Usuarios />
            </LayoutPrincipal>
          </ProtectedRoute>
        } />

        <Route path="/calculadora-medicao" element={
          <ProtectedRoute>
            <LayoutPrincipal>
              <CalculadoraMedicao />
            </LayoutPrincipal>
          </ProtectedRoute>
        } />

        <Route path="/pagina-futura" element={
          <ProtectedRoute>
            <LayoutPrincipal>
              <PaginaFutura />
            </LayoutPrincipal>
          </ProtectedRoute>
        } />

        <Route path="/configuracoes" element={
          <ProtectedRoute>
            <LayoutPrincipal>
              <ConfiguracoesPage />
            </LayoutPrincipal>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
