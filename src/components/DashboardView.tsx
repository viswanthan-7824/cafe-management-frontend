import React, { useEffect, useState } from 'react';
import {
  IndianRupee,
  ShoppingBag,
  AlertTriangle,
  ShieldAlert,
  Users,
  UtensilsCrossed,
  RefreshCw,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowRight,
  Coffee,
  Sparkles,
  Layers,
  ChefHat
} from 'lucide-react';
import { api } from '../services/api';
import type { AnalyticsOverview } from '../types';

export const DashboardView: React.FC = () => {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [realtimeData, setRealtimeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 5000);
    return () => clearInterval(interval);
  }, []);

  async function loadStats() {
    setLoading(true);
    try {
      const ov = await api.getOverviewAnalytics();
      setOverview(ov);

      const rt = await api.getRealtimeQueueSync();
      if (rt) setRealtimeData(rt);
    } catch (e) {
      console.error('Error fetching dashboard stats:', e);
    } finally {
      setLoading(false);
    }
  }

  const counters = realtimeData?.counters || {};

  const kpis = [
    {
      title: "Today's Orders",
      value: counters.total_today ?? overview?.today_orders ?? 0,
      sub: "Total placed orders today",
      icon: ShoppingBag,
      color: "#ea580c",
      bg: "#fff7ed",
      badge: "Real-time"
    },
    {
      title: "Today's Revenue",
      value: `₹${(overview?.today_sales ?? 0).toLocaleString('en-IN')}`,
      sub: "Verified counter payments",
      icon: IndianRupee,
      color: "#10b981",
      bg: "#ecfdf5",
      badge: "PostgreSQL DB"
    },
    {
      title: "Completed Orders",
      value: counters.completed ?? 0,
      sub: "Delivered & picked up",
      icon: CheckCircle2,
      color: "#059669",
      bg: "#ecfdf5",
      badge: "Finished"
    },
    {
      title: "Preparing in Kitchen",
      value: counters.preparing ?? 0,
      sub: "Food under preparation",
      icon: ChefHat,
      color: "#2563eb",
      bg: "#eff6ff",
      badge: "Kitchen"
    },
    {
      title: "Pending Payment",
      value: counters.pending_payment ?? 0,
      sub: "Awaiting counter verification",
      icon: ShieldAlert,
      color: "#d97706",
      bg: "#fffbeb",
      badge: "Verification"
    },
    {
      title: "Low Stock Items",
      value: overview?.low_stock_count ?? 0,
      sub: "Reorder threshold alert",
      icon: AlertTriangle,
      color: "#ef4444",
      bg: "#fef2f2",
      badge: "Inventory"
    }
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
      <div
        className="glass-card"
        style={{
          padding: '1.5rem 2rem',
          background: 'linear-gradient(135deg, #ffffff 0%, #fff7ed 100%)',
          border: '1px solid #fed7aa',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#ea580c', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(234, 88, 12, 0.3)' }}>
            <Coffee size={26} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Good morning, Admin • SAEC CAFÉ Operations
            </h1>
            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>
              Real-time FCFS queue monitoring, counter payment verification & ML demand forecasting.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', padding: '0.4rem 0.85rem', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 800 }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
            🟢 CANTEEN OPEN
          </div>
          <button onClick={loadStats} className="btn btn-secondary" style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1.35rem' }}>
        {kpis.map((kpi, idx) => {
          const IconComp = kpi.icon;
          return (
            <div
              key={idx}
              className="card-3d glass-card"
              onMouseMove={(e) => {
                if (window.innerWidth < 768) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                e.currentTarget.style.setProperty('--rx', `${-y / 15}deg`);
                e.currentTarget.style.setProperty('--ry', `${x / 15}deg`);
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.setProperty('--rx', '0deg');
                e.currentTarget.style.setProperty('--ry', '0deg');
              }}
              style={{
                padding: '1.35rem',
                borderRadius: '20px',
                border: '1px solid #e2e8f0',
                background: '#ffffff'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
                <div
                  className="card-3d-image-box"
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '14px',
                    background: kpi.bg,
                    color: kpi.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                  }}
                >
                  <IconComp size={24} />
                </div>
                <span className="badge badge-neutral card-3d-badge" style={{ fontSize: '0.68rem', fontWeight: 800 }}>{kpi.badge}</span>
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#1e293b', lineHeight: 1.1 }}>
                {kpi.value}
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#475569', marginTop: '0.35rem' }}>
                {kpi.title}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                {kpi.sub}
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Kitchen Queue Snapshot */}
      <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={20} color="#ea580c" /> FCFS Live Kitchen Queue Snapshot
            </h2>
            <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>
              First-Come First-Served queue ordering based on verified payment timestamp.
            </p>
          </div>
          <span className="badge badge-primary">
            {realtimeData?.queue_length ?? 0} Orders in Queue
          </span>
        </div>

        {realtimeData?.queue_orders?.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', fontSize: '0.85rem' }}>
            🟢 No active orders in kitchen preparation queue right now.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
            {realtimeData?.queue_orders?.slice(0, 6).map((order: any, idx: number) => (
              <div key={order.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span style={{ fontWeight: 900, fontSize: '0.9rem', color: '#ea580c' }}>
                    #{order.order_number}
                  </span>
                  <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                    Pos #{idx + 1}
                  </span>
                </div>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1e293b' }}>
                  {order.user?.full_name || 'Walk-In Customer'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.25rem 0 0.65rem 0' }}>
                  {order.items?.length || 0} items • ₹{order.total_amount}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className={`badge ${order.status === 'PREPARING' ? 'badge-info' : 'badge-primary'}`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
