
import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store';
import { Plus, Search, Edit2, ToggleLeft, ToggleRight, UserPlus, MapPin, XCircle, Trash2, Loader2, Search as SearchIcon, ShieldAlert, AlertTriangle } from 'lucide-react';
import { Client } from '../types';

const Clients: React.FC = () => {
  const { state, addClient, updateClient, deleteClient } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // ESTADO PARA EL MODAL DE ELIMINACIÓN
  const [idToDelete, setIdToDelete] = useState<string | null>(null);

  const [formName, setFormName] = useState('');
  const [formDocType, setFormDocType] = useState<'DNI' | 'RUC'>('DNI');
  const [formDocNumber, setFormDocNumber] = useState('');
  const [formContact, setFormContact] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    if (editingClient) {
      setFormName(editingClient.name);
      setFormDocType(editingClient.docType);
      setFormDocNumber(editingClient.docNumber);
      setFormContact(editingClient.contact || '');
      setFormAddress(editingClient.address || '');
    } else {
      setFormName('');
      setFormDocType('DNI');
      setFormDocNumber('');
      setFormContact('');
      setFormAddress('');
    }
    setSearchError(null);
  }, [editingClient, showForm]);

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

  const handleSunatSearch = async () => {
    const doc = formDocNumber.trim();
    const type = formDocType;
    const { dniUrl, rucUrl, token } = state.identityApi;

    if (type === 'DNI' && doc.length !== 8) return alert("El DNI debe tener 8 dígitos.");
    if (type === 'RUC' && doc.length !== 11) return alert("El RUC debe tener 11 dígitos.");
    if (!token) return alert("Por favor, configure su API Token en Ajustes.");

    setIsSearching(true);
    setSearchError(null);
    
    try {
      const baseUrl = type === 'DNI' ? dniUrl : rucUrl;
      const finalUrl = `${baseUrl}/${doc}?token=${token}`;

      const response = await fetch(finalUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) throw new Error("Error en servicio de consulta.");
      
      const data = await response.json();

      if (data) {
        let name = "";
        let address = "";

        if (type === 'DNI') {
          name = `${data.nombres || ''} ${data.apellidoPaterno || ''} ${data.apellidoMaterno || ''}`.trim() || data.nombre_completo || "";
        } else {
          name = data.razonSocial || data.nombre || "";
          address = data.direccion || data.direccion_completa || "";
        }

        if (name) {
          setFormName(name.toUpperCase());
          if (address) setFormAddress(address.toUpperCase());
        }
      }
    } catch (error: any) {
      setSearchError(error.message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formName) return;

    const clientData: Client = {
      id: editingClient?.id || Date.now().toString(),
      name: formName,
      docType: formDocType,
      docNumber: formDocNumber,
      contact: formContact,
      address: formAddress,
      active: editingClient ? editingClient.active : true,
    };

    if (editingClient) updateClient(clientData);
    else addClient(clientData);
    
    setShowForm(false);
    setEditingClient(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-800 dark:text-white tracking-tighter">Clientes</h2>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Gestión de cartera de clientes</p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-primary-600/20 transition-all hover:scale-105 active:scale-95"
        >
          <UserPlus size={20} />
          Nuevo Cliente
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
           <div className="relative max-w-md">
            <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nombre o DNI/RUC..." 
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
                <th className="px-8 py-6">Cliente</th>
                <th className="px-8 py-6">Documento</th>
                <th className="px-8 py-6 text-center">Estado</th>
                <th className="px-8 py-6 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {paginatedClients.length === 0 ? (
                <tr><td colSpan={4} className="px-8 py-20 text-center text-gray-400 font-bold italic uppercase text-xs">No hay registros</td></tr>
              ) : (
                paginatedClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-8 py-5">
                      <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">{client.name}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">{client.address || 'Sin dirección'}</p>
                    </td>
                    <td className="px-8 py-5">
                       <span className="text-[10px] font-black text-primary-600 block">{client.docType}</span>
                       <span className="text-sm font-mono font-bold text-gray-700 dark:text-gray-300">{client.docNumber}</span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${client.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {client.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <div className="flex items-center justify-center gap-2 relative z-10">
                        <button 
                          type="button"
                          onClick={() => { setEditingClient(client); setShowForm(true); }} 
                          className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-all"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          type="button"
                          onClick={() => updateClient({ ...client, active: !client.active })} 
                          className={`p-2 rounded-xl transition-all ${client.active ? 'text-red-500 hover:bg-red-50' : 'text-green-500 hover:bg-green-50'}`}
                        >
                          {client.active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                        </button>
                        <button 
                          type="button"
                          onClick={() => setIdToDelete(client.id)}
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
      </div>

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN PERSONALIZADO */}
      {idToDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-[2.5rem] shadow-2xl p-10 text-center border border-white/10">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">Confirmar Acción</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-8">
              ¿Estás seguro de eliminar el cliente? Esta acción no se puede deshacer.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                type="button"
                onClick={() => {
                  deleteClient(idToDelete);
                  setIdToDelete(null);
                }}
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
              <div>
                <h3 className="text-2xl font-black text-gray-800 dark:text-white tracking-tighter">{editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
              </div>
              <button type="button" onClick={() => { setShowForm(false); setEditingClient(null); }} className="p-3 text-gray-300 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all"><XCircle size={28} /></button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1 tracking-widest">Documento</label>
                  <select value={formDocType} onChange={e => setFormDocType(e.target.value as 'DNI' | 'RUC')} className="w-full px-4 py-4 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none outline-none text-gray-900 dark:text-white font-black text-xs uppercase shadow-sm">
                    <option value="DNI">DNI</option>
                    <option value="RUC">RUC</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1 tracking-widest">N° Registro</label>
                  <div className="relative">
                    <input value={formDocNumber} onChange={e => setFormDocNumber(e.target.value)} required className="w-full pl-4 pr-12 py-4 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white font-mono font-black text-sm" />
                    <button type="button" onClick={handleSunatSearch} disabled={isSearching} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700">
                      {isSearching ? <Loader2 size={16} className="animate-spin" /> : <SearchIcon size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1 tracking-widest">Nombre / Razón Social</label>
                <input value={formName} onChange={e => setFormName(e.target.value)} required className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white font-black text-sm uppercase" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1 tracking-widest">Teléfono</label>
                  <input value={formContact} onChange={e => setFormContact(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none text-gray-900 dark:text-white font-bold text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1 tracking-widest">Dirección</label>
                  <input value={formAddress} onChange={e => setFormAddress(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none text-gray-900 dark:text-white font-bold text-xs uppercase" />
                </div>
              </div>
            </div>
            
            <div className="mt-10 flex justify-end gap-4">
              <button type="button" onClick={() => { setShowForm(false); setEditingClient(null); }} className="px-8 py-4 bg-gray-100 rounded-2xl font-black text-[10px] uppercase text-gray-400">Descartar</button>
              <button type="submit" className="px-12 py-4 bg-primary-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary-600/30">
                Guardar Cliente
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Clients;
