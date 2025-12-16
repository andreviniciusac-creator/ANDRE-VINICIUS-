import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Setup } from './pages/Setup';
import { Dashboard } from './pages/Dashboard';
import { POS } from './pages/POS';
import { Inventory } from './pages/Inventory';
import { Users } from './pages/Users';
import { Reports } from './pages/Reports';
import { AuditPanel } from './pages/AuditPanel';
import { storageService } from './services/storage.ts';
import { User, UserRole, Product, Sale } from './types';

function App() {
  const [isSystemInitialized, setIsSystemInitialized] = useState<boolean | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState('login');
  
  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  // Initialize Check
  useEffect(() => {
    checkInitialization();
  }, []);

  const checkInitialization = () => {
    const hasUsers = storageService.hasUsers();
    setIsSystemInitialized(hasUsers);

    if (hasUsers) {
      const currentUser = storageService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        // Default landing page logic
        if (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.OWNER) {
          setCurrentPage('dashboard');
        } else if (currentUser.role === UserRole.AUDITOR) {
          setCurrentPage('audit');
        } else {
          setCurrentPage('pos');
        }
        refreshData();
      }
    }
  };

  const refreshData = () => {
    setProducts(storageService.getProducts());
    setUsers(storageService.getUsers());
    setSales(storageService.getSales());
  };

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    if (loggedInUser.role === UserRole.ADMIN || loggedInUser.role === UserRole.OWNER) {
      setCurrentPage('dashboard');
    } else if (loggedInUser.role === UserRole.AUDITOR) {
      setCurrentPage('audit');
    } else {
      setCurrentPage('pos');
    }
    refreshData();
  };

  const handleUserUpdate = (updatedUser: User) => {
    setUser(updatedUser);
    refreshData();
  };

  const handleLogout = () => {
    storageService.logout();
    setUser(null);
    setCurrentPage('login');
  };

  const handleSetupComplete = () => {
    setIsSystemInitialized(true);
    // After setup, user must login with the credentials they just created
    setCurrentPage('login');
  };

  // 1. Loading State
  if (isSystemInitialized === null) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">Carregando sistema...</div>;
  }

  // 2. Setup Screen (First Run)
  if (!isSystemInitialized) {
    return <Setup onComplete={handleSetupComplete} />;
  }

  // 3. Login Screen
  if (!user || currentPage === 'login') {
    return <Login onLogin={handleLogin} />;
  }

  // 4. Main App Routing
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (user.role === UserRole.ADMIN || user.role === UserRole.OWNER || user.role === UserRole.AUDITOR) ? (
          <Dashboard sales={sales} products={products} users={users} />
        ) : <POS products={products} currentUser={user} onSaleComplete={refreshData} />;
      
      case 'pos':
        return <POS products={products} currentUser={user} onSaleComplete={refreshData} />;
      
      case 'products':
        return <Inventory products={products} currentUser={user} onUpdate={refreshData} />;
      
      case 'users':
        return (user.role === UserRole.ADMIN || user.role === UserRole.OWNER || user.role === UserRole.AUDITOR) ? (
          <Users users={users} currentUser={user} onUpdate={refreshData} />
        ) : <div className="p-8 text-center text-gray-500">Acesso restrito.</div>;
      
      case 'reports':
        return <Reports sales={sales} currentUser={user} />;
      
      case 'audit':
        return <AuditPanel currentUser={user} />;
      
      default:
        return <Dashboard sales={sales} products={products} users={users} />;
    }
  };

  return (
    <Layout 
      user={user} 
      onLogout={handleLogout} 
      currentPage={currentPage} 
      onNavigate={setCurrentPage}
      onUserUpdate={handleUserUpdate}
    >
      {renderPage()}
    </Layout>
  );
}

export default App;