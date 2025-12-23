import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  Users, 
  LogOut, 
  Menu, 
  X,
  PieChart,
  ShieldCheck,
  Settings,
  Circle,
  MoreHorizontal,
  Wallet,
  CalendarDays,
  FileSpreadsheet,
  UserGroup
} from 'lucide-react';
import { User, UserRole, UserStatus } from '../types';
import { storageService } from '../services/storage.ts';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
  currentPage: string;
  onNavigate: (page: string) => void;
  onUserUpdate: (updatedUser: User) => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  user, 
  onLogout, 
  currentPage, 
  onNavigate,
  onUserUpdate
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  const [editForm, setEditForm] = useState({
    name: user.name,
    status: user.status || 'Ativo',
    newPassword: ''
  });

  const isAdmin = user.role === UserRole.ADMIN || user.role === UserRole.OWNER || user.role === UserRole.AUDITOR;
  const isAuditor = user.role === UserRole.AUDITOR;
  const isOwner = user.role === UserRole.OWNER;

  const menuItems = [
    ...(isAdmin ? [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }] : []),
    { id: 'pos', label: 'Caixa (PDV)', icon: ShoppingBag },
    { id: 'customers', label: 'Clientes', icon: Users },
    { id: 'products', label: 'Estoque', icon: Package },
    ...(isAdmin ? [{ id: 'pcp', label: 'Cronograma PCP', icon: CalendarDays }] : []),
    ...(isAdmin ? [{ id: 'financial', label: 'Financeiro', icon: Wallet }] : []),
    ...(isAdmin ? [{ id: 'accounting', label: 'Contabilidade', icon: FileSpreadsheet }] : []),
    ...(isAdmin ? [{ id: 'users', label: 'Usuários', icon: Users }] : []),
    { id: 'reports', label: 'Relatórios', icon: PieChart },
    ...(isAuditor ? [{ id: 'audit', label: 'Auditoria', icon: ShieldCheck }] : []),
  ];

  const mobileNavItems = [
    isAdmin 
      ? { id: 'dashboard', label: 'Início', icon: LayoutDashboard }
      : { id: 'pos', label: 'Vender', icon: ShoppingBag },
    { id: 'customers', label: 'Clientes', icon: Users },
    { id: 'reports', label: 'Relatórios', icon: PieChart },
    { id: 'menu', label: 'Menu', icon: MoreHorizontal },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ativo': return 'text-green-500';
      case 'Férias': return 'text-yellow-500';
      case 'Doente': return 'text-red-500';
      case 'Vendas Externas': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedUser: User = {
      ...user,
      name: editForm.name,
      status: editForm.status as UserStatus,
      ...(editForm.newPassword ? { password: editForm.newPassword } : {})
    };

    storageService.updateUser(updatedUser);
    onUserUpdate(updatedUser);
    setIsProfileModalOpen(false);
    setEditForm(prev => ({ ...prev, newPassword: '' }));
    alert("Perfil atualizado com sucesso!");
  };

  const openProfileModal = () => {
    setEditForm({
      name: user.name,
      status: user.status || 'Ativo',
      newPassword: ''
    });
    setIsProfileModalOpen(true);
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <aside className="hidden md:flex flex-col z-30 w-64 h-full bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out">
        <div className="h-full flex flex-col">
          <div className="h-16 flex items-center justify-center border-b border-gray-100 px-6">
            <h1 className="font-serif text-xl font-bold text-primary-700 tracking-wide text-center">
              Kethellem<span className="text-gray-400"> Store</span>
            </h1>
          </div>
          <div className={`p-6 flex flex-col items-center border-b border-gray-100 relative group ${isOwner ? 'bg-amber-50' : isAuditor ? 'bg-slate-50' : 'bg-primary-50/50'}`}>
            <button onClick={openProfileModal} className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-white rounded-lg transition-all opacity-0 group-hover:opacity-100"><Settings size={16} /></button>
            <div className={`w-20 h-20 rounded-full border-4 shadow-sm overflow-hidden mb-3 ${isOwner ? 'border-amber-200' : 'border-white'}`}>
              <img src={`https://api.dicebear.com/7.x/lorelei/svg?seed=${user.avatarSeed}&backgroundColor=ffe4e6`} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <h3 className="font-semibold text-gray-800 text-center leading-tight">{user.name}</h3>
            <div className="flex items-center gap-1.5 mt-1">
               <Circle size={8} className={`${getStatusColor(user.status || 'Ativo')} fill-current`} />
               <span className="text-xs text-gray-600 font-medium">{user.status || 'Ativo'}</span>
            </div>
          </div>
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto no-scrollbar">
            {menuItems.map((item) => (
              <button key={item.id} onClick={() => onNavigate(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${currentPage === item.id ? 'bg-primary-50 text-primary-700 font-medium shadow-sm ring-1 ring-primary-200' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}>
                <item.icon size={20} className={currentPage === item.id ? 'text-primary-500' : 'text-gray-400'} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-gray-100">
            <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors"><LogOut size={20} /><span>Sair</span></button>
          </div>
        </div>
      </aside>

      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 bg-white md:hidden flex flex-col animate-in slide-in-from-bottom duration-300">
           <div className="flex justify-between items-center p-4 border-b border-gray-100">
             <h2 className="font-serif font-bold text-lg">Menu</h2>
             <button onClick={() => setIsSidebarOpen(false)} className="p-2 bg-gray-100 rounded-full"><X size={20} /></button>
           </div>
           <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <button onClick={() => { onNavigate('pos'); setIsSidebarOpen(false); }} className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 text-gray-800"><ShoppingBag size={20} /><span>Caixa (Vender)</span></button>
              <button onClick={() => { onNavigate('customers'); setIsSidebarOpen(false); }} className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 text-gray-800"><Users size={20} /><span>Lista de Clientes</span></button>
              <button onClick={() => { onNavigate('products'); setIsSidebarOpen(false); }} className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 text-gray-800"><Package size={20} /><span>Estoque</span></button>
              {isAdmin && (
                <button onClick={() => { onNavigate('pcp'); setIsSidebarOpen(false); }} className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 text-gray-800"><CalendarDays size={20} className="text-primary-600"/><span className="font-medium">Cronograma PCP</span></button>
              )}
              {isAdmin && (
                <button onClick={() => { onNavigate('financial'); setIsSidebarOpen(false); }} className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 text-gray-800"><Wallet size={20} className="text-primary-600"/><span className="font-medium">Financeiro</span></button>
              )}
              <button onClick={onLogout} className="w-full flex items-center gap-4 p-4 rounded-xl text-red-600 mt-4 border border-red-100 bg-red-50"><LogOut size={20} /><span className="font-medium">Sair do Sistema</span></button>
           </div>
        </div>
      )}

      <main className="flex-1 flex flex-col h-full overflow-hidden relative pb-20 md:pb-0">
        <header className="md:hidden h-16 bg-white border-b border-gray-200 flex items-center justify-center px-4 z-10 sticky top-0">
          <span className="font-serif text-lg font-bold text-primary-700">Kethellem Store</span>
        </header>
        <div className="flex-1 overflow-auto bg-gray-50 p-4 md:p-8"><div className="max-w-7xl mx-auto h-full">{children}</div></div>
      </main>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 pb-6 pt-3 z-40 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        {mobileNavItems.map(item => {
          const isActive = currentPage === item.id || (item.id === 'menu' && isSidebarOpen);
          return (
            <button key={item.id} onClick={() => { if (item.id === 'menu') setIsSidebarOpen(true); else { onNavigate(item.id); setIsSidebarOpen(false); } }} className={`flex flex-col items-center gap-1 transition-colors duration-200 ${isActive ? 'text-primary-600' : 'text-gray-400'}`}>
              <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} /><span className="text-[10px] font-medium">{item.label}</span>
            </button>
          )
        })}
      </div>

      {isProfileModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-lg text-gray-900">Editar Perfil</h3><button onClick={() => setIsProfileModalOpen(false)}><X size={20} className="text-gray-400" /></button></div>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Nome de Exibição</label><input type="text" className="w-full border border-gray-300 rounded-lg p-2 focus:ring-primary-500" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} required /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Status Atual</label><select className="w-full border border-gray-300 rounded-lg p-2 focus:ring-primary-500 bg-white" value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})}><option value="Ativo">🟢 Em Loja / Ativo</option><option value="Vendas Externas">🔵 Vendas Externas</option><option value="Férias">🟡 Férias</option><option value="Doente">🔴 Doente / Atestado</option></select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Nova Senha</label><input type="password" className="w-full border border-gray-300 rounded-lg p-2 focus:ring-primary-500" placeholder="Deixe em branco para manter" value={editForm.newPassword} onChange={e => setEditForm({...editForm, newPassword: e.target.value})} /></div>
              <div className="pt-2 flex gap-3"><button type="button" onClick={() => setIsProfileModalOpen(false)} className="flex-1 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button><button type="submit" className="flex-1 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Salvar</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};