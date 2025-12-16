import React, { useState, useMemo } from 'react';
import { Product, CartItem, Sale, User, Gift, DailyClosure, PaymentMethod, CashAdjustment } from '../types';
import { Search, Plus, Minus, ShoppingBag, CheckCircle, Edit3, Gift as GiftIcon, Archive, X, AlertCircle, CreditCard, Banknote, Smartphone, AlertTriangle } from 'lucide-react';
import { storageService } from '../services/storage.ts';

interface POSProps {
  products: Product[];
  currentUser: User;
  onSaleComplete: () => void;
}

export const POS: React.FC<POSProps> = ({ products, currentUser, onSaleComplete }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [showSuccess, setShowSuccess] = useState(false);

  // Modals state
  const [editPriceItem, setEditPriceItem] = useState<{id: string, currentPrice: number, originalPrice: number} | null>(null);
  const [priceReason, setPriceReason] = useState('');
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [showCloseRegisterModal, setShowCloseRegisterModal] = useState(false);
  
  // Payment State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [paymentDetails, setPaymentDetails] = useState('');

  // Adjustment (Furo/Sobra) State
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [adjType, setAdjType] = useState<'SOBRA' | 'FALTA'>('FALTA');
  const [adjAmount, setAdjAmount] = useState('');
  const [adjJustification, setAdjJustification] = useState('');
  
  // Gift Form
  const [giftForm, setGiftForm] = useState({ influencer: '', authorizer: '' });

  const categories = ['Todos', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
      return matchesSearch && matchesCategory && p.stock > 0;
    });
  }, [products, search, selectedCategory]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { 
        ...product, 
        quantity: 1, 
        originalPrice: product.price,
        priceNote: '' 
      }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        const product = products.find(p => p.id === id);
        if (newQty <= 0) return item; 
        if (product && newQty > product.stock) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  // --- Price Override Logic ---
  const handlePriceClick = (item: CartItem) => {
    setEditPriceItem({ id: item.id, currentPrice: item.price, originalPrice: item.originalPrice });
    setPriceReason(item.priceNote || '');
  };

  const savePriceChange = () => {
    if (!editPriceItem) return;
    
    // Validate: if price changed, reason is required
    if (editPriceItem.currentPrice !== editPriceItem.originalPrice && !priceReason.trim()) {
      alert("Por favor, explique o motivo da alteração de preço.");
      return;
    }

    setCart(prev => prev.map(item => {
      if (item.id === editPriceItem.id) {
        return { 
          ...item, 
          price: editPriceItem.currentPrice,
          priceNote: priceReason 
        };
      }
      return item;
    }));
    setEditPriceItem(null);
    setPriceReason('');
  };

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const totalOriginal = cart.reduce((acc, item) => acc + (item.originalPrice * item.quantity), 0);

  // --- Payment & Checkout Logic ---
  const handleInitiateCheckout = () => {
    if (cart.length === 0) return;
    setPaymentMethod(null);
    setPaymentDetails('');
    setShowPaymentModal(true);
  };

  const handleFinalizeSale = () => {
    if (!paymentMethod) {
      alert("Selecione uma forma de pagamento.");
      return;
    }

    // Specific validation based on method
    if (paymentMethod === 'CARTAO' && !paymentDetails) {
      if (!window.confirm("Deseja finalizar sem especificar qual maquininha?")) return;
    }
    if (paymentMethod === 'PIX' && !paymentDetails) {
      if (!window.confirm("Deseja finalizar sem informar o nome do pagador no PIX?")) return;
    }

    const sale: Sale = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      sellerId: currentUser.id,
      sellerName: currentUser.name,
      items: cart.map(item => ({
        productId: item.id,
        productName: item.name,
        quantity: item.quantity,
        priceAtSale: item.price,
        note: item.priceNote
      })),
      total: total,
      paymentMethod: paymentMethod,
      paymentDetails: paymentDetails
    };

    storageService.createSale(sale);
    setShowPaymentModal(false);
    setShowSuccess(true);
    setCart([]);
    onSaleComplete();
    setTimeout(() => setShowSuccess(false), 3000);
  };

  // --- Adjustment / Furo Logic ---
  const handleSaveAdjustment = () => {
    if (!adjAmount || !adjJustification) {
      alert("Preencha o valor e a justificativa.");
      return;
    }

    const adjustment: CashAdjustment = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      type: adjType,
      amount: parseFloat(adjAmount),
      justification: adjJustification,
      performedBy: currentUser.name
    };

    storageService.createAdjustment(adjustment);
    setShowAdjustmentModal(false);
    setAdjAmount('');
    setAdjJustification('');
    alert("Ajuste registrado com sucesso no histórico.");
  };

  // --- Gift / Blogueira Logic ---
  const handleGiftCheckout = () => {
    if (cart.length === 0 || !giftForm.influencer || !giftForm.authorizer) {
      alert("Preencha todos os campos da parceria.");
      return;
    }

    const gift: Gift = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      influencerName: giftForm.influencer,
      authorizedBy: giftForm.authorizer,
      items: cart,
      totalValue: totalOriginal // The value we "lost"
    };

    storageService.createGift(gift);
    setShowGiftModal(false);
    setCart([]);
    setGiftForm({ influencer: '', authorizer: '' });
    onSaleComplete();
    alert("Saída de parceria registrada com sucesso!");
  };

  // --- Close Register Logic ---
  const getDailyStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const sales = storageService.getSales().filter(s => s.date.startsWith(today));
    const gifts = storageService.getGifts().filter(g => g.date.startsWith(today));
    const adjustments = storageService.getAdjustments().filter(a => a.date.startsWith(today));

    const breakdown: Record<string, number> = {
      'DINHEIRO': 0, 'PIX': 0, 'CARTAO': 0, 'OUTRO': 0, 'CREDITO_LOJA': 0
    };

    sales.forEach(s => {
      const method = s.paymentMethod || 'OUTRO';
      breakdown[method] = (breakdown[method] || 0) + s.total;
    });

    const adjustmentsTotal = adjustments.reduce((acc, adj) => {
      return acc + (adj.type === 'SOBRA' ? adj.amount : -adj.amount);
    }, 0);

    return {
      salesTotal: sales.reduce((acc, s) => acc + s.total, 0),
      salesCount: sales.length,
      giftsTotal: gifts.reduce((acc, g) => acc + g.totalValue, 0),
      giftsCount: gifts.length,
      paymentBreakdown: breakdown,
      adjustments,
      adjustmentsTotal
    };
  };

  const handleCloseRegister = () => {
    const stats = getDailyStats();
    
    // Type conversion for Record<string, number> to Record<PaymentMethod, number>
    // In a real app we'd be more strict, but for this mock it's safe-ish
    const typedBreakdown = stats.paymentBreakdown as Record<PaymentMethod, number>;

    const closure: DailyClosure = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      closedBy: currentUser.name,
      totalSales: stats.salesTotal,
      totalGifts: stats.giftsTotal,
      salesCount: stats.salesCount,
      giftsCount: stats.giftsCount,
      adjustmentsTotal: stats.adjustmentsTotal,
      paymentBreakdown: typedBreakdown
    };

    storageService.createClosure(closure);
    setShowCloseRegisterModal(false);
    alert(`Caixa fechado com sucesso!\nTotal em Vendas: R$ ${stats.salesTotal.toFixed(2)}`);
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-8rem)] gap-6">
      {/* Product Grid */}
      <div className="flex-1 flex flex-col min-h-0 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Search & Filters */}
        <div className="p-4 border-b border-gray-100 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Buscar produtos..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 bg-white"
          >
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map(product => {
            const isLowStock = product.stock < 5;
            return (
              <div 
                key={product.id} 
                onClick={() => addToCart(product)}
                className={`group border rounded-xl p-3 transition-all cursor-pointer flex flex-col ${
                  isLowStock 
                    ? 'border-red-200 bg-red-50 hover:border-red-400 hover:shadow-red-100' 
                    : 'border-gray-100 bg-white hover:border-primary-300 hover:shadow-md'
                }`}
              >
                <div className="aspect-square bg-gray-50 rounded-lg mb-3 flex items-center justify-center text-gray-300 relative overflow-hidden">
                  {product.imageUrl ? (
                     <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <ShoppingBag size={32} />
                  )}
                  {isLowStock && (
                     <div className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full shadow-sm animate-pulse">
                        <AlertCircle size={12} />
                     </div>
                  )}
                  <div className="absolute inset-0 bg-primary-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                     <Plus className="text-primary-700 bg-white rounded-full p-1 w-8 h-8 shadow-sm" />
                  </div>
                </div>
                <h4 className="font-medium text-gray-800 text-sm line-clamp-2 mb-1">{product.name}</h4>
                <div className="mt-auto flex justify-between items-center">
                  <span className="font-bold text-primary-600">R$ {product.price.toFixed(2)}</span>
                  <div className={`flex flex-col items-end ${isLowStock ? 'text-red-600' : 'text-gray-400'}`}>
                     <span className="text-xs">{isLowStock ? 'Últimas Peças' : `Est: ${product.stock}`}</span>
                     {isLowStock && <span className="text-[10px] font-bold">Restam {product.stock}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="w-full lg:w-96 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-0">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <h2 className="font-serif font-bold text-lg text-gray-800">Carrinho</h2>
            <span className="bg-primary-100 text-primary-700 text-xs px-2 py-0.5 rounded-full font-bold">{cart.length}</span>
          </div>
          <div className="flex gap-2">
             <button 
               onClick={() => setShowAdjustmentModal(true)} 
               className="text-xs bg-orange-100 text-orange-700 border border-orange-200 px-3 py-1.5 rounded-lg hover:bg-orange-200 font-medium transition-colors"
               title="Registrar furo ou sobra de caixa"
             >
               Ajuste
             </button>
             <button 
               onClick={() => setShowCloseRegisterModal(true)} 
               className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-black font-medium transition-colors"
             >
               Fechar Caixa
             </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.map(item => (
            <div key={item.id} className="flex gap-3 relative group">
              <div className="w-16 h-16 bg-gray-50 rounded-lg flex-shrink-0 flex items-center justify-center">
                <ShoppingBag size={20} className="text-gray-300" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 truncate">{item.name}</h4>
                <div className="text-xs text-gray-500 mb-2">{item.size} • {item.color}</div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-1 py-0.5">
                    <button onClick={() => item.quantity > 1 ? updateQuantity(item.id, -1) : removeFromCart(item.id)} className="p-1 hover:text-primary-600">
                      <Minus size={14} />
                    </button>
                    <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:text-primary-600">
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="flex flex-col items-end">
                    <button 
                       onClick={() => handlePriceClick(item)}
                       className="flex items-center gap-1 font-semibold text-gray-900 hover:text-primary-600 transition-colors"
                       title="Clique para alterar preço"
                    >
                      <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                      <Edit3 size={12} className="opacity-0 group-hover:opacity-100" />
                    </button>
                    {item.price !== item.originalPrice && (
                       <span className="text-[10px] text-orange-500 font-medium">Preço alterado</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {cart.length === 0 && !showSuccess && (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
              <ShoppingBag size={40} className="opacity-20" />
              <p className="text-sm">Carrinho vazio</p>
            </div>
          )}
          {showSuccess && (
            <div className="h-full flex flex-col items-center justify-center text-emerald-500 animate-in fade-in zoom-in duration-300">
              <CheckCircle size={64} className="mb-4" />
              <p className="font-semibold text-lg">Venda Realizada!</p>
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-100 rounded-b-2xl space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Total</span>
            <span className="text-2xl font-bold text-gray-900">R$ {total.toFixed(2)}</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
             <button 
              onClick={() => setShowGiftModal(true)}
              disabled={cart.length === 0}
              className="col-span-1 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-xl flex items-center justify-center disabled:opacity-50"
              title="Saída Blogueira/Parceria"
            >
              <GiftIcon size={20} />
            </button>
            <button 
              onClick={handleInitiateCheckout}
              disabled={cart.length === 0}
              className="col-span-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white font-medium py-3 rounded-xl transition-colors shadow-lg shadow-primary-200"
            >
              Finalizar Venda
            </button>
          </div>
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* Payment Selection Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-xl text-gray-900 font-serif">Forma de Pagamento</h3>
              <button onClick={() => setShowPaymentModal(false)}><X size={24} className="text-gray-400" /></button>
            </div>

            <div className="text-center mb-6">
              <span className="text-sm text-gray-500 uppercase tracking-wide">Valor a Receber</span>
              <div className="text-4xl font-bold text-primary-600 mt-1">R$ {total.toFixed(2)}</div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              <button 
                onClick={() => setPaymentMethod('DINHEIRO')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${paymentMethod === 'DINHEIRO' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-100 text-gray-500 hover:bg-gray-50'}`}
              >
                <Banknote size={24} className="mb-2" />
                <span className="text-xs font-bold">Dinheiro</span>
              </button>
              <button 
                onClick={() => setPaymentMethod('PIX')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${paymentMethod === 'PIX' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-100 text-gray-500 hover:bg-gray-50'}`}
              >
                <Smartphone size={24} className="mb-2" />
                <span className="text-xs font-bold">Pix</span>
              </button>
              <button 
                onClick={() => setPaymentMethod('CARTAO')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${paymentMethod === 'CARTAO' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-100 text-gray-500 hover:bg-gray-50'}`}
              >
                <CreditCard size={24} className="mb-2" />
                <span className="text-xs font-bold">Cartão</span>
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Detalhes (Obrigatório para auditoria)</label>
              <textarea 
                className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                rows={3}
                placeholder={
                  paymentMethod === 'CARTAO' ? "Ex: Maquininha Stone, Débito..." :
                  paymentMethod === 'PIX' ? "Ex: Nome de quem fez o Pix..." :
                  "Observações gerais..."
                }
                value={paymentDetails}
                onChange={e => setPaymentDetails(e.target.value)}
              ></textarea>
            </div>

            <button 
              onClick={handleFinalizeSale}
              className="w-full bg-primary-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-primary-200 hover:bg-primary-700 transition-transform active:scale-95"
            >
              Confirmar Recebimento
            </button>
          </div>
        </div>
      )}

      {/* Adjustment (Furo/Sobra) Modal */}
      {showAdjustmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 border-t-4 border-orange-500">
            <div className="flex items-center gap-3 mb-4 text-orange-700">
               <AlertTriangle size={24} />
               <h3 className="font-bold text-lg">Ajuste de Caixa</h3>
            </div>
            
            <p className="text-sm text-gray-500 mb-4">
              Use esta opção para registrar sangrias, suprimentos, sobras ou faltas (furos) de caixa. Isso ficará registrado na auditoria.
            </p>

            <div className="space-y-4">
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button 
                  onClick={() => setAdjType('FALTA')}
                  className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${adjType === 'FALTA' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500'}`}
                >
                  Saída / Falta (-)
                </button>
                <button 
                  onClick={() => setAdjType('SOBRA')}
                  className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${adjType === 'SOBRA' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500'}`}
                >
                  Entrada / Sobra (+)
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
                <input 
                  type="number" 
                  className="w-full border border-gray-300 rounded-lg p-2"
                  placeholder="0.00"
                  value={adjAmount}
                  onChange={e => setAdjAmount(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Justificativa Completa</label>
                <textarea 
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                  rows={3}
                  placeholder="Ex: Pagamento de taxa de entrega, troco errado..."
                  value={adjJustification}
                  onChange={e => setAdjJustification(e.target.value)}
                ></textarea>
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowAdjustmentModal(false)} className="flex-1 py-2 text-gray-600">Cancelar</button>
                <button onClick={handleSaveAdjustment} className="flex-1 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium">Registrar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Price Edit Modal */}
      {editPriceItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="font-bold text-lg mb-4">Alterar Preço</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Novo Preço Unitário</label>
                <input 
                  type="number" 
                  className="w-full border p-2 rounded-lg"
                  value={editPriceItem.currentPrice}
                  onChange={e => setEditPriceItem({...editPriceItem, currentPrice: parseFloat(e.target.value)})}
                />
              </div>
              {editPriceItem.currentPrice !== editPriceItem.originalPrice && (
                <div>
                   <label className="block text-sm text-gray-600 mb-1">Motivo da alteração (Obrigatório)</label>
                   <textarea 
                      className="w-full border p-2 rounded-lg text-sm"
                      placeholder="Ex: Peça com defeito, Desconto especial..."
                      value={priceReason}
                      onChange={e => setPriceReason(e.target.value)}
                   ></textarea>
                </div>
              )}
              <div className="flex gap-2 justify-end pt-2">
                <button onClick={() => setEditPriceItem(null)} className="px-4 py-2 text-gray-600">Cancelar</button>
                <button onClick={savePriceChange} className="px-4 py-2 bg-primary-600 text-white rounded-lg">Salvar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gift / Blogueira Modal */}
      {showGiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
               <div className="flex items-center gap-2 text-purple-700">
                 <GiftIcon size={24} />
                 <h3 className="font-bold text-lg">Saída Promocional / Parceria</h3>
               </div>
               <button onClick={() => setShowGiftModal(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg text-sm text-purple-800 mb-4">
              Esta ação removerá os itens do estoque <strong>sem gerar receita</strong> no caixa. Use para registrar entregas a blogueiras ou brindes.
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Blogueira / Parceiro</label>
                <input 
                  type="text" 
                  className="w-full border border-gray-300 rounded-lg p-2"
                  placeholder="Ex: @blogueira.famosa"
                  value={giftForm.influencer}
                  onChange={e => setGiftForm({...giftForm, influencer: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Autorizado por</label>
                <input 
                  type="text" 
                  className="w-full border border-gray-300 rounded-lg p-2"
                  placeholder="Ex: Gerente Maria"
                  value={giftForm.authorizer}
                  onChange={e => setGiftForm({...giftForm, authorizer: e.target.value})}
                />
              </div>

              <div className="pt-2 border-t border-gray-100">
                <p className="text-sm text-gray-500 mb-1">Valor Total dos Produtos (Custo Venda)</p>
                <p className="text-xl font-bold text-gray-900">R$ {totalOriginal.toFixed(2)}</p>
              </div>

              <button 
                onClick={handleGiftCheckout} 
                className="w-full bg-purple-600 text-white py-3 rounded-xl hover:bg-purple-700 font-medium"
              >
                Confirmar Saída
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close Register Modal */}
      {showCloseRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
           <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center gap-3 mb-6 text-gray-800">
                <Archive size={24} />
                <h3 className="font-bold text-xl font-serif">Fechar Caixa do Dia</h3>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="p-4 bg-gray-50 rounded-xl space-y-3">
                   <h4 className="font-bold text-gray-700 text-sm uppercase">Resumo Financeiro</h4>
                   
                   {/* Detailed Breakdown */}
                   <div className="space-y-2 text-sm border-b border-gray-200 pb-2 mb-2">
                     <div className="flex justify-between">
                       <span className="text-gray-500">Dinheiro</span>
                       <span className="font-medium">R$ {getDailyStats().paymentBreakdown.DINHEIRO.toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-gray-500">Pix</span>
                       <span className="font-medium">R$ {getDailyStats().paymentBreakdown.PIX.toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-gray-500">Cartão</span>
                       <span className="font-medium">R$ {getDailyStats().paymentBreakdown.CARTAO.toFixed(2)}</span>
                     </div>
                   </div>

                   <div className="flex justify-between items-center pt-1">
                     <span className="text-gray-800 font-bold">Total Vendas</span>
                     <span className="text-green-600 font-bold text-lg">R$ {getDailyStats().salesTotal.toFixed(2)}</span>
                   </div>
                </div>

                {/* Adjustments Section */}
                <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                   <div className="flex justify-between items-center mb-2">
                      <h4 className="font-bold text-orange-800 text-sm uppercase">Ocorrências de Caixa</h4>
                      <span className={`font-bold text-sm ${getDailyStats().adjustmentsTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {getDailyStats().adjustmentsTotal >= 0 ? '+' : ''} R$ {getDailyStats().adjustmentsTotal.toFixed(2)}
                      </span>
                   </div>
                   <div className="space-y-2 text-xs text-orange-800">
                     {getDailyStats().adjustments.map(adj => (
                       <div key={adj.id} className="flex justify-between">
                         <span>{adj.type === 'SOBRA' ? '(+)' : '(-)'} {adj.justification}</span>
                         <span>R$ {adj.amount.toFixed(2)}</span>
                       </div>
                     ))}
                     {getDailyStats().adjustments.length === 0 && <span className="opacity-50 italic">Nenhum ajuste hoje.</span>}
                   </div>
                </div>

                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                   <span className="text-purple-800 text-sm">Saídas Brindes (Furo Justificado)</span>
                   <span className="text-purple-900 font-bold text-lg">R$ {getDailyStats().giftsTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setShowCloseRegisterModal(false)} className="flex-1 py-3 text-gray-600 hover:bg-gray-100 rounded-lg font-medium">Voltar</button>
                <button onClick={handleCloseRegister} className="flex-1 py-3 bg-gray-900 text-white rounded-lg hover:bg-black font-medium shadow-md">Confirmar Fechamento</button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};