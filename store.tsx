
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppState, Product, Client, Supplier, Sale, Purchase, Currency, UserRole, SaleStatus, SystemUser } from './types';
import { supabase } from './supabaseClient';

interface StoreContextType {
  state: AppState;
  loading: boolean;
  isCloudConnected: boolean;
  setTheme: (theme: 'light' | 'dark') => void;
  setCurrency: (currency: Currency) => void;
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

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [state, setState] = useState<AppState>({
    theme: (localStorage.getItem('theme') as 'light' | 'dark') || 'light',
    currency: (localStorage.getItem('currency') as Currency) || 'PEN',
    exchangeRate: 3.75,
    user: null,
    users: [INITIAL_USER],
    products: [],
    clients: [],
    suppliers: [],
    sales: [],
    purchases: [],
  });

  const loadLocalData = () => {
    const saved = localStorage.getItem('olga_backup_data');
    if (saved) {
      const data = JSON.parse(saved);
      setState(prev => ({ 
        ...prev, 
        ...data,
        users: data.users && data.users.length > 0 ? data.users : [INITIAL_USER]
      }));
    }
  };

  const saveLocalData = (newState: Partial<AppState>) => {
    const dataToSave = {
      products: newState.products || state.products,
      clients: newState.clients || state.clients,
      suppliers: newState.suppliers || state.suppliers,
      sales: newState.sales || state.sales,
      purchases: newState.purchases || state.purchases,
      users: newState.users || state.users,
    };
    localStorage.setItem('olga_backup_data', JSON.stringify(dataToSave));
  };

