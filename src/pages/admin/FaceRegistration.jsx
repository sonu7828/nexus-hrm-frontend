import React, { useState, useEffect, useRef } from 'react';
import { Camera, Users, CheckCircle, AlertCircle, Lock, ShieldCheck, RefreshCw, Search, ChevronDown } from 'lucide-react';
import api from '../../utils/axios';
import faceService from '../../services/faceService';
import FaceScanner from '../../components/face/FaceScanner';
import { preloadFaceModels } from '../../hooks/useFaceModels';

const FaceRegistration = () => {
    const [employees, setEmployees] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [status, setStatus] = useState({ type: '', message: '' });
    const [isScanning, setIsScanning] = useState(false);
    
    // Parse URL parameters if redirected from Employees Edit page
    const queryParams = new URLSearchParams(window.location.search);
    const urlEmpId = queryParams.get('empId');
    const isReEnrollParam = queryParams.get('reEnroll') === 'true';

    const [isScanningUnlocked, setIsScanningUnlocked] = useState(isReEnrollParam);
    const [isFaceDisabled, setIsFaceDisabled] = useState(false);

    // Custom Dropdown & Search States
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [dropdownSearch, setDropdownSearch] = useState('');
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        fetchEmployees();
        preloadFaceModels(); // Start loading AI models in background
        api.get('/kiosk/settings').then(res => {
            if (res.data && Number(res.data.face_recognition) === 0) {
                setIsFaceDisabled(true);
            }
        }).catch(() => {});
    }, []);

    const fetchEmployees = async () => {
        try {
            const res = await api.get('/employees');
            let empData = [];
            if (Array.isArray(res.data)) {
                empData = res.data;
            } else if (res.data && res.data.data) {
                empData = res.data.data;
            }
            setEmployees(empData);
            
            // Auto-select and unlock scan if empId was passed in URL
            if (urlEmpId) {
                const match = empData.find(e => e.id.toString() === urlEmpId);
                if (match) {
                    setSelectedEmployee(match.id);
                    if (isReEnrollParam) {
                        setIsScanningUnlocked(true);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to fetch employees', error);
        }
    };

    const handleFaceDetected = async (descriptorArray) => {
        setIsScanning(false);
        try {
            const result = await faceService.registerFace(selectedEmployee, descriptorArray);
            setStatus({ type: 'success', message: 'Face registered and locked successfully!' });
            
            // Mark employee as registered in local list
            setEmployees(prev => prev.map(emp => 
                emp.id.toString() === selectedEmployee.toString() 
                    ? { ...emp, has_face_registered: 1 } 
                    : emp
            ));
            setIsScanningUnlocked(false);
        } catch (error) {
            setStatus({ type: 'error', message: error.response?.data?.message || 'Failed to register face.' });
        }
    };

    const selectedEmp = employees.find(e => e.id.toString() === selectedEmployee.toString());
    const isFaceLocked = selectedEmp && Number(selectedEmp.has_face_registered) === 1 && !isScanningUnlocked;

    // Filter and sort: Unregistered first, Locked/Enrolled last
    const unregisteredEmployees = employees
        .filter(emp => Number(emp.has_face_registered) !== 1)
        .filter(emp => 
            (emp.name || '').toLowerCase().includes(dropdownSearch.toLowerCase()) || 
            String(emp.custom_id || '').toLowerCase().includes(dropdownSearch.toLowerCase())
        );

    const registeredEmployees = employees
        .filter(emp => Number(emp.has_face_registered) === 1)
        .filter(emp => 
            (emp.name || '').toLowerCase().includes(dropdownSearch.toLowerCase()) || 
            String(emp.custom_id || '').toLowerCase().includes(dropdownSearch.toLowerCase())
        );

    return (
        <div className="p-4 sm:p-6 max-w-4xl mx-auto">
            <div className="mb-6 sm:mb-8 flex items-center gap-3">
                <div className="p-2 sm:p-3 bg-primary/20 text-primary rounded-xl shrink-0">
                    <Camera className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-black leading-tight">Face Registration</h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Register employee faces for biometric attendance</p>
                </div>
            </div>

            {isFaceDisabled && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3">
                    <AlertCircle className="text-amber-500 shrink-0" size={20} />
                    <p className="text-xs text-amber-800 font-bold">
                        Face Recognition Attendance is currently turned OFF in Kiosk Settings for your company. Enrolled faces will not be used for attendance until it is enabled.
                    </p>
                </div>
            )}

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-visible">
                <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Select Employee
                    </label>
                    
                    {/* Custom High-Contrast Dropdown with Search & Sorting */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            type="button"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="w-full bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-2xl px-4 py-3.5 flex items-center justify-between text-left text-white focus:ring-2 focus:ring-primary shadow-inner transition-all cursor-pointer"
                        >
                            <div className="flex items-center gap-3 truncate">
                                <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0 font-bold">
                                    <Users size={16} />
                                </div>
                                {selectedEmp ? (
                                    <div className="flex items-center gap-2 truncate">
                                        <span className="font-black text-sm text-white">
                                            {selectedEmp.custom_id} - {selectedEmp.name}
                                        </span>
                                        {Number(selectedEmp.has_face_registered) === 1 ? (
                                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                                🔒 Enrolled
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-sky-500/20 text-sky-400 border border-sky-500/30">
                                                Pending Scan
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    <span className="text-slate-400 text-sm font-bold">
                                        -- Choose an Employee to Register --
                                    </span>
                                )}
                            </div>
                            <ChevronDown size={18} className={`text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-primary' : ''}`} />
                        </button>

                        {/* Dropdown Menu - Always opens downwards */}
                        {isDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-80 flex flex-col animate-in fade-in slide-in-from-top-2 duration-150">
                                {/* Search Bar */}
                                <div className="p-3 border-b border-slate-800 bg-slate-950/80 sticky top-0 z-10">
                                    <div className="relative">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            value={dropdownSearch}
                                            onChange={(e) => setDropdownSearch(e.target.value)}
                                            placeholder="Search by employee name or ID..."
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-primary"
                                            onClick={(e) => e.stopPropagation()}
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                <div className="overflow-y-auto custom-scrollbar divide-y divide-slate-800/60">
                                    {/* ── 1. UNREGISTERED EMPLOYEES (TOP) ── */}
                                    {unregisteredEmployees.length > 0 && (
                                        <div className="p-2">
                                            <div className="px-3 py-1.5 text-[9px] font-black text-emerald-400 uppercase tracking-widest flex items-center justify-between">
                                                <span>Pending Face Scan ({unregisteredEmployees.length})</span>
                                                <span className="text-slate-500 font-bold">Click to Register</span>
                                            </div>
                                            {unregisteredEmployees.map(emp => (
                                                <button
                                                    key={emp.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedEmployee(emp.id);
                                                        setIsDropdownOpen(false);
                                                        setStatus({ type: '', message: '' });
                                                        setIsScanning(false);
                                                        setIsScanningUnlocked(false);
                                                    }}
                                                    className={`w-full p-3 rounded-xl flex items-center justify-between text-left transition-all group cursor-pointer ${
                                                        selectedEmployee.toString() === emp.id.toString()
                                                            ? 'bg-primary text-white shadow-md'
                                                            : 'hover:bg-slate-800 text-white'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2.5">
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                                                            selectedEmployee.toString() === emp.id.toString() ? 'bg-white/20 text-white' : 'bg-primary/20 text-primary'
                                                        }`}>
                                                            <Camera size={14} />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-black leading-tight text-white group-hover:text-primary-light">
                                                                {emp.custom_id} - {emp.name}
                                                            </p>
                                                            <p className="text-[10px] font-bold text-slate-400 leading-none mt-1">
                                                                {emp.role || 'Staff'} • Ready for enrollment
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className="text-[9px] font-black px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                                        Ready
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* ── 2. ALREADY REGISTERED EMPLOYEES (BOTTOM / LOCKED) ── */}
                                    {registeredEmployees.length > 0 && (
                                        <div className="p-2 bg-slate-950/40">
                                            <div className="px-3 py-1.5 text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center justify-between">
                                                <span>Already Registered & Locked ({registeredEmployees.length})</span>
                                                <span className="text-slate-600 font-bold">Locked</span>
                                            </div>
                                            {registeredEmployees.map(emp => {
                                                const isCurrentReEnroll = isReEnrollParam && emp.id.toString() === urlEmpId;
                                                return (
                                                    <button
                                                        key={emp.id}
                                                        type="button"
                                                        disabled={!isCurrentReEnroll}
                                                        onClick={() => {
                                                            if (isCurrentReEnroll) {
                                                                setSelectedEmployee(emp.id);
                                                                setIsDropdownOpen(false);
                                                                setStatus({ type: '', message: '' });
                                                                setIsScanning(false);
                                                                setIsScanningUnlocked(true);
                                                            }
                                                        }}
                                                        className={`w-full p-2.5 rounded-xl flex items-center justify-between text-left transition-all ${
                                                            isCurrentReEnroll
                                                                ? 'hover:bg-slate-800 text-white cursor-pointer'
                                                                : 'opacity-50 cursor-not-allowed text-slate-400'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 flex items-center justify-center shrink-0">
                                                                <Lock size={12} />
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-bold text-slate-300">
                                                                    {emp.custom_id} - {emp.name}
                                                                </p>
                                                                <p className="text-[10px] text-slate-500">
                                                                    Biometric profile registered
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                                                            🔒 Locked
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {unregisteredEmployees.length === 0 && registeredEmployees.length === 0 && (
                                        <div className="p-6 text-center text-xs text-slate-400 font-bold">
                                            No employees found matching "{dropdownSearch}"
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 sm:p-6">
                    {selectedEmployee ? (
                        <div className="flex flex-col items-center justify-center">
                            {/* CASE 1: Face is Already Registered & Locked */}
                            {isFaceLocked && !status.message ? (
                                <div className="text-center py-8 sm:py-12 px-4 max-w-lg mx-auto">
                                    <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-4 border-2 border-emerald-100 shadow-xl shadow-emerald-500/10">
                                        <Lock className="w-10 h-10" />
                                    </div>
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-800 text-xs font-black uppercase tracking-wider mb-3">
                                        <CheckCircle size={14} /> Biometric Enrolled & Locked
                                    </div>
                                    <h3 className="text-xl font-black text-slate-800 dark:text-white">
                                        Face Scan Locked for {selectedEmp.name}
                                    </h3>
                                    <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed">
                                        This employee's biometric face data is enrolled and locked against accidental overrides. To re-scan or update, please use <strong>Employees ➔ Edit Employee ➔ Re-scan Face</strong>.
                                    </p>
                                    <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                                        <a
                                            href="/admin/employees"
                                            className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all text-center"
                                        >
                                            Go to Employees List
                                        </a>
                                    </div>
                                </div>
                            ) : !isScanning && !status.message ? (
                                /* CASE 2: Unregistered OR Authorized re-scan */
                                <div className="text-center w-full">
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 sm:p-6 rounded-2xl mb-6 sm:mb-8 border border-slate-100 dark:border-slate-700 max-w-sm mx-auto">
                                        <h3 className="font-bold text-sm sm:text-base text-slate-800 dark:text-white mb-2">Onboarding Instructions</h3>
                                        <ul className="text-xs sm:text-sm text-slate-500 text-left space-y-2">
                                            <li className="flex gap-2"><span>✅</span> Ensure proper lighting</li>
                                            <li className="flex gap-2"><span>✅</span> Look straight at the camera</li>
                                            <li className="flex gap-2"><span>✅</span> Center your face in the circle</li>
                                        </ul>
                                    </div>
                                    <button
                                        onClick={() => setIsScanning(true)}
                                        className="btn-primary py-3 sm:py-4 px-4 sm:px-10 text-sm sm:text-lg rounded-2xl font-bold shadow-xl shadow-primary/30 hover:scale-105 transition-all w-full sm:w-auto whitespace-nowrap flex items-center justify-center gap-2 mx-auto"
                                    >
                                        <Camera size={20} />
                                        {Number(selectedEmp?.has_face_registered) === 1 ? 'Start Re-scan Enrollment' : 'Start Enrollment Scan'}
                                    </button>
                                </div>
                            ) : isScanning ? (
                                /* CASE 3: Active Camera Scanner */
                                <div className="w-full flex flex-col items-center">
                                    <FaceScanner onFaceDetected={handleFaceDetected} mode="register" />
                                    <button 
                                        onClick={() => {
                                            setIsScanning(false);
                                            if (Number(selectedEmp?.has_face_registered) === 1 && !isReEnrollParam) {
                                                setIsScanningUnlocked(false);
                                            }
                                        }} 
                                        className="mt-6 sm:mt-8 text-xs sm:text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest"
                                    >
                                        Cancel Scanning
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    ) : (
                        <div className="text-center py-10 sm:py-16 px-4">
                            <div className="w-16 h-16 sm:w-24 sm:h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-slate-200">
                                <Users className="text-slate-300 w-8 h-8 sm:w-10 sm:h-10" />
                            </div>
                            <h3 className="text-base sm:text-lg font-bold text-slate-700">No Employee Selected</h3>
                            <p className="text-xs sm:text-sm text-slate-400 mt-1">Please select an unregistered employee from the dropdown above to begin.</p>
                        </div>
                    )}

                    {status.message && !isScanning && (
                        <div className="flex flex-col items-center justify-center py-12 animate-in fade-in zoom-in duration-500">
                            <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-6 border-4 ${
                                status.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.3)]' 
                                : 'bg-red-50 border-red-200 text-red-500 shadow-[0_0_50px_rgba(239,68,68,0.3)]'
                            }`}>
                                {status.type === 'success' ? <CheckCircle size={64} /> : <AlertCircle size={64} />}
                            </div>
                            <h2 className={`text-3xl font-black mb-2 ${status.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
                                {status.type === 'success' ? 'Enrollment Complete!' : 'Enrollment Failed'}
                            </h2>
                            <p className="text-slate-500 font-medium mb-8 text-lg text-center max-w-md">{status.message}</p>
                            <div className="flex items-center gap-3">
                                {status.type === 'success' ? (
                                    <>
                                        <button 
                                            onClick={() => { 
                                                setSelectedEmployee(''); 
                                                setStatus({type:'', message:''}); 
                                                setIsScanning(false); 
                                                setIsScanningUnlocked(false); 
                                            }}
                                            className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors text-sm flex items-center gap-2"
                                        >
                                            <Users size={16} />
                                            Register Another Employee
                                        </button>
                                        <a
                                            href="/admin/employees"
                                            className="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition-colors text-sm shadow-md shadow-primary/20 flex items-center gap-2"
                                        >
                                            <CheckCircle size={16} />
                                            Done & View Employees
                                        </a>
                                    </>
                                ) : (
                                    <button 
                                        onClick={() => { setStatus({type:'', message:''}); setIsScanning(true); }}
                                        className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors text-sm"
                                    >
                                        Try Scan Again
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FaceRegistration;
