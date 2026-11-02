import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useCarrito } from '../context/CarritoContext';
import { obtenerImagenProducto } from '../utils/productVisuals';

export default function DetalleProductoPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { agregarAlCarrito } = useCarrito();

  const [producto, setProducto] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [imagenActiva, setImagenActiva] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [agregadoMsg, setAgregadoMsg] = useState(false);

  // Estado para la Calculadora de Talle (Estilo Canyon / Trek)
  const [alturaCm, setAlturaCm] = useState(175);
  const [entrepiernaCm, setEntrepiernaCm] = useState(81);

  useEffect(() => {
    setCargando(true);
    axiosClient
      .get(`/productos/${id}`)
      .then((res) => {
        setProducto(res.data);
        setImagenActiva(obtenerImagenProducto(res.data));
      })
      .catch(() => setProducto(null))
      .finally(() => setCargando(false));
  }, [id]);

  // Cálculo de talle recomendado según altura y entrepierna
  const calcularTalleRecomendado = (altura, entrepierna) => {
    const alt = Number(altura) || 175;
    if (alt < 165) return { mtb: 'S', ruta: '50-52cm', rango: '155 - 165 cm' };
    if (alt < 176) return { mtb: 'M', ruta: '54cm', rango: '165 - 176 cm' };
    if (alt < 186) return { mtb: 'L', ruta: '56cm', rango: '176 - 186 cm' };
    return { mtb: 'XL', ruta: '58-60cm', rango: '186 - 200 cm' };
  };

  const obtenerCompatibilidadRepuesto = (prod) => {
    const marca = (prod.marcaNombre || '').toLowerCase();
    const vel = prod.velocidades;
    if (marca.includes('shimano') && vel === 12) {
      return 'Compatible con transmisiones Shimano Hyperglide+ 12v (Deore M6100, SLX M7100, XT M8100 y XTR M9100).';
    }
    if (marca.includes('shimano') && vel === 11) {
      return 'Compatible con grupos Shimano 11 velocidades (Deore M5100, SLX M7000, XT M8000) y cadenas HG-X11.';
    }
    if (marca.includes('sram') && vel === 12) {
      return 'Compatible con ecosistema SRAM Eagle 12v (SX, NX, GX, X01 y XX1 Eagle). Requiere cadena Eagle 12v.';
    }
    return `Componente original ${prod.marcaNombre} verificado por nuestro equipo mecánico.`;
  };

  const handleAgregar = () => {
    if (!producto) return;
    agregarAlCarrito(producto, cantidad);
    setAgregadoMsg(true);
    setTimeout(() => setAgregadoMsg(false), 2600);
  };

  if (cargando) {
    return <div className="container page-loader">Cargando ficha técnica...</div>;
  }

  if (!producto) {
    return (
      <div className="container page-section empty-state">
        <h2>Artículo no encontrado</h2>
        <p>El producto que buscás no existe o fue dado de baja.</p>
        <button onClick={() => navigate(-1)} className="btn-primary">
          ← Volver atrás
        </button>
      </div>
    );
  }

  const precioFinal = producto.precioDescuento ?? producto.precio;
  const esBicicleta = producto.tipoProducto === 'Bicicleta';
  const talleRec = calcularTalleRecomendado(alturaCm, entrepiernaCm);
  const coincideTalle =
    producto.talleCuadro &&
    producto.talleCuadro.toUpperCase() === talleRec.mtb.toUpperCase();

  return (
    <div className="container page-section">
      <div className="breadcrumb-bar">
        <Link to="/">Inicio</Link>
        <span>/</span>
        <Link to={esBicicleta ? '/bicicletas' : '/repuestos'}>
          {esBicicleta ? 'Bicicletas' : 'Repuestos'}
        </Link>
        <span>/</span>
        <span className="breadcrumb-current">{producto.nombre}</span>
      </div>

      <div className="detail-grid">
        {/* Columna Izquierda: Galería de Imágenes */}
        <div className="detail-gallery">
          <div className="detail-main-image">
            <img src={imagenActiva} alt={producto.nombre} />
            <span className="brand-tag">{producto.marcaNombre}</span>
          </div>

          {producto.imagenes && producto.imagenes.length > 1 && (
            <div className="detail-thumbnails">
              {producto.imagenes.map((img) => (
                <button
                  key={img.id}
                  type="button"
                  className={`thumb-btn ${imagenActiva === img.imagenUrl ? 'thumb-active' : ''}`}
                  onClick={() => setImagenActiva(img.imagenUrl)}
                >
                  <img src={img.imagenUrl} alt="Vista miniatura" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Columna Derecha: Información Comercial y Compra */}
        <div className="detail-info">
          <span className="section-tag">
            {producto.categoriaNombre} · SKU: {producto.sku}
          </span>
          <h1>{producto.nombre}</h1>

          <div className="detail-price-box">
            {producto.precioDescuento && (
              <span className="old-price">${producto.precio.toLocaleString('es-AR')}</span>
            )}
            <div className="detail-price">${precioFinal.toLocaleString('es-AR')}</div>
            <small className="installments-hint">
              Hasta 3 cuotas sin interés de ${Math.round(precioFinal / 3).toLocaleString('es-AR')} o 10% OFF por Transferencia (${Math.round(precioFinal * 0.9).toLocaleString('es-AR')})
            </small>
          </div>

          <p className="detail-description">
            {producto.descripcion ||
              'Artículo original con garantía oficial en Bicicleterías El Cairo.'}
          </p>

          {/* Sello de Compatibilidad Técnica para Repuestos Shimano / SRAM */}
          {!esBicicleta && (
            <div className="compatibility-banner">
              <strong>⚙️ Compatibilidad Técnica Verificada</strong>
              <p>{obtenerCompatibilidadRepuesto(producto)}</p>
            </div>
          )}

          {/* Controles de Stock y Carrito */}
          <div className="detail-buy-row">
            <div className="cart-item-controls">
              <button
                type="button"
                className="qty-btn"
                onClick={() => setCantidad(Math.max(1, cantidad - 1))}
              >
                -
              </button>
              <span className="qty-number">{cantidad}</span>
              <button
                type="button"
                className="qty-btn"
                onClick={() => setCantidad(Math.min(producto.stock, cantidad + 1))}
              >
                +
              </button>
            </div>

            <button
              type="button"
              disabled={producto.stock <= 0}
              onClick={handleAgregar}
              className="btn-primary detail-add-btn"
            >
              {producto.stock > 0 ? '+ Agregar al Carrito' : 'Sin Stock'}
            </button>
          </div>

          {agregadoMsg && (
            <div className="alert-success" style={{ marginTop: '1rem' }}>
              ✅ Se agregaron {cantidad} u. al carrito de compras.
            </div>
          )}

          {/* Ficha Técnica Estructurada */}
          <div className="tech-specs-card">
            <h3>Ficha de Especificaciones Técnicas</h3>
            <div className="tech-specs-table">
              <div className="tech-spec-row">
                <span>Marca Oficial</span>
                <strong>{producto.marcaNombre}</strong>
              </div>
              <div className="tech-spec-row">
                <span>Categoría</span>
                <strong>{producto.categoriaNombre}</strong>
              </div>
              {producto.rodado && (
                <div className="tech-spec-row">
                  <span>Rodado</span>
                  <strong>{producto.rodado}</strong>
                </div>
              )}
              {producto.talleCuadro && (
                <div className="tech-spec-row">
                  <span>Talle de Cuadro</span>
                  <strong>Talle {producto.talleCuadro}</strong>
                </div>
              )}
              {producto.material && (
                <div className="tech-spec-row">
                  <span>Material</span>
                  <strong>{producto.material}</strong>
                </div>
              )}
              {producto.velocidades && (
                <div className="tech-spec-row">
                  <span>Velocidades / Transmisión</span>
                  <strong>{producto.velocidades} velocidades</strong>
                </div>
              )}
              {producto.pesoGramos && (
                <div className="tech-spec-row">
                  <span>Peso Declarado</span>
                  <strong>
                    {producto.pesoGramos >= 1000
                      ? `${(producto.pesoGramos / 1000).toFixed(2)} kg (${producto.pesoGramos} g)`
                      : `${producto.pesoGramos} gramos`}
                  </strong>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Calculadora Interactiva de Talle de Cuadro (Estilo Canyon / Trek) */}
      {esBicicleta && (
        <section className="size-calculator-card card-panel">
          <div className="size-calc-header">
            <div>
              <span className="section-tag">ASISTENTE BIOMECÁNICO · EL CAIRO</span>
              <h2>Calculadora de Talle de Cuadro ("¿Cuál es mi talle?")</h2>
              <p className="subtitle">
                Deslizá tu altura y largo de entrepierna para verificar si este cuadro se adapta a tu geometría corporal.
              </p>
            </div>
          </div>

          <div className="size-calc-body">
            <div className="size-sliders">
              <label>
                <div className="slider-label-row">
                  <span>Tu Altura Total</span>
                  <strong>{alturaCm} cm</strong>
                </div>
                <input
                  type="range"
                  min="150"
                  max="202"
                  value={alturaCm}
                  onChange={(e) => setAlturaCm(Number(e.target.value))}
                  className="range-slider"
                />
              </label>

              <label>
                <div className="slider-label-row">
                  <span>Largo de Entrepierna (Opcional)</span>
                  <strong>{entrepiernaCm} cm</strong>
                </div>
                <input
                  type="range"
                  min="66"
                  max="96"
                  value={entrepiernaCm}
                  onChange={(e) => setEntrepiernaCm(Number(e.target.value))}
                  className="range-slider"
                />
              </label>
            </div>

            <div className="size-result-box">
              <small>TALLE RECOMENDADO PARA VOS ({talleRec.rango})</small>
              <div className="size-badges-row">
                <div className="size-badge-main">
                  <span>MTB</span>
                  <strong>Talle {talleRec.mtb}</strong>
                </div>
                <div className="size-badge-main">
                  <span>Ruta / Gravel</span>
                  <strong>{talleRec.ruta}</strong>
                </div>
              </div>

              {producto.talleCuadro && (
                <div className={coincideTalle ? 'match-ok' : 'match-warn'}>
                  {coincideTalle
                    ? `✅ ¡Coincidencia exacta! Esta bicicleta es Talle ${producto.talleCuadro}, ideal para tus ${alturaCm} cm.`
                    : `💡 Esta unidad publicada es Talle ${producto.talleCuadro}. Para tus ${alturaCm} cm te sugerimos buscar un cuadro Talle ${talleRec.mtb}.`}
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

