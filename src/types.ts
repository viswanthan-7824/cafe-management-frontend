export type UserRole = 'ADMIN' | 'CASHIER' | 'STUDENT' | 'FACULTY';

export interface User {
  id: number;
  email: string;
  full_name: string;
  mobile_number: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  student_profile?: { register_number: string; department: string; year: number };
  faculty_profile?: { staff_number: string; department: string };
}

export type FoodType = 'READY_FOOD' | 'MADE_TO_ORDER' | 'CONTACT_ORDER';
export type AvailabilityStatus = 'AVAILABLE' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'CONTACT_ORDER' | 'PRE_ORDER' | 'UNAVAILABLE';

export interface Category {
  id: number;
  name: string;
  description: string;
  icon_name: string;
  product_count?: number;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  category: number;
  category_name?: string;
  price: number;
  cost_price: number;
  image?: string;
  barcode?: string;
  sku?: string;
  food_type: FoodType;
  preparation_time: number;
  minimum_advance_time: number;
  current_stock: number;
  minimum_stock: number;
  maximum_stock: number;
  availability_status: AvailabilityStatus;
  is_active: boolean;
}

export type DayStatus = 'WORKING_DAY' | 'HOLIDAY' | 'CLOSED' | 'SPECIAL_WORKING_DAY' | 'NOT_SCHEDULED';

export interface BusinessDay {
  id?: number;
  date: string;
  status: DayStatus;
  opening_time: string;
  closing_time: string;
  reason?: string;
  notes?: string;
  is_ordering_enabled: boolean;
  daily_order_sequence: number;
}

export type OrderStatus =
  | 'REQUESTED'
  | 'AWAITING_APPROVAL'
  | 'AWAITING_PAYMENT'
  | 'PAYMENT_SUPPORT_REQUIRED'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'DELIVERED'
  | 'REJECTED'
  | 'CANCELLED';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'EXPIRED';

export interface OrderItem {
  id: number;
  product: number;
  product_name: string;
  unit_price: number;
  quantity: number;
  total_price: number;
}

export interface Order {
  id: number;
  order_number: string;
  business_day: number;
  user?: number;
  customer_name: string;
  customer_role: string;
  customer_type: string;
  order_source: 'MOBILE' | 'POS';
  order_type: FoodType;
  status: OrderStatus;
  payment_status: PaymentStatus;
  pickup_time?: string;
  created_at: string;
  confirmed_at?: string;
  completed_at?: string;
  subtotal: number;
  discount_amount: number;
  total_amount: number;
  notes?: string;
  items: OrderItem[];
}

export interface PaymentSupportTicket {
  id: number;
  ticket_number: string;
  order: number;
  order_number: string;
  user: number;
  user_name: string;
  user_mobile: string;
  amount: number;
  transaction_id: string;
  screenshot?: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED' | 'RESOLVED';
  admin_notes?: string;
  created_at: string;
}

export interface ContactOrderRequest {
  id: number;
  request_number: string;
  user: number;
  user_name: string;
  user_mobile: string;
  product: number;
  product_name: string;
  product_price: number;
  quantity: number;
  preferred_pickup_time: string;
  special_instructions?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  rejection_reason?: string;
  created_at: string;
}

export interface InventoryTransaction {
  id: number;
  product: number;
  product_name: string;
  transaction_type: 'STOCK_IN' | 'STOCK_OUT' | 'SALE' | 'ADJUSTMENT' | 'RETURN' | 'DAMAGE';
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reference_id?: string;
  notes?: string;
  created_by_name?: string;
  timestamp: string;
}

export interface CustomerIssue {
  id: number;
  order_code: string;
  category: string;
  description: string;
  status: 'PENDING' | 'RESOLVED' | 'REJECTED';
  admin_response?: string;
  created_at: string;
}

export interface SystemSettings {
  canteen_name: string;
  college_name: string;
  motto: string;
  operating_hours: string;
  app_ordering_window: string;
  tax_rate_percent: number;
  enable_special_orders: boolean;
  contact_email: string;
  contact_phone: string;
  enable_sound_alerts: boolean;
}

// PostgreSQL Data Analytics Types
export interface AnalyticsOverview {
  today_sales: number;
  today_orders: number;
  total_revenue: number;
  total_orders: number;
  completed_orders: number;
  pending_orders: number;
  cancelled_orders: number;
  average_order_value: number;
  total_products: number;
  available_products: number;
  unavailable_products: number;
  low_stock_count: number;
  out_of_stock_count: number;
  total_users: number;
  active_users: number;
  pending_support_tickets: number;
  customer_breakdown: Array<{
    customer_type: string;
    total_sales: number;
    count: number;
  }>;
}

export interface DailyTrendItem {
  date: string;
  full_date: string;
  orders: number;
  revenue: number;
}

export interface TopSellingProduct {
  product_id: number;
  product_name: string;
  category_name: string;
  quantity_sold: number;
  revenue: number;
}

export interface CategoryPerformanceItem {
  category_name: string;
  quantity_sold: number;
  revenue: number;
  orders_count: number;
  percentage: number;
}

export interface PaymentMethodDistributionItem {
  method: string;
  orders_count: number;
  revenue: number;
  percentage: number;
}

export interface OrderStatusDistributionItem {
  status: string;
  count: number;
  percentage: number;
}

export interface PeakHourItem {
  hour: number;
  label: string;
  orders: number;
  revenue: number;
}

export interface AnalyticsDashboardData {
  date_range: {
    range_type: string;
    start_date: string;
    end_date: string;
  };
  summary: {
    total_revenue: number;
    total_orders: number;
    paid_orders: number;
    average_order_value: number;
    completed_orders: number;
    pending_orders: number;
    cancelled_orders: number;
  };
  daily_trends: DailyTrendItem[];
  top_selling_products: TopSellingProduct[];
  category_performance: CategoryPerformanceItem[];
  payment_methods: PaymentMethodDistributionItem[];
  order_statuses: OrderStatusDistributionItem[];
  peak_hours: PeakHourItem[];
  customer_breakdown: Array<{
    customer_type: string;
    total_sales: number;
    count: number;
  }>;
}
