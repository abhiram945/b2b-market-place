export interface User {
  _id: string;
  fullName: string;
  email: string;
  companyName: string;
  role: 'buyer' | 'vendor' | 'admin';
  password: string;
  phoneNumber?: string;
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
  eta?: string;
}

export interface OrderItem {
  product: string | Product;
  productTitle: string;
  quantity: number;
  price: number;
  vendor: string | User;
}

export interface Order {
  _id: string;
  user: string | User;
  items: OrderItem[];
  totalPrice: number;
  orderDate: string;
  status: 'Pending' | 'Shipped' | 'Ready' | 'Delivered' | 'Completed' | 'Cancelled';
  invoiceUrl?: string;
}

export interface NotificationSubscription {
  _id: string;
  productId: string;
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