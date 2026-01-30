
import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store';
import { 
  UserPlus, Search, Edit2, Trash2, Eye, XCircle, 
  CheckCircle2, ShieldCheck, Phone, FileText, UserCircle,
  ChevronLeft, ChevronRight, Sparkles, EyeOff
} from 'lucide-react';
import { SystemUser, UserRole } from '../types';

const Users: React.FC = () => {
  const { state, addSystemUser, updateSystemUser, deleteSystemUser } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [viewingUser, setViewingUser] = useState<SystemUser | null>(null);
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

  const handleDelete = (id: string) => {
    if (confirm('¿Está seguro de eliminar este acceso?')) {
      deleteSystemUser(id);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-800 dark:text-white">Gestión de Usuarios</h2>
          <p className="text-gray-500 dark:text-gray-400">Control de accesos y roles del sistema</p>
        </div>
        <button 
          onClick={() => { setEditingUser(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-primary-600/20 transition-all hover:scale-105"
        >
          <UserPlus size={20} />
          Nuevo Usuario
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
           <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nombre o usuario..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white text-sm"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-[10px] font-black uppercase text-gray-400 tracking-widest">
              <tr>
                <th className="px-6 py-4">Usuario</th>
                <th className="px-6 py-4">Personal</th>
                <th className="px-6 py-4">Rol</th>
                <th className="px-6 py-4 text-center">Estado</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {paginatedUsers.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400 italic">No se encontraron usuarios</td></tr>
              ) : (
                paginatedUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 overflow-hidden flex items-center justify-center text-primary-600">
                          {u.photo ? <img src={u.photo} className="w-full h-full object-cover" /> : <UserCircle size={24} />}
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-900 dark:text-white">@{u.username}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">{u.functions}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{u.name}</p>
                      <p className="text-[10px] text-gray-400">DNI: {u.dni}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${
                        u.role === 'Administrador' ? 'bg-purple-100 text-purple-700' :
                        u.role === 'Gerente' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${u.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {u.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => setViewingUser(u)} title="Ver Perfil" className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl"><Eye size={18} /></button>
                        <button onClick={() => { setEditingUser(u); setShowForm(true); }} title="Editar Usuario" className="p-2 text-primary-600 hover:bg-primary-50 rounded-xl"><Edit2 size={18} /></button>
                        {u.id !== 'master-1' && (
                          <button onClick={() => handleDelete(u.id)} title="Eliminar Acceso" className="p-2 text-red-500 hover:bg-red-50 rounded-xl"><Trash2 size={18} /></button>
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

      {showForm && (
        <UserFormModal 
          editingUser={editingUser} 
          users={state.users}
          onClose={() => { setShowForm(false); setEditingUser(null); }} 
          onSubmit={handleSubmit}
        />
      )}

      {viewingUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
           <div className="bg-white dark:bg-gray-800 w-full max-sm rounded-[2.5rem] shadow-2xl p-8 border border-gray-100 dark:border-gray-700 text-center relative animate-in zoom-in-95">
             <button onClick={() => setViewingUser(null)} className="absolute top-6 right-6 p-2 text-gray-400 hover:bg-gray-100 rounded-xl"><XCircle size={24} /></button>
             <div className="w-24 h-24 rounded-3xl bg-primary-50 mx-auto mb-4 overflow-hidden flex items-center justify-center border-4 border-white shadow-lg">
               {viewingUser.photo ? <img src={viewingUser.photo} className="w-full h-full object-cover" /> : <UserCircle size={48} className="text-primary-600" />}
             </div>
             <h4 className="text-2xl font-black text-gray-900 dark:text-white">{viewingUser.name}</h4>
             <p className="text-primary-600 font-black uppercase text-[10px] tracking-widest mb-6">{viewingUser.role}</p>
             
             <div className="space-y-3 text-left">
               <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/30 rounded-2xl">
                 <span className="text-[10px] font-black text-gray-400 uppercase">Usuario</span>
                 <span className="text-sm font-black text-gray-700 dark:text-white">@{viewingUser.username}</span>
               </div>
               <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/30 rounded-2xl">
                 <span className="text-[10px] font-black text-gray-400 uppercase">DNI</span>
                 <span className="text-sm font-black text-gray-700 dark:text-white">{viewingUser.dni}</span>
               </div>
               <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/30 rounded-2xl">
                 <span className="text-[10px] font-black text-gray-400 uppercase">Celular</span>
                 <span className="text-sm font-black text-gray-700 dark:text-white">{viewingUser.phone}</span>
               </div>
               <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/30 rounded-2xl">
                 <span className="text-[10px] font-black text-gray-400 uppercase">Área</span>
                 <span className="text-sm font-black text-gray-700 dark:text-white">{viewingUser.functions}</span>
               </div>
             </div>
             
             <button onClick={() => setViewingUser(null)} className="mt-8 w-full py-4 bg-gray-100 dark:bg-gray-700 rounded-2xl font-black text-gray-500">Cerrar Detalle</button>
           </div>
        </div>
      )}
    </div>
  );
};

interface UserFormModalProps {
  editingUser: SystemUser | null;
  users: SystemUser[];
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <form onSubmit={onSubmit} className="bg-white dark:bg-gray-800 w-full max-w-md rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 p-8 border border-gray-100 dark:border-gray-700 overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-gray-800 dark:text-white">{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
          <button type="button" onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl">
            <XCircle size={24} />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase mb-2">Nombre Completo</label>
            <input 
              name="name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required 
              className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white" 
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase mb-2">DNI</label>
              <input name="dni" defaultValue={editingUser?.dni} required className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase mb-2">Celular</label>
              <input name="phone" defaultValue={editingUser?.phone} className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white" />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase mb-2">Área / Funciones</label>
            <input name="functions" defaultValue={editingUser?.functions} required className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white" placeholder="Ej: Ventas, Almacén" />
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-gray-700 mt-2">
            <label className="block text-xs font-black text-primary-600 uppercase mb-2">Credenciales de Acceso</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] font-black text-gray-400 uppercase">Usuario</label>
                  {!editingUser && (
                    <button 
                      type="button" 
                      onClick={handleAutoGenerateUsername}
                      title="Generar Usuario Automático"
                      className="text-primary-600 hover:text-primary-700 flex items-center gap-0.5 text-[9px] font-black uppercase transition-all"
                    >
                      <Sparkles size={10} /> Auto
                    </button>
                  )}
                </div>
                <input 
                  name="username" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required 
                  className="w-full px-4 py-2 rounded-xl bg-primary-50 dark:bg-primary-900/10 border-none text-sm font-black outline-none" 
                />
              </div>
              <div className="relative">
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Contraseña</label>
                <div className="relative">
                  <input 
                    name="password" 
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                    className="w-full px-4 py-2 pr-10 rounded-xl bg-primary-50 dark:bg-primary-900/10 border-none text-sm font-black outline-none" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? "Ocultar Contraseña" : "Ver Contraseña"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-gray-400 uppercase mb-2">Rol de Sistema</label>
            <select name="role" defaultValue={editingUser?.role || 'Vendedor'} className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none outline-none text-gray-900 dark:text-white font-bold">
              <option value="Administrador">Administrador</option>
              <option value="Gerente">Gerente</option>
              <option value="Vendedor">Vendedor</option>
            </select>
          </div>
        </div>
        
        <div className="mt-8 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-6 py-3 bg-gray-100 dark:bg-gray-700 rounded-2xl font-bold text-gray-700 dark:text-gray-300">Cancelar</button>
          <button type="submit" className="px-10 py-3 bg-primary-600 text-white rounded-2xl font-black shadow-lg shadow-primary-600/30 transition-all hover:scale-105">
            {editingUser ? 'Actualizar' : 'Guardar Usuario'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Users;
