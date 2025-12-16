import React, { useMemo, useState } from 'react';
import { Sale, User, UserRole } from '../types';
import { geminiService } from '../services/geminiService.ts';
import { Sparkles, Filter, Loader2 } from 'lucide-react';

interface ReportsProps {
  sales: Sale[];
  currentUser: User;
}

export const Reports: React.FC<ReportsProps> = ({ sales, currentUser }) => {
  const [filter, setFilter] = useState<'day' | 'week' | 'month'>('week');
  const [aiInsight, setAiInsight] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);

  // Filter sales based on role and time period
  const filteredSales = useMemo(() => {
    let data = sales;
    // If seller, only see own sales
    if (currentUser.role === UserRole.SELLER) {
      data = data.filter(s => s.sellerId === currentUser.id);
    }

    const now = new Date();
    data = data.filter(s => {
      const saleDate = new Date(s.date);
      if (filter === 'day') return saleDate.toDateString() === now.toDateString();
      if (filter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        return saleDate >= weekAgo;
      }
      if (filter === 'month') return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
      return true;
    });

    return data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sales, currentUser, filter]);

  const totalRevenue = filteredSales.reduce((acc, s) => acc + s.total, 0);

  const handleAiAnalysis = async () => {
    setLoadingAi(true);
    const insight = await geminiService.analyzeSalesTrend(filteredSales);
    setAiInsight(insight);
    setLoadingAi(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 font-serif">Relatórios de Vendas</h2>
          <p className="text-gray-500">
            {currentUser.role === UserRole.ADMIN ? 'Visão global da loja.' : 'Seu desempenho de vendas.'}
          </p>
        </div>
        
        <div className="flex items-center bg-white rounded-lg border border-gray-200 p-1">
          {(['day', 'week', 'month'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                filter === f ? 'bg-primary-100 text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {f === 'day' ? 'Hoje' : f === 'week' ? 'Semana' : 'Mês'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-gray-800">Histórico ({filteredSales.length})</h3>
            <span className="text-2xl font-bold text-primary-600">Total: R$ {totalRevenue.toFixed(2)}</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-xs uppercase text-gray-400 font-medium border-b border-gray-100">
                <tr>
                  <th className="pb-3">Data</th>
                  {currentUser.role === UserRole.ADMIN && <th className="pb-3">Vendedor</th>}
                  <th className="pb-3">Itens</th>
                  <th className="pb-3 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {filteredSales.map(sale => (
                  <tr key={sale.id} className="group hover:bg-gray-50">
                    <td className="py-3 text-gray-600">
                      {new Date(sale.date).toLocaleString('pt-BR')}
                    </td>
                    {currentUser.role === UserRole.ADMIN && (
                      <td className="py-3 font-medium text-gray-800">{sale.sellerName}</td>
                    )}
                    <td className="py-3 text-gray-500">
                      {sale.items.length} itens <span className="text-xs text-gray-300">({sale.items.map(i => i.productName).join(', ').substring(0, 20)}...)</span>
                    </td>
                    <td className="py-3 text-right font-medium text-gray-900">
                      R$ {sale.total.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredSales.length === 0 && (
              <div className="text-center py-10 text-gray-400">Nenhuma venda neste período.</div>
            )}
          </div>
        </div>

        {/* AI Insight Panel */}
        <div className="bg-gradient-to-br from-purple-50 to-white p-6 rounded-2xl shadow-sm border border-purple-100 flex flex-col">
          <div className="flex items-center gap-2 mb-4 text-purple-700">
            <Sparkles size={20} />
            <h3 className="font-bold">Consultora IA</h3>
          </div>
          <p className="text-sm text-gray-600 mb-6 flex-1">
             {aiInsight || "Clique abaixo para analisar o desempenho de vendas e receber dicas personalizadas."}
          </p>
          <button 
            onClick={handleAiAnalysis}
            disabled={loadingAi || filteredSales.length === 0}
            className="w-full bg-white border border-purple-200 text-purple-700 hover:bg-purple-50 font-medium py-2 rounded-xl transition-colors shadow-sm disabled:opacity-50 flex justify-center gap-2 items-center"
          >
            {loadingAi ? <Loader2 className="animate-spin" size={18}/> : "Gerar Análise"}
          </button>
        </div>
      </div>
    </div>
  );
};
