
import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store';
import { Truck, Plus, Search, FileText, CheckCircle, XCircle, Trash2, User, MapPin, Eye, Printer, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Purchase, Supplier, Product, PurchaseItem } from '../types';

const Purchases: React.FC = () => {
  const { state, addPurchase, cancelPurchase } = useStore();
  const [view, setView] = useState<'list' | 'new'>('list');
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-gray-800 dark:text-white">Compras / Abastecimiento</h2>
          <p className="text-gray-500 dark:text-gray-400">Ingreso de mercadería al inventario en la nube</p>
        </div>
        {view === 'list' ? (
          <button 
            onClick={() => setView('new')}
            className="bg-primary-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-primary-600/20 transition-all hover:scale-105"
          >
            <Plus size={20} /> Nueva Compra
          </button>
        ) : (
          <button 
            onClick={() => setView('list')}
            className="text-gray-600 dark:text-gray-400 hover:text-primary-600 font-bold flex items-center gap-2"
          >
            <XCircle size={20} />
            Cancelar y volver
          </button>
        )}
      </div>

      {view === 'list' ? (
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por proveedor o documento..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs font-black uppercase text-gray-400 tracking-widest">
              <tr>
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Proveedor</th>
                <th className="px-6 py-4">N° Doc</th>
                <th className="px-6 py-4 text-right">Total</th>
                <th className="px-6 py-4 text-center">Estado</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {paginatedPurchases.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-20 text-center text-gray-400 italic">No se encontraron compras</td></tr>
              ) : (
                paginatedPurchases.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{displayDate(p.date)}</td>
                    <td className="px-6 py-4 text-gray-800 dark:text-gray-200">{p.supplierName}</td>
                    <td className="px-6 py-4 font-mono text-gray-700 dark:text-gray-300">{p.documentNumber}</td>
                    <td className="px-6 py-4 text-right font-black text-primary-600">{formatMoney(p.total)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                        p.status === 'Completado' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => setSelectedPurchase(p)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl" title="Ver Detalle"><Eye size={18} /></button>
                        {p.status !== 'Anulado' && (
                          <button onClick={() => cancelPurchase(p.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl" title="Anular Compra"><XCircle size={18} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          
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
      ) : (
        <NewPurchaseForm 
          suppliers={state.suppliers} 
          products={state.products}
          formatMoney={formatMoney}
          onSave={async (p) => { await addPurchase(p); setView('list'); }}
          onCancel={() => setView('list')}
        />
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
  const [formData, setFormData] = useState({
    date: "2026-01-28",
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
      <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-3 border-b border-gray-100 dark:border-gray-700 pb-4 flex items-center gap-2 text-primary-600 font-black uppercase tracking-widest text-xs">
          <Truck size={16} /> Datos de la Compra
        </div>
        
        <div>
          <label className="block text-xs font-black text-gray-400 uppercase mb-2">Fecha</label>
          <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-4 py-4 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white font-bold text-xs" />
        </div>

        <div>
          <label className="block text-xs font-black text-gray-400 uppercase mb-2">Proveedor</label>
          <select value={formData.supplierId} onChange={e => handleSupplierChange(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white font-bold">
            <option value="">Seleccione...</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-black text-gray-400 uppercase mb-2">RUC / DNI Proveedor</label>
          <input type="text" value={formData.supplierRuc} readOnly className="w-full px-4 py-3 rounded-2xl bg-gray-100 dark:bg-gray-700/50 text-gray-900 dark:text-white font-mono" />
        </div>

        <div>
          <label className="block text-xs font-black text-gray-400 uppercase mb-2">Contacto</label>
          <input type="text" value={formData.supplierContact} readOnly className="w-full px-4 py-3 rounded-2xl bg-gray-100 dark:bg-gray-700/50 text-gray-900 dark:text-white" />
        </div>

        <div>
          <label className="block text-xs font-black text-gray-400 uppercase mb-2">Dirección</label>
          <input type="text" value={formData.supplierAddress} readOnly className="w-full px-4 py-3 rounded-2xl bg-gray-100 dark:bg-gray-700/50 text-gray-900 dark:text-white text-xs" />
        </div>

        <div>
          <label className="block text-xs font-black text-gray-400 uppercase mb-2">N° Documento (Factura)</label>
          <input type="text" value={formData.documentNumber} onChange={e => setFormData({...formData, documentNumber: e.target.value})} className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white font-bold" placeholder="F001-0001" />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-center mb-6">
           <h3 className="font-black text-primary-600 text-xs tracking-widest uppercase">Items de Abastecimiento</h3>
           <button type="button" onClick={addItem} className="text-primary-600 font-bold text-sm flex items-center gap-1 hover:underline">
             <Plus size={16} /> Agregar Fila
           </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[1200px]">
            <thead className="text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="px-2 py-3">Producto</th>
                <th className="px-2 py-3">Categoría</th>
                <th className="px-2 py-3">Cantidad</th>
                <th className="px-2 py-3">Unidad</th>
                <th className="px-2 py-3">Costo Unit</th>
                <th className="px-2 py-3">Precio Venta</th>
                <th className="px-2 py-3 text-center">Stock Actual</th>
                <th className="px-2 py-3 text-right">Subtotal</th>
                <th className="px-2 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {items.map((item, i) => (
                <tr key={i} className="animate-in slide-in-from-right-2">
                  <td className="py-3 pr-2 w-[18%]">
                    <select value={item.productId} onChange={e => updateItem(i, 'productId', e.target.value)} className="w-full px-2 py-2 rounded-xl bg-gray-50 dark:bg-gray-700 text-xs text-gray-900 dark:text-white border-none font-bold">
                      <option value="">Elegir producto...</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </td>
                  <td className="py-3 px-2 w-[12%]">
                    <select value={item.category} onChange={e => updateItem(i, 'category', e.target.value)} className="w-full px-2 py-2 rounded-xl bg-gray-50 dark:bg-gray-700 text-xs text-gray-900 dark:text-white border-none">
                      <option value="Frutas">Frutas</option>
                      <option value="Frutos Secos">Frutos Secos</option>
                      <option value="Verduras">Verduras</option>
                      <option value="Otros">Otros</option>
                    </select>
                  </td>
                  <td className="py-3 px-2">
                    <input type="number" step="0.01" value={item.quantity} onChange={e => updateItem(i, 'quantity', Number(e.target.value))} className="w-full px-2 py-2 rounded-xl bg-gray-50 dark:bg-gray-700 text-xs text-gray-900 dark:text-white border-none [appearance:textfield]" />
                  </td>
                  <td className="py-3 px-2 w-[10%]">
                    <select value={item.unit} onChange={e => updateItem(i, 'unit', e.target.value)} className="w-full px-2 py-2 rounded-xl bg-gray-50 dark:bg-gray-700 text-xs text-gray-900 dark:text-white border-none font-bold">
                      <option value="Kilos">Kilos</option>
                      <option value="Unidad">Unidad</option>
                      <option value="Caja">Caja</option>
                    </select>
                  </td>
                  <td className="py-3 px-2">
                    <input type="number" step="0.01" value={item.unitPrice} onChange={e => updateItem(i, 'unitPrice', Number(e.target.value))} className="w-full px-2 py-2 rounded-xl bg-gray-50 dark:bg-gray-700 text-xs text-gray-900 dark:text-white border-none font-bold [appearance:textfield]" />
                  </td>
                  <td className="py-3 px-2">
                    <input type="number" step="0.01" value={item.sellingPrice} onChange={e => updateItem(i, 'sellingPrice', Number(e.target.value))} className="w-full px-2 py-2 rounded-xl bg-gray-50 dark:bg-gray-700 text-xs text-primary-600 font-bold border-none [appearance:textfield]" />
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span className="text-xs font-bold text-gray-400">{item.initialStock} {item.unit}</span>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <span className="text-xs font-black text-primary-600">{formatMoney(item.total)}</span>
                  </td>
                  <td className="py-3 pl-2 text-center">
                    <button type="button" onClick={() => removeItem(i)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && <p className="text-center py-12 text-gray-400 italic">No hay productos en la lista de compra.</p>}
        </div>

        <div className="mt-8 text-right pt-6 border-t border-gray-100 dark:border-gray-700">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Inversión Total</p>
          <p className="text-4xl font-black text-primary-600">{formatMoney(total)}</p>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <button type="button" disabled={isSaving} onClick={onCancel} className="px-8 py-4 rounded-2xl font-bold bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50">Cancelar</button>
        <button 
          type="submit" 
          disabled={isSaving}
          className="px-12 py-4 rounded-2xl font-black bg-primary-600 text-white shadow-xl shadow-primary-600/30 transition-all hover:scale-105 flex items-center gap-2 disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
          {isSaving ? 'Sincronizando...' : 'Registrar Compra'}
        </button>
      </div>
    </form>
  );
};

const PurchaseDetailModal: React.FC<{ purchase: Purchase, suppliers: Supplier[], onClose: () => void, formatMoney: (n: number) => string, displayDate: (d: string) => string }> = ({ purchase, suppliers, onClose, formatMoney, displayDate }) => {
  const supplier = suppliers.find(s => s.id === purchase.supplierId);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-700/30">
          <div>
            <h3 className="text-2xl font-black text-gray-800 dark:text-white">Detalle de Abastecimiento</h3>
            <p className="text-sm text-gray-500">Documento #{purchase.documentNumber}</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-2xl transition-all">
            <XCircle size={28} className="text-gray-400" />
          </button>
        </div>
        
        <div className="p-8 space-y-8 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div><p className="text-[10px] font-black text-gray-400 uppercase">Fecha</p><p className="font-bold text-sm text-gray-900 dark:text-white">{displayDate(purchase.date)}</p></div>
            <div><p className="text-[10px] font-black text-gray-400 uppercase">Proveedor</p><p className="font-bold text-sm text-gray-900 dark:text-white">{purchase.supplierName}</p></div>
            <div><p className="text-[10px] font-black text-gray-400 uppercase">RUC / DNI</p><p className="font-bold text-sm text-gray-900 dark:text-white font-mono">{supplier?.ruc || '-'}</p></div>
            <div><p className="text-[10px] font-black text-gray-400 uppercase">Estado</p><p className={`font-black text-sm ${purchase.status === 'Completado' ? 'text-green-600' : 'text-red-600'}`}>{purchase.status}</p></div>
          </div>

          <div className="rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-4 font-black text-gray-400 uppercase text-[10px]">Producto</th>
                  <th className="px-6 py-4 font-black text-gray-400 uppercase text-[10px]">Categoría</th>
                  <th className="px-6 py-4 font-black text-gray-400 uppercase text-[10px]">Cant.</th>
                  <th className="px-6 py-4 font-black text-gray-400 uppercase text-[10px]">Costo Unit</th>
                  <th className="px-6 py-4 font-black text-gray-400 uppercase text-[10px] text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {purchase.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{item.productName}</td>
                    <td className="px-6 py-4 text-xs text-gray-500">{item.category}</td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white">{item.quantity} {item.unit}</td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white">{formatMoney(item.unitPrice)}</td>
                    <td className="px-6 py-4 text-right font-black text-primary-600">{formatMoney(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center bg-primary-50 dark:bg-primary-900/10 p-6 rounded-3xl">
            <div className="max-w-xs text-xs text-primary-700 dark:text-primary-300">
               <p className="font-black uppercase mb-1">Nota de Abastecimiento:</p>
               <p>Este registro actualizó el stock y el precio de venta sugerido en el catálogo de productos vía Supabase.</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Inversión Total</span>
              <p className="text-4xl font-black text-primary-600">{formatMoney(purchase.total)}</p>
            </div>
          </div>
        </div>
        
        <div className="p-8 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-4">
          <button onClick={onClose} className="px-8 py-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl font-bold text-gray-900 dark:text-white">Cerrar</button>
          <button className="px-10 py-3 bg-primary-600 text-white rounded-2xl font-black flex items-center gap-2 shadow-lg shadow-primary-600/30">
            <Printer size={20} /> Imprimir Comprobante
          </button>
        </div>
      </div>
    </div>
  );
};

export default Purchases;
