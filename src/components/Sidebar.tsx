import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Settings, PlayCircle, BarChart3, TrendingUp } from 'lucide-react';
import { UserProfile } from '../hooks/useAuth';
import { cn } from '../lib/utils';

export default function Sidebar({ profile }: { profile: UserProfile | null }) {
  const location = useLocation();

  const menuItems = [
    { name: 'ড্যাশবোর্ড', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'জেনারেশন হিস্ট্রি', icon: PlayCircle, path: '/history' },
    { name: 'ট্রেন্ডিং আইডিয়াস', icon: TrendingUp, path: '/trending' },
  ];

  const adminItems = [
    { name: 'ইউজার ম্যানেজমেন্ট', icon: Users, path: '/admin' },
    { name: 'সিস্টেম সেটিংস', icon: Settings, path: '/settings' },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900/50 backdrop-blur-xl hidden lg:flex flex-col p-6 h-screen sticky top-0">
      <div className="flex items-center gap-3 mb-10">
        <div className="w-8 h-8 rounded-lg gradient-btn flex items-center justify-center shadow-purple-500/10">
          <PlayCircle className="text-white w-5 h-5" />
        </div>
        <span className="font-display font-bold text-lg tracking-tight text-white leading-none">SmartVideo AI</span>
      </div>

      <nav className="flex-1 space-y-1">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4 mb-4">মেইন মেনু</div>
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium",
              location.pathname === item.path 
                ? "sidebar-active shadow-sm" 
                : "text-slate-400 hover:text-white hover:bg-white/5"
            )}
          >
            <item.icon size={20} />
            <span>{item.name}</span>
          </Link>
        ))}

        {profile?.role === 'admin' && (
          <>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4 mb-4 mt-10">Admin Panel</div>
            {adminItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium",
                  location.pathname === item.path 
                    ? "sidebar-active shadow-sm" 
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon size={20} />
                <span>{item.name}</span>
              </Link>
            ))}
          </>
        )}
      </nav>

      <div className="mt-auto">
        <div className="p-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">বর্তমান রোল</p>
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", profile?.status === 'active' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-yellow-500')} />
            <span className="text-sm font-bold text-white capitalize">
              {profile?.role === 'admin' ? 'অ্যাডমিন' : (profile?.firstName || profile?.email?.split('@')[0] || 'ইউজার')}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
