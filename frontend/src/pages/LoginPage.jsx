import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, registro } = useAuth();
  const navigate = useNavigate();

  const [esRegistro, setEsRegistro] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [cargando, setCargando] = useState(false);

  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    telefono: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setCargando(true);

    try {
      if (esRegistro) {
        await registro(form);
        navigate('/');
      } else {
        const data = await login(form.email, form.password);
        if (data.rol === 'Administrador') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      setErrorMsg(
        err.response?.data?.mensaje ||
          'No se pudo autenticar. Verificá tus credenciales o que el backend .NET esté activo.'
      );
    } finally {
      setCargando(false);
    }
  };

  const autocompletarDemo = (email, password) => {
    setEsRegistro(false);
    setForm({ ...form, email, password });
  };

  return (
    <div className="container page-section auth-wrapper">
      <div className="auth-card card-panel">
        <h2>{esRegistro ? 'Crear Cuenta de Cliente' : 'Iniciar Sesión'}</h2>
        <p className="subtitle">
          {esRegistro
            ? 'Registrate para comprar bicicletas, repuestos y agendar turnos en el taller.'
            : 'Ingresá con tu cuenta de Cliente o Administrador (JWT Bearer).'}
        </p>

        <div className="demo-credentials-box">
          <small>⚡ Cuentas pre-cargadas en el Seeder de .NET 8:</small>
          <div className="demo-btns">
            <button
              type="button"
              className="btn-outline btn-sm"
              onClick={() => autocompletarDemo('admin@bicicleteria.com', 'Admin123!')}
            >
              Usar Admin
            </button>
            <button
              type="button"
              className="btn-outline btn-sm"
              onClick={() => autocompletarDemo('cliente@bicicleteria.com', 'Cliente123!')}
            >
              Usar Cliente
            </button>
          </div>
        </div>

        {errorMsg && <div className="alert-error">{errorMsg}</div>}

        <form onSubmit={handleSubmit} className="checkout-form">
          {esRegistro && (
            <div className="form-row-2">
              <label>
                Nombre
                <input
                  type="text"
                  required
                  className="input-control"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                />
              </label>
              <label>
                Apellido
                <input
                  type="text"
                  required
                  className="input-control"
                  value={form.apellido}
                  onChange={(e) => setForm({ ...form, apellido: e.target.value })}
                />
              </label>
            </div>
          )}

          <label>
            Correo Electrónico
            <input
              type="email"
              required
              className="input-control"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>

          <label>
            Contraseña
            <input
              type="password"
              required
              className="input-control"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </label>

          <button type="submit" disabled={cargando} className="btn-primary btn-block">
            {cargando ? 'Validando JWT...' : esRegistro ? 'Registrarme' : 'Ingresar'}
          </button>
        </form>

        <div className="auth-toggle">
          <button
            type="button"
            className="btn-link"
            onClick={() => setEsRegistro(!esRegistro)}
          >
            {esRegistro
              ? '¿Ya tenés cuenta? Iniciá sesión acá'
              : '¿No tenés cuenta? Registrate gratis'}
          </button>
        </div>
      </div>
    </div>
  );
}

