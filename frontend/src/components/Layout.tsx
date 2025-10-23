import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return <>{children}</>;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ backgroundColor: '#1976d2', color: 'white', padding: '15px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <h2 style={{ margin: 0 }}>Parqueo</h2>
            <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>Panel de Control</Link>
            {user.role === 'ADMIN' && (
              <Link to="/users" style={{ color: 'white', textDecoration: 'none' }}>Usuarios</Link>
            )}
            <Link to="/vehicles" style={{ color: 'white', textDecoration: 'none' }}>Vehículos</Link>
            <Link to="/parking-spaces" style={{ color: 'white', textDecoration: 'none' }}>Espacios</Link>
            <Link to="/parking-records" style={{ color: 'white', textDecoration: 'none' }}>Entrada/Salida</Link>
          </div>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <span>{user.name} ({user.role.replace(/_/g, ' ')})</span>
            <button
              onClick={handleLogout}
              style={{ padding: '8px 15px', backgroundColor: 'white', color: '#1976d2', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </nav>
      <main style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
