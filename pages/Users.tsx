
import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store';
import { 
  UserPlus, Search, Edit2, Trash2, Eye, XCircle, 
  UserCircle, ChevronLeft, ChevronRight, Sparkles, EyeOff, AlertTriangle
} from 'lucide-react';
import { SystemUser, UserRole } from '../types';

const Users: React.FC = () => {
  const { state, addSystemUser, updateSystemUser, deleteSystemUser } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [viewingUser, setViewingUser] = useState<SystemUser | null>(null);
  const [idToDelete, setIdToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const filteredUsers = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return state.users.filter(u => 
      u.name.toLowerCase().includes(term) || 
      u.username.toLowerCase().includes(term)
    );
  }, [state.users, searchTerm]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const userData: SystemUser = {
      id: editingUser?.id || Date.now().toString(),
      name: fd.get('name') as string,
      dni: fd.get('dni') as string,
      phone: fd.get('phone') as string,
      functions: fd.get('functions') as string,
      username: fd.get('username') as string,
      password: fd.get('password') as string,
      role: fd.get('role') as UserRole,
      active: editingUser ? editingUser.active : true,
      photo: editingUser?.photo
    };

    if (editingUser) {
      updateSystemUser(userData);
    } else {
      if (state.users.some(u => u.username === userData.username)) {
        return alert('El nombre de usuario ya existe.');
      }
      addSystemUser(userData);
    }
    setShowForm(false);
    setEditingUser(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-800 dark:text-white tracking-tighter">Gestión de Usuarios</h2>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Control de accesos y roles del sistema</p>
        </div>
        <button 
          onClick={() => { setEditingUser(null); setShowForm(true); }}
          title="Crear nueva cuenta de acceso"
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-primary-600/20 transition-all hover:scale-105 active:scale-95"
        >
          <UserPlus size={20} />
          Nuevo Usuario
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
           <div className="relative max-w-md">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nombre o usuario..." 
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
                <th className="px-8 py-6">Usuario</th>
                <th className="px-8 py-6">Personal</th>
                <th className="px-8 py-6">Rol</th>
                <th className="px-8 py-6 text-center">Estado</th>
                <th className="px-8 py-6 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {paginatedUsers.length === 0 ? (
                <tr><td colSpan={5} className="px-8 py-20 text-center text-gray-400 font-bold italic uppercase text-xs">No hay registros</td></tr>
              ) : (
                paginatedUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 overflow-hidden flex items-center justify-center text-primary-600">
                          {u.photo ? <img src={u.photo} className="w-full h-full object-cover" /> : <UserCircle size={24} />}
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-900 dark:text-white">@{u.username}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{u.functions}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-sm font-black text-gray-800 dark:text-gray-200 uppercase tracking-tight">{u.name}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">DNI: {u.dni}</p>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${
                        u.role === 'Administrador' ? 'bg-purple-100 text-purple-700' :
                        u.role === 'Gerente' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${u.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {u.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => setViewingUser(u)} title="Ver Perfil Detallado" className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all"><Eye size={18} /></button>
                        <button onClick={() => { setEditingUser(u); setShowForm(true); }} title="Editar Credenciales y Rol" className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-all"><Edit2 size={18} /></button>
                        {u.id !== 'master-1' && (
                          <button onClick={() => setIdToDelete(u.id)} title="Eliminar Acceso Permanentemente" className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all active:scale-90"><Trash2 size={18} /></button>
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
              ¿Estás seguro de eliminar este acceso? Esta acción no se puede deshacer.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                type="button"
                onClick={() => { deleteSystemUser(idToDelete); setIdToDelete(null); }}
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
        <UserFormModal 
          editingUser={editingUser} 
          onClose={() => { setShowForm(false); setEditingUser(null); }} 
          onSubmit={handleSubmit}
        />
      )}

      {viewingUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
           <div className="bg-white dark:bg-gray-800 w-full max-sm rounded-[2.5rem] shadow-2xl p-10 border border-gray-100 dark:border-gray-700 text-center relative animate-in zoom-in-95">
             <button onClick={() => setViewingUser(null)} title="Cerrar detalle" className="absolute top-6 right-6 p-3 text-gray-300 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all"><XCircle size={28} /></button>
             <div className="w-24 h-24 rounded-3xl bg-primary-50 dark:bg-primary-900/20 mx-auto mb-6 overflow-hidden flex items-center justify-center border-4 border-white dark:border-gray-700 shadow-xl">
               {viewingUser.photo ? <img src={viewingUser.photo} className="w-full h-full object-cover" /> : <UserCircle size={48} className="text-primary-600" />}
             </div>
             <h4 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-tight">{viewingUser.name}</h4>
             <p className="text-primary-600 font-black uppercase text-[10px] tracking-widest mt-1">{viewingUser.role}</p>
             
             <div className="space-y-3 text-left mt-8">
               <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700/30 rounded-2xl">
                 <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nombre Usuario</span>
                 <span className="text-sm font-black text-gray-700 dark:text-white">@{viewingUser.username}</span>
               </div>
               <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700/30 rounded-2xl">
                 <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Documento DNI</span>
                 <span className="text-sm font-black text-gray-700 dark:text-white">{viewingUser.dni}</span>
               </div>
               <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700/30 rounded-2xl">
                 <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Celular</span>
                 <span className="text-sm font-black text-gray-700 dark:text-white">{viewingUser.phone}</span>
               </div>
             </div>
             
             <button onClick={() => setViewingUser(null)} className="mt-10 w-full py-5 bg-gray-100 dark:bg-gray-700 rounded-3xl font-black text-[10px] uppercase tracking-widest text-gray-400 active:scale-95 transition-all">Cerrar Detalle</button>
           </div>
        </div>
      )}
    </div>
  );
};

