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
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await apiClient.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
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
      alert(error.response?.data?.error || 'Error saving vehicle');
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
    if (!confirm('Are you sure you want to delete this vehicle?')) return;
    try {
      await apiClient.delete(`/vehicles/${id}`);
      fetchVehicles();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error deleting vehicle');
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Vehicles</h1>
        {isAdmin && (
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
              setFormData({ licensePlate: '', brand: '', color: '', type: 'CAR', requiresHandicapSpace: false, ownerId: '' });
            }}
            style={{ padding: '10px 20px', fontSize: '16px' }}
          >
            {showForm ? 'Cancel' : 'Add Vehicle'}
          </button>
        )}
      </div>

      {showForm && isAdmin && (
        <form onSubmit={handleSubmit} style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
          <h2>{editingId ? 'Edit Vehicle' : 'Add New Vehicle'}</h2>
          <p style={{ color: '#666', marginBottom: '15px', fontSize: '14px' }}>
            Each user can register a maximum of 2 vehicles.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>License Plate: *</label>
              <input
                type="text"
                value={formData.licensePlate}
                onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
                required
                placeholder="e.g., ABC-1234"
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Brand: *</label>
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
              <label style={{ display: 'block', marginBottom: '5px' }}>Type: *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'CAR' | 'MOTORCYCLE' })}
                required
                style={{ width: '100%', padding: '8px' }}
              >
                <option value="CAR">Car</option>
                <option value="MOTORCYCLE">Motorcycle</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Owner: *</label>
              <select
                value={formData.ownerId}
                onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })}
                required
                style={{ width: '100%', padding: '8px' }}
              >
                <option value="">Select owner</option>
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
                Requires Handicap Space (Law 7600)
              </label>
            </div>
          </div>
          <button type="submit" style={{ marginTop: '15px', padding: '10px 20px', fontSize: '16px' }}>
            {editingId ? 'Update' : 'Create'}
          </button>
        </form>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5' }}>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>License Plate</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Brand</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Color</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Type</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Handicap</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Owner</th>
            {isAdmin && <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {vehicles.map((vehicle) => (
            <tr key={vehicle.id}>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{vehicle.licensePlate}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{vehicle.brand}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{vehicle.color}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{vehicle.type}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                {vehicle.requiresHandicapSpace ? '✓' : '—'}
              </td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{vehicle.owner?.name}</td>
              {isAdmin && (
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                  <button onClick={() => handleEdit(vehicle)} style={{ marginRight: '10px', padding: '5px 10px' }}>
                    Edit
                  </button>
                  <button onClick={() => handleDelete(vehicle.id)} style={{ padding: '5px 10px', backgroundColor: '#d32f2f', color: 'white' }}>
                    Delete
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
