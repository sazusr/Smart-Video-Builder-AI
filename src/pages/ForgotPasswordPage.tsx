import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Mail, ArrowLeft } from 'lucide-react';
import { resetPassword } from '../services/authService';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error('Please enter your email'); return; }
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
      toast.success('Password reset email sent!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, position: 'relative' }}>
      <div className="orb orb-1" /><div className="orb orb-2" />
      <motion.div
        className="glass-card glass-card-responsive"
        style={{ width: '100%', padding: '40px 36px', position: 'relative', zIndex: 1 }}
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
      >
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--gradient-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Zap size={24} color="#fff" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Reset Password</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            {sent ? 'Check your inbox for a reset link.' : "Enter your email and we'll send a reset link."}
          </p>
        </div>

        {!sent && (
          <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input className="input-field" type="email" placeholder="your@email.com" value={email}
                  onChange={e => setEmail(e.target.value)} style={{ paddingLeft: 42 }} id="forgot-email" />
              </div>
            </div>
            <button type="submit" className="btn-brand" disabled={loading}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {loading ? <><div className="spinner" /> Sending...</> : 'Send Reset Link'}
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Link to="/login" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <ArrowLeft size={14} /> Back to Login
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
