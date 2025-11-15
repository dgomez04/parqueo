import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import type { ParkingSpace, Parking, SpaceType } from '../types/index';
import { useAuth } from '../contexts/AuthContext';

const ParkingSpaces: React.FC = () => {
  const [spaces, setSpaces] = useState<ParkingSpace[]>([]);
  const [parkings, setParkings] = useState<Parking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    spaceNumber: '',
    parkingId: '',
    spaceType: 'CAR' as SpaceType
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const parkingIdParam = searchParams.get('parkingId');

  // For security officers, use their session parking
  const effectiveParkingId = user?.role === 'SECURITY_OFFICER'
    ? user.sessionParkingId?.toString()
    : parkingIdParam;

  useEffect(() => {
    fetchParkings();
    fetchSpaces();
  }, [parkingIdParam, user?.sessionParkingId]);

  const fetchParkings = async () => {
    try {
      const response = await apiClient.get('/parkings');
      setParkings(response.data);
      // Set default parking if coming from URL param
      if (parkingIdParam && !formData.parkingId) {
        setFormData(prev => ({ ...prev, parkingId: parkingIdParam }));
      }
    } catch (error) {
      console.error('Error al obtener parqueos:', error);
    }
  };

  const fetchSpaces = async () => {
    try {
      const url = effectiveParkingId
        ? `/parking-spaces?parkingId=${effectiveParkingId}`
        : '/parking-spaces';
      const response = await apiClient.get(url);
      setSpaces(response.data);
    } catch (error) {
      console.error('Error al obtener espacios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.parkingId) {
      alert('Debe seleccionar un parqueo');
      return;
    }
    try {
      const dataToSend = {
        spaceNumber: formData.spaceNumber,
        parkingId: parseInt(formData.parkingId),
        spaceType: formData.spaceType,
      };
      if (editingId) {
        await apiClient.put(`/parking-spaces/${editingId}`, dataToSend);
      } else {
        await apiClient.post('/parking-spaces', dataToSend);
      }
      setShowForm(false);
      setFormData({ spaceNumber: '', parkingId: parkingIdParam || '', spaceType: 'CAR' });
      setEditingId(null);
      fetchSpaces();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al guardar el espacio');
    }
  };

  const handleEdit = (space: ParkingSpace) => {
    setFormData({
      spaceNumber: space.spaceNumber,
      parkingId: space.parkingId.toString(),
      spaceType: space.spaceType,
    });
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

  const getSpaceTypeLabel = (type: SpaceType) => {
    switch (type) {
      case 'CAR': return '🚗 Auto';
      case 'MOTORCYCLE': return '🏍️ Moto';
      case 'HANDICAP': return '♿ Discapacitado';
      default: return type;
    }
  };

  const getSpaceTypeColor = (type: SpaceType, isOccupied: boolean) => {
    if (isOccupied) return '#ffcdd2';
    switch (type) {
      case 'HANDICAP': return '#bbdefb';
      case 'MOTORCYCLE': return '#fff9c4';
      case 'CAR': return '#c8e6c9';
      default: return '#e0e0e0';
    }
  };

  const currentParking = effectiveParkingId
    ? parkings.find(p => p.id === parseInt(effectiveParkingId))
    : null;

  const isSecurityOfficer = user?.role === 'SECURITY_OFFICER';

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1>Espacios de Estacionamiento</h1>
          {currentParking && (
            <p style={{ color: '#666', margin: '5px 0' }}>
              {isSecurityOfficer ? (
                <>
                  <strong>Su Estacionamiento:</strong> {currentParking.name}
                </>
              ) : (
                <>
                  {currentParking.name}
                  <button
                    onClick={() => navigate('/parkings')}
                    style={{
                      marginLeft: '15px',
                      padding: '5px 15px',
                      fontSize: '14px',
                      backgroundColor: '#757575',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    ← Volver a Parqueos
                  </button>
                </>
              )}
            </p>
          )}
        </div>
        {isAdmin && (
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
              setFormData({ spaceNumber: '', parkingId: parkingIdParam || '', spaceType: 'CAR' });
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
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Parqueo:</label>
            <select
              value={formData.parkingId}
              onChange={(e) => setFormData({ ...formData, parkingId: e.target.value })}
              required
              disabled={!!editingId || !!parkingIdParam}
              style={{
                width: '300px',
                padding: '8px',
                backgroundColor: (editingId || parkingIdParam) ? '#e0e0e0' : 'white',
                cursor: (editingId || parkingIdParam) ? 'not-allowed' : 'pointer'
              }}
            >
              <option value="">Seleccione un parqueo</option>
              {parkings.map(parking => (
                <option key={parking.id} value={parking.id}>
                  {parking.name}
                </option>
              ))}
            </select>
            {editingId && (
              <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                Los espacios físicos no pueden moverse entre parqueos
              </p>
            )}
            {parkingIdParam && !editingId && (
              <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                Creando espacio en {currentParking?.name}
              </p>
            )}
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Tipo de Espacio:</label>
            <select
              value={formData.spaceType}
              onChange={(e) => setFormData({ ...formData, spaceType: e.target.value as SpaceType })}
              required
              style={{ width: '300px', padding: '8px' }}
            >
              <option value="CAR">🚗 Automóvil</option>
              <option value="MOTORCYCLE">🏍️ Motocicleta</option>
              <option value="HANDICAP">♿ Discapacitados</option>
            </select>
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Número de Espacio:</label>
            <input
              type="text"
              value={formData.spaceNumber}
              onChange={(e) => setFormData({ ...formData, spaceNumber: e.target.value })}
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

      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '20px', height: '20px', backgroundColor: '#c8e6c9', borderRadius: '4px' }}></div>
            <span>🚗 Auto disponible</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '20px', height: '20px', backgroundColor: '#fff9c4', borderRadius: '4px' }}></div>
            <span>🏍️ Moto disponible</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '20px', height: '20px', backgroundColor: '#bbdefb', borderRadius: '4px' }}></div>
            <span>♿ Discapacitado disponible</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '20px', height: '20px', backgroundColor: '#ffcdd2', borderRadius: '4px' }}></div>
            <span>Ocupado</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px' }}>
        {spaces.map((space) => (
          <div
            key={space.id}
            style={{
              padding: '15px',
              backgroundColor: getSpaceTypeColor(space.spaceType, space.isOccupied),
              borderRadius: '8px',
              textAlign: 'center',
              position: 'relative',
              border: space.isOccupied ? '2px solid #d32f2f' : '2px solid transparent',
            }}
          >
            <div style={{ fontSize: '10px', color: '#666', marginBottom: '5px' }}>
              {getSpaceTypeLabel(space.spaceType)}
            </div>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{space.spaceNumber}</div>
            <div style={{ fontSize: '12px', marginTop: '5px' }}>
              {space.isOccupied ? 'Ocupado' : 'Disponible'}
            </div>
            {isAdmin && (
              <div style={{ marginTop: '10px', display: 'flex', gap: '5px', justifyContent: 'center', flexDirection: 'column' }}>
                <button onClick={() => handleEdit(space)} style={{ padding: '5px 10px', fontSize: '11px' }}>
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(space.id)}
                  style={{ padding: '5px 10px', fontSize: '11px', backgroundColor: '#d32f2f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Eliminar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {spaces.length === 0 && (
        <p style={{ textAlign: 'center', color: '#666', marginTop: '40px' }}>
          No hay espacios registrados. {isAdmin && 'Haga clic en "Agregar Espacio" para crear uno.'}
        </p>
      )}
    </div>
  );
};

export default ParkingSpaces;
