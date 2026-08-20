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
import { LogIn, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [businessStatus, setBusinessStatus] = useState<any>({
    is_ordering_open: true,
    message: '🟢 ORDERING OPEN',
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
      
      // Enforce Web Role Gate: Only ADMIN and CASHIER are permitted on Web Portal
      if (u.role !== 'ADMIN' && u.role !== 'CASHIER') {
        setAuthToken(null);
        setUser(null);
        setLoginError('Access Denied: The Web Management Portal is exclusively for Admin and Cashier staff. Students and Faculty must use the SAEC Cafe Mobile App.');
        return;
      }

      setUser(u);
      setLoginError('');
      
      // Role-based landing page routing
      if (u.role === 'CASHIER') {
        setActiveTab('pos');
      } else {
        setActiveTab('dashboard');
      }
    } catch (e: any) {
      setLoginError(e.message || 'Invalid email or password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    setAuthToken(null);
    setUser(null);
    setEmail('');
    setPassword('');
    setActiveTab('dashboard');
  };

  // If user is logged out, show dedicated Modern Login Portal
  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #431407 50%, #0f172a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ maxWidth: '480px', width: '100%', background: '#ffffff', borderRadius: '24px', boxShadow: '0 25px 60px rgba(0,0,0,0.3)', overflow: 'hidden', padding: '3rem 2.5rem' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <img
                src="/saec_cafe_logo.jpg"
                alt="SAEC CAFÉ Logo"
                style={{ width: '64px', height: '64px', borderRadius: '50%', border: '3px solid #ea580c', boxShadow: '0 6px 18px rgba(234, 88, 12, 0.25)', objectFit: 'cover' }}
              />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#1e293b', margin: 0, letterSpacing: '-0.02em' }}>
              SAEC <span style={{ color: '#ea580c' }}>CAFÉ</span>
            </h1>
            <p style={{ fontSize: '0.8rem', color: '#ea580c', fontWeight: 800, margin: '0.35rem 0 0 0', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Good Food, Less Waiting.
            </p>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem' }}>
              Management Portal • Sign In
            </p>
          </div>

          {loginError && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#b91c1c', fontSize: '0.82rem', marginBottom: '1.25rem', fontWeight: 600 }}>
              <AlertCircle size={18} />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.4rem' }}>
                Institutional Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@saec.ac.in or cashier@saec.ac.in"
                style={{
                  width: '100%',
                  padding: '0.8rem 1rem',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  fontSize: '0.9rem',
                  color: '#1e293b',
                  fontWeight: 600,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.4rem' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  style={{
                    width: '100%',
                    padding: '0.8rem 2.5rem 0.8rem 1rem',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    fontSize: '0.9rem',
                    color: '#1e293b',
                    fontWeight: 600,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.9rem', fontSize: '0.95rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              <LogIn size={18} /> {isSubmitting ? 'Verifying Credentials...' : 'Sign In to Portal'}
            </button>
          </form>

          <div style={{ marginTop: '1.75rem', padding: '0.85rem 1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.78rem', color: '#64748b' }}>
            <div style={{ fontWeight: 800, color: '#1e293b', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Lock size={14} color="#ea580c" /> Role-Based Access Control
            </div>
            Web portal is restricted to authorized Admin and Cashier accounts.
          </div>

          <div style={{ marginTop: '1.5rem', fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center' }}>
            Syed Ammal Engineering College • C++ Cafe Canteen
          </div>
        </div>
      </div>
    );
  }

  // Permitted view tabs based on role
  const isTabAllowed = (tab: string, role: string) => {
    switch (role) {
      case 'ADMIN':
        return true;
      case 'CASHIER':
        return ['pos', 'orders', 'fcfs', 'contact'].includes(tab);
      default:
        return false;
    }
  };

  const safeTab = isTabAllowed(activeTab, user.role) ? activeTab : (user.role === 'CASHIER' ? 'pos' : 'dashboard');

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#1e293b' }}>
      <Navbar user={user} businessStatus={businessStatus} onLogout={handleLogout} onSwitchRole={(e, p) => handleLogin(e, p)} />

      <div style={{ display: 'flex' }}>
        <Sidebar
          user={user}
          activeTab={safeTab}
          setActiveTab={setActiveTab}
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
    </div>
  );
}

export default App;
