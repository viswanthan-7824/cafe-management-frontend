import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Search, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';
import type { User, UserRole } from '../types';


export const UserManagementView: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // New Cashier Modal
  const [isCashierModalOpen, setIsCashierModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [modalError, setModalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toggle Confirm Modal
  const [confirmToggleUser, setConfirmToggleUser] = useState<User | null>(null);

  useEffect(() => {
    loadUsers();
  }, [roleFilter]);

  async function loadUsers() {
    setLoading(true);
    try {
      const data = await api.getUsers(roleFilter, searchQuery);
      setUsers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadUsers();
  };

  const handleCreateCashier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !mobileNumber.trim() || !password.trim()) {
      setModalError('Please fill in all cashier account fields');
      return;
    }
    if (password.length < 6) {
      setModalError('Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);
    setModalError('');

    try {
      await api.createCashier({
        full_name: fullName.trim(),
        email: email.trim(),
        mobile_number: mobileNumber.trim(),
        password: password.trim()
      });
      setIsCashierModalOpen(false);
      setFullName('');
      setEmail('');
      setMobileNumber('');
      setPassword('');
      loadUsers();
    } catch (err: any) {
      setModalError(err.message || 'Failed to create cashier account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!confirmToggleUser) return;
    try {
      await api.toggleUserStatus(confirmToggleUser.id);
      setConfirmToggleUser(null);
      loadUsers();
    } catch (e: any) {
      alert(e.message || 'Could not update user status');
    }
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
        return <span className="badge badge-secondary">{role}</span>;
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
      <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Users size={22} color="#ea580c" /> User & Cashier Staff Management
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.2rem', fontWeight: 500 }}>
            Administer institutional accounts for Syed Ammal Engineering College. Create counter cashiers and monitor active student and faculty accounts.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsCashierModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <UserPlus size={16} /> Register New Cashier
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search by name, college email, or mobile..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.75rem 0.65rem 2.4rem',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                fontSize: '0.875rem',
                fontWeight: 600
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {['ALL', 'ADMIN', 'CASHIER', 'STUDENT', 'FACULTY'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRoleFilter(r)}
                className={`btn ${roleFilter === r ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.45rem 0.8rem', fontSize: '0.78rem', borderRadius: '8px' }}
              >
                {r}
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* Users Table */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="custom-table">
          <thead>
            <tr>
              <th>User / Name</th>
              <th>College Email</th>
              <th>Mobile</th>
              <th>Role</th>
              <th>Department / Identifier</th>
              <th>Account Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                  Loading user records...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                  No user records found.
                </td>
              </tr>
            ) : (
              users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ fontWeight: 800, color: '#1e293b' }}>{u.full_name}</div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>ID: #{u.id}</div>
                  </td>
                  <td style={{ color: '#1e293b', fontWeight: 600 }}>{u.email}</td>
                  <td style={{ color: '#64748b', fontWeight: 600 }}>{u.mobile_number || '—'}</td>
                  <td>{getRoleBadge(u.role)}</td>
                  <td>
                    {u.student_profile ? (
                      <div style={{ fontSize: '0.78rem' }}>
                        <div style={{ fontWeight: 800, color: '#1e293b' }}>Reg: {u.student_profile.register_number}</div>
                        <div style={{ color: '#64748b' }}>{u.student_profile.department} (Yr {u.student_profile.year})</div>
                      </div>
                    ) : u.faculty_profile ? (
                      <div style={{ fontSize: '0.78rem' }}>
                        <div style={{ fontWeight: 800, color: '#1e293b' }}>Staff: {u.faculty_profile.staff_number}</div>
                        <div style={{ color: '#64748b' }}>{u.faculty_profile.department}</div>
                      </div>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>Canteen Staff</span>
                    )}
                  </td>
                  <td>
                    <span style={{
                      background: u.is_active ? '#ecfdf5' : '#fef2f2',
                      color: u.is_active ? '#047857' : '#b91c1c',
                      border: `1px solid ${u.is_active ? '#a7f3d0' : '#fecaca'}`,
                      padding: '0.25rem 0.65rem',
                      borderRadius: '9999px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      {u.is_active ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                      {u.is_active ? 'ACTIVE' : 'DEACTIVATED'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {u.role !== 'ADMIN' && (
                      <button
                        onClick={() => setConfirmToggleUser(u)}
                        className={`btn ${u.is_active ? 'btn-rose' : 'btn-emerald'}`}
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                      >
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Register Cashier Modal */}
      {isCashierModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ maxWidth: '480px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1e293b', marginBottom: '0.5rem' }}>
              Register New Counter Cashier
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1.25rem' }}>
              Create cashier credentials to access the SAEC CAFÉ POS Counter and Order Processing interface.
            </p>

            {modalError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '0.65rem 0.9rem', color: '#b91c1c', fontSize: '0.8rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertTriangle size={16} /> {modalError}
              </div>
            )}

            <form onSubmit={handleCreateCashier} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '0.3rem' }}>Staff Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Cashier"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontWeight: 600 }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '0.3rem' }}>Staff College Email *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. cashier2@saec.ac.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontWeight: 600 }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '0.3rem' }}>Contact Mobile Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontWeight: 600 }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '0.3rem' }}>Initial Password (min 6 chars) *</label>
                <input
                  type="password"
                  required
                  placeholder="Enter strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontWeight: 600 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsCashierModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Registering Cashier...' : 'Create Cashier Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Toggle Status Modal */}
      {confirmToggleUser && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ maxWidth: '440px', textAlign: 'center' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: confirmToggleUser.is_active ? '#fef2f2' : '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
              <AlertTriangle size={26} color={confirmToggleUser.is_active ? '#ef4444' : '#047857'} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#1e293b', margin: 0 }}>
              {confirmToggleUser.is_active ? 'Deactivate User Account?' : 'Reactivate User Account?'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem', lineHeight: '1.4' }}>
              {confirmToggleUser.is_active
                ? `Are you sure you want to deactivate ${confirmToggleUser.full_name} (${confirmToggleUser.email})? They will be blocked from logging into SAEC CAFÉ.`
                : `Are you sure you want to reactivate ${confirmToggleUser.full_name} (${confirmToggleUser.email})?`}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setConfirmToggleUser(null)}>
                Cancel
              </button>
              <button
                className={`btn ${confirmToggleUser.is_active ? 'btn-rose' : 'btn-emerald'}`}
                style={{ flex: 1 }}
                onClick={handleToggleStatus}
              >
                Confirm {confirmToggleUser.is_active ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
