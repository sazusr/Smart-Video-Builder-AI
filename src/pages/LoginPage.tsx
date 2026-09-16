import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, LogIn, Headphones, UserPlus, X, Smartphone, PlayCircle, MessageCircle, Globe } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { loginUser, loginWithGoogle } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAppUser } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showSupport, setShowSupport] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Please fill in all fields'); return; }
    setLoading(true);
    try {
      const appUser = await loginUser(email, password);
      setAppUser(appUser);
      if (appUser.status === 'pending') {
        navigate('/pending');
      } else if (appUser.status === 'blocked' || appUser.status === 'suspended') {
        toast.error('Your account has been suspended. Contact support.');
        navigate('/login');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      const msg = err.code === 'auth/invalid-credential'
        ? 'Invalid email or password'
        : err.message || 'Login failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      const appUser = await loginWithGoogle();
      setAppUser(appUser);
      if (appUser.status === 'pending') navigate('/pending');
      else if (appUser.role === 'admin' || appUser.role === 'superadmin') navigate('/admin');
      else navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Google login failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '20px', position: 'relative',
    }}>
      <div className="orb orb-1" />
      <div className="orb orb-2" />

      <motion.div
        className="glass-card glass-card-responsive"
        style={{ width: '100%', position: 'relative', zIndex: 1, background: '#0b1120', border: 'none', boxShadow: 'none' }}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src="/logo.png" alt="Smart Video AI" style={{ width: 64, height: 64, borderRadius: 16, marginBottom: 16, boxShadow: '0 4px 20px rgba(108,71,255,0.4)', display: 'block', margin: '0 auto 16px auto' }} />
          <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8, color: '#fff' }}>Welcome Back</h1>
          <p style={{ color: '#94a3b8', fontSize: 14 }}>
            Sign in to access Smart Video Ai
          </p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Email */}
          <div>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: '14px 16px', color: '#f8fafc', fontSize: 15, outline: 'none' }}
              id="login-email"
            />
          </div>

          {/* Password */}
          <div style={{ position: 'relative' }}>
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: '14px 48px 14px 16px', color: '#f8fafc', fontSize: 15, outline: 'none' }}
              id="login-password"
            />
            <button type="button" onClick={() => setShowPass(!showPass)}
              style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Forgot Password Link */}
          <div style={{ textAlign: 'left', marginTop: -4 }}>
            <Link to="/forgot-password" style={{ fontSize: 13, color: '#3b82f6', textDecoration: 'none', fontWeight: 500 }}>
              Forgot your password?
            </Link>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', marginTop: 8 }}
            id="login-submit"
          >
            {loading ? <div className="spinner" /> : (
              <>
                <LogIn size={18} /> Sign In
              </>
            )}
          </button>
          
          {/* Help & Support Button */}
          <button
            type="button"
            onClick={() => setShowSupport(true)}
            style={{ width: '100%', background: '#1e293b', color: '#f8fafc', border: '1px solid #334155', borderRadius: 12, padding: '14px', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer' }}
          >
            <Headphones size={18} /> Help & Support Center
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0' }}>
          <div style={{ flex: 1, height: 1, background: '#334155' }}></div>
          <span style={{ margin: '0 16px', color: '#64748b', fontSize: 13 }}>অথবা</span>
          <div style={{ flex: 1, height: 1, background: '#334155' }}></div>
        </div>

        {/* Create Account Button */}
        <Link to="/register" style={{ textDecoration: 'none', display: 'block' }}>
          <button
            type="button"
            style={{ width: '100%', background: 'transparent', color: '#8b5cf6', border: '1.5px dashed #6d28d9', borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer' }}
          >
            <UserPlus size={18} /> নতুন অ্যাকাউন্ট তৈরি করুন
          </button>
        </Link>
        
        {/* Footer text */}
        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: '#64748b' }}>
          নিবন্ধনের পর অ্যাডমিন অ্যাপ্রুভাল প্রয়োজন হবে।
        </p>
      </motion.div>

      {/* ── Support Modal ── */}
      <AnimatePresence>
        {showSupport && (
          <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
            zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          }} onClick={() => setShowSupport(false)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 24, width: '100%', maxWidth: 450, overflow: 'hidden' }}
            >
              <div style={{ padding: '24px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ background: '#6c47ff20', padding: 10, borderRadius: 12, color: '#a78bfa' }}>
                    <Headphones size={24} />
                  </div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>সাপোর্ট সেন্টার</h2>
                </div>
                <button onClick={() => setShowSupport(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                  <X size={24} />
                </button>
              </div>
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '70vh', overflowY: 'auto' }}>
                {[
                  { href: '#', icon: <Smartphone size={24} />, color: '#3b82f620', iconColor: '#60a5fa', title: 'মোবাইল অ্যাপস ইন্সটল/আপডেট', desc: 'সর্বশেষ ফিচারের জন্য আপডেট রাখুন' },
                  { href: '#', icon: <PlayCircle size={24} />, color: '#4c1d9510', iconColor: '#f472b6', title: 'ভিডিও টিউটোরিয়াল 🎬', desc: 'ধাপে ধাপে শিখুন এবং Expert হন!' },
                  { href: '#', icon: <MessageCircle size={24} />, color: '#10b98115', iconColor: '#34d399', title: 'সিক্রেট কমিউনিটি', desc: 'সকল আপডেট ও নোটিফিকেশন পেতে যুক্ত থাকুন' },
                  { href: '#', icon: <Headphones size={24} />, color: '#10b98115', iconColor: '#34d399', title: 'WhatsApp সাপোর্ট', desc: 'সরাসরি সাপোর্ট টিমের সাথে কথা বলুন' },
                  { href: '#', icon: <Globe size={24} />, color: '#3b82f620', iconColor: '#60a5fa', title: 'ওয়েবসাইট ভিজিট', desc: 'আরও বিস্তারিত জানুন' },
                ].map(({ href, icon, color, iconColor, title, desc }) => (
                  <a key={title} href={href} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                    <div style={{ background: color, border: '1px solid #1e293b', borderRadius: 16, padding: '16px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}>
                      <div style={{ background: `${iconColor}25`, color: iconColor, padding: 12, borderRadius: 12 }}>{icon}</div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ color: '#f8fafc', fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{title}</h4>
                        <p style={{ color: '#94a3b8', fontSize: 13 }}>{desc}</p>
                      </div>
                      <Globe size={16} style={{ color: '#64748b' }} />
                    </div>
                  </a>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
