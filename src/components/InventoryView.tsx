import React, { useState, useEffect } from 'react';
import { Boxes, Plus } from 'lucide-react';
import { api } from '../services/api';
import type { Product, InventoryTransaction } from '../types';

export const InventoryView: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Adjustment Modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [trxType, setTrxType] = useState<'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT' | 'DAMAGE'>('STOCK_IN');
  const [qty, setQty] = useState<number>(10);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const p = await api.getProducts();
      const t = await api.getInventoryTransactions();
      setProducts(p);
      setTransactions(t);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleAdjustStock = async () => {
    if (!selectedProduct) return;
    const finalQty = (trxType === 'STOCK_OUT' || trxType === 'DAMAGE') ? -Math.abs(qty) : Math.abs(qty);
    try {
      await api.recordStockAdjustment(selectedProduct.id, trxType, finalQty, notes);
      setSelectedProduct(null);
      setNotes('');
      loadData();
    } catch (e) {
      alert('Error updating stock');
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Boxes size={22} color="#ea580c" /> SAEC CAFÉ Inventory & Stock Ledger
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.2rem', fontWeight: 500 }}>
            Inventory carries over day-to-day. Changes occur strictly via explicit stock transactions with concurrency locking.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setSelectedProduct(products[0])}>
          <Plus size={16} /> Stock Adjustment
        </button>
      </div>

      {/* 3D Key Product Inventory Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {products.slice(0, 4).map((p) => {
          const isAvailable = p.current_stock > 0 && p.today_availability === 'AVAILABLE';
          return (
            <div
              key={p.id}
              className="card-3d glass-card p-4 space-y-2.5 border border-slate-200"
              onMouseMove={(e) => {
                if (window.innerWidth < 768) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                e.currentTarget.style.setProperty('--rx', `${-y / 12}deg`);
                e.currentTarget.style.setProperty('--ry', `${x / 12}deg`);
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.setProperty('--rx', '0deg');
                e.currentTarget.style.setProperty('--ry', '0deg');
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {p.category_name}
                </span>
                <span className={`badge text-[10px] ${isAvailable ? 'badge-success' : 'badge-danger'}`}>
                  {isAvailable ? '● AVAILABLE' : '● OUT OF STOCK'}
                </span>
              </div>

              <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                {p.name}
              </h3>

              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <span className="text-2xl font-black text-slate-900">{p.current_stock}</span>
                  <span className="text-xs font-semibold text-slate-500 ml-1">{p.unit || 'units'}</span>
                </div>
                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                  18 sold today
                </span>
              </div>

              <button
                onClick={() => setSelectedProduct(p)}
                className="btn-3d btn-3d-secondary w-full text-xs py-1.5 mt-2"
              >
                Adjust Stock
              </button>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
        {/* Product Stock Table */}
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', fontWeight: 900, color: '#1e293b' }}>
            Product Stock Levels
          </div>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Current Stock</th>
                <th>Min Threshold</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 800, color: '#1e293b' }}>{p.name}</td>
                  <td style={{ color: '#64748b', fontWeight: 600 }}>{p.category_name}</td>
                  <td style={{ fontWeight: 900, color: p.current_stock <= p.minimum_stock ? '#b91c1c' : '#047857' }}>
                    {p.current_stock}
                  </td>
                  <td style={{ color: '#64748b' }}>{p.minimum_stock}</td>
                  <td>
                    <span className={`badge ${p.current_stock <= 0 ? 'badge-rose' : p.current_stock <= p.minimum_stock ? 'badge-amber' : 'badge-emerald'}`}>
                      {p.availability_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Transaction History Log */}
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', fontWeight: 900, color: '#1e293b' }}>
            Stock Audit Log
          </div>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Balance After</th>
              </tr>
            </thead>
            <tbody>
              {transactions.slice(0, 10).map((t, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 800, color: '#1e293b' }}>{t.product_name}</td>
                  <td>
                    <span className={`badge ${t.transaction_type === 'STOCK_IN' ? 'badge-emerald' : t.transaction_type === 'SALE' ? 'badge-blue' : 'badge-amber'}`}>
                      {t.transaction_type}
                    </span>
                  </td>
                  <td style={{ fontWeight: 800, color: t.quantity > 0 ? '#047857' : '#b91c1c' }}>
                    {t.quantity > 0 ? `+${t.quantity}` : t.quantity}
                  </td>
                  <td style={{ fontWeight: 800, color: '#1e293b' }}>{t.new_stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {selectedProduct && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ maxWidth: '480px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#1e293b', marginBottom: '1rem' }}>
              Adjust Stock: {selectedProduct.name}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.35rem', fontWeight: 700 }}>Transaction Type:</label>
                <select
                  value={trxType}
                  onChange={(e) => setTrxType(e.target.value as any)}
                  style={{ width: '100%', padding: '0.65rem', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e293b', borderRadius: '8px', fontWeight: 600 }}
                >
                  <option value="STOCK_IN">STOCK_IN (Supplier Delivery)</option>
                  <option value="STOCK_OUT">STOCK_OUT (Wastage / Return)</option>
                  <option value="DAMAGE">DAMAGE (Expired / Spoiled)</option>
                  <option value="ADJUSTMENT">ADJUSTMENT (Manual Audit Count)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.35rem', fontWeight: 700 }}>Quantity:</label>
                <input
                  type="number"
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                  style={{ width: '100%', padding: '0.65rem', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e293b', borderRadius: '8px', fontWeight: 600 }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.35rem', fontWeight: 700 }}>Audit Notes:</label>
                <input
                  type="text"
                  placeholder="e.g. Received morning batch from Ramanathapuram bakery"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e293b', borderRadius: '8px', fontWeight: 600 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button className="btn btn-secondary" onClick={() => setSelectedProduct(null)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleAdjustStock}>Save Stock Adjustment</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
