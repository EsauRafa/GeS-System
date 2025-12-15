/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useLocalStorage('usuario', null);
  const [usuarios, setUsuarios] = useLocalStorage('usuarios', [
    { id: 1, nome: 'Teste', email: 'Teste@gs.com', senha: '123456', admin: true },
  ]);

  const login = (email, senha) => {
    const usuarioEncontrado = usuarios.find((u) => u.email === email && u.senha === senha);
    if (usuarioEncontrado) {
      setUsuario(usuarioEncontrado);
      return true;
    }
    return false;
  };

  const cadastrar = (nome, email, senha) => {
    if (usuarios.find((u) => u.email === email)) {
      alert('Email já cadastrado!');
      return false;
    }
    const novoUsuario = {
      id: Date.now(),
      nome,
      email,
      senha,
      admin: false,
    };
    setUsuarios([...usuarios, novoUsuario]);
    setUsuario(novoUsuario);
    return true;
  };

  const logout = () => {
    setUsuario(null);
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
