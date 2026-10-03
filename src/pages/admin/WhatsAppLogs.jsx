import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/axios';
import { MessageSquare, RefreshCw, XCircle, CheckCircle2, AlertCircle, Clock, ArrowLeft, Send } from 'lucide-react';
import { useUI } from '../../context/UIContext';

const WhatsAppLogs = () => {
    const navigate = useNavigate();
    const { showAlert } = useUI();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [retrying, setRetrying] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const response = await api.get('/whatsapp/logs');
            setLogs(response.data || []);
        } catch (err) {
            console.error('Failed to fetch WhatsApp logs', err);
            showAlert('Failed to load WhatsApp logs', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const handleRetry = async () => {
        const failedLogs = logs.filter(l => l.status === 'failed');
        if (failedLogs.length === 0) return;

        try {
            setRetrying(true);
            const res = await api.post('/whatsapp/retry-logs', { logIds: failedLogs.map(l => l.id) });
            showAlert(res.data.message || 'Retry processed successfully', 'success');
            fetchLogs();
        } catch (err) {
            console.error('Failed to retry WhatsApp deliveries:', err);
            showAlert(err.response?.data?.error || 'Failed to retry WhatsApp deliveries', 'error');
        } finally {
            setRetrying(false);
        }
    };

    const filteredLogs = logs.filter(l => 
        (l.employee_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (l.phone || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (l.status || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const sentCount = logs.filter(l => l.status === 'sent').length;
    const failedCount = logs.filter(l => l.status === 'failed').length;

    return (
        <div className="space-y-6 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate('/admin/payroll')}
                        className="p-2.5 bg-white border border-slate-100 hover:bg-slate-50 rounded-2xl transition-colors text-slate-500 hover:text-slate-700 shadow-sm"
                        title="Back to Payroll"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
                            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                                <MessageSquare size={22} />
                            </span>
                            WhatsApp Delivery Logs
                        </h1>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                            Track E-Payslip WhatsApp Dispatches &amp; Failure Diagnoses
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={fetchLogs} 
                        disabled={loading}
                        className="btn-secondary flex items-center gap-2 text-xs py-2.5 px-4 font-black uppercase tracking-wider"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
                    </button>
                    <button 
                        onClick={handleRetry} 
                        disabled={retrying || failedCount === 0}
                        className="btn-primary !bg-emerald-600 hover:!bg-emerald-700 flex items-center gap-2 text-xs py-2.5 px-5 font-black uppercase tracking-wider disabled:opacity-50 shadow-lg shadow-emerald-600/20"
                    >
                        <RefreshCw size={14} className={retrying ? 'animate-spin' : ''} /> 
                        {retrying ? 'Retrying...' : `Retry Failed (${failedCount})`}
                    </button>
                </div>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="card p-5 border border-slate-100/80 bg-white">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Dispatched</p>
                    <h3 className="text-2xl font-black text-slate-800 mt-1">{logs.length}</h3>
                </div>
                <div className="card p-5 border border-emerald-100/80 bg-emerald-50/30">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Delivered / Sent</p>
                    <h3 className="text-2xl font-black text-emerald-600 mt-1">{sentCount}</h3>
                </div>
                <div className="card p-5 border border-rose-100/80 bg-rose-50/30">
                    <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Failed Deliveries</p>
                    <h3 className="text-2xl font-black text-rose-600 mt-1">{failedCount}</h3>
                </div>
            </div>

            {/* Search Filter */}
            <div className="flex items-center justify-between gap-4">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by employee name, phone, or status..."
                    className="w-full sm:w-80 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none"
                />
            </div>

            {/* Logs Table */}
            <div className="card !p-0 overflow-hidden shadow-sm border border-slate-100">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="p-4 font-black text-slate-400 text-[10px] uppercase tracking-widest">Employee</th>
                                <th className="p-4 font-black text-slate-400 text-[10px] uppercase tracking-widest">WhatsApp Number</th>
                                <th className="p-4 font-black text-slate-400 text-[10px] uppercase tracking-widest">Payroll Cycle</th>
                                <th className="p-4 font-black text-slate-400 text-[10px] uppercase tracking-widest">Status</th>
                                <th className="p-4 font-black text-slate-400 text-[10px] uppercase tracking-widest">Message ID / Error Detail</th>
                                <th className="p-4 font-black text-slate-400 text-[10px] uppercase tracking-widest">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="text-center p-12 text-slate-400 font-bold text-xs">
                                        <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-emerald-500" />
                                        Loading WhatsApp logs...
                                    </td>
                                </tr>
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center p-12 text-slate-400 font-bold text-xs">
                                        No WhatsApp delivery logs found.
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                                        <td className="p-4">
                                            <p className="text-sm font-black text-slate-800">{log.employee_name}</p>
                                            <p className="text-[10px] text-slate-400 font-bold">ID #{log.employee_id}</p>
                                        </td>
                                        <td className="p-4 text-xs font-bold text-slate-700">
                                            {log.phone ? (
                                                <span className="font-mono bg-slate-100 px-2 py-0.5 rounded-md text-[11px] text-slate-800">
                                                    {log.phone}
                                                </span>
                                            ) : (
                                                <span className="text-slate-300">---</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-xs font-bold text-slate-600">
                                            {log.cycle_start ? (
                                                `${new Date(log.cycle_start).toLocaleDateString()} - ${log.cycle_end ? new Date(log.cycle_end).toLocaleDateString() : ''}`
                                            ) : (
                                                'Recent Payroll'
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {log.status === 'sent' ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200/60 rounded-full text-[10px] font-black uppercase tracking-wider">
                                                    <CheckCircle2 size={12} /> Sent
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-600 border border-rose-200/60 rounded-full text-[10px] font-black uppercase tracking-wider">
                                                    <XCircle size={12} /> Failed
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-xs max-w-xs">
                                            {log.status === 'sent' ? (
                                                <span className="text-[10px] font-mono text-slate-400 truncate block" title={log.message_id || 'Meta Cloud WAMID'}>
                                                    {log.message_id || 'Delivered to WhatsApp'}
                                                </span>
                                            ) : (
                                                <span className="text-[11px] font-bold text-rose-600 block leading-tight" title={log.error_message}>
                                                    {log.error_message || 'Delivery failed'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-xs font-bold text-slate-500 whitespace-nowrap">
                                            {log.created_at ? new Date(log.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '---'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default WhatsAppLogs;
