
import { User, UserRole, Product, Sale, AuditLog, Gift, DailyClosure, LoginSession, CashAdjustment, Attendance, ServiceOrder, ServiceCategory, PCPTask, Purchase, Customer, StoreGoal, ExchangeRecord } from '../types';

const KEYS = {
  USERS: 'chic_users',
  PRODUCTS: 'chic_products',
  SALES: 'chic_sales',
  CUSTOMERS: 'chic_customers',
  GOALS: 'chic_goals',
  EXCHANGES: 'chic_exchanges',
  SESSION: 'chic_session',
  AUDIT: 'chic_audit',
  GIFTS: 'chic_gifts',
  CLOSURES: 'chic_closures',
  LOGIN_LOGS: 'chic_login_logs',
  ADJUSTMENTS: 'chic_adjustments',
  ATTENDANCES: 'chic_attendances',
  SERVICE_ORDERS: 'chic_service_orders',
  PCP: 'chic_pcp_tasks',
  PURCHASES: 'chic_purchases'
};

const INITIAL_USERS: User[] = [
  { id: 'owner', name: 'Kethellem (Proprietária)', email: 'dona@loja.com', role: UserRole.OWNER, avatarSeed: 'Kethellem', password: 'admin123', status: 'Ativo' },
  { id: 's1', name: 'Ana Silva', email: 'ana@loja.com', role: UserRole.SELLER, avatarSeed: 'Ana', password: '123', status: 'Ativo' }
];

