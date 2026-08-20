import React, { useEffect, useState } from 'react';
import {
  IndianRupee,
  ShoppingBag,
  AlertTriangle,
  ShieldAlert,
  Users,
  Clock,
  CheckCircle2,
  UtensilsCrossed,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import type { AnalyticsOverview } from '../types';

export const DashboardView: React.FC = () => {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    setLoading(true);
    try {
      const ov = await api.getOverviewAnalytics();
      setOverview(ov);
    } catch (e) {
      console.error('Error fetching dashboard overview stats:', e);
    } finally {
      setLoading(false);
    }
  }

  const roleColorMap: Record<string, string> = {
    STUDENT: '#ea580c',
    FACULTY: '#10b981',
    WALK_IN: '#06b6d4'
  };

  const roleLabelMap: Record<string, string> = {
    STUDENT: 'Student Mobile Orders',
    FACULTY: 'Faculty / Staff Orders',
    WALK_IN: 'Walk-in POS Counter'
  };

  const totalBreakdownSales = overview?.customer_breakdown?.reduce((acc, curr) => acc + curr.total_sales, 0) || 1;

  const stats = [
    {
      title: "Today's Revenue",
      value: `₹${(overview?.today_sales ?? 0).toLocaleString()}`,
      sub: "PostgreSQL real-time sales",
      icon: IndianRupee,
      color: "#10b981",
      bg: "#ecfdf5"
    },
    {
      title: "Today's Orders",
      value: overview?.today_orders ?? 0,
      sub: "Mobile & POS Counter",
      icon: ShoppingBag,
      color: "#ea580c",
      bg: "#fff7ed"
    },
    {
      title: "Available Food Items",
      value: `${overview?.available_products ?? 0} / ${overview?.total_products ?? 0}`,
      sub: `${overview?.unavailable_products ?? 0} marked unavailable`,
      icon: UtensilsCrossed,
      color: "#06b6d4",
      bg: "#ecfeff"
    },
    {
      title: "Low / Out of Stock",
      value: `${overview?.low_stock_count ?? 0} / ${overview?.out_of_stock_count ?? 0}`,
      sub: "Requires kitchen restock",
      icon: AlertTriangle,
      color: "#f59e0b",
      bg: "#fffbeb"
    },
    {
      title: "Registered Users",
      value: `${overview?.active_users ?? 0} / ${overview?.total_users ?? 0}`,
      sub: "Active accounts",
      icon: Users,
      color: "#8b5cf6",
      bg: "#f5f3ff"
    },
    {
      title: "Pending Support",
      value: overview?.pending_support_tickets ?? 0,
      sub: "Awaiting admin action",
      icon: ShieldAlert,
      color: overview?.pending_support_tickets ? "#ef4444" : "#10b981",
      bg: overview?.pending_support_tickets ? "#fef2f2" : "#ecfdf5"
    },
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header Banner */}
      <div className="glass-card" style={{
        background: 'linear-gradient(135deg, #9a3412 0%, #c2410c 45%, #ea580c 100%)',
        border: 'none',
        color: '#ffffff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 10px 25px rgba(234, 88, 12, 0.25)',
        padding: '2rem'
      }}>
        <div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 900, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem', letterSpacing: '-0.01em' }}>
            SAEC CAFÉ Management Dashboard <span style={{ fontSize: '1.4rem' }}>🍵 🥐 ☕</span>
          </h2>
          <p style={{ color: '#ffedd5', fontSize: '0.92rem', marginTop: '0.4rem', fontWeight: 500 }}>
            Syed Ammal Engineering College • Real-time Food Ordering, POS Counter & FCFS Queue Engine
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={loadStats}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: '#ffffff',
              padding: '0.5rem 0.85rem',
              borderRadius: '9999px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.8rem',
              fontWeight: 700
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', padding: '0.5rem 0.95rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#ffffff', border: '1px solid rgba(255,255,255,0.2)' }}>
            <Clock size={14} /> Hours: 10:00 AM – 3:30 PM
          </div>
          <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', padding: '0.5rem 0.95rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#ffffff', border: '1px solid rgba(255,255,255,0.2)' }}>
            <CheckCircle2 size={14} /> PostgreSQL Live
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        {stats.map((st, i) => {
          const Icon = st.icon;
          return (
            <div key={i} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.4rem' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: st.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={26} color={st.color} />
              </div>
              <div>
                <div style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 700 }}>{st.title}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1e293b', margin: '0.15rem 0' }}>{st.value}</div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{st.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Customer Breakdown Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
        <div className="glass-card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={18} color="#ea580c" /> Sales Breakdown by Customer Role
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            {overview?.customer_breakdown && overview.customer_breakdown.length > 0 ? (
              overview.customer_breakdown.map((item, idx) => {
                const color = roleColorMap[item.customer_type] || '#64748b';
                const label = roleLabelMap[item.customer_type] || item.customer_type;
                const percentage = Math.round((item.total_sales / totalBreakdownSales) * 100);

                return (
                  <div key={idx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '1.1rem', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#1e293b', marginBottom: '0.5rem', fontWeight: 700 }}>
                      <span>{label}</span>
                      <span style={{ fontWeight: 800, color: color }}>₹{item.total_sales.toLocaleString()} ({percentage}%)</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.65rem' }}>{item.count} orders placed</div>
                    <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, percentage)}%`, height: '100%', background: color, borderRadius: '4px' }}></div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ color: '#94a3b8', padding: '1rem' }}>No customer sales data available yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
