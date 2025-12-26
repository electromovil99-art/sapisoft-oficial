
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, Minus, Wallet, Banknote, QrCode, Landmark, CreditCard, Eye, X, Lock, Unlock, CheckCircle, Printer, RotateCcw, ArrowRightLeft, Calculator, FileText, AlertTriangle, ChevronRight, ArrowRight, Tag, Layers, Hash, Layout, FileText as FileIcon } from 'lucide-react';
import { CashMovement, PaymentMethodType, BankAccount, SaleRecord, PurchaseRecord, CartItem } from '../types';

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
}

const formatSymbol = (code?: string) => {
    if (!code) return 'S/';
    const c = code.toUpperCase();
    if (c === 'PEN' || c === 'SOLES') return 'S/';
    if (c === 'USD' || c === 'DOLARES') return '$';
    return code;
};

const DetailRow: React.FC<{ label: string; value: string | number | React.ReactNode; color?: string }> = ({ label, value, color }) => (
    <div className="flex justify-between items-center py-1 border-b border-slate-50 dark:border-slate-700 last:border-0">
        <span className="text-slate-500 dark:text-slate-400 text-[9px] font-bold uppercase">{label}</span>
        <div className={`font-bold text-[10px] text-right ${color || 'text-slate-700 dark:text-slate-200'}`}>{value}</div>
    </div>
);

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
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded py-0.5 px-1 text-center font-black text-[10px] text-slate-700 dark:text-white outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20"
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
    const bankRefs = useRef<(HTMLInputElement | null)[]>([]);
    const confirmBtnRef = useRef<HTMLButtonElement>(null);

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
        if (auditDiferencias.length > 0) setShowAuditWarning(true);
        else onConfirm(physicalTotal, notes, manualBankBalances);
    };

    const handlePrintArqueo = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        const dateStr = new Date().toLocaleString();
        
        let denomHtml = '';
        denominations.forEach(d => {
            const qty = Number(counts[d.val.toString()] || 0);
            if (qty > 0) denomHtml += `<div style="display:flex; justify-content:space-between; margin-bottom:2px;"><span>S/ ${d.label} x ${qty}</span><span style="font-weight:bold;">S/ ${(qty * d.val).toFixed(2)}</span></div>`;
        });

        let bankHtml = '';
        bankBalances.forEach(acc => {
            const symbol = formatSymbol(acc.currency);
            const real = parseFloat(manualBankBalances[acc.id] || '0');
            const diff = real - acc.currentBalance;
            bankHtml += `<div style="border-bottom:1px dashed #ccc; padding:4px 0;">
                <div style="font-weight:bold; font-size:11px;">${acc.alias || acc.bankName}</div>
                <div style="display:flex; justify-content:space-between; font-size:10px;"><span>SIS: ${symbol} ${acc.currentBalance.toFixed(2)}</span><span>REAL: ${symbol} ${real.toFixed(2)}</span></div>
                <div style="text-align:right; font-weight:bold; color:${diff < 0 ? 'red' : 'green'}; font-size:10px;">DIF: ${symbol} ${diff.toFixed(2)}</div>
            </div>`;
        });

        printWindow.document.write(`
            <html><head><title>Arqueo de Caja</title><style>body { font-family:monospace; font-size:12px; width:80mm; padding:10px; } .line { border-bottom:1px dashed #000; margin:10px 0; } .total { font-size:16px; font-weight:bold; text-align:right; }</style></head>
            <body>
                <center><h2 style="margin-bottom:2px;">SAPISOFT ERP</h2><strong>ARQUEO DE CAJA - ${type === 'OPEN' ? 'APERTURA' : 'CIERRE'}</strong><br>${dateStr}</center>
                <div class="line"></div>
                <strong>DETALLE EFECTIVO:</strong><br>${denomHtml || 'Sin efectivo contado'}
                <div class="line"></div>
                <div class="total">EFECTIVO: S/ ${physicalTotal.toFixed(2)}</div>
                <div style="text-align:right; color:${cashDifference < 0 ? 'red' : 'black'};">DIF. CAJA: S/ ${cashDifference.toFixed(2)}</div>
                <div class="line"></div>
                <strong>CUENTAS BANCARIAS:</strong><br>${bankHtml}
                <div class="line"></div>
                <p><strong>NOTAS:</strong> ${notes || '-'}</p>
                <center><br><br>____________________<br>Firma Responsable</center>
            </body></html>
        `);
        printWindow.document.close(); printWindow.print();
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-[1.2rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-white/20 animate-in zoom-in-95 relative">
            
            {showAuditWarning && (
                <div className="absolute inset-0 z-[100] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md flex flex-col p-6 animate-in fade-in zoom-in-95">
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-full flex items-center justify-center mb-4 shadow-xl animate-bounce"><AlertTriangle size={32}/></div>
                        <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tighter mb-1">¡Diferencias Detectadas!</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Revise antes de confirmar</p>
                        <div className="w-full max-w-md space-y-2 mb-6">
                            {auditDiferencias.map((diff, i) => (
                                <div key={i} className="flex justify-between items-center p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-sm">
                                    <span className="text-[9px] font-black text-slate-500 uppercase">{diff.name}</span>
                                    <div className="text-right">
                                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase mr-2 ${diff.type === 'SOBRANTE' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{diff.type}</span>
                                        <span className={`text-xs font-black ${diff.type === 'SOBRANTE' ? 'text-emerald-600' : 'text-red-600'}`}>S/ {diff.amount.toFixed(2)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-3 w-full max-w-md">
                            <button onClick={() => setShowAuditWarning(false)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 font-black rounded-xl uppercase text-[9px] tracking-widest">Revisar</button>
                            <button onClick={() => onConfirm(physicalTotal, notes, manualBankBalances)} className="flex-1 py-3 bg-orange-600 text-white font-black rounded-xl uppercase text-[9px] tracking-widest shadow-lg">Confirmar de todas formas</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="p-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2">
                    <div className="p-1 bg-white dark:bg-slate-700 rounded-lg shadow-sm">
                        {type === 'OPEN' ? <Unlock size={14} className="text-primary-500"/> : <Lock size={14} className="text-red-500"/>}
                    </div>
                    <h2 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tighter">
                        {type === 'OPEN' ? 'Apertura de Caja' : 'Cierre de Caja'}
                    </h2>
                </div>
                <div className="flex items-center gap-1.5">
                    <button onClick={handlePrintArqueo} className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-[8px] font-black uppercase text-slate-500 hover:text-primary-600 flex items-center gap-1 transition-all">
                        <Printer size={12}/> Arqueo 80mm
                    </button>
                    {onCancel && <button onClick={onCancel} className="p-1 text-slate-400 hover:text-red-500"><X size={18}/></button>}
                </div>
            </div>

            <div className="p-3 grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <h3 className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">1. Conteo de Efectivo</h3>
                    <div className="bg-slate-50/50 dark:bg-slate-900/30 p-2 rounded-xl border border-slate-100 dark:border-slate-700">
                        {denominations.map((d, idx) => (
                            <DenominationRow 
                                key={d.label} 
                                label={d.label} 
                                value={d.val} 
                                count={counts[d.val.toString()] || counts[d.label] || ''} 
                                onChange={(v) => setCounts({...counts, [d.val.toString()]: v})}
                                onEnter={() => { 
                                    if (idx < denominations.length - 1) { 
                                        inputRefs.current[idx + 1]?.focus(); 
                                        inputRefs.current[idx + 1]?.select(); 
                                    } else {
                                        bankRefs.current[0]?.focus();
                                        bankRefs.current[0]?.select();
                                    }
                                }}
                                inputRef={(el) => { inputRefs.current[idx] = el; }}
                            />
                        ))}
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700 shadow-inner">
                        <h3 className="text-[8px] font-black text-slate-400 uppercase mb-2 tracking-widest">2. Resumen Efectivo</h3>
                        <div className="space-y-1">
                            <div className="flex justify-between items-center text-[9px]">
                                <span className="font-bold text-slate-500">Saldo Sistema:</span>
                                <span className="font-black text-slate-800 dark:text-white">S/ {expectedCash.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-[9px]">
                                <span className="font-bold text-slate-500">Conteo Físico:</span>
                                <span className="font-black text-slate-800 dark:text-white">S/ {physicalTotal.toFixed(2)}</span>
                            </div>
                            <div className="pt-1 mt-1 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                                <span className="font-black text-orange-600 uppercase text-[9px]">Diferencia:</span>
                                <span className={`text-sm font-black ${cashDifference < 0 ? 'text-red-500' : 'text-emerald-500'}`}>S/ {cashDifference.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <h3 className="text-[8px] font-black text-slate-400 uppercase tracking-widest">3. Confirmar Bancos</h3>
                        <div className="space-y-1 max-h-[160px] overflow-y-auto no-scrollbar">
                            {bankBalances.map((acc, bIdx) => {
                                const system = acc.currentBalance;
                                const real = parseFloat(manualBankBalances[acc.id] || '0');
                                const bDiff = real - system;
                                const symbol = formatSymbol(acc.currency);
                                return (
                                    <div key={acc.id} className="p-1.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-lg">
                                        <div className="flex justify-between items-center mb-1">
                                            <p className="font-black text-[8px] text-slate-800 dark:text-white uppercase truncate">{acc.alias || acc.bankName}</p>
                                            <p className="text-[8px] font-black text-slate-400 italic">Sis: {symbol} {system.toFixed(2)}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="relative flex-1">
                                                <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[8px] font-black text-slate-300">REAL:</span>
                                                <input 
                                                    ref={el => bankRefs.current[bIdx] = el}
                                                    type="number" 
                                                    className="w-full pl-7 pr-1 py-0.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-black text-slate-800 dark:text-white outline-none focus:border-primary-500"
                                                    value={manualBankBalances[acc.id] || ''}
                                                    onChange={e => setManualBankBalances({...manualBankBalances, [acc.id]: e.target.value})}
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter') {
                                                            if (bIdx < bankBalances.length - 1) {
                                                                bankRefs.current[bIdx+1]?.focus();
                                                                bankRefs.current[bIdx+1]?.select();
                                                            } else {
                                                                confirmBtnRef.current?.focus();
                                                            }
                                                        }
                                                    }}
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            <div className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase text-center min-w-[50px] ${bDiff === 0 ? 'bg-slate-100 text-slate-400' : bDiff > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                                {bDiff === 0 ? 'OK' : `${bDiff > 0 ? '+' : ''}${bDiff.toFixed(1)}`}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-[8px] font-black text-slate-400 uppercase mb-1 tracking-widest">4. Notas</h3>
                        <textarea 
                            className="w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg h-10 resize-none outline-none focus:border-primary-500 font-bold text-[9px] text-slate-600 dark:text-slate-300"
                            placeholder="Observaciones de arqueo..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex justify-end">
                <button 
                    ref={confirmBtnRef}
                    onClick={handleInitialConfirm}
                    className="px-8 py-2.5 bg-[#c084fc] hover:bg-purple-500 text-white rounded-xl font-black uppercase tracking-widest text-[9px] flex items-center gap-1.5 shadow-md transition-all active:scale-95"
                >
                    {type === 'OPEN' ? <Unlock size={12}/> : <Lock size={12}/>}
                    {type === 'OPEN' ? 'Confirmar Apertura' : 'Finalizar Cierre'}
                </button>
            </div>
        </div>
    );
};

export const CashModule: React.FC<CashModuleProps> = ({ 
    movements, salesHistory, purchasesHistory, onAddMovement, bankAccounts, onUniversalTransfer, 
    fixedExpenseCategories, fixedIncomeCategories, onAddFixedCategory, 
    isCashBoxOpen, lastClosingCash, onOpenCashBox, onCloseCashBox,
    systemBaseCurrency
}) => {
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  
  const [selectedMovement, setSelectedMovement] = useState<CashMovement | null>(null);
  const [ticketToView, setTicketToView] = useState<any>(null); // State for actual ticket data
  const [printFormat, setPrintFormat] = useState<'80mm' | 'A4'>('80mm');
  const [filter, setFilter] = useState<'ALL' | 'CASH' | 'DIGITAL'>('ALL');
  
  const [amount, setAmount] = useState('');
  const [concept, setConcept] = useState('');
  const [category, setCategory] = useState('');
  const [financialType, setFinancialType] = useState<'Fijo' | 'Variable' | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('Efectivo');
  const [bankAccountId, setBankAccountId] = useState('');
  const [operationNumber, setOperationNumber] = useState('');

  const [transferData, setTransferData] = useState({ from: 'CASH', to: '', amount: '', rate: '1.0', reference: '', operationNumber: '' });

  const filteredMovements = useMemo(() => {
      return movements
        .filter(m => {
          if (filter === 'CASH') return m.paymentMethod === 'Efectivo';
          if (filter === 'DIGITAL') return m.paymentMethod !== 'Efectivo';
          return true;
        })
        .sort((a, b) => {
            const dateA = (a.date || "").split('/').reverse().join('');
            const dateB = (b.date || "").split('/').reverse().join('');
            const timeA = a.time || "00:00:00";
            const timeB = b.time || "00:00:00";
            return (dateB + timeB).localeCompare(dateA + timeA);
        });
  }, [movements, filter]);

  const bankBalances = useMemo(() => {
    return bankAccounts.map(acc => {
      const relatedMoves = movements.filter(m => m.accountId === acc.id);
      // FIX: Added explicit type 'number' for the accumulator 'sum' in reduce to prevent 'unknown' type issues.
      const currentBalance = relatedMoves.reduce((sum: number, m) => m.type === 'Ingreso' ? sum + m.amount : sum - m.amount, 0);
      // FIX: Added explicit type 'number' for the accumulator 'sum' in reduce.
      const initialToday = relatedMoves
        .filter(m => m.date !== new Date().toLocaleDateString('es-PE'))
        .reduce((sum: number, m) => m.type === 'Ingreso' ? sum + m.amount : sum - m.amount, 0);
      
      return { ...acc, currentBalance, initialToday };
    });
  }, [bankAccounts, movements]);

  // FIX: Added explicit type 'number' for the accumulator 'acc' to avoid TypeScript errors when calculating saldoEfectivoHoy.
  const saldoEfectivoHoy = movements.reduce((acc: number, m) => m.paymentMethod === 'Efectivo' ? (m.type === 'Ingreso' ? acc + m.amount : acc - m.amount) : acc, 0);
  const totalEfectivoActual = lastClosingCash + saldoEfectivoHoy;

  const handleViewMovement = (m: CashMovement) => {
      // 1. Intentar encontrar si es una venta o una compra por el referenceId
      if (m.referenceId) {
          const sale = salesHistory.find(s => s.id === m.referenceId);
          if (sale) {
              setTicketToView({
                  ...sale,
                  client: { name: sale.clientName, dni: '00000000' }, // Mock para compatibilidad
                  // FIX: Explicitly typed reduce parameters to fix unknown type error when summing breakdown.
                  condition: sale.paymentBreakdown?.cash > 0 && Object.values(sale.paymentBreakdown).reduce((a: number, b: any) => a + (b || 0), 0) >= sale.total ? 'CONTADO' : 'PENDIENTE'
              });
              return;
          }
          const purchase = purchasesHistory.find(p => p.id === m.referenceId);
          if (purchase) {
              setTicketToView({
                  ...purchase,
                  supplier: { name: purchase.supplierName, ruc: '00000000' },
                  condition: purchase.paymentCondition.toUpperCase()
              });
              return;
          }
      }
      
      // 2. Si no es ticket de negocio, mostrar el voucher de caja general (Ingreso/Egreso/Transferencia)
      setTicketToView({
          isCashVoucher: true,
          ...m
      });
  };

  const handleSaveMovement = (type: 'Ingreso' | 'Egreso') => {
      if (!financialType) return alert("Debe seleccionar si el movimiento es Fijo o Variable");
      if (!amount || !concept) return alert("Ingrese monto y concepto.");
      if (financialType === 'Fijo' && !category) return alert("Seleccione una categoría fija.");
      
      if (paymentMethod !== 'Efectivo' && !operationNumber) {
          return alert("Debe ingresar el Número de Operación para este medio de pago.");
      }

      const finalCategory = financialType === 'Fijo' ? category.toUpperCase() : 'VARIABLE';

      onAddMovement({ 
        id: Math.random().toString(36).substr(2, 9), 
        date: new Date().toLocaleDateString('es-PE'), 
        time: new Date().toLocaleTimeString('es-PE', {hour: '2-digit', minute:'2-digit', second: '2-digit'}), 
        type: type, 
        paymentMethod, 
        concept: concept.toUpperCase(), 
        amount: parseFloat(amount), 
        user: 'ADMIN', 
        category: finalCategory, 
        financialType: financialType as any, 
        accountId: paymentMethod !== 'Efectivo' ? bankAccountId : undefined,
        referenceId: paymentMethod !== 'Efectivo' ? operationNumber.toUpperCase() : undefined,
        currency: paymentMethod === 'Efectivo' ? systemBaseCurrency : bankAccounts.find(b=>b.id===bankAccountId)?.currency || systemBaseCurrency
      });
      
      setIsIncomeModalOpen(false); setIsExpenseModalOpen(false); 
      setAmount(''); setConcept(''); setCategory(''); setFinancialType(''); setPaymentMethod('Efectivo'); setOperationNumber('');
  };

  const fromAccTransfer = transferData.from === 'CASH' ? { bankName: 'CAJA', currency: 'PEN', alias: 'CAJA' } : bankAccounts.find(b => b.id === transferData.from);
  const toAccTransfer = transferData.to === 'CASH' ? { bankName: 'CAJA', currency: 'PEN', alias: 'CAJA' } : bankAccounts.find(b => b.id === transferData.to);
  const showExchangeRateTransfer = fromAccTransfer && toAccTransfer && fromAccTransfer.currency !== toAccTransfer.currency;

  const handleExecuteTransfer = () => {
      const amountNum = parseFloat(transferData.amount);
      const rateNum = parseFloat(transferData.rate || '1.0');
      if (!transferData.from || !transferData.to) return alert("Seleccione origen y destino");
      if (!transferData.operationNumber) return alert("Debe ingresar el Nro de Operación para la transferencia.");
      if (isNaN(amountNum) || amountNum <= 0) return alert("Ingrese un monto válido");
      
      onUniversalTransfer(transferData.from, transferData.to, amountNum, rateNum, transferData.reference, transferData.operationNumber);
      
      // RESETEAR CAMPOS TRAS ÉXITO
      setTransferData({ from: 'CASH', to: '', amount: '', rate: '1.0', reference: '', operationNumber: '' });
      setIsTransferModalOpen(false);
  };

  const getMethodIcon = (method: PaymentMethodType) => {
    switch(method) {
        case 'Efectivo': return <Banknote size={12} className="text-emerald-500"/>;
        case 'Yape': case 'Plin': case 'Yape/Plin': return <QrCode size={12} className="text-purple-500"/>;
        case 'Tarjeta': return <CreditCard size={12} className="text-blue-500"/>;
        case 'Deposito': case 'Transferencia': return <Landmark size={12} className="text-slate-500"/>;
        default: return <Wallet size={12}/>;
    }
  };

  if (!isCashBoxOpen) {
      return (
          <div className="h-full flex items-center justify-center p-3 bg-slate-50/50 dark:bg-slate-900/50 overflow-y-auto">
              <CashBoxManager 
                type="OPEN" 
                expectedCash={lastClosingCash} 
                bankBalances={bankBalances} 
                onConfirm={(total, n, banks) => onOpenCashBox(total, n, banks as any)}
              />
          </div>
      )
  }

  return (
    <div className="flex flex-col h-full gap-2 p-1 animate-in fade-in duration-500">
        
        {/* PANEL DE SALDOS SUPERIOR */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 shrink-0">
            <div className="bg-white dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center">
                <div className="flex items-center justify-between w-full mb-1 border-b border-slate-50 dark:border-slate-700 pb-1">
                    <span className="text-[9px] font-black text-slate-500 uppercase">EFECTIVO / CAJA</span>
                    <Wallet size={12} className="text-slate-400"/>
                </div>
                <div className="w-full space-y-0.5">
                    <div className="flex justify-between items-center text-[8px] text-slate-400">
                        <span className="font-bold">INICIO:</span>
                        <span className="font-mono">{formatSymbol(systemBaseCurrency)} {lastClosingCash.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black text-emerald-600 uppercase">ACTUAL:</span>
                        <span className="text-xs font-black text-slate-800 dark:text-white">{formatSymbol(systemBaseCurrency)} {totalEfectivoActual.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <div className="col-span-3 flex gap-2 overflow-x-auto no-scrollbar py-0.5">
                {bankBalances.map(acc => {
                    const symbol = formatSymbol(acc.currency);
                    return (
                        <button key={acc.id} className="bg-white dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-700 min-w-[160px] flex flex-col items-start hover:border-primary-300 transition-all group shadow-sm shrink-0">
                            <div className="flex items-center justify-between w-full mb-1 border-b border-slate-50 dark:border-slate-700 pb-1">
                                <span className="text-[9px] font-black text-slate-500 uppercase truncate max-w-[110px]">{acc.alias || acc.bankName}</span>
                                <span className="text-[7px] font-black bg-slate-100 dark:bg-slate-700 px-1 rounded">{symbol}</span>
                            </div>
                            <div className="w-full space-y-0.5">
                                <div className="flex justify-between items-center text-[8px] text-slate-400">
                                    <span className="font-bold">INICIO:</span>
                                    <span className="font-mono">{symbol} {acc.initialToday.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-black text-emerald-600 uppercase">ACTUAL:</span>
                                    <span className="text-xs font-black text-slate-800 dark:text-white">{symbol} {acc.currentBalance.toFixed(2)}</span>
                                </div>
                            </div>
                        </button>
                    )
                })}
            </div>
        </div>

        {/* LISTADO DE MOVIMIENTOS */}
        <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col shadow-sm">
            <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-2">
                    <h3 className="font-black text-[10px] text-slate-700 dark:text-white uppercase tracking-wider">Movimientos de Hoy</h3>
                    <select value={filter} onChange={e => setFilter(e.target.value as any)} className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-[8px] py-0.5 px-1 font-bold uppercase outline-none">
                        <option value="ALL">Todos</option><option value="CASH">Caja</option><option value="DIGITAL">Digital</option>
                    </select>
                </div>
                <div className="flex items-center gap-1.5">
                    <button onClick={() => setIsTransferModalOpen(true)} className="px-2 py-1 bg-blue-600 text-white rounded text-[9px] font-black uppercase flex items-center gap-1 hover:bg-blue-700 shadow-sm transition-all"><ArrowRightLeft size={10}/> Transferir</button>
                    <button onClick={() => setIsCloseModalOpen(true)} className="px-2 py-1 bg-slate-800 text-white rounded text-[9px] font-black uppercase flex items-center gap-1 hover:bg-slate-900 shadow-sm transition-all"><Lock size={10}/> Cierre</button>
                    <button onClick={() => setIsIncomeModalOpen(true)} className="px-2 py-1 bg-emerald-600 text-white rounded text-[9px] font-black uppercase flex items-center gap-1 hover:bg-emerald-700 shadow-sm transition-all"><Plus size={10}/> Ingreso</button>
                    <button onClick={() => setIsExpenseModalOpen(true)} className="px-2 py-1 bg-orange-600 text-white rounded text-[9px] font-black uppercase flex items-center gap-1 hover:bg-orange-700 shadow-sm transition-all"><Minus size={10}/> Gasto</button>
                </div>
            </div>
            <div className="flex-1 overflow-auto">
                <table className="w-full text-[10px] text-left">
                    <thead className="bg-slate-50 dark:bg-slate-700 text-slate-400 font-black uppercase border-b border-slate-100">
                        <tr>
                            <th className="px-3 py-1.5 w-32">Momento</th>
                            <th className="px-3 py-1.5 w-24">Metodo</th>
                            <th className="px-3 py-1.5">Concepto</th>
                            <th className="px-3 py-1.5 w-32">Nro. Op</th>
                            <th className="px-3 py-1.5 text-right w-24">Monto</th>
                            <th className="px-3 py-1.5 text-center w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {filteredMovements.map(m => (
                            <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                <td className="px-3 py-2 font-mono text-[9px] text-slate-500">
                                    <div className="font-bold text-slate-700 dark:text-slate-300">{m.date}</div>
                                    <div className="text-[8px] opacity-70">{m.time}</div>
                                    <div className="text-[7px] text-slate-300 font-black uppercase mt-0.5">#{m.id.substring(0,8)}</div>
                                </td>
                                <td className="px-3 py-2 font-bold uppercase text-[9px] flex items-center gap-1 mt-1.5">{getMethodIcon(m.paymentMethod)} {m.paymentMethod}</td>
                                <td className="px-3 py-2">
                                    <div className="font-bold truncate max-w-[220px] uppercase leading-tight">{m.concept}</div>
                                    <div className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">{m.category}</div>
                                </td>
                                <td className="px-3 py-2 font-mono text-xs font-black text-primary-600 dark:text-primary-400">
                                    {m.referenceId ? `#${m.referenceId}` : '---'}
                                </td>
                                <td className={`px-3 py-2 text-right font-black ${m.type === 'Ingreso' ? 'text-emerald-600' : 'text-red-600'}`}>{formatSymbol(m.currency || systemBaseCurrency)} {m.amount.toFixed(2)}</td>
                                <td className="px-3 py-2 text-center">
                                    <button onClick={() => handleViewMovement(m)} className="text-slate-300 hover:text-primary-600 transition-colors"><Eye size={12}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {/* MODAL CIERRE */}
        {isCloseModalOpen && (
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[2000] flex items-center justify-center p-4 overflow-y-auto">
                <CashBoxManager 
                    type="CLOSE" 
                    expectedCash={totalEfectivoActual} 
                    bankBalances={bankBalances} 
                    onCancel={() => setIsCloseModalOpen(false)}
                    onConfirm={(counted, n, banks) => {
                        // FIX: Added explicit type 'number' for accumulator 'a' and typed 'b' as 'any' to ensure the '+' operator works correctly without 'unknown' issues.
                        const systemDigital = bankBalances.reduce((a: number, b: any) => a + (b.currentBalance || 0), 0);
                        onCloseCashBox(counted, totalEfectivoActual, systemDigital, n, banks as any);
                        setIsCloseModalOpen(false);
                    }}
                />
            </div>
        )}

        {/* MODAL INGRESO / GASTO */}
        {(isIncomeModalOpen || isExpenseModalOpen) && (
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col border border-white/10 animate-in zoom-in-95 duration-200">
                    <div className={`p-4 flex justify-between items-center ${isIncomeModalOpen ? 'bg-emerald-600' : 'bg-orange-600'} text-white`}>
                        <h3 className="font-black text-xs uppercase tracking-widest flex items-center gap-2">
                            {isIncomeModalOpen ? <Plus size={16}/> : <Minus size={16}/>} 
                            {isIncomeModalOpen ? 'Nuevo Ingreso (No Venta)' : 'Nuevo Gasto Operativo'}
                        </h3>
                        <button onClick={() => { setIsIncomeModalOpen(false); setIsExpenseModalOpen(false); }} className="hover:bg-white/20 p-1 rounded-full"><X size={18}/></button>
                    </div>
                    
                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">Medio de Pago</label>
                                <select autoFocus className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase outline-none" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as any)}>
                                    <option value="Efectivo">Efectivo</option>
                                    <option value="Transferencia">Transferencia</option>
                                    <option value="Yape">Yape</option>
                                    <option value="Tarjeta">Tarjeta</option>
                                    <option value="Deposito">Deposito</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">Tipo de Mov.</label>
                                <select className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase outline-none" value={financialType} onChange={e => setFinancialType(e.target.value as any)}>
                                    <option value="">-- SELECCIONAR --</option>
                                    <option value="Variable">Variable</option>
                                    <option value="Fijo">Fijo (Recurrente)</option>
                                </select>
                            </div>
                        </div>

                        {paymentMethod !== 'Efectivo' && (
                            <div className="space-y-4 animate-in slide-in-from-top-1">
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1 mb-1">Cuenta Destino</label>
                                    <select className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase outline-none" value={bankAccountId} onChange={e => setBankAccountId(e.target.value)}>
                                        <option value="">-- Seleccionar Cuenta --</option>
                                        {bankAccounts.map(b => <option key={b.id} value={b.id}>{b.alias || b.bankName} ({formatSymbol(b.currency)})</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1 mb-1">Nro. de Operación / Referencia</label>
                                    <div className="relative">
                                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14}/>
                                        <input 
                                            type="text" 
                                            className="w-full pl-9 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold uppercase outline-none focus:border-primary-500" 
                                            placeholder="EJ: 123456" 
                                            value={operationNumber} 
                                            onChange={e => setOperationNumber(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {financialType === 'Fijo' && (
                            <div className="space-y-1 animate-in slide-in-from-top-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                                    Categoría {isIncomeModalOpen ? 'Ingreso' : 'Egreso'} Fijo
                                </label>
                                <input 
                                    list="cash-categories"
                                    className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold uppercase outline-none focus:border-primary-500" 
                                    placeholder="ELEGIR O ESCRIBIR..." 
                                    value={category} 
                                    onChange={e => setCategory(e.target.value)} 
                                />
                                <datalist id="cash-categories">
                                    {isIncomeModalOpen ? fixedIncomeCategories.map(c => <option key={c} value={c}/>) : fixedExpenseCategories.map(c => <option key={c} value={c}/>)}
                                </datalist>
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">Concepto / Glosa</label>
                            <input type="text" className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold uppercase outline-none focus:border-primary-500" placeholder="Descripción..." value={concept} onChange={e => setConcept(e.target.value)} />
                        </div>

                        <div className="space-y-1 pt-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">Importe Total</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300 italic">{paymentMethod === 'Efectivo' ? formatSymbol(systemBaseCurrency) : (formatSymbol(bankAccounts.find(b=>b.id===bankAccountId)?.currency) || formatSymbol(systemBaseCurrency))}</span>
                                <input 
                                    type="number" 
                                    className="w-full pl-12 p-4 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-700 rounded-2xl text-4xl font-black text-slate-800 dark:text-white outline-none focus:border-primary-500 shadow-inner" 
                                    placeholder="0.00" 
                                    value={amount} 
                                    onChange={e => setAmount(e.target.value)} 
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex gap-2">
                        <button onClick={() => { setIsIncomeModalOpen(false); setIsExpenseModalOpen(false); }} className="flex-1 py-3 text-slate-500 font-black uppercase text-[9px] hover:bg-slate-100 rounded-xl transition-all">Cancelar</button>
                        <button onClick={() => handleSaveMovement(isIncomeModalOpen ? 'Ingreso' : 'Egreso')} className={`flex-[2] py-3 text-white font-black uppercase text-[10px] rounded-xl shadow-lg transition-all active:scale-95 ${isIncomeModalOpen ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-orange-600 hover:bg-orange-700'}`}>
                            Registrar Operación
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* MODAL TRANSFERENCIA MEJORADO - REORDENADO */}
        {isTransferModalOpen && (
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-sm shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in-95">
                    <div className="p-4 bg-blue-600 text-white flex justify-between items-center">
                        <h3 className="font-black text-xs uppercase tracking-widest flex items-center gap-2"><ArrowRightLeft size={16}/> Transferencia de Fondos</h3>
                        <button onClick={() => setIsTransferModalOpen(false)} className="hover:bg-white/20 p-1 rounded-full"><X size={18}/></button>
                    </div>
                    <div className="p-6 space-y-4">
                        
                        {/* 1. MONTO (PRIMERO) */}
                        <div className="space-y-1">
                             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center block">Importe a Enviar</label>
                             <input type="number" autoFocus className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-2xl text-4xl font-black text-center text-blue-600 outline-none shadow-inner focus:border-blue-300" value={transferData.amount} onChange={e => setTransferData({...transferData, amount: e.target.value})} placeholder="0.00"/>
                        </div>

                        {/* 2. CUENTAS */}
                        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                            <div className="space-y-1">
                                <label className="text-[8px] font-black text-slate-400 uppercase text-center block">Desde</label>
                                <select className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[9px] font-bold uppercase outline-none" value={transferData.from} onChange={e => setTransferData({...transferData, from: e.target.value})}>
                                    <option value="CASH">Caja</option>
                                    {bankAccounts.map(b => <option key={b.id} value={b.id}>{b.alias || b.bankName} ({formatSymbol(b.currency)})</option>)}
                                </select>
                            </div>
                            <ArrowRight size={14} className="text-slate-300 mt-4"/>
                            <div className="space-y-1">
                                <label className="text-[8px] font-black text-slate-400 uppercase text-center block">Hacia</label>
                                <select className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[9px] font-bold uppercase outline-none" value={transferData.to} onChange={e => setTransferData({...transferData, to: e.target.value})}>
                                    <option value="">-- Destino --</option>
                                    <option value="CASH">Caja</option>
                                    {bankAccounts.map(b => <option key={b.id} value={b.id}>{b.alias || b.bankName} ({formatSymbol(b.currency)})</option>)}
                                </select>
                            </div>
                        </div>

                        {/* 3. TIPO DE CAMBIO Y RECALCULO (DESTACADO) */}
                        {showExchangeRateTransfer && (
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-2xl border border-yellow-100 dark:border-yellow-900/50 animate-in slide-in-from-top-1">
                                <label className="text-[9px] font-black text-yellow-700 dark:text-yellow-400 uppercase tracking-widest mb-2 block">Tipo de Cambio (T.C.)</label>
                                <div className="flex items-center gap-4">
                                    <div className="w-1/3 relative">
                                        <input type="number" step="0.001" className="w-full p-2 bg-white dark:bg-slate-900 border border-yellow-200 rounded-xl text-center text-xs font-black outline-none focus:ring-2 focus:ring-yellow-400 shadow-sm" value={transferData.rate} onChange={e => setTransferData({...transferData, rate: e.target.value})} placeholder="3.75"/>
                                    </div>
                                    <div className="flex-1 text-right">
                                        <p className="text-[10px] font-black text-yellow-600 dark:text-yellow-400 uppercase mb-1">Se acreditarán en destino:</p>
                                        <p className="text-3xl font-black text-slate-900 dark:text-yellow-200 tracking-tighter leading-none">
                                            {formatSymbol(toAccTransfer?.currency)} { 
                                                fromAccTransfer?.currency === 'USD' 
                                                ? (parseFloat(transferData.amount || '0') * parseFloat(transferData.rate || '1')).toFixed(2)
                                                : (parseFloat(transferData.amount || '0') / parseFloat(transferData.rate || '1')).toFixed(2)
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* 4. NRO OPERACION Y REFERENCIA */}
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">Nro. de Operación (Obligatorio)</label>
                                <div className="relative">
                                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={12}/>
                                    <input type="text" className="w-full pl-8 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase outline-none focus:border-blue-500" placeholder="Código de Operación..." value={transferData.operationNumber} onChange={e => setTransferData({...transferData, operationNumber: e.target.value})} />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">Glosa / Referencia (Opcional)</label>
                                <input type="text" className="w-full p-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold uppercase outline-none" placeholder="Motivo de transferencia..." value={transferData.reference} onChange={e => setTransferData({...transferData, reference: e.target.value})} />
                            </div>
                        </div>
                        
                        <button onClick={handleExecuteTransfer} className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl uppercase text-[11px] shadow-lg shadow-blue-200 dark:shadow-none active:scale-95 transition-all mt-4">Confirmar Transferencia Bancaria</button>
                    </div>
                </div>
            </div>
        )}

        {/* MODAL TICKET VIEWER (DINÁMICO) */}
        {ticketToView && (
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
                <div className={`bg-zinc-100 p-4 shadow-2xl rounded-[2.5rem] animate-in fade-in zoom-in-95 overflow-hidden flex flex-col gap-4 ${printFormat === 'A4' ? 'max-w-4xl w-full h-[90vh]' : 'max-w-sm w-full h-auto'}`}>
                    <div className="no-print bg-white p-2 rounded-2xl border flex gap-2 shadow-sm shrink-0 items-center">
                        <div className="flex-1 flex gap-2">
                            <button onClick={() => setPrintFormat('80mm')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${printFormat === '80mm' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>
                                <Layout size={14}/> Ticket 80mm
                            </button>
                            <button onClick={() => setPrintFormat('A4')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${printFormat === 'A4' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>
                                <FileIcon size={14}/> Documento A4
                            </button>
                        </div>
                        <div className="h-6 w-px bg-slate-100 mx-2"></div>
                        <button onClick={() => setTicketToView(null)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><X size={24}/></button>
                    </div>

                    <div id="print-area-cash" className="flex-1 overflow-auto p-4 bg-zinc-200 no-scrollbar rounded-2xl flex justify-center items-start">
                        {printFormat === '80mm' ? (
                            <div className="bg-white w-[300px] p-6 shadow-sm font-mono text-[10px] text-black mx-auto shrink-0 tabular-nums">
                                <div className="text-center mb-4 pb-2 border-b-2 border-dashed border-black">
                                    <h2 className="font-bold text-xs uppercase tracking-tighter">SapiSoft ERP</h2>
                                    <p className="text-[8px] text-black font-bold uppercase">{ticketToView.isCashVoucher ? `VOUCHER DE ${ticketToView.type === 'Egreso' ? 'GASTO' : 'INGRESO'}` : (ticketToView.client ? 'TICKET DE VENTA' : 'TICKET DE COMPRA')}</p>
                                </div>
                                <div className="mb-3 space-y-0.5 text-black">
                                    <div className="flex justify-between"><span>Comprobante:</span> <span className="font-bold">#{ticketToView.id.substring(0,10)}</span></div>
                                    <div className="flex justify-between"><span>Fecha:</span> <span className="font-bold">{ticketToView.date}</span></div>
                                    
                                    {ticketToView.isCashVoucher ? (
                                        <>
                                            <div className="flex justify-between"><span>Medio:</span> <span className="font-bold uppercase">{ticketToView.paymentMethod}</span></div>
                                            <div className="flex justify-between"><span>Operador:</span> <span className="font-bold uppercase">{ticketToView.user}</span></div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex justify-between"><span>{ticketToView.client ? 'Cliente:' : 'Prov:'}</span> <span className="font-bold truncate">{ticketToView.client?.name || ticketToView.supplier?.name}</span></div>
                                            <div className="flex justify-between"><span>Pago:</span> <span className="font-black uppercase">{ticketToView.condition}</span></div>
                                        </>
                                    )}
                                </div>

                                {ticketToView.isCashVoucher ? (
                                    <div className="border-y border-dashed border-black py-4 mb-3">
                                        <div className="text-[8px] font-black uppercase mb-1">CONCEPTO:</div>
                                        <div className="text-[10px] font-bold uppercase leading-tight">{ticketToView.concept}</div>
                                        <div className="flex justify-between items-center text-lg mt-4 pt-4 border-t border-black">
                                            <span className="font-black uppercase tracking-tighter">IMPORTE:</span>
                                            <span className="font-black">{formatSymbol(ticketToView.currency)} {ticketToView.amount.toFixed(2)}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="border-y border-dashed border-black py-2 mb-3">
                                            <div className="grid grid-cols-[1fr_22px_40px_45px] font-black text-[8px] mb-1 border-b border-black pb-1 uppercase">
                                                <span>Articulo</span>
                                                <span className="text-center">Cant</span>
                                                <span className="text-right">Unit</span>
                                                <span className="text-right">Total</span>
                                            </div>
                                            {ticketToView.items.map((item: CartItem, idx: number) => (
                                                <div key={idx} className="grid grid-cols-[1fr_22px_40px_45px] mb-1 last:mb-0 leading-tight">
                                                    <span className="uppercase truncate pr-1">{item.name}</span>
                                                    <span className="text-center font-black">{item.quantity}</span>
                                                    <span className="text-right">{item.price.toFixed(0)}</span>
                                                    <span className="text-right font-black">{(item.price * item.quantity).toFixed(0)}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="space-y-1 mb-4 border-b-2 border-black pb-2 text-black">
                                            <div className="flex justify-between text-xs font-black"><span>TOTAL</span><span>{formatSymbol(ticketToView.currency)} {ticketToView.total.toFixed(2)}</span></div>
                                        </div>

                                        {ticketToView.paymentBreakdown && (
                                            <div className="mt-2 pt-2 border-t border-dashed border-black text-black">
                                                <p className="text-[8px] font-black uppercase mb-1">DETALLE DE PAGO:</p>
                                                {(ticketToView.paymentBreakdown.cash > 0) && <div className="flex justify-between"><span>EFECTIVO:</span> <span>{formatSymbol(ticketToView.currency)} {ticketToView.paymentBreakdown.cash.toFixed(2)}</span></div>}
                                                {(ticketToView.paymentBreakdown.yape > 0) && <div className="flex justify-between"><span>YAPE/PLIN:</span> <span>{formatSymbol(ticketToView.currency)} {ticketToView.paymentBreakdown.yape.toFixed(2)}</span></div>}
                                                {(ticketToView.paymentBreakdown.card > 0) && <div className="flex justify-between"><span>TARJETA:</span> <span>{formatSymbol(ticketToView.currency)} {ticketToView.paymentBreakdown.card.toFixed(2)}</span></div>}
                                                {(ticketToView.paymentBreakdown.bank > 0) && <div className="flex justify-between"><span>TRANSF/DEP:</span> <span>{formatSymbol(ticketToView.currency)} {ticketToView.paymentBreakdown.bank.toFixed(2)}</span></div>}
                                                {(ticketToView.paymentBreakdown.wallet > 0) && <div className="flex justify-between"><span>BILLETERA:</span> <span>{formatSymbol(ticketToView.currency)} {ticketToView.paymentBreakdown.wallet.toFixed(2)}</span></div>}
                                            </div>
                                        )}
                                    </>
                                )}

                                <div className="mt-6 text-center italic text-[8px] font-bold uppercase border-t border-black pt-4">Copia de Caja Chica</div>
                            </div>
                        ) : (
                            <div className="a4-preview-container bg-white p-12 shadow-sm font-sans text-xs text-slate-800 mx-auto min-h-[1100px] flex flex-col shrink-0">
                                <div className="flex justify-between items-start mb-8 border-b-2 border-blue-600 pb-6">
                                    <div className="space-y-1">
                                        <h1 className="text-2xl font-black text-blue-600 uppercase tracking-tighter">SapiSoft ERP</h1>
                                        <p className="font-bold text-slate-500 uppercase">{ticketToView.isCashVoucher ? `COMPROBANTE DE ${ticketToView.type === 'Egreso' ? 'GASTO' : 'INGRESO'}` : (ticketToView.client ? 'SISTEMA DE VENTAS' : 'SISTEMA DE COMPRAS')}</p>
                                    </div>
                                    <div className="bg-slate-50 border-2 border-slate-200 p-4 rounded-xl text-center min-w-[200px]">
                                        <p className="bg-blue-600 text-white py-1 px-2 font-black text-[10px] rounded mb-1 uppercase">{ticketToView.isCashVoucher ? 'CAJA' : (ticketToView.docType?.toUpperCase() || 'DOCUMENTO')}</p>
                                        <p className="font-mono text-lg font-black">{ticketToView.id.substring(0,10)}</p>
                                    </div>
                                </div>

                                {ticketToView.isCashVoucher ? (
                                    <div className="flex-1 flex flex-col">
                                        <div className="grid grid-cols-2 gap-8 mb-8">
                                            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200">
                                                <p className="text-[9px] font-black text-blue-600 uppercase mb-2 border-b pb-1">Detalles de Operación</p>
                                                <div className="space-y-2">
                                                    <p><strong>Tipo Movimiento:</strong> <span className={`font-black uppercase ${ticketToView.type === 'Ingreso' ? 'text-emerald-600' : 'text-rose-600'}`}>{ticketToView.type === 'Egreso' ? 'GASTO' : 'INGRESO'}</span></p>
                                                    <p><strong>Método:</strong> {ticketToView.paymentMethod.toUpperCase()}</p>
                                                    <p><strong>Categoría:</strong> {ticketToView.category}</p>
                                                    {ticketToView.referenceId && <p><strong>Nro. Operación:</strong> #{ticketToView.referenceId}</p>}
                                                </div>
                                            </div>
                                            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200">
                                                <p className="text-[9px] font-black text-blue-600 uppercase mb-2 border-b pb-1">Información Temporal</p>
                                                <div className="space-y-2">
                                                    <p><strong>Fecha Emisión:</strong> {ticketToView.date}</p>
                                                    <p><strong>Hora Registro:</strong> {ticketToView.time}</p>
                                                    <p><strong>Responsable:</strong> {ticketToView.user.toUpperCase()}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center">
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Monto Liquidado</p>
                                            <div className="text-8xl font-black text-slate-900 tracking-tighter mb-4">{formatSymbol(ticketToView.currency)} {ticketToView.amount.toFixed(2)}</div>
                                            <div className="w-32 h-1.5 bg-blue-600 rounded-full mb-6"></div>
                                            <div className="max-w-2xl">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Concepto:</p>
                                                <p className="text-2xl font-black text-slate-700 uppercase leading-relaxed italic">"{ticketToView.concept}"</p>
                                            </div>
                                        </div>

                                        <div className="mt-auto pt-16 flex justify-around">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="w-48 border-t border-slate-400"></div>
                                                <p className="text-[10px] font-black uppercase text-slate-400">Firma Operador</p>
                                            </div>
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="w-48 border-t border-slate-400"></div>
                                                <p className="text-[10px] font-black uppercase text-slate-400">Firma Recibí Conforme</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-2 gap-8 mb-8">
                                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                                <p className="text-[9px] font-black text-blue-600 uppercase mb-2 border-b pb-1">Datos de {ticketToView.client ? 'Cliente' : 'Proveedor'}</p>
                                                <p className="font-black text-sm uppercase">{ticketToView.client?.name || ticketToView.supplier?.name}</p>
                                                <p><strong>Identificación:</strong> {ticketToView.client?.dni || ticketToView.supplier?.ruc}</p>
                                            </div>
                                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                                <p className="text-[9px] font-black text-blue-600 uppercase mb-2 border-b pb-1">Información Operación</p>
                                                <p><strong>Fecha:</strong> {ticketToView.date}</p>
                                                <p><strong>Condición:</strong> {ticketToView.condition}</p>
                                                <p><strong>Moneda:</strong> {formatSymbol(ticketToView.currency)}</p>
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <table className="w-full border-collapse">
                                                <thead><tr className="bg-blue-600 text-white"><th className="p-2 text-left text-[8px] uppercase">SKU</th><th className="p-2 text-left text-[8px] uppercase">Descripción</th><th className="p-2 text-center text-[8px] uppercase">Cant.</th><th className="p-2 text-right text-[8px] uppercase">P. Unit</th><th className="p-2 text-right text-[8px] uppercase">Total</th></tr></thead>
                                                <tbody>
                                                    {ticketToView.items.map((item: any, i: number) => (
                                                        <tr key={i} className="border-b border-slate-100">
                                                            <td className="p-2 font-mono">{item.code}</td>
                                                            <td className="p-2 uppercase">{item.name}</td>
                                                            <td className="p-2 text-center font-black">{item.quantity}</td>
                                                            <td className="p-2 text-right">{item.price.toFixed(2)}</td>
                                                            <td className="p-2 text-right font-black">{item.total.toFixed(2)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* FORMA DE PAGO DETALLADO A4 */}
                                        {ticketToView.paymentBreakdown && (
                                            <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                                <p className="text-[9px] font-black text-blue-600 uppercase mb-2 border-b pb-1">Resumen de Pago</p>
                                                <div className="grid grid-cols-3 gap-4">
                                                    {ticketToView.paymentBreakdown.cash > 0 && <div className="flex justify-between"><span>Efectivo:</span> <span className="font-bold">{formatSymbol(ticketToView.currency)} {ticketToView.paymentBreakdown.cash.toFixed(2)}</span></div>}
                                                    {ticketToView.paymentBreakdown.yape > 0 && <div className="flex justify-between"><span>Yape/Plin:</span> <span className="font-bold">{formatSymbol(ticketToView.currency)} {ticketToView.paymentBreakdown.yape.toFixed(2)}</span></div>}
                                                    {ticketToView.paymentBreakdown.card > 0 && <div className="flex justify-between"><span>Tarjeta:</span> <span className="font-bold">{formatSymbol(ticketToView.currency)} {ticketToView.paymentBreakdown.card.toFixed(2)}</span></div>}
                                                    {ticketToView.paymentBreakdown.bank > 0 && <div className="flex justify-between"><span>Transf:</span> <span className="font-bold">{formatSymbol(ticketToView.currency)} {ticketToView.paymentBreakdown.bank.toFixed(2)}</span></div>}
                                                    {ticketToView.paymentBreakdown.wallet > 0 && <div className="flex justify-between"><span>Billetera:</span> <span className="font-bold">{formatSymbol(ticketToView.currency)} {ticketToView.paymentBreakdown.wallet.toFixed(2)}</span></div>}
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex justify-end pt-8">
                                            <div className="w-72 p-4 bg-blue-600 text-white rounded-xl text-right">
                                                <span className="font-black uppercase block text-[10px] mb-1">Total Operación:</span>
                                                <span className="text-2xl font-black font-mono">{formatSymbol(ticketToView.currency)} {ticketToView.total.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="no-print flex gap-2 shrink-0 bg-white p-4 rounded-xl border border-slate-200">
                        <button onClick={() => window.print()} className="flex-1 py-3 bg-blue-600 text-white font-black rounded-xl text-[10px] flex items-center justify-center gap-2 shadow-lg active:scale-95 uppercase tracking-widest"><Printer size={16}/> Imprimir Copia</button>
                    </div>
                </div>
            </div>
        )}

        {/* DETALLE DE MOVIMIENTO ESTÁNDAR */}
        {selectedMovement && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[999] flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-800 rounded-[1.2rem] w-full max-w-xs shadow-2xl border p-6 space-y-1.5 animate-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-black text-[10px] uppercase text-slate-500 tracking-widest">Detalle Operación</h3>
                        <button onClick={() => setSelectedMovement(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"><X size={16}/></button>
                    </div>
                    <DetailRow label="ID" value={<span className="font-mono">{selectedMovement.id.substring(0,8).toUpperCase()}</span>} />
                    <DetailRow label="Tipo" value={selectedMovement.type === 'Egreso' ? 'Gasto' : 'Ingreso'} color={selectedMovement.type === 'Ingreso' ? 'text-emerald-600' : 'text-red-600'} />
                    <DetailRow label="Monto" value={`${formatSymbol(selectedMovement.currency) || 'S/'} ${selectedMovement.amount.toFixed(2)}`} />
                    <DetailRow label="Concepto" value={selectedMovement.concept} />
                    <DetailRow label="Categoría" value={<div className="flex gap-1 items-center justify-end"><span className="text-[8px] font-black px-1 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">{selectedMovement.financialType}</span> {selectedMovement.category}</div>} />
                    <DetailRow label="Método" value={<div className="flex items-center gap-1.5">{getMethodIcon(selectedMovement.paymentMethod)} {selectedMovement.paymentMethod}</div>} />
                    {selectedMovement.referenceId && <DetailRow label="Nro. Operación" value={<span className="font-black text-primary-600">#{selectedMovement.referenceId}</span>} />}
                    <DetailRow label="Usuario" value={selectedMovement.user} />
                    <DetailRow label="Fecha/Hora" value={`${selectedMovement.date} ${selectedMovement.time}`} />
                    <button onClick={() => setSelectedMovement(null)} className="px-6 py-2.5 bg-slate-800 text-white rounded-xl w-full mt-4 font-black uppercase text-[9px] shadow-lg transition-all active:scale-95">Cerrar</button>
                </div>
            </div>
        )}
    </div>
  );
};

export default CashModule;
