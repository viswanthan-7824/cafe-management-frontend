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
  BrainCircuit,
  UtensilsCrossed,
  Users,
  ShoppingBag,
  Settings,
  Sparkles
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
    { id: 'dashboard', label: 'Overview Dashboard', icon: LayoutDashboard },
    { id: 'assistant', label: 'Café Assistant ☕', icon: Sparkles },
    { id: 'pos', label: 'Manual & POS Orders', icon: ShoppingCart },
    { id: 'orders', label: 'Orders Kanban', icon: ShoppingBag },
    { id: 'fcfs', label: 'Live FCFS Queue', icon: Layers },
    { id: 'food', label: 'Product Catalog', icon: UtensilsCrossed },
    { id: 'inventory', label: 'Stock & Inventory', icon: Boxes },
    { id: 'contact', label: 'Catering & Pre-Orders', icon: MessageSquareCheck, badge: pendingContactCount },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'calendar', label: 'Working Days', icon: Calendar },
    { id: 'payment-support', label: 'Payment Reports', icon: ShieldAlert, badge: pendingTicketsCount },
    { id: 'analytics', label: 'Analytics & Reports', icon: TrendingUp },
    { id: 'settings', label: 'System Settings', icon: Settings },
  ];

  return (
    <aside
      className="perspective-container"
      style={{
        width: '265px',
        background: '#ffffff',
        borderRight: '1px solid #e2e8f0',
        padding: '1.25rem 0.85rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.4rem',
        minHeight: 'calc(100vh - 65px)',
        boxShadow: '4px 0 20px rgba(15, 23, 42, 0.03)'
      }}
    >
      <div style={{ padding: '0.5rem 0.85rem', fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Canteen Control System
      </div>
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className="btn-3d-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: '12px',
              border: isActive
                ? '1px solid #ea580c'
                : '1px solid transparent',
              background: isActive
                ? 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)'
                : 'transparent',
              color: isActive ? '#ea580c' : '#475569',
              fontWeight: isActive ? 800 : 600,
              fontSize: '0.86rem',
              cursor: 'pointer',
              transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: isActive ? '0 4px 14px rgba(234, 88, 12, 0.15)' : 'none',
              transform: isActive ? 'translateZ(10px) translateY(-1px)' : 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Icon size={18} color={isActive ? '#ea580c' : '#64748b'} />
              <span>{item.label}</span>
            </div>
            {item.badge ? (
              <span style={{
                background: '#ef4444',
                color: '#ffffff',
                fontSize: '0.7rem',
                fontWeight: 800,
                padding: '0.15rem 0.45rem',
                borderRadius: '9999px',
                boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)'
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

