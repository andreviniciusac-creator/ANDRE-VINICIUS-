import React, { useState, useMemo } from 'react';
import { Customer, User, UserRole } from '../types';
import { storageService } from '../services/storage.ts';
import { Search, UserPlus, MessageSquare, Trash2, Calendar, ShieldCheck, Phone, X, Fingerprint, Info } from 'lucide-react';

interface CustomersProps {
  currentUser: User;
}

export const Customers: React.FC<CustomersProps> = ({ currentUser }) => {
  const [customers, setCustomers] = useState<Customer[]>(storageService.getCustomers());
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', cpf: '', birthday: '' });

  const canSeeRegistrationSource = [UserRole.OWNER, UserRole.AUDITOR, UserRole.ADMIN].includes(currentUser.role);
  const canDeleteCustomer = [UserRole.OWNER, UserRole.AUDITOR].includes(currentUser.role);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase()) || 
      c.cpf.includes(search) || 
      c.phone.includes(search)
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [customers, search]);

  const handleCpfChange = (val: string) => {
    const onlyNums = val.replace(/\D/g, '').slice(0, 11);
    setFormData({ ...formData, cpf: onlyNums });
  };

  const handlePhoneChange = (val: string) => {
    const onlyNums = val.replace(/\D/g, '').slice(0, 11);
    setFormData({ ...formData, phone: onlyNums });
  };

  const handleSave = () => {
    if (!formData.name || formData.phone.length < 10 || formData.cpf.length !== 11) {
      return alert("Erro de Validação:\n- Nome é obrigatório\n- CPF deve ter exatamente 11 dígitos\n- Telefone deve ter DDD + número");
    }
    
    try {
      const newCustomer: Customer = {
        id: Date.now().toString(),
        name: formData.name,
        phone: formData.phone,
        cpf: formData.cpf,
        birthday: formData.birthday,
        totalSpent: 0,
        createdAt: new Date().toISOString(),
        registeredBy: currentUser.name
      };
      storageService.saveCustomer(newCustomer);
      setCustomers(storageService.getCustomers());
      setIsModalOpen(false);
      setFormData({ name: '', phone: '', cpf: '', birthday: '' });
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Deseja realmente remover esta cliente? Esta ação é irreversível.")) {
      // Agora passamos o nome de quem deletou para o log de auditoria
      storageService.deleteCustomer(id, currentUser.name);
      setCustomers(storageService.getCustomers());
    }
  };

  const openWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${cleanPhone}`, '_blank');
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 font-serif">Nossas Clientes</h2>
          <p className="text-gray-500 font-medium">Gestão centralizada e segura de clientes Kethellem Store.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-primary-600 text-white px-8 py-4 rounded-3xl font-black shadow-xl hover:bg-primary-700 transition-all flex items-center gap-2">
           <UserPlus size={20} /> Cadastrar Cliente
        </button>
      </div>

      <div className="bg-white p-4 rounded-[32px] shadow-sm border border-gray-100">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" placeholder="Buscar por Nome, CPF (apenas números) ou Telefone..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary-100 outline-none font-bold"
          />
        </div>
      </div>

      <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-gray-100">
                  <tr>
                    <th className="px-8 py-6">Cliente</th>
                    <th className="px-8 py-6">CPF</th>
                    <th className="px-8 py-6">WhatsApp</th>
                    {canSeeRegistrationSource && <th className="px-8 py-6">Origem do Cadastro</th>}
                    <th className="px-8 py-6 text-right">Ações</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                  {filteredCustomers.map(c => (
                    <tr key={c.id} className="hover:bg-primary-50/30 transition-colors group">
                       <td className="px-8 py-6">
                          <div>
                             <p className="font-black text-slate-900">{c.name}</p>
                             <p className="text-[10px] text-gray-400 uppercase font-bold">Total Gasto: R$ {c.totalSpent.toFixed(2)}</p>
                          </div>
                       </td>
                       <td className="px-8 py-6 font-bold text-gray-500">
                          <span className="bg-gray-100 px-2 py-1 rounded-lg text-xs font-mono">
                            {c.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}
                          </span>
                       </td>
                       <td className="px-8 py-6 font-black text-primary-600">
                          <button onClick={() => openWhatsApp(c.phone)} className="flex items-center gap-2 hover:underline">
                             <Phone size={14} /> {c.phone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")}
                          </button>
                       </td>
                       {canSeeRegistrationSource && (
                        <td className="px-8 py-6">
                            <div>
                               <p className="text-xs font-bold text-slate-700">{new Date(c.createdAt).toLocaleDateString()}</p>
                               <p className="text-[10px] text-gray-400 uppercase font-black tracking-tighter flex items-center gap-1"><ShieldCheck size={10} /> Por: {c.registeredBy}</p>
                            </div>
                         </td>
                       )}
                       <td className="px-8 py-6 text-right">
                          <div className="flex justify-end gap-2">
                             <button onClick={() => openWhatsApp(c.phone)} className="p-3 bg-emerald-100 text-emerald-600 rounded-xl hover:bg-emerald-200 transition-all" title="WhatsApp"><MessageSquare size={18} /></button>
                             {canDeleteCustomer && (
                               <button onClick={() => handleDelete(c.id)} className="p-3 bg-red-50 text-red-400 rounded-xl hover:bg-red-100 transition-all" title="Excluir"><Trash2 size={18} /></button>
                             )}
                          </div>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
            {filteredCustomers.length === 0 && (
              <div className="p-20 text-center text-gray-300 font-black uppercase tracking-widest text-xs">Nenhuma cliente encontrada</div>
            )}
         </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[40px] p-8 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-8">
               <h3 className="text-2xl font-black font-serif">Nova Cliente</h3>
               <button onClick={() => setIsModalOpen(false)}><X size={24}/></button>
            </div>
            <div className="space-y-4">
               <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Nome Completo</label>
                  <input type="text" className="w-full bg-gray-50 p-4 rounded-2xl border-none font-bold outline-none focus:ring-2 focus:ring-primary-100" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Nome da cliente" />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 flex justify-between">
                        WhatsApp <span>{formData.phone.length}/11</span>
                     </label>
                     <input type="text" maxLength={11} placeholder="68999998888" className="w-full bg-gray-50 p-4 rounded-2xl border-none font-bold outline-none focus:ring-2 focus:ring-primary-100" value={formData.phone} onChange={e => handlePhoneChange(e.target.value)} />
                  </div>
                  <div>
                     <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 flex justify-between">
                        CPF (Obrigatório) <span>{formData.cpf.length}/11</span>
                     </label>
                     <input type="text" maxLength={11} placeholder="Apenas números" className="w-full bg-gray-50 p-4 rounded-2xl border-none font-bold outline-none focus:ring-2 focus:ring-primary-100" value={formData.cpf} onChange={e => handleCpfChange(e.target.value)} />
                  </div>
               </div>
               <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Aniversário (Opcional)</label>
                  <input type="date" className="w-full bg-gray-50 p-4 rounded-2xl border-none font-bold outline-none focus:ring-2 focus:ring-primary-100" value={formData.birthday} onChange={e => setFormData({...formData, birthday: e.target.value})} />
               </div>
               
               <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-3">
                  <Fingerprint className="text-amber-600 flex-shrink-0" size={18} />
                  <p className="text-[10px] font-bold text-amber-800 leading-tight uppercase">
                    O CPF é usado para evitar duplicidade. Digite exatamente 11 números para validar o botão abaixo.
                  </p>
               </div>

               <button 
                onClick={handleSave} 
                disabled={formData.cpf.length !== 11}
                className={`w-full py-5 rounded-2xl font-black mt-4 shadow-xl transition-all ${formData.cpf.length === 11 ? 'bg-slate-900 text-white hover:bg-black shadow-slate-200' : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'}`}
               >
                Salvar Cadastro
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};