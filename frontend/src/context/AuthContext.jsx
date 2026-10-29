import { createContext, useContext, useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const usuarioGuardado = localStorage.getItem('bicicleteria_usuario');
    const tokenGuardado = localStorage.getItem('bicicleteria_token');
    if (usuarioGuardado && tokenGuardado) {
      try {
        setUsuario(JSON.parse(usuarioGuardado));
      } catch {
        localStorage.removeItem('bicicleteria_usuario');
        localStorage.removeItem('bicicleteria_token');
      }
    }
    setCargando(false);
  }, []);

  const login = async (email, password) => {
    const { data } = await axiosClient.post('/auth/login', { email, password });
    localStorage.setItem('bicicleteria_token', data.token);
    localStorage.setItem('bicicleteria_usuario', JSON.stringify(data));
    setUsuario(data);
    return data;
  };

  const registro = async (datosRegistro) => {
    const { data } = await axiosClient.post('/auth/registro', datosRegistro);
    localStorage.setItem('bicicleteria_token', data.token);
    localStorage.setItem('bicicleteria_usuario', JSON.stringify(data));
    setUsuario(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('bicicleteria_token');
    localStorage.removeItem('bicicleteria_usuario');
    setUsuario(null);
  };

  const esAdmin = usuario?.rol === 'Administrador';

  return (
    <AuthContext.Provider value={{ usuario, cargando, esAdmin, login, registro, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

