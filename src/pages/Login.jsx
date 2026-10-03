import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserCheck, Eye, EyeOff, Lock, User, Mail, HelpCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/axios';

import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';

const Login = () => {
  const { login } = useAuth();
  const { showAlert } = useUI();
  
  const [showPassword, setShowPassword] = useState(false);
  const [credentials, setCredentials] = useState({ userId: '', password: '' });
  const [role, setRole] = useState('');
  
  // States for Login
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // States for Demo Data
  const [demoData, setDemoData] = useState([]);
  const [selectedDemoRole, setSelectedDemoRole] = useState(null);
  const [selectedDemoCompany, setSelectedDemoCompany] = useState('');

  // States for Enquiry
  const [showEnquiryModal, setShowEnquiryModal] = useState(false);
  const [enquiryForm, setEnquiryForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [enquiryLoading, setEnquiryLoading] = useState(false);

  // States for Forgot Password
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotUserId, setForgotUserId] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchDemoData = async () => {
      try {
        const res = await api.get('/public/demo-data');
        setDemoData(res.data);
      } catch (err) {
        console.error('Failed to fetch demo data:', err);
      }
    };
    fetchDemoData();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/login', {
        userId: credentials.userId,
        password: credentials.password,
        role: role
      });
      
      const { token, user } = response.data;
      login(user, token);
      
      const dbRole = user.role?.toLowerCase();
      if (['admin', 'hr', 'masteradmin', 'superadmin'].includes(dbRole)) {
        navigate('/admin');
      } else {
        navigate('/employee');
      }
    } catch (err) {
      console.error('Login error:', err);
      const msg = err.response?.data?.message || 'Login failed. Please check credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleEnquirySubmit = async (e) => {
    e.preventDefault();
    setEnquiryLoading(true);
    try {
      await api.post('/public/enquiry', enquiryForm);
      showAlert('Your enquiry has been sent to the Super Admin.', 'success');
      setShowEnquiryModal(false);
      setEnquiryForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err) {
      console.error('Failed to send enquiry:', err);
      showAlert('Failed to send enquiry. Please try again.', 'error');
    } finally {
      setEnquiryLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotUserId) return;
    
    setForgotLoading(true);
    try {
      const res = await api.post('/public/forgot-password-request', { userId: forgotUserId });
      showAlert(res.data.message || 'Request sent to your Administrator.', 'success');
      setShowForgotModal(false);
      setForgotUserId('');
    } catch (err) {
      console.error('Failed to send password request:', err);
      showAlert(err.response?.data?.message || 'Failed to send request.', 'error');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex overflow-hidden">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full flex flex-col md:flex-row min-h-screen"
      >
        {/* Left Side - Illustration/Brand */}
        <div 
          className="md:w-1/2 p-12 flex flex-col justify-between text-white relative overflow-hidden bg-cover bg-center hidden md:flex"
          style={{ backgroundImage: "url('/hrm_login_bg.png')", backgroundColor: '#0f172a' }}
        >
          <div className="absolute inset-0 bg-slate-900/40 mix-blend-multiply z-0"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-slate-900/50 z-0"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 backdrop-blur-md p-2.5 rounded-xl border border-white/20">
                <UserCheck size={28} className="text-cyan-400" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-md">Nexus HRM Pro</h1>
            </div>

            <div className="max-w-lg mt-16">
              <h2 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight drop-shadow-lg">
                Modern Biometric <br /> 
                <span className="text-cyan-400">Attendance System</span>
              </h2>
              <p className="text-slate-200 text-lg drop-shadow-md font-medium">
                Seamlessly manage your workforce with AI-powered face and fingerprint recognition.
              </p>
            </div>
          </div>

          <div className="relative z-10 mt-auto pt-12">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                {[
                  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&q=80",
                  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&q=80",
                  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&q=80",
                  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&q=80"
                ].map((url, i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-800 bg-slate-200 overflow-hidden shadow-lg">
                    <img src={url} alt="user" className="w-full h-full object-cover" />
                  </div>
                ))}
                <div className="w-10 h-10 rounded-full border-2 border-slate-800 bg-cyan-500 flex items-center justify-center text-xs font-bold text-slate-900 shadow-lg">
                  +12k
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-200 font-medium drop-shadow-md">Trusted by 500+ <br className="hidden lg:block"/>companies worldwide</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 bg-white flex flex-col justify-center items-center relative">
          
          <Link 
            to="/" 
            className="absolute top-8 right-8 group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-black text-xs uppercase tracking-widest shadow shadow-purple-500/20 hover:shadow-purple-500/40 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full -translate-x-full skew-x-12 transition-transform duration-700 ease-out"></div>
            <span className="group-hover:-translate-x-1 transition-transform duration-300 relative z-10">←</span> 
            <span className="relative z-10">Back to Website</span>
          </Link>

          <div className="w-full max-w-md">
            <div className="mb-10">
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Welcome Back</h3>
              <p className="text-slate-500">Enter your credentials to access your dashboard</p>
              
              {error && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }}
                  className="mt-4 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl flex flex-col"
                >
                  <p className="text-xs font-bold leading-relaxed">{error}</p>
                  
                  {(error.toLowerCase().includes('suspended') || error.toLowerCase().includes('inactive')) && (
                    <button 
                      onClick={() => setShowEnquiryModal(true)}
                      className="mt-3 text-[10px] font-black uppercase tracking-widest bg-rose-600 text-white px-3 py-2 rounded-lg hover:bg-rose-700 transition-colors shadow-sm self-start flex items-center gap-2"
                    >
                      <HelpCircle size={14} /> Contact Support
                    </button>
                  )}
                </motion.div>
              )}
            </div>

            <form onSubmit={handleLogin} className="space-y-6 mt-8" autoComplete="off">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Email / User ID</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                    <User size={18} />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Enter your email or ID" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 text-sm font-bold text-slate-700 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none placeholder:text-slate-400 placeholder:font-medium"
                    value={credentials.userId}
                    onChange={(e) => setCredentials({...credentials, userId: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Password</label>
                  <button type="button" onClick={() => setShowForgotModal(true)} className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary-dark transition-colors">
                    Forgot?
                  </button>
                </div>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                    <Lock size={18} />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Enter your password" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-12 pr-12 text-sm font-bold text-slate-700 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none placeholder:text-slate-400 placeholder:font-medium"
                    value={credentials.password}
                    onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors bg-white/50 p-1 rounded-md"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary-dark text-white rounded-xl py-4 text-[11px] font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex justify-center items-center gap-2">
                  {loading ? 'Authenticating...' : 'Secure Sign In'}
                </button>
              </div>
            </form>

            <div className="mt-12 text-center border-t border-slate-100 pt-6">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                © 2026 Nexus HRM Pro.
              </p>
              <button type="button" onClick={() => setShowEnquiryModal(true)} className="text-[10px] font-black text-primary hover:text-primary-dark transition-colors uppercase tracking-widest mt-2">
                Need Help? Contact Support
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Enquiry Modal */}
      <AnimatePresence>
        {showEnquiryModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40" 
              onClick={() => setShowEnquiryModal(false)} 
            />
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.95 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, y: 20, scale: 0.95 }} 
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="bg-white rounded-2xl w-full shadow-2xl flex flex-col pointer-events-auto overflow-hidden" style={{ maxWidth: '400px' }}>
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500">
                      <Mail size={20} />
                    </div>
                    <div>
                      <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight leading-none">Contact Support</h2>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Submit an enquiry</p>
                    </div>
                  </div>
                  <button onClick={() => setShowEnquiryModal(false)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors">
                    <X size={20}/>
                  </button>
                </div>
                
                <form onSubmit={handleEnquirySubmit} className="flex flex-col">
                  <div className="p-5 space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Your Name *</label>
                      <input required type="text" value={enquiryForm.name} onChange={e => setEnquiryForm({...enquiryForm, name: e.target.value})} className="input-field w-full" placeholder="John Doe" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Address *</label>
                      <input required type="email" value={enquiryForm.email} onChange={e => setEnquiryForm({...enquiryForm, email: e.target.value})} className="input-field w-full" placeholder="john@company.com" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Mobile Number *</label>
                      <input required type="text" value={enquiryForm.phone} onChange={e => setEnquiryForm({...enquiryForm, phone: e.target.value})} className="input-field w-full" placeholder="+1234567890" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Subject *</label>
                      <input required type="text" value={enquiryForm.subject} onChange={e => setEnquiryForm({...enquiryForm, subject: e.target.value})} className="input-field w-full" placeholder="Account suspended issue" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Message *</label>
                      <textarea required value={enquiryForm.message} onChange={e => setEnquiryForm({...enquiryForm, message: e.target.value})} className="input-field w-full min-h-[80px] resize-none" placeholder="Please describe your issue..."></textarea>
                    </div>
                  </div>
                  <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                    <button type="button" onClick={() => setShowEnquiryModal(false)} className="px-5 py-2.5 text-[11px] font-black text-slate-600 hover:bg-slate-200 rounded-xl transition-colors uppercase tracking-widest">Cancel</button>
                    <button type="submit" disabled={enquiryLoading} className="btn-primary px-6 py-2.5 text-[11px] font-black uppercase tracking-widest shadow-md hover:shadow-lg disabled:opacity-50">
                      {enquiryLoading ? 'Sending...' : 'Send Enquiry'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40" 
              onClick={() => setShowForgotModal(false)} 
            />
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.95 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, y: 20, scale: 0.95 }} 
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="bg-white rounded-2xl w-full shadow-2xl flex flex-col pointer-events-auto overflow-hidden" style={{ maxWidth: '400px' }}>
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
                      <Lock size={20} />
                    </div>
                    <div>
                      <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight leading-none">Reset Password</h2>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Request admin assistance</p>
                    </div>
                  </div>
                  <button onClick={() => setShowForgotModal(false)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors">
                    <X size={20}/>
                  </button>
                </div>
                
                <form onSubmit={handleForgotPassword} className="flex flex-col">
                  <div className="p-5 space-y-4">
                    <p className="text-sm text-slate-600">Enter your Email or User ID. A password reset request will be sent to your Company Administrator.</p>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email / User ID *</label>
                      <input required type="text" value={forgotUserId} onChange={e => setForgotUserId(e.target.value)} className="input-field w-full" placeholder="Enter your ID or Email" />
                    </div>
                  </div>
                  <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                    <button type="button" onClick={() => setShowForgotModal(false)} className="px-5 py-2.5 text-[11px] font-black text-slate-600 hover:bg-slate-200 rounded-xl transition-colors uppercase tracking-widest">Cancel</button>
                    <button type="submit" disabled={forgotLoading} className="btn-primary px-6 py-2.5 text-[11px] font-black uppercase tracking-widest shadow-md hover:shadow-lg disabled:opacity-50">
                      {forgotLoading ? 'Sending...' : 'Request Reset'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Login;
