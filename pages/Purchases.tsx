
import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store';
import { Truck, Plus, Search, Eye, XCircle, Trash2, Loader2, ChevronLeft, ChevronRight, AlertTriangle, Printer, CheckCircle } from 'lucide-react';
import { Purchase, Supplier, Product, PurchaseItem } from '../types';

const Purchases: React.FC = () => {
  const { state, addPurchase, cancelPurchase, deletePurchase } = useStore();
  const [view, setView] = useState<'list' | 'new'>('list');
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [idToDelete, setIdToDelete] = useState<string | null>(null);
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

  const displayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  };

  const filteredPurchases = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return state.purchases.filter(p => 
      p.supplierName.toLowerCase().includes(term) || 
      p.documentNumber.toLowerCase().includes(term)
    ).sort((a, b) => b.date.localeCompare(a.date));
  }, [state.purchases, searchTerm]);

  const totalPages = Math.ceil(filteredPurchases.length / itemsPerPage);
  const paginatedPurchases = filteredPurchases.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-gray-800 dark:text-white tracking-tighter">Abastecimiento</h2>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Registro de ingreso de mercadería</p>
        </div>
        {view === 'list' ? (
          <button 
            onClick={() => setView('new')}
            title="Registrar nueva compra de mercadería"
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-primary-600/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <Plus size={20} /> Nueva Compra
          </button>
        ) : (
          <button 
            onClick={() => setView('list')}
            title="Cancelar registro actual"
            className="text-gray-400 hover:text-red-500 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all"
          >
            <XCircle size={20} />
            Cancelar y volver
          </button>
        )}
      </div>

      {view === 'list' ? (
        <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <div className="relative max-w-md">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por proveedor o documento..." 
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
                  <th className="px-8 py-6">Fecha</th>
                  <th className="px-8 py-6">Proveedor</th>
                  <th className="px-8 py-6">N° Comprobante</th>
                  <th className="px-8 py-6 text-right">Total</th>
                  <th className="px-8 py-6 text-center">Estado</th>
                  <th className="px-8 py-6 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {paginatedPurchases.length === 0 ? (
                  <tr><td colSpan={6} className="px-8 py-20 text-center text-gray-400 font-bold italic uppercase text-xs">No hay registros</td></tr>
                ) : (
                  paginatedPurchases.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-8 py-5 text-sm font-bold text-gray-900 dark:text-white">{displayDate(p.date)}</td>
                      <td className="px-8 py-5 uppercase font-black text-gray-800 dark:text-gray-200 text-sm tracking-tight">{p.supplierName}</td>
                      <td className="px-8 py-5 font-mono font-bold text-gray-700 dark:text-gray-300 text-sm">{p.documentNumber}</td>
                      <td className="px-8 py-5 text-right font-black text-primary-600 text-base">{formatMoney(p.total)}</td>
                      <td className="px-8 py-5 text-center">
                        <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                          p.status === 'Completado' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => setSelectedPurchase(p)} title="Ver detalle completo" className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all"><Eye size={18} /></button>
                          {p.status !== 'Anulado' && (
                            <button onClick={() => cancelPurchase(p.id)} title="Anular esta compra" className="p-2 text-amber-500 hover:bg-amber-50 rounded-xl transition-all"><XCircle size={18} /></button>
                          )}
                          <button onClick={() => setIdToDelete(p.id)} title="Eliminar registro" className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-90"><Trash2 size={18} /></button>
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
                  className="p-3 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 disabled:opacity-50 active:scale-90"
                >
                  <ChevronLeft size={20} />
                </button>
                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  title="Página Siguiente"
                  className="p-3 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 disabled:opacity-50 active:scale-90"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <NewPurchaseForm 
          suppliers={state.suppliers} 
          products={state.products}
          formatMoney={formatMoney}
          onSave={async (p) => { await addPurchase(p); setView('list'); }}
          onCancel={() => setView('list')}
        />
      )}

      {/* MODAL DE ELIMINACIÓN */}
      {idToDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-gray-800 w-full max-sm rounded-[2.5rem] shadow-2xl p-10 text-center border border-white/10">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">Confirmar Acción</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-8">
              ¿Estás seguro de eliminar este registro de compra? Esta acción no se puede deshacer.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                type="button"
                onClick={() => { deletePurchase(idToDelete); setIdToDelete(null); }}
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

      {selectedPurchase && (
        <PurchaseDetailModal 
          purchase={selectedPurchase} 
          suppliers={state.suppliers} 
          onClose={() => setSelectedPurchase(null)} 
          formatMoney={formatMoney} 
          displayDate={displayDate}
        />
      )}
    </div>
  );
};

