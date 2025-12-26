
import React, { useState, useMemo } from 'react';
import { ShieldCheck, History, Brain, TrendingDown, TrendingUp, AlertTriangle, Search, Eye, X, ArrowRight, DollarSign, Calculator, Lock, Info, RotateCcw } from 'lucide-react';
import { InventoryHistorySession, Product } from '../types';
import { GoogleGenAI } from "@google/genai";

interface InventoryAuditModuleProps {
    history: InventoryHistorySession[];
    products: Product[];
}

const InventoryAuditModule: React.FC<InventoryAuditModuleProps> = ({ history, products }) => {
    const [selectedSession, setSelectedSession] = useState<InventoryHistorySession | null>(null);
    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // --- KPIs de Auditoría ---
    const stats = useMemo(() => {
        let totalLoss = 0;
        let totalExtra = 0;
        let totalItemsChecked = 0;

        history.forEach(session => {
            session.items.forEach(item => {
                const product = products.find(p => p.id === item.productId);
                const cost = product?.cost || (product?.price ? product.price * 0.7 : 0);
                
                if (item.difference < 0) {
                    totalLoss += Math.abs(item.difference) * cost;
                } else if (item.difference > 0) {
                    totalExtra += item.difference * cost;
                }
                totalItemsChecked += 1;
            });
        });

        return { totalLoss, totalExtra, totalItemsChecked, netImpact: totalExtra - totalLoss };
    }, [history, products]);

    // --- Lógica de IA Gemini ---
    const runAiAudit = async () => {
        if (history.length === 0) return;
        setIsAnalyzing(true);
        setAiAnalysis(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            // Preparar data compacta para la IA
            const historySummary = history.slice(0, 5).map(s => ({
                fecha: s.date,
                usuario: s.user,
                resumen: s.items.map(i => `${i.productName}: DIF ${i.difference}`).join(', ')
            }));

            const prompt = `Actúa como un auditor senior de retail y experto en prevención de pérdidas. 
            Analiza estos datos de toma de inventario: ${JSON.stringify(historySummary)}.
            Detecta: 
            1. Patrones de robo hormiga (productos que faltan repetidamente).
            2. Errores de recepción (productos que "sobran" sospechosamente).
            3. Riesgo de manipulación de sistema por parte de usuarios.
            Sé crítico, usa lenguaje profesional pero directo. No alucines, si los datos son pocos, menciónalo pero da una hipótesis.`;

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
            });

            setAiAnalysis(response.text);
        } catch (error) {
            console.error("Error AI Audit:", error);
            setAiAnalysis("Error al conectar con el cerebro de auditoría. Verifique su API Key.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="flex flex-col h-full gap-4 animate-in fade-in duration-500 max-w-[1600px] mx-auto w-full">
            
            {/* 1. Header con Resumen de Impacto Económico */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 shrink-0">
                <div className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-center border-l-4 border-l-rose-500">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><TrendingDown size={12} className="text-rose-500"/> Faltantes (Pérdida)</p>
                    <div className="text-2xl font-black text-rose-600 dark:text-rose-400 leading-none">- S/ {stats.totalLoss.toFixed(2)}</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-center border-l-4 border-l-emerald-500">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><TrendingUp size={12} className="text-emerald-500"/> Sobrantes (Error Ingreso)</p>
                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 leading-none">+ S/ {stats.totalExtra.toFixed(2)}</div>
                </div>
                <div className={`bg-white dark:bg-slate-800 p-5 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-center border-l-4 ${stats.netImpact >= 0 ? 'border-l-indigo-500' : 'border-l-amber-500'}`}>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Impacto Neto Almacén</p>
                    <div className={`text-2xl font-black leading-none ${stats.netImpact >= 0 ? 'text-indigo-600' : 'text-amber-600'}`}>S/ {stats.netImpact.toFixed(2)}</div>
                </div>
                <div className="bg-slate-900 dark:bg-primary-950 p-5 rounded-[2rem] shadow-xl border border-primary-500/20 flex items-center justify-between group overflow-hidden relative">
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-primary-300 uppercase tracking-widest mb-1 flex items-center gap-2"><Brain size={14} className="animate-pulse"/> Auditoría IA</p>
                        <button 
                            onClick={runAiAudit}
                            disabled={isAnalyzing || history.length === 0}
                            className="mt-1 bg-primary-600 text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-primary-500 transition-all active:scale-95 disabled:opacity-30"
                        >
                            {isAnalyzing ? 'Procesando...' : 'Iniciar Análisis IA'}
                        </button>
                    </div>
                    <Brain size={80} className="absolute -right-4 -bottom-4 text-white/5 rotate-12 group-hover:scale-110 transition-transform"/>
                </div>
            </div>

            {/* 2. Cuerpo: Listado vs IA */}
            <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
                
                {/* Listado de Auditorías */}
                <div className="w-full lg:w-[60%] bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 flex justify-between items-center">
                        <h3 className="font-black text-xs uppercase tracking-widest text-slate-700 dark:text-white flex items-center gap-2"><History size={16}/> Historial Cronológico</h3>
                        <div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input type="text" className="pl-9 pr-3 py-1.5 bg-white border rounded-xl text-[10px] outline-none w-48" placeholder="Filtrar por usuario..."/></div>
                    </div>
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-left">
                            <thead className="sticky top-0 bg-white dark:bg-slate-800 text-slate-400 font-black uppercase text-[9px] tracking-widest border-b z-20">
                                <tr>
                                    <th className="px-6 py-3">Referencia</th>
                                    <th className="px-6 py-3">Auditor</th>
                                    <th className="px-6 py-3 text-center">Items</th>
                                    <th className="px-6 py-3 text-center">Discrepancias</th>
                                    <th className="px-6 py-3 text-center">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                                {history.map(session => {
                                    const disc = session.items.filter(i => i.difference !== 0).length;
                                    return (
                                        <tr key={session.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-black text-slate-800 dark:text-white text-xs uppercase">#{session.id}</div>
                                                <div className="text-[9px] text-slate-400 font-bold uppercase">{session.date} - {session.time}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-black text-[10px] text-slate-500">{session.user[0]}</div>
                                                    <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase">{session.user}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center font-black text-slate-400 text-xs">{session.items.length}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${disc > 0 ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                                                    {disc} Descuadres
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button onClick={() => setSelectedSession(session)} className="p-2 text-slate-300 hover:text-primary-600 transition-all"><Eye size={18}/></button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Panel IA: Recomendaciones */}
                <div className="flex-1 bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-indigo-50/50 dark:bg-indigo-900/10 flex items-center justify-between">
                        <h3 className="font-black text-xs uppercase tracking-widest text-indigo-900 dark:text-indigo-200 flex items-center gap-2"><Brain size={16} className="text-primary-600"/> Reporte de Inteligencia Auditora</h3>
                        {aiAnalysis && <button onClick={() => setAiAnalysis(null)} className="text-slate-400 hover:text-red-500 transition-colors"><RotateCcw size={14}/></button>}
                    </div>
                    <div className="flex-1 p-6 overflow-y-auto">
                        {!aiAnalysis ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 rounded-[2rem] flex items-center justify-center mb-6 animate-bounce duration-3000">
                                    <ShieldCheck size={40} className="text-primary-600"/>
                                </div>
                                <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight mb-2">Asistente Auditor Activo</h4>
                                <p className="text-xs text-slate-400 font-bold max-w-[250px] leading-relaxed uppercase tracking-tighter">
                                    Inicie el análisis IA para que SapiSoft cruce los datos de las últimas 5 auditorías y genere una hipótesis de seguridad.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                                <div className="bg-indigo-50 dark:bg-indigo-950/40 p-5 rounded-3xl border border-indigo-100 dark:border-indigo-800 relative overflow-hidden">
                                    <Brain size={48} className="absolute -right-4 -top-4 text-indigo-200/50 dark:text-indigo-800/30"/>
                                    <p className="text-xs text-indigo-900 dark:text-indigo-100 font-bold leading-relaxed whitespace-pre-wrap italic">
                                        "{aiAnalysis}"
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900">
                                        <h5 className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase mb-2 flex items-center gap-1"><TrendingUp size={12}/> Sugerencia de Mejora</h5>
                                        <p className="text-[10px] text-emerald-800 dark:text-emerald-200 font-bold">Refuerce el doble control en productos tipo {products[0]?.category || 'Accesorios'}.</p>
                                    </div>
                                    <div className="bg-rose-50 dark:bg-rose-950/30 p-4 rounded-2xl border border-rose-100 dark:border-rose-900">
                                        <h5 className="text-[10px] font-black text-rose-700 dark:text-rose-400 uppercase mb-2 flex items-center gap-1"><Lock size={12}/> Control Preventivo</h5>
                                        <p className="text-[10px] text-rose-800 dark:text-rose-200 font-bold">Cambie la frecuencia de auditoría a 48 horas en zona de vitrinas.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* MODAL DETALLE SESIÓN (REUSADO Y MEJORADO) */}
            {selectedSession && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden border border-white/20 animate-in slide-in-from-bottom-4">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                            <button onClick={() => setSelectedSession(null)} className="flex items-center gap-2 text-slate-400 hover:text-slate-800 font-bold uppercase text-[10px] tracking-widest transition-colors">
                                <X size={16} className="rotate-180"/> Cerrar
                            </button>
                            <h3 className="font-black text-sm text-slate-800 dark:text-white uppercase tracking-tighter">Detalle de Auditoría #{selectedSession.id}</h3>
                            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 text-primary-600 rounded-lg"><Info size={18}/></div>
                        </div>
                        <div className="flex-1 overflow-auto p-6">
                            <table className="w-full text-left text-[11px]">
                                <thead className="bg-slate-50 dark:bg-slate-900 text-slate-400 font-black uppercase border-b tracking-wider">
                                    <tr>
                                        <th className="px-5 py-4">Artículo Auditado</th>
                                        <th className="px-5 py-4 text-center">Stock Teórico</th>
                                        <th className="px-5 py-4 text-center">Conteo Físico</th>
                                        <th className="px-5 py-4 text-center">Diferencia</th>
                                        <th className="px-5 py-4 text-right">Impacto Econ.</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {selectedSession.items.map((item, i) => {
                                        const product = products.find(p => p.id === item.productId);
                                        const cost = product?.cost || (product?.price ? product.price * 0.7 : 0);
                                        const impact = item.difference * cost;
                                        return (
                                            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                                <td className="px-5 py-3">
                                                    <div className="font-black text-slate-700 dark:text-slate-300 uppercase leading-none">{item.productName}</div>
                                                    <div className="text-[9px] text-slate-400 mt-1 uppercase font-bold">{product?.code || '---'}</div>
                                                </td>
                                                <td className="px-5 py-3 text-center font-mono font-bold text-slate-400">{item.systemStock}</td>
                                                <td className="px-5 py-3 text-center font-black text-slate-800 dark:text-white text-sm">{item.physicalCount}</td>
                                                <td className={`px-5 py-3 text-center`}>
                                                    <span className={`px-2 py-1 rounded-lg font-black ${item.difference > 0 ? 'bg-emerald-50 text-emerald-600' : item.difference < 0 ? 'bg-rose-50 text-rose-600' : 'text-slate-300'}`}>
                                                        {item.difference > 0 ? `+${item.difference}` : item.difference}
                                                    </span>
                                                </td>
                                                <td className={`px-5 py-3 text-right font-black ${impact >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                    S/ {impact.toFixed(2)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryAuditModule;
