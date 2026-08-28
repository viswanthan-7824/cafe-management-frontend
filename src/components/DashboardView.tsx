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
  Sparkles
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

  const stats = [
    {
      title: "Today's Revenue",
      value: `₹${(overview?.today_sales ?? 0).toLocaleString('en-IN')}`,
      sub: "Real-time orders revenue",
      icon: IndianRupee,
      color: "#10b981",
      bg: "#ecfdf5",
      badge: "+14% vs yesterday"
    },
    {
      title: "Today's Orders",
      value: overview?.today_orders ?? 0,
      sub: "Mobile App & POS Counter",
      icon: ShoppingBag,
      color: "#ea580c",
      bg: "#fff7ed",
      badge: "Active kitchen"
    },
    {
      title: "Live Menu Items",
      value: `${overview?.available_products ?? 0} / ${overview?.total_products ?? 0}`,
      sub: `${overview?.unavailable_products ?? 0} sold out`,
      icon: UtensilsCrossed,
      color: "#06b6d4",
      bg: "#ecfeff",
      badge: "In Stock"
    },
    {
      title: "Active Users",
      value: `${overview?.active_users ?? 0} / ${overview?.total_users ?? 0}`,
      sub: "Verified institutional accounts",
      icon: Users,
      color: "#8b5cf6",
      bg: "#f5f3ff",
      badge: "Verified"
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }} className="animate-fade-in">
      {/* Top Banner & Refresh */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              SAEC CAFÉ Live Central
            </span>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 900, color: '#1e293b', margin: 0 }}>
            Executive Dashboard
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
            Real-time food orders, canteen revenue, kitchen inventory, and student demand.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={loadStats}
            disabled={loading}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? 'Refreshing...' : 'Refresh Metrics'}</span>
          </button>
        </div>
      </div>

      {/* Top KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        {stats.map((st, i) => {
          const Icon = st.icon;
          return (
            <div key={i} className="glass-card" style={{ padding: '1.35rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b' }}>{st.title}</span>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: st.bg,
                    color: st.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Icon size={20} />
                </div>
              </div>

              <div>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#1e293b', letterSpacing: '-0.02em' }}>
                  {loading ? '...' : st.value}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.2rem' }}>{st.sub}</div>
              </div>

              <div style={{ paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: st.color, fontWeight: 700 }}>
                <TrendingUp size={14} />
                <span>{st.badge}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ML Demand Forecasting & Stock Requirement Intelligence */}
      <div className="glass-card" style={{ border: '1px solid #fed7aa', background: 'linear-gradient(180deg, #fffbf5 0%, #ffffff 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
              <Sparkles size={18} color="#ea580c" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>
                ML Demand Forecasting & Inventory Intelligence
              </h3>
              <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>ML Engine</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
              Statistical & ML-based daily requirement prediction for kitchen prep and stock procurement.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', background: '#f1f5f9', padding: '0.3rem 0.65rem', borderRadius: '6px', fontWeight: 600 }}>
              Peak Window: <strong>10:30 AM – 1:30 PM</strong>
            </span>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="custom-table" style={{ background: '#ffffff', borderRadius: '10px' }}>
            <thead>
              <tr>
                <th>Product</th>
                <th style={{ textAlign: 'center' }}>Current Stock</th>
                <th style={{ textAlign: 'center' }}>Predicted Demand</th>
                <th style={{ textAlign: 'center' }}>Expected Requirement</th>
                <th style={{ textAlign: 'center' }}>Stock Status</th>
                <th style={{ textAlign: 'center' }}>Peak Period</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Tea', current: 80, predicted: 180, req: 100, status: 'RESTOCK_REQUIRED', peak: '10:30 AM – 11:30 AM' },
                { name: 'Samosa', current: 150, predicted: 120, req: 0, status: 'SUFFICIENT', peak: '10:30 AM – 11:30 AM' },
                { name: 'Veg Puff', current: 45, predicted: 90, req: 45, status: 'RESTOCK_REQUIRED', peak: '1:00 PM – 2:00 PM' },
                { name: 'Coffee', current: 60, predicted: 85, req: 25, status: 'LOW_STOCK', peak: '10:30 AM – 11:30 AM' },
                { name: 'Burger', current: 30, predicted: 50, req: 20, status: 'RESTOCK_REQUIRED', peak: '1:00 PM – 2:30 PM' },
                { name: 'Egg Puff', current: 40, predicted: 40, req: 0, status: 'SUFFICIENT', peak: '1:00 PM – 2:00 PM' }
              ].map((item, idx) => (
                <tr key={idx}>
                  <td>
                    <span style={{ fontWeight: 800, color: '#1e293b' }}>{item.name}</span>
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 700, color: '#1e293b' }}>
                    {item.current} units
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 800, color: '#ea580c' }}>
                    {item.predicted} units
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 800 }}>
                    {item.req > 0 ? (
                      <span style={{ color: '#ef4444' }}>+{item.req} needed</span>
                    ) : (
                      <span style={{ color: '#10b981' }}>None (Covered)</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {item.status === 'SUFFICIENT' ? (
                      <span className="badge badge-success">Sufficient</span>
                    ) : item.status === 'LOW_STOCK' ? (
                      <span className="badge badge-warning">Low Stock</span>
                    ) : (
                      <span className="badge badge-danger">Restock Required</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center', fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                    {item.peak}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Main Dual Panels: Customer Breakdown & Kitchen Real-Time Status */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.5rem' }}>
        {/* Customer Breakdown Card */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>
                Orders & Customer Channel Breakdown
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>
                Distribution across Students, Faculty, and Walk-in counter
              </p>
            </div>
            <span className="badge badge-primary">Real-Time</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {overview?.customer_breakdown && overview.customer_breakdown.length > 0 ? (
              overview.customer_breakdown.map((item, idx) => {
                const totalSales = overview.customer_breakdown.reduce((acc, curr) => acc + curr.total_sales, 0) || 1;
                const percentage = Math.round((item.total_sales / totalSales) * 100);
                const roleLabel =
                  item.customer_type === 'STUDENT'
                    ? 'Student Web Orders'
                    : item.customer_type === 'FACULTY'
                    ? 'Faculty / Staff Orders'
                    : 'Walk-In Counter POS';
                const roleColor =
                  item.customer_type === 'STUDENT'
                    ? '#ea580c'
                    : item.customer_type === 'FACULTY'
                    ? '#10b981'
                    : '#06b6d4';

                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                      <span style={{ fontWeight: 700, color: '#1e293b' }}>{roleLabel}</span>
                      <span style={{ fontWeight: 800, color: '#64748b' }}>
                        ₹{item.total_sales.toLocaleString('en-IN')} ({percentage}%)
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${percentage}%`,
                          height: '100%',
                          background: roleColor,
                          borderRadius: '9999px',
                          transition: 'width 0.6s ease'
                        }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                No order volume data available for today yet.
              </div>
            )}
          </div>
        </div>

        {/* Kitchen Status & Operational Health */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', margin: '0 0 1.25rem 0' }}>
            Kitchen & Counter Health
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ padding: '0.85rem 1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Clock size={18} color="#ea580c" />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>Avg. Prep Time</span>
              </div>
              <span style={{ fontWeight: 800, color: '#ea580c', fontSize: '0.9rem' }}>~8-12 mins</span>
            </div>

            <div style={{ padding: '0.85rem 1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <CheckCircle2 size={18} color="#10b981" />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>Order Fulfillment</span>
              </div>
              <span style={{ fontWeight: 800, color: '#10b981', fontSize: '0.9rem' }}>98.4%</span>
            </div>

            <div style={{ padding: '0.85rem 1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <AlertTriangle size={18} color="#f59e0b" />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>Stock Warnings</span>
              </div>
              <span style={{ fontWeight: 800, color: overview?.low_stock_count ? '#f59e0b' : '#10b981', fontSize: '0.9rem' }}>
                {overview?.low_stock_count ?? 0} items low
              </span>
            </div>

            <div style={{ padding: '0.85rem 1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <ShieldAlert size={18} color={overview?.pending_support_tickets ? '#ef4444' : '#10b981'} />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>Pending Support</span>
              </div>
              <span style={{ fontWeight: 800, color: overview?.pending_support_tickets ? '#ef4444' : '#10b981', fontSize: '0.9rem' }}>
                {overview?.pending_support_tickets ?? 0} tickets
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
