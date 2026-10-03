import React, { useState, useEffect } from 'react';
import api from '../../utils/axios';
import { 
  MapPin, 
  Navigation, 
  AlertTriangle, 
  CheckCircle,
  Home,
  Building,
  RefreshCw,
  Compass,
  ArrowRight,
  LogOut
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const LocationCheck = () => {
  const navigate = useNavigate();
  const [branch, setBranch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [currentCoords, setCurrentCoords] = useState({ latitude: -26.2041, longitude: 28.0473 }); // default HQ
  const [simulationMode, setSimulationMode] = useState('live');
  const [distance, setDistance] = useState(0); // in meters
  const [insideArea, setInsideArea] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Haversine formula to calculate distance in meters
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth radius in meters
    const rad = Math.PI / 180;
    const dLat = (lat2 - lat1) * rad;
    const dLon = (lon2 - lon1) * rad;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const [isFaceDisabled, setIsFaceDisabled] = useState(false);
  const [isFaceRegistered, setIsFaceRegistered] = useState(false);
  const [usePinMode, setUsePinMode] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [punching, setPunching] = useState(false);
  const [punchSuccess, setPunchSuccess] = useState('');
  const [todayStatus, setTodayStatus] = useState(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  const fetchTodayStatus = async () => {
    try {
      const res = await api.get('/face/today-status');
      setTodayStatus(res.data);
      setIsFaceRegistered(res.data?.isFaceRegistered === true);
      if (res.data?.customId) {
        setPinInput(res.data.customId.toString());
      } else if (res.data?.employeeId && !pinInput) {
        setPinInput(res.data.employeeId.toString());
      }
    } catch (err) {
      console.error('Error fetching today attendance status:', err);
    }
  };

  const fetchAssignedBranch = async () => {
    try {
      setLoading(true);
      const [res, kioskRes] = await Promise.all([
        api.get('/geofences/assigned'),
        api.get('/kiosk/settings').catch(() => ({ data: null }))
      ]);

      if (kioskRes?.data && Number(kioskRes.data.face_recognition) === 0) {
        setIsFaceDisabled(true);
      }

      if (!res.data) {
        setBranch(null);
        setErrorMsg('You have no assigned work locations. Please contact your administrator.');
        setLoading(false);
        return;
      }

      setBranch(res.data);
      triggerLiveLocation(res.data);
      fetchTodayStatus();
    } catch (err) {
      console.error('Error fetching assigned branch:', err);
      setErrorMsg('Failed to load branch assignment details.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedBranch();
  }, []);

  const handlePinPunch = async (actionType) => {
    if (!pinInput.trim()) {
      setErrorMsg('Please enter your Employee ID or PIN.');
      return;
    }
    setPunching(true);
    setErrorMsg('');
    setPunchSuccess('');
    try {
      const payload = {
        skipFace: true,
        employeeId: pinInput.trim(),
        latitude: currentCoords.latitude,
        longitude: currentCoords.longitude
      };
      let res;
      if (actionType === 'check-in') {
        res = await api.post('/face/check-in', payload);
      } else {
        res = await api.post('/face/check-out', payload);
      }

      if (res.data?.success || res.status === 200) {
        setPunchSuccess(res.data?.message || 'Attendance marked successfully!');
        fetchTodayStatus();
      } else {
        setErrorMsg(res.data?.message || 'Attendance punch failed.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Failed to process attendance punch.');
    } finally {
      setPunching(false);
    }
  };

  const triggerLiveLocation = (targetBranch = branch) => {
    if (!targetBranch) {
      setErrorMsg('You have no assigned work locations. Please contact your administrator.');
      setLoading(false);
      return;
    }
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
      setLoading(false);
      return;
    }

    const locations = targetBranch.assigned_locations || [targetBranch];

    setGpsLoading(true);
    setErrorMsg('');
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCurrentCoords({ latitude: lat, longitude: lng });

        let isInsideAny = false;
        let minDistance = Infinity;
        let bestBranch = locations[0];

        for (const loc of locations) {
          const dist = calculateDistance(lat, lng, parseFloat(loc.latitude), parseFloat(loc.longitude));
          if (dist <= loc.radius) {
            isInsideAny = true;
            bestBranch = loc;
            minDistance = dist;
            break;
          }
          if (dist < minDistance) {
            minDistance = dist;
            bestBranch = loc;
          }
        }

        setDistance(minDistance);
        setInsideArea(isInsideAny);
        setBranch(prev => ({ ...prev, active_matched_name: bestBranch.name, active_radius: bestBranch.radius }));
        setGpsLoading(false);
        setLoading(false);
      },
      (error) => {
        console.error('GPS error:', error);
        setErrorMsg('GPS Permission Denied or unavailable. Please enable Location Services in your browser.');
        setInsideArea(false);
        setGpsLoading(false);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Location Verification</h1>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">
            Check checking-in alignment and coordinate distance clearance
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center gap-3">
          <AlertTriangle className="text-amber-500 shrink-0" size={18} />
          <p className="text-[11px] text-amber-700 font-bold uppercase tracking-wide">{errorMsg}</p>
        </div>
      )}

      {loading ? (
        <div className="card text-center py-20 bg-white border border-slate-100">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Querying assigned coordinates...</p>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
          
          {/* Status Details Card */}
          <div className="space-y-6">
            
            {/* Alignment Checker Screen Card */}
            <div className={`card border-2 bg-white ${
              insideArea 
                ? 'border-emerald-500/20 shadow-emerald-500/5' 
                : 'border-rose-500/20 shadow-rose-500/5'
            }`}>
              
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 flex-wrap gap-2">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Authorized Work Sites</span>
                <div className="flex flex-wrap gap-1.5">
                  {branch?.assigned_locations && branch.assigned_locations.length > 0 ? (
                    branch.assigned_locations.map(loc => (
                      <span key={loc.id} className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                        branch?.active_matched_name === loc.name && insideArea
                          ? 'bg-emerald-100 text-emerald-800 ring-2 ring-emerald-500/30'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {loc.name} ({loc.radius}m)
                      </span>
                    ))
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-600">
                      {branch?.name} ({branch?.radius}m)
                    </span>
                  )}
                </div>
              </div>

              {/* Status Graphic */}
              <div className="flex flex-col items-center justify-center text-center py-6">
                
                {insideArea ? (
                  <div className="w-20 h-20 bg-emerald-50 border border-emerald-100 text-emerald-500 rounded-3xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/10">
                    <CheckCircle size={40} className="animate-bounce" style={{ animationDuration: '3s' }} />
                  </div>
                ) : (
                  <div className="w-20 h-20 bg-rose-50 border border-rose-100 text-rose-500 rounded-3xl flex items-center justify-center mb-4 shadow-lg shadow-rose-500/10">
                    <AlertTriangle size={40} className="animate-pulse" />
                  </div>
                )}

                <h2 className={`text-2xl font-black tracking-tight uppercase ${
                  insideArea ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  {insideArea ? 'Inside Allowed Area' : 'Outside Allowed Area'}
                </h2>
                
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1.5 max-w-sm">
                  {insideArea 
                    ? `Clearance granted at ${branch?.active_matched_name || branch?.name}. Geofence checks succeeded.` 
                    : `Clock-in blocked. You are outside all your assigned work locations.`}
                </p>

                {insideArea && (
                  (!isFaceRegistered || isFaceDisabled || usePinMode) ? (
                    <div className="mt-6 pt-6 border-t border-slate-100 w-full space-y-4">
                      <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80 text-left space-y-4">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">Employee ID / PIN Attendance</span>
                          <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-md border ${
                            !isFaceRegistered 
                              ? 'bg-amber-50 text-amber-700 border-amber-200 font-bold' 
                              : isFaceDisabled
                              ? 'bg-slate-100 text-slate-600 border-slate-200'
                              : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                          }`}>
                            {!isFaceRegistered ? '⚠️ Face Not Registered (PIN Mode)' : isFaceDisabled ? 'Face Recognition: OFF' : 'PIN Mode Active'}
                          </span>
                        </div>

                        {punchSuccess && (
                          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl flex items-center gap-2 animate-in fade-in">
                            <CheckCircle size={16} />
                            <span>{punchSuccess}</span>
                          </div>
                        )}

                        <div className="space-y-3">
                          <div>
                            <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">
                              Employee ID or PIN Code
                            </label>
                            <input
                              type="text"
                              value={pinInput}
                              onChange={(e) => setPinInput(e.target.value)}
                              placeholder="Enter Employee ID (e.g. 1001)"
                              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm font-bold focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                            />
                          </div>

                          {(!todayStatus || todayStatus?.status === 'not_checked_in') && (
                            <button
                              type="button"
                              onClick={() => handlePinPunch('check-in')}
                              disabled={punching}
                              className="w-full py-3.5 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
                            >
                              <Navigation size={16} />
                              {punching ? 'Processing Check-In...' : 'Punch Check-In'}
                            </button>
                          )}

                          {todayStatus?.status === 'checked_in' && (
                            <div className="space-y-2">
                              <p className="text-[11px] text-emerald-600 font-bold text-center">
                                Checked in today at {new Date(todayStatus.in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                              <button
                                type="button"
                                onClick={() => setShowCheckoutModal(true)}
                                disabled={punching}
                                className="w-full py-3.5 px-6 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-rose-600/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
                              >
                                <Navigation size={16} />
                                {punching ? 'Processing Check-Out...' : 'Punch Check-Out'}
                              </button>
                            </div>
                          )}

                          {todayStatus?.status === 'checked_out' && (
                            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-center text-xs font-bold border border-emerald-100">
                              Completed check-out today at {new Date(todayStatus.out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Have a great day!
                            </div>
                          )}

                          {isFaceRegistered && !isFaceDisabled && (
                            <button
                              type="button"
                              onClick={() => setUsePinMode(false)}
                              className="text-[10px] font-bold text-primary hover:underline text-center w-full block pt-1"
                            >
                              ← Switch to Face Recognition (Smart Attendance)
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-6 flex flex-col items-center gap-3 w-full">
                      <button
                        onClick={() => navigate('/employee/face-attendance', { 
                          state: { 
                            verified: true,
                            latitude: currentCoords.latitude,
                            longitude: currentCoords.longitude
                          } 
                        })}
                        className="group relative inline-flex items-center justify-center px-8 py-3.5 font-bold text-white transition-all duration-300 bg-emerald-500 hover:bg-emerald-600 rounded-2xl hover:shadow-[0_0_40px_rgba(16,185,129,0.4)] hover:-translate-y-0.5 overflow-hidden w-full sm:w-auto"
                      >
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
                        <ArrowRight className="mr-2" size={18} />
                        <span className="uppercase tracking-widest text-[11px]">Proceed to Smart Face Attendance</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setUsePinMode(true)}
                        className="text-xs font-bold text-slate-500 hover:text-primary transition-colors flex items-center gap-1.5 py-1 cursor-pointer"
                      >
                        <span>Or Punch using Employee ID / PIN 🔑</span>
                      </button>
                    </div>
                  )
                )}
              </div>

              {/* Distance grid */}
              <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-100 bg-slate-50/50 p-4 rounded-2xl">
                <div>
                  <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Matched Work Site</span>
                  <p className="text-[13px] font-black text-slate-800 mt-0.5 truncate">{branch?.active_matched_name || branch?.name || '---'}</p>
                </div>
                <div>
                  <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Nearest Site Distance</span>
                  <p className={`text-[13px] font-black mt-0.5 ${
                    insideArea ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {distance < 1 
                      ? '0.00 Meters (On Point)' 
                      : distance >= 1000 
                        ? `${(distance / 1000).toFixed(2)} Kilometers` 
                        : `${distance.toFixed(1)} Meters`}
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Punch Out */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-700 text-center space-y-6"
          >
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto border border-rose-100 shadow-lg shadow-rose-500/10">
              <LogOut size={32} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Confirm Check-Out</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed font-medium">
                Are you sure you want to check out for today? This will record your end time and calculate today's total work hours.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCheckoutModal(false)}
                className="py-3.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black uppercase tracking-wider rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCheckoutModal(false);
                  handlePinPunch('check-out');
                }}
                className="py-3.5 px-4 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-rose-500/20 active:scale-95 transition-all"
              >
                Yes, Check-Out
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default LocationCheck;
