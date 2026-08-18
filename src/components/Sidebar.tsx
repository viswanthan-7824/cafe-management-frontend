import React from 'react';
import {
  LayoutDashboard,
  Calendar,
  ShoppingCart,
  Layers,
  MessageSquareCheck,
  ShieldAlert,
  Boxes,
  TrendingUp,
  Smartphone
} from 'lucide-react';

import type { User } from '../types';

interface SidebarProps {
  user: User | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pendingTicketsCount: number;
  pendingContactCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  activeTab,
  setActiveTab,
  pendingTicketsCount,
  pendingContactCount
}) => {
  const role = user?.role || 'ADMIN';

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN'] },
    { id: 'calendar', label: 'Canteen Calendar', icon: Calendar, roles: ['ADMIN'] },
    { id: 'pos', label: 'Cashier POS Counter', icon: ShoppingCart, roles: ['ADMIN', 'CASHIER'] },
    { id: 'fcfs', label: 'FCFS Queue Board', icon: Layers, roles: ['ADMIN', 'CASHIER'] },
    { id: 'contact', label: 'Contact Orders', icon: MessageSquareCheck, badge: pendingContactCount, roles: ['ADMIN', 'CASHIER'] },
    { id: 'payment-support', label: 'Payment Support', icon: ShieldAlert, badge: pendingTicketsCount, roles: ['ADMIN'] },
    { id: 'inventory', label: 'Stock & Suppliers', icon: Boxes, roles: ['ADMIN'] },
    { id: 'forecasting', label: 'AI Demand Forecast', icon: TrendingUp, roles: ['ADMIN'] },
    { id: 'mobile-app', label: 'Mobile App Simulator', icon: Smartphone, highlight: true, roles: ['ADMIN', 'CASHIER'] },
  ].filter(item => item.roles.includes(role));

  return (
    <aside style={{
      width: '260px',
      background: '#ffffff',
      borderRight: '1px solid #e2e8f0',
      padding: '1.25rem 0.85rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.35rem',
      minHeight: 'calc(100vh - 65px)'
    }}>
      <div style={{ padding: '0.5rem 0.85rem', fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Management Platform
      </div>
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              border: isActive
                ? '1px solid #c7d2fe'
                : '1px solid transparent',
              background: isActive
                ? '#eef2ff'
                : item.highlight
                ? '#faf5ff'
                : 'transparent',
              color: isActive ? '#4f46e5' : item.highlight ? '#6b21a8' : '#64748b',
              fontWeight: isActive || item.highlight ? 800 : 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Icon size={18} color={isActive ? '#4f46e5' : item.highlight ? '#6b21a8' : '#64748b'} />
              <span>{item.label}</span>
            </div>
            {item.badge ? (
              <span style={{
                background: '#ef4444',
                color: '#ffffff',
                fontSize: '0.7rem',
                fontWeight: 800,
                padding: '0.15rem 0.45rem',
                borderRadius: '9999px'
              }}>
                {item.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </aside>
  );
};
