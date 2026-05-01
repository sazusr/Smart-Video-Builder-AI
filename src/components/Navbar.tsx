import { User } from 'firebase/auth';
import { UserProfile } from '../hooks/useAuth';
import { auth } from '../lib/firebase';
import { LogOut, Headset, Settings, User as UserIcon } from 'lucide-react';
import SettingsModal from './SettingsModal';
import { useState } from 'react';

export default function Navbar({ user, profile }: { user: User | null, profile: UserProfile | null }) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <header className="h-16 border-b border-slate-800 flex items-center justify-between px-4 sm:px-8 bg-slate-900/30 backdrop-blur-md sticky top-0 z-10">
      <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
        <span className="text-[10px] sm:text-xs text-slate-500 whitespace-nowrap hidden xs:inline uppercase font-bold tracking-widest text-primary/60">সফ্টওয়্যার /</span>
        <span className="text-xs sm:text-sm font-bold text-white truncate uppercase tracking-tight">ড্যাশবোর্ড</span>
      </div>

      <div className="flex items-center gap-2 sm:gap-6">
        <div className="flex items-center gap-1 sm:gap-2">
          <a 
            href="https://wa.me/8801571250709" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          >
            <Headset size={16} />
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider hidden xs:inline">সাপোর্ট</span>
          </a>
          
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all font-bold"
          >
            <Settings size={16} />
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider hidden xs:inline">সেটিংস</span>
          </button>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-white/10">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-white truncate max-w-[100px]">{profile?.firstName || profile?.email?.split('@')[0]}</p>
            <p className="text-[9px] text-slate-500 uppercase tracking-tighter truncate">
              {profile?.role === 'admin' ? 'অ্যাডমিন' : (profile?.firstName ? 'ইউজার' : 'প্রোফাইল')}
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-slate-300 flex-shrink-0">
            <UserIcon size={16} />
          </div>
          <button 
            onClick={() => auth.signOut()}
            className="p-1.5 text-slate-500 hover:text-red-400 transition-colors flex-shrink-0"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        profile={profile}
      />
    </header>
  );
}
