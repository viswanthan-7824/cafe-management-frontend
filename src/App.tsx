import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { StudentAuth } from './components/StudentAuth';
import { StudentOrderingView } from './components/StudentOrderingView';

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

import { api, setAuthToken, API_BASE_URL } from './services/api';
import type { User } from './types';
import {
  LogIn,
  AlertCircle,
  Eye,
  EyeOff,
  Mail,
  Shield,
  RefreshCw,
  Lock,
  ArrowLeft,
  Coffee
} from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [authPortal, setAuthPortal] = useState<'STUDENT' | 'ADMIN'>('STUDENT');

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
        const res = await fetch(`${API_BASE_URL}/auth/profile/`, {
          headers: { Authorization: `Bearer ${savedToken}` }
        });
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
          if (userData.role === 'ADMIN') {
            setActiveTab('dashboard');
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
        setLoginError('Access Restricted. This login screen is for Canteen Administration only.');
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
  };

  // 1. UNAUTHENTICATED USER LOGIN ROUTING
  if (!user) {
    if (authPortal === 'STUDENT') {
      return (
        <StudentAuth
          onLoginSuccess={(loggedUser) => setUser(loggedUser)}
          onSwitchToAdmin={() => setAuthPortal('ADMIN')}
        />
      );
    }

    // Admin Login Screen
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: '1.5rem', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ width: '100%', maxWidth: '440px', background: '#ffffff', borderRadius: '24px', padding: '2.5rem', boxShadow: '0 25px 60px rgba(0,0,0,0.3)', border: '1px solid #e2e8f0' }}>
          
          <button
            onClick={() => setAuthPortal('STUDENT')}
            style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1.5rem' }}
          >
            <ArrowLeft size={16} /> Back to Student / Faculty Portal
          </button>

          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ width: '68px', height: '68px', borderRadius: '20px', background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', boxShadow: '0 10px 25px rgba(225, 29, 72, 0.35)' }}>
              <Shield size={34} />
            </div>
            <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 800, color: '#e11d48', letterSpacing: '0.12em' }}>
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

          <div style={{ marginTop: '1.5rem', fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center' }}>
            Syed Ammal Engineering College • Canteen Automation System
          </div>
        </div>
      </div>
    );
  }

  // 2. AUTHENTICATED STUDENT / FACULTY PORTAL
  if (user.role === 'STUDENT' || user.role === 'FACULTY') {
    return (
      <StudentOrderingView
        user={user}
        businessStatus={businessStatus}
        onLogout={handleLogout}
      />
    );
  }

  // 3. AUTHENTICATED ADMIN MANAGEMENT PORTAL
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
