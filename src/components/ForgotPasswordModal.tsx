import React, { useState } from 'react';
import { api } from '../services/api';
import {
  X,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  KeyRound
} from 'lucide-react';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'email' | 'otp' | 'newPassword' | 'success';

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState<Step>('email');

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [verificationToken, setVerificationToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleResetAndClose = () => {
    setCurrentStep('email');
    setEmail('');
    setOtp('');
    setPassword('');
    setConfirmPassword('');
    setVerificationToken('');
    setErrorMessage(null);
    setIsLoading(false);
    onClose();
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage('Please enter your registered email address.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await api.requestForgotPasswordOtp(email.trim());
      setCurrentStep('otp');
    } catch (err: any) {
      setErrorMessage(err.message || 'Account not found or inactive.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || otp.trim().length < 4) {
      setErrorMessage('Please enter the verification code sent to your email.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await api.verifyForgotPasswordOtp(email.trim(), otp.trim());
      setVerificationToken(res.verification_token);
      setCurrentStep('newPassword');
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid or expired reset code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await api.setForgotPassword(verificationToken, password, confirmPassword);
      setCurrentStep('success');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
      }}
    >
      <div
        style={{
          backgroundColor: '#1e293b',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '460px',
          padding: '1.75rem',
          border: '1px solid #334155',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          color: '#ffffff',
          position: 'relative',
        }}
      >
        {/* Header Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ padding: '8px', borderRadius: '50%', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
              <KeyRound size={20} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#ffffff' }}>
              Reset Password
            </h3>
          </div>
          <button
            onClick={handleResetAndClose}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Error Notification Alert */}
        {errorMessage && (
          <div
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#fca5a5',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              fontSize: '0.82rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.6rem',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: EMAIL */}
        {currentStep === 'email' && (
          <form onSubmit={handleRequestOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <h4 style={{ margin: '0 0 0.4rem', fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>
                Forgot Password?
              </h4>
              <p style={{ margin: 0, fontSize: '0.83rem', color: '#94a3b8', lineHeight: 1.4 }}>
                Enter your registered email address to receive a password reset verification code.
              </p>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '0.4rem' }}>
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
                    height: '46px',
                    paddingLeft: '2.5rem',
                    backgroundColor: '#0f172a',
                    border: '1.5px solid #334155',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
                <Mail size={18} color="#f59e0b" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email.trim()}
              style={{
                width: '100%',
                height: '48px',
                backgroundColor: '#f59e0b',
                color: '#020617',
                border: 'none',
                borderRadius: '10px',
                fontSize: '0.9rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              {isLoading ? <RefreshCw size={18} className="animate-spin" /> : 'SEND RESET CODE'}
            </button>
          </form>
        )}

        {/* STEP 2: OTP */}
        {currentStep === 'otp' && (
          <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <h4 style={{ margin: '0 0 0.4rem', fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>
                Enter Reset Code
              </h4>
              <p style={{ margin: 0, fontSize: '0.83rem', color: '#94a3b8', lineHeight: 1.4 }}>
                Enter the verification code sent to <strong style={{ color: '#f59e0b' }}>{email}</strong>
              </p>
            </div>

            <div>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="••••••"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                style={{
                  width: '100%',
                  height: '52px',
                  backgroundColor: '#0f172a',
                  border: '1.5px solid #334155',
                  borderRadius: '10px',
                  color: '#ffffff',
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  textAlign: 'center',
                  letterSpacing: '8px',
                  outline: 'none',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || otp.trim().length < 4}
              style={{
                width: '100%',
                height: '48px',
                backgroundColor: '#f59e0b',
                color: '#020617',
                border: 'none',
                borderRadius: '10px',
                fontSize: '0.9rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              {isLoading ? <RefreshCw size={18} className="animate-spin" /> : 'VERIFY CODE'}
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep('email')}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
            >
              <ArrowLeft size={16} /> Back to email step
            </button>
          </form>
        )}

        {/* STEP 3: NEW PASSWORD */}
        {currentStep === 'newPassword' && (
          <form onSubmit={handleSetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            <div>
              <h4 style={{ margin: '0 0 0.4rem', fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>
                Create New Password
              </h4>
              <p style={{ margin: 0, fontSize: '0.83rem', color: '#94a3b8' }}>
                Enter your new password below.
              </p>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '0.4rem' }}>
                New Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="New Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    height: '46px',
                    paddingLeft: '2.5rem',
                    paddingRight: '2.5rem',
                    backgroundColor: '#0f172a',
                    border: '1.5px solid #334155',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontSize: '0.9rem',
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

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '0.4rem' }}>
                Confirm New Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{
                    width: '100%',
                    height: '46px',
                    paddingLeft: '2.5rem',
                    paddingRight: '2.5rem',
                    backgroundColor: '#0f172a',
                    border: '1.5px solid #334155',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
                <Lock size={18} color="#f59e0b" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || password.length < 8 || password !== confirmPassword}
              style={{
                width: '100%',
                height: '48px',
                backgroundColor: '#f59e0b',
                color: '#020617',
                border: 'none',
                borderRadius: '10px',
                fontSize: '0.9rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                marginTop: '0.5rem',
              }}
            >
              {isLoading ? <RefreshCw size={18} className="animate-spin" /> : 'UPDATE PASSWORD'}
            </button>
          </form>
        )}

        {/* STEP 4: SUCCESS */}
        {currentStep === 'success' && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
              <CheckCircle2 size={44} />
            </div>

            <h4 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', fontWeight: 700, color: '#ffffff' }}>
              Password Reset Successful
            </h4>
            <p style={{ margin: '0 0 1.75rem', fontSize: '0.88rem', color: '#94a3b8', lineHeight: 1.4 }}>
              Your password has been updated successfully. You can now login with your new password.
            </p>

            <button
              onClick={handleResetAndClose}
              style={{
                width: '100%',
                height: '48px',
                backgroundColor: '#f59e0b',
                color: '#020617',
                border: 'none',
                borderRadius: '10px',
                fontSize: '0.9rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              RETURN TO LOGIN
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
