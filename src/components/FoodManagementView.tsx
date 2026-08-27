import React, { useState, useEffect, useRef } from 'react';
import {
  UtensilsCrossed,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Upload,
  Image as ImageIcon,
  Crop,
  X,
  RefreshCw,
  Sparkles,
  Layers,
  Check,
  Package,
  Layers3,
  SlidersHorizontal,
  ChevronRight,
  EyeOff,
  Eye,
  Hash,
  Clock,
  IndianRupee,
  RotateCcw
} from 'lucide-react';
import { api, getMediaUrl } from '../services/api';
import type { Product, Category, AvailabilityStatus, FoodType, TodayAvailability, ProductDashboardStats } from '../types';

/**
 * Automatically crops any uploaded image to an exact 1:1 square aspect ratio
 * and scales it to at least 800x800 px for crystal-clear menu display.
 */
async function cropToSquareBlob(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const minDimension = Math.min(img.width, img.height);
      const targetSize = Math.max(800, minDimension);

      const canvas = document.createElement('canvas');
      canvas.width = targetSize;
      canvas.height = targetSize;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas 2D context not available'));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Center crop
      const startX = (img.width - minDimension) / 2;
      const startY = (img.height - minDimension) / 2;
      ctx.drawImage(img, startX, startY, minDimension, minDimension, 0, 0, targetSize, targetSize);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create cropped image blob'));
        },
        'image/jpeg',
        0.88
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for cropping'));
    };
    img.src = url;
  });
}

