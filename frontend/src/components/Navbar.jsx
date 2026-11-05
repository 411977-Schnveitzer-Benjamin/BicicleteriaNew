import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCarrito } from '../context/CarritoContext';
import LogoElCairo from './LogoElCairo';

export default function Navbar() {
  const { usuario, esAdmin, logout } = useAuth();
  const { cantidadTotalItems } = useCarrito();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuAbierto, setMenuAbierto] = useState(false);

  // Cerrar el menú móvil automáticamente al cambiar de ruta
  useEffect(() => {
    setMenuAbierto(false);
  }, [location.pathname]);

  const handleLogout = () => {
    setMenuAbierto(false);
    logout();
    navigate('/');
  };

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand-logo" title="Bicicleterías El Cairo">
          <LogoElCairo height={44} />
        </Link>

        <nav className={`nav-links ${menuAbierto ? 'nav-links-open' : ''}`}>
          <NavLink to="/" end>Inicio</NavLink>
          <NavLink to="/bicicletas">Bicicletas</NavLink>
          <NavLink to="/repuestos">Repuestos</NavLink>
          <NavLink to="/taller">Taller</NavLink>
          {esAdmin && (
            <NavLink to="/admin" className="admin-badge-link">
              Panel Admin
            </NavLink>
          )}

          {/* Bloque de usuario visible dentro del menú desplegable en móviles */}
          <div className="nav-mobile-user">
            {usuario ? (
              <div className="nav-mobile-user-row">
                <div>
                  <strong>{usuario.nombreCompleto}</strong>
                  <small>{usuario.rol}</small>
                </div>
                <button type="button" onClick={handleLogout} className="btn-outline btn-sm">
                  Salir
                </button>
              </div>
            ) : (
              <Link to="/login" className="btn-primary btn-sm" style={{ width: '100%' }}>
                Iniciar Sesión / Registrarme
              </Link>
            )}
          </div>
        </nav>

        <div className="nav-actions">
          <Link to="/carrito" className="cart-btn" aria-label="Carrito de compras">
            <span className="cart-icon-mobile">🛒</span>
            <span className="cart-label-text">Carrito</span>
            {cantidadTotalItems > 0 && (
              <span className="cart-badge">{cantidadTotalItems}</span>
            )}
          </Link>

          <div className="nav-desktop-auth">
            {usuario ? (
              <div className="user-pill">
                <span className="user-name">
                  {usuario.nombreCompleto.split(' ')[0]}
                  <small>{usuario.rol}</small>
                </span>
                <button onClick={handleLogout} className="btn-outline btn-sm">
                  Salir
                </button>
              </div>
            ) : (
              <Link to="/login" className="btn-primary btn-sm">
                Ingresar
              </Link>
            )}
          </div>

          <button
            type="button"
            className="mobile-menu-btn"
            onClick={() => setMenuAbierto((prev) => !prev)}
            aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuAbierto}
          >
            {menuAbierto ? '✕' : '☰'}
          </button>
        </div>
      </div>
    </header>
  );
}
