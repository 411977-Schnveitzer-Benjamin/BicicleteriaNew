import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CarritoProvider } from './context/CarritoContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
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
                {/* Pantalla Principal (Intro + Carrusel con Difuminado en Movimiento) */}
                <Route path="/" element={<HomePage />} />

                {/* Secciones Separadas */}
                <Route path="/bicicletas" element={<CatalogoPage seccion="Bicicletas" />} />
                <Route path="/repuestos" element={<CatalogoPage seccion="Repuestos" />} />
                <Route path="/taller" element={<TallerPage />} />
                <Route path="/carrito" element={<CarritoPage />} />
                <Route path="/login" element={<LoginPage />} />

                {/* Checkout Privado */}
                <Route
                  path="/checkout"
                  element={
                    <ProtectedRoute>
                      <CheckoutPage />
                    </ProtectedRoute>
                  }
                />

                {/* Panel de Administración Separado */}
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
                © {new Date().getFullYear()} <strong>Bicicleterías El Cairo</strong> · Tienda Oficial & Service Especializado
              </div>
            </footer>
          </div>
        </BrowserRouter>
      </CarritoProvider>
    </AuthProvider>
  );
}
