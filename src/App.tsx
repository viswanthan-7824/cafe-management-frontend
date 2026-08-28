import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';

// Code-split dynamic lazy imports for instant initial loading & optimal chunk sizes
const DashboardView = lazy(() => import('./components/DashboardView').then(m => ({ default: m.DashboardView })));
const FoodManagementView = lazy(() => import('./components/FoodManagementView').then(m => ({ default: m.FoodManagementView })));
const UserManagementView = lazy(() => import('./components/UserManagementView').then(m => ({ default: m.UserManagementView })));
const OrderManagementView = lazy(() => import('./components/OrderManagementView').then(m => ({ default: m.OrderManagementView })));
const SystemSettingsView = lazy(() => import('./components/SystemSettingsView').then(m => ({ default: m.SystemSettingsView })));
const CalendarManager = lazy(() => import('./components/CalendarManager').then(m => ({ default: m.CalendarManager })));
const PosView = lazy(() => import('./components/PosView').then(m => ({ default: m.PosView })));
const FcfsQueueView = lazy(() => import('./components/FcfsQueueView').then(m => ({ default: m.FcfsQueueView })));
const ContactOrdersView = lazy(() => import('./components/ContactOrdersView').then(m => ({ default: m.ContactOrdersView })));
const PaymentSupportView = lazy(() => import('./components/PaymentSupportView').then(m => ({ default: m.PaymentSupportView })));
const InventoryView = lazy(() => import('./components/InventoryView').then(m => ({ default: m.InventoryView })));
const AnalyticsView = lazy(() => import('./components/AnalyticsView').then(m => ({ default: m.AnalyticsView })));
const StudentOrderingView = lazy(() => import('./components/StudentOrderingView').then(m => ({ default: m.StudentOrderingView })));
const CafeAssistantView = lazy(() => import('./components/CafeAssistantView').then(m => ({ default: m.CafeAssistantView })));

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
  UserPlus,
  X,
  Coffee
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

