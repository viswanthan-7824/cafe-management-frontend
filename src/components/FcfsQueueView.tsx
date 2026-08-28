import React, { useState, useEffect } from 'react';
import { Layers, Clock, CheckCircle2, ArrowRight, Flame, ChefHat, Check, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import type { Order } from '../types';

export const FcfsQueueView: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  async function loadOrders() {
    try {
      const q = await api.getOrders();
      setOrders(q);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const advanceStatus = async (orderId: number, currentStatus: string) => {
    let nextStatus = 'PREPARING';
    if (currentStatus === 'CONFIRMED') nextStatus = 'PREPARING';
    else if (currentStatus === 'PREPARING') nextStatus = 'READY';
    else if (currentStatus === 'READY') nextStatus = 'DELIVERED';

    try {
      await api.updateOrderStatus(orderId, nextStatus);
      loadOrders();
    } catch (e: any) {
      alert(e.message || 'Error updating order status');
    }
  };

  const columns = [
    { key: 'CONFIRMED', title: 'CONFIRMED', bg: '#fff7ed', border: '#fed7aa', color: '#ea580c' },
    { key: 'PREPARING', title: 'PREPARING', bg: '#eff6ff', border: '#bfdbfe', color: '#2563eb' },
    { key: 'READY', title: 'READY FOR PICKUP', bg: '#ecfdf5', border: '#a7f3d0', color: '#059669' },
    { key: 'DELIVERED', title: 'COMPLETED', bg: '#f8fafc', border: '#e2e8f0', color: '#64748b' }
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Layers size={22} color="#ea580c" /> Kanban Order Queue Management Board
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.82rem', marginTop: '0.2rem', fontWeight: 600 }}>
            Strict First-Come First-Served sequence based on confirmed payment timestamp for SAEC CAFÉ.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="badge badge-primary" style={{ padding: '0.45rem 0.85rem' }}>
            <Clock size={14} /> Total Active: {orders.filter((o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED').length} Orders
          </span>
          <button onClick={loadOrders} className="btn btn-secondary" style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Kanban Board Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', overflowX: 'auto' }}>
        {columns.map((col) => {
          const colOrders = orders.filter((o) => o.status === col.key);

          return (
            <div
              key={col.key}
              style={{
                background: col.bg,
                border: `1px solid ${col.border}`,
                borderRadius: '18px',
                padding: '1.15rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                minHeight: '500px'
              }}
            >
              {/* Column Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid ${col.border}`, paddingBottom: '0.65rem' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 900, color: col.color, textTransform: 'uppercase', margin: 0 }}>
                  {col.title}
                </h3>
                <span style={{ background: '#ffffff', color: col.color, fontWeight: 900, fontSize: '0.78rem', padding: '0.15rem 0.55rem', borderRadius: '9999px', border: `1px solid ${col.border}` }}>
                  {colOrders.length}
                </span>
              </div>

              {/* Column Order Cards List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', flex: 1 }}>
                {colOrders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem 0.5rem', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>
                    No orders in this column
                  </div>
                ) : (
                  colOrders.map((o) => (
                    <div
                      key={o.id}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '14px',
                        padding: '1rem',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '0.75rem'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                          <span style={{ fontWeight: 900, fontSize: '0.95rem', color: '#ea580c' }}>
                            #{o.order_number}
                          </span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b' }}>
                            ₹{o.total_amount}
                          </span>
                        </div>

                        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1e293b' }}>
                          {typeof o.user === 'object' && o.user !== null ? (o.user as any).full_name : 'Walk-In Customer'}
                        </div>

                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                          {new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>

                        {/* Items preview list */}
                        <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed #e2e8f0', fontSize: '0.75rem', color: '#475569' }}>
                          {o.items?.map((it, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>{it.quantity}x {it.product_name}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Advance Button Action */}
                      {col.key !== 'DELIVERED' && (
                        <button
                          onClick={() => advanceStatus(o.id, col.key)}
                          className="btn btn-primary"
                          style={{ width: '100%', padding: '0.45rem', fontSize: '0.78rem', fontWeight: 800 }}
                        >
                          Advance to {col.key === 'CONFIRMED' ? 'PREPARING' : col.key === 'PREPARING' ? 'READY' : 'COMPLETED'} <ArrowRight size={14} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
