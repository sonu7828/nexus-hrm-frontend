import React, { useState, useEffect } from 'react';
import api from '../../utils/axios';
import { 
  Clock, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  Building, 
  Delete,
  XCircle,
  HelpCircle,
  ScanFace,
  Grid3x3,
  Maximize,
  Minimize,
  Calendar,
  LogOut,
  Shield,
  ShieldCheck,
  Lock,
  Unlock,
  Key,
  Settings,
  Sparkles,
  Smartphone,
  Check,
  Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import FaceScanner from '../../components/face/FaceScanner';

const KioskMode = () => {
  // Standalone Activation State
  const [isActivated, setIsActivated] = useState(() => Boolean(localStorage.getItem('kiosk_token')));
  const [companyName, setCompanyName] = useState(() => localStorage.getItem('kiosk_company_name') || '');
  const [terminalDeviceName, setTerminalDeviceName] = useState(() => localStorage.getItem('kiosk_device_name') || 'Main Terminal');

  // Activation Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginDeviceName, setLoginDeviceName] = useState('Reception Tablet');
  const [isActivating, setIsActivating] = useState(false);
  const [activationError, setActivationError] = useState('');

  // Terminal Settings
  const [settings, setSettings] = useState({ kiosk_name: 'Reception Tablet A', branch: 'Main Branch', status: 'Active', face_recognition: 1 });
  const [time, setTime] = useState(new Date());
  
  // Punch Flow States: 1 = Enter ID/Face, 2 = Verify Employee, 3 = Success Screen, 4 = Already Punched
  const [step, setStep] = useState(1);
  const [employeeId, setEmployeeId] = useState('');
  const [verifiedEmployee, setVerifiedEmployee] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successData, setSuccessData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [todayHoliday, setTodayHoliday] = useState(null);
  const [inputMode, setInputMode] = useState('pin'); // 'pin' or 'face'
  const [resetKey, setResetKey] = useState(0);
  const [punchStatus, setPunchStatus] = useState(null); // null | 'needs_checkin' | 'needs_checkout' | 'done'
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  // Admin Security Gate Modal (For Settings & Tablet Exit)
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [adminModalLoading, setAdminModalLoading] = useState(false);
  const [adminModalError, setAdminModalError] = useState('');
  const [adminModalSuccess, setAdminModalSuccess] = useState('');

  // Fullscreen sync
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error('Error attempting to enable fullscreen:', err.message);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Time ticking clock
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Kiosk settings from API when activated
  useEffect(() => {
    if (isActivated) {
      fetchSettings();
    }
  }, [isActivated]);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/kiosk/settings');
      if (response.data) {
        setSettings(response.data);
        if (Number(response.data.face_recognition) === 0) {
          setInputMode('pin');
        }
      }
      
      const hRes = await api.get('/attendance/holidays');
      const todayStr = new Date().toISOString().split('T')[0];
      const holiday = hRes.data.find(h => h.holiday_date && new Date(h.holiday_date).toISOString().split('T')[0] === todayStr);
      
      if (holiday) {
        setTodayHoliday(holiday.holiday_name);
      }
    } catch (err) {
      console.error('Error fetching kiosk settings/holidays:', err);
    }
  };

  const isFaceEnabled = settings.face_recognition !== undefined && settings.face_recognition !== null
    ? (Number(settings.face_recognition) === 1 || settings.face_recognition === true || settings.face_recognition === '1')
    : true;

  // Standalone Activation Handler
  const handleActivateTerminal = async (e) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setActivationError('Please enter company admin email and password.');
      return;
    }

    try {
      setIsActivating(true);
      setActivationError('');

      const response = await api.post('/kiosk/login', {
        email: loginEmail.trim(),
        password: loginPassword,
        deviceName: loginDeviceName.trim() || 'Tablet Terminal'
      });

      if (response.data && response.data.success) {
        const { token, company, settings: newSettings } = response.data;
        localStorage.setItem('kiosk_token', token);
        localStorage.setItem('kiosk_company_name', company.name);
        localStorage.setItem('kiosk_device_name', newSettings?.kiosk_name || loginDeviceName);

        setCompanyName(company.name);
        setTerminalDeviceName(newSettings?.kiosk_name || loginDeviceName);
        if (newSettings) setSettings(newSettings);

        setIsActivated(true);
        setLoginPassword('');
      } else {
        setActivationError(response.data?.message || 'Failed to activate terminal.');
      }
    } catch (err) {
      console.error('Activation error:', err);
      setActivationError(err.response?.data?.message || 'Invalid credentials or company account not found.');
    } finally {
      setIsActivating(false);
    }
  };

  // Keyboard keypad inputs helper
  const handleKeypadPress = (val) => {
    setErrorMsg('');
    if (val === 'clear') {
      setEmployeeId('');
    } else if (val === 'backspace') {
      setEmployeeId(prev => prev.slice(0, -1));
    } else {
      if (employeeId.length < 10) {
        setEmployeeId(prev => prev + val);
      }
    }
  };

  // Step 1: Verify employee ID securely via dedicated backend endpoint
  const handleVerify = async () => {
    if (!employeeId.trim()) {
      setErrorMsg('Please enter an employee ID.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      
      const response = await api.post('/kiosk/verify-employee', {
        employeeId: employeeId.trim()
      });

      if (response.data && response.data.success) {
        setVerifiedEmployee(response.data.employee);
        setPunchStatus(response.data.punchStatus || 'needs_checkin');
        setStep(2);
      } else {
        setErrorMsg(response.data?.message || 'Employee not found.');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Employee ID not found or inactive.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Register Punch Action
  const handlePunch = async (actionType) => {
    try {
      setIsSubmitting(true);
      setErrorMsg('');

      const response = await api.post('/kiosk/punch', {
        employeeId: verifiedEmployee.custom_id || verifiedEmployee.id,
        type: actionType
      }, {
        headers: { 'x-kiosk-api-key': import.meta.env.VITE_KIOSK_API_KEY || 'kiosk_nexus_2026_secure_key' }
      });

      if (response.data && response.data.success) {
        setSuccessData({
          employee: response.data.employee,
          log: response.data.log
        });
        setStep(3);
        
        // Auto reset to step 1 after 4 seconds
        setTimeout(() => {
          handleReset();
        }, 4000);
      } else {
        if (response.data.message === 'Already punched out for today.') {
          setStep(4);
        } else {
          setErrorMsg(response.data.message || 'Unable to register attendance.');
        }
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message;
      if (errorMessage === 'Already punched out for today.') {
        setStep(4);
      } else {
        setErrorMsg(errorMessage || 'Failed to process attendance.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setEmployeeId('');
    setVerifiedEmployee(null);
    setSuccessData(null);
    setErrorMsg('');
    setPunchStatus(null);
    setResetKey(prev => prev + 1);
  };

  const handleFacePunch = async (descriptorArray, livenessData) => {
    try {
      setIsSubmitting(true);
      setErrorMsg('');

      const response = await api.post('/kiosk/face-punch', {
        descriptor: descriptorArray,
        livenessPassed: livenessData.livenessPassed,
        livenessScore: livenessData.livenessScore
      });

      if (response.data && response.data.success) {
        setSuccessData({
          employee: response.data.employee,
          log: response.data.log
        });
        setStep(3);
        setTimeout(() => {
          handleReset();
        }, 4000);
      } else {
        if (response.data.message === 'Already punched out for today.') {
          setStep(4);
        } else {
          setErrorMsg(response.data.message || 'Face matching failed.');
          setStep(1);
        }
        setResetKey(prev => prev + 1);
      }
    } catch (err) {
      console.error(err);
      const errorMessage = err.response?.data?.message;
      if (errorMessage === 'Already punched out for today.') {
        setStep(4);
      } else {
        setErrorMsg(errorMessage || 'Server error. Please try again.');
        setStep(1);
      }
      setResetKey(prev => prev + 1);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Admin Security Gate Handlers
  const handleAdminUnlock = async (e) => {
    e.preventDefault();
    if (!adminPassword) {
      setAdminModalError('Please enter admin password.');
      return;
    }

    try {
      setAdminModalLoading(true);
      setAdminModalError('');

      const res = await api.post('/kiosk/exit', {
        password: adminPassword,
        action: 'verify'
      });

      if (res.data && res.data.success) {
        setIsAdminUnlocked(true);
        setAdminModalSuccess('Admin verified. Terminal unlocked.');
        setTimeout(() => setAdminModalSuccess(''), 2500);
      } else {
        setAdminModalError('Incorrect admin password.');
      }
    } catch (err) {
      setAdminModalError(err.response?.data?.message || 'Incorrect admin password.');
    } finally {
      setAdminModalLoading(false);
    }
  };

  const handleToggleFaceRecognition = async (enabled) => {
    try {
      setAdminModalLoading(true);
      await api.put('/kiosk/settings', {
        ...settings,
        face_recognition: enabled ? 1 : 0
      });
      setSettings(prev => ({ ...prev, face_recognition: enabled ? 1 : 0 }));
      if (!enabled) setInputMode('pin');
      setAdminModalSuccess(`Face recognition turned ${enabled ? 'ON' : 'OFF'}.`);
      setTimeout(() => setAdminModalSuccess(''), 2000);
    } catch (err) {
      setAdminModalError('Failed to update face settings.');
    } finally {
      setAdminModalLoading(false);
    }
  };

  const handleDeactivateTerminal = async () => {
    if (!adminPassword) {
      setAdminModalError('Please enter admin password to deactivate.');
      return;
    }

    try {
      setAdminModalLoading(true);
      setAdminModalError('');

      const res = await api.post('/kiosk/exit', {
        password: adminPassword
      });

      if (res.data && res.data.success) {
        localStorage.removeItem('kiosk_token');
        localStorage.removeItem('kiosk_company_name');
        localStorage.removeItem('kiosk_device_name');
        setIsActivated(false);
        setShowAdminModal(false);
        setIsAdminUnlocked(false);
        setAdminPassword('');
        handleReset();
      } else {
        setAdminModalError('Failed to deactivate terminal.');
      }
    } catch (err) {
      setAdminModalError(err.response?.data?.message || 'Incorrect password. Cannot exit.');
    } finally {
      setAdminModalLoading(false);
    }
  };

  const formatClockTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  };

  const formatClockDate = (date) => {
    return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  // --------------------------------------------------------------------------
  // SCREEN 1: Standalone Kiosk Pairing / Activation Screen
  // --------------------------------------------------------------------------
  // --------------------------------------------------------------------------
  // SCREEN 1: Standalone Kiosk Pairing / Activation Screen
  // --------------------------------------------------------------------------
  if (!isActivated) {
    return (
      <div className="min-h-screen bg-[#070b14] text-white flex flex-col items-center justify-between p-4 sm:p-6 relative overflow-hidden font-sans select-none">
        {/* Dynamic Glow Blobs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-indigo-600/15 blur-[130px] pointer-events-none"></div>
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-blue-600/15 blur-[130px] pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-indigo-500/5 blur-[140px] pointer-events-none"></div>

        {/* Centered Constrained Container (never stretches full-width) */}
        <div className="w-full max-w-[440px] mx-auto flex flex-col justify-between flex-1 py-2 sm:py-4 z-10" style={{ maxWidth: '440px' }}>
          
          {/* Top Header */}
          <header className="flex items-center justify-between pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center shadow-lg shadow-indigo-600/30">
                <Smartphone size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-xs font-black uppercase tracking-wider text-white">Standalone Tablet Mode</h1>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Nexus HRM Attendance Terminal</p>
              </div>
            </div>
            <button 
              onClick={toggleFullscreen}
              className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors border border-white/5"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
            </button>
          </header>

          {/* Center Pairing Card */}
          <main className="my-auto py-2">
            <motion.div 
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-[#0f172a]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5"
            >
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
                  <Lock size={26} />
                </div>
                <h2 className="text-xl font-black uppercase tracking-tight text-white">Pair Terminal</h2>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  Enter company admin credentials once to lock this device into a dedicated, tamper-proof attendance kiosk.
                </p>
              </div>

              {activationError && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex items-center gap-2.5 text-rose-400 text-xs font-bold"
                >
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{activationError}</span>
                </motion.div>
              )}

              <form onSubmit={handleActivateTerminal} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                    Company Admin Email
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="admin@company.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                    Admin Password
                  </label>
                  <div className="relative">
                    <Key size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                    Device Identifier (Optional)
                  </label>
                  <div className="relative">
                    <Smartphone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={loginDeviceName}
                      onChange={(e) => setLoginDeviceName(e.target.value)}
                      placeholder="e.g. Reception Tablet, Front Gate"
                      className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="bg-indigo-950/40 border border-indigo-500/20 rounded-xl p-3 text-[10px] text-indigo-300 leading-relaxed font-semibold flex items-start gap-2.5">
                  <ShieldCheck size={16} className="text-indigo-400 shrink-0 mt-0.5" />
                  <span>
                    Zero Admin Access: Workers punching on this tablet will have zero access to payroll, employee records, or management dashboards.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isActivating}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                >
                  {isActivating ? (
                    <>
                      <Sparkles size={16} className="animate-spin" />
                      Pairing Device...
                    </>
                  ) : (
                    <>
                      <Lock size={16} />
                      Activate & Lock Terminal
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </main>

          {/* Footer */}
          <footer className="text-center pt-3">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
              Nexus HRM Pro • Standalone Kiosk Terminal Architecture
            </p>
          </footer>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // SCREEN: Holiday Interceptor
  // --------------------------------------------------------------------------
  if (todayHoliday) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-fuchsia-500/10 blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-purple-500/10 blur-[100px] pointer-events-none"></div>
        
        <div className="max-w-md w-full text-center space-y-6 z-10">
          <div className="w-24 h-24 bg-gradient-to-tr from-fuchsia-600 to-purple-600 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-fuchsia-500/20 border-4 border-slate-950">
            <Calendar size={48} className="text-white" />
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-purple-400">Holiday Today</h1>
            <p className="text-xl font-bold text-white leading-tight">{todayHoliday}</p>
          </div>
          <p className="text-sm font-semibold text-slate-400 leading-relaxed bg-white/5 p-5 rounded-2xl border border-white/5">
            Attendance marking is suspended for today due to a public holiday. Enjoy your day off!
          </p>
          <div className="pt-4 flex items-center justify-center gap-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
              <Clock size={12} /> {formatClockTime(time)}
            </p>
            <button
              onClick={() => setShowAdminModal(true)}
              className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-300 underline"
            >
              Admin Controls
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // SCREEN: Terminal Inactive Interceptor
  // --------------------------------------------------------------------------
  if (settings.status === 'Inactive') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-rose-500/10 blur-[100px] pointer-events-none"></div>
        
        <div className="max-w-md w-full text-center space-y-6 z-10">
          <div className="w-20 h-20 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-rose-500/10">
            <XCircle size={40} className="animate-pulse" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black uppercase tracking-tight">Terminal Suspended</h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-rose-400">Status: Inactive</p>
          </div>
          <p className="text-sm font-semibold text-slate-400 leading-relaxed bg-white/5 p-5 rounded-2xl border border-white/5">
            This tablet kiosk terminal (<span className="text-white font-bold">{settings.kiosk_name}</span>) has been marked inactive. Please contact the company administration.
          </p>
          <button
            onClick={() => setShowAdminModal(true)}
            className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-xs font-black uppercase tracking-widest rounded-xl transition-all"
          >
            Open Admin Gate
          </button>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // MAIN ACTIVE KIOSK INTERFACE
  // --------------------------------------------------------------------------
  return (
    <div className="h-screen max-h-screen bg-[#070b14] text-white flex flex-col items-center justify-between p-3 sm:p-5 relative overflow-hidden font-sans select-none">
      
      {/* Dynamic Glow Background Blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[350px] h-[350px] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[350px] h-[350px] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none"></div>

      {/* Centered Constrained Terminal Frame */}
      <div className="w-full max-w-[460px] mx-auto flex flex-col h-full justify-between z-10" style={{ maxWidth: '460px' }}>

        {/* Header bar */}
        <header className="flex items-center justify-between gap-2 border-b border-white/5 pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={toggleFullscreen}
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors border border-white/5"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
            </button>
            
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <Building size={16} className="text-white" />
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-black tracking-tight uppercase leading-none">{settings.kiosk_name || terminalDeviceName}</h2>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Terminal Live"></span>
              </div>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1 flex items-center gap-1">
                <Building size={8} /> {companyName || settings.branch || 'Company Terminal'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <h1 className="text-lg md:text-xl font-black font-mono tracking-tight text-white/95 leading-none">
                {formatClockTime(time)}
              </h1>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">
                {formatClockDate(time)}
              </p>
            </div>

            {/* Admin Security Gate Trigger */}
            <button
              onClick={() => {
                setAdminModalError('');
                setShowAdminModal(true);
              }}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all border border-white/5"
              title="Admin Terminal Lock"
            >
              <Shield size={16} />
            </button>
          </div>
        </header>

        {/* Main Punch Container */}
        <main className="flex-1 flex items-center justify-center py-2 overflow-hidden">
          <div className="w-full max-w-[420px] mx-auto" style={{ maxWidth: '420px' }}>
            <AnimatePresence mode="wait">
            
            {/* Step 1: Input ID / Face */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="space-y-0.5">
                    <h3 className="text-lg font-black uppercase tracking-wide">
                      {!isFaceEnabled || inputMode === 'pin' ? 'Enter Employee ID' : 'Face Recognition'}
                    </h3>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                      {!isFaceEnabled || inputMode === 'pin' ? 'Use your employee code or terminal ID' : 'Center your face in the frame'}
                    </p>
                  </div>
                  {isFaceEnabled && (
                    <button
                      onClick={() => setInputMode(inputMode === 'pin' ? 'face' : 'pin')}
                      className="flex items-center gap-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 px-3 py-1.5 rounded-lg transition-colors text-[10px] font-bold uppercase tracking-widest"
                    >
                      {inputMode === 'pin' ? <ScanFace size={14} /> : <Grid3x3 size={14} />}
                      {inputMode === 'pin' ? 'Use Face' : 'Use PIN'}
                    </button>
                  )}
                </div>

                {inputMode === 'face' && isFaceEnabled ? (
                  <div className="space-y-4">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl p-4 shadow-2xl relative overflow-hidden flex flex-col items-center">
                      <FaceScanner key={resetKey} onFaceDetected={handleFacePunch} mode="attendance" />
                    </div>
                    {/* Error Box for Face Scan */}
                    {errorMsg && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-5 flex flex-col items-center justify-center gap-3 text-rose-400 w-full shadow-lg shadow-rose-500/10"
                      >
                        <AlertCircle size={36} className="shrink-0 animate-pulse" />
                        <p className="text-sm font-black uppercase tracking-widest text-center leading-tight">{errorMsg}</p>
                      </motion.div>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Display Screen */}
                    <div className="bg-slate-900 border border-white/10 rounded-2xl p-3.5 shadow-2xl relative overflow-hidden">
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] font-black uppercase tracking-widest text-indigo-400">EMPLOYEE ID</span>
                        {employeeId && (
                          <button 
                            onClick={() => handleKeypadPress('clear')}
                            className="text-[8px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <div className="h-10 flex items-center justify-center mt-1">
                        {employeeId ? (
                          <span className="text-3xl font-black tracking-widest font-mono text-white">
                            {employeeId}
                          </span>
                        ) : (
                          <span className="text-xl font-bold text-slate-600 animate-pulse uppercase tracking-wider">
                            Enter ID Code
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Error Box */}
                    {errorMsg && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center justify-center gap-3 text-rose-400"
                      >
                        <AlertCircle size={20} className="shrink-0" />
                        <p className="text-xs font-black uppercase tracking-widest">{errorMsg}</p>
                      </motion.div>
                    )}

                    {/* Numeric Touch Keypad */}
                    <div className="grid grid-cols-3 gap-2 bg-white/5 border border-white/5 p-3 rounded-2xl backdrop-blur-xl">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <button
                          key={num}
                          onClick={() => handleKeypadPress(num.toString())}
                          className="h-12 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 active:scale-95 transition-all text-lg font-black font-mono shadow-md flex items-center justify-center"
                        >
                          {num}
                        </button>
                      ))}
                      
                      {/* Backspace */}
                      <button
                        onClick={() => handleKeypadPress('backspace')}
                        className="h-12 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 active:scale-95 transition-all text-rose-400 flex items-center justify-center font-bold"
                      >
                        <Delete size={18} />
                      </button>

                      {/* Zero */}
                      <button
                        onClick={() => handleKeypadPress('0')}
                        className="h-12 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 active:scale-95 transition-all text-lg font-black font-mono flex items-center justify-center"
                      >
                        0
                      </button>

                      {/* Proceed */}
                      <button
                        onClick={handleVerify}
                        disabled={isSubmitting}
                        className="h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 active:scale-95 disabled:opacity-50 transition-all text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/25 flex items-center justify-center"
                      >
                        {isSubmitting ? '...' : 'Next'}
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* Step 2: Verify & Option Selection */}
            {step === 2 && verifiedEmployee && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-4"
              >
                <div className="text-center space-y-0.5">
                  <h3 className="text-lg font-black uppercase tracking-wide">Confirm Attendance</h3>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                    Verify employee details and select punch option
                  </p>
                </div>

                {/* Profile Card */}
                <div className="bg-slate-900 border border-white/10 rounded-2xl p-4 shadow-2xl space-y-3 text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2">
                    <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded text-[8px] font-black tracking-widest uppercase">
                      ID: {verifiedEmployee.custom_id}
                    </span>
                  </div>

                  <div className="w-16 h-16 rounded-full border-2 border-indigo-500/30 overflow-hidden mx-auto shadow-md">
                    {verifiedEmployee.photo ? (
                      <img src={verifiedEmployee.photo} alt={verifiedEmployee.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold">
                        <User size={24} />
                      </div>
                    )}
                  </div>

                  <div className="space-y-0.5">
                    <h4 className="text-lg font-black tracking-tight text-white">{verifiedEmployee.name}</h4>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                      {verifiedEmployee.department || 'Staff'} • ID {verifiedEmployee.custom_id}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 gap-3">
                  {punchStatus === 'needs_checkin' && (
                    <button
                      onClick={() => handlePunch('Punch In')}
                      disabled={isSubmitting}
                      className="h-20 md:h-24 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 active:scale-95 transition-all shadow-xl shadow-emerald-600/15 flex flex-col items-center justify-center gap-1.5 border border-emerald-500/10"
                    >
                      <CheckCircle2 size={24} />
                      <span className="text-[10px] font-black uppercase tracking-widest text-white">
                        {isSubmitting ? 'Registering...' : 'Check In'}
                      </span>
                    </button>
                  )}

                  {punchStatus === 'needs_checkout' && (
                    <button
                      onClick={() => setShowCheckoutModal(true)}
                      disabled={isSubmitting}
                      className="h-20 md:h-24 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 active:scale-95 transition-all shadow-xl shadow-orange-600/15 flex flex-col items-center justify-center gap-1.5 border border-orange-500/10"
                    >
                      <XCircle size={24} />
                      <span className="text-[10px] font-black uppercase tracking-widest text-white">
                        {isSubmitting ? 'Registering...' : 'Check Out'}
                      </span>
                    </button>
                  )}

                  {punchStatus === 'done' && (
                    <div className="h-20 md:h-24 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-1.5">
                      <CheckCircle2 size={24} className="text-emerald-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Already Checked In & Out Today</span>
                    </div>
                  )}
                </div>

                {/* Cancel Button */}
                <button
                  onClick={handleReset}
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <ArrowLeft size={12} />
                  Cancel & Go Back
                </button>
              </motion.div>
            )}

            {/* Step 3: Success Screen */}
            {step === 3 && successData && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center space-y-4"
              >
                <div className="relative w-20 h-20 mx-auto">
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1.1, opacity: 1 }}
                    transition={{ repeat: Infinity, repeatType: 'reverse', duration: 1.5 }}
                    className="absolute inset-0 rounded-full bg-emerald-500/10 border border-emerald-500/20"
                  ></motion.div>
                  <div className="absolute inset-1.5 bg-gradient-to-tr from-emerald-600 to-teal-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-600/20 border border-emerald-500/20">
                    <CheckCircle2 size={32} className="text-white" />
                  </div>
                </div>

                <div className="space-y-0.5">
                  <h3 className="text-xl font-black uppercase tracking-tight text-emerald-400">Attendance Logged</h3>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                    Your request was recorded successfully
                  </p>
                </div>

                <div className="bg-slate-900 border border-white/10 rounded-2xl p-4 shadow-2xl space-y-3 max-w-sm mx-auto text-left relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3">
                    <span className={`px-4 py-1.5 rounded-lg text-[12px] font-black tracking-widest uppercase ${
                      successData.log.action === 'Punch In' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/10' : 'bg-orange-500/20 text-orange-400 border border-orange-500/30 shadow-lg shadow-orange-500/10'
                    }`}>
                      {successData.log.action === 'Punch In' ? 'Checked In' : 'Checked Out'}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    <div className="border-b border-white/5 pb-2.5">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Employee</p>
                      <h4 className="text-base font-black text-white mt-1 leading-none">{successData.employee.name}</h4>
                      <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 leading-none">ID {successData.employee.custom_id}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Recorded Time</p>
                        <p className="text-xs font-black font-mono text-white mt-1 leading-none">{successData.log.time}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Status Rating</p>
                        <p className={`text-[10px] font-black uppercase tracking-wide mt-1 leading-none ${successData.log.status === 'Late' ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                          {successData.log.status}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/5">
                      <p className="text-[8px] font-bold text-slate-400 uppercase leading-none">
                        Device: <span className="text-white font-black">{successData.log.device}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleReset}
                  className="w-full py-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={14} /> Back to Terminal
                </button>
              </motion.div>
            )}

            {/* Step 4: Already Punched Out Screen */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center space-y-4"
              >
                <div className="relative w-20 h-20 mx-auto">
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1.1, opacity: 1 }}
                    transition={{ repeat: Infinity, repeatType: 'reverse', duration: 1.5 }}
                    className="absolute inset-0 rounded-full bg-amber-500/10 border border-amber-500/20"
                  ></motion.div>
                  <div className="absolute inset-1.5 bg-gradient-to-tr from-amber-600 to-orange-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-amber-600/20 border border-amber-500/20">
                    <AlertCircle size={32} className="text-white" />
                  </div>
                </div>

                <div className="space-y-0.5">
                  <h3 className="text-xl font-black uppercase tracking-tight text-amber-400">Already Punched Out</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">
                    You have already completed your punch out for today.
                  </p>
                </div>

                <button
                  onClick={handleReset}
                  className="w-full mt-6 py-3 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-lg active:scale-95 border border-white/10"
                >
                  <ArrowLeft size={14} />
                  {!isFaceEnabled ? 'Back to PIN Entry' : 'Back to PIN or Face'}
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="text-center z-10 pt-3 border-t border-white/5 shrink-0 flex items-center justify-between px-2">
        <p className="text-[8px] font-black uppercase tracking-[0.25em] text-slate-500 flex items-center gap-1.5 leading-none">
          Nexus HRM Pro • Standalone Tablet Terminal
        </p>
        <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-1">
          <ShieldCheck size={10} className="text-emerald-500" /> Isolated Kiosk Sandbox
        </span>
      </footer>
      </div>

      {/* Confirmation Modal for Punch Out */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-white/10 text-center space-y-6"
            style={{ maxWidth: '420px' }}
          >
            <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mx-auto border border-rose-500/20 shadow-lg shadow-rose-500/10">
              <LogOut size={32} />
            </div>
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight">Confirm Check-Out</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed font-medium">
                Are you sure you want to check out for today? This will record your end time for the day.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCheckoutModal(false)}
                className="py-3.5 px-4 bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-black uppercase tracking-wider rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCheckoutModal(false);
                  handlePunch('Punch Out');
                }}
                className="py-3.5 px-4 bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-rose-500/20 active:scale-95 transition-all"
              >
                Yes, Check-Out
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* ADMIN SECURITY GATE MODAL                                             */}
      {/* --------------------------------------------------------------------- */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-white/10 space-y-6"
            style={{ maxWidth: '440px' }}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black uppercase tracking-tight text-white">Admin Terminal Gate</h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Master Security Protection</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAdminModal(false);
                  setIsAdminUnlocked(false);
                  setAdminPassword('');
                  setAdminModalError('');
                  setAdminModalSuccess('');
                }}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {adminModalError && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex items-center gap-2.5 text-rose-400 text-xs font-bold">
                <AlertCircle size={16} className="shrink-0" />
                <span>{adminModalError}</span>
              </div>
            )}

            {adminModalSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-2.5 text-emerald-400 text-xs font-bold">
                <Check size={16} className="shrink-0" />
                <span>{adminModalSuccess}</span>
              </div>
            )}

            {!isAdminUnlocked ? (
              /* Step A: Password Protection */
              <form onSubmit={handleAdminUnlock} className="space-y-4">
                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                  Enter your company admin password to configure terminal features or release this tablet from kiosk mode.
                </p>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                    Admin Password
                  </label>
                  <input
                    type="password"
                    required
                    autoFocus
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Enter admin password"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAdminModal(false)}
                    className="py-3 px-4 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-black uppercase tracking-wider rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={adminModalLoading}
                    className="py-3 px-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-600/30 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                  >
                    {adminModalLoading ? 'Verifying...' : 'Unlock Gate'}
                  </button>
                </div>
              </form>
            ) : (
              /* Step B: Unlocked Terminal Controls */
              <div className="space-y-5">
                <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Terminal Configuration</span>
                  
                  {/* Face Recognition Toggle */}
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <p className="text-xs font-black text-white">Face Recognition</p>
                      <p className="text-[10px] text-slate-400">Allow AI camera facial scanning</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleFaceRecognition(!isFaceEnabled)}
                      disabled={adminModalLoading}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        isFaceEnabled ? 'bg-indigo-600' : 'bg-slate-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          isFaceEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Deactivate & Exit */}
                <div className="border-t border-white/5 pt-4 space-y-3">
                  <p className="text-[10px] font-bold text-slate-400 leading-relaxed">
                    Need to remove this physical tablet or pair with another account?
                  </p>
                  <button
                    type="button"
                    onClick={handleDeactivateTerminal}
                    disabled={adminModalLoading}
                    className="w-full py-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <LogOut size={16} />
                    Deactivate & Release Tablet
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowAdminModal(false);
                    setIsAdminUnlocked(false);
                    setAdminPassword('');
                  }}
                  className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
                >
                  Return to Scanner Mode
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}

    </div>
  );
};

export default KioskMode;
