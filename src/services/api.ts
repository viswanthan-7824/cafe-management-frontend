import type {
  BusinessDay,
  Category,
  ContactOrderRequest,
  DemandForecast,
  InventoryTransaction,
  Order,
  PaymentSupportTicket,
  Product,
  User
} from '../types';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

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
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error('Invalid credentials');
      const data = await res.json();
      setAuthToken(data.access);
      return { token: data.access, user: data.user };
    } catch (e: any) {
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

  async getDemandForecast(): Promise<DemandForecast[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/forecasting/predict/`, { headers: authHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      return data.forecast || [];
    } catch (e) {
      return [];
    }
  },

  async getOverviewAnalytics() {
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
  }
};
