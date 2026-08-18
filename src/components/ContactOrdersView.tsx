import React, { useState, useEffect } from 'react';
import { MessageSquareCheck, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '../services/api';
import type { ContactOrderRequest } from '../types';

export const ContactOrdersView: React.FC = () => {
  const [requests, setRequests] = useState<ContactOrderRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState<ContactOrderRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    try {
      const r = await api.getContactOrders();
      setRequests(r);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleAction = async (action: 'ACCEPT' | 'REJECT') => {
    if (!selectedReq) return;
    try {
      await api.approveContactOrder(selectedReq.id, action, rejectionReason);
      setSelectedReq(null);
      setRejectionReason('');
      loadRequests();
    } catch (e) {
      alert('Error updating special request');
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <MessageSquareCheck size={22} color="#ea580c" /> SAEC CAFÉ Contact & Special Order Request Desk
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.2rem', fontWeight: 500 }}>
            Approval queue for bulk biryani, large family pizzas, custom cakes, and special catering requests.
          </p>
        </div>
        <span className="badge badge-purple" style={{ padding: '0.5rem 1rem' }}>
          Pending Approvals: {requests.filter(r => r.status === 'PENDING').length}
        </span>
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
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
            {requests.map(req => (
              <tr key={req.id}>
                <td style={{ fontWeight: 900, color: '#ea580c' }}>{req.request_number}</td>
                <td>
                  <div style={{ fontWeight: 800, color: '#1e293b' }}>{req.user_name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{req.user_mobile}</div>
                </td>
                <td style={{ fontWeight: 800, color: '#1e293b' }}>{req.product_name}</td>
                <td><span className="badge badge-blue">{req.quantity} Pcs</span></td>
                <td style={{ color: '#1e293b', fontWeight: 600 }}>{new Date(req.preferred_pickup_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                <td>
                  <span className={`badge ${req.status === 'ACCEPTED' ? 'badge-emerald' : req.status === 'REJECTED' ? 'badge-rose' : 'badge-amber'}`}>
                    {req.status}
                  </span>
                </td>
                <td>
                  <button className="btn btn-primary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }} onClick={() => setSelectedReq(req)}>
                    Review
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Review Modal */}
      {selectedReq && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ maxWidth: '500px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#1e293b', marginBottom: '1rem' }}>
              Special Request #{selectedReq.request_number}
            </h3>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
              <div><strong style={{ color: '#64748b' }}>Customer:</strong> <span style={{ color: '#1e293b', fontWeight: 700 }}>{selectedReq.user_name} ({selectedReq.user_mobile})</span></div>
              <div><strong style={{ color: '#64748b' }}>Product:</strong> <span style={{ color: '#ea580c', fontWeight: 800 }}>{selectedReq.product_name} × {selectedReq.quantity}</span></div>
              <div><strong style={{ color: '#64748b' }}>Special Instructions:</strong> <span style={{ color: '#1e293b' }}>{selectedReq.special_instructions || 'None'}</span></div>
            </div>

            {selectedReq.status === 'PENDING' && (
              <div style={{ marginTop: '1rem' }}>
                <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.35rem', fontWeight: 700 }}>Rejection Reason (If rejecting):</label>
                <input
                  type="text"
                  placeholder="e.g. Kitchen overloaded during lunch rush"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e293b', borderRadius: '8px', fontWeight: 600 }}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setSelectedReq(null)}>Close</button>
              {selectedReq.status === 'PENDING' && (
                <>
                  <button className="btn btn-rose" style={{ flex: 1 }} onClick={() => handleAction('REJECT')}>
                    <XCircle size={16} /> REJECT
                  </button>
                  <button className="btn btn-emerald" style={{ flex: 1 }} onClick={() => handleAction('ACCEPT')}>
                    <CheckCircle2 size={16} /> ACCEPT REQUEST
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
