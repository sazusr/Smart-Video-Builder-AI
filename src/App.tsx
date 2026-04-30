import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import History from './components/History';
import TrendingIdeas from './components/TrendingIdeas';
import AdminPanel from './components/AdminPanel';
import Layout from './components/Layout';
import LandingPage from './components/LandingPage';
import { RippleContainer } from './components/RippleContainer';

export default function App() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-dark">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Router>
      <RippleContainer>
        <div className="min-h-screen bg-bg-dark text-slate-100">
          <Toaster position="top-right" />
          <Routes>
            <Route path="/" element={user ? <Navigate to="/dashboard" /> : <LandingPage />} />
            <Route path="/auth" element={user ? <Navigate to="/dashboard" /> : <Auth />} />
            
            <Route element={<Layout user={user} profile={profile} />}>
              <Route 
                path="/dashboard" 
                element={user ? <Dashboard /> : <Navigate to="/auth" />} 
              />
              <Route 
                path="/history" 
                element={user ? <History /> : <Navigate to="/auth" />} 
              />
              <Route 
                path="/trending" 
                element={user ? <TrendingIdeas /> : <Navigate to="/auth" />} 
              />
              <Route 
                path="/admin" 
                element={
                  profile?.role === 'admin' || user?.email === 'freelancersazu3@gmail.com' 
                    ? <AdminPanel /> 
                    : <Navigate to="/dashboard" />
                } 
              />
            </Route>
          </Routes>
        </div>
      </RippleContainer>
    </Router>
  );
}

