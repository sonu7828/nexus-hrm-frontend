import React, { useState, useEffect, useRef } from 'react';
import api from '../../utils/axios';
import { useUI } from '../../context/UIContext';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import {
  Settings as SettingsIcon,
  Cpu,
  Calendar,
  ShieldCheck,
  Save,
  Wifi,
  Fingerprint,
  Globe,
  Clock,
  Lock,
  Zap,
  AlertCircle,
  CreditCard,
  Building,
  Eye,
  EyeOff,
  Mail,
  Send,
  HelpCircle,
  MessageCircle,
  MessageSquare,
  CheckCircle2,
  BookOpen,
  ExternalLink,
  Copy,
  Check,
  X,
  Sparkles,
  ChevronDown,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TIMEZONE_OPTIONS = [
  { value: 'Asia/Singapore', flag: '🇸🇬', country: 'Singapore', label: 'Asia/Singapore', offset: 'GMT +8:00', desc: 'Singapore Standard Time (Recommended)' },
  { value: 'Asia/Kolkata', flag: '🇮🇳', country: 'India', label: 'Asia/Kolkata', offset: 'GMT +5:30', desc: 'India Standard Time (IST)' },
  { value: 'Asia/Dubai', flag: '🇦🇪', country: 'UAE', label: 'Asia/Dubai', offset: 'GMT +4:00', desc: 'Gulf Standard Time' },
  { value: 'Asia/Kuala_Lumpur', flag: '🇲🇾', country: 'Malaysia', label: 'Asia/Kuala_Lumpur', offset: 'GMT +8:00', desc: 'Malaysia Time' },
  { value: 'Asia/Riyadh', flag: '🇸🇦', country: 'Saudi Arabia', label: 'Asia/Riyadh', offset: 'GMT +3:00', desc: 'Arabia Standard Time' },
  { value: 'Asia/Qatar', flag: '🇶🇦', country: 'Qatar', label: 'Asia/Qatar', offset: 'GMT +3:00', desc: 'Qatar Time' },
  { value: 'Europe/London', flag: '🇬🇧', country: 'United Kingdom', label: 'Europe/London', offset: 'GMT / BST', desc: 'British Standard Time' },
  { value: 'America/New_York', flag: '🇺🇸', country: 'USA (Eastern)', label: 'America/New_York', offset: 'EST / EDT', desc: 'Eastern Time' },
  { value: 'America/Chicago', flag: '🇺🇸', country: 'USA (Central)', label: 'America/Chicago', offset: 'CST / CDT', desc: 'Central Time' },
  { value: 'America/Los_Angeles', flag: '🇺🇸', country: 'USA (Pacific)', label: 'America/Los_Angeles', offset: 'PST / PDT', desc: 'Pacific Time' },
  { value: 'Australia/Sydney', flag: '🇦🇺', country: 'Australia', label: 'Australia/Sydney', offset: 'AEST / AEDT', desc: 'Australian Eastern Time' },
  { value: 'Asia/Tokyo', flag: '🇯🇵', country: 'Japan', label: 'Asia/Tokyo', offset: 'JST +9:00', desc: 'Japan Standard Time' },
  { value: 'Asia/Bangkok', flag: '🇹🇭', country: 'Thailand', label: 'Asia/Bangkok', offset: 'ICT +7:00', desc: 'Indochina Time' },
  { value: 'Africa/Johannesburg', flag: '🇿🇦', country: 'South Africa', label: 'Africa/Johannesburg', offset: 'SAST +2:00', desc: 'South Africa Standard Time' },
  { value: 'UTC', flag: '🌐', country: 'Universal', label: 'UTC', offset: 'GMT +0:00', desc: 'Coordinated Universal Time' }
];

const Settings = () => {
  const { showAlert } = useUI();
  const { user, updateUser } = useAuth();
  const { currencySymbol, refreshSettings } = useSettings();
  const [activeTab, setActiveTab] = useState('payroll');
  const [passwordForm, setPasswordForm] = useState({ old_password: '', new_password: '', confirm_password: '' });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState({ old: false, new: false, confirm: false });
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    machine_ip: '',
    machine_port: 4370,
    machine_alias: '',
    sync_interval: 30,
    late_deduction: true,
    late_deduction_amount: 50,
    salary_cycle: '15 Days Cycle',
    salary_cycle_start_date: 1,
    ot_multiplier: 1.5,
    standard_start_time: '08:00',
    admin_password: '',
    business_name: '',
    business_address: '',
    business_phone: '',
    business_email: '',
    grace_period_mins: 15,
    standard_end_time: '17:00',
    weekends: 'Saturday,Sunday',
    timezone: 'Asia/Singapore',
    currency: 'SGD',
    date_format: 'DD/MM/YYYY',
    language: 'English'
  });
  const [currentPlan, setCurrentPlan] = useState(null);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [purgeStatus, setPurgeStatus] = useState({ status: 'idle', message: '' });
  const [forceTimer, setForceTimer] = useState(null);
  const [tick, setTick] = useState(0);

  const [emailSettings, setEmailSettings] = useState({
    smtp_host: '', smtp_port: 587, smtp_user: '', smtp_pass: '', sender_email: '', sender_name: '', is_active: true
  });
  const [isTestingEmail, setIsTestingEmail] = useState(false);

  const [whatsappSettings, setWhatsappSettings] = useState({
    whatsapp_business_account_id: '',
    phone_number_id: '',
    access_token: '',
    template_name: 'payslip_delivery',
    default_country_code: '+65',
    is_enabled: true
  });
  const [showToken, setShowToken] = useState(false);
  const [isTestingWhatsApp, setIsTestingWhatsApp] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [copiedItem, setCopiedItem] = useState('');
  
  // Custom Timezone Dropdown State (Opens downward cleanly)
  const [isTzOpen, setIsTzOpen] = useState(false);
  const [tzSearch, setTzSearch] = useState('');
  const tzDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (tzDropdownRef.current && !tzDropdownRef.current.contains(e.target)) {
        setIsTzOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(key);
    setTimeout(() => setCopiedItem(''), 2000);
  };

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const tabs = [
    { id: 'payroll', label: 'Payroll & Rules', icon: <Calendar size={20} /> },
    { id: 'business', label: 'Business Profile', icon: <Building size={20} /> },
    { id: 'localization', label: 'Localization & Timezone', icon: <Globe size={20} /> },
    { id: 'whatsapp', label: 'WhatsApp Integration', icon: <MessageSquare size={20} /> },
    { id: 'email', label: 'Email SMTP Settings', icon: <Mail size={20} /> },
    { id: 'notifications', label: 'Notifications & Alerts', icon: <AlertCircle size={20} /> },
    { id: 'subscription', label: 'Subscription & Billing', icon: <CreditCard size={20} /> }
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings');
      setSettings(prev => {
        const cleanedData = {};
        if (response.data) {
          Object.keys(response.data).forEach(key => {
            if (response.data[key] !== null && response.data[key] !== undefined) {
              cleanedData[key] = response.data[key];
            } else {
              cleanedData[key] = prev[key] !== undefined ? prev[key] : '';
            }
          });
        }
        return {
          ...prev,
          ...cleanedData,
          late_deduction: response.data?.late_deduction !== undefined ? !!response.data.late_deduction : prev.late_deduction,
          admin_password: '' // Don't show password
        };
      });
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
    try {
      const planRes = await api.get('/settings/current-plan');
      setCurrentPlan(planRes.data);
    } catch (err) {
      console.error('Error fetching plan:', err);
    }
    try {
      const plansList = await api.get('/plans');
      setAvailablePlans(plansList.data);
      if (plansList.data.length > 0) {
        setSelectedPlan(plansList.data[0].name);
      }
    } catch (err) {
      console.error('Error fetching available plans:', err);
    }
    try {
      const emailRes = await api.get('/settings/email');
      if (emailRes.data && Object.keys(emailRes.data).length > 0) {
        setEmailSettings(emailRes.data);
      }
    } catch (err) {
      console.error('Error fetching email settings:', err);
    }
    try {
      const waRes = await api.get('/settings/whatsapp');
      if (waRes.data) {
        setWhatsappSettings({
          whatsapp_business_account_id: waRes.data.whatsapp_business_account_id || '',
          phone_number_id: waRes.data.phone_number_id || '',
          access_token: waRes.data.access_token || '',
          template_name: waRes.data.template_name || 'payslip_delivery',
          is_enabled: waRes.data.is_enabled !== undefined ? Boolean(waRes.data.is_enabled) : true
        });
      }
    } catch (err) {
      console.error('Error fetching WhatsApp settings:', err);
    }
  };

  const handlePlanRequest = async (planName = selectedPlan) => {
    try {
      setIsRequesting(true);
      await api.post('/settings/plan-request', { plan: planName });
      setIsRequesting(false);
      showAlert('Renewal request sent to SuperAdmin successfully!', 'success');
    } catch (err) {
      setIsRequesting(false);
      showAlert(err.response?.data?.error || 'Failed to submit request', 'error');
    }
  };

  const handleTestSubscription = async (status) => {
    try {
      await api.post('/settings/test-subscription', { status });
      fetchSettings();
      window.dispatchEvent(new Event('subscription_updated'));
    } catch (err) {
      console.error('Failed to set test subscription', err);
    }
  };



  const handleSave = async () => {
    try {
      setIsSaving(true);
      await api.put('/settings', settings);

      // Update local storage and context user info to propagate localization changes immediately
      if (updateUser) {
        updateUser({
          localization: {
            ...user?.localization,
            timezone: settings.timezone || 'Asia/Singapore',
            currency: settings.currency || 'SGD',
            date_format: settings.date_format || 'DD/MM/YYYY',
            language: settings.language || 'English'
          }
        });
      }
      if (refreshSettings) {
        refreshSettings();
      }

      setIsSaving(false);
      showAlert('Settings updated successfully!', 'success');
    } catch (err) {
      console.error('Error saving settings:', err);
      setIsSaving(false);
      showAlert('Failed to update settings', 'error');
    }
  };

  const handleSaveEmailSettings = async () => {
    try {
      setIsSaving(true);
      await api.post('/settings/email', emailSettings);
      setIsSaving(false);
      showAlert('Email settings saved successfully!', 'success');
    } catch (err) {
      console.error('Error saving email settings:', err);
      setIsSaving(false);
      showAlert(err.response?.data?.error || 'Failed to update email settings', 'error');
    }
  };

  const handleSaveWhatsAppSettings = async () => {
    try {
      setIsSaving(true);
      await api.post('/settings/whatsapp', whatsappSettings);
      setIsSaving(false);
      showAlert('WhatsApp settings saved successfully!', 'success');
    } catch (err) {
      console.error('Error saving WhatsApp settings:', err);
      setIsSaving(false);
      showAlert(err.response?.data?.error || 'Failed to update WhatsApp settings', 'error');
    }
  };

  const handleTestWhatsApp = async () => {
    try {
      setIsTestingWhatsApp(true);
      const res = await api.post('/settings/whatsapp/test', { testPhone });
      showAlert(res.data.message || 'WhatsApp connection verified successfully!', 'success');
    } catch (err) {
      console.error('Test WhatsApp failed:', err);
      showAlert(err.response?.data?.error || 'WhatsApp connection test failed', 'error');
    } finally {
      setIsTestingWhatsApp(false);
    }
  };

  const handleTestEmail = async () => {
    try {
      setIsTestingEmail(true);
      await api.post('/settings/email/test');
      setIsTestingEmail(false);
      showAlert('Test email sent successfully! Check your inbox.', 'success');
    } catch (err) {
      setIsTestingEmail(false);
      showAlert(err.response?.data?.error || 'Failed to send test email', 'error');
    }
  };

  const handlePurgeClick = () => {
    setPurgeStatus({ status: 'idle', message: '' });
    setShowPurgeModal(true);
  };

  const confirmPurge = async () => {
    setPurgeStatus({ status: 'loading', message: 'Purging machine data. Please wait...' });

    try {
      const response = await api.post('/machine/purge');
      if (response.data.success) {
        setPurgeStatus({ status: 'success', message: 'Machine Data Purged Successfully!' });
      } else {
        setPurgeStatus({ status: 'error', message: 'Purge failed: ' + response.data.message });
      }
    } catch (err) {
      console.error('Error purging machine:', err);
      setPurgeStatus({ status: 'error', message: 'Error: ' + (err.response?.data?.error || err.message) });
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) : value)
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">System Settings</h1>
          <p className="text-sm text-slate-500 font-medium">Manage your biometric integration and payroll business rules.</p>
        </div>
        <button
          onClick={activeTab === 'email' ? handleSaveEmailSettings : activeTab === 'whatsapp' ? handleSaveWhatsAppSettings : handleSave}
          disabled={isSaving}
          className="btn-primary flex items-center justify-center gap-2 px-8 py-3 shadow-lg shadow-primary/20 relative overflow-hidden"
        >
          {isSaving ? (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
              <Zap size={18} />
            </motion.div>
          ) : <Save size={18} />}
          <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1">
          <div className="card p-3 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between p-4 rounded-2xl font-black text-xs uppercase tracking-wider transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary text-white shadow-xl shadow-primary/25 translate-x-1'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  {tab.icon}
                  <span>{tab.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {activeTab === 'payroll' && (
              <motion.div
                key="payroll"
                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div className="card">
                  <div className="flex items-center gap-4 mb-8 pb-4 border-b border-slate-50">
                    <div className="bg-primary/10 p-3 rounded-2xl text-primary shadow-sm">
                      <Calendar size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-800">Attendance & Payout Logic</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Business rules for salary calculation</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="group flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100 hover:border-primary/20 transition-all">
                      <div className="space-y-1">
                        <h4 className="text-base font-black text-slate-800">Automatic Late Deduction</h4>
                        <p className="text-xs font-bold text-slate-500">Enable 15-minute buffer before deducting half-day or late fine.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSettings(prev => ({ ...prev, late_deduction: !prev.late_deduction }))}
                        className={`w-14 h-7 rounded-full relative transition-all p-1.5 shadow-lg ${settings.late_deduction ? 'bg-primary shadow-primary/20' : 'bg-slate-300'}`}
                      >
                        <motion.div
                          animate={{ x: settings.late_deduction ? 28 : 0 }}
                          className="h-4 w-4 bg-white rounded-full shadow-sm"
                        />
                      </button>
                    </div>

                    {settings.late_deduction && (
                      <div className="p-6 bg-rose-50 rounded-[2rem] border border-rose-100 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <h4 className="text-sm font-black text-rose-900">Late Penalty Amount</h4>
                            <p className="text-[10px] font-bold text-rose-600/80">Amount to deduct per late arrival.</p>
                          </div>
                          <div className="relative w-32">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-400 font-bold text-xs">{currencySymbol}</span>
                            <input
                              type="number"
                              name="late_deduction_amount"
                              value={settings.late_deduction_amount}
                              onChange={handleChange}
                              className="w-full bg-white border border-rose-200 rounded-xl pl-8 pr-4 py-2 text-sm font-bold text-rose-900 focus:ring-2 focus:ring-rose-500/20"
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between border-t border-rose-100 pt-4 mt-4">
                          <div className="space-y-1">
                            <h4 className="text-sm font-black text-rose-900">Grace Period (Minutes)</h4>
                            <p className="text-[10px] font-bold text-rose-600/80">Allowed buffer time before late deduction applies.</p>
                          </div>
                          <div className="relative w-32">
                            <input
                              type="number"
                              name="grace_period_mins"
                              value={settings.grace_period_mins !== undefined ? settings.grace_period_mins : 15}
                              onChange={handleChange}
                              className="w-full bg-white border border-rose-200 rounded-xl px-4 py-2 text-sm font-bold text-rose-900 focus:ring-2 focus:ring-rose-500/20"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Salary Payout Cycle</label>
                        <select
                          name="salary_cycle"
                          value={settings.salary_cycle}
                          onChange={handleChange}
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 appearance-none"
                        >
                          <option value="15 Days Cycle">15 Days Cycle</option>
                          <option value="Monthly (1st to 30th)">Monthly (1st to 30th)</option>
                          <option value="Weekly Payout">Weekly Payout</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Salary Cycle Start Date</label>
                        <input
                          type="number"
                          name="salary_cycle_start_date"
                          min="1"
                          max="28"
                          value={settings.salary_cycle_start_date || 1}
                          onChange={handleChange}
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 appearance-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">OT (Overtime) Multiplier</label>
                        <input
                          type="number"
                          step="0.1"
                          name="ot_multiplier"
                          value={settings.ot_multiplier}
                          onChange={handleChange}
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Standard Start Time</label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                          <input
                            type="time"
                            name="standard_start_time"
                            value={settings.standard_start_time}
                            onChange={handleChange}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-11 pr-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Standard End Time</label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                          <input
                            type="time"
                            name="standard_end_time"
                            value={settings.standard_end_time}
                            onChange={handleChange}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-11 pr-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Weekend Off-Days</label>
                      <p className="text-[10px] font-bold text-slate-500 ml-1 mb-2">Select the days that are considered weekends/off-days for overtime calculation.</p>
                      <div className="flex flex-wrap gap-3">
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                          const isSelected = settings.weekends?.includes(day);
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => {
                                const currentWeekends = settings.weekends ? settings.weekends.split(',').filter(d => d.trim() !== '') : [];
                                let newWeekends;
                                if (isSelected) {
                                  newWeekends = currentWeekends.filter(d => d !== day);
                                } else {
                                  newWeekends = [...currentWeekends, day];
                                }
                                setSettings({ ...settings, weekends: newWeekends.join(',') });
                              }}
                              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${isSelected
                                  ? 'bg-primary text-white border-primary shadow-md shadow-primary/20 scale-105'
                                  : 'bg-white text-slate-500 border-slate-200 hover:border-primary/40 hover:bg-slate-50'
                                }`}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'business' && (
              <motion.div
                key="business"
                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div className="card">
                  <div className="flex items-center gap-4 mb-8 pb-4 border-b border-slate-50">
                    <div className="bg-indigo-500/10 p-3 rounded-2xl text-indigo-600 shadow-sm">
                      <Globe size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-800">Business Identity</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Company details for reports & payslips</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-1.5">
                        Business Name
                        <Lock size={10} className="text-slate-300" />
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="business_name"
                          value={settings.business_name || ''}
                          readOnly
                          className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 pr-10 text-sm font-bold text-slate-500 cursor-not-allowed"
                        />
                        <Lock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" />
                      </div>
                      <p className="text-[9px] font-bold text-slate-400 ml-1">Managed by Super Admin. Contact your provider to change.</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-1.5">
                        Contact Phone
                        <Lock size={10} className="text-slate-300" />
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="business_phone"
                          value={settings.business_phone || ''}
                          readOnly
                          className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 pr-10 text-sm font-bold text-slate-500 cursor-not-allowed"
                        />
                        <Lock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" />
                      </div>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-1.5">
                        Email Address
                        <Lock size={10} className="text-slate-300" />
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          name="business_email"
                          value={settings.business_email || ''}
                          readOnly
                          className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 pr-10 text-sm font-bold text-slate-500 cursor-not-allowed"
                        />
                        <Lock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" />
                      </div>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">System Currency</label>
                      <select
                        name="currency"
                        value={settings.currency || 'ZAR'}
                        onChange={handleChange}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="ZAR">ZAR (R) - South African Rand</option>
                        <option value="USD">USD ($) - US Dollar</option>
                        <option value="SGD">SGD (S$) - Singapore Dollar</option>
                        <option value="INR">INR (₹) - Indian Rupee</option>
                        <option value="EUR">EUR (€) - Euro</option>
                        <option value="GBP">GBP (£) - British Pound</option>
                        <option value="AED">AED (د.إ) - UAE Dirham</option>
                      </select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Address</label>
                      <textarea
                        name="business_address"
                        value={settings.business_address || ''}
                        onChange={handleChange}
                        rows="3"
                        placeholder="Street, City, Province, Code"
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'localization' && (
              <motion.div
                key="localization"
                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div className="card p-8">
                  <div className="flex items-center gap-4 mb-8 pb-4 border-b border-slate-50">
                    <div className="bg-primary/10 p-3 rounded-2xl text-primary shadow-sm">
                      <Globe size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-800">Localization & Regional Settings</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Configure your company's independent timezone, currency, and date format</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Timezone Custom Dropdown */}
                    <div className="space-y-2 md:col-span-2 relative" ref={tzDropdownRef}>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-1.5">
                        <Clock size={12} className="text-primary" />
                        Company Timezone *
                      </label>
                      
                      {/* Trigger Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsTzOpen(!isTzOpen);
                          setTzSearch('');
                        }}
                        className={`w-full bg-slate-50 border ${isTzOpen ? 'border-primary ring-2 ring-primary/20 bg-white' : 'border-slate-100'} rounded-xl px-4 py-3 text-sm font-bold flex items-center justify-between transition-all hover:border-slate-200 text-left`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xl leading-none shrink-0">
                            {TIMEZONE_OPTIONS.find(t => t.value === (settings.timezone || 'Asia/Singapore'))?.flag || '🌐'}
                          </span>
                          <div className="truncate">
                            <span className="font-bold text-slate-800">
                              {TIMEZONE_OPTIONS.find(t => t.value === (settings.timezone || 'Asia/Singapore'))?.label || settings.timezone || 'Asia/Singapore'}
                            </span>
                            <span className="ml-2 px-2 py-0.5 rounded-md bg-slate-200/60 text-[10px] font-semibold text-slate-600">
                              {TIMEZONE_OPTIONS.find(t => t.value === (settings.timezone || 'Asia/Singapore'))?.offset || 'GMT +8:00'}
                            </span>
                            <span className="ml-2 text-xs text-slate-400 font-normal hidden sm:inline">
                              - {TIMEZONE_OPTIONS.find(t => t.value === (settings.timezone || 'Asia/Singapore'))?.desc || ''}
                            </span>
                          </div>
                        </div>
                        <motion.div animate={{ rotate: isTzOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                          <ChevronDown size={18} className="text-slate-400 shrink-0" />
                        </motion.div>
                      </button>

                      {/* Dropdown Options (Always opens downward) */}
                      <AnimatePresence>
                        {isTzOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -6, scale: 0.99 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.99 }}
                            transition={{ duration: 0.15 }}
                            className="absolute top-full left-0 right-0 mt-2 z-50 bg-white border border-slate-200/90 rounded-2xl shadow-2xl overflow-hidden p-2.5"
                          >
                            <div className="p-1 pb-2 border-b border-slate-100 mb-1.5">
                              <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                  type="text"
                                  value={tzSearch}
                                  onChange={(e) => setTzSearch(e.target.value)}
                                  placeholder="Search timezone, country, or city (e.g. Singapore, India, Dubai)..."
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                  autoFocus
                                />
                              </div>
                            </div>

                            <div className="max-h-64 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                              {TIMEZONE_OPTIONS.filter(t => 
                                t.label.toLowerCase().includes(tzSearch.toLowerCase()) ||
                                t.country.toLowerCase().includes(tzSearch.toLowerCase()) ||
                                t.desc.toLowerCase().includes(tzSearch.toLowerCase()) ||
                                t.value.toLowerCase().includes(tzSearch.toLowerCase())
                              ).map((tz) => {
                                const isSelected = (settings.timezone || 'Asia/Singapore') === tz.value;
                                return (
                                  <button
                                    key={tz.value}
                                    type="button"
                                    onClick={() => {
                                      setSettings(prev => ({ ...prev, timezone: tz.value }));
                                      setIsTzOpen(false);
                                      setTzSearch('');
                                    }}
                                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all ${
                                      isSelected ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-slate-50 text-slate-700'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <span className="text-xl leading-none shrink-0">{tz.flag}</span>
                                      <div>
                                        <div className="text-xs font-bold flex items-center gap-2">
                                          <span>{tz.label}</span>
                                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-semibold text-slate-500">{tz.offset}</span>
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-medium">{tz.desc}</div>
                                      </div>
                                    </div>
                                    {isSelected && <Check size={16} className="text-primary font-bold shrink-0" />}
                                  </button>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <p className="text-[10px] font-medium text-slate-400 ml-1">
                        All employee face scans, kiosk punches, shift thresholds, salary cycles, and notifications for your company will be processed using this timezone.
                      </p>
                    </div>

                    {/* System Currency */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Company Currency</label>
                      <select
                        name="currency"
                        value={settings.currency || 'SGD'}
                        onChange={handleChange}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                      >
                        <option value="SGD">SGD (S$) - Singapore Dollar</option>
                        <option value="INR">INR (₹) - Indian Rupee</option>
                        <option value="USD">USD ($) - US Dollar</option>
                        <option value="AED">AED (د.إ) - UAE Dirham</option>
                        <option value="EUR">EUR (€) - Euro</option>
                        <option value="GBP">GBP (£) - British Pound</option>
                        <option value="ZAR">ZAR (R) - South African Rand</option>
                      </select>
                    </div>

                    {/* Date Format */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Date Format</label>
                      <select
                        name="date_format"
                        value={settings.date_format || 'DD/MM/YYYY'}
                        onChange={handleChange}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                      >
                        <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 19/08/2026)</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 08/19/2026)</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-08-19)</option>
                      </select>
                    </div>

                    {/* Live Preview Box */}
                    <div className="md:col-span-2 p-5 bg-gradient-to-br from-slate-50 to-slate-100/80 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1.5">
                          <Sparkles size={13} /> Active Formatting Preview
                        </span>
                        <div className="text-xs font-semibold text-slate-600">
                          Selected Timezone: <span className="font-bold text-slate-800">{settings.timezone || 'Asia/Singapore'}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="px-3 py-1.5 bg-white rounded-xl border border-slate-200 text-xs font-black text-slate-700 shadow-sm">
                          {settings.currency === 'SGD' ? 'S$ 3,500.00' : settings.currency === 'INR' ? '₹ 3,500.00' : settings.currency === 'USD' ? '$ 3,500.00' : `${settings.currency || 'SGD'} 3,500.00`}
                        </div>
                        <div className="px-3 py-1.5 bg-white rounded-xl border border-slate-200 text-xs font-black text-slate-700 shadow-sm">
                          {settings.date_format === 'MM/DD/YYYY' ? '08/19/2026' : settings.date_format === 'YYYY-MM-DD' ? '2026-08-19' : '19/08/2026'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-50 flex justify-end">
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={isSaving}
                      className="btn-primary flex items-center gap-2 px-7 py-3 shadow-lg shadow-primary/20 relative overflow-hidden"
                    >
                      {isSaving ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                          <Zap size={16} />
                        </motion.div>
                      ) : <Save size={16} />}
                      <span>{isSaving ? 'Saving...' : 'Save Localization'}</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'whatsapp' && (
              <motion.div
                key="whatsapp"
                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div className="card p-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-50">
                    <div className="flex items-center gap-4">
                      <div className="bg-emerald-500/10 p-3 rounded-2xl text-emerald-600 shadow-sm">
                        <MessageSquare size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-800">WhatsApp Business Cloud API</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Automate direct payslip delivery to staff WhatsApp</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setShowGuideModal(true)}
                        className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500 rounded-2xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 active:scale-95 group"
                      >
                        <BookOpen size={15} className="group-hover:scale-110 transition-transform" />
                        Complete Setup Guide
                      </button>

                      <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 py-2 rounded-2xl">
                        <span className="text-xs font-bold text-slate-600">WhatsApp Status:</span>
                        <button
                          type="button"
                          onClick={() => setWhatsappSettings(prev => ({ ...prev, is_enabled: !prev.is_enabled }))}
                          className={`w-12 h-6 rounded-full relative transition-all p-1 ${whatsappSettings.is_enabled ? 'bg-emerald-500 shadow-md shadow-emerald-500/20' : 'bg-slate-300'}`}
                        >
                          <motion.div
                            animate={{ x: whatsappSettings.is_enabled ? 24 : 0 }}
                            className="h-4 w-4 bg-white rounded-full shadow-sm"
                          />
                        </button>
                        <span className={`text-[10px] font-black uppercase ${whatsappSettings.is_enabled ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {whatsappSettings.is_enabled ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">WhatsApp Business Account ID (WABA ID)</label>
                      <input
                        type="text"
                        value={whatsappSettings.whatsapp_business_account_id}
                        onChange={(e) => setWhatsappSettings({...whatsappSettings, whatsapp_business_account_id: e.target.value})}
                        placeholder="e.g. 109283746591029"
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20"
                      />
                      <p className="text-[10px] text-slate-400 ml-1">Found in Meta Business Manager &gt; WhatsApp Accounts</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Phone Number ID *</label>
                      <input
                        type="text"
                        value={whatsappSettings.phone_number_id}
                        onChange={(e) => setWhatsappSettings({...whatsappSettings, phone_number_id: e.target.value})}
                        placeholder="e.g. 102938475610293"
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20"
                      />
                      <p className="text-[10px] text-slate-400 ml-1">Found under Meta WhatsApp API Setup tab</p>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Permanent Access Token *</label>
                      <div className="relative">
                        <input
                          type={showToken ? 'text' : 'password'}
                          value={whatsappSettings.access_token}
                          onChange={(e) => setWhatsappSettings({...whatsappSettings, access_token: e.target.value})}
                          placeholder="EAAG..."
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-4 pr-12 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20"
                        />
                        <button
                          type="button"
                          onClick={() => setShowToken(!showToken)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                        >
                          {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 ml-1">Encrypted with AES-256 in database. Generate from Meta System Users.</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Default Country Code (for numbers without +)</label>
                      <select
                        value={whatsappSettings.default_country_code || '+65'}
                        onChange={(e) => setWhatsappSettings({...whatsappSettings, default_country_code: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="+65">🇸🇬 +65 (Singapore - Default)</option>
                        <option value="+91">🇮🇳 +91 (India)</option>
                        <option value="+971">🇦🇪 +971 (UAE)</option>
                        <option value="+60">🇲🇾 +60 (Malaysia)</option>
                        <option value="+27">🇿🇦 +27 (South Africa)</option>
                        <option value="+1">🇺🇸 +1 (USA / Canada)</option>
                        <option value="+44">🇬🇧 +44 (UK)</option>
                        <option value="+61">🇦🇺 +61 (Australia)</option>
                        <option value="+966">🇸🇦 +966 (Saudi Arabia)</option>
                        <option value="+974">🇶🇦 +974 (Qatar)</option>
                      </select>
                      <p className="text-[10px] text-slate-400 ml-1">Auto-applied when employee number doesn't have a country prefix</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Approved Message Template Name</label>
                      <input
                        type="text"
                        value={whatsappSettings.template_name}
                        onChange={(e) => setWhatsappSettings({...whatsappSettings, template_name: e.target.value})}
                        placeholder="payslip_delivery"
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20"
                      />
                      <p className="text-[10px] text-slate-400 ml-1">Meta template with document header &amp; body parameters (e.g. <code>payslip_delivery</code>)</p>
                    </div>
                  </div>

                  {/* Test Connection Box */}
                  <div className="mt-8 bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5 sm:p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-emerald-600" />
                          Test WhatsApp Connection
                        </h4>
                        <p className="text-xs font-medium text-slate-500 mt-1">
                          Verify your Meta credentials or send a test ping to your mobile number.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={testPhone}
                          onChange={(e) => setTestPhone(e.target.value)}
                          placeholder="+65... or +91..."
                          className="bg-white border border-emerald-200 rounded-xl px-3 py-2 text-xs font-bold w-44 focus:ring-2 focus:ring-emerald-500/20"
                        />
                        <button
                          type="button"
                          onClick={handleTestWhatsApp}
                          disabled={isTestingWhatsApp}
                          className="btn-primary !bg-emerald-600 hover:!bg-emerald-700 flex items-center gap-2 text-xs py-2 px-4 whitespace-nowrap shadow-md shadow-emerald-600/20"
                        >
                          {isTestingWhatsApp ? <Zap size={14} className="animate-spin" /> : <Send size={14} />}
                          Test WhatsApp
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'email' && (
              <motion.div
                key="email"
                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div className="card p-8">
                  <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50">
                    <div className="flex items-center gap-4">
                      <div className="bg-sky-500/10 p-3 rounded-2xl text-sky-600 shadow-sm">
                        <Mail size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-800">SMTP Settings</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Configure your company email delivery</p>
                      </div>
                    </div>
                    <button 
                      onClick={handleTestEmail}
                      disabled={isTestingEmail}
                      className="btn-secondary flex items-center gap-2 text-sm"
                    >
                      {isTestingEmail ? <Zap size={16} className="animate-spin" /> : <Send size={16} />}
                      Test Connection
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">SMTP Host</label>
                      <input
                        type="text"
                        value={emailSettings.smtp_host}
                        onChange={(e) => setEmailSettings({...emailSettings, smtp_host: e.target.value})}
                        placeholder="smtp.gmail.com"
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">SMTP Port</label>
                      <input
                        type="number"
                        value={emailSettings.smtp_port}
                        onChange={(e) => setEmailSettings({...emailSettings, smtp_port: e.target.value})}
                        placeholder="587"
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">SMTP Username</label>
                      <input
                        type="text"
                        value={emailSettings.smtp_user}
                        onChange={(e) => setEmailSettings({...emailSettings, smtp_user: e.target.value})}
                        placeholder="billing@company.com"
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">SMTP Password</label>
                      <input
                        type="password"
                        value={emailSettings.smtp_pass}
                        onChange={(e) => setEmailSettings({...emailSettings, smtp_pass: e.target.value})}
                        placeholder="********"
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20"
                      />
                      <p className="text-xs text-slate-400 ml-1">Use App Passwords for Gmail/M365</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Sender Email</label>
                      <input
                        type="email"
                        value={emailSettings.sender_email}
                        onChange={(e) => setEmailSettings({...emailSettings, sender_email: e.target.value})}
                        placeholder="noreply@company.com"
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Sender Name</label>
                      <input
                        type="text"
                        value={emailSettings.sender_name}
                        onChange={(e) => setEmailSettings({...emailSettings, sender_name: e.target.value})}
                        placeholder="HR Department"
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>

                  {/* SMTP Setup Guide */}
                  <div className="mt-8 bg-sky-50/50 border border-sky-100 rounded-2xl p-5 sm:p-6">
                    <div className="flex gap-4">
                      <div className="mt-1">
                        <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center">
                          <HelpCircle size={18} />
                        </div>
                      </div>
                      <div className="space-y-4 flex-1">
                        <div>
                          <h4 className="text-sm font-black text-slate-800">How to Setup SMTP & Gmail App Password</h4>
                          <p className="text-xs font-medium text-slate-500 mt-1">
                            To send automated emails (payslips, notifications), you must configure your email provider. <strong>If using Gmail, you cannot use your normal login password.</strong>
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-sky-200/50 pb-2">1. Standard Settings</h5>
                            <ul className="text-xs text-slate-600 space-y-2 font-medium">
                              <li><strong className="text-slate-800">SMTP Host:</strong> <code className="bg-white px-1 py-0.5 rounded border border-slate-200">smtp.gmail.com</code></li>
                              <li><strong className="text-slate-800">SMTP Port:</strong> <code className="bg-white px-1 py-0.5 rounded border border-slate-200">587</code> (TLS recommended)</li>
                              <li><strong className="text-slate-800">Username:</strong> Your actual email address (e.g., <code className="bg-white px-1 py-0.5 rounded border border-slate-200">hr@company.com</code>)</li>
                              <li><strong className="text-slate-800">Sender Email:</strong> Same as your username</li>
                            </ul>
                          </div>
                          
                          <div className="space-y-3">
                            <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-sky-200/50 pb-2">2. Gmail App Password Steps</h5>
                            <ol className="text-xs text-slate-600 space-y-2 font-medium list-decimal list-inside">
                              <li>Enable <strong>2-Step Verification</strong> on your Google Account.</li>
                              <li>Go to <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="text-sky-600 font-bold hover:underline">Google App Passwords</a>.</li>
                              <li>Select App: <strong>Mail</strong>, Device: <strong>Other (HRM System)</strong>.</li>
                              <li>Click <strong>Generate</strong>.</li>
                              <li>Copy the 16-letter code and paste it into the <strong>SMTP Password</strong> field above.</li>
                            </ol>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'notifications' && (
              <motion.div
                key="notifications"
                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div className="card">
                  <div className="flex items-center gap-4 mb-8 pb-4 border-b border-slate-50">
                    <div className="bg-primary/10 p-3 rounded-2xl text-primary shadow-sm">
                      <AlertCircle size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-800">Notifications & Alerts</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Manage your system notification preferences</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="group flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100 hover:border-primary/20 transition-all">
                      <div className="space-y-1">
                        <h4 className="text-base font-black text-slate-800">Leave Requests</h4>
                        <p className="text-xs font-bold text-slate-500">Get notified when an employee applies for a leave.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSettings(prev => ({ ...prev, notify_leaves: !prev.notify_leaves }))}
                        className={`w-14 h-7 rounded-full relative transition-all p-1.5 shadow-lg ${settings.notify_leaves ? 'bg-primary shadow-primary/20' : 'bg-slate-300'}`}
                      >
                        <motion.div
                          animate={{ x: settings.notify_leaves ? 28 : 0 }}
                          className="h-4 w-4 bg-white rounded-full shadow-sm"
                        />
                      </button>
                    </div>

                    <div className="group flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100 hover:border-primary/20 transition-all">
                      <div className="space-y-1">
                        <h4 className="text-base font-black text-slate-800">Expense Claims</h4>
                        <p className="text-xs font-bold text-slate-500">Get notified when an employee submits a new claim.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSettings(prev => ({ ...prev, notify_claims: !prev.notify_claims }))}
                        className={`w-14 h-7 rounded-full relative transition-all p-1.5 shadow-lg ${settings.notify_claims ? 'bg-primary shadow-primary/20' : 'bg-slate-300'}`}
                      >
                        <motion.div
                          animate={{ x: settings.notify_claims ? 28 : 0 }}
                          className="h-4 w-4 bg-white rounded-full shadow-sm"
                        />
                      </button>
                    </div>

                    <div className="group flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100 hover:border-primary/20 transition-all">
                      <div className="space-y-1">
                        <h4 className="text-base font-black text-slate-800">Password Reset Requests</h4>
                        <p className="text-xs font-bold text-slate-500">Get notified when an employee requests a password reset.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSettings(prev => ({ ...prev, notify_password_resets: !prev.notify_password_resets }))}
                        className={`w-14 h-7 rounded-full relative transition-all p-1.5 shadow-lg ${settings.notify_password_resets ? 'bg-primary shadow-primary/20' : 'bg-slate-300'}`}
                      >
                        <motion.div
                          animate={{ x: settings.notify_password_resets ? 28 : 0 }}
                          className="h-4 w-4 bg-white rounded-full shadow-sm"
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'subscription' && (
              <motion.div
                key="subscription"
                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div className="card">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                      <div className="bg-emerald-500/10 p-3 rounded-2xl text-emerald-600 shadow-sm">
                        <CreditCard size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-800">Subscription & Billing</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Manage your plan and licenses</p>
                      </div>
                    </div>

                  </div>

                  {currentPlan ? (
                    <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white flex flex-col md:flex-row items-center justify-between gap-8 border border-white/5 shadow-2xl relative overflow-hidden group mb-8">
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent"></div>
                      <div className="relative z-10 space-y-2">
                        <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Current Active Plan</h4>
                        <p className="text-3xl font-black">{currentPlan.plan_name}</p>
                        {(() => {
                          let endDateEnd;
                          if (currentPlan.created_at) {
                            endDateEnd = new Date(currentPlan.created_at);
                            let addDays = 30;
                            if (currentPlan.billing_cycle === 'quarterly') addDays = 90;
                            else if (currentPlan.billing_cycle === 'half-yearly') addDays = 180;
                            else if (currentPlan.billing_cycle === 'annually') addDays = 365;
                            endDateEnd.setDate(endDateEnd.getDate() + addDays);
                          } else {
                            endDateEnd = new Date(currentPlan.end_date);
                            endDateEnd.setHours(23, 59, 59, 999);
                          }

                          if (forceTimer !== null) {
                            return (
                              <p className="text-xs font-bold text-slate-400 flex items-center gap-2">
                                <span>Next billing date: <span className="text-white">{endDateEnd ? endDateEnd.toLocaleDateString() : 'N/A'}</span></span>
                                <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 rounded-full text-[10px] font-black uppercase tracking-widest border border-rose-500/20 shadow-sm animate-pulse">
                                  {forceTimer}s left
                                </span>
                              </p>
                            );
                          }

                          const timeDiff = endDateEnd - new Date();
                          const daysLeft = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
                          const hoursLeft = Math.floor((timeDiff / (1000 * 60 * 60)) % 24);
                          const minutesLeft = Math.floor((timeDiff / (1000 * 60)) % 60);
                          const secondsLeft = Math.floor((timeDiff / 1000) % 60);

                          let timeLeftStr = `${daysLeft}d ${hoursLeft}h left`;
                          if (daysLeft === 0 && hoursLeft === 0) {
                            timeLeftStr = `${minutesLeft}m ${secondsLeft}s left`;
                          } else if (daysLeft === 0) {
                            timeLeftStr = `${hoursLeft}h ${minutesLeft}m left`;
                          }

                          const isWarning = daysLeft <= 3;

                          return (
                            <p className="text-xs font-bold text-slate-400 flex items-center gap-2">
                              <span>Next billing date: <span className="text-white">{endDateEnd ? endDateEnd.toLocaleDateString() : 'N/A'}</span></span>
                              {timeDiff > 0 && (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${isWarning ? 'bg-rose-500/20 text-rose-300 border-rose-500/20 animate-pulse' : 'bg-white/10 text-white border-white/5'}`}>
                                  {timeLeftStr}
                                </span>
                              )}
                            </p>
                          );
                        })()}
                      </div>
                      <div className="relative z-10 text-right">
                        <span className="inline-block px-4 py-2 bg-emerald-500/20 text-emerald-300 rounded-xl text-xs font-black uppercase tracking-widest border border-emerald-500/20">
                          {currentPlan.payment_status}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-200 text-center mb-8">
                      <p className="text-sm font-bold text-slate-500">Loading current plan...</p>
                    </div>
                  )}

                  <div className="space-y-6">
                    <h4 className="text-base font-black text-slate-800">Available Upgrades</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {availablePlans.map(plan => (
                        <div key={plan.id} className={`relative p-6 rounded-[2rem] border-2 transition-all cursor-pointer ${selectedPlan === plan.name ? 'border-primary bg-primary/5 shadow-xl shadow-primary/10' : 'border-slate-100 bg-white hover:border-slate-200'}`} onClick={() => setSelectedPlan(plan.name)}>
                          {plan.isPopular === 1 && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-orange-500 to-rose-500 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg">Most Popular</div>
                          )}
                          <h5 className="text-lg font-black text-slate-800 mb-1">{plan.name}</h5>
                          <p className="text-2xl font-black text-primary mb-4">{plan.price} <span className="text-xs text-slate-400">{plan.duration}</span></p>
                          <ul className="space-y-2 mb-6">
                            {JSON.parse(plan.features || '[]').map((f, i) => (
                              <li key={i} className="text-xs font-bold text-slate-600 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary/50"></div>
                                {f}
                              </li>
                            ))}
                          </ul>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPlan(plan.name);
                              handlePlanRequest(plan.name);
                            }}
                            className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${selectedPlan === plan.name ? 'bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                          >
                            {isRequesting && selectedPlan === plan.name ? 'Renewing...' : 'RENEW'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Developer Testing Tools */}


                </div>
              </motion.div>
            )}


          </AnimatePresence>
        </div>
      </div>

      {/* Purge Modal */}
      <AnimatePresence>
        {showPurgeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden border border-slate-100"
            >
              <div className="p-8">
                <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mb-6 shadow-inner">
                  <AlertCircle size={32} />
                </div>

                <h3 className="text-xl font-black text-slate-800 tracking-tight mb-2">Are you absolutely sure?</h3>
                <p className="text-sm font-medium text-slate-500 leading-relaxed mb-6">
                  This action will permanently delete all <strong className="text-rose-600">users, faces, fingerprints, and attendance logs</strong> from the physical biometric machine. This action cannot be undone.
                </p>

                {purgeStatus.status !== 'idle' && (
                  <div className={`p-4 rounded-xl mb-6 text-sm font-bold flex items-center gap-3 ${purgeStatus.status === 'loading' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      purgeStatus.status === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                    {purgeStatus.status === 'loading' && <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}><Zap size={18} /></motion.div>}
                    {purgeStatus.message}
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    onClick={() => setShowPurgeModal(false)}
                    disabled={purgeStatus.status === 'loading'}
                    className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all disabled:opacity-50"
                  >
                    {purgeStatus.status === 'success' ? 'Close' : 'Cancel'}
                  </button>
                  {purgeStatus.status !== 'success' && (
                    <button
                      onClick={confirmPurge}
                      disabled={purgeStatus.status === 'loading'}
                      className="flex-1 bg-rose-600 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {purgeStatus.status === 'loading' ? 'Purging...' : 'Yes, Purge All'}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* WhatsApp Complete Setup Guide Modal */}
      <AnimatePresence>
        {showGuideModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full sm:w-[70%] max-w-[70vw] max-h-[88vh] flex flex-col overflow-hidden border border-slate-100 my-auto"
            >
              {/* Modal Header */}
              <div className="px-6 sm:px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/50 via-white to-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800 tracking-tight">WhatsApp Payslip Integration Guide</h3>
                    <p className="text-xs text-slate-500 font-medium">Step-by-step Meta WhatsApp Cloud API connection guide</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGuideModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body - Scrollable */}
              <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-700 text-sm">
                {/* Intro Banner */}
                <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-100 flex items-start gap-3">
                  <MessageCircle size={22} className="text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Automate Employee Payslip Delivery via WhatsApp</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Follow these 8 simple steps to connect your company's Meta WhatsApp Business Cloud API. Once configured, payslips can be sent with 1-click directly from the Payroll page.
                    </p>
                  </div>
                </div>

                {/* Step 1 */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center">1</span>
                    <h4 className="font-bold text-slate-800">Access Meta Business Suite</h4>
                  </div>
                  <p className="text-xs text-slate-600 pl-8">
                    Open <a href="https://business.facebook.com" target="_blank" rel="noreferrer" className="text-emerald-600 font-bold hover:underline inline-flex items-center gap-1">business.facebook.com <ExternalLink size={12} /></a> and log in. Select your company's <strong>Business Portfolio / Meta Business Account</strong> and make sure business information is filled in.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center">2</span>
                    <h4 className="font-bold text-slate-800">Create WhatsApp Business Account</h4>
                  </div>
                  <p className="text-xs text-slate-600 pl-8">
                    Go to <strong>Business Settings ➔ Accounts ➔ WhatsApp Accounts</strong>. Click <strong>Add</strong> ➔ <em>Create a new WhatsApp Business Account</em>. Add your official business phone number and verify via OTP.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center">3</span>
                    <h4 className="font-bold text-slate-800">Copy WhatsApp Business Account ID (WABA ID)</h4>
                  </div>
                  <p className="text-xs text-slate-600 pl-8">
                    Under <strong>Accounts ➔ WhatsApp Accounts</strong>, select your account. Copy the <strong>WhatsApp Business Account ID</strong> (e.g. <code>123456789012345</code>) and paste it into the WABA ID field in HRM settings.
                  </p>
                </div>

                {/* Step 4 */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center">4</span>
                    <h4 className="font-bold text-slate-800">Create Meta Developer App &amp; Get Phone Number ID</h4>
                  </div>
                  <p className="text-xs text-slate-600 pl-8">
                    Open <a href="https://developers.facebook.com" target="_blank" rel="noreferrer" className="text-emerald-600 font-bold hover:underline inline-flex items-center gap-1">developers.facebook.com <ExternalLink size={12} /></a>. Click <strong>Create App</strong> ➔ Choose <strong>Business</strong> type ➔ Add <strong>WhatsApp</strong> product. Go to <strong>WhatsApp ➔ API Setup</strong> and copy your <strong>Phone Number ID</strong> (e.g. <code>109876543210987</code>).
                  </p>
                </div>

                {/* Step 5 */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center">5</span>
                    <h4 className="font-bold text-slate-800">Generate Permanent Access Token</h4>
                  </div>
                  <div className="text-xs text-slate-600 pl-8 space-y-1.5">
                    <p>Go to <strong>Meta Business Settings ➔ Users ➔ System Users</strong>.</p>
                    <p>Click <strong>Add</strong> ➔ Create System User (Role: <em>Admin</em>). Under <strong>Assign Assets</strong>, assign your WhatsApp Account with Full Control.</p>
                    <p>Click <strong>Generate New Token</strong> ➔ Set Expiration to <strong>Never</strong> ➔ Enable permissions: <code className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">whatsapp_business_management</code> &amp; <code className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">whatsapp_business_messaging</code>.</p>
                    <p>Copy the permanent token (starts with <code>EAAG...</code>) and paste it into HRM settings.</p>
                  </div>
                </div>

                {/* Step 6 */}
                <div className="p-5 rounded-2xl bg-emerald-50/40 border border-emerald-200/60 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center">6</span>
                    <h4 className="font-bold text-slate-800">Create WhatsApp Message Template in Meta</h4>
                  </div>
                  <div className="text-xs text-slate-600 pl-8 space-y-2">
                    <p>Go to <strong>WhatsApp Manager ➔ Message Templates</strong> ➔ Click <strong>Create Template</strong>:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-white rounded-xl border border-slate-200">
                      <div><strong>Category:</strong> Utility</div>
                      <div><strong>Language:</strong> English</div>
                      <div>
                        <strong>Template Name:</strong> <code className="bg-slate-100 px-1.5 py-0.5 rounded">payslip_delivery</code>
                        <button
                          type="button"
                          onClick={() => copyToClipboard('payslip_delivery', 'template_name')}
                          className="ml-2 text-emerald-600 font-bold hover:underline inline-flex items-center gap-0.5"
                        >
                          {copiedItem === 'template_name' ? <Check size={12} /> : <Copy size={12} />} {copiedItem === 'template_name' ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <div><strong>Header:</strong> Document (Media)</div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-700">Message Body:</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard('Hello {{1}},\nYour payslip for {{2}} is ready.\nPlease find your payslip attached.\nThank you!', 'body')}
                          className="text-emerald-600 font-bold hover:underline inline-flex items-center gap-1 text-[11px]"
                        >
                          {copiedItem === 'body' ? <Check size={12} /> : <Copy size={12} />} {copiedItem === 'body' ? 'Copied Body' : 'Copy Template Text'}
                        </button>
                      </div>
                      <pre className="p-3 bg-slate-900 text-emerald-300 font-mono text-xs rounded-xl overflow-x-auto">
{`Hello {{1}},
Your payslip for {{2}} is ready.
Please find your payslip attached.
Thank you!`}
                      </pre>
                      <p className="text-[11px] text-slate-400">Variables: <code>{"{{1}}"}</code> = Employee Name, <code>{"{{2}}"}</code> = Month / Year</p>
                    </div>
                  </div>
                </div>

                {/* Step 7 & 8 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center">7</span>
                      <h4 className="font-bold text-slate-800">Save in HRM Settings</h4>
                    </div>
                    <p className="text-xs text-slate-600 pl-8">
                      Paste WABA ID, Phone Number ID, Permanent Access Token, select your <strong>Default Country Code (e.g. 🇸🇬 +65)</strong>, and click <strong>Save Changes</strong>.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center">8</span>
                      <h4 className="font-bold text-slate-800">Test Connection</h4>
                    </div>
                    <p className="text-xs text-slate-600 pl-8">
                      Enter your mobile number in the <em>Test WhatsApp Connection</em> box below and click <strong>Test WhatsApp</strong> to receive an instant verification message!
                    </p>
                  </div>
                </div>

                {/* Key Features Summary */}
                <div className="p-5 rounded-2xl bg-slate-100 border border-slate-200/80 space-y-2">
                  <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider">💡 Helpful Tips</h4>
                  <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                    <li><strong>Country Codes:</strong> Normal 8-digit Singapore numbers (e.g. <code>91234567</code>) work directly. The system automatically attaches <code>+65</code>.</li>
                    <li><strong>Delivery Tracking:</strong> View delivered/failed messages and retry anytime via <strong>Payroll ➔ WA Logs</strong> (`/admin/whatsapp-logs`).</li>
                  </ul>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 sm:px-8 py-4 border-t border-slate-100 flex justify-end bg-slate-50">
                <button
                  type="button"
                  onClick={() => setShowGuideModal(false)}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-600/20 active:scale-95"
                >
                  Got It, Close Guide
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Settings;
