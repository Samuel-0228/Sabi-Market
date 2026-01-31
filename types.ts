
export type Role = 'student' | 'admin';
export type ListingCategory = 'goods' | 'tutoring' | 'digital' | 'services';
export type OrderStatus = 'pending' | 'paid' | 'delivered' | 'completed' | 'disputed' | 'cancelled';

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
  created_at: string;
  seller_name?: string;
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

export interface Review {
  id: string;
  order_id: string;
  buyer_id: string;
  seller_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface Dispute {
  id: string;
  order_id: string;
  reason: string;
  status: 'open' | 'resolved';
  created_at: string;
}

export interface Translation {
  [key: string]: {
    en: string;
    am: string;
  };
}
