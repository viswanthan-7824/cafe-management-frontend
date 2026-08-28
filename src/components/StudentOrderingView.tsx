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
  CreditCard,
  RefreshCw,
  Printer,
  HelpCircle,
  Lock,
  Phone,
  Mail,
  GraduationCap,
  Briefcase,
  LogOut,
  Info
} from 'lucide-react';

interface CartItem {
  product: Product;
  quantity: number;
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
  // Navigation tabs: 'menu' | 'orders' | 'support' | 'profile'
  const [activeTab, setActiveTab] = useState<'menu' | 'orders' | 'support' | 'profile'>('menu');

  // Data state
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Search & category filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | 'ALL'>('ALL');

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

  // Checkout state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [pickupTime, setPickupTime] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QR_COUNTER' | 'UPI'>('CASH');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderError, setOrderError] = useState('');

  // Placed order success modal
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  // Thermal Receipt Modal
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

  // Support / Issue modal
  const [issueOrderCode, setIssueOrderCode] = useState('');
  const [issueCategory, setIssueCategory] = useState('ORDER_ISSUE');
  const [issueDescription, setIssueDescription] = useState('');
  const [issueSubmitting, setIssueSubmitting] = useState(false);
  const [issueSuccess, setIssueSuccess] = useState('');
  const [issueError, setIssueError] = useState('');

  // UPI Payment Proof Submission Modal
  const [payOrder, setPayOrder] = useState<Order | null>(null);
  const [upiTransactionId, setUpiTransactionId] = useState('');
  const [upiSubmitting, setUpiSubmitting] = useState(false);
  const [upiSuccess, setUpiSuccess] = useState('');
  const [upiError, setUpiError] = useState('');

