
import React, { useMemo } from 'react';
import { 
  ShoppingCart, Users, Wrench, Target, TrendingUp, 
  ArrowRight, Grid, LayoutDashboard, Smartphone, 
  MessageCircle, ArrowUpRight, Wallet, Receipt, Package, DollarSign
} from 'lucide-react';
import { ViewState, AuthSession, CashMovement, Client, ServiceOrder, Product } from '../types';

interface DashboardProps {
  onNavigate: (view: ViewState) => void;
  session?: AuthSession | null;
  cashMovements: CashMovement[];
  clients: Client[];
  services: ServiceOrder[];
  products: Product[]; 
  navStructure: any[]; 
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, session, cashMovements = [], services = [], clients = [], products = [] }) => {
  const userName = session?.user.fullName || 'Usuario';
  const businessName = session?.businessName || 'SapiSoft ERP';
  const dailyGoal = 2000.00;

  // --- CÁLCULOS DE MÉTRICAS ---
  const stats = useMemo(() => {
      const today = new Date().toLocaleDateString('es-PE');
      
      const movementsToday = cashMovements.filter(m => m.date === today);
      const salesTodayAmount = movementsToday
          .filter(m => m.type === 'Ingreso' && (m.category === 'VENTA' || m.concept.toUpperCase().includes('VENTA')))
          .reduce((acc, m) => acc + m.amount, 0);
      
      const salesCountToday = movementsToday.filter(m => m.type === 'Ingreso' && m.category === 'VENTA').length;
      const pendingServices = services.filter(s => s.status === 'Pendiente').length;
      const repairedServices = services.filter(s => s.status === 'Reparado').length;
      const totalClients = clients.length;
      const totalReceivables = clients.reduce((acc, c) => acc + (c.creditUsed || 0), 0);

      const mySalesToday = movementsToday
          .filter(m => m.user === session?.user.fullName && m.type === 'Ingreso' && (m.category === 'VENTA' || m.concept.toUpperCase().includes('VENTA')))
          .reduce((acc, m) => acc + m.amount, 0);

      return { 
          salesTodayAmount, 
          salesCountToday, 
          pendingServices, 
          repairedServices, 
          totalClients,
          totalReceivables,
          mySalesToday
      };
  }, [cashMovements, services, clients, session?.user.fullName]);

  const goalProgress = Math.min(100, (stats.mySalesToday / dailyGoal) * 100);

  return (
    <div className="flex flex-col gap-4 h-full max-h-[calc(100vh-120px)] animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* 1. HERO COMPACTO */}
      <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-5 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-6 relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50 dark:bg-primary-900/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
          
          <div className="z-10 flex flex-col">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-600 text-white rounded-full text-[9px] font-black uppercase tracking-widest mb-2 w-fit">
                  <LayoutDashboard size={10}/> PANEL DE CONTROL
              </div>
              <h2 className="text-3xl font-black text-slate-800 dark:text-white leading-none tracking-tighter">
                  ¡Bienvenido, {userName.split(' ')[0]}!
              </h2>
              <p className="text-slate-400 dark:text-slate-500 text-sm font-bold uppercase tracking-tight mt-1">
                  Resumen de hoy en {businessName}
              </p>
          </div>

          <div className="flex items-center gap-8 z-10">
              <div className="hidden md:block text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mi Meta Personal</p>
                  <div className="flex items-center gap-3 justify-end">
                      <span className="text-2xl font-black text-primary-600">S/ {stats.mySalesToday.toFixed(2)}</span>
                      <div className="w-24 bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                          <div className="bg-primary-600 h-full" style={{ width: `${goalProgress}%` }}></div>
                      </div>
                  </div>
              </div>
              <div className="relative w-16 h-16 shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                      <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-100 dark:text-slate-700" />
                      <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="5" fill="transparent" strokeDasharray={176} strokeDashoffset={176 - (176 * (goalProgress / 100))} strokeLinecap="round" className="text-primary-600 transition-all duration-1000" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-primary-600">
                      {goalProgress.toFixed(0)}%
                  </div>
              </div>
          </div>
      </div>

      {/* 2. GRILLA DE KPIs - 4 COLUMNAS EN UNA FILA */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
          
          {/* VENTAS */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-[1.8rem] shadow-sm border border-slate-200 dark:border-slate-700 group hover:-translate-y-1 transition-all cursor-pointer" onClick={() => onNavigate(ViewState.HISTORY_QUERIES)}>
              <div className="flex justify-between items-start">
                  <div className="p-2.5 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-xl"><DollarSign size={20}/></div>
                  <div className="text-right">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ventas Hoy</span>
                      <p className="text-2xl font-black text-slate-800 dark:text-white leading-none mt-1">S/ {stats.salesTodayAmount.toFixed(2)}</p>
                  </div>
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">{stats.salesCountToday} tickets</span>
              </div>
          </div>

          {/* TALLER */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-[1.8rem] shadow-sm border border-slate-200 dark:border-slate-700 group hover:-translate-y-1 transition-all cursor-pointer" onClick={() => onNavigate(ViewState.SERVICES)}>
              <div className="flex justify-between items-start">
                  <div className="p-2.5 bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 rounded-xl"><Wrench size={20}/></div>
                  <div className="text-right">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">En Taller</span>
                      <p className="text-2xl font-black text-slate-800 dark:text-white leading-none mt-1">{stats.pendingServices + stats.repairedServices}</p>
                  </div>
              </div>
              <div className="mt-3 flex gap-2">
                  <div className="text-[9px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">P: {stats.pendingServices}</div>
                  <div className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">R: {stats.repairedServices}</div>
              </div>
          </div>

          {/* CLIENTES */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-[1.8rem] shadow-sm border border-slate-200 dark:border-slate-700 group hover:-translate-y-1 transition-all cursor-pointer" onClick={() => onNavigate(ViewState.CLIENTS)}>
              <div className="flex justify-between items-start">
                  <div className="p-2.5 bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-xl"><Users size={20}/></div>
                  <div className="text-right">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Clientes</span>
                      <p className="text-2xl font-black text-slate-800 dark:text-white leading-none mt-1">{stats.totalClients}</p>
                  </div>
              </div>
              <div className="mt-3 flex items-center gap-1">
                  <TrendingUp size={12} className="text-emerald-500"/>
                  <span className="text-[10px] font-bold text-slate-500">Crecimiento constante</span>
              </div>
          </div>

          {/* POR COBRAR */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-[1.8rem] shadow-sm border border-slate-200 dark:border-slate-700 group hover:-translate-y-1 transition-all cursor-pointer" onClick={() => onNavigate(ViewState.CLIENT_WALLET)}>
              <div className="flex justify-between items-start">
                  <div className="p-2.5 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-xl"><Wallet size={20}/></div>
                  <div className="text-right">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Por Cobrar</span>
                      <p className="text-2xl font-black text-red-600 leading-none mt-1">S/ {stats.totalReceivables.toFixed(2)}</p>
                  </div>
              </div>
              <div className="mt-3 flex items-center gap-1">
                  <span className="text-[10px] font-black text-red-400 uppercase tracking-tighter">Deuda clientes <ArrowRight size={10}/></span>
              </div>
          </div>

      </div>

      {/* 3. ACCIONES RÁPIDAS - COMPACTO */}
      <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-700 p-5 flex flex-col flex-1 min-h-0 overflow-hidden">
          <h3 className="text-[10px] font-black text-slate-400 dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2">
              <Grid size={12} className="text-primary-600"/> Accesos Directos del Sistema
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1">
              <button onClick={() => onNavigate(ViewState.POS)} className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-[1.5rem] flex items-center gap-3 hover:border-primary/40 hover:bg-white transition-all group">
                  <div className="p-2.5 bg-primary-100 text-primary-600 rounded-xl group-hover:bg-primary-600 group-hover:text-white transition-all"><ShoppingCart size={18}/></div>
                  <div className="text-left leading-tight"><p className="text-[11px] font-black text-slate-800 dark:text-white uppercase">Venta Rápida</p></div>
              </button>
              <button onClick={() => onNavigate(ViewState.SERVICES)} className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-[1.5rem] flex items-center gap-3 hover:border-orange-400/40 hover:bg-white transition-all group">
                  <div className="p-2.5 bg-orange-100 text-orange-600 rounded-xl group-hover:bg-orange-600 group-hover:text-white transition-all"><Smartphone size={18}/></div>
                  <div className="text-left leading-tight"><p className="text-[11px] font-black text-slate-800 dark:text-white uppercase">Nueva Recepción</p></div>
              </button>
              <button onClick={() => onNavigate(ViewState.INVENTORY)} className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-[1.5rem] flex items-center gap-3 hover:border-emerald-400/40 hover:bg-white transition-all group">
                  <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-all"><Package size={18}/></div>
                  <div className="text-left leading-tight"><p className="text-[11px] font-black text-slate-800 dark:text-white uppercase">Inventario</p></div>
              </button>
              <button onClick={() => onNavigate(ViewState.WHATSAPP)} className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-[1.5rem] flex items-center gap-3 hover:border-indigo-400/40 hover:bg-white transition-all group">
                  <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all"><MessageCircle size={18}/></div>
                  <div className="text-left leading-tight"><p className="text-[11px] font-black text-slate-800 dark:text-white uppercase">WhatsApp CRM</p></div>
              </button>
          </div>
          
          {/* BANNER INFERIOR DE ESTADO SUTIL */}
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase tracking-widest shrink-0">
              <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Servidores Online</span>
              <span>SapiSoft v4.0.2 - {new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;
