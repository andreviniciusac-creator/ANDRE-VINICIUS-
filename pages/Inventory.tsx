import React, { useState } from 'react';
import { Product, User, UserRole } from '../types';
import { storageService } from '../services/storage.ts';
import { geminiService } from '../services/geminiService.ts';
import { Search, Plus, Edit2, Trash2, X, Sparkles, Loader2, Image as ImageIcon, Upload, AlertTriangle, Layers } from 'lucide-react';

interface InventoryProps {
  products: Product[];
  currentUser: User;
  onUpdate: () => void;
}

export const Inventory: React.FC<InventoryProps> = ({ products, currentUser, onUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGridMode, setIsGridMode] = useState(false);
  const [search, setSearch] = useState('');
  
  const initialForm = {
    name: '', category: '', price: '', cost: '', size: '', color: '', description: '', imageUrl: '', styleCode: ''
  };
  const [formData, setFormData] = useState(initialForm);
  const [gridVariants, setGridVariants] = useState<{size: string, stock: number}[]>([
    { size: 'P', stock: 0 }, { size: 'M', stock: 0 }, { size: 'G', stock: 0 }, { size: 'GG', stock: 0 }
  ]);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.styleCode.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = () => {
    if (isGridMode) {
      storageService.saveProductGrid(
        { ...formData, price: parseFloat(formData.price), cost: parseFloat(formData.cost) },
        gridVariants.map(v => ({ size: v.size, color: formData.color, stock: v.stock }))
      );
    } else {
      const newProduct: Product = {
        id: Date.now().toString(),
        styleCode: formData.styleCode || `ST${Date.now()}`,
        name: formData.name,
        category: formData.category,
        price: parseFloat(formData.price) || 0,
        cost: parseFloat(formData.cost) || 0,
        stock: 0, 
        size: formData.size,
        color: formData.color,
        description: formData.description,
        imageUrl: formData.imageUrl
      };
      storageService.saveProduct(newProduct);
    }
    onUpdate();
    setIsModalOpen(false);
    setFormData(initialForm);
    setIsGridMode(false);
  };

  const updateGridStock = (size: string, value: string) => {
    setGridVariants(prev => prev.map(v => v.size === size ? { ...v, stock: parseInt(value) || 0 } : v));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 font-serif">Estoque e Grades</h2>
          <p className="text-gray-500 font-medium">Gestão de variantes P/M/G e controle de SKU.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setIsGridMode(true); setIsModalOpen(true); }} className="flex items-center gap-2 bg-slate-900 text-white px-6 py-4 rounded-2xl hover:bg-black transition-all shadow-xl font-black text-sm uppercase">
            <Layers size={18} /> Grade Completa
          </button>
          <button onClick={() => { setIsGridMode(false); setIsModalOpen(true); }} className="flex items-center gap-2 bg-primary-600 text-white px-6 py-4 rounded-2xl hover:bg-primary-700 transition-all shadow-xl font-black text-sm uppercase">
            <Plus size={18} /> Item Único
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-[32px] shadow-sm border border-gray-100">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input type="text" placeholder="Buscar por nome ou SKU..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary-100 outline-none font-bold" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredProducts.map(product => (
          <div key={product.id} className="bg-white rounded-[40px] p-6 border border-gray-100 shadow-sm group hover:shadow-xl transition-all">
             <div className="aspect-square bg-gray-50 rounded-[32px] mb-4 overflow-hidden relative">
                {product.imageUrl ? <img src={product.imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-200"><ImageIcon size={48} /></div>}
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black uppercase text-slate-900">{product.size}</div>
                {product.stock < 3 && <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-[10px] font-black animate-pulse">BAIXO</div>}
             </div>
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{product.category} • SKU: {product.styleCode}</p>
             <h4 className="text-xl font-black text-slate-900 mb-2">{product.name}</h4>
             <div className="flex justify-between items-end">
                <div>
                   <p className="text-primary-600 font-black text-lg">R$ {product.price.toFixed(2)}</p>
                   <p className="text-[10px] font-bold text-gray-400">Estoque: {product.stock} un</p>
                </div>
                <div className="flex gap-2">
                   <button className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:text-primary-600 transition-all"><Edit2 size={16}/></button>
                   <button onClick={() => storageService.deleteProduct(product.id)} className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:text-red-600 transition-all"><Trash2 size={16}/></button>
                </div>
             </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-[40px] w-full max-w-3xl p-8 shadow-2xl my-8">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-900 font-serif">{isGridMode ? 'Cadastrar Grade de Produtos' : 'Cadastrar Item Único'}</h3>
              <button onClick={() => setIsModalOpen(false)}><X size={24} className="text-gray-400" /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-4">
                  <Input label="Referência/SKU" value={formData.styleCode} onChange={v => setFormData({...formData, styleCode: v})} placeholder="Ex: VEST-001" />
                  <Input label="Nome da Peça" value={formData.name} onChange={v => setFormData({...formData, name: v})} placeholder="Ex: Vestido Seda" />
                  <Input label="Categoria" value={formData.category} onChange={v => setFormData({...formData, category: v})} placeholder="Ex: Vestidos" />
                  <div className="grid grid-cols-2 gap-4">
                     <Input label="Preço Venda" value={formData.price} onChange={v => setFormData({...formData, price: v})} type="number" />
                     <Input label="Preço Custo" value={formData.cost} onChange={v => setFormData({...formData, cost: v})} type="number" />
                  </div>
                  <Input label="Cor" value={formData.color} onChange={v => setFormData({...formData, color: v})} placeholder="Ex: Rose" />
               </div>

               <div className="space-y-6">
                  {isGridMode ? (
                    <div className="bg-gray-50 p-6 rounded-[32px] border border-gray-100">
                       <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Quantidade por Tamanho</h4>
                       <div className="space-y-3">
                          {gridVariants.map(v => (
                            <div key={v.size} className="flex items-center justify-between bg-white p-3 rounded-2xl shadow-sm">
                               <span className="font-black text-slate-900 w-8">{v.size}</span>
                               <input type="number" className="w-20 bg-gray-50 border-none rounded-lg p-2 text-center font-bold" value={v.stock} onChange={e => updateGridStock(v.size, e.target.value)} />
                            </div>
                          ))}
                       </div>
                    </div>
                  ) : (
                    <Input label="Tamanho" value={formData.size} onChange={v => setFormData({...formData, size: v})} placeholder="Ex: M" />
                  )}
                  
                  <div className="bg-primary-50 p-6 rounded-[32px]">
                     <div className="flex justify-between mb-2">
                        <span className="text-[10px] font-black text-primary-600 uppercase">Descrição IA</span>
                        <button onClick={async () => {
                           setIsGeneratingAi(true);
                           const d = await geminiService.generateProductDescription(formData.name, formData.category, formData.color);
                           setFormData({...formData, description: d});
                           setIsGeneratingAi(false);
                        }} className="text-[10px] font-black text-primary-600 uppercase flex items-center gap-1">
                          {isGeneratingAi ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12}/>} Sugerir
                        </button>
                     </div>
                     <textarea className="w-full bg-transparent border-none rounded-xl p-0 text-sm font-medium text-primary-900 outline-none resize-none" rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Clique em sugerir para usar a IA..."></textarea>
                  </div>
               </div>
            </div>

            <button onClick={handleSave} className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black text-lg shadow-xl shadow-slate-200 mt-8 hover:bg-black transition-all">
              Salvar Peças no Estoque
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const Input = ({ label, value, onChange, type = 'text', placeholder }: any) => (
  <div>
    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-2">{label}</label>
    <input type={type} className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-slate-900 focus:ring-2 focus:ring-primary-100 outline-none" placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} />
  </div>
);