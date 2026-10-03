import React, { useState, useEffect } from 'react';
import api from '../../utils/axios';
import { useSettings } from '../../context/SettingsContext';
import {
  Users,
  UserCheck,
  UserMinus,
  Clock,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  CalendarCheck,
  Calendar,
  Wallet
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { motion } from 'framer-motion';

const data = [];

const StatCard = ({ title, value, icon, trend, trendValue, color }) => (
  <motion.div
    whileHover={{ y: -3 }}
    className="card flex items-center gap-4"
  >
    <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-${color.split('-')[1]}-600 shrink-0 shadow-sm`}>
      {React.cloneElement(icon, { size: 20 })}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-slate-400 text-[11px] font-black uppercase tracking-widest truncate">{title}</p>
      <div className="flex items-baseline gap-2">
        <h3 className="text-xl font-black text-slate-800 leading-none">{value}</h3>
        <div className={`flex items-center text-[10px] font-black ${trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
          {trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {trendValue}
        </div>
      </div>
    </div>
  </motion.div>
);

const AdminDashboard = () => {
  const { currencySymbol } = useSettings();
  const [stats, setStats] = useState({
    totalStaff: 0,
    presentNow: 0,
    absentToday: 0,
    lateEntry: 0,
    trend: [],
    salaryCycle: {
      progress: 0,
      day: 0,
      totalDays: 15,
      estimatedPayout: 0,
      pendingAmount: 0
    }
  });
  const [range, setRange] = useState(7);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, [range]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const offset = now.getTimezoneOffset();
      const localDate = new Date(now.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0];

      const [empRes, attRes, statsRes, settingsRes] = await Promise.all([
        api.get('/employees'),
        api.get('/attendance', { params: { date: localDate } }),
        api.get('/stats/dashboard', { params: { date: localDate, range } }),
        api.get('/settings')
      ]);

      setEmployees(empRes.data);
      setAttendanceLogs(attRes.data);
      setStats(statsRes.data);
      setSettings(settingsRes.data);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between no-print">
        <div>
          <h1 className="text-xl font-black text-slate-800 uppercase tracking-tighter">
            {settings?.business_name || 'Admin Dashboard'}
          </h1>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest leading-none">
            UPCOMING PAY DATE: {new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() <= 15 ? 15 : 30).toLocaleDateString()}
          </p>
        </div>

      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Staff" 
          value={loading ? '...' : stats.totalStaff} 
          icon={<Users />} 
          trend={stats.totalStaffTrend?.trend || 'up'} 
          trendValue={stats.totalStaffTrend?.value || '0%'} 
          color="bg-indigo-500" 
        />
        <StatCard 
          title="Present Now" 
          value={loading ? '...' : stats.presentToday} 
          icon={<UserCheck />} 
          trend={stats.presentTrend?.trend || 'up'} 
          trendValue={stats.presentTrend?.value || '0%'} 
          color="bg-emerald-500" 
        />
        <StatCard 
          title="Absent Today" 
          value={loading ? '...' : stats.absentToday} 
          icon={<UserMinus />} 
          trend={stats.absentTrend?.trend || 'down'} 
          trendValue={stats.absentTrend?.value || '0%'} 
          color="bg-rose-500" 
        />
        <StatCard 
          title="Late Entry" 
          value={loading ? '...' : stats.lateToday} 
          icon={<Clock />} 
          trend={stats.lateTrend?.trend || 'up'} 
          trendValue={stats.lateTrend?.value || '0%'} 
          color="bg-amber-500" 
        />
      </div>

      {/* Charts & Biometric Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        <div className="lg:col-span-2 card flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[12px] font-black text-slate-800 uppercase tracking-widest">Attendance Trend</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase">
                {range === 7 ? 'Weekly Performance Analytics' : range === 30 ? 'Monthly Performance Analytics' : 'Quarterly Performance Analytics'}
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 text-[10px] font-black text-primary uppercase tracking-tighter shadow-sm">
              Last 7 Days
            </div>
          </div>
          <div className="flex-1 w-full min-h-[240px]">
            {stats.trend && stats.trend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={50}>
                <AreaChart data={stats.trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorAbsent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '11px' }}
                    itemStyle={{ fontWeight: '900', textTransform: 'uppercase', fontSize: '9px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="present"
                    name="Present"
                    stroke="#4F46E5"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorPresent)"
                    animationDuration={1500}
                  />
                  <Area
                    type="monotone"
                    dataKey="absent"
                    name="Absent"
                    stroke="#EF4444"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorAbsent)"
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                <div className="w-8 h-8 border-2 border-slate-200 border-t-primary rounded-full animate-spin"></div>
                <p className="text-[10px] font-black uppercase tracking-widest">Loading Analytics...</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1 card h-full flex flex-col justify-center">
          <h3 className="text-[12px] font-black text-slate-800 uppercase tracking-widest mb-6">Salary Cycle</h3>
          <div className="flex flex-col items-center mb-6">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="64" cy="64" r="54" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-slate-100" />
                <circle cx="64" cy="64" r="54" stroke="currentColor" strokeWidth="10" fill="transparent" strokeDasharray={339} strokeDashoffset={339 * (1 - (stats.salaryCycle?.progress || 0) / 100)} strokeLinecap="round" className="text-primary transition-all duration-1000" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-slate-800">{stats.salaryCycle?.progress}%</span>
                <span className="text-[9px] font-black text-slate-400 uppercase">Day {stats.salaryCycle?.day}/{stats.salaryCycle?.totalDays}</span>
              </div>
            </div>
          </div>
          <div className="space-y-3 mt-auto">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Est. Payout</span>
              <span className="text-[12px] font-black text-slate-800">
                {currencySymbol}
                {stats.salaryCycle?.estimatedPayout >= 1000 
                  ? (stats.salaryCycle.estimatedPayout / 1000).toFixed(1) + 'k' 
                  : parseFloat(stats.salaryCycle?.estimatedPayout || 0).toLocaleString(undefined, { maximumFractionDigits: 1 })}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">CPF Contribution</span>
              <span className="text-[12px] font-black text-amber-600">{currencySymbol}{parseFloat(stats.totalCpfCollected || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Absent Staff List */}
      <div className="grid grid-cols-1 gap-4">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[12px] font-black text-slate-800 uppercase tracking-widest">Absent Staff List</h3>
            <span className="bg-rose-50 text-rose-600 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase">Not Clocked In Today</span>
          </div>
          <div className="overflow-x-auto max-h-[400px] custom-scrollbar">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-slate-50">
                  <th className="pb-3 font-black text-slate-400 text-[9px] uppercase tracking-widest">Employee Information</th>

                  <th className="pb-3 font-black text-slate-400 text-[9px] uppercase tracking-widest text-right">Current Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {!loading && stats.absentStaff && stats.absentStaff.length > 0 ? (
                  stats.absentStaff.map(emp => (
                    <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 text-[12px] font-black uppercase shadow-sm overflow-hidden">
                            {emp.photo ? <img src={emp.photo} className="w-full h-full object-cover" alt="" /> : emp.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-[12px] font-black text-slate-700 leading-tight">{emp.name}</p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Employee ID: {emp.custom_id || emp.id}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 text-right">
                        <span className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-[9px] font-black uppercase tracking-tighter border border-rose-100 shadow-sm">
                          Not Present
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="text-center">
                    <td colSpan="2" className="py-20">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-2">
                          <UserCheck size={24} />
                        </div>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                          {loading ? 'Analyzing real-time logs...' : 'Perfect Attendance! All staff are present.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
