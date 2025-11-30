import React from 'react';

const NavBar = ({ currentUser, onLogout, onAuthSwitch }) => {
  return (
    <nav className="app-nav">
      <div className="nav-inner">
        <div className="nav-left">
          <div className="nav-logo">Cloudbeds</div>
          <div className="nav-links">
            <button type="button" className="link-like" onClick={() => onAuthSwitch?.('login')}>Inicio</button>
          </div>
        </div>

        <div className="nav-right">
          {!currentUser ? (
            <>
              <button type="button" className="secondary" onClick={() => onAuthSwitch?.('register')}>Registro</button>
              <button type="button" onClick={() => onAuthSwitch?.('login')}>Ingresar</button>
            </>
          ) : (
            <div className="nav-user">
              <span className="nav-username">{currentUser.nombres}</span>
              <button type="button" className="secondary" onClick={onLogout}>Salir</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
