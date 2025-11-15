import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import type { Parking, AccessAttempt, FailedAttemptsResponse, FailureReason } from '../types/index';

const Parkings: React.FC = () => {
  const { user } = useAuth();
  const [parkings, setParkings] = useState<Parking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const navigate = useNavigate();

  // Failed attempts state
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
    fetchParkings();
    if (user?.role === 'ADMIN') {
      fetchFailedAttempts();
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchFailedAttempts();
    }
  }, [currentPage, dateRange]);

  const fetchParkings = async () => {
    try {
      const response = await apiClient.get('/parkings');
      setParkings(response.data);
    } catch (error) {
      console.error('Error al obtener parqueos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('El nombre del parqueo es requerido');
      return;
    }
    try {
      if (editingId) {
        await apiClient.put(`/parkings/${editingId}`, formData);
      } else {
        await apiClient.post('/parkings', formData);
      }
      setShowForm(false);
      setFormData({ name: '' });
      setEditingId(null);
      fetchParkings();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al guardar el parqueo');
    }
  };

  const handleEdit = (parking: Parking) => {
    setFormData({ name: parking.name });
    setEditingId(parking.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
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

  if (loading) return <div style={{ padding: '20px' }}>Cargando...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Gestión de Parqueos</h1>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({ name: '' });
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
          {showForm ? 'Cancelar' : 'Agregar Parqueo'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          style={{
            marginBottom: '30px',
            padding: '20px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            backgroundColor: '#f9f9f9',
          }}
        >
          <h2>{editingId ? 'Editar Parqueo' : 'Nuevo Parqueo'}</h2>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              Nombre del Parqueo:
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ name: e.target.value })}
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
            {editingId ? 'Actualizar' : 'Crear'}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowForm(false);
              setEditingId(null);
              setFormData({ name: '' });
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
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
                onClick={() => handleEdit(parking)}
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
                onClick={() => handleDelete(parking.id)}
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

      {/* Failed Attempts Section - Only visible to ADMIN */}
      {user?.role === 'ADMIN' && (
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
      )}
    </div>
  );
};

export default Parkings;
