
export type Role = 'student' | 'admin';
export type ListingCategory = 'course' | 'academic_materials' | 'goods' | 'food';
// Updated OrderStatus to include all possible states used across components and pages
export type OrderStatus = 'pending' | 'accepted' | 'shipped' | 'paid' | 'delivered' | 'completed' | 'disputed' | 'cancelled';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  is_verified: boolean;
  preferences?: string[];
  avatar_url?: string;
  student_id_url?: string;
  created_at: string;
}

export interface Listing {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price: number;
  category: ListingCategory;
  image_url: string;
  stock: number;
  status: 'active' | 'sold_out' | 'archived';
  contact_phone?: string;
  created_at: string;
  seller_name?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  last_message?: string;
  created_at: string;
}

export interface Order {
  id: string;
  buyer_id: string;
  seller_id: string;
  listing_id: string;
  amount: number;
  commission: number;
  status: OrderStatus;
  delivery_info: string;
  created_at: string;
  listing_title?: string;
}

// Added OrderItem interface to support individual item tracking within orders
export interface OrderItem {
  id: string;
  order_id: string;
  seller_id: string;
  product_id: string;
  product_title: string;
  price: number;
  quantity: number;
  status: OrderStatus;
  created_at: string;
  buyer_name?: string;
  seller_name?: string;
  image_url?: string;
  delivery_info?: string;
}

export interface Translation {
  [key: string]: {
    en: string;
    am: string;
  };
}
