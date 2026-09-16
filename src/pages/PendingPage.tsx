import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Clock, Zap, LogOut, RefreshCw } from 'lucide-react';
import { logoutUser } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export default function PendingPage() {
  const navigate = useNavigate();
  const { reset, appUser, loading } = useAuthStore();

  React.useEffect(() => {
    // If the user's status is active (e.g. after refresh), send them to the dashboard automatically
    if (!loading && appUser?.status === 'active') {
      navigate('/dashboard');
    }
  }, [appUser, loading, navigate]);

  const handleLogout = async () => {
    await logoutUser();
    reset();
    navigate('/login');
    toast.success('Logged out');
  };

  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      window.location.reload();
    }, 600); // Give enough time for the spin animation to feel snappy
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, position: 'relative' }}>
      <div className="orb orb-1" /><div className="orb orb-2" />
      <motion.div
        className="glass-card glass-card-responsive"
        style={{ width: '100%', padding: '52px 40px', textAlign: 'center', position: 'relative', zIndex: 1 }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="float-anim"
          style={{
            width: 80, height: 80, borderRadius: 20,
            background: '#f59e0b20', border: '1px solid #f59e0b40',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 28px',
          }}
        >
          <Clock size={36} color="#f59e0b" />
        </motion.div>

        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 12 }}>Account Under Review</h1>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 28, fontSize: 15 }}>
          আপনার registration সম্পন্ন হয়েছে। Admin review করার পর আপনার account activate হবে। সাধারণত ২৪ ঘণ্টার মধ্যে approve করা হয়।
        </p>

        <div className="glass-card" style={{ padding: 20, marginBottom: 28, textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-secondary)', fontSize: 14 }}>
            <Zap size={16} color="#6c47ff" style={{ flexShrink: 0 }} />
            Approval-এর পর আপনি পাবেন: <strong style={{ color: '#a78bfa' }}>Pro Access</strong>
          </div>
        </div>

        <div style={{
          display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center',
          marginBottom: 24,
        }}>
          {[0, 1, 2].map(i => (
            <motion.div key={i}
              style={{ width: 8, height: 8, borderRadius: '50%', background: '#6c47ff' }}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
            />
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            style={{
              background: 'linear-gradient(135deg, #6c47ff 0%, #9333ea 100%)', border: 'none',
              borderRadius: 10, padding: '10px 24px',
              color: '#fff', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600,
              transition: 'all 0.3s', boxShadow: '0 4px 12px rgba(108, 71, 255, 0.3)'
            }}
          >
            <motion.div animate={isRefreshing ? { rotate: 360 } : {}} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
              <RefreshCw size={16} />
            </motion.div>
            Check Status
          </button>

          <button
            onClick={handleLogout}
            style={{
              background: 'none', border: '1px solid var(--border)',
              borderRadius: 10, padding: '10px 20px',
              color: 'var(--text-muted)', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14,
              transition: 'all 0.3s',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--danger)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </motion.div>
    </div>
  );
}
