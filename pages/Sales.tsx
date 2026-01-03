
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useStore } from '../store';
import { 
  Plus, Search, Eye, XCircle, Trash2, Printer, Edit2,
  PlusCircle, User, FileText, Calendar, Tag, CheckCircle2, Loader2,
  ChevronLeft, ChevronRight, Download
} from 'lucide-react';
import { Sale, SaleItem, Product, Client, DocumentType, SaleStatus, ServiceType, DocStatus } from '../types';

declare var jspdf: any;

const Sales: React.FC = () => {
  const { state, addSale, cancelSale, updateSale } = useStore();
  const [view, setView] = useState<'list' | 'new'>('list');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);

  const formatMoney = (val: number) => {
    const symbol = state.currency === 'PEN' ? 'S/' : '$';
    const amount = state.currency === 'PEN' ? val : val / state.exchangeRate;
    return `${symbol} ${amount.toFixed(2).replace(',', '.')}`;
  };

  const handleEdit = (sale: Sale) => {
    setEditingSale(sale);
    setView('new');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-800 dark:text-white">Gestión de Ventas</h2>
          <p className="text-gray-500 dark:text-gray-400">Facturación y registro de salidas en la nube</p>
        </div>
        {view === 'list' ? (
          <div className="flex gap-3">
            <button 
              onClick={() => setShowReportModal(true)}
              className="flex items-center justify-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 px-5 py-3 rounded-2xl font-bold shadow-sm transition-all hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <FileText size={20} className="text-primary-600" />
              Reporte PDF
            </button>
            <button 
              onClick={() => { setEditingSale(null); setView('new'); }}
              className="flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-2xl font-bold shadow-xl shadow-primary-600/30 transition-all hover:scale-105"
            >
              <PlusCircle size={20} />
              Nueva Venta
            </button>
          </div>
        ) : (
          <button 
            onClick={() => { setView('list'); setEditingSale(null); }}
            className="text-gray-600 dark:text-gray-400 hover:text-primary-600 font-bold flex items-center gap-2"
          >
            <XCircle size={20} />
            Cancelar y volver
          </button>
        )}
      </div>

      {view === 'list' ? (
        <SalesList 
          sales={state.sales} 
          formatMoney={formatMoney} 
          onView={setSelectedSale} 
          onEdit={handleEdit}
          onCancel={cancelSale} 
        />
      ) : (
        <NewSaleForm 
          clients={state.clients} 
          products={state.products} 
          initialData={editingSale}
          formatMoney={formatMoney}
          onSave={async (sale) => { 
            if (editingSale) {
              await updateSale(sale);
            } else {
              await addSale(sale);
            }
            setView('list'); 
            setEditingSale(null);
          }} 
          onCancel={() => { setView('list'); setEditingSale(null); }}
        />
      )}

      {selectedSale && <SaleDetailModal sale={selectedSale} onClose={() => setSelectedSale(null)} formatMoney={formatMoney} />}
      
      {showReportModal && (
        <SalesReportModal 
          sales={state.sales} 
          clients={state.clients} 
          onClose={() => setShowReportModal(false)} 
          formatMoney={formatMoney} 
        />
      )}
    </div>
  );
};

