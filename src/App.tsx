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
import { StudentOrderingView } from './components/StudentOrderingView';
import { api, setAuthToken } from './services/api';
import type { User } from './types';
import {
  LogIn,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  Mail,
  KeyRound,
  ArrowLeft,
  RefreshCw,
  GraduationCap,
  Briefcase,
  UserPlus
} from 'lucide-react';

type AuthViewMode =
  | 'LOGIN'
  | 'REGISTER'
  | 'REGISTRATION_SUCCESS'
  | 'FORGOT_PASSWORD'
  | 'RESET_LINK_SENT'
  | 'RESET_PASSWORD';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [authView, setAuthView] = useState<AuthViewMode>('LOGIN');

  const [businessStatus, setBusinessStatus] = useState<any>({
    is_ordering_open: true,
    message: '🟢 SAEC CAFÉ • Ordering Open (10:00 AM – 3:30 PM)',
    status: 'WORKING_DAY',
    opening_time: '10:00',
    closing_time: '15:30'
  });

  // Login Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Registration Form State
  const [regRole, setRegRole] = useState<'STUDENT' | 'FACULTY'>('STUDENT');
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regRegisterNumber, setRegRegisterNumber] = useState('');
  const [regStaffNumber, setRegStaffNumber] = useState('');
  const [regDepartment, setRegDepartment] = useState('Computer Science & Engineering');
  const [regYear, setRegYear] = useState<number>(1);
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [registrationMessage, setRegistrationMessage] = useState('');

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

  const handleLogin = async (eEmail?: string, ePassword?: string) => {
    setIsSubmitting(true);
    setLoginError('');
    try {
      const loginEmail = eEmail || email;
      const loginPass = ePassword || password;
      const { user: u } = await api.login(loginEmail, loginPass);

      setUser(u);
      setLoginError('');

      // Role-based landing page routing:
      // ADMIN -> Admin Overview Dashboard
      // STUDENT / FACULTY -> Student/Faculty Ordering Interface
      if (u.role === 'ADMIN' || (u.role as string) === 'CASHIER') {
        setActiveTab('dashboard');
      } else {
        setActiveTab('menu');
      }
    } catch (e: any) {
      setLoginError(e.message || 'Incorrect email or password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regPassword !== regConfirmPassword) {
      setLoginError('Passwords do not match.');
      return;
    }
    if (regPassword.length < 6) {
      setLoginError('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    setLoginError('');

    try {
      if (regRole === 'STUDENT') {
        if (!regRegisterNumber.trim()) {
          setLoginError('Please enter your Student Register Number.');
          setIsSubmitting(false);
          return;
        }
        await api.registerStudent({
          full_name: regFullName.trim(),
          email: regEmail.trim().toLowerCase(),
          mobile_number: regMobile.trim(),
          register_number: regRegisterNumber.trim(),
          department: regDepartment,
          year: Number(regYear)
        });
      } else {
        if (!regStaffNumber.trim()) {
          setLoginError('Please enter your Faculty Staff Number.');
          setIsSubmitting(false);
          return;
        }
        await api.registerFaculty({
          full_name: regFullName.trim(),
          email: regEmail.trim().toLowerCase(),
          mobile_number: regMobile.trim(),
          staff_number: regStaffNumber.trim(),
          department: regDepartment
        });
      }

      setRegistrationMessage(
        'Your registration has been submitted and is waiting for administrator approval.'
      );
      setAuthView('REGISTRATION_SUCCESS');
      // Clear form
      setRegFullName('');
      setRegEmail('');
      setRegMobile('');
      setRegRegisterNumber('');
      setRegStaffNumber('');
      setRegPassword('');
      setRegConfirmPassword('');
    } catch (err: any) {
      setLoginError(err.message || 'Registration failed. Please check your inputs.');
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
    setEmail('');
    setPassword('');
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
          padding: '1.5rem'
        }}
      >
        <div
          style={{
            maxWidth: '480px',
            width: '100%',
            background: '#ffffff',
            borderRadius: '24px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
            padding: '2.5rem 2rem'
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
              Create Your Permanent Password
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
              You are currently using an administrator-issued temporary password. Please choose a new password to secure your account.
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
                placeholder="Enter password given by admin"
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

  // 2. UN-AUTHENTICATED PORTAL (SINGLE LOGIN & STUDENT/FACULTY REGISTRATION)
  if (!user) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0f172a 0%, #431407 50%, #0f172a 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem 1rem'
        }}
      >
        <div
          style={{
            maxWidth: authView === 'REGISTER' ? '540px' : '480px',
            width: '100%',
            background: '#ffffff',
            borderRadius: '24px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
            overflow: 'hidden',
            padding: '2.5rem 2rem'
          }}
        >
          {/* Header Branding */}
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
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
            <p style={{ fontSize: '0.78rem', color: '#ea580c', fontWeight: 800, margin: '0.2rem 0 0 0', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Syed Ammal Engineering College
            </p>
          </div>

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

          {/* ==================== VIEW: LOGIN ==================== */}
          {authView === 'LOGIN' && (
            <>
              <p style={{ fontSize: '0.85rem', color: '#64748b', textAlign: 'center', margin: '-0.5rem 0 1.25rem' }}>
                Sign in to order food, track preparation, or access management.
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
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="student@saec.ac.in, faculty@saec.ac.in, admin@saec.ac.in"
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
                  {isSubmitting ? 'Authenticating...' : 'Sign In'}
                </button>
              </form>

              {/* Registration Link */}
              <div
                style={{
                  marginTop: '1.75rem',
                  padding: '1rem',
                  background: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem' }}>
                  Don't have an account yet?
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAuthView('REGISTER');
                    setLoginError('');
                    setAuthSuccessMessage('');
                  }}
                  className="btn btn-secondary"
                  style={{ width: '100%', fontWeight: 700, color: '#ea580c', borderColor: '#fed7aa' }}
                >
                  <UserPlus size={16} /> Register as Student / Faculty
                </button>
              </div>
            </>
          )}

          {/* ==================== VIEW: REGISTER ==================== */}
          {authView === 'REGISTER' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', margin: '0 0 0.25rem' }}>
                  Create Institutional Account
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                  Register to order meals from the campus canteen.
                </p>
              </div>

              {/* Role Switcher Tab: Student vs Faculty */}
              <div
                style={{
                  display: 'flex',
                  background: '#f1f5f9',
                  borderRadius: '10px',
                  padding: '4px',
                  marginBottom: '1.25rem'
                }}
              >
                <button
                  type="button"
                  onClick={() => setRegRole('STUDENT')}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    padding: '0.55rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: regRole === 'STUDENT' ? '#ffffff' : 'transparent',
                    color: regRole === 'STUDENT' ? '#ea580c' : '#64748b',
                    fontWeight: regRole === 'STUDENT' ? 800 : 600,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    boxShadow: regRole === 'STUDENT' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
                  }}
                >
                  <GraduationCap size={16} /> Student
                </button>
                <button
                  type="button"
                  onClick={() => setRegRole('FACULTY')}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    padding: '0.55rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: regRole === 'FACULTY' ? '#ffffff' : 'transparent',
                    color: regRole === 'FACULTY' ? '#ea580c' : '#64748b',
                    fontWeight: regRole === 'FACULTY' ? 800 : 600,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    boxShadow: regRole === 'FACULTY' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
                  }}
                >
                  <Briefcase size={16} /> Faculty / Staff
                </button>
              </div>

              <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.25rem' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    required
                    placeholder="e.g. S. Vignesh"
                    className="input-field"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.25rem' }}>
                      Institutional Email *
                    </label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      required
                      placeholder="name@saec.ac.in"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.25rem' }}>
                      Mobile Phone *
                    </label>
                    <input
                      type="tel"
                      value={regMobile}
                      onChange={(e) => setRegMobile(e.target.value)}
                      required
                      placeholder="9876543210"
                      className="input-field"
                    />
                  </div>
                </div>

                {regRole === 'STUDENT' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.25rem' }}>
                        Register Number *
                      </label>
                      <input
                        type="text"
                        value={regRegisterNumber}
                        onChange={(e) => setRegRegisterNumber(e.target.value)}
                        required
                        placeholder="e.g. 912821104001"
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.25rem' }}>
                        Year of Study *
                      </label>
                      <select
                        value={regYear}
                        onChange={(e) => setRegYear(Number(e.target.value))}
                        className="input-field"
                      >
                        <option value={1}>1st Year</option>
                        <option value={2}>2nd Year</option>
                        <option value={3}>3rd Year</option>
                        <option value={4}>4th Year</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.25rem' }}>
                      Staff ID Number *
                    </label>
                    <input
                      type="text"
                      value={regStaffNumber}
                      onChange={(e) => setRegStaffNumber(e.target.value)}
                      required
                      placeholder="e.g. SAEC-FAC-104"
                      className="input-field"
                    />
                  </div>
                )}

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.25rem' }}>
                    Department *
                  </label>
                  <select
                    value={regDepartment}
                    onChange={(e) => setRegDepartment(e.target.value)}
                    className="input-field"
                  >
                    <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electronics & Communication">Electronics & Communication</option>
                    <option value="Electrical & Electronics">Electrical & Electronics</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Civil Engineering">Civil Engineering</option>
                    <option value="Artificial Intelligence & Data Science">Artificial Intelligence & Data Science</option>
                    <option value="Science & Humanities">Science & Humanities</option>
                    <option value="Management Studies">Management Studies</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.25rem' }}>
                      Password (Min 6) *
                    </label>
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.25rem' }}>
                      Confirm Password *
                    </label>
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="input-field"
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '-0.3rem' }}>
                  <input
                    type="checkbox"
                    id="showRegPass"
                    checked={showRegPassword}
                    onChange={() => setShowRegPassword(!showRegPassword)}
                  />
                  <label htmlFor="showRegPass" style={{ fontSize: '0.75rem', color: '#64748b', cursor: 'pointer' }}>
                    Show Passwords
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.85rem', fontSize: '0.92rem', fontWeight: 700, marginTop: '0.35rem' }}
                >
                  {isSubmitting ? 'Submitting Registration...' : 'Submit Registration'}
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
                  <ArrowLeft size={16} /> Already registered? Sign In
                </button>
              </form>
            </>
          )}

          {/* ==================== VIEW: REGISTRATION SUCCESS ==================== */}
          {authView === 'REGISTRATION_SUCCESS' && (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: '#fff7ed',
                  color: '#ea580c',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                  boxShadow: '0 4px 16px rgba(234, 88, 12, 0.2)'
                }}
              >
                <CheckCircle2 size={36} />
              </div>

              <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#1e293b', margin: '0 0 0.5rem' }}>
                Registration Submitted!
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.5, marginBottom: '1.75rem' }}>
                {registrationMessage}
              </p>

              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '1rem',
                  fontSize: '0.8rem',
                  color: '#64748b',
                  marginBottom: '1.5rem',
                  textAlign: 'left'
                }}
              >
                <div style={{ fontWeight: 800, color: '#1e293b', marginBottom: '0.35rem' }}>Next Steps:</div>
                1. The canteen admin will verify your institutional registration.<br />
                2. Once approved, you can sign in using your registered email and password.
              </div>

              <button
                onClick={() => setAuthView('LOGIN')}
                className="btn btn-primary"
                style={{ width: '100%', fontWeight: 700 }}
              >
                Back to Sign In
              </button>
            </div>
          )}

          {/* ==================== VIEW: FORGOT PASSWORD ==================== */}
          {authView === 'FORGOT_PASSWORD' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', margin: '0 0 0.35rem' }}>
                  Account Password Recovery
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
                  Enter your registered institutional email address to receive a secure password reset token.
                </p>
              </div>

              <form onSubmit={handleForgotPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.4rem' }}>
                    Registered Email Address
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

          {/* ==================== VIEW: RESET LINK SENT ==================== */}
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
                If an active account exists for <strong>{forgotEmail}</strong>, a password reset verification token has been issued.
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

          {/* ==================== VIEW: RESET PASSWORD FORM ==================== */}
          {authView === 'RESET_PASSWORD' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', margin: '0 0 0.35rem' }}>
                  Choose New Password
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
                    New Password (Min 6) *
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
            Syed Ammal Engineering College • Canteen Automation System
          </div>
        </div>
      </div>
    );
  }

  // 3. STUDENT & FACULTY USER PORTAL
  if (user.role === 'STUDENT' || user.role === 'FACULTY') {
    return (
      <>
        <StudentOrderingView
          user={user}
          businessStatus={businessStatus}
          onLogout={() => setShowLogoutConfirm(true)}
        />

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
                Are you sure you want to log out of SAEC CAFÉ?
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
      </>
    );
  }

  // 4. ADMIN MANAGEMENT PORTAL
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
          activeTab={activeTab}
          setActiveTab={(tab) => setActiveTab(tab)}
          pendingTicketsCount={1}
          pendingContactCount={1}
        />

        <main style={{ flex: 1, padding: '1.75rem 2rem', overflowX: 'hidden' }}>
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'food' && <FoodManagementView />}
          {activeTab === 'inventory' && <InventoryView />}
          {activeTab === 'orders' && <OrderManagementView userRole={user.role} />}
          {activeTab === 'pos' && <PosView />}
          {activeTab === 'fcfs' && <FcfsQueueView />}
          {activeTab === 'contact' && <ContactOrdersView />}
          {activeTab === 'users' && <UserManagementView />}
          {activeTab === 'calendar' && <CalendarManager />}
          {activeTab === 'payment-support' && <PaymentSupportView />}
          {activeTab === 'analytics' && <AnalyticsView />}
          {activeTab === 'settings' && <SystemSettingsView />}
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
              Are you sure you want to log out of SAEC CAFÉ?
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
