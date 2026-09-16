import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import ProtectedRoute from './components/ProtectedRoute';
import InstallPromptModal from './components/InstallPromptModal';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import PendingPage from './pages/PendingPage';
import AdminPanel from './pages/AdminPanel';
import PricingPage from './pages/PricingPage';

// Dashboard
import UnifiedDashboard from './pages/dashboard/UnifiedDashboard';

// Story Video
import { StoryVideoPage } from './pages/story-video/StoryVideoPage';

export default function App() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    const unsub = initialize();
    return unsub;
  }, []);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#22d3a0', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
      <InstallPromptModal />

      <Routes>
        {/* Public */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/pending" element={<PendingPage />} />

        {/* Admin route redirect */}
        <Route path="/admin" element={<Navigate to="/dashboard" replace />} />

        {/* Dashboard */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <UnifiedDashboard />
          </ProtectedRoute>
        } />

        {/* Story Video */}
        <Route path="/story-video" element={
          <ProtectedRoute>
            <StoryVideoPage />
          </ProtectedRoute>
        } />

        {/* Pricing */}
        <Route path="/pricing" element={<PricingPage />} />

        {/* Dashboard */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <UnifiedDashboard />
          </ProtectedRoute>
        } />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
