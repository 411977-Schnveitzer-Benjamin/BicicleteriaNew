import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';

const SERVICIOS_DEMO = [
  {
    id: 1,
    nombre: 'Service Completo General',
    descripcion: 'Desarme íntegro, lavado por ultrasonido de transmisión, centrado de ruedas, lubricación y ajuste de cambios y frenos.',
    precioBase: 45000,
    duracionEstimadaMinutos: 180
  },
  {
    id: 2,
    nombre: 'Regulación de Cambios (Shimano / L-TWOO / Sensah)',
    descripcion: 'Alineación de fusible, tensión de cable/indexado y ajuste de límites en transmisiones de 6 a 12 velocidades.',
    precioBase: 15000,
    duracionEstimadaMinutos: 45
  },
  {
    id: 3,
    nombre: 'Purgado de Frenos Hidráulicos',
    descripcion: 'Recambio de líquido mineral o DOT, limpieza de pistones y descontaminación de pastillas (por freno).',
    precioBase: 18000,
    duracionEstimadaMinutos: 60
  }
];

export default function TallerPage() {
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const [servicios, setServicios] = useState([]);
  const [misTurnos, setMisTurnos] = useState([]);
  const [form, setForm] = useState({
    servicioTallerId: 1,
    detallesBicicleta: '',
    notasCliente: '',
    fechaProgramada: ''
  });
  const [mensajeExito, setMensajeExito] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const cargarMisTurnos = () => {
    if (!usuario) {
      setMisTurnos([]);
      return;
    }
    axiosClient
      .get('/taller/mis-turnos')
      .then((res) => setMisTurnos(res.data || []))
      .catch(() => setMisTurnos([]));
  };

  useEffect(() => {
    axiosClient
      .get('/taller/servicios')
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setServicios(res.data);
          setForm((prev) => ({ ...prev, servicioTallerId: res.data[0].id }));
        } else {
          setServicios(SERVICIOS_DEMO);
        }
      })
      .catch(() => setServicios(SERVICIOS_DEMO));
  }, []);

  useEffect(() => {
    cargarMisTurnos();
  }, [usuario]);

  const handleReservar = async (e) => {
    e.preventDefault();
    if (!usuario) {
      navigate('/login');
      return;
    }

    setErrorMsg('');
    setMensajeExito('');

    try {
      const { data } = await axiosClient.post('/taller/turnos', {
        ...form,
        servicioTallerId: Number(form.servicioTallerId)
      });
      setMensajeExito(
        `¡Turno #${data.id} agendado para tu ${data.detallesBicicleta}! Estado: ${data.estado}.`
      );
      setForm({ ...form, detallesBicicleta: '', notasCliente: '' });
      cargarMisTurnos();
    } catch (err) {
      setErrorMsg(
        err.response?.data?.mensaje ||
          'No se pudo agendar el turno. Verificá que el backend .NET 8 esté corriendo.'
      );
    }
  };

  return (
    <div className="container page-section">
      <header className="clean-section-header">
        <div>
          <span className="section-tag">SERVICE MECÁNICO OFICIAL · EL CAIRO</span>
          <h1>Taller Mecánico Especializado 🔧</h1>
          <p className="subtitle">
            Mantenimiento integral para bicicletas Venzo, Oxea, SLP y Nacionales, transmisiones Shimano y frenos hidráulicos.
          </p>
        </div>
      </header>

      <div className="cart-layout">
        <div className="services-list">
          {servicios.map((s) => {
            const seleccionado = Number(form.servicioTallerId) === Number(s.id);
            return (
              <div
                key={s.id}
                onClick={() => setForm({ ...form, servicioTallerId: s.id })}
                className="service-card card-panel"
                style={{
                  cursor: 'pointer',
                  borderColor: seleccionado ? 'var(--accent-orange)' : 'var(--border)'
                }}
              >
                <div className="service-header">
                  <h3>{s.nombre}</h3>
                  <span className="current-price">${s.precioBase.toLocaleString('es-AR')}</span>
                </div>
                <p>{s.descripcion}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                  <small>⏱️ Duración estimada: {s.duracionEstimadaMinutos} min</small>
                  <span className="spec-pill" style={{ color: seleccionado ? 'var(--accent-yellow)' : 'var(--muted)' }}>
                    {seleccionado ? '✓ Servicio seleccionado' : 'Elegir este servicio'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <form onSubmit={handleReservar} className="card-panel checkout-form">
          <h3>Agendar Turno de Taller</h3>

          {mensajeExito && <div className="alert-success">{mensajeExito}</div>}
          {errorMsg && <div className="alert-error">{errorMsg}</div>}

          <label>
            Servicio Requerido
            <select
              className="input-control"
              value={form.servicioTallerId}
              onChange={(e) => setForm({ ...form, servicioTallerId: Number(e.target.value) })}
            >
              {servicios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre} (${s.precioBase.toLocaleString('es-AR')})
                </option>
              ))}
            </select>
          </label>

          <label>
            Marca, Modelo y Rodado de tu Bicicleta
            <input
              type="text"
              required
              className="input-control"
              placeholder="Ej. Venzo Skyline R29 - Shimano 21v"
              value={form.detallesBicicleta}
              onChange={(e) => setForm({ ...form, detallesBicicleta: e.target.value })}
            />
          </label>

          <label>
            Fecha y Hora Preferida
            <input
              type="datetime-local"
              required
              className="input-control"
              value={form.fechaProgramada}
              onChange={(e) => setForm({ ...form, fechaProgramada: e.target.value })}
            />
          </label>

          <label>
            Síntoma o Falla Detectada
            <textarea
              rows={3}
              className="input-control"
              placeholder="Ej. Salta la cadena en los piñones chicos bajo carga."
              value={form.notasCliente}
              onChange={(e) => setForm({ ...form, notasCliente: e.target.value })}
            />
          </label>

          <button type="submit" className="btn-primary btn-block">
            {usuario ? 'Confirmar Turno de Taller' : 'Iniciar Sesión para Agendar'}
          </button>
        </form>
      </div>

      {usuario && misTurnos.length > 0 && (
        <div className="card-panel" style={{ marginTop: '2rem' }}>
          <h3>📋 Tus Turnos de Taller Agendados</h3>
          <div className="stock-table-wrap" style={{ marginTop: '0.75rem' }}>
            <table className="stock-table">
              <thead>
                <tr>
                  <th>Turno</th>
                  <th>Servicio</th>
                  <th>Bicicleta</th>
                  <th>Fecha Programada</th>
                  <th>Importe</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {misTurnos.map((t) => (
                  <tr key={t.id}>
                    <td><code>#{t.id}</code></td>
                    <td><strong>{t.servicio}</strong></td>
                    <td>{t.detallesBicicleta}</td>
                    <td>{new Date(t.fechaProgramada).toLocaleString('es-AR')}</td>
                    <td><strong>${(t.precioFinal || 0).toLocaleString('es-AR')}</strong></td>
                    <td><span className="spec-pill">{t.estado}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
