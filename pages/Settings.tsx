
import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { supabase } from '../supabaseClient';
import { 
  Moon, Sun, Database, CheckCircle2, XCircle, RefreshCw, 
  FileSpreadsheet, Download, User, Eye, EyeOff, 
  Camera, Landmark, DollarSign, Wallet, Key, Globe, ShieldCheck, Info
} from 'lucide-react';
import { Currency, IdentityApiConfig } from '../types';

declare var XLSX: any;

const Settings: React.FC = () => {
  const { state, setTheme, setCurrency, setIdentityConfig, updateSystemUser, updateUserPassword } = useStore();
  const [isExporting, setIsExporting] = useState(false);
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [newPass, setNewPass] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [apiConfig, setApiConfig] = useState<IdentityApiConfig>(state.identityApi);

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
  }, []);

  const handleSaveApis = (e: React.FormEvent) => {
    e.preventDefault();
    setIdentityConfig(apiConfig);
    alert('Configuración de APIs guardada correctamente.');
  };

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
    if (typeof XLSX === 'undefined') return alert("Cargando librería de Excel...");
    setIsExporting(true);
    try {
      const wb = XLSX.utils.book_new();
      
      const datasets = [
        { name: 'Productos', data: state.products },
        { name: 'Clientes', data: state.clients },
        { name: 'Proveedores', data: state.suppliers },
        { name: 'Ventas', data: state.sales },
        { name: 'Compras', data: state.purchases },
        { name: 'Usuarios', data: state.users },
        { name: 'Tareas', data: state.tasks }
      ];

      datasets.forEach(set => {
        const sanitizedData = (set.data && set.data.length > 0) 
          ? set.data.map((row: any) => {
              const newRow = { ...row };
              Object.keys(newRow).forEach(key => {
                if (typeof newRow[key] === 'string' && newRow[key].length > 32000) {
                  newRow[key] = "[IMAGEN O TEXTO DEMASIADO LARGO PARA EXCEL]";
                }
              });
              return newRow;
            })
          : [{}];

        const ws = XLSX.utils.json_to_sheet(sanitizedData);
        XLSX.utils.book_append_sheet(wb, ws, set.name);
      });

      XLSX.writeFile(wb, `Respaldo_Total_Olga_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      console.error("Export Error:", err);
      alert("Error al generar el archivo de respaldo. Compruebe la consola para más detalles.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-white dark:bg-gray-800 p-12 rounded-[3.5rem] shadow-sm border border-gray-50 dark:border-gray-700">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 text-green-500 rounded-2xl flex items-center justify-center">
              <User size={22} />
            </div>
            <h3 className="text-xl font-black text-gray-800 dark:text-white">Mi Perfil</h3>
          </div>
          <div className="flex flex-col items-center mb-10">
            <div className="relative mb-4">
              <div className="w-36 h-36 bg-gray-100 rounded-[3rem] overflow-hidden border-8 border-gray-50 dark:border-gray-700 shadow-xl flex items-center justify-center">
                {state.user?.photo ? (
                  <img src={state.user.photo} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-black text-gray-300">{state.user?.name.charAt(0)}</span>
                )}
              </div>
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-2 right-2 p-3 bg-green-500 text-white rounded-2xl shadow-lg border-4 border-white dark:border-gray-800 hover:scale-110 transition-transform"
              >
                <Camera size={18} />
              </button>
              <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" accept="image/*" />
            </div>
            <h4 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{state.user?.name}</h4>
            <span className="mt-2 px-4 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase tracking-widest">{state.user?.role}</span>
          </div>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-tight">Contraseña:</span>
              <div className="flex items-center gap-2">
                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-2 rounded-xl flex items-center gap-4">
                  <span className="text-sm font-black tracking-widest text-gray-800 dark:text-gray-200 min-w-[60px] text-center">
                    {showCurrentPass ? state.user?.password : '••••••'}
                  </span>
                  <button 
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)} 
                    className="text-gray-400 hover:text-green-500 transition-colors p-1"
                  >
                    {showCurrentPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>
            <div className="pt-6 border-t border-gray-100 dark:border-gray-700">
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest">ACTUALIZAR CLAVE</label>
              <div className="flex gap-3">
                <input 
                  type="password" 
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  placeholder="Escriba nueva contraseña"
                  className="flex-1 px-6 py-4 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none outline-none text-sm font-bold" 
                />
                <button 
                  type="button"
                  onClick={handleUpdatePass}
                  className="px-8 bg-green-500 hover:bg-green-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-green-500/20"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-12 rounded-[3.5rem] shadow-sm border border-gray-50 dark:border-gray-700">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center">
              <Sun size={22} />
            </div>
            <h3 className="text-xl font-black text-gray-800 dark:text-white">Personalización Global</h3>
          </div>
          <div className="space-y-10">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-black text-gray-800 dark:text-white leading-tight">Modo de Apariencia</h4>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">INTERFAZ CLARA / OSCURA</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-1.5 rounded-2xl flex gap-1">
                  <button onClick={() => setTheme('light')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black transition-all ${state.theme === 'light' ? 'bg-white shadow-md text-green-600' : 'text-gray-400'}`}><Sun size={14} /> CLARO</button>
                  <button onClick={() => setTheme('dark')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black transition-all ${state.theme === 'dark' ? 'bg-gray-600 shadow-md text-green-600' : 'text-gray-400'}`}><Moon size={14} /> OSCURO</button>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-50 dark:border-gray-700 pt-10">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h4 className="font-black text-gray-800 dark:text-white leading-tight">Sistema de Moneda</h4>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">SOLES (PEN) O DÓLARES (USD)</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-1.5 rounded-2xl flex gap-1">
                  <button onClick={() => setCurrency('PEN')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black transition-all ${state.currency === 'PEN' ? 'bg-white shadow-md text-green-600' : 'text-gray-400'}`}><Wallet size={14} /> SOLES</button>
                  <button onClick={() => setCurrency('USD')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black transition-all ${state.currency === 'USD' ? 'bg-white shadow-md text-green-600' : 'text-gray-400'}`}><DollarSign size={14} /> USD</button>
                </div>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/10 p-8 rounded-[2.5rem] border border-amber-100 dark:border-amber-900/20 flex items-center gap-6">
                <div className="w-14 h-14 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center shadow-sm text-amber-500"><Landmark size={24} /></div>
                <div>
                  <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">TIPO DE CAMBIO ACTUAL</p>
                  <p className="text-3xl font-black text-amber-700 dark:text-amber-400 tracking-tighter">S/ {state.exchangeRate.toFixed(2)}</p>
                  <p className="text-[9px] font-bold text-amber-500/70 mt-1 uppercase">Valor utilizado para conversiones automáticas.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-12 rounded-[3.5rem] shadow-sm border border-gray-50 dark:border-gray-700">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center"><Globe size={22} /></div>
            <div>
              <h3 className="text-xl font-black text-gray-800 dark:text-white">Servicio de Identidad (ApisPerú)</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">CONFIGURACIÓN DE CONSULTAS DNI Y RUC</p>
            </div>
          </div>
          <form onSubmit={handleSaveApis} className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 ml-1 tracking-widest">URL Consulta DNI</label>
                <input type="text" value={apiConfig.dniUrl} onChange={e => setApiConfig({...apiConfig, dniUrl: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none text-xs font-bold font-mono outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 ml-1 tracking-widest">URL Consulta RUC</label>
                <input type="text" value={apiConfig.rucUrl} onChange={e => setApiConfig({...apiConfig, rucUrl: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none text-xs font-bold font-mono outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 ml-1 tracking-widest">API TOKEN (JWT)</label>
                <div className="relative">
                  <Key className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input type="password" value={apiConfig.token} onChange={e => setApiConfig({...apiConfig, token: e.target.value})} className="w-full pl-14 pr-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none text-[10px] font-bold outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>
              <div className="pt-4 flex flex-col justify-end h-full">
                <button type="submit" className="w-full py-5 bg-green-500 text-white font-black rounded-3xl text-[11px] uppercase tracking-widest shadow-xl shadow-green-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"><ShieldCheck size={20} /> Actualizar Conectividad</button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;
