import { User, UserRole, Product, Sale, AuditLog, Gift, DailyClosure, LoginSession, CashAdjustment } from '../types';

// Production: Start with empty users
const INITIAL_USERS: User[] = [];

// Keep some example products or start empty? Let's keep a few examples to help the user understand the layout, 
// or you can set this to [] for a completely empty store.
const INITIAL_PRODUCTS: Product[] = [
  { id: '101', name: 'Vestido Exemplo', category: 'Vestidos', price: 159.90, cost: 80.00, stock: 10, size: 'M', color: 'Rosa', description: 'Produto de exemplo.' },
];

const KEYS = {
  USERS: 'chic_users',
  PRODUCTS: 'chic_products',
  SALES: 'chic_sales',
  SESSION: 'chic_session',
  AUDIT: 'chic_audit',
  GIFTS: 'chic_gifts',
  CLOSURES: 'chic_closures',
  LOGIN_LOGS: 'chic_login_logs',
  ADJUSTMENTS: 'chic_adjustments'
};

// Helper to simulate delay
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const storageService = {
  // Setup Check
  hasUsers: (): boolean => {
    const users = storageService.getUsers();
    return users.length > 0;
  },

  // Auth
  login: async (email: string, password: string): Promise<User | null> => {
    await delay(800); // Slightly longer delay for security feel
    const users = storageService.getUsers();
    // Case insensitive email check
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    
    if (user) {
      // Ensure status is set if missing (migration)
      if (!user.status) user.status = 'Ativo';
      
      localStorage.setItem(KEYS.SESSION, JSON.stringify(user));
      storageService.recordLogin(user);
      return user;
    }
    return null;
  },

  logout: () => {
    localStorage.removeItem(KEYS.SESSION);
  },

  getCurrentUser: (): User | null => {
    const session = localStorage.getItem(KEYS.SESSION);
    return session ? JSON.parse(session) : null;
  },

  // Login Logging (Ponto Eletrônico)
  recordLogin: (user: User) => {
    const logs: LoginSession[] = JSON.parse(localStorage.getItem(KEYS.LOGIN_LOGS) || '[]');
    const newLog: LoginSession = {
      id: Date.now().toString(),
      userId: user.id,
      userName: user.name,
      role: user.role,
      loginTime: new Date().toISOString()
    };
    logs.unshift(newLog);
    localStorage.setItem(KEYS.LOGIN_LOGS, JSON.stringify(logs));
  },

  getLoginLogs: (): LoginSession[] => {
    return JSON.parse(localStorage.getItem(KEYS.LOGIN_LOGS) || '[]');
  },

  // Users
  getUsers: (): User[] => {
    const stored = localStorage.getItem(KEYS.USERS);
    // Return stored users OR empty array (do not load mocks automatically anymore)
    return stored ? JSON.parse(stored) : [];
  },

  saveUser: (user: User) => {
    const users = storageService.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index >= 0) {
      users[index] = { ...users[index], ...user };
    } else {
      if (!user.status) user.status = 'Ativo';
      users.push(user);
    }
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
  },

  updateUser: (user: User) => {
    const users = storageService.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index >= 0) {
      users[index] = user;
      localStorage.setItem(KEYS.USERS, JSON.stringify(users));
      
      const currentUser = storageService.getCurrentUser();
      if (currentUser && currentUser.id === user.id) {
        localStorage.setItem(KEYS.SESSION, JSON.stringify(user));
      }
    }
  },

  deleteUser: (id: string, performedBy: string) => {
    const users = storageService.getUsers();
    const userToDelete = users.find(u => u.id === id);
    
    if (userToDelete) {
      const remainingUsers = users.filter(u => u.id !== id);
      localStorage.setItem(KEYS.USERS, JSON.stringify(remainingUsers));
      
      storageService.addAuditLog({
        id: Date.now().toString(),
        action: 'USUARIO_EXCLUIDO',
        description: `Usuário ${userToDelete.name} (${userToDelete.role}) foi excluído.`,
        performedBy: performedBy,
        timestamp: new Date().toISOString()
      });
    }
  },

  verifyOwnerPassword: (password: string): boolean => {
    const users = storageService.getUsers();
    const owner = users.find(u => u.role === UserRole.OWNER);
    return owner ? owner.password === password : false;
  },

  verifyAuditorPassword: (password: string): boolean => {
    const users = storageService.getUsers();
    const auditor = users.find(u => u.role === UserRole.AUDITOR);
    return auditor ? auditor.password === password : false;
  },

  // Audit Logs
  getAuditLogs: (): AuditLog[] => {
    const stored = localStorage.getItem(KEYS.AUDIT);
    return stored ? JSON.parse(stored) : [];
  },

  addAuditLog: (log: AuditLog) => {
    const logs = storageService.getAuditLogs();
    logs.unshift(log); 
    localStorage.setItem(KEYS.AUDIT, JSON.stringify(logs));
  },

  // Products
  getProducts: (): Product[] => {
    const stored = localStorage.getItem(KEYS.PRODUCTS);
    if (!stored) {
      // Load initial example products only if completely empty
      localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    }
    return JSON.parse(stored);
  },

  saveProduct: (product: Product) => {
    const products = storageService.getProducts();
    const index = products.findIndex(p => p.id === product.id);
    if (index >= 0) {
      products[index] = product;
    } else {
      products.push(product);
    }
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
  },

  deleteProduct: (id: string) => {
    const products = storageService.getProducts().filter(p => p.id !== id);
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
  },

  updateStock: (productId: string, quantitySold: number) => {
    const products = storageService.getProducts();
    const product = products.find(p => p.id === productId);
    if (product) {
      product.stock = Math.max(0, product.stock - quantitySold);
      localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
    }
  },

  // Sales
  getSales: (): Sale[] => {
    const stored = localStorage.getItem(KEYS.SALES);
    return stored ? JSON.parse(stored) : [];
  },

  createSale: (sale: Sale) => {
    const sales = storageService.getSales();
    sales.push(sale);
    localStorage.setItem(KEYS.SALES, JSON.stringify(sales));
    
    sale.items.forEach(item => {
      storageService.updateStock(item.productId, item.quantity);
    });
  },

  // Cash Adjustments (Furos/Sobras)
  getAdjustments: (): CashAdjustment[] => {
    const stored = localStorage.getItem(KEYS.ADJUSTMENTS);
    return stored ? JSON.parse(stored) : [];
  },

  createAdjustment: (adjustment: CashAdjustment) => {
    const items = storageService.getAdjustments();
    items.push(adjustment);
    localStorage.setItem(KEYS.ADJUSTMENTS, JSON.stringify(items));
  },

  // Gifts
  getGifts: (): Gift[] => {
    const stored = localStorage.getItem(KEYS.GIFTS);
    return stored ? JSON.parse(stored) : [];
  },

  createGift: (gift: Gift) => {
    const gifts = storageService.getGifts();
    gifts.push(gift);
    localStorage.setItem(KEYS.GIFTS, JSON.stringify(gifts));

    gift.items.forEach(item => {
      storageService.updateStock(item.id, item.quantity);
    });
  },

  // Closures
  getClosures: (): DailyClosure[] => {
    const stored = localStorage.getItem(KEYS.CLOSURES);
    return stored ? JSON.parse(stored) : [];
  },

  createClosure: (closure: DailyClosure) => {
    const closures = storageService.getClosures();
    closures.push(closure);
    localStorage.setItem(KEYS.CLOSURES, JSON.stringify(closures));
  }
};