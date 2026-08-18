import React, { useState, useEffect } from 'react';
import { Layers, Clock, CheckCircle2, ArrowRight, Flame } from 'lucide-react';
import { api } from '../services/api';
import type { Order } from '../types';

export const FcfsQueueView: React.FC = () => {
  const [queue, setQueue] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQueue();
    const interval = setInterval(loadQueue, 5000); // Live poll every 5s
    return () => clearInterval(interval);
  }, []);

  async function loadQueue() {
    try {
      const q = await api.getFcfsQueue();
      setQueue(q);
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
      loadQueue();
    } catch (e) {
      alert('Error updating order status');
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Layers size={22} color="#ea580c" /> Live FCFS Queue Management Board
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.2rem', fontWeight: 500 }}>
            Strict First-Come-First-Served sequence based on confirmed_at timestamp for SAEC CAFÉ. Unpaid orders do not enter preparation queue.
          </p>
        </div>
        <div className="badge badge-emerald" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
          <Clock size={14} /> Queue Size: {queue.length} Orders
        </div>
      </div>

      {/* Live Kanban / Queue Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
        {[
          { title: '1. Confirmed Queue', status: 'CONFIRMED', color: '#2563eb', badgeClass: 'badge-blue', icon: Clock },
          { title: '2. Kitchen Preparation', status: 'PREPARING', color: '#ea580c', badgeClass: 'badge-orange', icon: Flame },
          { title: '3. Ready at Counter', status: 'READY', color: '#059669', badgeClass: 'badge-emerald', icon: CheckCircle2 },
        ].map((col, idx) => {
          const colOrders = queue.filter(o => o.status === col.status);
          const ColIcon = col.icon;
          return (
            <div key={idx} className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: '500px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                  <ColIcon size={18} color={col.color} /> {col.title}
                </h3>
                <span className={`badge ${col.badgeClass}`}>{colOrders.length}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {colOrders.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem 0', fontSize: '0.85rem', fontWeight: 500 }}>
                    No orders in this state
                  </div>
                ) : (
                  colOrders.map((order, qIdx) => (
                    <div key={order.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ea580c' }}>{order.order_number}</span>
                        <span style={{ fontSize: '0.72rem', color: '#64748b', background: '#ffffff', border: '1px solid #cbd5e1', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
                          FCFS Pos #{qIdx + 1}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1e293b' }}>
                        {order.customer_name} ({order.customer_role})
                      </div>

                      <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '0.2rem', fontWeight: 500 }}>
                        {order.items.map(item => (
                          <div key={item.id}>• {item.product_name} × {item.quantity}</div>
                        ))}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #e2e8f0' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#059669' }}>₹{order.total_amount}</span>
                        <button
                          className="btn btn-primary"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                          onClick={() => advanceStatus(order.id, order.status)}
                        >
                          Advance <ArrowRight size={12} />
                        </button>
                      </div>
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
