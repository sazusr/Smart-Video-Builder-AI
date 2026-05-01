import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PlayCircle, TrendingUp, Shield, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { UserProfile } from '../hooks/useAuth';
import { useLanguage } from '../context/LanguageContext';

export default function MobileNav({ profile }: { profile: UserProfile | null }) {
  const { t: globalT } = useLanguage();
  const t = globalT.nav;
  const isAdmin = profile?.role === 'admin' || profile?.email === 'freelancersazu3@gmail.com';

  return (
    <nav className="md:hidden fixed bottom-6 left-6 right-6 h-16 bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-3xl flex items-center justify-around px-4 z-[100] shadow-2xl shadow-black/80 ring-1 ring-white/10">
      <NavLink 
        to="/dashboard" 
        className={({ isActive }) => cn(
          "flex flex-col items-center gap-1 p-2 transition-all duration-300",
          isActive ? "text-purple-400 scale-110" : "text-slate-500 hover:text-slate-300"
        )}
      >
        <div className={cn(
          "transition-all duration-300 active:scale-95"
        )}>
          <LayoutDashboard size={20} />
        </div>
        <span className="text-[8px] font-extrabold uppercase tracking-widest leading-none">{t.home}</span>
      </NavLink>

      <NavLink 
        to="/history" 
        className={({ isActive }) => cn(
          "flex flex-col items-center gap-1 p-2 transition-all duration-300",
          isActive ? "text-purple-400 scale-110" : "text-slate-500 hover:text-slate-300"
        )}
      >
        <div className={cn(
          "transition-all duration-300 active:scale-95"
        )}>
          <PlayCircle size={20} />
        </div>
        <span className="text-[8px] font-extrabold uppercase tracking-widest leading-none">{t.history}</span>
      </NavLink>

      {isAdmin && (
        <NavLink 
          to="/admin" 
          className={({ isActive }) => cn(
            "flex flex-col items-center gap-1 p-2 transition-all duration-300",
            isActive ? "text-purple-400 scale-110" : "text-slate-500 hover:text-slate-300"
          )}
        >
          <div className={cn(
            "transition-all duration-300 active:scale-95"
          )}>
            <Shield size={20} />
          </div>
          <span className="text-[8px] font-extrabold uppercase tracking-widest leading-none">{t.admin}</span>
        </NavLink>
      )}
    </nav>
  );
}
