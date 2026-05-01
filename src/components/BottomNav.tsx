import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, History, Settings, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

const BottomNav = () => {
  const navItems = [
    { icon: LayoutDashboard, label: 'ড্যাশবোর্ড', path: '/dashboard' },
    { icon: Sparkles, label: 'জেনারেটর', path: '/dashboard' }, // Same as dashboard for now or special tool
    { icon: History, label: 'হিস্টোরি', path: '/history' },
    { icon: Settings, label: 'সেটিংস', path: '/settings' }, // We can make this open the modal or a page
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] md:hidden bg-slate-900/80 backdrop-blur-xl border-t border-white/5 px-6 pb-6 pt-3 flex items-center justify-between safe-area-bottom">
      {navItems.map((item, index) => (
        <NavLink
          key={index}
          to={item.path}
          className={({ isActive }) => cn(
            "flex flex-col items-center gap-1 transition-all duration-300",
            isActive ? "text-purple-400 scale-110" : "text-slate-500 hover:text-slate-300"
          )}
        >
          <item.icon size={20} className={cn("transition-transform", "active:scale-90")} />
          <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNav;
