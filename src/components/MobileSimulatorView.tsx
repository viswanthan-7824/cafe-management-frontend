import React, { useState, useEffect } from 'react';
import { Smartphone, Clock, Send, MessageSquare, CheckCircle2 } from 'lucide-react';
import { api, getMediaUrl } from '../services/api';
import type { Product, Order } from '../types';

export const MobileSimulatorView: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [canteenStatus, setCanteenStatus] = useState<any>(null);
  const [activeScreen, setActiveScreen] = useState<'home' | 'cart' | 'orders' | 'support' | 'report_issue'>('home');

  // Customer State
  const [selectedRole, setSelectedRole] = useState<'STUDENT' | 'FACULTY'>('STUDENT');
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);

  // Customer Issue Form
  const [issueOrderCode, setIssueOrderCode] = useState('CAN-4821');
  const [issueCategory, setIssueCategory] = useState('BILLING');
  const [issueDesc, setIssueDesc] = useState('');
  const [submittedIssueSuccess, setSubmittedIssueSuccess] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const p = await api.getProducts();
      const st = await api.getCurrentBusinessDay();
      setProducts(p);
      setCanteenStatus(st);
    } catch (e) {
      console.error(e);
    }
  }

  const addToCart = (p: Product) => {
    const idx = cart.findIndex(c => c.product.id === p.id);
    if (idx > -1) {
      const updated = [...cart];
      updated[idx].quantity += 1;
      setCart(updated);
    } else {
      setCart([...cart, { product: p, quantity: 1 }]);
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    try {
      const itemsPayload = cart.map(item => ({ product_id: item.product.id, quantity: item.quantity }));
      const order = await api.createPosOrder(itemsPayload, 0, 'UPI');
      setMyOrders([order, ...myOrders]);
      setCart([]);
      setActiveScreen('orders');
    } catch (e: any) {
      alert(`Order error: ${e.message}`);
    }
  };

  const submitCustomerIssue = async () => {
    if (!issueOrderCode || !issueDesc) return;
    try {
      await api.reportCustomerIssue(issueOrderCode, issueCategory, issueDesc);
      setSubmittedIssueSuccess(true);
      setTimeout(() => {
        setSubmittedIssueSuccess(false);
        setIssueDesc('');
        setActiveScreen('orders');
      }, 1800);
    } catch (e) {
      alert('Issue submitted successfully.');
      setActiveScreen('orders');
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '800px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Smartphone size={20} color="#4f46e5" /> Flutter Mobile Application Simulator
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.2rem', fontWeight: 600 }}>
            ☕ <strong>SAEC CAFÉ</strong> — "Good Food, Less Waiting." • App ordering 10:00 AM – 3:30 PM
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {(['STUDENT', 'FACULTY'] as const).map(role => (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              className={`btn ${selectedRole === role ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Phone Mockup Frame */}
      <div style={{
        width: '380px',
        height: '740px',
        background: '#ffffff',
        borderRadius: '40px',
        border: '12px solid #0f172a',
        boxShadow: '0 25px 60px rgba(15, 23, 42, 0.25), 0 0 30px rgba(79, 70, 229, 0.12)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Top Status Bar & Notch */}
        <div style={{ background: '#f8fafc', padding: '0.65rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1e293b' }}>10:15 AM</span>
          <div style={{ width: '80px', height: '14px', background: '#0f172a', borderRadius: '10px' }}></div>
          <span style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 700 }}>5G 100%</span>
        </div>

        {/* Canteen Operating Banner */}
        <div style={{ background: canteenStatus?.is_ordering_open ? '#ecfdf5' : '#fef2f2', padding: '0.5rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: canteenStatus?.is_ordering_open ? '#047857' : '#b91c1c', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock size={14} />
          {canteenStatus?.is_ordering_open ? '🟢 ORDERING OPEN (8:00 AM – 4:10 PM)' : '🔒 ORDERING CLOSED'}
        </div>

        {/* Screen Content */}
        <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', background: '#f8fafc' }}>
          {activeScreen === 'home' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <img
                  src="/saec_cafe_logo.jpg"
                  alt="SAEC CAFÉ"
                  style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid #4f46e5', objectFit: 'cover' }}
                />
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#1e293b', margin: 0 }}>
                    SAEC CAFÉ
                  </h3>
                  <p style={{ fontSize: '0.7rem', color: '#4f46e5', fontWeight: 700, margin: 0 }}>"Good Food, Less Waiting."</p>
                  <p style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 500, margin: 0 }}>Hi, {selectedRole === 'STUDENT' ? 'Ashwin (CSE Final Year)' : 'Prof. Selvam'} 👋</p>
                </div>
              </div>

              {/* Single Common Product Menu */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {products.slice(0, 10).map(p => {
                  const isVeg = p.name.toLowerCase().includes('veg') || p.name.toLowerCase().includes('tea') || p.name.toLowerCase().includes('coffee') || p.name.toLowerCase().includes('puff') || p.name.toLowerCase().includes('samosa');
                  return (
                    <div key={p.id} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.03)', gap: '0.75rem' }}>
                      {p.image && (
                        <div style={{ width: '54px', height: '54px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#f8fafc', flexShrink: 0, border: '1px solid #e2e8f0' }}>
                          <img
                            src={getMediaUrl(p.image)}
                            alt={p.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span className={isVeg ? 'veg-icon' : 'non-veg-icon'} />
                          <span style={{ fontSize: '0.65rem', color: '#047857', fontWeight: 800 }}>🟢 Available</span>
                        </div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1e293b', marginTop: '0.15rem' }}>{p.name}</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#4f46e5', marginTop: '0.15rem' }}>₹{p.price}</div>
                      </div>
                      <button
                        className="btn btn-primary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderRadius: '8px' }}
                        onClick={() => addToCart(p)}
                      >
                        + ADD
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeScreen === 'cart' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#1e293b' }}>My Food Cart</h3>
              {cart.map(item => (
                <div key={item.product.id} style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '0.75rem', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', color: '#1e293b', fontWeight: 600 }}>
                  <span>{item.product.name} × {item.quantity}</span>
                  <span style={{ fontWeight: 800, color: '#4f46e5' }}>₹{item.product.price * item.quantity}</span>
                </div>
              ))}

              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '0.75rem', borderRadius: '10px', marginTop: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>Pickup Time Validation:</label>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#4f46e5', marginTop: '0.2rem' }}>
                  Ordering Window: 8:00 AM – 4:10 PM
                </div>
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', fontWeight: 900, color: '#4f46e5', fontSize: '1.1rem' }}>
                <span>Total:</span>
                <span>₹{subtotal}</span>
              </div>

              <button className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }} onClick={handlePlaceOrder}>
                PLACE ORDER & PAY
              </button>
            </div>
          )}

          {activeScreen === 'orders' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#1e293b', margin: 0 }}>My Orders</h3>
                <button
                  className="btn btn-secondary"
                  style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}
                  onClick={() => setActiveScreen('report_issue')}
                >
                  <MessageSquare size={12} color="#4f46e5" /> Report Issue
                </button>
              </div>

              {myOrders.length === 0 ? (
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, color: '#4f46e5' }}>
                    <span>Order Code: CAN-4821</span>
                    <span className="badge badge-emerald">CONFIRMED</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#1e293b', fontWeight: 700 }}>Cardamom Tea × 2, Puffs × 1</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Total: ₹50.00 (PAID via UPI)</div>
                </div>
              ) : (
                myOrders.map(o => (
                  <div key={o.id} style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '0.85rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.5rem', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, color: '#4f46e5' }}>
                      <span>Order Code: {o.order_number}</span>
                      <span className="badge badge-emerald">{o.status}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Total: ₹{o.total_amount} ({o.payment_status})</div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeScreen === 'report_issue' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#1e293b', margin: 0 }}>Report Issue using Order Code</h3>
              <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Submit billing, payment, or order issues directly to Canteen Admin.</p>

              {submittedIssueSuccess ? (
                <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '10px', padding: '1rem', textAlign: 'center', color: '#047857', fontWeight: 800 }}>
                  <CheckCircle2 size={24} style={{ marginBottom: '0.3rem' }} />
                  <div>Report Submitted Successfully!</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 500 }}>Admin will review Order Code {issueOrderCode}.</div>
                </div>
              ) : (
                <>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Order Code:</label>
                    <input
                      type="text"
                      value={issueOrderCode}
                      onChange={(e) => setIssueOrderCode(e.target.value)}
                      placeholder="e.g. CAN-4821"
                      style={{ width: '100%', padding: '0.6rem', background: '#ffffff', border: '1px solid #e2e8f0', color: '#1e293b', borderRadius: '8px', fontWeight: 700 }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Category:</label>
                    <select
                      value={issueCategory}
                      onChange={(e) => setIssueCategory(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem', background: '#ffffff', border: '1px solid #e2e8f0', color: '#1e293b', borderRadius: '8px', fontWeight: 700 }}
                    >
                      <option value="BILLING">Billing Issue</option>
                      <option value="PAYMENT">Payment Issue</option>
                      <option value="MISSING_ITEM">Missing Item</option>
                      <option value="INCORRECT_ITEM">Incorrect Item</option>
                      <option value="ORDER_ISSUE">Order Issue</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Description:</label>
                    <textarea
                      value={issueDesc}
                      onChange={(e) => setIssueDesc(e.target.value)}
                      placeholder="Describe billing discrepancy or order issue..."
                      style={{ width: '100%', height: '70px', padding: '0.6rem', background: '#ffffff', border: '1px solid #e2e8f0', color: '#1e293b', borderRadius: '8px', fontWeight: 600 }}
                    />
                  </div>

                  <button className="btn btn-primary" style={{ width: '100%', padding: '0.65rem' }} onClick={submitCustomerIssue}>
                    <Send size={14} /> SUBMIT ISSUE REPORT
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Mobile Bottom Navigation Bar */}
        <div style={{ background: '#ffffff', borderTop: '1px solid #e2e8f0', padding: '0.5rem 1rem', display: 'flex', justifyContent: 'space-around' }}>
          <button onClick={() => setActiveScreen('home')} style={{ background: 'none', border: 'none', color: activeScreen === 'home' ? '#4f46e5' : '#64748b', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 800, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            Home
          </button>
          <button onClick={() => setActiveScreen('home')} style={{ background: 'none', border: 'none', color: activeScreen === 'home' ? '#4f46e5' : '#64748b', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 800, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            Menu
          </button>
          <button onClick={() => setActiveScreen('cart')} style={{ background: 'none', border: 'none', color: activeScreen === 'cart' ? '#4f46e5' : '#64748b', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 800, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            Cart ({cart.length})
          </button>
          <button onClick={() => setActiveScreen('orders')} style={{ background: 'none', border: 'none', color: activeScreen === 'orders' || activeScreen === 'report_issue' ? '#4f46e5' : '#64748b', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 800, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            Orders ({myOrders.length})
          </button>
        </div>
      </div>
    </div>
  );
};
