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
            border: '2px solid #ea580c',
            boxShadow: '0 4px 14px rgba(234, 88, 12, 0.2)',
            transition: 'transform 0.2s ease',
            cursor: 'pointer'
          }}
        />
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1e293b', letterSpacing: '-0.02em', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontFamily: 'Georgia, serif', fontWeight: 900, letterSpacing: '0.03em', color: '#1e293b' }}>SAEC</span>
            <span style={{ fontWeight: 800, color: '#ea580c' }}>CAFÉ</span>
          </h1>
          <p style={{ fontSize: '0.72rem', color: '#ea580c', margin: 0, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Good Food, Less Waiting.
          </p>
        </div>
      </div>

      {/* Operating Status Badge & Counter Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          padding: '0.45rem 0.85rem',
          borderRadius: '9999px',
          background: '#ecfdf5',
          border: '1px solid #a7f3d0',
          fontSize: '0.75rem',
          fontWeight: 800,
          color: '#047857',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
        }}>
          <span>⚡ POS COUNTER: ACTIVE ANYTIME</span>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          padding: '0.45rem 0.85rem',
          borderRadius: '9999px',
          background: businessStatus.is_ordering_open ? '#fff7ed' : '#fef2f2',
          border: `1px solid ${businessStatus.is_ordering_open ? '#fed7aa' : '#fecaca'}`,
          fontSize: '0.75rem',
          fontWeight: 700,
          color: businessStatus.is_ordering_open ? '#c2410c' : '#b91c1c',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
        }}>
          <Clock size={13} />
          {businessStatus.is_ordering_open ? (
            <span>APP ORDERS: 10:00 AM – 3:30 PM</span>
          ) : (
            <span>APP ORDERS CLOSED</span>
          )}
        </div>
      </div>        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                padding: '0.45rem 0.9rem',
                borderRadius: '10px',
                textAlign: 'right',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem'
              }}
            >
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1e293b' }}>{user.full_name}</div>
                <div style={{ fontSize: '0.72rem', color: '#ea580c', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem' }}>
                  <ShieldCheck size={12} color="#ea580c" /> {user.role}
                </div>
              </div>
            </div>

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
    </header>
  );
};
