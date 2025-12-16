import React, { useMemo } from 'react';
import { Sale, Product, User } from '../types';
import { DollarSign, ShoppingBag, Package, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  sales: Sale[];
  products: Product[];
  users: User[];
}

export const Dashboard: React.FC<DashboardProps> = ({ sales, products, users }) => {
  
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todaySales = sales.filter(s => s.date.startsWith(today));
    
    const totalRevenue = sales.reduce((acc, s) => acc + s.total, 0);
    const todayRevenue = todaySales.reduce((acc, s) => acc + s.total, 0);
    const lowStock = products.filter(p => p.stock < 5).length;
    
    return { totalRevenue, todayRevenue, totalSales: sales.length, lowStock };
  }, [sales, products]);

  const chartData = useMemo(() => {
    // Group sales by date (last 7 days)
    const data: Record<string, number> = {};
    const last7Days = Array.from({length: 7}, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    last7Days.forEach(date => data[date] = 0);

    sales.forEach(s => {
      const date = s.date.split('T')[0];
      if (data[date] !== undefined) {
        data[date] += s.total;
      }
    });

    return Object.entries(data).map(([name, value]) => ({ 
      name: new Date(name).toLocaleDateString('pt-BR', { weekday: 'short' }), 
      vendas: value 
    }));
  }, [sales]);

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 font-serif">Visão Geral</h2>
        <p className="text-gray-500">Bem-vinda de volta ao painel administrativo.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Vendas Hoje" 
          value={`R$ ${stats.todayRevenue.toFixed(2)}`} 
          icon={TrendingUp} 
          color="bg-emerald-100 text-emerald-600" 
        />
        <StatCard 
          title="Total Receita" 
          value={`R$ ${stats.totalRevenue.toFixed(2)}`} 
          icon={DollarSign} 
          color="bg-primary-100 text-primary-600" 
        />
        <StatCard 
          title="Total Pedidos" 
          value={stats.totalSales.toString()} 
          icon={ShoppingBag} 
          color="bg-blue-100 text-blue-600" 
        />
        <StatCard 
          title="Estoque Baixo" 
          value={`${stats.lowStock} itens`} 
          icon={Package} 
          color="bg-orange-100 text-orange-600" 
        />
      </div>

      {/* Charts Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Vendas da Semana</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
              <Tooltip 
                cursor={{fill: '#fce7f3'}}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="vendas" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{title: string, value: string, icon: any, color: string}> = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between hover:shadow-md transition-shadow">
    <div>
      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
    </div>
    <div className={`p-3 rounded-xl ${color}`}>
      <Icon size={24} />
    </div>
  </div>
);
