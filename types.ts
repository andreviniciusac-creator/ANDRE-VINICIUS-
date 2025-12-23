export enum UserRole {
  OWNER = 'OWNER',     // Proprietária (Kethellem)
  AUDITOR = 'AUDITOR', // Auditor (André)
  ADMIN = 'ADMIN',     // Gerente/Admin
  SELLER = 'SELLER'    // Vendedor
}

export type UserStatus = 'Ativo' | 'Férias' | 'Doente' | 'Vendas Externas';

export type PaymentMethod = 'DINHEIRO' | 'PIX' | 'CARTAO' | 'CREDITO_LOJA' | 'OUTRO';

export type ServiceCategory = 'VIDEOMAKER' | 'MANUTENCAO' | 'MARKETING' | 'OUTROS';

export type PCPTaskCategory = 'LOGISTICA' | 'CONFERENCIA' | 'MANUTENCAO' | 'PRODUCAO' | 'MARKETING' | 'EVENTO' | 'OUTROS';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarSeed: string;
  password?: string;
  status?: UserStatus;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  cpf: string; // CPF para unicidade
  email?: string;
  birthday?: string; // YYYY-MM-DD
  totalSpent: number;
  lastPurchase?: string;
  createdAt: string;
  registeredBy: string; // Nome do usuário que cadastrou
}

export interface Product {
  id: string;
  styleCode: string; // SKU principal para agrupar grades
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

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  priceAtSale: number;
  size?: string;
  color?: string;
}

export interface Sale {
  id: string;
  date: string;
  sellerId: string;
  sellerName: string;
  customerId?: string;
  customerName?: string;
  items: SaleItem[];
  total: number;
  paymentMethod: PaymentMethod;
  paymentDetails?: string;
  exchangeCreditUsed?: number;
}

export interface ExchangeRecord {
  id: string;
  date: string;
  originalSaleId: string;
  customerName: string;
  returnedItems: SaleItem[];
  creditAmount: number;
  status: 'DISPONIVEL' | 'UTILIZADO';
  usedInSaleId?: string;
}

export interface StoreGoal {
  month: number;
  year: number;
  target: number;
}

export interface CartItem extends Product {
  quantity: number;
  originalPrice: number;
  priceNote?: string;
}

export interface CashAdjustment {
  id: string;
  date: string;
  type: 'SOBRA' | 'FALTA';
  amount: number;
  justification: string;
  performedBy: string;
}

export interface ServiceOrder {
  id: string;
  date: string;
  category: ServiceCategory;
  providerName: string;
  description: string;
  amount: number;
  status: 'PAGO' | 'PENDENTE';
  performedBy: string;
}

export interface Purchase {
  id: string;
  date: string;
  supplierName: string;
  cnpj: string;
  totalValue: number;
  invoiceNumber: string;
  xmlKey: string;
  importedAt: string;
}

export interface PCPTask {
  id: string;
  dayOfWeek: number;
  title: string;
  description: string;
  category: PCPTaskCategory;
  completed: boolean;
  time?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  description: string;
  performedBy: string;
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
  totalGifts: number;
  salesCount: number;
  giftsCount: number;
  attendancesCount: number;
  adjustmentsTotal: number;
  paymentBreakdown: Record<PaymentMethod, number>;
}

export interface Attendance {
  id: string;
  date: string;
  sellerId: string;
  sellerName: string;
  wasSale: boolean;
}

export interface LoginSession {
  id: string;
  userId: string;
  userName: string;
  role: UserRole;
  loginTime: string;
}