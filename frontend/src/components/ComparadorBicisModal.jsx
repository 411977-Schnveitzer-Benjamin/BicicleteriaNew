import { Link } from 'react-router-dom';

export default function ComparadorBicisModal({
  abierto,
  bicicletas,
  onQuitarBici,
  onLimpiarTodo,
  onCerrar,
  onAgregarAlCarrito
}) {
  if (!abierto || bicicletas.length === 0) return null;

  return (
    <div className="modal-backdrop" onClick={onCerrar}>
      <div className="compare-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="compare-modal-header">
          <div>
            <span className="section-tag">COMPARADOR TÉCNICO · EL CAIRO</span>
            <h3>Comparativa Lado a Lado ({bicicletas.length} modelos)</h3>
          </div>
          <div className="demo-btns">
            <button type="button" className="btn-outline btn-sm" onClick={onLimpiarTodo}>
              Limpiar selección
            </button>
            <button type="button" className="btn-primary btn-sm" onClick={onCerrar}>
              Cerrar ✕
            </button>
          </div>
        </div>

        <div className="compare-table-wrap">
          <table className="compare-table">
            <thead>
              <tr>
                <th>Especificación</th>
                {bicicletas.map((b) => {
                  const img =
                    b.imagenes?.find((i) => i.esPrincipal)?.imagenUrl ||
                    b.imagenes?.[0]?.imagenUrl ||
                    'https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?auto=format&fit=crop&w=800&q=80';
                  return (
                    <th key={b.id} className="compare-col-header">
                      <img src={img} alt={b.nombre} className="compare-thumb" />
                      <Link to={`/producto/${b.id}`} onClick={onCerrar} className="compare-title-link">
                        {b.nombre}
                      </Link>
                      <button
                        type="button"
                        className="btn-remove"
                        style={{ margin: '0.35rem auto 0' }}
                        onClick={() => onQuitarBici(b.id)}
                      >
                        Quitar de comparativa
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Precio Contado / Lista</strong></td>
                {bicicletas.map((b) => (
                  <td key={b.id}>
                    <strong className="current-price">
                      ${(b.precioDescuento ?? b.precio).toLocaleString('es-AR')}
                    </strong>
                  </td>
                ))}
              </tr>
              <tr>
                <td><strong>Marca Oficial</strong></td>
                {bicicletas.map((b) => (
                  <td key={b.id}>{b.marcaNombre}</td>
                ))}
              </tr>
              <tr>
                <td><strong>Categoría / Disciplina</strong></td>
                {bicicletas.map((b) => (
                  <td key={b.id}>{b.categoriaNombre}</td>
                ))}
              </tr>
              <tr>
                <td><strong>Rodado</strong></td>
                {bicicletas.map((b) => (
                  <td key={b.id}>{b.rodado || '29"'}</td>
                ))}
              </tr>
              <tr>
                <td><strong>Talle de Cuadro</strong></td>
                {bicicletas.map((b) => (
                  <td key={b.id}>Talle {b.talleCuadro || 'M'}</td>
                ))}
              </tr>
              <tr>
                <td><strong>Material del Cuadro</strong></td>
                {bicicletas.map((b) => (
                  <td key={b.id}>{b.material || 'Aluminio'}</td>
                ))}
              </tr>
              <tr>
                <td><strong>Transmisión (Velocidades)</strong></td>
                {bicicletas.map((b) => (
                  <td key={b.id}>{b.velocidades ? `${b.velocidades} velocidades` : 'Monoplato 12v'}</td>
                ))}
              </tr>
              <tr>
                <td><strong>Peso Total</strong></td>
                {bicicletas.map((b) => (
                  <td key={b.id}>
                    {b.pesoGramos
                      ? `${(b.pesoGramos / 1000).toFixed(2)} kg`
                      : 'No especificado'}
                  </td>
                ))}
              </tr>
              <tr>
                <td><strong>Acción</strong></td>
                {bicicletas.map((b) => (
                  <td key={b.id}>
                    <button
                      type="button"
                      disabled={b.stock <= 0}
                      onClick={() => onAgregarAlCarrito(b)}
                      className="btn-primary btn-sm"
                    >
                      + Agregar al Carrito
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

