

import React, { useMemo, useState } from 'react';
import { useStore } from '../store';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, LabelList, AreaChart, Area
} from 'recharts';
import { TrendingUp, Users, ShoppingBag, Landmark, CreditCard, Clock, FileCheck, FileWarning, Apple, Briefcase, Activity } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { state } = useStore();
  const [filter, setFilter] = useState<'Día' | 'Mes' | 'Año'>('Mes');

  const stats = useMemo(() => {
    const totalSales = state.sales.reduce((acc, s) => s.saleStatus !== 'Anulado' ? acc + s.total : acc, 0);
    const pendingSales = state.sales.filter(s => s.saleStatus === 'Pendiente').reduce((acc, s) => acc + s.total, 0);
    const canceledSales = state.sales.filter(s => s.saleStatus === 'Cancelado').reduce((acc, s) => acc + s.total, 0);
    const tax = totalSales * 0.015;
    const productsSold = state.sales.reduce((acc, s) => acc + s.items.reduce((sum, item) => sum + item.quantity, 0), 0);
    const clientCount = state.clients.length;

    const docsEmitidos = state.sales.filter(s => s.docStatus === 'Emitido').length;
    const docsPendientes = state.sales.filter(s => s.docStatus === 'Pendiente').length;
    
    const productCount = state.products.length;
    const supplierCount = state.suppliers.length;

    return { totalSales, pendingSales, canceledSales, tax, productsSold, clientCount, docsEmitidos, docsPendientes, productCount, supplierCount };
  }, [state.sales, state.clients, state.products, state.suppliers]);

  const monthlySalesData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const data = months.map(m => ({ name: m, ventas: 0, cantidad: 0 }));

    state.sales.forEach(sale => {
      if (sale.saleStatus !== 'Anulado') {
        const [year, month] = sale.date.split('-').map(Number);
        if (year === currentYear) {
          const amount = state.currency === 'PEN' ? sale.total : sale.total / state.exchangeRate;
          data[month - 1].ventas += amount;
          data[month - 1].cantidad += 1;
        }
      }
    });

    return data;
  }, [state.sales, state.currency, state.exchangeRate]);

  const topFruits = useMemo(() => {
    const counts: Record<string, number> = {};
    state.sales.forEach(s => {
      if (s.saleStatus !== 'Anulado') {
        s.items.forEach(item => {
          counts[item.productName] = (counts[item.productName] || 0) + item.quantity;
        });
      }
    });
    return Object.entries(counts)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [state.sales]);

  const topClients = useMemo(() => {
    const totals: Record<string, number> = {};
    state.sales.forEach(s => {
      if (s.saleStatus !== 'Anulado') {
        totals[s.clientName] = (totals[s.clientName] || 0) + s.total;
      }
    });
    return Object.entries(totals)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [state.sales]);

  const pieData = [
    { name: 'Cancelado', value: stats.canceledSales },
    { name: 'Pendiente', value: stats.pendingSales },
  ].filter(d => d.value > 0);

  const COLORS = ['#22c55e', '#eab308'];
  const isDark = state.theme === 'dark';

  const formatMoney = (val: number) => {
    const symbol = state.currency === 'PEN' ? 'S/' : '$';
    const amount = state.currency === 'PEN' ? val : val / state.exchangeRate;
    return `${symbol} ${amount.toFixed(2)}`;
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor="middle" 
        dominantBaseline="central"
        className="text-[11px] font-black"
      >
        {`S/ ${value.toLocaleString()}`}
      </text>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-800 dark:text-white">Panel de Control</h2>
          <p className="text-gray-500 dark:text-gray-400">Resumen operativo Frutería Olga</p>
        </div>
        <div className="flex bg-white dark:bg-gray-800 p-1 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          {['Día', 'Mes', 'Año'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${filter === f ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Venta Total" value={formatMoney(stats.totalSales)} icon={TrendingUp} color="green" />
        <KpiCard title="Pendientes Cobro" value={formatMoney(stats.pendingSales)} icon={Clock} color="yellow" />
        <KpiCard title="Documentos Emitidos" value={stats.docsEmitidos.toString()} icon={FileCheck} color="blue" />
        <KpiCard title="Documentos Pendientes" value={stats.docsPendientes.toString()} icon={FileWarning} color="red" />
        
        <KpiCard title="Impuesto Estimado" value={formatMoney(stats.tax)} icon={Landmark} color="orange" />
        <KpiCard title="Base de Clientes" value={stats.clientCount.toString()} icon={Users} color="purple" />
        <KpiCard title="Cantidad de Frutas" value={stats.productCount.toString()} icon={Apple} color="emerald" />
        <KpiCard title="Proveedores Activos" value={stats.supplierCount.toString()} icon={Briefcase} color="indigo" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 text-primary-600 rounded-xl">
              <Activity size={20} />
            </div>
            <h3 className="text-lg font-black text-gray-800 dark:text-white">Venta Mensual Cantidad</h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlySalesData} margin={{ top: 20, right: 30, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorQty" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#374151' : '#f3f4f6'} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  interval={0}
                  tick={{fill: isDark ? '#9ca3af' : '#6b7280', fontWeight: 'bold'}} 
                />
                <YAxis axisLine={false} tickLine={false} tick={{fill: isDark ? '#9ca3af' : '#6b7280'}} hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: isDark ? '#1f2937' : '#fff', border: 'none', borderRadius: '12px', color: isDark ? '#fff' : '#000' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="cantidad" 
                  stroke="#22c55e" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorQty)" 
                >
                  <LabelList 
                    dataKey="cantidad" 
                    position="top" 
                    formatter={(v: number) => v > 0 ? v : ''}
                    style={{ fill: isDark ? '#ffffff' : '#16a34a', fontWeight: 'black', fontSize: '11px' }} 
                  />
                </Area>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 text-primary-600 rounded-xl">
              <Landmark size={20} />
            </div>
            <h3 className="text-lg font-black text-gray-800 dark:text-white">Venta Mensual Monto</h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlySalesData} margin={{ top: 40, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#374151' : '#f3f4f6'} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  interval={0}
                  tick={{fill: isDark ? '#9ca3af' : '#6b7280', fontWeight: 'bold'}} 
                />
                <YAxis axisLine={false} tickLine={false} tick={{fill: isDark ? '#9ca3af' : '#6b7280'}} hide />
                <Tooltip 
                  cursor={{fill: isDark ? '#1f2937' : '#f9fafb'}} 
                  contentStyle={{ backgroundColor: isDark ? '#1f2937' : '#fff', border: 'none', borderRadius: '12px', color: isDark ? '#fff' : '#000' }}
                  formatter={(value: number) => [`S/ ${value.toLocaleString()}`, 'Ventas']}
                />
                <Bar dataKey="ventas" fill="#22c55e" radius={[10, 10, 0, 0]}>
                  <LabelList 
                    dataKey="ventas" 
                    position="top" 
                    formatter={(v: number) => v > 0 ? `S/ ${v.toLocaleString()}` : ''}
                    style={{ fill: isDark ? '#ffffff' : '#16a34a', fontWeight: 'black', fontSize: '11px' }} 
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-black mb-6 text-gray-800 dark:text-white">Estado Financiero de Ventas</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={110}
                  paddingAngle={8}
                  dataKey="value"
                  label={renderCustomizedLabel}
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [formatMoney(value), 'Monto']}
                  contentStyle={{ backgroundColor: isDark ? '#1f2937' : '#fff', borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', color: isDark ? '#fff' : '#000' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  align="center"
                  iconType="circle"
                  wrapperStyle={{ paddingTop: '30px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-black mb-6 text-gray-800 dark:text-white">Frutas más Vendidas</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={topFruits} margin={{ left: 40, right: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={isDark ? '#374151' : '#f3f4f6'} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: isDark ? '#ffffff' : '#4b5563', fontWeight: 'bold', fontSize: '12px'}} />
                <Tooltip 
                  cursor={{fill: isDark ? '#1f2937' : '#f9fafb'}}
                  contentStyle={{ backgroundColor: isDark ? '#1f2937' : '#fff', border: 'none', borderRadius: '12px', color: isDark ? '#fff' : '#000' }}
                />
                <Bar dataKey="qty" name="Cantidad" fill="#3b82f6" radius={[0, 10, 10, 0]}>
                  <LabelList 
                    dataKey="qty" 
                    position="right" 
                    style={{ fill: isDark ? '#ffffff' : '#1d4ed8', fontWeight: 'black', fontSize: '12px' }} 
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>


      <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-black mb-6 text-gray-800 dark:text-white">Top Clientes (Mayor Compra)</h3>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topClients} margin={{ top: 25 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#374151' : '#f3f4f6'} />
              {/* tickFormatter añadido para mostrar solo el primer nombre */}
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tickFormatter={(value) => value.split(' ')[0]}
                tick={{fill: isDark ? '#ffffff' : '#4b5563', fontWeight: 'bold', fontSize: '10px'}} 
              />
              <YAxis axisLine={false} tickLine={false} hide />
              <Tooltip 
                cursor={{fill: isDark ? '#1f2937' : '#f9fafb'}}
                contentStyle={{ backgroundColor: isDark ? '#1f2937' : '#fff', border: 'none', borderRadius: '12px', color: isDark ? '#fff' : '#000' }}
              />
              <Bar dataKey="total" fill="#a855f7" radius={[12, 12, 0, 0]}>
                <LabelList 
                  dataKey="total" 
                  position="top" 
                  formatter={(v: number) => `S/ ${v.toFixed(0)}`} 
                  style={{ fill: isDark ? '#ffffff' : '#7e22ce', fontWeight: 'black', fontSize: '11px' }} 
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const KpiCard: React.FC<{ title: string, value: string, icon: any, color: string }> = ({ title, value, icon: Icon, color }) => {
  const colors: any = {
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    indigo: 'bg-indigo-100 text-indigo-600',
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 hover:border-primary-500 transition-all group hover:scale-[1.02]">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-4 rounded-2xl ${colors[color] || 'bg-gray-100 text-gray-600'}`}>
          <Icon size={24} />
        </div>
      </div>
      <div>
        <p className="text-gray-400 dark:text-gray-500 text-xs font-black uppercase tracking-widest">{title}</p>
        <h4 className="text-2xl font-black mt-1 text-gray-800 dark:text-white group-hover:text-primary-600 transition-colors">{value}</h4>
      </div>
    </div>
  );
};

export default Dashboard;