import React, { useMemo, useState } from 'react';
import { Sale, Product, User, UserRole, StoreGoal } from '../types';
import { storageService } from '../services/storage.ts';
import { DollarSign, TrendingUp, Users as UsersIcon, Star, Target, ChevronRight, MessageSquare } from 'lucide-react';

interface DashboardProps {
  sales: Sale[];
  products: Product[];
  users: User[];
}

export const Dashboard: React.FC<DashboardProps> = ({ sales, products, users }) => {
  const currentMonthGoal = storageService.getCurrentMonthGoal();
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [newGoal, setNewGoal] = useState(currentMonthGoal.toString());

  const now = new Date();
  const currentMonthSales = useMemo(() => {
    return sales.filter(s => {
      const d = new Date(s.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
  }, [sales]);

  const monthRevenue = currentMonthSales.reduce((acc, s) => acc + s.total, 0);
  const goalProgress = Math.min(100, (monthRevenue / currentMonthGoal) * 100);

  const handleSaveGoal = () => {
    storageService.saveGoal({
      month: now.getMonth(),
      year: now.getFullYear(),
      target: parseFloat(newGoal)
    });
    setIsEditingGoal(false);
    window.location.reload();
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 font-serif">Olá, Kethellem</h2>
          <p className="text-gray-500 font-medium">Aqui está o pulso da sua loja hoje.</p>
        </div>
        <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 px-4">
           <div className="text-right">
             <p className="text-[10px] font-black text-gray-400 uppercase">Meta do Mês</p>
             <p className="font-black text-slate-900">R$ {currentMonthGoal.toLocaleString()}</p>
           </div>
           <button onClick={() => setIsEditingGoal(true)} className="p-2 bg-slate-900 text-white rounded-xl hover:bg-black transition-all">
             <Target size={18} />
           </button>
        </div>
      </div>

      {/* Meta do Mês - Termômetro */}
      <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
         <div className="flex justify-between items-end mb-4">
            <div>
               <span className="text-xs font-black text-primary-600 uppercase tracking-widest">Progresso da Loja</span>
               <h3 className="text-4xl font-black text-slate-900 mt-1">R$ {monthRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            </div>
            <div className="text-right">
               <span className="text-xs font-black text-gray-400 uppercase">Faltam</span>
               <p className="text-lg font-black text-slate-900">R$ {Math.max(0, currentMonthGoal - monthRevenue).toLocaleString()}</p>
            </div>
         </div>
         <div className="h-6 w-full bg-gray-100 rounded-full overflow-hidden p-1 shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-1000 relative"
              style={{ width: `${goalProgress}%` }}
            >
               <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            </div>
         </div>
         <p className="text-center text-xs font-black text-gray-400 mt-4 uppercase tracking-[0.2em]">{goalProgress.toFixed(1)}% DA META ATINGIDA</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Vendas Hoje" value={`R$ ${sales.filter(s => s.date.startsWith(now.toISOString().split('T')[0])).reduce((acc, s) => acc + s.total, 0).toLocaleString()}`} icon={TrendingUp} color="bg-emerald-50 text-emerald-600" />
        <StatCard label="Clientes Novos" value="12" icon={UsersIcon} color="bg-blue-50 text-blue-600" />
        <StatCard label="Ticket Médio" value={`R$ ${(monthRevenue / (currentMonthSales.length || 1)).toFixed(0)}`} icon={Star} color="bg-amber-50 text-amber-600" />
      </div>

      {/* Quick Actions para a Dona */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <div className="bg-slate-900 text-white p-8 rounded-[40px] flex flex-col justify-between group cursor-pointer hover:bg-black transition-all">
            <div>
               <MessageSquare className="text-primary-400 mb-4" size={32} />
               <h4 className="text-2xl font-black font-serif">Enviar Relatório</h4>
               <p className="text-slate-400 font-medium mt-2">Clique para gerar o resumo do dia e enviar no WhatsApp do seu sócio ou contador.</p>
            </div>
            <button className="mt-8 flex items-center gap-2 font-black text-sm uppercase tracking-widest">
               Gerar Agora <ChevronRight size={18} />
            </button>
         </div>
         
         <div className="bg-primary-600 text-white p-8 rounded-[40px] flex flex-col justify-between group cursor-pointer hover:bg-primary-700 transition-all">
            <div>
               <Star className="text-white mb-4" size={32} />
               <h4 className="text-2xl font-black font-serif">Top Vendedora</h4>
               <p className="text-primary-100 font-medium mt-2">Ana Silva lidera o mês com R$ 12.450 em vendas. Ticket médio: R$ 245.</p>
            </div>
            <button className="mt-8 flex items-center gap-2 font-black text-sm uppercase tracking-widest">
               Ver Ranking <ChevronRight size={18} />
            </button>
         </div>
      </div>

      {isEditingGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[40px] p-8 w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-black font-serif mb-6">Ajustar Meta Mensal</h3>
            <input 
              type="number" 
              className="w-full border-2 border-gray-100 p-4 rounded-2xl mb-6 font-black text-2xl outline-none focus:border-primary-500"
              value={newGoal}
              onChange={e => setNewGoal(e.target.value)}
            />
            <div className="flex gap-4">
               <button onClick={() => setIsEditingGoal(false)} className="flex-1 py-4 font-bold text-gray-400">Cancelar</button>
               <button onClick={handleSaveGoal} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-bold">Salvar Meta</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, color }: any) => (
  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
    <div className={`p-3 rounded-2xl ${color}`}><Icon size={24} /></div>
    <div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
      <p className="text-xl font-black text-slate-900">{value}</p>
    </div>
  </div>
);