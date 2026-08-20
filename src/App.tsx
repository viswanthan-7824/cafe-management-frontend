import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { FoodManagementView } from './components/FoodManagementView';
import { UserManagementView } from './components/UserManagementView';
import { OrderManagementView } from './components/OrderManagementView';
import { SystemSettingsView } from './components/SystemSettingsView';
import { CalendarManager } from './components/CalendarManager';
import { PosView } from './components/PosView';
import { FcfsQueueView } from './components/FcfsQueueView';
import { ContactOrdersView } from './components/ContactOrdersView';
import { PaymentSupportView } from './components/PaymentSupportView';
import { InventoryView } from './components/InventoryView';
import { AnalyticsView } from './components/AnalyticsView';
import { api, setAuthToken } from './services/api';
import type { User } from './types';
import {
  LogIn,
  Lock,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  Mail,
  KeyRound,
  ArrowLeft,
  RefreshCw,
  ShieldCheck,
  Store
} from 'lucide-react';

type AuthViewMode =
  | 'LOGIN'
  | 'FORGOT_PASSWORD'
  | 'RESET_LINK_SENT'
  | 'RESET_PASSWORD';

type WebSelectedRole = 'ADMIN' | 'CASHIER';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [authView, setAuthView] = useState<AuthViewMode>('LOGIN');
  const [selectedRole, setSelectedRole] = useState<WebSelectedRole>('ADMIN');

  const [businessStatus, setBusinessStatus] = useState<any>({
    is_ordering_open: true,
    message: '🟢 ORDERING OPEN',
    status: 'WORKING_DAY',
    opening_time: '10:00',
    closing_time: '15:30'
  });

  // Login Form State
  const [email, setEmail] = useState('admin@saec.ac.in');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot / Reset Password State
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [authSuccessMessage, setAuthSuccessMessage] = useState('');

  // First Login / Change Temporary Password State
  const [currentTempPassword, setCurrentTempPassword] = useState('');
  const [mandatoryNewPassword, setMandatoryNewPassword] = useState('');
  const [mandatoryConfirmPassword, setMandatoryConfirmPassword] = useState('');
  const [showMandatoryPass, setShowMandatoryPass] = useState(false);
  const [tempPassError, setTempPassError] = useState('');

  // Logout confirmation modal
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  async function loadStatus() {
    try {
      const st = await api.getCurrentBusinessDay();
      setBusinessStatus(st);
    } catch (e) {
      console.error(e);
    }
  }

  // Auto-fill default credentials based on selected role tab for testing convenience
  const handleSelectRoleTab = (role: WebSelectedRole) => {
    setSelectedRole(role);
    setLoginError('');
    setAuthSuccessMessage('');
    if (role === 'ADMIN') {
      setEmail('admin@saec.ac.in');
      setPassword('admin123');
    } else {
      setEmail('cashier@saec.ac.in');
      setPassword('cashier123');
    }
  };

  const handleLogin = async (eEmail?: string, ePassword?: string) => {
    setIsSubmitting(true);
    setLoginError('');
    try {
      const loginEmail = eEmail || email;
      const loginPass = ePassword || password;
      const { user: u } = await api.login(loginEmail, loginPass);

      // Enforce Web Role Gate: Only ADMIN and CASHIER are permitted on Web Portal
      if (u.role !== 'ADMIN' && u.role !== 'CASHIER') {
        setAuthToken(null);
        setUser(null);
        setLoginError(
          '403 Forbidden: Web access is available only to authorized Admin and Cashier accounts. Student and Faculty accounts must use the SAEC CAFÉ Mobile Application.'
        );
        return;
      }

      // Verify that user logged into matching selected role or authorized web role
      setUser(u);
      setLoginError('');

      // Role-based landing page routing:
      // ADMIN -> Admin Dashboard
      // CASHIER -> Cashier POS Counter
      if (u.role === 'CASHIER') {
        setActiveTab('pos');
      } else {
        setActiveTab('dashboard');
      }
    } catch (e: any) {
      setLoginError(e.message || 'Incorrect email or password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMandatoryPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mandatoryNewPassword !== mandatoryConfirmPassword) {
      setTempPassError('New passwords do not match.');
      return;
    }
    if (mandatoryNewPassword.length < 6) {
      setTempPassError('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    setTempPassError('');
    try {
      await api.changePassword({
        current_password: currentTempPassword,
        new_password: mandatoryNewPassword,
        confirm_password: mandatoryConfirmPassword
      });

      if (user) {
        setUser({ ...user, must_change_password: false });
      }
      setMandatoryNewPassword('');
      setMandatoryConfirmPassword('');
      setCurrentTempPassword('');
    } catch (err: any) {
      setTempPassError(err.message || 'Failed to update password. Please verify current password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;

    setIsSubmitting(true);
    setLoginError('');
    try {
      const res = await api.requestPasswordReset(forgotEmail.trim());
      if (res.reset_token) {
        setResetToken(res.reset_token);
      }
      setAuthView('RESET_LINK_SENT');
    } catch (err: any) {
      setLoginError(err.message || 'Unable to process password reset request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setLoginError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setLoginError('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    setLoginError('');
    try {
      await api.confirmPasswordReset({
        token: resetToken.trim(),
        new_password: newPassword,
        confirm_password: confirmPassword
      });
      setAuthSuccessMessage('Password reset successfully. You can now sign in with your new password.');
      setAuthView('LOGIN');
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setLoginError(err.message || 'Failed to reset password. Token may be invalid or expired.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    setAuthToken(null);
    setUser(null);
    setEmail('admin@saec.ac.in');
    setPassword('admin123');
    setSelectedRole('ADMIN');
    setAuthView('LOGIN');
    setShowLogoutConfirm(false);
    setActiveTab('dashboard');
  };

  // 1. MANDATORY FIRST LOGIN / CHANGE TEMPORARY PASSWORD SCREEN
  if (user && user.must_change_password) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0f172a 0%, #431407 50%, #0f172a 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem'
        }}
      >
        <div
          style={{
            maxWidth: '480px',
            width: '100%',
            background: '#ffffff',
            borderRadius: '24px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
            padding: '2.75rem 2.25rem'
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: '#fff7ed',
                color: 'var(--primary)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}
            >
              <KeyRound size={28} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.4rem' }}>
              Create Your New Password
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
              You are currently using an administrator-issued temporary password. Please choose a new, permanent password to secure your account.
            </p>
          </div>

          {tempPassError && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '10px',
                padding: '0.75rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                color: '#b91c1c',
                fontSize: '0.82rem',
                marginBottom: '1.25rem',
                fontWeight: 600
              }}
            >
              <AlertCircle size={18} />
              <span>{tempPassError}</span>
            </div>
          )}

          <form onSubmit={handleMandatoryPasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.4rem' }}>
                Current Temporary Password *
              </label>
              <input
                type="password"
                value={currentTempPassword}
                onChange={(e) => setCurrentTempPassword(e.target.value)}
                required
                placeholder="Enter the password provided to you"
                className="input-field"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.4rem' }}>
                New Password *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showMandatoryPass ? 'text' : 'password'}
                  value={mandatoryNewPassword}
                  onChange={(e) => setMandatoryNewPassword(e.target.value)}
                  required
                  placeholder="Minimum 6 characters"
                  className="input-field"
                  style={{ width: '100%', paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowMandatoryPass(!showMandatoryPass)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-dim)',
                    cursor: 'pointer'
                  }}
                >
                  {showMandatoryPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.4rem' }}>
                Confirm New Password *
              </label>
              <input
                type="password"
                value={mandatoryConfirmPassword}
                onChange={(e) => setMandatoryConfirmPassword(e.target.value)}
                required
                placeholder="Re-enter your new password"
                className="input-field"
                style={{ width: '100%' }}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.9rem', fontSize: '0.95rem', fontWeight: 700, marginTop: '0.5rem' }}
            >
              {isSubmitting ? 'Updating Password...' : 'Save Password & Continue'}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <button
              onClick={handleLogout}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.82rem', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Cancel & Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. UN-AUTHENTICATED WEB PORTAL (ADMIN & CASHIER LOGIN ONLY)
  if (!user) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0f172a 0%, #431407 50%, #0f172a 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem'
        }}
      >
        <div
          style={{
            maxWidth: '480px',
            width: '100%',
            background: '#ffffff',
            borderRadius: '24px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
            overflow: 'hidden',
            padding: '2.75rem 2.25rem'
          }}
        >
          {/* Header Branding */}
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.85rem' }}>
              <img
                src="/saec_cafe_logo.jpg"
                alt="SAEC CAFÉ Logo"
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  border: '3px solid #ea580c',
                  boxShadow: '0 6px 18px rgba(234, 88, 12, 0.25)',
                  objectFit: 'cover'
                }}
              />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#1e293b', margin: 0, letterSpacing: '-0.02em' }}>
              SAEC <span style={{ color: '#ea580c' }}>CAFÉ</span>
            </h1>
            <p style={{ fontSize: '0.78rem', color: '#ea580c', fontWeight: 800, margin: '0.25rem 0 0 0', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Management Portal
            </p>
          </div>

          {/* Role Selection Tabs: Admin Login vs Cashier Login */}
          {authView === 'LOGIN' && (
            <div
              style={{
                display: 'flex',
                background: '#f1f5f9',
                borderRadius: '12px',
                padding: '4px',
                marginBottom: '1.5rem'
              }}
            >
              <button
                type="button"
                onClick={() => handleSelectRoleTab('ADMIN')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.65rem 0.5rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: selectedRole === 'ADMIN' ? '#ffffff' : 'transparent',
                  color: selectedRole === 'ADMIN' ? '#ea580c' : '#64748b',
                  fontWeight: selectedRole === 'ADMIN' ? 800 : 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  boxShadow: selectedRole === 'ADMIN' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <ShieldCheck size={16} />
                Admin Login
              </button>
              <button
                type="button"
                onClick={() => handleSelectRoleTab('CASHIER')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.65rem 0.5rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: selectedRole === 'CASHIER' ? '#ffffff' : 'transparent',
                  color: selectedRole === 'CASHIER' ? '#ea580c' : '#64748b',
                  fontWeight: selectedRole === 'CASHIER' ? 800 : 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  boxShadow: selectedRole === 'CASHIER' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <Store size={16} />
                Cashier Login
              </button>
            </div>
          )}

          {/* Success Message Banner */}
          {authSuccessMessage && (
            <div
              style={{
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: '10px',
                padding: '0.75rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                color: '#047857',
                fontSize: '0.82rem',
                marginBottom: '1.25rem',
                fontWeight: 600
              }}
            >
              <CheckCircle2 size={18} />
              <span>{authSuccessMessage}</span>
            </div>
          )}

          {/* Error Message Banner */}
          {loginError && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '10px',
                padding: '0.75rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                color: '#b91c1c',
                fontSize: '0.82rem',
                marginBottom: '1.25rem',
                fontWeight: 600
              }}
            >
              <AlertCircle size={18} />
              <span>{loginError}</span>
            </div>
          )}

          {/* VIEW: LOGIN */}
          {authView === 'LOGIN' && (
            <>
              <p style={{ fontSize: '0.85rem', color: '#64748b', textAlign: 'center', margin: '-0.5rem 0 1.5rem' }}>
                Sign in to access the {selectedRole === 'ADMIN' ? 'Administrator Central' : 'POS Cashier Counter'}
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleLogin();
                }}
                style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}
              >
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.4rem' }}>
                    {selectedRole === 'ADMIN' ? 'Admin Email Address' : 'Cashier Staff Email'}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@saec.ac.in"
                    className="input-field"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthView('FORGOT_PASSWORD');
                        setLoginError('');
                        setAuthSuccessMessage('');
                      }}
                      style={{ background: 'none', border: 'none', color: '#ea580c', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Enter your password"
                      className="input-field"
                      style={{ width: '100%', paddingRight: '2.5rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer'
                      }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '0.9rem',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    marginTop: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {isSubmitting ? <RefreshCw size={18} className="animate-spin" /> : <LogIn size={18} />}
                  {isSubmitting ? 'Verifying Credentials...' : `Sign In as ${selectedRole === 'ADMIN' ? 'Admin' : 'Cashier'}`}
                </button>
              </form>

              <div
                style={{
                  marginTop: '1.75rem',
                  padding: '0.85rem 1rem',
                  background: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.78rem',
                  color: '#64748b'
                }}
              >
                <div style={{ fontWeight: 800, color: '#1e293b', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Lock size={14} color="#ea580c" /> Staff Portal Only
                </div>
                Student and Faculty registration and ordering are available exclusively on the SAEC CAFÉ Mobile Application.
              </div>
            </>
          )}

          {/* VIEW: FORGOT PASSWORD */}
          {authView === 'FORGOT_PASSWORD' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', margin: '0 0 0.35rem' }}>
                  Staff Password Recovery
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
                  Enter your registered institutional staff email address to receive a secure password reset link.
                </p>
              </div>

              <form onSubmit={handleForgotPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.4rem' }}>
                    Staff Email Address
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    placeholder="name@saec.ac.in"
                    className="input-field"
                    style={{ width: '100%' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.9rem', fontSize: '0.95rem', fontWeight: 700 }}
                >
                  {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuthView('LOGIN');
                    setLoginError('');
                  }}
                  className="btn btn-secondary"
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  <ArrowLeft size={16} /> Back to Login
                </button>
              </form>
            </>
          )}

          {/* VIEW: RESET LINK SENT */}
          {authView === 'RESET_LINK_SENT' && (
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: '#ecfdf5',
                  color: '#047857',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem'
                }}
              >
                <Mail size={28} />
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1e293b', margin: '0 0 0.5rem' }}>
                Check Your Email
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5, marginBottom: '1.5rem' }}>
                If an account exists for <strong>{forgotEmail}</strong>, a password reset link and verification token have been issued.
              </p>

              {resetToken && (
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px dashed var(--primary-border)', marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Reset Token (Simulation)</div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)', fontSize: '0.9rem' }}>{resetToken}</div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button
                  onClick={() => setAuthView('RESET_PASSWORD')}
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                >
                  Enter New Password
                </button>
                <button
                  onClick={() => setAuthView('LOGIN')}
                  className="btn btn-secondary"
                  style={{ width: '100%' }}
                >
                  Back to Login
                </button>
              </div>
            </div>
          )}

          {/* VIEW: RESET PASSWORD FORM */}
          {authView === 'RESET_PASSWORD' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', margin: '0 0 0.35rem' }}>
                  Reset Staff Password
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                  Enter your reset token and new secure password.
                </p>
              </div>

              <form onSubmit={handleResetPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.4rem' }}>
                    Reset Token *
                  </label>
                  <input
                    type="text"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    required
                    placeholder="Enter reset token"
                    className="input-field"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.4rem' }}>
                    New Password *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      placeholder="Minimum 6 characters"
                      className="input-field"
                      style={{ width: '100%', paddingRight: '2.5rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer'
                      }}
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.4rem' }}>
                    Confirm New Password *
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Re-enter new password"
                    className="input-field"
                    style={{ width: '100%' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.9rem', fontSize: '0.95rem', fontWeight: 700 }}
                >
                  {isSubmitting ? 'Resetting...' : 'Reset Password'}
                </button>

                <button
                  type="button"
                  onClick={() => setAuthView('LOGIN')}
                  className="btn btn-secondary"
                  style={{ width: '100%' }}
                >
                  Cancel
                </button>
              </form>
            </>
          )}

          <div style={{ marginTop: '1.5rem', fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center' }}>
            Syed Ammal Engineering College • C++ Cafe Canteen Portal
          </div>
        </div>
      </div>
    );
  }

  // 3. AUTHENTICATED DASHBOARD (ADMIN & CASHIER ROLE SEPARATION)
  const isTabAllowed = (tab: string, role: string) => {
    switch (role) {
      case 'ADMIN':
        return true;
      case 'CASHIER':
        // Cashier has access strictly to POS Counter, Orders, FCFS Board, and Contact orders
        return ['pos', 'orders', 'fcfs', 'contact'].includes(tab);
      default:
        return false;
    }
  };

  // Prevent Cashier from accessing Admin-only tabs
  const safeTab = isTabAllowed(activeTab, user.role)
    ? activeTab
    : user.role === 'CASHIER'
    ? 'pos'
    : 'dashboard';

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#1e293b' }}>
      <Navbar
        user={user}
        businessStatus={businessStatus}
        onLogout={() => setShowLogoutConfirm(true)}
        onSwitchRole={(e, p) => handleLogin(e, p)}
      />

      <div style={{ display: 'flex' }}>
        <Sidebar
          user={user}
          activeTab={safeTab}
          setActiveTab={(tab) => {
            if (isTabAllowed(tab, user.role)) {
              setActiveTab(tab);
            } else if (user.role === 'CASHIER') {
              alert('Access Denied: This management module is restricted to Administrator accounts.');
            }
          }}
          pendingTicketsCount={1}
          pendingContactCount={1}
        />

        <main style={{ flex: 1, padding: '1.75rem 2rem', overflowX: 'hidden' }}>
          {safeTab === 'dashboard' && <DashboardView />}
          {safeTab === 'food' && <FoodManagementView />}
          {safeTab === 'inventory' && <InventoryView />}
          {safeTab === 'orders' && <OrderManagementView userRole={user.role} />}
          {safeTab === 'pos' && <PosView />}
          {safeTab === 'fcfs' && <FcfsQueueView />}
          {safeTab === 'contact' && <ContactOrdersView />}
          {safeTab === 'users' && <UserManagementView />}
          {safeTab === 'calendar' && <CalendarManager />}
          {safeTab === 'payment-support' && <PaymentSupportView />}
          {safeTab === 'analytics' && <AnalyticsView />}
          {safeTab === 'settings' && <SystemSettingsView />}
        </main>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              maxWidth: '400px',
              width: '100%',
              padding: '2rem',
              boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: '#fff7ed',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem'
              }}
            >
              <LogIn size={26} style={{ transform: 'rotate(180deg)' }} />
            </div>

            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Confirm Sign Out
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Are you sure you want to log out of the SAEC CAFÉ Management Portal?
            </p>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="btn btn-primary"
                style={{ flex: 1, fontWeight: 700 }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
