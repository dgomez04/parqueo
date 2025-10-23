import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ChangePasswordModal from './ChangePasswordModal';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  React.useEffect(() => {
    if (user?.isFirstLogin) {
      setShowPasswordModal(true);
    }
  }, [user]);

  if (isLoading) {
    return <div style={{ padding: '20px' }}>Cargando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      {showPasswordModal && user.isFirstLogin && (
        <ChangePasswordModal
          isFirstLogin={true}
          onClose={() => setShowPasswordModal(false)}
        />
      )}
      {children}
    </>
  );
};

export default ProtectedRoute;
