import { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { useCarrito } from '../context/CarritoContext';

const PRODUCTOS_DEMO = [
  {
    id: 1,
    sku: 'BIKE-TREK-MARLIN7-L',
    nombre: 'Bicicleta MTB Trek Marlin 7 Gen 3 Rodado 29',
    categoriaNombre: 'Mountain Bike (MTB)',
    marcaNombre: 'Trek',
    tipoProducto: 'Bicicleta',
    precio: 1450000,
    precioDescuento: null,
    stock: 5,
    rodado: '29"',
    talleCuadro: 'L',
    velocidades: 12,
    destacado: true,
    imagenes: [
      {
        imagenUrl: 'https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?auto=format&fit=crop&w=800&q=80',
        esPrincipal: true
      }
    ]
  },
  {
    id: 2,
    sku: 'SHIM-RD-M8100-SGS',
    nombre: 'Cambio Trasero Shimano Deore XT RD-M8100 12v SGS Shadow+',
    categoriaNombre: 'Transmisión',
    marcaNombre: 'Shimano',
    tipoProducto: 'Repuesto',
    precio: 165000,
    precioDescuento: 149000,
    stock: 14,
    velocidades: 12,
    destacado: true,
    imagenes: [
      {
        imagenUrl: 'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?auto=format&fit=crop&w=800&q=80',
        esPrincipal: true
      }
    ]
  },
  {
    id: 3,
    sku: 'SRAM-CS-XG-1275-A1',
    nombre: 'Cassette SRAM GX Eagle XG-1275 10-52T 12 Velocidades',
    categoriaNombre: 'Transmisión',
    marcaNombre: 'SRAM',
    tipoProducto: 'Repuesto',
    precio: 290000,
    precioDescuento: null,
    stock: 8,
    velocidades: 12,
    destacado: true,
    imagenes: [
      {
        imagenUrl: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80',
        esPrincipal: true
      }
    ]
  }
];

export default function CatalogoPage() {
  const { agregarAlCarrito } = useCarrito();
  const [productos, setProductos] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroMarcaId, setFiltroMarcaId] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [modoDemo, setModoDemo] = useState(false);

  const cargarCatalogo = async () => {
    setCargando(true);
    try {
      const params = {};
      if (filtroTipo) params.tipoProducto = filtroTipo;
      if (filtroMarcaId) params.marcaId = filtroMarcaId;
      if (busqueda.trim()) params.buscar = busqueda.trim();

      const [resProd, resMarcas] = await Promise.all([
        axiosClient.get('/productos', { params }),
        axiosClient.get('/categorias/marcas')
      ]);

      setProductos(resProd.data);
      setMarcas(resMarcas.data);
      setModoDemo(false);
    } catch {
      setProductos(PRODUCTOS_DEMO);
      setModoDemo(true);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarCatalogo();
  }, [filtroTipo, filtroMarcaId]);

  const handleBuscarSubmit = (e) => {
    e.preventDefault();
    cargarCatalogo();
  };

  return (
    <div className="container page-section">
      <section className="hero-banner">
        <div>
          <span className="hero-pill">EQUIPAMIENTO & TRANSMISIONES OFICIALES</span>
          <h1>Catálogo de Bicicletas, Repuestos Shimano & SRAM</h1>
          <p>
            Explorá bicicletas completas, grupos de transmisión de 11 y 12 velocidades, frenos hidráulicos y accesorios técnicos.
          </p>
        </div>
      </section>

      {modoDemo && (
        <div className="alert-info">
          ℹ️ Mostrando vista previa local. Cuando inicies la API de .NET 8 en <code>http://localhost:5080</code>, el catálogo se conectará en vivo a SQL Server y Cloudinary.
        </div>
      )}

      <div className="filters-bar">
        <div className="filter-chips">
          {['', 'Bicicleta', 'Repuesto', 'Accesorio'].map((tipo) => (
            <button
              key={tipo || 'todos'}
              className={`chip ${filtroTipo === tipo ? 'chip-active' : ''}`}
              onClick={() => setFiltroTipo(tipo)}
            >
              {tipo === '' ? 'Todos' : `${tipo}s`}
            </button>
          ))}
        </div>

        <select
          className="input-control select-brand"
          value={filtroMarcaId}
          onChange={(e) => setFiltroMarcaId(e.target.value)}
        >
          <option value="">Todas las Marcas (Shimano, SRAM, Trek...)</option>
          {marcas.map((m) => (
            <option key={m.id} value={m.id}>{m.nombre}</option>
          ))}
        </select>

        <form onSubmit={handleBuscarSubmit} className="search-form">
          <input
            type="text"
            className="input-control"
            placeholder="Buscar por nombre o SKU (ej. Deore XT, GX Eagle)..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <button type="submit" className="btn-primary">Buscar</button>
        </form>
      </div>

      {cargando ? (
        <div className="page-loader">Cargando inventario...</div>
      ) : (
        <div className="product-grid">
          {productos.map((p) => {
            const imgPrincipal =
              p.imagenes?.find((i) => i.esPrincipal)?.imagenUrl ||
              p.imagenes?.[0]?.imagenUrl ||
              'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?auto=format&fit=crop&w=800&q=80';

            const precioFinal = p.precioDescuento ?? p.precio;

            return (
              <article key={p.id} className="product-card">
                <div className="product-image-wrap">
                  <img src={imgPrincipal} alt={p.nombre} loading="lazy" />
                  <span className="brand-tag">{p.marcaNombre}</span>
                  <span className="type-tag">{p.tipoProducto}</span>
                </div>

                <div className="product-body">
                  <small className="category-label">{p.categoriaNombre} · SKU: {p.sku}</small>
                  <h3>{p.nombre}</h3>

                  <div className="specs-row">
                    {p.rodado && <span className="spec-pill">Rodado {p.rodado}</span>}
                    {p.talleCuadro && <span className="spec-pill">Talle {p.talleCuadro}</span>}
                    {p.velocidades && <span className="spec-pill">{p.velocidades}v</span>}
                  </div>

                  <div className="product-footer">
                    <div>
                      {p.precioDescuento && (
                        <span className="old-price">${p.precio.toLocaleString('es-AR')}</span>
                      )}
                      <div className="current-price">${precioFinal.toLocaleString('es-AR')}</div>
                      <small className={p.stock > 0 ? 'stock-ok' : 'stock-out'}>
                        {p.stock > 0 ? `Stock disponible (${p.stock})` : 'Sin stock'}
                      </small>
                    </div>

                    <button
                      disabled={p.stock <= 0}
                      onClick={() => agregarAlCarrito(p, 1)}
                      className="btn-primary"
                    >
                      + Carrito
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

