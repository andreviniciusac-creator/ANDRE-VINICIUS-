export enum UserRole {
  OWNER = 'OWNER',     // Proprietária (Kethellem)
  AUDITOR = 'AUDITOR', // Auditor (André)
  ADMIN = 'ADMIN',     // Gerente/Admin
  SELLER = 'SELLER'    // Vendedor
}

export type UserStatus = 'Ativo' | 'Férias' | 'Doente' | 'Vendas Externas';

export type PaymentMethod = 'DINHEIRO' | 'PIX' | 'CARTAO' | 'CREDITO_LOJA' | 'OUTRO';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarSeed: string; // For DiceBear avatar
  password?: string; // In a real app, never store plain text
  status?: UserStatus;
}

export interface LoginSession {
  id: string;
  userId: string;
  userName: string;
  role: UserRole;
  loginTime: string; // ISO String
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  size: string;
  color: string;
  description?: string;
  imageUrl?: string;
}

export interface CartItem extends Product {
  quantity: number;
  originalPrice: number; // To track if price was changed
  priceNote?: string; // Reason for price change
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  priceAtSale: number;
  note?: string;
}

export interface Sale {
  id: string;
  date: string; // ISO string
  sellerId: string;
  sellerName: string;
  items: SaleItem[];
  total: number;
  paymentMethod: PaymentMethod;
  paymentDetails?: string; // Ex: "Maquininha NuBank", "Pix Pedro Oliveira"
}

export interface CashAdjustment {
  id: string;
  date: string;
  type: 'SOBRA' | 'FALTA'; // Sobra (dinheiro a mais/entrada), Falta (dinheiro a menos/saída/perda)
  amount: number;
  justification: string;
  performedBy: string;
}

export interface AuditLog {
  id: string;
  action: string; // e.g., "USER_DELETED"
  description: string;
  performedBy: string; // Name of admin
  timestamp: string;
}

export interface Gift {
  id: string;
  date: string;
  influencerName: string;
  authorizedBy: string;
  items: CartItem[];
  totalValue: number;
}

export interface DailyClosure {
  id: string;
  date: string;
  closedBy: string;
  totalSales: number;
  totalGifts: number; // Value of items given away
  salesCount: number;
  giftsCount: number;
  adjustmentsTotal: number; // Net value of adjustments
  paymentBreakdown: Record<PaymentMethod, number>;
}