import React, { useState, useEffect } from 'react';
import { User, UserRole, AuditLog } from '../types';
import { storageService } from '../services/storage.ts';
import { emailService } from '../services/emailService.ts';
import { Trash2, Plus, X, History, Lock, Loader2, ShieldAlert } from 'lucide-react';

interface UsersProps {
  users: User[];
  currentUser: User;
  onUpdate: () => void;
}

export const Users: React.FC<UsersProps> = ({ users, currentUser, onUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', role: UserRole.SELLER, password: '' });
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // State for Secure Deletion
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authType, setAuthType] = useState<'OWNER_PASSWORD' | 'AUDITOR_PASSWORD'>('OWNER_PASSWORD');
  const [userToDeleteId, setUserToDeleteId] = useState<string | null>(null);
  const [inputPassword, setInputPassword] = useState('');

  const isAdminOrHigher = [UserRole.ADMIN, UserRole.OWNER, UserRole.AUDITOR].includes(currentUser.role);
  const isOwner = currentUser.role === UserRole.OWNER;

  useEffect(() => {
    if (isAdminOrHigher) {
      setAuditLogs(storageService.getAuditLogs());
    }
  }, [currentUser, users, isAdminOrHigher]);

  // Filter Users: Admin cannot see Auditor
  const visibleUsers = users.filter(user => {
    if (currentUser.role === UserRole.ADMIN && user.role === UserRole.AUDITOR) {
      return false;
    }
    return true;
  });

  const handleSave = async () => {
    if (!formData.name || !formData.email || !formData.password) return;

    // Security check: Only Owner can create another Auditor
    if (formData.role === UserRole.AUDITOR && currentUser.role !== UserRole.OWNER) {
      alert("Apenas a Proprietária pode criar um Auditor.");
      return;
    }

    setIsSaving(true);

    const newUser: User = {
      id: Date.now().toString(),
      name: formData.name,
      email: formData.email,
      role: formData.role,
      password: formData.password,
      avatarSeed: formData.name
    };

    try {
      storageService.saveUser(newUser);
      
      // Send Welcome Email (Simulated)
      await emailService.sendWelcomeEmail(newUser, formData.password);
      
      onUpdate();
      setIsModalOpen(false);
      setFormData({ name: '', email: '', role: UserRole.SELLER, password: '' });
      
      alert(`Usuário criado com sucesso!\nUm e-mail de boas-vindas foi enviado para ${newUser.email}.`);
    } catch (error) {
      console.error("Erro ao criar usuário", error);
      alert("Erro ao criar usuário.");
    } finally {
      setIsSaving(false);
    }
  };

  const initiateDelete = (e: React.MouseEvent, targetUser: User) => {
    e.preventDefault();
    e.stopPropagation(); 
    
    // 1. Prevent deleting Owner (System Rule for Everyone)
    if (targetUser.role === UserRole.OWNER) {
      alert("A Proprietária não pode ser excluída do sistema.");
      return;
    }

    // 2. OWNER Logic
    if (currentUser.role === UserRole.OWNER) {
      // Risk Control: Owner deleting Auditor requires Auditor's password
      if (targetUser.role === UserRole.AUDITOR) {
        setUserToDeleteId(targetUser.id);
        setAuthType('AUDITOR_PASSWORD');
        setAuthModalOpen(true);
        return;
      }
      
      // Standard Owner delete
      if (window.confirm(`ADMIN PROPRIETÁRIO: Tem certeza que deseja excluir ${targetUser.name}?`)) {
        storageService.deleteUser(targetUser.id, currentUser.name);
        onUpdate();
        setTimeout(() => setAuditLogs(storageService.getAuditLogs()), 100);
      }
      return;
    }

    // 3. ADMIN Logic
    if (currentUser.role === UserRole.ADMIN) {
      if (targetUser.role === UserRole.AUDITOR) {
        alert("Acesso negado.");
        return;
      }
      setUserToDeleteId(targetUser.id);
      setAuthType('OWNER_PASSWORD');
      setAuthModalOpen(true);
      return;
    }

    // 4. AUDITOR Logic (Now has permission to delete)
    if (currentUser.role === UserRole.AUDITOR) {
       if (window.confirm(`AUDITORIA: Confirmar exclusão definitiva do usuário ${targetUser.name}?`)) {
         storageService.deleteUser(targetUser.id, `AUDITOR (${currentUser.name})`);
         onUpdate();
         setTimeout(() => setAuditLogs(storageService.getAuditLogs()), 100);
       }
       return;
    }
  };

  const confirmSecureDeletion = () => {
    let isValid = false;

    if (authType === 'OWNER_PASSWORD') {
      isValid = storageService.verifyOwnerPassword(inputPassword);
    } else if (authType === 'AUDITOR_PASSWORD') {
      isValid = storageService.verifyAuditorPassword(inputPassword);
    }

    if (isValid) {
      if (userToDeleteId) {
        const target = users.find(u => u.id === userToDeleteId);
        
        let actionDesc = "";
        if (authType === 'AUDITOR_PASSWORD') {
          actionDesc = "EXCLUSÃO AUDITOR (CONTROLE DE RISCO)";
        } else {
          actionDesc = `EXCLUSÃO POR ADMIN (${currentUser.name})`;
        }
        
        storageService.deleteUser(userToDeleteId, actionDesc);
        
        alert(`Usuário ${target?.name || 'Desconhecido'} excluído com sucesso.`);
        setAuthModalOpen(false);
        setInputPassword('');
        setUserToDeleteId(null);
        onUpdate();
        setTimeout(() => setAuditLogs(storageService.getAuditLogs()), 100);
      }
    } else {
      const needed = authType === 'OWNER_PASSWORD' ? "Proprietária" : "Auditor";
      alert(`Senha d${needed === 'Auditor' ? 'o' : 'a'} ${needed} incorreta. Ação negada.`);
    }
  };

  return (
    <div className="space-y-8">
      {/* Users Section */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 font-serif">Equipe</h2>
            <p className="text-gray-500">Gerencie o acesso ao sistema.</p>
          </div>
          {/* Button enabled for Owner, Admin AND Auditor */}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-xl hover:bg-primary-700 flex items-center gap-2 shadow-sm transition-colors"
          >
            <Plus size={20} /> Novo Usuário
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleUsers.map(user => {
             const isUserOwner = user.role === UserRole.OWNER;
             const isUserAuditor = user.role === UserRole.AUDITOR;
             
             // Logic to show delete button
             // Owner: Deletes everyone (except self)
             // Auditor: Deletes everyone (except Owner)
             // Admin: Deletes everyone (except Owner and Auditor)
             const canDelete = 
                (currentUser.role === UserRole.OWNER && !isUserOwner) ||
                (currentUser.role === UserRole.AUDITOR && !isUserOwner) || 
                (currentUser.role === UserRole.ADMIN && !isUserOwner && !isUserAuditor);

             return (
              <div key={user.id} className={`bg-white p-6 rounded-2xl shadow-sm border flex items-center gap-4 group relative overflow-hidden ${isUserOwner ? 'border-amber-200 bg-amber-50/30' : isUserAuditor ? 'border-slate-200 bg-slate-50/30' : 'border-gray-100'}`}>
                {/* Visual Badges */}
                {isUserOwner && <div className="absolute top-0 right-0 bg-amber-400 text-white text-[10px] px-2 py-0.5 rounded-bl-lg font-bold z-10">PROPRIETÁRIA</div>}
                {isUserAuditor && <div className="absolute top-0 right-0 bg-slate-600 text-white text-[10px] px-2 py-0.5 rounded-bl-lg font-bold z-10">AUDITOR</div>}

                <div className={`w-16 h-16 rounded-full border-2 overflow-hidden flex-shrink-0 ${isUserOwner ? 'border-amber-300' : 'border-gray-100'}`}>
                  <img 
                    src={`https://api.dicebear.com/7.x/lorelei/svg?seed=${user.avatarSeed}&backgroundColor=ffe4e6`} 
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0 relative z-0">
                  <h4 className="font-bold text-gray-900 truncate">{user.name}</h4>
                  <p className="text-sm text-gray-500 truncate">{user.email}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${
                    isUserOwner ? 'bg-amber-100 text-amber-800' :
                    isUserAuditor ? 'bg-slate-200 text-slate-800' :
                    user.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {user.role}
                  </span>
                </div>
                
                {/* Delete Button - Added z-20 and relative positioning to ensure clickability */}
                {canDelete && (
                  <button 
                    type="button"
                    onClick={(e) => initiateDelete(e, user)} 
                    className="relative z-20 p-2 rounded-lg transition-colors text-gray-400 hover:text-red-500 hover:bg-red-50 cursor-pointer"
                    title="Excluir Usuário"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Audit Logs Section */}
      {isAdminOrHigher && (
        <div className="pt-8 border-t border-gray-200">
          <div className="flex items-center gap-2 mb-4 text-gray-800">
            <History className="text-primary-600" />
            <h3 className="text-xl font-bold font-serif">Histórico de Alterações</h3>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-medium">
                  <tr>
                    <th className="px-6 py-4">Data/Hora</th>
                    <th className="px-6 py-4">Ação</th>
                    <th className="px-6 py-4">Realizado Por</th>
                    <th className="px-6 py-4">Descrição</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(log.timestamp).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {log.performedBy}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {log.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* New User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg">Novo Usuário</h3>
              <button onClick={() => setIsModalOpen(false)} disabled={isSaving}><X size={20} className="text-gray-400" /></button>
            </div>
            
            <div className="space-y-4">
              <input 
                type="text" placeholder="Nome Completo" 
                className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                disabled={isSaving}
              />
              <input 
                type="email" placeholder="Email Corporativo" 
                className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                disabled={isSaving}
              />
              <input 
                type="password" placeholder="Senha Inicial" 
                className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                disabled={isSaving}
              />
              
              <div>
                 <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">Nível de Acesso</label>
                 <select 
                  className="w-full border p-2 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 outline-none"
                  value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
                  disabled={isSaving}
                 >
                   <option value={UserRole.SELLER}>Vendedor (Caixa e Vendas)</option>
                   <option value={UserRole.ADMIN}>Gerente (Acesso Administrativo)</option>
                   {/* Restrict Auditor option only to Owner */}
                   {isOwner && (
                     <option value={UserRole.AUDITOR}>Auditor (Acesso Total de Segurança)</option>
                   )}
                 </select>
               </div>

               {/* Safety Warning for Auditor Role */}
               {formData.role === UserRole.AUDITOR && (
                 <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 flex items-start gap-2">
                   <ShieldAlert size={16} className="mt-0.5 flex-shrink-0" />
                   <p><strong>Atenção:</strong> O Auditor tem acesso irrestrito a logs de segurança, exclusões e auditoria financeira. Crie esta conta apenas para o responsável legal.</p>
                 </div>
               )}

               <button 
                 onClick={handleSave} 
                 disabled={isSaving}
                 className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 mt-2 flex justify-center items-center gap-2 disabled:bg-primary-400 disabled:cursor-not-allowed font-medium shadow-md"
               >
                 {isSaving ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      <span>Enviando Credenciais...</span>
                    </>
                 ) : 'Criar Conta e Enviar E-mail'}
               </button>
            </div>
          </div>
        </div>
       )}

       {/* Secure Deletion Auth Modal */}
       {authModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70">
           <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 border-2 border-red-500">
             <div className="flex flex-col items-center text-center mb-6">
               <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-3">
                 <Lock size={24} />
               </div>
               <h3 className="font-bold text-xl text-gray-900">Autorização Requerida</h3>
               <p className="text-sm text-gray-500 mt-2">
                 {authType === 'AUDITOR_PASSWORD' 
                    ? "Excluir o Auditor requer a senha dele para validação de risco."
                    : "Esta ação requer a senha da Proprietária para ser validada."}
               </p>
             </div>
             
             <div className="space-y-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                    {authType === 'AUDITOR_PASSWORD' ? "Senha do Auditor" : "Senha da Proprietária"}
                 </label>
                 <input 
                   type="password" 
                   className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                   placeholder="Digite a senha..."
                   value={inputPassword} 
                   onChange={e => setInputPassword(e.target.value)}
                 />
               </div>
               
               <div className="flex gap-3 pt-2">
                 <button onClick={() => {setAuthModalOpen(false); setInputPassword('');}} className="flex-1 py-3 text-gray-600 font-medium hover:bg-gray-100 rounded-xl">Cancelar</button>
                 <button onClick={confirmSecureDeletion} className="flex-1 py-3 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700">
                    {authType === 'AUDITOR_PASSWORD' ? "Confirmar Risco" : "Validar Exclusão"}
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}
    </div>
  );
};