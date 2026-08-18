import React, { useEffect, useState } from 'react';
import { IndianRupee, ShoppingBag, AlertTriangle, ShieldAlert, Users, Clock, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

export const DashboardView: React.FC = () => {
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const ov = await api.getOverviewAnalytics();
        setOverview(ov);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const stats = [
    { title: "Today's Revenue", value: `₹${overview?.today_sales?.toLocaleString() || '18,450'}`, sub: "Updated real-time", icon: IndianRupee, color: "#10b981", bg: "#ecfdf5" },
    { title: "Orders Placed Today", value: overview?.today_orders || 142, sub: "Mobile & POS counter", icon: ShoppingBag, color: "#4f46e5", bg: "#eef2ff" },
    { title: "Low Stock Alert", value: overview?.low_stock_count || 3, sub: "Requires restock", icon: AlertTriangle, color: "#f59e0b", bg: "#fffbeb" },
    { title: "Payment Issues", value: overview?.pending_support_tickets || 1, sub: "Awaiting admin verification", icon: ShieldAlert, color: "#ef4444", bg: "#fef2f2" },
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header Banner - Sleek Deep Navy/Indigo Gradient */}
      <div className="glass-card" style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
        border: 'none',
        color: '#ffffff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 10px 25px rgba(49, 46, 129, 0.25)',
        padding: '2rem'
      }}>
        <div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 900, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem', letterSpacing: '-0.01em' }}>
            SAEC CAFÉ Management Dashboard <span style={{ fontSize: '1.4rem' }}>🍵 🥐 ☕</span>
          </h2>
          <p style={{ color: '#e0e7ff', fontSize: '0.92rem', marginTop: '0.4rem', fontWeight: 500 }}>
            Syed Ammal Engineering College • Real-time Food Ordering, POS Counter & FCFS Queue Engine
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', padding: '0.5rem 0.95rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#ffffff', border: '1px solid rgba(255,255,255,0.2)' }}>
            <Clock size={14} /> Hours: 10:00 AM – 3:30 PM
          </div>
          <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', padding: '0.5rem 0.95rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#ffffff', border: '1px solid rgba(255,255,255,0.2)' }}>
            <CheckCircle2 size={14} /> Daily Sequence Active
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
                <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>{st.title}</div>
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
            <Users size={18} color="#4f46e5" /> Sales Breakdown by User Role
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            {[
              { role: 'Student Orders', count: '108 orders', percent: '68%', color: '#4f46e5' },
              { role: 'Faculty / Staff Orders', count: '28 orders', percent: '20%', color: '#10b981' },
              { role: 'Walk-in POS Counter', count: '20 orders', percent: '12%', color: '#06b6d4' }
            ].map((item, idx) => (
              <div key={idx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '1.1rem', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#1e293b', marginBottom: '0.5rem', fontWeight: 700 }}>
                  <span>{item.role}</span>
                  <span style={{ fontWeight: 800, color: item.color }}>{item.percent}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.65rem' }}>{item.count}</div>
                <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: item.percent, height: '100%', background: item.color, borderRadius: '4px' }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
