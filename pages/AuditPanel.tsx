import React, { useState } from 'react';
import { storageService } from '../services/storage.ts';
import { User, UserRole, LoginSession, AuditLog } from '../types';
import { Clock, ShieldAlert, FileText, CheckCircle2, UserCheck } from 'lucide-react';

interface AuditPanelProps {
  currentUser: User;
}

export const AuditPanel: React.FC<AuditPanelProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'logs' | 'closures'>('login');
  
  const loginLogs = storageService.getLoginLogs();
  const auditLogs = storageService.getAuditLogs();
  const closures = storageService.getClosures();

  // Protect Access
  if (currentUser.role !== UserRole.AUDITOR) {
    return <div className="p-10 text-center text-red-500 font-bold">Acesso Negado. Área restrita à Auditoria.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl overflow-hidden relative">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2 text-slate-300">
            <ShieldAlert size={24} />
            <span className="uppercase tracking-widest text-sm font-semibold">Painel de Auditoria e Conformidade</span>
          </div>
          <h1 className="text-3xl font-bold font-serif mb-2">Auditor: {currentUser.name}</h1>
          <p className="text-slate-400 max-w-2xl">
            Acesso irrestrito para verificação de conformidade operacional, controle de ponto e integridade financeira.
          </p>
        </div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-slate-800 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50 blur-3xl"></div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <TabButton 
          active={activeTab === 'login'} 
          onClick={() => setActiveTab('login')} 
          icon={Clock} 
          label="Controle de Ponto (Login)" 
        />
        <TabButton 
          active={activeTab === 'logs'} 
          onClick={() => setActiveTab('logs')} 
          icon={FileText} 
          label="Log de Alterações" 
        />
        <TabButton 
          active={activeTab === 'closures'} 
          onClick={() => setActiveTab('closures')} 
          icon={CheckCircle2} 
          label="Fechamentos de Caixa" 
        />
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 min-h-[400px]">
        
        {/* LOGIN HISTORY (PONTO) */}
        {activeTab === 'login' && (
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <UserCheck className="text-blue-600" />
              Registro de Acesso (Ponto)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-medium">
                  <tr>
                    <th className="px-6 py-4">Data/Hora</th>
                    <th className="px-6 py-4">Usuário</th>
                    <th className="px-6 py-4">Cargo</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loginLogs.map(log => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-600 font-mono text-sm">
                        {new Date(log.loginTime).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">{log.userName}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          log.role === UserRole.OWNER ? 'bg-amber-100 text-amber-800' :
                          log.role === UserRole.AUDITOR ? 'bg-slate-200 text-slate-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {log.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-green-600 text-xs font-bold uppercase">Login Realizado</span>
                      </td>
                    </tr>
                  ))}
                  {loginLogs.length === 0 && (
                    <tr><td colSpan={4} className="p-8 text-center text-gray-400">Sem registros de login.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SYSTEM AUDIT LOGS */}
        {activeTab === 'logs' && (
          <div className="p-6">
             <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <ShieldAlert className="text-red-600" />
              Log de Alterações Sensíveis
            </h3>
            <div className="space-y-4">
              {auditLogs.map(log => (
                <div key={log.id} className="flex gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="mt-1">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-red-600 uppercase bg-red-50 px-2 py-0.5 rounded border border-red-100">{log.action}</span>
                      <span className="text-xs text-gray-400">{new Date(log.timestamp).toLocaleString('pt-BR')}</span>
                    </div>
                    <p className="text-gray-800 font-medium">{log.description}</p>
                    <p className="text-sm text-gray-500 mt-1">Realizado por: <span className="font-semibold text-gray-700">{log.performedBy}</span></p>
                  </div>
                </div>
              ))}
               {auditLogs.length === 0 && (
                 <div className="p-8 text-center text-gray-400">Nenhuma ação crítica registrada.</div>
               )}
            </div>
          </div>
        )}

        {/* DAILY CLOSURES */}
        {activeTab === 'closures' && (
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <CheckCircle2 className="text-green-600" />
              Auditoria de Fechamento de Caixa
            </h3>
             <div className="grid gap-4">
               {closures.map(closure => (
                 <div key={closure.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                   <div className="flex justify-between items-start mb-4">
                     <div>
                       <h4 className="font-bold text-gray-900">Fechamento: {new Date(closure.date).toLocaleDateString()}</h4>
                       <p className="text-sm text-gray-500">Resp: {closure.closedBy} às {new Date(closure.date).toLocaleTimeString()}</p>
                     </div>
                     <div className="text-right">
                       <p className="text-sm text-gray-500">Total Apurado</p>
                       <p className="text-xl font-bold text-green-600">R$ {closure.totalSales.toFixed(2)}</p>
                     </div>
                   </div>
                   <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg text-sm">
                      <div>
                        <span className="block text-gray-500">Vendas Realizadas</span>
                        <span className="font-medium">{closure.salesCount} transações</span>
                      </div>
                      <div>
                        <span className="block text-gray-500">Saídas (Brindes/Parcerias)</span>
                        <span className="font-medium text-purple-700">{closure.giftsCount} itens (R$ {closure.totalGifts.toFixed(2)})</span>
                      </div>
                   </div>
                 </div>
               ))}
               {closures.length === 0 && (
                 <div className="p-8 text-center text-gray-400">Nenhum fechamento de caixa registrado.</div>
               )}
             </div>
          </div>
        )}

      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button
    onClick={onClick}
    className={`
      flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap
      ${active 
        ? 'bg-slate-800 text-white shadow-lg shadow-slate-200' 
        : 'bg-white text-gray-600 hover:bg-gray-100'}
    `}
  >
    <Icon size={18} />
    {label}
  </button>
);