export const storageService = {
  // Customers
  getCustomers: (): Customer[] => JSON.parse(localStorage.getItem(KEYS.CUSTOMERS) || '[]'),
  saveCustomer: (customer: Customer) => {
    const customers = storageService.getCustomers();
    const duplicate = customers.find(c => c.cpf === customer.cpf && c.id !== customer.id);
    if (duplicate) throw new Error(`Já existe um cliente cadastrado com este CPF (${customer.cpf})`);
    const index = customers.findIndex(c => c.id === customer.id);
    if (index >= 0) customers[index] = customer;
    else customers.push(customer);
    localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(customers));
  },
  deleteCustomer: (id: string, performedBy: string) => {
    const customers = storageService.getCustomers();
    const customer = customers.find(c => c.id === id);
    if (customer) {
      localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(customers.filter(c => c.id !== id)));
      storageService.addAuditLog({
        id: `audit-${Date.now()}`,
        action: 'CLIENTE_EXCLUÍDO',
        description: `Exclusão da cliente ${customer.name} (CPF: ${customer.cpf})`,
        performedBy,
        timestamp: new Date().toISOString()
      });
    }
  },

  // Sales & Gifts
  getSales: (): Sale[] => JSON.parse(localStorage.getItem(KEYS.SALES) || '[]'),
  createSale: (sale: Sale) => {
    const sales = storageService.getSales();
    sales.push(sale);
    localStorage.setItem(KEYS.SALES, JSON.stringify(sales));
    
    // Baixa estoque
    const products = storageService.getProducts();
    sale.items.forEach(item => {
      const pIdx = products.findIndex(p => p.id === item.productId);
      if (pIdx >= 0) products[pIdx].stock -= item.quantity;
    });
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));

    if (sale.customerId) {
      const customers = storageService.getCustomers();
      const cIdx = customers.findIndex(c => c.id === sale.customerId);
      if (cIdx >= 0) {
        customers[cIdx].totalSpent += sale.total;
        customers[cIdx].lastPurchase = sale.date;
        localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(customers));
      }
    }
  },

  createGift: (gift: Gift) => {
    const gifts = JSON.parse(localStorage.getItem(KEYS.GIFTS) || '[]');
    gifts.push(gift);
    localStorage.setItem(KEYS.GIFTS, JSON.stringify(gifts));

    // Baixa estoque mesmo sendo brinde/parceria (Evita furo)
    const products = storageService.getProducts();
    gift.items.forEach(item => {
      // FIX: Changed item.productId to item.id as CartItem extends Product which has 'id', not 'productId'
      const pIdx = products.findIndex(p => p.id === item.id);
      if (pIdx >= 0) products[pIdx].stock -= item.quantity;
    });
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));

    storageService.addAuditLog({
      id: `gift-${Date.now()}`,
      action: 'PARCERIA_REGISTRADA',
      description: `Retirada de ${gift.items.length} itens por ${gift.influencerName} (Valor: R$ ${gift.totalValue.toFixed(2)})`,
      performedBy: gift.authorizedBy,
      timestamp: gift.date
    });
  },

  // Exchanges
  getExchanges: (): ExchangeRecord[] => JSON.parse(localStorage.getItem(KEYS.EXCHANGES) || '[]'),
  createExchange: (exchange: ExchangeRecord) => {
    const exchanges = storageService.getExchanges();
    exchanges.push(exchange);
    localStorage.setItem(KEYS.EXCHANGES, JSON.stringify(exchanges));
    const products = storageService.getProducts();
    exchange.returnedItems.forEach(item => {
      const pIdx = products.findIndex(p => p.id === item.productId);
      if (pIdx >= 0) products[pIdx].stock += item.quantity;
    });
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
    storageService.addAuditLog({
      id: `ex-${Date.now()}`,
      action: 'TROCA_REALIZADA',
      description: `Crédito de R$ ${exchange.creditAmount.toFixed(2)} gerado para ${exchange.customerName}`,
      performedBy: storageService.getCurrentUser()?.name || 'Sistema',
      timestamp: exchange.date
    });
  },

  // Auth & Misc
  getUsers: (): User[] => JSON.parse(localStorage.getItem(KEYS.USERS) || JSON.stringify(INITIAL_USERS)),
  hasUsers: (): boolean => storageService.getUsers().length > 0,
  saveUser: (user: User) => {
    const users = storageService.getUsers();
    users.push(user);
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
  },
  // FIX: Added missing deleteUser method for pages/Users.tsx
  deleteUser: (id: string, performedBy: string) => {
    const users = storageService.getUsers();
    const user = users.find(u => u.id === id);
    if (user) {
      localStorage.setItem(KEYS.USERS, JSON.stringify(users.filter(u => u.id !== id)));
      storageService.addAuditLog({
        id: `audit-user-${Date.now()}`,
        action: 'USUÁRIO_EXCLUÍDO',
        description: `Exclusão do usuário ${user.name} (${user.role}) - Motivo/Por: ${performedBy}`,
        performedBy: storageService.getCurrentUser()?.name || 'Sistema',
        timestamp: new Date().toISOString()
      });
    }
  },
  getCurrentUser: (): User | null => JSON.parse(localStorage.getItem(KEYS.SESSION) || 'null'),
  login: async (email: string, password: string): Promise<User | null> => {
    const user = storageService.getUsers().find(u => u.email === email && u.password === password);
    if (user) {
      localStorage.setItem(KEYS.SESSION, JSON.stringify(user));
      const logs = storageService.getLoginLogs();
      logs.unshift({ id: Date.now().toString(), userId: user.id, userName: user.name, role: user.role, loginTime: new Date().toISOString() });
      localStorage.setItem(KEYS.LOGIN_LOGS, JSON.stringify(logs.slice(0, 100)));
      return user;
    }
    return null;
  },
  logout: () => localStorage.removeItem(KEYS.SESSION),
  getLoginLogs: (): LoginSession[] => JSON.parse(localStorage.getItem(KEYS.LOGIN_LOGS) || '[]'),
  getAuditLogs: (): AuditLog[] => JSON.parse(localStorage.getItem(KEYS.AUDIT) || '[]'),
  addAuditLog: (log: AuditLog) => {
    const logs = storageService.getAuditLogs();
    logs.unshift(log);
    localStorage.setItem(KEYS.AUDIT, JSON.stringify(logs));
  },
  getGoals: (): StoreGoal[] => JSON.parse(localStorage.getItem(KEYS.GOALS) || '[]'),
  saveGoal: (goal: StoreGoal) => {
    const goals = storageService.getGoals();
    const index = goals.findIndex(g => g.month === goal.month && g.year === goal.year);
    if (index >= 0) goals[index] = goal; else goals.push(goal);
    localStorage.setItem(KEYS.GOALS, JSON.stringify(goals));
  },
  getCurrentMonthGoal: (): number => {
    const goals = storageService.getGoals();
    const now = new Date();
    const goal = goals.find(g => g.month === now.getMonth() && g.year === now.getFullYear());
    return goal ? goal.target : 50000;
  },
  getProducts: (): Product[] => JSON.parse(localStorage.getItem(KEYS.PRODUCTS) || '[]'),
  saveProduct: (p: Product) => {
    const products = storageService.getProducts();
    const idx = products.findIndex(item => item.id === p.id);
    if (idx >= 0) products[idx] = p; else products.push(p);
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
  },
  // FIX: Added missing saveProductGrid method for pages/Inventory.tsx
  saveProductGrid: (baseData: any, variants: { size: string, color: string, stock: number }[]) => {
    const products = storageService.getProducts();
    variants.forEach(variant => {
      const id = `${baseData.styleCode}-${variant.size}`;
      const existingIdx = products.findIndex(p => p.id === id);
      const product: Product = {
        id,
        styleCode: baseData.styleCode,
        name: baseData.name,
        category: baseData.category,
        price: baseData.price,
        cost: baseData.cost,
        stock: variant.stock,
        size: variant.size,
        color: variant.color,
        description: baseData.description,
        imageUrl: baseData.imageUrl
      };
      if (existingIdx >= 0) products[existingIdx] = product;
      else products.push(product);
    });
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
  },
  deleteProduct: (id: string) => {
    const products = storageService.getProducts();
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products.filter(p => p.id !== id)));
  },
  updateUser: (u: User) => {
    const users = storageService.getUsers();
    const idx = users.findIndex(item => item.id === u.id);
    if (idx >= 0) users[idx] = u;
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
  },
  verifyOwnerPassword: (password: string): boolean => {
    const users = storageService.getUsers();
    const owner = users.find(u => u.role === UserRole.OWNER);
    return owner?.password === password;
  },
  verifyAuditorPassword: (password: string): boolean => {
    const users = storageService.getUsers();
    const auditor = users.find(u => u.role === UserRole.AUDITOR);
    return auditor?.password === password;
  },
  getClosures: (): DailyClosure[] => JSON.parse(localStorage.getItem(KEYS.CLOSURES) || '[]'),
  getAdjustments: (): CashAdjustment[] => JSON.parse(localStorage.getItem(KEYS.ADJUSTMENTS) || '[]'),
  getServiceOrders: (): ServiceOrder[] => JSON.parse(localStorage.getItem(KEYS.SERVICE_ORDERS) || '[]'),
  saveServiceOrder: (o: ServiceOrder) => {
    const orders = storageService.getServiceOrders();
    orders.push(o);
    localStorage.setItem(KEYS.SERVICE_ORDERS, JSON.stringify(orders));
  },
  deleteServiceOrder: (id: string) => {
    const orders = storageService.getServiceOrders();
    localStorage.setItem(KEYS.SERVICE_ORDERS, JSON.stringify(orders.filter(o => o.id !== id)));
  },
  getPCPTasks: (): PCPTask[] => JSON.parse(localStorage.getItem(KEYS.PCP) || '[]'),
  savePCPTask: (t: PCPTask) => {
    const tasks = storageService.getPCPTasks();
    const idx = tasks.findIndex(item => item.id === t.id);
    if (idx >= 0) tasks[idx] = t; else tasks.push(t);
    localStorage.setItem(KEYS.PCP, JSON.stringify(tasks));
  },
  deletePCPTask: (id: string) => {
    const tasks = storageService.getPCPTasks();
    localStorage.setItem(KEYS.PCP, JSON.stringify(tasks.filter(t => t.id !== id)));
  },
  getPurchases: (): Purchase[] => JSON.parse(localStorage.getItem(KEYS.PURCHASES) || '[]'),
  savePurchase: (p: Purchase) => {
    const purchases = storageService.getPurchases();
    purchases.push(p);
    localStorage.setItem(KEYS.PURCHASES, JSON.stringify(purchases));
  }
};
