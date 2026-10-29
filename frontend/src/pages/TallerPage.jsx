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
    nombre: 'Regulación de Cambios (Shimano / SRAM)',
    descripcion: 'Alineación de fusible, tensión de cable/indexado y ajuste de límites en transmisiones de 8 a 12 velocidades.',
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
  const [form, setForm] = useState({
    servicioTallerId: 1,
    detallesBicicleta: '',
    notasCliente: '',
    fechaProgramada: ''
  });
  const [mensajeExito, setMensajeExito] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    axiosClient
      .get('/taller/servicios')
      .then((res) => setServicios(res.data))
      .catch(() => setServicios(SERVICIOS_DEMO));
  }, []);

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
    } catch (err) {
      setErrorMsg(
        err.response?.data?.mensaje ||
          'No se pudo agendar el turno. Verificá que el backend .NET 8 esté corriendo.'
      );
    }
  };

  return (
    <div className="container page-section">
      <h1>Taller Mecánico Especializado 🔧</h1>
      <p className="subtitle">
        Mantenimiento oficial para transmisiones Shimano y SRAM, suspensiones y frenos hidráulicos.
      </p>

      <div className="cart-layout">
        <div className="services-list">
          {servicios.map((s) => (
            <div key={s.id} className="service-card card-panel">
              <div className="service-header">
                <h3>{s.nombre}</h3>
                <span className="current-price">${s.precioBase.toLocaleString('es-AR')}</span>
              </div>
              <p>{s.descripcion}</p>
              <small>⏱️ Duración estimada: {s.duracionEstimadaMinutos} min</small>
            </div>
          ))}
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
              onChange={(e) => setForm({ ...form, servicioTallerId: e.target.value })}
            >
              {servicios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre} (${s.precioBase.toLocaleString('es-AR')})
                </option>
              ))}
            </select>
          </label>

          <label>
            Marca, Modelo y Transmisión de tu Bicicleta
            <input
              type="text"
              required
              className="input-control"
              placeholder="Ej. Trek Marlin 7 R29 - Shimano Deore 12v"
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
    </div>
  );
}

