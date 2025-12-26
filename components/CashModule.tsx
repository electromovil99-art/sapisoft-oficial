
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, Minus, Wallet, Banknote, QrCode, Landmark, CreditCard, Eye, X, Lock, Unlock, CheckCircle, Printer, RotateCcw, ArrowRightLeft, Calculator, FileText, AlertTriangle, ChevronRight, ArrowRight, Tag, Layers, Hash, Layout, FileText as FileIcon, Clock } from 'lucide-react';
import { CashMovement, PaymentMethodType, BankAccount, SaleRecord, PurchaseRecord, CartItem, CashBoxSession } from '../types';

interface CashModuleProps {
    movements: CashMovement[];
    salesHistory: SaleRecord[];
    purchasesHistory: PurchaseRecord[];
    onAddMovement: (m: CashMovement) => void;
    bankAccounts: BankAccount[];
    onUniversalTransfer: (fromId: string, toId: string, amount: number, exchangeRate: number, reference: string, opNumber: string) => void;
    fixedExpenseCategories: string[];
    fixedIncomeCategories: string[];
    onAddFixedCategory: (category: string, type: 'Ingreso' | 'Egreso') => void;
    isCashBoxOpen: boolean;
    lastClosingCash: number;
    onOpenCashBox: (openingCash: number, notes: string, confirmedBankBalances: Record<string, string>) => void;
    onCloseCashBox: (countedCash: number, systemCash: number, systemDigital: number, notes: string, confirmedBankBalances: Record<string, string>) => void;
    systemBaseCurrency: string;
    currentSession?: CashBoxSession; 
}

const formatSymbol = (code?: string) => {
    if (!code) return 'S/';
    const c = code.toUpperCase();
    if (c === 'PEN' || c === 'SOLES') return 'S/';
    if (c === 'USD' || c === 'DOLARES') return '$';
    return code;
};

const DenominationRow: React.FC<{ 
    label: string, 
    value: number, 
    count: string, 
    onChange: (val: string) => void,
    onEnter: () => void,
    inputRef?: (el: HTMLInputElement | null) => void
}> = ({ label, value, count, onChange, onEnter, inputRef }) => (
    <div className="grid grid-cols-[55px_1fr_60px] items-center gap-1 py-0.5 border-b border-slate-50 dark:border-slate-800 last:border-0">
        <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">S/ {label}</span>
        <input 
            ref={inputRef}
            type="number" 
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded py-0.5 px-1 text-center font-black text-[10px] text-slate-700 dark:text-white outline-none focus:border-primary-500"
            value={count}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onEnter()}
            placeholder="0"
        />
        <span className="text-[9px] font-bold text-slate-400 text-right">S/ {(Number(count) * value).toFixed(2)}</span>
    </div>
);

