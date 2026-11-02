import { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { useCarrito } from '../context/CarritoContext';

export default function CatalogoPage({ seccion = 'Bicicletas' }) {
  const { agregarAlCarrito } = useCarrito();
  const [productos, setProductos] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [filtroMarcaId, setFiltroMarcaId] = useState('');
  const [subTipoRepuesto, setSubTipoRepuesto] = useState('Repuesto');
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);

  const esSeccionBicis = seccion === 'Bicicletas';
  const tipoActual = esSeccionBicis ? 'Bicicleta' : subTipoRepuesto;

  const cargarProductos = async () => {
    setCargando(true);
    try {
      const params = {};
      if (tipoActual) params.tipoProducto = tipoActual;
      if (filtroMarcaId) params.marcaId = filtroMarcaId;
      if (busqueda.trim()) params.buscar = busqueda.trim();

      const [resProd, resMarcas] = await Promise.all([
        axiosClient.get('/productos', { params }),
        axiosClient.get('/categorias/marcas')
      ]);

      setProductos(resProd.data);
      setMarcas(resMarcas.data);
    } catch {
      setProductos([]);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    setFiltroMarcaId('');
    setBusqueda('');
  }, [seccion]);

  useEffect(() => {
    cargarProductos();
  }, [seccion, tipoActual, filtroMarcaId]);

  const handleBuscarSubmit = (e) => {
    e.preventDefault();
    cargarProductos();
  };

  return (
    <div className="container page-section">
      <header className="clean-section-header">
        <div>
          <span className="section-tag">
            {esSeccionBicis ? 'CATÁLOGO DE BICICLETAS' : 'COMPONENTES & EQUIPAMIENTO'}
          </span>
          <h1>{esSeccionBicis ? 'Bicicletas Completas' : 'Repuestos & Accesorios'}</h1>
          <p className="subtitle">
            {esSeccionBicis
              ? 'Modelos Mountain Bike (MTB), Ruta y Gravel listos para rodar.'
              : 'Componentes originales Shimano y SRAM, frenos, cubiertas y accesorios.'}
          </p>
        </div>

        {!esSeccionBicis && (
          <div className="filter-chips">
            <button
              type="button"
              className={`chip ${subTipoRepuesto === 'Repuesto' ? 'chip-active' : ''}`}
              onClick={() => setSubTipoRepuesto('Repuesto')}
            >
              Repuestos
            </button>
            <button
              type="button"
              className={`chip ${subTipoRepuesto === 'Accesorio' ? 'chip-active' : ''}`}
              onClick={() => setSubTipoRepuesto('Accesorio')}
            >
              Accesorios
            </button>
          </div>
        )}
      </header>

      <div className="clean-toolbar">
        <select
          className="input-control select-brand"
          value={filtroMarcaId}
          onChange={(e) => setFiltroMarcaId(e.target.value)}
        >
          <option value="">Todas las marcas</option>
          {marcas.map((m) => (
            <option key={m.id} value={m.id}>{m.nombre}</option>
          ))}
        </select>

        <form onSubmit={handleBuscarSubmit} className="search-form">
          <input
            type="text"
            className="input-control"
            placeholder={
              esSeccionBicis
                ? 'Buscar bicicleta por modelo o rodado...'
                : 'Buscar repuesto (ej. Deore XT, GX Eagle, SKU)...'
            }
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <button type="submit" className="btn-outline">Buscar</button>
        </form>
      </div>

      {cargando ? (
        <div className="page-loader">Cargando {seccion.toLowerCase()}...</div>
      ) : productos.length === 0 ? (
        <div className="empty-state card-panel">
          <h3>No encontramos artículos con esos filtros</h3>
          <p>Probá limpiando la búsqueda o cambiando la marca seleccionada.</p>
        </div>
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
                </div>

                <div className="product-body">
                  <small className="category-label">{p.categoriaNombre}</small>
                  <h3>{p.nombre}</h3>

                  <div className="specs-row">
                    {p.rodado && <span className="spec-pill">R{p.rodado}</span>}
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
                        {p.stock > 0 ? `${p.stock} disponibles` : 'Sin stock'}
                      </small>
                    </div>

                    <button
                      disabled={p.stock <= 0}
                      onClick={() => agregarAlCarrito(p, 1)}
                      className="btn-primary btn-sm"
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