interface UserFormModalProps {
  editingUser: SystemUser | null;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

const UserFormModal: React.FC<UserFormModalProps> = ({ editingUser, onClose, onSubmit }) => {
  const [name, setName] = useState(editingUser?.name || '');
  const [username, setUsername] = useState(editingUser?.username || '');
  const [password, setPassword] = useState(editingUser?.password || '');
  const [showPassword, setShowPassword] = useState(false);

  const handleAutoGenerateUsername = () => {
    if (!name) return;
    const firstName = name.trim().split(' ')[0].toUpperCase();
    setUsername(`FO-${firstName}`);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <form onSubmit={onSubmit} className="bg-white dark:bg-gray-800 w-full max-w-md rounded-[3rem] shadow-2xl p-10 border border-white/10 overflow-y-auto max-h-[90vh] animate-in zoom-in-95">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-2xl font-black text-gray-800 dark:text-white tracking-tighter">{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
          <button type="button" onClick={onClose} title="Cerrar formulario" className="p-3 text-gray-300 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all">
            <XCircle size={28} />
          </button>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 ml-1 tracking-widest">Nombre Completo</label>
            <input 
              name="name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required 
              className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white font-black text-sm uppercase shadow-sm" 
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 ml-1 tracking-widest">DNI</label>
              <input name="dni" defaultValue={editingUser?.dni} required className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white font-mono text-sm" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 ml-1 tracking-widest">Celular</label>
              <input name="phone" defaultValue={editingUser?.phone} className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none outline-none text-gray-900 dark:text-white text-sm" />
            </div>
          </div>
          
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 ml-1 tracking-widest">Área / Funciones</label>
            <input name="functions" defaultValue={editingUser?.functions} required className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white font-black text-sm uppercase shadow-sm" placeholder="Ej: Ventas, Almacén" />
          </div>

          <div className="pt-6 border-t border-gray-100 dark:border-gray-700 mt-2">
            <label className="block text-[10px] font-black text-primary-600 uppercase mb-4 tracking-widest">Seguridad de Acceso</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-3 px-1">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-tight">Usuario</label>
                  {!editingUser && (
                    <button type="button" onClick={handleAutoGenerateUsername} title="Generar usuario basado en nombre" className="text-primary-600 flex items-center gap-1 text-[9px] font-black uppercase"><Sparkles size={10} /> Auto</button>
                  )}
                </div>
                <input name="username" value={username} onChange={(e) => setUsername(e.target.value)} required className="w-full px-4 py-3 rounded-xl bg-primary-50 dark:bg-primary-900/10 border-none text-xs font-black outline-none" />
              </div>
              <div className="relative">
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 px-1">Contraseña</label>
                <div className="relative">
                  <input name="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-3 pr-10 rounded-xl bg-primary-50 dark:bg-primary-900/10 border-none text-xs font-black outline-none" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} title={showPassword ? "Ocultar" : "Mostrar"} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-600 transition-colors">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 ml-1 tracking-widest">Rol Jerárquico</label>
            <select name="role" defaultValue={editingUser?.role || 'Vendedor'} className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none outline-none text-gray-900 dark:text-white font-black text-xs uppercase shadow-sm">
              <option value="Administrador">Administrador</option>
              <option value="Gerente">Gerente</option>
              <option value="Vendedor">Vendedor</option>
            </select>
          </div>
        </div>
        
        <div className="mt-10 flex justify-end gap-4">
          <button type="button" onClick={onClose} className="px-8 py-4 bg-gray-100 rounded-2xl font-black text-[10px] uppercase tracking-widest text-gray-400">Descartar</button>
          <button type="submit" className="px-12 py-4 bg-primary-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary-600/30 transition-all active:scale-95">
            {editingUser ? 'Actualizar' : 'Guardar Usuario'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Users;
