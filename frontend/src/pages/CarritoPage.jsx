import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCarrito } from '../context/CarritoContext';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/ConfirmModal';

export default function CarritoPage() {
  const { items, totalCarrito, cambiarCantidad, quitarDelCarrito, vaciarCarrito } = useCarrito();
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const [itemAEliminar, setItemAEliminar] = useState(null);
  const [confirmarVaciar, setConfirmarVaciar] = useState(false);
  const [avisoConfirmacion, setAvisoConfirmacion] = useState('');

  const handleIrACheckout = () => {
    if (!usuario) {
      navigate('/login');
      return;
    }
    navigate('/checkout');
  };

  const handleRestarCantidad = (item) => {
    if (item.cantidad <= 1) {
      setItemAEliminar(item);
    } else {
      cambiarCantidad(item.productoId, item.cantidad - 1);
    }
  };

  const confirmarQuitarItem = async () => {
    if (!itemAEliminar) return;
    const nombre = itemAEliminar.nombreProducto;
    await quitarDelCarrito(itemAEliminar.productoId);
    setItemAEliminar(null);
    setAvisoConfirmacion(`Se quitó "${nombre}" de tu carrito de compras.`);
  };

  const confirmarVaciarTodo = async () => {
    await vaciarCarrito();
    setConfirmarVaciar(false);
    setAvisoConfirmacion('Se vació todo el carrito de compras correctamente.');
  };

  if (items.length === 0) {
    return (
      <div className="container page-section empty-state">
        {avisoConfirmacion && (
          <div className="alert-success" style={{ maxWidth: 520, margin: '0 auto 1.5rem' }}>
            {avisoConfirmacion}
          </div>
        )}
        <h2>Tu carrito de compras está vacío</h2>
        <p>Agregá bicicletas, componentes Shimano/SRAM o accesorios desde nuestras secciones.</p>
        <div className="home-cta-group">
          <Link to="/bicicletas" className="btn-primary">Ver Bicicletas</Link>
          <Link to="/repuestos" className="btn-outline">Ver Repuestos</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container page-section">
      <div className="clean-section-header">
        <div>
          <span className="section-tag">RESUMEN DE COMPRA</span>
          <h1>Tu Carrito de Compras</h1>
        </div>
        <button
          type="button"
          onClick={() => setConfirmarVaciar(true)}
          className="btn-outline btn-sm"
        >
          Vaciar Carrito
        </button>
      </div>

      {avisoConfirmacion && <div className="alert-success">{avisoConfirmacion}</div>}

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
                  type="button"
                  className="qty-btn"
                  onClick={() => handleRestarCantidad(item)}
                >
                  -
                </button>
                <span className="qty-number">{item.cantidad}</span>
                <button
                  type="button"
                  className="qty-btn"
                  onClick={() => cambiarCantidad(item.productoId, item.cantidad + 1)}
                >
                  +
                </button>
              </div>

              <div className="cart-item-subtotal">
                <strong>${(item.precioUnitario * item.cantidad).toLocaleString('es-AR')}</strong>
                <button
                  type="button"
                  onClick={() => setItemAEliminar(item)}
                  className="btn-remove"
                >
                  Quitar
                </button>
              </div>
            </div>
          ))}
        </div>

        <aside className="cart-summary-card">
          <h3>Detalle a Pagar</h3>
          <div className="summary-line">
            <span>Subtotal ({items.length} artículos)</span>
            <strong>${totalCarrito.toLocaleString('es-AR')}</strong>
          </div>
          <div className="summary-line">
            <span>Envío a domicilio</span>
            <strong className="free-tag">Bonificado</strong>
          </div>
          <hr style={{ borderColor: 'var(--border)', margin: '0.8rem 0' }} />
          <div className="summary-line summary-total">
            <span>Total</span>
            <strong>${totalCarrito.toLocaleString('es-AR')}</strong>
          </div>

          <button onClick={handleIrACheckout} className="btn-primary btn-block">
            {usuario ? 'Continuar al Checkout →' : 'Iniciar Sesión para Comprar →'}
          </button>
        </aside>
      </div>

      {/* Modal de Confirmación para Quitar un Artículo */}
      <ConfirmModal
        abierto={Boolean(itemAEliminar)}
        titulo="¿Quitar artículo del carrito?"
        mensaje={
          itemAEliminar
            ? `¿Estás seguro de que querés quitar "${itemAEliminar.nombreProducto}" de tu carrito de compras?`
            : ''
        }
        textoConfirmar="Sí, quitar del carrito"
        textoCancelar="Conservar artículo"
        onConfirmar={confirmarQuitarItem}
        onCancelar={() => setItemAEliminar(null)}
      />

      {/* Modal de Confirmación para Vaciar Todo el Carrito */}
      <ConfirmModal
        abierto={confirmarVaciar}
        titulo="¿Vaciar todo el carrito?"
        mensaje="Se quitarán todos los artículos que seleccionaste hasta ahora. ¿Querés continuar?"
        textoConfirmar="Sí, vaciar carrito"
        textoCancelar="Cancelar"
        onConfirmar={confirmarVaciarTodo}
        onCancelar={() => setConfirmarVaciar(false)}
      />
    </div>
  );
}
