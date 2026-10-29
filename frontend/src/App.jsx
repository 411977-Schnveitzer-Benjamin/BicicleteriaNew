import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CarritoProvider } from './context/CarritoContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import CatalogoPage from './pages/CatalogoPage';
import CarritoPage from './pages/CarritoPage';
import CheckoutPage from './pages/CheckoutPage';
import TallerPage from './pages/TallerPage';
import LoginPage from './pages/LoginPage';
import BackofficeAdminPage from './pages/BackofficeAdminPage';

export default function App() {
  return (
    <AuthProvider>
      <CarritoProvider>
        <BrowserRouter>
          <div className="app-shell">
            <Navbar />
            <main className="main-content">
              <Routes>
                {/* Rutas Públicas */}
                <Route path="/" element={<CatalogoPage />} />
                <Route path="/taller" element={<TallerPage />} />
                <Route path="/carrito" element={<CarritoPage />} />
                <Route path="/login" element={<LoginPage />} />

                {/* Ruta Privada para Clientes Autenticados */}
                <Route
                  path="/checkout"
                  element={
                    <ProtectedRoute>
                      <CheckoutPage />
                    </ProtectedRoute>
                  }
                />

                {/* Sagrado Backoffice Exclusivo para Rol Administrador */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute requireAdmin={true}>
                      <BackofficeAdminPage />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </main>
            <footer className="footer">
              <div className="container">
                © {new Date().getFullYear()} Bicicletería Pro · .NET 8 Web API + EF Core + SQL Server + Cloudinary + React
              </div>
            </footer>
          </div>
        </BrowserRouter>
      </CarritoProvider>
    </AuthProvider>
  );
}

