
import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { supabase } from '../supabaseClient';
import { 
  Moon, Sun, Database, CheckCircle2, XCircle, RefreshCw, 
  FileSpreadsheet, Download, User, Eye, EyeOff, 
  Camera, Landmark, DollarSign, Wallet
} from 'lucide-react';
import { Currency } from '../types';

declare var XLSX: any;

const Settings: React.FC = () => {
  const { state, setTheme, setCurrency, updateSystemUser, updateUserPassword } = useStore();
  const [isExporting, setIsExporting] = useState(false);
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [newPass, setNewPass] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [dbStatus, setDbStatus] = useState<Record<string, boolean | 'loading'>>({
    products: 'loading',
    clients: 'loading',
    suppliers: 'loading',
    sales: 'loading',
    purchases: 'loading',
    users: 'loading'
  });

  const checkTables = async () => {
    const tables = ['products', 'clients', 'suppliers', 'sales', 'purchases', 'users'];
    const results: any = {};
    
    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select('id').limit(1);
        results[table] = !error;
      } catch {
        results[table] = false;
      }
    }
    setDbStatus(results);
  };

  useEffect(() => {
    checkTables();
    const interval = setInterval(checkTables, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdatePass = () => {
    if (newPass.length < 4) return alert('La contraseña debe tener al menos 4 caracteres');
    updateUserPassword(state.user?.id || '', newPass);
    setNewPass('');
    alert('Contraseña actualizada correctamente');
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && state.user) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        updateSystemUser({ ...state.user!, photo: base64String });
        alert('Foto de perfil actualizada.');
      };
      reader.readAsDataURL(file);
    }
  };

  const exportToExcel = async () => {
    if (typeof XLSX === 'undefined') {
      alert("La librería de Excel aún no ha cargado o no hay conexión a internet.");
      return;
    }

    setIsExporting(true);
    try {
      const wb = XLSX.utils.book_new();
      
      const tables = [
        { name: 'Productos', data: state.products },
        { name: 'Clientes', data: state.clients },
        { name: 'Proveedores', data: state.suppliers },
        { name: 'Ventas', data: state.sales },
        { name: 'Compras', data: state.purchases },
        { name: 'Usuarios', data: state.users }
      ];

      tables.forEach(table => {
        // Limpiamos los datos para que Excel no falle con objetos anidados o fotos pesadas
        const cleanData = table.data.map((item: any) => {
          const newItem = { ...item };
          
          // Eliminamos la foto en el excel de usuarios (es demasiado pesada para una celda)
          if (table.name === 'Usuarios' && newItem.photo) {
            delete newItem.photo;
          }

          // Convertimos cualquier objeto o array anidado a string (como los items de venta)
          Object.keys(newItem).forEach(key => {
            if (newItem[key] !== null && typeof newItem[key] === 'object') {
              newItem[key] = JSON.stringify(newItem[key]);
            }
          });
          
          return newItem;
        });

        if (cleanData.length > 0) {
          const ws = XLSX.utils.json_to_sheet(cleanData);
          XLSX.utils.book_append_sheet(wb, ws, table.name);
        } else {
          // Si no hay datos, creamos una hoja vacía con una fila indicativa
          const ws = XLSX.utils.json_to_sheet([{ Mensaje: "Sin registros" }]);
          XLSX.utils.book_append_sheet(wb, ws, table.name);
        }
      });

      const fileName = `Respaldo_Olga_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error: any) {
      console.error("Error detallado de exportación:", error);
      alert("Error al exportar a Excel: " + (error.message || "Error desconocido"));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white">Ajustes del Sistema</h2>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Configuración personal y mantenimiento de datos</p>
        </div>
        <button 
          onClick={checkTables}
          className="p-3 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-2xl hover:bg-primary-50 hover:text-primary-600 transition-all"
          title="Refrescar estado"
        >
          <RefreshCw size={20} className={Object.values(dbStatus).includes('loading') ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Mi Perfil */}
        <div className="bg-white dark:bg-gray-800 p-10 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-primary-50 text-primary-600 rounded-2xl">
              <User size={24} />
            </div>
            <h3 className="text-xl font-black text-gray-800 dark:text-white">Mi Perfil</h3>
          </div>
          
          <div className="space-y-8">
            <div className="flex flex-col items-center">
              <div className="relative group">
                <div className="w-32 h-32 bg-primary-100 text-primary-600 rounded-[2.5rem] flex items-center justify-center text-4xl font-black shadow-xl overflow-hidden border-4 border-white dark:border-gray-700">
                  {state.user?.photo ? (
                    <img src={state.user.photo} className="w-full h-full object-cover" />
                  ) : (
                    state.user?.name.charAt(0)
                  )}
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-1 right-1 p-3 bg-primary-600 text-white rounded-2xl shadow-lg hover:scale-110 transition-all border-4 border-white dark:border-gray-800"
                >
                  <Camera size={18} />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handlePhotoUpload} 
                  className="hidden" 
                  accept="image/*" 
                />
              </div>
              <div className="text-center mt-4">
                <p className="text-2xl font-black text-gray-900 dark:text-white">{state.user?.name}</p>
                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-[10px] font-black uppercase tracking-widest">{state.user?.role}</span>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 dark:border-gray-700 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-gray-500">Contraseña:</p>
                <div className="flex items-center gap-2">
                  <span className="font-mono bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-lg">
                    {showCurrentPass ? state.user?.password : '••••••'}
                  </span>
                  <button onClick={() => setShowCurrentPass(!showCurrentPass)} className="text-gray-400 hover:text-primary-600">
                    {showCurrentPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-black text-gray-400 uppercase">Actualizar Clave</label>
                <div className="flex gap-2">
                  <input 
                    type="password" 
                    placeholder="Escriba nueva contraseña"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border-none text-sm font-bold outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <button 
                    onClick={handleUpdatePass}
                    className="px-6 bg-primary-600 text-white rounded-xl font-black hover:bg-primary-700 transition-all"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Apariencia y Moneda */}
        <div className="bg-white dark:bg-gray-800 p-10 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
              <Sun size={24} />
            </div>
            <h3 className="text-xl font-black text-gray-800 dark:text-white">Personalización Global</h3>
          </div>

          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-black text-gray-800 dark:text-white">Modo de Apariencia</p>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-tighter">Interfaz Clara / Oscura</p>
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 p-1 rounded-2xl flex gap-1">
                <button onClick={() => setTheme('light')} className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 text-xs font-black ${state.theme === 'light' ? 'bg-white shadow-md text-primary-600' : 'text-gray-400'}`}><Sun size={14} /> CLARO</button>
                <button onClick={() => setTheme('dark')} className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 text-xs font-black ${state.theme === 'dark' ? 'bg-gray-600 shadow-md text-primary-600' : 'text-gray-400'}`}><Moon size={14} /> OSCURO</button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-gray-50 dark:border-gray-700">
              <div>
                <p className="font-black text-gray-800 dark:text-white">Sistema de Moneda</p>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-tighter">Soles (PEN) o Dólares (USD)</p>
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 p-1 rounded-2xl flex gap-1">
                <button onClick={() => setCurrency('PEN')} className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 text-xs font-black ${state.currency === 'PEN' ? 'bg-white shadow-md text-primary-600' : 'text-gray-400'}`}><Wallet size={14} /> SOLES</button>
                <button onClick={() => setCurrency('USD')} className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 text-xs font-black ${state.currency === 'USD' ? 'bg-white shadow-md text-primary-600' : 'text-gray-400'}`}><DollarSign size={14} /> USD</button>
              </div>
            </div>
            
            <div className="p-6 bg-amber-50 dark:bg-amber-900/10 rounded-[2rem] border border-amber-100 dark:border-amber-900/30">
               <div className="flex gap-4">
                 <div className="p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-sm text-amber-600 h-fit"><Landmark size={20} /></div>
                 <div>
                    <p className="text-xs font-black text-amber-800 dark:text-amber-300 uppercase mb-1">Tipo de Cambio Actual</p>
                    <p className="text-2xl font-black text-amber-600">S/ {state.exchangeRate.toFixed(2)}</p>
                    <p className="text-[10px] text-amber-500 mt-1 font-bold">Valor utilizado para conversiones automáticas.</p>
                 </div>
               </div>
            </div>
          </div>
        </div>

        {/* Estado de la Base de Datos */}
        <div className="bg-white dark:bg-gray-800 p-10 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <Database size={24} />
            </div>
            <h3 className="text-xl font-black text-gray-800 dark:text-white">Estado de la Base de Datos</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {Object.entries(dbStatus).map(([table, status]) => (
              <div key={table} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${status === true ? 'bg-green-500' : status === 'loading' ? 'bg-amber-500 animate-pulse' : 'bg-red-500'}`} />
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-200 capitalize">
                    {table === 'products' ? 'Productos' : 
                     table === 'clients' ? 'Clientes' : 
                     table === 'suppliers' ? 'Proveedores' : 
                     table === 'sales' ? 'Ventas' : 
                     table === 'purchases' ? 'Compras' : 'Usuarios'}
                  </span>
                </div>
                {status === true ? (
                  <CheckCircle2 size={16} className="text-green-500" />
                ) : status === 'loading' ? (
                  <RefreshCw size={16} className="text-amber-500 animate-spin" />
                ) : (
                  <div className="flex items-center gap-1 text-red-500">
                    <span className="text-[8px] font-black uppercase">Error/RLS</span>
                    <XCircle size={16} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Respaldo Maestro */}
        <div className="bg-gradient-to-br from-primary-600 to-primary-800 p-10 rounded-[2.5rem] shadow-2xl text-white">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
              <FileSpreadsheet size={24} />
            </div>
            <h3 className="text-xl font-black">Respaldo de Información</h3>
          </div>
          <p className="text-primary-100 mb-8 font-medium opacity-90">Descarga todos los registros del sistema (Productos, Clientes, Ventas, etc) en un archivo Excel compatible.</p>
          <button 
            onClick={exportToExcel} 
            disabled={isExporting} 
            className="w-full bg-white text-primary-700 font-black py-5 rounded-2xl shadow-xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
          >
            {isExporting ? <RefreshCw className="animate-spin" size={24} /> : <Download size={24} />}
            {isExporting ? 'Procesando Datos...' : 'Descargar Todo a Excel'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default Settings;
