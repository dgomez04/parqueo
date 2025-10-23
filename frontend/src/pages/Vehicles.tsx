import React, { useEffect, useState } from 'react';
import apiClient from '../api/client';
import type { Vehicle, User } from '../types/index';
import { useAuth } from '../contexts/AuthContext';

const Vehicles: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    licensePlate: '',
    brand: '',
    color: '',
    type: 'CAR',
    requiresHandicapSpace: false,
    ownerId: '',
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchVehicles();
    if (user?.role === 'ADMIN') {
      fetchUsers();
    }
  }, [user]);

  const fetchVehicles = async () => {
    try {
      const response = await apiClient.get('/vehicles');
      setVehicles(response.data);
    } catch (error) {
      console.error('Error al obtener vehículos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await apiClient.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await apiClient.put(`/vehicles/${editingId}`, formData);
      } else {
        await apiClient.post('/vehicles', formData);
      }
      setShowForm(false);
      setFormData({ licensePlate: '', brand: '', color: '', type: 'CAR', requiresHandicapSpace: false, ownerId: '' });
      setEditingId(null);
      fetchVehicles();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al guardar el vehículo');
    }
  };

  const handleEdit = (vehicle: Vehicle) => {
    setFormData({
      licensePlate: vehicle.licensePlate,
      brand: vehicle.brand,
      color: vehicle.color,
      type: vehicle.type,
      requiresHandicapSpace: vehicle.requiresHandicapSpace,
      ownerId: vehicle.ownerId.toString(),
    });
    setEditingId(vehicle.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de que desea eliminar este vehículo?')) return;
    try {
      await apiClient.delete(`/vehicles/${id}`);
      fetchVehicles();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al eliminar el vehículo');
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Cargando...</div>;

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Vehículos</h1>
        {isAdmin && (
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
              setFormData({ licensePlate: '', brand: '', color: '', type: 'CAR', requiresHandicapSpace: false, ownerId: '' });
            }}
            style={{ padding: '10px 20px', fontSize: '16px' }}
          >
            {showForm ? 'Cancelar' : 'Agregar Vehículo'}
          </button>
        )}
      </div>

      {showForm && isAdmin && (
        <form onSubmit={handleSubmit} style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
          <h2>{editingId ? 'Editar Vehículo' : 'Agregar Nuevo Vehículo'}</h2>
          <p style={{ color: '#666', marginBottom: '15px', fontSize: '14px' }}>
            Cada usuario puede registrar un máximo de 2 vehículos.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Placa: *</label>
              <input
                type="text"
                value={formData.licensePlate}
                onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
                required
                placeholder="ej., ABC-1234"
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Marca: *</label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                required
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Color: *</label>
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                required
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Tipo: *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'CAR' | 'MOTORCYCLE' })}
                required
                style={{ width: '100%', padding: '8px' }}
              >
                <option value="CAR">Carro</option>
                <option value="MOTORCYCLE">Motocicleta</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Propietario: *</label>
              <select
                value={formData.ownerId}
                onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })}
                required
                style={{ width: '100%', padding: '8px' }}
              >
                <option value="">Seleccionar propietario</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', paddingTop: '25px' }}>
              <input
                type="checkbox"
                id="handicap"
                checked={formData.requiresHandicapSpace}
                onChange={(e) => setFormData({ ...formData, requiresHandicapSpace: e.target.checked })}
                style={{ marginRight: '8px', width: '20px', height: '20px' }}
              />
              <label htmlFor="handicap" style={{ margin: 0, cursor: 'pointer' }}>
                Requiere Espacio para Discapacitados (Ley 7600)
              </label>
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
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Placa</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Marca</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Color</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Tipo</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Discapacitado</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Propietario</th>
            {isAdmin && <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {vehicles.map((vehicle) => (
            <tr key={vehicle.id}>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{vehicle.licensePlate}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{vehicle.brand}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{vehicle.color}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                {vehicle.type === 'CAR' ? 'Carro' : 'Motocicleta'}
              </td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                {vehicle.requiresHandicapSpace ? '✓' : '—'}
              </td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{vehicle.owner?.name}</td>
              {isAdmin && (
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                  <button onClick={() => handleEdit(vehicle)} style={{ marginRight: '10px', padding: '5px 10px' }}>
                    Editar
                  </button>
                  <button onClick={() => handleDelete(vehicle.id)} style={{ padding: '5px 10px', backgroundColor: '#d32f2f', color: 'white' }}>
                    Eliminar
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Vehicles;
