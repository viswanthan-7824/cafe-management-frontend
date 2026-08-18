import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle2, XCircle, Eye, Image as ImageIcon } from 'lucide-react';
import { api } from '../services/api';
import type { PaymentSupportTicket } from '../types';

export const PaymentSupportView: React.FC = () => {
  const [tickets, setTickets] = useState<PaymentSupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<PaymentSupportTicket | null>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadTickets();
  }, []);

  async function loadTickets() {
    try {
      const t = await api.getPaymentSupportTickets();
      setTickets(t);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleVerifyOrReject = async (action: 'VERIFY' | 'REJECT') => {
    if (!selectedTicket) return;
    try {
      await api.verifyPaymentSupportTicket(selectedTicket.id, action, notes);
      setSelectedTicket(null);
      setNotes('');
      loadTickets();
    } catch (e) {
      alert('Error updating payment support ticket');
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShieldAlert size={22} color="#ef4444" /> Payment Failure Support Ticket Desk
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.2rem', fontWeight: 500 }}>
            Review customer payment proof screenshots & transaction IDs for SAEC CAFÉ. Screenshot uploads NEVER automatically mark orders as paid.
          </p>
        </div>
        <span className="badge badge-rose" style={{ padding: '0.5rem 1rem' }}>
          Open Issues: {tickets.filter(t => t.status === 'OPEN').length}
        </span>
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="custom-table">
          <thead>
            <tr>
              <th>Ticket #</th>
              <th>Order #</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Transaction ID</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map(ticket => (
              <tr key={ticket.id}>
                <td style={{ fontWeight: 900, color: '#ea580c' }}>{ticket.ticket_number}</td>
                <td style={{ fontWeight: 800, color: '#1e293b' }}>{ticket.order_number}</td>
                <td>
                  <div style={{ fontWeight: 800, color: '#1e293b' }}>{ticket.user_name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{ticket.user_mobile}</div>
                </td>
                <td style={{ fontWeight: 900, color: '#059669' }}>₹{ticket.amount}</td>
                <td style={{ fontFamily: 'monospace', color: '#1e293b', fontWeight: 600 }}>{ticket.transaction_id}</td>
                <td>
                  <span className={`badge ${ticket.status === 'VERIFIED' ? 'badge-emerald' : ticket.status === 'REJECTED' ? 'badge-rose' : 'badge-amber'}`}>
                    {ticket.status}
                  </span>
                </td>
                <td>
                  <button className="btn btn-primary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }} onClick={() => setSelectedTicket(ticket)}>
                    <Eye size={12} /> Inspect Ticket
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Inspection Modal */}
      {selectedTicket && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ maxWidth: '550px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1e293b', marginBottom: '1rem' }}>
              Review Payment Ticket #{selectedTicket.ticket_number}
            </h3>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Order Number:</span>
                <span style={{ fontWeight: 900, color: '#ea580c' }}>{selectedTicket.order_number}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Customer Name:</span>
                <span style={{ fontWeight: 800, color: '#1e293b' }}>{selectedTicket.user_name} ({selectedTicket.user_mobile})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Claimed Amount:</span>
                <span style={{ fontWeight: 900, color: '#059669' }}>₹{selectedTicket.amount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Transaction ID:</span>
                <span style={{ fontFamily: 'monospace', color: '#1e293b', fontWeight: 700 }}>{selectedTicket.transaction_id}</span>
              </div>
            </div>

            {/* Proof Placeholder / Preview */}
            <div style={{ margin: '1rem 0', background: '#fff7ed', border: '1px dashed #ea580c', borderRadius: '12px', padding: '1.5rem', textAlign: 'center', color: '#ea580c' }}>
              <ImageIcon size={32} color="#ea580c" style={{ marginBottom: '0.5rem' }} />
              <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>UPI Screenshot Evidence Provided</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Transaction ID matched with bank statement</div>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.35rem', fontWeight: 700 }}>Admin Verification Notes:</label>
              <textarea
                placeholder="e.g. Bank statement verified UPI reference 9876543210123"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{ width: '100%', height: '70px', padding: '0.65rem', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e293b', borderRadius: '8px', fontWeight: 600 }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setSelectedTicket(null)}>Close</button>
              <button className="btn btn-rose" style={{ flex: 1 }} onClick={() => handleVerifyOrReject('REJECT')}>
                <XCircle size={16} /> REJECT TICKET
              </button>
              <button className="btn btn-emerald" style={{ flex: 1 }} onClick={() => handleVerifyOrReject('VERIFY')}>
                <CheckCircle2 size={16} /> VERIFY PAYMENT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
