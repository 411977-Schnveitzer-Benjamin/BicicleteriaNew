import { Link, useNavigate } from 'react-router-dom';
import { useCarrito } from '../context/CarritoContext';
import { useAuth } from '../context/AuthContext';

export default function CarritoPage() {
  const { items, totalCarrito, cambiarCantidad, quitarDelCarrito, vaciarCarrito } = useCarrito();
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const handleIrACheckout = () => {
    if (!usuario) {
      navigate('/login');
      return;
    }
    navigate('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="container page-section empty-state">
        <h2>Tu carrito de compras está vacío 🛒</h2>
        <p>Agregá bicicletas, componentes Shimano/SRAM o accesorios desde nuestro catálogo.</p>
        <Link to="/" className="btn-primary">Explorar Catálogo</Link>
      </div>
    );
  }

  return (
    <div className="container page-section">
      <div className="section-header-flex">
        <h1>Tu Carrito de Compras</h1>
        <button onClick={vaciarCarrito} className="btn-outline btn-sm">Vaciar Carrito</button>
      </div>

      <div className="cart-layout">
        <div className="cart-items-list">
          {items.map((item) => (
            <div key={item.productoId} className="cart-item-row">
              <div className="cart-item-info">
                <strong>{item.nombreProducto}</strong>
                <small>{item.marcaNombre}</small>
                <span className="unit-price">${item.precioUnitario.toLocaleString('es-AR')} c/u</span>
              </div>

              <div className="cart-item-controls">
                <button
                  className="qty-btn"
                  onClick={() => cambiarCantidad(item.productoId, item.cantidad - 1)}
                >
                  -
                </button>
                <span className="qty-number">{item.cantidad}</span>
                <button
                  className="qty-btn"
                  onClick={() => cambiarCantidad(item.productoId, item.cantidad + 1)}
                >
                  +
                </button>
              </div>

              <div className="cart-item-subtotal">
                <strong>${(item.precioUnitario * item.cantidad).toLocaleString('es-AR')}</strong>
                <button
                  onClick={() => quitarDelCarrito(item.productoId)}
                  className="btn-remove"
                >
                  Quitar
                </button>
              </div>
            </div>
          ))}
        </div>

        <aside className="cart-summary-card">
          <h3>Resumen de Compra</h3>
          <div className="summary-line">
            <span>Subtotal ({items.length} productos)</span>
            <strong>${totalCarrito.toLocaleString('es-AR')}</strong>
          </div>
          <div className="summary-line">
            <span>Envío a domicilio</span>
            <strong className="free-tag">Bonificado</strong>
          </div>
          <hr />
          <div className="summary-line summary-total">
            <span>Total a Pagar</span>
            <strong>${totalCarrito.toLocaleString('es-AR')}</strong>
          </div>

          <button onClick={handleIrACheckout} className="btn-primary btn-block">
            {usuario ? 'Continuar al Checkout →' : 'Iniciar Sesión para Comprar →'}
          </button>
        </aside>
      </div>
    </div>
  );
}

