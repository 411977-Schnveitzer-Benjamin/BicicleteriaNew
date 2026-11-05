import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import ConfirmModal from '../components/ConfirmModal';
import { obtenerImagenProducto } from '../utils/productVisuals';

const FORM_INICIAL = {
  categoriaId: '',
  marcaId: '',
  sku: '',
  nombre: '',
  slug: '',
  descripcion: '',
  tipoProducto: 'Bicicleta',
  precio: '',
  precioDescuento: '',
  stock: 5,
  stockMinimoAlerta: 2,
  rodado: '',
  talleCuadro: '',
  material: '',
  velocidades: '',
  pesoGramos: '',
  destacado: false,
  imagenUrl: ''
};

export default function BackofficeAdminPage() {
  // 'metricas' | 'inventario' | 'nuevo' | 'turnos'
  const [tabActiva, setTabActiva] = useState('inventario');

  const [metricas, setMetricas] = useState({
    gananciasVentasProductos: 0,
    gananciasServiciosTaller: 0,
    gananciaTotalAcumulada: 0,
    cantidadOrdenesValidas: 0,
    turnosTallerPendientes: 0,
    alertasStockCritico: [],
    ordenesRecientes: []
  });

  const [productos, setProductos] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [turnosTaller, setTurnosTaller] = useState([]);

  // Filtros de tabla de inventario
  const [busquedaAdmin, setBusquedaAdmin] = useState('');
  const [filtroTipoAdmin, setFiltroTipoAdmin] = useState('Todos');
  const [paginaAdmin, setPaginaAdmin] = useState(1);

  const [mensaje, setMensaje] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Estado para Alta de Nuevo Producto
  const [nuevoProducto, setNuevoProducto] = useState(FORM_INICIAL);
  const [archivoImagenNuevo, setArchivoImagenNuevo] = useState(null);

  // Estado para Edición Completa de Producto Existente (Modal)
  const [productoEditando, setProductoEditando] = useState(null);
  const [archivoImagenEditar, setArchivoImagenEditar] = useState(null);

  // Estado para Eliminación con Confirmación
  const [productoAEliminar, setProductoAEliminar] = useState(null);

  const cargarDatosBackoffice = async () => {
    try {
      const [resGanancias, resProductos, resMarcas, resArbol, resTurnos] = await Promise.all([
        axiosClient.get('/ordenes/ganancias'),
        axiosClient.get('/productos'),
        axiosClient.get('/categorias/marcas'),
        axiosClient.get('/categorias/arbol'),
        axiosClient.get('/taller/turnos').catch(() => ({ data: [] }))
      ]);

      setMetricas(resGanancias.data);
      setProductos(resProductos.data);
      setMarcas(resMarcas.data);
      setTurnosTaller(resTurnos.data || []);

      const todasSubcats = (resArbol.data || []).flatMap((padre) =>
        (padre.subCategorias || []).map((sc) => ({
          ...sc,
          padreNombre: padre.nombre
        }))
      );
      setSubcategorias(todasSubcats);

      if (todasSubcats.length > 0 && !nuevoProducto.categoriaId) {
        setNuevoProducto((prev) => ({
          ...prev,
          categoriaId: todasSubcats[0].id,
          marcaId: resMarcas.data?.[0]?.id || ''
        }));
      }
    } catch (err) {
      setErrorMsg(
        err.response?.data?.mensaje ||
          'No se pudieron obtener los datos del Backoffice.'
      );
    }
  };

  useEffect(() => {
    cargarDatosBackoffice();
  }, []);

  const construirPayloadProducto = (datos) => {
    const slugGenerado =
      datos.slug?.trim() ||
      `${datos.nombre
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')}-${datos.sku.trim().toLowerCase()}`;

    return {
      categoriaId: Number(datos.categoriaId),
      marcaId: Number(datos.marcaId),
      sku: datos.sku.trim(),
      nombre: datos.nombre.trim(),
      slug: slugGenerado,
      descripcion: datos.descripcion?.trim() || '',
      tipoProducto: datos.tipoProducto,
      precio: Number(datos.precio) || 0,
      precioDescuento:
        datos.precioDescuento !== '' && datos.precioDescuento !== null && Number(datos.precioDescuento) > 0
          ? Number(datos.precioDescuento)
          : null,
      stock: Number(datos.stock) || 0,
      stockMinimoAlerta: Number(datos.stockMinimoAlerta) || 2,
      rodado: datos.rodado?.trim() || null,
      talleCuadro: datos.talleCuadro?.trim() || null,
      material: datos.material?.trim() || null,
      velocidades:
        datos.velocidades !== '' && datos.velocidades !== null && Number(datos.velocidades) > 0
          ? Number(datos.velocidades)
          : null,
      pesoGramos:
        datos.pesoGramos !== '' && datos.pesoGramos !== null && Number(datos.pesoGramos) > 0
          ? Number(datos.pesoGramos)
          : null,
      destacado: Boolean(datos.destacado),
      imagenUrl: datos.imagenUrl?.trim() || null
    };
  };

  // 1. CREAR NUEVO PRODUCTO
  const handleCrearProducto = async (e) => {
    e.preventDefault();
    setMensaje('');
    setErrorMsg('');
    setGuardando(true);

    try {
      const payload = construirPayloadProducto(nuevoProducto);
      const { data: prodCreado } = await axiosClient.post('/productos', payload);

      if (archivoImagenNuevo) {
        const formData = new FormData();
        formData.append('archivo', archivoImagenNuevo);
        await axiosClient.post(`/productos/${prodCreado.id}/imagenes?esPrincipal=true`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      setMensaje(`✅ Producto "${prodCreado.nombre}" (SKU: ${prodCreado.sku}) publicado con éxito.`);
      setNuevoProducto({
        ...FORM_INICIAL,
        categoriaId: subcategorias[0]?.id || '',
        marcaId: marcas[0]?.id || ''
      });
      setArchivoImagenNuevo(null);
      await cargarDatosBackoffice();
      setTabActiva('inventario');
    } catch (err) {
      setErrorMsg(err.response?.data?.mensaje || 'Error al crear el producto.');
    } finally {
      setGuardando(false);
    }
  };

  // 2. ABRIR MODAL DE EDICIÓN DE PRODUCTO EXISTENTE
  const abrirModalEditar = (prod) => {
    setMensaje('');
    setErrorMsg('');
    setArchivoImagenEditar(null);
    const imgUrlActual = obtenerImagenProducto(prod);

    setProductoEditando({
      id: prod.id,
      categoriaId: prod.categoriaId,
      marcaId: prod.marcaId,
      sku: prod.sku || '',
      nombre: prod.nombre || '',
      slug: prod.slug || '',
      descripcion: prod.descripcion || '',
      tipoProducto: prod.tipoProducto || 'Repuesto',
      precio: prod.precio ?? '',
      precioDescuento: prod.precioDescuento ?? '',
      stock: prod.stock ?? 0,
      stockMinimoAlerta: prod.stockMinimoAlerta ?? 2,
      rodado: prod.rodado || '',
      talleCuadro: prod.talleCuadro || '',
      material: prod.material || '',
      velocidades: prod.velocidades ?? '',
      pesoGramos: prod.pesoGramos ?? '',
      destacado: Boolean(prod.destacado),
      imagenUrl: imgUrlActual || ''
    });
  };

  // 3. GUARDAR CAMBIOS DE PRODUCTO EDITADO
  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    if (!productoEditando) return;

    setMensaje('');
    setErrorMsg('');
    setGuardando(true);

    try {
      const payload = construirPayloadProducto(productoEditando);
      await axiosClient.put(`/productos/${productoEditando.id}`, payload);

      if (archivoImagenEditar) {
        const formData = new FormData();
        formData.append('archivo', archivoImagenEditar);
        await axiosClient.post(`/productos/${productoEditando.id}/imagenes?esPrincipal=true`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      setMensaje(
        `✅ Artículo "${productoEditando.nombre}" (SKU: #${productoEditando.sku}) actualizado correctamente.`
      );
      setProductoEditando(null);
      setArchivoImagenEditar(null);
      await cargarDatosBackoffice();
    } catch (err) {
      setErrorMsg(err.response?.data?.mensaje || 'No se pudieron guardar los cambios del producto.');
    } finally {
      setGuardando(false);
    }
  };

  // 4. ACTUALIZAR STOCK RÁPIDO
  const handleActualizarStock = async (productoId, nuevoStock) => {
    try {
      await axiosClient.patch(`/productos/${productoId}/stock`, {
        cantidadStock: Number(nuevoStock)
      });
      setMensaje(`Stock actualizado para el artículo #${productoId}.`);
      cargarDatosBackoffice();
    } catch (err) {
      setErrorMsg(err.response?.data?.mensaje || 'No se pudo actualizar el stock.');
    }
  };

  // 5. ELIMINAR PRODUCTO CON CONFIRMACIÓN
  const confirmarEliminarProducto = async () => {
    if (!productoAEliminar) return;
    setErrorMsg('');
    try {
      await axiosClient.delete(`/productos/${productoAEliminar.id}`);
      setMensaje(
        `El producto "${productoAEliminar.nombre}" (SKU: ${productoAEliminar.sku}) fue eliminado del catálogo.`
      );
      setProductoAEliminar(null);
      cargarDatosBackoffice();
    } catch (err) {
      setErrorMsg(err.response?.data?.mensaje || 'No se pudo eliminar el producto.');
      setProductoAEliminar(null);
    }
  };

  // 6. ACTUALIZAR ESTADO DE TURNO DE TALLER
  const handleCambiarEstadoTurno = async (turnoId, nuevoEstado) => {
    try {
      await axiosClient.patch(`/taller/turnos/${turnoId}`, {
        estado: nuevoEstado
      });
      setMensaje(`Estado del turno #${turnoId} actualizado a "${nuevoEstado}".`);
      cargarDatosBackoffice();
    } catch (err) {
      setErrorMsg(err.response?.data?.mensaje || 'No se pudo actualizar el turno de taller.');
    }
  };

  // Filtrado de productos para la tabla de inventario
  const productosFiltrados = useMemo(() => {
    const q = busquedaAdmin.trim().toLowerCase();
    return productos.filter((p) => {
      const cumpleTipo =
        filtroTipoAdmin === 'Todos'
          ? true
          : filtroTipoAdmin === 'Destacados'
          ? p.destacado
          : filtroTipoAdmin === 'BajoStock'
          ? p.stock <= p.stockMinimoAlerta
          : p.tipoProducto === filtroTipoAdmin;

      if (!cumpleTipo) return false;
      if (!q) return true;

      return (
        p.nombre.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.marcaNombre || '').toLowerCase().includes(q) ||
        (p.categoriaNombre || '').toLowerCase().includes(q) ||
        (p.descripcion || '').toLowerCase().includes(q)
      );
    });
  }, [productos, busquedaAdmin, filtroTipoAdmin]);

  const porPagina = 40;
  const totalPags = Math.max(1, Math.ceil(productosFiltrados.length / porPagina));
  const pagActual = Math.min(paginaAdmin, totalPags);
  const itemsPagina = productosFiltrados.slice((pagActual - 1) * porPagina, pagActual * porPagina);

  // Renderizador reutilizable de campos de formulario (Nuevo y Editar)
  const renderCamposFormularioProducto = (datos, setDatos, archivo, setArchivo) => (
    <>
      <div className="form-row-3">
        <label>
          Código SKU
          <input
            type="text"
            required
            className="input-control"
            placeholder="Ej. 001712"
            value={datos.sku}
            onChange={(e) => setDatos({ ...datos, sku: e.target.value })}
          />
        </label>

        <label>
          Tipo de Artículo
          <select
            className="input-control"
            value={datos.tipoProducto}
            onChange={(e) => setDatos({ ...datos, tipoProducto: e.target.value })}
          >
            <option value="Bicicleta">Bicicleta Completa</option>
            <option value="Repuesto">Repuesto / Componente</option>
            <option value="Cubierta">Cámara / Cubierta</option>
            <option value="Accesorio">Accesorio / Indumentaria</option>
          </select>
        </label>

        <label>
          Marca Oficial
          <select
            className="input-control"
            required
            value={datos.marcaId}
            onChange={(e) => setDatos({ ...datos, marcaId: Number(e.target.value) })}
          >
            <option value="" disabled>Seleccionar marca...</option>
            {marcas.map((m) => (
              <option key={m.id} value={m.id}>{m.nombre}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="form-row-2">
        <label>
          Nombre del Artículo
          <input
            type="text"
            required
            className="input-control"
            placeholder="Ej. BICICLETA TENTACION ROD. 26 FULL"
            value={datos.nombre}
            onChange={(e) => setDatos({ ...datos, nombre: e.target.value })}
          />
        </label>

        <label>
          Rubro / Subcategoría
          <select
            className="input-control"
            required
            value={datos.categoriaId}
            onChange={(e) => setDatos({ ...datos, categoriaId: Number(e.target.value) })}
          >
            <option value="" disabled>Seleccionar rubro...</option>
            {subcategorias.map((sc) => (
              <option key={sc.id} value={sc.id}>
                {sc.padreNombre} › {sc.nombre}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="form-row-3">
        <label>
          Precio de Lista ($)
          <input
            type="number"
            required
            min="0"
            step="any"
            className="input-control"
            value={datos.precio}
            onChange={(e) => setDatos({ ...datos, precio: e.target.value })}
          />
        </label>

        <label>
          Precio Promocional / Descuento ($) <small style={{ color: 'var(--muted)' }}>(Opcional)</small>
          <input
            type="number"
            min="0"
            step="any"
            className="input-control"
            placeholder="Dejar vacío si no aplica"
            value={datos.precioDescuento}
            onChange={(e) => setDatos({ ...datos, precioDescuento: e.target.value })}
          />
        </label>

        <div className="form-row-2" style={{ gap: '0.65rem' }}>
          <label>
            Stock Actual
            <input
              type="number"
              required
              min="0"
              className="input-control"
              value={datos.stock}
              onChange={(e) => setDatos({ ...datos, stock: e.target.value })}
            />
          </label>
          <label>
            Alerta Mín.
            <input
              type="number"
              required
              min="0"
              className="input-control"
              value={datos.stockMinimoAlerta}
              onChange={(e) => setDatos({ ...datos, stockMinimoAlerta: e.target.value })}
            />
          </label>
        </div>
      </div>

      <div className="form-row-3">
        <label>
          Rodado / Medida
          <input
            type="text"
            className="input-control"
            placeholder='Ej. 29", 26", 20", 16"'
            value={datos.rodado}
            onChange={(e) => setDatos({ ...datos, rodado: e.target.value })}
          />
        </label>

        <label>
          Talle de Cuadro
          <input
            type="text"
            className="input-control"
            placeholder="Ej. S / M, M / L, Junior"
            value={datos.talleCuadro}
            onChange={(e) => setDatos({ ...datos, talleCuadro: e.target.value })}
          />
        </label>

        <label>
          Material
          <input
            type="text"
            className="input-control"
            placeholder="Ej. Aluminio 6061, Acero Hi-Ten"
            value={datos.material}
            onChange={(e) => setDatos({ ...datos, material: e.target.value })}
          />
        </label>
      </div>

      <div className="form-row-3">
        <label>
          Velocidades (Transmisión)
          <input
            type="number"
            min="1"
            max="36"
            className="input-control"
            placeholder="Ej. 21, 18, 12, 9, 1"
            value={datos.velocidades}
            onChange={(e) => setDatos({ ...datos, velocidades: e.target.value })}
          />
        </label>

        <label>
          Peso Declarado (gramos) <small style={{ color: 'var(--muted)' }}>(Opcional)</small>
          <input
            type="number"
            min="0"
            className="input-control"
            placeholder="Ej. 13400"
            value={datos.pesoGramos}
            onChange={(e) => setDatos({ ...datos, pesoGramos: e.target.value })}
          />
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', paddingTop: '1.65rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={Boolean(datos.destacado)}
            onChange={(e) => setDatos({ ...datos, destacado: e.target.checked })}
            style={{ width: 18, height: 18, accentColor: 'var(--primary)' }}
          />
          <span>⭐ Destacar en el Carrusel de Inicio</span>
        </label>
      </div>

      <label>
        Descripción Técnica Completa
        <textarea
          rows={3}
          required
          className="input-control"
          placeholder="Describí las especificaciones técnicas, materiales, componentes y uso recomendado..."
          value={datos.descripcion}
          onChange={(e) => setDatos({ ...datos, descripcion: e.target.value })}
        />
      </label>

      <div className="form-row-2" style={{ alignItems: 'center' }}>
        <div>
          <label>
            URL de la Foto del Artículo (Directa)
            <input
              type="url"
              className="input-control"
              placeholder="https://..."
              value={datos.imagenUrl}
              onChange={(e) => setDatos({ ...datos, imagenUrl: e.target.value })}
            />
          </label>
          <label style={{ marginTop: '0.75rem', display: 'block' }}>
            O subir archivo de imagen desde tu PC (Cloudinary)
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.avif"
              className="input-control"
              onChange={(e) => setArchivo(e.target.files?.[0] || null)}
            />
          </label>
        </div>

        <div style={{ textAlign: 'center' }}>
          <small style={{ color: 'var(--muted)', display: 'block', marginBottom: '0.4rem' }}>
            Vista previa de encuadre
          </small>
          <div
            style={{
              width: 180,
              height: 125,
              margin: '0 auto',
              background: '#ffffff',
              borderRadius: 12,
              padding: 8,
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {datos.imagenUrl ? (
              <img
                src={datos.imagenUrl}
                alt="Vista previa"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            ) : (
              <span style={{ color: '#64748B', fontSize: '0.78rem' }}>Sin imagen</span>
            )}
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="container page-section">
      <header className="clean-section-header">
        <div>
          <span className="section-tag">ADMINISTRACIÓN · EL CAIRO</span>
          <h1>Panel de Control e Inventario</h1>
          <p className="subtitle">
            Creá, editá o actualizá precios, fotos, descripciones y stock de los {productos.length} artículos del catálogo.
          </p>
        </div>

        <div className="filter-chips">
          <button
            type="button"
            className={`chip ${tabActiva === 'inventario' ? 'chip-active' : ''}`}
            onClick={() => setTabActiva('inventario')}
          >
            📦 Inventario & Editar ({productos.length})
          </button>
          <button
            type="button"
            className={`chip ${tabActiva === 'nuevo' ? 'chip-active' : ''}`}
            onClick={() => setTabActiva('nuevo')}
          >
            + Nuevo Producto
          </button>
          <button
            type="button"
            className={`chip ${tabActiva === 'metricas' ? 'chip-active' : ''}`}
            onClick={() => setTabActiva('metricas')}
          >
            📊 Resumen & Ganancias
          </button>
          <button
            type="button"
            className={`chip ${tabActiva === 'turnos' ? 'chip-active' : ''}`}
            onClick={() => setTabActiva('turnos')}
          >
            🔧 Turnos Taller ({turnosTaller.length})
          </button>
        </div>
      </header>

      {mensaje && <div className="alert-success">{mensaje}</div>}
      {errorMsg && <div className="alert-error">{errorMsg}</div>}

      {/* =====================================================================
          VISTA 1: INVENTARIO, FILTROS Y EDICIÓN DE CUALQUIER PRODUCTO
         ===================================================================== */}
      {tabActiva === 'inventario' && (
        <div className="card-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <input
              type="text"
              className="input-control"
              style={{ maxWidth: '420px', marginTop: 0 }}
              placeholder="Buscar artículo por código SKU, nombre, marca o rubro..."
              value={busquedaAdmin}
              onChange={(e) => {
                setBusquedaAdmin(e.target.value);
                setPaginaAdmin(1);
              }}
            />

            <div className="filter-chips" style={{ flexWrap: 'wrap' }}>
              {[
                { id: 'Todos', label: 'Todos' },
                { id: 'Bicicleta', label: 'Bicicletas' },
                { id: 'Repuesto', label: 'Repuestos' },
                { id: 'Cubierta', label: 'Cámaras y Cubiertas' },
                { id: 'Accesorio', label: 'Accesorios' },
                { id: 'Destacados', label: '⭐ Destacados' },
                { id: 'BajoStock', label: '⚠️ Bajo Stock' }
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={`chip ${filtroTipoAdmin === f.id ? 'chip-active' : ''}`}
                  onClick={() => {
                    setFiltroTipoAdmin(f.id);
                    setPaginaAdmin(1);
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', color: '#94A3B8', fontSize: '0.88rem' }}>
            <span>
              Mostrando <strong>{itemsPagina.length}</strong> de <strong>{productosFiltrados.length}</strong> artículos filtrados
            </span>
            <span>Página {pagActual} de {totalPags}</span>
          </div>

          <div className="stock-table-wrap">
            <table className="stock-table">
              <thead>
                <tr>
                  <th>Foto</th>
                  <th>SKU</th>
                  <th>Artículo</th>
                  <th>Tipo / Rubro / Marca</th>
                  <th>Precio</th>
                  <th>Stock</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {itemsPagina.map((p) => {
                  const foto = obtenerImagenProducto(p);
                  return (
                    <tr key={p.id}>
                      <td>
                        <div
                          style={{
                            width: 56,
                            height: 42,
                            background: '#ffffff',
                            borderRadius: 8,
                            padding: 3,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid var(--border)'
                          }}
                        >
                          <img
                            src={foto}
                            alt={p.nombre}
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            loading="lazy"
                          />
                        </div>
                      </td>
                      <td>
                        <code>{p.sku}</code>
                        {p.destacado && (
                          <span title="Destacado en Inicio" style={{ marginLeft: 4 }}>⭐</span>
                        )}
                      </td>
                      <td>
                        <Link
                          to={`/producto/${p.id}`}
                          className="product-title-link"
                          style={{ fontWeight: 600 }}
                        >
                          {p.nombre}
                        </Link>
                        {p.rodado && (
                          <div style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>
                            Rodado {p.rodado} {p.velocidades ? `· ${p.velocidades}v` : ''}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="spec-pill" style={{ marginRight: 6 }}>{p.tipoProducto}</span>
                        <small>{p.categoriaNombre}</small> · <strong>{p.marcaNombre}</strong>
                      </td>
                      <td>
                        {p.precioDescuento ? (
                          <>
                            <span className="old-price" style={{ display: 'block' }}>
                              ${p.precio.toLocaleString('es-AR')}
                            </span>
                            <strong style={{ color: 'var(--accent-yellow)' }}>
                              ${p.precioDescuento.toLocaleString('es-AR')}
                            </strong>
                          </>
                        ) : (
                          <strong>${p.precio.toLocaleString('es-AR')}</strong>
                        )}
                      </td>
                      <td>
                        <span className={p.stock <= p.stockMinimoAlerta ? 'stock-out' : 'stock-ok'}>
                          {p.stock} u.
                        </span>
                      </td>
                      <td>
                        <div className="demo-btns" style={{ marginTop: 0, flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            className="btn-primary btn-sm"
                            onClick={() => abrirModalEditar(p)}
                            title="Editar todos los datos del producto"
                          >
                            ✏️ Editar
                          </button>
                          <button
                            type="button"
                            className="btn-outline btn-sm"
                            onClick={() => handleActualizarStock(p.id, Math.max(0, p.stock - 1))}
                            title="Restar 1 unidad"
                          >
                            -1
                          </button>
                          <button
                            type="button"
                            className="btn-outline btn-sm"
                            onClick={() => handleActualizarStock(p.id, p.stock + 5)}
                            title="Sumar 5 unidades"
                          >
                            +5
                          </button>
                          <button
                            type="button"
                            className="btn-danger-outline btn-sm"
                            onClick={() => setProductoAEliminar(p)}
                            title="Dar de baja del catálogo"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPags > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button
                type="button"
                className="btn-outline btn-sm"
                disabled={pagActual <= 1}
                onClick={() => setPaginaAdmin((prev) => Math.max(1, prev - 1))}
              >
                ← Anterior
              </button>
              <span style={{ color: '#E2E8F0', fontSize: '0.9rem' }}>
                Página {pagActual} de {totalPags}
              </span>
              <button
                type="button"
                className="btn-outline btn-sm"
                disabled={pagActual >= totalPags}
                onClick={() => setPaginaAdmin((prev) => Math.min(totalPags, prev + 1))}
              >
                Siguiente →
              </button>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          VISTA 2: ALTA DE NUEVO PRODUCTO
         ===================================================================== */}
      {tabActiva === 'nuevo' && (
        <form onSubmit={handleCrearProducto} className="card-panel checkout-form">
          <h3>Publicar Nuevo Artículo en el Catálogo</h3>
          <p className="subtitle" style={{ marginBottom: '1rem' }}>
            Completá los datos técnicos, precio, stock y foto para publicar una bicicleta, repuesto, cubierta o accesorio.
          </p>

          {renderCamposFormularioProducto(
            nuevoProducto,
            setNuevoProducto,
            archivoImagenNuevo,
            setArchivoImagenNuevo
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button
              type="button"
              className="btn-outline"
              onClick={() => setTabActiva('inventario')}
            >
              Cancelar
            </button>
            <button type="submit" disabled={guardando} className="btn-primary">
              {guardando ? 'Publicando artículo...' : 'Publicar Artículo en Catálogo'}
            </button>
          </div>
        </form>
      )}

      {/* =====================================================================
          VISTA 3: RESUMEN, GANANCIAS, ALERTAS DE STOCK Y ÓRDENES RECIENTES
         ===================================================================== */}
      {tabActiva === 'metricas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="kpi-grid">
            <div className="kpi-card">
              <small>Ganancia Total Acumulada</small>
              <strong>${metricas.gananciaTotalAcumulada.toLocaleString('es-AR')}</strong>
            </div>
            <div className="kpi-card">
              <small>Ventas de Catálogo</small>
              <strong>${metricas.gananciasVentasProductos.toLocaleString('es-AR')}</strong>
            </div>
            <div className="kpi-card">
              <small>Ingresos de Taller</small>
              <strong>${metricas.gananciasServiciosTaller.toLocaleString('es-AR')}</strong>
            </div>
            <div className="kpi-card">
              <small>Actividad General</small>
              <strong>
                {metricas.cantidadOrdenesValidas} órdenes · {metricas.turnosTallerPendientes} turnos
              </strong>
            </div>
          </div>

          <div className="form-row-2" style={{ alignItems: 'flex-start' }}>
            {/* Alertas de Stock Crítico */}
            <div className="card-panel">
              <div className="section-header-flex">
                <h3>⚠️ Alertas de Stock Crítico ({metricas.alertasStockCritico?.length || 0})</h3>
                <button
                  type="button"
                  className="btn-outline btn-sm"
                  onClick={() => {
                    setFiltroTipoAdmin('BajoStock');
                    setTabActiva('inventario');
                  }}
                >
                  Ver todos en Inventario →
                </button>
              </div>
              {(!metricas.alertasStockCritico || metricas.alertasStockCritico.length === 0) ? (
                <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                  Todos los artículos superan el stock mínimo de alerta.
                </p>
              ) : (
                <div className="stock-table-wrap">
                  <table className="stock-table">
                    <thead>
                      <tr>
                        <th>SKU</th>
                        <th>Artículo</th>
                        <th>Stock</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metricas.alertasStockCritico.slice(0, 8).map((item) => (
                        <tr key={item.id}>
                          <td><code>{item.sku}</code></td>
                          <td>{item.nombre}</td>
                          <td>
                            <span className="stock-out">{item.stock} u.</span>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn-outline btn-sm"
                              onClick={() => handleActualizarStock(item.id, item.stock + 5)}
                            >
                              +5 Stock
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Órdenes de Compra Recientes */}
            <div className="card-panel">
              <h3>🛒 Últimas Órdenes de Compra</h3>
              {(!metricas.ordenesRecientes || metricas.ordenesRecientes.length === 0) ? (
                <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                  Todavía no se registraron órdenes de compra.
                </p>
              ) : (
                <div className="stock-table-wrap" style={{ marginTop: '0.5rem' }}>
                  <table className="stock-table">
                    <thead>
                      <tr>
                        <th>Orden</th>
                        <th>Cliente</th>
                        <th>Pago</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metricas.ordenesRecientes.map((o) => (
                        <tr key={o.id}>
                          <td><code>{o.numeroOrden}</code></td>
                          <td>{o.cliente}</td>
                          <td><small>{o.metodoPago}</small></td>
                          <td><strong>${o.montoTotal.toLocaleString('es-AR')}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          VISTA 4: GESTIÓN DE TURNOS DE TALLER
         ===================================================================== */}
      {tabActiva === 'turnos' && (
        <div className="card-panel">
          <h3>🔧 Turnos de Taller Mecánico Agendados</h3>
          <p className="subtitle" style={{ marginBottom: '1rem' }}>
            Administrá el estado de las bicicletas ingresadas al taller (Programado, En Proceso, Listo y Entregado).
          </p>

          {turnosTaller.length === 0 ? (
            <p style={{ color: 'var(--muted)' }}>No hay turnos de taller registrados por el momento.</p>
          ) : (
            <div className="stock-table-wrap">
              <table className="stock-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Cliente</th>
                    <th>Servicio / Bicicleta</th>
                    <th>Fecha Programada</th>
                    <th>Importe</th>
                    <th>Estado</th>
                    <th>Cambiar Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {turnosTaller.map((t) => (
                    <tr key={t.id}>
                      <td><code>#{t.id}</code></td>
                      <td>
                        <strong>{t.cliente}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t.clienteEmail}</div>
                      </td>
                      <td>
                        <strong>{t.servicio}</strong>
                        <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{t.detallesBicicleta}</div>
                      </td>
                      <td>{new Date(t.fechaProgramada).toLocaleString('es-AR')}</td>
                      <td><strong>${(t.precioFinal || 0).toLocaleString('es-AR')}</strong></td>
                      <td>
                        <span className="spec-pill">{t.estado}</span>
                      </td>
                      <td>
                        <div className="demo-btns" style={{ marginTop: 0 }}>
                          {['Programado', 'EnProceso', 'Listo', 'Entregado'].map((est) => (
                            <button
                              key={est}
                              type="button"
                              className={`btn-outline btn-sm ${t.estado === est ? 'compare-btn-active' : ''}`}
                              onClick={() => handleCambiarEstadoTurno(t.id, est)}
                            >
                              {est}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          MODAL DE EDICIÓN COMPLETA DE PRODUCTO EXISTENTE
         ===================================================================== */}
      {productoEditando && (
        <div className="modal-backdrop" onClick={() => setProductoEditando(null)}>
          <div
            className="compare-modal-card"
            style={{ width: 'min(860px, 95vw)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="compare-modal-header">
              <div>
                <span className="section-tag">EDITAR ARTÍCULO EXISTENTE · ID #{productoEditando.id}</span>
                <h2>Editar: {productoEditando.nombre}</h2>
              </div>
              <button
                type="button"
                className="btn-outline btn-sm"
                onClick={() => setProductoEditando(null)}
              >
                ✕ Cerrar
              </button>
            </div>

            <form onSubmit={handleGuardarEdicion} className="checkout-form">
              {renderCamposFormularioProducto(
                productoEditando,
                setProductoEditando,
                archivoImagenEditar,
                setArchivoImagenEditar
              )}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.75rem',
                  marginTop: '1.25rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--border)'
                }}
              >
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setProductoEditando(null)}
                >
                  Cancelar
                </button>
                <button type="submit" disabled={guardando} className="btn-primary">
                  {guardando ? 'Guardando cambios...' : '💾 Guardar Cambios del Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmación al Eliminar Producto del Panel Admin */}
      <ConfirmModal
        abierto={Boolean(productoAEliminar)}
        titulo="¿Eliminar producto del catálogo?"
        mensaje={
          productoAEliminar
            ? `¿Estás seguro de que querés dar de baja el artículo "${productoAEliminar.nombre}" (SKU: ${productoAEliminar.sku})? Dejará de mostrarse en la tienda pública.`
            : ''
        }
        textoConfirmar="Sí, eliminar producto"
        textoCancelar="Cancelar"
        onConfirmar={confirmarEliminarProducto}
        onCancelar={() => setProductoAEliminar(null)}
      />
    </div>
  );
}
