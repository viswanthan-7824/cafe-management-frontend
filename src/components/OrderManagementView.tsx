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

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
      <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShoppingBag size={22} color="#ea580c" /> Order Lookup & Lifecycle Processing Desk
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.2rem', fontWeight: 500 }}>
            Real-time canteen order processing. Look up CAN order codes, confirm counter payments, advance kitchen preparation, and print bills.
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

      {/* Prominent Fast Order Search Bar & Status Filters */}
      <div className="glass-card" style={{ padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={20} color="#ea580c" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Enter Order Code (e.g. CAN-4821) or Customer Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 2.75rem',
                background: '#ffffff',
                border: '2px solid #fed7aa',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: 700,
                color: '#1e293b',
                outline: 'none',
                boxShadow: '0 2px 8px rgba(234, 88, 12, 0.08)'
              }}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', fontSize: '0.9rem' }}>
            <Search size={16} /> Search Order
          </button>
        </form>

        {/* Status Filter Chips */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, alignSelf: 'center', marginRight: '0.25rem' }}>Status:</span>
            {['ALL', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'AWAITING_PAYMENT', 'CANCELLED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`btn ${statusFilter === st ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.35rem 0.7rem', fontSize: '0.75rem', borderRadius: '8px' }}
              >
                {st}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>Payment:</span>
            {['ALL', 'PAID', 'PENDING'].map((pay) => (
              <button
                key={pay}
                onClick={() => setPaymentFilter(pay)}
                className={`btn ${paymentFilter === pay ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', borderRadius: '8px' }}
              >
                {pay}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="custom-table">
          <thead>
            <tr>
              <th>Order Code</th>
              <th>Customer</th>
              <th>Items Summary</th>
              <th>Total Amount</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Time</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                  Loading orders...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                  No orders found matching criteria.
                </td>
              </tr>
            ) : (
              orders.map(order => {
                const isPaid = order.payment_status === 'PAID';
                return (
                  <tr key={order.id} style={{ background: order.status === 'READY' ? '#f0fdf4' : 'transparent' }}>
                    <td>
                      <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#ea580c' }}>
                        {order.order_number}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                        Source: {order.order_source}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 800, color: '#1e293b' }}>{order.customer_name}</div>
                      <span className={`badge ${order.customer_role === 'STUDENT' ? 'badge-purple' : order.customer_role === 'FACULTY' ? 'badge-blue' : 'badge-secondary'}`} style={{ fontSize: '0.65rem' }}>
                        {order.customer_role || 'WALK-IN'}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8rem', color: '#1e293b', fontWeight: 600 }}>
                        {order.items.slice(0, 2).map((item, idx) => (
                          <div key={idx}>• {item.product_name} × {item.quantity}</div>
                        ))}
                        {order.items.length > 2 && (
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>+{order.items.length - 2} more items</div>
                        )}
                      </div>
                    </td>
                    <td style={{ fontSize: '1rem', fontWeight: 900, color: '#1e293b' }}>
                      ₹{order.total_amount}
                    </td>
                    <td>
                      <span className={`badge ${isPaid ? 'badge-emerald' : 'badge-amber'}`}>
                        {isPaid ? 'PAID' : 'UNPAID'}
                      </span>
                    </td>
                    <td>{getStatusBadge(order.status)}</td>
                    <td style={{ fontSize: '0.78rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                      {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                          onClick={() => setSelectedOrder(order)}
                          title="View order details"
                        >
                          <Eye size={13} /> View
                        </button>

                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                          onClick={() => setBillOrder(order)}
                          title="Print Receipt"
                        >
                          <Printer size={13} /> Bill
                        </button>

                        {/* Fast Workflow Advance Buttons */}
                        {order.status === 'AWAITING_PAYMENT' && (
                          <button
                            className="btn btn-emerald"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', fontWeight: 800 }}
                            onClick={() => setActionConfirm({
                              order,
                              action: 'MARK_PAID',
                              title: `Confirm Cash Payment for ${order.order_number}?`,
                              description: `Collect ₹${order.total_amount} from customer ${order.customer_name} and advance order into Kitchen Preparation queue.`
                            })}
                          >
                            <IndianRupee size={12} /> Confirm Cash
                          </button>
                        )}

                        {order.status === 'CONFIRMED' && (
                          <button
                            className="btn btn-primary"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                            onClick={() => setActionConfirm({
                              order,
                              action: 'PREPARING',
                              title: `Move ${order.order_number} to Kitchen Preparation?`,
                              description: `Notify kitchen staff to begin preparing ${order.items.length} items.`
                            })}
                          >
                            Prepare
                          </button>
                        )}

                        {order.status === 'PREPARING' && (
                          <button
                            className="btn btn-emerald"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', fontWeight: 800 }}
                            onClick={() => setActionConfirm({
                              order,
                              action: 'READY',
                              title: `Mark ${order.order_number} as Ready at Counter?`,
                              description: `Customer will be notified on mobile that food is ready for counter collection.`
                            })}
                          >
                            Ready <ArrowRight size={12} />
                          </button>
                        )}

                        {order.status === 'READY' && (
                          <button
                            className="btn btn-primary"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', background: '#059669', borderColor: '#059669' }}
                            onClick={() => setActionConfirm({
                              order,
                              action: 'DELIVERED',
                              title: `Complete & Hand Over ${order.order_number}?`,
                              description: `Confirm food has been delivered to ${order.customer_name}.`
                            })}
                          >
                            Deliver <CheckCircle2 size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
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
              <div>{getStatusBadge(selectedOrder.status)}</div>
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
