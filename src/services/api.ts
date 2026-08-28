import type {
  BusinessDay,
  Category,
  ContactOrderRequest,
  InventoryTransaction,
  Order,
  PaymentSupportTicket,
  Product,
  ProductDashboardStats,
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
  if (cleanPath.startsWith('/media/')) {
    return `${BACKEND_SERVER_URL}${cleanPath}`;
  }
  return `${BACKEND_SERVER_URL}/media${cleanPath}`;
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
  async googleLogin(credential: string): Promise<{ token: string; user: User }> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/google/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      });
      if (!res.ok) {
        let errMessage = 'Google authentication failed';
        try {
          const errData = await res.json();
          if (errData.detail) {
            errMessage = Array.isArray(errData.detail) ? errData.detail.join(', ') : String(errData.detail);
          } else if (errData.error) {
            errMessage = errData.error;
          } else if (errData.message) {
            errMessage = errData.message;
          }
        } catch (_) {}
        throw new Error(errMessage);
      }
      const data = await res.json();
      setAuthToken(data.access);
      return { token: data.access, user: data.user };
    } catch (e: any) {
      if (e.message?.includes('Failed to fetch') || e.name === 'TypeError') {
        throw new Error(`Unable to connect to the server. Please try again.`);
      }
      throw new Error(e.message || 'Google authentication failed');
    }
  },

  async studentPasswordLogin(email: string, password: string): Promise<{ token: string; user: User }> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/student/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      if (!res.ok) {
        let errMessage = 'Login failed';
        try {
          const errData = await res.json();
          if (errData.detail) {
            errMessage = Array.isArray(errData.detail) ? errData.detail.join(', ') : String(errData.detail);
          } else if (errData.error) {
            errMessage = errData.error;
          }
        } catch (_) {}
        throw new Error(errMessage);
      }
      const data = await res.json();
      setAuthToken(data.access);
      return { token: data.access, user: data.user };
    } catch (e: any) {
      if (e.message?.includes('Failed to fetch') || e.name === 'TypeError') {
        throw new Error(`Unable to connect to the server. Please try again.`);
      }
      throw new Error(e.message || 'Login failed');
    }
  },

  async requestLoginCode(email: string, password?: string): Promise<{ message: string; masked_email: string; resend_cooldown: number; dev_code?: string }> {
    const res = await fetch(`${API_BASE_URL}/auth/request-code/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase(), password: password || '' })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.detail || 'Failed to request login code.');
    }
    return await res.json();
  },

  async verifyLoginCode(email: string, code: string): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE_URL}/auth/verify-code/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase(), code: code.trim() })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.detail || 'Failed to verify login code.');
    }
    const data = await res.json();
    setAuthToken(data.token);
    return { token: data.token, user: data.user };
  },

  async requestCreatePasswordOtp(email: string): Promise<{ message: string; masked_email: string; resend_cooldown: number; dev_code?: string }> {
    const res = await fetch(`${API_BASE_URL}/auth/create-password/request-otp/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase() })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.detail || data.error || 'This email is not registered. Please contact the administrator.');
    }
    return data;
  },

  async verifyCreatePasswordOtp(email: string, code: string): Promise<{ message: string; verification_token: string; email: string }> {
    const res = await fetch(`${API_BASE_URL}/auth/create-password/verify-otp/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase(), code: code.trim() })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || data.detail || 'Invalid verification code.');
    }
    return data;
  },

  async setCreatePassword(verificationToken: string, password: string, confirmPassword: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE_URL}/auth/create-password/set-password/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verification_token: verificationToken, password, confirm_password: confirmPassword })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data.detail || data.password || data.confirm_password || 'Failed to create password.';
      throw new Error(Array.isArray(msg) ? msg.join(', ') : String(msg));
    }
    return data;
  },

  async requestForgotPasswordOtp(email: string): Promise<{ message: string; masked_email: string; resend_cooldown: number; dev_code?: string }> {
    const res = await fetch(`${API_BASE_URL}/auth/forgot-password/request-otp/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase() })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.detail || data.error || 'This email is not registered. Please contact the administrator.');
    }
    return data;
  },

  async verifyForgotPasswordOtp(email: string, code: string): Promise<{ message: string; verification_token: string; email: string }> {
    const res = await fetch(`${API_BASE_URL}/auth/forgot-password/verify-otp/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase(), code: code.trim() })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || data.detail || 'Invalid verification code.');
    }
    return data;
  },

  async setForgotPassword(verificationToken: string, password: string, confirmPassword: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE_URL}/auth/forgot-password/set-password/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verification_token: verificationToken, password, confirm_password: confirmPassword })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data.detail || data.password || data.confirm_password || 'Failed to reset password.';
      throw new Error(Array.isArray(msg) ? msg.join(', ') : String(msg));
    }
    return data;
  },

  async requestRegistrationOtp(email: string): Promise<{
    message: string;
    email: string;
    full_name?: string;
    role?: string;
    class_name?: string;
    college_id?: string;
    admin_account?: string;
    simulation_gmail_otp?: string;
    simulation_admin_otp?: string;
    is_registered?: boolean;
  }> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register/request-otp/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) {
        let errMessage = data.detail || 'Unable to generate verification codes.';
        throw new Error(Array.isArray(errMessage) ? errMessage.join(', ') : String(errMessage));
      }
      return data;
    } catch (e: any) {
      if (e.message?.includes('Failed to fetch') || e.name === 'TypeError') {
        throw new Error(`Unable to connect to the server. Please try again.`);
      }
      throw e;
    }
  },

  async verifyRegistrationOtps(email: string, gmailOtp: string, adminOtp: string): Promise<{
    message: string;
    verification_token: string;
    email: string;
    full_name?: string;
  }> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register/verify-otps/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          gmail_otp: gmailOtp.trim(),
          admin_otp: adminOtp.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        let errMessage = data.detail || 'OTP verification failed.';
        throw new Error(Array.isArray(errMessage) ? errMessage.join(', ') : String(errMessage));
      }
      return data;
    } catch (e: any) {
      if (e.message?.includes('Failed to fetch') || e.name === 'TypeError') {
        throw new Error(`Unable to connect to the server. Please try again.`);
      }
      throw e;
    }
  },

  async completeRegistration(verificationToken: string, password: string, confirmPassword: string): Promise<{
    token: string;
    user: User;
    message: string;
  }> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register/complete/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verification_token: verificationToken,
          password,
          confirm_password: confirmPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        let errMessage = data.detail || 'Registration completion failed.';
        if (data.confirm_password) {
          errMessage = data.confirm_password;
        } else if (data.password) {
          errMessage = data.password;
        }
        throw new Error(Array.isArray(errMessage) ? errMessage.join(', ') : String(errMessage));
      }
      setAuthToken(data.access);
      return { token: data.access, user: data.user, message: data.message };
    } catch (e: any) {
      if (e.message?.includes('Failed to fetch') || e.name === 'TypeError') {
        throw new Error(`Unable to connect to the server. Please try again.`);
      }
      throw e;
    }
  },

  async directRegister(params: {
    full_name: string;
    email: string;
    password: string;
    confirm_password?: string;
    mobile_number?: string;
    college_id?: string;
    department?: string;
    year?: number;
    role?: 'STUDENT' | 'FACULTY';
  }): Promise<{ token: string; user: User; message: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || data.message || 'Registration failed. Please check your details.');
      }
      setAuthToken(data.access);
      return { token: data.access, user: data.user, message: data.message };
    } catch (e: any) {
      if (e.message?.includes('Failed to fetch') || e.name === 'TypeError') {
        throw new Error(`Unable to connect to server. Please ensure backend is running.`);
      }
      throw e;
    }
  },

  async getAdminRegistrationOtps(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/admin/registration-otps/`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch registration OTPs');
      return await res.json();
    } catch (e) {
      return [];
    }
  },

  async adminLogin(email: string, password: string): Promise<{ token: string; user: User }> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/admin/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      if (!res.ok) {
        let errMessage = 'Incorrect administrator credentials';
        try {
          const errData = await res.json();
          if (errData.detail) {
            errMessage = Array.isArray(errData.detail) ? errData.detail.join(', ') : String(errData.detail);
          } else if (errData.error) {
            errMessage = errData.error;
          }
        } catch (_) {}
        throw new Error(errMessage);
      }
      const data = await res.json();
      setAuthToken(data.access);
      return { token: data.access, user: data.user };
    } catch (e: any) {
      if (e.message?.includes('Failed to fetch') || e.name === 'TypeError') {
        throw new Error(`Unable to connect to the server. Please try again.`);
      }
      throw new Error(e.message || 'Admin login failed');
    }
  },

  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    return this.adminLogin(email, password);
  },

  async getCurrentBusinessDay(): Promise<{
    date: string;
    day_name?: string;
    is_ordering_open: boolean;
    message: string;
    status: string;
    opening_time: string;
    closing_time: string;
    reason?: string;
    updated_at?: string;
    updated_by_name?: string;
  }> {
    try {
      const res = await fetch(`${API_BASE_URL}/business-day/current/`);
      if (!res.ok) throw new Error('Failed to fetch business day');
      return await res.json();
    } catch (e) {
      return {
        date: new Date().toISOString().split('T')[0],
        day_name: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
        is_ordering_open: true,
        message: '🟢 SAEC CAFÉ • Ordering Open (10:00 AM – 3:30 PM)',
        status: 'WORKING_DAY',
        opening_time: '10:00',
        closing_time: '15:30',
        updated_by_name: 'System Admin'
      };
    }
  },

  async getCurrentBusinessDayStatus() {
    return this.getCurrentBusinessDay();
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

  async setTodayWorkingDay(reason: string = '', opening_time: string = '10:00', closing_time: string = '15:30'): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/business-day/set-today-working/`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ reason, opening_time, closing_time })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.error || 'Failed to mark today as a working day');
    }
    return await res.json();
  },

  async setTodayHoliday(reason: string = 'College Holiday'): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/business-day/set-today-holiday/`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ reason })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.error || 'Failed to mark today as a holiday');
    }
    return await res.json();
  },

  async setDateStatus(date: string, status: string, reason: string = '', opening_time: string = '10:00', closing_time: string = '15:30'): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/business-day/set-date-status/`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ date, status, reason, opening_time, closing_time })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.error || 'Failed to update date status');
    }
    return await res.json();
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

  async getProductStats(): Promise<ProductDashboardStats> {
    try {
      const res = await fetch(`${API_BASE_URL}/products/stats/`, { headers: authHeaders() });
      if (!res.ok) {
        return {
          total_products: 0,
          available_products: 0,
          out_of_stock: 0,
          inactive_products: 0,
          total_categories: 0,
          products_added_today: 0,
        };
      }
      return await res.json();
    } catch (e) {
      return {
        total_products: 0,
        available_products: 0,
        out_of_stock: 0,
        inactive_products: 0,
        total_categories: 0,
        products_added_today: 0,
      };
    }
  },

  async getCategories(): Promise<Category[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/products/categories/?all=true`);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : data.results || [];
    } catch (e) {
      return [];
    }
  },

  async createCategory(categoryData: Partial<Category>): Promise<Category> {
    const res = await fetch(`${API_BASE_URL}/products/categories/`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(categoryData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.name?.[0] || err.detail || err.error || 'Failed to create category');
    }
    return await res.json();
  },

  async updateCategory(id: number, categoryData: Partial<Category>): Promise<Category> {
    const res = await fetch(`${API_BASE_URL}/products/categories/${id}/`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(categoryData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.name?.[0] || err.detail || err.error || 'Failed to update category');
    }
    return await res.json();
  },

  async deleteCategory(id: number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/products/categories/${id}/`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete category');
  },

  async toggleProductAvailability(id: number, today_availability: string, is_active?: boolean): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/products/${id}/availability/`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ today_availability, is_active })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.error || 'Failed to update availability status');
    }
    return await res.json();
  },

  async generateAiProductImage(name: string, description: string = '', category_name: string = ''): Promise<{
    preview_url: string;
    image_data: string;
    prompt_used: string;
    source: string;
    is_gemini_active: boolean;
    message: string;
  }> {
    const res = await fetch(`${API_BASE_URL}/products/generate-ai-image/`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ name, description, category_name })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.detail || 'Failed to generate product image with Gemini AI');
    }
    return await res.json();
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

  async createOrder(payload: any): Promise<Order> {
    const items = (payload.items_data || payload.items || []).map((it: any) => ({
      product_id: it.product_id,
      quantity: it.quantity
    }));
    return this.createCustomerOrder({
      items,
      pickup_time: payload.pickup_time,
      notes: payload.notes,
      customer_type: payload.customer_type,
      payment_method: payload.payment_method
    });
  },

  async createPaymentSupportTicket(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/payment-support/tickets/`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.error || 'Failed to submit ticket');
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

  async verifyCounterPayment(orderId: number, paymentMethod: 'CASH' | 'QR_COUNTER' | 'UPI', counterNotes: string = ''): Promise<{ message: string; order: Order; payment: any }> {
    const res = await fetch(`${API_BASE_URL}/payments/verify-counter/`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ order_id: orderId, payment_method: paymentMethod, counter_notes: counterNotes })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.detail || 'Payment verification failed');
    }
    return await res.json();
  },

  async getPendingPaymentOrders(search: string = ''): Promise<Order[]> {
    try {
      const params = search ? `?search=${encodeURIComponent(search)}` : '';
      const res = await fetch(`${API_BASE_URL}/payments/pending/${params}`, { headers: authHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : data.results || [];
    } catch (e) {
      return [];
    }
  },

  async cancelOrderPayment(orderId: number, reason: string = 'Cancelled'): Promise<{ message: string; order: Order }> {
    const res = await fetch(`${API_BASE_URL}/payments/cancel/`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ order_id: orderId, reason })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.detail || 'Order cancellation failed');
    }
    return await res.json();
  },

  async getPaymentAuditLogs(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/payments/audit-log/`, { headers: authHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : data.results || [];
    } catch (e) {
      return [];
    }
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

  async getUsers(
    filterOrRole?: {
      role?: string;
      status?: string;
      class_name?: string;
      department?: string;
      year?: number | string;
      email_status?: string;
      search?: string;
    } | string,
    statusParam?: string,
    searchParam?: string
  ): Promise<User[]> {
    try {
      const params = new URLSearchParams();
      if (typeof filterOrRole === 'object' && filterOrRole !== null) {
        if (filterOrRole.role && filterOrRole.role !== 'ALL') params.append('role', filterOrRole.role);
        if (filterOrRole.status && filterOrRole.status !== 'ALL') params.append('status', filterOrRole.status);
        if (filterOrRole.class_name && filterOrRole.class_name !== 'ALL') params.append('class_name', filterOrRole.class_name);
        if (filterOrRole.department && filterOrRole.department !== 'ALL') params.append('department', filterOrRole.department);
        if (filterOrRole.year && filterOrRole.year !== 'ALL') params.append('year', String(filterOrRole.year));
        if (filterOrRole.email_status && filterOrRole.email_status !== 'ALL') params.append('email_status', filterOrRole.email_status);
        if (filterOrRole.search) params.append('search', filterOrRole.search);
      } else {
        if (filterOrRole && filterOrRole !== 'ALL') params.append('role', filterOrRole);
        if (statusParam && statusParam !== 'ALL') params.append('status', statusParam);
        if (searchParam) params.append('search', searchParam);
      }

      const url = `${API_BASE_URL}/auth/users/${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url, { headers: authHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : data.results || [];
    } catch (e) {
      return [];
    }
  },

  async toggleUserStatus(userId: number, status?: string): Promise<User> {
    const res = await fetch(`${API_BASE_URL}/auth/users/${userId}/status/`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(status ? { status } : {})
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.error || 'Failed to update user status');
    }
    return await res.json();
  },

  async activateUser(userId: number): Promise<{ message: string; user: User }> {
    const res = await fetch(`${API_BASE_URL}/auth/users/${userId}/activate/`, {
      method: 'POST',
      headers: authHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to activate user account');
    }
    return await res.json();
  },

  async createUser(payload: {
    full_name: string;
    email?: string;
    role: string;
    college_id?: string;
    mobile_number?: string;
    status?: string;
    class_name?: string;
    department?: string;
    year?: number;
    section?: string;
    gender?: string;
    designation?: string;
  }): Promise<User> {
    const res = await fetch(`${API_BASE_URL}/auth/users/`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = err.email?.[0] || err.mobile_number?.[0] || err.detail || err.error || 'Failed to add user account';
      throw new Error(msg);
    }
    return await res.json();
  },

  async updateUser(userId: number, payload: Partial<{
    full_name: string;
    email: string | null;
    role: string;
    college_id: string;
    mobile_number: string;
    status: string;
    class_name: string;
    department: string;
    year: number;
    section: string;
    gender: string;
    designation: string;
  }>): Promise<User> {
    const res = await fetch(`${API_BASE_URL}/auth/users/${userId}/`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = err.email?.[0] || err.detail || err.error || 'Failed to update user account';
      throw new Error(msg);
    }
    return await res.json();
  },

  async deleteUser(userId: number): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE_URL}/auth/users/${userId}/`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to delete user account');
    }
    return await res.json();
  },

  async rejectUser(userId: number, reason?: string): Promise<User> {
    return this.toggleUserStatus(userId, 'INACTIVE');
  },

  // ==================== EXCEL IMPORT, EXPORT & CLASS HUB ====================

  async previewExcelImport(formData: FormData): Promise<any> {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/auth/excel/preview/`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.error || 'Failed to parse and validate Excel file');
    }
    return await res.json();
  },

  async confirmExcelImport(payload: {
    file_name: string;
    role: string;
    target_class?: string;
    rows: any[];
  }): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/auth/excel/confirm/`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.error || 'Failed to complete Excel import');
    }
    return await res.json();
  },

  async downloadExcelTemplate(role: 'STUDENT' | 'FACULTY' = 'STUDENT'): Promise<Blob> {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/auth/excel/template/?role=${role}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!res.ok) {
      throw new Error('Failed to download template file');
    }
    return await res.blob();
  },

  async exportClassExcel(className?: string, department?: string): Promise<Blob> {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();
    if (className && className !== 'ALL') params.append('class_name', className);
    if (department && department !== 'ALL') params.append('department', department);

    const res = await fetch(`${API_BASE_URL}/auth/excel/export/?${params.toString()}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!res.ok) {
      throw new Error('Failed to export class roster');
    }
    return await res.blob();
  },

  async getClassesList(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/classes/`, { headers: authHeaders() });
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  async getImportAudits(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/excel/audits/`, { headers: authHeaders() });
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
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

  async createProduct(productData: Partial<Product> | FormData): Promise<Product> {
    const isFormData = productData instanceof FormData;
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (!isFormData) headers['Content-Type'] = 'application/json';

    const res = await fetch(`${API_BASE_URL}/products/`, {
      method: 'POST',
      headers,
      body: isFormData ? productData : JSON.stringify(productData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.detail || 'Failed to create food product');
    }
    return await res.json();
  },

  async updateProduct(id: number, productData: Partial<Product> | FormData): Promise<Product> {
    const isFormData = productData instanceof FormData;
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (!isFormData) headers['Content-Type'] = 'application/json';

    const res = await fetch(`${API_BASE_URL}/products/${id}/`, {
      method: 'PATCH',
      headers,
      body: isFormData ? productData : JSON.stringify(productData)
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
  },

  async chatWithAssistant(prompt: string, history?: any[]): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/assistant/chat/`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ prompt, history: history || [] })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.text || 'Assistant failed to process prompt.');
    }
    return await res.json();
  },

  async confirmAssistantAction(previewData: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/assistant/confirm-action/`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ action_preview: previewData })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.detail || 'Failed to execute confirmed assistant action.');
    }
    return await res.json();
  },

  async getAssistantAuditLogs(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/assistant/audit-logs/`, { headers: authHeaders() });
      if (!res.ok) return [];
      return await res.json();
    } catch (e) {
      return [];
    }
  },

  async downloadPdfReport(reportType: string = 'DAILY_SALES', rangeType: string = 'today'): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/reports/generate-pdf/`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ report_type: reportType, range_type: rangeType })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to download PDF report.');
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SAEC_CAFE_${reportType}_${Date.now()}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  async getRealtimeQueueSync(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/orders/realtime/`, { headers: authHeaders() });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      return null;
    }
  }
};

