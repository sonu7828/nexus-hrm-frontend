import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { Menu, LogOut, FileText, FileSpreadsheet, FileIcon, Settings, Users, ArrowUpRight, ArrowLeft, MoreVertical, Search, Bell, AlertCircle, Info, ChevronRight, CheckCircle2, User, Building, Building2, BellOff, AlertTriangle, Clock, X, ChevronDown, Key, Lock } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { useAuth } from '../context/AuthContext';
import api from '../utils/axios';
import ChatbotWidget from './chatbot/ChatbotWidget';
import SubscriptionBlocker from './SubscriptionBlocker';

const Layout = ({ children, type = 'admin' }) => {
  const { user, updateUser, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [realNotifications, setRealNotifications] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [timeLeftStr, setTimeLeftStr] = useState(null);
  const [isTimeWarning, setIsTimeWarning] = useState(false);
  const [forcePassOld, setForcePassOld] = useState('');
  const [forcePassNew, setForcePassNew] = useState('');
  const [forcePassConfirm, setForcePassConfirm] = useState('');
  const [forcePassError, setForcePassError] = useState('');
  const [forcePassLoading, setForcePassLoading] = useState(false);
  const [showForcePass, setShowForcePass] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleForcePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!forcePassOld || !forcePassNew) {
      setForcePassError('Please fill in all required fields.');
      return;
    }
    if (forcePassNew.length < 6) {
      setForcePassError('New password must be at least 6 characters long.');
      return;
    }
    if (forcePassNew !== forcePassConfirm) {
      setForcePassError('New password and confirm password do not match.');
      return;
    }

    setForcePassLoading(true);
    setForcePassError('');

    try {
      await api.post('/settings/change-password', {
        old_password: forcePassOld,
        new_password: forcePassNew
      });
      updateUser({ must_change_password: false });
    } catch (err) {
      console.error('Password change error:', err);
      setForcePassError(err.response?.data?.error || err.response?.data?.message || 'Failed to update password. Please check your current password.');
    } finally {
      setForcePassLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role !== 'Master Admin' && user.role !== 'superadmin') {
      const fetchPlan = async () => {
        try {
          const res = await api.get('/settings/current-plan');
          setCurrentPlan(res.data);
        } catch (e) {}
      };
      fetchPlan();
      const int = setInterval(fetchPlan, 30000);
      
      const handleUpdate = () => fetchPlan();
      window.addEventListener('subscription_updated', handleUpdate);
      
      return () => {
          clearInterval(int);
          window.removeEventListener('subscription_updated', handleUpdate);
      };
    }
  }, [user]);

  useEffect(() => {
    if (!currentPlan) return;
    
    const updateTimer = () => {
        let endDateEnd = null;
        if (currentPlan.created_at) {
            endDateEnd = new Date(currentPlan.created_at);
            const addDays = currentPlan.billing_cycle === 'annually' ? 365 : 30;
            endDateEnd.setDate(endDateEnd.getDate() + addDays);
        } else if (currentPlan.end_date) {
            endDateEnd = new Date(currentPlan.end_date);
            endDateEnd.setHours(23, 59, 59, 999);
        }
        
        if (!endDateEnd) return;
        const diff = endDateEnd - new Date();
        if (diff > 0) {
            const d = Math.floor(diff / (1000 * 60 * 60 * 24));
            const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const m = Math.floor((diff / (1000 * 60)) % 60);
            const s = Math.floor((diff / 1000) % 60);
            
            if (d === 0 && h === 0) {
                setTimeLeftStr(`${m}m ${s}s left`);
            } else if (d === 0) {
                setTimeLeftStr(`${h}h ${m}m left`);
            } else {
                setTimeLeftStr(`${d}d ${h}h left`);
            }
            setIsTimeWarning(diff <= 3 * 24 * 60 * 60 * 1000);
        } else {
            setTimeLeftStr(null);
            setIsTimeWarning(false);
        }
    };
    
    updateTimer();
    const timerInt = setInterval(updateTimer, 1000);
    return () => clearInterval(timerInt);
  }, [currentPlan]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = () => {
      api.get('/notifications')
        .then(res => setRealNotifications(Array.isArray(res.data) ? res.data : []))
        .catch(err => {
          console.error('Failed to load notifications', err);
          setRealNotifications([]);
        });
  };

  const markAsRead = async (id) => {
      try {
          await api.put(`/notifications/${id}/read`);
          fetchNotifications();
      } catch (err) {
          console.error('Failed to mark as read', err);
      }
  };

  const handleNotificationClick = (n) => {
    if (!n.is_read) {
        markAsRead(n.id);
    }
    setShowNotifications(false);
    
    const title = (n.title || '').toLowerCase();
    let path = null;
    
    if (user?.role === 'superadmin') {
        if (title.includes('password')) path = '/superadmin/companies';
        else if (title.includes('request')) path = '/superadmin/requests';
        else if (title.includes('enquiry') || title.includes('enquiries')) path = '/superadmin/enquiries';
        else if (title.includes('expir') || title.includes('subscription') || title.includes('renew')) path = '/superadmin/companies';
        else path = '/superadmin';
    } else {
        if (title.includes('expir') || title.includes('subscription') || title.includes('renew')) path = `/${user.role}/settings`;
        else if (title.includes('password')) path = `/${user.role}/employees`;
        else if (title.includes('leave')) path = `/${user.role}/leaves`;
        else if (title.includes('claim') || title.includes('expense')) path = `/${user.role}/claims`;
        else path = `/${user.role}`;
    }
    
    if (path && location.pathname !== path) {
        navigate(path);
    }
  };

  const markAllAsRead = async () => {
      try {
          await api.put(`/notifications/read-all`);
          fetchNotifications();
      } catch (err) {
          console.error('Failed to mark all as read', err);
      }
  };

  const notificationsList = Array.isArray(realNotifications) ? realNotifications : [];
  const unreadCount = notificationsList.filter(n => !n.is_read).length;

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      {/* Sidebar - Desktop */}
      <div className="hidden lg:block shrink-0 border-r border-slate-200 h-full shadow-sm bg-white z-30 no-print">
        <Sidebar type={type} />
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[40] lg:hidden"
            />
            <motion.div
              initial={{ x: -200 }} animate={{ x: 0 }} exit={{ x: -200 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-[200px] bg-white z-[50] lg:hidden shadow-2xl"
            >

              <Sidebar type={type} onItemClick={() => setMobileMenuOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Refined Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-3 sm:px-6 sticky top-0 z-20 shrink-0 shadow-sm no-print">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-500 hover:bg-slate-50 rounded-xl border border-slate-100"
            >
              <Menu size={22} />
            </button>
            <div className="hidden sm:flex items-center gap-3">
              {timeLeftStr ? (
                <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border ${isTimeWarning ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-100'}`}>
                  <div className={`h-2 w-2 rounded-full animate-pulse ${isTimeWarning ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${isTimeWarning ? 'text-rose-700' : 'text-emerald-700'}`}>
                    {isTimeWarning ? `Renew subscription now • ${timeLeftStr}` : `Plan Active • ${timeLeftStr}`}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-100">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Device Online</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-2.5 rounded-2xl transition-all duration-300 border backdrop-blur-sm shadow-sm ${showNotifications ? 'bg-indigo-500 text-white border-indigo-400 shadow-indigo-200/50' : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border-slate-200 bg-white'}`}
              >
                <Bell size={20} className={unreadCount > 0 ? "animate-[ring_2s_ease-in-out_infinite]" : ""} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] font-black rounded-full border-2 border-white flex items-center justify-center shadow-md">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      onClick={() => setShowNotifications(false)}
                      className="fixed inset-0 z-10 bg-slate-900/5 backdrop-blur-[1px]"
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 15, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 15, scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      className="fixed left-4 right-4 top-16 sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-4 sm:w-96 bg-white/90 backdrop-blur-xl rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-white/50 z-30 overflow-hidden ring-1 ring-slate-900/5"
                    >
                      <div className="p-5 border-b border-slate-100/50 bg-gradient-to-br from-indigo-50/50 to-white/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                            <Bell size={16} className="fill-indigo-100" />
                          </div>
                          <div>
                            <h3 className="font-black text-slate-800 text-sm tracking-tight">Notifications</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5">Alerts & Updates</p>
                          </div>
                        </div>
                        {unreadCount > 0 && (
                            <button onClick={markAllAsRead} className="text-[10px] font-black text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors px-3 py-1.5 rounded-xl border border-indigo-100/50 flex items-center gap-1.5">
                                <CheckCircle2 size={12} /> MARK ALL READ
                            </button>
                        )}
                      </div>
                      <div className="max-h-[28rem] overflow-y-auto custom-scrollbar bg-slate-50/30">
                        {notificationsList.length === 0 ? (
                          <div className="p-12 text-center flex flex-col items-center justify-center">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-300">
                              <BellOff size={28} />
                            </div>
                            <p className="text-slate-500 font-bold text-sm">No new notifications</p>
                            <p className="text-slate-400 text-xs mt-1">You're all caught up!</p>
                          </div>
                        ) : (
                          <div className="p-2 space-y-1">
                            {notificationsList.map((n, i) => (
                              <div key={i} onClick={() => handleNotificationClick(n)} className={`relative p-4 rounded-2xl transition-all cursor-pointer group flex gap-4 ${n.is_read ? 'bg-transparent hover:bg-slate-100/50' : 'bg-white shadow-sm ring-1 ring-indigo-50 hover:shadow-md'}`}>
                                <div className={`shrink-0 h-10 w-10 rounded-full flex items-center justify-center shadow-inner ${
                                  n.type === 'error' ? 'bg-rose-50 text-rose-500' :
                                  n.type === 'warning' ? 'bg-amber-50 text-amber-500' :
                                  n.type === 'success' ? 'bg-emerald-50 text-emerald-500' :
                                  'bg-indigo-50 text-indigo-500'
                                }`}>
                                  {n.type === 'error' ? <AlertCircle size={18} /> : n.type === 'warning' ? <AlertTriangle size={18} /> : n.type === 'success' ? <CheckCircle2 size={18} /> : <Info size={18} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                      <p className={`text-sm font-black truncate transition-colors ${n.is_read ? 'text-slate-700' : 'text-slate-900 group-hover:text-indigo-600'}`}>{n.title}</p>
                                      {!n.is_read && <span className="h-2 w-2 rounded-full bg-indigo-500 shrink-0 mt-1.5 shadow-[0_0_8px_rgba(99,102,241,0.6)]"></span>}
                                  </div>
                                  <p className={`text-xs mt-1 leading-relaxed ${n.is_read ? 'text-slate-500' : 'text-slate-600'}`}>{n.message}</p>
                                  <p className="text-[9px] font-black text-slate-400 mt-2.5 uppercase tracking-widest flex items-center gap-1">
                                      <Clock size={10} /> {new Date(n.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <div className="h-8 w-px bg-slate-200 mx-1"></div>

            <Link to={`/${type}/profile`} className="flex items-center gap-3 pl-1 group bg-slate-50 hover:bg-primary/5 p-1.5 pr-3 rounded-2xl border border-slate-100 transition-all">
              <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shadow-sm group-hover:shadow-md transition-all">
                {user?.photo ? (
                  <img src={user.photo} alt="user" className="w-full h-full object-cover" />
                ) : (
                  <User size={20} className="text-slate-300" />
                )}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-[12px] font-black text-slate-800 leading-none group-hover:text-primary transition-colors uppercase tracking-tight">
                  {user?.name || 'Nexus Admin'}
                </p>
                <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                  {user?.role || 'Master Admin'}
                </p>
              </div>
              <ChevronDown size={14} className="text-slate-400 group-hover:text-primary transition-colors ml-1" />
            </Link>
          </div>
        </header>

        {/* Main Content Area - Medium Density Padding */}
        <SubscriptionBlocker>
          <main className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar p-3 sm:p-5 lg:p-6">
            <div className="max-w-[1600px] mx-auto w-full">
              {children}
            </div>
          </main>
        </SubscriptionBlocker>
      </div>
      
      {/* Floating Chatbot Widget for in-app AI assistance */}
      <ChatbotWidget />

      {/* Force Change Password on First Login Modal */}
      <AnimatePresence>
        {user?.must_change_password && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5"
            >
              <div className="flex items-center gap-3.5 pb-3 border-b border-slate-100">
                <div className="w-11 h-11 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shrink-0">
                  <Lock size={22} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800 leading-tight">First-Time Login Security</h3>
                  <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Please create a new password to continue</p>
                </div>
              </div>

              <form onSubmit={handleForcePasswordSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Current / Temporary Password
                  </label>
                  <input
                    type="password"
                    required
                    value={forcePassOld}
                    onChange={(e) => setForcePassOld(e.target.value)}
                    placeholder="Enter current password (e.g. 123456)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 focus:bg-white focus:border-primary outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    New Secure Password
                  </label>
                  <input
                    type="password"
                    required
                    value={forcePassNew}
                    onChange={(e) => setForcePassNew(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 focus:bg-white focus:border-primary outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={forcePassConfirm}
                    onChange={(e) => setForcePassConfirm(e.target.value)}
                    placeholder="Re-type new password"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 focus:bg-white focus:border-primary outline-none transition-all"
                  />
                </div>

                {forcePassError && (
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2.5 text-rose-700 text-xs font-bold">
                    <AlertCircle size={16} className="shrink-0 text-rose-500" />
                    <span>{forcePassError}</span>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={logout}
                    className="text-xs font-bold text-slate-400 hover:text-slate-600 underline"
                  >
                    Log Out
                  </button>
                  <button
                    type="submit"
                    disabled={forcePassLoading}
                    className="btn-primary py-2.5 px-6 text-xs font-black uppercase tracking-wider flex items-center gap-2"
                  >
                    {forcePassLoading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <Key size={15} />
                        <span>Update Password & Continue</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Layout;