const SalesList: React.FC<{ sales: Sale[], formatMoney: (n: number) => string, onView: (s: Sale) => void, onEdit: (s: Sale) => void, onCancel: (id: string) => Promise<void> }> = ({ sales, formatMoney, onView, onEdit, onCancel }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCancelling, setIsCancelling] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);
  
  const sortedSales = useMemo(() => {
    return [...sales].sort((a, b) => b.date.localeCompare(a.date));
  }, [sales]);

  const filteredSales = sortedSales.filter(s => 
    s.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.documentNumber.includes(searchTerm)
  );

  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
  const paginatedSales = filteredSales.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleCancelClick = async (id: string) => {
    if (confirm('¿Está seguro de anular esta venta? El stock no se revertirá automáticamente.')) {
      setIsCancelling(id);
      await onCancel(id);
      setIsCancelling(null);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="p-6 border-b border-gray-100 dark:border-gray-700">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por cliente o documento..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none focus:ring-2 focus:ring-primary-500 outline-none text-sm text-gray-900 dark:text-white"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 dark:bg-gray-700/50 text-[10px] font-black uppercase text-gray-400 tracking-widest">
            <tr>
              <th className="px-6 py-4">Fecha</th>
              <th className="px-6 py-4">N° Guía</th>
              <th className="px-6 py-4">Cliente</th>
              <th className="px-6 py-4">Documento</th>
              <th className="px-6 py-4">Estado Doc.</th>
              <th className="px-6 py-4">Total</th>
              <th className="px-6 py-4">Estado Venta</th>
              <th className="px-6 py-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {paginatedSales.length === 0 ? (
              <tr><td colSpan={8} className="px-6 py-20 text-center text-gray-400">No se encontraron ventas</td></tr>
            ) : (
              paginatedSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">{sale.date}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{sale.guideNumber || '-'}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-gray-900 dark:text-white">{sale.clientName}</div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-tighter">{sale.clientDocType}: {sale.clientDocNumber}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-[10px] font-black text-gray-400 uppercase">{sale.documentType}</div>
                    <div className="text-sm font-black text-gray-900 dark:text-white">{sale.documentNumber}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                      sale.docStatus === 'Emitido' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {sale.docStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-black text-primary-600">{formatMoney(sale.total)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                      sale.saleStatus === 'Cancelado' ? 'bg-green-100 text-green-700' : 
                      sale.saleStatus === 'Pendiente' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {sale.saleStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => onView(sale)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl" title="Ver Detalle"><Eye size={18} /></button>
                      <button onClick={() => onEdit(sale)} className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl" title="Editar"><Edit2 size={18} /></button>
                      {sale.saleStatus !== 'Anulado' && (
                        <button 
                          disabled={isCancelling === sale.id}
                          onClick={() => handleCancelClick(sale.id)} 
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl disabled:opacity-50" 
                          title="Anular"
                        >
                          {isCancelling === sale.id ? <Loader2 className="animate-spin" size={18} /> : <XCircle size={18} />}
                        </button>
                      )}
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
  );
};

const NewSaleForm: React.FC<{
  clients: Client[],
  products: Product[],
  initialData: Sale | null,
  formatMoney: (n: number) => string,
  onSave: (s: Sale) => Promise<void>,
  onCancel: () => void
}> = ({ clients, products, initialData, formatMoney, onSave, onCancel }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [docSearch, setDocSearch] = useState('');
  const [docSuggestions, setDocSuggestions] = useState<Client[]>([]);
  const [productSearch, setProductSearch] = useState<{ index: number | null, term: string }>({ index: null, term: '' });

  const [formData, setFormData] = useState({
    date: initialData?.date || new Date().toISOString().split('T')[0],
    guideNumber: initialData?.guideNumber || '',
    clientId: initialData?.clientId || '',
    service: initialData?.service || 'Venta de Frutas' as ServiceType,
    documentType: initialData?.documentType || 'Boleta' as DocumentType,
    documentNumber: initialData?.documentNumber || '',
    docStatus: initialData?.docStatus || 'Emitido' as DocStatus,
    saleStatus: initialData?.saleStatus || 'Pendiente' as SaleStatus,
  });

  const [items, setItems] = useState<SaleItem[]>(initialData?.items || []);
  const selectedClient = clients.find(c => c.id === formData.clientId);

  useEffect(() => {
    if (docSearch.length > 0) {
      const matches = clients.filter(c => c.docNumber.includes(docSearch)).slice(0, 5);
      setDocSuggestions(matches);
    } else {
      setDocSuggestions([]);
    }
  }, [docSearch, clients]);

  const handleSelectClient = (client: Client) => {
    setFormData(prev => ({ ...prev, clientId: client.id }));
    setDocSearch(client.docNumber);
    setDocSuggestions([]);
  };

  const addItem = () => {
    setItems([...items, { productId: '', productName: '', quantity: 1, unit: 'Kilos', unitPrice: 0, total: 0 }]);
  };

  const updateItem = (index: number, field: keyof SaleItem, value: any) => {
    const newItems = [...items];
    const item = { ...newItems[index], [field]: value };

    if (field === 'productId') {
      const prod = products.find(p => p.id === value);
      if (prod) {
        item.productName = prod.name;
        item.unit = prod.unit;
        item.unitPrice = prod.price;
      }
    }

    if (field === 'quantity' || field === 'unitPrice' || field === 'productId' || field === 'unit') {
      item.total = Number(item.quantity) * Number(item.unitPrice);
    }

    newItems[index] = item;
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const total = items.reduce((sum, item) => sum + item.total, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientId) return alert('Seleccione un cliente');
    if (items.length === 0) return alert('Agregue al menos un producto');
    if (items.some(i => !i.productId)) return alert('Seleccione un producto en todas las filas');

    setIsSaving(true);
    try {
      const sale: Sale = {
        id: initialData?.id || Date.now().toString(),
        ...formData,
        clientName: selectedClient?.name || '',
        clientDocType: selectedClient?.docType || 'DNI',
        clientDocNumber: selectedClient?.docNumber || '',
        contact: selectedClient?.contact || '',
        items,
        total
      };
      await onSave(sale);
    } catch (err) {
      alert('Error al guardar la venta');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-4 border-b border-gray-100 dark:border-gray-700 pb-4 flex items-center gap-2 text-primary-600 font-black uppercase tracking-widest text-xs">
          <User size={16} /> Datos del Cliente
        </div>
        
        <div>
          <label className="block text-xs font-black text-gray-400 uppercase mb-2">Fecha</label>
          <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white" />
        </div>

        <div className="relative">
          <label className="block text-xs font-black text-gray-400 uppercase mb-2">Tipo Doc.</label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input 
              type="text" 
              placeholder="Escriba número..." 
              value={docSearch}
              onChange={(e) => setDocSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white font-mono" 
            />
          </div>
          {docSuggestions.length > 0 && (
            <div className="absolute z-[110] left-0 right-0 mt-1 bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
              {docSuggestions.map(client => (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => handleSelectClient(client)}
                  className="w-full px-4 py-3 text-left hover:bg-primary-50 dark:hover:bg-primary-900/20 text-sm flex flex-col border-b border-gray-50 last:border-0"
                >
                  <span className="font-bold text-gray-900 dark:text-white">{client.docNumber}</span>
                  <span className="text-[10px] text-gray-400 uppercase">{client.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-black text-gray-400 uppercase mb-2">Nombre</label>
          <select value={formData.clientId} onChange={e => {
            const client = clients.find(c => c.id === e.target.value);
            if (client) handleSelectClient(client);
            else setFormData({...formData, clientId: ''});
          }} className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white font-bold">
            <option value="">Seleccione...</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-black text-gray-400 uppercase mb-2">Servicio</label>
          <select value={formData.service} onChange={e => setFormData({...formData, service: e.target.value as ServiceType})} className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white font-bold">
            <option value="Venta de Frutas">Venta de Frutas</option>
            <option value="Alquiler de Local">Alquiler de Local</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-black text-gray-400 uppercase mb-2">N° Guía (Opcional)</label>
          <input type="text" value={formData.guideNumber} onChange={e => setFormData({...formData, guideNumber: e.target.value})} className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white" placeholder="001-00123" />
        </div>

        <div>
          <label className="block text-xs font-black text-gray-400 uppercase mb-2">Tipo Comprobante</label>
          <select value={formData.documentType} onChange={e => setFormData({...formData, documentType: e.target.value as DocumentType})} className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white font-bold">
            <option value="Boleta">Boleta</option>
            <option value="Factura">Factura</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-black text-gray-400 uppercase mb-2">N° Comprobante</label>
          <input type="text" value={formData.documentNumber} onChange={e => setFormData({...formData, documentNumber: e.target.value})} className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white font-bold" placeholder="F001-0001" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase mb-2">Estado Doc.</label>
            <select value={formData.docStatus} onChange={e => setFormData({...formData, docStatus: e.target.value as DocStatus})} className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white font-bold">
              <option value="Emitido">Emitido</option>
              <option value="Pendiente">Pendiente</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase mb-2">Estado Cobro</label>
            <select value={formData.saleStatus} onChange={e => setFormData({...formData, saleStatus: e.target.value as SaleStatus})} className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white font-bold">
              <option value="Pendiente">Pendiente</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-visible">
        <div className="flex justify-between items-center mb-6">
           <h3 className="font-black text-primary-600 text-xs tracking-widest uppercase">Detalle de Productos</h3>
           <button type="button" onClick={addItem} className="text-primary-600 font-bold text-sm flex items-center gap-1 hover:underline">
             <Plus size={16} /> Agregar Fila
           </button>
        </div>
        
        <div className="overflow-visible">
          <table className="w-full text-left min-w-[800px] table-fixed">
            <thead className="text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="px-2 py-3 w-[40%]">Producto</th>
                <th className="px-2 py-3 w-[10%]">Cant.</th>
                <th className="px-2 py-3 w-[15%]">Unidad</th>
                <th className="px-2 py-3 w-[15%]">Precio Unit</th>
                <th className="px-2 py-3 w-[15%] text-right">Subtotal</th>
                <th className="px-2 py-3 w-[5%]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 overflow-visible">
              {items.map((item, i) => (
                <tr key={i} className="animate-in slide-in-from-right-2 overflow-visible">
                  <td className="py-4 pr-2 relative overflow-visible">
                    <div className="relative overflow-visible">
                      <input 
                        type="text" 
                        placeholder="Escriba nombre de producto..."
                        value={productSearch.index === i ? productSearch.term : (item.productName || '')}
                        onFocus={() => setProductSearch({ index: i, term: item.productName || '' })}
                        onChange={(e) => setProductSearch({ index: i, term: e.target.value })}
                        className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-700 text-xs text-gray-900 dark:text-white border-2 border-transparent focus:border-primary-500 font-bold outline-none transition-all"
                      />
                      {productSearch.index === i && productSearch.term.length > 0 && (
                        <div className="absolute z-[200] left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-2xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2">
                          {products
                            .filter(p => p.name.toLowerCase().includes(productSearch.term.toLowerCase()))
                            .slice(0, 10)
                            .map(p => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                updateItem(i, 'productId', p.id);
                                setProductSearch({ index: null, term: '' });
                              }}
                              className="w-full px-4 py-3 text-left hover:bg-primary-50 dark:hover:bg-primary-900/20 text-xs flex justify-between items-center border-b border-gray-50 dark:border-gray-700 last:border-0 transition-colors"
                            >
                              <span className="font-black text-gray-800 dark:text-white">{p.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-2">
                    <input type="number" step="0.01" value={item.quantity} onChange={e => updateItem(i, 'quantity', Number(e.target.value))} className="w-full px-3 py-3 rounded-2xl bg-gray-50 dark:bg-gray-700 text-xs text-gray-900 dark:text-white border-none font-bold [appearance:textfield]" />
                  </td>
                  <td className="py-4 px-2">
                    <select value={item.unit} onChange={e => updateItem(i, 'unit', e.target.value)} className="w-full px-3 py-3 rounded-2xl bg-gray-50 dark:bg-gray-700 text-xs text-gray-900 dark:text-white border-none font-bold">
                      <option value="Kilos">Kilos</option>
                      <option value="Unidad">Unidad</option>
                      <option value="Caja">Caja</option>
                    </select>
                  </td>
                  <td className="py-4 px-2">
                    <input type="number" step="0.01" value={item.unitPrice} onChange={e => updateItem(i, 'unitPrice', Number(e.target.value))} className="w-full px-3 py-3 rounded-2xl bg-gray-50 dark:bg-gray-700 text-xs text-gray-900 dark:text-white border-none font-bold [appearance:textfield]" />
                  </td>
                  <td className="py-4 px-2 text-right">
                    <span className="text-sm font-black text-primary-600">{formatMoney(item.total)}</span>
                  </td>
                  <td className="py-4 pl-2 text-center">
                    <button type="button" onClick={() => removeItem(i)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && <p className="text-center py-12 text-gray-400 italic">No hay productos en la lista.</p>}
        </div>

        <div className="mt-8 text-right pt-6 border-t border-gray-100 dark:border-gray-700">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Total a Cobrar</p>
          <p className="text-4xl font-black text-primary-600">{formatMoney(total)}</p>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <button type="button" disabled={isSaving} onClick={onCancel} className="px-8 py-4 rounded-2xl font-bold bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 transition-all">Cancelar</button>
        <button 
          type="submit" 
          disabled={isSaving}
          className="px-12 py-4 rounded-2xl font-black bg-primary-600 text-white shadow-xl shadow-primary-600/30 transition-all hover:scale-105 flex items-center gap-2 disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
          {isSaving ? 'Guardando...' : 'Guardar Venta'}
        </button>
      </div>
    </form>
  );
};

const SalesReportModal: React.FC<{ sales: Sale[], clients: Client[], onClose: () => void, formatMoney: (n: number) => string }> = ({ sales, clients, onClose, formatMoney }) => {
  const [fromDate, setFromDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  const [clientId, setClientId] = useState('all');
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    if (typeof jspdf === 'undefined') {
      alert("La librería PDF aún no ha cargado.");
      return;
    }

    setIsGenerating(true);
    try {
      const { jsPDF } = (window as any).jspdf;
      const doc = new jsPDF();
      
      const filtered = sales.filter(s => {
        const dateMatch = s.date >= fromDate && s.date <= toDate;
        const clientMatch = clientId === 'all' || s.clientId === clientId;
        const statusMatch = s.saleStatus !== 'Anulado';
        return dateMatch && clientMatch && statusMatch;
      }).sort((a, b) => a.date.localeCompare(b.date));

      if (filtered.length === 0) {
        alert("No hay ventas en este rango para generar reporte.");
        setIsGenerating(false);
        return;
      }

      const selectedClientName = clientId === 'all' ? 'TODOS LOS CLIENTES' : clients.find(c => c.id === clientId)?.name || 'DESCONOCIDO';

      // Estilos y Cabecera
      doc.setFontSize(22);
      doc.setTextColor(22, 163, 74); // Verde Olga
      doc.text('FRUTERÍA OLGA', 105, 20, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('REPORTE DETALLADO DE VENTAS POR CLIENTE', 105, 28, { align: 'center' });
      
      doc.setDrawColor(200, 200, 200);
      doc.line(20, 35, 190, 35);

      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text(`Cliente: ${selectedClientName}`, 20, 45);
      doc.text(`Periodo: ${fromDate} al ${toDate}`, 20, 52);
      doc.text(`Generado: ${new Date().toLocaleString()}`, 190, 52, { align: 'right' });

      // Tabla de Datos
      const tableRows = filtered.map(s => [
        s.date,
        s.documentNumber,
        s.clientName,
        s.items.map(i => `${i.productName} (${i.quantity} ${i.unit})`).join(', '),
        formatMoney(s.total)
      ]);

      (doc as any).autoTable({
        startY: 60,
        head: [['FECHA', 'COMPROBANTE', 'CLIENTE', 'DETALLE PRODUCTOS', 'TOTAL']],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [22, 163, 74], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 3 },
        columnStyles: {
          4: { halign: 'right', fontStyle: 'bold' }
        }
      });

      const finalY = (doc as any).lastAutoTable.finalY + 10;
      const grandTotal = filtered.reduce((acc, s) => acc + s.total, 0);

      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text(`RESUMEN TOTAL: ${formatMoney(grandTotal)}`, 190, finalY, { align: 'right' });

      doc.save(`Reporte_Ventas_${selectedClientName.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Error al generar el PDF.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-100 dark:border-gray-700">
        <div className="p-8 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-700/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 text-primary-600 rounded-xl">
              <FileText size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-800 dark:text-white">Generar Reporte</h3>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Resumen en formato PDF</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-2xl transition-all">
            <XCircle size={28} className="text-gray-400" />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase mb-2">Desde Fecha</label>
              <input 
                type="date" 
                value={fromDate} 
                onChange={e => setFromDate(e.target.value)} 
                className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none outline-none focus:ring-2 focus:ring-primary-500 font-bold" 
              />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase mb-2">Hasta Fecha</label>
              <input 
                type="date" 
                value={toDate} 
                onChange={e => setToDate(e.target.value)} 
                className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none outline-none focus:ring-2 focus:ring-primary-500 font-bold" 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-gray-400 uppercase mb-2">Filtrar por Cliente</label>
            <select 
              value={clientId} 
              onChange={e => setClientId(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none outline-none focus:ring-2 focus:ring-primary-500 font-black text-gray-700 dark:text-white"
            >
              <option value="all">TODOS LOS CLIENTES</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="p-4 bg-primary-50 dark:bg-primary-900/10 rounded-2xl border border-primary-100 dark:border-primary-900/30 flex gap-3">
             <div className="shrink-0 text-primary-600"><CheckCircle2 size={20} /></div>
             <p className="text-xs text-primary-800 dark:text-primary-300 font-medium">
               El reporte incluirá la sumatoria total del periodo seleccionado y el detalle de ítems por cada venta realizada.
             </p>
          </div>
        </div>

        <div className="p-8 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl font-bold text-gray-600 dark:text-gray-300">Cerrar</button>
          <button 
            onClick={generatePDF}
            disabled={isGenerating}
            className="px-10 py-3 bg-primary-600 text-white rounded-2xl font-black flex items-center gap-2 shadow-lg shadow-primary-600/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
            {isGenerating ? 'Generando...' : 'Descargar PDF'}
          </button>
        </div>
      </div>
    </div>
  );
};

const SaleDetailModal: React.FC<{ sale: Sale, onClose: () => void, formatMoney: (n: number) => string }> = ({ sale, onClose, formatMoney }) => {
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsHtml = sale.items.map(item => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.productName}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity} ${item.unit}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatMoney(item.unitPrice)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatMoney(item.total)}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Comprobante - ${sale.documentNumber}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #333; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #16a34a; padding-bottom: 15px; }
            .header h1 { margin: 0; color: #16a34a; font-size: 28px; letter-spacing: -1px; }
            .info { margin-bottom: 30px; display: flex; justify-content: space-between; font-size: 14px; }
            .info p { margin: 4px 0; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { background: #f8fafc; padding: 12px 8px; text-align: left; font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 800; border-bottom: 2px solid #e2e8f0; }
            .total-section { text-align: right; border-top: 2px solid #e2e8f0; padding-top: 15px; }
            .total-label { font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase; }
            .total-amount { font-size: 32px; font-weight: 900; color: #16a34a; margin: 0; }
            .footer { text-align: center; margin-top: 50px; font-size: 11px; color: #94a3b8; border-top: 1px dashed #e2e8f0; padding-top: 20px; }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>FRUTERÍA OLGA</h1>
            <p style="margin: 5px 0; font-weight: 600; color: #64748b;">SISTEMA DE GESTIÓN ADMINISTRATIVA</p>
            <p style="font-size: 12px; color: #94a3b8;">Huánuco, Perú</p>
          </div>
          <div class="info">
            <div>
              <p><strong>CLIENTE:</strong> ${sale.clientName}</p>
              <p><strong>DOCUMENTO:</strong> ${sale.clientDocType} ${sale.clientDocNumber}</p>
              <p><strong>CONTACTO:</strong> ${sale.contact || '-'}</p>
            </div>
            <div style="text-align: right;">
              <p><strong>${sale.documentType.toUpperCase()}:</strong> ${sale.documentNumber}</p>
              <p><strong>FECHA:</strong> ${sale.date}</p>
              <p><strong>ESTADO:</strong> ${sale.saleStatus.toUpperCase()}</p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>PRODUCTO</th>
                <th style="text-align: center;">CANTIDAD</th>
                <th style="text-align: right;">P. UNIT</th>
                <th style="text-align: right;">SUBTOTAL</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div class="total-section">
            <p class="total-label">Importe Total</p>
            <p class="total-amount">${formatMoney(sale.total)}</p>
          </div>
          <div class="footer">
            <p>Gracias por su preferencia. Frutería Olga, calidad y frescura.</p>
            <p>Representación impresa de un comprobante de control interno.</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    // Esperamos un poco para que el navegador renderice antes de disparar el print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-700/30">
          <div>
            <h3 className="text-2xl font-black text-gray-800 dark:text-white">Detalle de Venta</h3>
            <p className="text-sm text-gray-500">{sale.documentType} #{sale.documentNumber}</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-2xl transition-all">
            <XCircle size={28} className="text-gray-400" />
          </button>
        </div>
        
        <div className="p-8 space-y-8 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div><p className="text-[10px] font-black text-gray-400 uppercase">Fecha</p><p className="font-bold text-sm text-gray-900 dark:text-white">{sale.date}</p></div>
            <div><p className="text-[10px] font-black text-gray-400 uppercase">Cliente</p><p className="font-bold text-sm text-gray-900 dark:text-white">{sale.clientName}</p></div>
            <div><p className="text-[10px] font-black text-gray-400 uppercase">DNI/RUC</p><p className="font-bold text-sm text-gray-900 dark:text-white font-mono">{sale.clientDocNumber}</p></div>
            <div><p className="text-[10px] font-black text-gray-400 uppercase">Estado Pago</p><p className={`font-black text-sm ${sale.saleStatus === 'Cancelado' ? 'text-green-600' : 'text-yellow-600'}`}>{sale.saleStatus}</p></div>
          </div>

          <div className="rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-4 font-black text-gray-400 uppercase text-[10px]">Producto</th>
                  <th className="px-6 py-4 font-black text-gray-400 uppercase text-[10px]">Cant.</th>
                  <th className="px-6 py-4 font-black text-gray-400 uppercase text-[10px]">Precio Unit</th>
                  <th className="px-6 py-4 font-black text-gray-400 uppercase text-[10px] text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {sale.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{item.productName}</td>
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
               <p className="font-black uppercase mb-1">Nota del Documento:</p>
               <p>Este comprobante es un registro interno para control de inventario y ventas en la plataforma Frutería Olga.</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Importe Total</span>
              <p className="text-4xl font-black text-primary-600">{formatMoney(sale.total)}</p>
            </div>
          </div>
        </div>
        
        <div className="p-8 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-4">
          <button onClick={onClose} className="px-8 py-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl font-bold text-gray-900 dark:text-white">Cerrar</button>
          <button 
            onClick={handlePrint}
            className="px-10 py-3 bg-primary-600 text-white rounded-2xl font-black flex items-center gap-2 shadow-lg shadow-primary-600/30 hover:bg-primary-700 transition-colors"
          >
            <Printer size={20} /> Imprimir Comprobante
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sales;
