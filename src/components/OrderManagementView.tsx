import React, { useState, useEffect } from 'react';
import { Search, ShoppingBag, CheckCircle2, Printer, Eye, ArrowRight, IndianRupee } from 'lucide-react';
import { api } from '../services/api';
import type { Order, OrderStatus } from '../types';
import { ThermalReceipt } from './ThermalReceipt';


interface OrderManagementProps {
  userRole?: string;
}

export const OrderManagementView: React.FC<OrderManagementProps> = ({ userRole = 'ADMIN' }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  // Selected Order for Details / Confirmation / Bill
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [billOrder, setBillOrder] = useState<Order | null>(null);
  const [actionConfirm, setActionConfirm] = useState<{
    order: Order;
    action: 'CONFIRM' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCEL' | 'MARK_PAID';
    title: string;
    description: string;
  } | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 6000); // Live poll
    return () => clearInterval(interval);
  }, [statusFilter, paymentFilter]);

  async function loadOrders() {
    try {
      const data = await api.searchOrders(searchQuery, statusFilter, paymentFilter);
      setOrders(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadOrders();
  };

  const handleQuickCanSearch = (code: string) => {
    setSearchQuery(code);
    setStatusFilter('ALL');
    setPaymentFilter('ALL');
    api.searchOrders(code, 'ALL', 'ALL').then(res => setOrders(res));
  };

  const handleExecuteAction = async () => {
    if (!actionConfirm) return;
    setIsUpdating(true);
    const { order, action } = actionConfirm;

    try {
      if (action === 'MARK_PAID') {
        await api.updateOrderStatus(order.id, 'CONFIRMED', 'PAID');
      } else if (action === 'CONFIRM') {
        await api.updateOrderStatus(order.id, 'CONFIRMED');
      } else if (action === 'PREPARING') {
        await api.updateOrderStatus(order.id, 'PREPARING');
      } else if (action === 'READY') {
        await api.updateOrderStatus(order.id, 'READY');
      } else if (action === 'DELIVERED') {
        await api.updateOrderStatus(order.id, 'DELIVERED');
      } else if (action === 'CANCEL') {
        await api.updateOrderStatus(order.id, 'CANCELLED');
      }
      setActionConfirm(null);
      if (selectedOrder?.id === order.id) {
        setSelectedOrder(null);
      }
      loadOrders();
    } catch (e: any) {
      alert(`Action failed: ${e.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'CONFIRMED':
        return <span className="badge badge-blue">🔵 CONFIRMED</span>;
      case 'PREPARING':
        return <span className="badge badge-orange">🔥 PREPARING</span>;
      case 'READY':
        return <span className="badge badge-emerald">🟢 READY FOR PICKUP</span>;
      case 'DELIVERED':
        return <span className="badge badge-secondary">✔️ DELIVERED</span>;
      case 'AWAITING_PAYMENT':
        return <span className="badge badge-amber">⏳ AWAITING PAYMENT</span>;
      case 'CANCELLED':
      case 'REJECTED':
        return <span className="badge badge-rose">❌ CANCELLED</span>;
      default:
        return <span className="badge badge-secondary">{status}</span>;
    }
  };

  const kanbanColumns = [
    { key: 'PAYMENT_PENDING', title: 'PAYMENT PENDING', color: '#d97706', bg: '#fffbeb', border: '#fde68a', statuses: ['AWAITING_PAYMENT', 'REQUESTED', 'AWAITING_APPROVAL'] },
    { key: 'CONFIRMED', title: 'CONFIRMED', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', statuses: ['CONFIRMED'] },
    { key: 'PREPARING', title: 'PREPARING', color: '#ea580c', bg: '#fff7ed', border: '#fed7aa', statuses: ['PREPARING'] },
    { key: 'READY', title: 'READY FOR PICKUP', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', statuses: ['READY'] },
    { key: 'COMPLETED', title: 'COMPLETED', color: '#475569', bg: '#f8fafc', border: '#e2e8f0', statuses: ['DELIVERED'] },
  ];

  const getOrdersForColumn = (columnStatuses: string[]) => {
    return orders.filter(o => {
      if (columnStatuses.includes('AWAITING_PAYMENT')) {
        return columnStatuses.includes(o.status) || o.payment_status === 'PENDING';
      }
      return columnStatuses.includes(o.status);
    });
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header Banner */}
      <div className="glass-card flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShoppingBag size={22} color="#ea580c" /> 3D Order Kanban & Lifecycle Desk
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.2rem', fontWeight: 500 }}>
            Real-time canteen order processing board. Transition order states, confirm counter payments, advance kitchen prep, and print bills.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700 }}>Quick Search:</span>
          {['CAN-4821', 'CAN-1001', 'CAN-1002'].map(code => (
            <button
              key={code}
              onClick={() => handleQuickCanSearch(code)}
              className="btn btn-secondary"
              style={{ padding: '0.25rem 0.55rem', fontSize: '0.72rem', fontWeight: 800 }}
            >
              {code}
            </button>
          ))}
        </div>
      </div>

      {/* Fast Order Search Bar */}
      <div className="glass-card p-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-3 items-center">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-600" />
            <input
              type="text"
              placeholder="Enter Order Code (e.g. CAN-4821) or Customer Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10"
              style={{ background: '#ffffff', border: '2px solid #fed7aa', fontWeight: 700 }}
            />
          </div>
          <button type="submit" className="btn-3d btn-3d-primary" style={{ padding: '0.65rem 1.25rem' }}>
            <Search size={16} /> Search
          </button>
        </form>
      </div>

      {/* 3D Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {kanbanColumns.map(col => {
          const colOrders = getOrdersForColumn(col.statuses);
          return (
            <div
              key={col.key}
              className="rounded-2xl p-4 border flex flex-col gap-3 min-h-[500px]"
              style={{ background: col.bg, borderColor: col.border }}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                <span className="text-xs font-extrabold tracking-wider uppercase" style={{ color: col.color }}>
                  {col.title}
                </span>
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-extrabold text-white"
                  style={{ background: col.color }}
                >
                  {colOrders.length}
                </span>
              </div>

              {/* Column Cards List */}
              <div className="space-y-3 flex-1 overflow-y-auto">
                {colOrders.length === 0 ? (
                  <div className="text-center py-8 text-xs font-semibold text-slate-400 border border-dashed border-slate-300 rounded-xl">
                    No orders
                  </div>
                ) : (
                  colOrders.map(order => (
                    <div
                      key={order.id}
                      className="card-3d glass-card p-4 space-y-3 border border-slate-200"
                      style={{ background: '#ffffff' }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-amber-600 text-sm">
                          #{order.order_number}
                        </span>
                        <span className="badge badge-neutral text-[10px]">
                          {order.customer_role || 'STUDENT'}
                        </span>
                      </div>

                      <div className="text-xs font-bold text-slate-800">
                        {order.customer_name}
                      </div>

                      {/* Items */}
                      <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        {order.items.slice(0, 2).map((item, i) => (
                          <div key={i} className="flex justify-between">
                            <span>{item.quantity}x {item.product_name}</span>
                          </div>
                        ))}
                        {order.items.length > 2 && (
                          <div className="text-[10px] text-slate-400 font-semibold">
                            +{order.items.length - 2} more items
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="font-extrabold text-slate-900 text-base">
                          ₹{order.total_amount}
                        </span>
                        <span className={`badge text-[10px] ${order.payment_status === 'PAID' ? 'badge-success' : 'badge-warning'}`}>
                          {order.payment_status}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100">
                        {order.status === 'AWAITING_PAYMENT' && (
                          <button
                            onClick={() => setActionConfirm({
                              order,
                              action: 'MARK_PAID',
                              title: 'Verify & Confirm Counter Payment',
                              description: `Mark Order #${order.order_number} as PAID and send to Kitchen Confirmation.`
                            })}
                            className="btn-3d btn-3d-success text-[11px] py-1 px-2.5 flex-1"
                          >
                            Verify Paid
                          </button>
                        )}
                        {order.status === 'CONFIRMED' && (
                          <button
                            onClick={() => setActionConfirm({
                              order,
                              action: 'PREPARING',
                              title: 'Start Kitchen Preparation',
                              description: `Advance Order #${order.order_number} to PREPARING status.`
                            })}
                            className="btn-3d btn-3d-primary text-[11px] py-1 px-2.5 flex-1"
                          >
                            Prepare 🔥
                          </button>
                        )}
                        {order.status === 'PREPARING' && (
                          <button
                            onClick={() => setActionConfirm({
                              order,
                              action: 'READY',
                              title: 'Mark Ready for Pickup',
                              description: `Mark Order #${order.order_number} as READY FOR PICKUP.`
                            })}
                            className="btn-3d btn-3d-success text-[11px] py-1 px-2.5 flex-1"
                          >
                            Mark Ready 🟢
                          </button>
                        )}
                        {order.status === 'READY' && (
                          <button
                            onClick={() => setActionConfirm({
                              order,
                              action: 'DELIVERED',
                              title: 'Complete & Deliver Order',
                              description: `Mark Order #${order.order_number} as DELIVERED to customer.`
                            })}
                            className="btn-3d btn-3d-secondary text-[11px] py-1 px-2.5 flex-1"
                          >
                            Deliver ✔️
                          </button>
                        )}
                        <button
                          onClick={() => setBillOrder(order)}
                          className="btn btn-secondary text-[11px] p-1.5"
                          title="Print Thermal Bill"
                        >
                          <Printer size={13} />
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
      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ maxWidth: '540px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#1e293b', margin: 0 }}>
                  Order Details: <span style={{ color: '#ea580c' }}>{selectedOrder.order_number}</span>
                </h3>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Placed on {new Date(selectedOrder.created_at).toLocaleString()} • {selectedOrder.order_source} Order
                </div>
              </div>
              <div>{getStatusBadge(selectedOrder.status as OrderStatus)}</div>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Customer:</span>
                <span style={{ fontWeight: 800, color: '#1e293b' }}>{selectedOrder.customer_name} ({selectedOrder.customer_role})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Payment Status:</span>
                <span style={{ fontWeight: 800, color: selectedOrder.payment_status === 'PAID' ? '#047857' : '#b91c1c' }}>
                  {selectedOrder.payment_status}
                </span>
              </div>
              {selectedOrder.notes && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Customer Notes:</span>
                  <span style={{ color: '#ea580c', fontWeight: 600 }}>{selectedOrder.notes}</span>
                </div>
              )}
            </div>

            {/* Order Items */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', marginBottom: '1rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '0.6rem 0.85rem', textAlign: 'left', fontWeight: 700, color: '#64748b' }}>Item</th>
                    <th style={{ padding: '0.6rem 0.85rem', textAlign: 'center', fontWeight: 700, color: '#64748b' }}>Qty</th>
                    <th style={{ padding: '0.6rem 0.85rem', textAlign: 'right', fontWeight: 700, color: '#64748b' }}>Price</th>
                    <th style={{ padding: '0.6rem 0.85rem', textAlign: 'right', fontWeight: 700, color: '#64748b' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items.map(it => (
                    <tr key={it.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.6rem 0.85rem', fontWeight: 800, color: '#1e293b' }}>{it.product_name}</td>
                      <td style={{ padding: '0.6rem 0.85rem', textAlign: 'center', fontWeight: 700 }}>{it.quantity}</td>
                      <td style={{ padding: '0.6rem 0.85rem', textAlign: 'right', color: '#64748b' }}>₹{it.unit_price}</td>
                      <td style={{ padding: '0.6rem 0.85rem', textAlign: 'right', fontWeight: 800, color: '#1e293b' }}>₹{it.total_price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ padding: '0.85rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b' }}>Total Amount Paid:</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ea580c' }}>₹{selectedOrder.total_amount}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setSelectedOrder(null)}>
                Close
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { setBillOrder(selectedOrder); setSelectedOrder(null); }}>
                <Printer size={16} /> View & Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Confirmation Modal */}
      {actionConfirm && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ maxWidth: '440px', textAlign: 'center' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
              <CheckCircle2 size={28} color="#ea580c" />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#1e293b', margin: 0 }}>
              {actionConfirm.title}
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem', lineHeight: '1.4' }}>
              {actionConfirm.description}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setActionConfirm(null)}>
                Cancel
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }} disabled={isUpdating} onClick={handleExecuteAction}>
                {isUpdating ? 'Processing...' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thermal Bill / Receipt Modal with 58mm / 80mm Print & Reprint */}
      {billOrder && (
        <ThermalReceipt
          order={billOrder}
          cashierName={userRole === 'CASHIER' ? 'Canteen Cashier' : 'Canteen Admin'}
          isReprint={billOrder.status === 'DELIVERED'}
          onClose={() => setBillOrder(null)}
        />
      )}
    </div>
  );
};
