import React, { useState } from 'react';
import { Product, User, UserRole } from '../types';
import { storageService } from '../services/storage.ts';
import { geminiService } from '../services/geminiService.ts';
import { Search, Plus, Edit2, Trash2, X, Sparkles, Loader2, Image as ImageIcon, Upload, AlertTriangle } from 'lucide-react';

interface InventoryProps {
  products: Product[];
  currentUser: User;
  onUpdate: () => void;
}

export const Inventory: React.FC<InventoryProps> = ({ products, currentUser, onUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Form State
  const initialForm = {
    name: '', category: '', price: '', cost: '', stock: '', size: '', color: '', description: '', imageUrl: ''
  };
  const [formData, setFormData] = useState(initialForm);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        category: product.category,
        price: product.price.toString(),
        cost: product.cost.toString(),
        stock: product.stock.toString(),
        size: product.size,
        color: product.color,
        description: product.description || '',
        imageUrl: product.imageUrl || ''
      });
    } else {
      setEditingProduct(null);
      setFormData(initialForm);
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    const newProduct: Product = {
      id: editingProduct ? editingProduct.id : Date.now().toString(),
      name: formData.name,
      category: formData.category,
      price: parseFloat(formData.price) || 0,
      cost: parseFloat(formData.cost) || 0,
      stock: parseInt(formData.stock) || 0,
      size: formData.size,
      color: formData.color,
      description: formData.description,
      imageUrl: formData.imageUrl
    };

    storageService.saveProduct(newProduct);
    onUpdate();
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      storageService.deleteProduct(id);
      onUpdate();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const generateDescription = async () => {
    if (!formData.name || !formData.category) return alert("Preencha nome e categoria primeiro.");
    
    setIsGeneratingAi(true);
    const desc = await geminiService.generateProductDescription(
      formData.name, 
      formData.category, 
      `Cor ${formData.color}, Tamanho ${formData.size}`
    );
    setFormData(prev => ({ ...prev, description: desc }));
    setIsGeneratingAi(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 font-serif">Estoque</h2>
          <p className="text-gray-500">Gerencie seus produtos e inventário.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-xl hover:bg-primary-700 transition-colors"
        >
          <Plus size={20} />
          <span>Novo Produto</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nome ou categoria..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-medium">
              <tr>
                <th className="px-6 py-4">Produto</th>
                <th className="px-6 py-4">Categoria</th>
                <th className="px-6 py-4">Preço</th>
                <th className="px-6 py-4">Estoque</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map(product => {
                const isLowStock = product.stock < 5;
                return (
                  <tr key={product.id} className={`hover:bg-gray-50/50 ${isLowStock ? 'bg-red-50/30' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                           {product.imageUrl ? (
                             <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
                           ) : (
                             <ImageIcon size={16} className="text-gray-400" />
                           )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{product.name}</div>
                          <div className="text-xs text-gray-500">{product.color} - {product.size}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">R$ {product.price.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-start">
                        <span className={`font-bold ${isLowStock ? 'text-red-600' : 'text-gray-600'}`}>
                          {product.stock} un
                        </span>
                        {isLowStock && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full mt-1">
                            <AlertTriangle size={10} />
                            BAIXO ESTOQUE
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleOpenModal(product)} className="p-2 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-primary-50">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(product.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-900">{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2">
                 <label className="block text-sm font-medium text-gray-700 mb-1">Imagem do Produto (Opcional)</label>
                 <div className="flex items-start gap-4">
                   <div className="w-24 h-24 bg-gray-50 border border-gray-200 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 relative group">
                      {formData.imageUrl ? (
                        <>
                          <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                          <button 
                            onClick={() => setFormData(prev => ({...prev, imageUrl: ''}))}
                            className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          >
                            <Trash2 size={20} />
                          </button>
                        </>
                      ) : (
                        <ImageIcon size={32} className="text-gray-300" />
                      )}
                   </div>
                   <div className="flex-1 space-y-3">
                      <div className="relative">
                        <input 
                          type="text" 
                          placeholder="Cole a URL da imagem..." 
                          className="w-full border border-gray-300 rounded-lg p-2 text-sm pl-9"
                          value={formData.imageUrl} 
                          onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                        />
                        <ImageIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 uppercase font-medium">Ou</span>
                        <label className="cursor-pointer flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors">
                          <Upload size={14} />
                          Carregar do dispositivo
                          <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                        </label>
                      </div>
                   </div>
                 </div>
              </div>

              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input type="text" className="w-full border border-gray-300 rounded-lg p-2 focus:ring-primary-500 focus:border-primary-500" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <input type="text" className="w-full border border-gray-300 rounded-lg p-2" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} list="categories"/>
                <datalist id="categories">
                  <option value="Vestidos"/>
                  <option value="Blusas"/>
                  <option value="Calças"/>
                  <option value="Saias"/>
                </datalist>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preço Venda (R$)</label>
                <input type="number" className="w-full border border-gray-300 rounded-lg p-2" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
              </div>

              {currentUser.role === UserRole.ADMIN && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preço Custo (R$)</label>
                  <input type="number" className="w-full border border-gray-300 rounded-lg p-2" value={formData.cost} onChange={e => setFormData({...formData, cost: e.target.value})} />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tamanho</label>
                <input type="text" className="w-full border border-gray-300 rounded-lg p-2" value={formData.size} onChange={e => setFormData({...formData, size: e.target.value})} placeholder="Ex: P, M, 38, 40" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cor</label>
                <input type="text" className="w-full border border-gray-300 rounded-lg p-2" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} />
              </div>
               <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estoque</label>
                <input type="number" className="w-full border border-gray-300 rounded-lg p-2" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
              </div>

              <div className="col-span-2">
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">Descrição</label>
                  <button 
                    onClick={generateDescription}
                    disabled={isGeneratingAi}
                    className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-medium disabled:opacity-50"
                  >
                    {isGeneratingAi ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    Gerar com IA
                  </button>
                </div>
                <textarea 
                  className="w-full border border-gray-300 rounded-lg p-2 h-20 text-sm" 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})}
                ></textarea>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition-colors">Cancelar</button>
              <button onClick={handleSave} className="px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-lg shadow-primary-200">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};