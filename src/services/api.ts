import type {
  BusinessDay,
  Category,
  ContactOrderRequest,
  InventoryTransaction,
  Order,
  PaymentSupportTicket,
  Product,
  User,
  UserStats,
  AnalyticsOverview,
  AnalyticsDashboardData
} from '../types';

const isBrowser = typeof window !== 'undefined';
const isLocalhost = isBrowser && (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname.startsWith('192.168.') ||
  window.location.hostname.startsWith('10.')
);

const envBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
const rawBaseUrl = envBaseUrl || (isLocalhost ? 'http://127.0.0.1:8000/api' : 'https://web-production-85e59.up.railway.app/api');
export const API_BASE_URL = rawBaseUrl.endsWith('/api') ? rawBaseUrl : `${rawBaseUrl.replace(/\/$/, '')}/api`;
export const BACKEND_SERVER_URL = API_BASE_URL.replace(/\/api\/?$/, '');

export const getMediaUrl = (path: string | null | undefined): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${BACKEND_SERVER_URL}${cleanPath}`;
};

let token: string | null = localStorage.getItem('token') || null;

export const setAuthToken = (newToken: string | null) => {
  token = newToken;
  if (newToken) {
    localStorage.setItem('token', newToken);
  } else {
    localStorage.removeItem('token');
  }
};

const authHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// API Methods
export const api = {
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      if (!res.ok) {
        let errMessage = 'Invalid credentials';
        try {
          const errData = await res.json();
          if (Array.isArray(errData.detail)) {
            errMessage = errData.detail.join(', ');
          } else if (typeof errData.detail === 'string') {
            errMessage = errData.detail;
          } else if (errData.error) {
            errMessage = errData.error;
          } else if (errData.non_field_errors) {
            errMessage = Array.isArray(errData.non_field_errors) ? errData.non_field_errors.join(', ') : String(errData.non_field_errors);
          } else if (errData.email) {
            errMessage = Array.isArray(errData.email) ? errData.email.join(', ') : String(errData.email);
          }
        } catch (_) {}
        throw new Error(errMessage);
      }
      const data = await res.json();
      setAuthToken(data.access);
      return { token: data.access, user: data.user };
    } catch (e: any) {
      if (e.message?.includes('Failed to fetch') || e.name === 'TypeError') {
        throw new Error(`Cannot connect to backend server at ${API_BASE_URL}. Please ensure the backend is running and reachable.`);
      }
      throw new Error(e.message || 'Login failed');
    }
  },

  async getCurrentBusinessDay(): Promise<{
    date: string;
    is_ordering_open: boolean;
    message: string;
    status: string;
    opening_time: string;
    closing_time: string;
    reason?: string;
  }> {
    try {
      const res = await fetch(`${API_BASE_URL}/business-day/current/`);
      if (!res.ok) throw new Error('Failed to fetch business day');
      return await res.json();
    } catch (e) {
      return {
        date: new Date().toISOString().split('T')[0],
        is_ordering_open: true,
        message: '🟢 SAEC CAFÉ • Ordering Open (10:00 AM – 3:30 PM)',
        status: 'WORKING_DAY',
        opening_time: '10:00',
        closing_time: '15:30'
      };
    }
  },

  async getCalendar(): Promise<BusinessDay[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/business-day/calendar/`, { headers: authHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : data.results || [];
    } catch (e) {
      return [];
    }
  },

  async bulkScheduleCalendar(dates: string[], status: string, opening_time: string, closing_time: string, reason: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/business-day/calendar/bulk/`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ dates, status, opening_time, closing_time, reason })
      });
      return await res.json();
    } catch (e: any) {
      throw new Error(e.message || 'Calendar schedule update failed');
    }
  },

  async getProducts(): Promise<Product[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/products/`);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : data.results || [];
    } catch (e) {
      return [];
    }
  },

  async getCategories(): Promise<Category[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/products/categories/`);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : data.results || [];
    } catch (e) {
      return [];
    }
  },

  async createPosOrder(items: { product_id: number; quantity: number }[], discount: number, paymentMethod: string): Promise<Order> {
    const res = await fetch(`${API_BASE_URL}/orders/`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        customer_type: 'WALK_IN',
        order_source: 'POS',
        items,
        discount_amount: discount,
        is_paid: true,
        payment_method: paymentMethod
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.detail || 'Failed to place POS order');
    }
    return await res.json();
  },

  async createCustomerOrder(payload: {
    items: { product_id: number; quantity: number }[];
    pickup_time?: string;
    notes?: string;
    payment_method?: string;
    customer_type?: string;
  }): Promise<Order> {
    const res = await fetch(`${API_BASE_URL}/orders/`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        customer_type: payload.customer_type || 'STUDENT',
        order_source: 'MOBILE',
        items: payload.items,
        pickup_time: payload.pickup_time || null,
        notes: payload.notes || '',
        is_paid: false,
        payment_method: payload.payment_method || 'CASH'
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.detail || 'Failed to place order. Please try again.');
    }
    return await res.json();
  },

  async submitContactOrder(payload: {
    product_id: number;
    quantity: number;
    preferred_pickup_time: string;
    special_instructions?: string;
  }): Promise<ContactOrderRequest> {
    const res = await fetch(`${API_BASE_URL}/contact-orders/`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.detail || 'Failed to submit contact catering request.');
    }
    return await res.json();
  },

  async submitPaymentSupportTicket(orderId: number, transactionId: string, screenshot?: File): Promise<PaymentSupportTicket> {
    const formData = new FormData();
    formData.append('order_id', String(orderId));
    formData.append('transaction_id', transactionId.trim());
    if (screenshot) {
      formData.append('screenshot', screenshot);
    }
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`${API_BASE_URL}/payment-support/`, {
      method: 'POST',
      headers,
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.detail || 'Failed to submit payment support ticket.');
    }
    return await res.json();
  },

  async getOrders(): Promise<Order[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/orders/`, { headers: authHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : data.results || [];
    } catch (e) {
      return [];
    }
  },

  async getFcfsQueue(): Promise<Order[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/orders/queue/fcfs/`);
      if (!res.ok) return [];
      return await res.json();
    } catch (e) {
      return [];
    }
  },

  async updateOrderStatus(orderId: number, status?: string, paymentStatus?: string): Promise<Order> {
    const res = await fetch(`${API_BASE_URL}/orders/${orderId}/status/`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ status, payment_status: paymentStatus })
    });
    if (!res.ok) throw new Error('Status update failed');
    return await res.json();
  },

  async getPaymentSupportTickets(): Promise<PaymentSupportTicket[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/payment-support/`, { headers: authHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : data.results || [];
    } catch (e) {
      return [];
    }
  },

  async verifyPaymentSupportTicket(ticketId: number, action: 'VERIFY' | 'REJECT', notes: string): Promise<PaymentSupportTicket> {
    const res = await fetch(`${API_BASE_URL}/payment-support/${ticketId}/verify/`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ action, notes })
    });
    if (!res.ok) throw new Error('Verification action failed');
    return await res.json();
  },

  async getContactOrders(): Promise<ContactOrderRequest[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/contact-orders/`, { headers: authHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : data.results || [];
    } catch (e) {
      return [];
    }
  },

  async approveContactOrder(reqId: number, action: 'ACCEPT' | 'REJECT', rejection_reason?: string): Promise<ContactOrderRequest> {
    const res = await fetch(`${API_BASE_URL}/contact-orders/${reqId}/approval/`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ action, rejection_reason })
    });
    if (!res.ok) throw new Error('Request approval action failed');
    return await res.json();
  },

  async getInventoryTransactions(): Promise<InventoryTransaction[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/inventory/transactions/`, { headers: authHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : data.results || [];
    } catch (e) {
      return [];
    }
  },

  async recordStockAdjustment(productId: number, transactionType: string, quantity: number, notes: string) {
    const res = await fetch(`${API_BASE_URL}/inventory/transactions/`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ product: productId, transaction_type: transactionType, quantity, notes })
    });
    if (!res.ok) throw new Error('Stock adjustment failed');
    return await res.json();
  },

  async getAnalyticsDashboard(range = '7days', startDate?: string, endDate?: string): Promise<AnalyticsDashboardData | null> {
    try {
      const params = new URLSearchParams();
      params.append('range', range);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      const res = await fetch(`${API_BASE_URL}/analytics/dashboard/?${params.toString()}`, { headers: authHeaders() });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      return null;
    }
  },

  async getOverviewAnalytics(): Promise<AnalyticsOverview | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/analytics/overview/`, { headers: authHeaders() });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      return null;
    }
  },

  async getSalesAnalytics() {
    try {
      const res = await fetch(`${API_BASE_URL}/analytics/sales/`, { headers: authHeaders() });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      return null;
    }
  },

  async getCustomerIssues() {
    try {
      const res = await fetch(`${API_BASE_URL}/issues/issues/`, { headers: authHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : data.results || [];
    } catch (e) {
      return [];
    }
  },

  async reportCustomerIssue(orderCode: string, category: string, description: string) {
    const res = await fetch(`${API_BASE_URL}/issues/issues/`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ order_code: orderCode, category, description })
    });
    if (!res.ok) throw new Error('Failed to submit issue report');
    return await res.json();
  },

  async updateCustomerIssue(issueId: number, status: string, adminResponse: string) {
    const res = await fetch(`${API_BASE_URL}/issues/issues/${issueId}/`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ status, admin_response: adminResponse })
    });
    if (!res.ok) throw new Error('Failed to update issue status');
    return await res.json();
  },

  async getUserStats(): Promise<UserStats> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/users/stats/`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed to fetch user stats');
      return await res.json();
    } catch (e) {
      return { total_users: 0, pending_users: 0, active_users: 0, inactive_users: 0, rejected_users: 0 };
    }
  },

  async getUsers(role?: string, status?: string, search?: string): Promise<User[]> {
    try {
      const params = new URLSearchParams();
      if (role && role !== 'ALL') params.append('role', role);
      if (status && status !== 'ALL') params.append('status', status);
      if (search) params.append('search', search);
      const url = `${API_BASE_URL}/auth/users/${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url, { headers: authHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : data.results || [];
    } catch (e) {
      return [];
    }
  },

  async toggleUserStatus(userId: number): Promise<User> {
    const res = await fetch(`${API_BASE_URL}/auth/users/${userId}/status/`, {
      method: 'PATCH',
      headers: authHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.error || 'Failed to update user active status');
    }
    return await res.json();
  },

  async activateUser(userId: number, temporary_password?: string): Promise<{ message: string; temporary_password: string; user: User }> {
    const res = await fetch(`${API_BASE_URL}/auth/users/${userId}/activate/`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ temporary_password: temporary_password || '' })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to activate user account');
    }
    return await res.json();
  },

  async rejectUser(userId: number, reason?: string): Promise<{ message: string; user: User }> {
    const res = await fetch(`${API_BASE_URL}/auth/users/${userId}/reject/`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ reason: reason || '' })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to reject user account');
    }
    return await res.json();
  },

  async changePassword(payload: { current_password: string; new_password: string; confirm_password: string }): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE_URL}/auth/change-password/`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.current_password?.[0] || err.new_password?.[0] || err.confirm_password?.[0] || err.detail || 'Failed to update password');
    }
    return await res.json();
  },

  async requestPasswordReset(email: string): Promise<{ message: string; reset_token?: string }> {
    const res = await fetch(`${API_BASE_URL}/auth/password-reset/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase() })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to request password reset');
    }
    return await res.json();
  },

  async confirmPasswordReset(payload: { token: string; new_password: string; confirm_password: string }): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE_URL}/auth/password-reset-confirm/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.new_password?.[0] || err.confirm_password?.[0] || 'Failed to reset password');
    }
    return await res.json();
  },

  async registerStudent(payload: { email: string; full_name: string; mobile_number: string; register_number: string; department: string; year: number }): Promise<User> {
    const res = await fetch(`${API_BASE_URL}/auth/register/student/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.email?.[0] || err.mobile_number?.[0] || err.register_number?.[0] || err.detail || 'Failed to register student');
    }
    return await res.json();
  },

  async registerFaculty(payload: { email: string; full_name: string; mobile_number: string; staff_number: string; department: string }): Promise<User> {
    const res = await fetch(`${API_BASE_URL}/auth/register/faculty/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.email?.[0] || err.mobile_number?.[0] || err.staff_number?.[0] || err.detail || 'Failed to register faculty');
    }
    return await res.json();
  },

  async createCashier(payload: { email: string; full_name: string; mobile_number: string; password: string }): Promise<User> {
    const res = await fetch(`${API_BASE_URL}/auth/register/cashier/`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.email?.[0] || err.mobile_number?.[0] || 'Failed to register cashier');
    }
    return await res.json();
  },

  async createProduct(productData: Partial<Product>): Promise<Product> {
    const res = await fetch(`${API_BASE_URL}/products/`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(productData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.detail || 'Failed to create food product');
    }
    return await res.json();
  },

  async updateProduct(id: number, productData: Partial<Product>): Promise<Product> {
    const res = await fetch(`${API_BASE_URL}/products/${id}/`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(productData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.detail || 'Failed to update food product');
    }
    return await res.json();
  },

  async deleteProduct(id: number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/products/${id}/`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    if (!res.ok) throw new Error('Failed to deactivate food product');
  },

  async searchOrders(query?: string, status?: string, paymentStatus?: string): Promise<Order[]> {
    try {
      const params = new URLSearchParams();
      if (query) params.append('search', query);
      if (status && status !== 'ALL') params.append('status', status);
      if (paymentStatus && paymentStatus !== 'ALL') params.append('payment_status', paymentStatus);
      const url = `${API_BASE_URL}/orders/${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url, { headers: authHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : data.results || [];
    } catch (e) {
      return [];
    }
  },

  async getSystemSettings() {
    try {
      const saved = localStorage.getItem('saec_system_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // fallback
    }
    return {
      canteen_name: 'SAEC CAFÉ',
      college_name: 'Syed Ammal Engineering College',
      motto: 'Good Food, Less Waiting.',
      operating_hours: '8:00 AM – 5:00 PM',
      app_ordering_window: '10:00 AM – 3:30 PM',
      tax_rate_percent: 0,
      enable_special_orders: true,
      contact_email: 'canteen@saec.ac.in',
      contact_phone: '+91 98765 43210',
      enable_sound_alerts: true
    };
  },

  async updateSystemSettings(settings: any) {
    localStorage.setItem('saec_system_settings', JSON.stringify(settings));
    return settings;
  }
};

