
import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store';
import { Briefcase, Plus, Search, Edit2, Globe, Phone, Mail, ToggleLeft, ToggleRight, XCircle, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { Supplier } from '../types';

const Suppliers: React.FC = () => {
  const { state, addSupplier, updateSupplier } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
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
          <h2 className="text-2xl font-black text-gray-800 dark:text-white">Proveedores</h2>
          <p className="text-gray-500 dark:text-gray-400">Gestión de abastecedores mayoristas</p>
        </div>
        <button onClick={() => setShowForm(true)} className="bg-primary-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-primary-600/20">
          <Plus size={20} /> Nuevo Proveedor
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar proveedor por nombre o RUC..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white"
            />
          </div>
        </div>
        <table className="w-full text-left">
          <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs font-black uppercase text-gray-400 tracking-widest">
            <tr>
              <th className="px-6 py-4">Empresa / Fundo</th>
              <th className="px-6 py-4">RUC</th>
              <th className="px-6 py-4">Contacto</th>
              <th className="px-6 py-4 text-center">Estado</th>
              <th className="px-6 py-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {paginatedSuppliers.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400 italic">No se encontraron proveedores</td></tr>
            ) : (
              paginatedSuppliers.map(s => (
                <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{s.name}</td>
                  <td className="px-6 py-4 font-mono text-gray-700 dark:text-gray-300">{s.ruc}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-800 dark:text-gray-200">{s.contact}</div>
                    <div className="text-xs text-gray-400">{s.email}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                     <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${s.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {s.active ? 'Activo' : 'Inactivo'}
                     </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                     <div className="flex justify-center gap-2">
                       <button onClick={() => { setEditing(s); setShowForm(true); }} title="Editar Proveedor" className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-all"><Edit2 size={18} /></button>
                       <button 
                         onClick={() => updateSupplier({...s, active: !s.active})} 
                         title={s.active ? "Desactivar Proveedor" : "Activar Proveedor"}
                         className="p-2 rounded-xl transition-all hover:bg-gray-100 dark:hover:bg-gray-700"
                       >
                          {s.active ? <ToggleRight size={24} className="text-primary-600" /> : <ToggleLeft size={24} className="text-gray-400" />}
                       </button>
                     </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        {/* Paginación */}
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
          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 w-full max-md rounded-[2.5rem] shadow-2xl p-8 border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-gray-800 dark:text-white">{editing ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h3>
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl">
                <XCircle size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase mb-2">Nombre / Razón Social</label>
                <input name="name" defaultValue={editing?.name} required className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase mb-2">RUC</label>
                <input name="ruc" defaultValue={editing?.ruc} required className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-xs font-black text-gray-400 uppercase mb-2">Celular</label>
                   <input name="contact" defaultValue={editing?.contact} className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white" />
                 </div>
                 <div>
                   <label className="block text-xs font-black text-gray-400 uppercase mb-2">Email</label>
                   <input name="email" type="email" defaultValue={editing?.email} className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white" />
                 </div>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase mb-2">Dirección Fiscal / Oficina</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input name="address" defaultValue={editing?.address} required className="w-full pl-12 pr-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white" placeholder="Ej: Av. Central 456, Huánuco" />
                </div>
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="px-6 py-3 rounded-2xl font-bold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">Cancelar</button>
              <button type="submit" className="px-10 py-3 rounded-2xl font-black bg-primary-600 text-white shadow-lg shadow-primary-600/30">Guardar Proveedor</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Suppliers;
