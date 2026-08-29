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
const DemandForecastView = lazy(() => import('./components/DemandForecastView').then(m => ({ default: m.DemandForecastView })));

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

  // Auth Flow Mode: LOGIN, CREATE_PASSWORD_*, FORGOT_PASSWORD_*
  const [authFlowMode, setAuthFlowMode] = useState<
    | 'LOGIN'
    | 'CREATE_PASSWORD_EMAIL'
    | 'CREATE_PASSWORD_OTP'
    | 'CREATE_PASSWORD_NEW'
    | 'CREATE_PASSWORD_SUCCESS'
    | 'FORGOT_PASSWORD_EMAIL'
    | 'FORGOT_PASSWORD_OTP'
    | 'FORGOT_PASSWORD_NEW'
    | 'FORGOT_PASSWORD_SUCCESS'
  >('LOGIN');

  // Password Creation & Reset Form States
  const [createPasswordEmail, setCreatePasswordEmail] = useState('');
  const [createPasswordOtp, setCreatePasswordOtp] = useState('');
  const [createPasswordNewPass, setCreatePasswordNewPass] = useState('');
  const [createPasswordConfirmPass, setCreatePasswordConfirmPass] = useState('');
  const [showCreatePass, setShowCreatePass] = useState(false);
  const [createPasswordToken, setCreatePasswordToken] = useState('');

  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordOtp, setForgotPasswordOtp] = useState('');
  const [forgotPasswordNewPass, setForgotPasswordNewPass] = useState('');
  const [forgotPasswordConfirmPass, setForgotPasswordConfirmPass] = useState('');
  const [showForgotPass, setShowForgotPass] = useState(false);
  const [forgotPasswordToken, setForgotPasswordToken] = useState('');

  // Password Strength Calculation Helper
  const getPasswordStrength = (pass: string) => {
    const checks = {
      length: pass.length >= 8,
      upper: /[A-Z]/.test(pass),
      lower: /[a-z]/.test(pass),
      number: /[0-9]/.test(pass),
      special: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(pass)
    };
    let score = 0;
    if (checks.length) score += 1;
    if (checks.upper) score += 1;
    if (checks.lower) score += 1;
    if (checks.number) score += 1;
    if (checks.special) score += 1;

    let label = 'Weak';
    let color = '#ef4444';
    if (score === 5) {
      label = 'Strong';
      color = '#10b981';
    } else if (score >= 3) {
      label = 'Medium';
      color = '#f59e0b';
    }
    return { score, label, color, checks };
  };

  // Normal Student / Faculty Password Login Handler
  const handleStudentPasswordLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentEmail.trim() || !studentPassword || isSubmitting) return;

    setIsSubmitting(true);
    setLoginError('');
    setAuthSuccessMessage('');

    try {
      const res = await api.studentPasswordLogin(studentEmail.trim(), studentPassword);
      setUser(res.user);
      setActiveTab(res.user.role === 'ADMIN' ? 'dashboard' : 'menu');
    } catch (err: any) {
      setLoginError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Direct No-Password Student Login Handler
  const handleDirectStudentLogin = async () => {
    setIsSubmitting(true);
    setLoginError('');
    setAuthSuccessMessage('');

    try {
      const res = await api.studentPasswordLogin('student@saec.ac.in', 'student123');
      setUser(res.user);
      setActiveTab('food');
    } catch (err: any) {
      // Fallback local student user object if backend is offline or student demo mode
      const fallbackUser: User = {
        id: 1,
        full_name: 'SAEC Student',
        email: 'student@saec.ac.in',
        role: 'STUDENT',
        college_id: 'SAEC-STU-2026',
        mobile_number: '9876543210',
        status: 'ACTIVE',
        must_change_password: false,
        is_active: true,
        created_at: new Date().toISOString(),
        department: 'Computer Science & Engineering',
        year: 4
      };
      setUser(fallbackUser);
      setActiveTab('food');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create Password Handlers
  const handleCreatePasswordRequestOtpSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!createPasswordEmail.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setLoginError('');
    setAuthSuccessMessage('');
    setDevCodeNotification(null);

    try {
      const res = await api.requestCreatePasswordOtp(createPasswordEmail.trim());
      setMaskedEmail(res.masked_email || createPasswordEmail.trim());
      setResendCooldown(res.resend_cooldown || 60);
      if (res.dev_code) {
        setDevCodeNotification(`Verification Code (Dev Mode): ${res.dev_code}`);
      }
      setAuthFlowMode('CREATE_PASSWORD_OTP');
    } catch (err: any) {
      setLoginError(err.message || 'This email is not registered. Please contact the administrator.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreatePasswordVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createPasswordOtp.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setLoginError('');

    try {
      const res = await api.verifyCreatePasswordOtp(createPasswordEmail.trim(), createPasswordOtp.trim());
      setCreatePasswordToken(res.verification_token);
      setAuthFlowMode('CREATE_PASSWORD_NEW');
    } catch (err: any) {
      setLoginError(err.message || 'Invalid verification code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreatePasswordSetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createPasswordNewPass || !createPasswordConfirmPass || isSubmitting) return;

    if (createPasswordNewPass !== createPasswordConfirmPass) {
      setLoginError('Passwords do not match.');
      return;
    }

    const strength = getPasswordStrength(createPasswordNewPass);
    if (strength.score < 5) {
      setLoginError('Password must satisfy all strength criteria (8+ chars, uppercase, lowercase, number, special char).');
      return;
    }

    setIsSubmitting(true);
    setLoginError('');

    try {
      await api.setCreatePassword(createPasswordToken, createPasswordNewPass, createPasswordConfirmPass);
      setAuthSuccessMessage('Password created successfully. You can now log in.');
      setAuthFlowMode('CREATE_PASSWORD_SUCCESS');
    } catch (err: any) {
      setLoginError(err.message || 'Failed to create password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Forgot Password Handlers
  const handleForgotPasswordRequestOtpSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!forgotPasswordEmail.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setLoginError('');
    setAuthSuccessMessage('');
    setDevCodeNotification(null);

    try {
      const res = await api.requestForgotPasswordOtp(forgotPasswordEmail.trim());
      setMaskedEmail(res.masked_email || forgotPasswordEmail.trim());
      setResendCooldown(res.resend_cooldown || 60);
      if (res.dev_code) {
        setDevCodeNotification(`Verification Code (Dev Mode): ${res.dev_code}`);
      }
      setAuthFlowMode('FORGOT_PASSWORD_OTP');
    } catch (err: any) {
      setLoginError(err.message || 'This email is not registered. Please contact the administrator.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPasswordVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotPasswordOtp.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setLoginError('');

    try {
      const res = await api.verifyForgotPasswordOtp(forgotPasswordEmail.trim(), forgotPasswordOtp.trim());
      setForgotPasswordToken(res.verification_token);
      setAuthFlowMode('FORGOT_PASSWORD_NEW');
    } catch (err: any) {
      setLoginError(err.message || 'Invalid verification code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPasswordSetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotPasswordNewPass || !forgotPasswordConfirmPass || isSubmitting) return;

    if (forgotPasswordNewPass !== forgotPasswordConfirmPass) {
      setLoginError('Passwords do not match.');
      return;
    }

    const strength = getPasswordStrength(forgotPasswordNewPass);
    if (strength.score < 5) {
      setLoginError('Password must satisfy all strength criteria.');
      return;
    }

    setIsSubmitting(true);
    setLoginError('');

    try {
      await api.setForgotPassword(forgotPasswordToken, forgotPasswordNewPass, forgotPasswordConfirmPass);
      setAuthSuccessMessage('Password reset successfully. You can now log in.');
      setAuthFlowMode('FORGOT_PASSWORD_SUCCESS');
    } catch (err: any) {
      setLoginError(err.message || 'Failed to reset password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    setAuthToken(null);
    setUser(null);
    setShowLogoutConfirm(false);
    setAuthFlowMode('LOGIN');
    setStudentEmail('');
    setStudentPassword('');
    setLoginError('');
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
        className="perspective-container"
        style={{
          minHeight: '100vh',
          background: 'radial-gradient(circle at center, #1e1b4b 0%, #0f172a 60%, #020617 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1rem',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Floating 3D Ambient Background Lights */}
        <div style={{ position: 'absolute', top: '10%', left: '15%', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(234,88,12,0.25) 0%, transparent 70%)', filter: 'blur(40px)', animation: 'float3d 10s ease-in-out infinite alternate' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '15%', width: '350px', height: '350px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 70%)', filter: 'blur(50px)', animation: 'float3d 12s ease-in-out infinite alternate-reverse' }} />

        <div
          className="card-3d ultra-3d-portal-box animate-fade-in"
          style={{
            width: '100%',
            maxWidth: '480px',
            padding: '2.75rem 2.25rem',
            borderRadius: '28px',
            background: 'rgba(255, 255, 255, 0.96)',
            border: '1.5px solid rgba(254, 215, 170, 0.6)',
            boxShadow: '0 30px 80px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.8) inset'
          }}
          onMouseMove={(e) => {
            if (window.innerWidth < 768) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            e.currentTarget.style.setProperty('--rx', `${-y / 16}deg`);
            e.currentTarget.style.setProperty('--ry', `${x / 16}deg`);
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.setProperty('--rx', '0deg');
            e.currentTarget.style.setProperty('--ry', '0deg');
          }}
        >
          {/* Header Ultra 3D Canteen Logo & Branding */}
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <div className="ultra-3d-logo-ring" style={{ marginBottom: '1rem' }}>
              <img
                src="/saec_cafe_logo.jpg"
                alt="SAEC CAFÉ Official Logo"
                className="ultra-3d-logo-img"
              />
            </div>
            <h1 style={{ fontSize: '2.1rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.03em' }}>
              SAEC <span style={{ color: '#ea580c', textShadow: '0 4px 12px rgba(234, 88, 12, 0.3)' }}>CAFÉ</span>
            </h1>
            <p style={{ fontSize: '0.78rem', color: '#ea580c', fontWeight: 900, margin: '0.25rem 0 0 0', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              Syed Ammal Engineering College
            </p>
            <p style={{ fontSize: '0.88rem', color: '#475569', margin: '0.35rem 0 0', fontWeight: 700 }}>
              Good Food. Less Waiting. ☕
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
                handleDirectStudentLogin();
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

          {/* ================= PORTAL 1 & 2: STUDENT / FACULTY SIGN IN & PASSWORD CREATION ================= */}
          {(authPortal === 'STUDENT' || authPortal === 'FACULTY') && (
            <>
              {/* FLOW 1: LOGIN (EMAIL + PASSWORD) */}
              {authFlowMode === 'LOGIN' && (
                <>
                  <div style={{ marginBottom: '1.25rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem' }}>
                      {authPortal === 'STUDENT' ? 'Student Instant Sign-In' : 'Faculty / Staff Sign-In'} 👋
                    </h2>
                    <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
                      {authPortal === 'STUDENT'
                        ? 'No password required! Click below to enter the SAEC CAFÉ Student Portal instantly.'
                        : 'Enter your registered institutional email and password to log in.'}
                    </p>
                  </div>

                  {authPortal === 'STUDENT' && (
                    <div style={{ marginBottom: '1.25rem' }}>
                      <button
                        type="button"
                        onClick={handleDirectStudentLogin}
                        disabled={isSubmitting}
                        className="btn btn-primary"
                        style={{
                          width: '100%',
                          height: '52px',
                          fontSize: '1rem',
                          fontWeight: 900,
                          borderRadius: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.6rem',
                          background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                          boxShadow: '0 6px 20px rgba(234, 88, 12, 0.4)'
                        }}
                      >
                        {isSubmitting ? <RefreshCw size={20} className="animate-spin" /> : <GraduationCap size={22} />}
                        {isSubmitting ? 'Entering Student Portal...' : 'ENTER STUDENT PORTAL (NO PASSWORD REQUIRED)'}
                      </button>

                      <div style={{ textAlign: 'center', margin: '1rem 0 0.5rem', fontSize: '0.78rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        — Or Sign In With Credentials —
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleStudentPasswordLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '0.4rem' }}>
                        {authPortal === 'STUDENT' ? 'Student Email Address' : 'Faculty Email Address'}
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="email"
                          required
                          autoFocus
                          placeholder={authPortal === 'STUDENT' ? "student@saec.ac.in" : "faculty@saec.ac.in"}
                          value={studentEmail}
                          onChange={(e) => setStudentEmail(e.target.value)}
                          className="input-field"
                          style={{ width: '100%', paddingLeft: '2.5rem', fontSize: '0.95rem', background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '12px', height: '48px' }}
                        />
                        <Mail size={18} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '0.4rem' }}>
                        Password
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showStudentPassword ? "text" : "password"}
                          required
                          placeholder="Enter your password"
                          value={studentPassword}
                          onChange={(e) => setStudentPassword(e.target.value)}
                          className="input-field"
                          style={{ width: '100%', paddingLeft: '2.5rem', paddingRight: '2.5rem', fontSize: '0.95rem', background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '12px', height: '48px' }}
                        />
                        <KeyRound size={18} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                        <button
                          type="button"
                          onClick={() => setShowStudentPassword(!showStudentPassword)}
                          style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                        >
                          {showStudentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={!studentEmail.trim() || !studentPassword || isSubmitting}
                      className="btn btn-primary"
                      style={{ width: '100%', height: '48px', fontSize: '0.95rem', fontWeight: 800, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 4px 14px rgba(234, 88, 12, 0.35)' }}
                    >
                      {isSubmitting ? <RefreshCw size={18} className="animate-spin" /> : <LogIn size={18} />}
                      {isSubmitting ? 'Authenticating...' : 'LOG IN'}
                    </button>
                  </form>

                  {/* Actions Links: Create Password & Forgot Password */}
                  <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', textAlign: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthFlowMode('CREATE_PASSWORD_EMAIL');
                        setCreatePasswordEmail(studentEmail);
                        setLoginError('');
                        setAuthSuccessMessage('');
                      }}
                      style={{ background: 'none', border: 'none', color: '#ea580c', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      First time? Create your password
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAuthFlowMode('FORGOT_PASSWORD_EMAIL');
                        setForgotPasswordEmail(studentEmail);
                        setLoginError('');
                        setAuthSuccessMessage('');
                      }}
                      style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Forgot Password?
                    </button>
                  </div>
                </>
              )}

              {/* FLOW 2: CREATE PASSWORD - STEP 1 EMAIL */}
              {authFlowMode === 'CREATE_PASSWORD_EMAIL' && (
                <>
                  <div style={{ marginBottom: '1.25rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem' }}>
                      Create Your Password 🔒
                    </h2>
                    <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
                      Enter your registered institutional email. Password creation is only allowed if your email was registered by an Administrator.
                    </p>
                  </div>

                  <form onSubmit={handleCreatePasswordRequestOtpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '0.4rem' }}>
                        Registered Institutional Email
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="email"
                          required
                          autoFocus
                          placeholder="student@saec.ac.in"
                          value={createPasswordEmail}
                          onChange={(e) => setCreatePasswordEmail(e.target.value)}
                          className="input-field"
                          style={{ width: '100%', paddingLeft: '2.5rem', fontSize: '0.95rem', background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '12px', height: '48px' }}
                        />
                        <Mail size={18} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={!createPasswordEmail.trim() || isSubmitting}
                      className="btn btn-primary"
                      style={{ width: '100%', height: '48px', fontSize: '0.95rem', fontWeight: 800, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 4px 14px rgba(234, 88, 12, 0.35)' }}
                    >
                      {isSubmitting ? <RefreshCw size={18} className="animate-spin" /> : null}
                      {isSubmitting ? 'Verifying Email Registration...' : 'SEND VERIFICATION CODE'}
                    </button>
                  </form>

                  <div style={{ marginTop: '1.25rem', textAlign: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                    <button
                      type="button"
                      onClick={() => { setAuthFlowMode('LOGIN'); setLoginError(''); }}
                      style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      ← Back to Login
                    </button>
                  </div>
                </>
              )}

              {/* FLOW 3: CREATE PASSWORD - STEP 2 OTP VERIFICATION */}
              {authFlowMode === 'CREATE_PASSWORD_OTP' && (
                <>
                  <div style={{ marginBottom: '1.25rem', textAlign: 'center' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fff7ed', border: '2px solid #fed7aa', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c', marginBottom: '0.5rem' }}>
                      <Mail size={24} />
                    </div>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem' }}>
                      An OTP has been sent to your email. Enter the OTP to verify your identity and continue creating your password.
                    </h2>
                    <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
                      We sent a 6-digit verification code to <strong style={{ color: '#0f172a' }}>{maskedEmail}</strong>. (Expires in 5 minutes).
                    </p>
                  </div>

                  <form onSubmit={handleCreatePasswordVerifyOtpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
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
                        value={createPasswordOtp}
                        onChange={(e) => setCreatePasswordOtp(e.target.value.replace(/\D/g, ''))}
                        className="input-field"
                        style={{ width: '100%', height: '52px', fontSize: '1.5rem', fontWeight: 900, textAlign: 'center', letterSpacing: '0.6rem', background: '#f8fafc', border: '2px solid #ea580c', borderRadius: '14px', color: '#0f172a' }}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={createPasswordOtp.length !== 6 || isSubmitting}
                      className="btn btn-primary"
                      style={{ width: '100%', height: '48px', fontSize: '0.95rem', fontWeight: 800, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 4px 14px rgba(234, 88, 12, 0.35)' }}
                    >
                      {isSubmitting ? <RefreshCw size={18} className="animate-spin" /> : null}
                      {isSubmitting ? 'Verifying Code...' : 'VERIFY CODE'}
                    </button>
                  </form>

                  <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', borderTop: '1px solid #f1f5f9', paddingTop: '1.15rem' }}>
                    <button
                      type="button"
                      disabled={resendCooldown > 0 || isSubmitting}
                      onClick={() => handleCreatePasswordRequestOtpSubmit()}
                      className="btn btn-secondary"
                      style={{ width: '100%', padding: '0.65rem', fontSize: '0.82rem', fontWeight: 700 }}
                    >
                      {resendCooldown > 0 ? `Resend Code in 00:${resendCooldown < 10 ? '0' : ''}${resendCooldown}` : 'Resend Code'}
                    </button>

                    <button
                      type="button"
                      onClick={() => { setAuthFlowMode('CREATE_PASSWORD_EMAIL'); setCreatePasswordOtp(''); setLoginError(''); }}
                      style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      ← Change Email
                    </button>
                  </div>
                </>
              )}

              {/* FLOW 4: CREATE PASSWORD - STEP 3 NEW PASSWORD */}
              {authFlowMode === 'CREATE_PASSWORD_NEW' && (
                <>
                  <div style={{ marginBottom: '1.25rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem' }}>
                      Set Account Password 🔑
                    </h2>
                    <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
                      Create a strong password for <strong style={{ color: '#0f172a' }}>{createPasswordEmail}</strong>.
                    </p>
                  </div>

                  <form onSubmit={handleCreatePasswordSetPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '0.4rem' }}>
                        New Password *
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showCreatePass ? "text" : "password"}
                          required
                          autoFocus
                          placeholder="Min 8 characters"
                          value={createPasswordNewPass}
                          onChange={(e) => setCreatePasswordNewPass(e.target.value)}
                          className="input-field"
                          style={{ width: '100%', paddingLeft: '2.5rem', paddingRight: '2.5rem', fontSize: '0.95rem', background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '12px', height: '48px' }}
                        />
                        <KeyRound size={18} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                        <button
                          type="button"
                          onClick={() => setShowCreatePass(!showCreatePass)}
                          style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                        >
                          {showCreatePass ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '0.4rem' }}>
                        Confirm New Password *
                      </label>
                      <input
                        type={showCreatePass ? "text" : "password"}
                        required
                        placeholder="Re-enter password"
                        value={createPasswordConfirmPass}
                        onChange={(e) => setCreatePasswordConfirmPass(e.target.value)}
                        className="input-field"
                        style={{ width: '100%', paddingLeft: '1rem', fontSize: '0.95rem', background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '12px', height: '48px' }}
                      />
                    </div>

                    {/* LIVE PASSWORD STRENGTH METER */}
                    {createPasswordNewPass && (() => {
                      const str = getPasswordStrength(createPasswordNewPass);
                      return (
                        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.85rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', fontSize: '0.78rem', fontWeight: 800 }}>
                            <span>Password Strength:</span>
                            <span style={{ color: str.color }}>{str.label}</span>
                          </div>
                          <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden', marginBottom: '0.65rem' }}>
                            <div style={{ width: `${(str.score / 5) * 100}%`, height: '100%', background: str.color, transition: 'all 0.3s ease' }} />
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem', fontSize: '0.72rem', color: '#64748b' }}>
                            <div style={{ color: str.checks.length ? '#10b981' : '#94a3b8', fontWeight: str.checks.length ? 700 : 500 }}>
                              {str.checks.length ? '✓' : '•'} At least 8 characters
                            </div>
                            <div style={{ color: str.checks.upper ? '#10b981' : '#94a3b8', fontWeight: str.checks.upper ? 700 : 500 }}>
                              {str.checks.upper ? '✓' : '•'} Uppercase letter (A-Z)
                            </div>
                            <div style={{ color: str.checks.lower ? '#10b981' : '#94a3b8', fontWeight: str.checks.lower ? 700 : 500 }}>
                              {str.checks.lower ? '✓' : '•'} Lowercase letter (a-z)
                            </div>
                            <div style={{ color: str.checks.number ? '#10b981' : '#94a3b8', fontWeight: str.checks.number ? 700 : 500 }}>
                              {str.checks.number ? '✓' : '•'} Number (0-9)
                            </div>
                            <div style={{ color: str.checks.special ? '#10b981' : '#94a3b8', fontWeight: str.checks.special ? 700 : 500, gridColumn: 'span 2' }}>
                              {str.checks.special ? '✓' : '•'} Special character (!@#$%^&*)
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    <button
                      type="submit"
                      disabled={!createPasswordNewPass || !createPasswordConfirmPass || isSubmitting}
                      className="btn btn-primary"
                      style={{ width: '100%', height: '48px', fontSize: '0.95rem', fontWeight: 800, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 4px 14px rgba(234, 88, 12, 0.35)' }}
                    >
                      {isSubmitting ? <RefreshCw size={18} className="animate-spin" /> : null}
                      {isSubmitting ? 'Creating Password...' : 'CREATE PASSWORD'}
                    </button>
                  </form>
                </>
              )}

              {/* FLOW 5: CREATE PASSWORD - SUCCESS */}
              {authFlowMode === 'CREATE_PASSWORD_SUCCESS' && (
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#ecfdf5', border: '2px solid #a7f3d0', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#047857', marginBottom: '1rem' }}>
                    <CheckCircle2 size={36} />
                  </div>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0f172a', margin: '0 0 0.5rem' }}>
                    Password Created Successfully! 🎉
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: '#475569', margin: '0 0 1.5rem', lineHeight: 1.5 }}>
                    Your Café account password has been created and your email has been verified. You can now log in.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setAuthFlowMode('LOGIN');
                      setStudentEmail(createPasswordEmail);
                      setLoginError('');
                      setAuthSuccessMessage('');
                    }}
                    className="btn btn-primary"
                    style={{ width: '100%', height: '48px', fontSize: '0.95rem', fontWeight: 800, borderRadius: '12px' }}
                  >
                    GO TO LOGIN
                  </button>
                </div>
              )}

              {/* FLOW 6: FORGOT PASSWORD - STEP 1 EMAIL */}
              {authFlowMode === 'FORGOT_PASSWORD_EMAIL' && (
                <>
                  <div style={{ marginBottom: '1.25rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem' }}>
                      Reset Your Password 🔑
                    </h2>
                    <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
                      Enter your registered institutional email address to receive a 6-digit reset code.
                    </p>
                  </div>

                  <form onSubmit={handleForgotPasswordRequestOtpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '0.4rem' }}>
                        Registered Institutional Email
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="email"
                          required
                          autoFocus
                          placeholder="student@saec.ac.in"
                          value={forgotPasswordEmail}
                          onChange={(e) => setForgotPasswordEmail(e.target.value)}
                          className="input-field"
                          style={{ width: '100%', paddingLeft: '2.5rem', fontSize: '0.95rem', background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '12px', height: '48px' }}
                        />
                        <Mail size={18} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={!forgotPasswordEmail.trim() || isSubmitting}
                      className="btn btn-primary"
                      style={{ width: '100%', height: '48px', fontSize: '0.95rem', fontWeight: 800, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 4px 14px rgba(234, 88, 12, 0.35)' }}
                    >
                      {isSubmitting ? <RefreshCw size={18} className="animate-spin" /> : null}
                      {isSubmitting ? 'Sending Reset Code...' : 'SEND RESET CODE'}
                    </button>
                  </form>

                  <div style={{ marginTop: '1.25rem', textAlign: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                    <button
                      type="button"
                      onClick={() => { setAuthFlowMode('LOGIN'); setLoginError(''); }}
                      style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      ← Back to Login
                    </button>
                  </div>
                </>
              )}

              {/* FLOW 7: FORGOT PASSWORD - STEP 2 OTP */}
              {authFlowMode === 'FORGOT_PASSWORD_OTP' && (
                <>
                  <div style={{ marginBottom: '1.25rem', textAlign: 'center' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fff7ed', border: '2px solid #fed7aa', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c', marginBottom: '0.5rem' }}>
                      <Mail size={24} />
                    </div>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem' }}>
                      Enter Reset Verification Code
                    </h2>
                    <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
                      We sent a 6-digit reset code to <strong style={{ color: '#0f172a' }}>{maskedEmail}</strong>. (Expires in 5 minutes).
                    </p>
                  </div>

                  <form onSubmit={handleForgotPasswordVerifyOtpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
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
                        value={forgotPasswordOtp}
                        onChange={(e) => setForgotPasswordOtp(e.target.value.replace(/\D/g, ''))}
                        className="input-field"
                        style={{ width: '100%', height: '52px', fontSize: '1.5rem', fontWeight: 900, textAlign: 'center', letterSpacing: '0.6rem', background: '#f8fafc', border: '2px solid #ea580c', borderRadius: '14px', color: '#0f172a' }}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={forgotPasswordOtp.length !== 6 || isSubmitting}
                      className="btn btn-primary"
                      style={{ width: '100%', height: '48px', fontSize: '0.95rem', fontWeight: 800, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 4px 14px rgba(234, 88, 12, 0.35)' }}
                    >
                      {isSubmitting ? <RefreshCw size={18} className="animate-spin" /> : null}
                      {isSubmitting ? 'Verifying Code...' : 'VERIFY CODE'}
                    </button>
                  </form>

                  <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', borderTop: '1px solid #f1f5f9', paddingTop: '1.15rem' }}>
                    <button
                      type="button"
                      disabled={resendCooldown > 0 || isSubmitting}
                      onClick={() => handleForgotPasswordRequestOtpSubmit()}
                      className="btn btn-secondary"
                      style={{ width: '100%', padding: '0.65rem', fontSize: '0.82rem', fontWeight: 700 }}
                    >
                      {resendCooldown > 0 ? `Resend Code in 00:${resendCooldown < 10 ? '0' : ''}${resendCooldown}` : 'Resend Code'}
                    </button>

                    <button
                      type="button"
                      onClick={() => { setAuthFlowMode('FORGOT_PASSWORD_EMAIL'); setForgotPasswordOtp(''); setLoginError(''); }}
                      style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      ← Change Email
                    </button>
                  </div>
                </>
              )}

              {/* FLOW 8: FORGOT PASSWORD - STEP 3 NEW PASSWORD */}
              {authFlowMode === 'FORGOT_PASSWORD_NEW' && (
                <>
                  <div style={{ marginBottom: '1.25rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem' }}>
                      Reset Password 🔑
                    </h2>
                    <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
                      Enter a new password for <strong style={{ color: '#0f172a' }}>{forgotPasswordEmail}</strong>.
                    </p>
                  </div>

                  <form onSubmit={handleForgotPasswordSetPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '0.4rem' }}>
                        New Password *
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showForgotPass ? "text" : "password"}
                          required
                          autoFocus
                          placeholder="Min 8 characters"
                          value={forgotPasswordNewPass}
                          onChange={(e) => setForgotPasswordNewPass(e.target.value)}
                          className="input-field"
                          style={{ width: '100%', paddingLeft: '2.5rem', paddingRight: '2.5rem', fontSize: '0.95rem', background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '12px', height: '48px' }}
                        />
                        <KeyRound size={18} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                        <button
                          type="button"
                          onClick={() => setShowForgotPass(!showForgotPass)}
                          style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                        >
                          {showForgotPass ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '0.4rem' }}>
                        Confirm New Password *
                      </label>
                      <input
                        type={showForgotPass ? "text" : "password"}
                        required
                        placeholder="Re-enter new password"
                        value={forgotPasswordConfirmPass}
                        onChange={(e) => setForgotPasswordConfirmPass(e.target.value)}
                        className="input-field"
                        style={{ width: '100%', paddingLeft: '1rem', fontSize: '0.95rem', background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '12px', height: '48px' }}
                      />
                    </div>

                    {/* LIVE PASSWORD STRENGTH METER */}
                    {forgotPasswordNewPass && (() => {
                      const str = getPasswordStrength(forgotPasswordNewPass);
                      return (
                        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.85rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', fontSize: '0.78rem', fontWeight: 800 }}>
                            <span>Password Strength:</span>
                            <span style={{ color: str.color }}>{str.label}</span>
                          </div>
                          <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden', marginBottom: '0.65rem' }}>
                            <div style={{ width: `${(str.score / 5) * 100}%`, height: '100%', background: str.color, transition: 'all 0.3s ease' }} />
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem', fontSize: '0.72rem', color: '#64748b' }}>
                            <div style={{ color: str.checks.length ? '#10b981' : '#94a3b8', fontWeight: str.checks.length ? 700 : 500 }}>
                              {str.checks.length ? '✓' : '•'} At least 8 characters
                            </div>
                            <div style={{ color: str.checks.upper ? '#10b981' : '#94a3b8', fontWeight: str.checks.upper ? 700 : 500 }}>
                              {str.checks.upper ? '✓' : '•'} Uppercase letter (A-Z)
                            </div>
                            <div style={{ color: str.checks.lower ? '#10b981' : '#94a3b8', fontWeight: str.checks.lower ? 700 : 500 }}>
                              {str.checks.lower ? '✓' : '•'} Lowercase letter (a-z)
                            </div>
                            <div style={{ color: str.checks.number ? '#10b981' : '#94a3b8', fontWeight: str.checks.number ? 700 : 500 }}>
                              {str.checks.number ? '✓' : '•'} Number (0-9)
                            </div>
                            <div style={{ color: str.checks.special ? '#10b981' : '#94a3b8', fontWeight: str.checks.special ? 700 : 500, gridColumn: 'span 2' }}>
                              {str.checks.special ? '✓' : '•'} Special character (!@#$%^&*)
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    <button
                      type="submit"
                      disabled={!forgotPasswordNewPass || !forgotPasswordConfirmPass || isSubmitting}
                      className="btn btn-primary"
                      style={{ width: '100%', height: '48px', fontSize: '0.95rem', fontWeight: 800, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 4px 14px rgba(234, 88, 12, 0.35)' }}
                    >
                      {isSubmitting ? <RefreshCw size={18} className="animate-spin" /> : null}
                      {isSubmitting ? 'Resetting Password...' : 'RESET PASSWORD'}
                    </button>
                  </form>
                </>
              )}

              {/* FLOW 9: FORGOT PASSWORD - SUCCESS */}
              {authFlowMode === 'FORGOT_PASSWORD_SUCCESS' && (
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#ecfdf5', border: '2px solid #a7f3d0', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#047857', marginBottom: '1rem' }}>
                    <CheckCircle2 size={36} />
                  </div>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0f172a', margin: '0 0 0.5rem' }}>
                    Password Reset Successfully! 🎉
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: '#475569', margin: '0 0 1.5rem', lineHeight: 1.5 }}>
                    Your password has been updated. You can now log in with your new password.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setAuthFlowMode('LOGIN');
                      setStudentEmail(forgotPasswordEmail);
                      setLoginError('');
                      setAuthSuccessMessage('');
                    }}
                    className="btn btn-primary"
                    style={{ width: '100%', height: '48px', fontSize: '0.95rem', fontWeight: 800, borderRadius: '12px' }}
                  >
                    GO TO LOGIN
                  </button>
                </div>
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
            {activeTab === 'demand-forecast' && <DemandForecastView />}
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
