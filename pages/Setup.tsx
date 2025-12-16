import React, { useState } from 'react';
import { storageService } from '../services/storage.ts';
import { User, UserRole } from '../types';
import { ShieldCheck, Loader2, ArrowRight, Store } from 'lucide-react';

interface SetupProps {
  onComplete: () => void;
}

export const Setup: React.FC<SetupProps> = ({ onComplete }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    if (formData.password.length < 4) {
      setError('A senha deve ter pelo menos 4 caracteres.');
      return;
    }

    setLoading(true);

    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1500));

      const ownerUser: User = {
        id: '0', // ID 0 is reserved for Owner
        name: formData.name,
        email: formData.email,
        role: UserRole.OWNER,
        avatarSeed: formData.name,
        password: formData.password,
        status: 'Ativo'
      };

      storageService.saveUser(ownerUser);
      onComplete(); // Trigger app reload/login check
    } catch (err) {
      setError('Erro ao configurar o sistema.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
        <div className="bg-slate-900 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-indigo-500/10 z-0"></div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/20">
              <Store className="text-white" size={32} />
            </div>
            <h1 className="text-2xl font-serif font-bold text-white mb-2">Bem-vindo à Kethellem Store</h1>
            <p className="text-slate-400 text-sm">Configuração Inicial do Sistema</p>
          </div>
        </div>

        <div className="p-8">
          <div className="mb-6 bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3">
             <ShieldCheck className="text-blue-600 flex-shrink-0" size={24} />
             <div className="text-sm text-blue-800">
               <p className="font-bold mb-1">Criação da Conta Proprietária</p>
               <p>Este será o usuário principal com acesso total ao sistema. Após criar esta conta, você poderá cadastrar gerentes e vendedores.</p>
             </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
              <input 
                type="text" 
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                placeholder="Ex: Kethellem Isabelle"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Principal</label>
              <input 
                type="email" 
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                placeholder="email@loja.com"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                <input 
                  type="password" 
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="••••••"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Senha</label>
                <input 
                  type="password" 
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="••••••"
                  value={formData.confirmPassword}
                  onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                />
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg font-medium">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-xl transition-all shadow-lg flex justify-center items-center gap-2 mt-4"
            >
              {loading ? <Loader2 className="animate-spin" /> : (
                <>
                  <span>Inicializar Sistema</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};