const NewPurchaseForm: React.FC<{ suppliers: Supplier[], products: Product[], formatMoney: (n: number) => string, onSave: (p: Purchase) => Promise<void>, onCancel: () => void }> = ({ suppliers, products, formatMoney, onSave, onCancel }) => {
  const [isSaving, setIsSaving] = useState(false);
  const getTodayDate = () => new Date().toLocaleDateString('sv-SE');

  const [formData, setFormData] = useState({
    date: getTodayDate(),
    supplierId: '',
    supplierRuc: '',
    supplierContact: '',
    supplierAddress: '',
    documentNumber: '',
  });
  const [items, setItems] = useState<PurchaseItem[]>([]);

  const handleSupplierChange = (id: string) => {
    const sup = suppliers.find(s => s.id === id);
    if (sup) {
      setFormData({
        ...formData,
        supplierId: id,
        supplierRuc: sup.ruc,
        supplierContact: sup.contact,
        supplierAddress: sup.address
      });
    } else {
      setFormData({ ...formData, supplierId: '', supplierRuc: '', supplierContact: '', supplierAddress: '' });
    }
  };

  const addItem = () => setItems([...items, { productId: '', productName: '', category: 'Frutas', quantity: 1, unit: 'Kilos', unitPrice: 0, sellingPrice: 0, initialStock: 0, total: 0 }]);
  
  const updateItem = (i: number, field: keyof PurchaseItem, val: any) => {
    const n = [...items];
    const item = { ...n[i], [field]: val };
    
    if (field === 'productId') {
      const p = products.find(prod => prod.id === val);
      if (p) {
        item.productName = p.name;
        item.category = p.category;
        item.unit = p.unit;
        item.initialStock = p.stock;
        item.sellingPrice = p.price;
      }
    }
    
    item.total = item.quantity * item.unitPrice;
    n[i] = item;
    setItems(n);
  };

  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const total = items.reduce((a, b) => a + b.total, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return alert('Debe agregar al menos un ítem');
    if (!formData.supplierId) return alert('Seleccione un proveedor');
    
    setIsSaving(true);
    try {
      const sup = suppliers.find(s => s.id === formData.supplierId);
      await onSave({
        id: Date.now().toString(),
        date: formData.date,
        supplierId: formData.supplierId,
        supplierName: sup?.name || 'Desconocido',
        documentNumber: formData.documentNumber,
        items,
        total,
        status: 'Completado'
      });
    } catch (err) {
      alert("Error al registrar la compra.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-10 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-8 animate-in slide-in-from-top-4">
        <div className="md:col-span-3 border-b border-gray-100 dark:border-gray-700 pb-6 flex items-center gap-3 text-primary-600 font-black uppercase tracking-[0.2em] text-[10px]">
          <Truck size={18} /> Datos Generales del Abastecimiento
        </div>
        
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 ml-1 tracking-widest">Fecha de Compra</label>
          <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white font-bold text-xs" />
        </div>

        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 ml-1 tracking-widest">Proveedor Mayorista</label>
          <select value={formData.supplierId} onChange={e => handleSupplierChange(e.target.value)} className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white font-black text-[11px] uppercase">
            <option value="">Seleccione proveedor...</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 ml-1 tracking-widest">N° Factura / Guía</label>
          <input type="text" value={formData.documentNumber} onChange={e => setFormData({...formData, documentNumber: e.target.value})} className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white font-black text-xs uppercase" placeholder="F001-XXXX" />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-10 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-center mb-10">
           <h3 className="font-black text-primary-600 text-[10px] tracking-[0.2em] uppercase">Detalle de Mercadería</h3>
           <button type="button" onClick={addItem} title="Agregar una nueva fila de producto" className="bg-primary-50 text-primary-600 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">
             + Agregar Item
           </button>
        </div>
        
        <div className="overflow-x-auto pb-4">
          <table className="w-full text-left min-w-[1000px]">
            <thead className="text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="px-2 py-4">Producto</th>
                <th className="px-2 py-4">Cant.</th>
                <th className="px-2 py-4">Und.</th>
                <th className="px-2 py-4">Costo S/.</th>
                <th className="px-2 py-4">Venta Sug. S/.</th>
                <th className="px-2 py-4 text-right">Subtotal</th>
                <th className="px-2 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {items.map((item, i) => (
                <tr key={i} className="animate-in slide-in-from-right-2">
                  <td className="py-4 pr-3 w-[25%]">
                    <select value={item.productId} onChange={e => updateItem(i, 'productId', e.target.value)} className="w-full px-3 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 text-xs text-gray-900 dark:text-white border-none font-black uppercase">
                      <option value="">Elegir producto...</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </td>
                  <td className="py-4 px-2 w-[10%]">
                    <input type="number" step="0.01" value={item.quantity} onChange={e => updateItem(i, 'quantity', Number(e.target.value))} className="w-full px-3 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 text-xs text-gray-900 dark:text-white border-none font-black" />
                  </td>
                  <td className="py-4 px-2 w-[12%]">
                    <select value={item.unit} onChange={e => updateItem(i, 'unit', e.target.value)} className="w-full px-3 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 text-xs text-gray-900 dark:text-white border-none font-black uppercase">
                      <option value="Kilos">Kilos</option>
                      <option value="Unidad">Unidad</option>
                      <option value="Caja">Caja</option>
                    </select>
                  </td>
                  <td className="py-4 px-2 w-[12%]">
                    <input type="number" step="0.01" value={item.unitPrice} onChange={e => updateItem(i, 'unitPrice', Number(e.target.value))} className="w-full px-3 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 text-xs text-gray-900 dark:text-white border-none font-black" />
                  </td>
                  <td className="py-4 px-2 w-[12%]">
                    <input type="number" step="0.01" value={item.sellingPrice} onChange={e => updateItem(i, 'sellingPrice', Number(e.target.value))} className="w-full px-3 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 text-xs text-primary-600 font-black border-none" />
                  </td>
                  <td className="py-4 px-2 text-right">
                    <span className="text-sm font-black text-primary-600">{formatMoney(item.total)}</span>
                  </td>
                  <td className="py-4 pl-3 text-center">
                    <button type="button" onClick={() => removeItem(i)} title="Quitar item de la lista" className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && <p className="text-center py-16 text-gray-400 font-bold italic uppercase text-xs tracking-widest">No hay items en la lista</p>}
        </div>

        <div className="mt-10 pt-8 border-t border-gray-100 dark:border-gray-700 flex flex-col items-end">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Total del Pedido</p>
          <p className="text-5xl font-black text-primary-600 tracking-tighter">{formatMoney(total)}</p>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <button type="button" disabled={isSaving} onClick={onCancel} className="px-10 py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-400 transition-all active:scale-95">Descartar</button>
        <button 
          type="submit" 
          disabled={isSaving}
          title="Guardar registro y actualizar inventario"
          className="px-16 py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest bg-primary-600 text-white shadow-2xl shadow-primary-600/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-3 disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
          {isSaving ? 'Registrando...' : 'Confirmar Ingreso'}
        </button>
      </div>
    </form>
  );
};

const PurchaseDetailModal: React.FC<{ purchase: Purchase, suppliers: Supplier[], onClose: () => void, formatMoney: (n: number) => string, displayDate: (d: string) => string }> = ({ purchase, suppliers, onClose, formatMoney, displayDate }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
      <div className="bg-white dark:bg-gray-800 w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 border border-white/10">
        <div className="p-10 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-700/30">
          <div>
            <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">Detalle de Abastecimiento</h3>
            <p className="text-[10px] font-black text-primary-600 uppercase mt-1 tracking-widest">Documento #{purchase.documentNumber}</p>
          </div>
          <button onClick={onClose} title="Cerrar detalle" className="p-3 hover:bg-red-50 text-gray-300 hover:text-red-500 rounded-2xl transition-all">
            <XCircle size={28} />
          </button>
        </div>
        
        <div className="p-10 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Fecha</p><p className="font-black text-gray-900 dark:text-white uppercase">{displayDate(purchase.date)}</p></div>
            <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Proveedor</p><p className="font-black text-gray-900 dark:text-white uppercase leading-tight">{purchase.supplierName}</p></div>
            <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Estado</p><p className={`font-black uppercase text-sm ${purchase.status === 'Completado' ? 'text-green-600' : 'text-red-600'}`}>{purchase.status}</p></div>
          </div>

          <div className="rounded-[2rem] border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-700/50 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                <tr>
                  <th className="px-6 py-4">Producto</th>
                  <th className="px-6 py-4">Cant.</th>
                  <th className="px-6 py-4">Costo Unit</th>
                  <th className="px-6 py-4 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                {purchase.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-6 py-4 font-black text-gray-900 dark:text-white uppercase">{item.productName}</td>
                    <td className="px-6 py-4 font-bold text-gray-700 dark:text-gray-300">{item.quantity} {item.unit}</td>
                    <td className="px-6 py-4 font-bold text-gray-700 dark:text-gray-300">{formatMoney(item.unitPrice)}</td>
                    <td className="px-6 py-4 text-right font-black text-primary-600">{formatMoney(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center bg-primary-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-primary-600/30">
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Inversión Total</span>
            <p className="text-4xl font-black tracking-tighter">{formatMoney(purchase.total)}</p>
          </div>
        </div>
        
        <div className="p-10 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-4">
          <button onClick={onClose} className="px-8 py-4 bg-white dark:bg-gray-800 border border-gray-100 rounded-2xl font-black text-[10px] uppercase tracking-widest text-gray-400 active:scale-95 transition-all">Cerrar</button>
          <button title="Imprimir registro" className="px-12 py-4 bg-primary-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary-600/30 active:scale-95 flex items-center gap-2">
            <Printer size={16} /> Imprimir
          </button>
        </div>
      </div>
    </div>
  );
};

export default Purchases;

