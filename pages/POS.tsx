import React, { useState, useMemo } from 'react';
import { Product, CartItem, Sale, User, PaymentMethod, Customer, ExchangeRecord, Gift } from '../types';
import { Search, ShoppingBag, CheckCircle, X, CreditCard, Banknote, Smartphone, UserPlus, UserCheck, RefreshCcw, History, Fingerprint, Star, AlertCircle, UserX } from 'lucide-react';
import { storageService } from '../services/storage.ts';

interface POSProps {
  products: Product[];
  currentUser: User;
  onSaleComplete: () => void;
}

export const POS: React.FC<POSProps> = ({ products, currentUser, onSaleComplete }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showTrocaModal, setShowTrocaModal] = useState(false);
  
  // Confirmation Modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingPaymentMethod, setPendingPaymentMethod] = useState<PaymentMethod | 'PARCERIA' | null>(null);

  // CRM & Credit
  const [customers, setCustomers] = useState<Customer[]>(storageService.getCustomers());
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [appliedCredit, setAppliedCredit] = useState(0);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [isRegisteringCustomer, setIsRegisteringCustomer] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({ name: '', phone: '', cpf: '' });
  
  // Troca State
  const [saleSearch, setSaleSearch] = useState('');
  const [foundSale, setFoundSale] = useState<Sale | null>(null);

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.styleCode.toLowerCase().includes(search.toLowerCase()));

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
    c.phone.includes(customerSearch) || 
    c.cpf.includes(customerSearch)
  );

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...product, quantity: 1, originalPrice: product.price }];
    });
  };

  const handleCpfChange = (val: string) => {
    const onlyNums = val.replace(/\D/g, '').slice(0, 11);
    setNewCustomerData({ ...newCustomerData, cpf: onlyNums });
  };

  const handlePhoneChange = (val: string) => {
    const onlyNums = val.replace(/\D/g, '').slice(0, 11);
    setNewCustomerData({ ...newCustomerData, phone: onlyNums });
  };

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const finalTotal = Math.max(0, total - appliedCredit);

  const initiateFinalize = (method: PaymentMethod | 'PARCERIA') => {
    if (cart.length === 0) return alert("A sacola está vazia!");
    
    // VALIDACAO OBRIGATORIA: Vendedora deve selecionar a cliente manualmente
    if (!selectedCustomer) {
      alert("Atenção: Você precisa vincular uma cliente à venda.\n\nCaso ela não queira se identificar, busque e selecione 'Consumidora Não Identificada'.");
      setShowCustomerModal(true);
      return;
    }

    setPendingPaymentMethod(method);
    setShowConfirmModal(true);
  };

  const handleFinalizeSale = () => {
    if (!pendingPaymentMethod || !selectedCustomer) return;

    if (pendingPaymentMethod === 'PARCERIA') {
      const giftRecord: Gift = {
        id: `BR-${Date.now()}`,
        date: new Date().toISOString(),
        influencerName: selectedCustomer.name,
        authorizedBy: currentUser.name,
        items: cart,
        totalValue: total
      };
      storageService.createGift(giftRecord);
    } else {
      const sale: Sale = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        sellerId: currentUser.id,
        sellerName: currentUser.name,
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        items: cart.map(item => ({ productId: item.id, productName: item.name, quantity: item.quantity, priceAtSale: item.price, size: item.size, color: item.color })),
        total: finalTotal,
        paymentMethod: pendingPaymentMethod as PaymentMethod,
        exchangeCreditUsed: appliedCredit
      };
      storageService.createSale(sale);
    }

    setShowConfirmModal(false);
    setShowSuccess(true);
    setCart([]);
    setSelectedCustomer(null);
    setAppliedCredit(0);
    setPendingPaymentMethod(null);
    onSaleComplete();
  };

  const handleQuickRegister = () => {
    if (!newCustomerData.name || newCustomerData.phone.length < 10 || newCustomerData.cpf.length !== 11) {
      return alert("Erro: Verifique se o Nome está preenchido e se o CPF tem 11 números.");
    }
    try {
      const c: Customer = {
        id: Date.now().toString(),
        name: newCustomerData.name,
        phone: newCustomerData.phone,
        cpf: newCustomerData.cpf,
        totalSpent: 0,
        createdAt: new Date().toISOString(),
        registeredBy: currentUser.name
      };
      storageService.saveCustomer(c);
      setCustomers(storageService.getCustomers());
      setSelectedCustomer(c);
      setIsRegisteringCustomer(false);
      setShowCustomerModal(false);
      setNewCustomerData({ name: '', phone: '', cpf: '' });
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleSearchSale = () => {
    const sales = storageService.getSales();
    const s = sales.find(x => x.id === saleSearch || (x.customerName && x.customerName.includes(saleSearch)));
    setFoundSale(s || null);
  };

  const processTrocaItem = (item: any) => {
    const exchange: ExchangeRecord = {
      id: `EX-${Date.now()}`,
      date: new Date().toISOString(),
      originalSaleId: foundSale!.id,
      customerName: foundSale!.customerName || 'Consumidora Não Identificada',
      returnedItems: [item],
      creditAmount: item.priceAtSale,
      status: 'DISPONIVEL'
    };
    storageService.createExchange(exchange);
    setAppliedCredit(prev => prev + item.priceAtSale);
    setShowTrocaModal(false);
    setFoundSale(null);
    setSaleSearch('');
    alert(`Crédito de R$ ${item.priceAtSale.toFixed(2)} aplicado à sacola.`);
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-8rem)] gap-6">
      <div className="flex-1 flex flex-col min-h-0 bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input type="text" placeholder="Buscar roupas ou SKU..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary-100 outline-none font-bold" />
          </div>
          <button onClick={() => setShowTrocaModal(true)} className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase flex items-center gap-2 hover:bg-black transition-all">
            <RefreshCcw size={16} /> Troca
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 md:grid-cols-4 gap-4 no-scrollbar">
          {filteredProducts.map(product => (
            <div key={product.id} onClick={() => addToCart(product)} className="bg-white border-2 border-gray-50 rounded-[32px] p-4 hover:border-primary-100 transition-all cursor-pointer group">
               <div className="aspect-square bg-gray-50 rounded-[24px] mb-3 overflow-hidden relative">
                  {product.imageUrl ? <img src={product.imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-200"><ShoppingBag /></div>}
                  <div className="absolute bottom-2 right-2 bg-white/90 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase">{product.size}</div>
               </div>
               <h4 className="font-bold text-slate-900 text-sm mb-1 line-clamp-1">{product.name}</h4>
               <p className="text-primary-600 font-black text-sm">R$ {product.price.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full lg:w-[400px] bg-white rounded-[40px] shadow-sm border border-gray-100 flex flex-col">
        <div className="p-8 border-b border-gray-100">
           <div className="flex justify-between items-center mb-2">
              <h3 className="font-serif font-black text-2xl">Sacola</h3>
              <button onClick={() => { setIsRegisteringCustomer(false); setShowCustomerModal(true); }} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${selectedCustomer ? 'bg-emerald-100 text-emerald-700' : 'bg-red-50 text-red-600 border border-red-100 animate-pulse'}`}>
                {selectedCustomer ? <UserCheck size={14} /> : <UserX size={14} />}
                {selectedCustomer ? selectedCustomer.name.split(' ')[0] : 'Vincular Cliente *'}
              </button>
           </div>
           {selectedCustomer ? (
             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">IDENTIFICADA: {selectedCustomer.name}</p>
           ) : (
             <p className="text-[10px] font-black text-red-500 uppercase tracking-tighter flex items-center gap-1"><AlertCircle size={10} /> SELEÇÃO OBRIGATÓRIA</p>
           )}
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-4 no-scrollbar">
          {cart.map(item => (
            <div key={item.id} className="flex gap-4 group">
               <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center font-black text-xs border border-gray-100">{item.size}</div>
               <div className="flex-1">
                  <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{item.name}</h4>
                  <p className="text-xs text-gray-400 font-bold">{item.quantity}x R$ {item.price.toFixed(2)}</p>
               </div>
               <button onClick={() => setCart(cart.filter(c => c.id !== item.id))} className="text-gray-300 hover:text-red-500 transition-all"><X size={18}/></button>
            </div>
          ))}
          {cart.length === 0 && <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-4"><ShoppingBag size={48} /><p className="font-black text-xs uppercase tracking-widest">Sacola Vazia</p></div>}
        </div>

        <div className="p-8 bg-slate-900 rounded-b-[40px] text-white">
          <div className="space-y-2 mb-6 border-b border-white/10 pb-6">
             <div className="flex justify-between text-slate-400 text-xs font-bold uppercase"><span>Subtotal</span><span>R$ {total.toFixed(2)}</span></div>
             {appliedCredit > 0 && <div className="flex justify-between text-emerald-400 text-xs font-black uppercase"><span>Crédito de Troca</span><span>- R$ {appliedCredit.toFixed(2)}</span></div>}
             <div className="flex justify-between items-end"><span className="text-white font-black uppercase text-sm">Total</span><span className="text-4xl font-black">R$ {finalTotal.toFixed(2)}</span></div>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
             <PaymentBtn label="DINHEIRO" icon={Banknote} onClick={() => initiateFinalize('DINHEIRO')} />
             <PaymentBtn label="PIX" icon={Smartphone} onClick={() => initiateFinalize('PIX')} />
             <PaymentBtn label="CARTÃO" icon={CreditCard} onClick={() => initiateFinalize('CARTAO')} />
             <PaymentBtn label="CARNÊ" icon={History} onClick={() => initiateFinalize('CREDITO_LOJA')} />
             <button onClick={() => initiateFinalize('PARCERIA')} className="col-span-2 flex flex-col items-center justify-center gap-1 p-3 bg-amber-500 hover:bg-amber-600 rounded-2xl transition-all border border-white/5 text-slate-900 shadow-lg shadow-amber-900/20">
                <Star size={18} fill="currentColor" />
                <span className="text-[8px] font-black uppercase tracking-tighter">PARCERIA / BLOGUEIRA</span>
             </button>
          </div>
        </div>
      </div>

      {/* Sale Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
           <div className="bg-white rounded-[40px] p-10 w-full max-w-sm shadow-2xl text-center">
              <div className="w-20 h-20 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-6">
                 <ShoppingBag size={32} />
              </div>
              <h3 className="text-2xl font-black font-serif mb-2">Confirmar Venda?</h3>
              <p className="text-gray-500 font-medium mb-4 text-sm">
                Cliente: <span className="text-slate-900 font-black">{selectedCustomer?.name}</span>
              </p>
              
              <div className="bg-gray-50 rounded-3xl p-6 mb-8 text-left">
                 <div className="flex justify-between mb-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase">Pagamento via</span>
                    <span className="text-xs font-bold">{pendingPaymentMethod}</span>
                 </div>
                 <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black text-gray-400 uppercase">Valor Final</span>
                    <span className="text-2xl font-black text-slate-900">
                      {pendingPaymentMethod === 'PARCERIA' ? 'R$ 0,00' : `R$ ${finalTotal.toFixed(2)}`}
                    </span>
                 </div>
              </div>

              <div className="space-y-3">
                 <button onClick={handleFinalizeSale} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-slate-200 uppercase tracking-widest">Confirmar Venda</button>
                 <button onClick={() => { setShowConfirmModal(false); setPendingPaymentMethod(null); }} className="w-full py-4 text-gray-400 font-bold uppercase text-xs">Cancelar e Voltar</button>
              </div>
           </div>
        </div>
      )}

      {/* Customer Modal & Search */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[40px] p-8 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-2xl font-black font-serif">{isRegisteringCustomer ? 'Vincular Nova Cliente' : 'Buscar Cliente'}</h3>
               <button onClick={() => setShowCustomerModal(false)}><X size={24}/></button>
            </div>

            {isRegisteringCustomer ? (
              <div className="space-y-4">
                 <input type="text" placeholder="Nome Completo" className="w-full bg-gray-50 p-4 rounded-2xl border-none font-bold outline-none" value={newCustomerData.name} onChange={e => setNewCustomerData({...newCustomerData, name: e.target.value})} />
                 <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                       <input type="text" maxLength={11} placeholder="WhatsApp" className="w-full bg-gray-50 p-4 rounded-2xl border-none font-bold outline-none" value={newCustomerData.phone} onChange={e => handlePhoneChange(e.target.value)} />
                       <span className="absolute right-3 bottom-1 text-[8px] text-gray-400 font-black">{newCustomerData.phone.length}/11</span>
                    </div>
                    <div className="relative">
                       <input type="text" maxLength={11} placeholder="CPF" className="w-full bg-gray-50 p-4 rounded-2xl border-none font-bold outline-none" value={newCustomerData.cpf} onChange={e => handleCpfChange(e.target.value)} />
                       <span className="absolute right-3 bottom-1 text-[8px] text-gray-400 font-black">{newCustomerData.cpf.length}/11</span>
                    </div>
                 </div>
                 <div className="bg-amber-50 p-3 rounded-xl flex gap-2">
                    <Fingerprint size={16} className="text-amber-600 shrink-0" />
                    <p className="text-[10px] text-amber-800 font-bold uppercase leading-tight">CPF deve ter 11 dígitos para habilitar o salvamento.</p>
                 </div>
                 <button onClick={handleQuickRegister} disabled={newCustomerData.cpf.length !== 11} className={`w-full py-4 rounded-2xl font-black shadow-lg transition-all ${newCustomerData.cpf.length === 11 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-400'}`}>Salvar e Vincular</button>
                 <button onClick={() => setIsRegisteringCustomer(false)} className="w-full py-2 text-xs font-bold text-gray-400 uppercase">Voltar para busca</button>
              </div>
            ) : (
              <div className="space-y-4">
                 <input type="text" placeholder="Busque por 'Não Identificada' ou Nome..." value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} className="w-full bg-gray-50 p-4 rounded-2xl border-none font-bold outline-none focus:ring-2 focus:ring-primary-100" />
                 <div className="max-h-60 overflow-y-auto space-y-2 no-scrollbar">
                    {filteredCustomers.map(c => (
                      <button key={c.id} onClick={() => { setSelectedCustomer(c); setShowCustomerModal(false); }} className={`w-full p-4 rounded-2xl transition-all text-left ${c.name === 'Consumidora Não Identificada' ? 'bg-gray-100 border-2 border-slate-200' : 'bg-gray-50 hover:bg-primary-50'}`}>
                         <p className="font-black text-slate-900">{c.name}</p>
                         <p className="text-[10px] text-gray-400 font-bold uppercase">{c.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")} • {c.phone}</p>
                      </button>
                    ))}
                 </div>
                 <button onClick={() => setIsRegisteringCustomer(true)} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl shadow-slate-200">
                    <UserPlus size={18} /> Cadastrar Nova Cliente
                 </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals: Troca & Success */}
      {showTrocaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[40px] p-8 w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black font-serif">Processar Troca</h3>
              <button onClick={() => setShowTrocaModal(false)}><X size={24} className="text-gray-400" /></button>
            </div>
            <div className="flex gap-2 mb-6">
               <input type="text" placeholder="ID da venda ou nome da cliente..." value={saleSearch} onChange={e => setSaleSearch(e.target.value)} className="flex-1 bg-gray-50 border-none rounded-2xl p-4 font-bold outline-none" />
               <button onClick={handleSearchSale} className="bg-slate-900 text-white p-4 rounded-2xl"><Search size={20} /></button>
            </div>
            {foundSale ? (
              <div className="bg-gray-50 p-6 rounded-[32px] space-y-4 max-h-[400px] overflow-y-auto no-scrollbar">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Venda #{foundSale.id}</p>
                 <div className="space-y-2">
                    {foundSale.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm">
                         <div>
                            <p className="font-black text-slate-900 text-sm">{item.productName}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">{item.size} • R$ {item.priceAtSale.toFixed(2)}</p>
                         </div>
                         <button onClick={() => processTrocaItem(item)} className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase">Trocar</button>
                      </div>
                    ))}
                 </div>
              </div>
            ) : <div className="py-12 text-center text-gray-300 font-black uppercase text-xs tracking-widest">Busque uma venda para iniciar</div>}
          </div>
        </div>
      )}

      {showSuccess && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-emerald-500/90 backdrop-blur-md">
           <div className="text-center text-white">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle size={64} /></div>
              <h2 className="text-4xl font-black font-serif mb-4">Venda Concluída!</h2>
              <button onClick={() => setShowSuccess(false)} className="bg-slate-900 text-white px-12 py-5 rounded-3xl font-black text-lg shadow-xl uppercase tracking-widest">Próxima Venda</button>
           </div>
        </div>
      )}
    </div>
  );
};

const PaymentBtn = ({ label, icon: Icon, onClick }: any) => (
  <button onClick={onClick} className="flex flex-col items-center justify-center gap-1 p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all border border-white/5">
    <Icon size={18} /><span className="text-[8px] font-black uppercase tracking-tighter">{label}</span>
  </button>
);