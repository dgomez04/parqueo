import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { Parking } from '../types';
import apiClient from '../api/client';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [parkingId, setParkingId] = useState('');
  const [error, setError] = useState('');
  const [parkings, setParkings] = useState<Parking[]>([]);
  const [loadingParkings, setLoadingParkings] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const { login, loginWithParking } = useAuth();
  const navigate = useNavigate();

  // Preload parkings when component mounts (no authentication needed)
  useEffect(() => {
    const fetchParkings = async () => {
      setLoadingParkings(true);
      try {
        const response = await apiClient.get('/parkings');
        setParkings(response.data);
      } catch (err) {
        console.error('Error loading parkings:', err);
      } finally {
        setLoadingParkings(false);
      }
    };

    fetchParkings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // First, validate credentials and check user role
      const response = await apiClient.post('/auth/login', { email, password });
      const { user } = response.data;

      // If security officer and not first login, they must select a parking
      if (user.role === 'SECURITY_OFFICER' && !user.isFirstLogin) {
        if (!parkingId) {
          setError('Por favor seleccione un estacionamiento');
          setUserRole(user.role);
          setIsFirstLogin(user.isFirstLogin);
          return;
        }
        // Login with parking selection
        await loginWithParking(email, password, parseInt(parkingId));
      } else {
        // Normal login for other roles or first-time security officers
        await login(email, password);
      }

      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
      setUserRole(null);
    }
  };

  const showParkingField = parkingId !== '' || (userRole === 'SECURITY_OFFICER' && !isFirstLogin);

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', padding: '20px' }}>
      <h1>Parqueo - Iniciar Sesión</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', fontSize: '14px' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Contraseña:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', fontSize: '14px' }}
          />
        </div>

        {showParkingField && (
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              Estacionamiento de Trabajo:
            </label>
            {loadingParkings ? (
              <p style={{ fontSize: '14px', color: '#666' }}>Cargando estacionamientos...</p>
            ) : (
              <select
                value={parkingId}
                onChange={(e) => setParkingId(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  fontSize: '14px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              >
                <option value="">Seleccione un estacionamiento</option>
                {parkings.map((parking) => (
                  <option key={parking.id} value={parking.id}>
                    {parking.name}
                    {parking.totalSpaces !== undefined && ` (${parking.availableSpaces || 0}/${parking.totalSpaces} disponibles)`}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {error && <p style={{ color: 'red', marginBottom: '10px' }}>{error}</p>}
        <button type="submit" style={{ width: '100%', padding: '10px', fontSize: '16px' }}>
          Iniciar Sesión
        </button>
      </form>
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
        <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Credenciales Predeterminadas:</strong></p>
        <p style={{ margin: '5px 0', fontSize: '13px' }}>Admin: admin@parqueo.com / admin123</p>
        <p style={{ margin: '5px 0', fontSize: '13px' }}>Seguridad: security@parqueo.com / Ulacit123</p>
        <p style={{ margin: '5px 0', fontSize: '13px' }}>Personal: staff@parqueo.com / Ulacit123</p>
        <p style={{ margin: '5px 0', fontSize: '13px' }}>Estudiante: student@parqueo.com / Ulacit123</p>
        <p style={{ margin: '5px 0', fontSize: '12px', color: '#666', fontStyle: 'italic' }}>
          (Los usuarios no administradores deben cambiar su contraseña en el primer inicio de sesión)
        </p>
      </div>
    </div>
  );
};

export default Login;
