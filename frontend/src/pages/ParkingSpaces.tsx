import React, { useEffect, useState } from 'react';
import apiClient from '../api/client';
import type { ParkingSpace } from '../types/index';
import { useAuth } from '../contexts/AuthContext';

const ParkingSpaces: React.FC = () => {
  const [spaces, setSpaces] = useState<ParkingSpace[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ spaceNumber: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchSpaces();
  }, []);

  const fetchSpaces = async () => {
    try {
      const response = await apiClient.get('/parking-spaces');
      setSpaces(response.data);
    } catch (error) {
      console.error('Error al obtener espacios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await apiClient.put(`/parking-spaces/${editingId}`, formData);
      } else {
        await apiClient.post('/parking-spaces', formData);
      }
      setShowForm(false);
      setFormData({ spaceNumber: '' });
      setEditingId(null);
      fetchSpaces();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al guardar el espacio');
    }
  };

  const handleEdit = (space: ParkingSpace) => {
    setFormData({ spaceNumber: space.spaceNumber });
    setEditingId(space.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de que desea eliminar este espacio?')) return;
    try {
      await apiClient.delete(`/parking-spaces/${id}`);
      fetchSpaces();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al eliminar el espacio');
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Cargando...</div>;

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Espacios de Estacionamiento</h1>
        {isAdmin && (
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
              setFormData({ spaceNumber: '' });
            }}
            style={{ padding: '10px 20px', fontSize: '16px' }}
          >
            {showForm ? 'Cancelar' : 'Agregar Espacio'}
          </button>
        )}
      </div>

      {showForm && isAdmin && (
        <form onSubmit={handleSubmit} style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
          <h2>{editingId ? 'Editar Espacio' : 'Agregar Nuevo Espacio'}</h2>
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>Número de Espacio:</label>
            <input
              type="text"
              value={formData.spaceNumber}
              onChange={(e) => setFormData({ spaceNumber: e.target.value })}
              required
              style={{ width: '300px', padding: '8px' }}
              placeholder="ej., A01, B12"
            />
          </div>
          <button type="submit" style={{ marginTop: '15px', padding: '10px 20px', fontSize: '16px' }}>
            {editingId ? 'Actualizar' : 'Crear'}
          </button>
        </form>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px' }}>
        {spaces.map((space) => (
          <div
            key={space.id}
            style={{
              padding: '15px',
              backgroundColor: space.isOccupied ? '#ffcdd2' : '#c8e6c9',
              borderRadius: '8px',
              textAlign: 'center',
              position: 'relative',
            }}
          >
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{space.spaceNumber}</div>
            <div style={{ fontSize: '12px', marginTop: '5px' }}>
              {space.isOccupied ? 'Ocupado' : 'Disponible'}
            </div>
            {isAdmin && (
              <div style={{ marginTop: '10px', display: 'flex', gap: '5px', justifyContent: 'center' }}>
                <button onClick={() => handleEdit(space)} style={{ padding: '5px 10px', fontSize: '12px' }}>
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(space.id)}
                  style={{ padding: '5px 10px', fontSize: '12px', backgroundColor: '#d32f2f', color: 'white' }}
                >
                  Eliminar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ParkingSpaces;
