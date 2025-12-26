
import React, { useMemo } from 'react';
import { ViewState, AuthSession } from '../types';
import { 
  LayoutDashboard, ShoppingCart, Package, Wrench, 
  Wallet, Users, Activity, ShoppingBag, FolderCog, FileSearch, Truck, Landmark, BrainCircuit, Moon, Sun,
  LogOut, Search, Bell, TrendingDown, TrendingUp, Printer, Shield, FileMinus, CreditCard, ChevronRight, Menu, Map, MessageCircle, Globe,
  Database, Settings, BarChart3, ClipboardList, Cloud, CloudOff, FileScan, FileBarChart, PieChart, Image as ImageIcon, History, Building2, Crown, ShieldCheck
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  companyName: string;
  companyLogo: string | null;
  navStructure: any[];
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  session: AuthSession; 
  onLogout: () => void; 
  isSyncEnabled: boolean;
  toggleSyncMode: () => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, companyName, companyLogo, navStructure, currentView, 
  onNavigate, isDarkMode, toggleTheme, session, onLogout, 
  isSyncEnabled, toggleSyncMode 
}) => {
  
  const isSuperAdmin = session?.user.role === 'SUPER_ADMIN';
  const isGlobalView = currentView === ViewState.SUPER_ADMIN_DASHBOARD;

  const activeCategory = useMemo(() => {
    if (currentView === ViewState.DASHBOARD || currentView === ViewState.SUPER_ADMIN_DASHBOARD) return null;
    return navStructure.find(cat => 
      cat.items?.some((item: any) => item.view === currentView)
    );
  }, [currentView, navStructure]);

  return (
    <div className={`flex flex-col h-screen w-full bg-[#f8fafc] dark:bg-[#020617] overflow-hidden transition-colors duration-300 font-sans ${isDarkMode ? 'dark' : ''}`}>
      
      {/* 1. SLIM SEGMENTED HEADER - DISEÑO CÁPSULA */}
      <header className="relative shrink-0 z-[100] px-3 pt-3 pb-1">
         <div className={`max-w-[1920px] mx-auto transition-all duration-500 rounded-3xl shadow-2xl border border-white/10 backdrop-blur-2xl h-14 flex items-center px-4 relative overflow-hidden ${isGlobalView ? 'bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900' : 'bg-gradient-to-r from-indigo-800 via-primary to-purple-900 dark:from-slate-950 dark:to-slate-900'}`}>
            
            {/* Brillo sutil de fondo */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.1),transparent)] pointer-events-none"></div>

            {/* Branding Section: SapiSoft con Icono S */}
            <div className="flex items-center shrink-0 pr-4 mr-2 border-r border-white/10">
                <button 
                    onClick={() => onNavigate(isSuperAdmin ? ViewState.SUPER_ADMIN_DASHBOARD : ViewState.DASHBOARD)} 
                    className="flex items-center gap-3 group transition-all active:scale-95"
                >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center border backdrop-blur-md transition-all shadow-inner ${isGlobalView ? 'bg-amber-500/20 border-amber-500/40 group-hover:bg-amber-500/30' : 'bg-white/20 border-white/30 group-hover:bg-white/30'}`}>
                       {companyLogo ? (
                         <img src={companyLogo} alt="Logo" className="w-5 h-5 object-contain" />
                       ) : (
                         <span className={`font-black text-xl leading-none select-none ${isGlobalView ? 'text-amber-400' : 'text-white'}`}>S</span>
                       )}
                    </div>
                    <div className="flex flex-col text-left">
                       <h1 className="font-black text-white text-[11px] leading-none tracking-tighter uppercase drop-shadow-md">
                           {isGlobalView ? 'SapiSoft Master' : 'SapiSoft'}
                       </h1>
                       <span className={`text-[7px] font-black tracking-[0.2em] uppercase ${isGlobalView ? 'text-amber-400/70' : 'text-white/50'}`}>
                           {isGlobalView ? 'Platform Control' : 'Cloud Software'}
                       </span>
                    </div>
                </button>
            </div>

            {/* SEGMENTED NAVIGATION - Ocultar si es Vista Global de Super Admin */}
            <nav className="flex-1 flex items-center justify-start lg:justify-center gap-1.5 h-full px-2 overflow-x-auto no-scrollbar">
                {!isGlobalView ? (
                    navStructure.map((cat) => {
                        const isActive = activeCategory?.id === cat.id;
                        const Icon = cat.icon;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => cat.items && onNavigate(cat.items[0].view)}
                                className={`relative flex items-center gap-2 h-9 px-4 rounded-xl transition-all duration-300 group/btn shrink-0
                                    ${isActive 
                                        ? 'bg-white/25 border border-white/40 shadow-[0_4px_12px_rgba(255,255,255,0.1)]' 
                                        : 'hover:bg-white/10 border border-transparent hover:border-white/10'
                                    }
                                `}
                            >
                                <Icon 
                                    size={15} 
                                    strokeWidth={isActive ? 3 : 2.5} 
                                    className={`transition-transform duration-300 ${isActive ? 'text-white scale-110' : 'text-white/60 group-hover/btn:text-white/90'}`} 
                                />
                                <span className={`text-[11px] font-black uppercase tracking-tight transition-colors ${isActive ? 'text-white' : 'text-white/60 group-hover/btn:text-white/90'}`}>
                                    {cat.label}
                                </span>
                                {isActive && (
                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-[3px] bg-white rounded-full shadow-[0_0_12px_rgba(255,255,255,1)] animate-in fade-in zoom-in duration-300"></div>
                                )}
                            </button>
                        );
                    })
                ) : (
                    <div className="flex items-center gap-2 px-6 py-2 bg-black/30 rounded-2xl border border-white/5 animate-in slide-in-from-top-2">
                        <ShieldCheck size={14} className="text-amber-500" />
                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">Panel Maestro de Control Global</span>
                    </div>
                )}
            </nav>

            {/* Actions Section - Derecha */}
            <div className="flex items-center gap-2 ml-2 pl-4 border-l border-white/10 shrink-0">
               {!isGlobalView && (
                    <button 
                        onClick={toggleSyncMode}
                        className={`flex p-2 rounded-xl transition-all ${
                            isSyncEnabled 
                                ? 'text-emerald-400 bg-emerald-500/20 border border-emerald-400/30' 
                                : 'text-white/30 hover:text-white/80'
                        }`}
                        title={isSyncEnabled ? 'Online' : 'Offline'}
                    >
                        {isSyncEnabled ? <Cloud size={16} className="animate-pulse"/> : <CloudOff size={16}/>}
                    </button>
               )}
               
               <div className="flex items-center gap-0.5 bg-black/20 rounded-xl p-0.5 border border-white/5">
                   <button onClick={toggleTheme} className="p-1.5 text-white/50 hover:text-amber-300 hover:bg-white/10 rounded-lg transition-all">
                      {isDarkMode ? <Sun size={15} fill="currentColor"/> : <Moon size={15}/>}
                   </button>
                   <button className="relative p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                      <Bell size={15} />
                      <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-primary"></span>
                   </button>
               </div>

               <div className="flex items-center gap-2 ml-1">
                  <div className="flex items-center gap-2 group cursor-pointer pl-1">
                      <div className="text-right hidden xl:block leading-none">
                          <p className="text-[10px] font-black text-white uppercase tracking-tight">
                              {session.user.fullName.split(' ')[0]}
                          </p>
                      </div>
                      <div className={`w-8 h-8 rounded-lg border p-[1px] shadow-sm group-hover:scale-105 transition-all overflow-hidden ${isGlobalView ? 'bg-amber-500/20 border-amber-500/40' : 'bg-white/20 border-white/30'}`}>
                          <img 
                            src={`https://ui-avatars.com/api/?name=${session.user.fullName}&background=${isGlobalView ? 'f59e0b' : 'ffffff'}&color=${isGlobalView ? 'ffffff' : '7c3aed'}&bold=true`} 
                            alt="User" 
                            className="rounded-[6px] h-full w-full object-cover" 
                          />
                      </div>
                  </div>
                  <button 
                    onClick={onLogout} 
                    className="p-1.5 text-white/30 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                    title="Cerrar Sesión"
                  >
                      <LogOut size={16}/>
                  </button>
               </div>
            </div>
         </div>
      </header>

      {/* 2. SUB HEADER (Navegación Secundaria) */}
      {activeCategory && activeCategory.items && (
          <div className="px-6 pb-2 shrink-0 animate-in slide-in-from-top-1 duration-300">
              <div className="max-w-[1800px] mx-auto h-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center px-4 overflow-x-auto no-scrollbar gap-1">
                  {activeCategory.items.map((item: any) => {
                      const isActiveSub = currentView === item.view;
                      const ItemIcon = item.icon;
                      return (
                          <button
                              key={item.view}
                              onClick={() => onNavigate(item.view)}
                              className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-black transition-all whitespace-nowrap border shrink-0
                                  ${isActiveSub
                                      ? 'bg-primary/10 text-primary border-primary/20 shadow-sm'
                                      : 'text-slate-500 dark:text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100'
                                  }
                              `}
                          >
                              <ItemIcon size={12} strokeWidth={3} className={isActiveSub ? 'text-primary' : 'opacity-60'}/>
                              <span className="uppercase tracking-widest">{item.label}</span>
                          </button>
                      )
                  })}
              </div>
          </div>
      )}

      {/* 3. MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
         <div className="flex-1 overflow-auto p-4 lg:p-6 scroll-smooth no-scrollbar">
            <div className="max-w-[1850px] mx-auto h-full flex flex-col animate-in fade-in duration-500">
               {children}
            </div>
         </div>
      </main>

      {/* MODAL ROOT CON Z-INDEX MÁXIMO */}
      <div id="modal-root" className="relative z-[999]"></div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default Layout;
