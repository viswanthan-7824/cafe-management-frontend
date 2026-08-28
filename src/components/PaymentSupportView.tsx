import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Search,
  RefreshCw,
  Clock,
  ShieldCheck,
  DollarSign,
  QrCode,
  AlertCircle,
  Receipt,
  UserCheck
} from 'lucide-react';
import { api } from '../services/api';
import type { Order } from '../types';

export const PaymentSupportView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'pending' | 'audit'>('pending');
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [counterNotes, setCounterNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    loadData();
  }, [activeSubTab]);

  async function loadData() {
    setLoading(true);
    try {
      if (activeSubTab === 'pending') {
        const orders = await api.getPendingPaymentOrders(searchQuery);
        setPendingOrders(orders);
      } else {
        const logs = await api.getPaymentAuditLogs();
        setAuditLogs(logs);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleConfirmPayment = async (orderId: number, method: 'CASH' | 'QR_COUNTER') => {
    setActionLoading(true);
    setActionError('');
    setActionSuccess('');

    try {
      const res = await api.verifyCounterPayment(orderId, method, counterNotes);
      setActionSuccess(res.message || 'Payment verified successfully! Order is now confirmed.');
      setSelectedOrder(null);
      setCounterNotes('');
      loadData();
    } catch (err: any) {
      setActionError(err.message || 'Payment verification failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelPayment = async (orderId: number) => {
    const reason = window.prompt('Enter reason for cancelling order payment:');
    if (reason === null) return;

    setActionLoading(true);
    setActionError('');
    setActionSuccess('');

    try {
      const res = await api.cancelOrderPayment(orderId, reason || 'Cancelled at counter by staff');
      setActionSuccess(res.message || 'Order payment cancelled. Inventory released.');
      setSelectedOrder(null);
      loadData();
    } catch (err: any) {
      setActionError(err.message || 'Cancellation failed.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
      <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0 }}>
            <ShieldCheck size={26} color="#ea580c" />
            Counter Payment Verification Desk
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.35rem', margin: 0, fontWeight: 500 }}>
            Verify physical <strong>Cash</strong> and <strong>Counter QR</strong> payments. Only verified orders enter the kitchen preparation queue.
          </p>
        </div>

        {/* Tab Toggle: Pending vs Audit Logs */}
        <div style={{ display: 'flex', gap: '0.5rem', background: '#f1f5f9', padding: '0.3rem', borderRadius: '12px' }}>
          <button
            onClick={() => setActiveSubTab('pending')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: 'none',
              background: activeSubTab === 'pending' ? '#ffffff' : 'transparent',
              color: activeSubTab === 'pending' ? '#ea580c' : '#64748b',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: activeSubTab === 'pending' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
            }}
          >
            Pending Payments ({pendingOrders.length})
          </button>
          <button
            onClick={() => setActiveSubTab('audit')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: 'none',
              background: activeSubTab === 'audit' ? '#ffffff' : 'transparent',
              color: activeSubTab === 'audit' ? '#ea580c' : '#64748b',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: activeSubTab === 'audit' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
            }}
          >
            Verification Audit Log
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '12px', padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#047857', fontSize: '0.88rem', fontWeight: 700 }}>
          <CheckCircle2 size={18} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#b91c1c', fontSize: '0.88rem', fontWeight: 700 }}>
          <AlertCircle size={18} />
          <span>{actionError}</span>
        </div>
      )}

      {/* ===================== TAB 1: PENDING PAYMENTS ===================== */}
      {activeSubTab === 'pending' && (
        <>
          {/* Search Bar */}
          <div className="glass-card" style={{ padding: '1rem 1.25rem' }}>
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search by Order Number (e.g. CAN-4821), Customer Name, or Email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '38px' }}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ padding: '0.65rem 1.25rem', fontWeight: 700 }}>
                Search
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  loadData();
                }}
                className="btn btn-secondary"
                style={{ padding: '0.65rem 1rem' }}
                title="Refresh"
              >
                <RefreshCw size={16} />
              </button>
            </form>
          </div>

          {/* Pending Orders Table */}
          <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '3px solid #fed7aa', borderTopColor: '#ea580c', animation: 'spin 0.8s linear infinite', margin: '0 auto 0.75rem' }} />
                Loading counter orders awaiting payment...
              </div>
            ) : pendingOrders.length === 0 ? (
              <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
                <CheckCircle2 size={48} color="#10b981" style={{ margin: '0 auto 0.75rem' }} />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>
                  All Counter Payments Up to Date!
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.35rem' }}>
                  No customer orders are currently waiting for payment at the counter.
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Customer</th>
                      <th>Items & Quantity</th>
                      <th>Total Amount</th>
                      <th>Selected Method</th>
                      <th>Payment Status</th>
                      <th style={{ textAlign: 'center' }}>Counter Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingOrders.map((order) => {
                      const method = order.payment_method || 'CASH';
                      return (
                        <tr key={order.id}>
                          <td>
                            <div style={{ fontWeight: 900, color: '#ea580c', fontSize: '1rem' }}>
                              {order.order_number}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.15rem' }}>
                              <Clock size={12} />
                              {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 800, color: '#1e293b' }}>
                              {order.customer_name || 'Walk-In Customer'}
                            </div>
                            <span className="badge badge-indigo" style={{ fontSize: '0.68rem', marginTop: '0.2rem' }}>
                              {order.customer_role || order.customer_type}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', fontSize: '0.82rem' }}>
                              {order.items?.map((it, idx) => (
                                <span key={idx} style={{ color: '#334155' }}>
                                  <strong>{it.quantity}x</strong> {it.product_name}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#1e293b' }}>
                              ₹{order.total_amount}
                            </div>
                          </td>
                          <td>
                            {method === 'QR_COUNTER' || method === 'UPI' ? (
                              <span className="badge badge-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                                <QrCode size={12} /> QR at Counter
                              </span>
                            ) : (
                              <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                                <DollarSign size={12} /> Cash at Counter
                              </span>
                            )}
                          </td>
                          <td>
                            <span className="badge badge-warning">
                              PAYMENT PENDING
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                              <button
                                onClick={() => handleConfirmPayment(order.id, 'CASH')}
                                disabled={actionLoading}
                                className="btn btn-success"
                                style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', fontWeight: 800 }}
                              >
                                Confirm Cash
                              </button>
                              <button
                                onClick={() => handleConfirmPayment(order.id, 'QR_COUNTER')}
                                disabled={actionLoading}
                                className="btn btn-primary"
                                style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', fontWeight: 800 }}
                              >
                                Confirm QR
                              </button>
                              <button
                                onClick={() => handleCancelPayment(order.id)}
                                disabled={actionLoading}
                                className="btn btn-secondary"
                                style={{ padding: '0.4rem 0.65rem', fontSize: '0.75rem', color: '#ef4444', borderColor: '#fecaca' }}
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ===================== TAB 2: AUDIT LOGS ===================== */}
      {activeSubTab === 'audit' && (
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '3px solid #fed7aa', borderTopColor: '#ea580c', animation: 'spin 0.8s linear infinite', margin: '0 auto 0.75rem' }} />
              Loading verified payment audit logs...
            </div>
          ) : auditLogs.length === 0 ? (
            <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: '#64748b' }}>
              <Receipt size={42} color="#cbd5e1" style={{ margin: '0 auto 0.75rem' }} />
              <p style={{ fontWeight: 700, margin: 0 }}>No verified payments recorded yet.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Order Number</th>
                    <th>Customer</th>
                    <th>Amount Paid</th>
                    <th>Payment Method</th>
                    <th>Verified By Admin</th>
                    <th>Verification Timestamp</th>
                    <th>Status Transition</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ fontWeight: 900, color: '#ea580c' }}>{log.order_number}</td>
                      <td>
                        <div style={{ fontWeight: 800, color: '#1e293b' }}>{log.customer_name || 'Walk-In Customer'}</div>
                      </td>
                      <td style={{ fontWeight: 900, color: '#059669', fontSize: '1rem' }}>
                        ₹{log.amount}
                      </td>
                      <td>
                        <span className="badge badge-primary">
                          {log.method_display || log.method}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#1e293b' }}>
                          <UserCheck size={14} color="#10b981" />
                          {log.verified_by_name || 'System Cashier'}
                        </div>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                        {log.paid_at ? new Date(log.paid_at).toLocaleString() : new Date(log.created_at).toLocaleString()}
                      </td>
                      <td>
                        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#047857', background: '#ecfdf5', padding: '0.25rem 0.6rem', borderRadius: '6px' }}>
                          PENDING ➔ PAID ✓
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
