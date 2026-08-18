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

export interface DemandForecast {
  product_id: number;
  product_name: string;
  category: string;
  current_stock: number;
  total_historical_sold: number;
  predicted_demand_next_day: number;
  recommended_reorder_qty: number;
  stock_status: string;
}
