import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { CalendarManager } from './components/CalendarManager';
import { PosView } from './components/PosView';
import { FcfsQueueView } from './components/FcfsQueueView';
import { ContactOrdersView } from './components/ContactOrdersView';
import { PaymentSupportView } from './components/PaymentSupportView';
import { InventoryView } from './components/InventoryView';
import { ForecastingView } from './components/ForecastingView';
import { api, setAuthToken } from './services/api';
import type { User } from './types';
import { LogIn, Shield, UserCheck, ShoppingBag, Smartphone, Layers, Lock, AlertCircle, ArrowRight } from 'lucide-react';

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
  const [email, setEmail] = useState('admin@saec.ac.in');
  const [password, setPassword] = useState('admin123');
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadStatus();
    // Default auto-login as Admin for instant demonstration
    handleLogin('admin@saec.ac.in', 'admin123');
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
    setActiveTab('dashboard');
  };

  // If user is logged out, show dedicated Modern Login & Role Selection Portal
  if (!user) {
    const demoRoles = [
      { name: 'Canteen Admin / Director', email: 'admin@saec.ac.in', pass: 'admin123', role: 'ADMIN', icon: Shield, desc: 'Full Dashboard, Calendar, Inventory & Analytics', color: '#ea580c', bg: '#fff7ed' },
      { name: 'Head POS Cashier', email: 'cashier@saec.ac.in', pass: 'cashier123', role: 'CASHIER', icon: ShoppingBag, desc: 'Counter Sales, FCFS Kitchen Queue & Contact Orders', color: '#059669', bg: '#ecfdf5' },
    ];

    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #431407 50%, #0f172a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ maxWidth: '1050px', width: '100%', background: '#ffffff', borderRadius: '24px', boxShadow: '0 25px 60px rgba(0,0,0,0.3)', overflow: 'hidden', display: 'grid', gridTemplateColumns: '1.2fr 1fr' }}>
          
          {/* Left Column: Quick Role Demo Selection */}
          <div style={{ padding: '2.5rem', background: '#f8fafc', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.5rem' }}>
                <img
                  src="/saec_cafe_logo.jpg"
                  alt="SAEC CAFÉ Logo"
                  style={{ width: '56px', height: '56px', borderRadius: '50%', border: '2px solid #ea580c', boxShadow: '0 4px 14px rgba(234, 88, 12, 0.25)', objectFit: 'cover' }}
                />
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1e293b', margin: 0 }}>
                    SAEC <span style={{ color: '#ea580c' }}>CAFÉ</span>
                  </h2>
                  <p style={{ fontSize: '0.75rem', color: '#ea580c', fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Good Food, Less Waiting.
                  </p>
                </div>
              </div>

              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.35rem' }}>
                Select a Role for Instant Demonstration
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1.25rem' }}>
                Click any persona below to test role-based permissions and access controls:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {demoRoles.map((r, idx) => {
                  const Icon = r.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleLogin(r.email, r.pass)}
                      disabled={isSubmitting}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '0.85rem 1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = r.color;
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#e2e8f0';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: r.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon size={20} color={r.color} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1e293b' }}>{r.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{r.desc}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="badge" style={{ background: r.bg, color: r.color, fontSize: '0.65rem' }}>{r.role}</span>
                        <ArrowRight size={16} color={r.color} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>
              Syed Ammal Engineering College • Canteen Automation System
            </div>
          </div>

          {/* Right Column: Custom Email / Password Login Form */}
          <div style={{ padding: '3rem 2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#1e293b', margin: 0 }}>
                Sign In
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.35rem' }}>
                Enter institutional email & password to access your portal.
              </p>
            </div>

            {loginError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#b91c1c', fontSize: '0.82rem', marginBottom: '1.25rem', fontWeight: 600 }}>
                <AlertCircle size={18} />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.4rem' }}>
                  College Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="e.g. admin@saec.ac.in"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      fontSize: '0.9rem',
                      color: '#1e293b',
                      fontWeight: 600,
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.4rem' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter password"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      fontSize: '0.9rem',
                      color: '#1e293b',
                      fontWeight: 600,
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.85rem', fontSize: '0.95rem', marginTop: '0.5rem' }}
              >
                <LogIn size={18} /> {isSubmitting ? 'Verifying Credentials...' : 'Sign In to SAEC CAFÉ'}
              </button>
            </form>

            <div style={{ marginTop: '2rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.78rem', color: '#64748b' }}>
              <div style={{ fontWeight: 800, color: '#1e293b', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Lock size={14} color="#ea580c" /> Security & Role Information
              </div>
              Role-Based Access Control (RBAC) securely restricts admin, cashier POS, and student functions.
            </div>
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
        return ['pos', 'fcfs', 'contact'].includes(tab);
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
          {safeTab === 'calendar' && <CalendarManager />}
          {safeTab === 'pos' && <PosView />}
          {safeTab === 'fcfs' && <FcfsQueueView />}
          {safeTab === 'contact' && <ContactOrdersView />}
          {safeTab === 'payment-support' && <PaymentSupportView />}
          {safeTab === 'inventory' && <InventoryView />}
          {safeTab === 'forecasting' && <ForecastingView />}
        </main>
      </div>
    </div>
  );
}

export default App;
