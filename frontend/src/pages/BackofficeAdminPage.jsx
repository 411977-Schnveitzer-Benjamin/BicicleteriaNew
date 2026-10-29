import { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

export default function BackofficeAdminPage() {
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

  const [nuevoProducto, setNuevoProducto] = useState({
    categoriaId: 6, // Transmisión por defecto
    marcaId: 1,     // Shimano por defecto
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
          'No se pudieron obtener las métricas. Asegurate de haber iniciado sesión como Administrador.'
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

      // Si el Administrador adjuntó una imagen, subirla a Cloudinary y guardar su URL en SQL Server
      if (archivoImagen) {
        const formData = new FormData();
        formData.append('archivo', archivoImagen);

        await axiosClient.post(`/productos/${prodCreado.id}/imagenes?esPrincipal=true`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      setMensaje(`✅ Producto "${prodCreado.nombre}" creado correctamente.`);
      setNuevoProducto({ ...nuevoProducto, sku: '', nombre: '', slug: '', descripcion: '', precio: '' });
      setArchivoImagen(null);
      cargarDatosBackoffice();
    } catch (err) {
      setErrorMsg(err.response?.data?.mensaje || 'Error al crear el producto.');
    }
  };

  const handleActualizarStock = async (productoId, nuevoStock) => {
    try {
      await axiosClient.patch(`/productos/${productoId}/stock`, {
        cantidadStock: Number(nuevoStock)
      });
      setMensaje(`✅ Stock actualizado para el producto #${productoId}.`);
      cargarDatosBackoffice();
    } catch (err) {
      setErrorMsg(err.response?.data?.mensaje || 'No se pudo actualizar el stock.');
    }
  };

  return (
    <div className="container page-section">
      <div className="section-header-flex">
        <div>
          <span className="hero-pill">ROL: ADMINISTRADOR (JWT VERIFICADO)</span>
          <h1>Backoffice de Gestión, Stock, Cloudinary y Ganancias</h1>
        </div>
      </div>

      {mensaje && <div className="alert-success">{mensaje}</div>}
      {errorMsg && <div className="alert-error">{errorMsg}</div>}

      {/* Tarjetas de Ganancias y Métricas */}
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
          <small>Órdenes Confirmadas / Turnos</small>
          <strong>{metricas.cantidadOrdenesValidas} órd. · {metricas.turnosTallerPendientes} turnos</strong>
        </div>
      </div>

      <div className="admin-grid">
        {/* Formulario Alta de Producto + Cloudinary */}
        <form onSubmit={handleCrearProducto} className="card-panel checkout-form">
          <h3>Cargar Nuevo Producto + Imagen en Cloudinary</h3>

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
              Tipo de Producto
              <select
                className="input-control"
                value={nuevoProducto.tipoProducto}
                onChange={(e) => setNuevoProducto({ ...nuevoProducto, tipoProducto: e.target.value })}
              >
                <option value="Bicicleta">Bicicleta Completa</option>
                <option value="Repuesto">Repuesto (Shimano / SRAM)</option>
                <option value="Accesorio">Accesorio</option>
              </select>
            </label>
          </div>

          <label>
            Nombre del Producto
            <input
              type="text"
              required
              className="input-control"
              placeholder="Ej. Cadena Shimano XT CN-M8100 12v 126 Eslabones"
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
            Foto del Producto (Subida directa a Cloudinary)
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.avif"
              className="input-control"
              onChange={(e) => setArchivoImagen(e.target.files?.[0] || null)}
            />
          </label>

          <button type="submit" className="btn-primary btn-block">
            Guardar Producto y Subir Foto a Cloudinary
          </button>
        </form>

        {/* Tabla de Control Rápido de Stock */}
        <div className="card-panel">
          <h3>Control de Stock en Tiempo Real</h3>
          <div className="stock-table-wrap">
            <table className="stock-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Producto</th>
                  <th>Precio</th>
                  <th>Stock</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((p) => (
                  <tr key={p.id}>
                    <td><code>{p.sku}</code></td>
                    <td>{p.nombre}</td>
                    <td>${p.precio.toLocaleString('es-AR')}</td>
                    <td>
                      <span className={p.stock <= p.stockMinimoAlerta ? 'stock-out' : 'stock-ok'}>
                        {p.stock} u.
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-outline btn-sm"
                        onClick={() => handleActualizarStock(p.id, p.stock + 5)}
                      >
                        +5 Stock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

