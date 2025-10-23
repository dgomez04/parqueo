import React, { useEffect, useState } from 'react';
import apiClient from '../api/client';
import type { Vehicle } from '../types/index';
import { useAuth } from '../contexts/AuthContext';

const Vehicles: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    licensePlate: '',
    color: '',
    model: '',
    brand: '',
    ownerId: '',
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchVehicles();
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await apiClient.put(`/vehicles/${editingId}`, formData);
      } else {
        await apiClient.post('/vehicles', formData);
      }
      setShowForm(false);
      setFormData({ licensePlate: '', color: '', model: '', brand: '', ownerId: '' });
      setEditingId(null);
      fetchVehicles();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error saving vehicle');
    }
  };

  const handleEdit = (vehicle: Vehicle) => {
    setFormData({
      licensePlate: vehicle.licensePlate,
      color: vehicle.color,
      model: vehicle.model,
      brand: vehicle.brand,
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
              setFormData({ licensePlate: '', color: '', model: '', brand: '', ownerId: '' });
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>License Plate:</label>
              <input
                type="text"
                value={formData.licensePlate}
                onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
                required
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Brand:</label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                required
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Model:</label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                required
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Color:</label>
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                required
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Owner ID:</label>
              <input
                type="number"
                value={formData.ownerId}
                onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })}
                required
                style={{ width: '100%', padding: '8px' }}
              />
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
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Model</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Color</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Owner</th>
            {isAdmin && <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {vehicles.map((vehicle) => (
            <tr key={vehicle.id}>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{vehicle.licensePlate}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{vehicle.brand}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{vehicle.model}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{vehicle.color}</td>
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
