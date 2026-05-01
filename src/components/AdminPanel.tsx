import { useState, useEffect } from 'react';
import { 
  Users, 
  PlayCircle, 
  Activity, 
  ShieldCheck, 
  MoreVertical, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  ArrowUpCircle,
  LayoutDashboard,
  Clock
} from 'lucide-react';
import { collection, onSnapshot, query, doc, updateDoc, deleteDoc, getDocs, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

export default function AdminPanel() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [recentContent, setRecentContent] = useState<any[]>([]);
  const [contentCount, setContentCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Users stream
    const uQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubUsers = onSnapshot(uQuery, (snap) => {
      const uList = snap.docs.map(d => d.data() as UserProfile);
      setUsers(uList);
      setLoading(false);
    });

    // Content stream (recent 5)
    const cQuery = query(collection(db, 'content'), orderBy('createdAt', 'desc'), limit(5));
    const unsubContent = onSnapshot(cQuery, (snap) => {
      setRecentContent(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Get total stats
    getDocs(collection(db, 'content')).then(snap => setContentCount(snap.size));

    return () => {
      unsubUsers();
      unsubContent();
    };
  }, []);

  const updateUserStatus = async (uid: string, status: 'active' | 'blocked' | 'pending') => {
    try {
      await updateDoc(doc(db, 'users', uid), { 
        status,
        updatedAt: serverTimestamp()
      });
      toast.success(`User status set to ${status}`);
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const promoteToAdmin = async (uid: string) => {
    try {
      await updateDoc(doc(db, 'users', uid), { 
        role: 'admin',
        updatedAt: serverTimestamp()
      });
      toast.success('User promoted to admin');
    } catch (error) {
      toast.error('Promotion failed');
    }
  };

  const deleteUser = async (uid: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This cannot be undone.')) return;
    try {
      await deleteDoc(doc(db, 'users', uid));
      toast.success('User deleted successfully');
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-slate-400">Manage platform users and monitor production activities.</p>
        </div>
        <Link 
          to="/dashboard" 
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-bold hover:bg-white/10 transition-all w-fit"
        >
          <LayoutDashboard size={18} className="text-primary" />
          Dashboard
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Users" value={users.length} icon={<Users size={20} />} color="text-blue-400" />
        <StatCard title="Active Users" value={users.filter(u => u.status === 'active').length} icon={<CheckCircle2 size={20} />} color="text-green-400" />
        <StatCard title="Pending Requests" value={users.filter(u => u.status === 'pending').length} icon={<Clock size={20} />} color="text-yellow-400" />
        <StatCard title="Total Production" value={contentCount} icon={<PlayCircle size={20} />} color="text-purple-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Table (Main) */}
        <div className="lg:col-span-2 bg-slate-900/50 rounded-2xl border border-white/5 overflow-hidden ring-1 ring-white/5">
          <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
            <h3 className="font-display font-bold text-lg flex items-center gap-2">
              <ShieldCheck size={18} className="text-purple-400" />
              Registry Management
            </h3>
            <span className="bg-purple-500/10 text-purple-400 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest border border-purple-500/10">ACTIVE SESSIONS</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  <th className="px-8 py-5">User ID</th>
                  <th className="px-6 py-5">Status</th>
                  <th className="px-6 py-5">Access Tier</th>
                  <th className="px-8 py-5 text-right">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((u) => (
                  <tr key={u.uid} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-800 border border-white/5 flex items-center justify-center text-slate-400 font-bold text-xs shrink-0">
                          {(u.firstName?.[0] || u.email[0])?.toUpperCase()}
                        </div>
                        <div className="text-sm truncate max-w-[200px]">
                          <p className="font-bold text-white truncate">
                            {u.firstName || u.email.split('@')[0]}
                          </p>
                          <p className="text-slate-500 text-[10px] font-medium truncate">{u.email}</p>
                          {u.phone && (
                            <p className="text-[9px] text-primary/80 font-mono mt-0.5">{u.phone}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="px-6 py-5">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border",
                        u.role === 'admin' ? "bg-accent/10 text-accent border-accent/20" : "bg-white/5 text-slate-500 border-white/10"
                      )}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {u.status !== 'active' && (
                          <ActionButton 
                            onClick={() => updateUserStatus(u.uid, 'active')} 
                            icon={<CheckCircle2 size={16} />} 
                            label="Approve" 
                            color="hover:text-green-400"
                          />
                        )}
                        {u.status !== 'blocked' && (
                          <ActionButton 
                            onClick={() => updateUserStatus(u.uid, 'blocked')} 
                            icon={<XCircle size={16} />} 
                            label="Block" 
                            color="hover:text-red-400"
                          />
                        )}
                        <ActionButton 
                          onClick={() => deleteUser(u.uid)} 
                          icon={<Trash2 size={16} />} 
                          label="Delete" 
                          color="hover:text-red-600"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity Sidebar */}
        <div className="space-y-6">
          <div className="bg-slate-900/50 rounded-2xl border border-white/5 p-6 ring-1 ring-white/5 h-fit">
            <h3 className="font-display font-bold text-lg flex items-center gap-2 mb-6">
              <Clock size={18} className="text-blue-400" />
              Recent Productions
            </h3>
            <div className="space-y-4">
              {recentContent.map((item) => (
                <div key={item.id} className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{item.language}</span>
                    <span className="text-[10px] text-slate-500">{new Date(item.createdAt?.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-xs font-bold text-white line-clamp-1">{item.videoTopic}</p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <Users size={10} />
                    <span className="truncate">{item.userId.slice(0, 8)}...</span>
                  </div>
                </div>
              ))}
              {recentContent.length === 0 && (
                <p className="text-center py-10 text-slate-500 italic text-sm">No recent activity</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: any) {
  return (
    <div className="bg-slate-900/50 p-6 border border-white/5 rounded-2xl ring-1 ring-white/5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">{title}</p>
          <h4 className="text-3xl font-display font-extrabold text-white">{value}</h4>
        </div>
        <div className={cn("p-3 rounded-xl bg-white/5 border border-white/10 shadow-inner", color)}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    active: "bg-green-500/10 text-green-500 border-green-500/20",
    pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    blocked: "bg-red-500/10 text-red-500 border-red-500/20"
  };

  const labels = {
    active: "Active",
    pending: "Pending",
    blocked: "Blocked"
  };

  return (
    <span className={cn(
      "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border",
      styles[status as keyof typeof styles]
    )}>
      {labels[status as keyof typeof labels] || status}
    </span>
  );
}

function ActionButton({ onClick, icon, label, color }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn("p-2 text-slate-500 transition-all flex items-center gap-1 text-xs", color)}
      title={label}
    >
      {icon}
      <span className="hidden lg:inline">{label}</span>
    </button>
  );
}
