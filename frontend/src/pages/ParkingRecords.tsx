import React, { useEffect, useState } from 'react';
import apiClient from '../api/client';
import type { ParkingRecord, Vehicle, ParkingSpace } from '../types/index';
import { useAuth } from '../contexts/AuthContext';

const ParkingRecords: React.FC = () => {
  const [records, setRecords] = useState<ParkingRecord[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [availableSpaces, setAvailableSpaces] = useState<ParkingSpace[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ vehicleId: '', parkingSpaceId: '' });
  const { user } = useAuth();

  useEffect(() => {
    fetchRecords();
    fetchVehicles();
    fetchAvailableSpaces();
  }, []);

  const fetchRecords = async () => {
    try {
      const response = await apiClient.get('/parking-records');
      setRecords(response.data);
    } catch (error) {
      console.error('Error fetching records:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await apiClient.get('/vehicles');
      setVehicles(response.data);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  const fetchAvailableSpaces = async () => {
    try {
      const response = await apiClient.get('/parking-spaces/available');
      setAvailableSpaces(response.data);
    } catch (error) {
      console.error('Error fetching available spaces:', error);
    }
  };

  const handleEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/parking-records/entry', {
        vehicleId: parseInt(formData.vehicleId),
        parkingSpaceId: parseInt(formData.parkingSpaceId),
      });
      setShowForm(false);
      setFormData({ vehicleId: '', parkingSpaceId: '' });
      fetchRecords();
      fetchAvailableSpaces();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al registrar la entrada');
    }
  };

  const handleExit = async (id: number) => {
    if (!confirm('¿Marcar este vehículo como salido?')) return;
    try {
      await apiClient.post(`/parking-records/${id}/exit`);
      fetchRecords();
      fetchAvailableSpaces();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al registrar la salida');
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Cargando...</div>;

  const canManageEntryExit = user?.role === 'ADMIN' || user?.role === 'SECURITY_OFFICER';

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Registros de Estacionamiento</h1>
        {canManageEntryExit && (
          <button
            onClick={() => {
              setShowForm(!showForm);
              setFormData({ vehicleId: '', parkingSpaceId: '' });
            }}
            style={{ padding: '10px 20px', fontSize: '16px' }}
          >
            {showForm ? 'Cancelar' : 'Registrar Entrada'}
          </button>
        )}
      </div>

      {showForm && canManageEntryExit && (
        <form onSubmit={handleEntry} style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
          <h2>Registrar Entrada de Vehículo</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Vehículo:</label>
              <select
                value={formData.vehicleId}
                onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                required
                style={{ width: '100%', padding: '8px' }}
              >
                <option value="">Seleccionar un vehículo</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.licensePlate} - {vehicle.brand} {vehicle.model}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Espacio de Estacionamiento:</label>
              <select
                value={formData.parkingSpaceId}
                onChange={(e) => setFormData({ ...formData, parkingSpaceId: e.target.value })}
                required
                style={{ width: '100%', padding: '8px' }}
              >
                <option value="">Seleccionar un espacio</option>
                {availableSpaces.map((space) => (
                  <option key={space.id} value={space.id}>
                    {space.spaceNumber}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" style={{ marginTop: '15px', padding: '10px 20px', fontSize: '16px' }}>
            Registrar Entrada
          </button>
        </form>
      )}

      <h2>Estacionamiento Activo</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5' }}>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Placa</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Vehículo</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Espacio</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Hora de Entrada</th>
            {canManageEntryExit && <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {records
            .filter((r) => !r.exitTime)
            .map((record) => (
              <tr key={record.id}>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{record.vehicle?.licensePlate}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                  {record.vehicle?.brand} {record.vehicle?.model}
                </td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{record.parkingSpace?.spaceNumber}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                  {new Date(record.entryTime).toLocaleString('es-ES')}
                </td>
                {canManageEntryExit && (
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                    <button onClick={() => handleExit(record.id)} style={{ padding: '5px 10px' }}>
                      Marcar Salida
                    </button>
                  </td>
                )}
              </tr>
            ))}
        </tbody>
      </table>

      <h2>Registros Históricos</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5' }}>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Placa</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Vehículo</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Espacio</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Hora de Entrada</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Hora de Salida</th>
          </tr>
        </thead>
        <tbody>
          {records
            .filter((r) => r.exitTime)
            .map((record) => (
              <tr key={record.id}>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{record.vehicle?.licensePlate}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                  {record.vehicle?.brand} {record.vehicle?.model}
                </td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{record.parkingSpace?.spaceNumber}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                  {new Date(record.entryTime).toLocaleString('es-ES')}
                </td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                  {record.exitTime && new Date(record.exitTime).toLocaleString('es-ES')}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

export default ParkingRecords;
