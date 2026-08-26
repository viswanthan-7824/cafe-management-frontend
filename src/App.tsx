import React, { useState, useEffect, useRef } from 'react';
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
  Shield,
  ShieldCheck,
  Info,
  X
} from 'lucide-react';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (parent: HTMLElement, options: any) => void;
          prompt: (momentListener?: any) => void;
        };
      };
    };
  }
}

type AuthMode = 'GOOGLE_STUDENT' | 'ADMIN_LOGIN' | 'ADMIN_FORGOT_PASSWORD' | 'ADMIN_RESET_CONFIRM';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('GOOGLE_STUDENT');

  const [businessStatus, setBusinessStatus] = useState<any>({
    is_ordering_open: true,
    message: '🟢 SAEC CAFÉ • Ordering Open (10:00 AM – 3:30 PM)',
    status: 'WORKING_DAY',
    opening_time: '10:00',
    closing_time: '15:30'
  });

  // Admin Login Form State
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [authSuccessMessage, setAuthSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Admin Forgot / Reset Password
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Simulation / Manual Google Account Testing Dialog (for dev & demonstration)
  const [showGoogleAccountSelector, setShowGoogleAccountSelector] = useState(false);
  const [manualGoogleEmail, setManualGoogleEmail] = useState('');

  // Logout confirmation modal
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const googleBtnContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadStatus();
    checkCurrentUser();
  }, []);

  // Initialize Google Identity Services button
  useEffect(() => {
    if (authMode === 'GOOGLE_STUDENT' && !user) {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

      const handleCredentialResponse = async (response: any) => {
        if (!response || !response.credential) {
          setLoginError('Google sign-in was cancelled.');
          return;
        }
        await executeGoogleLogin(response.credential);
      };

      if (window.google?.accounts?.id && clientId) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          if (googleBtnContainerRef.current) {
            googleBtnContainerRef.current.innerHTML = '';
            window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
              theme: 'outline',
              size: 'large',
              width: 320,
              text: 'continue_with',
              shape: 'pill',
            });
          }
        } catch (e) {
          console.error('Google GSI initialization error:', e);
        }
      }
    }
  }, [authMode, user]);

  async function loadStatus() {
    try {
      const st = await api.getCurrentBusinessDay();
      setBusinessStatus(st);
    } catch (e) {
      console.error(e);
    }
  }

  async function checkCurrentUser() {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'}/auth/profile/`, {
          headers: { Authorization: `Bearer ${savedToken}` }
        });
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
          if (userData.role === 'ADMIN') {
            setActiveTab('dashboard');
          } else {
            setActiveTab('menu');
          }
        } else {
          setAuthToken(null);
        }
      } catch (e) {
        // backend unreachable
      }
    }
  }

  // Execute Google OAuth login with backend verification
  const executeGoogleLogin = async (credential: string) => {
    setIsSubmitting(true);
    setLoginError('');
    setAuthSuccessMessage('');
    try {
      const { user: u } = await api.googleLogin(credential);
      setUser(u);
      setLoginError('');
      setShowGoogleAccountSelector(false);

      if (u.role === 'ADMIN') {
        setActiveTab('dashboard');
      } else {
        setActiveTab('menu');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Google authentication could not be verified. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Trigger Google Login
  const handleContinueWithGoogleClick = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
    setLoginError('');

    if (window.google?.accounts?.id && clientId) {
      try {
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // Popup blocked or not displayed, open Google Account Selector fallback
            setShowGoogleAccountSelector(true);
          }
        });
        return;
      } catch (e) {
        console.error(e);
      }
    }
    // Open Google Account selector modal
    setShowGoogleAccountSelector(true);
  };

  const handleSimulatedGoogleLogin = async (selectedEmail: string) => {
    const testToken = `mock-google-token:${selectedEmail.trim().toLowerCase()}`;
    await executeGoogleLogin(testToken);
  };

  // Admin Password Login
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLoginError('');
    try {
      const { user: u } = await api.adminLogin(adminEmail, adminPassword);
      setUser(u);
      setLoginError('');
      setActiveTab('dashboard');
    } catch (err: any) {
      setLoginError(err.message || 'Incorrect administrator email or password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Admin Forgot Password
  const handleAdminForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;

    setIsSubmitting(true);
    setLoginError('');
    try {
      const res = await api.requestPasswordReset(forgotEmail.trim());
      if (res.reset_token) {
        setResetToken(res.reset_token);
      }
      setAuthSuccessMessage('If an administrator account exists for this email, a password reset link has been generated.');
      setAuthMode('ADMIN_RESET_CONFIRM');
    } catch (err: any) {
      setLoginError(err.message || 'Unable to process password reset request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setLoginError('New passwords do not match.');
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
      setAuthSuccessMessage('Password reset successfully. You can now log in with your new administrator password.');
      setAuthMode('ADMIN_LOGIN');
      setAdminPassword('');
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
    setAdminEmail('');
    setAdminPassword('');
    setAuthMode('GOOGLE_STUDENT');
    setShowLogoutConfirm(false);
    setActiveTab('dashboard');
  };

  // 1. UN-AUTHENTICATED PORTAL (SINGLE LOGIN FOR STUDENT/FACULTY & ADMIN)
  if (!user) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0f172a 0%, #3b1307 45%, #0f172a 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem 1rem'
        }}
      >
        <div
          style={{
            maxWidth: '460px',
            width: '100%',
            background: '#ffffff',
            borderRadius: '24px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.35)',
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
                  width: '68px',
                  height: '68px',
                  borderRadius: '50%',
                  border: '3px solid #ea580c',
                  boxShadow: '0 6px 20px rgba(234, 88, 12, 0.3)',
                  objectFit: 'cover'
                }}
              />
            </div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#1e293b', margin: 0, letterSpacing: '-0.02em' }}>
              SAEC <span style={{ color: '#ea580c' }}>CAFÉ</span>
            </h1>
            <p style={{ fontSize: '0.78rem', color: '#ea580c', fontWeight: 800, margin: '0.25rem 0 0 0', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Syed Ammal Engineering College
            </p>
            <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '0.5rem 0 0', fontWeight: 500 }}>
              Good Food, Less Waiting.
            </p>
          </div>

          {/* Success Message Banner */}
          {authSuccessMessage && (
            <div
              style={{
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: '12px',
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
                borderRadius: '12px',
                padding: '0.85rem 1rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.6rem',
                color: '#b91c1c',
                fontSize: '0.82rem',
                marginBottom: '1.25rem',
                fontWeight: 600,
                lineHeight: 1.4
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{loginError}</span>
            </div>
          )}

          {/* ==================== VIEW: GOOGLE STUDENT / FACULTY LOGIN ==================== */}
          {authMode === 'GOOGLE_STUDENT' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', margin: '0 0 0.25rem' }}>
                  Welcome back
                </h2>
                <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
                  Sign in with your verified Google account to order meals.
                </p>
              </div>

              {/* Continue with Google Primary Button */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {/* Official Google GSI Render Container */}
                <div ref={googleBtnContainerRef} style={{ minHeight: '44px', display: 'flex', justifyContent: 'center' }} />

                {/* Primary Google Login Button */}
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleContinueWithGoogleClick}
                  style={{
                    width: '100%',
                    padding: '0.85rem 1.25rem',
                    borderRadius: '9999px',
                    border: '1.5px solid #dadce0',
                    background: '#ffffff',
                    color: '#3c4043',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)')}
                  onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.06)')}
                >
                  {isSubmitting ? (
                    <RefreshCw size={20} className="animate-spin" color="#ea580c" />
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                  )}
                  <span>{isSubmitting ? 'Verifying Google Account...' : 'Continue with Google'}</span>
                </button>
              </div>

              {/* Information Notice for Student/Faculty Authorization */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '1rem',
                  fontSize: '0.8rem',
                  color: '#475569',
                  lineHeight: 1.45,
                  display: 'flex',
                  gap: '0.65rem'
                }}
              >
                <Info size={18} color="#ea580c" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ color: '#1e293b' }}>Institutional Access Only:</strong> Student and Faculty accounts must be added and activated by the college administrator.
                </div>
              </div>

              {/* Admin Portal Switcher */}
              <div style={{ marginTop: '1.75rem', textAlign: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('ADMIN_LOGIN');
                    setLoginError('');
                    setAuthSuccessMessage('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.4rem 0.75rem',
                    borderRadius: '8px',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#ea580c';
                    e.currentTarget.style.background = '#fff7ed';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#64748b';
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <Shield size={14} /> Canteen Administrator Sign-In →
                </button>
              </div>
            </>
          )}

          {/* ==================== VIEW: ADMIN LOGIN ==================== */}
          {authMode === 'ADMIN_LOGIN' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: '#ffe4e6',
                    color: '#e11d48',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '0.5rem'
                  }}
                >
                  <Shield size={22} />
                </div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1e293b', margin: '0 0 0.2rem' }}>
                  Administrator Portal
                </h2>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                  Enter administrator credentials to manage canteen operations.
                </p>
              </div>

              <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.4rem' }}>
                    Admin Email Address
                  </label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    required
                    placeholder="admin@saec.ac.in"
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
                        setAuthMode('ADMIN_FORGOT_PASSWORD');
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
                      type={showAdminPassword ? 'text' : 'password'}
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      required
                      placeholder="Enter administrator password"
                      className="input-field"
                      style={{ width: '100%', paddingRight: '2.5rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
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
                      {showAdminPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    marginTop: '0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {isSubmitting ? <RefreshCw size={18} className="animate-spin" /> : <LogIn size={18} />}
                  {isSubmitting ? 'Authenticating...' : 'Sign In as Administrator'}
                </button>
              </form>

              <div style={{ marginTop: '1.5rem', textAlign: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('GOOGLE_STUDENT');
                    setLoginError('');
                    setAuthSuccessMessage('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ea580c',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <ArrowLeft size={14} /> Back to Student / Faculty Google Sign-In
                </button>
              </div>
            </>
          )}

          {/* ==================== VIEW: ADMIN FORGOT PASSWORD ==================== */}
          {authMode === 'ADMIN_FORGOT_PASSWORD' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: '#fff7ed',
                    color: '#ea580c',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '0.5rem'
                  }}
                >
                  <KeyRound size={22} />
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', margin: '0 0 0.2rem' }}>
                  Admin Password Recovery
                </h2>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                  Enter your registered administrator email to receive a password reset token.
                </p>
              </div>

              <form onSubmit={handleAdminForgotPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.4rem' }}>
                    Administrator Email Address
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    placeholder="admin@saec.ac.in"
                    className="input-field"
                    style={{ width: '100%' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.85rem', fontWeight: 700 }}
                >
                  {isSubmitting ? 'Requesting Reset...' : 'Send Password Reset Link'}
                </button>

                <button
                  type="button"
                  onClick={() => setAuthMode('ADMIN_LOGIN')}
                  className="btn btn-secondary"
                  style={{ width: '100%' }}
                >
                  Back to Admin Sign-In
                </button>
              </form>
            </>
          )}

          {/* ==================== VIEW: ADMIN RESET CONFIRM ==================== */}
          {authMode === 'ADMIN_RESET_CONFIRM' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', margin: '0 0 0.2rem' }}>
                  Set New Admin Password
                </h2>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                  Enter your reset token and your new administrator password.
                </p>
              </div>

              <form onSubmit={handleAdminResetPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.35rem' }}>
                    Reset Token *
                  </label>
                  <input
                    type="text"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    required
                    placeholder="Paste reset token"
                    className="input-field"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.35rem' }}>
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
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.35rem' }}>
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
                  style={{ width: '100%', padding: '0.85rem', fontWeight: 700 }}
                >
                  {isSubmitting ? 'Resetting...' : 'Reset Password'}
                </button>

                <button
                  type="button"
                  onClick={() => setAuthMode('ADMIN_LOGIN')}
                  className="btn btn-secondary"
                  style={{ width: '100%' }}
                >
                  Cancel
                </button>
              </form>
            </>
          )}

          <div style={{ marginTop: '1.75rem', fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center' }}>
            Syed Ammal Engineering College • Canteen Automation System
          </div>
        </div>

        {/* ==================== GOOGLE ACCOUNT SIGN-IN MODAL ==================== */}
        {showGoogleAccountSelector && (
          <div className="modal-overlay" onClick={() => setShowGoogleAccountSelector(false)}>
            <div
              className="modal-content animate-fade-in"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '440px', padding: '2rem' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                  </svg>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#1e293b' }}>
                    Sign in with Google
                  </h3>
                </div>
                <button onClick={() => setShowGoogleAccountSelector(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 1.25rem', lineHeight: 1.4 }}>
                Enter your registered Google Email address to verify your account and sign in:
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (manualGoogleEmail.trim()) {
                    handleSimulatedGoogleLogin(manualGoogleEmail.trim());
                  }
                }}
                style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
              >
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.4rem' }}>
                    Google Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    autoFocus
                    placeholder="e.g. student1@gmail.com"
                    value={manualGoogleEmail}
                    onChange={(e) => setManualGoogleEmail(e.target.value)}
                    className="input-field"
                    style={{ width: '100%', fontSize: '0.95rem' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowGoogleAccountSelector(false)}
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!manualGoogleEmail.trim() || isSubmitting}
                    className="btn btn-primary"
                    style={{ flex: 1.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                  >
                    {isSubmitting ? <RefreshCw size={16} className="animate-spin" /> : null}
                    {isSubmitting ? 'Verifying...' : 'Sign In with Google'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. STUDENT & FACULTY USER PORTAL
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

  // 3. ADMIN MANAGEMENT PORTAL
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#1e293b' }}>
      <Navbar
        user={user}
        businessStatus={businessStatus}
        onLogout={() => setShowLogoutConfirm(true)}
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
