
import React, { useState } from 'react';
import { useStore } from '../store';
import { 
  LayoutDashboard, ShoppingCart, Truck, Apple, Users, Briefcase, Settings, 
  Menu, X, LogOut, Moon, Sun, DollarSign, Wallet, Bell, Search, PlusCircle,
  Cloud, CloudOff, RefreshCw, UserCircle
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activePage: string;
  setActivePage: (page: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activePage, setActivePage }) => {
  const { state, isCloudConnected, setTheme, setCurrency, logout } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'sales', label: 'Ventas', icon: ShoppingCart },
    { id: 'purchases', label: 'Compras', icon: Truck },
    { id: 'products', label: 'Productos', icon: Apple },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'suppliers', label: 'Proveedores', icon: Briefcase },
    { id: 'users', label: 'Usuarios', icon: UserCircle },
    { id: 'settings', label: 'Ajustes', icon: Settings },
  ];

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200 overflow-hidden">
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed md:relative inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
        transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 shrink-0
      `}>
        <div className="h-full flex flex-col">
          <div className="p-6 flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              FO
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Frutería Olga</h1>
              <span className="text-xs text-gray-500 dark:text-gray-400">Panel Administrativo</span>
            </div>
          </div>

          <nav className="flex-1 px-4 space-y-1 overflow-y-auto py-4">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActivePage(item.id);
                  setSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                  ${activePage === item.id 
                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}
                `}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700 shrink-0">
            <button 
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
            >
              <LogOut size={20} />
              <span className="font-medium">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 md:px-8 shrink-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden p-2 text-gray-600 dark:text-gray-400"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
              !isCloudConnected ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-green-100 text-green-700 border border-green-200'
            }`}>
              {!isCloudConnected ? <CloudOff size={14} /> : <Cloud size={14} />}
              {!isCloudConnected ? 'Modo Local' : 'Nube Sincronizada'}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button 
                onClick={() => setCurrency('PEN')}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${state.currency === 'PEN' ? 'bg-white dark:bg-gray-600 shadow-sm text-primary-600' : 'text-gray-500'}`}
              >
                S/
              </button>
              <button 
                onClick={() => setCurrency('USD')}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${state.currency === 'USD' ? 'bg-white dark:bg-gray-600 shadow-sm text-primary-600' : 'text-gray-500'}`}
              >
                $
              </button>
            </div>
            
            <button 
              onClick={() => setTheme(state.theme === 'light' ? 'dark' : 'light')}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              {state.theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            
            <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-1" />
            
            <div className="flex items-center gap-3">
              <div className="hidden md:block text-right">
                <p className="text-sm font-bold leading-none">{state.user?.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-tighter">{state.user?.role}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary-100 overflow-hidden flex items-center justify-center text-primary-700 font-bold border border-primary-200 shrink-0">
                {state.user?.photo ? (
                  <img src={state.user.photo} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  state.user?.name.charAt(0)
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
