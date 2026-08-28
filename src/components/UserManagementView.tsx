import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  UserPlus,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Shield,
  Eye,
  Edit2,
  Trash2,
  Check,
  RefreshCw,
  UserCheck,
  UserX,
  Filter,
  Mail,
  GraduationCap,
  Briefcase,
  Phone,
  Hash,
  X,
  FileSpreadsheet,
  Download,
  Upload,
  ArrowRight,
  Sparkles,
  Info,
  CheckCircle,
  AlertCircle,
  BookOpen,
  History,
  FileText,
  KeyRound,
  Copy
} from 'lucide-react';
import { api } from '../services/api';
import type {
  User,
  UserRole,
  UserAccountStatus,
  UserStats,
  ClassSummary,
  ExcelPreviewResult,
  ExcelPreviewRow,
  ExcelImportResult,
  UserImportAudit
} from '../types';

type ViewSubTab = 'ALL' | 'STUDENTS' | 'FACULTY' | 'CLASSES' | 'IMPORT_EXCEL' | 'IMPORT_AUDIT' | 'REGISTRATION_OTPS';

export const UserManagementView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<ViewSubTab>('ALL');
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats>({
    total_users: 0,
    total_students: 0,
    total_faculty: 0,
    pending_users: 0,
    active_users: 0,
    inactive_users: 0,
    email_linked_students: 0,
    email_missing_students: 0,
    classes_count: 0
  });

  // Registration OTP Requests State (viswanthan7824)
  const [registrationOtps, setRegistrationOtps] = useState<any[]>([]);
  const [loadingOtps, setLoadingOtps] = useState(false);
  const [copiedOtpId, setCopiedOtpId] = useState<number | null>(null);

  // Filter States
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [classFilter, setClassFilter] = useState<string>('ALL');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');
  const [yearFilter, setYearFilter] = useState<string>('ALL');
  const [emailStatusFilter, setEmailStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Class Hub & Audit State
  const [classesList, setClassesList] = useState<ClassSummary[]>([]);
  const [importAudits, setImportAudits] = useState<UserImportAudit[]>([]);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<User | null>(null);

  // Add User Form
  const [addFullName, setAddFullName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addRole, setAddRole] = useState<'STUDENT' | 'FACULTY'>('STUDENT');
  const [addCollegeId, setAddCollegeId] = useState('');
  const [addMobile, setAddMobile] = useState('');
  const [addStatus, setAddStatus] = useState<UserAccountStatus>('ACTIVE');
  const [addClassName, setAddClassName] = useState('');
  const [addDepartment, setAddDepartment] = useState('Computer Science & Engineering');
  const [addYear, setAddYear] = useState<number>(3);
  const [addSection, setAddSection] = useState('A');
  const [addGender, setAddGender] = useState('Male');
  const [addDesignation, setAddDesignation] = useState('');

  // Edit User Form
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('STUDENT');
  const [editCollegeId, setEditCollegeId] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editStatus, setEditStatus] = useState<UserAccountStatus>('ACTIVE');
  const [editClassName, setEditClassName] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editYear, setEditYear] = useState<number>(1);
  const [editSection, setEditSection] = useState('');
  const [editGender, setEditGender] = useState('');
  const [editDesignation, setEditDesignation] = useState('');

  // Excel Import Wizard State
  const [importStep, setImportStep] = useState<'UPLOAD' | 'PREVIEW' | 'RESULT'>('UPLOAD');
  const [importRole, setImportRole] = useState<'STUDENT' | 'FACULTY'>('STUDENT');
  const [importDefaultClass, setImportDefaultClass] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isParsingExcel, setIsParsingExcel] = useState(false);
  const [previewResult, setPreviewResult] = useState<ExcelPreviewResult | null>(null);
  const [previewFilter, setPreviewFilter] = useState<'ALL' | 'VALID' | 'UPDATE' | 'ERROR'>('ALL');
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ExcelImportResult | null>(null);

  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exportingClass, setExportingClass] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
    loadClasses();
    loadAudits();
    loadRegistrationOtps();
  }, [statusFilter, roleFilter, classFilter, deptFilter, yearFilter, emailStatusFilter, activeSubTab]);

  async function loadRegistrationOtps() {
    setLoadingOtps(true);
    try {
      const data = await api.getAdminRegistrationOtps();
      setRegistrationOtps(data);
    } catch (e) {
      console.error('Failed to load registration OTPs:', e);
    } finally {
      setLoadingOtps(false);
    }
  }

  async function loadData() {
    setLoading(true);
    try {
      let role = roleFilter;
      if (activeSubTab === 'STUDENTS') role = 'STUDENT';
      if (activeSubTab === 'FACULTY') role = 'FACULTY';

      const [userData, statsData] = await Promise.all([
        api.getUsers({
          role: role !== 'ALL' ? role : undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          class_name: classFilter !== 'ALL' ? classFilter : undefined,
          department: deptFilter !== 'ALL' ? deptFilter : undefined,
          year: yearFilter !== 'ALL' ? yearFilter : undefined,
          email_status: emailStatusFilter !== 'ALL' ? emailStatusFilter : undefined,
          search: searchQuery.trim() || undefined
        }),
        api.getUserStats()
      ]);
      setUsers(userData);
      setStats(statsData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function loadClasses() {
    try {
      const cls = await api.getClassesList();
      setClassesList(cls);
    } catch (e) {
      console.error(e);
    }
  }

  async function loadAudits() {
    try {
      const auds = await api.getImportAudits();
      setImportAudits(auds);
    } catch (e) {
      console.error(e);
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setAddFullName('');
    setAddEmail('');
    setAddRole(activeSubTab === 'FACULTY' ? 'FACULTY' : 'STUDENT');
    setAddCollegeId('');
    setAddMobile('');
    setAddStatus('ACTIVE');
    setAddClassName(classFilter !== 'ALL' ? classFilter : 'III CSE A');
    setAddDepartment('Computer Science & Engineering');
    setAddYear(3);
    setAddSection('A');
    setAddGender('Male');
    setAddDesignation('Assistant Professor');
    setModalError('');
    setModalSuccess('');
    setShowAddModal(true);
  };

  // Submit Add User
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    setIsSubmitting(true);
    try {
      await api.createUser({
        full_name: addFullName.trim(),
        email: addEmail.trim() || undefined,
        role: addRole,
        college_id: addCollegeId.trim(),
        mobile_number: addMobile.trim(),
        status: addStatus,
        class_name: addClassName.trim(),
        department: addDepartment.trim(),
        year: addRole === 'STUDENT' ? Number(addYear) : undefined,
        section: addSection.trim(),
        gender: addGender.trim(),
        designation: addDesignation.trim()
      });
      setModalSuccess('Account added successfully.');
      setTimeout(() => {
        setShowAddModal(false);
        loadData();
        loadClasses();
      }, 700);
    } catch (err: any) {
      setModalError(err.message || 'Failed to create user account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (user: User) => {
    setEditingUser(user);
    setEditFullName(user.full_name);
    setEditEmail(user.email || '');
    setEditRole(user.role);
    setEditCollegeId(user.college_id || '');
    setEditMobile(user.mobile_number || '');
    setEditStatus(user.status);
    setEditClassName(user.class_name || user.student_profile?.class_name || user.faculty_profile?.class_assigned || '');
    setEditDepartment(user.department || user.student_profile?.department || user.faculty_profile?.department || '');
    setEditYear(user.year || user.student_profile?.year || 1);
    setEditSection(user.section || user.student_profile?.section || '');
    setEditGender(user.student_profile?.gender || '');
    setEditDesignation(user.faculty_profile?.designation || '');
    setModalError('');
    setModalSuccess('');
  };

  // Submit Edit User
  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setModalError('');
    setIsSubmitting(true);
    try {
      await api.updateUser(editingUser.id, {
        full_name: editFullName.trim(),
        email: editEmail.trim() || null,
        role: editRole,
        college_id: editCollegeId.trim(),
        mobile_number: editMobile.trim(),
        status: editStatus,
        class_name: editClassName.trim(),
        department: editDepartment.trim(),
        year: editRole === 'STUDENT' ? Number(editYear) : undefined,
        section: editSection.trim(),
        gender: editGender.trim(),
        designation: editDesignation.trim()
      });
      setModalSuccess('Account details updated successfully.');
      setTimeout(() => {
        setEditingUser(null);
        loadData();
        loadClasses();
      }, 700);
    } catch (err: any) {
      setModalError(err.message || 'Failed to update account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Direct Activate
  const handleDirectActivate = async (userId: number) => {
    try {
      await api.activateUser(userId);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to activate user.');
    }
  };

  // Toggle Status
  const handleToggleStatus = async (userId: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await api.toggleUserStatus(userId, newStatus);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to change status.');
    }
  };

  // Delete User
  const handleDeleteUser = async () => {
    if (!deleteConfirmUser) return;
    setIsSubmitting(true);
    try {
      await api.deleteUser(deleteConfirmUser.id);
      setDeleteConfirmUser(null);
      loadData();
      loadClasses();
    } catch (err: any) {
      alert(err.message || 'Failed to delete user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Download Template
  const handleDownloadTemplate = async (role: 'STUDENT' | 'FACULTY') => {
    try {
      const blob = await api.downloadExcelTemplate(role);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `saec_${role.toLowerCase()}_import_template.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert(err.message || 'Failed to download template');
    }
  };

  // Export Class Roster
  const handleExportRoster = async (clsName?: string) => {
    setExportingClass(true);
    try {
      const targetCls = clsName !== undefined ? clsName : (classFilter !== 'ALL' ? classFilter : undefined);
      const targetDept = deptFilter !== 'ALL' ? deptFilter : undefined;
      const blob = await api.exportClassExcel(targetCls, targetDept);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeName = targetCls ? targetCls.replace(/\s+/g, '_') : 'all_students';
      a.download = `saec_roster_${safeName}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert(err.message || 'Failed to export class roster');
    } finally {
      setExportingClass(false);
    }
  };

  // File Drop / Selection for Excel Import
  const handleFileSelect = (file: File) => {
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      alert('Please select a valid Excel file (.xlsx or .xls)');
      return;
    }
    setImportFile(file);
    handleParseExcel(file);
  };

  // Parse and preview Excel file
  const handleParseExcel = async (file: File) => {
    setIsParsingExcel(true);
    setModalError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('role', importRole);
      if (importDefaultClass.trim()) {
        formData.append('default_class', importDefaultClass.trim());
      }
      const preview = await api.previewExcelImport(formData);
      setPreviewResult(preview);
      setImportStep('PREVIEW');
    } catch (err: any) {
      alert(err.message || 'Failed to parse Excel file.');
      setImportFile(null);
    } finally {
      setIsParsingExcel(false);
    }
  };

  // Confirm and execute bulk import
  const handleConfirmImport = async () => {
    if (!previewResult) return;
    setIsImporting(true);
    try {
      const res = await api.confirmExcelImport({
        file_name: previewResult.file_name,
        role: previewResult.role,
        target_class: previewResult.default_class,
        rows: previewResult.rows
      });
      setImportResult(res);
      setImportStep('RESULT');
      loadData();
      loadClasses();
      loadAudits();
    } catch (err: any) {
      alert(err.message || 'Import failed');
    } finally {
      setIsImporting(false);
    }
  };

  const getFilteredPreviewRows = () => {
    if (!previewResult) return [];
    if (previewFilter === 'VALID') return previewResult.rows.filter(r => r.status === 'VALID');
    if (previewFilter === 'UPDATE') return previewResult.rows.filter(r => r.status === 'UPDATE');
    if (previewFilter === 'ERROR') return previewResult.rows.filter(r => r.status === 'ERROR');
    return previewResult.rows;
  };

  return (
    <div style={{ paddingBottom: '3rem' }}>
      {/* Header & Sub-Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#1e293b', margin: 0 }}>
              User & Class Management
            </h2>
            <span className="badge badge-purple" style={{ fontSize: '0.75rem', fontWeight: 800 }}>
              SAEC Portal
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0' }}>
            Manage authorized student and faculty accounts, bulk import class rosters, and verify Google identities.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleExportRoster()}
            disabled={exportingClass}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
          >
            <Download size={15} />
            {exportingClass ? 'Exporting...' : classFilter !== 'ALL' ? `Export ${classFilter}` : 'Export Roster (.xlsx)'}
          </button>

          <button
            onClick={() => {
              setActiveSubTab('IMPORT_EXCEL');
              setImportStep('UPLOAD');
              setImportFile(null);
              setPreviewResult(null);
            }}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#ea580c', borderColor: '#fed7aa', background: '#fff7ed' }}
          >
            <FileSpreadsheet size={15} />
            Import Excel
          </button>

          <button
            onClick={handleOpenAddModal}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700 }}
          >
            <UserPlus size={16} /> Add Individual User
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        borderBottom: '1px solid #e2e8f0',
        marginBottom: '1.5rem',
        overflowX: 'auto',
        paddingBottom: '2px'
      }}>
        {[
          { id: 'ALL', label: '👥 All Users', count: stats.total_users },
          { id: 'STUDENTS', label: '🎓 Students', count: stats.total_students || 0 },
          { id: 'FACULTY', label: '👨‍🏫 Faculty', count: stats.total_faculty || 0 },
          { id: 'CLASSES', label: '🏫 Class Hub', count: classesList.length },
          { id: 'REGISTRATION_OTPS', label: '🔑 Registration OTPs (viswanthan7824)', count: registrationOtps.filter(o => o.is_valid && !o.is_used).length },
          { id: 'IMPORT_EXCEL', label: '📊 Bulk Excel Import', highlight: true },
          { id: 'IMPORT_AUDIT', label: '📜 Import History', count: importAudits.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as ViewSubTab)}
            style={{
              padding: '0.65rem 1.1rem',
              borderRadius: '10px 10px 0 0',
              border: 'none',
              borderBottom: activeSubTab === tab.id ? '3px solid #ea580c' : '3px solid transparent',
              background: activeSubTab === tab.id ? '#ffffff' : 'transparent',
              color: activeSubTab === tab.id ? '#ea580c' : '#64748b',
              fontWeight: activeSubTab === tab.id ? 800 : 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span style={{
                background: activeSubTab === tab.id ? '#fff7ed' : '#f1f5f9',
                color: activeSubTab === tab.id ? '#ea580c' : '#64748b',
                padding: '2px 7px',
                borderRadius: '9999px',
                fontSize: '0.72rem',
                fontWeight: 800
              }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* 1. CLASS-WISE HUB VIEW */}
      {/* ========================================================================= */}
      {activeSubTab === 'CLASSES' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#1e293b' }}>
                Class Organization & Email Coverage
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.2rem 0 0' }}>
                Review registered classes, view Google login activation status, and export rosters.
              </p>
            </div>
          </div>

          {classesList.length === 0 ? (
            <div style={{ background: '#ffffff', borderRadius: '16px', padding: '3rem', textAlign: 'center', border: '1px dashed #cbd5e1' }}>
              <FileSpreadsheet size={48} color="#94a3b8" style={{ margin: '0 auto 1rem' }} />
              <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b', fontWeight: 800 }}>No Classes Found Yet</h4>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.4rem' }}>
                Upload class-wise Excel files or add students to populate the class hub.
              </p>
              <button
                onClick={() => { setActiveSubTab('IMPORT_EXCEL'); setImportStep('UPLOAD'); }}
                className="btn btn-primary"
                style={{ marginTop: '1rem', fontWeight: 700 }}
              >
                Import First Class Excel
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
              {classesList.map((cls) => (
                <div
                  key={cls.class_name}
                  style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    padding: '1.25rem',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#1e293b' }}>
                          {cls.class_name}
                        </h4>
                        <div style={{ fontSize: '0.75rem', color: '#ea580c', fontWeight: 700, marginTop: '2px' }}>
                          {cls.department} • Year {cls.year}
                        </div>
                      </div>
                      <span className="badge badge-purple" style={{ fontSize: '0.75rem' }}>
                        {cls.total_students} Students
                      </span>
                    </div>

                    {/* Progress Bar for Email Coverage */}
                    <div style={{ margin: '1rem 0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                        <span style={{ color: '#047857' }}>✓ {cls.email_linked_count} Linked</span>
                        <span style={{ color: cls.email_missing_count > 0 ? '#b91c1c' : '#64748b' }}>
                          {cls.email_missing_count > 0 ? `⚠️ ${cls.email_missing_count} Missing` : 'All Linked'}
                        </span>
                      </div>
                      <div style={{ height: '8px', width: '100%', background: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${cls.percent_linked}%`,
                            background: cls.percent_linked === 100 ? '#10b981' : '#ea580c',
                            borderRadius: '9999px',
                            transition: 'width 0.3s'
                          }}
                        />
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', textAlign: 'right', marginTop: '0.25rem' }}>
                        {cls.percent_linked}% Google login ready
                      </div>
                    </div>
                  </div>

                  {/* Class Actions */}
                  <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.85rem' }}>
                    <button
                      onClick={() => {
                        setClassFilter(cls.class_name);
                        setActiveSubTab('ALL');
                      }}
                      className="btn btn-secondary"
                      style={{ flex: 1, fontSize: '0.78rem', padding: '0.45rem' }}
                    >
                      Filter Students
                    </button>
                    <button
                      onClick={() => handleExportRoster(cls.class_name)}
                      className="btn btn-secondary"
                      style={{ flex: 1, fontSize: '0.78rem', padding: '0.45rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                    >
                      <Download size={13} /> Export (.xlsx)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. EXCEL BULK IMPORT WIZARD */}
      {/* ========================================================================= */}
      {activeSubTab === 'IMPORT_EXCEL' && (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          {/* Wizard Step Progress Tracker */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '18px', left: '10%', right: '10%', height: '2px', background: '#e2e8f0', zIndex: 0 }} />

            {[
              { id: 'UPLOAD', label: '1. Select & Upload Excel' },
              { id: 'PREVIEW', label: '2. Validate & Preview Data' },
              { id: 'RESULT', label: '3. Import Summary' },
            ].map((step, idx) => {
              const isActive = importStep === step.id;
              const isDone = (step.id === 'UPLOAD' && (importStep === 'PREVIEW' || importStep === 'RESULT')) || (step.id === 'PREVIEW' && importStep === 'RESULT');
              return (
                <div key={step.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: isDone ? '#10b981' : isActive ? '#ea580c' : '#ffffff',
                      border: isDone || isActive ? 'none' : '2px solid #cbd5e1',
                      color: isDone || isActive ? '#ffffff' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      boxShadow: isActive ? '0 0 0 4px rgba(234, 88, 12, 0.2)' : 'none'
                    }}
                  >
                    {isDone ? <Check size={18} /> : idx + 1}
                  </div>
                  <span style={{ fontSize: '0.78rem', fontWeight: isActive ? 800 : 600, color: isActive ? '#ea580c' : '#64748b', marginTop: '0.4rem' }}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* STEP 1: UPLOAD & TEMPLATE */}
          {importStep === 'UPLOAD' && (
            <div style={{ background: '#ffffff', borderRadius: '20px', padding: '2rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)' }}>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: '0 0 0.4rem', fontSize: '1.35rem', fontWeight: 900, color: '#1e293b' }}>
                  Upload Class-Wise Excel File
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                  Add student or faculty records in bulk. Accounts can be created with or without Google emails.
                </p>
              </div>

              {/* Template Download Section */}
              <div style={{ background: '#f8fafc', borderRadius: '14px', padding: '1rem 1.25rem', border: '1px solid #e2e8f0', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#1e293b' }}>Need an Excel Template?</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Download ready-to-use sample spreadsheets with required columns:</div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => handleDownloadTemplate('STUDENT')}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <Download size={14} /> Student Template (.xlsx)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadTemplate('FACULTY')}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <Download size={14} /> Faculty Template (.xlsx)
                  </button>
                </div>
              </div>

              {/* Import Configuration Fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.35rem' }}>
                    Target Account Role *
                  </label>
                  <select
                    value={importRole}
                    onChange={(e) => setImportRole(e.target.value as any)}
                    className="input-field"
                    style={{ width: '100%' }}
                  >
                    <option value="STUDENT">🎓 Student Roster</option>
                    <option value="FACULTY">👨‍🏫 Faculty / Staff</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.35rem' }}>
                    Default Class (Optional override)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. III CSE A"
                    value={importDefaultClass}
                    onChange={(e) => setImportDefaultClass(e.target.value)}
                    className="input-field"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {/* Drag & Drop Upload Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileSelect(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: isDragOver ? '2px dashed #ea580c' : '2px dashed #cbd5e1',
                  background: isDragOver ? '#fff7ed' : '#fafafa',
                  borderRadius: '16px',
                  padding: '3rem 1.5rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                  accept=".xlsx, .xls"
                  style={{ display: 'none' }}
                />

                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: '#fff7ed',
                    color: '#ea580c',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1rem'
                  }}
                >
                  <Upload size={28} />
                </div>

                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.3rem' }}>
                  {isParsingExcel ? 'Analyzing and validating Excel file...' : 'Choose or Drag & Drop Excel File'}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Accepts Microsoft Excel spreadsheets (.xlsx, .xls) up to 10MB
                </div>

                {isParsingExcel && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', color: '#ea580c', fontWeight: 700 }}>
                    <RefreshCw size={18} className="animate-spin" /> Validating spreadsheet rows...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: PREVIEW TABLE */}
          {importStep === 'PREVIEW' && previewResult && (
            <div style={{ background: '#ffffff', borderRadius: '20px', padding: '1.75rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.3rem', fontWeight: 900, color: '#1e293b' }}>
                    Import Validation Preview
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
                    File: <strong>{previewResult.file_name}</strong> • {previewResult.total_rows} rows found
                  </p>
                </div>

                {/* Validation Counters */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span className="badge badge-green" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>
                    ✓ {previewResult.valid_count} New Valid
                  </span>
                  {previewResult.update_count > 0 && (
                    <span className="badge badge-blue" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>
                      🔄 {previewResult.update_count} Existing (Update)
                    </span>
                  )}
                  {previewResult.error_count > 0 && (
                    <span className="badge badge-red" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>
                      ⚠️ {previewResult.error_count} Errors (Will Skip)
                    </span>
                  )}
                </div>
              </div>

              {/* Status Alert if Errors */}
              {previewResult.has_errors && (
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#92400e', fontSize: '0.82rem', fontWeight: 600 }}>
                  <AlertTriangle size={18} />
                  <span>
                    {previewResult.error_count} row(s) have invalid formatting or missing required fields and will be skipped during import.
                  </span>
                </div>
              )}

              {/* Preview Filter Buttons */}
              <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem' }}>
                {(['ALL', 'VALID', 'UPDATE', 'ERROR'] as const).map((filterType) => (
                  <button
                    key={filterType}
                    onClick={() => setPreviewFilter(filterType)}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: previewFilter === filterType ? '#1e293b' : '#f8fafc',
                      color: previewFilter === filterType ? '#ffffff' : '#475569',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {filterType === 'ALL' && `All Rows (${previewResult.rows.length})`}
                    {filterType === 'VALID' && `New Ready (${previewResult.valid_count})`}
                    {filterType === 'UPDATE' && `Updates (${previewResult.update_count})`}
                    {filterType === 'ERROR' && `Errors (${previewResult.error_count})`}
                  </button>
                ))}
              </div>

              {/* Preview Table */}
              <div style={{ overflowX: 'auto', maxHeight: '420px', border: '1px solid #e2e8f0', borderRadius: '12px', marginBottom: '1.5rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', borderBottom: '1px solid #e2e8f0', zIndex: 10 }}>
                    <tr>
                      <th style={{ padding: '0.65rem 0.85rem', textAlign: 'left', fontWeight: 800 }}>Row</th>
                      <th style={{ padding: '0.65rem 0.85rem', textAlign: 'left', fontWeight: 800 }}>Name</th>
                      <th style={{ padding: '0.65rem 0.85rem', textAlign: 'left', fontWeight: 800 }}>Register No / ID</th>
                      <th style={{ padding: '0.65rem 0.85rem', textAlign: 'left', fontWeight: 800 }}>Class</th>
                      <th style={{ padding: '0.65rem 0.85rem', textAlign: 'left', fontWeight: 800 }}>Phone</th>
                      <th style={{ padding: '0.65rem 0.85rem', textAlign: 'left', fontWeight: 800 }}>Google Email</th>
                      <th style={{ padding: '0.65rem 0.85rem', textAlign: 'left', fontWeight: 800 }}>Validation Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredPreviewRows().map((row) => (
                      <tr key={row.row_index} style={{ borderBottom: '1px solid #f1f5f9', background: row.status === 'ERROR' ? '#fef2f2' : row.status === 'UPDATE' ? '#f0fdf4' : '#ffffff' }}>
                        <td style={{ padding: '0.6rem 0.85rem', color: '#64748b', fontWeight: 700 }}>#{row.row_index}</td>
                        <td style={{ padding: '0.6rem 0.85rem', fontWeight: 700, color: '#1e293b' }}>{row.name || <em style={{ color: '#ef4444' }}>Missing</em>}</td>
                        <td style={{ padding: '0.6rem 0.85rem', fontFamily: 'monospace', fontWeight: 700 }}>{row.register_number || <em style={{ color: '#ef4444' }}>Missing</em>}</td>
                        <td style={{ padding: '0.6rem 0.85rem' }}>{row.class_name || '—'}</td>
                        <td style={{ padding: '0.6rem 0.85rem' }}>{row.phone || '—'}</td>
                        <td style={{ padding: '0.6rem 0.85rem' }}>
                          {row.email ? (
                            <span style={{ color: '#047857', fontWeight: 600 }}>{row.email}</span>
                          ) : (
                            <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>— (Empty Google Email)</span>
                          )}
                        </td>
                        <td style={{ padding: '0.6rem 0.85rem' }}>
                          {row.status === 'VALID' && (
                            <span className="badge badge-green">✓ Ready to Create</span>
                          )}
                          {row.status === 'UPDATE' && (
                            <span className="badge badge-blue">🔄 Existing Match (Update)</span>
                          )}
                          {row.status === 'ERROR' && (
                            <span className="badge badge-red" title={row.status_message}>
                              ❌ {row.status_message}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  onClick={() => { setImportStep('UPLOAD'); setImportFile(null); setPreviewResult(null); }}
                  className="btn btn-secondary"
                  disabled={isImporting}
                >
                  ← Choose Different File
                </button>

                <button
                  onClick={handleConfirmImport}
                  disabled={isImporting || (previewResult.valid_count === 0 && previewResult.update_count === 0)}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, padding: '0.75rem 1.5rem' }}
                >
                  {isImporting ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                  {isImporting ? 'Importing into Database...' : `Confirm & Import (${previewResult.valid_count + previewResult.update_count} Accounts)`}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: RESULT SUMMARY */}
          {importStep === 'RESULT' && importResult && (
            <div style={{ background: '#ffffff', borderRadius: '20px', padding: '2.5rem 2rem', border: '1px solid #e2e8f0', textAlign: 'center', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: '#ecfdf5',
                  color: '#047857',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem'
                }}
              >
                <CheckCircle2 size={36} />
              </div>

              <h3 style={{ margin: '0 0 0.4rem', fontSize: '1.5rem', fontWeight: 900, color: '#1e293b' }}>
                Bulk Import Completed
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 1.5rem' }}>
                Total Processed: <strong>{importResult.total_rows}</strong> records
              </p>

              {/* Breakdown Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.75rem', maxWidth: '600px', margin: '0 auto 1.75rem' }}>
                <div style={{ background: '#ecfdf5', borderRadius: '14px', padding: '1rem', border: '1px solid #a7f3d0' }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#047857' }}>+{importResult.created_count}</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#065f46' }}>Created Accounts</div>
                </div>

                <div style={{ background: '#eff6ff', borderRadius: '14px', padding: '1rem', border: '1px solid #bfdbfe' }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#2563eb' }}>~{importResult.updated_count}</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e40af' }}>Updated Accounts</div>
                </div>

                <div style={{ background: '#fef2f2', borderRadius: '14px', padding: '1rem', border: '1px solid #fecaca' }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#dc2626' }}>!{importResult.failed_count}</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#991b1b' }}>Skipped (Errors)</div>
                </div>
              </div>

              {/* Skipped Details Table if any */}
              {importResult.skipped_details && importResult.skipped_details.length > 0 && (
                <div style={{ textAlign: 'left', background: '#f8fafc', borderRadius: '12px', padding: '1rem', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#dc2626', marginBottom: '0.5rem' }}>
                    Skipped Rows Report:
                  </div>
                  {importResult.skipped_details.map((skip, idx) => (
                    <div key={idx} style={{ fontSize: '0.75rem', color: '#475569', padding: '0.25rem 0', borderBottom: '1px dashed #e2e8f0' }}>
                      <strong>{skip.register_number}</strong> ({skip.name}): <span style={{ color: '#b91c1c' }}>{skip.reason}</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <button
                  onClick={() => {
                    setImportStep('UPLOAD');
                    setImportFile(null);
                    setPreviewResult(null);
                  }}
                  className="btn btn-secondary"
                >
                  Import Another File
                </button>
                <button
                  onClick={() => setActiveSubTab('ALL')}
                  className="btn btn-primary"
                  style={{ fontWeight: 800 }}
                >
                  View All Users
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. IMPORT AUDIT HISTORY VIEW */}
      {/* ========================================================================= */}
      {activeSubTab === 'IMPORT_AUDIT' && (
        <div>
          <div style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#1e293b' }}>
              Bulk Import Audit Trail
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.2rem 0 0' }}>
              Historical log of Excel imports, records updated, and created accounts.
            </p>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <tr>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 800 }}>Date & Time</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 800 }}>Admin</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 800 }}>File Name</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 800 }}>Target Role</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 800 }}>Target Class</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 800 }}>Created</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 800 }}>Updated</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 800 }}>Failed</th>
                </tr>
              </thead>
              <tbody>
                {importAudits.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                      No import audit records found.
                    </td>
                  </tr>
                ) : (
                  importAudits.map((aud) => (
                    <tr key={aud.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>
                        {new Date(aud.created_at).toLocaleString()}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#1e293b' }}>
                        {aud.admin_name}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace' }}>
                        {aud.file_name}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span className="badge badge-purple">{aud.target_role}</span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {aud.target_class || '—'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#047857', fontWeight: 800 }}>
                        +{aud.created_count}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#2563eb', fontWeight: 800 }}>
                        ~{aud.updated_count}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: aud.failed_count > 0 ? '#dc2626' : '#64748b', fontWeight: 800 }}>
                        {aud.failed_count}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3.5. REGISTRATION OTP REQUESTS VIEW (viswanthan7824) */}
      {/* ========================================================================= */}
      {activeSubTab === 'REGISTRATION_OTPS' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#1e293b' }}>
                  Student & Faculty Registration OTPs
                </h3>
                <span className="badge badge-purple" style={{ fontSize: '0.72rem', fontWeight: 800 }}>
                  Admin Account: viswanthan7824
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.2rem 0 0' }}>
                Active dual-verification OTPs requested by students and faculty from the approved class Excel rosters.
              </p>
            </div>

            <button
              onClick={loadRegistrationOtps}
              disabled={loadingOtps}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
            >
              <RefreshCw size={15} className={loadingOtps ? 'animate-spin' : ''} />
              {loadingOtps ? 'Refreshing...' : 'Refresh OTPs'}
            </button>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <tr>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 800 }}>Requested At</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 800 }}>Student / Faculty</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 800 }}>Email Address</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 800 }}>Class / Register No</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 800, color: '#e11d48' }}>Admin OTP (viswanthan7824)</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 800 }}>Gmail OTP</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 800 }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 800 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {registrationOtps.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '2.5rem', textAlign: 'center', color: '#94a3b8' }}>
                      No registration OTP requests recorded yet.
                    </td>
                  </tr>
                ) : (
                  registrationOtps.map((otp) => {
                    const isPending = otp.is_valid && !otp.is_used;
                    return (
                      <tr key={otp.id} style={{ borderBottom: '1px solid #f1f5f9', background: isPending ? '#fff7ed' : 'transparent' }}>
                        <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>
                          {new Date(otp.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#1e293b' }}>
                          <div>{otp.full_name || 'Student'}</div>
                          <span className={`badge ${otp.role === 'FACULTY' ? 'badge-purple' : 'badge-orange'}`} style={{ fontSize: '0.68rem', marginTop: '2px' }}>
                            {otp.role}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: '#2563eb', fontWeight: 600 }}>
                          {otp.email}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ fontWeight: 600 }}>{otp.class_name || '—'}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{otp.college_id || '—'}</div>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span
                              style={{
                                background: '#ffe4e6',
                                color: '#e11d48',
                                padding: '0.25rem 0.6rem',
                                borderRadius: '8px',
                                fontWeight: 900,
                                fontSize: '1rem',
                                letterSpacing: '0.1em'
                              }}
                            >
                              {otp.admin_otp}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(otp.admin_otp);
                                setCopiedOtpId(otp.id);
                                setTimeout(() => setCopiedOtpId(null), 1500);
                              }}
                              style={{
                                background: 'none',
                                border: '1px solid #fed7aa',
                                borderRadius: '6px',
                                padding: '0.2rem 0.4rem',
                                cursor: 'pointer',
                                fontSize: '0.72rem',
                                color: copiedOtpId === otp.id ? '#047857' : '#ea580c'
                              }}
                            >
                              {copiedOtpId === otp.id ? 'Copied!' : <Copy size={13} />}
                            </button>
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontWeight: 700, color: '#475569' }}>
                          {otp.gmail_otp}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          {otp.is_used ? (
                            <span className="badge badge-green">✓ Activated & Registered</span>
                          ) : !otp.is_valid ? (
                            <span className="badge badge-gray">Expired</span>
                          ) : otp.is_gmail_verified && otp.is_admin_verified ? (
                            <span className="badge badge-blue">OTPs Verified (Pending Password)</span>
                          ) : (
                            <span className="badge badge-orange">⏳ Awaiting Verification</span>
                          )}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                          {isPending && (
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(otp.admin_otp);
                                alert(`Admin OTP ${otp.admin_otp} copied! You can provide this to student ${otp.full_name || otp.email}.`);
                              }}
                              className="btn btn-secondary"
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.72rem', fontWeight: 700 }}
                            >
                              Provide Admin OTP
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. USER LIST (ALL / STUDENTS / FACULTY) */}
      {/* ========================================================================= */}
      {(activeSubTab === 'ALL' || activeSubTab === 'STUDENTS' || activeSubTab === 'FACULTY') && (
        <>
          {/* Stats Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ background: '#ffffff', borderRadius: '16px', padding: '1rem 1.25rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Total Users</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#1e293b', marginTop: '0.2rem' }}>{stats.total_users}</div>
            </div>

            <div style={{ background: '#ffffff', borderRadius: '16px', padding: '1rem 1.25rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#047857', textTransform: 'uppercase' }}>Active Accounts</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#047857', marginTop: '0.2rem' }}>{stats.active_users}</div>
            </div>

            <div style={{ background: '#ffffff', borderRadius: '16px', padding: '1rem 1.25rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase' }}>Google Email Linked</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#2563eb', marginTop: '0.2rem' }}>{stats.email_linked_students || 0}</div>
            </div>

            <div style={{ background: '#ffffff', borderRadius: '16px', padding: '1rem 1.25rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ea580c', textTransform: 'uppercase' }}>Google Email Missing</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#ea580c', marginTop: '0.2rem' }}>{stats.email_missing_students || 0}</div>
            </div>

            <div style={{ background: '#ffffff', borderRadius: '16px', padding: '1rem 1.25rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase' }}>Total Classes</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#7c3aed', marginTop: '0.2rem' }}>{classesList.length}</div>
            </div>
          </div>

          {/* Advanced Multi-Filters Bar */}
          <div style={{ background: '#ffffff', borderRadius: '16px', padding: '1.25rem', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search by Name, Google Email, Register Number, Phone, Class..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', paddingLeft: '2.4rem' }}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ fontWeight: 700 }}>
                Search
              </button>
            </form>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.6rem' }}>
              {/* Class Filter */}
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '0.2rem' }}>CLASS</label>
                <select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', fontSize: '0.8rem', padding: '0.45rem' }}
                >
                  <option value="ALL">All Classes</option>
                  {classesList.map(c => (
                    <option key={c.class_name} value={c.class_name}>{c.class_name} ({c.total_students})</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '0.2rem' }}>STATUS</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', fontSize: '0.8rem', padding: '0.45rem' }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="PENDING">Pending Approval</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>

              {/* Email Status Filter */}
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '0.2rem' }}>GOOGLE EMAIL</label>
                <select
                  value={emailStatusFilter}
                  onChange={(e) => setEmailStatusFilter(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', fontSize: '0.8rem', padding: '0.45rem' }}
                >
                  <option value="ALL">All Accounts</option>
                  <option value="LINKED">✓ Google Email Linked</option>
                  <option value="MISSING">⚠️ Google Email Missing</option>
                </select>
              </div>

              {/* Year Filter */}
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '0.2rem' }}>YEAR OF STUDY</label>
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', fontSize: '0.8rem', padding: '0.45rem' }}
                >
                  <option value="ALL">All Years</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>

              {/* Department Filter */}
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '0.2rem' }}>DEPARTMENT</label>
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', fontSize: '0.8rem', padding: '0.45rem' }}
                >
                  <option value="ALL">All Departments</option>
                  <option value="CSE">CSE</option>
                  <option value="IT">IT</option>
                  <option value="ECE">ECE</option>
                  <option value="EEE">EEE</option>
                  <option value="MECH">MECH</option>
                  <option value="CIVIL">CIVIL</option>
                  <option value="AIDS">AIDS</option>
                </select>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.03)' }}>
            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem' }} />
                <div>Loading user records...</div>
              </div>
            ) : users.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                <Users size={36} style={{ margin: '0 auto 0.5rem' }} />
                <div style={{ fontWeight: 700, color: '#1e293b' }}>No matching accounts found</div>
                <div style={{ fontSize: '0.82rem', marginTop: '0.25rem' }}>Try clearing filters or adding new accounts.</div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <tr>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 800 }}>Full Name & Role</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 800 }}>Register No / ID</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 800 }}>Class & Dept</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 800 }}>Email</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 800 }}>Password Status</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 800 }}>Email Status</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight 800 }}>Account Status</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight 800 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => {
                      const isLinked = u.is_email_linked;
                      return (
                        <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          {/* Name & Role */}
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <div style={{ fontWeight: 800, color: '#1e293b' }}>{u.full_name}</div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '2px' }}>
                              <span className={u.role === 'ADMIN' ? 'badge badge-red' : u.role === 'FACULTY' ? 'badge badge-blue' : 'badge badge-purple'}>
                                {u.role}
                              </span>
                              {u.mobile_number && <span>• {u.mobile_number}</span>}
                            </div>
                          </td>

                          {/* Register No */}
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1e293b' }}>
                              {u.college_id || u.student_profile?.register_number || u.faculty_profile?.staff_number || '—'}
                            </span>
                          </td>

                          {/* Class & Dept */}
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <div style={{ fontWeight: 700, color: '#1e293b' }}>
                              {u.class_name || u.student_profile?.class_name || u.faculty_profile?.class_assigned || '—'}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                              {u.department || u.student_profile?.department || u.faculty_profile?.department || '—'}
                              {u.year ? ` (Yr ${u.year})` : ''}
                            </div>
                          </td>

                          {/* Google Email */}
                          <td style={{ padding: '0.75rem 1rem' }}>
                            {isLinked ? (
                              <div style={{ color: '#047857', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <CheckCircle2 size={13} color="#047857" />
                                <span>{u.email}</span>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <span style={{ background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa', padding: '2px 7px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700 }}>
                                  ⚠️ Email Missing
                                </span>
                                <button
                                  onClick={() => handleOpenEditModal(u)}
                                  style={{ background: 'none', border: 'none', color: '#ea580c', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                                >
                                  Add
                                </button>
                              </div>
                            )}
                          </td>

                          {/* Password Status */}
                          <td style={{ padding: '0.75rem 1rem' }}>
                            {u.password_created ? (
                              <span className="badge badge-green">✓ Password Created</span>
                            ) : (
                              <span className="badge badge-yellow">⚠️ Password Not Created</span>
                            )}
                          </td>

                          {/* Email Status */}
                          <td style={{ padding: '0.75rem 1rem' }}>
                            {u.email_verified ? (
                              <span className="badge badge-green">✓ Verified</span>
                            ) : (
                              <span className="badge badge-gray">Not Verified</span>
                            )}
                          </td>

                          {/* Account Status */}
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <span className={
                              u.status === 'ACTIVE' ? 'badge badge-green' :
                              u.status === 'PENDING' ? 'badge badge-yellow' : 'badge badge-gray'
                            }>
                              {u.status}
                            </span>
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.35rem' }}>
                              {u.status === 'PENDING' && (
                                <button
                                  onClick={() => handleDirectActivate(u.id)}
                                  title="Activate User"
                                  className="btn btn-secondary"
                                  style={{ padding: '0.35rem 0.65rem', color: '#047857', borderColor: '#a7f3d0', background: '#ecfdf5', fontSize: '0.75rem', fontWeight: 700 }}
                                >
                                  Activate
                                </button>
                              )}

                              {u.status !== 'PENDING' && u.role !== 'ADMIN' && (
                                <button
                                  onClick={() => handleToggleStatus(u.id, u.status)}
                                  title={u.status === 'ACTIVE' ? 'Deactivate Account' : 'Activate Account'}
                                  className="btn btn-secondary"
                                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                                >
                                  {u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                                </button>
                              )}

                              <button
                                onClick={() => handleOpenEditModal(u)}
                                title="Edit User"
                                className="btn btn-secondary"
                                style={{ padding: '0.35rem 0.55rem' }}
                              >
                                <Edit2 size={13} />
                              </button>

                              {u.role !== 'ADMIN' && (
                                <button
                                  onClick={() => setDeleteConfirmUser(u)}
                                  title="Delete User"
                                  className="btn btn-secondary"
                                  style={{ padding: '0.35rem 0.55rem', color: '#ef4444', borderColor: '#fecaca' }}
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* ADD USER MODAL */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>
                Add Individual User
              </h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {modalError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '0.75rem 1rem', color: '#b91c1c', fontSize: '0.82rem', marginBottom: '1rem', fontWeight: 600 }}>
                {modalError}
              </div>
            )}

            {modalSuccess && (
              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '10px', padding: '0.75rem 1rem', color: '#047857', fontSize: '0.82rem', marginBottom: '1rem', fontWeight: 600 }}>
                {modalSuccess}
              </div>
            )}

            <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.3rem' }}>
                    Role *
                  </label>
                  <select
                    value={addRole}
                    onChange={(e) => setAddRole(e.target.value as any)}
                    className="input-field"
                    style={{ width: '100%' }}
                  >
                    <option value="STUDENT">🎓 Student</option>
                    <option value="FACULTY">👨‍🏫 Faculty / Staff</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.3rem' }}>
                    Initial Status *
                  </label>
                  <select
                    value={addStatus}
                    onChange={(e) => setAddStatus(e.target.value as any)}
                    className="input-field"
                    style={{ width: '100%' }}
                  >
                    <option value="ACTIVE">Active (Can Login)</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="PENDING">Pending Approval</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.3rem' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Viswanthan T"
                  value={addFullName}
                  onChange={(e) => setAddFullName(e.target.value)}
                  required
                  className="input-field"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.3rem' }}>
                  Approved College Email (Login Identifier)
                </label>
                <input
                  type="email"
                  placeholder="e.g. student@saec.ac.in"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  className="input-field"
                  style={{ width: '100%' }}
                />
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '3px' }}>
                  Students log in using this Google email. If left blank, email can be added later before login.
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.3rem' }}>
                    {addRole === 'STUDENT' ? 'Register Number *' : 'Employee ID *'}
                  </label>
                  <input
                    type="text"
                    placeholder={addRole === 'STUDENT' ? 'e.g. 912821104001' : 'e.g. SAEC-FAC-001'}
                    value={addCollegeId}
                    onChange={(e) => setAddCollegeId(e.target.value)}
                    required
                    className="input-field"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.3rem' }}>
                    Mobile Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 9876543210"
                    value={addMobile}
                    onChange={(e) => setAddMobile(e.target.value)}
                    className="input-field"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.3rem' }}>
                    Class (e.g. III CSE A)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. III CSE A"
                    value={addClassName}
                    onChange={(e) => setAddClassName(e.target.value)}
                    className="input-field"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.3rem' }}>
                    Department
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CSE"
                    value={addDepartment}
                    onChange={(e) => setAddDepartment(e.target.value)}
                    className="input-field"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {addRole === 'STUDENT' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.3rem' }}>Year</label>
                    <select
                      value={addYear}
                      onChange={(e) => setAddYear(parseInt(e.target.value))}
                      className="input-field"
                      style={{ width: '100%' }}
                    >
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.3rem' }}>Section</label>
                    <input
                      type="text"
                      placeholder="A, B, C"
                      value={addSection}
                      onChange={(e) => setAddSection(e.target.value)}
                      className="input-field"
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.3rem' }}>Gender</label>
                    <select
                      value={addGender}
                      onChange={(e) => setAddGender(e.target.value)}
                      className="input-field"
                      style={{ width: '100%' }}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.85rem', fontWeight: 800, marginTop: '0.5rem' }}
              >
                {isSubmitting ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT USER MODAL */}
      {/* ========================================================================= */}
      {editingUser && (
        <div className="modal-overlay" onClick={() => setEditingUser(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>
                Edit Account Details
              </h3>
              <button onClick={() => setEditingUser(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {modalError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '0.75rem 1rem', color: '#b91c1c', fontSize: '0.82rem', marginBottom: '1rem', fontWeight: 600 }}>
                {modalError}
              </div>
            )}

            {modalSuccess && (
              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '10px', padding: '0.75rem 1rem', color: '#047857', fontSize: '0.82rem', marginBottom: '1rem', fontWeight: 600 }}>
                {modalSuccess}
              </div>
            )}

            <form onSubmit={handleEditUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.3rem' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  required
                  className="input-field"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.3rem' }}>
                  Approved College Email (Login Identifier)
                </label>
                <input
                  type="email"
                  placeholder="e.g. student@saec.ac.in"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="input-field"
                  style={{ width: '100%' }}
                />
                <div style={{ fontSize: '0.72rem', color: '#ea580c', fontWeight: 600, marginTop: '3px' }}>
                  ⚠️ This email determines which college user account receives one-time login codes.
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.3rem' }}>
                    Register Number / ID
                  </label>
                  <input
                    type="text"
                    value={editCollegeId}
                    onChange={(e) => setEditCollegeId(e.target.value)}
                    className="input-field"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.3rem' }}>
                    Mobile Number
                  </label>
                  <input
                    type="text"
                    value={editMobile}
                    onChange={(e) => setEditMobile(e.target.value)}
                    className="input-field"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.3rem' }}>
                    Class
                  </label>
                  <input
                    type="text"
                    value={editClassName}
                    onChange={(e) => setEditClassName(e.target.value)}
                    className="input-field"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.3rem' }}>
                    Status *
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="input-field"
                    style={{ width: '100%' }}
                  >
                    <option value="ACTIVE">Active (Allowed to order)</option>
                    <option value="INACTIVE">Inactive (Access blocked)</option>
                    <option value="PENDING">Pending Approval</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.85rem', fontWeight: 800, marginTop: '0.5rem' }}
              >
                {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {deleteConfirmUser && (
        <div className="modal-overlay" onClick={() => setDeleteConfirmUser(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px', padding: '2rem', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fef2f2', color: '#ef4444', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <Trash2 size={24} />
            </div>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', fontWeight: 900, color: '#1e293b' }}>
              Confirm Deletion
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>
              Are you sure you want to permanently delete account <strong>{deleteConfirmUser.full_name}</strong>?
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setDeleteConfirmUser(null)} className="btn btn-secondary" style={{ flex: 1 }}>
                Cancel
              </button>
              <button onClick={handleDeleteUser} disabled={isSubmitting} className="btn btn-primary" style={{ flex: 1, background: '#ef4444', borderColor: '#ef4444', fontWeight: 800 }}>
                {isSubmitting ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
