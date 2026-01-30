
import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store';
import { Plus, Search, Edit2, Archive, Apple, XCircle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '../types';

const Products: React.FC = () => {
  const { state, addProduct, updateProduct } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const formatMoney = (val: number) => {
    const symbol = state.currency === 'PEN' ? 'S/' : '$';
    const amount = state.currency === 'PEN' ? val : val / state.exchangeRate;
    return `${symbol} ${amount.toFixed(2).replace(',', '.')}`;
  };

  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return state.products.filter(p => 
      p.name.toLowerCase().includes(term) || 
      p.category.toLowerCase().includes(term)
    ).sort((a, b) => {
      const dateA = a.lastUpdate ? new Date(a.lastUpdate).getTime() : 0;
      const dateB = b.lastUpdate ? new Date(b.lastUpdate).getTime() : 0;
      return dateB - dateA;
    });
  }, [state.products, searchTerm]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const formData = new FormData(e.currentTarget);
      const productData: Product = {
        id: editingProduct?.id || Date.now().toString(),
        name: formData.get('name') as string,
        category: formData.get('category') as string,
        unit: formData.get('unit') as any,
        price: Number(formData.get('price')),
        stock: Number(formData.get('stock')),
        active: editingProduct ? editingProduct.active : true,
      };

      if (editingProduct) await updateProduct(productData);
      else await addProduct(productData);
      
      setShowForm(false);
      setEditingProduct(null);
    } catch (err) {
      alert("Error al guardar producto.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-800 dark:text-white">Registro de Productos</h2>
          <p className="text-gray-500 dark:text-gray-400">Catálogo e inventario sincronizado con Supabase</p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-2xl font-bold shadow-xl shadow-primary-600/30 transition-all hover:scale-105"
        >
          <Plus size={20} />
          Nuevo Producto
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
           <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar producto por nombre o categoría..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-[10px] font-black uppercase text-gray-400 tracking-widest">
              <tr>
                <th className="px-6 py-4">Producto</th>
                <th className="px-6 py-4">Categoría</th>
                <th className="px-6 py-4">Precio Venta</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {paginatedProducts.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400 italic">No se encontraron productos</td></tr>
              ) : (
                paginatedProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-50 dark:bg-primary-900/20 rounded-xl flex items-center justify-center text-primary-500">
                           <Apple size={20} />
                        </div>
                        <p className={`text-sm font-bold ${product.active ? 'text-gray-900 dark:text-white' : 'text-gray-400 line-through'}`}>{product.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-gray-200">{product.category}</td>
                    <td className="px-6 py-4 text-sm font-black text-primary-600">{formatMoney(product.price)}</td>
                    <td className="px-6 py-4">
                      <span className={`font-black text-sm ${product.stock < 10 ? 'text-red-500 animate-pulse' : 'text-gray-900 dark:text-white'}`}>
                        {product.stock} {product.unit}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => { setEditingProduct(product); setShowForm(true); }}
                          className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-all"
                          title="Editar Producto"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => updateProduct({ ...product, active: !product.active })}
                          className={`p-2 rounded-xl transition-all ${product.active ? 'text-red-500 hover:bg-red-50' : 'text-green-500 hover:bg-green-50'}`}
                          title={product.active ? "Archivar Producto" : "Restaurar Producto"}
                        >
                          <Archive size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Página {currentPage} de {totalPages}
            </span>
            <div className="flex gap-2">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="p-2 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 disabled:opacity-50 text-gray-600 dark:text-gray-300"
              >
                <ChevronLeft size={18} />
              </button>
              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="p-2 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 disabled:opacity-50 text-gray-600 dark:text-gray-300"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 w-full max-w-md rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 p-8 border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-gray-800 dark:text-white">{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h3>
              <button type="button" disabled={isSaving} onClick={() => { setShowForm(false); setEditingProduct(null); }} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl">
                <XCircle size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase mb-2">Nombre del Producto</label>
                <input name="name" defaultValue={editingProduct?.name} required className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase mb-2">Categoría</label>
                  <select name="category" defaultValue={editingProduct?.category} className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none outline-none text-gray-900 dark:text-white font-bold">
                    <option value="Frutas">Frutas</option>
                    <option value="Frutos Secos">Frutos Secos</option>
                    <option value="Verduras">Verduras</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase mb-2">Unidad</label>
                  <select name="unit" defaultValue={editingProduct?.unit} className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none outline-none text-gray-900 dark:text-white font-bold">
                    <option value="Kilos">Kilos</option>
                    <option value="Unidad">Unidad</option>
                    <option value="Caja">Caja</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase mb-2">Precio Venta (S/)</label>
                  <input name="price" type="number" step="0.01" defaultValue={editingProduct?.price} required className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none outline-none text-gray-900 dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase mb-2">Stock Inicial</label>
                  <input name="stock" type="number" defaultValue={editingProduct?.stock} required className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none outline-none text-gray-900 dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                </div>
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <button type="button" disabled={isSaving} onClick={() => { setShowForm(false); setEditingProduct(null); }} className="px-6 py-3 bg-gray-100 dark:bg-gray-700 rounded-2xl font-bold text-gray-700 dark:text-gray-300">Cancelar</button>
              <button type="submit" disabled={isSaving} className="px-10 py-3 bg-primary-600 text-white rounded-2xl font-black shadow-lg shadow-primary-600/30 flex items-center gap-2">
                {isSaving && <Loader2 className="animate-spin" size={18} />}
                {isSaving ? 'Sincronizando...' : 'Guardar Producto'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Products;