  // Special Contact Order Modal
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactProduct, setContactProduct] = useState<Product | null>(null);
  const [contactQty, setContactQty] = useState(1);
  const [contactPickupTime, setContactPickupTime] = useState('');
  const [contactNotes, setContactNotes] = useState('');
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactSuccess, setContactSuccess] = useState('');
  const [contactError, setContactError] = useState('');

  // Profile password change
  const [currPassword, setCurrPassword] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passChangeSuccess, setPassChangeSuccess] = useState('');
  const [passChangeError, setPassChangeError] = useState('');
  const [passChangeSubmitting, setPassChangeSubmitting] = useState(false);

  // Save cart to local storage
  useEffect(() => {
    try {
      localStorage.setItem(`saec_cart_${user.id}`, JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart, user.id]);

  // Initial load & 5s live queue sync polling
  useEffect(() => {
    loadProducts();
    loadCategories();
    loadMyOrders();

    const interval = setInterval(() => {
      loadMyOrders();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

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
    } catch (e) {
      console.error('Failed to load orders', e);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Cart operations
  const addToCart = (product: Product) => {
    if (product.availability_status === 'OUT_OF_STOCK' || product.current_stock <= 0) {
      return;
    }
    if (product.food_type === 'CONTACT_ORDER') {
      setContactProduct(product);
      setContactModalOpen(true);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.current_stock) {
          alert(`Cannot add more than available stock (${product.current_stock}).`);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty > item.product.current_stock) {
              alert(`Maximum available stock is ${item.product.current_stock}.`);
              return item;
            }
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const cartSubtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cart]
  );
  const maxPrepTime = useMemo(
    () => (cart.length ? Math.max(...cart.map((item) => item.product.preparation_time || 0)) : 0),
    [cart]
  );

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (!p.is_active) return false;
      if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesDesc = p.description?.toLowerCase().includes(q);
        const matchesCat = p.category_name?.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesCat) return false;
      }
      return true;
    });
  }, [products, selectedCategory, searchQuery]);

  // Handle Checkout Submission
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    if (!businessStatus?.is_ordering_open) {
      setOrderError('Ordering is currently closed by the canteen administration.');
      return;
    }

    setIsSubmittingOrder(true);
    setOrderError('');

    try {
      const itemsPayload = cart.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity
      }));

      const newOrder = await api.createCustomerOrder({
        items: itemsPayload,
        pickup_time: pickupTime || undefined,
        notes: orderNotes.trim() || undefined,
        payment_method: paymentMethod,
        customer_type: user.role === 'FACULTY' ? 'FACULTY' : 'STUDENT'
      });

      // Success
      clearCart();
      setIsCheckoutOpen(false);
      setIsCartOpen(false);
      setPlacedOrder(newOrder);
      loadMyOrders();
    } catch (err: any) {
      setOrderError(err.message || 'Unable to place order. Please try again.');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Submit Contact Order Request
  const handleContactOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactProduct) return;

    setContactSubmitting(true);
    setContactError('');
    setContactSuccess('');

    try {
      await api.submitContactOrder({
        product_id: contactProduct.id,
        quantity: contactQty,
        preferred_pickup_time: contactPickupTime || new Date(Date.now() + 60 * 60000).toISOString(),
        special_instructions: contactNotes
      });
      setContactSuccess('Your catering request has been submitted. The canteen staff will review and approve it shortly.');
      setTimeout(() => {
        setContactModalOpen(false);
        setContactProduct(null);
        setContactSuccess('');
        setActiveTab('orders');
        loadMyOrders();
      }, 1800);
    } catch (err: any) {
      setContactError(err.message || 'Failed to submit request.');
    } finally {
      setContactSubmitting(false);
    }
  };

  // Submit UPI Payment reference
  const handleUpiProofSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payOrder || !upiTransactionId.trim()) return;

    setUpiSubmitting(true);
    setUpiError('');
    setUpiSuccess('');

    try {
      await api.submitPaymentSupportTicket(payOrder.id, upiTransactionId.trim());
      setUpiSuccess('Payment reference submitted successfully. Canteen admin will verify your payment.');
      setTimeout(() => {
        setPayOrder(null);
        setUpiTransactionId('');
        setUpiSuccess('');
        loadMyOrders();
      }, 1600);
    } catch (err: any) {
      setUpiError(err.message || 'Failed to submit payment details.');
    } finally {
      setUpiSubmitting(false);
    }
  };

  // Submit Issue Report
  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueOrderCode.trim() || !issueDescription.trim()) return;

    setIssueSubmitting(true);
    setIssueError('');
    setIssueSuccess('');

    try {
      await api.reportCustomerIssue(issueOrderCode.trim(), issueCategory, issueDescription.trim());
      setIssueSuccess('Your issue report has been submitted to the canteen supervisor.');
      setIssueOrderCode('');
      setIssueDescription('');
      setTimeout(() => {
        setIssueSuccess('');
      }, 3000);
    } catch (err: any) {
      setIssueError(err.message || 'Failed to submit issue report.');
    } finally {
      setIssueSubmitting(false);
    }
  };

  // Change Password
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirmPass) {
      setPassChangeError('New passwords do not match.');
      return;
    }
    if (newPass.length < 6) {
      setPassChangeError('Password must be at least 6 characters.');
      return;
    }

    setPassChangeSubmitting(true);
    setPassChangeError('');
    setPassChangeSuccess('');

    try {
      await api.changePassword({
        current_password: currPassword,
        new_password: newPass,
        confirm_password: confirmPass
      });
      setPassChangeSuccess('Your password has been updated successfully.');
      setCurrPassword('');
      setNewPass('');
      setConfirmPass('');
    } catch (err: any) {
      setPassChangeError(err.message || 'Failed to update password.');
    } finally {
      setPassChangeSubmitting(false);
    }
  };

  // Status timeline helper
  const getStatusStepIndex = (status: string) => {
    switch (status) {
      case 'REQUESTED':
      case 'AWAITING_APPROVAL':
      case 'AWAITING_PAYMENT':
        return 1;
      case 'PAYMENT_SUPPORT_REQUIRED':
      case 'CONFIRMED':
        return 2;
      case 'PREPARING':
        return 3;
      case 'READY':
        return 4;
      case 'DELIVERED':
        return 5;
      default:
        return 0; // REJECTED or CANCELLED
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '90px' }}>
      {/* Top Header / App Bar */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0.75rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem'
          }}
        >
          {/* Brand */}
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
            onClick={() => setActiveTab('menu')}
          >
            <img
              src="/saec_cafe_logo.jpg"
              alt="SAEC CAFÉ"
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                border: '2px solid #ea580c',
                objectFit: 'cover'
              }}
            />
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#1e293b', lineHeight: 1.1 }}>
                SAEC <span style={{ color: '#ea580c' }}>CAFÉ</span>
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>
                {user.role === 'FACULTY' ? '👨‍🏫 Faculty Portal' : '🎓 Student Portal'}
              </div>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="desktop-nav-links" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => setActiveTab('menu')}
              className={`btn ${activeTab === 'menu' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
            >
              <Utensils size={16} /> Menu
            </button>
            <button
              onClick={() => {
                setActiveTab('orders');
                loadMyOrders();
              }}
              className={`btn ${activeTab === 'orders' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
            >
              <ShoppingBag size={16} /> My Orders
              {orders.filter((o) => ['CONFIRMED', 'PREPARING', 'READY'].includes(o.status)).length > 0 && (
                <span
                  style={{
                    background: '#ef4444',
                    color: '#ffffff',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    padding: '0.1rem 0.4rem',
                    borderRadius: '9999px',
                    marginLeft: '0.25rem'
                  }}
                >
                  {orders.filter((o) => ['CONFIRMED', 'PREPARING', 'READY'].includes(o.status)).length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('support')}
              className={`btn ${activeTab === 'support' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
            >
              <HelpCircle size={16} /> Support
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`btn ${activeTab === 'profile' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
            >
              <UserIcon size={16} /> Profile
            </button>
          </div>

          {/* Cart Icon */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={() => setIsCartOpen(true)}
              style={{
                position: 'relative',
                background: '#fff7ed',
                border: '1px solid #fed7aa',
                borderRadius: '12px',
                padding: '0.6rem 0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                color: '#ea580c',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              <ShoppingCart size={18} />
              <span className="cart-total-label">₹{cartSubtotal}</span>
              {cartCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-6px',
                    background: '#ea580c',
                    color: '#ffffff',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 6px rgba(234, 88, 12, 0.4)'
                  }}
                >
                  {cartCount}
                </span>
              )}
            </button>

            <button
              onClick={onLogout}
              title="Sign out of account"
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#ef4444',
                padding: '0.6rem 0.85rem',
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                transition: 'all 0.2s ease'
              }}
            >
              <LogOut size={16} />
              <span className="desktop-nav-links">Logout</span>
            </button>
          </div>
        </div>

        {/* Operational Banner */}
        <div
          style={{
            background: businessStatus?.is_ordering_open ? '#ecfdf5' : '#fef2f2',
            borderTop: '1px solid #e2e8f0',
            padding: '0.4rem 1rem',
            textAlign: 'center',
            fontSize: '0.78rem',
            fontWeight: 700,
            color: businessStatus?.is_ordering_open ? '#047857' : '#b91c1c',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
        >
          {businessStatus?.is_ordering_open ? (
            <>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
              {businessStatus?.message || 'Ordering is OPEN (10:00 AM – 3:30 PM)'}
            </>
          ) : (
            <>
              <AlertCircle size={14} />
              {businessStatus?.message || 'Canteen is currently CLOSED for ordering today.'}
            </>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.25rem 1rem' }}>
        {/* ======================= TAB: MENU ======================= */}
        {activeTab === 'menu' && (
          <div className="animate-fade-in">
            {/* Welcome & Search Banner */}
            <div
              style={{
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                borderRadius: '20px',
                padding: '1.75rem 1.5rem',
                color: '#ffffff',
                marginBottom: '1.5rem',
                boxShadow: '0 10px 25px rgba(15, 23, 42, 0.15)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{ position: 'relative', zIndex: 2, maxWidth: '640px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(234, 88, 12, 0.2)', padding: '0.25rem 0.75rem', borderRadius: '9999px', color: '#fed7aa', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                  {user.role === 'FACULTY' ? <Briefcase size={12} /> : <GraduationCap size={12} />}
                  Welcome, {user.full_name}
                </div>
                <h1 style={{ fontSize: '1.65rem', fontWeight: 900, margin: '0 0 0.5rem', color: '#ffffff', letterSpacing: '-0.02em' }}>
                  Delicious Food, <span style={{ color: '#ea580c' }}>Skip the Queue</span>
                </h1>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0 0 1.25rem', lineHeight: 1.4 }}>
                  Order fresh breakfast, meals, hot snacks, and beverages directly from your phone. Pick up without waiting.
                </p>

                {/* Search Bar */}
                <div style={{ position: 'relative' }}>
                  <Search
                    size={18}
                    style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
                  />
                  <input
                    type="text"
                    placeholder="Search dishes, snacks, beverages (e.g. Dosa, Tea, Biryani)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.85rem 1rem 0.85rem 2.75rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(255,255,255,0.15)',
                      background: 'rgba(255,255,255,0.95)',
                      color: '#1e293b',
                      fontSize: '0.9rem',
                      outline: 'none',
                      fontWeight: 500,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                    }}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Category Filter Chips */}
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                overflowX: 'auto',
                paddingBottom: '0.5rem',
                marginBottom: '1.25rem',
                scrollbarWidth: 'none'
              }}
            >
              <button
                onClick={() => setSelectedCategory('ALL')}
                style={{
                  padding: '0.55rem 1.1rem',
                  borderRadius: '9999px',
                  border: selectedCategory === 'ALL' ? '1px solid #ea580c' : '1px solid #e2e8f0',
                  background: selectedCategory === 'ALL' ? '#ea580c' : '#ffffff',
                  color: selectedCategory === 'ALL' ? '#ffffff' : '#64748b',
                  fontWeight: selectedCategory === 'ALL' ? 700 : 600,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: selectedCategory === 'ALL' ? '0 2px 8px rgba(234, 88, 12, 0.3)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                🍽️ All Items
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{
                    padding: '0.55rem 1.1rem',
                    borderRadius: '9999px',
                    border: selectedCategory === cat.id ? '1px solid #ea580c' : '1px solid #e2e8f0',
                    background: selectedCategory === cat.id ? '#ea580c' : '#ffffff',
                    color: selectedCategory === cat.id ? '#ffffff' : '#64748b',
                    fontWeight: selectedCategory === cat.id ? 700 : 600,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    boxShadow: selectedCategory === cat.id ? '0 2px 8px rgba(234, 88, 12, 0.3)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Food Grid */}
            {loadingProducts ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="skeleton" style={{ height: '280px', borderRadius: '16px' }} />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  padding: '3rem 1.5rem',
                  textAlign: 'center',
                  border: '1px dashed #cbd5e1'
                }}
              >
                <Utensils size={40} color="#94a3b8" style={{ margin: '0 auto 1rem' }} />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.25rem' }}>
                  No Food Items Found
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                  Try adjusting your search query or selecting another category.
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                  gap: '1.25rem'
                }}
              >
                {filteredProducts.map((product) => {
                  const cartItem = cart.find((item) => item.product.id === product.id);
                  const isOutOfStock = product.availability_status === 'OUT_OF_STOCK' || product.current_stock <= 0;
                  const isContact = product.food_type === 'CONTACT_ORDER';

                  return (
                    <div
                      key={product.id}
                      style={{
                        background: '#ffffff',
                        borderRadius: '18px',
                        border: '1px solid #e2e8f0',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                      }}
                    >
                      {/* Product Image */}
                      <div
                        style={{
                          height: '160px',
                          background: '#f1f5f9',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        {product.image ? (
                          <img
                            src={getMediaUrl(product.image)}
                            alt={product.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
                              color: '#ea580c'
                            }}
                          >
                            <Utensils size={36} />
                          </div>
                        )}

                        {/* Badges Overlay */}
                        <div
                          style={{
                            position: 'absolute',
                            top: '10px',
                            left: '10px',
                            display: 'flex',
                            gap: '0.35rem',
                            flexWrap: 'wrap'
                          }}
                        >
                          {product.category_name && (
                            <span
                              style={{
                                background: 'rgba(15, 23, 42, 0.75)',
                                backdropFilter: 'blur(4px)',
                                color: '#ffffff',
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                padding: '0.2rem 0.5rem',
                                borderRadius: '6px'
                              }}
                            >
                              {product.category_name}
                            </span>
                          )}
                          {isContact && (
                            <span
                              style={{
                                background: '#4f46e5',
                                color: '#ffffff',
                                fontSize: '0.65rem',
                                fontWeight: 800,
                                padding: '0.2rem 0.5rem',
                                borderRadius: '6px'
                              }}
                            >
                              Catering Only
                            </span>
                          )}
                        </div>

                        {/* Availability Status Badge */}
                        <div style={{ position: 'absolute', bottom: '10px', right: '10px' }}>
                          {isOutOfStock ? (
                            <span className="badge badge-danger">Currently unavailable</span>
                          ) : product.availability_status === 'LOW_STOCK' ? (
                            <span className="badge badge-warning">Low Stock ({product.current_stock})</span>
                          ) : (
                            <span className="badge badge-success">Available</span>
                          )}
                        </div>
                      </div>

                      {/* Card Body */}
                      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.35rem' }}>
                          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1e293b', margin: 0, lineHeight: 1.25 }}>
                            {product.name}
                          </h3>
                        </div>

                        <p
                          style={{
                            fontSize: '0.78rem',
                            color: '#64748b',
                            margin: '0 0 0.75rem',
                            lineHeight: 1.4,
                            flex: 1,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {product.description || 'Freshly prepared at SAEC CAFÉ with high hygiene standards.'}
                        </p>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.85rem' }}>
                          <Clock size={14} />
                          <span>Prep: ~{product.preparation_time || 10} mins</span>
                        </div>

                        {/* Footer: Price & Add Button */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderTop: '1px solid #f1f5f9',
                            paddingTop: '0.75rem'
                          }}
                        >
                          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1e293b' }}>
                            ₹{product.price}
                          </div>

                          {isContact ? (
                            <button
                              onClick={() => {
                                setContactProduct(product);
                                setContactModalOpen(true);
                              }}
                              className="btn btn-indigo"
                              style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', fontWeight: 700 }}
                            >
                              Request Catering
                            </button>
                          ) : isOutOfStock ? (
                            <button
                              disabled
                              style={{
                                background: '#fef2f2',
                                color: '#ef4444',
                                border: '1px solid #fecaca',
                                padding: '0.45rem 0.85rem',
                                borderRadius: '8px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'not-allowed'
                              }}
                            >
                              Currently unavailable
                            </button>
                          ) : cartItem ? (
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                background: '#fff7ed',
                                border: '1px solid #fed7aa',
                                borderRadius: '8px',
                                padding: '2px'
                              }}
                            >
                              <button
                                onClick={() => updateQuantity(product.id, -1)}
                                style={{
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '6px',
                                  border: 'none',
                                  background: '#ffffff',
                                  color: '#ea580c',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 900
                                }}
                              >
                                <Minus size={14} />
                              </button>
                              <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#ea580c', minWidth: '18px', textAlign: 'center' }}>
                                {cartItem.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(product.id, 1)}
                                style={{
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '6px',
                                  border: 'none',
                                  background: '#ea580c',
                                  color: '#ffffff',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 900
                                }}
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(product)}
                              className="btn btn-primary"
                              style={{ padding: '0.45rem 0.95rem', fontSize: '0.82rem', fontWeight: 700 }}
                            >
                              <Plus size={15} /> Add
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ======================= TAB: MY ORDERS ======================= */}
        {activeTab === 'orders' && (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e293b', margin: '0 0 0.2rem' }}>
                  My Orders & Live Tracking
                </h2>
                <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
                  Track your food preparation status in real-time.
                </p>
              </div>
              <button
                onClick={loadMyOrders}
                className="btn btn-secondary"
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
              >
                <RefreshCw size={14} className={loadingOrders ? 'animate-spin' : ''} /> Refresh
              </button>
            </div>

            {loadingOrders ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[1, 2, 3].map((n) => (
                  <div key={n} className="skeleton" style={{ height: '140px', borderRadius: '16px' }} />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  padding: '3rem 1.5rem',
                  textAlign: 'center',
                  border: '1px dashed #cbd5e1'
                }}
              >
                <ShoppingBag size={42} color="#94a3b8" style={{ margin: '0 auto 1rem' }} />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.35rem' }}>
                  No Orders Yet
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem' }}>
                  You haven't placed any food orders yet today.
                </p>
                <button
                  onClick={() => setActiveTab('menu')}
                  className="btn btn-primary"
                >
                  Browse Delicious Menu
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {orders.map((order) => {
                  const stepIndex = getStatusStepIndex(order.status);
                  const isCompleted = order.status === 'DELIVERED';
                  const isCancelled = order.status === 'CANCELLED' || order.status === 'REJECTED';

                  return (
                    <div
                      key={order.id}
                      style={{
                        background: '#ffffff',
                        borderRadius: '16px',
                        border: '1px solid #e2e8f0',
                        padding: '1.25rem',
                        boxShadow: '0 4px 14px rgba(15, 23, 42, 0.03)'
                      }}
                    >
                      {/* Order Header */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          flexWrap: 'wrap',
                          gap: '0.5rem',
                          borderBottom: '1px solid #f1f5f9',
                          paddingBottom: '0.85rem',
                          marginBottom: '1rem'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#ea580c' }}>
                              #{order.order_number}
                            </span>
                            {order.token_number && (
                              <span
                                style={{
                                  background: '#1e293b',
                                  color: '#ffffff',
                                  fontSize: '0.7rem',
                                  fontWeight: 800,
                                  padding: '0.15rem 0.5rem',
                                  borderRadius: '6px'
                                }}
                              >
                                Token #{order.token_number}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                            Placed on {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(order.created_at).toLocaleDateString()}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <span
                            className={`badge ${
                              order.payment_status === 'PAID'
                                ? 'badge-success'
                                : order.payment_status === 'PENDING'
                                ? 'badge-warning'
                                : 'badge-danger'
                            }`}
                          >
                            Payment: {order.payment_status}
                          </span>
                          <span
                            className={`badge ${
                              isCompleted
                                ? 'badge-success'
                                : isCancelled
                                ? 'badge-danger'
                                : 'badge-primary'
                            }`}
                          >
                            {order.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>

                      {/* Visual Progress Tracker (if not cancelled) */}
                      {!isCancelled && (
                        <div style={{ margin: '1rem 0 1.25rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', marginBottom: '0.5rem' }}>
                            {/* Track bar background */}
                            <div
                              style={{
                                position: 'absolute',
                                top: '14px',
                                left: '5%',
                                right: '5%',
                                height: '4px',
                                background: '#e2e8f0',
                                zIndex: 1
                              }}
                            />
                            {/* Track bar active */}
                            <div
                              style={{
                                position: 'absolute',
                                top: '14px',
                                left: '5%',
                                width: `${Math.min(100, Math.max(0, (stepIndex - 1) * 25))}%`,
                                height: '4px',
                                background: '#ea580c',
                                zIndex: 2,
                                transition: 'width 0.4s ease'
                              }}
                            />

                            {[
                              { label: 'Order Placed', step: 1 },
                              { label: 'Confirmed', step: 2 },
                              { label: 'Preparing', step: 3 },
                              { label: 'Ready for Pickup', step: 4 },
                              { label: 'Delivered', step: 5 }
                            ].map((s) => {
                              const isPassed = stepIndex >= s.step;
                              return (
                                <div
                                  key={s.step}
                                  style={{
                                    zIndex: 3,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                    maxWidth: '65px',
                                    textAlign: 'center'
                                  }}
                                >
                                  <div
                                    style={{
                                      width: '28px',
                                      height: '28px',
                                      borderRadius: '50%',
                                      background: isPassed ? '#ea580c' : '#ffffff',
                                      border: isPassed ? '2px solid #ea580c' : '2px solid #cbd5e1',
                                      color: isPassed ? '#ffffff' : '#94a3b8',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '0.75rem',
                                      fontWeight: 800,
                                      boxShadow: isPassed ? '0 2px 8px rgba(234, 88, 12, 0.3)' : 'none'
                                    }}
                                  >
                                    {isPassed ? <CheckCircle2 size={16} /> : s.step}
                                  </div>
                                  <span
                                    style={{
                                      fontSize: '0.65rem',
                                      fontWeight: isPassed ? 700 : 500,
                                      color: isPassed ? '#1e293b' : '#94a3b8',
                                      lineHeight: 1.1
                                    }}
                                  >
                                    {s.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Items Summary Table */}
                      <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '0.85rem' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                          Items Ordered
                        </div>
                        {order.items?.map((item) => (
                          <div
                            key={item.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: '0.82rem',
                              color: '#334155',
                              padding: '0.2rem 0'
                            }}
                          >
                            <span>
                              {item.quantity}x {item.product_name}
                            </span>
                            <span style={{ fontWeight: 700 }}>₹{item.total_price}</span>
                          </div>
                        ))}
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '0.9rem',
                            fontWeight: 900,
                            color: '#1e293b',
                            borderTop: '1px dashed #cbd5e1',
                            marginTop: '0.4rem',
                            paddingTop: '0.4rem'
                          }}
                        >
                          <span>Total Amount</span>
                          <span style={{ color: '#ea580c' }}>₹{order.total_amount}</span>
                        </div>
                      </div>

                      {/* Payment Pending Banner if order is not paid yet */}
                      {order.payment_status === 'PENDING' && (
                        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '10px', padding: '0.65rem 0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', color: '#c2410c', marginBottom: '0.85rem', fontWeight: 600 }}>
                          <span>📍 Pay ₹{order.total_amount} at the Canteen Counter (Cash or QR) to begin kitchen preparation.</span>
                          <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>Payment Pending</span>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        {order.payment_status === 'PENDING' && (
                          <button
                            onClick={async () => {
                              if (window.confirm(`Are you sure you want to cancel order #${order.order_number}? Your reserved items will be released.`)) {
                                try {
                                  await api.cancelOrderPayment(order.id, 'Cancelled by student before counter payment');
                                  loadMyOrders();
                                } catch (e: any) {
                                  alert(e.message || 'Failed to cancel order');
                                }
                              }
                            }}
                            className="btn btn-secondary"
                            style={{ padding: '0.45rem 0.85rem', fontSize: '0.78rem', color: '#ef4444', borderColor: '#fecaca' }}
                          >
                            <X size={14} /> Cancel Unpaid Order
                          </button>
                        )}
                        <button
                          onClick={() => setReceiptOrder(order)}
                          className="btn btn-secondary"
                          style={{ padding: '0.45rem 0.85rem', fontSize: '0.78rem' }}
                        >
                          <Printer size={14} /> View / Print Bill
                        </button>
                        <button
                          onClick={() => {
                            setIssueOrderCode(order.order_number);
                            setActiveTab('support');
                          }}
                          className="btn btn-secondary"
                          style={{ padding: '0.45rem 0.85rem', fontSize: '0.78rem' }}
                        >
                          <HelpCircle size={14} /> Need Help?
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ======================= TAB: SUPPORT ======================= */}
        {activeTab === 'support' && (
          <div className="animate-fade-in" style={{ maxWidth: '640px', margin: '0 auto' }}>
            <div style={{ background: '#ffffff', borderRadius: '18px', border: '1px solid #e2e8f0', padding: '1.75rem', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '14px',
                    background: '#fff7ed',
                    color: '#ea580c',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '0.75rem'
                  }}
                >
                  <HelpCircle size={26} />
                </div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1e293b', margin: '0 0 0.35rem' }}>
                  Canteen Support & Feedback
                </h2>
                <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
                  Have an issue with an order, payment, or food quality? Let us know and we'll resolve it immediately.
                </p>
              </div>

              {issueSuccess && (
                <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '10px', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#047857', fontSize: '0.82rem', marginBottom: '1.25rem', fontWeight: 600 }}>
                  <CheckCircle2 size={16} />
                  <span>{issueSuccess}</span>
                </div>
              )}

              {issueError && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#b91c1c', fontSize: '0.82rem', marginBottom: '1.25rem', fontWeight: 600 }}>
                  <AlertCircle size={16} />
                  <span>{issueError}</span>
                </div>
              )}

              <form onSubmit={handleIssueSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.35rem' }}>
                    Order Number *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CAN-4821"
                    value={issueOrderCode}
                    onChange={(e) => setIssueOrderCode(e.target.value)}
                    required
                    className="input-field"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.35rem' }}>
                    Issue Category *
                  </label>
                  <select
                    value={issueCategory}
                    onChange={(e) => setIssueCategory(e.target.value)}
                    className="input-field"
                  >
                    <option value="ORDER_ISSUE">Order / Food Delay</option>
                    <option value="PAYMENT_FAILED">UPI / Payment Issue</option>
                    <option value="FOOD_QUALITY">Food Quality / Incorrect Item</option>
                    <option value="OTHER">General Feedback</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.35rem' }}>
                    Describe your issue *
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Please provide details of your issue..."
                    value={issueDescription}
                    onChange={(e) => setIssueDescription(e.target.value)}
                    required
                    className="input-field"
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={issueSubmitting}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.85rem', fontWeight: 700 }}
                >
                  {issueSubmitting ? 'Submitting Report...' : 'Submit Support Ticket'}
                </button>
              </form>

              {/* Direct Canteen Contacts */}
              <div style={{ marginTop: '1.75rem', borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.5rem' }}>
                  Direct Canteen Counter
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem', color: '#64748b' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Phone size={14} color="#ea580c" /> +91 98765 43210 (Canteen Front Desk)
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Mail size={14} color="#ea580c" /> canteen@saec.ac.in
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================= TAB: PROFILE ======================= */}
        {activeTab === 'profile' && (
          <div className="animate-fade-in" style={{ maxWidth: '640px', margin: '0 auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Profile Card */}
              <div style={{ background: '#ffffff', borderRadius: '18px', border: '1px solid #e2e8f0', padding: '1.75rem', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      background: '#fff7ed',
                      border: '2px solid #fed7aa',
                      color: '#ea580c',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      fontWeight: 800
                    }}
                  >
                    {user.full_name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', margin: '0 0 0.2rem' }}>
                      {user.full_name}
                    </h2>
                    <span className="badge badge-primary">
                      {user.role === 'FACULTY' ? 'Faculty Member' : 'Student'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', background: '#f8fafc', padding: '1.25rem', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                    <span style={{ color: '#64748b' }}>Email Address</span>
                    <span style={{ fontWeight: 700, color: '#1e293b' }}>{user.email}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                    <span style={{ color: '#64748b' }}>Mobile Number</span>
                    <span style={{ fontWeight: 700, color: '#1e293b' }}>{user.mobile_number}</span>
                  </div>
                  {user.student_profile && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                        <span style={{ color: '#64748b' }}>Register Number</span>
                        <span style={{ fontWeight: 700, color: '#1e293b' }}>{user.student_profile.register_number}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                        <span style={{ color: '#64748b' }}>Department / Year</span>
                        <span style={{ fontWeight: 700, color: '#1e293b' }}>
                          {user.student_profile.department} (Year {user.student_profile.year})
                        </span>
                      </div>
                    </>
                  )}
                  {user.faculty_profile && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                        <span style={{ color: '#64748b' }}>Staff Number</span>
                        <span style={{ fontWeight: 700, color: '#1e293b' }}>{user.faculty_profile.staff_number}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                        <span style={{ color: '#64748b' }}>Department</span>
                        <span style={{ fontWeight: 700, color: '#1e293b' }}>{user.faculty_profile.department}</span>
                      </div>
                    </>
                  )}
                </div>

                <div style={{ marginTop: '1.5rem' }}>
                  <button
                    onClick={onLogout}
                    className="btn btn-secondary"
                    style={{ width: '100%', color: '#b91c1c', borderColor: '#fecaca', fontWeight: 700 }}
                  >
                    Sign Out of Account
                  </button>
                </div>
              </div>

              {/* Change Password Card */}
              <div style={{ background: '#ffffff', borderRadius: '18px', border: '1px solid #e2e8f0', padding: '1.75rem', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e293b', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Lock size={18} color="#ea580c" /> Change Account Password
                </h3>

                {passChangeSuccess && (
                  <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '10px', padding: '0.75rem 1rem', color: '#047857', fontSize: '0.82rem', marginBottom: '1rem', fontWeight: 600 }}>
                    {passChangeSuccess}
                  </div>
                )}

                {passChangeError && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '0.75rem 1rem', color: '#b91c1c', fontSize: '0.82rem', marginBottom: '1rem', fontWeight: 600 }}>
                    {passChangeError}
                  </div>
                )}

                <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.35rem' }}>
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={currPassword}
                      onChange={(e) => setCurrPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.35rem' }}>
                      New Password (Min 6 chars)
                    </label>
                    <input
                      type="password"
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.35rem' }}>
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPass}
                      onChange={(e) => setConfirmPass(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="input-field"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={passChangeSubmitting}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '0.8rem', fontWeight: 700, marginTop: '0.35rem' }}
                  >
                    {passChangeSubmitting ? 'Updating Password...' : 'Save New Password'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ======================= STICKY BOTTOM NAVIGATION BAR (MOBILE) ======================= */}
      <nav
        className="mobile-bottom-nav"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#ffffff',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-around',
          padding: '0.5rem 0.25rem',
          zIndex: 90,
          boxShadow: '0 -4px 20px rgba(0,0,0,0.06)'
        }}
      >
        <button
          onClick={() => setActiveTab('menu')}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.2rem',
            color: activeTab === 'menu' ? '#ea580c' : '#64748b',
            cursor: 'pointer',
            flex: 1
          }}
        >
          <Utensils size={20} />
          <span style={{ fontSize: '0.68rem', fontWeight: activeTab === 'menu' ? 800 : 600 }}>Menu</span>
        </button>

        <button
          onClick={() => setIsCartOpen(true)}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.2rem',
            color: cartCount > 0 ? '#ea580c' : '#64748b',
            cursor: 'pointer',
            position: 'relative',
            flex: 1
          }}
        >
          <ShoppingCart size={20} />
          <span style={{ fontSize: '0.68rem', fontWeight: 700 }}>Cart</span>
          {cartCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-2px',
                right: '25%',
                background: '#ea580c',
                color: '#ffffff',
                fontSize: '0.6rem',
                fontWeight: 900,
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {cartCount}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            setActiveTab('orders');
            loadMyOrders();
          }}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.2rem',
            color: activeTab === 'orders' ? '#ea580c' : '#64748b',
            cursor: 'pointer',
            flex: 1
          }}
        >
          <ShoppingBag size={20} />
          <span style={{ fontSize: '0.68rem', fontWeight: activeTab === 'orders' ? 800 : 600 }}>Orders</span>
        </button>

        <button
          onClick={() => setActiveTab('support')}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.2rem',
            color: activeTab === 'support' ? '#ea580c' : '#64748b',
            cursor: 'pointer',
            flex: 1
          }}
        >
          <HelpCircle size={20} />
          <span style={{ fontSize: '0.68rem', fontWeight: activeTab === 'support' ? 800 : 600 }}>Support</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.2rem',
            color: activeTab === 'profile' ? '#ea580c' : '#64748b',
            cursor: 'pointer',
            flex: 1
          }}
        >
          <UserIcon size={20} />
          <span style={{ fontSize: '0.68rem', fontWeight: activeTab === 'profile' ? 800 : 600 }}>Profile</span>
        </button>
      </nav>

      {/* ======================= CART DRAWER / MODAL ======================= */}
      {isCartOpen && (
        <div className="modal-overlay" onClick={() => setIsCartOpen(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '480px', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '85vh' }}
          >
            {/* Cart Header */}
            <div
              style={{
                padding: '1.25rem',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#f8fafc'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShoppingCart size={20} color="#ea580c" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#1e293b' }}>
                  Your Food Cart ({cartCount})
                </h3>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Cart Items List */}
            <div style={{ padding: '1.25rem', flex: 1, overflowY: 'auto' }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
                  <ShoppingCart size={42} color="#cbd5e1" style={{ margin: '0 auto 0.75rem' }} />
                  <p style={{ fontWeight: 700, color: '#64748b', margin: 0 }}>Your cart is empty.</p>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>Add some delicious food from the menu!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem',
                        background: '#f8fafc',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0'
                      }}
                    >
                      <div style={{ flex: 1, paddingRight: '0.75rem' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1e293b' }}>
                          {item.product.name}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#ea580c', fontWeight: 700 }}>
                          ₹{item.product.price} each
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <button
                          onClick={() => updateQuantity(item.product.id, -1)}
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            background: '#ffffff',
                            color: '#1e293b',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Minus size={12} />
                        </button>
                        <span style={{ fontWeight: 800, fontSize: '0.85rem', minWidth: '18px', textAlign: 'center' }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, 1)}
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '6px',
                            border: 'none',
                            background: '#ea580c',
                            color: '#ffffff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Plus size={12} />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            padding: '4px',
                            marginLeft: '0.35rem'
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Footer / Checkout Trigger */}
            {cart.length > 0 && (
              <div style={{ padding: '1.25rem', borderTop: '1px solid #e2e8f0', background: '#ffffff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem', color: '#64748b' }}>
                  <span>Est. Prep Time</span>
                  <span style={{ fontWeight: 700, color: '#1e293b' }}>~{maxPrepTime} mins</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 900, color: '#1e293b' }}>
                  <span>Total Amount</span>
                  <span style={{ color: '#ea580c' }}>₹{cartSubtotal}</span>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={clearCart}
                    className="btn btn-secondary"
                    style={{ flex: 1, fontSize: '0.85rem' }}
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      setIsCheckoutOpen(true);
                    }}
                    className="btn btn-primary"
                    style={{ flex: 2, fontSize: '0.9rem', fontWeight: 700 }}
                  >
                    Proceed to Checkout <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================= CHECKOUT MODAL: PAYMENT AT CANTEEN COUNTER ======================= */}
      {isCheckoutOpen && (
        <div className="modal-overlay" onClick={() => setIsCheckoutOpen(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '500px', padding: '1.75rem' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>
                  PAYMENT AT CANTEEN COUNTER
                </h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                  Confirm items and select counter payment method
                </p>
              </div>
              <button onClick={() => setIsCheckoutOpen(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {orderError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#b91c1c', fontSize: '0.82rem', marginBottom: '1rem', fontWeight: 600 }}>
                <AlertCircle size={16} />
                <span>{orderError}</span>
              </div>
            )}

            {/* Offline Counter Payment Notice */}
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '0.75rem 1rem', display: 'flex', alignItems: 'flex-start', gap: '0.6rem', color: '#1e40af', fontSize: '0.8rem', marginBottom: '1.15rem', lineHeight: 1.4 }}>
              <Info size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Payment must be completed at the canteen counter.</strong>
                <div>Your order will be confirmed and prepared after payment verification by the cashier.</div>
              </div>
            </div>

            <form onSubmit={handlePlaceOrder} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              {/* Items Summary list */}
              <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  Order Summary ({cartCount} items)
                </div>
                {cart.map((item) => (
                  <div key={item.product.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', padding: '0.2rem 0' }}>
                    <span>{item.quantity}x {item.product.name}</span>
                    <span style={{ fontWeight: 700 }}>₹{item.product.price * item.quantity}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #cbd5e1', marginTop: '0.5rem', paddingTop: '0.5rem', fontWeight: 900, fontSize: '1rem' }}>
                  <span>Total Due at Counter</span>
                  <span style={{ color: '#ea580c' }}>₹{cartSubtotal}</span>
                </div>
              </div>

              {/* Preferred Pickup Time */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.35rem' }}>
                  Preferred Pickup Time (Est. Prep: ~{maxPrepTime} mins)
                </label>
                <input
                  type="datetime-local"
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  className="input-field"
                />
              </div>

              {/* Payment Method Selector: Cash or Counter QR */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.4rem' }}>
                  Payment Method at Counter *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CASH')}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '10px',
                      border: paymentMethod === 'CASH' ? '2px solid #ea580c' : '1px solid #cbd5e1',
                      background: paymentMethod === 'CASH' ? '#fff7ed' : '#ffffff',
                      color: paymentMethod === 'CASH' ? '#ea580c' : '#1e293b',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      textAlign: 'center'
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
                      border: paymentMethod === 'QR_COUNTER' || paymentMethod === 'UPI' ? '2px solid #ea580c' : '1px solid #cbd5e1',
                      background: paymentMethod === 'QR_COUNTER' || paymentMethod === 'UPI' ? '#fff7ed' : '#ffffff',
                      color: paymentMethod === 'QR_COUNTER' || paymentMethod === 'UPI' ? '#ea580c' : '#1e293b',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    📱 QR Payment at Counter
                  </button>
                </div>
              </div>

              {/* Special Cooking Notes */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.35rem' }}>
                  Cooking Instructions / Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Less spicy, Extra chutney"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="input-field"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingOrder}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.9rem', fontSize: '0.95rem', fontWeight: 800, marginTop: '0.5rem' }}
              >
                {isSubmittingOrder ? 'Placing Order...' : `Place Order (Pay ₹${cartSubtotal} at Counter)`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======================= PLACED ORDER SUCCESS MODAL ======================= */}
      {placedOrder && (
        <div className="modal-overlay" onClick={() => setPlacedOrder(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '460px', textAlign: 'center', padding: '2rem 1.5rem' }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#ecfdf5',
                color: '#047857',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
                boxShadow: '0 4px 14px rgba(4, 120, 87, 0.2)'
              }}
            >
              <CheckCircle2 size={36} />
            </div>

            <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1e293b', margin: '0 0 0.25rem' }}>
              ✓ ORDER PLACED
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 1.25rem' }}>
              Your order has been recorded in the system.
            </p>

            {/* Order Code & Counter Payment Highlight */}
            <div style={{ background: '#fff7ed', border: '2px dashed #fed7aa', borderRadius: '14px', padding: '1.2rem', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ea580c', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                Order Number
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#ea580c', letterSpacing: '0.04em' }}>
                {placedOrder.order_number}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid #ffedd5', fontSize: '0.78rem' }}>
                <div>
                  <div style={{ color: '#9a3412', fontWeight: 700 }}>Payment Status</div>
                  <div className="badge badge-warning" style={{ marginTop: '0.2rem' }}>PAYMENT PENDING</div>
                </div>
                <div>
                  <div style={{ color: '#9a3412', fontWeight: 700 }}>Order Status</div>
                  <div className="badge badge-primary" style={{ marginTop: '0.2rem' }}>WAITING FOR PAYMENT</div>
                </div>
              </div>
            </div>

            {/* Next Steps: Pay at counter notice */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.85rem 1rem', fontSize: '0.8rem', color: '#475569', textAlign: 'left', marginBottom: '1.25rem', lineHeight: 1.4 }}>
              <strong>Payment: PAY AT CANTEEN COUNTER</strong>
              <p style={{ margin: '0.35rem 0 0 0', color: '#64748b' }}>
                Please complete payment of <strong>₹{placedOrder.total_amount}</strong> at the canteen counter using <strong>Cash</strong> or the <strong>Canteen Counter QR Scanner</strong>. Your order will enter kitchen prep once verified.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                onClick={() => {
                  setReceiptOrder(placedOrder);
                  setPlacedOrder(null);
                }}
                className="btn btn-secondary"
                style={{ width: '100%' }}
              >
                <Printer size={16} /> View / Print Bill
              </button>
              <button
                onClick={() => {
                  setPlacedOrder(null);
                  setActiveTab('orders');
                }}
                className="btn btn-primary"
                style={{ width: '100%', fontWeight: 700 }}
              >
                Track Live Order Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= UPI REFERENCE SUBMISSION MODAL ======================= */}
      {payOrder && (
        <div className="modal-overlay" onClick={() => setPayOrder(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '440px', padding: '1.75rem' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#1e293b' }}>
                Submit UPI Payment Proof
              </h3>
              <button onClick={() => setPayOrder(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {upiSuccess && (
              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '10px', padding: '0.75rem 1rem', color: '#047857', fontSize: '0.82rem', marginBottom: '1rem', fontWeight: 600 }}>
                {upiSuccess}
              </div>
            )}

            {upiError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '0.75rem 1rem', color: '#b91c1c', fontSize: '0.82rem', marginBottom: '1rem', fontWeight: 600 }}>
                {upiError}
              </div>
            )}

            <form onSubmit={handleUpiProofSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.82rem' }}>
                <div><strong>Order:</strong> #{payOrder.order_number}</div>
                <div><strong>Amount to Pay:</strong> ₹{payOrder.total_amount}</div>
                <div style={{ marginTop: '0.4rem', color: '#64748b' }}>
                  Transfer ₹{payOrder.total_amount} via GPay/PhonePe to <strong>saec.canteen@upi</strong> and enter the 12-digit UTR/Reference ID below.
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.35rem' }}>
                  12-Digit UPI Transaction ID / UTR *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 423891028391"
                  value={upiTransactionId}
                  onChange={(e) => setUpiTransactionId(e.target.value)}
                  required
                  className="input-field"
                />
              </div>

              <button
                type="submit"
                disabled={upiSubmitting}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.85rem', fontWeight: 700 }}
              >
                {upiSubmitting ? 'Verifying...' : 'Submit Payment Reference'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======================= SPECIAL CONTACT ORDER MODAL ======================= */}
      {contactModalOpen && contactProduct && (
        <div className="modal-overlay" onClick={() => setContactModalOpen(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '480px', padding: '1.75rem' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#1e293b' }}>
                Request Catering / Made-to-Order
              </h3>
              <button onClick={() => setContactModalOpen(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {contactSuccess && (
              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '10px', padding: '0.75rem 1rem', color: '#047857', fontSize: '0.82rem', marginBottom: '1rem', fontWeight: 600 }}>
                {contactSuccess}
              </div>
            )}

            {contactError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '0.75rem 1rem', color: '#b91c1c', fontSize: '0.82rem', marginBottom: '1rem', fontWeight: 600 }}>
                {contactError}
              </div>
            )}

            <form onSubmit={handleContactOrderSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '10px' }}>
                <div style={{ fontWeight: 800, color: '#1e293b' }}>{contactProduct.name}</div>
                <div style={{ fontSize: '0.8rem', color: '#ea580c', fontWeight: 700 }}>₹{contactProduct.price} per unit</div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.35rem' }}>
                  Quantity *
                </label>
                <input
                  type="number"
                  min="1"
                  value={contactQty}
                  onChange={(e) => setContactQty(parseInt(e.target.value) || 1)}
                  required
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.35rem' }}>
                  Preferred Pickup Time
                </label>
                <input
                  type="datetime-local"
                  value={contactPickupTime}
                  onChange={(e) => setContactPickupTime(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.35rem' }}>
                  Special Instructions / Event Details
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Department symposium lunch for 50 people"
                  value={contactNotes}
                  onChange={(e) => setContactNotes(e.target.value)}
                  className="input-field"
                />
              </div>

              <button
                type="submit"
                disabled={contactSubmitting}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.85rem', fontWeight: 700 }}
              >
                {contactSubmitting ? 'Submitting Request...' : 'Send Catering Request'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======================= THERMAL BILL PRINT MODAL ======================= */}
      {receiptOrder && (
        <ThermalReceipt
          order={receiptOrder}
          cashierName="SAEC Canteen Counter"
          onClose={() => setReceiptOrder(null)}
        />
      )}
    </div>
  );
};
