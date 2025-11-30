import { useMemo, useState } from 'react';
import { api } from '../services/api.js';

const createInitialState = () => {
  const today = new Date().toISOString().slice(0, 10);
  return {
    numeroTelefono: '',
    nombres: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    correo: '',
    paisNombre: '',
    paisCodigo: '',
    ciudad: '',
    documentoIdentidad: '',
    fechaRegistro: today,
    contrasena: '',
  };
};

const RegisterForm = ({ onRegisterSuccess, onCancel }) => {
  const [formState, setFormState] = useState(() => createInitialState());
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const isValid = useMemo(() => {
    return (
      formState.numeroTelefono &&
      formState.nombres &&
      formState.apellidoPaterno &&
      formState.correo &&
      formState.paisNombre &&
      formState.paisCodigo &&
      formState.ciudad &&
      formState.documentoIdentidad &&
      formState.contrasena
    );
  }, [formState]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isValid) return;
    setLoading(true);
    setError('');
    setMessage('');

    const payload = {
      numeroTelefono: formState.numeroTelefono.trim(),
      nombres: formState.nombres.trim(),
      apellidoPaterno: formState.apellidoPaterno.trim(),
      apellidoMaterno: formState.apellidoMaterno?.trim() || null,
      correo: formState.correo.trim(),
      pais: {
        nombrePais: formState.paisNombre.trim(),
        codigoPais: formState.paisCodigo.trim(),
      },
      ciudad: formState.ciudad.trim(),
      documentoIdentidad: formState.documentoIdentidad.trim(),
      fechaRegistro: new Date(formState.fechaRegistro || new Date()).toISOString(),
      rol: 'usuario',
      contrasena: formState.contrasena,
    };

    try {
      const created = await api.create('/clientes', payload);
      setMessage('Cuenta creada correctamente. Ya puedes iniciar sesión.');
      setFormState(createInitialState());
      onRegisterSuccess?.(created);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="login-card">
      <h2>Crear cuenta</h2>
      <p>Regístrate para reservar y comentar.</p>
      <form onSubmit={handleSubmit} className="register-form">
        <div className="register-grid">
          <label>
            Nombres *
            <input name="nombres" value={formState.nombres} onChange={handleChange} placeholder="Juan" required />
          </label>
          <label>
            Apellido paterno *
            <input name="apellidoPaterno" value={formState.apellidoPaterno} onChange={handleChange} placeholder="Pérez" required />
          </label>
          <label>
            Apellido materno
            <input name="apellidoMaterno" value={formState.apellidoMaterno} onChange={handleChange} placeholder="López" />
          </label>
          <label>
            Correo *
            <input type="email" name="correo" value={formState.correo} onChange={handleChange} placeholder="tu@email.com" required />
          </label>
          <label>
            Teléfono *
            <input name="numeroTelefono" value={formState.numeroTelefono} onChange={handleChange} placeholder="+51 999 999 999" required />
          </label>
          <label>
            Documento de identidad *
            <input name="documentoIdentidad" value={formState.documentoIdentidad} onChange={handleChange} placeholder="DNI o Pasaporte" required />
          </label>
          <label>
            País *
            <input name="paisNombre" value={formState.paisNombre} onChange={handleChange} placeholder="Perú" required />
          </label>
          <label>
            Código país *
            <input name="paisCodigo" value={formState.paisCodigo} onChange={handleChange} placeholder="PE" required />
          </label>
          <label>
            Ciudad *
            <input name="ciudad" value={formState.ciudad} onChange={handleChange} placeholder="Lima" required />
          </label>
          <label>
            Contraseña *
            <input type="password" name="contrasena" value={formState.contrasena} onChange={handleChange} placeholder="••••••••" required />
          </label>
        </div>
        {message && <p className="status success">{message}</p>}
        {error && <p className="status error">{error}</p>}
        <div className="form-actions">
          <button type="submit" disabled={!isValid || loading}>
            {loading ? 'Creando...' : 'Registrar'}
          </button>
          <button type="button" className="secondary" onClick={onCancel}>
            Cancelar
          </button>
        </div>
      </form>
    </section>
  );
};

export default RegisterForm;
