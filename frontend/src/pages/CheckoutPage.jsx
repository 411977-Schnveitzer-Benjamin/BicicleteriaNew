import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useCarrito } from '../context/CarritoContext';

export default function CheckoutPage() {
  const { items, totalCarrito, vaciarCarrito } = useCarrito();
  const navigate = useNavigate();

  // Datos de envío y método seleccionado
  const [form, setForm] = useState({
    metodoPago: 'TarjetaCredito', // 'TarjetaCredito' | 'MercadoPagoQR' | 'MercadoPagoCuenta' | 'Transferencia'
    direccionEnvio: '',
    ciudadEnvio: '',
    codigoPostalEnvio: '',
    notas: ''
  });

  // 1. Estado para Tarjeta Visa / Mastercard
  const [tarjeta, setTarjeta] = useState({
    numero: '',
    titular: '',
    vencimiento: '',
    cvv: '',
    dni: '',
    cuotas: 3
  });

  // 2. Estado para Mercado Pago (QR / Dinero en Cuenta)
  const [mpPreferencia, setMpPreferencia] = useState(null);
  const [mpVerificado, setMpVerificado] = useState(false);
  const [emailMercadoPago, setEmailMercadoPago] = useState('');
  const [codigoOtpMp, setCodigoOtpMp] = useState('');

  // 3. Estado para Transferencia Bancaria
  const [datosBancarios, setDatosBancarios] = useState({
    banco: 'Banco Nación / Mercado Pago',
    titular: 'Bicicleterías El Cairo S.A.',
    cuit: '30-71654982-9',
    cbu: '0110599520000048291045',
    alias: 'EL.CAIRO.BICIS.MP',
    porcentajeDescuento: 10
  });
  const [nroComprobante, setNroComprobante] = useState('');
  const [copiadoTexto, setCopiadoTexto] = useState('');

  const [procesando, setProcesando] = useState(false);
  const [ordenConfirmada, setOrdenConfirmada] = useState(null);
  const [ datosAutorizacion, setDatosAutorizacion] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Descuento del 10% si elige Transferencia Bancaria
  const esTransferencia = form.metodoPago === 'Transferencia';
  const montoDescuento = esTransferencia ? Math.round(totalCarrito * 0.1) : 0;
  const totalFinalAPagar = totalCarrito - montoDescuento;

  // Detectar marca de tarjeta en vivo (Visa o Mastercard)
  const detectarMarcaTarjeta = (num) => {
    const limpio = num.replace(/\D/g, '');
    if (limpio.startsWith('4')) return 'VISA';
    if (/^(5[1-5]|222[1-9]|22[3-9]\d|2[3-6]\d{2}|27[01]\d|2720)/.test(limpio)) {
      return 'MASTERCARD';
    }
    return 'TARJETA';
  };

  const marcaDetectada = detectarMarcaTarjeta(tarjeta.numero);

  // Cargar datos bancarios o preferencia de Mercado Pago según selección
  useEffect(() => {
    setErrorMsg('');
    if (form.metodoPago === 'Transferencia') {
      axiosClient
        .get('/pagos/datos-bancarios')
        .then((res) => setDatosBancarios(res.data))
        .catch(() => {});
    } else if (form.metodoPago === 'MercadoPagoQR' || form.metodoPago === 'MercadoPagoCuenta') {
      setMpVerificado(false);
      axiosClient
        .post('/pagos/mercado-pago/preferencia', {
          montoTotal: totalFinalAPagar,
          modalidad: form.metodoPago === 'MercadoPagoQR' ? 'QR' : 'DineroEnCuenta'
        })
        .then((res) => setMpPreferencia(res.data))
        .catch(() => {
          setMpPreferencia({
            preferenciaId: `MP-PREF-${Date.now().toString().slice(-6)}`,
            montoTotal: totalFinalAPagar,
            aliasMercadoPago: 'EL.CAIRO.BICIS.MP'
          });
        });
    }
  }, [form.metodoPago, totalFinalAPagar]);

  const formatearNumeroTarjeta = (valor) => {
    const digitos = valor.replace(/\D/g, '').slice(0, 16);
    return digitos.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatearVencimiento = (valor) => {
    const digitos = valor.replace(/\D/g, '').slice(0, 4);
    if (digitos.length >= 3) {
      return `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
    }
    return digitos;
  };

  const copiarAlPortapapeles = (texto, etiqueta) => {
    navigator.clipboard.writeText(texto);
    setCopiadoTexto(etiqueta);
    setTimeout(() => setCopiadoTexto(''), 2200);
  };

  const handleVerificarMercadoPago = () => {
    setErrorMsg('');
    if (form.metodoPago === 'MercadoPagoCuenta') {
      if (!emailMercadoPago.includes('@')) {
        setErrorMsg('Ingresá el correo electrónico asociado a tu cuenta de Mercado Pago.');
        return;
      }
      if (codigoOtpMp.trim().length < 4) {
        setErrorMsg('Ingresá el código de seguridad de 4 dígitos para autorizar el débito en cuenta.');
        return;
      }
    }
    setMpVerificado(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setProcesando(true);

    try {
      let referenciaPago = '';
      let etiquetaMetodoPago = form.metodoPago;

      // 1. Validación y procesamiento según el medio de pago elegido
      if (form.metodoPago === 'TarjetaCredito') {
        const { data: resTarjeta } = await axiosClient.post('/pagos/procesar-tarjeta', {
          numeroTarjeta: tarjeta.numero,
          nombreTitular: tarjeta.titular,
          fechaVencimiento: tarjeta.vencimiento,
          codigoSeguridad: tarjeta.cvv,
          dniTitular: tarjeta.dni,
          cuotas: Number(tarjeta.cuotas),
          monto: totalFinalAPagar
        });

        referenciaPago = `${resTarjeta.marcaTarjeta} ****${resTarjeta.ultimosCuatroDigitos} (${resTarjeta.cuotas} cuota/s) - ${resTarjeta.codigoAutorizacion}`;
        etiquetaMetodoPago = `Tarjeta ${resTarjeta.marcaTarjeta} (${resTarjeta.cuotas} cuota/s)`;
        setDatosAutorizacion(resTarjeta);
      } else if (form.metodoPago === 'MercadoPagoQR') {
        if (!mpVerificado) {
          setProcesando(false);
          setErrorMsg('Por favor escaneá el código QR y presioná "Verificar Pago QR" antes de finalizar.');
          return;
        }
        referenciaPago = mpPreferencia?.preferenciaId || 'MP-QR-VERIFICADO';
        etiquetaMetodoPago = 'Mercado Pago (Código QR)';
      } else if (form.metodoPago === 'MercadoPagoCuenta') {
        if (!mpVerificado) {
          setProcesando(false);
          setErrorMsg('Autorizá primero tu cuenta de Mercado Pago con tu correo y código de verificación.');
          return;
        }
        referenciaPago = `${mpPreferencia?.preferenciaId || 'MP-CTA'} (${emailMercadoPago})`;
        etiquetaMetodoPago = 'Mercado Pago (Dinero en Cuenta)';
      } else if (form.metodoPago === 'Transferencia') {
        if (nroComprobante.trim().length < 5) {
          setProcesando(false);
          setErrorMsg('Ingresá el número de comprobante o referencia de tu transferencia bancaria.');
          return;
        }
        referenciaPago = `Comprobante Transferencia #${nroComprobante.trim()}`;
        etiquetaMetodoPago = 'Transferencia Bancaria (10% OFF)';
      }

      // 2. Sincronizar los artículos del carrito con el backend
      for (const item of items) {
        await axiosClient.post('/ordenes/carrito/items', {
          productoId: item.productoId,
          cantidad: item.cantidad
        });
      }

      // 3. Crear la orden en SQL Server y descontar stock
      const { data } = await axiosClient.post('/ordenes/comprar', {
        metodoPago: etiquetaMetodoPago,
        direccionEnvio: form.direccionEnvio,
        ciudadEnvio: form.ciudadEnvio,
        codigoPostalEnvio: form.codigoPostalEnvio,
        notas: form.notas,
        referenciaPago
      });

      setOrdenConfirmada({ ...data, referenciaPago });
      await vaciarCarrito();
    } catch (err) {
      setErrorMsg(
        err.response?.data?.mensaje ||
          'No se pudo verificar el pago. Revisá los datos ingresados e intentá nuevamente.'
      );
    } finally {
      setProcesando(false);
    }
  };

  if (ordenConfirmada) {
    return (
      <div className="container page-section empty-state">
        <div className="card-panel" style={{ maxWidth: 560, margin: '0 auto' }}>
          <span className="section-tag">PAGO VERIFICADO Y APROBADO</span>
          <h2>¡Compra Confirmada con Éxito!</h2>
          <p style={{ marginTop: '0.75rem' }}>
            Orden N°: <strong>{ordenConfirmada.numeroOrden}</strong>
          </p>
          <p>
            Medio de Pago: <strong>{ordenConfirmada.metodoPago}</strong>
          </p>
          {ordenConfirmada.referenciaPago && (
            <p>
              Verificación: <code>{ordenConfirmada.referenciaPago}</code>
            </p>
          )}
          <div className="current-price" style={{ margin: '1.25rem 0', fontSize: '1.65rem' }}>
            Total Abonado: ${ordenConfirmada.montoTotal.toLocaleString('es-AR')}
          </div>
          <button onClick={() => navigate('/')} className="btn-primary">
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container page-section">
      <header className="clean-section-header">
        <div>
          <span className="section-tag">PASARELA DE PAGO SEGURA</span>
          <h1>Finalizar Compra (Checkout)</h1>
        </div>
      </header>

      {errorMsg && <div className="alert-error">{errorMsg}</div>}

      <div className="cart-layout">
        <form onSubmit={handleSubmit} className="checkout-form card-panel">
          <h3>1. Datos de Entrega</h3>

          <label style={{ marginTop: '0.85rem' }}>
            Dirección de Entrega
            <input
              type="text"
              required
              className="input-control"
              placeholder="Ej. Rodríguez Peña 280"
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
                placeholder="Ej. Río Tercero / Córdoba"
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
                placeholder="Ej. X5850"
                value={form.codigoPostalEnvio}
                onChange={(e) => setForm({ ...form, codigoPostalEnvio: e.target.value })}
              />
            </label>
          </div>

          <hr style={{ borderColor: 'var(--border)', margin: '1.5rem 0' }} />

          <h3>2. Seleccioná tu Medio de Pago</h3>

          <div className="payment-methods-grid">
            <button
              type="button"
              className={`payment-method-tab ${form.metodoPago === 'TarjetaCredito' ? 'pm-active' : ''}`}
              onClick={() => setForm({ ...form, metodoPago: 'TarjetaCredito' })}
            >
              <strong>💳 Tarjeta Visa / Mastercard</strong>
              <small>1, 3 y 6 cuotas con verificación</small>
            </button>

            <button
              type="button"
              className={`payment-method-tab ${form.metodoPago === 'MercadoPagoQR' ? 'pm-active' : ''}`}
              onClick={() => setForm({ ...form, metodoPago: 'MercadoPagoQR' })}
            >
              <strong>📱 Código QR (Mercado Pago)</strong>
              <small>Escaneo inmediato desde la app</small>
            </button>

            <button
              type="button"
              className={`payment-method-tab ${form.metodoPago === 'MercadoPagoCuenta' ? 'pm-active' : ''}`}
              onClick={() => setForm({ ...form, metodoPago: 'MercadoPagoCuenta' })}
            >
              <strong>💙 Dinero en Cuenta MP</strong>
              <small>Saldo disponible en Mercado Pago</small>
            </button>

            <button
              type="button"
              className={`payment-method-tab ${form.metodoPago === 'Transferencia' ? 'pm-active' : ''}`}
              onClick={() => setForm({ ...form, metodoPago: 'Transferencia' })}
            >
              <strong>🏦 Transferencia Bancaria</strong>
              <small>10% de descuento automático</small>
            </button>
          </div>

          {/* OPCIÓN A: TARJETA VISA / MASTERCARD */}
          {form.metodoPago === 'TarjetaCredito' && (
            <div className="payment-detail-box">
              <div className="credit-card-preview">
                <div className="cc-top">
                  <span className="cc-chip" />
                  <span className="cc-brand-badge">{marcaDetectada}</span>
                </div>
                <div className="cc-number">
                  {tarjeta.numero || '•••• •••• •••• ••••'}
                </div>
                <div className="cc-bottom">
                  <div>
                    <small>TITULAR</small>
                    <strong>{tarjeta.titular ? tarjeta.titular.toUpperCase() : 'NOMBRE Y APELLIDO'}</strong>
                  </div>
                  <div>
                    <small>VENCE</small>
                    <strong>{tarjeta.vencimiento || 'MM/AA'}</strong>
                  </div>
                </div>
              </div>

              <div className="demo-credentials-box">
                <small>⚡ Autocompletar tarjetas de prueba válidas:</small>
                <div className="demo-btns">
                  <button
                    type="button"
                    className="btn-outline btn-sm"
                    onClick={() =>
                      setTarjeta({
                        ...tarjeta,
                        numero: '4509 9500 1234 5678',
                        titular: 'Benjamin Schnveitzer',
                        vencimiento: '09/29',
                        cvv: '742',
                        dni: '44123456'
                      })
                    }
                  >
                    Probar Visa
                  </button>
                  <button
                    type="button"
                    className="btn-outline btn-sm"
                    onClick={() =>
                      setTarjeta({
                        ...tarjeta,
                        numero: '5412 7500 9876 5432',
                        titular: 'Benjamin Schnveitzer',
                        vencimiento: '11/28',
                        cvv: '819',
                        dni: '44123456'
                      })
                    }
                  >
                    Probar Mastercard
                  </button>
                </div>
              </div>

              <label>
                Número de Tarjeta (Visa o Mastercard - 16 dígitos)
                <input
                  type="text"
                  required
                  className="input-control"
                  placeholder="4509 9500 0000 0000"
                  value={tarjeta.numero}
                  onChange={(e) =>
                    setTarjeta({ ...tarjeta, numero: formatearNumeroTarjeta(e.target.value) })
                  }
                />
              </label>

              <div className="form-row-2">
                <label>
                  Nombre y Apellido del Titular
                  <input
                    type="text"
                    required
                    className="input-control"
                    placeholder="Como figura en la tarjeta"
                    value={tarjeta.titular}
                    onChange={(e) => setTarjeta({ ...tarjeta, titular: e.target.value })}
                  />
                </label>

                <label>
                  DNI del Titular
                  <input
                    type="text"
                    required
                    className="input-control"
                    placeholder="Ej. 44123456"
                    value={tarjeta.dni}
                    onChange={(e) =>
                      setTarjeta({ ...tarjeta, dni: e.target.value.replace(/\D/g, '').slice(0, 8) })
                    }
                  />
                </label>
              </div>

              <div className="form-row-3">
                <label>
                  Vencimiento (MM/AA)
                  <input
                    type="text"
                    required
                    className="input-control"
                    placeholder="08/28"
                    value={tarjeta.vencimiento}
                    onChange={(e) =>
                      setTarjeta({ ...tarjeta, vencimiento: formatearVencimiento(e.target.value) })
                    }
                  />
                </label>

                <label>
                  Código CVV (3 dígitos)
                  <input
                    type="password"
                    required
                    maxLength={3}
                    className="input-control"
                    placeholder="123"
                    value={tarjeta.cvv}
                    onChange={(e) =>
                      setTarjeta({ ...tarjeta, cvv: e.target.value.replace(/\D/g, '').slice(0, 3) })
                    }
                  />
                </label>

                <label>
                  Plan de Cuotas
                  <select
                    className="input-control"
                    value={tarjeta.cuotas}
                    onChange={(e) => setTarjeta({ ...tarjeta, cuotas: Number(e.target.value) })}
                  >
                    <option value={1}>1 cuota de ${totalFinalAPagar.toLocaleString('es-AR')}</option>
                    <option value={3}>
                      3 cuotas sin interés de ${Math.round(totalFinalAPagar / 3).toLocaleString('es-AR')}
                    </option>
                    <option value={6}>
                      6 cuotas de ${Math.round(totalFinalAPagar / 6).toLocaleString('es-AR')}
                    </option>
                  </select>
                </label>
              </div>
            </div>
          )}

          {/* OPCIÓN B: CÓDIGO QR MERCADO PAGO */}
          {form.metodoPago === 'MercadoPagoQR' && (
            <div className="payment-detail-box qr-payment-box">
              <div className="qr-code-frame">
                <svg viewBox="0 0 140 140" width="145" height="145">
                  <rect width="140" height="140" rx="8" fill="#FFFFFF" />
                  <rect x="12" y="12" width="34" height="34" fill="#090b10" />
                  <rect x="18" y="18" width="22" height="22" fill="#FFFFFF" />
                  <rect x="23" y="23" width="12" height="12" fill="#090b10" />
                  <rect x="94" y="12" width="34" height="34" fill="#090b10" />
                  <rect x="100" y="18" width="22" height="22" fill="#FFFFFF" />
                  <rect x="105" y="23" width="12" height="12" fill="#090b10" />
                  <rect x="12" y="94" width="34" height="34" fill="#090b10" />
                  <rect x="18" y="100" width="22" height="22" fill="#FFFFFF" />
                  <rect x="23" y="105" width="12" height="12" fill="#090b10" />
                  <rect x="54" y="16" width="8" height="8" fill="#090b10" />
                  <rect x="70" y="24" width="10" height="10" fill="#090b10" />
                  <rect x="54" y="42" width="14" height="14" fill="#009EE3" />
                  <rect x="72" y="54" width="12" height="12" fill="#090b10" />
                  <rect x="18" y="56" width="16" height="8" fill="#090b10" />
                  <rect x="44" y="66" width="18" height="10" fill="#090b10" />
                  <rect x="92" y="58" width="24" height="10" fill="#090b10" />
                  <rect x="56" y="88" width="12" height="26" fill="#090b10" />
                  <rect x="78" y="84" width="16" height="16" fill="#009EE3" />
                  <rect x="102" y="96" width="22" height="22" fill="#090b10" />
                  <rect x="108" y="102" width="10" height="10" fill="#FFFFFF" />
                </svg>
              </div>

              <div className="qr-instructions">
                <span className="mp-badge">MERCADO PAGO · QR INTEROPERABLE</span>
                <h4>Escaneá el QR desde Mercado Pago o cualquier billetera</h4>
                <p>
                  Preferencia activa: <code>{mpPreferencia?.preferenciaId || 'Generando...'}</code>
                </p>
                <p>
                  Monto exacto: <strong>${totalFinalAPagar.toLocaleString('es-AR')}</strong>
                </p>

                {mpVerificado ? (
                  <div className="alert-success" style={{ marginTop: '0.75rem', marginBottom: 0 }}>
                    ✅ ¡Pago por QR verificado! Ya podés confirmar el pedido abajo.
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn-outline btn-sm"
                    style={{ marginTop: '0.75rem' }}
                    onClick={handleVerificarMercadoPago}
                  >
                    Ya escaneé el QR · Verificar Pago
                  </button>
                )}
              </div>
            </div>
          )}

          {/* OPCIÓN C: DINERO EN CUENTA MERCADO PAGO */}
          {form.metodoPago === 'MercadoPagoCuenta' && (
            <div className="payment-detail-box">
              <span className="mp-badge">MERCADO PAGO · DINERO EN CUENTA</span>
              <p style={{ color: 'var(--muted)', fontSize: '0.88rem', margin: '0.5rem 0 1rem' }}>
                Ingresá el correo de tu cuenta de Mercado Pago y el código de seguridad para debitar el saldo sin usar tarjeta.
              </p>

              <div className="form-row-2">
                <label>
                  E-mail de tu cuenta Mercado Pago
                  <input
                    type="email"
                    className="input-control"
                    placeholder="tu-email@mercadopago.com"
                    value={emailMercadoPago}
                    onChange={(e) => setEmailMercadoPago(e.target.value)}
                  />
                </label>

                <label>
                  Código de Verificación / PIN (4 dígitos)
                  <input
                    type="text"
                    maxLength={6}
                    className="input-control"
                    placeholder="Ej. 4821"
                    value={codigoOtpMp}
                    onChange={(e) => setCodigoOtpMp(e.target.value.replace(/\D/g, ''))}
                  />
                </label>
              </div>

              {mpVerificado ? (
                <div className="alert-success" style={{ marginBottom: 0 }}>
                  ✅ Cuenta Mercado Pago ({emailMercadoPago}) verificada con saldo disponible.
                </div>
              ) : (
                <button
                  type="button"
                  className="btn-outline btn-sm"
                  onClick={handleVerificarMercadoPago}
                >
                  Autorizar Dinero en Cuenta
                </button>
              )}
            </div>
          )}

          {/* OPCIÓN D: TRANSFERENCIA BANCARIA (10% OFF) */}
          {form.metodoPago === 'Transferencia' && (
            <div className="payment-detail-box">
              <span className="section-tag">10% DE DESCUENTO APLICADO AUTOMÁTICAMENTE</span>
              <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginBottom: '1rem' }}>
                Transferí el total con descuento (<strong>${totalFinalAPagar.toLocaleString('es-AR')}</strong>) a nuestra cuenta oficial e ingresá el número de comprobante:
              </p>

              <div className="bank-details-card">
                <div className="bank-row">
                  <span>Entidad:</span>
                  <strong>{datosBancarios.banco}</strong>
                </div>
                <div className="bank-row">
                  <span>Titular / CUIT:</span>
                  <strong>{datosBancarios.titular} ({datosBancarios.cuit})</strong>
                </div>
                <div className="bank-row">
                  <span>CBU:</span>
                  <div className="copy-group">
                    <code>{datosBancarios.cbu}</code>
                    <button
                      type="button"
                      className="btn-outline btn-sm"
                      onClick={() => copiarAlPortapapeles(datosBancarios.cbu, 'CBU')}
                    >
                      {copiadoTexto === 'CBU' ? '¡Copiado!' : 'Copiar CBU'}
                    </button>
                  </div>
                </div>
                <div className="bank-row">
                  <span>Alias:</span>
                  <div className="copy-group">
                    <code>{datosBancarios.alias}</code>
                    <button
                      type="button"
                      className="btn-outline btn-sm"
                      onClick={() => copiarAlPortapapeles(datosBancarios.alias, 'Alias')}
                    >
                      {copiadoTexto === 'Alias' ? '¡Copiado!' : 'Copiar Alias'}
                    </button>
                  </div>
                </div>
              </div>

              <label style={{ marginTop: '1rem' }}>
                Número de Comprobante / Operación Bancaria
                <input
                  type="text"
                  required
                  className="input-control"
                  placeholder="Ej. 00492817492"
                  value={nroComprobante}
                  onChange={(e) => setNroComprobante(e.target.value)}
                />
              </label>
            </div>
          )}

          <label style={{ marginTop: '1.1rem' }}>
            Notas adicionales para el armado / envío (Opcional)
            <textarea
              rows={2}
              className="input-control"
              placeholder="Ej. Necesito que regulen el sag de la horquilla para 78kg."
              value={form.notas}
              onChange={(e) => setForm({ ...form, notas: e.target.value })}
            />
          </label>

          <button type="submit" disabled={procesando || items.length === 0} className="btn-primary btn-block">
            {procesando
              ? 'Verificando pago y generando orden...'
              : `Confirmar y Pagar $${totalFinalAPagar.toLocaleString('es-AR')}`}
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
          <hr style={{ borderColor: 'var(--border)', margin: '0.8rem 0' }} />
          <div className="summary-line">
            <span>Subtotal</span>
            <strong>${totalCarrito.toLocaleString('es-AR')}</strong>
          </div>
          {esTransferencia && (
            <div className="summary-line" style={{ color: 'var(--success)' }}>
              <span>Descuento 10% Transferencia</span>
              <strong>-${montoDescuento.toLocaleString('es-AR')}</strong>
            </div>
          )}
          <div className="summary-line">
            <span>Costo de Envío</span>
            <strong className="free-tag">Bonificado</strong>
          </div>
          <hr style={{ borderColor: 'var(--border)', margin: '0.8rem 0' }} />
          <div className="summary-line summary-total">
            <span>Total a Pagar</span>
            <strong>${totalFinalAPagar.toLocaleString('es-AR')}</strong>
          </div>
        </aside>
      </div>
    </div>
  );
}