  useEffect(() => {
    if (state.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
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
        { data: cloudUsers }
      ] = await Promise.all([
        supabase.from('products').select('*').order('name'),
        supabase.from('clients').select('*').order('name'),
        supabase.from('suppliers').select('*').order('name'),
        supabase.from('sales').select('*').order('date', { ascending: false }),
        supabase.from('purchases').select('*').order('date', { ascending: false }),
        supabase.from('users').select('*').order('name')
      ]);

      const newState = {
        products: products || [],
        clients: clients || [],
        suppliers: suppliers || [],
        sales: sales || [],
        purchases: purchases || [],
        users: (cloudUsers && cloudUsers.length > 0) ? cloudUsers : state.users
      };
      
      setState(prev => {
        const currentUserInCloud = newState.users.find(u => u.id === prev.user?.id);
        return { 
          ...prev, 
          ...newState,
          user: currentUserInCloud || prev.user
        };
      });
      saveLocalData(newState);
      setIsCloudConnected(true);
    } catch (error) {
      setIsCloudConnected(false);
      loadLocalData();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    const userMatch = state.users.find(u => u.username === username && u.password === password && u.active);
    if (userMatch) {
      setState(prev => ({ ...prev, user: userMatch }));
      localStorage.setItem('olga_logged_user', JSON.stringify(userMatch));
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

  const addSystemUser = async (user: SystemUser) => {
    const newUsers = [...state.users, user];
    setState(prev => ({ ...prev, users: newUsers }));
    saveLocalData({ users: newUsers });
    await supabase.from('users').insert([user]);
  };

  const updateSystemUser = async (user: SystemUser) => {
    const newUsers = state.users.map(u => u.id === user.id ? user : u);
    const updatedCurrentUser = state.user?.id === user.id ? user : state.user;
    setState(prev => ({ ...prev, users: newUsers, user: updatedCurrentUser }));
    if (state.user?.id === user.id) localStorage.setItem('olga_logged_user', JSON.stringify(updatedCurrentUser));
    saveLocalData({ users: newUsers });
    await supabase.from('users').update(user).eq('id', user.id);
  };

  const deleteSystemUser = async (id: string) => {
    if (id === 'master-1') return alert('No se puede eliminar el usuario maestro');
    const newUsers = state.users.filter(u => u.id !== id);
    setState(prev => ({ ...prev, users: newUsers }));
    saveLocalData({ users: newUsers });
    await supabase.from('users').delete().eq('id', id);
  };

  const updateUserPassword = async (id: string, newPassword: string) => {
    const user = state.users.find(u => u.id === id);
    if (user) {
      await updateSystemUser({ ...user, password: newPassword });
    }
  };

  const addProduct = async (product: Product) => {
    const newList = [product, ...state.products];
    setState(prev => ({ ...prev, products: newList }));
    saveLocalData({ products: newList });
    await supabase.from('products').insert([product]);
  };

  const updateProduct = async (product: Product) => {
    const newList = state.products.map(p => p.id === product.id ? product : p);
    setState(prev => ({ ...prev, products: newList }));
    saveLocalData({ products: newList });
    await supabase.from('products').update(product).eq('id', product.id);
  };

  const addClient = async (client: Client) => {
    const newList = [client, ...state.clients];
    setState(prev => ({ ...prev, clients: newList }));
    saveLocalData({ clients: newList });
    await supabase.from('clients').insert([client]);
  };

  const updateClient = async (client: Client) => {
    const newList = state.clients.map(c => c.id === client.id ? client : c);
    setState(prev => ({ ...prev, clients: newList }));
    saveLocalData({ clients: newList });
    await supabase.from('clients').update(client).eq('id', client.id);
  };

  const addSupplier = async (supplier: Supplier) => {
    const newList = [supplier, ...state.suppliers];
    setState(prev => ({ ...prev, suppliers: newList }));
    saveLocalData({ suppliers: newList });
    await supabase.from('suppliers').insert([supplier]);
  };

  const updateSupplier = async (supplier: Supplier) => {
    const newList = state.suppliers.map(s => s.id === supplier.id ? supplier : s);
    setState(prev => ({ ...prev, suppliers: newList }));
    saveLocalData({ suppliers: newList });
    await supabase.from('suppliers').update(supplier).eq('id', supplier.id);
  };

  const addSale = async (sale: Sale) => {
    const updatedProducts = state.products.map(p => {
      const item = sale.items.find(i => i.productId === p.id);
      return item ? { ...p, stock: Number(p.stock) - Number(item.quantity) } : p;
    });
    const newSales = [sale, ...state.sales];
    setState(prev => ({ ...prev, sales: newSales, products: updatedProducts }));
    saveLocalData({ sales: newSales, products: updatedProducts });
    await supabase.from('sales').insert([sale]);
  };

  const updateSale = async (sale: Sale) => {
    const newSales = state.sales.map(s => s.id === sale.id ? sale : s);
    setState(prev => ({ ...prev, sales: newSales }));
    saveLocalData({ sales: newSales });
    await supabase.from('sales').update(sale).eq('id', sale.id);
  };

  const cancelSale = async (id: string) => {
    const newSales = state.sales.map(s => s.id === id ? { ...s, saleStatus: 'Anulado' as SaleStatus } : s);
    setState(prev => ({ ...prev, sales: newSales }));
    saveLocalData({ sales: newSales });
    await supabase.from('sales').update({ saleStatus: 'Anulado' }).eq('id', id);
  };

  const addPurchase = async (purchase: Purchase) => {
    const updatedProducts = state.products.map(p => {
      const item = purchase.items.find(i => i.productId === p.id);
      return item ? { ...p, stock: Number(p.stock) + Number(item.quantity) } : p;
    });
    const newPurchases = [purchase, ...state.purchases];
    setState(prev => ({ ...prev, purchases: newPurchases, products: updatedProducts }));
    saveLocalData({ purchases: newPurchases, products: updatedProducts });
    await supabase.from('purchases').insert([purchase]);
  };

  const cancelPurchase = async (id: string) => {
    const newPurchases = state.purchases.map(p => p.id === id ? { ...p, status: 'Anulado' as any } : p);
    setState(prev => ({ ...prev, purchases: newPurchases }));
    saveLocalData({ purchases: newPurchases });
    await supabase.from('purchases').update({ status: 'Anulado' }).eq('id', id);
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
      state, loading, isCloudConnected, setTheme, setCurrency, login, logout, 
      addSystemUser, updateSystemUser, deleteSystemUser, updateUserPassword, addProduct, updateProduct, addClient, updateClient, 
      addSupplier, updateSupplier, addSale, updateSale, cancelSale, addPurchase, 
      cancelPurchase, refreshCloudData
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
