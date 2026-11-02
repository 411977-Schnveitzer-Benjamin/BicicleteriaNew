import { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import ConfirmModal from '../components/ConfirmModal';

export default function BackofficeAdminPage() {
  const [tabActiva, setTabActiva] = useState('metricas'); // 'metricas' | 'inventario' | 'nuevo'

  const [metricas, setMetricas] = useState({
    gananciasVentasProductos: 0,
    gananciasServiciosTaller: 0,
    gananciaTotalAcumulada: 0,
    cantidadOrdenesValidas: 0,
    turnosTallerPendientes: 0,
    alertasStockCritico: []
  });

  const [productos, setProductos] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [archivoImagen, setArchivoImagen] = useState(null);
  const [productoAEliminar, setProductoAEliminar] = useState(null);

  const [nuevoProducto, setNuevoProducto] = useState({
    categoriaId: 6,
    marcaId: 1,
    sku: '',
    nombre: '',
    slug: '',
    descripcion: '',
    tipoProducto: 'Repuesto',
    precio: '',
    stock: 10,
    stockMinimoAlerta: 3,
    rodado: '',
    talleCuadro: '',
    velocidades: 12,
    destacado: true
  });

  const cargarDatosBackoffice = async () => {
    try {
      const [resGanancias, resProductos] = await Promise.all([
        axiosClient.get('/ordenes/ganancias'),
        axiosClient.get('/productos')
      ]);
      setMetricas(resGanancias.data);
      setProductos(resProductos.data);
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

  const handleCrearProducto = async (e) => {
    e.preventDefault();
    setMensaje('');
    setErrorMsg('');

    try {
      const payload = {
        ...nuevoProducto,
        categoriaId: Number(nuevoProducto.categoriaId),
        marcaId: Number(nuevoProducto.marcaId),
        precio: Number(nuevoProducto.precio),
        stock: Number(nuevoProducto.stock),
        stockMinimoAlerta: Number(nuevoProducto.stockMinimoAlerta),
        velocidades: nuevoProducto.velocidades ? Number(nuevoProducto.velocidades) : null,
        slug:
          nuevoProducto.slug ||
          nuevoProducto.nombre
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
      };

      const { data: prodCreado } = await axiosClient.post('/productos', payload);

      if (archivoImagen) {
        const formData = new FormData();
        formData.append('archivo', archivoImagen);

        await axiosClient.post(`/productos/${prodCreado.id}/imagenes?esPrincipal=true`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      setMensaje(`Producto "${prodCreado.nombre}" publicado con éxito.`);
      setNuevoProducto({ ...nuevoProducto, sku: '', nombre: '', slug: '', descripcion: '', precio: '' });
      setArchivoImagen(null);
      cargarDatosBackoffice();
      setTabActiva('inventario');
    } catch (err) {
      setErrorMsg(err.response?.data?.mensaje || 'Error al crear el producto.');
    }
  };

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

  const confirmarEliminarProducto = async () => {
    if (!productoAEliminar) return;
    setErrorMsg('');
    try {
      await axiosClient.delete(`/productos/${productoAEliminar.id}`);
      setMensaje(`El producto "${productoAEliminar.nombre}" (SKU: ${productoAEliminar.sku}) fue eliminado del catálogo.`);
      setProductoAEliminar(null);
      cargarDatosBackoffice();
    } catch (err) {
      setErrorMsg(err.response?.data?.mensaje || 'No se pudo eliminar el producto.');
      setProductoAEliminar(null);
    }
  };

  return (
    <div className="container page-section">
      <header className="clean-section-header">
        <div>
          <span className="section-tag">ADMINISTRACIÓN · EL CAIRO</span>
          <h1>Panel de Control</h1>
        </div>

        <div className="filter-chips">
          <button
            type="button"
            className={`chip ${tabActiva === 'metricas' ? 'chip-active' : ''}`}
            onClick={() => setTabActiva('metricas')}
          >
            Resumen & Ganancias
          </button>
          <button
            type="button"
            className={`chip ${tabActiva === 'inventario' ? 'chip-active' : ''}`}
            onClick={() => setTabActiva('inventario')}
          >
            Inventario & Stock ({productos.length})
          </button>
          <button
            type="button"
            className={`chip ${tabActiva === 'nuevo' ? 'chip-active' : ''}`}
            onClick={() => setTabActiva('nuevo')}
          >
            + Nuevo Producto
          </button>
        </div>
      </header>

      {mensaje && <div className="alert-success">{mensaje}</div>}
      {errorMsg && <div className="alert-error">{errorMsg}</div>}

      {/* Vista 1: Resumen & Ganancias */}
      {tabActiva === 'metricas' && (
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
      )}

      {/* Vista 2: Inventario, Stock y Eliminación con Confirmación */}
      {tabActiva === 'inventario' && (
        <div className="card-panel">
          <div className="stock-table-wrap">
            <table className="stock-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Artículo</th>
                  <th>Sección</th>
                  <th>Precio</th>
                  <th>Stock</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((p) => (
                  <tr key={p.id}>
                    <td><code>{p.sku}</code></td>
                    <td>{p.nombre}</td>
                    <td>{p.tipoProducto}</td>
                    <td>${p.precio.toLocaleString('es-AR')}</td>
                    <td>
                      <span className={p.stock <= p.stockMinimoAlerta ? 'stock-out' : 'stock-ok'}>
                        {p.stock} u.
                      </span>
                    </td>
                    <td>
                      <div className="demo-btns">
                        <button
                          type="button"
                          className="btn-outline btn-sm"
                          onClick={() => handleActualizarStock(p.id, Math.max(0, p.stock - 1))}
                        >
                          -1
                        </button>
                        <button
                          type="button"
                          className="btn-outline btn-sm"
                          onClick={() => handleActualizarStock(p.id, p.stock + 5)}
                        >
                          +5
                        </button>
                        <button
                          type="button"
                          className="btn-danger-outline btn-sm"
                          onClick={() => setProductoAEliminar(p)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Vista 3: Alta de Producto + Cloudinary */}
      {tabActiva === 'nuevo' && (
        <form onSubmit={handleCrearProducto} className="card-panel checkout-form admin-form-narrow">
          <h3>Publicar Nuevo Artículo en Catálogo</h3>

          <div className="form-row-2">
            <label>
              SKU
              <input
                type="text"
                required
                className="input-control"
                placeholder="Ej. SHIM-CN-M8100"
                value={nuevoProducto.sku}
                onChange={(e) => setNuevoProducto({ ...nuevoProducto, sku: e.target.value })}
              />
            </label>

            <label>
              Sección del Catálogo
              <select
                className="input-control"
                value={nuevoProducto.tipoProducto}
                onChange={(e) =>
                  setNuevoProducto({
                    ...nuevoProducto,
                    tipoProducto: e.target.value,
                    categoriaId: e.target.value === 'Bicicleta' ? 4 : 6
                  })
                }
              >
                <option value="Bicicleta">Bicicleta Completa</option>
                <option value="Repuesto">Repuesto (Shimano / SRAM)</option>
                <option value="Accesorio">Accesorio</option>
              </select>
            </label>
          </div>

          <label>
            Nombre del Artículo
            <input
              type="text"
              required
              className="input-control"
              placeholder="Ej. Cadena Shimano XT CN-M8100 12v"
              value={nuevoProducto.nombre}
              onChange={(e) => setNuevoProducto({ ...nuevoProducto, nombre: e.target.value })}
            />
          </label>

          <div className="form-row-2">
            <label>
              Precio ($)
              <input
                type="number"
                required
                min="0"
                className="input-control"
                value={nuevoProducto.precio}
                onChange={(e) => setNuevoProducto({ ...nuevoProducto, precio: e.target.value })}
              />
            </label>

            <label>
              Stock Inicial
              <input
                type="number"
                required
                min="0"
                className="input-control"
                value={nuevoProducto.stock}
                onChange={(e) => setNuevoProducto({ ...nuevoProducto, stock: e.target.value })}
              />
            </label>
          </div>

          <label>
            Imagen del Producto (Se sube a Cloudinary automáticamente)
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.avif"
              className="input-control"
              onChange={(e) => setArchivoImagen(e.target.files?.[0] || null)}
            />
          </label>

          <button type="submit" className="btn-primary btn-block">
            Guardar y Subir Imagen
          </button>
        </form>
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
