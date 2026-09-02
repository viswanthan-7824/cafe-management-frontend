import React, { useState, useEffect, useMemo } from 'react';
import type { User, Product, Category, Order } from '../types';
import { api, getMediaUrl } from '../services/api';
import { ThermalReceipt } from './ThermalReceipt';
import {
  Coffee,
  Search,
  ShoppingCart,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  User as UserIcon,
  Plus,
  Minus,
  Trash2,
  X,
  Printer,
  HelpCircle,
  Phone,
  Mail,
  GraduationCap,
  Briefcase,
  LogOut,
  Info,
  Check,
  RefreshCw,
  Utensils,
  Receipt,
  HelpCircle as SupportIcon,
  FastForward,
  CheckCircle,
  Clock,
  Circle,
  XCircle,
  FileText,
  Badge,
  ShieldCheck,
  Flame,
  ArrowRight
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

  // Search & Filters (Matching Flutter MenuTab)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | 'ALL'>('ALL');
  const [availableOnlyFilter, setAvailableOnlyFilter] = useState(false);
  const [sortBy, setSortBy] = useState<'default' | 'price_low' | 'price_high' | 'name'>('default');

  // Cart state (Matching Flutter CartDrawer)
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(`saec_cart_${user.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Card quantities for product grid steppers (Matching Flutter MenuTab _cardQuantities)
  const [cardQuantities, setCardQuantities] = useState<{ [productId: number]: number }>({});

  // Toast Notification State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Checkout Modal state (Matching Flutter CheckoutModal)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QR_COUNTER'>('CASH');
  const [pickupSlot, setPickupSlot] = useState<string>('ASAP (Next 10-15 Mins)');
  const [orderNotes, setOrderNotes] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Placed Order Success Modal state (Matching Flutter PlacedOrderModal)
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  // Receipt Modal state (Matching Flutter ReceiptModal)
  const [viewingReceiptOrder, setViewingReceiptOrder] = useState<Order | null>(null);

  // Support Ticket Form state (Matching Flutter SupportTab)
  const [supportOrderCode, setSupportOrderCode] = useState<string>('');
  const [supportCategory, setSupportCategory] = useState<string>('ORDER_ISSUE');
  const [supportDescription, setSupportDescription] = useState<string>('');
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);
  const [supportMessage, setSupportMessage] = useState<{ text: string; isSuccess: boolean } | null>(null);

  // Logout confirmation dialog state (Matching Flutter ProfileTab _showLogoutConfirmation)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Sync Cart to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(`saec_cart_${user.id}`, JSON.stringify(cart));
    } catch (_) {}
  }, [cart, user.id]);

  // Initial Load & Live Queue Polling (Matching Flutter 5s timer)
  useEffect(() => {
    loadProducts();
    loadCategories();
    loadOrders();

    const interval = setInterval(() => {
      loadOrders(true);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      const data = await api.getProducts();
      setProducts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadOrders = async (silent = false) => {
    if (!silent) setLoadingOrders(true);
    try {
      const data = await api.getOrders();
      setOrders(data);
    } catch (e) {
      console.error(e);
    } finally {
      if (!silent) setLoadingOrders(false);
    }
  };

  // Filtered Products (Matching Flutter MenuTab _filteredProducts)
  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => p.is_active);

    if (selectedCategory !== 'ALL') {
      result = result.filter((p) => p.category_id === selectedCategory || (p.category && p.category.id === selectedCategory));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((p) => {
        const nameMatch = p.name.toLowerCase().includes(q);
        const descMatch = p.description?.toLowerCase().includes(q) || false;
        const catMatch = p.category_name?.toLowerCase().includes(q) || false;
        return nameMatch || descMatch || catMatch;
      });
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

  // Cart Quantities & Totals
  const cartItemCount = useMemo(() => {
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
      const index = prev.findIndex((i) => i.product.id === product.id);
      if (index >= 0) {
        const copy = [...prev];
        copy[index].quantity += qty;
        return copy;
      } else {
        return [...prev, { product, quantity: qty }];
      }
    });

    showToast(`Added ${product.name} to cart!`, 'success');
  };

  const handleUpdateCartQty = (productId: number, newQty: number) => {
    setCart((prev) => {
      if (newQty <= 0) {
        return prev.filter((i) => i.product.id !== productId);
      }
      return prev.map((i) => (i.product.id === productId ? { ...i, quantity: newQty } : i));
    });
  };

  const handleRemoveCartItem = (productId: number) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Submit Order (Matching Flutter CheckoutModal)
  const handleConfirmOrder = async () => {
    if (cart.length === 0 || isSubmittingOrder) return;

    setIsSubmittingOrder(true);

    try {
      const items = cart.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
      }));

      const created = await api.createCustomerOrder({
        customer_type: user.role === 'FACULTY' ? 'FACULTY' : 'STUDENT',
        items,
        pickup_time: pickupSlot,
        notes: orderNotes,
        payment_method: paymentMethod,
      });

      setPlacedOrder(created);
      setCart([]);
      setIsCheckoutOpen(false);
      setIsCartOpen(false);
      setOrderNotes('');
      loadOrders();
    } catch (err: any) {
      showToast(err.message || 'Failed to place order.', 'error');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Submit Support Ticket (Matching Flutter SupportTab)
  const handleSubmitSupportTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportDescription.trim()) {
      setSupportMessage({ text: 'Please provide a detailed description.', isSuccess: false });
      return;
    }

    setIsSubmittingSupport(true);
    setSupportMessage(null);

    try {
      await api.createPaymentSupportTicket({
        order_code: supportOrderCode || undefined,
        category: supportCategory,
        description: supportDescription.trim(),
      });

      setSupportMessage({ text: 'Your support request has been submitted to the canteen manager.', isSuccess: true });
      setSupportDescription('');
      setSupportOrderCode('');
    } catch (err: any) {
      setSupportMessage({ text: err.message || 'Failed to submit ticket.', isSuccess: false });
    } finally {
      setIsSubmittingSupport(false);
    }
  };

  // Active vs History Orders (Matching Flutter OrdersTab)
  const activeOrders = useMemo(() => {
    return orders.filter(
      (o) => o.status !== 'COMPLETED' && o.status !== 'CANCELLED' && o.status !== 'DELIVERED' && o.status !== 'REJECTED'
    );
  }, [orders]);

  const historyOrders = useMemo(() => {
    return orders.filter(
      (o) => o.status === 'COMPLETED' || o.status === 'CANCELLED' || o.status === 'DELIVERED' || o.status === 'REJECTED'
    );
  }, [orders]);

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0f172a',
        color: '#ffffff',
        fontFamily: "'Inter', sans-serif",
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Toast Notification Container */}
      <div
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 2000,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxWidth: '360px',
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              padding: '12px 16px',
              borderRadius: '10px',
              backgroundColor: toast.type === 'success' ? '#166534' : toast.type === 'error' ? '#991b1b' : '#1e293b',
              color: '#ffffff',
              border: `1px solid ${toast.type === 'success' ? '#22c55e' : toast.type === 'error' ? '#ef4444' : '#334155'}`,
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.4)',
              fontSize: '0.88rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            {toast.type === 'success' && <CheckCircle2 size={18} color="#4ade80" />}
            {toast.type === 'error' && <AlertCircle size={18} color="#fca5a5" />}
            {toast.type === 'info' && <Info size={18} color="#f59e0b" />}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Main Container Wrapper */}
      <div style={{ maxWidth: '1000px', width: '100%', margin: '0 auto', flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        {/* APP BAR (Matching Flutter PortalMainScreen AppBar) */}
        <header
          style={{
            backgroundColor: '#0f172a',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #1e293b',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                padding: '6px',
                borderRadius: '50%',
                backgroundColor: 'rgba(245, 158, 11, 0.2)',
                color: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Coffee size={20} />
            </div>
            <span style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '1px', color: '#ffffff' }}>
              SAEC CAFÉ
            </span>
          </div>

          <div
            style={{
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              color: '#f59e0b',
              padding: '4px 10px',
              borderRadius: '12px',
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: '0.5px',
            }}
          >
            {user.role}
          </div>
        </header>

        {/* BUSINESS STATUS BANNER (Matching Flutter PortalMainScreen) */}
        <div
          style={{
            backgroundColor: '#1e293b',
            padding: '8px 20px',
            fontSize: '0.78rem',
            fontWeight: 600,
            color: '#cbd5e1',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderBottom: '1px solid #334155',
          }}
        >
          <span>{businessStatus?.message || '🟢 SAEC CAFÉ • Ordering Open (10:00 AM – 3:30 PM)'}</span>
        </div>

        {/* TAB BODY CONTENT AREA */}
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '100px' }}>

          {/* TAB 0: MENU TAB */}
          {activeTab === 'menu' && (
            <div>
              {/* Search & Filter Header Section (Matching Flutter MenuTab) */}
              <div style={{ padding: '16px 16px 12px', backgroundColor: '#0f172a' }}>
                {/* Search Bar Input */}
                <div style={{ position: 'relative', marginBottom: '12px' }}>
                  <input
                    type="text"
                    placeholder="Search food items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      height: '44px',
                      paddingLeft: '2.5rem',
                      paddingRight: searchQuery ? '2.5rem' : '1rem',
                      backgroundColor: '#1e293b',
                      border: '1px solid #1e293b',
                      borderRadius: '12px',
                      color: '#ffffff',
                      fontSize: '0.9rem',
                      outline: 'none',
                    }}
                  />
                  <Search size={18} color="#f59e0b" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                {/* Category Chips Horizontal Selector */}
                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    overflowX: 'auto',
                    paddingBottom: '8px',
                    scrollbarWidth: 'none',
                  }}
                >
                  <button
                    onClick={() => setSelectedCategory('ALL')}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '20px',
                      border: `1px solid ${selectedCategory === 'ALL' ? '#f59e0b' : '#334155'}`,
                      backgroundColor: selectedCategory === 'ALL' ? '#f59e0b' : '#1e293b',
                      color: selectedCategory === 'ALL' ? '#020617' : '#cbd5e1',
                      fontSize: '0.78rem',
                      fontWeight: selectedCategory === 'ALL' ? 700 : 500,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Utensils size={14} /> All Items
                  </button>

                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '20px',
                        border: `1px solid ${selectedCategory === cat.id ? '#f59e0b' : '#334155'}`,
                        backgroundColor: selectedCategory === cat.id ? '#f59e0b' : '#1e293b',
                        color: selectedCategory === cat.id ? '#020617' : '#cbd5e1',
                        fontSize: '0.78rem',
                        fontWeight: selectedCategory === cat.id ? 700 : 500,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <FastForward size={14} /> {cat.name}
                    </button>
                  ))}
                </div>

                {/* Secondary Filters Row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                  <label
                    onClick={() => setAvailableOnlyFilter(!availableOnlyFilter)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.78rem', color: '#cbd5e1' }}
                  >
                    <input
                      type="checkbox"
                      checked={availableOnlyFilter}
                      onChange={() => {}}
                      style={{ accentColor: '#f59e0b', width: '16px', height: '16px' }}
                    />
                    Available Only
                  </label>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    style={{
                      backgroundColor: '#1e293b',
                      color: '#cbd5e1',
                      border: 'none',
                      fontSize: '0.78rem',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="default">Sort: Default</option>
                    <option value="price_low">Price: Low to High</option>
                    <option value="price_high">Price: High to Low</option>
                    <option value="name">Name: A to Z</option>
                  </select>
                </div>
              </div>

              {/* Main Product Grid (Matching Flutter MenuTab GridView) */}
              <div style={{ padding: '16px' }}>
                {loadingProducts ? (
                  <div style={{ textAlign: 'center', padding: '60px 0', color: '#f59e0b' }}>
                    <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto' }} />
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
                    <Utensils size={54} style={{ margin: '0 auto 12px', color: '#475569' }} />
                    <p style={{ margin: 0, fontSize: '1rem' }}>No food items found.</p>
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
                      gap: '14px',
                    }}
                  >
                    {filteredProducts.map((product) => {
                      const qty = cardQuantities[product.id] || 1;
                      const isOutOfStock = product.today_availability === 'OUT_OF_STOCK' || product.current_stock <= 0;
                      const imgUrl = getMediaUrl(product.image);

                      return (
                        <div
                          key={product.id}
                          style={{
                            backgroundColor: '#1e293b',
                            borderRadius: '14px',
                            border: '1px solid #334155',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                          }}
                        >
                          {/* Image Section */}
                          <div style={{ position: 'relative', height: '120px', backgroundColor: '#334155' }}>
                            {imgUrl ? (
                              <img
                                src={imgUrl}
                                alt={product.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
                                <Utensils size={36} />
                              </div>
                            )}

                            {/* Veg / Non-Veg Indicator */}
                            <div
                              style={{
                                position: 'absolute',
                                top: '8px',
                                left: '8px',
                                backgroundColor: 'rgba(0,0,0,0.6)',
                                border: `1.5px solid ${product.is_veg !== false ? '#22c55e' : '#ef4444'}`,
                                borderRadius: '4px',
                                padding: '3px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <div
                                style={{
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  backgroundColor: product.is_veg !== false ? '#22c55e' : '#ef4444',
                                }}
                              />
                            </div>

                            {/* Out of Stock Badge */}
                            {isOutOfStock && (
                              <div
                                style={{
                                  position: 'absolute',
                                  top: '8px',
                                  right: '8px',
                                  backgroundColor: 'rgba(153, 27, 27, 0.9)',
                                  color: '#ffffff',
                                  fontSize: '0.65rem',
                                  fontWeight: 800,
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                }}
                              >
                                OUT OF STOCK
                              </div>
                            )}
                          </div>

                          {/* Details Section */}
                          <div style={{ padding: '10px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div>
                              <h4
                                style={{
                                  margin: '0 0 2px',
                                  fontSize: '0.88rem',
                                  fontWeight: 700,
                                  color: '#ffffff',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {product.name}
                              </h4>
                              <p style={{ margin: '0 0 6px', fontSize: '0.72rem', color: '#94a3b8' }}>
                                {product.category_name || 'Canteen Special'}
                              </p>
                              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f59e0b', marginBottom: '8px' }}>
                                ₹{Number(product.price).toFixed(2)}
                              </div>
                            </div>

                            {/* Actions / Quantity Stepper */}
                            {!isOutOfStock ? (
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    backgroundColor: '#0f172a',
                                    borderRadius: '6px',
                                    border: '1px solid #334155',
                                  }}
                                >
                                  <button
                                    onClick={() => {
                                      if (qty > 1) {
                                        setCardQuantities({ ...cardQuantities, [product.id]: qty - 1 });
                                      }
                                    }}
                                    style={{ background: 'none', border: 'none', color: '#ffffff', padding: '4px 6px', cursor: 'pointer' }}
                                  >
                                    <Minus size={12} />
                                  </button>
                                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ffffff', minWidth: '14px', textAlign: 'center' }}>
                                    {qty}
                                  </span>
                                  <button
                                    onClick={() => {
                                      if (qty < product.current_stock) {
                                        setCardQuantities({ ...cardQuantities, [product.id]: qty + 1 });
                                      }
                                    }}
                                    style={{ background: 'none', border: 'none', color: '#ffffff', padding: '4px 6px', cursor: 'pointer' }}
                                  >
                                    <Plus size={12} />
                                  </button>
                                </div>

                                <button
                                  onClick={() => handleAddToCart(product, qty)}
                                  style={{
                                    flex: 1,
                                    backgroundColor: '#f59e0b',
                                    color: '#020617',
                                    border: 'none',
                                    borderRadius: '6px',
                                    padding: '6px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <ShoppingCart size={16} />
                                </button>
                              </div>
                            ) : (
                              <div
                                style={{
                                  backgroundColor: '#334155',
                                  color: '#64748b',
                                  fontSize: '0.72rem',
                                  fontWeight: 600,
                                  textAlign: 'center',
                                  padding: '6px',
                                  borderRadius: '6px',
                                }}
                              >
                                Unavailable
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Floating Action Button for View Cart (Matching Flutter) */}
              {cartItemCount > 0 && (
                <button
                  onClick={() => setIsCartOpen(true)}
                  style={{
                    position: 'fixed',
                    bottom: '80px',
                    right: '20px',
                    backgroundColor: '#f59e0b',
                    color: '#020617',
                    border: 'none',
                    borderRadius: '30px',
                    padding: '12px 20px',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    boxShadow: '0 8px 25px rgba(245, 158, 11, 0.4)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    zIndex: 900,
                  }}
                >
                  <div style={{ position: 'relative' }}>
                    <ShoppingBag size={20} />
                    <span
                      style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
                        backgroundColor: '#ef4444',
                        color: '#ffffff',
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {cartItemCount}
                    </span>
                  </div>
                  <span>View Cart (₹{cartSubtotal.toFixed(0)})</span>
                </button>
              )}
            </div>
          )}

          {/* TAB 1: ORDERS & QUEUE TAB (Matching Flutter OrdersTab) */}
          {activeTab === 'orders' && (
            <div style={{ padding: '16px' }}>
              {loadingOrders ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#f59e0b' }}>
                  <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto' }} />
                </div>
              ) : orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
                  <Receipt size={54} style={{ margin: '0 auto 12px', color: '#475569' }} />
                  <p style={{ margin: 0, fontSize: '1rem' }}>No orders placed yet.</p>
                </div>
              ) : (
                <div>
                  {/* ACTIVE ORDERS & LIVE QUEUE SECTION */}
                  {activeOrders.length > 0 && (
                    <div style={{ marginBottom: '24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Flame size={20} color="#f59e0b" />
                          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#ffffff' }}>
                            Active Orders & Live Queue
                          </h3>
                        </div>
                        <div
                          style={{
                            backgroundColor: 'rgba(34, 197, 94, 0.15)',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '0.68rem',
                            fontWeight: 600,
                            color: '#4ade80',
                          }}
                        >
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4ade80' }} />
                          Live Polling (5s)
                        </div>
                      </div>

                      {activeOrders.map((order) => {
                        const itemsStr = order.items?.map((i) => `${i.product_name || i.product?.name} (x${i.quantity})`).join(', ');
                        const isPaid = order.payment_status === 'COMPLETED' || order.is_paid;

                        // Stepper calculation matching Flutter OrdersTab
                        let currentStepIndex = 0;
                        if (isPaid && (order.status === 'PENDING' || order.order_status === 'PENDING')) {
                          currentStepIndex = 1;
                        } else if (order.status === 'PREPARING' || order.order_status === 'PREPARING') {
                          currentStepIndex = 2;
                        } else if (order.status === 'READY' || order.order_status === 'READY') {
                          currentStepIndex = 3;
                        } else if (order.status === 'COMPLETED' || order.order_status === 'COMPLETED') {
                          currentStepIndex = 4;
                        }

                        const statusSteps = ['Payment Pending', 'Payment Confirmed', 'Preparing', 'Ready', 'Completed'];

                        return (
                          <div
                            key={order.id}
                            style={{
                              backgroundColor: '#1e293b',
                              borderRadius: '16px',
                              padding: '16px',
                              marginBottom: '16px',
                              border: '1.5px solid rgba(245, 158, 11, 0.3)',
                              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span
                                  style={{
                                    backgroundColor: '#f59e0b',
                                    color: '#020617',
                                    fontWeight: 800,
                                    fontSize: '0.85rem',
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                  }}
                                >
                                  {order.order_code}
                                </span>
                                {order.token_number && (
                                  <span style={{ fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 600 }}>
                                    Token: #{order.token_number}
                                  </span>
                                )}
                              </div>

                              {order.queue_number && (
                                <span
                                  style={{
                                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                                    border: '1px solid rgba(59, 130, 246, 0.4)',
                                    color: '#60a5fa',
                                    padding: '4px 10px',
                                    borderRadius: '20px',
                                    fontSize: '0.78rem',
                                    fontWeight: 800,
                                  }}
                                >
                                  Queue #{order.queue_number}
                                </span>
                              )}
                            </div>

                            <p style={{ margin: '0 0 10px', fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                              {itemsStr}
                            </p>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                                Payment: <strong style={{ color: isPaid ? '#4ade80' : '#fb923c' }}>{isPaid ? '✓ PAID' : 'Pending at Counter'}</strong>
                              </div>
                              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#f59e0b' }}>
                                ₹{Number(order.total_amount).toFixed(2)}
                              </div>
                            </div>

                            {/* Stepper Bar */}
                            <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                              {[0, 1, 2, 3, 4].map((stepIdx) => (
                                <div
                                  key={stepIdx}
                                  style={{
                                    flex: 1,
                                    height: '4px',
                                    backgroundColor: stepIdx <= currentStepIndex ? '#f59e0b' : '#334155',
                                    borderRadius: '2px',
                                  }}
                                />
                              ))}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ffffff' }}>
                                Status: {statusSteps[currentStepIndex]}
                              </span>
                              <button
                                onClick={() => setViewingReceiptOrder(order)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#f59e0b',
                                  fontSize: '0.78rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <Receipt size={14} /> View Receipt
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* ORDER HISTORY SECTION */}
                  <div>
                    <h3 style={{ margin: '0 0 12px', fontSize: '1rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={20} color="#94a3b8" /> Order History
                    </h3>

                    {historyOrders.length === 0 ? (
                      <p style={{ fontSize: '0.82rem', color: '#64748b' }}>No completed or cancelled orders.</p>
                    ) : (
                      historyOrders.map((order) => {
                        const isCancelled = order.status === 'CANCELLED' || order.status === 'REJECTED';

                        return (
                          <div
                            key={order.id}
                            style={{
                              backgroundColor: '#1e293b',
                              borderRadius: '12px',
                              padding: '12px 14px',
                              marginBottom: '10px',
                              border: '1px solid #334155',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div
                                style={{
                                  padding: '8px',
                                  borderRadius: '50%',
                                  backgroundColor: isCancelled ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                                  color: isCancelled ? '#ef4444' : '#4ade80',
                                }}
                              >
                                {isCancelled ? <XCircle size={18} /> : <CheckCircle size={18} />}
                              </div>
                              <div>
                                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#ffffff' }}>
                                  {order.order_code}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                                  {new Date(order.created_at).toLocaleString('en-US', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f59e0b' }}>
                                ₹{Number(order.total_amount).toFixed(2)}
                              </div>
                              <button
                                onClick={() => setViewingReceiptOrder(order)}
                                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                              >
                                <Receipt size={18} />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SUPPORT TAB (Matching Flutter SupportTab) */}
          {activeTab === 'support' && (
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <SupportIcon size={26} color="#f59e0b" />
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
                  Help & Support
                </h2>
              </div>
              <p style={{ margin: '0 0 24px', fontSize: '0.83rem', color: '#94a3b8' }}>
                Have an issue with an order or payment? Contact the canteen team below.
              </p>

              {supportMessage && (
                <div
                  style={{
                    backgroundColor: supportMessage.isSuccess ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    border: `1px solid ${supportMessage.isSuccess ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                    color: supportMessage.isSuccess ? '#4ade80' : '#fca5a5',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '0.83rem',
                    marginBottom: '16px',
                  }}
                >
                  {supportMessage.text}
                </div>
              )}

              <form onSubmit={handleSubmitSupportTicket} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                    Related Order (Optional)
                  </label>
                  <select
                    value={supportOrderCode}
                    onChange={(e) => setSupportOrderCode(e.target.value)}
                    style={{
                      width: '100%',
                      height: '44px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '10px',
                      color: '#ffffff',
                      fontSize: '0.85rem',
                      padding: '0 12px',
                      outline: 'none',
                    }}
                  >
                    <option value="">None / General Issue</option>
                    {orders.map((o) => (
                      <option key={o.id} value={o.order_code}>
                        {o.order_code} (₹{Number(o.total_amount).toFixed(0)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                    Issue Category
                  </label>
                  <select
                    value={supportCategory}
                    onChange={(e) => setSupportCategory(e.target.value)}
                    style={{
                      width: '100%',
                      height: '44px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '10px',
                      color: '#ffffff',
                      fontSize: '0.85rem',
                      padding: '0 12px',
                      outline: 'none',
                    }}
                  >
                    <option value="ORDER_ISSUE">Order Issue / Missing Item</option>
                    <option value="PAYMENT_ISSUE">Payment Issue / Verification</option>
                    <option value="QUALITY_ISSUE">Food Quality Concern</option>
                    <option value="SUGGESTION">General Feedback / Suggestion</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                    Describe Your Concern
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Provide details about the issue..."
                    value={supportDescription}
                    onChange={(e) => setSupportDescription(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '10px',
                      color: '#ffffff',
                      fontSize: '0.85rem',
                      padding: '12px',
                      outline: 'none',
                      resize: 'vertical',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingSupport}
                  style={{
                    width: '100%',
                    height: '48px',
                    backgroundColor: '#f59e0b',
                    color: '#020617',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  {isSubmittingSupport ? <RefreshCw size={18} className="animate-spin" /> : 'SUBMIT TICKET'}
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: PROFILE TAB (Matching Flutter ProfileTab) */}
          {activeTab === 'profile' && (
            <div style={{ padding: '20px' }}>
              {/* Header Card */}
              <div
                style={{
                  backgroundColor: '#1e293b',
                  borderRadius: '16px',
                  padding: '20px',
                  border: '1px solid #334155',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  marginBottom: '24px',
                }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(245, 158, 11, 0.2)',
                    color: '#f59e0b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {user.role === 'FACULTY' ? <Briefcase size={32} /> : <GraduationCap size={32} />}
                </div>

                <div style={{ overflow: 'hidden' }}>
                  <h3 style={{ margin: '0 0 4px', fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
                    {user.full_name || user.email}
                  </h3>
                  <p style={{ margin: '0 0 8px', fontSize: '0.83rem', color: '#94a3b8', wordBreak: 'break-all' }}>
                    {user.email}
                  </p>
                  <span
                    style={{
                      backgroundColor: '#f59e0b',
                      color: '#020617',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '3px 10px',
                      borderRadius: '12px',
                    }}
                  >
                    {user.role}
                  </span>
                </div>
              </div>

              {/* Details Group */}
              <h4 style={{ margin: '0 0 12px', fontSize: '0.9rem', fontWeight: 700, color: '#cbd5e1' }}>
                Account & Academic Information
              </h4>

              <div
                style={{
                  backgroundColor: '#1e293b',
                  borderRadius: '14px',
                  border: '1px solid #334155',
                  overflow: 'hidden',
                  marginBottom: '32px',
                }}
              >
                {[
                  { icon: <Briefcase size={18} color="#f59e0b" />, label: 'Department', value: user.department },
                  { icon: <Badge size={18} color="#f59e0b" />, label: 'Register / Employee ID', value: user.college_id || user.student_profile?.register_number },
                  { icon: <Clock size={18} color="#f59e0b" />, label: 'Academic Year', value: user.year ? `Year ${user.year}` : null },
                  { icon: <Phone size={18} color="#f59e0b" />, label: 'Mobile Number', value: user.mobile_number },
                  { icon: <ShieldCheck size={18} color="#f59e0b" />, label: 'Account Status', value: user.is_active ? 'Active Approved' : 'Pending Approval' },
                ]
                  .filter((item) => item.value)
                  .map((item, idx, arr) => (
                    <div
                      key={item.label}
                      style={{
                        padding: '14px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: idx < arr.length - 1 ? '1px solid #334155' : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {item.icon}
                        <span style={{ fontSize: '0.83rem', color: '#94a3b8' }}>{item.label}</span>
                      </div>
                      <span style={{ fontSize: '0.83rem', fontWeight: 600, color: '#ffffff' }}>{item.value}</span>
                    </div>
                  ))}
              </div>

              {/* Logout Button */}
              <button
                onClick={() => setShowLogoutConfirm(true)}
                style={{
                  width: '100%',
                  height: '48px',
                  backgroundColor: 'rgba(153, 27, 27, 0.8)',
                  color: '#ffffff',
                  border: '1px solid #b91c1c',
                  borderRadius: '10px',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <LogOut size={18} /> LOGOUT
              </button>
            </div>
          )}
        </div>

        {/* BOTTOM NAVIGATION BAR (Matching Flutter BottomNavigationBar) */}
        <nav
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: '#1e293b',
            borderTop: '1px solid #334155',
            display: 'flex',
            justifyContent: 'space-around',
            padding: '8px 0',
            zIndex: 800,
          }}
        >
          {[
            { id: 'menu', label: 'Menu', icon: <Utensils size={20} /> },
            { id: 'orders', label: 'Orders & Queue', icon: <Receipt size={20} /> },
            { id: 'support', label: 'Support', icon: <SupportIcon size={20} /> },
            { id: 'profile', label: 'Profile', icon: <UserIcon size={20} /> },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: isActive ? '#f59e0b' : '#94a3b8',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  fontSize: '0.72rem',
                  fontWeight: isActive ? 700 : 500,
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* CART DRAWER OVERLAY (Matching Flutter CartDrawer) */}
      {isCartOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '420px',
              backgroundColor: '#1e293b',
              height: '100%',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              overflowY: 'auto',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ShoppingCart size={22} color="#f59e0b" />
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>Your Food Cart</h3>
                </div>
                {cart.length > 0 && (
                  <button
                    onClick={handleClearCart}
                    style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.78rem', cursor: 'pointer' }}
                  >
                    Clear All
                  </button>
                )}
              </div>
              <div style={{ height: '1px', backgroundColor: '#334155', marginBottom: '16px' }} />

              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
                  <ShoppingCart size={54} style={{ margin: '0 auto 12px', color: '#475569' }} />
                  <p style={{ margin: 0, fontSize: '0.95rem' }}>Your cart is empty</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {cart.map((item) => {
                    const imgUrl = getMediaUrl(item.product.image);
                    return (
                      <div key={item.product.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#334155', flexShrink: 0 }}>
                          {imgUrl ? (
                            <img src={imgUrl} alt={item.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
                              <Utensils size={18} />
                            </div>
                          )}
                        </div>

                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: '0 0 2px', fontSize: '0.85rem', fontWeight: 600, color: '#ffffff' }}>
                            {item.product.name}
                          </h4>
                          <span style={{ fontSize: '0.78rem', color: '#f59e0b', fontWeight: 700 }}>
                            ₹{Number(item.product.price).toFixed(2)} x {item.quantity}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#0f172a', borderRadius: '6px' }}>
                          <button
                            onClick={() => handleUpdateCartQty(item.product.id, item.quantity - 1)}
                            style={{ background: 'none', border: 'none', color: '#ffffff', padding: '4px 8px', cursor: 'pointer' }}
                          >
                            <Minus size={12} />
                          </button>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ffffff' }}>{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateCartQty(item.product.id, item.quantity + 1)}
                            style={{ background: 'none', border: 'none', color: '#ffffff', padding: '4px 8px', cursor: 'pointer' }}
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        <button
                          onClick={() => handleRemoveCartItem(item.product.id)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <div
                  style={{
                    backgroundColor: '#0f172a',
                    padding: '12px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '16px',
                  }}
                >
                  <span style={{ fontSize: '0.88rem', color: '#cbd5e1' }}>Total Amount:</span>
                  <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f59e0b' }}>₹{cartSubtotal.toFixed(2)}</span>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    style={{
                      flex: 1,
                      height: '46px',
                      backgroundColor: 'transparent',
                      color: '#cbd5e1',
                      border: '1px solid #334155',
                      borderRadius: '10px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      setIsCheckoutOpen(true);
                    }}
                    style={{
                      flex: 2,
                      height: '46px',
                      backgroundColor: '#f59e0b',
                      color: '#020617',
                      border: 'none',
                      borderRadius: '10px',
                      fontWeight: 800,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                    }}
                  >
                    PROCEED TO CHECKOUT
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CHECKOUT MODAL (Matching Flutter CheckoutModal) */}
      {isCheckoutOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            zIndex: 1050,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: '#1e293b',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '440px',
              padding: '20px',
              border: '1px solid #334155',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>Order Checkout</h3>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ height: '1px', backgroundColor: '#334155', marginBottom: '16px' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                  Preferred Pickup Time Slot
                </label>
                <select
                  value={pickupSlot}
                  onChange={(e) => setPickupSlot(e.target.value)}
                  style={{
                    width: '100%',
                    height: '42px',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    padding: '0 10px',
                    outline: 'none',
                  }}
                >
                  <option value="ASAP (Next 10-15 Mins)">ASAP (Next 10-15 Mins)</option>
                  <option value="10:30 AM Break">10:30 AM Break</option>
                  <option value="12:30 PM Lunch Break">12:30 PM Lunch Break</option>
                  <option value="02:15 PM Break">02:15 PM Break</option>
                  <option value="03:15 PM Evening">03:15 PM Evening</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '8px' }}>
                  Payment Mode (Pay at Counter)
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CASH')}
                    style={{
                      flex: 1,
                      padding: '12px 8px',
                      borderRadius: '8px',
                      border: `1.5px solid ${paymentMethod === 'CASH' ? '#f59e0b' : '#334155'}`,
                      backgroundColor: paymentMethod === 'CASH' ? 'rgba(245, 158, 11, 0.15)' : '#0f172a',
                      color: paymentMethod === 'CASH' ? '#f59e0b' : '#cbd5e1',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>Cash at Counter</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('QR_COUNTER')}
                    style={{
                      flex: 1,
                      padding: '12px 8px',
                      borderRadius: '8px',
                      border: `1.5px solid ${paymentMethod === 'QR_COUNTER' ? '#f59e0b' : '#334155'}`,
                      backgroundColor: paymentMethod === 'QR_COUNTER' ? 'rgba(245, 158, 11, 0.15)' : '#0f172a',
                      color: paymentMethod === 'QR_COUNTER' ? '#f59e0b' : '#cbd5e1',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>QR at Counter</span>
                  </button>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                  Order Notes / Cooking Instructions
                </label>
                <input
                  type="text"
                  placeholder="e.g., Less spicy, no onions..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  style={{
                    width: '100%',
                    height: '42px',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    padding: '0 10px',
                    outline: 'none',
                  }}
                />
              </div>

              <div
                style={{
                  backgroundColor: '#0f172a',
                  padding: '12px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ fontSize: '0.88rem', color: '#cbd5e1' }}>Total Payable:</span>
                <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f59e0b' }}>₹{cartSubtotal.toFixed(2)}</span>
              </div>

              <button
                onClick={handleConfirmOrder}
                disabled={isSubmittingOrder}
                style={{
                  width: '100%',
                  height: '48px',
                  backgroundColor: '#f59e0b',
                  color: '#020617',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                {isSubmittingOrder ? <RefreshCw size={18} className="animate-spin" /> : 'CONFIRM & PLACE ORDER'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PLACED ORDER SUCCESS MODAL (Matching Flutter PlacedOrderModal) */}
      {placedOrder && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: '#1e293b',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '400px',
              padding: '24px',
              textAlign: 'center',
              border: '1px solid #334155',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'rgba(34, 197, 94, 0.15)',
                color: '#4ade80',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <CheckCircle size={40} />
            </div>

            <h3 style={{ margin: '0 0 6px', fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
              Order Placed Successfully!
            </h3>
            <p style={{ margin: '0 0 8px', fontSize: '0.83rem', color: '#94a3b8' }}>
              Your order code is
            </p>

            <div
              style={{
                display: 'inline-block',
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                color: '#f59e0b',
                padding: '6px 16px',
                borderRadius: '8px',
                fontSize: '1.35rem',
                fontWeight: 800,
                letterSpacing: '1px',
                marginBottom: '16px',
              }}
            >
              {placedOrder.order_code}
            </div>

            {placedOrder.queue_number && (
              <div style={{ fontSize: '0.9rem', color: '#cbd5e1', marginBottom: '14px' }}>
                Queue Position: <strong style={{ color: '#ffffff' }}>#{placedOrder.queue_number}</strong>
              </div>
            )}

            <div
              style={{
                backgroundColor: '#0f172a',
                borderRadius: '10px',
                padding: '12px',
                fontSize: '0.82rem',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Payment:</span>
                <strong style={{ color: placedOrder.payment_status === 'COMPLETED' ? '#4ade80' : '#fb923c' }}>
                  {placedOrder.payment_status === 'COMPLETED' ? '✓ PAID' : 'Pending at Counter'}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Method:</span>
                <span style={{ color: '#ffffff' }}>{placedOrder.payment_method === 'CASH' ? 'Cash at Counter' : 'QR Scanner at Counter'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Total Amount:</span>
                <strong style={{ color: '#f59e0b' }}>₹{Number(placedOrder.total_amount).toFixed(2)}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setPlacedOrder(null)}
                style={{
                  flex: 1,
                  height: '44px',
                  backgroundColor: 'transparent',
                  color: '#cbd5e1',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
              <button
                onClick={() => {
                  setPlacedOrder(null);
                  setActiveTab('orders');
                }}
                style={{
                  flex: 1,
                  height: '44px',
                  backgroundColor: '#f59e0b',
                  color: '#020617',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                TRACK ORDER
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECEIPT MODAL OVERLAY (Matching Flutter ReceiptModal) */}
      {viewingReceiptOrder && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            zIndex: 1150,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <ThermalReceipt
            order={viewingReceiptOrder}
            onClose={() => setViewingReceiptOrder(null)}
          />
        </div>
      )}

      {/* LOGOUT CONFIRMATION DIALOG (Matching Flutter ProfileTab _showLogoutConfirmation) */}
      {showLogoutConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: '#1e293b',
              borderRadius: '14px',
              maxWidth: '360px',
              width: '100%',
              padding: '20px',
              border: '1px solid #334155',
            }}
          >
            <h3 style={{ margin: '0 0 8px', fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>
              Logout Confirmation
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: '0.85rem', color: '#cbd5e1' }}>
              Are you sure you want to log out of SAEC CAFÉ?
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                style={{
                  flex: 1,
                  height: '42px',
                  backgroundColor: 'transparent',
                  color: '#94a3b8',
                  border: 'none',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  onLogout();
                }}
                style={{
                  flex: 1,
                  height: '42px',
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
