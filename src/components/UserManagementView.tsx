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
  Key,
  Copy,
  Check,
  RefreshCw,
  UserCheck,
  UserX,
  ChevronRight,
  Filter
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
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activateModalUser, setActivateModalUser] = useState<User | null>(null);
  const [rejectModalUser, setRejectModalUser] = useState<User | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [customTempPassword, setCustomTempPassword] = useState('');
  const [activationSuccessData, setActivationSuccessData] = useState<{
    user: User;
    tempPassword: string;
  } | null>(null);

  const [modalError, setModalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Toggle Confirm Modal
  const [confirmToggleUser, setConfirmToggleUser] = useState<User | null>(null);

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

  const handleActivateSubmit = async () => {
    if (!activateModalUser) return;
    setIsSubmitting(true);
    setModalError('');
    try {
      const res = await api.activateUser(activateModalUser.id, customTempPassword.trim() || undefined);
      setActivateModalUser(null);
      setCustomTempPassword('');
      setActivationSuccessData({
        user: res.user,
        tempPassword: res.temporary_password
      });
      loadData();
    } catch (err: any) {
      setModalError(err.message || 'Failed to activate account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectModalUser) return;
    setIsSubmitting(true);
    setModalError('');
    try {
      await api.rejectUser(rejectModalUser.id, rejectionReason.trim());
      setRejectModalUser(null);
      setRejectionReason('');
      loadData();
    } catch (err: any) {
      setModalError(err.message || 'Failed to reject account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!confirmToggleUser) return;
    try {
      await api.toggleUserStatus(confirmToggleUser.id);
      setConfirmToggleUser(null);
      loadData();
    } catch (e: any) {
      alert(e.message || 'Could not update user status');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return <span className="badge badge-rose">🛡️ ADMIN</span>;
      case 'CASHIER':
        return <span className="badge badge-emerald">⚡ CASHIER</span>;
      case 'FACULTY':
        return <span className="badge badge-blue">👨‍🏫 FACULTY</span>;
      case 'STUDENT':
        return <span className="badge badge-purple">🎓 STUDENT</span>;
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
            User Management & Access Control
          </h1>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Authorize accounts, review pending registrations, generate temporary credentials, and manage institutional roles.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={loadData}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            title="Refresh Users"
          >
            <RefreshCw size={16} />
            Refresh User List
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
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Total Users</span>
            <Users size={20} color="var(--primary)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.5rem' }}>
            {stats.total_users}
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
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: stats.pending_users > 0 ? '#b45309' : 'var(--text-muted)' }}>Pending Approval</span>
            <Clock size={20} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: stats.pending_users > 0 ? '#b45309' : 'var(--text-main)', marginTop: '0.5rem' }}>
            {stats.pending_users}
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
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Inactive</span>
            <UserX size={20} color="#64748b" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#475569', marginTop: '0.5rem' }}>
            {stats.inactive_users}
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('REJECTED')}
          style={{
            background: '#ffffff',
            padding: '1.25rem',
            borderRadius: '16px',
            border: statusFilter === 'REJECTED' ? '2px solid #ef4444' : '1px solid var(--border)',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Rejected</span>
            <XCircle size={20} color="#ef4444" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#b91c1c', marginTop: '0.5rem' }}>
            {stats.rejected_users}
          </div>
        </div>
      </div>

      {/* Prominent Pending Notice Banner if pending users exist */}
      {stats.pending_users > 0 && statusFilter !== 'PENDING' && (
        <div
          style={{
            background: 'linear-gradient(90deg, #fff7ed 0%, #ffedd5 100%)',
            border: '1.5px solid #fed7aa',
            borderRadius: '16px',
            padding: '1rem 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#ea580c', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 800, color: '#9a3412', fontSize: '1rem' }}>
                {stats.pending_users} Registration{stats.pending_users > 1 ? 's' : ''} Awaiting Admin Approval
              </div>
              <div style={{ fontSize: '0.85rem', color: '#c2410c' }}>
                New students/faculty have registered and are waiting for account verification and temporary password generation.
              </div>
            </div>
          </div>
          <button
            onClick={() => setStatusFilter('PENDING')}
            className="btn btn-primary"
            style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem', fontWeight: 700 }}
          >
            Review Pending ({stats.pending_users})
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
          {[
            { id: 'ALL', label: 'All Users' },
            { id: 'PENDING', label: `Pending Approval (${stats.pending_users})` },
            { id: 'ACTIVE', label: `Active (${stats.active_users})` },
            { id: 'INACTIVE', label: `Inactive (${stats.inactive_users})` },
            { id: 'REJECTED', label: `Rejected (${stats.rejected_users})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              style={{
                background: statusFilter === tab.id ? 'var(--primary-light)' : 'transparent',
                color: statusFilter === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                border: statusFilter === tab.id ? '1px solid var(--primary-border)' : '1px solid transparent',
                borderRadius: '8px',
                padding: '0.45rem 0.9rem',
                fontSize: '0.85rem',
                fontWeight: statusFilter === tab.id ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Role Controls */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <form onSubmit={handleSearchSubmit} style={{ flex: 1, minWidth: '280px', position: 'relative' }}>
            <input
              type="text"
              placeholder="Search by name, email, register number, staff ID, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '2.5rem', width: '100%' }}
            />
            <Search size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={16} color="var(--text-muted)" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="input-field"
              style={{ width: 'auto', minWidth: '160px', padding: '0.5rem 0.85rem' }}
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">Administrators</option>
              <option value="CASHIER">Cashiers</option>
              <option value="FACULTY">Faculty / Staff</option>
              <option value="STUDENT">Students</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 0.75rem', color: 'var(--primary)' }} />
            Loading accounts database...
          </div>
        ) : users.length === 0 ? (
          <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Users size={40} style={{ margin: '0 auto 1rem', color: 'var(--text-dim)' }} />
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-main)' }}>No users found</div>
            <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Try adjusting your search query or status filter.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '0.85rem 1.25rem' }}>User & Contact</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Role</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Institutional ID</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Account Status</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Registered</th>
                  <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isPending = u.status === 'PENDING';
                  const isActive = u.status === 'ACTIVE' && u.is_active;
                  const isInactive = u.status === 'INACTIVE' || (!u.is_active && u.status !== 'REJECTED');
                  const isRejected = u.status === 'REJECTED';

                  return (
                    <tr
                      key={u.id}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        background: isPending ? '#fffdfa' : 'transparent',
                        transition: 'background 0.15s'
                      }}
                    >
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                          {u.full_name}
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          {u.email}
                        </div>
                        <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                          📞 {u.mobile_number}
                        </div>
                      </td>

                      <td style={{ padding: '1rem 1rem' }}>
                        {getRoleBadge(u.role)}
                      </td>

                      <td style={{ padding: '1rem 1rem', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                        {u.student_profile ? (
                          <div>
                            <span style={{ fontWeight: 600 }}>{u.student_profile.register_number}</span>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {u.student_profile.department} (Yr {u.student_profile.year})
                            </div>
                          </div>
                        ) : u.faculty_profile ? (
                          <div>
                            <span style={{ fontWeight: 600 }}>{u.faculty_profile.staff_number}</span>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {u.faculty_profile.department}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-dim)' }}>—</span>
                        )}
                      </td>

                      <td style={{ padding: '1rem 1rem' }}>
                        {getStatusBadge(u.status)}
                        {u.must_change_password && isActive && (
                          <div style={{ marginTop: '0.25rem', fontSize: '0.7rem', color: '#ea580c', fontWeight: 600 }}>
                            🔑 Temp Pwd Active
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '1rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {new Date(u.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>

                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
                          
                          {/* View Details */}
                          <button
                            onClick={() => setSelectedUser(u)}
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                            title="View Full Profile"
                          >
                            <Eye size={14} />
                            Details
                          </button>

                          {/* Actions for PENDING accounts */}
                          {isPending && (
                            <>
                              <button
                                onClick={() => {
                                  setActivateModalUser(u);
                                  setModalError('');
                                  setCustomTempPassword('');
                                }}
                                className="btn btn-primary"
                                style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', fontWeight: 700 }}
                              >
                                <CheckCircle2 size={14} />
                                Activate
                              </button>
                              <button
                                onClick={() => {
                                  setRejectModalUser(u);
                                  setRejectionReason('');
                                  setModalError('');
                                }}
                                style={{
                                  background: '#fee2e2',
                                  color: '#b91c1c',
                                  border: '1px solid #fca5a5',
                                  padding: '0.35rem 0.65rem',
                                  borderRadius: '8px',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  cursor: 'pointer'
                                }}
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {/* Actions for ACTIVE accounts */}
                          {isActive && u.role !== 'ADMIN' && (
                            <button
                              onClick={() => setConfirmToggleUser(u)}
                              style={{
                                background: '#f8fafc',
                                color: '#475569',
                                border: '1px solid #cbd5e1',
                                padding: '0.35rem 0.65rem',
                                borderRadius: '8px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              Deactivate
                            </button>
                          )}

                          {/* Actions for INACTIVE accounts */}
                          {isInactive && (
                            <button
                              onClick={() => setConfirmToggleUser(u)}
                              style={{
                                background: '#ecfdf5',
                                color: '#047857',
                                border: '1px solid #a7f3d0',
                                padding: '0.35rem 0.65rem',
                                borderRadius: '8px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              Reactivate
                            </button>
                          )}

                          {/* Actions for REJECTED accounts */}
                          {isRejected && (
                            <button
                              onClick={() => {
                                setActivateModalUser(u);
                                setModalError('');
                                setCustomTempPassword('');
                              }}
                              className="btn btn-secondary"
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                            >
                              Re-review & Activate
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

      {/* MODAL 1: Account Activation Confirmation Modal */}
      {activateModalUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '20px', maxWidth: '520px', width: '100%', padding: '2rem', boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#ecfdf5', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserCheck size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Activate Account & Issue Credentials
                </h3>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Authorizing {activateModalUser.full_name}
                </div>
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '1.25rem', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div><strong>Email:</strong> {activateModalUser.email}</div>
              <div><strong>Role:</strong> {activateModalUser.role}</div>
              <div><strong>Mobile:</strong> {activateModalUser.mobile_number}</div>
              {activateModalUser.student_profile && (
                <div><strong>Reg Number:</strong> {activateModalUser.student_profile.register_number} ({activateModalUser.student_profile.department})</div>
              )}
              {activateModalUser.faculty_profile && (
                <div><strong>Staff ID:</strong> {activateModalUser.faculty_profile.staff_number} ({activateModalUser.faculty_profile.department})</div>
              )}
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              Activating this account will allow the user to log in. A secure temporary password will be assigned, and the user will be <strong>required to create their own new password</strong> on their first login.
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                Custom Temporary Password (Optional)
              </label>
              <input
                type="text"
                placeholder="Leave blank for auto-generated (e.g. SaecCafe@8291)"
                value={customTempPassword}
                onChange={(e) => setCustomTempPassword(e.target.value)}
                className="input-field"
                style={{ width: '100%' }}
              />
            </div>

            {modalError && (
              <div style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem' }}>
                {modalError}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setActivateModalUser(null)}
                className="btn btn-secondary"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleActivateSubmit}
                className="btn btn-primary"
                disabled={isSubmitting}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}
              >
                {isSubmitting ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                {isSubmitting ? 'Activating...' : 'Confirm & Activate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Activation Success & Temporary Password Display Modal */}
      {activationSuccessData && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '20px', maxWidth: '480px', width: '100%', padding: '2rem', boxShadow: '0 25px 60px rgba(0,0,0,0.3)', textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#ecfdf5', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <CheckCircle2 size={32} />
            </div>

            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Account Activated Successfully!
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              The account for <strong>{activationSuccessData.user.full_name}</strong> is now active. Share this temporary password with the user.
            </p>

            <div style={{ background: '#f8fafc', border: '1.5px dashed var(--primary-border)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                Temporary Login Password
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.05em', fontFamily: 'monospace' }}>
                {activationSuccessData.tempPassword}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                User will be required to change this upon their first login.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => {
                  const portalUrl = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'https://saec-cafe.vercel.app';
                  copyToClipboard(`SAEC CAFÉ Login Credentials\nEmail: ${activationSuccessData.user.email}\nTemporary Password: ${activationSuccessData.tempPassword}\nPortal: ${portalUrl}/`);
                }}
                className="btn btn-secondary"
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy Credentials'}
              </button>
              <button
                onClick={() => setActivationSuccessData(null)}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Rejection Modal */}
      {rejectModalUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '20px', maxWidth: '480px', width: '100%', padding: '2rem', boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#fee2e2', color: '#b91c1c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <XCircle size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#991b1b' }}>
                  Reject Registration
                </h3>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {rejectModalUser.full_name} ({rejectModalUser.email})
                </div>
              </div>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              Are you sure you want to reject this registration? The user will not be permitted to log in.
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                Rejection Reason (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Invalid student register number / Unverified institutional email"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="input-field"
                style={{ width: '100%', resize: 'none' }}
              />
            </div>

            {modalError && (
              <div style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem' }}>
                {modalError}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setRejectModalUser(null)}
                className="btn btn-secondary"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectSubmit}
                style={{
                  background: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.6rem 1.25rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: User Details Modal */}
      {selectedUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '20px', maxWidth: '540px', width: '100%', padding: '2rem', boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    {selectedUser.full_name}
                  </h3>
                  {getRoleBadge(selectedUser.role)}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {selectedUser.email}
                </div>
              </div>
              {getStatusBadge(selectedUser.status)}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Mobile Phone</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{selectedUser.mobile_number}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Registered Date</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                  {new Date(selectedUser.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {selectedUser.student_profile && (
                <>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Student Register No</span>
                    <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{selectedUser.student_profile.register_number}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Department & Year</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{selectedUser.student_profile.department} (Year {selectedUser.student_profile.year})</span>
                  </div>
                </>
              )}

              {selectedUser.faculty_profile && (
                <>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Faculty Staff ID</span>
                    <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{selectedUser.faculty_profile.staff_number}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Department</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{selectedUser.faculty_profile.department}</span>
                  </div>
                </>
              )}

              {selectedUser.activated_at && (
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Activated On</span>
                  <span style={{ fontWeight: 600, color: '#047857' }}>
                    {new Date(selectedUser.activated_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              )}

              {selectedUser.activated_by_name && (
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Activated By</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{selectedUser.activated_by_name}</span>
                </div>
              )}

              {selectedUser.rejection_reason && (
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: '#b91c1c', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Rejection Reason</span>
                  <span style={{ color: '#991b1b', fontWeight: 600 }}>{selectedUser.rejection_reason}</span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => setSelectedUser(null)}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Toggle Status Confirmation Modal */}
      {confirmToggleUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '20px', maxWidth: '440px', width: '100%', padding: '2rem', boxShadow: '0 25px 60px rgba(0,0,0,0.3)', textAlign: 'center' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#fff7ed', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <AlertTriangle size={26} />
            </div>

            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {confirmToggleUser.is_active ? 'Deactivate Account?' : 'Reactivate Account?'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Are you sure you want to {confirmToggleUser.is_active ? 'deactivate' : 'reactivate'} <strong>{confirmToggleUser.full_name}</strong> ({confirmToggleUser.email})?
            </p>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setConfirmToggleUser(null)}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                onClick={handleToggleStatus}
                className="btn btn-primary"
                style={{ flex: 1, fontWeight: 700 }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
