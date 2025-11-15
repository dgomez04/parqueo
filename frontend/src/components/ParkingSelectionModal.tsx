import React, { useState, useEffect } from 'react';
import type { Parking } from '../types';
import apiClient from '../api/client';

interface ParkingSelectionModalProps {
  onSelect: (parkingId: number) => void;
}

const ParkingSelectionModal: React.FC<ParkingSelectionModalProps> = ({ onSelect }) => {
  const [parkings, setParkings] = useState<Parking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedParkingId, setSelectedParkingId] = useState<number | null>(null);

  useEffect(() => {
    const fetchParkings = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/parkings');
        setParkings(response.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Error al cargar los estacionamientos');
      } finally {
        setLoading(false);
      }
    };

    fetchParkings();
  }, []);

  const handleSelect = () => {
    if (selectedParkingId) {
      onSelect(selectedParkingId);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          Seleccionar Estacionamiento
        </h2>

        <p className="text-gray-600 mb-4">
          Por favor seleccione el estacionamiento donde estará trabajando en esta sesión:
        </p>

        {loading && (
          <div className="text-center py-4">
            <p className="text-gray-600">Cargando estacionamientos...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {!loading && !error && parkings.length === 0 && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
            No hay estacionamientos disponibles
          </div>
        )}

        {!loading && parkings.length > 0 && (
          <div className="space-y-2 mb-6">
            {parkings.map((parking) => (
              <div
                key={parking.id}
                onClick={() => setSelectedParkingId(parking.id)}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedParkingId === parking.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-800">
                      {parking.name}
                    </h3>
                    {(parking.totalSpaces !== undefined) && (
                      <div className="text-sm text-gray-600 mt-1">
                        <span className="font-medium">Total:</span> {parking.totalSpaces} espacios
                        {parking.availableSpaces !== undefined && (
                          <>
                            {' | '}
                            <span className="font-medium">Disponibles:</span> {parking.availableSpaces}
                          </>
                        )}
                        {parking.occupiedSpaces !== undefined && (
                          <>
                            {' | '}
                            <span className="font-medium">Ocupados:</span> {parking.occupiedSpaces}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  {selectedParkingId === parking.id && (
                    <div className="text-blue-500">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={handleSelect}
          disabled={!selectedParkingId || loading}
          className={`w-full py-2 px-4 rounded-lg font-semibold transition-colors ${
            selectedParkingId && !loading
              ? 'bg-blue-500 hover:bg-blue-600 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Confirmar Selección
        </button>
      </div>
    </div>
  );
};

export default ParkingSelectionModal;
