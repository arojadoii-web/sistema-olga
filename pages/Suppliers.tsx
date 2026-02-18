
import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store';
import { Briefcase, Plus, Search, Edit2, ToggleLeft, ToggleRight, XCircle, MapPin, ChevronLeft, ChevronRight, Trash2, AlertTriangle } from 'lucide-react';
import { Supplier } from '../types';

const Suppliers: React.FC = () => {
  const { state, addSupplier, updateSupplier, deleteSupplier } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [idToDelete, setIdToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const filteredSuppliers = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return state.suppliers.filter(s => 
      s.name.toLowerCase().includes(term) || 
      s.ruc.toLowerCase().includes(term)
    );
  }, [state.suppliers, searchTerm]);

  const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage);
  const paginatedSuppliers = filteredSuppliers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data: Supplier = {
      id: editing?.id || Date.now().toString(),
      name: fd.get('name') as string,
      ruc: fd.get('ruc') as string,
      contact: fd.get('contact') as string,
      email: fd.get('email') as string,
      address: fd.get('address') as string,
      active: editing ? editing.active : true,
    };
    if (editing) updateSupplier(data);
    else addSupplier(data);
    setShowForm(false);
    setEditing(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-gray-800 dark:text-white tracking-tighter">Proveedores</h2>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Gestión de abastecedores mayoristas</p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          title="Agregar un nuevo proveedor"
          className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-primary-600/20 transition-all hover:scale-105 active:scale-95"
        >
          <Plus size={20} /> Nuevo Proveedor
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="relative max-w-md">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar proveedor..." 
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
                <th className="px-8 py-6">Empresa / Fundo</th>
                <th className="px-8 py-6">RUC</th>
                <th className="px-8 py-6">Contacto</th>
                <th className="px-8 py-6 text-center">Estado</th>
                <th className="px-8 py-6 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {paginatedSuppliers.length === 0 ? (
                <tr><td colSpan={5} className="px-8 py-20 text-center text-gray-400 font-bold italic uppercase text-xs">No hay registros</td></tr>
              ) : (
                paginatedSuppliers.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-8 py-5">
                      <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">{s.name}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">{s.address || 'Sin dirección'}</p>
                    </td>
                    <td className="px-8 py-5 font-mono font-bold text-gray-700 dark:text-gray-300 text-sm">{s.ruc}</td>
                    <td className="px-8 py-5">
                      <div className="text-sm font-bold text-gray-800 dark:text-gray-200">{s.contact}</div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{s.email}</div>
                    </td>
                    <td className="px-8 py-5 text-center">
                       <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${s.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {s.active ? 'Activo' : 'Inactivo'}
                       </span>
                    </td>
                    <td className="px-8 py-5 text-center">
                       <div className="flex justify-center gap-2">
                         <button 
                          onClick={() => { setEditing(s); setShowForm(true); }} 
                          title="Editar Proveedor" 
                          className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-all"
                         >
                           <Edit2 size={18} />
                         </button>
                         <button 
                           onClick={() => updateSupplier({...s, active: !s.active})} 
                           title={s.active ? "Desactivar Proveedor" : "Activar Proveedor"}
                           className="p-2 rounded-xl transition-all hover:bg-gray-100 dark:hover:bg-gray-700"
                         >
                            {s.active ? <ToggleRight size={24} className="text-primary-600" /> : <ToggleLeft size={24} className="text-gray-400" />}
                         </button>
                         <button 
                           onClick={() => setIdToDelete(s.id)}
                           title="Eliminar Proveedor"
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

      {/* MODAL DE ELIMINACIÓN */}
      {idToDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-[2.5rem] shadow-2xl p-10 text-center border border-white/10">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">Confirmar Acción</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-8">
              ¿Estás seguro de eliminar este proveedor? Esta acción no se puede deshacer.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                type="button"
                onClick={() => { deleteSupplier(idToDelete); setIdToDelete(null); }}
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-[3rem] shadow-2xl p-10 border border-white/10 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-gray-800 dark:text-white tracking-tighter">{editing ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h3>
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} title="Cerrar formulario" className="p-3 text-gray-300 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all">
                <XCircle size={28} />
              </button>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 ml-1 tracking-widest">Nombre / Razón Social</label>
                <input name="name" defaultValue={editing?.name} required className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white font-black text-sm uppercase shadow-sm" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 ml-1 tracking-widest">RUC</label>
                <input name="ruc" defaultValue={editing?.ruc} required className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white font-mono font-black text-sm shadow-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 ml-1 tracking-widest">Celular</label>
                   <input name="contact" defaultValue={editing?.contact} className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none outline-none text-gray-900 dark:text-white font-bold text-sm" />
                 </div>
                 <div>
                   <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 ml-1 tracking-widest">Email</label>
                   <input name="email" type="email" defaultValue={editing?.email} className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none outline-none text-gray-900 dark:text-white font-bold text-sm" />
                 </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 ml-1 tracking-widest">Dirección Fiscal / Oficina</label>
                <div className="relative">
                  <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input name="address" defaultValue={editing?.address} required className="w-full pl-14 pr-6 py-4 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white font-bold text-xs uppercase" placeholder="Ej: Av. Central 456, Huánuco" />
                </div>
              </div>
            </div>
            <div className="mt-10 flex justify-end gap-4">
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="px-8 py-4 bg-gray-100 rounded-2xl font-black text-[10px] uppercase tracking-widest text-gray-400">Descartar</button>
              <button type="submit" className="px-12 py-4 bg-primary-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary-600/30 transition-all active:scale-95">Guardar Proveedor</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Suppliers;
