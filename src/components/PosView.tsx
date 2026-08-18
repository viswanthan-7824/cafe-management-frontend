import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, Plus, Minus, Trash2, Printer, CheckCircle2, Tag } from 'lucide-react';
import { api, getMediaUrl } from '../services/api';
import type { Product, Category, Order } from '../types';

export const PosView: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Cart State
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'ONLINE'>('CASH');

  // Receipt Modal State
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [pList, cList] = await Promise.all([
      api.getProducts(),
      api.getCategories()
    ]);
    setProducts(pList);
    setCategories(cList);
  };

  const handleAddToCart = (product: Product) => {
    if (product.current_stock <= 0) {
      alert(`${product.name} is currently out of stock!`);
      return;
    }
    const existingIndex = cart.findIndex(item => item.product.id === product.id);
    if (existingIndex > -1) {
      const updated = [...cart];
      if (updated[existingIndex].quantity + 1 > product.current_stock) {
        alert(`Cannot add more than available stock (${product.current_stock}).`);
        return;
      }
      updated[existingIndex].quantity += 1;
      setCart(updated);
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const handleUpdateQuantity = (productId: number, delta: number) => {
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        const newQty = item.quantity + delta;
        if (newQty > item.product.current_stock) {
          alert(`Maximum available stock reached (${item.product.current_stock}).`);
          return item;
        }
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean) as { product: Product; quantity: number }[]);
  };

  const addToCart = handleAddToCart;
  const updateQuantity = handleUpdateQuantity;

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const total = Math.max(0, subtotal - discount);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    try {
      const itemsPayload = cart.map(item => ({ product_id: item.product.id, quantity: item.quantity }));
      const order = await api.createPosOrder(itemsPayload, discount, paymentMethod);
      setCompletedOrder(order);
      setCart([]);
      setDiscount(0);
      fetchData(); // refresh stock numbers
    } catch (e: any) {
      alert(`Checkout failed: ${e.message}`);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory ? p.category === selectedCategory : true;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.barcode?.includes(searchQuery) ||
                          p.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 390px', gap: '1.5rem', minHeight: 'calc(100vh - 120px)' }}>
      {/* Left Column: Category Filter & Product Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Search Bar & Category Filter Pills */}
        <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search food item name, barcode, SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.7rem 0.75rem 0.7rem 2.4rem',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#1e293b',
                borderRadius: '10px',
                fontSize: '0.875rem',
                fontWeight: 600
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
            <button
              onClick={() => setSelectedCategory(null)}
              className={`btn ${selectedCategory === null ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.45rem 0.95rem', fontSize: '0.8rem', borderRadius: '9999px' }}
            >
              All Canteen Items
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`btn ${selectedCategory === cat.id ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.45rem 0.95rem', fontSize: '0.8rem', whiteSpace: 'nowrap', borderRadius: '9999px' }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          {filteredProducts.map(product => {
            const isOutOfStock = product.current_stock <= 0;
            const isVeg = product.name.toLowerCase().includes('veg') || product.name.toLowerCase().includes('tea') || product.name.toLowerCase().includes('coffee') || product.name.toLowerCase().includes('puff') || product.name.toLowerCase().includes('paneer') || product.name.toLowerCase().includes('samosa');
            return (
              <div
                key={product.id}
                className="glass-card"
                onClick={() => !isOutOfStock && handleAddToCart(product)}
                style={{
                  padding: '1.1rem',
                  cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                  opacity: isOutOfStock ? 0.6 : 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  position: 'relative'
                }}
              >
                <div>
                  <div style={{ position: 'relative', width: '100%', height: '110px', borderRadius: '10px', overflow: 'hidden', backgroundColor: '#f8fafc', marginBottom: '0.65rem', border: '1px solid #e2e8f0' }}>
                    {product.image && (
                      <img
                        src={getMediaUrl(product.image)}
                        alt={product.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    )}
                    <div style={{ position: 'absolute', top: '8px', left: '8px', zIndex: 2, background: 'rgba(255,255,255,0.95)', padding: '2px 4px', borderRadius: '4px' }}>
                      <span className={isVeg ? 'veg-icon' : 'non-veg-icon'} title={isVeg ? 'Pure Veg' : 'Non-Veg'} />
                    </div>
                    <div style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 2 }}>
                      <span className={`badge ${isOutOfStock ? 'badge-rose' : product.current_stock <= product.minimum_stock ? 'badge-amber' : 'badge-emerald'}`}>
                        {isOutOfStock ? 'Out of Stock' : `${product.current_stock} left`}
                      </span>
                    </div>
                  </div>

                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b', marginTop: '0.2rem' }}>{product.name}</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem', lineHeight: '1.3' }}>
                    {product.description || 'Fresh Canteen Preparation'}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#1e293b' }}>₹{product.price}</div>
                  <button
                    disabled={isOutOfStock}
                    style={{
                      background: isOutOfStock ? '#e2e8f0' : '#ffffff',
                      border: isOutOfStock ? '1px solid #cbd5e1' : '1px solid #ea580c',
                      color: isOutOfStock ? '#94a3b8' : '#ea580c',
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      padding: '0.35rem 0.85rem',
                      borderRadius: '8px',
                      cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                      boxShadow: isOutOfStock ? 'none' : '0 2px 8px rgba(234, 88, 12, 0.12)'
                    }}
                  >
                    + ADD
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: POS Cart & Counter Checkout */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <ShoppingCart size={18} color="#ea580c" /> Counter Sale Cart
              </h3>
              <div style={{ fontSize: '0.7rem', color: '#047857', fontWeight: 700, marginTop: '2px' }}>
                ⚡ Cashier billing enabled anytime
              </div>
            </div>
            <span className="badge badge-indigo">{cart.length} Items</span>
          </div>

          {/* Cart Items List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '350px', overflowY: 'auto', paddingRight: '0.25rem' }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#64748b', padding: '2.5rem 0', fontSize: '0.875rem', fontWeight: 500 }}>
                Cart is empty. Click canteen products on the left to add items.
              </div>
            ) : (
              cart.map(item => (
                <div key={item.product.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.75rem', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#1e293b' }}>{item.product.name}</div>
                    <div style={{ fontSize: '0.78rem', color: '#ea580c', fontWeight: 700 }}>₹{item.product.price} × {item.quantity} = ₹{item.product.price * item.quantity}</div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.product.id, -1); }} style={{ background: '#ffffff', border: '1px solid #cbd5e1', color: '#1e293b', borderRadius: '6px', padding: '0.25rem', cursor: 'pointer' }}>
                      <Minus size={12} />
                    </button>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1e293b', width: '20px', textAlign: 'center' }}>{item.quantity}</span>
                    <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.product.id, 1); }} style={{ background: '#ffffff', border: '1px solid #cbd5e1', color: '#1e293b', borderRadius: '6px', padding: '0.25rem', cursor: 'pointer' }}>
                      <Plus size={12} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); removeFromCart(item.product.id); }} style={{ background: 'none', border: 'none', color: '#ef4444', padding: '0.25rem', marginLeft: '0.25rem', cursor: 'pointer' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Bill Calculations & Payment Options */}
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem', marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
            <span>Subtotal:</span>
            <span>₹{subtotal}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
              <Tag size={12} /> Discount:
            </span>
            <input
              type="number"
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
              style={{ width: '80px', padding: '0.25rem 0.5rem', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e293b', borderRadius: '6px', textAlign: 'right', fontWeight: 700 }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 900, color: '#ea580c', paddingTop: '0.5rem', borderTop: '1px dashed #e2e8f0' }}>
            <span>Grand Total:</span>
            <span>₹{total}</span>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '0.35rem', fontWeight: 700 }}>Payment Method:</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
              {(['CASH', 'UPI', 'ONLINE'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setPaymentMethod(m)}
                  className={`btn ${paymentMethod === m ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.4rem', fontSize: '0.75rem' }}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <button
            className="btn btn-primary"
            disabled={cart.length === 0}
            onClick={handleCheckout}
            style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', marginTop: '0.5rem', background: cart.length === 0 ? '#cbd5e1' : '#ea580c', cursor: cart.length === 0 ? 'not-allowed' : 'pointer' }}
          >
            <CheckCircle2 size={18} /> COMPLETE COUNTER SALE
          </button>
        </div>
      </div>

      {/* Receipt Printing Modal */}
      {completedOrder && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ maxWidth: '420px', textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
              <CheckCircle2 size={32} color="#047857" />
            </div>

            <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#1e293b', margin: 0 }}>SAEC CAFÉ Counter Order</h3>
            <p style={{ color: '#ea580c', fontWeight: 900, fontSize: '1.6rem', margin: '0.4rem 0' }}>
              Order #{completedOrder.order_number}
            </p>
            <p style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>
              Customer: {completedOrder.customer_name} ({completedOrder.customer_role})
            </p>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '12px', margin: '1rem 0', textAlign: 'left', fontSize: '0.85rem' }}>
              {completedOrder.items.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', color: '#1e293b', fontWeight: 600 }}>
                  <span>{item.product_name} × {item.quantity}</span>
                  <span>₹{item.total_price}</span>
                </div>
              ))}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontWeight: 900, color: '#ea580c', fontSize: '1.05rem' }}>
                <span>Total Paid ({completedOrder.payment_status}):</span>
                <span>₹{completedOrder.total_amount}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setCompletedOrder(null)}>Close</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => window.print()}>
                <Printer size={16} /> Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
