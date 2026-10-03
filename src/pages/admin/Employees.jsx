import React, { useState, useEffect, useRef } from 'react';
import api from '../../utils/axios';
import { useSettings } from '../../context/SettingsContext';
import {
  Plus,
  Users,
  Search,
  Filter,
  MoreVertical,
  Download,
  Mail,
  Phone,
  Calendar,
  Shield,
  X,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  UserPlus,
  Briefcase,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Check,
  Lock,
  Key,
  Building,
  TrendingUp,
  Image as ImageIcon,
  PenTool,
  Wallet,
  FileSpreadsheet,
  UploadCloud,
  FileCheck,
  AlertCircle,
  Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SignaturePad from '../../components/SignaturePad';

const Employees = () => {
  const { currencySymbol } = useSettings();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModal, setActiveModal] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [geofences, setGeofences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nextIds, setNextIds] = useState({ custom_id: '', machine_id: '' });
  const [formTab, setFormTab] = useState('personal');
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [resetFaceLoading, setResetFaceLoading] = useState(false);

  useEffect(() => {
    if (activeModal) {
      setFormTab('personal');
    }
  }, [activeModal]);

  const fetchGeofences = async () => {
    try {
      const response = await api.get('/geofences');
      if (Array.isArray(response.data)) {
        setGeofences(response.data.filter(g => g.status === 'Active'));
      }
    } catch (err) {
      console.error('Failed to fetch geofences', err);
    }
  };

  const fetchNextIds = async () => {
    try {
      const response = await api.get('/employees/next-ids');
      if (response.data && response.data.nextCustomId) {
        const ids = {
          custom_id: String(response.data.nextCustomId),
          machine_id: String(response.data.nextMachineId || response.data.nextCustomId)
        };
        setNextIds(ids);
        return ids;
      }
    } catch (err) {
      console.error('Failed to fetch next IDs', err);
    }
    return null;
  };

  // Signature States
  const sigPad = useRef(null);
  const [signatureType, setSignatureType] = useState('upload'); // 'draw' | 'upload'

  // Bulk Delete States
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredEmployees.length && filteredEmployees.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredEmployees.map(emp => emp.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setBulkDeleteLoading(true);
    try {
      await api.post('/employees/bulk-delete', { ids: selectedIds });
      setSelectedIds([]);
      setActiveModal(null);
      fetchEmployees();
      fetchNextIds();
    } catch (err) {
      console.error('Bulk delete error:', err);
      alert(err.response?.data?.message || 'Failed to delete selected employees.');
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  // Bulk Upload States
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);
  const [bulkError, setBulkError] = useState(null);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const bulkFileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const ext = file.name.split('.').pop().toLowerCase();
      if (!['xlsx', 'xls', 'csv'].includes(ext)) {
        setBulkError('Please select a valid Excel (.xlsx, .xls) or CSV (.csv) file.');
        setBulkFile(null);
        return;
      }
      setBulkFile(file);
      setBulkError(null);
      setBulkResult(null);
      e.dataTransfer.clearData();
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      setIsDownloadingTemplate(true);
      const response = await api.get('/employees/template', { responseType: 'blob' });
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'employee_bulk_upload_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading template:', err);
      alert('Failed to download template. Please try again.');
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const ext = file.name.split('.').pop().toLowerCase();
      if (!['xlsx', 'xls', 'csv'].includes(ext)) {
        setBulkError('Please select a valid Excel (.xlsx, .xls) or CSV (.csv) file.');
        setBulkFile(null);
        return;
      }
      setBulkFile(file);
      setBulkError(null);
      setBulkResult(null);
    }
  };

  const handleBulkUploadSubmit = async () => {
    if (!bulkFile) {
      setBulkError('Please select an Excel or CSV file to upload.');
      return;
    }

    setBulkUploading(true);
    setBulkError(null);
    setBulkResult(null);

    const formDataUpload = new FormData();
    formDataUpload.append('file', bulkFile);

    try {
      const response = await api.post('/employees/bulk-upload', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setBulkResult(response.data);
      fetchEmployees();
      fetchNextIds();
    } catch (err) {
      console.error('Bulk upload error:', err);
      setBulkError(err.response?.data?.message || err.message || 'Failed to upload employees.');
    } finally {
      setBulkUploading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchNextIds();
    fetchGeofences();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await api.get('/employees');
      setEmployees(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching employees:', err);
      setError('Failed to load employees. Please check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = (emp.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(emp.custom_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.assigned_locations || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const [formData, setFormData] = useState({
    machine_id: '',
    name: '',
    role: 'employee',
    email: '',
    phone: '',
    salary_rate: '',
    salary_type: 'hourly',
    password: '',
    joined_date: new Date().toISOString().split('T')[0],
    date_of_birth: '',
    photo: null,
    profileImage: null,
    uif_number: '',
    advance_balance: 0,
    signature: null,
    custom_id: '',
    status: 'active',
    is_uif_registered: true,
    cpf_applicable: 1,
    location_ids: []
  });

  const [previewImage, setPreviewImage] = useState(null);

  // Password Reset State
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const handleOpenViewModal = async (emp) => {
    setSelectedEmployee(emp);
    setFormData({
      ...emp,
      location_ids: emp.location_ids || [],
      locations: emp.locations || [],
      cpf_applicable: emp.cpf_applicable !== undefined && emp.cpf_applicable !== null ? Number(emp.cpf_applicable) : 1,
      signature: emp.signature || null,
      password: '',
      profileImage: null
    });
    setPreviewImage(emp.photo);
    setSignatureType('upload');
    setActiveModal('view');

    try {
      const res = await api.get(`/employees/${emp.id}`);
      if (res.data) {
        setFormData(prev => ({
          ...prev,
          ...res.data,
          location_ids: res.data.location_ids || [],
          locations: res.data.locations || []
        }));
      }
    } catch (e) {
      console.error('Failed to load employee details:', e);
    }
  };

  const handleOpenEditModal = async (emp) => {
    setSelectedEmployee(emp);
    setFormData({
      ...emp,
      location_ids: emp.location_ids || [],
      locations: emp.locations || [],
      cpf_applicable: emp.cpf_applicable !== undefined && emp.cpf_applicable !== null ? Number(emp.cpf_applicable) : 1,
      signature: emp.signature || null,
      password: '',
      profileImage: null
    });
    setPreviewImage(emp.photo);
    setSignatureType('upload');
    setFormErrors({});
    setActiveModal('edit');

    try {
      const res = await api.get(`/employees/${emp.id}`);
      if (res.data) {
        setFormData(prev => ({
          ...prev,
          ...res.data,
          location_ids: res.data.location_ids || [],
          locations: res.data.locations || []
        }));
      }
    } catch (e) {
      console.error('Failed to load employee details:', e);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) return alert('Only JPG, JPEG and PNG formats are allowed');
      setFormData(prev => ({ ...prev, profileImage: file }));
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData(prev => ({ ...prev, signature: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: null }));
    // Only allow numbers for Employee ID (custom_id) and sync with machine_id
    if (name === 'custom_id') {
      const val = value.replace(/[^0-9]/g, '');
      setFormData(prev => ({ ...prev, custom_id: val, machine_id: val }));
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (isUpdate = false) => {
    // Validations
    const errors = {};
    if (!formData.name?.trim()) errors.name = 'Required';
    if (!formData.email?.trim()) errors.email = 'Required';
    if (!formData.phone?.trim()) errors.phone = 'Required';
    if (!isUpdate && !formData.password) errors.password = 'Required';
    if (!formData.custom_id) errors.custom_id = 'Required';
    if (!formData.date_of_birth) errors.date_of_birth = 'Required';
    if (parseFloat(formData.salary_rate || 0) <= 0) errors.salary_rate = 'Required';
    if (!formData.location_ids || formData.location_ids.length === 0) errors.location_ids = 'Please assign at least one work location';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      if (errors.salary_rate) setFormTab('payroll');
      else setFormTab('personal');
      return;
    }

    try {
      setLoading(true);
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'profileImage' && formData[key]) {
          data.append('profileImage', formData[key]);
        } else if (key === 'signature') {
          if (formData.signature) data.append('signature', formData.signature);
        } else if (key === 'location_ids') {
          data.append('location_ids', JSON.stringify(formData.location_ids));
        } else if (formData[key] !== null && formData[key] !== undefined) {
          data.append(key, formData[key]);
        }
      });

      console.log('🚀 Final Signature Size:', formData.signature ? formData.signature.length : 'EMPTY');

      if (isUpdate) {
        await api.put(`/employees/${selectedEmployee.id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.post('/employees', data, { headers: { 'Content-Type': 'multipart/form-data' } });
        // Refresh next IDs after successful addition
        await fetchNextIds();
      }

      await fetchEmployees();
      setActiveModal(null);
      setPreviewImage(null);
    } catch (err) {
      console.error('Submission failed:', err);
      const msg = err.response?.data?.message || 'Failed to save profile. Please check if IDs are unique.';
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await api.delete(`/employees/${selectedEmployee.id}`);
      await fetchEmployees();
      setActiveModal(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    try {
      setResetLoading(true);
      const res = await api.post(`/employees/${selectedEmployee.id}/reset-password`);
      if (res.data && res.data.tempPassword) {
        setGeneratedPassword(res.data.tempPassword);
        setActiveModal('resetPasswordResult');
      } else {
        alert('Failed to generate new password');
        setActiveModal(null);
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to reset password');
      setActiveModal(null);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Employee Directory</h1>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest leading-none">Manage staff members and employee records</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              const currentCustomId = nextIds.custom_id ? String(nextIds.custom_id) : '1001';
              const currentMachineId = currentCustomId;

              const defaultLocIds = geofences.length > 0 ? [geofences[0].id] : [];

              const initialData = {
                machine_id: currentMachineId, 
                custom_id: currentCustomId,
                name: '', 
                role: 'employee',
                email: '', 
                phone: '', 
                salary_rate: '0', 
                salary_type: 'hourly',
                password: '', 
                joined_date: new Date().toISOString().split('T')[0],
                date_of_birth: '',
                uif_number: '', 
                advance_balance: 0, 
                signature: null, 
                status: 'active', 
                profileImage: null,
                is_uif_registered: true, 
                photo: null,
                cpf_applicable: 1,
                location_ids: defaultLocIds
              };
              setFormData(initialData);
              setFormErrors({});
              setPreviewImage(null);
              setSignatureType('draw');
              setActiveModal('add');

              // Background refresh of IDs from server
              try {
                const response = await api.get('/employees/next-ids');
                if (response.data && response.data.nextCustomId) {
                  const freshCustomId = String(response.data.nextCustomId);
                  const freshMachineId = freshCustomId;
                  setNextIds({
                    custom_id: freshCustomId,
                    machine_id: freshMachineId
                  });
                  setFormData(prev => ({
                    ...prev,
                    custom_id: (!prev.custom_id || prev.custom_id === currentCustomId) ? freshCustomId : prev.custom_id,
                    machine_id: (!prev.machine_id || prev.machine_id === currentCustomId) ? freshMachineId : prev.machine_id
                  }));
                }
              } catch (err) {
                console.error('Failed to refresh next IDs', err);
              }
            }}
            className="btn-primary flex items-center gap-2 py-2 px-4 shadow-lg shadow-primary/20"
          >
            <UserPlus size={16} />
            <span>Add New Employee</span>
          </button>
          <button
            onClick={() => {
              setBulkFile(null);
              setBulkError(null);
              setBulkResult(null);
              setActiveModal('bulk_upload');
            }}
            className="btn-secondary flex items-center gap-2 py-2 px-4 shadow-sm border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 font-bold"
          >
            <FileSpreadsheet size={16} className="text-emerald-600" />
            <span>Bulk Upload Employees</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card !p-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, ID or email..."
              className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-10 py-2.5 text-[12px] font-bold"
            />
          </div>
        </div>
      </div>

      {/* Selected Action Bar */}
      {selectedIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 bg-rose-50/90 border border-rose-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center text-xs font-black shadow-sm">
              {selectedIds.length}
            </span>
            <div>
              <p className="text-xs font-black text-rose-950">
                {selectedIds.length} {selectedIds.length === 1 ? 'employee' : 'employees'} selected
              </p>
              <p className="text-[10px] text-rose-600 font-semibold">
                Delete selected employee records simultaneously
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="btn-secondary py-1.5 px-3 text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm"
            >
              Deselect All
            </button>
            <button
              type="button"
              onClick={() => setActiveModal('bulkDeleteConfirm')}
              className="btn-primary py-1.5 px-4 text-xs font-black bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 flex items-center gap-1.5"
            >
              <Trash2 size={14} />
              <span>Delete Selected ({selectedIds.length})</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* Table */}
      <div className="card !p-0 overflow-hidden shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[1000px]">
            <thead className="bg-slate-50/50">
              <tr className="text-left border-b border-slate-100">
                <th className="py-4 pl-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={filteredEmployees.length > 0 && selectedIds.length === filteredEmployees.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer accent-primary"
                    title={selectedIds.length === filteredEmployees.length ? 'Deselect All' : 'Select All'}
                  />
                </th>
                <th className="py-4 font-black text-slate-400 text-[9px] uppercase tracking-widest w-12">SR No.</th>
                <th className="py-4 font-black text-slate-400 text-[9px] uppercase tracking-widest">Employee Info</th>
                <th className="py-4 font-black text-slate-400 text-[9px] uppercase tracking-widest">Role</th>
                <th className="py-4 font-black text-slate-400 text-[9px] uppercase tracking-widest text-center">Status</th>
                <th className="py-4 font-black text-slate-400 text-[9px] uppercase tracking-widest">Date Joined</th>
                <th className="py-4 font-black text-slate-400 text-[9px] uppercase tracking-widest text-center">Age</th>
                <th className="py-4 font-black text-slate-400 text-[9px] uppercase tracking-widest text-center">Earnings</th>
                <th className="py-4 text-right pr-4 font-black text-slate-400 text-[9px] uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan="9" className="py-20 text-center text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Fetching Data...</td></tr>
              ) : filteredEmployees.length === 0 ? (
                <tr><td colSpan="9" className="py-20 text-center text-xs font-black text-slate-400 uppercase tracking-widest">No records found</td></tr>
              ) : (
                filteredEmployees.map((emp, index) => (
                  <tr key={emp.id} className={`group hover:bg-slate-50/80 transition-colors ${selectedIds.includes(emp.id) ? 'bg-rose-50/30' : ''}`}>
                    <td className="py-3 pl-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(emp.id)}
                        onChange={() => handleToggleSelect(emp.id)}
                        className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer accent-primary"
                      />
                    </td>
                    <td className="py-3 text-[10px] font-black text-slate-400">
                      {filteredEmployees.length - index}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 shadow-sm shrink-0 flex items-center justify-center">
                          {emp.photo ? <img src={emp.photo} className="w-full h-full object-cover" /> : <Users size={20} className="text-slate-300" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[12px] font-black text-slate-800 leading-none">{emp.name}</p>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className="text-[8px] font-black text-primary uppercase tracking-tighter bg-indigo-50 px-1.5 py-0.5 rounded border border-primary/10">
                              ID: {emp.custom_id}
                            </span>
                            {emp.cpf_applicable === 0 || emp.cpf_applicable === '0' || emp.cpf_applicable === false ? (
                              <span className="text-[7px] font-black bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase border border-slate-200">
                                CPF NOT APPLICABLE
                              </span>
                            ) : (
                              <span className="text-[7px] font-black bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded uppercase border border-emerald-100">
                                CPF APPLICABLE
                              </span>
                            )}
                            {emp.assigned_locations && (
                              <span className="text-[7px] font-black bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded uppercase border border-sky-200/70 flex items-center gap-0.5" title={`Assigned: ${emp.assigned_locations}`}>
                                <MapPin size={8} className="text-sky-500" />
                                <span className="truncate max-w-[120px]">{emp.assigned_locations}</span>
                              </span>
                            )}
                            {Number(emp.has_face_registered) === 1 ? (
                              <span className="text-[7px] font-black bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded uppercase border border-emerald-200/70 flex items-center gap-0.5" title="Face Biometric Enrolled & Locked">
                                <Lock size={8} className="text-emerald-600" />
                                <span>Face Enrolled</span>
                              </span>
                            ) : (
                              <span className="text-[7px] font-black bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded uppercase border border-slate-200 flex items-center gap-0.5" title="No Face Biometric Enrolled">
                                <Camera size={8} className="text-slate-400" />
                                <span>No Face</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-widest ${(emp.role || '').toLowerCase().includes('admin') ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                        {emp.role}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${emp.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="py-3 text-[11px] font-bold text-slate-500 italic">
                      {emp.joined_date ? new Date(emp.joined_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '---'}
                    </td>
                    <td className="py-3 text-center">
                      {emp.date_of_birth ? (() => {
                        const today = new Date();
                        const dob = new Date(emp.date_of_birth);
                        let age = today.getFullYear() - dob.getFullYear();
                        const m = today.getMonth() - dob.getMonth();
                        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
                        return (
                          <span className="text-[11px] font-black text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                            {age} <span className="text-[8px] font-bold text-slate-400 uppercase">yrs</span>
                          </span>
                        );
                      })() : (
                        <span className="text-[9px] font-bold text-amber-500 bg-amber-50 px-2 py-1 rounded border border-amber-100">N/A</span>
                      )}
                    </td>
                    <td className="py-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <div>
                          <span className="text-[11px] font-black text-slate-700">{currencySymbol}{emp.salary_rate}</span>
                          <span className="text-[8px] font-black text-primary uppercase tracking-tighter ml-1">{emp.salary_type}</span>
                        </div>
                        {emp.cpf_applicable === 0 || emp.cpf_applicable === '0' || emp.cpf_applicable === false ? (
                          <span className="text-[8px] font-black text-slate-400 bg-slate-100/80 px-2 py-1 rounded-lg border border-slate-200 uppercase tracking-tight mt-0.5">
                            CPF NOT APPLICABLE
                          </span>
                        ) : (
                          parseFloat(emp.total_uif_collected || emp.total_cpf_total || 0) >= 0 && (
                            <button 
                              onClick={() => { setSelectedEmployee(emp); setActiveModal('cpfDetails'); }}
                              className="flex flex-col items-center bg-emerald-50 hover:bg-emerald-100/80 transition-colors px-2.5 py-1 rounded-xl border border-emerald-200/60 shadow-xs cursor-pointer group/cpf"
                              title="Click for CPF Breakdown"
                            >
                              <span className="text-[7px] font-black text-emerald-600 uppercase tracking-widest leading-none flex items-center gap-0.5">
                                CPF Details ↗
                              </span>
                              <span className="text-[10px] font-black text-emerald-700 mt-0.5">
                                {currencySymbol}{parseFloat(emp.total_cpf_total || (parseFloat(emp.total_cpf_employee || emp.total_uif_collected || 0) + parseFloat(emp.total_cpf_employer || 0))).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </button>
                          )
                        )}
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => { setSelectedEmployee(emp); setActiveModal('advance'); setFormData({ ...emp, advance_amount: 0 }); }} className="p-2 text-slate-400 hover:text-indigo-500 transition-all rounded-xl hover:bg-white shadow-sm border border-transparent hover:border-slate-100 flex items-center gap-1">
                          <Wallet size={14} />
                          <span className="text-[10px] font-black uppercase">Advance</span>
                        </button>
                        <button onClick={() => handleOpenViewModal(emp)} className="p-2 text-slate-400 hover:text-primary transition-all rounded-xl hover:bg-white shadow-sm border border-transparent hover:border-slate-100"><Eye size={16} /></button>
                        <button onClick={() => handleOpenEditModal(emp)} className="p-2 text-slate-400 hover:text-emerald-500 transition-all rounded-xl hover:bg-white shadow-sm border border-transparent hover:border-slate-100"><Edit2 size={16} /></button>
                        <button onClick={() => { setSelectedEmployee(emp); setActiveModal('resetPasswordConfirm'); setGeneratedPassword(''); }} className="p-2 text-slate-400 hover:text-amber-500 transition-all rounded-xl hover:bg-white shadow-sm border border-transparent hover:border-slate-100"><Key size={16} /></button>
                        <button onClick={() => { setSelectedEmployee(emp); setActiveModal('delete'); }} className="p-2 text-slate-400 hover:text-rose-500 transition-all rounded-xl hover:bg-white shadow-sm border border-transparent hover:border-slate-100"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {(activeModal === 'view' || activeModal === 'edit' || activeModal === 'add') && (
          <Modal 
            title={activeModal === 'view' ? 'Employee Profile' : activeModal === 'edit' ? 'Update Employee' : 'New Employee Registration'} 
            onClose={() => setActiveModal(null)}
            footer={
              <div className="flex justify-end gap-3 w-full">
                <button type="button" onClick={() => setActiveModal(null)} className="btn-secondary px-6">Cancel</button>
                {activeModal !== 'view' && (
                  <button onClick={() => handleSubmit(activeModal === 'edit')} disabled={loading} className="btn-primary px-8 shadow-lg shadow-primary/20">
                    {loading ? 'Saving...' : 'Save Profile'}
                  </button>
                )}
              </div>
            }
          >
            <div className="space-y-5">
              <div className="flex items-center gap-6 pb-4 border-b border-slate-100">
                <div className="flex-1">
                  <h2 className="text-lg font-black text-slate-800 leading-none">{formData.name || 'Employee Member'}</h2>
                  <p className="text-[9px] font-black text-primary uppercase tracking-widest mt-1">{formData.role === 'admin' ? 'System Administrator' : 'Staff Member'}</p>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex border-b border-slate-100 pb-1.5 gap-4">
                {[
                  { id: 'personal', label: 'Personal Info', hasError: formErrors.name || formErrors.email || formErrors.phone || formErrors.password || formErrors.custom_id || formErrors.date_of_birth },
                  { id: 'payroll', label: 'Compensation & Sign', hasError: formErrors.salary_rate }
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFormTab(tab.id)}
                    className={`pb-1 text-[10px] font-black uppercase tracking-wider transition-all border-b-2 relative ${
                      formTab === tab.id
                        ? 'border-primary text-primary'
                        : tab.hasError
                        ? 'border-rose-500 text-rose-500'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {tab.label}
                    {tab.hasError && <span className="absolute -top-1 -right-2 w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                
                {/* ─── PERSONAL TAB ─── */}
                {formTab === 'personal' && (
                  <>
                    <div className="space-y-1">
                      <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${formErrors.name ? 'text-rose-500' : 'text-slate-400'}`}>Full Name</label>
                      {activeModal === 'view' ? <p className="px-4 py-2.5 bg-slate-50 rounded-xl text-sm font-bold">{formData.name}</p> : <input type="text" name="name" value={formData.name} onChange={handleInputChange} className={`input-field ${formErrors.name ? '!border-rose-500 ring-1 ring-rose-500/20' : ''}`} placeholder="e.g. John Doe" />}
                    </div>
                    <div className="space-y-1">
                      <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${formErrors.phone ? 'text-rose-500' : 'text-slate-400'}`}>Phone Number</label>
                      {activeModal === 'view' ? <p className="px-4 py-2.5 bg-slate-50 rounded-xl text-sm font-bold">{formData.phone}</p> : <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} className={`input-field ${formErrors.phone ? '!border-rose-500 ring-1 ring-rose-500/20' : ''}`} placeholder="e.g. +65 9123 4567" />}
                    </div>
                    <div className="space-y-1">
                      <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${formErrors.email ? 'text-rose-500' : 'text-slate-400'}`}>Email Address</label>
                      {activeModal === 'view' ? <p className="px-4 py-2.5 bg-slate-50 rounded-xl text-sm font-bold">{formData.email}</p> : <input type="email" name="email" value={formData.email} onChange={handleInputChange} className={`input-field ${formErrors.email ? '!border-rose-500 ring-1 ring-rose-500/20' : ''}`} placeholder="e.g. employee@company.com" />}
                    </div>
                    <div className="space-y-1">
                      <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${formErrors.password ? 'text-rose-500' : 'text-slate-400'}`}>Portal Password</label>
                      {activeModal === 'view' ? (
                        <p className="px-4 py-2.5 bg-slate-50 rounded-xl text-sm font-bold">••••••••</p>
                      ) : (
                        <div className="relative">
                          <input 
                            type={showPassword ? "text" : "password"} 
                            name="password" 
                            value={formData.password} 
                            onChange={handleInputChange} 
                            className={`input-field pr-12 ${formErrors.password ? '!border-rose-500 ring-1 ring-rose-500/20' : ''}`} 
                            placeholder={activeModal === 'edit' ? "Leave empty to keep current" : "Enter password"} 
                          />
                          <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${formErrors.custom_id ? 'text-rose-500' : 'text-slate-400'}`}>Employee ID</label>
                      {activeModal !== 'add' ? (
                        <p className="px-4 py-2.5 bg-slate-50 rounded-xl text-sm font-bold text-slate-500 cursor-not-allowed border border-slate-100 flex items-center justify-between">
                          <span>{formData.custom_id || '---'}</span>
                          <span className="text-[9px] font-black uppercase text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-sm">Locked</span>
                        </p>
                      ) : (
                        <input 
                          type="text" 
                          inputMode="numeric"
                          name="custom_id" 
                          value={formData.custom_id} 
                          onChange={handleInputChange} 
                          className={`input-field ${formErrors.custom_id ? '!border-rose-500 ring-1 ring-rose-500/20' : ''}`} 
                          placeholder="e.g. 1001" 
                        />
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Joining Date</label>
                      {activeModal === 'view' ? (
                        <p className="px-4 py-2.5 bg-slate-50 rounded-xl text-sm font-bold">
                          {formData.joined_date ? new Date(formData.joined_date).toLocaleDateString() : '---'}
                        </p>
                      ) : (
                        <input type="date" name="joined_date" value={formData.joined_date ? formData.joined_date.split('T')[0] : ''} onChange={handleInputChange} className="input-field" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${formErrors.date_of_birth ? 'text-rose-500' : 'text-slate-400'}`}>Date of Birth *</label>
                      {activeModal === 'view' ? (
                        <p className="px-4 py-2.5 bg-slate-50 rounded-xl text-sm font-bold">
                          {formData.date_of_birth ? new Date(formData.date_of_birth).toLocaleDateString() : <span className="text-amber-500 text-xs">Not set — update to enable CPF</span>}
                        </p>
                      ) : (
                        <input type="date" name="date_of_birth" required value={formData.date_of_birth ? formData.date_of_birth.split('T')[0] : ''} onChange={handleInputChange} className={`input-field ${formErrors.date_of_birth ? '!border-rose-500 ring-1 ring-rose-500/20' : ''}`} />
                      )}
                    </div>

                    {/* ─── ASSIGNED WORK LOCATIONS ─── */}
                    <div className="space-y-2 sm:col-span-2 pt-3 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <label className={`text-[10px] font-black uppercase tracking-widest ml-1 flex items-center gap-1.5 ${formErrors.location_ids ? 'text-rose-500' : 'text-slate-600'}`}>
                          <MapPin size={13} className={formErrors.location_ids ? 'text-rose-500' : 'text-primary'} />
                          <span>Assigned Work Locations *</span>
                        </label>
                        <span className="text-[9px] font-bold text-slate-400">
                          {formData.location_ids?.length || 0} selected (Min. 1 required)
                        </span>
                      </div>

                      {activeModal === 'view' ? (
                        <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                          {formData.locations && formData.locations.length > 0 ? (
                            formData.locations.map(loc => (
                              <span key={loc.location_id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-xl border border-slate-200 text-xs font-black text-slate-700 shadow-2xs">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                {loc.location_name}
                              </span>
                            ))
                          ) : formData.assigned_locations ? (
                            formData.assigned_locations.split(',').map((name, i) => (
                              <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-xl border border-slate-200 text-xs font-black text-slate-700 shadow-2xs">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                {name.trim()}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-rose-500 font-bold">No locations assigned</span>
                          )}
                        </div>
                      ) : (
                        <div>
                          {geofences.length === 0 ? (
                            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between">
                              <span className="text-xs font-bold text-amber-700">No Geofenced locations found. Please create locations in Admin &gt; Geo-Fencing.</span>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {geofences.map(gf => {
                                const isSelected = formData.location_ids?.includes(gf.id);
                                return (
                                  <button
                                    key={gf.id}
                                    type="button"
                                    onClick={() => {
                                      const current = formData.location_ids || [];
                                      const updated = isSelected 
                                        ? current.filter(id => id !== gf.id)
                                        : [...current, gf.id];
                                      setFormData(prev => ({ ...prev, location_ids: updated }));
                                      if (formErrors.location_ids) setFormErrors(prev => ({ ...prev, location_ids: null }));
                                    }}
                                    className={`p-3 rounded-2xl border-2 text-left transition-all flex items-center justify-between cursor-pointer ${
                                      isSelected
                                        ? 'border-primary bg-primary/5 text-primary shadow-xs'
                                        : 'border-slate-100 hover:border-slate-200 bg-white text-slate-600'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <div className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all ${
                                        isSelected ? 'bg-primary text-white' : 'border-2 border-slate-300 bg-white'
                                      }`}>
                                        {isSelected && <Check size={12} strokeWidth={3} />}
                                      </div>
                                      <div>
                                        <p className="text-xs font-black leading-tight text-slate-800">{gf.name}</p>
                                        <p className="text-[9px] font-bold text-slate-400 leading-none mt-0.5">Radius: {gf.radius}m</p>
                                      </div>
                                    </div>
                                    <span className="text-[8px] font-black uppercase px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md border border-emerald-100">
                                      Active
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                          {formErrors.location_ids && (
                            <p className="text-[10px] font-bold text-rose-500 mt-1.5 ml-1">{formErrors.location_ids}</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Face Biometric Status & Management Card */}
                    {(activeModal === 'edit' || activeModal === 'view') && (
                      <div className="space-y-2 sm:col-span-2 pt-3 border-t border-slate-100">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                          <Camera size={12} className="text-primary" /> Face Biometric Status
                        </label>
                        
                        <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          Number(formData.has_face_registered) === 1 || Number(selectedEmployee?.has_face_registered) === 1
                            ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-900'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                              Number(formData.has_face_registered) === 1 || Number(selectedEmployee?.has_face_registered) === 1
                                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                                : 'bg-slate-200 text-slate-400'
                            }`}>
                              {Number(formData.has_face_registered) === 1 || Number(selectedEmployee?.has_face_registered) === 1 ? <Lock size={20} /> : <Camera size={20} />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black uppercase tracking-wider">
                                  {Number(formData.has_face_registered) === 1 || Number(selectedEmployee?.has_face_registered) === 1 ? 'Face Enrolled & Locked' : 'No Face Biometric Enrolled'}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                  Number(formData.has_face_registered) === 1 || Number(selectedEmployee?.has_face_registered) === 1
                                    ? 'bg-emerald-200/60 text-emerald-800'
                                    : 'bg-slate-200 text-slate-600'
                                }`}>
                                  {Number(formData.has_face_registered) === 1 || Number(selectedEmployee?.has_face_registered) === 1 ? '🔒 Protected' : 'Pending'}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                                {Number(formData.has_face_registered) === 1 || Number(selectedEmployee?.has_face_registered) === 1
                                  ? 'Face scan is locked against accidental enrollment. You can re-scan or reset biometric data below.'
                                  : 'Employee must have face registered to use facial kiosk / mobile attendance.'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {Number(formData.has_face_registered) === 1 || Number(selectedEmployee?.has_face_registered) === 1 ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveModal(null);
                                    window.location.href = `/admin/face-registration?empId=${selectedEmployee?.id}&reEnroll=true`;
                                  }}
                                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
                                >
                                  <Camera size={13} />
                                  Re-scan Face
                                </button>
                                {activeModal === 'edit' && (
                                  <button
                                    type="button"
                                    onClick={() => setActiveModal('resetFaceConfirm')}
                                    className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                                  >
                                    <Trash2 size={13} />
                                    Reset Face
                                  </button>
                                )}
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveModal(null);
                                  window.location.href = `/admin/face-registration?empId=${selectedEmployee?.id}`;
                                }}
                                className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
                              >
                                <Camera size={13} />
                                Register Face
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* ─── PAYROLL TAB ─── */}
                {formTab === 'payroll' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Salary Type</label>
                      {activeModal === 'view' ? <p className="px-4 py-2.5 bg-slate-50 rounded-xl text-sm font-bold uppercase">{formData.salary_type}</p> : (
                        <select name="salary_type" value={formData.salary_type} onChange={handleInputChange} className="input-field">
                          <option value="hourly">Hourly</option>
                          <option value="daily">Daily</option>
                          <option value="fortnightly">Fortnightly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${formErrors.salary_rate ? 'text-rose-500' : 'text-slate-400'}`}>Salary Rate ({currencySymbol})</label>
                      {activeModal === 'view' ? <p className="px-4 py-2.5 bg-slate-50 rounded-xl text-sm font-bold">{formData.salary_rate}</p> : <input type="number" name="salary_rate" value={formData.salary_rate} onChange={handleInputChange} className={`input-field ${formErrors.salary_rate ? '!border-rose-500 ring-1 ring-rose-500/20' : ''}`} />}
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Advance Balance ({currencySymbol})</label>
                      {activeModal === 'view' ? <p className="px-4 py-2.5 bg-slate-50 rounded-xl text-sm font-bold">{currencySymbol}{formData.advance_balance}</p> : <input type="number" name="advance_balance" value={formData.advance_balance} onChange={handleInputChange} className="input-field" />}
                    </div>

                    <div className="space-y-1 sm:col-span-2 mt-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CPF Applicable</label>
                      {activeModal === 'view' ? (
                        <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
                          formData.cpf_applicable === 0 || formData.cpf_applicable === '0' || formData.cpf_applicable === false
                            ? 'bg-slate-50 border-slate-200 text-slate-700'
                            : 'bg-emerald-50 border-emerald-100 text-emerald-700'
                        }`}>
                          <CheckCircle2 size={18} className={formData.cpf_applicable === 0 || formData.cpf_applicable === '0' || formData.cpf_applicable === false ? 'text-slate-400' : 'text-emerald-600'} />
                          <div>
                            <p className="text-xs font-black uppercase">
                              {formData.cpf_applicable === 0 || formData.cpf_applicable === '0' || formData.cpf_applicable === false ? 'No (CPF Not Applicable)' : 'Yes (CPF Applicable)'}
                            </p>
                            <p className="text-[10px] font-bold opacity-75 mt-0.5">
                              {formData.cpf_applicable === 0 || formData.cpf_applicable === '0' || formData.cpf_applicable === false 
                                ? 'Employee and Employer CPF contributions are set to 0.00'
                                : 'Calculated dynamically based on employee Date of Birth and age brackets'}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, cpf_applicable: 1 }))}
                              className={`py-3 px-4 rounded-xl border font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                                Number(formData.cpf_applicable) !== 0
                                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/20'
                                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                              }`}
                            >
                              <CheckCircle2 size={16} />
                              Yes (Applicable)
                            </button>
                            <button
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, cpf_applicable: 0 }))}
                              className={`py-3 px-4 rounded-xl border font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                                Number(formData.cpf_applicable) === 0
                                  ? 'bg-slate-800 border-slate-800 text-white shadow-md shadow-slate-800/20'
                                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                              }`}
                            >
                              <X size={16} />
                              No (Not Applicable)
                            </button>
                          </div>
                          <p className="text-[10px] font-bold text-slate-500 ml-1">
                            {Number(formData.cpf_applicable) === 0
                              ? 'ℹ️ Employee & Employer CPF will be S$0.00 during payroll calculation.'
                              : 'ℹ️ CPF rate calculated dynamically based on DOB + age (55 & below: 20%/17%, up to S$8,000 ceiling).'}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="sm:col-span-2 space-y-2 mt-4 pt-4 border-t border-slate-50">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><PenTool size={12} /> E-Signature</label>
                      {activeModal !== 'view' ? (
                        <div className="space-y-3">
                          <div className="flex gap-2 mb-1">
                            <button 
                              type="button" 
                              onClick={() => setSignatureType('draw')} 
                              className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-lg transition-all ${
                                signatureType === 'draw' 
                                  ? 'bg-primary text-white shadow-sm shadow-primary/20' 
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                              }`}
                            >
                              ✍️ Draw Signature
                            </button>
                            <button 
                              type="button" 
                              onClick={() => setSignatureType('upload')} 
                              className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-lg transition-all ${
                                signatureType === 'upload' 
                                  ? 'bg-primary text-white shadow-sm shadow-primary/20' 
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                              }`}
                            >
                              📁 Upload Signature Image
                            </button>
                          </div>
                          {signatureType === 'draw' ? (
                            <SignaturePad 
                              value={formData.signature} 
                              onChange={(sig) => setFormData(prev => ({ ...prev, signature: sig }))}
                              onClear={() => setFormData(prev => ({ ...prev, signature: null }))}
                            />
                          ) : (
                            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                              <div className="w-48 h-20 bg-white rounded-xl border border-slate-100 flex items-center justify-center overflow-hidden">
                                {formData.signature ? (
                                  <img src={formData.signature} className="max-h-full object-contain" alt="Signature preview" />
                                ) : (
                                  <span className="text-[9px] font-black text-slate-300 uppercase">Empty</span>
                                )}
                              </div>
                              <div>
                                <input type="file" id="sig-up" className="hidden" accept=".jpg,.jpeg,.png" onChange={handleSignatureUpload} />
                                <label htmlFor="sig-up" className="btn-secondary py-2 px-4 cursor-pointer text-[10px] inline-block font-bold">
                                  Choose File
                                </label>
                                {formData.signature && (
                                  <button 
                                    type="button" 
                                    onClick={() => setFormData(prev => ({ ...prev, signature: null }))} 
                                    className="ml-2 text-[10px] text-rose-500 font-bold hover:underline"
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-48 h-20 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center overflow-hidden">
                          {formData.signature ? (
                            <img src={formData.signature} className="max-h-full object-contain" alt="Employee signature" />
                          ) : (
                            <span className="text-[9px] font-black text-slate-300 uppercase">No Signature</span>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}

              </div>
            </div>
          </Modal>
        )}

        {activeModal === 'advance' && (
          <Modal title="Record Advance Payment" onClose={() => setActiveModal(null)} type="delete">
            <div className="space-y-6 py-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Wallet size={32} />
                </div>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter">
                  {formData.advance_type === 'repay' ? 'Repay / Deduct Advance' : 'Issue Advance'}
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Employee: {selectedEmployee?.name}</p>
              </div>

              {/* Mode Toggle */}
              <div className="flex bg-slate-200 dark:bg-slate-700/60 p-1 rounded-2xl border border-slate-300 dark:border-slate-600">
                <button 
                  type="button" 
                  onClick={() => setFormData(prev => ({ ...prev, advance_type: 'issue' }))} 
                  className={`flex-1 py-2.5 px-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${formData.advance_type !== 'repay' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600'}`}
                >
                  ➕ Issue Advance (+)
                </button>
                <button 
                  type="button" 
                  onClick={() => setFormData(prev => ({ ...prev, advance_type: 'repay' }))} 
                  className={`flex-1 py-2.5 px-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${formData.advance_type === 'repay' ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600'}`}
                >
                  ➖ Repay / Deduct (-)
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      {formData.advance_type === 'repay' ? 'Repayment Amount' : 'Advance Amount'} ({currencySymbol})
                    </label>
                    {selectedEmployee?.advance_balance > 0 && (
                      <button 
                        type="button" 
                        onClick={() => setFormData(prev => ({ ...prev, advance_type: 'repay', advance_amount: selectedEmployee.advance_balance }))}
                        className="text-[10px] font-black text-rose-500 hover:underline uppercase tracking-wider"
                      >
                        Clear Full Balance
                      </button>
                    )}
                  </div>
                  <input
                    type="number"
                    className="input-field text-center text-xl font-black"
                    value={formData.advance_amount}
                    onChange={(e) => setFormData({ ...formData, advance_amount: e.target.value })}
                    placeholder="0.00"
                  />
                  <p className="text-[9px] font-bold text-amber-600 text-center uppercase tracking-widest mt-2">
                    Current Balance: {currencySymbol}{selectedEmployee?.advance_balance || 0}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Deduct per cycle ({currencySymbol})</label>
                  <input
                    type="number"
                    className="input-field text-center text-xl font-black"
                    value={formData.advance_installment !== undefined ? formData.advance_installment : (selectedEmployee?.advance_installment || '')}
                    onChange={(e) => setFormData({ ...formData, advance_installment: e.target.value })}
                    placeholder="Auto (Full Balance)"
                  />
                  <p className="text-[9px] font-bold text-slate-400 text-center uppercase tracking-widest mt-2">
                    Leave blank to deduct max possible amount
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setActiveModal(null)} className="flex-1 btn-secondary py-3">Cancel</button>
                <button
                  onClick={async () => {
                    try {
                      setLoading(true);
                      const curBal = parseFloat(selectedEmployee.advance_balance || 0);
                      const amount = parseFloat(formData.advance_amount || 0);
                      let newBalance = curBal;
                      
                      if (formData.advance_type === 'repay') {
                          newBalance = Math.max(0, curBal - amount);
                      } else {
                          newBalance = curBal + amount;
                      }
                      
                      let installment = null;
                      if (formData.advance_installment !== undefined && formData.advance_installment !== '') {
                          installment = parseFloat(formData.advance_installment);
                      } else if (selectedEmployee?.advance_installment !== undefined && formData.advance_installment === undefined) {
                          installment = selectedEmployee.advance_installment;
                      }

                      await api.put(`/employees/${selectedEmployee.id}`, { 
                          ...selectedEmployee, 
                          advance_balance: newBalance,
                          advance_installment: installment
                      });
                      await fetchEmployees();
                      setActiveModal(null);
                    } catch (err) {
                      alert('Failed to update advance');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className={`flex-1 btn-primary py-3 font-black text-xs uppercase tracking-wider ${formData.advance_type === 'repay' ? '!bg-rose-600 hover:!bg-rose-700 shadow-rose-600/20' : ''}`}
                >
                  {loading ? 'Processing...' : (formData.advance_type === 'repay' ? 'Confirm Repayment' : 'Confirm Payment')}
                </button>
              </div>
            </div>
          </Modal>
        )}

        {activeModal === 'delete' && (
          <Modal title="Confirm Termination" onClose={() => setActiveModal(null)} type="delete">
            <div className="text-center py-6 space-y-6">
              <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-[2rem] flex items-center justify-center mx-auto animate-bounce"><Trash2 size={32} /></div>
              <p className="text-sm font-bold text-slate-600">Delete <span className="text-slate-900 font-black">{selectedEmployee?.name}</span>? This is permanent.</p>
              <div className="flex gap-3">
                <button onClick={() => setActiveModal(null)} disabled={loading} className="flex-1 btn-secondary py-3 disabled:opacity-50">Cancel</button>
                <button onClick={handleDelete} disabled={loading} className="flex-1 bg-rose-500 text-white font-black py-3 rounded-2xl shadow-xl shadow-rose-500/20 uppercase text-[10px] tracking-widest disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? 'Deleting...' : 'Confirm'}
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* Reset Face Biometric Confirmation Popup (40% Width) */}
        {activeModal === 'resetFaceConfirm' && selectedEmployee && (
          <Modal title="Reset Face Biometric" onClose={() => setActiveModal('edit')} type="delete">
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-rose-100 animate-in zoom-in-75">
                <Trash2 size={28} />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-800">
                  Reset Face Data for {selectedEmployee.name}?
                </h4>
                <p className="text-xs text-slate-500 font-medium mt-1.5 leading-relaxed px-2">
                  Are you sure you want to remove the registered facial biometric data for this employee? This will permanently delete their face profile from the database.
                </p>
              </div>

              <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200/80 text-left flex items-start gap-2.5">
                <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] font-bold text-amber-800 leading-snug">
                  Face attendance will remain locked until a new face scan is enrolled.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setActiveModal('edit')} 
                  disabled={resetFaceLoading} 
                  className="flex-1 btn-secondary py-2.5 text-xs font-bold"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={async () => {
                    try {
                      setResetFaceLoading(true);
                      await api.delete(`/face/${selectedEmployee.id}`);
                      setFormData(prev => ({ ...prev, has_face_registered: 0 }));
                      if (selectedEmployee) selectedEmployee.has_face_registered = 0;
                      await fetchEmployees();
                      setActiveModal('edit');
                    } catch (err) {
                      console.error('Failed to reset face:', err);
                    } finally {
                      setResetFaceLoading(false);
                    }
                  }} 
                  disabled={resetFaceLoading} 
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-black py-2.5 rounded-xl shadow-lg shadow-rose-600/20 uppercase text-[10px] tracking-widest disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {resetFaceLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Resetting...</span>
                    </>
                  ) : (
                    <span>Confirm Reset</span>
                  )}
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* Bulk Delete Confirm Modal */}
        {activeModal === 'bulkDeleteConfirm' && (
          <Modal title="Delete Selected Employees" onClose={() => setActiveModal(null)} type="delete">
            <div className="text-center py-6 space-y-6">
              <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-sm">
                <Trash2 size={32} />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-800">
                  Delete {selectedIds.length} Selected {selectedIds.length === 1 ? 'Employee' : 'Employees'}?
                </h4>
                <p className="text-xs text-slate-500 font-semibold mt-1">
                  This will permanently delete their records and user logins from the system. This action cannot be undone.
                </p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setActiveModal(null)} 
                  disabled={bulkDeleteLoading} 
                  className="flex-1 btn-secondary py-3 disabled:opacity-50 text-xs font-bold"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleBulkDelete} 
                  disabled={bulkDeleteLoading} 
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-black py-3 rounded-2xl shadow-xl shadow-rose-600/20 uppercase text-[10px] tracking-widest disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {bulkDeleteLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <span>Confirm Delete</span>
                  )}
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* CPF Details Modal */}
        {activeModal === 'cpfDetails' && selectedEmployee && (
          <Modal title="CPF Contribution Details" onClose={() => setActiveModal(null)}>
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100">
                <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black text-lg shadow-md shadow-emerald-500/20">
                  CPF
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-black text-slate-800">{selectedEmployee.name}</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    ID: {selectedEmployee.custom_id || selectedEmployee.id}
                  </p>
                </div>
                <div>
                  {selectedEmployee.cpf_applicable === 0 || selectedEmployee.cpf_applicable === '0' || selectedEmployee.cpf_applicable === false ? (
                    <span className="text-[9px] font-black bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg uppercase border border-slate-200">
                      CPF NOT APPLICABLE
                    </span>
                  ) : (
                    <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-lg uppercase border border-emerald-200">
                      CPF APPLICABLE
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex justify-between items-center py-2 border-b border-slate-200/60">
                  <span className="text-xs font-bold text-slate-600">Employee CPF Deduction</span>
                  <span className="text-sm font-black text-rose-600">
                    {currencySymbol}{parseFloat(selectedEmployee.total_cpf_employee || selectedEmployee.total_uif_collected || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-slate-200/60">
                  <span className="text-xs font-bold text-slate-600">Employer CPF Contribution</span>
                  <span className="text-sm font-black text-blue-600">
                    {currencySymbol}{parseFloat(selectedEmployee.total_cpf_employer || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Total CPF Contribution</span>
                  <span className="text-base font-black text-emerald-600">
                    {currencySymbol}{parseFloat(selectedEmployee.total_cpf_total || (parseFloat(selectedEmployee.total_cpf_employee || selectedEmployee.total_uif_collected || 0) + parseFloat(selectedEmployee.total_cpf_employer || 0))).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="flex justify-end">
                <button type="button" onClick={() => setActiveModal(null)} className="btn-primary py-2.5 px-6">
                  Close
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Reset Password Confirmation Modal */}
      <AnimatePresence>
        {activeModal === 'resetPasswordConfirm' && (
          <Modal title="Reset Password" onClose={() => setActiveModal(null)}>
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-amber-600 mt-0.5" size={20} />
                  <div>
                    <h3 className="text-sm font-black text-amber-800">Are you sure?</h3>
                    <p className="text-xs text-amber-700 mt-1">
                      This will generate a new secure password for <strong>{selectedEmployee?.name}</strong>. The old password will immediately stop working.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setActiveModal(null)} className="btn-secondary">Cancel</button>
                <button onClick={handleResetPassword} disabled={resetLoading} className="btn-primary bg-amber-600 hover:bg-amber-700">
                  {resetLoading ? 'Generating...' : 'Yes, Generate Password'}
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Reset Password Result Modal */}
      <AnimatePresence>
        {activeModal === 'resetPasswordResult' && (
          <Modal title="Password Reset Successful" onClose={() => setActiveModal(null)}>
            <div className="space-y-4 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-2">
                <CheckCircle2 size={32} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800">New Password Generated</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Please copy this password and share it securely with <strong>{selectedEmployee?.name}</strong>.
                </p>
              </div>
              <div className="w-full bg-slate-100 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                <span className="text-xl font-mono font-black text-slate-800 tracking-wider">{generatedPassword}</span>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(generatedPassword);
                  }}
                  className="px-3 py-1.5 bg-white text-[10px] font-black uppercase text-primary border border-slate-200 shadow-sm rounded-lg hover:bg-slate-50"
                >
                  Copy
                </button>
              </div>
              <button type="button" onClick={() => setActiveModal(null)} className="btn-primary w-full mt-4">Done</button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Bulk Upload Modal */}
      <AnimatePresence>
        {activeModal === 'bulk_upload' && (
          <Modal title="Bulk Employee Upload" onClose={() => setActiveModal(null)}>
            <div className="space-y-5">
              {!bulkResult ? (
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleBulkUploadSubmit();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleBulkUploadSubmit();
                    }
                  }}
                  className="space-y-5"
                >
                  {/* Instructions & Template Download */}
                  <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <FileSpreadsheet size={15} className="text-emerald-600" />
                        Step 1: Download Sample Template
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Use the standard Excel template to fill in employee details with the required column headers.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownloadTemplate}
                      disabled={isDownloadingTemplate}
                      className="btn-secondary py-2 px-3.5 text-[11px] font-black uppercase text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 shrink-0 flex items-center gap-2"
                    >
                      <Download size={14} />
                      <span>{isDownloadingTemplate ? 'Downloading...' : 'Download Template'}</span>
                    </button>
                  </div>

                  {/* File Upload Area */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Step 2: Upload Completed File (.xlsx, .xls, .csv)
                    </label>
                    <div
                      onClick={() => bulkFileInputRef.current?.click()}
                      onDragOver={handleDragOver}
                      onDragEnter={handleDragEnter}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5 ${
                        isDragging
                          ? 'border-primary bg-primary/10 text-primary scale-[1.01] ring-4 ring-primary/10'
                          : bulkFile
                          ? 'border-emerald-400 bg-emerald-50/40 text-emerald-900'
                          : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-primary/50 text-slate-600'
                      }`}
                    >
                      <input
                        ref={bulkFileInputRef}
                        type="file"
                        accept=".xlsx, .xls, .csv"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform ${
                        isDragging 
                          ? 'bg-primary text-white scale-110 shadow-md' 
                          : bulkFile 
                          ? 'bg-emerald-100 text-emerald-600' 
                          : 'bg-white shadow-sm text-primary border border-slate-100'
                      }`}>
                        {bulkFile ? <FileCheck size={24} /> : <UploadCloud size={24} />}
                      </div>
                      {isDragging ? (
                        <div>
                          <p className="text-xs font-black text-primary">Drop file here to upload</p>
                          <p className="text-[10px] text-primary/70 font-semibold mt-0.5">Release to load spreadsheet</p>
                        </div>
                      ) : bulkFile ? (
                        <div>
                          <p className="text-xs font-black text-slate-800">{bulkFile.name}</p>
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                            {(bulkFile.size / 1024).toFixed(1)} KB • Click or drop another file to replace
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs font-black text-slate-800">Click or drag & drop file to upload</p>
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Supports Excel (.xlsx, .xls) and CSV (.csv)</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Error Notification */}
                  {bulkError && (
                    <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2.5 text-rose-700 text-xs font-bold">
                      <AlertCircle size={16} className="shrink-0 text-rose-500" />
                      <span>{bulkError}</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="btn-secondary text-xs"
                      disabled={bulkUploading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!bulkFile || bulkUploading}
                      className="btn-primary py-2 px-5 text-xs flex items-center gap-2"
                    >
                      {bulkUploading ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Importing Employees...</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud size={15} />
                          <span>Import Employees</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                /* Result Summary View */
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 border border-emerald-200/80 rounded-2xl flex items-center gap-3.5">
                    <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                      <CheckCircle2 size={22} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-emerald-900">
                        {bulkResult.successCount} Employees Successfully Imported!
                      </h4>
                      <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                        Total Processed: {bulkResult.totalProcessed} | Failed: {bulkResult.failedCount}
                      </p>
                    </div>
                  </div>

                  {bulkResult.failedCount > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-[11px] font-black text-rose-600 uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle size={14} />
                        Failed Rows ({bulkResult.failedCount}):
                      </h5>
                      <div className="max-h-48 overflow-y-auto custom-scrollbar border border-rose-100 rounded-xl bg-rose-50/40 p-2 divide-y divide-rose-100/80">
                        {bulkResult.errors.map((err, idx) => (
                          <div key={idx} className="py-2 px-2 text-[11px] flex items-start justify-between gap-3">
                            <div>
                              <span className="font-black text-slate-800">Row {err.row}: </span>
                              <span className="font-bold text-slate-600">{err.name || err.email || 'Record'}</span>
                            </div>
                            <span className="text-rose-600 font-bold text-right shrink-0">{err.reason}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium italic">
                        Tip: You can fix the failed rows in your template and upload only the corrected rows.
                      </p>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setBulkResult(null);
                        setBulkFile(null);
                      }}
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      Upload Another File
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveModal(null);
                        setBulkResult(null);
                        setBulkFile(null);
                      }}
                      className="btn-primary py-2.5 px-6 text-xs"
                    >
                      Done & View Employees
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};

const Modal = ({ title, children, onClose, footer, type = 'default' }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="modal-overlay"
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
        <button onClick={onClose} className="p-2 text-white bg-rose-500 hover:bg-rose-600 transition-colors rounded-xl shadow-sm">
          <X size={18} />
        </button>
      </div>
      <div className="modal-body custom-scrollbar">
        {children}
      </div>
      {footer && (
        <div className="modal-footer">
          {footer}
        </div>
      )}
    </motion.div>
  </motion.div>
);

export default Employees;
