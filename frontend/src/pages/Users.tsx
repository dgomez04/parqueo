import React, { useEffect, useState } from 'react';
import apiClient from '../api/client';
import type { User } from '../types/index';

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    dateOfBirth: '',
    identificationNumber: '',
    role: 'STUDENT',
  });
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await apiClient.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await apiClient.put(`/users/${editingId}`, formData);
      } else {
        await apiClient.post('/users', formData);
      }
      setShowForm(false);
      setFormData({ email: '', name: '', dateOfBirth: '', identificationNumber: '', role: 'STUDENT' });
      setEditingId(null);
      fetchUsers();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al guardar el usuario');
    }
  };

  const handleEdit = (user: User) => {
    setFormData({
      email: user.email,
      name: user.name,
      dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
      identificationNumber: user.identificationNumber || '',
      role: user.role,
    });
    setEditingId(user.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de que desea eliminar este usuario?')) return;
    try {
      await apiClient.delete(`/users/${id}`);
      fetchUsers();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al eliminar el usuario');
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Cargando...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Gestión de Usuarios</h1>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({ email: '', name: '', dateOfBirth: '', identificationNumber: '', role: 'STUDENT' });
          }}
          style={{ padding: '10px 20px', fontSize: '16px' }}
        >
          {showForm ? 'Cancelar' : 'Agregar Usuario'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
          <h2>{editingId ? 'Editar Usuario' : 'Agregar Nuevo Usuario'}</h2>
          {!editingId && (
            <p style={{ color: '#666', marginBottom: '15px', fontSize: '14px' }}>
              Los nuevos usuarios recibirán la contraseña predeterminada: <strong>Ulacit123</strong> y deberán cambiarla en el primer inicio de sesión.
            </p>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Nombre Completo: *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Email: *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Fecha de Nacimiento: *</label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                required
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Número de Identificación: *</label>
              <input
                type="text"
                value={formData.identificationNumber}
                onChange={(e) => setFormData({ ...formData, identificationNumber: e.target.value })}
                required
                placeholder="ej., 1-2345-6789"
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Rol: *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                required
                style={{ width: '100%', padding: '8px' }}
              >
                <option value="STUDENT">Estudiante</option>
                <option value="ADMINISTRATIVE_STAFF">Personal Administrativo</option>
                <option value="SECURITY_OFFICER">Oficial de Seguridad</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>
          </div>
          <button type="submit" style={{ marginTop: '15px', padding: '10px 20px', fontSize: '16px' }}>
            {editingId ? 'Actualizar' : 'Crear'}
          </button>
        </form>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5' }}>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Nombre</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Email</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Número de ID</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Rol</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Primer Inicio</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{user.name}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{user.email}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{user.identificationNumber}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                {user.role === 'STUDENT' ? 'Estudiante' :
                 user.role === 'ADMINISTRATIVE_STAFF' ? 'Personal Administrativo' :
                 user.role === 'SECURITY_OFFICER' ? 'Oficial de Seguridad' :
                 'Administrador'}
              </td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                {user.isFirstLogin ? (
                  <span style={{ color: 'orange' }}>Pendiente</span>
                ) : (
                  <span style={{ color: 'green' }}>Cambiado</span>
                )}
              </td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                <button onClick={() => handleEdit(user)} style={{ marginRight: '10px', padding: '5px 10px' }}>
                  Editar
                </button>
                <button onClick={() => handleDelete(user.id)} style={{ padding: '5px 10px', backgroundColor: '#d32f2f', color: 'white' }}>
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Users;
