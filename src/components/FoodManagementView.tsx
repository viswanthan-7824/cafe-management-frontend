import React, { useState, useEffect } from 'react';
import { UtensilsCrossed, Plus, Search, Edit2, Trash2, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { api, getMediaUrl } from '../services/api';
import type { Product, Category, AvailabilityStatus, FoodType } from '../types';

export const FoodManagementView: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<number>(1);
  const [price, setPrice] = useState<number>(20);
  const [costPrice, setCostPrice] = useState<number>(12);
  const [foodType, setFoodType] = useState<FoodType>('READY_FOOD');
  const [currentStock, setCurrentStock] = useState<number>(50);
  const [minStock, setMinStock] = useState<number>(10);
  const [maxStock, setMaxStock] = useState<number>(200);
  const [prepTime, setPrepTime] = useState<number>(5);
  const [availabilityStatus, setAvailabilityStatus] = useState<AvailabilityStatus>('AVAILABLE');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [p, c] = await Promise.all([
        api.getProducts(),
        api.getCategories()
      ]);
      setProducts(p);
      setCategories(c);
      if (c.length > 0 && !categoryId) {
        setCategoryId(c[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const openAddModal = () => {
    setEditingProduct(null);
    setName('');
    setDescription('');
    setCategoryId(categories[0]?.id || 1);
    setPrice(20);
    setCostPrice(12);
    setFoodType('READY_FOOD');
    setCurrentStock(50);
    setMinStock(10);
    setMaxStock(200);
    setPrepTime(5);
    setAvailabilityStatus('AVAILABLE');
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setDescription(p.description || '');
    setCategoryId(p.category);
    setPrice(p.price);
    setCostPrice(p.cost_price || p.price * 0.6);
    setFoodType(p.food_type);
    setCurrentStock(p.current_stock);
    setMinStock(p.minimum_stock);
    setMaxStock(p.maximum_stock);
    setPrepTime(p.preparation_time);
    setAvailabilityStatus(p.availability_status);
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Please enter a valid product name');
      return;
    }
    if (price <= 0) {
      setErrorMessage('Price must be greater than zero');
      return;
    }

    setIsSaving(true);
    setErrorMessage('');

    const payload: Partial<Product> = {
      name: name.trim(),
      description: description.trim(),
      category: categoryId,
      price,
      cost_price: costPrice,
      food_type: foodType,
      current_stock: currentStock,
      minimum_stock: minStock,
      maximum_stock: maxStock,
      preparation_time: prepTime,
      availability_status: availabilityStatus,
      is_active: true
    };

    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, payload);
      } else {
        await api.createProduct(payload);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save food product');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleAvailability = async (p: Product) => {
    const nextStatus: AvailabilityStatus = p.availability_status === 'AVAILABLE' ? 'UNAVAILABLE' : 'AVAILABLE';
    try {
      await api.updateProduct(p.id, { availability_status: nextStatus });
      setProducts(products.map(item => item.id === p.id ? { ...item, availability_status: nextStatus } : item));
    } catch (e: any) {
      alert(`Could not toggle availability: ${e.message}`);
    }
  };

  const handleDeleteProduct = async () => {
    if (!confirmDeleteId) return;
    try {
      await api.deleteProduct(confirmDeleteId);
      setConfirmDeleteId(null);
      loadData();
    } catch (e: any) {
      alert(`Deactivation failed: ${e.message}`);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory ? p.category === selectedCategory : true;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
      <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <UtensilsCrossed size={22} color="#ea580c" /> Food & Product Catalogue Management
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.2rem', fontWeight: 500 }}>
            Unified food availability system for SAEC CAFÉ. Manage prices, categories, preparation times, and instant stock availability.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Plus size={16} /> Add Food Item
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search food by name, category, or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.75rem 0.65rem 2.4rem',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                fontSize: '0.875rem',
                fontWeight: 600
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setSelectedCategory(null)}
              className={`btn ${selectedCategory === null ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', borderRadius: '8px' }}
            >
              All ({products.length})
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`btn ${selectedCategory === cat.id ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', whiteSpace: 'nowrap', borderRadius: '8px' }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Product List Table */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="custom-table">
          <thead>
            <tr>
              <th>Food Item</th>
              <th>Category</th>
              <th>Price</th>
              <th>Current Stock</th>
              <th>Prep Time</th>
              <th>Availability</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                  Loading food items...
                </td>
              </tr>
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                  No food products matching search criteria.
                </td>
              </tr>
            ) : (
              filteredProducts.map(p => {
                const isVeg = p.name.toLowerCase().includes('veg') || p.name.toLowerCase().includes('tea') || p.name.toLowerCase().includes('coffee') || p.name.toLowerCase().includes('puff') || p.name.toLowerCase().includes('paneer') || p.name.toLowerCase().includes('samosa');
                const isAvailable = p.availability_status === 'AVAILABLE';

                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {p.image ? (
                          <img
                            src={getMediaUrl(p.image)}
                            alt={p.name}
                            style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #e2e8f0' }}
                            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                          />
                        ) : (
                          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c', fontWeight: 800 }}>
                            🍵
                          </div>
                        )}
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span className={isVeg ? 'veg-icon' : 'non-veg-icon'} />
                            <span style={{ fontWeight: 800, color: '#1e293b' }}>{p.name}</span>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{p.description || 'Canteen Special'}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, color: '#64748b' }}>{p.category_name || 'General'}</td>
                    <td style={{ fontWeight: 900, color: '#1e293b' }}>₹{p.price}</td>
                    <td>
                      <span style={{ fontWeight: 800, color: p.current_stock <= p.minimum_stock ? '#b91c1c' : '#047857' }}>
                        {p.current_stock} Units
                      </span>
                    </td>
                    <td style={{ color: '#64748b', fontWeight: 600 }}>{p.preparation_time} mins</td>
                    <td>
                      <button
                        onClick={() => handleToggleAvailability(p)}
                        style={{
                          background: isAvailable ? '#ecfdf5' : '#fef2f2',
                          border: `1px solid ${isAvailable ? '#a7f3d0' : '#fecaca'}`,
                          color: isAvailable ? '#047857' : '#b91c1c',
                          padding: '0.3rem 0.65rem',
                          borderRadius: '9999px',
                          fontWeight: 800,
                          fontSize: '0.72rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}
                      >
                        {isAvailable ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        {isAvailable ? 'AVAILABLE' : 'UNAVAILABLE'}
                      </button>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                          onClick={() => openEditModal(p)}
                          title="Edit product"
                        >
                          <Edit2 size={12} /> Edit
                        </button>
                        <button
                          className="btn btn-rose"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                          onClick={() => setConfirmDeleteId(p.id)}
                          title="Deactivate product"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Food Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ maxWidth: '560px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1e293b', marginBottom: '1rem' }}>
              {editingProduct ? `Edit Food: ${editingProduct.name}` : 'Add New Food Product'}
            </h3>

            {errorMessage && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '0.65rem 0.9rem', color: '#b91c1c', fontSize: '0.8rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertTriangle size={16} /> {errorMessage}
              </div>
            )}

            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '0.3rem' }}>Food Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Masala Dosa"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontWeight: 600 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '0.3rem' }}>Category *</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(Number(e.target.value))}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontWeight: 600 }}
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '0.3rem' }}>Description</label>
                <input
                  type="text"
                  placeholder="e.g. Crispy golden dosa served with coconut chutney & sambar"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontWeight: 600 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '0.3rem' }}>Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontWeight: 800, color: '#ea580c' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '0.3rem' }}>Initial Stock *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={currentStock}
                    onChange={(e) => setCurrentStock(Number(e.target.value))}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontWeight: 700 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '0.3rem' }}>Prep Time (Mins)</label>
                  <input
                    type="number"
                    min={0}
                    value={prepTime}
                    onChange={(e) => setPrepTime(Number(e.target.value))}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontWeight: 600 }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '0.3rem' }}>Availability Status</label>
                  <select
                    value={availabilityStatus}
                    onChange={(e) => setAvailabilityStatus(e.target.value as AvailabilityStatus)}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontWeight: 700 }}
                  >
                    <option value="AVAILABLE">AVAILABLE</option>
                    <option value="LOW_STOCK">LOW_STOCK</option>
                    <option value="OUT_OF_STOCK">OUT_OF_STOCK</option>
                    <option value="UNAVAILABLE">UNAVAILABLE</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '0.3rem' }}>Food Type</label>
                  <select
                    value={foodType}
                    onChange={(e) => setFoodType(e.target.value as FoodType)}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontWeight: 600 }}
                  >
                    <option value="READY_FOOD">Ready Food (Instant Counter)</option>
                    <option value="MADE_TO_ORDER">Made to Order (Kitchen)</option>
                    <option value="CONTACT_ORDER">Special Contact Catering</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? 'Saving...' : editingProduct ? 'Update Food Item' : 'Create Food Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Deactivation Modal */}
      {confirmDeleteId && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ maxWidth: '440px', textAlign: 'center' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
              <AlertTriangle size={26} color="#ef4444" />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#1e293b', margin: 0 }}>
              Deactivate Food Item?
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem', lineHeight: '1.4' }}>
              Are you sure you want to deactivate this item from the active menu? It will no longer be visible on mobile apps or cashier POS.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setConfirmDeleteId(null)}>
                Cancel
              </button>
              <button className="btn btn-rose" style={{ flex: 1 }} onClick={handleDeleteProduct}>
                Confirm Deactivation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
