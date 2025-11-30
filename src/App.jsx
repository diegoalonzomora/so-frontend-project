import { useMemo, useState } from 'react';
import ResourceCrud from './components/ResourceCrud.jsx';
import Login from './components/Login.jsx';
import RegisterForm from './components/RegisterForm.jsx';
import UserDashboard from './components/UserDashboard.jsx';
import NavBar from './components/NavBar.jsx';
import resourceConfigs from './config/resourceConfigs.js';
import './App.css';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');

  const isAdmin = useMemo(() => currentUser?.rol === 'administrador', [currentUser]);

  const today = useMemo(
    () =>
      new Date().toLocaleDateString('es-PE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
    [],
  );

  const formatFechaRegistro = (value) => {
    if (!value) return 'Sin registro';
    try {
      return new Date(value).toLocaleDateString('es-PE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return value;
    }
  };

  const heroStats = useMemo(() => {
    if (currentUser) {
      return [
        { label: 'Rol activo', value: currentUser.rol },
        { label: 'Ciudad', value: currentUser.ciudad || 'Global' },
        { label: 'Registrado', value: formatFechaRegistro(currentUser.fechaRegistro) },
      ];
    }
    return [
      { label: 'Dashboard', value: 'Listo para usar' },
      { label: 'Fecha', value: today },
      { label: 'Modo', value: 'Invitado' },
    ];
  }, [currentUser, today]);

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthMode('login');
  };

  return (
    <div className="app">
      <NavBar currentUser={currentUser} onLogout={handleLogout} onAuthSwitch={(mode) => setAuthMode(mode)} />
      <header className="app-header">
        <div className="hero-body">
          <h1>
            {!currentUser
              ? 'Sistema de reservas hoteleras'
              : isAdmin
              ? 'Panel de administración'
              : 'Explora hoteles y gestiona tus reservas'}
          </h1>
          <p className="hero-subtitle">
            {isAdmin
              ? 'Gestiona clientes, hoteles, habitaciones, servicios y reservas con un panel centralizado.'
              : currentUser
              ? 'Descubre hoteles, revisa tus reservas y comparte comentarios en segundos.'
              : 'Inicia sesión para acceder a todas las funcionalidades del sistema.'}
          </p>
        </div>
        {currentUser && (
          <div className="hero-stats">
            {heroStats.map((stat) => (
              <article key={stat.label} className="stat-card">
                <small>{stat.label}</small>
                <strong>{stat.value}</strong>
              </article>
            ))}
          </div>
        )}
      </header>

      {!currentUser && authMode === 'login' && <Login onLogin={setCurrentUser} onShowRegister={() => setAuthMode('register')} />}

      {!currentUser && authMode === 'register' && <RegisterForm onCancel={() => setAuthMode('login')} />}

      {currentUser && !isAdmin && <UserDashboard user={currentUser} />}

      {currentUser && isAdmin && (
        <section className="admin-panel">
          <p className="panel-hint">Control completo de clientes, hoteles, habitaciones, servicios, reservas y comentarios.</p>
          {resourceConfigs.map((config) => (
            <ResourceCrud key={config.title} config={config} />
          ))}
        </section>
      )}
    </div>
  );
}

export default App;
