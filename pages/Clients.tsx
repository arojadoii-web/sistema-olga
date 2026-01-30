
import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store';
import { Plus, Search, Edit2, ToggleLeft, ToggleRight, UserPlus, MapPin, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Client } from '../types';

const Clients: React.FC = () => {
  const { state, addClient, updateClient } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const filteredClients = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return state.clients.filter(client => 
      client.name.toLowerCase().includes(term) || 
      client.docNumber.includes(term)
    );
  }, [state.clients, searchTerm]);

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const clientData: Client = {
      id: editingClient?.id || Date.now().toString(),
      name: formData.get('name') as string,
      docType: formData.get('docType') as any,
      docNumber: formData.get('docNumber') as string,
      contact: formData.get('contact') as string,
      address: formData.get('address') as string,
      active: editingClient ? editingClient.active : true,
    };

    if (editingClient) {
      updateClient(clientData);
    } else {
      addClient(clientData);
    }
    setShowForm(false);
    setEditingClient(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Registro de Clientes</h2>
          <p className="text-gray-500 dark:text-gray-400">Base de datos de compradores locales</p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-primary-600/20 transition-all"
        >
          <UserPlus size={20} />
          Nuevo Cliente
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
           <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nombre o DNI/RUC..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs font-bold uppercase text-gray-400 tracking-wider">
              <tr>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Tipo Doc.</th>
                <th className="px-6 py-4">N° Documento</th>
                <th className="px-6 py-4">Contacto</th>
                <th className="px-6 py-4">Dirección</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {paginatedClients.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-10 text-center text-gray-400 italic">No se encontraron clientes</td></tr>
              ) : (
                paginatedClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{client.name}</p>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">{client.docType}</td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-800 dark:text-gray-200">{client.docNumber}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{client.contact}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">{client.address}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${client.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {client.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => { setEditingClient(client); setShowForm(true); }}
                          title="Editar Cliente"
                          className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => updateClient({ ...client, active: !client.active })}
                          title={client.active ? "Desactivar Cliente" : "Activar Cliente"}
                          className={`p-2 rounded-xl transition-all ${client.active ? 'text-red-500 hover:bg-red-50' : 'text-green-500 hover:bg-green-50'}`}
                        >
                          {client.active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
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
          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 w-full max-md rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 p-8 border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-gray-800 dark:text-white">{editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
              <button type="button" onClick={() => { setShowForm(false); setEditingClient(null); }} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl">
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase mb-2">Nombre Completo / Razón Social</label>
                <input name="name" defaultValue={editingClient?.name} required className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase mb-2">Tipo Doc.</label>
                  <select name="docType" defaultValue={editingClient?.docType} className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none outline-none text-gray-900 dark:text-white font-bold">
                    <option value="DNI">DNI</option>
                    <option value="RUC">RUC</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase mb-2">N° Documento</label>
                  <input name="docNumber" defaultValue={editingClient?.docNumber} required className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white" />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase mb-2">Celular / Contacto</label>
                <input name="contact" defaultValue={editingClient?.contact} className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white" />
              </div>
              
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase mb-2">Dirección de Entrega / Local</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input name="address" defaultValue={editingClient?.address} required className="w-full pl-12 pr-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white" placeholder="Ej: Jr. Comercio 123, Huánuco" />
                </div>
              </div>
            </div>
            
            <div className="mt-8 flex justify-end gap-3">
              <button type="button" onClick={() => { setShowForm(false); setEditingClient(null); }} className="px-6 py-3 bg-gray-100 dark:bg-gray-700 rounded-2xl font-bold text-gray-700 dark:text-gray-300">Cancelar</button>
              <button type="submit" className="px-10 py-3 bg-primary-600 text-white rounded-2xl font-black shadow-lg shadow-primary-600/30 transition-all hover:scale-105">
                {editingClient ? 'Actualizar' : 'Guardar Cliente'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Clients;
