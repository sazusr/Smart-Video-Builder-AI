import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users, CheckCircle, XCircle, Shield, BarChart2,
  Zap, RefreshCw, LogOut, Clock, TrendingUp, Settings as SettingsIcon, Save, Key, CreditCard
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getAllUsers, updateUserStatus, updateUserRole, logoutUser } from '../services/authService';
import { getAdminGeminiSettings, saveAdminGeminiSettings, getPublicSettings, savePublicSettings } from '../services/contentService';
import type { AppUser } from '../types';
import toast from 'react-hot-toast';

export default function AdminPanel() {
  const navigate = useNavigate();
  const { appUser, reset } = useAuthStore();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'blocked'>('all');
  const [actionUid, setActionUid] = useState<string | null>(null);
  
  const [backupKey, setBackupKey] = useState('');
  const [savingKey, setSavingKey] = useState(false);
  const [paymentNumber, setPaymentNumber] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  const fetchSettings = async () => {
    try {
      const settings = await getAdminGeminiSettings();
      if (settings?.backupKey) {
        setBackupKey(settings.backupKey);
      }
      const publicSettings = await getPublicSettings();
      if (publicSettings?.paymentNumber) {
        setPaymentNumber(publicSettings.paymentNumber);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { 
    fetchUsers(); 
    fetchSettings();
  }, []);

  const handleApprove = async (uid: string) => {
    setActionUid(uid);
    try {
      await updateUserStatus(uid, 'active', appUser?.uid);
      toast.success('User approved!');
      fetchUsers();
    } catch { toast.error('Failed to approve'); }
    finally { setActionUid(null); }
  };

  const handleBlock = async (uid: string) => {
    setActionUid(uid);
    try {
      await updateUserStatus(uid, 'blocked');
      toast.success('User blocked');
      fetchUsers();
    } catch { toast.error('Failed to block'); }
    finally { setActionUid(null); }
  };

  const handleSaveSettings = async () => {
    setSavingKey(true);
    try {
      await saveAdminGeminiSettings({ backupKey });
      toast.success('System Settings Saved!');
    } catch (e) {
      toast.error('Failed to save settings');
    } finally {
      setSavingKey(false);
    }
  };

  const handleLogout = async () => {
    await logoutUser(); reset(); navigate('/login');
  };

  const filtered = users.filter(u => filter === 'all' ? true : u.status === filter);
  const counts = {
    all: users.length,
    pending: users.filter(u => u.status === 'pending').length,
    active: users.filter(u => u.status === 'active').length,
    blocked: users.filter(u => u.status === 'blocked').length,
  };

  const statusColor: Record<string, string> = {
    pending: '#f59e0b', active: '#22d3a0', blocked: '#ef4444', suspended: '#f59e0b',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Top bar */}
      <div style={{
        background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)',
        padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--gradient-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={17} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 17, fontWeight: 800 }}>Admin Panel</h1>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{appUser?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 9, padding: '8px 16px', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, fontSize: 13 }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <LogOut size={14} /> Logout
        </button>
      </div>

      <div style={{ padding: '32px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Total Users', value: counts.all, color: '#6c47ff', icon: <Users size={18} /> },
            { label: 'Pending Approval', value: counts.pending, color: '#f59e0b', icon: <Clock size={18} /> },
            { label: 'Active Users', value: counts.active, color: '#22d3a0', icon: <CheckCircle size={18} /> },
            { label: 'Blocked', value: counts.blocked, color: '#ef4444', icon: <XCircle size={18} /> },
          ].map((s) => (
            <motion.div key={s.label} className="glass-card" style={{ padding: '20px 22px' }}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</span>
                <div style={{ color: s.color }}>{s.icon}</div>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
            </motion.div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 32, marginBottom: 32 }}>
          {/* System Settings */}
          <div className="glass-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <SettingsIcon size={18} style={{ color: '#ff47a3' }} />
              <h2 style={{ fontSize: 17, fontWeight: 700 }}>System Settings</h2>
            </div>
            
            <div style={{ maxWidth: 600 }}>
              <label style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8, display: 'block', fontWeight: 600 }}>
                <Key size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                Global Fallback Gemini API Key
              </label>
              <div style={{ display: 'flex', gap: 12 }}>
                <input 
                  type="password"
                  className="input-field" 
                  placeholder="AIzaSy..."
                  value={backupKey}
                  onChange={(e) => setBackupKey(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button 
                  className="btn-brand"
                  onClick={handleSaveSettings}
                  disabled={savingKey}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px' }}
                >
                  {savingKey ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <Save size={14} />}
                  Save
                </button>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                এই Key টি সেসব ব্যবহারকারীর জন্য কাজ করবে যারা নিজেরা কোনো API Key দেননি।
              </p>
            </div>

            <div style={{ maxWidth: 600, marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
              <label style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8, display: 'block', fontWeight: 600 }}>
                <CreditCard size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                Payment Number (bKash/Nagad/Rocket)
              </label>
              <div style={{ display: 'flex', gap: 12 }}>
                <input 
                  type="text"
                  className="input-field" 
                  placeholder="017XXXXXXXXX"
                  value={paymentNumber}
                  onChange={(e) => setPaymentNumber(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button 
                  className="btn-brand"
                  onClick={async () => {
                    setSavingPayment(true);
                    try {
                      await savePublicSettings({ paymentNumber });
                      toast.success('Payment Number Saved!');
                    } catch (e) {
                      toast.error('Failed to save payment number');
                    } finally {
                      setSavingPayment(false);
                    }
                  }}
                  disabled={savingPayment}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)' }}
                >
                  {savingPayment ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <Save size={14} />}
                  Save
                </button>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                এই নম্বরটি রেজিস্ট্রেশন পেজে ইউজারদের পেমেন্ট করার জন্য দেখানো হবে।
              </p>
            </div>
          </div>
        </div>

        {/* User Management */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={17} /> User Management
            </h2>
            <button onClick={fetchUsers}
              style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 14px', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
              <RefreshCw size={13} /> Refresh
            </button>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {(['all', 'pending', 'active', 'blocked'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{
                  padding: '6px 16px', borderRadius: 99, fontSize: 13, cursor: 'pointer',
                  border: `1px solid ${filter === f ? 'var(--accent-primary)' : 'var(--border)'}`,
                  background: filter === f ? '#6c47ff20' : 'transparent',
                  color: filter === f ? '#a78bfa' : 'var(--text-secondary)',
                  transition: 'all 0.2s', fontWeight: filter === f ? 600 : 400,
                }}>
                {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
              </button>
            ))}
          </div>

          {/* Table */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <div className="spinner" style={{ margin: '0 auto 12px' }} />
              Loading users...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: 14 }}>
              No users found
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Name', 'Email', 'Role', 'Status', 'Plan', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u, i) => (
                    <motion.tr key={u.uid}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#ffffff05')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '12px 14px', fontSize: 14, fontWeight: 500 }}>{u.displayName}</td>
                      <td style={{ padding: '12px 14px', fontSize: 13, color: 'var(--text-secondary)' }}>{u.email}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span className={`badge ${u.role === 'admin' || u.role === 'superadmin' ? 'badge-primary' : 'badge-muted'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: statusColor[u.status] || '#a0a0c0' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor[u.status] || '#a0a0c0', display: 'inline-block' }} />
                          {u.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span className="badge badge-muted">{u.plan}</span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {u.status === 'pending' && (
                            <button
                              onClick={() => handleApprove(u.uid)}
                              disabled={actionUid === u.uid}
                              style={{ padding: '5px 12px', borderRadius: 7, border: 'none', background: '#22d3a020', color: '#22d3a0', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600 }}
                            >
                              {actionUid === u.uid ? <div className="spinner" style={{ width: 12, height: 12 }} /> : <CheckCircle size={12} />}
                              Approve
                            </button>
                          )}
                          {u.status !== 'blocked' && u.role !== 'admin' && u.role !== 'superadmin' && (
                            <button
                              onClick={() => handleBlock(u.uid)}
                              disabled={actionUid === u.uid}
                              style={{ padding: '5px 12px', borderRadius: 7, border: 'none', background: '#ef444420', color: '#ef4444', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600 }}
                            >
                              <XCircle size={12} /> Block
                            </button>
                          )}
                          {u.status === 'blocked' && (
                            <button
                              onClick={() => handleApprove(u.uid)}
                              disabled={actionUid === u.uid}
                              style={{ padding: '5px 12px', borderRadius: 7, border: 'none', background: '#6c47ff20', color: '#a78bfa', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
                            >
                              Unblock
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
