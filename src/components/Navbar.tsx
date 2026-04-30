import { User } from 'firebase/auth';
import { UserProfile } from '../hooks/useAuth';
import { auth } from '../lib/firebase';
import { LogOut, Bell, Search, User as UserIcon } from 'lucide-react';

export default function Navbar({ user, profile }: { user: User | null, profile: UserProfile | null }) {
  return (
    <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-900/30 backdrop-blur-md sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <span className="text-sm text-slate-500">Smart Video Builder /</span>
        <span className="text-sm font-medium text-white">Dashboard</span>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative max-w-xs w-full hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search assets..." 
            className="w-[240px] bg-white/5 border border-white/10 rounded-lg py-1.5 pl-10 pr-4 text-xs focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>

        <button className="text-slate-400 hover:text-white transition-colors relative">
          <Bell size={18} />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full border border-bg-dark"></span>
        </button>
        
        <div className="flex items-center gap-3 pl-4 border-l border-white/10">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-white">{profile?.email.split('@')[0]}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-tighter">{profile?.role}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-slate-300">
            <UserIcon size={16} />
          </div>
          <button 
            onClick={() => auth.signOut()}
            className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
