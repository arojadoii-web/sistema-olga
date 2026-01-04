
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useStore } from '../store';
import { 
  Plus, Search, Eye, XCircle, Trash2, Printer, Edit2,
  PlusCircle, User, FileText, Calendar, Tag, CheckCircle2, Loader2,
  ChevronLeft, ChevronRight, Download, Package
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
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">Ventas</h2>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Facturación y registro de pedidos</p>
        </div>
        {view === 'list' ? (
          <div className="grid grid-cols-2 sm:flex gap-3">
            <button 
              onClick={() => setShowReportModal(true)}
              className="flex items-center justify-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 px-4 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm transition-all hover:bg-gray-50 active:scale-95"
            >
              <FileText size={18} className="text-primary-600" />
              Reporte
            </button>
            <button 
              onClick={() => { setEditingSale(null); setView('new'); }}
              className="flex items-center justify-center gap-2 bg-primary-600 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary-600/30 transition-all active:scale-95"
            >
              <PlusCircle size={18} />
              Vender
            </button>
          </div>
        ) : (
          <button 
            onClick={() => { setView('list'); setEditingSale(null); }}
            className="text-gray-400 hover:text-red-500 font-black text-xs uppercase tracking-widest flex items-center gap-2 py-2"
          >
            <XCircle size={18} />
            Cancelar Operación
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
  const itemsPerPage = 10;

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
    if (confirm('¿Está seguro de anular esta venta?')) {
      setIsCancelling(id);
      await onCancel(id);
      setIsCancelling(null);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="p-6 md:p-8 border-b border-gray-100 dark:border-gray-700">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por cliente o factura..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-6 py-4 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none focus:ring-2 focus:ring-primary-500 outline-none text-sm font-bold text-gray-900 dark:text-white transition-all"
          />
        </div>
      </div>
      
      {/* Vista móvil */}
      <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-700">
        {paginatedSales.length === 0 ? (
          <div className="p-20 text-center text-gray-400 font-bold italic uppercase tracking-widest text-xs">Vacio</div>
        ) : (
          paginatedSales.map(sale => (
            <div key={sale.id} className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{sale.date}</p>
                  <p className="font-black text-gray-900 dark:text-white leading-tight">{sale.clientName}</p>
                  <p className="text-[10px] font-bold text-primary-600 uppercase mt-1">{sale.documentType} {sale.documentNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-primary-600 leading-none">{formatMoney(sale.total)}</p>
                  <div className="flex flex-col items-end gap-1 mt-2">
                    <span className={`inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                      sale.saleStatus === 'Cancelado' ? 'bg-green-100 text-green-700' : 
                      sale.saleStatus === 'Pendiente' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {sale.saleStatus}
                    </span>
                    <span className={`inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                      sale.docStatus === 'Emitido' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {sale.docStatus}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => onView(sale)} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl text-xs font-black uppercase tracking-widest text-gray-600 dark:text-gray-300">Ver</button>
                <button onClick={() => onEdit(sale)} className="flex-1 py-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl text-xs font-black uppercase tracking-widest text-primary-600">Editar</button>
                {sale.saleStatus !== 'Anulado' && (
                  <button onClick={() => handleCancelClick(sale.id)} className="p-3 text-red-500 bg-red-50 dark:bg-red-900/10 rounded-xl">
                    <XCircle size={18} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Vista desktop */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 dark:bg-gray-700/50 text-[10px] font-black uppercase text-gray-400 tracking-widest">
            <tr>
              <th className="px-8 py-6">Fecha</th>
              <th className="px-8 py-6">Cliente</th>
              <th className="px-8 py-6">Documento</th>
              <th className="px-8 py-6 text-right">Total</th>
              <th className="px-8 py-6 text-center">Estado Venta</th>
              <th className="px-8 py-6 text-center">Estado Doc</th>
              <th className="px-8 py-6 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {paginatedSales.map((sale) => (
              <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                <td className="px-8 py-5 text-sm font-bold text-gray-900 dark:text-white">{sale.date}</td>
                <td className="px-8 py-5">
                  <div className="text-sm font-black text-gray-900 dark:text-white uppercase">{sale.clientName}</div>
                  <div className="text-[10px] text-gray-400 font-bold">{sale.clientDocType}: {sale.clientDocNumber}</div>
                </td>
                <td className="px-8 py-5">
                  <div className="text-[10px] font-black text-primary-600 uppercase tracking-widest">{sale.documentType}</div>
                  <div className="text-sm font-black text-gray-900 dark:text-white">{sale.documentNumber}</div>
                </td>
                <td className="px-8 py-5 text-right text-base font-black text-primary-600">{formatMoney(sale.total)}</td>
                <td className="px-8 py-5 text-center">
                  <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                    sale.saleStatus === 'Cancelado' ? 'bg-green-100 text-green-700' : 
                    sale.saleStatus === 'Pendiente' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {sale.saleStatus}
                  </span>
                </td>
                <td className="px-8 py-5 text-center">
                  <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                    sale.docStatus === 'Emitido' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {sale.docStatus}
                  </span>
                </td>
                <td className="px-8 py-5">
                  <div className="flex items-center justify-center gap-3">
                    <button onClick={() => onView(sale)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all"><Eye size={18} /></button>
                    <button onClick={() => onEdit(sale)} className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-all"><Edit2 size={18} /></button>
                    {sale.saleStatus !== 'Anulado' && (
                      <button 
                        disabled={isCancelling === sale.id}
                        onClick={() => handleCancelClick(sale.id)} 
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl disabled:opacity-50"
                      >
                        {isCancelling === sale.id ? <Loader2 className="animate-spin" size={18} /> : <XCircle size={18} />}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {totalPages > 1 && (
        <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/30 dark:bg-gray-800/50">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Pag. {currentPage} / {totalPages}
          </span>
          <div className="flex gap-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="p-3 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 disabled:opacity-50 active:scale-90 transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="p-3 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 disabled:opacity-50 active:scale-90 transition-all"
            >
              <ChevronRight size={20} />
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
      alert('Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 grid grid-cols-1 md:grid-cols-6 gap-6">
        <div className="md:col-span-6 border-b border-gray-100 dark:border-gray-700 pb-6 flex items-center gap-3 text-primary-600 font-black uppercase tracking-[0.2em] text-[10px]">
          <User size={18} /> Datos del Cliente y Facturación
        </div>
        
        <div className="md:col-span-1">
          <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 ml-1 tracking-widest">Fecha</label>
          <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-4 py-4 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white font-bold text-xs" />
        </div>

        <div className="relative md:col-span-1">
          <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 ml-1 tracking-widest">Buscar DNI/RUC</label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input 
              type="text" 
              placeholder="Número..." 
              value={docSearch}
              onChange={(e) => setDocSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-4 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white font-mono font-bold text-xs" 
            />
          </div>
          {docSuggestions.length > 0 && (
            <div className="absolute z-[110] left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-600 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
              {docSuggestions.map(client => (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => handleSelectClient(client)}
                  className="w-full px-4 py-3 text-left hover:bg-primary-50 dark:hover:bg-primary-900/20 text-sm flex flex-col border-b border-gray-50 last:border-0"
                >
                  <span className="font-black text-gray-900 dark:text-white text-xs">{client.docNumber}</span>
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">{client.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 ml-1 tracking-widest">Nombre Cliente</label>
          <select value={formData.clientId} onChange={e => {
            const client = clients.find(c => c.id === e.target.value);
            if (client) handleSelectClient(client);
            else setFormData({...formData, clientId: ''});
          }} className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white font-black text-[11px] uppercase">
            <option value="">Elegir cliente...</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 ml-1 tracking-widest">Servicio</label>
          <select value={formData.service} onChange={e => setFormData({...formData, service: e.target.value as ServiceType})} className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white font-bold text-xs uppercase tracking-tighter">
            <option value="Venta de Frutas">VENTA DE FRUTAS</option>
            <option value="Alquiler de Local">ALQUILER DE LOCAL</option>
          </select>
        </div>

        <div className="md:col-span-1">
          <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 ml-1 tracking-widest">Comprobante</label>
          <select value={formData.documentType} onChange={e => setFormData({...formData, documentType: e.target.value as DocumentType})} className="w-full px-4 py-4 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white font-black text-xs">
            <option value="Boleta">BOLETA</option>
            <option value="Factura">FACTURA</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 ml-1 tracking-widest">N° Comprobante</label>
          <input type="text" value={formData.documentNumber} onChange={e => setFormData({...formData, documentNumber: e.target.value})} className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white font-black text-xs uppercase" placeholder="F001-XXXX" />
        </div>

        <div className="md:col-span-1">
          <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 ml-1 tracking-widest">Estado Doc</label>
          <select value={formData.docStatus} onChange={e => setFormData({...formData, docStatus: e.target.value as DocStatus})} className="w-full px-4 py-4 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white font-black text-xs">
            <option value="Emitido">EMITIDO</option>
            <option value="Pendiente">PENDIENTE</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 ml-1 tracking-widest">Estado Venta</label>
          <select value={formData.saleStatus} onChange={e => setFormData({...formData, saleStatus: e.target.value as SaleStatus})} className={`w-full px-4 py-4 rounded-2xl border-none outline-none focus:ring-2 focus:ring-primary-500 font-black text-xs uppercase ${
            formData.saleStatus === 'Cancelado' ? 'bg-green-50 text-green-700' : 
            formData.saleStatus === 'Pendiente' ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'
          }`}>
            <option value="Pendiente">PENDIENTE</option>
            <option value="Cancelado">CANCELADO</option>
            <option value="Anulado">ANULADO</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-center mb-8">
           <div className="flex items-center gap-3">
             <div className="p-2 bg-primary-100 text-primary-600 rounded-xl"><Package size={18} /></div>
             <h3 className="font-black text-gray-900 dark:text-white text-[10px] tracking-[0.2em] uppercase">Detalle Pedido</h3>
           </div>
           <button type="button" onClick={addItem} className="bg-primary-50 text-primary-600 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">
             + Item
           </button>
        </div>
        
        <div className="space-y-6">
          {items.map((item, i) => (
            <div key={i} className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-3xl relative animate-in slide-in-from-right-4">
              <button 
                type="button" 
                onClick={() => removeItem(i)} 
                className="absolute -top-2 -right-2 p-2 bg-red-500 text-white rounded-full shadow-lg active:scale-90"
              >
                <Trash2 size={16} />
              </button>
              
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-5 relative">
                  <label className="block text-[9px] font-black text-gray-400 uppercase mb-2 ml-1 tracking-widest">Producto</label>
                  <input 
                    type="text" 
                    placeholder="Escriba producto..."
                    value={productSearch.index === i ? productSearch.term : (item.productName || '')}
                    onFocus={() => setProductSearch({ index: i, term: item.productName || '' })}
                    onChange={(e) => setProductSearch({ index: i, term: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white font-bold outline-none border-2 border-transparent focus:border-primary-500 transition-all uppercase"
                  />
                  {productSearch.index === i && productSearch.term.length > 0 && (
                    <div className="absolute z-[200] left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-2xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto animate-in fade-in">
                      {products
                        .filter(p => p.name.toLowerCase().includes(productSearch.term.toLowerCase()))
                        .slice(0, 8)
                        .map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            updateItem(i, 'productId', p.id);
                            setProductSearch({ index: null, term: '' });
                          }}
                          className="w-full px-5 py-4 text-left hover:bg-primary-50 dark:hover:bg-primary-900/20 text-xs flex justify-between items-center border-b border-gray-100 last:border-0"
                        >
                          <span className="font-black text-gray-800 dark:text-white uppercase">{p.name}</span>
                          <span className="text-[9px] bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg text-gray-400">Stock: {p.stock}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 md:col-span-7 gap-3">
                  <div className="col-span-1">
                    <label className="block text-[9px] font-black text-gray-400 uppercase mb-2 ml-1 tracking-widest">Cant.</label>
                    <input type="number" step="0.01" value={item.quantity} onChange={e => updateItem(i, 'quantity', Number(e.target.value))} className="w-full px-3 py-3 rounded-xl bg-white dark:bg-gray-800 text-sm font-black [appearance:textfield]" />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-[9px] font-black text-gray-400 uppercase mb-2 ml-1 tracking-widest">P. Unit</label>
                    <input type="number" step="0.01" value={item.unitPrice} onChange={e => updateItem(i, 'unitPrice', Number(e.target.value))} className="w-full px-3 py-3 rounded-xl bg-white dark:bg-gray-800 text-sm font-black text-primary-600 [appearance:textfield]" />
                  </div>
                  <div className="col-span-1 text-right flex flex-col justify-end pb-3">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter mb-1">Subtotal</span>
                    <span className="text-sm font-black text-primary-600">{formatMoney(item.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {items.length === 0 && <p className="text-center py-12 text-gray-400 font-bold italic text-sm">SIN PRODUCTOS...</p>}
        </div>

        <div className="mt-10 pt-8 border-t border-gray-100 dark:border-gray-700 flex flex-col items-end">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Total del Pedido</p>
          <p className="text-5xl font-black text-primary-600 tracking-tighter">{formatMoney(total)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:flex justify-end gap-4">
        <button type="button" disabled={isSaving} onClick={onCancel} className="w-full sm:w-auto px-10 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-400 active:scale-95 transition-all">Descartar</button>
        <button 
          type="submit" 
          disabled={isSaving}
          className="w-full sm:w-auto px-16 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] bg-primary-600 text-white shadow-2xl shadow-primary-600/30 transition-all active:scale-95 flex items-center justify-center gap-3"
        >
          {isSaving ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
          {isSaving ? 'Enviando...' : 'Confirmar Venta'}
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
      alert("Cargando...");
      return;
    }

    setIsGenerating(true);
    try {
      const { jsPDF } = (window as any).jspdf;
      const doc = new jsPDF();
      
      const filtered = sales.filter(s => {
        const dateMatch = s.date >= fromDate && s.date <= toDate;
        const clientMatch = clientId === 'all' || s.clientId === clientId;
        return dateMatch && clientMatch && s.saleStatus !== 'Anulado';
      }).sort((a, b) => a.date.localeCompare(b.date));

      if (filtered.length === 0) {
        alert("Sin datos");
        setIsGenerating(false);
        return;
      }

      doc.setFontSize(22);
      doc.setTextColor(22, 163, 74);
      doc.text('FRUTERÍA OLGA', 105, 20, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('REPORTE DE VENTAS CLOUD', 105, 28, { align: 'center' });
      
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text(`Periodo: ${fromDate} - ${toDate}`, 20, 45);

      const tableRows = filtered.map(s => [
        s.date,
        s.documentNumber,
        s.clientName,
        formatMoney(s.total)
      ]);

      (doc as any).autoTable({
        startY: 55,
        head: [['FECHA', 'DOC', 'CLIENTE', 'TOTAL']],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [22, 163, 74] }
      });

      doc.save(`Reporte_Olga_${new Date().getTime()}.pdf`);
      onClose();
    } catch (err) {
      alert("Error PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden border border-white/20">
        <div className="p-10 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-700/30">
          <div>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">Reporte PDF</h3>
            <p className="text-[10px] text-primary-600 font-black uppercase tracking-widest mt-1">Configuración de Filtros</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-red-50 text-gray-300 hover:text-red-500 rounded-2xl transition-all">
            <XCircle size={28} />
          </button>
        </div>

        <div className="p-10 space-y-8">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 ml-1 tracking-widest">Desde</label>
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none font-bold" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 ml-1 tracking-widest">Hasta</label>
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none font-bold" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 ml-1 tracking-widest">Filtrar Cliente</label>
            <select value={clientId} onChange={e => setClientId(e.target.value)} className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none font-black text-sm uppercase">
              <option value="all">TODOS LOS CLIENTES</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <div className="p-10 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-4">
          <button onClick={onClose} className="px-8 py-4 bg-white dark:bg-gray-800 border border-gray-100 rounded-2xl font-black text-[10px] uppercase tracking-widest text-gray-400">Cerrar</button>
          <button 
            onClick={generatePDF}
            disabled={isGenerating}
            className="px-12 py-4 bg-primary-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-primary-600/30 active:scale-95 disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
            Descargar PDF
          </button>
        </div>
      </div>
    </div>
  );
};

const SaleDetailModal: React.FC<{ sale: Sale, onClose: () => void, formatMoney: (n: number) => string }> = ({ sale, onClose, formatMoney }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in zoom-in-95">
      <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-white/10">
        <div className="p-10 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-700/30">
          <div>
            <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">Detalle</h3>
            <p className="text-[10px] font-black text-primary-600 uppercase mt-1 tracking-widest">{sale.documentType} #{sale.documentNumber}</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-gray-100 rounded-2xl transition-all"><XCircle size={28} className="text-gray-300" /></button>
        </div>
        
        <div className="p-10 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-2 gap-8">
            <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Cliente</p><p className="font-black text-gray-900 dark:text-white uppercase">{sale.clientName}</p></div>
            <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Fecha</p><p className="font-black text-gray-900 dark:text-white">{sale.date}</p></div>
          </div>

          <div className="space-y-3">
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Productos</p>
             <div className="divide-y divide-gray-100 dark:divide-gray-700">
               {sale.items.map((item, idx) => (
                 <div key={idx} className="py-4 flex justify-between items-center">
                   <div>
                     <p className="text-sm font-black text-gray-900 dark:text-white uppercase">{item.productName}</p>
                     <p className="text-[10px] text-gray-400 font-bold">{item.quantity} {item.unit} x {formatMoney(item.unitPrice)}</p>
                   </div>
                   <p className="font-black text-primary-600">{formatMoney(item.total)}</p>
                 </div>
               ))}
             </div>
          </div>

          <div className="flex justify-between items-center bg-primary-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-primary-600/30">
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Importe Total</span>
            <p className="text-4xl font-black tracking-tighter">{formatMoney(sale.total)}</p>
          </div>
        </div>
        
        <div className="p-10 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-100 dark:border-gray-700 flex justify-end">
          <button onClick={onClose} className="w-full py-5 bg-gray-100 dark:bg-gray-700 rounded-3xl font-black text-[10px] uppercase tracking-widest text-gray-400 active:scale-95 transition-all">Cerrar Detalle</button>
        </div>
      </div>
    </div>
  );
};

export default Sales;
