
import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store';
import { Plus, Search, Edit2, Archive, Apple, XCircle, Loader2, ChevronLeft, ChevronRight, Trash2, AlertTriangle, ToggleLeft, ToggleRight } from 'lucide-react';
import { Product } from '../types';

const Products: React.FC = () => {
  const { state, addProduct, updateProduct, deleteProduct } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [idToDelete, setIdToDelete] = useState<string | null>(null);
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
          <h2 className="text-2xl font-black text-gray-800 dark:text-white tracking-tighter">Registro de Productos</h2>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Catálogo e inventario sincronizado</p>
        </div>
        <button 
          onClick={() => { setEditingProduct(null); setShowForm(true); }}
          title="Crear un nuevo producto"
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-2xl font-black shadow-xl shadow-primary-600/30 transition-all hover:scale-105 active:scale-95"
        >
          <Plus size={20} />
          Nuevo Producto
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
           <div className="relative max-w-md">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar producto..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-4 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white font-bold text-sm"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-[10px] font-black uppercase text-gray-400 tracking-widest">
              <tr>
                <th className="px-8 py-6">Producto</th>
                <th className="px-8 py-6">Categoría</th>
                <th className="px-8 py-6">Precio Venta</th>
                <th className="px-8 py-6">Stock</th>
                <th className="px-8 py-6 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {paginatedProducts.length === 0 ? (
                <tr><td colSpan={5} className="px-8 py-20 text-center text-gray-400 font-bold italic uppercase text-xs">No hay registros</td></tr>
              ) : (
                paginatedProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-50 dark:bg-primary-900/20 rounded-xl flex items-center justify-center text-primary-500">
                           <Apple size={20} />
                        </div>
                        <p className={`text-sm font-black uppercase tracking-tight ${product.active ? 'text-gray-900 dark:text-white' : 'text-gray-400 line-through'}`}>{product.name}</p>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-sm font-bold text-gray-800 dark:text-gray-200 uppercase">{product.category}</td>
                    <td className="px-8 py-5 text-sm font-black text-primary-600">{formatMoney(product.price)}</td>
                    <td className="px-8 py-5">
                      <span className={`font-black text-sm ${product.stock < 10 ? 'text-red-500 animate-pulse' : 'text-gray-900 dark:text-white'}`}>
                        {product.stock} {product.unit}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => { setEditingProduct(product); setShowForm(true); }}
                          title="Editar detalles del producto"
                          className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-all"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => updateProduct({ ...product, active: !product.active })}
                          title={product.active ? "Desactivar producto" : "Activar producto"}
                          className={`p-2 rounded-xl transition-all ${product.active ? 'text-red-500 hover:bg-red-50' : 'text-green-500 hover:bg-green-50'}`}
                        >
                          {product.active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                        </button>
                        <button 
                          onClick={() => setIdToDelete(product.id)}
                          title="Eliminar permanentemente"
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all active:scale-90"
                        >
                          <Trash2 size={18} />
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
          <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Pag. {currentPage} / {totalPages}
            </span>
            <div className="flex gap-2">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                title="Página Anterior"
                className="p-3 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 disabled:opacity-50 active:scale-90 transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
                title="Página Siguiente"
                className="p-3 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 disabled:opacity-50 active:scale-90 transition-all"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE ELIMINACIÓN */}
      {idToDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-[2.5rem] shadow-2xl p-10 text-center border border-white/10">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">Confirmar Acción</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-8">
              ¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                type="button"
                onClick={() => { deleteProduct(idToDelete); setIdToDelete(null); }}
                className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-red-600/20 active:scale-95 transition-all"
              >
                Eliminar Registro
              </button>
              <button 
                type="button"
                onClick={() => setIdToDelete(null)}
                className="w-full py-4 bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-300 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-[3rem] shadow-2xl animate-in zoom-in-95 p-10 border border-white/10">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-gray-800 dark:text-white tracking-tighter">{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h3>
              <button type="button" onClick={() => { setShowForm(false); setEditingProduct(null); }} title="Cerrar formulario" className="p-3 text-gray-300 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all">
                <XCircle size={28} />
              </button>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 ml-1 tracking-widest">Nombre del Producto</label>
                <input name="name" defaultValue={editingProduct?.name} required className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white font-black text-sm uppercase shadow-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 ml-1 tracking-widest">Categoría</label>
                  <select name="category" defaultValue={editingProduct?.category} className="w-full px-4 py-4 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none outline-none text-gray-900 dark:text-white font-black text-xs uppercase">
                    <option value="Frutas">Frutas</option>
                    <option value="Frutos Secos">Frutos Secos</option>
                    <option value="Verduras">Verduras</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 ml-1 tracking-widest">Unidad</label>
                  <select name="unit" defaultValue={editingProduct?.unit} className="w-full px-4 py-4 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none outline-none text-gray-900 dark:text-white font-black text-xs uppercase">
                    <option value="Kilos">Kilos</option>
                    <option value="Unidad">Unidad</option>
                    <option value="Caja">Caja</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 ml-1 tracking-widest">Precio Venta (S/)</label>
                  <input name="price" type="number" step="0.01" defaultValue={editingProduct?.price} required className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none outline-none text-gray-900 dark:text-white font-black text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 ml-1 tracking-widest">Stock Inicial</label>
                  <input name="stock" type="number" defaultValue={editingProduct?.stock} required className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none outline-none text-gray-900 dark:text-white font-black text-sm" />
                </div>
              </div>
            </div>
            <div className="mt-10 flex justify-end gap-4">
              <button type="button" onClick={() => { setShowForm(false); setEditingProduct(null); }} className="px-8 py-4 bg-gray-100 rounded-2xl font-black text-[10px] uppercase tracking-widest text-gray-400">Descartar</button>
              <button type="submit" className="px-12 py-4 bg-primary-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary-600/30 transition-all active:scale-95">
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
