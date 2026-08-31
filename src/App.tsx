import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';

// Code-split dynamic lazy imports for Admin Portal views
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
const CafeAssistantView = lazy(() => import('./components/CafeAssistantView').then(m => ({ default: m.CafeAssistantView })));

import { api, setAuthToken } from './services/api';
import type { User } from './types';
import {
  LogIn,
  AlertCircle,
  Eye,
  EyeOff,
  Mail,
  Shield,
  RefreshCw,
  Lock
} from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [user, setUser] = useState<User | null>(null);

  const [businessStatus, setBusinessStatus] = useState<any>({
    is_ordering_open: true,
    message: '🟢 SAEC CAFÉ • Ordering Open (10:00 AM – 3:30 PM)',
    status: 'WORKING_DAY',
    opening_time: '10:00',
    closing_time: '15:30'
  });

  // Admin Login State
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    loadStatus();
    checkCurrentUser();
  }, []);

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
          if (userData.role === 'ADMIN') {
            setUser(userData);
            setActiveTab('dashboard');
          } else {
            // Non-admin user tried to log into Web Portal
            setAuthToken(null);
            setUser(null);
            setLoginError('Access Restricted. Web portal is for Canteen Administration only. Please use the SAEC CAFÉ Mobile Application for Student & Faculty ordering.');
          }
        } else {
          setAuthToken(null);
        }
      } catch (e) {
        // backend unreachable
      }
    }
  }

  const handleAdminPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail.trim() || !adminPassword || isSubmitting) return;

    setIsSubmitting(true);
    setLoginError('');

    try {
      const res = await api.adminLogin(adminEmail.trim(), adminPassword);
      if (res.user.role === 'ADMIN') {
        setUser(res.user);
        setActiveTab('dashboard');
      } else {
        setAuthToken(null);
        setUser(null);
        setLoginError('Access Restricted. Web portal is for Canteen Administration only. Please use the SAEC CAFÉ Mobile Application.');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Invalid administrator credentials. Please check your email and password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    setAuthToken(null);
    setUser(null);
    setShowLogoutConfirm(false);
    setAdminEmail('');
    setAdminPassword('');
    setLoginError('');
  };

  // 1. UNAUTHENTICATED ADMIN LOGIN SCREEN (WEB IS ADMIN ONLY)
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
        {/* Floating Ambient Background Lights */}
        <div style={{ position: 'absolute', top: '10%', left: '15%', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(225,29,72,0.25) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '15%', width: '350px', height: '350px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(234,88,12,0.2) 0%, transparent 70%)', filter: 'blur(50px)' }} />

        <div
          className="card-3d ultra-3d-portal-box animate-fade-in"
          style={{
            width: '100%',
            maxWidth: '440px',
            padding: '2.5rem 2rem',
            borderRadius: '24px',
            background: 'rgba(255, 255, 255, 0.96)',
            border: '1.5px solid rgba(225, 29, 72, 0.3)',
            boxShadow: '0 30px 80px rgba(0, 0, 0, 0.5)'
          }}
        >
          {/* Header Logo & Branding */}
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <div className="ultra-3d-logo-ring" style={{ marginBottom: '1rem' }}>
              <img
                src="/saec_cafe_logo.jpg"
                alt="SAEC CAFÉ Logo"
                className="ultra-3d-logo-img"
              />
            </div>
            <h1 style={{ fontSize: '2.1rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.03em' }}>
              SAEC <span style={{ color: '#e11d48', textShadow: '0 4px 12px rgba(225, 29, 72, 0.3)' }}>CAFÉ</span>
            </h1>
            <p style={{ fontSize: '0.78rem', color: '#e11d48', fontWeight: 900, margin: '0.25rem 0 0 0', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              ADMINISTRATOR WEB PORTAL
            </p>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.35rem 0 0', fontWeight: 600 }}>
              Canteen Management & Operations Hub
            </p>
          </div>

          {/* Feedback Alerts */}
          {loginError && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: '12px', fontSize: '0.82rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{loginError}</span>
            </div>
          )}

          {/* ADMIN LOGIN FORM */}
          <form onSubmit={handleAdminPasswordLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '0.4rem' }}>
                Administrator Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  required
                  autoFocus
                  placeholder="Enter admin email address"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
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
                  type={showAdminPassword ? "text" : "password"}
                  required
                  placeholder="Enter administrator password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', paddingLeft: '2.5rem', paddingRight: '2.5rem', fontSize: '0.95rem', background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '12px', height: '48px' }}
                />
                <Lock size={18} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <button
                  type="button"
                  onClick={() => setShowAdminPassword(!showAdminPassword)}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
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
                background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
                boxShadow: '0 4px 14px rgba(225, 29, 72, 0.35)'
              }}
            >
              {isSubmitting ? <RefreshCw size={18} className="animate-spin" /> : <Shield size={18} />}
              {isSubmitting ? 'Authenticating...' : 'SIGN IN TO ADMIN PORTAL'}
            </button>
          </form>

          <div style={{ marginTop: '1.75rem', fontSize: '0.75rem', color: '#64748b', textAlign: 'center', lineHeight: 1.4 }}>
            📱 <strong>Student or Faculty?</strong> Please use the <strong>SAEC CAFÉ Mobile Application</strong> for food ordering and live queue tracking.
          </div>

          <div style={{ marginTop: '1rem', fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center' }}>
            Syed Ammal Engineering College • Canteen Automation System
          </div>
        </div>
      </div>
    );
  }

  // 2. AUTHENTICATED ADMIN MANAGEMENT PORTAL
  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-main)' }}>
      {/* Admin Sidebar Navigation */}
      <Sidebar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingTicketsCount={0}
        pendingContactCount={0}
      />

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh', overflow: 'hidden' }}>
        {/* Admin Navbar */}
        <Navbar
          user={user}
          businessStatus={businessStatus}
          onLogout={() => setShowLogoutConfirm(true)}
        />

        {/* Dynamic View Content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem' }}>
          <Suspense
            fallback={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid #fca5a5', borderTopColor: '#e11d48', animation: 'spin 0.8s linear infinite' }} />
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#64748b' }}>Loading View Module...</div>
                </div>
              </div>
            }
          >
            {activeTab === 'dashboard' && <DashboardView />}
            {activeTab === 'food-management' && <FoodManagementView />}
            {activeTab === 'users' && <UserManagementView />}
            {activeTab === 'orders' && <OrderManagementView />}
            {activeTab === 'fcfs-queue' && <FcfsQueueView />}
            {activeTab === 'inventory' && <InventoryView />}
            {activeTab === 'analytics' && <AnalyticsView />}
            {activeTab === 'assistant' && <CafeAssistantView />}
            {activeTab === 'calendar' && <CalendarManager />}
            {activeTab === 'pos' && <PosView />}
            {activeTab === 'contact-orders' && <ContactOrdersView />}
            {activeTab === 'payment-support' && <PaymentSupportView />}
            {activeTab === 'settings' && <SystemSettingsView />}
          </Suspense>
        </main>
      </div>

      {/* Admin Logout Confirmation Modal */}
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
                background: '#ffe4e6',
                color: '#e11d48',
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
              Are you sure you want to log out of SAEC CAFÉ Admin Portal?
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
                style={{ flex: 1, fontWeight: 700, background: '#e11d48' }}
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

