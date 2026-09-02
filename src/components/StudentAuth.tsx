import React, { useState } from 'react';
import { api } from '../services/api';
import type { User } from '../types';
import { CreatePasswordModal } from './CreatePasswordModal';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import {
  Coffee,
  GraduationCap,
  Briefcase,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  RefreshCw,
  Key,
  ShieldAlert
} from 'lucide-react';

interface StudentAuthProps {
  onLoginSuccess: (user: User) => void;
  onSwitchToAdmin: () => void;
}

export const StudentAuth: React.FC<StudentAuthProps> = ({ onLoginSuccess, onSwitchToAdmin }) => {
  const [selectedRole, setSelectedRole] = useState<'STUDENT' | 'FACULTY'>('STUDENT');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals
  const [showCreatePasswordModal, setShowCreatePasswordModal] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email address and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      // Replaces Flutter ApiService.loginStudentOrFaculty(email, password, role)
      const res = await api.studentPasswordLogin(email.trim(), password);
      onLoginSuccess(res.user);
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0f172a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#1e293b',
          borderRadius: '20px',
          padding: '2.25rem 2rem',
          border: '1px solid #334155',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* Logo & Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              border: '2px solid rgba(245, 158, 11, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
              color: '#f59e0b',
            }}
          >
            <Coffee size={44} />
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: '1.75rem',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '1px',
            }}
          >
            SAEC CAFÉ
          </h1>
          <p style={{ margin: '0.35rem 0 0', fontSize: '0.88rem', color: '#94a3b8' }}>
            Campus Smart Food Ordering
          </p>
        </div>

        {/* Role Selector Switcher */}
        <div
          style={{
            display: 'flex',
            backgroundColor: '#0f172a',
            borderRadius: '12px',
            padding: '4px',
            marginBottom: '1.5rem',
            border: '1px solid #334155',
          }}
        >
          <button
            type="button"
            onClick={() => setSelectedRole('STUDENT')}
            style={{
              flex: 1,
              padding: '0.7rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: selectedRole === 'STUDENT' ? '#f59e0b' : 'transparent',
              color: selectedRole === 'STUDENT' ? '#020617' : '#94a3b8',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s',
            }}
          >
            <GraduationCap size={18} />
            Student
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole('FACULTY')}
            style={{
              flex: 1,
              padding: '0.7rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: selectedRole === 'FACULTY' ? '#f59e0b' : 'transparent',
              color: selectedRole === 'FACULTY' ? '#020617' : '#94a3b8',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s',
            }}
          >
            <Briefcase size={18} />
            Faculty
          </button>
        </div>

        {/* Error Notification Banner */}
        {errorMessage && (
          <div
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#fca5a5',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              fontSize: '0.83rem',
              fontWeight: 500,
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.6rem',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '0.4rem' }}>
              Institutional Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                required
                placeholder="user@saec.ac.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  height: '48px',
                  paddingLeft: '2.5rem',
                  backgroundColor: '#0f172a',
                  border: '1.5px solid #334155',
                  borderRadius: '10px',
                  color: '#ffffff',
                  fontSize: '0.92rem',
                  outline: 'none',
                }}
              />
              <Mail size={18} color="#f59e0b" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '0.4rem' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  height: '48px',
                  paddingLeft: '2.5rem',
                  paddingRight: '2.5rem',
                  backgroundColor: '#0f172a',
                  border: '1.5px solid #334155',
                  borderRadius: '10px',
                  color: '#ffffff',
                  fontSize: '0.92rem',
                  outline: 'none',
                }}
              />
              <Lock size={18} color="#f59e0b" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <button
              type="button"
              onClick={() => setShowForgotPasswordModal(true)}
              style={{
                background: 'none',
                border: 'none',
                color: '#f59e0b',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading || !email.trim() || !password}
            style={{
              width: '100%',
              height: '48px',
              backgroundColor: '#f59e0b',
              color: '#020617',
              border: 'none',
              borderRadius: '10px',
              fontSize: '0.95rem',
              fontWeight: 800,
              letterSpacing: '1px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.25)',
            }}
          >
            {isLoading ? <RefreshCw size={18} className="animate-spin" /> : 'LOGIN'}
          </button>
        </form>

        <div style={{ margin: '1.5rem 0', height: '1px', backgroundColor: '#334155' }} />

        {/* First-time User Password Setup Button */}
        <button
          type="button"
          onClick={() => setShowCreatePasswordModal(true)}
          style={{
            width: '100%',
            height: '46px',
            backgroundColor: 'transparent',
            color: '#ffffff',
            border: '1.2px solid #f59e0b',
            borderRadius: '10px',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
          }}
        >
          <Key size={16} color="#f59e0b" />
          First-Time User? Create Password
        </button>

        {/* Switch to Admin Portal Sign-In Link */}
        <div style={{ marginTop: '1.75rem', textAlign: 'center' }}>
          <button
            type="button"
            onClick={onSwitchToAdmin}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <ShieldAlert size={14} color="#e11d48" />
            Canteen Staff or Admin? Sign in to Admin Portal
          </button>
        </div>
      </div>

      {/* Modals */}
      <CreatePasswordModal
        isOpen={showCreatePasswordModal}
        onClose={() => setShowCreatePasswordModal(false)}
      />

      <ForgotPasswordModal
        isOpen={showForgotPasswordModal}
        onClose={() => setShowForgotPasswordModal(false)}
      />
    </div>
  );
};
