import React, { useEffect, useState } from 'react';
import apiClient from '../api/client';
import type { ParkingRecord, Vehicle } from '../types/index';
import { useAuth } from '../contexts/AuthContext';

const ParkingRecords: React.FC = () => {
  const [records, setRecords] = useState<ParkingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [licensePlate, setLicensePlate] = useState('');
  const [searchedVehicle, setSearchedVehicle] = useState<Vehicle | null>(null);
  const [vehicleNotFound, setVehicleNotFound] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [vehicleAlreadyParked, setVehicleAlreadyParked] = useState(false);
  const [parkedAtLocation, setParkedAtLocation] = useState<string | null>(null);
  const [showHandicapPrompt, setShowHandicapPrompt] = useState(false);
  const [unregisteredVehicleType, setUnregisteredVehicleType] = useState<'CAR' | 'MOTORCYCLE'>('CAR');
  const [unregisteredRequiresHandicap, setUnregisteredRequiresHandicap] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchRecords();
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

  const handleLicensePlateSearch = async () => {
    if (!licensePlate.trim()) {
      alert('Por favor ingrese una placa');
      return;
    }

    try {
      const response = await apiClient.get(`/vehicles/search?licensePlate=${licensePlate.toUpperCase()}`);
      const vehicle = response.data;

      // Check if this vehicle is already parked in ANY parking lot
      // Fetch all active records to check across all parkings
      const activeRecordsResponse = await apiClient.get('/parking-records/active');
      const allActiveRecords = activeRecordsResponse.data;

      const activeRecord = allActiveRecords.find(
        (r: ParkingRecord) => r.vehicle?.licensePlate === licensePlate.toUpperCase()
      );

      // If vehicle is blocked (unregistered and has entered once), attempt entry to log the failure
      if (vehicle.ownerId === null && vehicle.hasEnteredOnce) {
        try {
          await apiClient.post('/parking-records/quick-entry', {
            licensePlate: licensePlate.toUpperCase(),
          });
        } catch (error: any) {
          // Expected to fail - this logs the attempt in the backend
          console.log('Blocked vehicle attempt logged');
        }
      }

      setSearchedVehicle(vehicle);
      setVehicleNotFound(false);
      setVehicleAlreadyParked(!!activeRecord);
      setParkedAtLocation(activeRecord?.parkingSpace?.parking?.name || null);
      setHasSearched(true);
    } catch (error: any) {
      if (error.response?.status === 404) {
        setSearchedVehicle(null);
        setVehicleNotFound(true);
        setVehicleAlreadyParked(false);
        setParkedAtLocation(null);
        setHasSearched(true);
      } else {
        alert(error.response?.data?.error || 'Error al buscar vehículo');
      }
    }
  };

  const handleEntry = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!licensePlate.trim()) {
      alert('Por favor ingrese una placa');
      return;
    }

    try {
      const requestBody: any = {
        licensePlate: licensePlate.toUpperCase(),
      };

      // If vehicle is not found (unregistered), include the type and handicap info
      if (vehicleNotFound) {
        requestBody.unregisteredVehicleType = unregisteredVehicleType;
        requestBody.unregisteredRequiresHandicap = unregisteredRequiresHandicap;
      }

      const response = await apiClient.post('/parking-records/quick-entry', requestBody);

      // Show success message
      if (response.data.isUnregistered) {
        alert(`${response.data.message}\n\nEstacionado en el espacio ${response.data.parkingSpace.spaceNumber}`);
      } else {
        alert(`Vehículo estacionado exitosamente en el espacio ${response.data.parkingSpace.spaceNumber}`);
      }

      // Reset form
      setShowForm(false);
      setLicensePlate('');
      setSearchedVehicle(null);
      setVehicleNotFound(false);
      setHasSearched(false);
      setVehicleAlreadyParked(false);
      setParkedAtLocation(null);
      setUnregisteredVehicleType('CAR');
      setUnregisteredRequiresHandicap(false);
      fetchRecords();
    } catch (error: any) {
      // Check if it's the handicap space error
      if (error.response?.data?.code === 'NO_HANDICAP_SPACES') {
        setShowHandicapPrompt(true);
      } else if (error.response?.data?.code === 'UNREGISTERED_BLOCKED') {
        alert(error.response.data.message);
      } else {
        alert(error.response?.data?.error || 'Error al registrar la entrada');
      }
    }
  };

  const handleHandicapChoice = async (preferHandicap: boolean) => {
    try {
      const response = await apiClient.post('/parking-records/quick-entry', {
        licensePlate: licensePlate.toUpperCase(),
        preferHandicap: preferHandicap,
      });

      setShowHandicapPrompt(false);
      setShowForm(false);
      setLicensePlate('');
      setSearchedVehicle(null);
      setVehicleNotFound(false);
      setHasSearched(false);
      setVehicleAlreadyParked(false);
      setParkedAtLocation(null);
      fetchRecords();

      alert(`Vehículo estacionado exitosamente en el espacio ${response.data.parkingSpace.spaceNumber}`);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al registrar la entrada');
    }
  };

  const handleExit = async (id: number) => {
    if (!confirm('¿Marcar este vehículo como salido?')) return;
    try {
      await apiClient.post(`/parking-records/${id}/exit`);
      fetchRecords();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al registrar la salida');
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Cargando...</div>;

  const canManageEntryExit = user?.role === 'ADMIN' || user?.role === 'SECURITY_OFFICER';

  const activeRecords = user?.role === 'SECURITY_OFFICER' && user.sessionParkingId
    ? records.filter((r) => !r.exitTime && r.parkingSpace?.parkingId === user.sessionParkingId)
    : records.filter((r) => !r.exitTime);

  const historicalRecords = user?.role === 'SECURITY_OFFICER' && user.sessionParkingId
    ? records.filter((r) => r.exitTime && r.parkingSpace?.parkingId === user.sessionParkingId)
    : records.filter((r) => r.exitTime);

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Entrada/Salida</h1>
        {canManageEntryExit && (
          <button
            onClick={() => {
              setShowForm(!showForm);
              setLicensePlate('');
              setSearchedVehicle(null);
              setVehicleNotFound(false);
              setHasSearched(false);
              setVehicleAlreadyParked(false);
              setParkedAtLocation(null);
              setUnregisteredVehicleType('CAR');
              setUnregisteredRequiresHandicap(false);
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

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Placa del Vehículo:</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                value={licensePlate}
                onChange={(e) => {
                  setLicensePlate(e.target.value.toUpperCase());
                  setSearchedVehicle(null);
                  setVehicleNotFound(false);
                  setHasSearched(false);
                  setVehicleAlreadyParked(false);
                  setParkedAtLocation(null);
                }}
                placeholder="Ej: ABC123"
                required
                style={{
                  flex: 1,
                  padding: '8px',
                  fontSize: '16px',
                  textTransform: 'uppercase'
                }}
              />
              <button
                type="button"
                onClick={handleLicensePlateSearch}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '16px',
                }}
              >
                Buscar
              </button>
            </div>
          </div>

          {searchedVehicle && !vehicleAlreadyParked && (
            <div style={{
              marginBottom: '15px',
              padding: '15px',
              backgroundColor: searchedVehicle.ownerId === null ? '#ffebee' : '#e8f5e9',
              borderRadius: '4px',
              border: searchedVehicle.ownerId === null ? '1px solid #f44336' : '1px solid #4CAF50',
            }}>
              {searchedVehicle.ownerId === null ? (
                <>
                  <h3 style={{ margin: '0 0 10px 0', color: '#c62828' }}>🚫 Vehículo Bloqueado</h3>
                  <p style={{ margin: '5px 0' }}><strong>Placa:</strong> {searchedVehicle.licensePlate}</p>
                  <p style={{ margin: '5px 0', color: '#c62828', fontWeight: 'bold' }}>
                    Este vehículo ya utilizó su entrada única y está bloqueado.
                  </p>
                  <p style={{ margin: '5px 0' }}>
                    Debe ser registrado por un administrador antes de poder ingresar nuevamente.
                  </p>
                </>
              ) : (
                <>
                  <h3 style={{ margin: '0 0 10px 0', color: '#2e7d32' }}>✓ Vehículo Registrado</h3>
                  <p style={{ margin: '5px 0' }}><strong>Placa:</strong> {searchedVehicle.licensePlate}</p>
                  <p style={{ margin: '5px 0' }}><strong>Marca:</strong> {searchedVehicle.brand}</p>
                  <p style={{ margin: '5px 0' }}><strong>Color:</strong> {searchedVehicle.color}</p>
                  <p style={{ margin: '5px 0' }}>
                    <strong>Tipo:</strong> {searchedVehicle.type === 'CAR' ? '🚗 Auto' : '🏍️ Moto'}
                    {searchedVehicle.requiresHandicapSpace && ' ♿ (Requiere espacio para discapacitados)'}
                  </p>
                  {searchedVehicle.owner && (
                    <p style={{ margin: '5px 0' }}><strong>Propietario:</strong> {searchedVehicle.owner.name}</p>
                  )}
                </>
              )}
            </div>
          )}

          {searchedVehicle && vehicleAlreadyParked && (
            <div style={{
              marginBottom: '15px',
              padding: '15px',
              backgroundColor: '#e3f2fd',
              borderRadius: '4px',
              border: '1px solid #2196F3',
            }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>🅿️ Vehículo Ya Estacionado</h3>
              <p style={{ margin: '5px 0' }}><strong>Placa:</strong> {searchedVehicle.licensePlate}</p>
              <p style={{ margin: '5px 0' }}><strong>Marca:</strong> {searchedVehicle.brand}</p>
              <p style={{ margin: '5px 0' }}><strong>Color:</strong> {searchedVehicle.color}</p>
              <p style={{ margin: '5px 0', color: '#1976d2', fontWeight: 'bold' }}>
                Este vehículo ya se encuentra estacionado en: {parkedAtLocation || 'un parqueo'}
              </p>
              <p style={{ margin: '5px 0' }}>
                {user?.role === 'SECURITY_OFFICER' && parkedAtLocation !== user.sessionParking?.name
                  ? 'Este vehículo está en otro parqueo. No puede registrarlo aquí.'
                  : 'Puede marcarlo como salida en la tabla "Estacionamiento Activo" abajo.'}
              </p>
            </div>
          )}

          {vehicleNotFound && (
            <div style={{
              marginBottom: '15px',
              padding: '15px',
              backgroundColor: '#fff3cd',
              borderRadius: '4px',
              border: '1px solid #ff9800',
            }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#f57c00' }}>⚠ Vehículo No Registrado</h3>
              <p style={{ margin: '0 0 15px 0' }}>
                Este vehículo no está registrado en el sistema. Se permite entrada única.
                El vehículo debe registrarse para futuros ingresos.
              </p>

              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#f57c00' }}>
                  Tipo de Vehículo:
                </label>
                <select
                  value={unregisteredVehicleType}
                  onChange={(e) => setUnregisteredVehicleType(e.target.value as 'CAR' | 'MOTORCYCLE')}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ff9800'
                  }}
                >
                  <option value="CAR">🚗 Auto</option>
                  <option value="MOTORCYCLE">🏍️ Moto</option>
                </select>
              </div>

              <div style={{ marginTop: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={unregisteredRequiresHandicap}
                    onChange={(e) => setUnregisteredRequiresHandicap(e.target.checked)}
                    style={{ marginRight: '8px', cursor: 'pointer' }}
                  />
                  <span style={{ fontWeight: 'bold', color: '#f57c00' }}>
                    ♿ Requiere espacio para discapacitados
                  </span>
                </label>
              </div>
            </div>
          )}

          {hasSearched && !vehicleAlreadyParked && (searchedVehicle?.ownerId !== null || vehicleNotFound) && (
            <button
              type="submit"
              style={{
                marginTop: '15px',
                padding: '10px 20px',
                fontSize: '16px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Registrar Entrada
            </button>
          )}
        </form>
      )}

      {showHandicapPrompt && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            maxWidth: '500px',
            textAlign: 'center',
          }}>
            <h3>No hay espacios para discapacitados disponibles</h3>
            <p style={{ margin: '20px 0' }}>
              ¿Desea estacionar en un espacio regular?
            </p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button
                onClick={() => handleHandicapChoice(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '16px',
                }}
              >
                Sí, usar espacio regular
              </button>
              <button
                onClick={() => {
                  setShowHandicapPrompt(false);
                  setSelectedVehicleId(null);
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '16px',
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <h2>Estacionamiento Activo</h2>
      {user?.role === 'SECURITY_OFFICER' && user.sessionParking && (
        <p style={{ color: '#666', marginBottom: '10px' }}>
          Mostrando vehículos en: <strong>{user.sessionParking.name}</strong>
        </p>
      )}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5' }}>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Placa</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Vehículo</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Espacio</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Estacionamiento</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Hora de Entrada</th>
            {canManageEntryExit && <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {activeRecords.length === 0 ? (
            <tr>
              <td colSpan={canManageEntryExit ? 6 : 5} style={{ padding: '20px', textAlign: 'center', border: '1px solid #ddd', color: '#666' }}>
                No hay vehículos estacionados actualmente
              </td>
            </tr>
          ) : (
            activeRecords.map((record) => (
              <tr key={record.id}>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                  <strong>{record.vehicle?.licensePlate}</strong>
                  {record.vehicle?.ownerId === null && (
                    <span style={{ marginLeft: '5px', fontSize: '12px', color: '#ff9800' }}>⚠ No registrado</span>
                  )}
                </td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                  {record.vehicle?.brand} - {record.vehicle?.color}
                  {record.vehicle?.type === 'CAR' ? ' 🚗' : ' 🏍️'}
                  {record.vehicle?.requiresHandicapSpace && ' ♿'}
                </td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{record.parkingSpace?.spaceNumber}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{record.parkingSpace?.parking?.name || 'N/A'}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                  {new Date(record.entryTime).toLocaleString('es-ES')}
                </td>
                {canManageEntryExit && (
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                    <button
                      onClick={() => handleExit(record.id)}
                      style={{
                        padding: '5px 10px',
                        backgroundColor: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Marcar Salida
                    </button>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>

      <h2>Registros Históricos</h2>
      {user?.role === 'SECURITY_OFFICER' && user.sessionParking && (
        <p style={{ color: '#666', marginBottom: '10px' }}>
          Mostrando registros de: <strong>{user.sessionParking.name}</strong>
        </p>
      )}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5' }}>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Placa</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Vehículo</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Espacio</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Estacionamiento</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Hora de Entrada</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Hora de Salida</th>
          </tr>
        </thead>
        <tbody>
          {historicalRecords.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ padding: '20px', textAlign: 'center', border: '1px solid #ddd', color: '#666' }}>
                No hay registros históricos
              </td>
            </tr>
          ) : (
            historicalRecords.map((record) => (
              <tr key={record.id}>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                  {record.vehicle?.licensePlate}
                  {record.vehicle?.ownerId === null && (
                    <span style={{ marginLeft: '5px', fontSize: '12px', color: '#ff9800' }}>⚠</span>
                  )}
                </td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                  {record.vehicle?.brand} - {record.vehicle?.color}
                  {record.vehicle?.type === 'CAR' ? ' 🚗' : ' 🏍️'}
                </td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{record.parkingSpace?.spaceNumber}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{record.parkingSpace?.parking?.name || 'N/A'}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                  {new Date(record.entryTime).toLocaleString('es-ES')}
                </td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                  {record.exitTime && new Date(record.exitTime).toLocaleString('es-ES')}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ParkingRecords;
