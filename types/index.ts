
export type Role = 'student' | 'admin';
export type ListingCategory = 'course' | 'academic_materials' | 'goods' | 'food';
export type OrderStatus = 'pending' | 'accepted' | 'shipped' | 'delivered' | 'completed' | 'cancelled' | 'disputed' | 'paid';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  is_verified: boolean;
  preferences?: string[];
  avatar_url?: string;
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
  created_at: string;
  last_message?: string;
  listing?: Partial<Listing>;
  seller?: Partial<UserProfile>;
  buyer?: Partial<UserProfile>;
}

export interface Order {
  id: string;
  buyer_id: string;
  seller_id: string;
  listing_id: string;
  amount: number;
  status: OrderStatus;
  delivery_info: string;
  created_at: string;
  product_title?: string;
  image_url?: string;
  seller_name?: string;
  buyer_name?: string;
}
