import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import type { OccupationReport } from '../types/index';

const Dashboard: React.FC = () => {
  const [report, setReport] = useState<OccupationReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, []);

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

  if (loading) return <div style={{ padding: '20px' }}>Cargando...</div>;

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

          <h2>Vehículos Estacionados Actualmente</h2>
          {report.activeParking.length === 0 ? (
            <p>No hay vehículos estacionados actualmente.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Placa</th>
                  <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Vehículo</th>
                  <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Espacio</th>
                  <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Hora de Entrada</th>
                </tr>
              </thead>
              <tbody>
                {report.activeParking.map((record) => (
                  <tr key={record.id}>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{record.vehicle?.licensePlate}</td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                      {record.vehicle?.brand} {record.vehicle?.color}
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{record.parkingSpace?.spaceNumber}</td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                      {new Date(record.entryTime).toLocaleString('es-ES')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      <div style={{ marginTop: '30px' }}>
        <h2>Acciones Rápidas</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/vehicles" style={{ padding: '10px 20px', backgroundColor: '#1976d2', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
            Gestionar Vehículos
          </Link>
          <Link to="/parking-spaces" style={{ padding: '10px 20px', backgroundColor: '#1976d2', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
            Gestionar Espacios
          </Link>
          <Link to="/parking-records" style={{ padding: '10px 20px', backgroundColor: '#1976d2', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
            Registros de Entrada/Salida
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
