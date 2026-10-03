import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/axios';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight,
  Download, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Search, 
  TrendingUp,
  AlertCircle,
  X,
  ArrowRight,
  Printer,
  MoreHorizontal,
  RotateCcw,
  Mail,
  Send,
  Loader2,
  MessageCircle,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { handleDownload, handlePrint } from '../../utils/export';
import { useSettings } from '../../context/SettingsContext';
import { useUI } from '../../context/UIContext';

const Payroll = () => {
  const navigate = useNavigate();
  const { currencySymbol } = useSettings();
  const { showConfirm, showAlert } = useUI();
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [selectedSlip, setSelectedSlip] = useState(null);
  const [settings, setSettings] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const [payrollData, setPayrollData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showBulkPayModal, setShowBulkPayModal] = useState(false);
  const [selectedPayrolls, setSelectedPayrolls] = useState([]);
  const [showPayConfirm, setShowPayConfirm] = useState(false);
  const [payConfirmData, setPayConfirmData] = useState(null);

  const [showProcessModal, setShowProcessModal] = useState(false);
  const [cycleStartDate, setCycleStartDate] = useState('');
  const [cycleEndDate, setCycleEndDate] = useState('');

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailProgress, setEmailProgress] = useState(null);
  const [isSendingEmails, setIsSendingEmails] = useState(false);

  const [showWhatsAppBulkModal, setShowWhatsAppBulkModal] = useState(false);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [whatsAppBulkSummary, setWhatsAppBulkSummary] = useState(null);

  useEffect(() => {
    fetchPayroll();
  }, []);

  const fetchPayroll = async () => {
    try {
      setLoading(true);
      const [payRes, settingsRes] = await Promise.all([
        api.get('/payroll'),
        api.get('/settings')
      ]);
      // Normalize date fields to YYYY-MM-DD (MySQL DATE can come as ISO timestamp)
      const normalized = payRes.data.map(p => ({
        ...p,
        cycle_start: p.cycle_start ? p.cycle_start.substring(0, 10) : p.cycle_start,
        cycle_end: p.cycle_end ? p.cycle_end.substring(0, 10) : p.cycle_end,
      }));
      setPayrollData(normalized);
      setSettings(settingsRes.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching payroll:', err);
      setError('Failed to load payroll records.');
    } finally {
      setLoading(false);
    }
  };

  const [historyData, setHistoryData] = useState([]);
  
  useEffect(() => {
    if (showHistory) {
       fetchHistory();
    }
  }, [showHistory]);

  const fetchHistory = async () => {
    try {
      const response = await api.get('/payroll');
      setHistoryData(response.data);
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  };

  const handleMarkPaid = (id) => {
    const emp = payrollData.find(p => p.id === id);
    if (!emp) return;
    setPayConfirmData(emp);
    setShowPayConfirm(true);
  };

  const confirmSinglePayment = async () => {
    if (!payConfirmData) return;
    try {
      await api.patch(`/payroll/${payConfirmData.id}`, { status: 'paid' });
      setShowPayConfirm(false);
      setPayConfirmData(null);
      fetchPayroll();
      showAlert('Payroll marked as PAID successfully.', 'success');
    } catch (err) {
      console.error('Error marking paid:', err);
      showAlert('Failed to update status', 'error');
    }
  };

  const handleBulkResetPending = async () => {
    const paid = payrollData.filter(p => p.status === 'paid');
    if (paid.length === 0) return showAlert('No paid payrolls found to reset.', 'error');
    
    const confirmed = await showConfirm({
      title: 'Reset to Pending?',
      message: `Are you sure you want to mark ${paid.length} paid payrolls back to PENDING for testing?`
    });
    if (!confirmed) return;

    try {
      setLoading(true);
      await Promise.all(paid.map(p => api.patch(`/payroll/${p.id}`, { status: 'pending' })));
      fetchPayroll();
      showAlert(`Successfully reset ${paid.length} payrolls to PENDING.`, 'success');
    } catch (err) {
      console.error('Error resetting:', err);
      showAlert('Failed to reset', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkApprove = () => {
    const pending = currentCycleData.filter(p => p.status === 'pending');
    if (pending.length === 0) return showAlert('No pending payrolls found in the current cycle.', 'error');
    
    setSelectedPayrolls(pending.map(p => p.id));
    setShowBulkPayModal(true);
  };

  
  const confirmBulkPayment = async () => {
    if (selectedPayrolls.length === 0) return showAlert('Please select at least one employee.', 'error');
    
    try {
      setLoading(true);
      await Promise.all(selectedPayrolls.map(id => api.patch(`/payroll/${id}`, { status: 'paid' })));
      setShowBulkPayModal(false);
      fetchPayroll();
      showAlert(`Successfully marked ${selectedPayrolls.length} payrolls as PAID.`, 'success');
    } catch (err) {
      console.error('Bulk pay failed:', err);
      showAlert('Bulk payment update failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openProcessModal = () => {
      setCycleStartDate('');
      setCycleEndDate('');
      setShowProcessModal(true);
  };

  const executeProcessCycle = async () => {
    try {
      if (!cycleStartDate || !cycleEndDate) return showAlert('Please select start and end dates', 'warning');
      setIsProcessing(true);
      
      console.log(`🚀 Processing Cycle: ${cycleStartDate} to ${cycleEndDate}`);
      await api.post('/payroll/generate', { startDate: cycleStartDate, endDate: cycleEndDate });
      setIsProcessing(false);
      setShowProcessModal(false);
      setShowSuccess(true);
      fetchPayroll();
    } catch (err) {
      console.error('Payroll generation failed:', err);
      setIsProcessing(false);
      showAlert('Failed to process payroll cycle', 'error');
    }
  };

  const handleSendEmails = () => {
    setShowEmailModal(true);
  };

  const confirmSendEmails = async () => {
    try {
      setIsSendingEmails(true);
      const payrollIds = currentCycleData.map(p => p.id);
      await api.post('/payroll/send-emails', { payrollIds });
      showAlert('Emails queued successfully!', 'success');
      
      // Start listening to SSE
      const token = localStorage.getItem('token');
      const sse = new EventSource(`${api.defaults.baseURL}/payroll/email-progress-stream?token=${token}`, {
        withCredentials: true
      });
      
      sse.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setEmailProgress(data);
        // Automatically close if done and no queued/processing
        if (data.total > 0 && data.queued === 0 && data.processing === 0) {
          setTimeout(() => {
            sse.close();
            setIsSendingEmails(false);
          }, 3000);
        }
      };

      sse.onerror = () => {
        sse.close();
        setIsSendingEmails(false);
      };

    } catch (err) {
      console.error('Failed to queue emails:', err);
      setIsSendingEmails(false);
      showAlert(err.response?.data?.error || 'Failed to send emails', 'error');
    }
  };

  const handleSendSingleEmail = async (payrollId) => {
    try {
      await api.post('/payroll/send-emails', { payrollIds: [payrollId] });
      showAlert('Email queued successfully for this employee!', 'success');
    } catch (err) {
      console.error('Failed to queue single email:', err);
      showAlert(err.response?.data?.error || 'Failed to send email', 'error');
    }
  };

  const handleSendSingleWhatsApp = async (payrollId, employeeName) => {
    try {
      showAlert(`Dispatching WhatsApp payslip to ${employeeName || 'employee'}...`, 'info');
      const res = await api.post(`/payroll/${payrollId}/send-whatsapp`);
      showAlert(res.data.message || 'Payslip sent to WhatsApp successfully!', 'success');
    } catch (err) {
      console.error('Failed to send WhatsApp payslip:', err);
      showAlert(err.response?.data?.error || 'Failed to send WhatsApp payslip', 'error');
    }
  };

  const confirmSendBulkWhatsApp = async () => {
    try {
      setIsSendingWhatsApp(true);
      const payrollIds = currentCycleData.map(p => p.id);
      const res = await api.post('/payroll/send-whatsapp-bulk', { payrollIds });
      setWhatsAppBulkSummary(res.data);
      showAlert(res.data.message || `Dispatched ${res.data.sent} WhatsApp payslips successfully.`, 'success');
      setShowWhatsAppBulkModal(false);
    } catch (err) {
      console.error('Failed to send bulk WhatsApp payslips:', err);
      showAlert(err.response?.data?.error || 'Failed to send bulk WhatsApp payslips', 'error');
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  const uniqueCycles = [...new Set(payrollData.map(p => p.cycle_start))].sort((a, b) => new Date(b) - new Date(a));
  const currentCycleStart = uniqueCycles[0] || null;
  const prevCycleStart = uniqueCycles[1] || null;

  const currentCycleData = payrollData.filter(p => p.cycle_start === currentCycleStart);
  const pendingPayrolls = currentCycleData.filter(p => p.status === 'pending');
  const prevCycleData = payrollData.filter(p => p.cycle_start === prevCycleStart);

  const currentNetPayout = currentCycleData.reduce((acc, curr) => acc + parseFloat(curr.net_salary || 0), 0);
  const prevNetPayout = prevCycleData.reduce((acc, curr) => acc + parseFloat(curr.net_salary || 0), 0);
  
  let payoutGrowth = 0;
  if (prevNetPayout > 0) {
    payoutGrowth = ((currentNetPayout - prevNetPayout) / prevNetPayout) * 100;
  } else if (currentNetPayout > 0 && prevNetPayout === 0) {
    payoutGrowth = 100;
  }
  const isGrowthPositive = payoutGrowth >= 0;

  const currentWorkHours = currentCycleData.reduce((acc, curr) => acc + parseFloat(curr.total_hours || 0), 0);
  const currentAvgHourlyRate = currentCycleData.length > 0 
    ? (currentCycleData.reduce((acc, curr) => acc + parseFloat(curr.salary_rate || curr.base_salary || 0), 0) / currentCycleData.length)
    : 0;
  const currentDeductions = currentCycleData.reduce((acc, curr) => acc + parseFloat(curr.deductions || 0), 0);

  const filteredData = currentCycleData.filter(emp => 
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    String(emp.id).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayCycleRange = currentCycleData.length > 0 
    ? `${currentCycleData[0].cycle_start} to ${currentCycleData[0].cycle_end}`
    : 'current cycle';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Payroll Management</h1>
          <p className="text-sm text-slate-500">
            Manage salaries, deductions, and payouts for {currentCycleData.length > 0 ? (
              <span>cycle between <span className="font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{displayCycleRange}</span></span>
            ) : (
              `the ${settings?.salary_cycle || 'current cycle'}`
            )}.
          </p>
        </div>
          <div className="flex gap-3 mt-4 sm:mt-0">
            <button 
            onClick={openProcessModal}
            disabled={isProcessing}
            className="btn-primary flex items-center gap-2 relative overflow-hidden"
          >
            {isProcessing ? (
              <motion.div 
                animate={{ rotate: 360 }} 
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              >
                <Clock size={18} />
              </motion.div>
            ) : <TrendingUp size={18} />}
            {isProcessing ? 'Processing...' : 'Process Cycle'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          className="card bg-gradient-to-br from-primary to-indigo-700 text-white border-none relative overflow-hidden group !p-5 flex flex-col justify-between"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
            <Wallet size={120} />
          </div>
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-white/10 rounded-xl">
              <Wallet size={20} />
            </div>
            <span className="px-3 py-1 bg-white/20 rounded-full text-[9px] font-bold uppercase tracking-wider">{currentCycleData.length > 0 ? displayCycleRange : 'Current Cycle'}</span>
          </div>
          <div className="relative z-10">
            <p className="text-white/60 text-[9px] font-semibold uppercase tracking-wider mb-0.5">Total Net Payout</p>
            <h3 className="text-2xl font-extrabold tracking-tight leading-none">
              {currencySymbol}{currentNetPayout.toLocaleString()}
            </h3>
            <div className="flex items-center gap-2 mt-2 text-[10px] font-bold text-white/80">
              <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md ${isGrowthPositive ? 'bg-emerald-400/20 text-emerald-100' : 'bg-rose-400/20 text-rose-100'}`}>
                {isGrowthPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />} 
                {isGrowthPositive ? '+' : ''}{payoutGrowth.toFixed(1)}%
              </span>
              <span>vs last cycle</span>
            </div>
          </div>
        </motion.div>

        <div className="lg:col-span-3 card grid grid-cols-1 sm:grid-cols-3 gap-2 !p-0 overflow-hidden min-h-full">
          <div className="flex flex-col items-center justify-center sm:border-r border-slate-100 py-6 px-4">
            <p className="text-[9px] font-bold text-slate-400 uppercase mb-1 tracking-widest">Total Work Hours</p>
            <h4 className="text-2xl font-black text-slate-800 leading-none">
              {currentWorkHours.toFixed(1)}
            </h4>
            <p className="text-[10px] text-slate-500 font-bold mt-1.5 uppercase">Across {currentCycleData.length} employees</p>
          </div>
          <div className="flex flex-col items-center justify-center sm:border-r border-slate-100 py-6 px-4">
            <p className="text-[9px] font-bold text-slate-400 uppercase mb-1 tracking-widest">Avg. Hourly Rate</p>
            <h4 className="text-2xl font-black text-slate-800 leading-none">
              {currencySymbol}{currentAvgHourlyRate.toFixed(0)}
            </h4>
            <p className="text-[10px] text-slate-500 font-bold mt-1.5 uppercase">Calculated from cycle</p>
          </div>
          <div className="flex flex-col items-center justify-center py-6 px-4">
            <p className="text-[9px] font-bold text-slate-400 uppercase mb-1 tracking-widest">Total Deductions</p>
            <h4 className="text-2xl font-black text-rose-500 leading-none">
              {currencySymbol}{currentDeductions.toLocaleString()}
            </h4>
            <p className="text-[10px] text-slate-500 font-bold mt-1.5 uppercase">Late & Absence</p>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="relative flex-1 md:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by employee name..." 
              className="bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-10 py-2 text-sm w-full focus:ring-2 focus:ring-primary/20"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={() => setShowWhatsAppBulkModal(true)}
              disabled={currentCycleData.length === 0 || isSendingWhatsApp}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-bold text-sm rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20 disabled:opacity-50"
            >
              {isSendingWhatsApp ? <Loader2 size={18} className="animate-spin" /> : <MessageSquare size={18} />}
              WHATSAPP PAYSLIPS
            </button>
            <button 
              onClick={handleSendEmails}
              disabled={currentCycleData.length === 0}
              className="flex items-center gap-2 px-6 py-3 bg-sky-600 text-white font-bold text-sm rounded-xl hover:bg-sky-700 transition-colors shadow-lg shadow-sky-600/20 disabled:opacity-50"
            >
              <Mail size={18} /> EMAIL PAYSLIPS
            </button>
            <button
              onClick={() => navigate('/admin/whatsapp-logs')}
              className="flex items-center gap-1.5 px-3.5 py-3 bg-slate-100 text-emerald-700 font-bold text-xs rounded-xl hover:bg-slate-200 transition-colors"
              title="View WhatsApp Delivery Logs"
            >
              <MessageCircle size={15} /> WA Logs
            </button>
            <button
              onClick={() => navigate('/admin/email-logs')}
              className="flex items-center gap-1.5 px-3.5 py-3 bg-slate-100 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-200 transition-colors"
              title="View Email Delivery Logs"
            >
              <Mail size={15} /> Email Logs
            </button>
            <button 
              onClick={handleBulkApprove}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-700 text-white font-bold text-sm rounded-xl hover:bg-emerald-800 transition-colors shadow-lg shadow-emerald-700/20"
            >
              <Wallet size={18} /> BULK PAY ALL PENDING
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-slate-50">
                <th className="py-4 pl-4 text-xs font-black text-slate-400 uppercase tracking-widest">Employee</th>
                <th className="py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Base Rate</th>
                <th className="py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Days / Hours</th>
                <th className="py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Gross</th>
                <th className="py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Deductions</th>
                <th className="py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Net Pay</th>
                <th className="py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="py-4 pr-4 text-right text-xs font-black text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredData.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="py-4 pl-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center font-bold text-slate-500 border border-slate-200">
                        {row.photo ? (
                          <img 
                            src={row.photo.startsWith('http') || row.photo.startsWith('data:') ? row.photo : `${api.defaults.baseURL.replace(/\/api\/?$/, '')}${row.photo.startsWith('/') ? '' : '/'}${row.photo}`} 
                            alt={row.name} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          row.name?.charAt(0) || 'E'
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-800">{row.name}</div>
                        <div className="text-xs text-slate-400 font-medium">#{row.employee_id || row.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 text-sm font-bold text-slate-600">{currencySymbol}{parseFloat(row.salary_rate || 0).toLocaleString()}</td>
                  <td className="py-4 text-sm font-bold text-slate-600">{parseFloat(row.total_hours || 0)} hrs</td>
                  <td className="py-4 text-sm font-bold text-slate-800">{currencySymbol}{parseFloat(row.base_salary || 0).toLocaleString()}</td>
                  <td className="py-4 text-sm font-bold text-rose-500">{currencySymbol}{parseFloat(row.deductions || 0).toLocaleString()}</td>
                  <td className="py-4 text-sm font-extrabold text-slate-800">{currencySymbol}{parseFloat(row.net_salary || 0).toLocaleString()}</td>
                  <td className="py-4">
                    {row.status === 'pending' ? (
                      <button 
                        onClick={() => handleMarkPaid(row.id)}
                        className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100 hover:bg-amber-600 hover:text-white transition-all shadow-sm active:scale-95"
                      >
                        PAY NOW
                      </button>
                    ) : (
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-1 w-fit">
                        <CheckCircle2 size={10} /> PAID
                      </span>
                    )}
                  </td>
                  <td className="py-4 pr-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleSendSingleWhatsApp(row.id, row.name)}
                        className="p-2 bg-slate-50 rounded-xl text-emerald-600 hover:bg-emerald-50 transition-colors group-hover:scale-110 shadow-sm border border-slate-100 tooltip-trigger"
                        title="WhatsApp Payslip"
                      >
                        <MessageCircle size={18} />
                      </button>
                      <button 
                        onClick={() => handleSendSingleEmail(row.id)}
                        className="p-2 bg-slate-50 rounded-xl text-sky-500 hover:bg-sky-50 transition-colors group-hover:scale-110 shadow-sm border border-slate-100 tooltip-trigger"
                        title="Email Payslip"
                      >
                        <Mail size={18} />
                      </button>
                      <button 
                        onClick={() => { 
                          if (row.pdf_path) {
                            const baseUrl = api.defaults.baseURL.replace(/\/api\/?$/, '');
                            const pdfPath = row.pdf_path.replace(/\\/g, '/').replace(/^\//, '');
                            window.open(`${baseUrl}/${pdfPath}`, '_blank');
                          } else {
                            setSelectedSlip(row); 
                            setShowSlipModal(true); 
                          }
                        }}
                        className="p-2 bg-slate-50 rounded-xl text-primary hover:bg-primary/10 transition-colors group-hover:scale-110 shadow-sm border border-slate-100 tooltip-trigger"
                        title="View Slip"
                      >
                        <FileText size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredData.length === 0 && (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search size={32} />
              </div>
              <p className="text-slate-500 font-bold">No employees found matching your search.</p>
            </div>
          )}
        </div>
      </div>

      {/* History Modal */}
      <AnimatePresence>
        {showHistory && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="modal-overlay" onClick={() => setShowHistory(false)}>
            <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="modal-box" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-100 rounded-xl text-slate-600">
                    <Clock size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Payroll History</h3>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Previous cycles</p>
                  </div>
                </div>
                <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="modal-body custom-scrollbar space-y-4">
                {historyData.length > 0 ? historyData.map((item, i) => (
                  <div key={i} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-primary/20 transition-all">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.cycle}</p>
                      <h4 className="text-lg font-black text-slate-800">{item.total}</h4>
                      <p className="text-[10px] font-bold text-slate-500">Paid on {item.date}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">{item.status}</span>
                      <button className="p-2 bg-white rounded-xl text-slate-400 hover:text-primary transition-colors shadow-sm">
                        <Download size={18} />
                      </button>
                    </div>
                  </div>
                )) : (
                  <div className="py-10 text-center text-xs font-black text-slate-300 uppercase tracking-widest">
                    No payroll history found
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button onClick={() => setShowHistory(false)} className="w-full btn-secondary py-2.5 text-[10px] font-black uppercase">Close</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Process Cycle Date Selection Modal */}
      <AnimatePresence>
        {showProcessModal && (
          <Modal title="Process Payroll Cycle" onClose={() => setShowProcessModal(false)} type="delete">
            <div className="space-y-4">
              <p className="text-xs text-slate-500 font-medium mb-4 text-center">Select the specific time period you want to process payroll for.</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Start Date</label>
                  <input 
                    type="date" 
                    value={cycleStartDate}
                    onChange={(e) => setCycleStartDate(e.target.value)}
                    className="input-field mt-1" 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">End Date</label>
                  <input 
                    type="date" 
                    value={cycleEndDate}
                    onChange={(e) => setCycleEndDate(e.target.value)}
                    className="input-field mt-1" 
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowProcessModal(false)} className="flex-1 btn-secondary py-3">Cancel</button>
                <button 
                  onClick={executeProcessCycle} 
                  disabled={isProcessing || !cycleStartDate || !cycleEndDate} 
                  className="flex-1 btn-primary py-3 font-black text-[10px] tracking-widest uppercase shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {isProcessing ? 'Processing...' : 'Run Payroll'}
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Process Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="modal-overlay" onClick={() => setShowSuccess(false)}>
            <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="modal-box modal-sm" 
              style={{ maxWidth: '380px', width: '95%', margin: '0 auto' }}
              onClick={(e) => e.stopPropagation()}>
              <div className="p-6 sm:p-8 text-center">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-500 border border-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight mb-1">Cycle Processed!</h3>
                  <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
                    The payroll cycle from <strong>{cycleStartDate}</strong> to <strong>{cycleEndDate}</strong> has been processed successfully. Payouts are scheduled.
                  </p>
                <button onClick={() => setShowSuccess(false)} className="w-full btn-primary py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-transform active:scale-95">
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Pay Slip Modal */}
      <AnimatePresence>
        {showSlipModal && selectedSlip && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="modal-overlay" onClick={() => setShowSlipModal(false)}>
            <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="modal-box modal-lg" 
              style={{ maxWidth: '500px', width: '95%', margin: '0 auto' }}
              onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Salary Slip</h3>
                <button onClick={() => setShowSlipModal(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
              <div className="modal-body custom-scrollbar print:p-0" id="printable-slip">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4 border-b-2 border-slate-900 pb-4">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">SALARY SLIP</h2>
                    <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em] mt-1.5">Private & Confidential</p>
                    <div className="flex items-center gap-3 mt-3">
                       <p className="text-[8px] font-bold text-slate-500 flex items-center gap-1 uppercase"><Clock size={10} /> Generated: {new Date().toLocaleDateString()}</p>
                       <p className="text-[8px] font-bold text-slate-500 flex items-center gap-1 uppercase">Cycle: {selectedSlip.cycle || 'Monthly'}</p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{settings?.business_name || 'BIOTRACK PRO'}</h3>
                    <p className="text-[9px] font-bold text-slate-600 mt-1 uppercase max-w-[200px] leading-relaxed">{settings?.business_address || '123 Business Road, Corporate Plaza'}</p>
                    {(settings?.business_phone || settings?.business_email) && (
                      <p className="text-[9px] font-bold text-slate-600 mt-1 uppercase">
                        {settings?.business_phone} 
                        {settings?.business_phone && settings?.business_email && ' | '} 
                        {settings?.business_email}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-y border-slate-100 mb-6">
                  <div className="space-y-0.5">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Employee Details</p>
                    <h4 className="text-sm font-black text-slate-800">{selectedSlip.name}</h4>
                    <p className="text-[10px] font-bold text-slate-600 uppercase">ID: {selectedSlip.employee_id}</p>
                    <p className="text-[10px] font-bold text-slate-600 uppercase">Status: {selectedSlip.status}</p>
                  </div>
                  <div className="text-left sm:text-right space-y-0.5">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Payment Cycle</p>
                    <h4 className="text-xs font-black text-slate-800">{selectedSlip.cycle || 'Monthly Cycle'}</h4>
                    <p className="text-[10px] font-bold text-slate-600 uppercase">Hours: {selectedSlip.total_hours}h</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h5 className="text-[9px] font-black text-slate-800 uppercase tracking-widest mb-2 pb-1.5 border-b border-slate-50">Earnings Breakdown</h5>
                    <div className="flex justify-between items-center py-1.5">
                      <span className="text-[11px] font-bold text-slate-600">Base Salary</span>
                      <span className="text-[11px] font-black text-slate-800">{currencySymbol}{parseFloat(selectedSlip.base_salary).toLocaleString() || '0'}</span>
                    </div>
                    {selectedSlip.overtime > 0 && (
                      <div className="flex justify-between items-center py-1.5">
                        <span className="text-[11px] font-bold text-slate-600">Overtime</span>
                        <span className="text-[11px] font-black text-slate-800">{currencySymbol}{parseFloat(selectedSlip.overtime).toLocaleString() || '0'}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center py-2 bg-slate-50 px-3 rounded-lg mt-1">
                      <span className="text-[11px] font-black text-slate-800">Total Gross</span>
                      <span className="text-[11px] font-black text-slate-800">{currencySymbol}{(parseFloat(selectedSlip.base_salary) + parseFloat(selectedSlip.overtime || 0)).toLocaleString() || '0'}</span>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-2 pb-1.5 border-b border-rose-50">Deductions</h5>
                    {(parseFloat(selectedSlip.deductions || 0) - parseFloat(selectedSlip.uif_amount || 0) - parseFloat(selectedSlip.advance_deduction || 0)) > 0 && (
                      <div className="flex justify-between items-center py-1.5">
                        <span className="text-[11px] font-bold text-slate-600">Late / Absence Deductions</span>
                        <span className="text-[11px] font-black text-rose-500">{currencySymbol}{(parseFloat(selectedSlip.deductions || 0) - parseFloat(selectedSlip.uif_amount || 0) - parseFloat(selectedSlip.advance_deduction || 0)).toLocaleString() || '0'}</span>
                      </div>
                    )}
                    {parseFloat(selectedSlip.cpf_employee || selectedSlip.uif_amount || 0) > 0 ? (
                      <div className="flex justify-between items-center py-1.5">
                        <span className="text-[11px] font-bold text-slate-600">Employee CPF Deduction</span>
                        <span className="text-[11px] font-black text-rose-500">{currencySymbol}{parseFloat(selectedSlip.cpf_employee || selectedSlip.uif_amount || 0).toLocaleString()}</span>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center py-1.5">
                        <span className="text-[11px] font-bold text-slate-400">CPF Contribution</span>
                        <span className="text-[11px] font-bold text-slate-400 italic">Not Applicable ({currencySymbol}0.00)</span>
                      </div>
                    )}
                    {parseFloat(selectedSlip.cpf_employer || 0) > 0 && (
                      <div className="flex justify-between items-center py-1.5">
                        <span className="text-[11px] font-bold text-slate-600">Employer CPF Contribution</span>
                        <span className="text-[11px] font-black text-blue-500">{currencySymbol}{parseFloat(selectedSlip.cpf_employer || 0).toLocaleString()}</span>
                      </div>
                    )}
                    {parseFloat(selectedSlip.advance_deduction || 0) > 0 && (
                      <div className="flex justify-between items-center py-1.5">
                        <span className="text-[11px] font-bold text-slate-600">Advance Deduction</span>
                        <span className="text-[11px] font-black text-rose-500">{currencySymbol}{parseFloat(selectedSlip.advance_deduction || 0).toLocaleString() || '0'}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center py-2 bg-rose-50 px-3 rounded-lg mt-1 border border-rose-100">
                      <span className="text-[11px] font-black text-rose-600">Total Deductions</span>
                      <span className="text-[11px] font-black text-rose-600">{currencySymbol}{parseFloat(selectedSlip.deductions).toLocaleString() || '0'}</span>
                    </div>
                  </div>

                  <div className="p-4 bg-primary text-white rounded-2xl mt-4 shadow-lg shadow-primary/20">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60">Net Payout</p>
                        <h3 className="text-2xl font-black tracking-tighter mt-0.5">{currencySymbol}{parseFloat(selectedSlip.net_salary).toLocaleString() || '0'}</h3>
                      </div>
                      <CheckCircle2 size={32} className="opacity-20" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer flex-wrap gap-2">
                <button onClick={() => setShowSlipModal(false)} className="flex-1 btn-secondary py-2 text-[9px] font-black uppercase tracking-widest">Close</button>
                <button onClick={() => handleDownload(`${selectedSlip.name}_Slip.pdf`, 'printable-slip')} className="flex-1 btn-primary flex items-center justify-center gap-1.5 py-2 text-[9px] font-black uppercase tracking-widest"><Download size={14} /> Download</button>
                <button onClick={() => handlePrint('printable-slip')} className="flex-1 btn-primary flex items-center justify-center gap-1.5 py-2 text-[9px] font-black uppercase tracking-widest"><Printer size={14} /> Print</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Payment Custom Modal */}
      <AnimatePresence>
        {showBulkPayModal && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setShowBulkPayModal(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full mx-4 relative z-10 overflow-hidden flex flex-col max-h-[85vh]"
              style={{ maxWidth: '450px' }}
            >
              <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl">
                    <Wallet size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800 tracking-tight">Process Bulk Payment</h3>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{pendingPayrolls.length} Pending Payrolls</p>
                  </div>
                </div>
                <button onClick={() => setShowBulkPayModal(false)} className="p-2 text-slate-400 hover:text-slate-600 bg-white rounded-full shadow-sm">
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 overflow-y-auto flex-1 bg-white">
                <div className="flex justify-between items-center mb-3 px-1">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                      checked={selectedPayrolls.length === pendingPayrolls.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPayrolls(pendingPayrolls.map(p => p.id));
                        } else {
                          setSelectedPayrolls([]);
                        }
                      }}
                    />
                    <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900">Select All Pending</span>
                  </label>
                  <span className="text-xs font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-full">
                    {selectedPayrolls.length} Selected
                  </span>
                </div>

                <div className="space-y-2">
                  {pendingPayrolls.map((emp) => (
                    <label 
                      key={emp.id} 
                      className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                        selectedPayrolls.includes(emp.id) ? 'bg-emerald-50/50 border-emerald-200' : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                          checked={selectedPayrolls.includes(emp.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPayrolls(prev => [...prev, emp.id]);
                            } else {
                              setSelectedPayrolls(prev => prev.filter(id => id !== emp.id));
                            }
                          }}
                        />
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                          {emp.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{emp.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{emp.total_hours} Hours Worked</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-slate-800">{currencySymbol}{parseFloat(emp.net_salary).toLocaleString()}</p>
                        {parseFloat(emp.deductions) > 0 && (
                          <p className="text-[10px] font-bold text-rose-500">-{currencySymbol}{parseFloat(emp.deductions).toLocaleString()} DED.</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col justify-between gap-4">
                <div className="flex justify-between items-end">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Selected</p>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                    {currencySymbol}
                    {payrollData
                      .filter(p => selectedPayrolls.includes(p.id))
                      .reduce((acc, curr) => acc + parseFloat(curr.net_salary || 0), 0)
                      .toLocaleString()}
                  </h3>
                </div>
                <div className="flex items-center gap-2 w-full">
                  <button 
                    onClick={() => setShowBulkPayModal(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={confirmBulkPayment}
                    disabled={selectedPayrolls.length === 0}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle2 size={18} /> Mark as Paid
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Individual Pay Confirmation Modal */}
      <AnimatePresence>
        {showPayConfirm && payConfirmData && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setShowPayConfirm(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full mx-4 relative z-10 overflow-hidden"
              style={{ maxWidth: '420px' }}
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-100 text-amber-600 rounded-xl">
                    <Wallet size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-800 tracking-tight">Confirm Payment</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Review Details Before Paying</p>
                  </div>
                </div>
                <button onClick={() => setShowPayConfirm(false)} className="p-2 text-slate-400 hover:text-slate-600 bg-white rounded-full shadow-sm">
                  <X size={18} />
                </button>
              </div>

              {/* Employee Info */}
              <div className="px-6 pt-5 pb-4">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 overflow-hidden border-2 border-slate-200 shadow-sm shrink-0">
                    {payConfirmData.photo ? (
                      <img src={payConfirmData.photo} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(payConfirmData.name)}&background=random&size=56`} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-800 tracking-tight leading-none">{payConfirmData.name}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Employee ID: {payConfirmData.employee_id}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                      Cycle: {payConfirmData.cycle_start ? new Date(payConfirmData.cycle_start).toLocaleDateString() : '—'} → {payConfirmData.cycle_end ? new Date(payConfirmData.cycle_end).toLocaleDateString() : '—'}
                    </p>
                  </div>
                </div>

                {/* Breakdown */}
                <div className="space-y-2.5 mb-4">
                  <div className="flex justify-between items-center py-2 px-3 bg-slate-50 rounded-xl">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Work Hours</span>
                    <span className="text-sm font-black text-slate-800">{payConfirmData.total_hours || '0.00'} hrs</span>
                  </div>
                  <div className="flex justify-between items-center py-2 px-3 bg-slate-50 rounded-xl">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Base Salary</span>
                    <span className="text-sm font-black text-slate-800">{currencySymbol}{parseFloat(payConfirmData.base_salary || 0).toLocaleString()}</span>
                  </div>
                  {parseFloat(payConfirmData.cpf_employee || payConfirmData.uif_amount || 0) > 0 && (
                    <div className="flex justify-between items-center py-2 px-3 bg-rose-50 rounded-xl">
                      <span className="text-[11px] font-bold text-rose-500 uppercase tracking-wider">Employee CPF Deduction</span>
                      <span className="text-sm font-black text-rose-500">-{currencySymbol}{parseFloat(payConfirmData.cpf_employee || payConfirmData.uif_amount || 0).toLocaleString()}</span>
                    </div>
                  )}
                  {parseFloat(payConfirmData.cpf_employer || 0) > 0 && (
                    <div className="flex justify-between items-center py-2 px-3 bg-blue-50 rounded-xl">
                      <span className="text-[11px] font-bold text-blue-500 uppercase tracking-wider">Employer CPF Contribution</span>
                      <span className="text-sm font-black text-blue-500">{currencySymbol}{parseFloat(payConfirmData.cpf_employer || 0).toLocaleString()}</span>
                    </div>
                  )}
                  {parseFloat(payConfirmData.advance_deduction || 0) > 0 && (
                    <div className="flex justify-between items-center py-2 px-3 bg-rose-50 rounded-xl">
                      <span className="text-[11px] font-bold text-rose-500 uppercase tracking-wider">Advance Deduction</span>
                      <span className="text-sm font-black text-rose-500">-{currencySymbol}{parseFloat(payConfirmData.advance_deduction || 0).toLocaleString()}</span>
                    </div>
                  )}
                  {(parseFloat(payConfirmData.deductions || 0) - parseFloat(payConfirmData.uif_amount || 0) - parseFloat(payConfirmData.advance_deduction || 0)) > 0 && (
                    <div className="flex justify-between items-center py-2 px-3 bg-rose-50 rounded-xl">
                      <span className="text-[11px] font-bold text-rose-500 uppercase tracking-wider">Late Deductions</span>
                      <span className="text-sm font-black text-rose-500">-{currencySymbol}{(parseFloat(payConfirmData.deductions || 0) - parseFloat(payConfirmData.uif_amount || 0) - parseFloat(payConfirmData.advance_deduction || 0)).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-2 px-3 bg-amber-50 rounded-xl border border-amber-100">
                    <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Total Deductions</span>
                    <span className="text-sm font-black text-amber-600">-{currencySymbol}{parseFloat(payConfirmData.deductions || 0).toLocaleString()}</span>
                  </div>
                </div>

                {/* Net Pay Highlight */}
                <div className="p-4 bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-2xl shadow-lg shadow-emerald-600/20">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60">Net Payout</p>
                      <h3 className="text-2xl font-black tracking-tighter mt-0.5">{currencySymbol}{parseFloat(payConfirmData.net_salary || 0).toLocaleString()}</h3>
                    </div>
                    <Wallet size={32} className="opacity-20" />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center gap-2">
                <button 
                  onClick={() => setShowPayConfirm(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmSinglePayment}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
                >
                  <CheckCircle2 size={18} /> Confirm & Pay
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Email Sending Progress Modal */}
      <AnimatePresence>
        {showEmailModal && (
          <Modal title="Email Payslips" onClose={() => {
            if (!isSendingEmails) {
              setShowEmailModal(false);
              setEmailProgress(null);
            }
          }} type="default">
            <div className="space-y-6">
              {!isSendingEmails && !emailProgress ? (
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 bg-sky-50 text-sky-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <Mail size={32} />
                  </div>
                  <h3 className="text-lg font-black text-slate-800 tracking-tight">Send Payslips via Email</h3>
                  <p className="text-sm text-slate-500">
                    This will queue {currentCycleData.length} payslips to be sent via email to employees. 
                    The process will run securely in the background.
                  </p>
                  <div className="flex gap-3 pt-4">
                    <button onClick={() => setShowEmailModal(false)} className="flex-1 btn-secondary py-3">Cancel</button>
                    <button 
                      onClick={confirmSendEmails} 
                      className="flex-1 btn-primary py-3 font-black text-[10px] tracking-widest uppercase shadow-lg shadow-primary/20"
                    >
                      <Send size={16} className="inline mr-2" /> Start Sending
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-6 space-y-6 text-center">
                  <h3 className="text-lg font-black text-slate-800 tracking-tight mb-2">Sending Emails...</h3>
                  
                  {emailProgress && (
                    <div className="space-y-4">
                      <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden shadow-inner">
                        <div 
                          className="bg-primary h-4 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(5, ((emailProgress.sent + emailProgress.failed) / emailProgress.total) * 100)}%` }}
                        ></div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <p className="text-xs font-bold text-slate-500 uppercase">Queued</p>
                          <h4 className="text-xl font-black text-slate-800">{emailProgress.queued}</h4>
                        </div>
                        <div className="p-3 bg-sky-50 rounded-xl border border-sky-100">
                          <p className="text-xs font-bold text-sky-600 uppercase">Processing</p>
                          <h4 className="text-xl font-black text-sky-700">{emailProgress.processing}</h4>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                          <p className="text-xs font-bold text-emerald-600 uppercase">Sent</p>
                          <h4 className="text-xl font-black text-emerald-700">{emailProgress.sent}</h4>
                        </div>
                        <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
                          <p className="text-xs font-bold text-rose-600 uppercase">Failed</p>
                          <h4 className="text-xl font-black text-rose-700">{emailProgress.failed}</h4>
                        </div>
                      </div>
                    </div>
                  )}

                  {!isSendingEmails && emailProgress && emailProgress.queued === 0 && emailProgress.processing === 0 && (
                    <div className="pt-4">
                      <p className="text-emerald-600 font-bold mb-4 flex items-center justify-center gap-2">
                        <CheckCircle2 size={18} /> Processing Completed!
                      </p>
                      <button 
                        onClick={() => { setShowEmailModal(false); setEmailProgress(null); }} 
                        className="w-full btn-primary py-3"
                      >
                        Close
                      </button>
                    </div>
                  )}
                  {isSendingEmails && (
                     <p className="text-xs text-slate-400 flex items-center justify-center gap-2 mt-4">
                        <Loader2 size={14} className="animate-spin" /> Do not close this window if you want to monitor progress.
                     </p>
                  )}
                </div>
              )}
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* WhatsApp Bulk Sending Modal */}
      <AnimatePresence>
        {showWhatsAppBulkModal && (
          <Modal title="WhatsApp Bulk Payslip Dispatch" onClose={() => {
            if (!isSendingWhatsApp) {
              setShowWhatsAppBulkModal(false);
            }
          }} type="default">
            <div className="space-y-6">
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <MessageSquare size={32} />
                </div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight">Send Payslips via WhatsApp</h3>
                <p className="text-sm text-slate-500">
                  This will dispatch payslip PDFs via WhatsApp to all <strong>{currentCycleData.length} employees</strong> in the current cycle.
                  Dispatches are rate-controlled with concurrency protection.
                </p>
                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setShowWhatsAppBulkModal(false)} 
                    disabled={isSendingWhatsApp}
                    className="flex-1 btn-secondary py-3"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={confirmSendBulkWhatsApp} 
                    disabled={isSendingWhatsApp}
                    className="flex-1 btn-primary !bg-emerald-600 hover:!bg-emerald-700 py-3 font-black text-[10px] tracking-widest uppercase shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                  >
                    {isSendingWhatsApp ? (
                      <>
                        <Loader2 size={16} className="inline mr-2 animate-spin" /> Sending...
                      </>
                    ) : (
                      <>
                        <Send size={16} className="inline mr-2" /> Start Sending
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* WhatsApp Bulk Summary Modal */}
      <AnimatePresence>
        {whatsAppBulkSummary && (
          <Modal title="WhatsApp Dispatch Summary" onClose={() => setWhatsAppBulkSummary(null)} type="default">
            <div className="space-y-6 py-4">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 size={28} />
                </div>
                <h3 className="text-lg font-black text-slate-800">Dispatch Completed</h3>
                <p className="text-xs text-slate-500">{whatsAppBulkSummary.message}</p>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase">Total</p>
                  <h4 className="text-xl font-black text-slate-800">{whatsAppBulkSummary.total}</h4>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <p className="text-[10px] font-black text-emerald-600 uppercase">Sent</p>
                  <h4 className="text-xl font-black text-emerald-700">{whatsAppBulkSummary.sent}</h4>
                </div>
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
                  <p className="text-[10px] font-black text-rose-600 uppercase">Failed</p>
                  <h4 className="text-xl font-black text-rose-700">{whatsAppBulkSummary.failed}</h4>
                </div>
              </div>

              {whatsAppBulkSummary.errors && whatsAppBulkSummary.errors.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <p className="text-[10px] font-black uppercase tracking-wider text-rose-600">Failure Details:</p>
                  {whatsAppBulkSummary.errors.map((err, idx) => (
                    <div key={idx} className="text-xs text-slate-600 flex justify-between gap-2 border-b border-slate-100 pb-1">
                      <span className="font-bold text-slate-800">{err.employee}:</span>
                      <span className="text-rose-600 font-medium">{err.reason}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => { setWhatsAppBulkSummary(null); navigate('/admin/whatsapp-logs'); }}
                  className="flex-1 btn-secondary py-3 text-xs"
                >
                  View WhatsApp Logs
                </button>
                <button
                  onClick={() => setWhatsAppBulkSummary(null)}
                  className="flex-1 btn-primary py-3 text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};

const Modal = ({ title, children, onClose, type = 'default' }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="modal-overlay"
    onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
  >
    <motion.div
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 60, opacity: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 320 }}
      className={`modal-box ${type === 'delete' ? 'modal-sm' : 'w-full mx-4'}`}
      style={{ maxWidth: type === 'delete' ? '440px' : '640px' }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="modal-header">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">{title}</h3>
        <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-500 transition-colors bg-white rounded-xl border border-slate-100 shadow-sm">
          <X size={18} />
        </button>
      </div>
      <div className="modal-body custom-scrollbar">
        {children}
      </div>
    </motion.div>
  </motion.div>
);

export default Payroll;
