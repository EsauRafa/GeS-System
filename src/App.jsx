import React, { useState } from 'react';
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
  NavLink,
  useNavigate,
} from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import {
  BarChart3,
  LogOut,
  User,
  Users,
  Settings,
  Home,
  FolderKanban,
  Clock,
  FileText,
} from 'lucide-react';

import Login from './pages/Login.jsx';
import Cadastro from './pages/Cadastro.jsx';
import RDOs from './pages/RDOs.jsx';
import Relatorios from './pages/Relatorios.jsx';
import Usuarios from './pages/Usuarios.jsx';
import Projetos from './pages/Projetos.jsx';
import FichaTecnica from './pages/FichaTecnica.jsx';
import CalculadoraMedicao from './pages/CalculadoraMedicao.jsx';
import PaginaFutura from './pages/PaginaFutura.jsx';
import Painel from './pages/Painel.jsx';

// ==================== MENU LATERAL ====================
const MenuLateral = () => {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [openRdoMenu, setOpenRdoMenu] = useState(false);
  const [openConfigMenu, setOpenConfigMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="h-full w-64 bg-gradient-to-b from-blue-600 to-blue-800 text-white shadow-2xl flex flex-col overflow-hidden">
      {/* HEADER */}
      <div className="p-4 sm:p-6 border-b border-blue-500 h-20 flex-shrink-0 flex items-center">
        <div>
          <h1 className="text-lg sm:text-xl font-bold mb-1">Sistema G&amp;S</h1>
          <p className="text-blue-200 text-xs">G&amp;S Soluções</p>
        </div>
      </div>

      {/* MENU SCROLLÁVEL */}
      <div className="flex-1 min-h-0 overflow-hidden p-3 pt-2 sm:p-4">
        <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-blue-800 pr-1 sm:pr-2 space-y-2">
          {/* Painel */}
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center space-x-3 p-2.5 sm:p-3 rounded-xl w-full transition-all font-medium block ${
                isActive ? 'bg-blue-400 text-white shadow-md' : 'hover:bg-blue-500 text-blue-100'
              }`
            }
          >
            <Home size={18} />
            <span>Painel</span>
          </NavLink>

          {/* MENU PRINCIPAL: RDOs (COLLAPSIBLE) */}
          <button
            type="button"
            onClick={() => setOpenRdoMenu((prev) => !prev)}
            className="w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-blue-700 hover:bg-blue-600 transition-all text-xs sm:text-sm font-semibold mt-2"
          >
            <span className="flex items-center space-x-2">
              <FileText size={18} />
              <span>RDOs</span>
            </span>
            <span className={`transform transition-transform ${openRdoMenu ? 'rotate-90' : ''}`}>
              ▶
            </span>
          </button>

          {openRdoMenu && (
            <div className="ml-3 sm:ml-4 mt-1 space-y-1">
              <NavLink
                to="/rdos"
                className={({ isActive }) =>
                  `flex items-center space-x-3 p-2 rounded-lg w-full text-xs sm:text-sm transition-all ${
                    isActive
                      ? 'bg-blue-400 text-white shadow-md'
                      : 'hover:bg-blue-500 text-blue-100'
                  }`
                }
              >
                <FileText size={18} />
                <span>Relatórios Diários</span>
              </NavLink>

              <NavLink
                to="/ficha-tecnica"
                className={({ isActive }) =>
                  `flex items-center space-x-3 p-2 rounded-lg w-full text-xs sm:text-sm transition-all ${
                    isActive
                      ? 'bg-yellow-500 text-white shadow-md'
                      : 'hover:bg-blue-500 text-blue-100'
                  }`
                }
              >
                <Clock size={18} />
                <span>Ficha Técnica</span>
              </NavLink>

              <NavLink
                to="/relatorios"
                className={({ isActive }) =>
                  `flex items-center space-x-3 p-2 rounded-lg w-full text-xs sm:text-sm transition-all ${
                    isActive
                      ? 'bg-emerald-500 text-white shadow-md'
                      : 'hover:bg-blue-500 text-blue-100'
                  }`
                }
              >
                <BarChart3 size={18} />
                <span>Exportar Relatórios</span>
              </NavLink>
            </div>
          )}

          {/* MENU: CONFIGURAÇÕES GERAIS (COLLAPSIBLE) */}
          <button
            type="button"
            onClick={() => setOpenConfigMenu((prev) => !prev)}
            className="w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-blue-700 hover:bg-blue-600 transition-all text-xs sm:text-sm font-semibold mt-3"
          >
            <span className="flex items-center space-x-2">
              <Settings size={18} />
              <span>Configurações Gerais</span>
            </span>
            <span className={`transform transition-transform ${openConfigMenu ? 'rotate-90' : ''}`}>
              ▶
            </span>
          </button>

          {openConfigMenu && (
            <div className="ml-3 sm:ml-4 mt-1 space-y-1">
              <NavLink
                to="/configuracoes"
                className={({ isActive }) =>
                  `flex items-center space-x-3 p-2 rounded-lg w-full text-xs sm:text-sm transition-all ${
                    isActive
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'hover:bg-blue-500 text-blue-100'
                  }`
                }
              >
                <Settings size={20} />
                <span>Configurações</span>
              </NavLink>
            </div>
          )}

          {/* SEÇÃO ADMINISTRAÇÃO */}
          {usuario?.admin && (
            <>
              <div className="mt-4 pt-4 border-t border-blue-500/60">
                <span className="text-[10px] sm:text-xs font-semibold tracking-[0.2em] uppercase text-blue-200">
                  Administração
                </span>
              </div>

              <NavLink
                to="/usuarios"
                className={({ isActive }) =>
                  `flex items-center space-x-3 p-2.5 sm:p-3 rounded-xl w-full transition-all font-medium block ${
                    isActive
                      ? 'bg-purple-500 text-white shadow-md'
                      : 'hover:bg-blue-500 text-blue-100'
                  }`
                }
              >
                <Users size={20} />
                <span>Usuários</span>
              </NavLink>

              <NavLink
                to="/projetos"
                className={({ isActive }) =>
                  `flex items-center space-x-3 p-2.5 sm:p-3 rounded-xl w-full transition-all font-medium block ${
                    isActive
                      ? 'bg-indigo-500 text-white shadow-md'
                      : 'hover:bg-blue-500 text-blue-100'
                  }`
                }
              >
                <FolderKanban size={20} />
                <span>Projetos</span>
              </NavLink>

              <NavLink
                to="/calculadora-medicao"
                className={({ isActive }) =>
                  `flex items-center space-x-3 p-2.5 sm:p-3 rounded-xl w-full transition-all font-medium block ${
                    isActive
                      ? 'bg-teal-500 text-white shadow-md'
                      : 'hover:bg-blue-500 text-blue-100'
                  }`
                }
              >
                <BarChart3 size={18} />
                <span>Cálculo Medição</span>
              </NavLink>

              <NavLink
                to="/pagina-futura"
                className={({ isActive }) =>
                  `flex items-center space-x-3 p-2.5 sm:p-3 rounded-xl w-full transition-all font-medium block ${
                    isActive
                      ? 'bg-pink-500 text-white shadow-md'
                      : 'hover:bg-blue-500 text-blue-100'
                  }`
                }
              >
                <Settings size={20} />
                <span>Futura Adição</span>
              </NavLink>
            </>
          )}
        </div>
      </div>

      {/* RODAPÉ COM FOTO DO USUÁRIO */}
      <div className="p-3 sm:p-4 border-t border-blue-500 bg-blue-700/50 backdrop-blur-sm flex-shrink-0">
        <div className="text-center mb-3 p-1.5">
          {usuario?.fotoPerfil ? (
            <img
              src={usuario.fotoPerfil}
              alt={usuario?.nome}
              className="w-10 h-10 sm:w-12 sm:h-12 mx-auto rounded-full object-cover ring-2 ring-blue-300 mb-2"
            />
          ) : (
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-2">
              <User size={16} />
            </div>
          )}
          <p className="font-medium text-xs sm:text-sm truncate">{usuario?.nome}</p>
          <p className="text-[10px] sm:text-xs text-blue-200 truncate">{usuario?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-2 p-2.5 sm:p-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium transition-all text-xs sm:text-sm shadow-md"
        >
          <LogOut size={18} />
          <span>Sair</span>
        </button>
      </div>
    </div>
  );
};

// ==================== LAYOUT PRINCIPAL RESPONSIVO ====================
const LayoutPrincipal = ({ children }) => {
  const [menuAberto, setMenuAberto] = useState(false);

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* SIDEBAR DESKTOP */}
      <div className="hidden md:block fixed left-0 top-0 h-screen z-40">
        <MenuLateral />
      </div>

      {/* SIDEBAR MOBILE (overlay) */}
      {menuAberto && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="w-64 h-full">
            <MenuLateral />
          </div>
          <div className="flex-1 bg-black/40" onClick={() => setMenuAberto(false)} />
        </div>
      )}

      {/* CONTEÚDO */}
      <div className="flex-1 flex flex-col md:ml-64">
        {/* TOPBAR MOBILE */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white shadow-sm border-b">
          <button
            onClick={() => setMenuAberto(true)}
            className="p-2 rounded-md border border-gray-200 bg-gray-50"
            aria-label="Abrir menu"
          >
            ☰
          </button>
          <span className="font-semibold text-sm">Sistema G&amp;S</span>
        </div>

        {/* CONTEÚDO PRINCIPAL */}
        <div className="p-4 md:p-8">{children}</div>
      </div>
    </div>
  );
};

// ==================== PROTECTED ROUTE ====================
const ProtectedRoute = ({ children }) => {
  const { isAutenticado } = useAuth();
  return isAutenticado ? children : <Navigate to="/login" />;
};

// ==================== CONFIG PAGE ====================
const ConfiguracoesPage = () => (
  <div className="max-w-4xl mx-auto p-4 sm:p-8">
    <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Configurações</h1>
    <p>Configurações do sistema em desenvolvimento.</p>
  </div>
);

// ==================== APP CONTENT ====================
function AppContent() {
  return (
    <Router>
      <Routes>
        {/* Público */}
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />

        {/* Protegidas */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <LayoutPrincipal>
                <Painel />
              </LayoutPrincipal>
            </ProtectedRoute>
          }
        />

        <Route
          path="/rdos"
          element={
            <ProtectedRoute>
              <LayoutPrincipal>
                <RDOs />
              </LayoutPrincipal>
            </ProtectedRoute>
          }
        />

        <Route
          path="/ficha-tecnica"
          element={
            <ProtectedRoute>
              <LayoutPrincipal>
                <FichaTecnica />
              </LayoutPrincipal>
            </ProtectedRoute>
          }
        />

        <Route
          path="/relatorios"
          element={
            <ProtectedRoute>
              <LayoutPrincipal>
                <Relatorios />
              </LayoutPrincipal>
            </ProtectedRoute>
          }
        />

        <Route
          path="/calculadora-medicao"
          element={
            <ProtectedRoute>
              <LayoutPrincipal>
                <CalculadoraMedicao />
              </LayoutPrincipal>
            </ProtectedRoute>
          }
        />

        <Route
          path="/usuarios"
          element={
            <ProtectedRoute>
              <LayoutPrincipal>
                <Usuarios />
              </LayoutPrincipal>
            </ProtectedRoute>
          }
        />

        <Route
          path="/projetos"
          element={
            <ProtectedRoute>
              <LayoutPrincipal>
                <Projetos />
              </LayoutPrincipal>
            </ProtectedRoute>
          }
        />

        <Route
          path="/pagina-futura"
          element={
            <ProtectedRoute>
              <LayoutPrincipal>
                <PaginaFutura />
              </LayoutPrincipal>
            </ProtectedRoute>
          }
        />

        <Route
          path="/configuracoes"
          element={
            <ProtectedRoute>
              <LayoutPrincipal>
                <ConfiguracoesPage />
              </LayoutPrincipal>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

// ==================== ROOT APP ====================
export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
