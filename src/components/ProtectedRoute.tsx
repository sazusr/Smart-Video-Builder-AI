import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface Props {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false }: Props) {
  const { user, appUser, loading, initialized } = useAuthStore();

  if (!initialized || loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--gradient-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner" />
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading...</p>
      </div>
    );
  }

  if (!user || !appUser) return <Navigate to="/login" replace />;
  if (appUser.status === 'pending') return <Navigate to="/pending" replace />;
  if (appUser.status === 'blocked' || appUser.status === 'suspended') return <Navigate to="/login" replace />;
  if (requireAdmin && appUser.role !== 'admin' && appUser.role !== 'superadmin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
