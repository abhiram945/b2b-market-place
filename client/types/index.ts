export interface User {
  _id: string;
  fullName: string;
  email: string;
  companyName: string;
  address?: string;
  roles: ('buyer' | 'vendor' | 'admin')[];
  activeRole: 'buyer' | 'vendor' | 'admin';
  roleRequest?: {
    requestedRole: 'buyer' | 'vendor';
    status: 'none' | 'pending' | 'approved' | 'rejected';
    requestDate?: string;
  };
  password: string;
  phoneNumber?: string;
  website?: string;
}

export interface Product {
  _id: string;
  title: string;
  brand: string;
  category: string;
  location: string;
  price: number;
  condition: string;
  minOrderQty: number;
  maxOrderQty: number;
  stockQty: number;
  isStockEnabled: boolean;
  eta?: number;
}

export interface OrderItem {
  product: string | Product;
  productTitle: string;
  quantity: number;
  price: number;
  vendor: string | User;
  vendorName?: string;
}

export interface Order {
  _id: string;
  user: string | User;
  items: OrderItem[];
  totalPrice: number;
  status: 'pending' | 'shipped' | 'ready' | 'delivered' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface NotificationSubscription {
  _id: string;
  product: string;
  productTitle: string;
  type: 'price' | 'stock';
  status: 'active' | 'inactive';
}

export interface CartItem extends Product {
  _id: string;
  quantity: number;
}

export interface ErrorResponse {
  message: string;
  statusCode?: number;
  errors?: Array<{ msg: string; param: string; location: string; }>; // For express-validator errors
}
