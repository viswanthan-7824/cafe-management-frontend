export type UserRole = 'ADMIN' | 'CASHIER' | 'STUDENT' | 'FACULTY';
export type UserAccountStatus = 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'REJECTED';

export interface User {
  id: number;
  email: string | null;
  full_name: string;
  college_id?: string;
  mobile_number: string;
  role: UserRole;
  status: UserAccountStatus;
  must_change_password: boolean;
  password_created?: boolean;
  email_verified?: boolean;
  is_active: boolean;
  is_demo?: boolean;
  is_email_linked?: boolean;
  class_name?: string;
  department?: string;
  year?: number | null;
  section?: string;
  google_sub?: string | null;
  created_at: string;
  last_login?: string | null;
  activated_at?: string | null;
  activated_by?: number | null;
  activated_by_name?: string | null;
  rejection_reason?: string;
  student_profile?: {
    register_number: string;
    class_name?: string;
    department: string;
    year: number;
    section?: string;
    gender?: string;
    academic_year?: string;
  };
  faculty_profile?: {
    staff_number: string;
    department: string;
    designation?: string;
    class_assigned?: string;
  };
}

export interface UserStats {
  total_users: number;
  total_students?: number;
  total_faculty?: number;
  pending_users: number;
  active_users: number;
  inactive_users: number;
  email_linked_students?: number;
  email_missing_students?: number;
  classes_count?: number;
  rejected_users?: number;
}

export interface ExcelPreviewRow {
  row_index: number;
  name: string;
  register_number: string;
  class_name: string;
  phone: string;
  email: string;
  has_email: boolean;
  department: string;
  year: number;
  section: string;
  gender: string;
  academic_year: string;
  status: 'VALID' | 'UPDATE' | 'ERROR';
  status_message: string;
  errors: string[];
  warnings: string[];
}

export interface ExcelPreviewResult {
  total_rows: number;
  valid_count: number;
  update_count: number;
  error_count: number;
  has_errors: boolean;
  role: 'STUDENT' | 'FACULTY';
  default_class: string;
  file_name: string;
  rows: ExcelPreviewRow[];
}

export interface ExcelImportResult {
  audit_id?: number;
  total_rows: number;
  created_count: number;
  updated_count: number;
  failed_count: number;
  skipped_details: Array<{
    register_number: string;
    name: string;
    reason: string;
  }>;
}

export interface ClassSummary {
  class_name: string;
  department: string;
  year: number;
  total_students: number;
  email_linked_count: number;
  email_missing_count: number;
  percent_linked: number;
}

export interface UserImportAudit {
  id: number;
  created_at: string;
  admin_name: string;
  file_name: string;
  target_role: string;
  target_class: string;
  total_rows: number;
  created_count: number;
  updated_count: number;
  failed_count: number;
  details?: any;
}


export type FoodType = 'READY_FOOD' | 'MADE_TO_ORDER' | 'CONTACT_ORDER';
export type AvailabilityStatus = 'AVAILABLE' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'CONTACT_ORDER' | 'PRE_ORDER' | 'UNAVAILABLE';
export type TodayAvailability = 'AVAILABLE' | 'OUT_OF_STOCK' | 'NOT_AVAILABLE_TODAY';

export interface Category {
  id: number;
  name: string;
  description: string;
  icon_name: string;
  is_active?: boolean;
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
  image_url?: string;
  barcode?: string;
  sku?: string;
  unit: string;
  today_availability: TodayAvailability;
  display_order: number;
  food_type: FoodType;
  preparation_time: number;
  minimum_advance_time: number;
  current_stock: number;
  minimum_stock: number;
  maximum_stock: number;
  availability_status: AvailabilityStatus;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProductDashboardStats {
  total_products: number;
  available_products: number;
  out_of_stock: number;
  inactive_products: number;
  total_categories: number;
  products_added_today: number;
}

export type DayStatus = 'WORKING_DAY' | 'HOLIDAY' | 'CLOSED' | 'SPECIAL_WORKING_DAY' | 'NOT_SCHEDULED';

export interface BusinessDay {
  id?: number;
  date: string;
  day_name?: string;
  status: DayStatus;
  opening_time: string;
  closing_time: string;
  reason?: string;
  notes?: string;
  is_ordering_enabled: boolean;
  daily_order_sequence: number;
  updated_by_name?: string;
  updated_at?: string;
  created_at?: string;
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

export type PaymentStatus = 'PENDING' | 'PAID' | 'CANCELLED' | 'FAILED' | 'REFUNDED' | 'EXPIRED';

export interface Payment {
  id: number;
  order: number;
  order_number: string;
  customer_name?: string;
  amount: number;
  method: 'CASH' | 'QR_COUNTER' | 'UPI' | 'ONLINE';
  method_display?: string;
  status: PaymentStatus;
  status_display?: string;
  transaction_id?: string;
  counter_notes?: string;
  verified_by?: number;
  verified_by_name?: string;
  verified_at?: string;
  created_at: string;
  paid_at?: string;
}

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
  token_number?: number | string;
  business_day: number;
  user?: number;
  customer_name: string;
  customer_role: string;
  customer_type: string;
  order_source: 'MOBILE' | 'POS';
  order_type: FoodType;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method?: string;
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

export interface DemandForecastItem {
  product_id: number;
  product_name: string;
  category_name: string;
  image_url?: string;
  current_stock: number;
  avg_daily_sales: number;
  predicted_demand: number;
  expected_shortage: number;
  recommendation: string;
  confidence_score: number;
  status: 'OPTIMAL' | 'SHORTAGE' | 'CRITICAL';
}

