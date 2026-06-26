export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

export interface MenuItemType {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  isVeg: boolean;
  isAvailable: boolean;
  displayOrder: number;
}

export interface OrderType {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  total: number;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  stripePaymentIntentId?: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItemType[];
}

export interface OrderItemType {
  id: string;
  menuItemId: string;
  quantity: number;
  price: number;
  menuItem?: MenuItemType;
}
