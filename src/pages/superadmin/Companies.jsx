import React, { useState, useEffect } from 'react';
import api from '../../utils/axios';
import { Plus, Edit, Trash2, Eye, EyeOff, X, RefreshCw, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUI } from '../../context/UIContext';

const Companies = () => {
  const { showAlert, showConfirm } = useUI();
  const [companies, setCompanies] = useState([]);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [renewAmount, setRenewAmount] = useState('0');
  const [renewPlan, setRenewPlan] = useState('');
  const [renewCompany, setRenewCompany] = useState(null);
  const [modalMode, setModalMode] = useState('add'); // 'add', 'edit', 'view'
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    owner_name: '',
    email: '',
    phone: '',
    plan: '',
    employee_limit: '',
    status: 'active'
  });
  const [currentId, setCurrentId] = useState(null);
  
  // Password Reset State
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  
  useEffect(() => { 
    fetchCompanies(); 
    fetchPlans();
  }, []);
  
  const fetchCompanies = () => {
    api.get('/superadmin/companies').then(res => setCompanies(res.data)).catch(console.error);
  };

  const fetchPlans = () => {
    api.get('/plans').then(res => setAvailablePlans(res.data)).catch(console.error);
  };

  const getPlanName = (planIdentifier) => {
    if (!planIdentifier) return 'No Plan';
    const planObj = availablePlans.find(p => p.id === parseInt(planIdentifier) || p.name === planIdentifier);
    return planObj ? planObj.name : planIdentifier;
  };

  const getDaysLeft = (c) => {
    const createdAt = new Date(c.plan_created_at || c.created_at);
    const cycle = c.plan_billing_cycle || 'monthly';
    let daysToAdd = 30;
    if (cycle === 'quarterly') daysToAdd = 90;
    else if (cycle === 'half-yearly') daysToAdd = 180;
    else if (cycle === 'annually') daysToAdd = 365;
    
    const endDate = new Date(createdAt.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    const diff = endDate - new Date();
    if (diff <= 0) return 'Expired';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return `${days} Days Left`;
  };

  const openModal = (mode, company = null) => {
    setModalMode(mode);
    if (company) {
      setCurrentId(company.id);
      setFormData({
        company_name: company.company_name,
        owner_name: company.owner_name,
        email: company.email,
        phone: company.phone,
        plan: company.active_plan || company.plan,
        employee_limit: company.employee_limit,
        status: company.status,
        admin_count: company.admin_count,
        employee_count: company.employee_count,
        total_users: company.total_users,
        password: ''
      });
    } else {
      setCurrentId(null);
      setFormData({
        company_name: '',
        owner_name: '',
        email: '',
        phone: '',
        plan: '',
        employee_limit: '',
        status: 'active',
        password: '',
        total_users: 0
      });
    }
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'add') {
        await api.post('/superadmin/company', formData);
      } else if (modalMode === 'edit') {
        await api.put(`/superadmin/company/${currentId}`, formData);
      }
      showAlert('Company settings saved successfully', 'success');
      fetchCompanies();
      closeModal();
    } catch (err) {
      console.error(err);
      showAlert('Error saving company', 'error');
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await showConfirm({
      title: 'Delete Company',
      message: 'Are you sure you want to delete this company? All associated data will be lost.',
      confirmText: 'Delete',
      type: 'danger'
    });
    
    if (confirmed) {
      try {
        await api.delete(`/superadmin/company/${id}`);
        showAlert('Company deleted successfully', 'success');
        fetchCompanies();
      } catch (err) {
        console.error(err);
        showAlert('Error deleting company', 'error');
      }
    }
  };

  const handleResetPassword = async (company) => {
    const confirmed = await showConfirm({
      title: 'Reset Admin Password',
      message: `Are you sure you want to reset the password for ${company.company_name}'s admin (${company.owner_name})? A new password will be auto-generated.`,
      confirmText: 'Reset Password',
      type: 'warning'
    });

    if (confirmed) {
      try {
        setResetLoading(true);
        const res = await api.post(`/superadmin/company/${company.id}/reset-password`);
        if (res.data && res.data.tempPassword) {
          setGeneratedPassword(res.data.tempPassword);
          setResetModalOpen(true);
        } else {
          showAlert('Failed to generate new password', 'error');
        }
      } catch (err) {
        console.error(err);
        showAlert(err.response?.data?.message || 'Failed to reset password', 'error');
      } finally {
        setResetLoading(false);
      }
    }
  };

  const openRenewModal = (company) => {
    setRenewCompany(company);
    const currentPlanName = getPlanName(company.active_plan || company.plan);
    setRenewPlan(currentPlanName);
    
    const matchedPlan = availablePlans.find(p => p.name === currentPlanName);
    if (matchedPlan) {
      setRenewAmount(matchedPlan.price);
    } else {
      setRenewAmount('0');
    }
    setIsRenewModalOpen(true);
  };

  const handleRenewPlanChange = (e) => {
    const selectedPlanName = e.target.value;
    setRenewPlan(selectedPlanName);
    const plan = availablePlans.find(p => p.name === selectedPlanName);
    if (plan) {
      setRenewAmount(plan.price);
    }
  };

  const closeRenewModal = () => {
    setIsRenewModalOpen(false);
    setRenewCompany(null);
  };

  const submitManualRenew = async (e) => {
    e.preventDefault();
    if (!renewCompany) return;
    
    try {
      await api.post('/superadmin/billing/record-payment', {
        company_id: renewCompany.id,
        plan_name: renewPlan,
        amount: parseFloat(renewAmount) || 0
      });
      showAlert('Subscription renewed successfully', 'success');
      fetchCompanies();
      closeRenewModal();
    } catch (err) {
      console.error(err);
      showAlert('Error renewing subscription', 'error');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'plan') {
      const selectedPlan = availablePlans.find(p => p.name === value);
      let newLimit = formData.employee_limit;
      if (selectedPlan) {
        try {
          const feats = typeof selectedPlan.features === 'string' ? JSON.parse(selectedPlan.features) : selectedPlan.features;
          if (feats && feats.length > 0) {
            const match = feats[0].match(/\d+/);
            if (match) newLimit = parseInt(match[0], 10);
          }
        } catch(err) {}
      }
      setFormData({ ...formData, [name]: value, employee_limit: newLimit });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  return (
    <div className="space-y-4 relative">
      <div className="flex justify-between items-center no-print">
        <div>
          <h1 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Companies</h1>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">Manage platform clients</p>
        </div>
        <button onClick={() => openModal('add')} className="btn-primary flex items-center gap-2 text-[11px] font-black uppercase tracking-widest px-4 py-2">
          <Plus size={16}/> Add Company
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-100">
              <tr>
                <th className="p-4 font-black text-[10px] uppercase tracking-widest">Name</th>
                <th className="p-4 font-black text-[10px] uppercase tracking-widest">Owner</th>
                <th className="p-4 font-black text-[10px] uppercase tracking-widest">Email</th>
                <th className="p-4 font-black text-[10px] uppercase tracking-widest">Plan</th>
                <th className="p-4 font-black text-[10px] uppercase tracking-widest">Status</th>
                <th className="p-4 font-black text-[10px] uppercase tracking-widest text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {companies.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-bold text-slate-800">{c.company_name}</td>
                  <td className="p-4 font-semibold text-slate-600">{c.owner_name}</td>
                  <td className="p-4 text-slate-500">{c.email}</td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1 items-start">
                      <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-indigo-100">
                        {getPlanName(c.active_plan || c.plan)}
                      </span>
                      {(c.plan_created_at || c.created_at) && (
                        <span className={`text-[9px] font-bold uppercase tracking-widest ${getDaysLeft(c) === 'Expired' ? 'text-rose-500' : 'text-emerald-500'}`}>
                          {getDaysLeft(c)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-sm ${c.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="p-4 flex gap-3 justify-center items-center">
                    <button onClick={() => openRenewModal(c)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors tooltip" title="Manual Renew / Record Payment">
                      <RefreshCw size={16}/>
                    </button>
                    <button onClick={() => openModal('view', c)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors tooltip" title="View Details">
                      <Eye size={16}/>
                    </button>
                    <button onClick={() => handleResetPassword(c)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors tooltip" title="Reset Admin Password" disabled={resetLoading}>
                      <Key size={16} className={resetLoading ? 'animate-spin' : ''} />
                    </button>
                    <button onClick={() => openModal('edit', c)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors tooltip" title="Edit Company">
                      <Edit size={16}/>
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors tooltip" title="Delete Company">
                      <Trash2 size={16}/>
                    </button>
                  </td>
                </tr>
              ))}
              {companies.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-[11px] font-black text-slate-400 uppercase tracking-widest">No companies found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reset Password Result Modal */}
      <AnimatePresence>
        {resetModalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40" onClick={() => setResetModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col pointer-events-auto overflow-hidden">
                <div className="p-6 text-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                    <Key size={32} className="text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Password Reset Successful</h3>
                    <p className="text-sm text-slate-500 mt-2 font-medium">Please share this new password with the Admin securely.</p>
                  </div>
                  
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 mt-4 relative group">
                    <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mb-2">New Password</p>
                    <p className="text-3xl font-mono text-slate-800 font-black tracking-wider break-all">{generatedPassword}</p>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(generatedPassword);
                        showAlert('Password copied to clipboard!', 'success');
                      }}
                      className="absolute top-2 right-2 p-2 bg-white text-slate-400 hover:text-primary rounded-lg border border-slate-200 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Copy to clipboard"
                    >
                      Copy
                    </button>
                  </div>
                </div>
                
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                  <button onClick={() => setResetModalOpen(false)} className="btn-primary px-6 py-2">Done</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Renew Modal */}
      <AnimatePresence>
        {isRenewModalOpen && renewCompany && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40" onClick={closeRenewModal} />
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <div className="bg-white rounded-2xl w-full shadow-2xl flex flex-col pointer-events-auto" style={{ maxWidth: '450px' }}>
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-2xl">
                  <div>
                    <h2 className="text-lg font-black text-slate-800 uppercase tracking-tighter leading-none">Renew Subscription</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Manual Payment Record</p>
                  </div>
                  <button onClick={closeRenewModal} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"><X size={20}/></button>
                </div>

                <form onSubmit={submitManualRenew} className="flex flex-col">
                  <div className="p-6 space-y-5">
                    <p className="text-xs text-slate-600 font-medium">
                      Record manual payment and renew subscription for <strong className="text-slate-800 font-black">{renewCompany.company_name}</strong>.
                    </p>

                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Select Plan *</label>
                        <select
                          required
                          value={renewPlan}
                          onChange={handleRenewPlanChange}
                          className="input-field w-full cursor-pointer"
                        >
                          <option value="" disabled>Select Plan</option>
                          {availablePlans.map(p => (
                            <option key={p.id} value={p.name}>{p.name} - S${p.price.replace(/[^0-9.]/g, '') || p.price}/{p.duration}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Amount Received *</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">S$</span>
                          <input
                            type="number"
                            required
                            value={renewAmount}
                            onChange={(e) => setRenewAmount(e.target.value)}
                            className="input-field w-full pl-8"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-2xl">
                    <button type="button" onClick={closeRenewModal} className="px-5 py-2.5 text-[11px] font-black text-slate-600 hover:bg-slate-200 rounded-xl transition-colors uppercase tracking-widest">Cancel</button>
                    <button type="submit" className="btn-primary px-6 py-2.5 text-[11px] font-black uppercase tracking-widest shadow-md hover:shadow-lg">
                      Confirm Renewal
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40" onClick={closeModal} />
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <div className="bg-white rounded-2xl w-full shadow-2xl flex flex-col max-h-[90vh] pointer-events-auto" style={{ maxWidth: '600px' }}>
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-2xl">
                  <h2 className="text-lg font-black text-slate-800 uppercase tracking-tighter">
                    {modalMode === 'add' ? 'Add New Company' : modalMode === 'edit' ? 'Edit Company' : 'Company Details'}
                  </h2>
                  <button onClick={closeModal} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"><X size={20}/></button>
                </div>
                
                <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
                  {modalMode === 'view' ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Company Name</p>
                        <p className="font-bold text-slate-800">{formData.company_name}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Owner Name</p>
                        <p className="font-bold text-slate-800">{formData.owner_name}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Email Address</p>
                        <p className="font-bold text-slate-800">{formData.email}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Phone Number</p>
                        <p className="font-bold text-slate-800">{formData.phone || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Subscription Plan</p>
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-100">{formData.plan}</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border shadow-sm ${formData.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>{formData.status}</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Employee Limit</p>
                        <p className="font-bold text-slate-800">{formData.employee_limit}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Users Created</p>
                        <p className="font-bold text-slate-800">{formData.total_users || 0}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Admin Count</p>
                        <p className="font-bold text-slate-800">{formData.admin_count || 0}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Staff Count</p>
                        <p className="font-bold text-slate-800">{formData.employee_count || 0}</p>
                      </div>
                    </div>
                  ) : (
                    <form id="companyForm" onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Company Name *</label>
                          <input required type="text" name="company_name" value={formData.company_name} onChange={handleChange} className="input-field w-full" placeholder="Enter company name" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Owner Name *</label>
                          <input required type="text" name="owner_name" value={formData.owner_name} onChange={handleChange} className="input-field w-full" placeholder="Enter owner name" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email *</label>
                          <input required type="email" name="email" value={formData.email} onChange={handleChange} className="input-field w-full" placeholder="contact@company.com" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Phone</label>
                          <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="input-field w-full" placeholder="+1 234 567 8900" />
                        </div>
                        {modalMode === 'add' && (
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                              Admin Password *
                            </label>
                            <div className="relative">
                              <input 
                                required
                                type={showPassword ? "text" : "password"} 
                                name="password" 
                                value={formData.password || ''} 
                                onChange={handleChange} 
                                className="input-field w-full pr-10" 
                                placeholder="••••••••" 
                              />
                              <button 
                                type="button" 
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                              >
                                {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                              </button>
                            </div>
                          </div>
                        )}
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Subscription Plan *</label>
                          <select required name="plan" value={formData.plan} onChange={handleChange} className={`input-field w-full ${modalMode === 'edit' ? 'bg-slate-100 cursor-not-allowed opacity-70' : 'cursor-pointer'}`} disabled={modalMode === 'edit'}>
                            <option value="" disabled>Select Plan</option>
                            {availablePlans.length === 0 && <option value="Basic" disabled>Loading plans...</option>}
                            {availablePlans.map(p => {
                              let empCountText = 'Custom';
                              try {
                                const feats = typeof p.features === 'string' ? JSON.parse(p.features) : p.features;
                                if (feats && feats.length > 0) empCountText = feats[0];
                              } catch(e) {}
                              return <option key={p.id} value={p.name}>{p.name} ({empCountText})</option>;
                            })}
                          </select>
                          {modalMode === 'edit' && <p className="text-[10px] text-amber-600 font-bold mt-1 ml-1">Use the "Renew" button from the table to change plans.</p>}
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Employee Limit</label>
                          <input type="number" name="employee_limit" value={formData.employee_limit} onChange={handleChange} className="input-field w-full" />
                        </div>
                        <div className="space-y-1 md:col-span-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Account Status</label>
                          <select name="status" value={formData.status} onChange={handleChange} className="input-field w-full cursor-pointer">
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="suspended">Suspended</option>
                          </select>
                        </div>
                      </div>
                    </form>
                  )}
                </div>
                
                {modalMode !== 'view' && (
                  <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-2xl">
                    <button type="button" onClick={closeModal} className="px-5 py-2.5 text-[11px] font-black text-slate-600 hover:bg-slate-200 rounded-xl transition-colors uppercase tracking-widest">Cancel</button>
                    <button type="submit" form="companyForm" className="btn-primary px-6 py-2.5 text-[11px] font-black uppercase tracking-widest shadow-md hover:shadow-lg">
                      {modalMode === 'add' ? 'Create Company' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Companies;
