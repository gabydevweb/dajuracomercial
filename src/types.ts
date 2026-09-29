export type Product = {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  old_price: number | null;
  stock: number;
  image_url: string;
  active: boolean;
  featured: boolean;
  badge: string;
  sku: string;
};
export type Profile = {
  id: string;
  full_name: string;
  phone: string;
  role: "customer" | "admin";
  created_at: string;
};
export type OrderStatus =
  | "pending_payment"
  | "payment_review"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";
export type OrderItem = {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string;
};
export type Order = {
  id: string;
  number: number;
  user_id: string;
  customer_name: string;
  phone: string;
  address: string;
  notes: string;
  delivery_method: "pickup" | "delivery";
  total: number;
  shipping_fee: number;
  status: OrderStatus;
  items: OrderItem[];
  created_at: string;
  payment_confirmed_at: string | null;
  tracking: string | null;
  receipt_path: string | null;
  cancellation_reason: string | null;
};
export type Settings = {
  id: number;
  bank_name: string;
  bank_account: string;
  bank_holder: string;
  account_type: string;
  shipping_fee: number;
  delivery_enabled: boolean;
  payment_instructions: string;
};
export type CartItem = { product: Product; quantity: number };
