import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCarrito } from '../context/CarritoContext';
import LogoElCairo from './LogoElCairo';

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
        <Link to="/" className="brand-logo" title="Bicicleterías El Cairo">
          <LogoElCairo height={46} />
        </Link>

        <nav className="nav-links">
          <NavLink to="/" end>Inicio</NavLink>
          <NavLink to="/bicicletas">Bicicletas</NavLink>
          <NavLink to="/repuestos">Repuestos</NavLink>
          <NavLink to="/taller">Taller</NavLink>
          {esAdmin && (
            <NavLink to="/admin" className="admin-badge-link">
              Panel Admin
            </NavLink>
          )}
        </nav>

        <div className="nav-actions">
          <Link to="/carrito" className="cart-btn">
            <span>Carrito</span>
            {cantidadTotalItems > 0 && (
              <span className="cart-badge">{cantidadTotalItems}</span>
            )}
          </Link>

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
      </div>
    </header>
  );
}
