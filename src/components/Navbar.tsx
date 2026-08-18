import React, { useState } from 'react';
import { LogOut, Clock, ShieldCheck, ChevronDown, UserCheck } from 'lucide-react';
import type { User } from '../types';

interface NavbarProps {
  user: User | null;
  businessStatus: { is_ordering_open: boolean; message: string; status: string; opening_time: string; closing_time: string };
  onLogout: () => void;
  onSwitchRole?: (email: string, password: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, businessStatus, onLogout, onSwitchRole }) => {
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const roles = [
    { role: 'Admin (Canteen Director)', email: 'admin@saec.ac.in', pass: 'admin123', badge: 'ADMIN' },
    { role: 'Head Cashier (POS Counter)', email: 'cashier@saec.ac.in', pass: 'cashier123', badge: 'CASHIER' },
  ];

  return (
    <header style={{
      background: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      padding: '0.75rem 1.75rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)'
    }}>
      {/* Brand Title & Custom Emblem Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.95rem' }}>
        <img
          src="/saec_cafe_logo.jpg"
          alt="SAEC CAFÉ Emblem"
          style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            objectFit: 'cover',
            border: '2px solid #4f46e5',
            boxShadow: '0 4px 14px rgba(79, 70, 229, 0.2)',
            transition: 'transform 0.2s ease',
            cursor: 'pointer'
          }}
        />
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1e293b', letterSpacing: '-0.02em', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontFamily: 'Georgia, serif', fontWeight: 900, letterSpacing: '0.03em', color: '#1e293b' }}>SAEC</span>
            <span style={{ fontWeight: 800, color: '#4f46e5' }}>CAFÉ</span>
          </h1>
          <p style={{ fontSize: '0.72rem', color: '#4f46e5', margin: 0, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Good Food, Less Waiting.
          </p>
        </div>
      </div>

      {/* Operating Status Badge & Time */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.45rem 0.95rem',
          borderRadius: '9999px',
          background: businessStatus.is_ordering_open ? '#ecfdf5' : '#fef2f2',
          border: `1px solid ${businessStatus.is_ordering_open ? '#a7f3d0' : '#fecaca'}`,
          fontSize: '0.78rem',
          fontWeight: 700,
          color: businessStatus.is_ordering_open ? '#047857' : '#b91c1c',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
        }}>
          <Clock size={14} />
          {businessStatus.is_ordering_open ? (
            <span>🟢 ORDERING OPEN (10:00 AM – 3:30 PM)</span>
          ) : (
            <span>🔴 CANTEEN CLOSED ({businessStatus.status})</span>
          )}
        </div>

        {/* User Info & Interactive Role Switcher */}
        {user ? (
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                padding: '0.45rem 0.9rem',
                borderRadius: '10px',
                cursor: 'pointer',
                textAlign: 'right',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                transition: 'all 0.2s ease'
              }}
            >
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1e293b' }}>{user.full_name}</div>
                <div style={{ fontSize: '0.72rem', color: '#4f46e5', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem' }}>
                  <ShieldCheck size={12} color="#4f46e5" /> {user.role}
                </div>
              </div>
              <ChevronDown size={14} color="#64748b" />
            </button>

            {/* Quick Switch Role Dropdown Menu */}
            {showRoleMenu && (
              <div style={{
                position: 'absolute',
                top: '115%',
                right: '45px',
                width: '270px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                boxShadow: '0 10px 30px rgba(15, 23, 42, 0.12)',
                padding: '0.5rem',
                zIndex: 100
              }}>
                <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Switch Test Role
                </div>
                {roles.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setShowRoleMenu(false);
                      if (onSwitchRole) onSwitchRole(r.email, r.pass);
                    }}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      textAlign: 'left',
                      background: user.role === r.badge ? '#eef2ff' : 'transparent',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: user.role === r.badge ? 800 : 600,
                      color: user.role === r.badge ? '#4f46e5' : '#1e293b',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <span>{r.role}</span>
                    <span className={`badge ${user.role === r.badge ? 'badge-indigo' : 'badge-emerald'}`} style={{ fontSize: '0.65rem' }}>{r.badge}</span>
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={onLogout}
              title="Logout from system"
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#ef4444',
                padding: '0.55rem 0.75rem',
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.78rem',
                fontWeight: 700,
                transition: 'all 0.2s ease'
              }}
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
};
