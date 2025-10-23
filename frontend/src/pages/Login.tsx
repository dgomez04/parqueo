import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

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
