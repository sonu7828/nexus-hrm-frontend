import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  ShieldAlert,
  ClipboardList,
  Users,
  ChevronRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const SuperAdminSidebar = ({ onItemClick }) => {
  const { user, logout } = useAuth();

  const links = [
    { name: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/superadmin' },
    { name: 'Companies', icon: <Building2 size={18} />, path: '/superadmin/companies' },
    { name: 'Company Requests', icon: <ClipboardList size={18} />, path: '/superadmin/requests' },
    { name: 'Payments & Subs', icon: <CreditCard size={18} />, path: '/superadmin/billing' },
    { name: 'Settings', icon: <Settings size={18} />, path: '/superadmin/settings' },
    { name: 'Profile', icon: <Users size={18} />, path: '/superadmin/profile' },
  ];

  const handleLogout = () => {
    logout();
    if (onItemClick) onItemClick();
    window.location.href = '/login';
  };

  return (
    <div className="w-[230px] bg-white h-full flex flex-col no-print">
      {/* Brand Section */}
      <div className="p-5 border-b border-slate-100 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3 text-primary">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <ShieldAlert size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tighter text-slate-800 uppercase leading-none">
              SuperAdmin
            </h1>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] leading-none mt-1">
              Platform Control
            </p>
          </div>
        </div>
        {/* Mobile Close / Hamburger (only visible if onClose is passed) */}
        {onItemClick && (
          <button onClick={onItemClick} className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto py-6 custom-scrollbar">
        {links.map((link) => (
          <NavLink
            key={link.name}
            to={link.path}
            end
            onClick={onItemClick}
            className={({ isActive }) => `
              flex items-center justify-between px-4 py-3 rounded-2xl transition-all group
              ${isActive ? 'bg-primary text-white shadow-xl shadow-primary/20 translate-x-1' : 'text-slate-500 hover:bg-slate-50 hover:text-primary hover:translate-x-1'}
            `}
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center gap-3">
                  <span className={`shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-primary'}`}>
                    {link.icon}
                  </span>
                  <span className="font-black text-[11px] uppercase tracking-widest leading-none truncate">
                    {link.name}
                  </span>
                </div>
                {isActive && (
                  <motion.div initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }}>
                    <ChevronRight size={14} className="text-white/70" />
                  </motion.div>
                )}
              </>
            )}
          </NavLink>
        ))}
        
        {/* Logout Button directly in the list */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all group text-rose-500 hover:bg-rose-50 hover:translate-x-1"
        >
          <div className="flex items-center gap-3">
            <span className="shrink-0 transition-transform group-hover:scale-110">
              <LogOut size={18} />
            </span>
            <span className="font-black text-[11px] uppercase tracking-widest leading-none truncate mt-[2px]">
              Logout
            </span>
          </div>
        </button>
      </nav>
    </div>
  );
};

export default SuperAdminSidebar;
