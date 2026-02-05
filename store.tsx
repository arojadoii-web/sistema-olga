
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppState, Product, Client, Supplier, Sale, Purchase, Currency, UserRole, SaleStatus, SystemUser, OperationalTask, IdentityApiConfig } from './types';
import { supabase } from './supabaseClient';

interface StoreContextType {
  state: AppState;
  loading: boolean;
  isCloudConnected: boolean;
  setTheme: (theme: 'light' | 'dark') => void;
  setCurrency: (currency: Currency) => void;
  setIdentityConfig: (config: IdentityApiConfig) => void;
  login: (username: string, password: string) => Promise<{error: any}>;
  logout: () => Promise<void>;
  addSystemUser: (user: SystemUser) => Promise<void>;
  updateSystemUser: (user: SystemUser) => Promise<void>;
  deleteSystemUser: (id: string) => Promise<void>;
  updateUserPassword: (id: string, newPassword: string) => Promise<void>;
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  addClient: (client: Client) => Promise<void>;
  updateClient: (client: Client) => Promise<void>;
  addSupplier: (supplier: Supplier) => Promise<void>;
  updateSupplier: (supplier: Supplier) => Promise<void>;
  addSale: (sale: Sale) => Promise<void>;
  updateSale: (sale: Sale) => Promise<void>;
  cancelSale: (id: string) => Promise<void>;
  addPurchase: (purchase: Purchase) => Promise<void>;
  cancelPurchase: (id: string) => Promise<void>;
  addTask: (task: OperationalTask) => Promise<void>;
  updateTask: (task: OperationalTask) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  refreshCloudData: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const INITIAL_USER: SystemUser = {
  id: 'master-1',
  name: 'Alejandro Miranda',
  dni: '00000000',
  phone: '999888777',
  functions: 'Administración Total',
  username: 'FO-ALEJANDRO',
  password: '123456',
  role: 'Administrador',
  active: true
};

const DEFAULT_IDENTITY_CONFIG: IdentityApiConfig = {
  dniUrl: 'https://dniruc.apisperu.com/api/v1/dni',
  rucUrl: 'https://dniruc.apisperu.com/api/v1/ruc',
  token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImFyZGRlc2lnbmFsZUBnbWFpbC5jb20ifQ.ZqPNOwUdOuYhHmrQTZ0BPg_73Kl7PYuc12MkUMh6ud0'
};

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [state, setState] = useState<AppState>({
    theme: (localStorage.getItem('theme') as 'light' | 'dark') || 'light',
    currency: (localStorage.getItem('currency') as Currency) || 'PEN',
    exchangeRate: 3.75,
    identityApi: JSON.parse(localStorage.getItem('identity_config') || JSON.stringify(DEFAULT_IDENTITY_CONFIG)),
    user: null,
    users: [INITIAL_USER],
    products: [],
    clients: [],
    suppliers: [],
    sales: [],
    purchases: [],
    tasks: [],
  });