export const FoodManagementView: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ProductDashboardStats>({
    total_products: 0,
    available_products: 0,
    out_of_stock: 0,
    inactive_products: 0,
    total_categories: 0,
    products_added_today: 0,
  });

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
  const [unit, setUnit] = useState<string>('Piece');
  const [prepTime, setPrepTime] = useState<number>(5);
  const [displayOrder, setDisplayOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [todayAvailability, setTodayAvailability] = useState<TodayAvailability>('AVAILABLE');
  const [availabilityStatus, setAvailabilityStatus] = useState<AvailabilityStatus>('AVAILABLE');

  // Media & Image Upload State
  type ImageSourceMode = 'KEEP' | 'UPLOAD' | 'GEMINI' | 'REMOVE';
  const [imageSourceMode, setImageSourceMode] = useState<ImageSourceMode>('KEEP');
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>('');
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [customImageUrl, setCustomImageUrl] = useState<string>('');
  const [isCropping, setIsCropping] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Gemini AI Image Generator Modal State
  const [isGeminiModalOpen, setIsGeminiModalOpen] = useState(false);
  const [geminiPromptName, setGeminiPromptName] = useState('');
  const [geminiPromptDesc, setGeminiPromptDesc] = useState('');
  const [geminiCategoryName, setGeminiCategoryName] = useState('');
  const [geminiGenerating, setGeminiGenerating] = useState(false);
  const [geminiPreviewData, setGeminiPreviewData] = useState<{
    preview_url: string;
    image_data: string;
    prompt_used: string;
    is_gemini_active: boolean;
    source: string;
  } | null>(null);

  // Category Management Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Utensils');
  const [editingCatId, setEditingCatId] = useState<number | null>(null);
  const [catActionLoading, setCatActionLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [p, c, s] = await Promise.all([
        api.getProducts(),
        api.getCategories(),
        api.getProductStats()
      ]);
      setProducts(p);
      setCategories(c);
      setStats(s);
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
    setUnit('Piece');
    setPrepTime(5);
    setDisplayOrder(0);
    setIsActive(true);
    setTodayAvailability('AVAILABLE');
    setAvailabilityStatus('AVAILABLE');
    setImageSourceMode('KEEP');
    setImagePreviewUrl('');
    setImageBlob(null);
    setCustomImageUrl('');
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
    setUnit(p.unit || 'Piece');
    setPrepTime(p.preparation_time);
    setDisplayOrder(p.display_order || 0);
    setIsActive(p.is_active);
    setTodayAvailability(p.today_availability || 'AVAILABLE');
    setAvailabilityStatus(p.availability_status);
    setImageSourceMode('KEEP');
    setImagePreviewUrl(p.image ? getMediaUrl(p.image) : '');
    setImageBlob(null);
    setCustomImageUrl(p.image?.startsWith('http') ? p.image : '');
    setErrorMessage('');
    setIsModalOpen(true);
  };

  // Handle local image file selection with 1:1 square auto-crop
  const handleImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (.jpg, .png, .webp)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size exceeds 5MB limit. Please upload a smaller image.');
      return;
    }
    setIsCropping(true);
    try {
      const squareBlob = await cropToSquareBlob(file);
      setImageBlob(squareBlob);
      const preview = URL.createObjectURL(squareBlob);
      setImagePreviewUrl(preview);
      setImageSourceMode('UPLOAD');
    } catch (err: any) {
      alert(`Image processing error: ${err.message}`);
    } finally {
      setIsCropping(false);
    }
  };

  const handleRemoveImage = () => {
    setImagePreviewUrl('');
    setImageBlob(null);
    setCustomImageUrl('');
    setImageSourceMode('REMOVE');
  };

  // Trigger Gemini AI Image Generation
  const handleGenerateGeminiImage = async () => {
    if (!geminiPromptName.trim()) {
      alert('Please specify a product name to generate an image.');
      return;
    }
    setGeminiGenerating(true);
    setGeminiPreviewData(null);
    try {
      const result = await api.generateAiProductImage(
        geminiPromptName.trim(),
        geminiPromptDesc.trim(),
        geminiCategoryName
      );
      setGeminiPreviewData(result);
    } catch (err: any) {
      alert(`AI Image Generation failed: ${err.message}`);
    } finally {
      setGeminiGenerating(false);
    }
  };

  const handleUseGeminiImage = () => {
    if (!geminiPreviewData) return;
    const url = geminiPreviewData.preview_url || geminiPreviewData.image_data;
    setImagePreviewUrl(url);
    setCustomImageUrl(url);
    setImageBlob(null);
    setImageSourceMode('GEMINI');
    setIsGeminiModalOpen(false);
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
    if (currentStock < 0) {
      setErrorMessage('Available quantity cannot be negative');
      return;
    }

    setIsSaving(true);
    setErrorMessage('');

    try {
      if (imageSourceMode === 'UPLOAD' && imageBlob) {
        // Multipart FormData upload for cropped 1:1 image file
        const formData = new FormData();
        formData.append('name', name.trim());
        formData.append('description', description.trim());
        formData.append('category', String(categoryId));
        formData.append('price', String(price));
        formData.append('cost_price', String(costPrice));
        formData.append('food_type', foodType);
        formData.append('current_stock', String(currentStock));
        formData.append('minimum_stock', String(minStock));
        formData.append('maximum_stock', String(maxStock));
        formData.append('unit', unit);
        formData.append('preparation_time', String(prepTime));
        formData.append('display_order', String(displayOrder));
        formData.append('today_availability', todayAvailability);
        formData.append('availability_status', availabilityStatus);
        formData.append('is_active', String(isActive));
        formData.append('image', imageBlob, `${name.toLowerCase().replace(/\s+/g, '_')}.jpg`);

        if (editingProduct) {
          await api.updateProduct(editingProduct.id, formData);
        } else {
          await api.createProduct(formData);
        }
      } else {
        // Standard JSON payload
        const payload: any = {
          name: name.trim(),
          description: description.trim(),
          category: categoryId,
          price,
          cost_price: costPrice,
          food_type: foodType,
          current_stock: currentStock,
          minimum_stock: minStock,
          maximum_stock: maxStock,
          unit,
          preparation_time: prepTime,
          display_order: displayOrder,
          today_availability: todayAvailability,
          availability_status: availabilityStatus,
          is_active: isActive,
        };

        if (imageSourceMode === 'GEMINI' && customImageUrl) {
          payload.image = customImageUrl;
        } else if (imageSourceMode === 'REMOVE') {
          payload.image = null;
        }

        if (editingProduct) {
          await api.updateProduct(editingProduct.id, payload);
        } else {
          await api.createProduct(payload);
        }
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save food product');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleProductAvailability = async (p: Product, newStatus: TodayAvailability) => {
    try {
      await api.toggleProductAvailability(p.id, newStatus);
      setProducts(products.map(item => item.id === p.id ? { ...item, today_availability: newStatus } : item));
      loadData();
    } catch (e: any) {
      alert(`Could not toggle availability: ${e.message}`);
    }
  };

  const handleToggleActiveStatus = async (p: Product) => {
    const nextActive = !p.is_active;
    try {
      await api.updateProduct(p.id, { is_active: nextActive });
      setProducts(products.map(item => item.id === p.id ? { ...item, is_active: nextActive } : item));
      loadData();
    } catch (e: any) {
      alert(`Could not update active status: ${e.message}`);
    }
  };

  const handleDeleteProduct = async () => {
    if (!confirmDeleteId) return;
    try {
      await api.deleteProduct(confirmDeleteId);
      setConfirmDeleteId(null);
      await loadData();
    } catch (e: any) {
      alert(`Deactivation failed: ${e.message}`);
    }
  };

  // Category Actions
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setCatActionLoading(true);
    try {
      if (editingCatId) {
        await api.updateCategory(editingCatId, { name: newCatName.trim(), description: newCatDesc.trim(), icon_name: newCatIcon });
      } else {
        await api.createCategory({ name: newCatName.trim(), description: newCatDesc.trim(), icon_name: newCatIcon, is_active: true });
      }
      setNewCatName('');
      setNewCatDesc('');
      setEditingCatId(null);
      await loadData();
    } catch (e: any) {
      alert(`Category save failed: ${e.message}`);
    } finally {
      setCatActionLoading(false);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this category? Products in it may be affected.')) return;
    try {
      await api.deleteCategory(id);
      await loadData();
    } catch (e: any) {
      alert(`Failed to delete category: ${e.message}`);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory ? p.category === selectedCategory : true;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header & Quick Action Buttons */}
      <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0 }}>
            <UtensilsCrossed size={24} color="#ea580c" /> Product & Food Menu Management
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.2rem', fontWeight: 500 }}>
            Manage food catalogue, stock levels, preparation times, categories, and Gemini AI food photography.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => setIsCategoryModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Layers size={16} /> Manage Categories
          </button>
          <button
            className="btn"
            onClick={() => {
              setGeminiPromptName(name || 'Veg Puff');
              setGeminiPromptDesc('Freshly baked crispy vegetable puff with spiced potato filling');
              setGeminiCategoryName(categories[0]?.name || 'Snacks');
              setGeminiPreviewData(null);
              setIsGeminiModalOpen(true);
            }}
            style={{
              background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
              color: '#ffffff',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              border: 'none',
              borderRadius: '8px',
              padding: '0.55rem 1rem',
              boxShadow: '0 2px 8px rgba(124, 58, 237, 0.25)',
              cursor: 'pointer'
            }}
          >
            <Sparkles size={16} /> Generate AI Image
          </button>
          <button className="btn btn-primary" onClick={openAddModal} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}>
            <Plus size={16} /> Add Food Product
          </button>
        </div>
      </div>

      {/* Admin Product Dashboard Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'Total Products', count: stats.total_products || products.length, color: '#ea580c' },
          { label: 'Available Today', count: stats.available_products, color: '#059669' },
          { label: 'Out of Stock', count: stats.out_of_stock, color: '#dc2626' },
          { label: 'Inactive / Hidden', count: stats.inactive_products, color: '#64748b' },
          { label: 'Categories', count: stats.total_categories || categories.length, color: '#2563eb' },
          { label: 'Added Today', count: stats.products_added_today, color: '#7c3aed' },
        ].map((item, idx) => (
          <div key={idx} className="glass-card" style={{ padding: '1.1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>{item.label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: item.color, marginTop: '0.25rem' }}>{item.count}</div>
          </div>
        ))}
      </div>

      {/* Search and Category Filter Chips */}
      <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search food by name, description, unit, SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field"
              style={{ width: '100%', paddingLeft: '2.4rem' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '2px' }}>
            <button
              onClick={() => setSelectedCategory(null)}
              className={`btn ${selectedCategory === null ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', borderRadius: '8px', whiteSpace: 'nowrap' }}
            >
              All Items ({products.length})
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`btn ${selectedCategory === cat.id ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', whiteSpace: 'nowrap', borderRadius: '8px' }}
              >
                {cat.name} ({cat.product_count ?? products.filter(p => p.category === cat.id).length})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="custom-table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Food Item & Photo</th>
              <th>Category</th>
              <th>Price</th>
              <th>Unit</th>
              <th>Stock Level</th>
              <th>Prep Time</th>
              <th>Today's Availability</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                  Loading food catalogue...
                </td>
              </tr>
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                  No food products found matching your search.
                </td>
              </tr>
            ) : (
              filteredProducts.map(p => {
                const isVeg = p.name.toLowerCase().includes('veg') || p.name.toLowerCase().includes('tea') || p.name.toLowerCase().includes('coffee') || p.name.toLowerCase().includes('paneer') || p.name.toLowerCase().includes('samosa') || p.name.toLowerCase().includes('juice') || p.name.toLowerCase().includes('fries') || p.name.toLowerCase().includes('water') || p.name.toLowerCase().includes('biscuit') || p.name.toLowerCase().includes('milkshake') || p.name.toLowerCase().includes('drinks');
                const isAvailToday = p.today_availability === 'AVAILABLE';
                const isOutOfStock = p.today_availability === 'OUT_OF_STOCK' || p.current_stock <= 0;

                return (
                  <tr key={p.id} style={{ opacity: p.is_active ? 1 : 0.6 }}>
                    <td style={{ fontWeight: 800, color: '#64748b', fontSize: '0.8rem' }}>
                      #{p.display_order || p.id}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        {/* 1:1 Square Thumbnail */}
                        <div style={{ width: '52px', height: '52px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0, background: '#fff7ed', border: '1.5px solid #fed7aa', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
                          {p.image ? (
                            <img
                              src={getMediaUrl(p.image)}
                              alt={p.name}
                              loading="lazy"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c', fontSize: '1.2rem' }}>
                              🍽️
                            </div>
                          )}
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span className={isVeg ? 'veg-icon' : 'non-veg-icon'} />
                            <span style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.95rem' }}>{p.name}</span>
                          </div>
                          <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px', lineHeight: 1.3, maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {p.description || 'Canteen Fresh Special'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, color: '#64748b', fontSize: '0.85rem' }}>
                      {p.category_name || 'General'}
                    </td>
                    <td style={{ fontWeight: 900, color: '#1e293b', fontSize: '1rem' }}>
                      ₹{p.price}
                    </td>
                    <td style={{ fontWeight: 700, color: '#64748b', fontSize: '0.85rem' }}>
                      {p.unit || 'Piece'}
                    </td>
                    <td>
                      <span style={{ fontWeight: 800, color: p.current_stock <= p.minimum_stock ? '#dc2626' : '#059669' }}>
                        {p.current_stock}
                      </span>
                    </td>
                    <td style={{ color: '#64748b', fontWeight: 600, fontSize: '0.85rem' }}>
                      {p.preparation_time} mins
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.3rem' }}>
                        <button
                          onClick={() => handleToggleProductAvailability(p, isAvailToday ? 'OUT_OF_STOCK' : 'AVAILABLE')}
                          style={{
                            background: isAvailToday ? '#ecfdf5' : '#fef2f2',
                            border: `1px solid ${isAvailToday ? '#a7f3d0' : '#fecaca'}`,
                            color: isAvailToday ? '#047857' : '#dc2626',
                            padding: '0.3rem 0.6rem',
                            borderRadius: '9999px',
                            fontWeight: 800,
                            fontSize: '0.72rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}
                        >
                          {isAvailToday ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                          {p.today_availability === 'AVAILABLE' ? 'AVAILABLE' : p.today_availability === 'OUT_OF_STOCK' ? 'OUT OF STOCK' : 'NOT TODAY'}
                        </button>
                      </div>
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggleActiveStatus(p)}
                        style={{
                          background: p.is_active ? '#eff6ff' : '#f1f5f9',
                          border: `1px solid ${p.is_active ? '#bfdbfe' : '#cbd5e1'}`,
                          color: p.is_active ? '#1d4ed8' : '#64748b',
                          padding: '0.3rem 0.6rem',
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: '0.72rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}
                      >
                        {p.is_active ? <Eye size={12} /> : <EyeOff size={12} />}
                        {p.is_active ? 'Active' : 'Disabled'}
                      </button>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                          onClick={() => openEditModal(p)}
                          title="Edit product details & image"
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

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#1e293b', margin: 0 }}>
                {editingProduct ? `Edit Food Product: ${editingProduct.name}` : 'Add New Food Product'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {errorMessage && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '0.65rem 0.9rem', color: '#dc2626', fontSize: '0.8rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertTriangle size={16} /> {errorMessage}
              </div>
            )}

            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              {/* Product Photo Options & Controls */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.75rem' }}>
                  <ImageIcon size={16} color="#ea580c" /> Product Image Options
                </label>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  {/* 1:1 Square Preview Box */}
                  <div
                    style={{
                      width: '90px',
                      height: '90px',
                      borderRadius: '16px',
                      border: '2px dashed #ea580c',
                      background: '#fff7ed',
                      overflow: 'hidden',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative'
                    }}
                  >
                    {isCropping ? (
                      <div style={{ textAlign: 'center', color: '#ea580c', fontSize: '0.7rem', fontWeight: 700 }}>
                        <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 4px' }} />
                        Processing...
                      </div>
                    ) : imagePreviewUrl ? (
                      <img
                        src={imagePreviewUrl}
                        alt="Product preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ textAlign: 'center', color: '#ea580c', padding: '0.5rem' }}>
                        <Crop size={24} style={{ margin: '0 auto 2px' }} />
                        <span style={{ fontSize: '0.65rem', fontWeight: 800 }}>1:1 Preview</span>
                      </div>
                    )}
                  </div>

                  {/* Actions: Upload, Generate Gemini, Remove */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.78rem', padding: '0.45rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <Upload size={14} /> Upload Image (Auto 1:1)
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setGeminiPromptName(name || 'Food Item');
                          setGeminiPromptDesc(description || '');
                          const c = categories.find(cat => cat.id === categoryId);
                          setGeminiCategoryName(c ? c.name : 'Food');
                          setGeminiPreviewData(null);
                          setIsGeminiModalOpen(true);
                        }}
                        style={{
                          background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          padding: '0.45rem 0.8rem',
                          borderRadius: '8px',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        <Sparkles size={14} /> Generate with Gemini AI
                      </button>

                      {imagePreviewUrl && (
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="btn btn-rose"
                          style={{ fontSize: '0.78rem', padding: '0.45rem 0.75rem' }}
                        >
                          <Trash2 size={14} /> Remove Image
                        </button>
                      )}
                    </div>

                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/jpeg,image/png,image/webp"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleImageFile(e.target.files[0]);
                        }
                      }}
                    />
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                      Supported formats: JPG, JPEG, PNG, WEBP (Max 5MB). Image is auto-cropped to 800×800 1:1 square.
                    </span>
                  </div>
                </div>
              </div>

              {/* Product Name & Category */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '0.3rem' }}>Product Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Veg Puff, Chicken Burger, Masala Tea"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-field"
                    style={{ width: '100%', fontWeight: 700 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '0.3rem' }}>Category *</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(Number(e.target.value))}
                    className="input-field"
                    style={{ width: '100%', fontWeight: 600 }}
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
                  placeholder="e.g. Freshly baked crispy vegetable puff with spicy filling"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-field"
                  style={{ width: '100%' }}
                />
              </div>

              {/* Price, Cost Price, Stock & Unit */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '0.3rem' }}>Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="input-field"
                    style={{ width: '100%', fontWeight: 800, color: '#ea580c' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '0.3rem' }}>Available Qty *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={currentStock}
                    onChange={(e) => setCurrentStock(Number(e.target.value))}
                    className="input-field"
                    style={{ width: '100%', fontWeight: 700 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '0.3rem' }}>Unit *</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="input-field"
                    style={{ width: '100%', fontWeight: 600 }}
                  >
                    <option value="Piece">Piece</option>
                    <option value="Plate">Plate</option>
                    <option value="Cup">Cup</option>
                    <option value="Bottle">Bottle</option>
                    <option value="Pack">Pack</option>
                    <option value="Box">Box</option>
                    <option value="Glass">Glass</option>
                    <option value="Bowl">Bowl</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '0.3rem' }}>Prep Time (Mins)</label>
                  <input
                    type="number"
                    min={0}
                    value={prepTime}
                    onChange={(e) => setPrepTime(Number(e.target.value))}
                    className="input-field"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {/* Today Availability, Active Status & Display Order */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '0.3rem' }}>Today's Availability</label>
                  <select
                    value={todayAvailability}
                    onChange={(e) => setTodayAvailability(e.target.value as TodayAvailability)}
                    className="input-field"
                    style={{ width: '100%', fontWeight: 700 }}
                  >
                    <option value="AVAILABLE">🟢 Available</option>
                    <option value="OUT_OF_STOCK">🔴 Out of Stock</option>
                    <option value="NOT_AVAILABLE_TODAY">⛔ Not Available Today</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '0.3rem' }}>Product Active Status</label>
                  <select
                    value={isActive ? 'true' : 'false'}
                    onChange={(e) => setIsActive(e.target.value === 'true')}
                    className="input-field"
                    style={{ width: '100%', fontWeight: 700 }}
                  >
                    <option value="true">Active (Visible)</option>
                    <option value="false">Inactive (Hidden)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '0.3rem' }}>Display Order #</label>
                  <input
                    type="number"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(Number(e.target.value))}
                    className="input-field"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSaving} style={{ fontWeight: 800 }}>
                  {isSaving ? 'Saving Product...' : editingProduct ? 'Save Product Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Gemini AI Image Generator Modal */}
      {isGeminiModalOpen && (
        <div className="modal-overlay" onClick={() => setIsGeminiModalOpen(false)}>
          <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sparkles size={20} color="#7c3aed" /> Gemini AI Product Image Generator
              </h3>
              <button onClick={() => setIsGeminiModalOpen(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: 0 }}>
              Generates a realistic commercial photograph suitable for college canteen menu display. Keys are securely stored on backend.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '0.3rem' }}>Product Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Chicken Burger, Samosa, Filter Coffee"
                  value={geminiPromptName}
                  onChange={(e) => setGeminiPromptName(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', fontWeight: 700 }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '0.3rem' }}>Description / Ingredients</label>
                <input
                  type="text"
                  placeholder="e.g. Crispy patty, fresh lettuce, sesame bun, mayo"
                  value={geminiPromptDesc}
                  onChange={(e) => setGeminiPromptDesc(e.target.value)}
                  className="input-field"
                  style={{ width: '100%' }}
                />
              </div>

              {/* Preview Result Area */}
              {geminiGenerating ? (
                <div style={{ padding: '2.5rem', textAlign: 'center', background: '#faf5ff', borderRadius: '16px', border: '2px dashed #c084fc' }}>
                  <RefreshCw size={32} className="animate-spin" color="#7c3aed" style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontWeight: 800, color: '#7c3aed', fontSize: '0.95rem' }}>Generating AI Food Photograph...</div>
                  <div style={{ fontSize: '0.75rem', color: '#6b21a8', marginTop: '4px' }}>Creating 800×800 commercial food picture with optimal lighting</div>
                </div>
              ) : geminiPreviewData ? (
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>GENERATED PREVIEW</span>
                    <span style={{ color: geminiPreviewData.is_gemini_active ? '#059669' : '#d97706' }}>
                      {geminiPreviewData.is_gemini_active ? '⚡ Google Gemini / Imagen 3 AI' : '📷 High-Quality Food Studio'}
                    </span>
                  </div>

                  <div style={{ width: '100%', height: '240px', borderRadius: '12px', overflow: 'hidden', background: '#ffffff', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                    <img
                      src={geminiPreviewData.preview_url || geminiPreviewData.image_data}
                      alt="AI Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleGenerateGeminiImage}
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                    >
                      <RotateCcw size={14} /> Regenerate
                    </button>
                    <button
                      type="button"
                      onClick={handleUseGeminiImage}
                      style={{
                        flex: 1.5,
                        background: '#059669',
                        color: '#ffffff',
                        fontWeight: 800,
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.65rem 1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)'
                      }}
                    >
                      <Check size={16} /> Use This Image
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleGenerateGeminiImage}
                  style={{
                    background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                    color: '#ffffff',
                    fontWeight: 800,
                    padding: '0.85rem',
                    borderRadius: '12px',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)'
                  }}
                >
                  <Sparkles size={18} /> Generate Product Image with Gemini
                </button>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsGeminiModalOpen(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manage Categories Modal */}
      {isCategoryModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCategoryModalOpen(false)}>
          <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Layers size={20} color="#ea580c" /> Food Categories Management
              </h3>
              <button onClick={() => setIsCategoryModalOpen(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Add / Edit Category Form */}
            <form onSubmit={handleSaveCategory} style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.75rem' }}>
                {editingCatId ? 'Edit Category' : '+ Add New Category'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.75rem' }}>
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Category Name (e.g. Snacks, Beverages, Meals)"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="input-field"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Description (Optional)"
                    value={newCatDesc}
                    onChange={(e) => setNewCatDesc(e.target.value)}
                    className="input-field"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.75rem' }}>
                {editingCatId && (
                  <button type="button" className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }} onClick={() => { setEditingCatId(null); setNewCatName(''); setNewCatDesc(''); }}>
                    Cancel Edit
                  </button>
                )}
                <button type="submit" className="btn btn-primary" disabled={catActionLoading} style={{ padding: '0.35rem 0.85rem', fontSize: '0.75rem', fontWeight: 700 }}>
                  {editingCatId ? 'Update Category' : 'Save Category'}
                </button>
              </div>
            </form>

            {/* Category List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '280px', overflowY: 'auto' }}>
              {categories.map(cat => (
                <div key={cat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div>
                    <span style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.9rem' }}>{cat.name}</span>
                    {cat.description && <span style={{ color: '#64748b', fontSize: '0.75rem', marginLeft: '0.5rem' }}>— {cat.description}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                      onClick={() => {
                        setEditingCatId(cat.id);
                        setNewCatName(cat.name);
                        setNewCatDesc(cat.description || '');
                      }}
                    >
                      <Edit2 size={12} /> Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-rose"
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                      onClick={() => handleDeleteCategory(cat.id)}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Deactivation Modal */}
      {confirmDeleteId && (
        <div className="modal-overlay" onClick={() => setConfirmDeleteId(null)}>
          <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', textAlign: 'center' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
              <AlertTriangle size={26} color="#dc2626" />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#1e293b', margin: 0 }}>
              Deactivate Food Product?
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem', lineHeight: '1.4' }}>
              Are you sure you want to deactivate this item from the active menu? It will no longer be orderable by students or cashier POS.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setConfirmDeleteId(null)}>
                Cancel
              </button>
              <button className="btn btn-rose" style={{ flex: 1, fontWeight: 700 }} onClick={handleDeleteProduct}>
                Confirm Deactivation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
