import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useCarrito } from '../context/CarritoContext';

export default function CheckoutPage() {
  const { items, totalCarrito, vaciarCarrito } = useCarrito();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    metodoPago: 'MercadoPago',
    direccionEnvio: '',
    ciudadEnvio: '',
    codigoPostalEnvio: '',
    notas: ''
  });
  const [procesando, setProcesando] = useState(false);
  const [ordenConfirmada, setOrdenConfirmada] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcesando(true);
    setErrorMsg('');

    try {
      // Asegurar que los items del carrito estén sincronizados en el backend antes de confirmar la orden
      for (const item of items) {
        await axiosClient.post('/ordenes/carrito/items', {
          productoId: item.productoId,
          cantidad: item.cantidad
        });
      }

      const { data } = await axiosClient.post('/ordenes/comprar', form);
      setOrdenConfirmada(data);
      vaciarCarrito();
    } catch (err) {
      setErrorMsg(
        err.response?.data?.mensaje ||
          'No se pudo procesar la orden. Verificá que el backend .NET 8 esté corriendo.'
      );
    } finally {
      setProcesando(false);
    }
  };

  if (ordenConfirmada) {
    return (
      <div className="container page-section empty-state">
        <h2>¡Compra Confirmada con Éxito! 🎉</h2>
        <p>
          Número de Orden: <strong>{ordenConfirmada.numeroOrden}</strong>
        </p>
        <p>
          Monto Total: <strong>${ordenConfirmada.montoTotal.toLocaleString('es-AR')}</strong> ({ordenConfirmada.metodoPago})
        </p>
        <button onClick={() => navigate('/')} className="btn-primary">
          Volver al Catálogo
        </button>
      </div>
    );
  }

  return (
    <div className="container page-section">
      <h1>Finalizar Compra (Checkout)</h1>

      {errorMsg && <div className="alert-error">{errorMsg}</div>}

      <div className="cart-layout">
        <form onSubmit={handleSubmit} className="checkout-form card-panel">
          <h3>Datos de Envío y Pago</h3>

          <label>
            Dirección de Entrega
            <input
              type="text"
              required
              className="input-control"
              placeholder="Ej. Av. del Libertador 4500, Piso 3"
              value={form.direccionEnvio}
              onChange={(e) => setForm({ ...form, direccionEnvio: e.target.value })}
            />
          </label>

          <div className="form-row-2">
            <label>
              Ciudad / Localidad
              <input
                type="text"
                required
                className="input-control"
                placeholder="Ej. CABA / Córdoba / Rosario"
                value={form.ciudadEnvio}
                onChange={(e) => setForm({ ...form, ciudadEnvio: e.target.value })}
              />
            </label>

            <label>
              Código Postal
              <input
                type="text"
                required
                className="input-control"
                placeholder="Ej. 1425"
                value={form.codigoPostalEnvio}
                onChange={(e) => setForm({ ...form, codigoPostalEnvio: e.target.value })}
              />
            </label>
          </div>

          <label>
            Método de Pago
            <select
              className="input-control"
              value={form.metodoPago}
              onChange={(e) => setForm({ ...form, metodoPago: e.target.value })}
            >
              <option value="MercadoPago">Mercado Pago (Dinero en cuenta / Tarjetas)</option>
              <option value="TarjetaCredito">Tarjeta de Crédito (3 y 6 cuotas)</option>
              <option value="Transferencia">Transferencia Bancaria (10% OFF)</option>
            </select>
          </label>

          <label>
            Notas adicionales para el armado / envío (Opcional)
            <textarea
              rows={3}
              className="input-control"
              placeholder="Ej. Necesito que regulen el sag de la horquilla para 78kg."
              value={form.notas}
              onChange={(e) => setForm({ ...form, notas: e.target.value })}
            />
          </label>

          <button type="submit" disabled={procesando || items.length === 0} className="btn-primary btn-block">
            {procesando ? 'Procesando Orden...' : `Confirmar y Pagar $${totalCarrito.toLocaleString('es-AR')}`}
          </button>
        </form>

        <aside className="cart-summary-card">
          <h3>Detalle del Pedido</h3>
          {items.map((i) => (
            <div key={i.productoId} className="summary-line">
              <span>{i.cantidad}x {i.nombreProducto}</span>
              <strong>${(i.precioUnitario * i.cantidad).toLocaleString('es-AR')}</strong>
            </div>
          ))}
          <hr />
          <div className="summary-line summary-total">
            <span>Total</span>
            <strong>${totalCarrito.toLocaleString('es-AR')}</strong>
          </div>
        </aside>
      </div>
    </div>
  );
}

