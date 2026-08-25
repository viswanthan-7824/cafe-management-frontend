import React, { useState, useEffect } from 'react';
import { MessageSquareCheck, CheckCircle2, XCircle, Clock, User, Phone, RefreshCw, AlertCircle, Calendar } from 'lucide-react';
import { api } from '../services/api';
import type { ContactOrderRequest } from '../types';

export const ContactOrdersView: React.FC = () => {
  const [requests, setRequests] = useState<ContactOrderRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReq, setSelectedReq] = useState<ContactOrderRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    setLoading(true);
    setError(null);
    try {
      const r = await api.getContactOrders();
      setRequests(Array.isArray(r) ? r : []);
    } catch (e: any) {
      console.error('Failed to load contact orders:', e);
      setError('Could not load special requests. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  }

  const handleAction = async (action: 'ACCEPT' | 'REJECT') => {
    if (!selectedReq) return;
    if (action === 'REJECT' && !rejectionReason.trim()) {
      alert('Please provide a reason for rejecting this special request.');
      return;
    }
    setIsProcessing(true);
    try {
      await api.approveContactOrder(selectedReq.id, action, rejectionReason.trim() || undefined);
      setSelectedReq(null);
      setRejectionReason('');
      await loadRequests();
    } catch (e: any) {
      alert(`Error updating request: ${e.message || 'Action failed'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatPickupTime = (timeStr?: string) => {
    if (!timeStr) return 'Not Specified';
    try {
      const date = new Date(timeStr);
      if (isNaN(date.getTime())) return timeStr;
      return date.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return timeStr;
    }
  };

  const filteredRequests = requests.filter(r => {
    if (filterStatus === 'ALL') return true;
    return r.status === filterStatus;
  });

  const pendingCount = requests.filter(r => r.status === 'PENDING').length;
  const acceptedCount = requests.filter(r => r.status === 'ACCEPTED').length;
  const rejectedCount = requests.filter(r => r.status === 'REJECTED').length;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
      <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <MessageSquareCheck size={24} color="#ea580c" /> SAEC CAFÉ Contact & Special Order Request Desk
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.25rem', fontWeight: 500 }}>
            Approval queue for custom event orders, bulk biryani, celebration cakes, and advance special catering.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            className="btn btn-secondary"
            onClick={loadRequests}
            disabled={loading}
            style={{ padding: '0.5rem 0.85rem', fontSize: '0.8rem' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <span className="badge badge-purple" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
            Pending Approvals: {pendingCount}
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {[
          { key: 'ALL', label: `All Requests (${requests.length})` },
          { key: 'PENDING', label: `Pending (${pendingCount})` },
          { key: 'ACCEPTED', label: `Accepted (${acceptedCount})` },
          { key: 'REJECTED', label: `Rejected (${rejectedCount})` }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilterStatus(tab.key)}
            className={`btn ${filterStatus === tab.key ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.45rem 1rem', fontSize: '0.82rem', borderRadius: '8px' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Table Card */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 1rem', color: '#ea580c' }} />
            <p style={{ fontWeight: 600 }}>Loading special order requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: '#64748b' }}>
            <MessageSquareCheck size={44} color="#cbd5e1" style={{ margin: '0 auto 0.75rem' }} />
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#334155', marginBottom: '0.25rem' }}>
              No Special Order Requests Found
            </h4>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
              {filterStatus === 'ALL'
                ? 'There are currently no advance contact order requests submitted.'
                : `No requests found with status: ${filterStatus}`}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Request #</th>
                  <th>Customer</th>
                  <th>Requested Product</th>
                  <th>Quantity</th>
                  <th>Preferred Pickup</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map(req => (
                  <tr key={req.id}>
                    <td style={{ fontWeight: 900, color: '#ea580c' }}>
                      {req.request_number}
                    </td>
                    <td>
                      <div style={{ fontWeight: 800, color: '#1e293b' }}>{req.user_name || 'Guest User'}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.15rem' }}>
                        <Phone size={11} /> {req.user_mobile || 'No Phone'}
                      </div>
                    </td>
                    <td style={{ fontWeight: 800, color: '#1e293b' }}>
                      {req.product_name}
                    </td>
                    <td>
                      <span className="badge badge-blue">{req.quantity} Pcs</span>
                    </td>
                    <td style={{ color: '#1e293b', fontWeight: 600, fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Clock size={13} color="#ea580c" />
                        {formatPickupTime(req.preferred_pickup_time)}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${req.status === 'ACCEPTED' ? 'badge-emerald' : req.status === 'REJECTED' ? 'badge-rose' : 'badge-amber'}`}>
                        {req.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-primary"
                        style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem' }}
                        onClick={() => {
                          setSelectedReq(req);
                          setRejectionReason(req.rejection_reason || '');
                        }}
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedReq && (
        <div className="modal-overlay" onClick={() => !isProcessing && setSelectedReq(null)}>
          <div
            className="modal-content animate-fade-in"
            style={{ maxWidth: '520px' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#1e293b', margin: 0 }}>
                Special Request #{selectedReq.request_number}
              </h3>
              <span className={`badge ${selectedReq.status === 'ACCEPTED' ? 'badge-emerald' : selectedReq.status === 'REJECTED' ? 'badge-rose' : 'badge-amber'}`}>
                {selectedReq.status}
              </span>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '1.15rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong style={{ color: '#64748b' }}>Customer:</strong>
                <span style={{ color: '#1e293b', fontWeight: 700 }}>
                  {selectedReq.user_name} ({selectedReq.user_mobile})
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong style={{ color: '#64748b' }}>Requested Item:</strong>
                <span style={{ color: '#ea580c', fontWeight: 800 }}>
                  {selectedReq.product_name} × {selectedReq.quantity}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong style={{ color: '#64748b' }}>Preferred Pickup:</strong>
                <span style={{ color: '#1e293b', fontWeight: 700 }}>
                  {formatPickupTime(selectedReq.preferred_pickup_time)}
                </span>
              </div>
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                <strong style={{ color: '#64748b', display: 'block', marginBottom: '0.2rem' }}>Special Instructions:</strong>
                <p style={{ color: '#1e293b', background: '#ffffff', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.82rem', margin: 0 }}>
                  {selectedReq.special_instructions || 'No custom notes provided by customer.'}
                </p>
              </div>
            </div>

            {selectedReq.status === 'PENDING' && (
              <div style={{ marginTop: '1.25rem' }}>
                <label style={{ fontSize: '0.8rem', color: '#475569', display: 'block', marginBottom: '0.35rem', fontWeight: 700 }}>
                  Rejection Reason (Required only if rejecting):
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kitchen fully booked for lunch rush / Ingredient out of stock"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="input-field"
                />
              </div>
            )}

            {selectedReq.status === 'REJECTED' && selectedReq.rejection_reason && (
              <div style={{ marginTop: '1rem', background: '#fef2f2', border: '1px solid #fecaca', padding: '0.75rem', borderRadius: '8px', color: '#991b1b', fontSize: '0.82rem' }}>
                <strong>Reason:</strong> {selectedReq.rejection_reason}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setSelectedReq(null)}
                disabled={isProcessing}
              >
                Close
              </button>
              {selectedReq.status === 'PENDING' && (
                <>
                  <button
                    className="btn btn-rose"
                    style={{ flex: 1 }}
                    onClick={() => handleAction('REJECT')}
                    disabled={isProcessing}
                  >
                    {isProcessing ? <RefreshCw size={15} className="animate-spin" /> : <XCircle size={15} />} Reject
                  </button>
                  <button
                    className="btn btn-emerald"
                    style={{ flex: 1.2 }}
                    onClick={() => handleAction('ACCEPT')}
                    disabled={isProcessing}
                  >
                    {isProcessing ? <RefreshCw size={15} className="animate-spin" /> : <CheckCircle2 size={15} />} Accept & Create Order
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

