import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Headphones, UserPlus, Copy, X, Smartphone, PlayCircle, MessageCircle, Globe, CreditCard } from 'lucide-react';
import { registerUser } from '../services/authService';
import { getPublicSettings } from '../services/contentService';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [paymentNumber, setPaymentNumber] = useState('');
  
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  
  const [adminPaymentNumber, setAdminPaymentNumber] = useState('01785316245'); // Default fallback
  const [paymentAmount, setPaymentAmount] = useState('500');
  const [activeMethods, setActiveMethods] = useState({ bkash: true, nagad: true, rocket: true });
  const [selectedMethod, setSelectedMethod] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      const publicSettings = await getPublicSettings();
      if (publicSettings) {
        if (publicSettings.paymentNumber) setAdminPaymentNumber(publicSettings.paymentNumber);
        if (publicSettings.paymentAmount) setPaymentAmount(publicSettings.paymentAmount);
        if (publicSettings.activeMethods) {
          setActiveMethods(publicSettings.activeMethods);
          // Set first active method as default selected
          if (publicSettings.activeMethods.bkash) setSelectedMethod('bkash');
          else if (publicSettings.activeMethods.nagad) setSelectedMethod('nagad');
          else if (publicSettings.activeMethods.rocket) setSelectedMethod('rocket');
        } else {
          setSelectedMethod('bkash');
        }
      }
    };
    fetchSettings();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(adminPaymentNumber);
    toast.success('নম্বর কপি করা হয়েছে!');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName || !phone || !email || !password || !confirmPassword || !paymentNumber) {
      toast.error('সবগুলো ফিল্ড পূরণ করুন'); 
      return; 
    }
    const hasActiveMethods = activeMethods.bkash || activeMethods.nagad || activeMethods.rocket;
    if (hasActiveMethods && !selectedMethod) {
      toast.error('দয়া করে পেমেন্ট মেথড (বিকাশ/নগদ/রকেট) সিলেক্ট করুন');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('পাসওয়ার্ড মিলছে না');
      return;
    }
    if (password.length < 6) { 
      toast.error('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে'); 
      return; 
    }
    setLoading(true);
    try {
      await registerUser(email, password, displayName, paymentNumber, phone, selectedMethod);
      const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
      if (email.toLowerCase() === adminEmail?.toLowerCase()) {
        toast.success('Admin account created! Logging you in...');
        navigate('/dashboard');
      } else {
        navigate('/pending');
      }
    } catch (err: any) {
      const msg = err.code === 'auth/email-already-in-use'
        ? 'এই ইমেইলটি আগে থেকেই রেজিস্টার করা আছে।'
        : err.message || 'রেজিস্ট্রেশন ব্যর্থ হয়েছে';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '20px', background: '#0b1121', color: '#f8fafc',
    }}>
      <motion.div
        className="glass-card-responsive"
        style={{ width: '100%', background: '#111827', padding: '36px 32px', borderRadius: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.4)', border: '1px solid #1f2937' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <img src="/logo.png" alt="Smart Video AI" style={{ width: 64, height: 64, borderRadius: 16, margin: '0 auto 16px', display: 'block', boxShadow: '0 4px 20px rgba(108,71,255,0.4)' }} />
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, textShadow: '0 2px 10px rgba(99,102,241,0.2)' }}>অ্যাকাউন্ট তৈরি করুন</h1>
          <p style={{ color: '#94a3b8', fontSize: 13 }}>আপনার তথ্য দিয়ে নিচের ফর্মটি পূরণ করুন</p>
        </div>

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* আপনার নাম */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', display: 'block', marginBottom: 6 }}>আপনার নাম</label>
            <input
              type="text"
              placeholder="পুরো নাম লিখুন"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              style={{ width: '100%', background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: 10, padding: '12px 16px', fontSize: 14, outline: 'none' }}
              onFocus={e => e.target.style.borderColor = '#6366f1'}
              onBlur={e => e.target.style.borderColor = '#374151'}
            />
          </div>

          {/* ফোন নম্বর */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', display: 'block', marginBottom: 6 }}>ফোন নম্বর</label>
            <input
              type="text"
              placeholder="01710000XXX"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              style={{ width: '100%', background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: 10, padding: '12px 16px', fontSize: 14, outline: 'none' }}
              onFocus={e => e.target.style.borderColor = '#6366f1'}
              onBlur={e => e.target.style.borderColor = '#374151'}
            />
          </div>

          {/* ইমেইল ঠিকানা */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', display: 'block', marginBottom: 6 }}>ইমেইল ঠিকানা</label>
            <input
              type="email"
              placeholder="আপনার ইমেইল"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{ width: '100%', background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: 10, padding: '12px 16px', fontSize: 14, outline: 'none' }}
              onFocus={e => e.target.style.borderColor = '#6366f1'}
              onBlur={e => e.target.style.borderColor = '#374151'}
            />
          </div>

          {/* পাসওয়ার্ড */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', display: 'block', marginBottom: 6 }}>পাসওয়ার্ড</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="কমপক্ষে ৬ অক্ষরের"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ width: '100%', background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: 10, padding: '12px 16px', paddingRight: 40, fontSize: 14, outline: 'none' }}
                onFocus={e => e.target.style.borderColor = '#6366f1'}
                onBlur={e => e.target.style.borderColor = '#374151'}
              />
              <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* পাসওয়ার্ড নিশ্চিত করুন */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', display: 'block', marginBottom: 6 }}>পাসওয়ার্ড নিশ্চিত করুন</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="পাসওয়ার্ড আবার দিন"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                style={{ width: '100%', background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: 10, padding: '12px 16px', paddingRight: 40, fontSize: 14, outline: 'none' }}
                onFocus={e => e.target.style.borderColor = '#6366f1'}
                onBlur={e => e.target.style.borderColor = '#374151'}
              />
            </div>
          </div>

          {/* পেমেন্ট সেকশন (Orange Border) */}
          <div style={{ marginTop: 8, border: '1px solid #f97316', borderRadius: 12, padding: 16, background: '#1e1b19' }}>
            <label style={{ fontSize: 14, fontWeight: 700, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <CreditCard size={16} /> পেমেন্ট নম্বর <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <p style={{ fontSize: 11, color: '#fb923c', marginBottom: 10 }}>আপনি যে নম্বর থেকে টাকা পাঠিয়েছেন সেই নম্বরটি লিখুন।</p>
            <input
              type="text"
              placeholder="01800000000"
              value={paymentNumber}
              onChange={e => setPaymentNumber(e.target.value)}
              style={{ width: '100%', background: '#111827', color: '#fff', border: '1px solid #f97316', borderRadius: 8, padding: '12px 16px', fontSize: 14, outline: 'none', marginBottom: 12 }}
            />

            <div style={{ background: '#1f2937', borderRadius: 10, padding: 12, border: '1px solid #374151', borderLeft: '4px solid #facc15' }}>
              <p style={{ fontSize: 12, color: '#e2e8f0', marginBottom: 12, fontWeight: 600, lineHeight: 1.5 }}>
                যদি পেমেন্ট না করে থাকেন, তাহলে নিচের নম্বরে <span style={{ color: '#facc15' }}>{paymentAmount} টাকা</span> সেন্ড মানি (Send Money) করুন।
              </p>
              
              {(activeMethods.bkash || activeMethods.nagad || activeMethods.rocket) && (
                <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                  {activeMethods.bkash && (
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedMethod('bkash')}
                      style={{
                        background: selectedMethod === 'bkash' ? '#e11d48' : '#e11d4820',
                        color: selectedMethod === 'bkash' ? '#fff' : '#e11d48',
                        border: `1.5px solid ${selectedMethod === 'bkash' ? '#e11d48' : 'transparent'}`,
                        fontSize: 12, padding: '6px 14px', borderRadius: 99, fontWeight: 700, cursor: 'pointer',
                        transition: 'all 0.2s', boxShadow: selectedMethod === 'bkash' ? '0 4px 12px rgba(225,29,72,0.4)' : 'none'
                      }}
                    >
                      bKash
                    </motion.div>
                  )}
                  {activeMethods.nagad && (
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedMethod('nagad')}
                      style={{
                        background: selectedMethod === 'nagad' ? '#ea580c' : '#ea580c20',
                        color: selectedMethod === 'nagad' ? '#fff' : '#ea580c',
                        border: `1.5px solid ${selectedMethod === 'nagad' ? '#ea580c' : 'transparent'}`,
                        fontSize: 12, padding: '6px 14px', borderRadius: 99, fontWeight: 700, cursor: 'pointer',
                        transition: 'all 0.2s', boxShadow: selectedMethod === 'nagad' ? '0 4px 12px rgba(234,88,12,0.4)' : 'none'
                      }}
                    >
                      Nagad
                    </motion.div>
                  )}
                  {activeMethods.rocket && (
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedMethod('rocket')}
                      style={{
                        background: selectedMethod === 'rocket' ? '#8b5cf6' : '#8b5cf620',
                        color: selectedMethod === 'rocket' ? '#fff' : '#8b5cf6',
                        border: `1.5px solid ${selectedMethod === 'rocket' ? '#8b5cf6' : 'transparent'}`,
                        fontSize: 12, padding: '6px 14px', borderRadius: 99, fontWeight: 700, cursor: 'pointer',
                        transition: 'all 0.2s', boxShadow: selectedMethod === 'rocket' ? '0 4px 12px rgba(139,92,246,0.4)' : 'none'
                      }}
                    >
                      Rocket
                    </motion.div>
                  )}
                </div>
              )}

              <div style={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: 10, color: '#9ca3af', display: 'block', marginBottom: 2 }}>পেমেন্ট নম্বর -</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: '#f8fafc', letterSpacing: 1 }}>{adminPaymentNumber}</span>
                </div>
                <button type="button" onClick={handleCopy} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                  <Copy size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 10 }}
          >
            {loading ? <div className="spinner" style={{ width: 16, height: 16, borderTopColor: '#fff' }} /> : <><UserPlus size={18} /> রেজিস্ট্রেশন করুন</>}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 12, fontSize: 11, color: '#64748b' }}>
          *রেজিস্ট্রেশন বাটনে ক্লিক করে আপনি আমাদের শর্তাবলীতে সম্মত হচ্ছেন
        </p>

        {/* Help & Support */}
        <button
          type="button"
          onClick={() => setShowSupport(true)}
          style={{ width: '100%', background: '#1e293b', color: '#f8fafc', border: '1px solid #334155', borderRadius: 12, padding: '12px', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', marginTop: 16 }}
        >
          <Headphones size={16} /> Help & Support Center
        </button>

        {/* Footer Login Link */}
        <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: '#94a3b8' }}>অ্যাকাউন্ট তৈরি আছে?</span>
          <Link to="/login" style={{ background: '#1e1b4b', border: '1px solid #312e81', color: '#818cf8', padding: '6px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
            লগইন করুন
          </Link>
        </div>
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
