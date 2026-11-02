import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useCarrito } from '../context/CarritoContext';
import ComparadorBicisModal from '../components/ComparadorBicisModal';
import { obtenerImagenProducto } from '../utils/productVisuals';

const ITEMS_POR_PAGINA = 24;

export default function CatalogoPage({ seccion = 'Bicicletas' }) {
  const { agregarAlCarrito } = useCarrito();
  const [productos, setProductos] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [arbolCategorias, setArbolCategorias] = useState([]);
  const [filtroCategoriaId, setFiltroCategoriaId] = useState('');
  const [filtroMarcaId, setFiltroMarcaId] = useState('');
  const [filtroRodado, setFiltroRodado] = useState('');
  const [subTipoRepuesto, setSubTipoRepuesto] = useState('NoBicicleta');
  const [filtroVelocidades, setFiltroVelocidades] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const [cargando, setCargando] = useState(true);

  // Estado para el Comparador Lado a Lado de Bicicletas (hasta 3 modelos)
  const [bicisComparar, setBicisComparar] = useState([]);
  const [modalCompararAbierto, setModalCompararAbierto] = useState(false);

  const esSeccionBicis = seccion === 'Bicicletas';
  const tipoActual = esSeccionBicis ? 'Bicicleta' : subTipoRepuesto;

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const params = {};
      if (tipoActual) params.tipoProducto = tipoActual;
      if (filtroCategoriaId) params.categoriaId = Number(filtroCategoriaId);
      if (filtroMarcaId) params.marcaId = Number(filtroMarcaId);
      if (filtroRodado) params.rodado = filtroRodado;
      if (filtroVelocidades) params.velocidades = Number(filtroVelocidades);
      if (busqueda.trim()) params.buscar = busqueda.trim();

      const [resProd, resMarcas, resArbol] = await Promise.all([
        axiosClient.get('/productos', { params }),
        axiosClient.get('/categorias/marcas'),
        axiosClient.get('/categorias/arbol')
      ]);

      setProductos(resProd.data);
      setMarcas(resMarcas.data);
      setArbolCategorias(resArbol.data);
      setPaginaActual(1);
    } catch {
      setProductos([]);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    setFiltroCategoriaId('');
    setFiltroMarcaId('');
    setFiltroRodado('');
    setFiltroVelocidades('');
    setBusqueda('');
    setSubTipoRepuesto('NoBicicleta');
    setPaginaActual(1);
  }, [seccion]);

  useEffect(() => {
    cargarDatos();
  }, [seccion, tipoActual, filtroCategoriaId, filtroMarcaId, filtroRodado, filtroVelocidades]);

  const handleBuscarSubmit = (e) => {
    e.preventDefault();
    cargarDatos();
  };

  // Subcategorías disponibles según la sección activa
  const subcategoriasDisponibles = useMemo(() => {
    if (!arbolCategorias.length) return [];
    if (esSeccionBicis) {
      const nodoBicis = arbolCategorias.find((c) => c.slug === 'bicicletas');
      return nodoBicis?.subCategorias || [];
    }
    const nodos = arbolCategorias.filter((c) => c.slug !== 'bicicletas');
    return nodos.flatMap((n) => n.subCategorias || []);
  }, [arbolCategorias, esSeccionBicis]);

  // Paginación limpia
  const totalPaginas = Math.max(1, Math.ceil(productos.length / ITEMS_POR_PAGINA));
  const productosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * ITEMS_POR_PAGINA;
    return productos.slice(inicio, inicio + ITEMS_POR_PAGINA);
  }, [productos, paginaActual]);

  const toggleCompararBici = (bici) => {
    setBicisComparar((prev) => {
      const yaEsta = prev.some((x) => x.id === bici.id);
      if (yaEsta) {
        return prev.filter((x) => x.id !== bici.id);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), bici];
      }
      return [...prev, bici];
    });
  };

  const obtenerEtiquetaCompatibilidad = (p) => {
    const marca = (p.marcaNombre || '').toLowerCase();
    if (marca.includes('shimano') && p.velocidades) {
      return `Compatible Shimano ${p.velocidades}v`;
    }
    if (p.velocidades) return `Compatible Transmisión ${p.velocidades}v`;
    if (p.rodado) return `Medida / Rodado ${p.rodado}`;
    return `Stock Oficial ${p.marcaNombre} • Cód #${p.sku}`;
  };

  return (
    <div className="container page-section">
      <header className="clean-section-header">
        <div>
          <span className="section-tag">
            {esSeccionBicis ? 'CATÁLOGO OFICIAL EL CAIRO' : 'STOCK COMPLETO DE REPUESTOS, CÁMARAS Y ACCESORIOS'}
          </span>
          <h1>{esSeccionBicis ? 'Bicicletas Importadas y Nacionales' : 'Repuestos, Cubiertas & Accesorios'}</h1>
          <p className="subtitle">
            {esSeccionBicis
              ? 'Modelos Venzo, Oxea, SLP, Firebird y Nacionales (Playeras, Tentación, Rondinella, Cross y Triciclos). Seleccioná hasta 3 para comparar.'
              : 'Catálogo completo clasificado por rubro, marca, medida y código de lista oficial.'}
          </p>
        </div>

        {!esSeccionBicis ? (
          <div className="filter-chips">
            {[
              { id: 'NoBicicleta', label: 'Todos los Rubros' },
              { id: 'Repuesto', label: 'Repuestos' },
              { id: 'Cubierta', label: 'Cámaras y Cubiertas' },
              { id: 'Accesorio', label: 'Accesorios e Indumentaria' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`chip ${subTipoRepuesto === tab.id ? 'chip-active' : ''}`}
                onClick={() => {
                  setSubTipoRepuesto(tab.id);
                  setFiltroCategoriaId('');
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="filter-chips">
            <button
              type="button"
              className={`chip ${filtroCategoriaId === '' ? 'chip-active' : ''}`}
              onClick={() => setFiltroCategoriaId('')}
            >
              Todas las Bicis
            </button>
            {subcategoriasDisponibles.map((sc) => (
              <button
                key={sc.id}
                type="button"
                className={`chip ${String(filtroCategoriaId) === String(sc.id) ? 'chip-active' : ''}`}
                onClick={() => setFiltroCategoriaId(String(sc.id))}
              >
                {sc.nombre}
              </button>
            ))}
          </div>
        )}
      </header>

      <div className="clean-toolbar">
        {!esSeccionBicis && (
          <select
            className="input-control select-brand"
            value={filtroCategoriaId}
            onChange={(e) => setFiltroCategoriaId(e.target.value)}
          >
            <option value="">Todos los rubros / subcategorías</option>
            {subcategoriasDisponibles.map((sc) => (
              <option key={sc.id} value={sc.id}>{sc.nombre}</option>
            ))}
          </select>
        )}

        <select
          className="input-control select-brand"
          value={filtroMarcaId}
          onChange={(e) => setFiltroMarcaId(e.target.value)}
        >
          <option value="">Todas las marcas ({marcas.length})</option>
          {marcas.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nombre} {m.cantidadProductos ? `(${m.cantidadProductos})` : ''}
            </option>
          ))}
        </select>

        <select
          className="input-control select-brand"
          value={filtroRodado}
          onChange={(e) => setFiltroRodado(e.target.value)}
        >
          <option value="">Todos los rodados</option>
          {['12"', '14"', '16"', '20"', '24"', '26"', '27.5"', '28"', '29"', '700c'].map((r) => (
            <option key={r} value={r}>Rodado {r}</option>
          ))}
        </select>

        {!esSeccionBicis && (
          <select
            className="input-control select-brand"
            value={filtroVelocidades}
            onChange={(e) => setFiltroVelocidades(e.target.value)}
          >
            <option value="">Todas las velocidades</option>
            {['6', '7', '8', '9', '10', '11', '12', '18', '21', '24'].map((v) => (
              <option key={v} value={v}>{v} velocidades</option>
            ))}
          </select>
        )}

        <form onSubmit={handleBuscarSubmit} className="search-form">
          <input
            type="text"
            className="input-control"
            placeholder={
              esSeccionBicis
                ? 'Buscar por modelo o código (ej. Venzo, Oxea, SLP, 001349)...'
                : 'Buscar por nombre o código (ej. Shimano, Colla, 073013)...'
            }
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <button type="submit" className="btn-outline">Buscar</button>
          {(busqueda || filtroCategoriaId || filtroMarcaId || filtroRodado || filtroVelocidades) && (
            <button
              type="button"
              className="btn-outline"
              onClick={() => {
                setBusqueda('');
                setFiltroCategoriaId('');
                setFiltroMarcaId('');
                setFiltroRodado('');
                setFiltroVelocidades('');
              }}
            >
              Limpiar
            </button>
          )}
        </form>
      </div>

      {/* Contador de resultados y paginación superior */}
      {!cargando && productos.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', color: '#94A3B8', fontSize: '0.9rem' }}>
          <span>
            Mostrando <strong>{productosPaginados.length}</strong> de <strong>{productos.length}</strong> artículos en stock
          </span>
          {totalPaginas > 1 && (
            <span>Página {paginaActual} de {totalPaginas}</span>
          )}
        </div>
      )}

      {cargando ? (
        <div className="page-loader">Cargando catálogo de {seccion.toLowerCase()}...</div>
      ) : productos.length === 0 ? (
        <div className="empty-state card-panel">
          <h3>No encontramos artículos con esos filtros</h3>
          <p>Probá limpiando los filtros o buscando por otra palabra clave / código de lista.</p>
        </div>
      ) : (
        <>
          <div className="product-grid">
            {productosPaginados.map((p) => {
              const imgPrincipal = obtenerImagenProducto(p);
              const precioFinal = p.precioDescuento ?? p.precio;
              const seleccionadaParaComparar = bicisComparar.some((b) => b.id === p.id);

              return (
                <article key={p.id} className="product-card">
                  <Link to={`/producto/${p.id}`} className="product-image-wrap">
                    <img src={imgPrincipal} alt={p.nombre} loading="lazy" />
                    <span className="brand-tag">{p.marcaNombre}</span>
                  </Link>

                  <div className="product-body">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <small className="category-label">{p.categoriaNombre}</small>
                      <small style={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 700 }}>#{p.sku}</small>
                    </div>
                    <h3>
                      <Link to={`/producto/${p.id}`} className="product-title-link">
                        {p.nombre}
                      </Link>
                    </h3>

                    {p.descripcion && (
                      <p className="product-desc-preview">{p.descripcion}</p>
                    )}

                    <div className="specs-row">
                      {p.rodado && <span className="spec-pill">Rodado {p.rodado}</span>}
                      {p.talleCuadro && <span className="spec-pill">Talle {p.talleCuadro}</span>}
                      {p.material && <span className="spec-pill">{p.material}</span>}
                      {p.velocidades && <span className="spec-pill">{p.velocidades}v</span>}
                    </div>

                    {!esSeccionBicis && (
                      <div className="compat-pill-inline">
                        ⚙️ {obtenerEtiquetaCompatibilidad(p)}
                      </div>
                    )}

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

                      <div className="card-actions-group">
                        {esSeccionBicis && (
                          <button
                            type="button"
                            onClick={() => toggleCompararBici(p)}
                            className={`btn-outline btn-sm ${seleccionadaParaComparar ? 'compare-btn-active' : ''}`}
                            title="Comparar modelo lado a lado"
                          >
                            {seleccionadaParaComparar ? '✓ Comparando' : '⚖️ Comparar'}
                          </button>
                        )}

                        <button
                          type="button"
                          disabled={p.stock <= 0}
                          onClick={() => agregarAlCarrito(p, 1)}
                          className="btn-primary btn-sm"
                        >
                          + Carrito
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {totalPaginas > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', marginTop: '2.5rem' }}>
              <button
                type="button"
                className="btn-outline btn-sm"
                disabled={paginaActual <= 1}
                onClick={() => {
                  setPaginaActual((prev) => Math.max(1, prev - 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                ← Anterior
              </button>
              <span style={{ color: '#E2E8F0', fontWeight: 600 }}>
                Página {paginaActual} de {totalPaginas}
              </span>
              <button
                type="button"
                className="btn-outline btn-sm"
                disabled={paginaActual >= totalPaginas}
                onClick={() => {
                  setPaginaActual((prev) => Math.min(totalPaginas, prev + 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}

      {/* Barra Flotante Inferior cuando hay Bicicletas seleccionadas para Comparar */}
      {esSeccionBicis && bicisComparar.length > 0 && (
        <div className="floating-compare-bar">
          <div className="floating-compare-info">
            <strong>⚖️ Comparador de Bicicletas ({bicisComparar.length}/3):</strong>
            <div className="floating-compare-pills">
              {bicisComparar.map((b) => (
                <span key={b.id} className="compare-mini-pill">
                  {b.nombre.slice(0, 22)}
                  <button type="button" onClick={() => toggleCompararBici(b)}>✕</button>
                </span>
              ))}
            </div>
          </div>
          <div className="demo-btns" style={{ marginTop: 0 }}>
            <button
              type="button"
              className="btn-outline btn-sm"
              onClick={() => setBicisComparar([])}
            >
              Limpiar
            </button>
            <button
              type="button"
              className="btn-primary btn-sm"
              onClick={() => setModalCompararAbierto(true)}
            >
              Comparar Modelos Ahora →
            </button>
          </div>
        </div>
      )}

      {/* Modal Comparador Lado a Lado */}
      <ComparadorBicisModal
        abierto={modalCompararAbierto}
        bicicletas={bicisComparar}
        onQuitarBici={(idBici) =>
          setBicisComparar((prev) => prev.filter((x) => x.id !== idBici))
        }
        onLimpiarTodo={() => {
          setBicisComparar([]);
          setModalCompararAbierto(false);
        }}
        onCerrar={() => setModalCompararAbierto(false)}
        onAgregarAlCarrito={(bici) => agregarAlCarrito(bici, 1)}
      />
    </div>
  );
}
