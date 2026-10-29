import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { usuario, cargando, esAdmin } = useAuth();

  if (cargando) {
    return <div className="container page-loader">Verificando sesión...</div>;
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !esAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}

