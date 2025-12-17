/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/client';
import { useLocalStorage } from '../hooks/useLocalStorage';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useLocalStorage('usuario', null);
  const [usuarios, setUsuarios] = useState([]);

  // Restore user from localStorage if present
  useEffect(() => {
    const storedUser = localStorage.getItem('usuario');
    const token = localStorage.getItem('token');
    if (token && storedUser && !usuario) {
      try {
        setUsuario(JSON.parse(storedUser));
      } catch {
        // ignore malformed stored user
      }
    }
  }, [usuario, setUsuario]);

  // Fetch users list when admin logs in
  useEffect(() => {
    const loadUsuarios = async () => {
      if (!usuario?.admin) {
        setUsuarios([]);
        return;
      }
      try {
        const list = await api.get('/api/usuarios');
        setUsuarios(list || []);
      } catch (err) {
        console.error('Erro ao carregar usuários:', err);
      }
    };
    loadUsuarios();
  }, [usuario]);

  const login = async (email, senha) => {
    try {
      const body = await api.post('/api/login', { email, senha });
      if (body && body.token) {
        localStorage.setItem('token', body.token);
        if (body.user) {
          localStorage.setItem('usuario', JSON.stringify(body.user));
          setUsuario(body.user);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao conectar:', error);
      return false;
    }
  };

  const cadastrar = async (nome, email, senha, admin = false) => {
    try {
      const created = await api.post('/api/usuarios', { nome, email, senha, admin });
      if (created) setUsuarios((prev) => [created, ...prev]);
      return created;
    } catch (err) {
      console.error('Erro ao cadastrar:', err);
      return null;
    }
  };

  const logout = () => {
    setUsuario(null);
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        login,
        cadastrar,
        logout,
        usuarios,
        setUsuarios,
        isAutenticado: !!usuario,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
