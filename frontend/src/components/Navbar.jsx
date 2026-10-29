import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCarrito } from '../context/CarritoContext';

export default function Navbar() {
  const { usuario, esAdmin, logout } = useAuth();
  const { cantidadTotalItems } = useCarrito();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand-logo">
          <span className="brand-icon">🚴‍♂️</span>
          <div>
            <strong>BICICLETERÍA PRO</strong>
            <small>SHIMANO · SRAM · TALLER</small>
          </div>
        </Link>

        <nav className="nav-links">
          <NavLink to="/" end>Catálogo</NavLink>
          <NavLink to="/taller">Service & Taller</NavLink>
          {esAdmin && (
            <NavLink to="/admin" className="admin-badge-link">
              ⚙️ Backoffice Admin
            </NavLink>
          )}
        </nav>

        <div className="nav-actions">
          <Link to="/carrito" className="cart-btn">
            🛒 Carrito
            {cantidadTotalItems > 0 && (
              <span className="cart-badge">{cantidadTotalItems}</span>
            )}
          </Link>

          {usuario ? (
            <div className="user-pill">
              <span className="user-name">
                {usuario.nombreCompleto} <small>({usuario.rol})</small>
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
      </div>
    </header>
  );
}

