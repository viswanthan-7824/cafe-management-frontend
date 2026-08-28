import React, { useState, useEffect, useMemo } from 'react';
import type { User, Product, Category, Order } from '../types';
import { api, getMediaUrl } from '../services/api';
import { ThermalReceipt } from './ThermalReceipt';
import {
  Utensils,
  Search,
  ShoppingCart,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  User as UserIcon,
  ChevronRight,
  Plus,
  Minus,
  Trash2,
  X,
  Printer,
  HelpCircle,
  Lock,
  Phone,
  Mail,
  GraduationCap,
  Briefcase,
  LogOut,
  Info,
  Sparkles,
  Coffee,
  Check,
  ChevronDown,
  ChevronUp,
  Filter,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

interface CartItem {
  product: Product;
  quantity: number;
}

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface StudentOrderingViewProps {
  user: User;
  businessStatus: any;
  onLogout: () => void;
}

export const StudentOrderingView: React.FC<StudentOrderingViewProps> = ({
  user,
  businessStatus,
  onLogout
}) => {
  // Active Navigation Tab: 'menu' | 'orders' | 'support' | 'profile'
  const [activeTab, setActiveTab] = useState<'menu' | 'orders' | 'support' | 'profile'>('menu');

  // Data state
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Real-time Queue position state
  const [liveQueueData, setLiveQueueData] = useState<any>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | 'ALL'>('ALL');
  const [availableOnlyFilter, setAvailableOnlyFilter] = useState(false);
  const [sortBy, setSortBy] = useState<'default' | 'price_low' | 'price_high' | 'name'>('default');

  // Cart state
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(`saec_cart_${user.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartBounce, setCartBounce] = useState(false);

  // Quantities per product card stepper state
  const [cardQuantities, setCardQuantities] = useState<{ [productId: number]: number }>({});

  // Toast Notification State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Checkout state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [pickupTime, setPickupTime] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QR_COUNTER'>('CASH');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderError, setOrderError] = useState('');

  // Placed Order Success Modal
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  // Thermal Receipt Modal
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

  // Support / Issue Modal State
  const [issueOrderCode, setIssueOrderCode] = useState('');
  const [issueCategory, setIssueCategory] = useState('ORDER_ISSUE');
  const [issueDescription, setIssueDescription] = useState('');
  const [issueSubmitting, setIssueSubmitting] = useState(false);
  const [issueSuccess, setIssueSuccess] = useState('');
  const [issueError, setIssueError] = useState('');

  // Save Cart to local storage
  useEffect(() => {
    try {
      localStorage.setItem(`saec_cart_${user.id}`, JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart, user.id]);

  // Initial Load & Live 5s Queue Polling
  useEffect(() => {
    loadProducts();
    loadCategories();
    loadMyOrders();

    const interval = setInterval(() => {
      loadMyOrders();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  };

  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      const data = await api.getProducts();
      setProducts(data);
    } catch (e) {
      console.error('Failed to load products', e);
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch (e) {
      console.error('Failed to load categories', e);
    }
  };

  const loadMyOrders = async () => {
    setLoadingOrders(true);
    try {
      const data = await api.getOrders();
      setOrders(data);

      const queueSync = await api.getRealtimeQueueSync();
      if (queueSync) {
        setLiveQueueData(queueSync);
      }
    } catch (e) {
      console.error('Failed to load my orders', e);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => p.is_active);

    if (selectedCategory !== 'ALL') {
      result = result.filter((p) => {
        if (typeof p.category === 'object' && p.category !== null) {
          return (p.category as any).id === selectedCategory;
        }
        return p.category === selectedCategory;
      });
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          (p.category_name && p.category_name.toLowerCase().includes(query))
      );
    }

    if (availableOnlyFilter) {
      result = result.filter((p) => p.today_availability === 'AVAILABLE' && p.current_stock > 0);
    }

    if (sortBy === 'price_low') {
      result.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortBy === 'price_high') {
      result.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [products, selectedCategory, searchQuery, availableOnlyFilter, sortBy]);

  // Cart Functions
  const cartTotalCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);
  }, [cart]);

  const handleAddToCart = (product: Product, qty: number = 1) => {
    if (product.today_availability === 'OUT_OF_STOCK' || product.current_stock <= 0) {
      showToast(`${product.name} is currently out of stock.`, 'error');
      return;
    }

    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = updated[existingIndex].quantity + qty;
        if (newQty > product.current_stock) {
          showToast(`Only ${product.current_stock} units available for ${product.name}.`, 'error');
          return prev;
        }
        updated[existingIndex].quantity = newQty;
        return updated;
      } else {
        if (qty > product.current_stock) {
          showToast(`Only ${product.current_stock} units available for ${product.name}.`, 'error');
          return prev;
        }
        return [...prev, { product, quantity: qty }];
      }
    });

    // Reset card stepper
    setCardQuantities((prev) => ({ ...prev, [product.id]: 1 }));

    // Animations
    setCartBounce(true);
    setTimeout(() => setCartBounce(false), 400);

    showToast(`✓ ${product.name} added to cart`, 'success');
  };

  const handleUpdateCartQuantity = (productId: number, delta: number) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === productId);
      if (!existing) return prev;

      const newQty = existing.quantity + delta;
      if (newQty <= 0) {
        return prev.filter((item) => item.product.id !== productId);
      }

      if (newQty > existing.product.current_stock) {
        showToast(`Only ${existing.product.current_stock} units available.`, 'error');
        return prev;
      }

      return prev.map((item) => (item.product.id === productId ? { ...item, quantity: newQty } : item));
    });
  };

  const handleRemoveCartItem = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Submit Order
  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;

    setIsSubmittingOrder(true);
    setOrderError('');

    try {
      const itemsData = cart.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
        notes: ''
      }));

      const isFaculty = user.role === 'FACULTY';

      const createdOrder = await api.createOrder({
        customer_type: isFaculty ? 'FACULTY' : 'STUDENT',
        order_source: 'MOBILE',
        order_type: 'READY_FOOD',
        pickup_time: pickupTime || undefined,
        notes: orderNotes || undefined,
        items_data: itemsData,
        is_paid: false
      });

      setPlacedOrder(createdOrder);
      setCart([]);
      setIsCheckoutOpen(false);
      setIsCartOpen(false);
      loadMyOrders();

      showToast('✓ Order placed successfully!', 'success');
    } catch (err: any) {
      setOrderError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Submit Payment Support Ticket
  const handleSubmitSupportTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueCategory || !issueDescription) return;

    setIssueSubmitting(true);
    setIssueSuccess('');
    setIssueError('');

    try {
      await api.createPaymentSupportTicket({
        order_code: issueOrderCode || undefined,
        issue_category: issueCategory,
        description: issueDescription
      });

      setIssueSuccess('✓ Your ticket has been submitted to Canteen Admin.');
      setIssueOrderCode('');
      setIssueDescription('');
    } catch (err: any) {
      setIssueError(err.message || 'Failed to submit ticket.');
    } finally {
      setIssueSubmitting(false);
    }
  };

  // Active active order for live tracking
  const activeOrder = useMemo(() => {
    return orders.find(
      (o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED' && o.status !== 'REJECTED'
    );
  }, [orders]);

  return (
    <div className="animate-fade-in" style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '80px' }}>
      {/* Toast Notification Container */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast-item ${toast.type}`}>
            {toast.type === 'success' && <CheckCircle2 size={18} color="#10b981" />}
            {toast.type === 'error' && <AlertCircle size={18} color="#ef4444" />}
            {toast.type === 'info' && <Info size={18} color="#ea580c" />}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Top Navbar */}
      <header style={{ position: 'sticky', top: 0, zIndex: 800, background: '#ffffff', borderBottom: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          {/* Logo & Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => setActiveTab('menu')}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#ea580c', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(234, 88, 12, 0.3)' }}>
              <Coffee size={22} />
            </div>
            <div>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.2rem', fontWeight: 900, color: '#1e293b', lineHeight: 1.1, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                SAEC CAFÉ
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>
                Good Food. Less Waiting.
              </div>
            </div>
          </div>

          {/* Desktop Search Bar */}
          <div style={{ flex: 1, maxWidth: '440px', display: 'flex', alignItems: 'center', position: 'relative' }}>
            <Search size={17} style={{ position: 'absolute', left: '12px', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search coffee, samosas, puffs, beverages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '2.4rem', paddingRight: searchQuery ? '2.2rem' : '1rem', height: '40px', fontSize: '0.85rem', borderRadius: '9999px' }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Right Navigation Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={() => setActiveTab('orders')}
              style={{
                background: activeTab === 'orders' ? '#fff7ed' : '#ffffff',
                border: activeTab === 'orders' ? '1px solid #fed7aa' : '1px solid #e2e8f0',
                color: activeTab === 'orders' ? '#ea580c' : '#475569',
                padding: '0.5rem 0.9rem',
                borderRadius: '9999px',
                fontWeight: 700,
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                cursor: 'pointer'
              }}
            >
              <ShoppingBag size={16} />
              <span className="desktop-only">My Orders</span>
              {orders.filter((o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED').length > 0 && (
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ea580c' }} />
              )}
            </button>

            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className={`btn btn-primary ${cartBounce ? 'cart-bounce-animation' : ''}`}
              style={{ padding: '0.5rem 1rem', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: 800 }}
            >
              <ShoppingCart size={17} />
              <span>Cart</span>
              <span style={{ background: '#ffffff', color: '#ea580c', padding: '0.1rem 0.5rem', borderRadius: '9999px', fontSize: '0.78rem' }}>
                {cartTotalCount}
              </span>
            </button>

            {/* User Profile dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderLeft: '1px solid #e2e8f0', paddingLeft: '0.75rem' }}>
              <button
                onClick={() => setActiveTab('profile')}
                style={{ background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e293b', cursor: 'pointer' }}
              >
                <UserIcon size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem 1.25rem' }}>
        {/* ======================= MENU TAB ======================= */}
        {activeTab === 'menu' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Hero Section Banner */}
            <div
              className="glass-card"
              style={{
                padding: '2rem 2.25rem',
                background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                color: '#ffffff',
                borderRadius: '24px',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 12px 30px rgba(234, 88, 12, 0.25)'
              }}
            >
              <div style={{ maxWidth: '650px', position: 'relative', zIndex: 2 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', padding: '0.35rem 0.85rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.85rem' }}>
                  <Sparkles size={14} /> Official Canteen Food-Tech Platform
                </div>
                <h1 style={{ fontSize: '2.3rem', fontWeight: 900, color: '#ffffff', lineHeight: 1.15, marginBottom: '0.65rem' }}>
                  Good Food. Less Waiting.
                </h1>
                <p style={{ fontSize: '0.98rem', color: '#ffedd5', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                  Order ahead, skip the queue and enjoy your meal at Syed Ammal Engineering College Canteen.
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#ffffff', color: '#059669', padding: '0.45rem 0.95rem', borderRadius: '9999px', fontWeight: 800, fontSize: '0.8rem' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                    🟢 CANTEEN OPEN • Orders accepted until 3:30 PM
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#ffedd5', fontWeight: 600 }}>
                    💳 Payment: Cash or Counter QR at Canteen Counter
                  </div>
                </div>
              </div>

              {/* Decorative Food Visual Icons */}
              <div style={{ position: 'absolute', right: '2rem', bottom: '-1rem', opacity: 0.15, fontSize: '8rem', pointerEvents: 'none' }}>
                ☕🥐🍔
              </div>
            </div>

            {/* Active Live Order Tracker Banner (if any) */}
            {activeOrder && (
              <div
                onClick={() => setActiveTab('orders')}
                className="glass-card"
                style={{
                  padding: '1rem 1.25rem',
                  background: '#fff7ed',
                  border: '1px solid #fed7aa',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#ea580c', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Clock size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1e293b' }}>
                      Active Order <strong>#{activeOrder.order_number}</strong> is in progress
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      Status: <strong style={{ color: '#ea580c' }}>{activeOrder.status}</strong> •
                      {liveQueueData?.queue_position ? ` Position #${liveQueueData.queue_position}` : ' Tap to track live status'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#ea580c', fontWeight: 800, fontSize: '0.82rem' }}>
                  Track Order <ChevronRight size={16} />
                </div>
              </div>
            )}

            {/* Category Chips Bar & Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                {/* Category Chips Scroll */}
                <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem', flex: 1 }}>
                  <button
                    onClick={() => setSelectedCategory('ALL')}
                    style={{
                      whiteSpace: 'nowrap',
                      padding: '0.55rem 1.15rem',
                      borderRadius: '9999px',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      border: selectedCategory === 'ALL' ? '1px solid #ea580c' : '1px solid #e2e8f0',
                      background: selectedCategory === 'ALL' ? '#ea580c' : '#ffffff',
                      color: selectedCategory === 'ALL' ? '#ffffff' : '#475569',
                      transition: 'all 0.18s ease'
                    }}
                  >
                    All Items ({products.filter((p) => p.is_active).length})
                  </button>

                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      style={{
                        whiteSpace: 'nowrap',
                        padding: '0.55rem 1.15rem',
                        borderRadius: '9999px',
                        fontWeight: 800,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        border: selectedCategory === cat.id ? '1px solid #ea580c' : '1px solid #e2e8f0',
                        background: selectedCategory === cat.id ? '#ea580c' : '#ffffff',
                        color: selectedCategory === cat.id ? '#ffffff' : '#475569',
                        transition: 'all 0.18s ease'
                      }}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>

                {/* Filters */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    onClick={() => setAvailableOnlyFilter(!availableOnlyFilter)}
                    style={{
                      padding: '0.45rem 0.85rem',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: availableOnlyFilter ? '1px solid #10b981' : '1px solid #cbd5e1',
                      background: availableOnlyFilter ? '#ecfdf5' : '#ffffff',
                      color: availableOnlyFilter ? '#059669' : '#475569'
                    }}
                  >
                    {availableOnlyFilter ? '✓ Available Only' : 'Show All Stock'}
                  </button>

                  <select
                    value={sortBy}
                    onChange={(e: any) => setSortBy(e.target.value)}
                    style={{ padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.78rem', fontWeight: 700, color: '#475569', background: '#ffffff' }}
                  >
                    <option value="default">Sort: Default</option>
                    <option value="price_low">Price: Low to High</option>
                    <option value="price_high">Price: High to Low</option>
                    <option value="name">Name: A-Z</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Food Grid Section */}
            {loadingProducts ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <div key={n} className="glass-card" style={{ padding: 0, overflow: 'hidden', height: '320px' }}>
                    <div className="skeleton" style={{ height: '160px' }} />
                    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div className="skeleton" style={{ height: '20px', width: '70%', borderRadius: '4px' }} />
                      <div className="skeleton" style={{ height: '14px', width: '90%', borderRadius: '4px' }} />
                      <div className="skeleton" style={{ height: '28px', width: '40%', marginTop: '0.5rem', borderRadius: '4px' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                <Utensils size={48} color="#cbd5e1" style={{ margin: '0 auto 1rem auto' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b' }}>No food items found</h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>
                  Try adjusting your search prompt or category filter.
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '1.25rem' }}>
                {filteredProducts.map((product) => {
                  const cardQty = cardQuantities[product.id] || 1;
                  const isAvailable = product.today_availability === 'AVAILABLE' && product.current_stock > 0;
                  const isLowStock = (product as any).today_availability === 'LOW_STOCK' || (product.current_stock > 0 && product.current_stock <= 10);

                  return (
                    <div
                      key={product.id}
                      className="glass-card"
                      style={{
                        padding: 0,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        borderRadius: '20px',
                        border: '1px solid #e2e8f0'
                      }}
                    >
                      {/* Image Thumbnail Container */}
                      <div style={{ height: '170px', width: '100%', position: 'relative', overflow: 'hidden', background: '#f1f5f9' }}>
                        <img
                          src={getMediaUrl(product.image) || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80'}
                          alt={product.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transition: 'transform 0.3s ease'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                        />

                        {/* Category Badge */}
                        <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(15,23,42,0.75)', color: '#ffffff', backdropFilter: 'blur(4px)', padding: '0.25rem 0.65rem', borderRadius: '9999px', fontSize: '0.68rem', fontWeight: 800 }}>
                          {product.category_name || (typeof product.category === 'object' ? (product.category as any).name : 'General')}
                        </div>

                        {/* Status Badge */}
                        <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                          {!isAvailable ? (
                            <span className="badge badge-danger" style={{ fontSize: '0.65rem' }}>Out of Stock</span>
                          ) : isLowStock ? (
                            <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>Low Stock ({product.current_stock})</span>
                          ) : (
                            <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>● Available</span>
                          )}
                        </div>
                      </div>

                      {/* Card Content Body */}
                      <div style={{ padding: '1.15rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.35rem' }}>
                            <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#1e293b', margin: 0 }}>
                              {product.name}
                            </h3>
                            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#ea580c' }}>
                              ₹{product.price}
                            </div>
                          </div>

                          <p style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.4, margin: '0 0 1rem 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {product.description || 'Freshly prepared delicious item at SAEC Canteen.'}
                          </p>
                        </div>

                        {/* Card Controls & Add Button */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
                          {/* Stepper */}
                          <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', borderRadius: '8px', padding: '0.2rem' }}>
                            <button
                              onClick={() => setCardQuantities((prev) => ({ ...prev, [product.id]: Math.max(1, cardQty - 1) }))}
                              disabled={!isAvailable}
                              style={{ width: '28px', height: '28px', border: 'none', background: '#ffffff', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e293b' }}
                            >
                              <Minus size={14} />
                            </button>
                            <span style={{ padding: '0 0.6rem', fontSize: '0.85rem', fontWeight: 800, color: '#1e293b' }}>
                              {cardQty}
                            </span>
                            <button
                              onClick={() => setCardQuantities((prev) => ({ ...prev, [product.id]: Math.min(product.current_stock, cardQty + 1) }))}
                              disabled={!isAvailable}
                              style={{ width: '28px', height: '28px', border: 'none', background: '#ffffff', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e293b' }}
                            >
                              <Plus size={14} />
                            </button>
                          </div>

                          {/* Add Button */}
                          <button
                            onClick={() => handleAddToCart(product, cardQty)}
                            disabled={!isAvailable}
                            className="btn btn-primary"
                            style={{ flex: 1, padding: '0.55rem', fontSize: '0.82rem', fontWeight: 800, opacity: !isAvailable ? 0.5 : 1 }}
                          >
                            <Plus size={16} /> Add to Cart
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ======================= MY ORDERS TAB ======================= */}
        {activeTab === 'orders' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '850px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1e293b', margin: 0 }}>
                  Order History & Live Status
                </h2>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>
                  Track your physical canteen counter payments and kitchen status in real time.
                </p>
              </div>
              <button onClick={loadMyOrders} className="btn btn-secondary" style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}>
                <RefreshCw size={14} /> Refresh Status
              </button>
            </div>

            {/* Active Live Order Stepper Card (if any) */}
            {activeOrder && (
              <div className="glass-card" style={{ padding: '1.5rem', background: '#ffffff', border: '2px solid #ea580c', borderRadius: '20px', boxShadow: '0 8px 24px rgba(234, 88, 12, 0.15)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <span className="badge badge-primary" style={{ marginBottom: '0.4rem' }}>LIVE ACTIVE ORDER</span>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#1e293b', margin: 0 }}>
                      Order #{activeOrder.order_number}
                    </h3>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ea580c' }}>
                      ₹{activeOrder.total_amount}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {new Date(activeOrder.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                {/* Queue Position Highlight Box */}
                {liveQueueData?.queue_position && (
                  <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '12px', padding: '1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-around', textAlign: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#9a3412', fontWeight: 800, textTransform: 'uppercase' }}>Your Position</div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ea580c' }}>#{liveQueueData.queue_position}</div>
                    </div>
                    <div style={{ borderLeft: '1px solid #fed7aa', height: '35px' }} />
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#9a3412', fontWeight: 800, textTransform: 'uppercase' }}>Orders Ahead</div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#1e293b' }}>{liveQueueData.orders_ahead}</div>
                    </div>
                  </div>
                )}

                {/* Stepper Progress Timeline */}
                <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                  {/* Stepper Progress Bar */}
                  <div style={{ position: 'absolute', top: '16px', left: '10%', right: '10%', height: '3px', background: '#e2e8f0', zIndex: 1 }}>
                    <div
                      style={{
                        height: '100%',
                        background: '#ea580c',
                        width:
                          activeOrder.status === 'DELIVERED'
                            ? '100%'
                            : activeOrder.status === 'READY'
                            ? '75%'
                            : activeOrder.status === 'PREPARING'
                            ? '50%'
                            : activeOrder.status === 'CONFIRMED'
                            ? '25%'
                            : '0%',
                        transition: 'width 0.4s ease'
                      }}
                    />
                  </div>

                  {/* Steps */}
                  {[
                    { label: 'Payment Pending', active: true, done: activeOrder.payment_status === 'PAID' },
                    { label: 'Confirmed', active: activeOrder.status !== 'AWAITING_PAYMENT', done: activeOrder.status === 'PREPARING' || activeOrder.status === 'READY' || activeOrder.status === 'DELIVERED' },
                    { label: 'Preparing', active: activeOrder.status === 'PREPARING' || activeOrder.status === 'READY' || activeOrder.status === 'DELIVERED', done: activeOrder.status === 'READY' || activeOrder.status === 'DELIVERED' },
                    { label: 'Ready for Pickup', active: activeOrder.status === 'READY' || activeOrder.status === 'DELIVERED', done: activeOrder.status === 'DELIVERED' }
                  ].map((step, idx) => (
                    <div key={idx} style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', flex: 1 }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: step.done ? '#10b981' : step.active ? '#ea580c' : '#ffffff',
                          color: step.done || step.active ? '#ffffff' : '#94a3b8',
                          border: step.done || step.active ? 'none' : '2px solid #cbd5e1',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.8rem'
                        }}
                      >
                        {step.done ? '✓' : idx + 1}
                      </div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: step.active ? '#1e293b' : '#94a3b8', textAlign: 'center' }}>
                        {step.label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Print Receipt Action */}
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                  <button
                    onClick={() => setReceiptOrder(activeOrder)}
                    className="btn btn-secondary"
                    style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem' }}
                  >
                    <Printer size={14} /> View / Print Bill
                  </button>
                </div>
              </div>
            )}

            {/* Orders History List */}
            {loadingOrders ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[1, 2, 3].map((n) => (
                  <div key={n} className="skeleton" style={{ height: '90px', borderRadius: '16px' }} />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                <ShoppingBag size={44} color="#cbd5e1" style={{ margin: '0 auto 1rem auto' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b' }}>No orders placed yet</h3>
                <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.25rem' }}>
                  Browse our menu and place your food order ahead!
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {orders.map((o) => (
                  <div key={o.id} className="glass-card" style={{ padding: '1.15rem 1.35rem', borderRadius: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <span style={{ fontWeight: 900, fontSize: '1rem', color: '#1e293b' }}>
                            #{o.order_number}
                          </span>
                          <span className={`badge ${o.status === 'DELIVERED' ? 'badge-success' : o.status === 'CANCELLED' ? 'badge-danger' : 'badge-primary'}`}>
                            {o.status}
                          </span>
                          <span className={`badge ${o.payment_status === 'PAID' ? 'badge-success' : 'badge-warning'}`}>
                            {o.payment_status === 'PAID' ? 'PAID' : 'PAYMENT PENDING'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.3rem' }}>
                          {new Date(o.created_at).toLocaleDateString()} at {new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {o.items?.length || 0} items
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#ea580c' }}>
                          ₹{o.total_amount}
                        </div>
                        <button
                          onClick={() => setReceiptOrder(o)}
                          className="btn btn-secondary"
                          style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem' }}
                        >
                          <Printer size={14} /> Bill
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ======================= SUPPORT TAB ======================= */}
        {activeTab === 'support' && (
          <div style={{ maxWidth: '650px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="glass-card" style={{ padding: '1.75rem', borderRadius: '20px' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#1e293b', marginBottom: '0.4rem' }}>
                Payment Support & Issue Desk
              </h2>
              <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1.25rem' }}>
                Have a query regarding payment at the canteen counter or order status? Submit a ticket directly to Canteen Administration.
              </p>

              {issueSuccess && (
                <div style={{ padding: '0.85rem', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', color: '#059669', fontSize: '0.82rem', fontWeight: 700, marginBottom: '1rem' }}>
                  {issueSuccess}
                </div>
              )}

              {issueError && (
                <div style={{ padding: '0.85rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '0.82rem', fontWeight: 700, marginBottom: '1rem' }}>
                  {issueError}
                </div>
              )}

              <form onSubmit={handleSubmitSupportTicket} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                    Order Number (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CAN-4821"
                    value={issueOrderCode}
                    onChange={(e) => setIssueOrderCode(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                    Issue Category
                  </label>
                  <select
                    value={issueCategory}
                    onChange={(e) => setIssueCategory(e.target.value)}
                    className="input-field"
                  >
                    <option value="ORDER_ISSUE">Order Status Query</option>
                    <option value="COUNTER_PAYMENT">Counter Payment Verification Query</option>
                    <option value="REFUND">Cancellation & Refund Request</option>
                    <option value="OTHER">General Support</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                    Issue Description *
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Describe your issue or query clearly..."
                    value={issueDescription}
                    onChange={(e) => setIssueDescription(e.target.value)}
                    required
                    className="input-field"
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <button type="submit" disabled={issueSubmitting} className="btn btn-primary" style={{ padding: '0.75rem', fontWeight: 800 }}>
                  {issueSubmitting ? 'Submitting...' : 'Submit Support Ticket'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ======================= PROFILE TAB ======================= */}
        {activeTab === 'profile' && (
          <div style={{ maxWidth: '550px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="glass-card" style={{ padding: '2rem', borderRadius: '20px', textAlign: 'center' }}>
              <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: '#fff7ed', border: '2px solid #fed7aa', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                <UserIcon size={32} />
              </div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#1e293b', margin: 0 }}>
                {user.full_name}
              </h2>
              <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.2rem' }}>
                {user.email}
              </div>
              <div style={{ marginTop: '0.65rem' }}>
                <span className="badge badge-primary">{user.role}</span>
              </div>

              <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '0.75rem', textAlign: 'left', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Department / Class:</span>
                  <span style={{ fontWeight: 700, color: '#1e293b' }}>{user.department || 'SAEC College'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Mobile Number:</span>
                  <span style={{ fontWeight: 700, color: '#1e293b' }}>{user.mobile_number || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Status:</span>
                  <span style={{ fontWeight: 700, color: '#10b981' }}>{user.status}</span>
                </div>
              </div>

              <button
                onClick={onLogout}
                className="btn btn-secondary"
                style={{ width: '100%', marginTop: '1.5rem', color: '#ef4444', borderColor: '#fecaca' }}
              >
                <LogOut size={16} /> Log Out Account
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ======================= CART DRAWER (Desktop & Mobile Sheet) ======================= */}
      {isCartOpen && (
        <div className="modal-overlay" onClick={() => setIsCartOpen(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              right: 0,
              top: 0,
              bottom: 0,
              maxWidth: '440px',
              height: '100vh',
              borderRadius: '24px 0 0 24px',
              display: 'flex',
              flexDirection: 'column',
              padding: 0
            }}
          >
            {/* Header */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', fontWeight: 900, color: '#1e293b' }}>
                <ShoppingCart size={20} color="#ea580c" /> Your Cart ({cartTotalCount})
              </div>
              <button onClick={() => setIsCartOpen(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Cart Items List */}
            <div style={{ flex: 1, padding: '1.25rem 1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
                  <ShoppingCart size={44} color="#cbd5e1" style={{ margin: '0 auto 1rem auto' }} />
                  <div style={{ fontWeight: 800, color: '#1e293b' }}>Your cart is empty</div>
                  <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Add delicious food items from the canteen menu.</div>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.product.id} style={{ display: 'flex', gap: '0.85rem', alignItems: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <img
                      src={getMediaUrl(item.product.image) || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&auto=format&fit=crop&q=80'}
                      alt={item.product.name}
                      style={{ width: '54px', height: '54px', borderRadius: '8px', objectFit: 'cover' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1e293b' }}>{item.product.name}</div>
                      <div style={{ fontSize: '0.82rem', color: '#ea580c', fontWeight: 800 }}>₹{item.product.price}</div>
                    </div>

                    {/* Stepper */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <button onClick={() => handleUpdateCartQuantity(item.product.id, -1)} style={{ width: '26px', height: '26px', border: '1px solid #cbd5e1', background: '#ffffff', borderRadius: '6px', cursor: 'pointer' }}>
                        -
                      </button>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>{item.quantity}</span>
                      <button onClick={() => handleUpdateCartQuantity(item.product.id, 1)} style={{ width: '26px', height: '26px', border: '1px solid #cbd5e1', background: '#ffffff', borderRadius: '6px', cursor: 'pointer' }}>
                        +
                      </button>
                      <button onClick={() => handleRemoveCartItem(item.product.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', marginLeft: '0.3rem' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer Summary & Checkout */}
            {cart.length > 0 && (
              <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid #e2e8f0', background: '#ffffff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#64748b' }}>
                  <span>Subtotal</span>
                  <span>₹{cartSubtotal}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.85rem', fontSize: '1.1rem', fontWeight: 900, color: '#1e293b' }}>
                  <span>Total Amount</span>
                  <span style={{ color: '#ea580c' }}>₹{cartSubtotal}</span>
                </div>

                <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px', padding: '0.65rem 0.85rem', fontSize: '0.75rem', color: '#c2410c', fontWeight: 700, marginBottom: '1rem' }}>
                  💳 Payment is completed at the physical canteen counter via Cash or Counter QR.
                </div>

                <button
                  onClick={() => setIsCheckoutOpen(true)}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.8rem', fontWeight: 900, fontSize: '0.92rem' }}
                >
                  PROCEED TO CHECKOUT <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================= CHECKOUT MODAL ======================= */}
      {isCheckoutOpen && (
        <div className="modal-overlay" onClick={() => setIsCheckoutOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#1e293b' }}>
                Checkout & Order Confirmation
              </h3>
              <button onClick={() => setIsCheckoutOpen(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {orderError && (
              <div style={{ padding: '0.75rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '0.8rem', fontWeight: 700, marginBottom: '1rem' }}>
                {orderError}
              </div>
            )}

            {/* Order Items Summary */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.85rem 1rem', marginBottom: '1.25rem', maxHeight: '160px', overflowY: 'auto' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Selected Items</div>
              {cart.map((item) => (
                <div key={item.product.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.35rem' }}>
                  <span>{item.quantity}x {item.product.name}</span>
                  <span style={{ fontWeight: 800 }}>₹{Number(item.product.price) * item.quantity}</span>
                </div>
              ))}
            </div>

            {/* Payment Method Selection */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.5rem' }}>
                Select Counter Payment Mode *
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH')}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '10px',
                    border: paymentMethod === 'CASH' ? '2px solid #ea580c' : '1px solid #cbd5e1',
                    background: paymentMethod === 'CASH' ? '#fff7ed' : '#ffffff',
                    color: '#1e293b',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  💵 Cash at Counter
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('QR_COUNTER')}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '10px',
                    border: paymentMethod === 'QR_COUNTER' ? '2px solid #ea580c' : '1px solid #cbd5e1',
                    background: paymentMethod === 'QR_COUNTER' ? '#fff7ed' : '#ffffff',
                    color: '#1e293b',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  📱 QR at Counter
                </button>
              </div>
            </div>

            {/* Total Amount & Notice */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1rem', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '12px', marginBottom: '1.25rem' }}>
              <span style={{ fontWeight: 800, color: '#1e293b' }}>Total Payable at Counter:</span>
              <span style={{ fontSize: '1.3rem', fontWeight: 900, color: '#ea580c' }}>₹{cartSubtotal}</span>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={isSubmittingOrder}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.85rem', fontWeight: 900, fontSize: '0.95rem' }}
            >
              {isSubmittingOrder ? 'Placing Order...' : 'CONFIRM & PLACE ORDER'}
            </button>
          </div>
        </div>
      )}

      {/* ======================= ORDER PLACED SUCCESS MODAL ======================= */}
      {placedOrder && (
        <div className="modal-overlay" onClick={() => setPlacedOrder(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', padding: '2rem', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
              <Check size={36} />
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1e293b', margin: 0 }}>
              ORDER PLACED!
            </h2>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ea580c', margin: '0.35rem 0 1rem 0' }}>
              #{placedOrder.order_number}
            </div>

            <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '12px', padding: '1rem', fontSize: '0.82rem', color: '#c2410c', fontWeight: 700, marginBottom: '1.25rem', textAlign: 'left', lineHeight: 1.4 }}>
              💳 Please complete payment of <strong>₹{placedOrder.total_amount}</strong> at the physical canteen counter. Your order will enter kitchen prep once verified by Admin.
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => {
                  setReceiptOrder(placedOrder);
                  setPlacedOrder(null);
                }}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '0.65rem' }}
              >
                <Printer size={16} /> Bill
              </button>
              <button
                onClick={() => {
                  setPlacedOrder(null);
                  setActiveTab('orders');
                }}
                className="btn btn-primary"
                style={{ flex: 1, padding: '0.65rem', fontWeight: 800 }}
              >
                Track Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thermal Receipt Component Modal */}
      {receiptOrder && (
        <ThermalReceipt order={receiptOrder} onClose={() => setReceiptOrder(null)} />
      )}

      {/* Mobile Sticky Bottom Navigation */}
      <div className="mobile-bottom-nav">
        <button className={`mobile-nav-btn ${activeTab === 'menu' ? 'active' : ''}`} onClick={() => setActiveTab('menu')}>
          <Utensils size={20} /> Menu
        </button>
        <button className={`mobile-nav-btn ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
          <ShoppingBag size={20} /> Orders
        </button>
        <button className="mobile-nav-btn" onClick={() => setIsCartOpen(true)}>
          <ShoppingCart size={20} /> Cart ({cartTotalCount})
        </button>
        <button className={`mobile-nav-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
          <UserIcon size={20} /> Profile
        </button>
      </div>
    </div>
  );
};
