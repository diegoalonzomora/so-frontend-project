import { useState } from 'react';
import { api, toArray } from '../services/api.js';

const Login = ({ onLogin, onShowRegister }) => {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.list('/clientes');
      const clientes = toArray(response);
      const match = clientes.find(
        (cliente) => cliente.correo === correo.trim() && cliente.contrasena === contrasena.trim(),
      );

      if (!match) {
        setError('Credenciales incorrectas. Verifica tu correo y contraseña.');
        return;
      }

      onLogin(match);
      setCorreo('');
      setContrasena('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="login-card">
      <h2>Iniciar sesión</h2>
      <p>Accede con tu correo y contraseña.</p>
      <form onSubmit={handleSubmit}>
        <label>
          Correo electrónico
          <input 
            type="email" 
            value={correo} 
            onChange={(event) => setCorreo(event.target.value)} 
            placeholder="tu@email.com"
            required 
          />
        </label>
        <label>
          Contraseña
          <input 
            type="password" 
            value={contrasena} 
            onChange={(event) => setContrasena(event.target.value)} 
            placeholder="••••••••"
            required 
          />
        </label>
        {error && <p className="status error">{error}</p>}
        <div className="form-actions">
          <button type="submit" disabled={loading}>
            {loading ? 'Validando...' : 'Ingresar'}
          </button>
          <button type="button" className="secondary" onClick={onShowRegister}>
            Crear cuenta
          </button>
        </div>
      </form>
    </section>
  );
};

export default Login;