type AuthMode =
  | 'STUDENT_LOGIN'
  | 'STUDENT_REGISTER'
  | 'ADMIN_LOGIN'
  | 'ADMIN_FORGOT_PASSWORD'
  | 'ADMIN_RESET_CONFIRM';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('STUDENT_LOGIN');

  const [businessStatus, setBusinessStatus] = useState<any>({
    is_ordering_open: true,
    message: '🟢 SAEC CAFÉ • Ordering Open (10:00 AM – 3:30 PM)',
    status: 'WORKING_DAY',
    opening_time: '10:00',
    closing_time: '15:30'
  });

  // Student / Faculty Login Form State
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [showStudentPassword, setShowStudentPassword] = useState(false);

  // Direct Student / Faculty Registration State (No OTP required)
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState<'STUDENT' | 'FACULTY'>('STUDENT');
  const [regCollegeId, setRegCollegeId] = useState('');
  const [regDepartment, setRegDepartment] = useState('CSE');
  const [regYear, setRegYear] = useState<number>(4);
  const [regMobile, setRegMobile] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  const [loginError, setLoginError] = useState('');
  const [authSuccessMessage, setAuthSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Email + One-Time Generated Password (OTP) Auth State
  const [authStep, setAuthStep] = useState<'EMAIL' | 'CODE'>('EMAIL');
  const [loginEmail, setLoginEmail] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [cantAccessHelp, setCantAccessHelp] = useState(false);
  const [devCodeNotification, setDevCodeNotification] = useState<string | null>(null);

  // Logout confirmation modal
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    loadStatus();
    checkCurrentUser();
  }, []);

  // Cooldown timer effect
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setInterval(() => setResendCooldown((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [resendCooldown]);

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

  const handleRequestCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!loginEmail.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setLoginError('');
    setAuthSuccessMessage('');
    setDevCodeNotification(null);

    try {
      const res = await api.requestLoginCode(loginEmail.trim());
      setMaskedEmail(res.masked_email || loginEmail.trim());
      setResendCooldown(res.resend_cooldown || 45);
      if (res.dev_code) {
        setDevCodeNotification(`Development Code: ${res.dev_code}`);
      }
      setAuthStep('CODE');
    } catch (err: any) {
      setLoginError(err.message || 'Failed to request login code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setLoginError('');
    setAuthSuccessMessage('');

    try {
      const res = await api.verifyLoginCode(loginEmail.trim(), otpCode.trim());
      setUser(res.user);
      if (res.user.role === 'ADMIN') {
        setActiveTab('dashboard');
      } else {
        setActiveTab('menu');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Verification failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    setAuthToken(null);
    setUser(null);
    setShowLogoutConfirm(false);
    setAuthStep('EMAIL');
    setLoginEmail('');
    setOtpCode('');
    setDevCodeNotification(null);
  };

  // Portal Selection State: STUDENT, FACULTY, or ADMIN
  const [authPortal, setAuthPortal] = useState<'STUDENT' | 'FACULTY' | 'ADMIN'>('STUDENT');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  const handleAdminPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail.trim() || !adminPassword || isSubmitting) return;

    setIsSubmitting(true);
    setLoginError('');
    setAuthSuccessMessage('');

    try {
      const res = await api.adminLogin(adminEmail.trim(), adminPassword);
      setUser(res.user);
      setActiveTab('dashboard');
    } catch (err: any) {
      setLoginError(err.message || 'Invalid administrator credentials. Please check your email/password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1. UNAUTHENTICATED BRANDED PORTAL (STUDENT, FACULTY, ADMIN)
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
          className="glass-card animate-fade-in"
          style={{
            width: '100%',
            maxWidth: '460px',
            padding: '2.5rem 2rem',
            borderRadius: '24px',
            background: 'rgba(255, 255, 255, 0.98)',
            border: '1px solid #fed7aa',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4)'
          }}
        >
          {/* Header Logo & Branding */}
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
                  boxShadow: '0 6px 20px rgba(234, 88, 12, 0.35)',
                  objectFit: 'cover'
                }}
              />
            </div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
              SAEC <span style={{ color: '#ea580c' }}>CAFÉ</span>
            </h1>
            <p style={{ fontSize: '0.78rem', color: '#ea580c', fontWeight: 800, margin: '0.2rem 0 0 0', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Syed Ammal Engineering College
            </p>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.35rem 0 0', fontWeight: 600 }}>
              Good Food. Less Waiting.
            </p>
          </div>

          {/* 3 Portal Tabs Navigation */}
          <div
            style={{
              display: 'flex',
              background: '#f1f5f9',
              padding: '0.3rem',
              borderRadius: '14px',
              marginBottom: '1.5rem',
              gap: '0.25rem'
            }}
          >
            <button
              type="button"
              onClick={() => {
                setAuthPortal('STUDENT');
                setLoginError('');
                setAuthSuccessMessage('');
                setAuthStep('EMAIL');
              }}
              style={{
                flex: 1,
                padding: '0.65rem 0.35rem',
                border: 'none',
                borderRadius: '10px',
                fontSize: '0.8rem',
                fontWeight: 800,
                cursor: 'pointer',
                background: authPortal === 'STUDENT' ? '#ffffff' : 'transparent',
                color: authPortal === 'STUDENT' ? '#ea580c' : '#64748b',
                boxShadow: authPortal === 'STUDENT' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem'
              }}
            >
              <GraduationCap size={15} /> Student
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthPortal('FACULTY');
                setLoginError('');
                setAuthSuccessMessage('');
                setAuthStep('EMAIL');
              }}
              style={{
                flex: 1,
                padding: '0.65rem 0.35rem',
                border: 'none',
                borderRadius: '10px',
                fontSize: '0.8rem',
                fontWeight: 800,
                cursor: 'pointer',
                background: authPortal === 'FACULTY' ? '#ffffff' : 'transparent',
                color: authPortal === 'FACULTY' ? '#ea580c' : '#64748b',
                boxShadow: authPortal === 'FACULTY' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem'
              }}
            >
              <Briefcase size={15} /> Faculty
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthPortal('ADMIN');
                setLoginError('');
                setAuthSuccessMessage('');
              }}
              style={{
                flex: 1,
                padding: '0.65rem 0.35rem',
                border: 'none',
                borderRadius: '10px',
                fontSize: '0.8rem',
                fontWeight: 800,
                cursor: 'pointer',
                background: authPortal === 'ADMIN' ? '#ffffff' : 'transparent',
                color: authPortal === 'ADMIN' ? '#e11d48' : '#64748b',
                boxShadow: authPortal === 'ADMIN' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem'
              }}
            >
              <Shield size={15} /> Admin Portal
            </button>
          </div>

          {/* Feedback Alerts */}
          {loginError && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: '12px', fontSize: '0.82rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{loginError}</span>
            </div>
          )}

          {devCodeNotification && (
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af', padding: '0.75rem 1rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Info size={18} style={{ flexShrink: 0 }} />
              <span>{devCodeNotification}</span>
            </div>
          )}

          {/* ================= PORTAL 1 & 2: STUDENT / FACULTY EMAIL OTP SIGN IN ================= */}
          {(authPortal === 'STUDENT' || authPortal === 'FACULTY') && (
            <>
              {authStep === 'EMAIL' && (
                <>
                  <div style={{ marginBottom: '1.25rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem' }}>
                      {authPortal === 'STUDENT' ? 'Student Sign-In' : 'Faculty / Staff Sign-In'} 👋
                    </h2>
                    <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
                      Enter your approved institutional college email to receive a secure one-time login code.
                    </p>
                  </div>

                  <form onSubmit={handleRequestCode} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '0.4rem' }}>
                        {authPortal === 'STUDENT' ? 'Student Email Address' : 'Faculty Email Address'}
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="email"
                          required
                          autoFocus
                          placeholder={authPortal === 'STUDENT' ? "Enter student email" : "Enter faculty email"}
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          className="input-field"
                          style={{ width: '100%', paddingLeft: '2.5rem', fontSize: '0.95rem', background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '12px', height: '48px' }}
                        />
                        <Mail size={18} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={!loginEmail.trim() || isSubmitting}
                      className="btn btn-primary"
                      style={{ width: '100%', height: '48px', fontSize: '0.95rem', fontWeight: 800, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 4px 14px rgba(234, 88, 12, 0.35)' }}
                    >
                      {isSubmitting ? <RefreshCw size={18} className="animate-spin" /> : null}
                      {isSubmitting ? 'Checking Approval...' : 'CONTINUE WITH ONE-TIME CODE'}
                    </button>
                  </form>

                  <div style={{ marginTop: '1.5rem', textAlign: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem' }}>
                    <button
                      type="button"
                      onClick={() => setCantAccessHelp(!cantAccessHelp)}
                      style={{ background: 'none', border: 'none', color: '#ea580c', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Can't access your account?
                    </button>

                    {cantAccessHelp && (
                      <div style={{ marginTop: '0.85rem', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '10px', padding: '0.85rem', fontSize: '0.8rem', color: '#9a3412', textAlign: 'left', lineHeight: 1.4 }}>
                        <strong>Excel Roster Notice:</strong><br />
                        Student and Faculty accounts are created by Admin via Excel imports. If your email is not registered yet, please contact the canteen administrator.
                      </div>
                    )}
                  </div>
                </>
              )}

              {authStep === 'CODE' && (
                <>
                  <div style={{ marginBottom: '1.25rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem' }}>
                      Verify your email
                    </h2>
                    <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
                      We sent a 6-digit one-time code to <strong style={{ color: '#0f172a' }}>{maskedEmail}</strong>
                    </p>
                  </div>

                  <form onSubmit={handleVerifyCode} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '0.4rem', textAlign: 'center' }}>
                        Enter 6-Digit Code
                      </label>
                      <input
                        type="text"
                        required
                        autoFocus
                        maxLength={6}
                        placeholder="• • • • • •"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        className="input-field"
                        style={{ width: '100%', height: '52px', fontSize: '1.5rem', fontWeight: 900, textAlign: 'center', letterSpacing: '0.6rem', background: '#f8fafc', border: '2px solid #ea580c', borderRadius: '14px', color: '#0f172a' }}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={otpCode.length !== 6 || isSubmitting}
                      className="btn btn-primary"
                      style={{ width: '100%', height: '48px', fontSize: '0.95rem', fontWeight: 800, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 4px 14px rgba(234, 88, 12, 0.35)' }}
                    >
                      {isSubmitting ? <RefreshCw size={18} className="animate-spin" /> : null}
                      {isSubmitting ? 'Verifying Code...' : 'VERIFY & LOGIN'}
                    </button>
                  </form>

                  <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', borderTop: '1px solid #f1f5f9', paddingTop: '1.15rem' }}>
                    <button
                      type="button"
                      disabled={resendCooldown > 0 || isSubmitting}
                      onClick={() => handleRequestCode()}
                      className="btn btn-secondary"
                      style={{ width: '100%', padding: '0.65rem', fontSize: '0.82rem', fontWeight: 700 }}
                    >
                      {resendCooldown > 0 ? `Resend Code in 00:${resendCooldown < 10 ? '0' : ''}${resendCooldown}` : 'Resend Code'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAuthStep('EMAIL');
                        setOtpCode('');
                        setLoginError('');
                        setDevCodeNotification(null);
                      }}
                      style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      ← Change email address
                    </button>
                  </div>
                </>
              )}
            </>
          )}

          {/* ================= PORTAL 3: ADMIN PORTAL SIGN IN ================= */}
          {authPortal === 'ADMIN' && (
            <>
              <div style={{ marginBottom: '1.25rem', textAlign: 'center' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: '#ffe4e6',
                    color: '#e11d48',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '0.5rem'
                  }}
                >
                  <Shield size={24} />
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', margin: '0 0 0.2rem' }}>
                  Administrator Portal
                </h2>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                  Enter administrator credentials (`admin@saec.ac.in`) to access management control.
                </p>
              </div>

              <form onSubmit={handleAdminPasswordLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.4rem' }}>
                    Administrator Email / Username
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      required
                      autoFocus
                      placeholder="admin@saec.ac.in"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="input-field"
                      style={{ width: '100%', paddingLeft: '2.5rem', background: '#f8fafc', height: '46px' }}
                    />
                    <Mail size={18} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.4rem' }}>
                    Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showAdminPassword ? 'text' : 'password'}
                      required
                      placeholder="Enter administrator password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="input-field"
                      style={{ width: '100%', paddingRight: '2.5rem', background: '#f8fafc', height: '46px' }}
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
                  disabled={!adminEmail.trim() || !adminPassword || isSubmitting}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    height: '48px',
                    fontSize: '0.95rem',
                    fontWeight: 800,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    background: '#e11d48',
                    boxShadow: '0 4px 14px rgba(225, 29, 72, 0.35)'
                  }}
                >
                  {isSubmitting ? <RefreshCw size={18} className="animate-spin" /> : <LogIn size={18} />}
                  {isSubmitting ? 'Authenticating...' : 'SIGN IN AS ADMINISTRATOR'}
                </button>
              </form>

              <div style={{ marginTop: '1.25rem', textAlign: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setLoginEmail(adminEmail);
                    setAuthStep('EMAIL');
                    handleRequestCode();
                  }}
                  style={{ background: 'none', border: 'none', color: '#ea580c', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Or Request One-Time Email Code →
                </button>
              </div>
            </>
          )}

          <div style={{ marginTop: '1.75rem', fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center' }}>
            Syed Ammal Engineering College • Canteen Automation System
          </div>
        </div>
      </div>
    );
  }

  // 2. STUDENT & FACULTY USER PORTAL
  if (user.role === 'STUDENT' || user.role === 'FACULTY') {
    return (
      <Suspense
        fallback={
          <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '3px solid #fed7aa', borderTopColor: '#ea580c', animation: 'spin 0.8s linear infinite' }} />
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1e293b' }}>Loading SAEC CAFÉ...</div>
            </div>
          </div>
        }
      >
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
      </Suspense>
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
          <Suspense
            fallback={
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1rem 0' }}>
                <div className="skeleton" style={{ height: '70px', borderRadius: '16px' }} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                  {[1, 2, 3, 4].map(n => (
                    <div key={n} className="skeleton" style={{ height: '120px', borderRadius: '16px' }} />
                  ))}
                </div>
                <div className="skeleton" style={{ height: '350px', borderRadius: '16px' }} />
              </div>
            }
          >
            {activeTab === 'dashboard' && <DashboardView />}
            {activeTab === 'assistant' && <CafeAssistantView />}
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
          </Suspense>
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
