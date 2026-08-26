import React, { useState, useEffect } from 'react';
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
  X
} from 'lucide-react';
import { api } from '../services/api';
import type { User, UserRole, UserAccountStatus, UserStats } from '../types';

export const UserManagementView: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats>({
    total_users: 0,
    pending_users: 0,
    active_users: 0,
    inactive_users: 0,
    rejected_users: 0
  });
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<User | null>(null);

  // Form States for Add User
  const [addFullName, setAddFullName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addRole, setAddRole] = useState<'STUDENT' | 'FACULTY'>('STUDENT');
  const [addCollegeId, setAddCollegeId] = useState('');
  const [addMobile, setAddMobile] = useState('');
  const [addStatus, setAddStatus] = useState<UserAccountStatus>('ACTIVE');
  const [addDepartment, setAddDepartment] = useState('Computer Science & Engineering');
  const [addYear, setAddYear] = useState<number>(1);

  // Form States for Edit User
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('STUDENT');
  const [editCollegeId, setEditCollegeId] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editStatus, setEditStatus] = useState<UserAccountStatus>('ACTIVE');
  const [editDepartment, setEditDepartment] = useState('');
  const [editYear, setEditYear] = useState<number>(1);

  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [statusFilter, roleFilter]);

  async function loadData() {
    setLoading(true);
    try {
      const [userData, statsData] = await Promise.all([
        api.getUsers(roleFilter, statusFilter, searchQuery),
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleOpenAddModal = () => {
    setAddFullName('');
    setAddEmail('');
    setAddRole('STUDENT');
    setAddCollegeId('');
    setAddMobile('');
    setAddStatus('ACTIVE');
    setAddDepartment('Computer Science & Engineering');
    setAddYear(1);
    setModalError('');
    setModalSuccess('');
    setShowAddModal(true);
  };

  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFullName.trim() || !addEmail.trim()) {
      setModalError('Please enter full name and Google email.');
      return;
    }

    setIsSubmitting(true);
    setModalError('');
    try {
      await api.createUser({
        full_name: addFullName.trim(),
        email: addEmail.trim().toLowerCase(),
        role: addRole,
        college_id: addCollegeId.trim(),
        mobile_number: addMobile.trim(),
        status: addStatus,
        department: addDepartment.trim(),
        year: addRole === 'STUDENT' ? Number(addYear) : undefined
      });

      setShowAddModal(false);
      loadData();
    } catch (err: any) {
      setModalError(err.message || 'Failed to create user account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditModal = (u: User) => {
    setEditingUser(u);
    setEditFullName(u.full_name || '');
    setEditEmail(u.email || '');
    setEditRole(u.role || 'STUDENT');
    setEditCollegeId(u.college_id || u.student_profile?.register_number || u.faculty_profile?.staff_number || '');
    setEditMobile(u.mobile_number || '');
    setEditStatus(u.status || 'ACTIVE');
    setEditDepartment(u.student_profile?.department || u.faculty_profile?.department || 'Computer Science & Engineering');
    setEditYear(u.student_profile?.year || 1);
    setModalError('');
    setModalSuccess('');
  };

  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsSubmitting(true);
    setModalError('');
    try {
      await api.updateUser(editingUser.id, {
        full_name: editFullName.trim(),
        email: editEmail.trim().toLowerCase(),
        role: editRole,
        college_id: editCollegeId.trim(),
        mobile_number: editMobile.trim(),
        status: editStatus,
        department: editDepartment.trim(),
        year: editRole === 'STUDENT' ? Number(editYear) : undefined
      });

      setEditingUser(null);
      loadData();
    } catch (err: any) {
      setModalError(err.message || 'Failed to update user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDirectActivate = async (userId: number) => {
    try {
      await api.activateUser(userId);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to activate user account.');
    }
  };

  const handleToggleStatus = async (userId: number, currentStatus: UserAccountStatus) => {
    try {
      const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await api.toggleUserStatus(userId, nextStatus);
      loadData();
    } catch (e: any) {
      alert(e.message || 'Could not update user status.');
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteConfirmUser) return;
    try {
      await api.deleteUser(deleteConfirmUser.id);
      setDeleteConfirmUser(null);
      loadData();
    } catch (e: any) {
      alert(e.message || 'Failed to delete user.');
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return <span className="badge badge-rose" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><Shield size={12} /> ADMIN</span>;
      case 'FACULTY':
        return <span className="badge badge-blue" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><Briefcase size={12} /> FACULTY</span>;
      case 'STUDENT':
        return <span className="badge badge-purple" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><GraduationCap size={12} /> STUDENT</span>;
      default:
        return <span className="badge">{role}</span>;
    }
  };

  const getStatusBadge = (status: UserAccountStatus) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '0.25rem 0.65rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '700' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
            ACTIVE
          </span>
        );
      case 'PENDING':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', padding: '0.25rem 0.65rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '700' }}>
            <Clock size={12} />
            PENDING APPROVAL
          </span>
        );
      case 'INACTIVE':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '0.25rem 0.65rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '700' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#64748b' }} />
            INACTIVE
          </span>
        );
      case 'REJECTED':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', padding: '0.25rem 0.65rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '700' }}>
            <XCircle size={12} />
            REJECTED
          </span>
        );
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top Header & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>
            User Authorization & Google Accounts
          </h1>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Add student & faculty accounts. Only accounts added with a verified Google email can authenticate via "Continue with Google".
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={handleOpenAddModal}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}
          >
            <UserPlus size={18} />
            Add User
          </button>
          <button
            onClick={loadData}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            title="Refresh Users"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Stats Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div
          onClick={() => setStatusFilter('ALL')}
          style={{
            background: '#ffffff',
            padding: '1.25rem',
            borderRadius: '16px',
            border: statusFilter === 'ALL' ? '2px solid var(--primary)' : '1px solid var(--border)',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Total Accounts</span>
            <Users size={20} color="var(--primary)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.5rem' }}>
            {stats.total_users}
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('ACTIVE')}
          style={{
            background: '#ffffff',
            padding: '1.25rem',
            borderRadius: '16px',
            border: statusFilter === 'ACTIVE' ? '2px solid #10b981' : '1px solid var(--border)',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Active Accounts</span>
            <UserCheck size={20} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#047857', marginTop: '0.5rem' }}>
            {stats.active_users}
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('PENDING')}
          style={{
            background: stats.pending_users > 0 ? '#fffbeb' : '#ffffff',
            padding: '1.25rem',
            borderRadius: '16px',
            border: statusFilter === 'PENDING' ? '2px solid #f59e0b' : '1px solid ' + (stats.pending_users > 0 ? '#fde68a' : 'var(--border)'),
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: stats.pending_users > 0 ? '#b45309' : 'var(--text-muted)' }}>Pending Activation</span>
            <Clock size={20} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: stats.pending_users > 0 ? '#b45309' : 'var(--text-main)', marginTop: '0.5rem' }}>
            {stats.pending_users}
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('INACTIVE')}
          style={{
            background: '#ffffff',
            padding: '1.25rem',
            borderRadius: '16px',
            border: statusFilter === 'INACTIVE' ? '2px solid #64748b' : '1px solid var(--border)',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Inactive Accounts</span>
            <UserX size={20} color="#64748b" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#475569', marginTop: '0.5rem' }}>
            {stats.inactive_users}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          background: '#ffffff',
          padding: '1rem 1.25rem',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Filter size={16} color="var(--text-muted)" />
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field"
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING">Pending Approval</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          {/* Role Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="input-field"
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
            >
              <option value="ALL">All Roles</option>
              <option value="STUDENT">Student</option>
              <option value="FACULTY">Faculty</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </div>
        </div>

        {/* Search Query */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', minWidth: '280px', flex: '1', maxWidth: '420px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <input
              type="text"
              placeholder="Search by name, Google email, College ID, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field"
              style={{ width: '100%', paddingLeft: '2.4rem' }}
            />
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          </div>
          <button type="submit" className="btn btn-secondary" style={{ padding: '0 1rem' }}>
            Search
          </button>
        </form>
      </div>

      {/* Users Table */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '0.9rem 1.25rem', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  User / Name
                </th>
                <th style={{ padding: '0.9rem 1.25rem', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Google Email
                </th>
                <th style={{ padding: '0.9rem 1.25rem', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Role
                </th>
                <th style={{ padding: '0.9rem 1.25rem', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  College ID
                </th>
                <th style={{ padding: '0.9rem 1.25rem', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Status
                </th>
                <th style={{ padding: '0.9rem 1.25rem', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Last Login
                </th>
                <th style={{ padding: '0.9rem 1.25rem', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem' }} />
                    <div>Loading accounts...</div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Users size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                    <div style={{ fontWeight: 700 }}>No accounts found</div>
                    <div style={{ fontSize: '0.85rem' }}>Try adjusting your filters or click "Add User" to add a new account.</div>
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const collegeId = u.college_id || u.student_profile?.register_number || u.faculty_profile?.staff_number || '—';
                  const initials = u.full_name
                    ? u.full_name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .substring(0, 2)
                        .toUpperCase()
                    : 'U';

                  return (
                    <tr
                      key={u.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#fafafa')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* Name & Avatar */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              background: u.role === 'ADMIN' ? '#ffe4e6' : u.role === 'FACULTY' ? '#dbeafe' : '#f3e8ff',
                              color: u.role === 'ADMIN' ? '#e11d48' : u.role === 'FACULTY' ? '#2563eb' : '#7e22ce',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '0.85rem',
                              flexShrink: 0
                            }}
                          >
                            {initials}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                              {u.full_name}
                            </div>
                            {u.mobile_number && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <Phone size={11} /> {u.mobile_number}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Google Email */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, color: '#1e293b', fontSize: '0.88rem' }}>
                          <Mail size={14} color="#ea580c" />
                          <span>{u.email}</span>
                        </div>
                        {u.google_sub && (
                          <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 600, marginTop: '2px' }}>
                            ✓ Google OAuth Bound
                          </div>
                        )}
                      </td>

                      {/* Role */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        {getRoleBadge(u.role)}
                      </td>

                      {/* College ID */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.85rem', color: '#334155' }}>
                          {collegeId}
                        </div>
                        {u.student_profile?.department && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {u.student_profile.department} (Yr {u.student_profile.year})
                          </div>
                        )}
                        {u.faculty_profile?.department && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {u.faculty_profile.department}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        {getStatusBadge(u.status)}
                      </td>

                      {/* Last Login */}
                      <td style={{ padding: '1rem 1.25rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {u.last_login
                          ? new Date(u.last_login).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : 'Never logged in'}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                          {/* Activate Button (if pending or inactive) */}
                          {u.status !== 'ACTIVE' && (
                            <button
                              onClick={() => handleDirectActivate(u.id)}
                              className="btn btn-primary"
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', fontWeight: 700, background: '#10b981', borderColor: '#10b981' }}
                              title="Activate User"
                            >
                              <Check size={13} /> Activate
                            </button>
                          )}

                          {/* Deactivate Button (if active and not admin) */}
                          {u.status === 'ACTIVE' && u.role !== 'ADMIN' && (
                            <button
                              onClick={() => handleToggleStatus(u.id, u.status)}
                              className="btn btn-secondary"
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', color: '#dc2626', borderColor: '#fca5a5' }}
                              title="Deactivate User"
                            >
                              Deactivate
                            </button>
                          )}

                          {/* Edit Button */}
                          <button
                            onClick={() => handleOpenEditModal(u)}
                            className="btn btn-secondary"
                            style={{ padding: '0.4rem', color: '#475569' }}
                            title="Edit User"
                          >
                            <Edit2 size={15} />
                          </button>

                          {/* Delete Button */}
                          {u.role !== 'ADMIN' && (
                            <button
                              onClick={() => setDeleteConfirmUser(u)}
                              className="btn btn-secondary"
                              style={{ padding: '0.4rem', color: '#ef4444', borderColor: '#fee2e2' }}
                              title="Delete User"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================== ADD USER MODAL ==================== */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '560px', width: '95%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Add Student / Faculty Account
                </h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Create authorized user profile with verified Google login identity.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {modalError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '0.75rem', color: '#b91c1c', fontSize: '0.82rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={16} />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleAddUserSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Full Name */}
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.35rem' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Viswanthan T"
                  value={addFullName}
                  onChange={(e) => setAddFullName(e.target.value)}
                  className="input-field"
                  style={{ width: '100%' }}
                />
              </div>

              {/* Google Email */}
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.35rem' }}>
                  Google Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. student@gmail.com"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  className="input-field"
                  style={{ width: '100%' }}
                />
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                  🔒 This Google email address will be the user's login identity for "Continue with Google".
                </div>
              </div>

              {/* Role & Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.35rem' }}>
                    Role *
                  </label>
                  <select
                    value={addRole}
                    onChange={(e) => setAddRole(e.target.value as 'STUDENT' | 'FACULTY')}
                    className="input-field"
                    style={{ width: '100%' }}
                  >
                    <option value="STUDENT">Student</option>
                    <option value="FACULTY">Faculty / Staff</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.35rem' }}>
                    Initial Status *
                  </label>
                  <select
                    value={addStatus}
                    onChange={(e) => setAddStatus(e.target.value as UserAccountStatus)}
                    className="input-field"
                    style={{ width: '100%' }}
                  >
                    <option value="ACTIVE">Active (Allowed Login)</option>
                    <option value="PENDING">Pending (Approval Required)</option>
                    <option value="INACTIVE">Inactive (Access Blocked)</option>
                  </select>
                </div>
              </div>

              {/* College ID & Mobile */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.35rem' }}>
                    {addRole === 'STUDENT' ? 'Register Number / College ID' : 'Staff Number / Faculty ID'}
                  </label>
                  <input
                    type="text"
                    placeholder={addRole === 'STUDENT' ? 'e.g. 912821104001 / SAEC12345' : 'e.g. SAEC-FAC-042'}
                    value={addCollegeId}
                    onChange={(e) => setAddCollegeId(e.target.value)}
                    className="input-field"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.35rem' }}>
                    Mobile Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={addMobile}
                    onChange={(e) => setAddMobile(e.target.value)}
                    className="input-field"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {/* Department & Year */}
              <div style={{ display: 'grid', gridTemplateColumns: addRole === 'STUDENT' ? '2fr 1fr' : '1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.35rem' }}>
                    Department
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Computer Science & Engineering"
                    value={addDepartment}
                    onChange={(e) => setAddDepartment(e.target.value)}
                    className="input-field"
                    style={{ width: '100%' }}
                  />
                </div>

                {addRole === 'STUDENT' && (
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.35rem' }}>
                      Year
                    </label>
                    <select
                      value={addYear}
                      onChange={(e) => setAddYear(Number(e.target.value))}
                      className="input-field"
                      style={{ width: '100%' }}
                    >
                      <option value={1}>1st Year</option>
                      <option value={2}>2nd Year</option>
                      <option value={3}>3rd Year</option>
                      <option value={4}>4th Year</option>
                    </select>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
                >
                  {isSubmitting ? <RefreshCw size={16} className="animate-spin" /> : <UserPlus size={16} />}
                  {isSubmitting ? 'Creating Account...' : 'Save & Authorize User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== EDIT USER MODAL ==================== */}
      {editingUser && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '560px', width: '95%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Edit User: {editingUser.full_name}
                </h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Update user profile, status, or authorized Google email.
                </p>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {modalError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '0.75rem', color: '#b91c1c', fontSize: '0.82rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={16} />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleEditUserSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Full Name */}
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.35rem' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="input-field"
                  style={{ width: '100%' }}
                />
              </div>

              {/* Google Email */}
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.35rem' }}>
                  Registered Google Email *
                </label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="input-field"
                  style={{ width: '100%' }}
                />
                {editEmail.trim().toLowerCase() !== editingUser.email.toLowerCase() && (
                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '0.5rem 0.75rem', marginTop: '0.4rem', fontSize: '0.75rem', color: '#b45309' }}>
                    ⚠️ Changing the registered Google email will update the user's login identity. The previous email ({editingUser.email}) will no longer be authorized.
                  </div>
                )}
              </div>

              {/* Role & Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.35rem' }}>
                    Role *
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    className="input-field"
                    style={{ width: '100%' }}
                  >
                    <option value="STUDENT">Student</option>
                    <option value="FACULTY">Faculty / Staff</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.35rem' }}>
                    Account Status *
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as UserAccountStatus)}
                    className="input-field"
                    style={{ width: '100%' }}
                  >
                    <option value="ACTIVE">Active (Allowed Login)</option>
                    <option value="PENDING">Pending (Approval Required)</option>
                    <option value="INACTIVE">Inactive (Access Blocked)</option>
                  </select>
                </div>
              </div>

              {/* College ID & Mobile */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.35rem' }}>
                    College ID / Register No.
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
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.35rem' }}>
                    Mobile Phone
                  </label>
                  <input
                    type="tel"
                    value={editMobile}
                    onChange={(e) => setEditMobile(e.target.value)}
                    className="input-field"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {/* Department & Year */}
              <div style={{ display: 'grid', gridTemplateColumns: editRole === 'STUDENT' ? '2fr 1fr' : '1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.35rem' }}>
                    Department
                  </label>
                  <input
                    type="text"
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    className="input-field"
                    style={{ width: '100%' }}
                  />
                </div>

                {editRole === 'STUDENT' && (
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.35rem' }}>
                      Year
                    </label>
                    <select
                      value={editYear}
                      onChange={(e) => setEditYear(Number(e.target.value))}
                      className="input-field"
                      style={{ width: '100%' }}
                    >
                      <option value={1}>1st Year</option>
                      <option value={2}>2nd Year</option>
                      <option value={3}>3rd Year</option>
                      <option value={4}>4th Year</option>
                    </select>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
                >
                  {isSubmitting ? <RefreshCw size={16} className="animate-spin" /> : <Check size={16} />}
                  {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== DELETE CONFIRMATION MODAL ==================== */}
      {deleteConfirmUser && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
                <Trash2 size={24} />
              </div>
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Delete User Account?
              </h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Are you sure you want to permanently delete <strong>{deleteConfirmUser.full_name}</strong> ({deleteConfirmUser.email})? This user will no longer be able to log in.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setDeleteConfirmUser(null)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                className="btn btn-primary"
                style={{ background: '#ef4444', borderColor: '#ef4444', fontWeight: 700 }}
              >
                Yes, Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