  const loadLocalData = () => {
    const saved = localStorage.getItem('olga_backup_data');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setState(prev => ({ 
          ...prev, 
          ...data,
          users: (Array.isArray(data.users) && data.users.length > 0) ? data.users : [INITIAL_USER]
        }));
      } catch (e) {
        console.error("Error loading local data:", e);
      }
    }
  };

  const sanitizeDataForStorage = (data: any) => {
    // Función para eliminar fotos pesadas (base64) del almacenamiento local para evitar QuotaExceededError
    if (Array.isArray(data)) {
      return data.map(item => sanitizeDataForStorage(item));
    } else if (typeof data === 'object' && data !== null) {
      const sanitized = { ...data };
      Object.keys(sanitized).forEach(key => {
        if (key === 'photo' && typeof sanitized[key] === 'string' && sanitized[key].length > 1000) {
          sanitized[key] = ""; // Eliminamos la foto del caché local si es muy pesada
        } else if (typeof sanitized[key] === 'object') {
          sanitized[key] = sanitizeDataForStorage(sanitized[key]);
        }
      });
      return sanitized;
    }
    return data;
  };

  const internalSaveToLocal = (updatedState: AppState) => {
    try {
      const dataToSave = {
        products: updatedState.products || [],
        clients: updatedState.clients || [],
        suppliers: updatedState.suppliers || [],
        sales: updatedState.sales || [],
        purchases: updatedState.purchases || [],
        users: updatedState.users || [INITIAL_USER],
        tasks: updatedState.tasks || [],
      };
      // Sanitizar antes de guardar
      const cleanData = sanitizeDataForStorage(dataToSave);
      localStorage.setItem('olga_backup_data', JSON.stringify(cleanData));
    } catch (e) {
      console.warn("localStorage Quota exceeded, skipping local backup", e);
    }
  };

  useEffect(() => {
    if (state.theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [state.theme]);

  useEffect(() => {
    const init = async () => {
      try {
        const localUser = localStorage.getItem('olga_logged_user');
        loadLocalData();
        if (localUser) {
          const user = JSON.parse(localUser);
          setState(prev => ({ ...prev, user }));
          await fetchAllData();
        } else {
          setLoading(false);
        }
      } catch (e) {
        setLoading(false);
        loadLocalData();
      }
    };
    init();
  }, []);

  const fetchAllData = async () => {
    try {
      const [
        { data: products },
        { data: clients },
        { data: suppliers },
        { data: sales },
        { data: purchases },
        { data: cloudUsers },
        { data: tasks }
      ] = await Promise.all([
        supabase.from('products').select('*').order('name'),
        supabase.from('clients').select('*').order('name'),
        supabase.from('suppliers').select('*').order('name'),
        supabase.from('sales').select('*').order('date', { ascending: false }),
        supabase.from('purchases').select('*').order('date', { ascending: false }),
        supabase.from('users').select('*').order('name'),
        supabase.from('tasks').select('*').order('date', { ascending: true })
      ]);

      const newStateData = {
        products: products || [],
        clients: clients || [],
        suppliers: suppliers || [],
        sales: sales || [],
        purchases: purchases || [],
        users: (Array.isArray(cloudUsers) && cloudUsers.length > 0) ? cloudUsers : state.users,
        tasks: tasks || []
      };
      
      setState(prev => {
        const updated = { ...prev, ...newStateData };
        internalSaveToLocal(updated);
        return updated;
      });
      setIsCloudConnected(true);
    } catch (error) {
      setIsCloudConnected(false);
      loadLocalData();
    } finally {
      setLoading(false);
    }
  };

  const setIdentityConfig = (config: IdentityApiConfig) => {
    setState(prev => ({ ...prev, identityApi: config }));
    localStorage.setItem('identity_config', JSON.stringify(config));
  };

  const login = async (username: string, password: string) => {
    const users = Array.isArray(state.users) ? state.users : [INITIAL_USER];
    const userMatch = users.find(u => u.username === username && u.password === password && u.active);
    if (userMatch) {
      setState(prev => ({ ...prev, user: userMatch }));
      const cleanUser = sanitizeDataForStorage(userMatch);
      localStorage.setItem('olga_logged_user', JSON.stringify(cleanUser));
      await fetchAllData();
      return { error: null };
    }
    return { error: { message: 'Usuario o contraseña incorrectos' } };
  };

  const logout = async () => {
    localStorage.removeItem('olga_logged_user');
    setState(prev => ({ ...prev, user: null }));
    setIsCloudConnected(false);
  };

  const updateEntityState = (key: keyof AppState, newList: any[]) => {
    setState(prev => {
      const updated = { ...prev, [key]: newList };
      internalSaveToLocal(updated);
      return updated;
    });
  };

  const addSystemUser = async (user: SystemUser) => {
    updateEntityState('users', [...state.users, user]);
    await supabase.from('users').insert([user]);
  };

  const updateSystemUser = async (user: SystemUser) => {
    const newUsers = state.users.map(u => u.id === user.id ? user : u);
    setState(prev => {
      const updated = { ...prev, users: newUsers, user: prev.user?.id === user.id ? user : prev.user };
      if (prev.user?.id === user.id) {
        const cleanUser = sanitizeDataForStorage(user);
        localStorage.setItem('olga_logged_user', JSON.stringify(cleanUser));
      }
      internalSaveToLocal(updated);
      return updated;
    });
    await supabase.from('users').update(user).eq('id', user.id);
  };

  const deleteSystemUser = async (id: string) => {
    updateEntityState('users', state.users.filter(u => u.id !== id));
    await supabase.from('users').delete().eq('id', id);
  };

  const updateUserPassword = async (id: string, newPassword: string) => {
    const user = state.users.find(u => u.id === id);
    if (user) await updateSystemUser({ ...user, password: newPassword });
  };

  const addProduct = async (product: Product) => {
    updateEntityState('products', [product, ...state.products]);
    await supabase.from('products').insert([product]);
  };

  const updateProduct = async (product: Product) => {
    updateEntityState('products', state.products.map(p => p.id === product.id ? product : p));
    await supabase.from('products').update(product).eq('id', product.id);
  };

  const addClient = async (client: Client) => {
    updateEntityState('clients', [client, ...state.clients]);
    await supabase.from('clients').insert([client]);
  };

  const updateClient = async (client: Client) => {
    updateEntityState('clients', state.clients.map(c => c.id === client.id ? client : c));
    await supabase.from('clients').update(client).eq('id', client.id);
  };

  const addSupplier = async (supplier: Supplier) => {
    updateEntityState('suppliers', [supplier, ...state.suppliers]);
    await supabase.from('suppliers').insert([supplier]);
  };

  const updateSupplier = async (supplier: Supplier) => {
    updateEntityState('suppliers', state.suppliers.map(s => s.id === supplier.id ? supplier : s));
    await supabase.from('suppliers').update(supplier).eq('id', supplier.id);
  };

  const addSale = async (sale: Sale) => {
    const updatedProducts = state.products.map(p => {
      const item = sale.items.find(i => i.productId === p.id);
      return item ? { ...p, stock: p.stock - item.quantity } : p;
    });
    setState(prev => {
      const updated = { ...prev, sales: [sale, ...prev.sales], products: updatedProducts };
      internalSaveToLocal(updated);
      return updated;
    });
    await supabase.from('sales').insert([sale]);
  };

  const updateSale = async (sale: Sale) => {
    updateEntityState('sales', state.sales.map(s => s.id === sale.id ? sale : s));
    await supabase.from('sales').update(sale).eq('id', sale.id);
  };

  const cancelSale = async (id: string) => {
    updateEntityState('sales', state.sales.map(s => s.id === id ? { ...s, saleStatus: 'Anulado' } : s));
    await supabase.from('sales').update({ saleStatus: 'Anulado' }).eq('id', id);
  };

  const addPurchase = async (purchase: Purchase) => {
    const updatedProducts = state.products.map(p => {
      const item = purchase.items.find(i => i.productId === p.id);
      return item ? { ...p, stock: p.stock + item.quantity } : p;
    });
    setState(prev => {
      const updated = { ...prev, purchases: [purchase, ...prev.purchases], products: updatedProducts };
      internalSaveToLocal(updated);
      return updated;
    });
    await supabase.from('purchases').insert([purchase]);
  };

  const cancelPurchase = async (id: string) => {
    updateEntityState('purchases', state.purchases.map(p => p.id === id ? { ...p, status: 'Anulado' } : p));
    await supabase.from('purchases').update({ status: 'Anulado' }).eq('id', id);
  };

  const addTask = async (task: OperationalTask) => {
    updateEntityState('tasks', [...state.tasks, task]);
    await supabase.from('tasks').insert([task]);
  };

  const updateTask = async (task: OperationalTask) => {
    updateEntityState('tasks', state.tasks.map(t => t.id === task.id ? task : t));
    await supabase.from('tasks').update(task).eq('id', task.id);
  };

  const deleteTask = async (id: string) => {
    updateEntityState('tasks', state.tasks.filter(t => t.id !== id));
    await supabase.from('tasks').delete().eq('id', id);
  };

  const refreshCloudData = async () => {
    await fetchAllData();
  };

  const setTheme = (theme: 'light' | 'dark') => {
    setState(prev => ({ ...prev, theme }));
    localStorage.setItem('theme', theme);
  };
  
  const setCurrency = (currency: Currency) => {
    setState(prev => ({ ...prev, currency }));
    localStorage.setItem('currency', currency);
  };

  return (
    <StoreContext.Provider value={{ 
      state, loading, isCloudConnected, setTheme, setCurrency, setIdentityConfig, login, logout, 
      addSystemUser, updateSystemUser, deleteSystemUser, updateUserPassword, addProduct, updateProduct, addClient, updateClient, 
      addSupplier, updateSupplier, addSale, updateSale, cancelSale, addPurchase, 
      cancelPurchase, addTask, updateTask, deleteTask, refreshCloudData
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within a StoreProvider');
  return context;
};