const CashBoxManager: React.FC<{
    type: 'OPEN' | 'CLOSE',
    expectedCash: number,
    bankBalances: any[],
    onConfirm: (total: number, notes: string, confirmedBanks: any) => void,
    onCancel?: () => void
}> = ({ type, expectedCash, bankBalances, onConfirm, onCancel }) => {
    const [counts, setCounts] = useState<Record<string, string>>({
        '200': '', '100': '', '50': '', '20': '', '10': '',
        '5': '', '2': '', '1': '', '0.50': '', '0.20': '', '0.10': ''
    });
    const [manualBankBalances, setManualBankBalances] = useState<Record<string, string>>({});
    const [notes, setNotes] = useState('');
    const [showAuditWarning, setShowAuditWarning] = useState(false);
    
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const denominations = [
        { label: '200.00', val: 200 }, { label: '100.00', val: 100 }, { label: '50.00', val: 50 },
        { label: '20.00', val: 20 }, { label: '10.00', val: 10 }, { label: '5.00', val: 5 },
        { label: '2.00', val: 2 }, { label: '1.00', val: 1 }, { label: '0.50', val: 0.5 },
        { label: '0.20', val: 0.2 }, { label: '0.10', val: 0.1 }
    ];

    const physicalTotal = useMemo(() => {
        return Object.entries(counts).reduce((acc: number, [label, count]) => acc + (Number(label) * (Number(count) || 0)), 0);
    }, [counts]);

    const cashDifference = physicalTotal - expectedCash;

    const auditDiferencias = useMemo(() => {
        const diffs: { name: string, type: 'SOBRANTE' | 'FALTANTE', amount: number }[] = [];
        if (Math.abs(cashDifference) > 0.01) {
            diffs.push({ name: 'EFECTIVO CAJA', type: cashDifference > 0 ? 'SOBRANTE' : 'FALTANTE', amount: Math.abs(cashDifference) });
        }
        bankBalances.forEach(acc => {
            const real = parseFloat(manualBankBalances[acc.id] || '0');
            const diff = real - acc.currentBalance;
            if (Math.abs(diff) > 0.01) {
                diffs.push({ name: acc.alias || acc.bankName, type: diff > 0 ? 'SOBRANTE' : 'FALTANTE', amount: Math.abs(diff) });
            }
        });
        return diffs;
    }, [cashDifference, manualBankBalances, bankBalances]);

    const handleInitialConfirm = () => {
        if (type === 'OPEN') {
            const missing = bankBalances.some(acc => manualBankBalances[acc.id] === undefined || manualBankBalances[acc.id] === '');
            if (missing) {
                alert("ERROR: Debe ingresar el saldo real de todas sus cuentas para aperturar.");
                return;
            }
        }
        if (auditDiferencias.length > 0) setShowAuditWarning(true);
        else onConfirm(physicalTotal, notes, manualBankBalances);
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-[1.5rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 relative">
            {showAuditWarning && (
                <div className="absolute inset-0 z-[100] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md flex flex-col p-6 animate-in fade-in">
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                        <AlertTriangle size={48} className="text-orange-500 mb-4 animate-bounce"/>
                        <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase mb-4">¡Diferencias Detectadas!</h3>
                        <div className="w-full max-w-md space-y-2 mb-6">
                            {auditDiferencias.map((diff, i) => (
                                <div key={i} className="flex justify-between items-center p-3 bg-white dark:bg-slate-800 border border-slate-100 rounded-xl shadow-sm">
                                    <span className="text-[9px] font-black text-slate-500 uppercase">{diff.name}</span>
                                    <span className={`text-xs font-black ${diff.type === 'SOBRANTE' ? 'text-emerald-600' : 'text-red-600'}`}>S/ {diff.amount.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-3 w-full max-w-md">
                            <button onClick={() => setShowAuditWarning(false)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-500 rounded-xl font-black uppercase text-[9px]">Revisar</button>
                            <button onClick={() => onConfirm(physicalTotal, notes, manualBankBalances)} className="flex-1 py-3 bg-orange-600 text-white rounded-xl font-black uppercase text-[9px]">Confirmar Ajuste</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2">
                    {type === 'OPEN' ? <Unlock size={16} className="text-primary-500"/> : <Lock size={16} className="text-red-500"/>}
                    <h2 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tighter">
                        {type === 'OPEN' ? 'Apertura de Turno' : 'Cierre de Turno'}
                    </h2>
                </div>
                {onCancel && <button onClick={onCancel} className="p-1 text-slate-400 hover:text-red-500"><X size={20}/></button>}
            </div>

            <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                    <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">1. Conteo Efectivo</h3>
                    <div className="bg-slate-50/50 dark:bg-slate-900/30 p-2 rounded-xl border border-slate-100">
                        {denominations.map((d, idx) => (
                            <DenominationRow 
                                key={d.label} label={d.label} value={d.val} count={counts[d.val.toString()] || ''} 
                                onChange={(v) => setCounts({...counts, [d.val.toString()]: v})}
                                onEnter={() => { inputRefs.current[idx + 1]?.focus(); inputRefs.current[idx + 1]?.select(); }}
                                inputRef={(el) => { inputRefs.current[idx] = el; }}
                            />
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 p-5 rounded-2xl shadow-sm relative overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Total Efectivo Contado</p>
                            <div className="text-4xl font-black text-slate-900 dark:text-white leading-none">S/ {physicalTotal.toFixed(2)}</div>
                            <div className="mt-3 flex justify-between items-center border-t border-slate-50 pt-2">
                                <span className="text-[9px] font-bold text-slate-400">SISTEMA: S/ {expectedCash.toFixed(2)}</span>
                                <span className={`text-[10px] font-black ${cashDifference >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>DIF: S/ {cashDifference.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">2. Validar Bancos (Obligatorio)</h3>
                        <div className="space-y-2 max-h-[160px] overflow-y-auto no-scrollbar">
                            {bankBalances.map((acc) => (
                                <div key={acc.id} className="p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 rounded-xl">
                                    <div className="flex justify-between items-center mb-1">
                                        <p className="font-black text-[9px] text-slate-700 dark:text-white uppercase truncate">{acc.alias || acc.bankName}</p>
                                        <p className="text-[8px] font-bold text-slate-400">Sis: {formatSymbol(acc.currency)} {acc.currentBalance.toFixed(2)}</p>
                                    </div>
                                    <input 
                                        type="number" 
                                        className="w-full p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded-lg text-xs font-black outline-none focus:border-primary-500"
                                        value={manualBankBalances[acc.id] || ''}
                                        onChange={e => setManualBankBalances({...manualBankBalances, [acc.id]: e.target.value})}
                                        placeholder="Ingrese saldo real..."
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 flex justify-end">
                <button 
                    onClick={handleInitialConfirm}
                    className="px-12 py-3.5 bg-primary-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg active:scale-95 transition-all"
                >
                    {type === 'OPEN' ? 'CONFIRMAR APERTURA' : 'FINALIZAR CIERRE'}
                </button>
            </div>
        </div>
    );
};

export const CashModule: React.FC<CashModuleProps> = ({ 
    movements, salesHistory, purchasesHistory, onAddMovement, bankAccounts, onUniversalTransfer, 
    fixedExpenseCategories, fixedIncomeCategories, onAddFixedCategory, 
    isCashBoxOpen, lastClosingCash, onOpenCashBox, onCloseCashBox,
    systemBaseCurrency, currentSession
}) => {
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'CASH' | 'DIGITAL'>('ALL');
  const [amount, setAmount] = useState('');
  const [concept, setConcept] = useState('');
  const [category, setCategory] = useState('');
  const [financialType, setFinancialType] = useState<'Fijo' | 'Variable' | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('Efectivo');
  const [bankAccountId, setBankAccountId] = useState('');
  const [operationNumber, setOperationNumber] = useState('');
  const [transferData, setTransferData] = useState({ from: 'CASH', to: '', amount: '', rate: '1.0', reference: '', operationNumber: '' });

  const todayStr = new Date().toLocaleDateString('es-PE');

  const activeMovements = useMemo(() => {
      if (!currentSession) return [];
      const openingTimeStr = currentSession.openingDate.split(' ')[1];
      return movements.filter(m => m.date === todayStr && m.time >= openingTimeStr);
  }, [movements, todayStr, currentSession]);

  const displayedMovements = useMemo(() => {
      let filtered = [...activeMovements];
      if (filter === 'CASH') filtered = filtered.filter(m => m.paymentMethod === 'Efectivo');
      if (filter === 'DIGITAL') filtered = filtered.filter(m => m.paymentMethod !== 'Efectivo');
      
      const chronoSorted = [...filtered].sort((a, b) => a.time.localeCompare(b.time));
      const runningBalances: Record<string, number> = { 'CASH': currentSession?.countedOpening || 0 };
      
      bankAccounts.forEach(acc => {
          runningBalances[acc.id] = currentSession?.confirmedDigitalAtOpen[acc.id] || 0;
      });
      
      return chronoSorted.map(m => {
          if (m.category === 'AJUSTE APERTURA') return { ...m, accumulatedBalance: runningBalances[m.accountId || 'CASH'] };
          const targetId = m.accountId || 'CASH';
          if (m.type === 'Ingreso') runningBalances[targetId] += m.amount;
          else runningBalances[targetId] -= m.amount;
          return { ...m, accumulatedBalance: runningBalances[targetId] };
      });
  }, [activeMovements, filter, bankAccounts, currentSession]);

  const bankBalancesInfo = useMemo(() => {
    return bankAccounts.map(acc => {
      const currentBalance = movements
        .filter(m => m.accountId === acc.id)
        .reduce((sum, m) => m.type === 'Ingreso' ? sum + m.amount : sum - m.amount, 0);
      const openingBalance = currentSession?.confirmedDigitalAtOpen[acc.id] ?? currentBalance;
      return { ...acc, currentBalance, openingBalance };
    });
  }, [bankAccounts, movements, currentSession]);

  const currentCashActual = useMemo(() => {
      const diffSinceOpen = activeMovements
        .filter(m => m.paymentMethod === 'Efectivo' && m.category !== 'AJUSTE APERTURA')
        .reduce((acc, m) => m.type === 'Ingreso' ? acc + m.amount : acc - m.amount, 0);
      return (currentSession?.countedOpening || 0) + diffSinceOpen;
  }, [activeMovements, currentSession]);

  const handleSaveMovement = (type: 'Ingreso' | 'Egreso') => {
      if (!amount || !concept || !financialType) return alert("Complete los campos obligatorios.");
      const finalCategory = financialType === 'Fijo' ? category.toUpperCase() : 'VARIABLE';

      onAddMovement({ 
        id: 'M-' + Date.now(), date: todayStr, 
        time: new Date().toLocaleTimeString('es-PE', { hour12: false }), 
        type, paymentMethod, concept: concept.toUpperCase(), amount: parseFloat(amount), 
        user: 'ADMIN', category: finalCategory, financialType: financialType as any, 
        accountId: paymentMethod !== 'Efectivo' ? bankAccountId : undefined,
        referenceId: paymentMethod !== 'Efectivo' ? operationNumber.toUpperCase() : undefined,
        currency: paymentMethod === 'Efectivo' ? systemBaseCurrency : bankAccounts.find(b=>b.id===bankAccountId)?.currency || systemBaseCurrency
      });
      
      setIsIncomeModalOpen(false); setIsExpenseModalOpen(false); 
      setAmount(''); setConcept(''); setCategory(''); setFinancialType(''); setPaymentMethod('Efectivo'); setOperationNumber('');
  };

  const handleExecuteTransfer = () => {
    const amt = parseFloat(transferData.amount);
    if (isNaN(amt) || amt <= 0) return alert("Monto inválido.");
    if (!transferData.operationNumber) return alert("Ingrese el Nro de Operación.");

    onUniversalTransfer(transferData.from, transferData.to, amt, parseFloat(transferData.rate), transferData.reference, transferData.operationNumber);
    setIsTransferModalOpen(false);
    setTransferData({ from: 'CASH', to: '', amount: '', rate: '1.0', reference: '', operationNumber: '' });
  };

  if (!isCashBoxOpen) {
      return (
          <div className="h-full flex items-center justify-center p-3 bg-slate-50/50">
              <CashBoxManager type="OPEN" expectedCash={lastClosingCash} bankBalances={bankBalancesInfo} onConfirm={onOpenCashBox} />
          </div>
      )
  }

  return (
    <div className="flex flex-col h-full gap-2 p-1 animate-in fade-in duration-500 overflow-hidden relative">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 shrink-0">
            <div className="bg-white dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-primary-500">
                <div className="flex items-center justify-between mb-1 border-b pb-1 border-slate-50 dark:border-slate-700">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Efectivo / Caja</span>
                    <Clock size={12} className="text-primary-400"/>
                </div>
                <div className="space-y-1">
                    <div className="flex justify-between items-center text-[9px]">
                        <span className="text-slate-400 font-bold uppercase">Apertura Real:</span>
                        <span className="font-black text-slate-700 dark:text-slate-300">S/ {currentSession?.countedOpening.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-50 dark:border-slate-700 pt-1">
                        <span className="text-[9px] font-black text-emerald-600 uppercase">Saldo Actual:</span>
                        <span className="text-sm font-black text-slate-800 dark:text-white">S/ {currentCashActual.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <div className="col-span-3 flex gap-2 overflow-x-auto no-scrollbar py-0.5">
                {bankBalancesInfo.map(acc => (
                    <div key={acc.id} className="bg-white dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-100 min-w-[160px] shadow-sm border-l-2 border-l-blue-400">
                        <div className="flex items-center justify-between mb-1 border-b pb-1 border-slate-50 dark:border-slate-700">
                            <span className="text-[9px] font-black text-slate-500 uppercase truncate max-w-[110px]">{acc.alias || acc.bankName}</span>
                            <span className="text-[7px] font-black bg-slate-100 dark:bg-slate-700 px-1 rounded uppercase">{acc.currency}</span>
                        </div>
                        <div className="flex justify-between items-center mb-0.5">
                            <span className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter">Abrió con:</span>
                            <span className="text-[9px] font-black text-slate-500">{formatSymbol(acc.currency)} {acc.openingBalance.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center border-t border-slate-50 dark:border-slate-700 pt-1">
                            <span className="text-[8px] text-primary-500 font-black uppercase tracking-tighter">Actual:</span>
                            <span className="text-xs font-black text-slate-800 dark:text-white">{formatSymbol(acc.currency)} {acc.currentBalance.toFixed(2)}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        <div className="flex-1 flex flex-col bg-white dark:bg-slate-800 rounded-xl border border-slate-200 overflow-hidden shadow-sm min-h-0">
            <div className="px-3 py-1.5 border-b flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-2">
                    <h3 className="font-black text-[10px] text-slate-700 uppercase tracking-wider">Flujo de Turno</h3>
                    <select value={filter} onChange={e => setFilter(e.target.value as any)} className="bg-white border rounded text-[8px] py-0.5 font-bold uppercase px-1 outline-none">
                        <option value="ALL">Todo</option><option value="CASH">Efectivo</option><option value="DIGITAL">Digital</option>
                    </select>
                </div>
                <div className="flex items-center gap-1.5">
                    <button onClick={() => setIsTransferModalOpen(true)} className="px-2 py-1 bg-blue-600 text-white rounded text-[9px] font-black uppercase flex items-center gap-1 shadow-sm"><ArrowRightLeft size={10}/> Transferir</button>
                    <button onClick={() => setIsCloseModalOpen(true)} className="px-2 py-1 bg-slate-800 text-white rounded text-[9px] font-black uppercase flex items-center gap-1 shadow-sm"><Lock size={10}/> Cierre</button>
                    <button onClick={() => setIsIncomeModalOpen(true)} className="px-2 py-1 bg-emerald-600 text-white rounded text-[9px] font-black uppercase flex items-center gap-1 shadow-sm"><Plus size={10}/> Ingreso</button>
                    <button onClick={() => setIsExpenseModalOpen(true)} className="px-2 py-1 bg-orange-600 text-white rounded text-[9px] font-black uppercase flex items-center gap-1 shadow-sm"><Minus size={10}/> Gasto</button>
                </div>
            </div>
            <div className="flex-1 overflow-auto">
                <table className="w-full text-[10px] text-left">
                    <thead className="bg-slate-50 text-slate-400 font-black uppercase border-b sticky top-0">
                        <tr><th className="px-3 py-1.5">Hora</th><th className="px-3 py-1.5">Metodo</th><th className="px-3 py-1.5">Concepto</th><th className="px-3 py-1.5 w-32">Ref</th><th className="px-3 py-1.5 text-right">Importe</th><th className="px-3 py-1.5 text-right bg-slate-100">Saldo Acum.</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {displayedMovements.map(m => (
                            <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-3 py-2 font-bold text-slate-500">{m.time}</td>
                                <td className="px-3 py-2 font-bold uppercase">{m.paymentMethod}</td>
                                <td className="px-3 py-2 font-black uppercase text-slate-800 dark:text-slate-200">{m.concept}</td>
                                <td className="px-3 py-2 font-mono text-primary-600">#{m.referenceId || '---'}</td>
                                <td className={`px-3 py-2 text-right font-black ${m.type === 'Ingreso' ? 'text-emerald-600' : 'text-red-600'}`}>{m.type === 'Ingreso' ? '+' : '-'} {m.amount.toFixed(2)}</td>
                                <td className="px-3 py-2 text-right font-mono font-black bg-slate-50/50">S/ {m.accumulatedBalance?.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {/* MODALES DE ACCION */}
        {isTransferModalOpen && (
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-sm shadow-2xl border border-white/20 animate-in zoom-in-95">
                    <div className="p-4 bg-blue-600 text-white flex justify-between items-center rounded-t-3xl">
                        <h3 className="font-black text-xs uppercase tracking-widest">TRANSFERIR FONDOS</h3>
                        <button onClick={() => setIsTransferModalOpen(false)}><X size={18}/></button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="space-y-1">
                             <label className="text-[10px] font-black text-slate-500 uppercase text-center block">Monto a Enviar</label>
                             <input type="number" className="w-full p-3 bg-slate-50 border-2 rounded-2xl text-4xl font-black text-center text-blue-600 outline-none" value={transferData.amount} onChange={e => setTransferData({...transferData, amount: e.target.value})} placeholder="0.00"/>
                        </div>
                        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                            <select className="p-2 bg-slate-50 border rounded-lg text-[10px] font-bold outline-none uppercase" value={transferData.from} onChange={e => setTransferData({...transferData, from: e.target.value})}>
                                <option value="CASH">Caja</option>
                                {bankAccounts.map(b => <option key={b.id} value={b.id}>{b.alias || b.bankName}</option>)}
                            </select>
                            <ArrowRight size={14} className="text-slate-300"/>
                            <select className="p-2 bg-slate-50 border rounded-lg text-[10px] font-bold outline-none uppercase" value={transferData.to} onChange={e => setTransferData({...transferData, to: e.target.value})}>
                                <option value="">-- Destino --</option>
                                <option value="CASH">Caja</option>
                                {bankAccounts.map(b => <option key={b.id} value={b.id}>{b.alias || b.bankName}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                             <input type="text" className="w-full p-2 bg-slate-50 border rounded-xl text-xs font-black uppercase" placeholder="Nro Operación / CCI" value={transferData.operationNumber} onChange={e => setTransferData({...transferData, operationNumber: e.target.value})} />
                             <input type="text" className="w-full p-2 bg-slate-50 border rounded-xl text-[10px] uppercase" placeholder="Referencia (Opcional)" value={transferData.reference} onChange={e => setTransferData({...transferData, reference: e.target.value})} />
                        </div>
                        <button onClick={handleExecuteTransfer} className="w-full py-4 bg-blue-600 text-white rounded-2xl uppercase text-[10px] shadow-lg active:scale-95 transition-all">Confirmar Transferencia</button>
                    </div>
                </div>
            </div>
        )}

        {isCloseModalOpen && (
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
                <CashBoxManager type="CLOSE" expectedCash={currentCashActual} bankBalances={bankBalancesInfo} onCancel={() => setIsCloseModalOpen(false)} onConfirm={(c, n, b) => { onCloseCashBox(c, currentCashActual, 0, n, b); setIsCloseModalOpen(false); }} />
            </div>
        )}

        {(isIncomeModalOpen || isExpenseModalOpen) && (
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col border border-white/10 animate-in zoom-in-95">
                    <div className={`p-4 flex justify-between items-center ${isIncomeModalOpen ? 'bg-emerald-600' : 'bg-orange-600'} text-white`}>
                        <h3 className="font-black text-xs uppercase tracking-widest">{isIncomeModalOpen ? 'REGISTRAR INGRESO' : 'REGISTRAR GASTO'}</h3>
                        <button onClick={() => { setIsIncomeModalOpen(false); setIsExpenseModalOpen(false); }}><X size={18}/></button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <select className="p-2 bg-slate-50 border rounded-xl text-[10px] font-black uppercase outline-none" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as any)}>
                                <option value="Efectivo">Efectivo</option><option value="Transferencia">Transferencia</option><option value="Yape">Yape</option><option value="Tarjeta">Tarjeta</option>
                            </select>
                            <select className="p-2 bg-slate-50 border rounded-xl text-[10px] font-black uppercase outline-none" value={financialType} onChange={e => setFinancialType(e.target.value as any)}>
                                <option value="">-- TIPO --</option><option value="Variable">Variable</option><option value="Fijo">Fijo</option>
                            </select>
                        </div>
                        {paymentMethod !== 'Efectivo' && (
                            <div className="space-y-2 p-2 bg-slate-50 rounded-xl">
                                <select className="w-full p-2 bg-white border rounded-lg text-[10px] font-bold outline-none" value={bankAccountId} onChange={e => setBankAccountId(e.target.value)}><option value="">-- Banco --</option>{bankAccounts.map(b => <option key={b.id} value={b.id}>{b.alias || b.bankName}</option>)}</select>
                                <input type="text" className="w-full p-2 bg-white border rounded-lg text-[10px] font-bold outline-none uppercase" value={operationNumber} onChange={e => setOperationNumber(e.target.value)} placeholder="Nro Operación" />
                            </div>
                        )}
                        <input type="text" className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold uppercase outline-none" value={concept} onChange={e => setConcept(e.target.value)} placeholder="Concepto..." />
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300 italic">S/</span>
                            <input type="number" className="w-full pl-12 p-4 bg-slate-50 border-2 rounded-2xl text-4xl font-black text-slate-800 outline-none" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
                        </div>
                    </div>
                    <div className="p-4 bg-slate-50 border-t flex gap-2">
                        <button onClick={() => { setIsIncomeModalOpen(false); setIsExpenseModalOpen(false); }} className="flex-1 py-3 text-slate-500 font-black uppercase text-[9px] hover:bg-slate-100 rounded-xl transition-all">Cancelar</button>
                        <button onClick={() => handleSaveMovement(isIncomeModalOpen ? 'Ingreso' : 'Egreso')} className={`flex-[2] py-3 text-white font-black uppercase text-[10px] rounded-xl shadow-lg transition-all active:scale-95 ${isIncomeModalOpen ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-orange-600 hover:bg-orange-700'}`}>Guardar</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default CashModule;
