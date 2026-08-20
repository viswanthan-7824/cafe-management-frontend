import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  IndianRupee,
  ShoppingBag,
  Clock,
  PieChart as PieChartIcon,
  Calendar,
  CheckCircle2,
  AlertCircle,
  XCircle,
  RefreshCw,
  Award,
  Layers
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { api } from '../services/api';
import type { AnalyticsDashboardData } from '../types';

const COLORS = ['#ea580c', '#10b981', '#06b6d4', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];

export const AnalyticsView: React.FC = () => {
  const [range, setRange] = useState<string>('7days');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [data, setData] = useState<AnalyticsDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [range]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAnalyticsDashboard(
        range,
        range === 'custom' ? startDate : undefined,
        range === 'custom' ? endDate : undefined
      );
      if (res) {
        setData(res);
      } else {
        setError('Failed to load analytics data from server');
      }
    } catch (e: any) {
      setError(e.message || 'Error fetching analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      alert('Please select both start and end dates');
      return;
    }
    fetchAnalytics();
  };

  const filterOptions = [
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: '7days', label: 'Last 7 Days' },
    { id: '30days', label: 'Last 30 Days' },
    { id: 'this_month', label: 'This Month' },
    { id: 'custom', label: 'Custom Range' },
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header Banner */}
      <div className="glass-card" style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: '#ffffff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1.75rem 2rem',
        border: '1px solid #334155'
      }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <TrendingUp size={24} color="#ea580c" /> SAEC CAFÉ Authoritative PostgreSQL Analytics
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginTop: '0.35rem' }}>
            Authoritative sales, revenue, product demand & ordering trends computed directly from PostgreSQL database.
          </p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="btn btn-secondary"
          style={{ background: '#334155', color: '#ffffff', border: '1px solid #475569', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1rem' }}
          disabled={loading}
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Refreshing...' : 'Refresh Metrics'}
        </button>
      </div>

      {/* Filter Controls Bar */}
      <div className="glass-card" style={{ padding: '1.1rem 1.4rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.35rem', marginRight: '0.4rem' }}>
            <Calendar size={15} color="#ea580c" /> Timeframe:
          </span>
          {filterOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setRange(opt.id)}
              className={`btn ${range === opt.id ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', borderRadius: '8px' }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {range === 'custom' && (
          <form onSubmit={handleCustomFilterSubmit} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
            />
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
              Apply Range
            </button>
          </form>
        )}

        {data?.date_range && (
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>
            Active Range: <span style={{ color: '#ea580c' }}>{data.date_range.start_date}</span> to <span style={{ color: '#ea580c' }}>{data.date_range.end_date}</span>
          </div>
        )}
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '1rem', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.2rem' }}>
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 700 }}>GROSS REVENUE</div>
              <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#10b981', margin: '0.2rem 0' }}>
                ₹{data?.summary.total_revenue?.toLocaleString() ?? 0}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Authoritative PostgreSQL Sum</div>
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IndianRupee size={22} color="#10b981" />
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 700 }}>TOTAL ORDERS</div>
              <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#ea580c', margin: '0.2rem 0' }}>
                {data?.summary.total_orders ?? 0}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{data?.summary.paid_orders ?? 0} Paid Orders</div>
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag size={22} color="#ea580c" />
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 700 }}>AVG ORDER VALUE</div>
              <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#06b6d4', margin: '0.2rem 0' }}>
                ₹{data?.summary.average_order_value ?? 0}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Per Paid Transaction</div>
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#ecfeff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={22} color="#06b6d4" />
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 700 }}>COMPLETED ORDERS</div>
              <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#10b981', margin: '0.2rem 0' }}>
                {data?.summary.completed_orders ?? 0}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Fulfilled & Delivered</div>
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={22} color="#10b981" />
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 700 }}>PENDING / CANCELLED</div>
              <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#f59e0b', margin: '0.2rem 0' }}>
                {data?.summary.pending_orders ?? 0} / {data?.summary.cancelled_orders ?? 0}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Awaiting / Voided</div>
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <XCircle size={22} color="#f59e0b" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts: Revenue Trend & Daily Orders */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem' }}>
        {/* Revenue Trend Area Chart */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <IndianRupee size={18} color="#10b981" /> Daily Revenue Trend (₹)
          </h3>
          <div style={{ width: '100%', height: '280px' }}>
            {data?.daily_trends && data.daily_trends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.daily_trends} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip
                    formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, 'Revenue']}
                    labelFormatter={(label) => `Date: ${label}`}
                    contentStyle={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#revenueGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                No revenue records in selected timeframe
              </div>
            )}
          </div>
        </div>

        {/* Daily Orders Bar Chart */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShoppingBag size={18} color="#ea580c" /> Daily Order Volume
          </h3>
          <div style={{ width: '100%', height: '280px' }}>
            {data?.daily_trends && data.daily_trends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.daily_trends} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    formatter={(val: any) => [`${val} Orders`, 'Volume']}
                    labelFormatter={(label) => `Date: ${label}`}
                    contentStyle={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="orders" fill="#ea580c" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                No order records in selected timeframe
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Middle Grid: Peak Ordering Hours & Payment Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem' }}>
        {/* Peak Ordering Hours Bar Chart */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={18} color="#06b6d4" /> Peak Ordering Hours (8:00 AM – 5:00 PM)
          </h3>
          <div style={{ width: '100%', height: '260px' }}>
            {data?.peak_hours && data.peak_hours.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.peak_hours} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    formatter={(val: any) => [`${val} Orders`, 'Order Count']}
                    contentStyle={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  />
                  <Bar dataKey="orders" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                No peak hours data available
              </div>
            )}
          </div>
        </div>

        {/* Payment Method Distribution */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PieChartIcon size={18} color="#8b5cf6" /> Payment Method Breakdown
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'center', height: '260px' }}>
            <div style={{ width: '100%', height: '100%' }}>
              {data?.payment_methods && data.payment_methods.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.payment_methods}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="revenue"
                    >
                      {data.payment_methods.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: any) => `₹${Number(val).toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : null}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {data?.payment_methods.map((pm, idx) => (
                <div key={idx} style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 700, color: '#1e293b' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: COLORS[idx % COLORS.length] }} />
                    <span>{pm.method}</span>
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 900, color: '#1e293b', marginTop: '0.2rem' }}>
                    ₹{pm.revenue.toLocaleString()} <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>({pm.percentage}%)</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{pm.orders_count} orders</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top Selling Food Products Table */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Award size={18} color="#ea580c" /> Top Selling Food Items (Ranked by Quantity Sold)
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>
              Authoritative PostgreSQL order item sales calculations for the selected period.
            </p>
          </div>
        </div>

        <table className="custom-table">
          <thead>
            <tr>
              <th style={{ width: '80px' }}>Rank</th>
              <th>Food Product</th>
              <th>Category</th>
              <th style={{ textAlign: 'center' }}>Quantity Sold</th>
              <th style={{ textAlign: 'right' }}>Total Revenue</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                  Loading top selling foods from PostgreSQL...
                </td>
              </tr>
            ) : !data?.top_selling_products || data.top_selling_products.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                  No food sales recorded in the selected period.
                </td>
              </tr>
            ) : (
              data.top_selling_products.map((item, idx) => (
                <tr key={idx}>
                  <td>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: idx === 0 ? '#fef3c7' : idx === 1 ? '#f1f5f9' : idx === 2 ? '#ffedd5' : '#f8fafc',
                      color: idx === 0 ? '#b45309' : idx === 1 ? '#475569' : idx === 2 ? '#c2410c' : '#64748b',
                      fontWeight: 900,
                      fontSize: '0.75rem'
                    }}>
                      #{idx + 1}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 800, color: '#1e293b' }}>{item.product_name}</span>
                  </td>
                  <td style={{ color: '#64748b', fontWeight: 600 }}>{item.category_name}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{
                      background: '#fff7ed',
                      color: '#ea580c',
                      padding: '0.25rem 0.65rem',
                      borderRadius: '9999px',
                      fontWeight: 800,
                      fontSize: '0.78rem'
                    }}>
                      {item.quantity_sold} Units Sold
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 900, color: '#10b981', fontSize: '0.95rem' }}>
                    ₹{item.revenue.toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Category Performance Breakdown */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Layers size={18} color="#06b6d4" /> Food Category Performance
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {data?.category_performance && data.category_performance.length > 0 ? (
            data.category_performance.map((cat, idx) => (
              <div key={idx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '1.1rem', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#1e293b', marginBottom: '0.5rem', fontWeight: 700 }}>
                  <span>{cat.category_name}</span>
                  <span style={{ fontWeight: 800, color: '#10b981' }}>₹{cat.revenue.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.65rem' }}>
                  <span>{cat.quantity_sold} items sold</span>
                  <span>{cat.percentage}% of revenue</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, cat.percentage)}%`, height: '100%', background: COLORS[idx % COLORS.length], borderRadius: '4px' }} />
                </div>
              </div>
            ))
          ) : (
            <div style={{ color: '#94a3b8', padding: '1rem' }}>No category data available</div>
          )}
        </div>
      </div>
    </div>
  );
};
