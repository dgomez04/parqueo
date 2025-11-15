import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api/client';
import type { OccupationReport, ParkingSpace, Vehicle, ParkingRecord, Parking, AccessAttempt, FailedAttemptsResponse, FailureReason } from '../types/index';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [report, setReport] = useState<OccupationReport | null>(null);
  const [parkingSpaces, setParkingSpaces] = useState<ParkingSpace[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [parkingRecords, setParkingRecords] = useState<ParkingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSpaces, setLoadingSpaces] = useState(false);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [loadingRecords, setLoadingRecords] = useState(false);

  // Parkings management state (ADMIN only)
  const [parkings, setParkings] = useState<Parking[]>([]);
  const [showParkingForm, setShowParkingForm] = useState(false);
  const [parkingFormData, setParkingFormData] = useState({ name: '' });
  const [editingParkingId, setEditingParkingId] = useState<number | null>(null);

  // Failed attempts state (ADMIN only)
  const [failedAttempts, setFailedAttempts] = useState<AccessAttempt[]>([]);
  const [attemptsLoading, setAttemptsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    // Fetch appropriate data based on user role
    if (user?.role === 'STUDENT' || user?.role === 'ADMINISTRATIVE_STAFF') {
      fetchUserData();
    } else {
      fetchReport();
      if (user?.role === 'SECURITY_OFFICER' && user.sessionParkingId) {
        fetchParkingSpaces();
      }
      if (user?.role === 'ADMIN') {
        fetchParkings();
        fetchFailedAttempts();
      }
    }
  }, [user]);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchFailedAttempts();
    }
  }, [currentPage, dateRange]);

  const fetchUserData = async () => {
    setLoading(true);
    await Promise.all([fetchVehicles(), fetchParkingRecords()]);
    setLoading(false);
  };

  const fetchVehicles = async () => {
    setLoadingVehicles(true);
    try {
      const response = await apiClient.get('/vehicles');
      setVehicles(response.data);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoadingVehicles(false);
    }
  };

  const fetchParkingRecords = async () => {
    setLoadingRecords(true);
    try {
      const response = await apiClient.get('/parking-records');
      setParkingRecords(response.data);
    } catch (error) {
      console.error('Error fetching parking records:', error);
    } finally {
      setLoadingRecords(false);
    }
  };

  const fetchReport = async () => {
    try {
      const response = await apiClient.get('/reports/current-occupation');
      setReport(response.data);
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchParkingSpaces = async () => {
    if (!user?.sessionParkingId) return;

    setLoadingSpaces(true);
    try {
      const response = await apiClient.get(`/parking-spaces?parkingId=${user.sessionParkingId}`);
      setParkingSpaces(response.data);
    } catch (error) {
      console.error('Error fetching parking spaces:', error);
    } finally {
      setLoadingSpaces(false);
    }
  };

  const fetchParkings = async () => {
    try {
      const response = await apiClient.get('/parkings');
      setParkings(response.data);
    } catch (error) {
      console.error('Error al obtener parqueos:', error);
    }
  };

  const fetchFailedAttempts = async () => {
    try {
      setAttemptsLoading(true);
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        page: currentPage.toString(),
        limit: '20',
      });
      const response = await apiClient.get<FailedAttemptsResponse>(`/parking-records/failed-attempts?${params}`);
      setFailedAttempts(response.data.attempts);
      setTotalPages(response.data.pagination.totalPages);
      setTotalAttempts(response.data.pagination.total);
    } catch (error) {
      console.error('Error al obtener intentos fallidos:', error);
    } finally {
      setAttemptsLoading(false);
    }
  };

  const handleParkingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parkingFormData.name.trim()) {
      alert('El nombre del parqueo es requerido');
      return;
    }
    try {
      if (editingParkingId) {
        await apiClient.put(`/parkings/${editingParkingId}`, parkingFormData);
      } else {
        await apiClient.post('/parkings', parkingFormData);
      }
      setShowParkingForm(false);
      setParkingFormData({ name: '' });
      setEditingParkingId(null);
      fetchParkings();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al guardar el parqueo');
    }
  };

  const handleParkingEdit = (parking: Parking) => {
    setParkingFormData({ name: parking.name });
    setEditingParkingId(parking.id);
    setShowParkingForm(true);
  };

  const handleParkingDelete = async (id: number) => {
    if (!confirm('¿Está seguro de que desea eliminar este parqueo? Debe eliminar todos los espacios primero.')) return;
    try {
      await apiClient.delete(`/parkings/${id}`);
      fetchParkings();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al eliminar el parqueo');
    }
  };

  const handleViewSpaces = (parkingId: number) => {
    navigate(`/parking-spaces?parkingId=${parkingId}`);
  };

  const translateFailureReason = (reason: FailureReason | null): string => {
    if (!reason) return 'Desconocido';
    const translations: Record<FailureReason, string> = {
      UNREGISTERED_BLOCKED: 'Vehículo no registrado bloqueado',
      VEHICLE_ALREADY_PARKED: 'Vehículo ya estacionado',
      NO_HANDICAP_SPACES: 'No hay espacios para discapacitados',
      NO_AVAILABLE_SPACES: 'No hay espacios disponibles',
      SPACE_ALREADY_OCCUPIED: 'Espacio ya ocupado',
      PARKING_SPACE_NOT_FOUND: 'Espacio no encontrado',
      INSUFFICIENT_PERMISSIONS: 'Permisos insuficientes',
    };
    return translations[reason] || reason;
  };

  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('es-CR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSpaceTypeColor = (type: string, isOccupied: boolean) => {
    if (isOccupied) return '#ffcdd2';
    switch (type) {
      case 'HANDICAP': return '#bbdefb';
      case 'MOTORCYCLE': return '#fff9c4';
      case 'CAR': return '#c8e6c9';
      default: return '#e0e0e0';
    }
  };

  const getSpaceTypeLabel = (type: string) => {
    switch (type) {
      case 'CAR': return '🚗 Auto';
      case 'MOTORCYCLE': return '🏍️ Moto';
      case 'HANDICAP': return '♿ Discapacitado';
      default: return type;
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Cargando...</div>;

  // Calculate user-specific metrics for STAFF/STUDENT
  const activeRecords = parkingRecords.filter(record => !record.exitTime);
  const historicalRecords = parkingRecords.filter(record => record.exitTime);

  // Render for STAFF and STUDENT users - Consolidated Dashboard
  if (user?.role === 'STUDENT' || user?.role === 'ADMINISTRATIVE_STAFF') {
    return (
      <div style={{ padding: '20px' }}>
        <h1>Panel de Control</h1>

        {/* User-specific metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', marginBottom: '30px' }}>
          <div style={{ padding: '20px', backgroundColor: '#e3f2fd', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 10px 0' }}>Mis Estacionamientos Activos</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0 }}>{activeRecords.length}</p>
          </div>
          <div style={{ padding: '20px', backgroundColor: '#e8f5e9', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 10px 0' }}>Mis Vehículos Registrados</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0 }}>{vehicles.length}/2</p>
          </div>
        </div>

        {/* My Vehicles Section */}
        <div style={{ marginBottom: '40px' }}>
          <h2>Mis Vehículos</h2>
          {loadingVehicles ? (
            <p>Cargando vehículos...</p>
          ) : vehicles.length === 0 ? (
            <p style={{ color: '#666', fontStyle: 'italic' }}>No tienes vehículos registrados. Contacta al administrador para registrar un vehículo.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Placa</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Marca</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Color</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Tipo</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Discapacitado</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((vehicle) => (
                  <tr key={vehicle.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px' }}>{vehicle.licensePlate}</td>
                    <td style={{ padding: '12px' }}>{vehicle.brand}</td>
                    <td style={{ padding: '12px' }}>{vehicle.color}</td>
                    <td style={{ padding: '12px' }}>{vehicle.type === 'CAR' ? 'Auto' : 'Motocicleta'}</td>
                    <td style={{ padding: '12px' }}>{vehicle.requiresHandicapSpace ? 'Sí' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* My Parking Records Section */}
        <div style={{ marginBottom: '40px' }}>
          <h2>Mis Registros de Estacionamiento</h2>

          {loadingRecords ? (
            <p>Cargando registros...</p>
          ) : (
            <>
              {/* Active Parkings */}
              {activeRecords.length > 0 && (
                <div style={{ marginBottom: '30px' }}>
                  <h3>Estacionamiento Activo</h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f5f5f5' }}>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Placa</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Vehículo</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Espacio</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Estacionamiento</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Hora de Entrada</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeRecords.map((record) => (
                        <tr key={record.id} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '12px' }}>{record.vehicle?.licensePlate}</td>
                          <td style={{ padding: '12px' }}>{record.vehicle?.brand} - {record.vehicle?.color}</td>
                          <td style={{ padding: '12px' }}>{record.parkingSpace?.spaceNumber}</td>
                          <td style={{ padding: '12px' }}>{record.parkingSpace?.parking?.name || 'N/A'}</td>
                          <td style={{ padding: '12px' }}>{new Date(record.entryTime).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Historical Records */}
              <div>
                <h3>Registros Históricos</h3>
                {historicalRecords.length === 0 ? (
                  <p style={{ color: '#666', fontStyle: 'italic' }}>No tienes registros históricos.</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f5f5f5' }}>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Placa</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Vehículo</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Espacio</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Estacionamiento</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Hora de Entrada</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Hora de Salida</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historicalRecords.map((record) => (
                        <tr key={record.id} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '12px' }}>{record.vehicle?.licensePlate}</td>
                          <td style={{ padding: '12px' }}>{record.vehicle?.brand} - {record.vehicle?.color}</td>
                          <td style={{ padding: '12px' }}>{record.parkingSpace?.spaceNumber}</td>
                          <td style={{ padding: '12px' }}>{record.parkingSpace?.parking?.name || 'N/A'}</td>
                          <td style={{ padding: '12px' }}>{new Date(record.entryTime).toLocaleString()}</td>
                          <td style={{ padding: '12px' }}>{record.exitTime ? new Date(record.exitTime).toLocaleString() : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Render for ADMIN and SECURITY_OFFICER - Original Dashboard
  return (
    <div style={{ padding: '20px' }}>
      <h1>Panel de Control</h1>

      {report && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '30px' }}>
            <div style={{ padding: '20px', backgroundColor: '#e3f2fd', borderRadius: '8px' }}>
              <h3 style={{ margin: '0 0 10px 0' }}>Espacios Totales</h3>
              <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0 }}>{report.totalSpaces}</p>
            </div>
            <div style={{ padding: '20px', backgroundColor: '#ffebee', borderRadius: '8px' }}>
              <h3 style={{ margin: '0 0 10px 0' }}>Ocupados</h3>
              <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0 }}>{report.occupiedSpaces}</p>
            </div>
            <div style={{ padding: '20px', backgroundColor: '#e8f5e9', borderRadius: '8px' }}>
              <h3 style={{ margin: '0 0 10px 0' }}>Disponibles</h3>
              <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0 }}>{report.availableSpaces}</p>
            </div>
            <div style={{ padding: '20px', backgroundColor: '#fff3e0', borderRadius: '8px' }}>
              <h3 style={{ margin: '0 0 10px 0' }}>Tasa de Ocupación</h3>
              <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0 }}>{report.occupationRate}%</p>
            </div>
          </div>

          {user?.role === 'SECURITY_OFFICER' && (
            <>
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

              <h2>Espacios de Estacionamiento - {user.sessionParking?.name}</h2>
              {loadingSpaces ? (
                <p>Cargando espacios...</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px', marginBottom: '30px' }}>
                  {parkingSpaces.map((space) => (
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
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Parkings Management Section - Only for ADMIN */}
      {user?.role === 'ADMIN' && (
        <div style={{ marginTop: '60px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>Gestión de Parqueos</h2>
            <button
              onClick={() => {
                setShowParkingForm(!showParkingForm);
                setEditingParkingId(null);
                setParkingFormData({ name: '' });
              }}
              style={{
                padding: '10px 20px',
                fontSize: '16px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              {showParkingForm ? 'Cancelar' : 'Agregar Parqueo'}
            </button>
          </div>

          {showParkingForm && (
            <form
              onSubmit={handleParkingSubmit}
              style={{
                marginBottom: '30px',
                padding: '20px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: '#f9f9f9',
              }}
            >
              <h3>{editingParkingId ? 'Editar Parqueo' : 'Nuevo Parqueo'}</h3>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>
                  Nombre del Parqueo:
                  <input
                    type="text"
                    value={parkingFormData.name}
                    onChange={(e) => setParkingFormData({ name: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '8px',
                      marginTop: '5px',
                      borderRadius: '4px',
                      border: '1px solid #ddd',
                    }}
                  />
                </label>
              </div>
              <button
                type="submit"
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginRight: '10px',
                }}
              >
                {editingParkingId ? 'Actualizar' : 'Crear'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowParkingForm(false);
                  setEditingParkingId(null);
                  setParkingFormData({ name: '' });
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
            </form>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginBottom: '40px' }}>
            {parkings.map((parking) => (
              <div
                key={parking.id}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '20px',
                  backgroundColor: 'white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}
              >
                <h3 style={{ marginTop: 0 }}>{parking.name}</h3>
                <div style={{ marginBottom: '15px' }}>
                  <p style={{ margin: '5px 0' }}>
                    <strong>Total de espacios:</strong> {parking.totalSpaces || 0}
                  </p>
                  <p style={{ margin: '5px 0' }}>
                    <strong>Espacios ocupados:</strong> {parking.occupiedSpaces || 0}
                  </p>
                  <p style={{ margin: '5px 0' }}>
                    <strong>Espacios disponibles:</strong> {parking.availableSpaces || 0}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleViewSpaces(parking.id)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#4CAF50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    Ver Espacios
                  </button>
                  <button
                    onClick={() => handleParkingEdit(parking)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#2196F3',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleParkingDelete(parking.id)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>

          {parkings.length === 0 && (
            <p style={{ textAlign: 'center', color: '#666', marginTop: '40px' }}>
              No hay parqueos registrados. Haga clic en "Agregar Parqueo" para crear uno.
            </p>
          )}

          {/* Failed Attempts Section */}
          <div style={{ marginTop: '60px' }}>
            <h2 style={{ marginBottom: '20px' }}>Intentos de Entrada Rechazados</h2>

            {/* Date Range Filter */}
            <div
              style={{
                marginBottom: '20px',
                padding: '15px',
                backgroundColor: '#f9f9f9',
                borderRadius: '8px',
                display: 'flex',
                gap: '15px',
                alignItems: 'flex-end',
                flexWrap: 'wrap',
              }}
            >
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                  Fecha Inicio:
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => {
                      setDateRange({ ...dateRange, startDate: e.target.value });
                      setCurrentPage(1);
                    }}
                    style={{
                      display: 'block',
                      marginTop: '5px',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid #ddd',
                    }}
                  />
                </label>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                  Fecha Fin:
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => {
                      setDateRange({ ...dateRange, endDate: e.target.value });
                      setCurrentPage(1);
                    }}
                    style={{
                      display: 'block',
                      marginTop: '5px',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid #ddd',
                    }}
                  />
                </label>
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>
                Total de intentos fallidos: <strong>{totalAttempts}</strong>
              </div>
            </div>

            {/* Failed Attempts Table */}
            {attemptsLoading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>Cargando intentos fallidos...</div>
            ) : failedAttempts.length > 0 ? (
              <>
                <div style={{ overflowX: 'auto' }}>
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      backgroundColor: 'white',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    }}
                  >
                    <thead>
                      <tr style={{ backgroundColor: '#f5f5f5' }}>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>
                          Fecha/Hora
                        </th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>
                          Parqueo
                        </th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>
                          Placa
                        </th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>
                          Motivo del Rechazo
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {failedAttempts.map((attempt) => (
                        <tr key={attempt.id} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '12px' }}>{formatDateTime(attempt.attemptTime)}</td>
                          <td style={{ padding: '12px' }}>{attempt.parking?.name || 'N/A'}</td>
                          <td style={{ padding: '12px', fontWeight: 'bold' }}>{attempt.licensePlate}</td>
                          <td style={{ padding: '12px' }}>{translateFailureReason(attempt.failureReason)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div
                    style={{
                      marginTop: '20px',
                      display: 'flex',
                      justifyContent: 'center',
                      gap: '10px',
                      alignItems: 'center',
                    }}
                  >
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: currentPage === 1 ? '#ccc' : '#2196F3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      }}
                    >
                      Anterior
                    </button>
                    <span style={{ fontSize: '14px' }}>
                      Página {currentPage} de {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: currentPage === totalPages ? '#ccc' : '#2196F3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      }}
                    >
                      Siguiente
                    </button>
                  </div>
                )}
              </>
            ) : (
              <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                No se encontraron intentos fallidos en el rango de fechas seleccionado.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
