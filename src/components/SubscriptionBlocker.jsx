import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Zap, ShieldCheck, CreditCard, LogOut } from 'lucide-react';
import api from '../utils/axios';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';

const SubscriptionBlocker = ({ children }) => {
  const { user, logout } = useAuth();
  const { showAlert } = useUI();
  const [currentPlan, setCurrentPlan] = useState(null);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [daysLeftState, setDaysLeftState] = useState(0);
  const [hasDismissedWarning, setHasDismissedWarning] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Exclude superadmin
  const isSuperadmin = user?.role === 'Master Admin' || user?.role === 'superadmin';

  const checkSubscription = async () => {
    if (isSuperadmin) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/settings/current-plan');
      const setRes = await api.get('/settings/global');
      setCurrentPlan(res.data);
      let isExp = false;
      if (res.data) {
          let endDateEnd = null;
          if (res.data.created_at) {
              endDateEnd = new Date(res.data.created_at);
              let addDays = 30;
              if (res.data.billing_cycle === 'quarterly') addDays = 90;
              else if (res.data.billing_cycle === 'half-yearly') addDays = 180;
              else if (res.data.billing_cycle === 'annually') addDays = 365;
              endDateEnd.setDate(endDateEnd.getDate() + addDays);
          } else if (res.data.end_date) {
              endDateEnd = new Date(res.data.end_date);
              endDateEnd.setHours(23, 59, 59, 999);
          }
          isExp = !endDateEnd || endDateEnd < new Date();

          if (!isExp && endDateEnd) {
              const timeDiff = endDateEnd - new Date();
              const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
              setDaysLeftState(daysLeft);
              
              const sysNotif = setRes.data?.notifications || {};
              let shouldWarn = false;
              if (daysLeft <= 7 && daysLeft > 3 && sysNotif.systemCompanyExpiry) shouldWarn = true;
              else if (daysLeft <= 3 && daysLeft > 1 && sysNotif.systemExpiry3Day) shouldWarn = true;
              else if (daysLeft <= 1 && daysLeft > 0 && sysNotif.systemExpiry1Day) shouldWarn = true;
              
              if (shouldWarn && !hasDismissedWarning) {
                  const seenKey = `hasSeenExpiryWarning_${daysLeft}`;
                  if (!sessionStorage.getItem(seenKey)) {
                      setShowWarning(true);
                  }
              }
          }
      }
      
      if (isExp) {
        fetchPlans();
      }
    } catch (err) {
      console.error('Error fetching subscription status', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const res = await api.get('/plans');
      setAvailablePlans(res.data || []);
    } catch (err) {
      console.error('Error fetching plans', err);
    }
  };

  useEffect(() => {
    checkSubscription();
    const interval = setInterval(checkSubscription, 5000);
    const handleUpdate = () => checkSubscription();
    window.addEventListener('subscription_updated', handleUpdate);
    return () => {
        clearInterval(interval);
        window.removeEventListener('subscription_updated', handleUpdate);
    };
  }, [user]);

  const handlePlanRequest = async () => {
    if (!selectedPlan) return;
    setIsRequesting(true);
    try {
      await api.post('/settings/plan-request', { plan: selectedPlan });
      showAlert('Renewal request sent successfully! Waiting for admin approval.', 'success');
    } catch (err) {
      showAlert(err.response?.data?.error || 'Failed to process renewal.', 'error');
    } finally {
      setIsRequesting(false);
    }
  };

  if (loading || isSuperadmin) return children;

  let endDateEnd = null;
  if (currentPlan?.created_at) {
      endDateEnd = new Date(currentPlan.created_at);
      const addDays = currentPlan.billing_cycle === 'annually' ? 365 : currentPlan.billing_cycle === 'quarterly' ? 90 : currentPlan.billing_cycle === 'half-yearly' ? 180 : 30;
      endDateEnd.setDate(endDateEnd.getDate() + addDays);
  } else if (currentPlan?.end_date) {
      endDateEnd = new Date(currentPlan.end_date);
      endDateEnd.setHours(23, 59, 59, 999);
  }
  const isExpired = !endDateEnd || endDateEnd < new Date();

  if (!isExpired) {
    return (
      <>
        {children}
        {showWarning && (
          <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden relative"
            >
              <div className="bg-amber-500 p-6 flex flex-col items-center justify-center text-white relative">
                <AlertTriangle size={40} className="mb-2" />
                <h3 className="text-xl font-black uppercase tracking-tight">Subscription Expiring</h3>
              </div>
              <div className="p-8 text-center">
                <p className="text-slate-600 font-medium leading-relaxed mb-6">
                  Your company's subscription to Nexus HRM is expiring in <span className="font-black text-amber-600">{daysLeftState} day{daysLeftState !== 1 ? 's' : ''}</span>. 
                  Please renew your plan soon to avoid any interruption in service.
                </p>
                <button
                  onClick={() => {
                    sessionStorage.setItem(`hasSeenExpiryWarning_${daysLeftState}`, 'true');
                    setHasDismissedWarning(true);
                    setShowWarning(false);
                  }}
                  className="w-full py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all"
                >
                  I Understand, Dismiss
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </>
    );
  }

  // The massive lock screen
  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto custom-scrollbar">
      {/* Back to Login Button */}
      <div className="absolute top-6 right-6 z-[10000]">
        <button 
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-xl text-white font-bold text-sm transition-all shadow-lg"
        >
          <LogOut size={16} />
          Switch Company / Logout
        </button>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl shadow-rose-500/20 overflow-hidden flex flex-col md:flex-row relative"
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

        {/* Left Side: Warning */}
        <div className="md:w-1/3 bg-gradient-to-b from-rose-500 to-rose-700 p-10 flex flex-col items-center justify-center text-center text-white relative z-10">
          <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-6 shadow-inner backdrop-blur-md">
            <AlertTriangle size={48} className="text-white" />
          </div>
          <h2 className="text-3xl font-black mb-2 uppercase tracking-tight">Subscription Expired</h2>
          <p className="text-rose-100 font-medium text-sm opacity-90 leading-relaxed">
            Your company's subscription to Nexus HRM has ended. All dashboard access is temporarily locked until the plan is renewed.
          </p>
        </div>

        {/* Right Side: Renewal Action */}
        <div className="md:w-2/3 p-10 bg-white relative z-10 flex flex-col justify-center">
          <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
            <CreditCard className="text-primary" /> Renew Your Plan
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {availablePlans.map(plan => (
              <div 
                key={plan.id}
                onClick={() => setSelectedPlan(plan.name)}
                className={`cursor-pointer relative overflow-hidden rounded-2xl p-5 border-2 transition-all duration-300 ${
                  selectedPlan === plan.name 
                    ? 'border-primary bg-primary/5 shadow-md shadow-primary/10 scale-[1.02]' 
                    : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="text-lg font-black text-slate-800">{plan.name}</h4>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{plan.duration}</p>
                  </div>
                  <div className="text-lg font-black text-slate-800">${parseFloat(plan.price || 0).toFixed(2)}</div>
                </div>
                <div className="space-y-2">
                  {JSON.parse(plan.features || '[]').slice(0, 3).map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/40"></div>
                      <span className="truncate">{f}</span>
                    </div>
                  ))}
                </div>
                {/* Selected Indicator */}
                <div className={`absolute top-3 right-3 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                  selectedPlan === plan.name ? 'border-primary bg-primary' : 'border-slate-200'
                }`}>
                  {selectedPlan === plan.name && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={handlePlanRequest}
            disabled={isRequesting || !selectedPlan}
            className="w-full btn-primary px-8 py-4 flex items-center justify-center gap-2 shadow-xl shadow-primary/30 relative overflow-hidden group rounded-2xl text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
            {isRequesting ? <Zap size={22} className="animate-pulse" /> : <ShieldCheck size={22} />}
            <span className="font-black relative z-10">{isRequesting ? 'Submitting...' : 'Confirm Renewal & Unlock'}</span>
          </button>
          
          <p className="text-center mt-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Please contact system administrator if you need urgent access
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default SubscriptionBlocker;
