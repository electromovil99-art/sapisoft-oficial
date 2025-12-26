
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, Trash2, Plus, Minus, X, CheckCircle, ShoppingBag, Truck, PackagePlus, Building2, FileText, Calendar, CreditCard, DollarSign, Edit3, Filter, Save, Wallet, Banknote, ListChecks, Tablet, Hash, Globe, Zap, Printer, Layout, FileText as FileIcon } from 'lucide-react';
import { Product, CartItem, Supplier, Category, GeoLocation, BankAccount, PaymentMethodType } from '../types';

interface PurchaseModuleProps {
    products: Product[];
    suppliers: Supplier[];
    categories: Category[]; 
    bankAccounts: BankAccount[];
    onAddSupplier: (supplier: Supplier) => void;
    locations: GeoLocation[];
    onProcessPurchase: (cart: CartItem[], total: number, docType: string, supplierName: string, paymentCondition: 'Contado' | 'Credito', creditDays: number, detailedPayments?: any[], currency?: string, exchangeRate?: number) => void;
    systemBaseCurrency: string;
}

// Helper para convertir PEN -> S/ y USD -> $
const formatSymbol = (code?: string) => {
    if (!code) return 'S/';
    const c = code.toUpperCase();
    if (c === 'PEN' || c === 'SOLES') return 'S/';
    if (c === 'USD' || c === 'DOLARES') return '$';
    return code;
};

interface PaymentDetail {
    id: string;
    method: PaymentMethodType;
    amount: number;
    reference?: string;
    accountId?: string;
    bankName?: string; 
}

export const PurchaseModule: React.FC<PurchaseModuleProps> = ({ products, suppliers, categories, bankAccounts, onAddSupplier, locations, onProcessPurchase, systemBaseCurrency }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(''); 
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [supplierSearchTerm, setSupplierSearchTerm] = useState(''); 
  const [docType, setDocType] = useState('FACTURA DE COMPRA');
  const [docNumber, setDocNumber] = useState(''); 
  
  const [currency, setCurrency] = useState<string>(systemBaseCurrency);
  const [exchangeRate, setExchangeRate] = useState<string>('3.75');

  const [paymentCondition, setPaymentCondition] = useState<'Contado' | 'Credito'>('Contado');
  const [creditDays, setCreditDays] = useState<number>(30); 
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentList, setPaymentList] = useState<PaymentDetail[]>([]);
  const [currentPayment, setCurrentPayment] = useState<{
      method: PaymentMethodType;
      amount: string;
      reference: string;
      accountId: string;
  }>({ method: 'Efectivo', amount: '', reference: '', accountId: '' });

  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [newSupplierData, setNewSupplierData] = useState({ name: '', ruc: '', phone: '', address: '', contactName: '' });
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [tempCost, setTempCost] = useState<string>('');

  // ESTADOS PARA IMPRESIÓN
  const [showTicket, setShowTicket] = useState(false);
  const [ticketData, setTicketData] = useState<any>(null);
  const [printFormat, setPrintFormat] = useState<'80mm' | 'A4'>('80mm');

  const searchInputRef = useRef<HTMLInputElement>(null);
  const paymentAmountRef = useRef<HTMLInputElement>(null);

  const normalize = (text: string) => (text || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  useEffect(() => {
    setCurrency(systemBaseCurrency);
  }, [systemBaseCurrency]);

  useEffect(() => {
      if (suppliers.length > 0 && !selectedSupplier) {
          const defaultSup = suppliers[0];
          setSelectedSupplier(defaultSup);
          setSupplierSearchTerm(defaultSup.name);
      }
  }, [suppliers, selectedSupplier]);

  const handleSupplierSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setSupplierSearchTerm(val);
      
      const searchWords = normalize(val).split(" ").filter(w => w !== "");
      const found = suppliers.find(s => {
          const target = normalize(`${s.name} ${s.ruc}`);
          return searchWords.length > 0 && searchWords.every(word => target.includes(word));
      });

      if (found) setSelectedSupplier(found);
      else setSelectedSupplier(null); 
  };

  const filteredProducts = products.filter(p => {
    const searchWords = normalize(searchTerm).split(" ").filter(w => w !== "");
    const targetString = normalize(`${p.name} ${p.code}`);
    
    const matchesSearch = searchTerm === '' || searchWords.every(word => targetString.includes(word));
    const matchesCategory = selectedCategory === '' || p.category === selectedCategory;
    return (searchTerm.length > 0 || selectedCategory !== '') && matchesSearch && matchesCategory;
  });

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.id === product.id);
    
    let baseCost = product.cost || product.price * 0.7;
    if (currency !== systemBaseCurrency) {
        baseCost = baseCost / (parseFloat(exchangeRate) || 3.75);
    }

    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price } : item));
    } else {
      setCart([...cart, { ...product, price: baseCost, quantity: 1, discount: 0, total: baseCost }]);
    }
    setSearchTerm('');
    searchInputRef.current?.focus();
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQ = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQ, total: newQ * item.price };
      }
      return item;
    }));
  };

  const startEditingCost = (item: CartItem) => {
      setEditingItemId(item.id);
      setTempCost(item.price.toString());
  };

  const saveCost = (id: string) => {
      const newCost = parseFloat(tempCost);
      if (!isNaN(newCost) && newCost >= 0) {
          setCart(cart.map(item => item.id === id ? { ...item, price: newCost, total: item.quantity * newCost } : item));
      }
      setEditingItemId(null);
  };

  const calculateTotal = () => cart.reduce((acc, item) => acc + item.total, 0);
  const total = calculateTotal();
  
  // LOGICA DE IGV SEGÚN DOCUMENTO
  const noIgvDocs = ['TICKET DE COMPRA', 'DUA', 'NOTA DE COMPRA', 'NOTA DE ENTRADA'];
  const hasNoIGV = noIgvDocs.includes(docType);
  
  const subtotal = hasNoIGV ? total : (total / 1.18);
  const igv = hasNoIGV ? 0 : (total - subtotal);
  
  const getPaymentTotal = () => paymentList.reduce((acc, p) => acc + p.amount, 0);
  const remainingTotal = Math.max(0, total - getPaymentTotal());

  const handleAddPayment = () => {
      const amountVal = parseFloat(currentPayment.amount);
      if (isNaN(amountVal) || amountVal <= 0) return alert("Ingrese un monto válido");
      if (currentPayment.method !== 'Efectivo' && currentPayment.method !== 'Saldo Favor' && !currentPayment.accountId) {
          return alert("Debe seleccionar la CUENTA DE ORIGEN para este medio de pago.");
      }
      const bankInfo = bankAccounts.find(b => b.id === currentPayment.accountId);
      const newPay: PaymentDetail = { 
          id: Math.random().toString(), method: currentPayment.method, amount: amountVal, reference: currentPayment.reference, accountId: currentPayment.accountId, bankName: bankInfo ? (bankInfo.alias || bankInfo.bankName) : undefined 
      };
      setPaymentList([...paymentList, newPay]);
      setCurrentPayment({ ...currentPayment, amount: '', reference: '', accountId: '' });
      if (paymentAmountRef.current) paymentAmountRef.current.focus();
  };

  const handleProcess = () => {
      if (cart.length === 0) return;
      if (!selectedSupplier) return alert("Seleccione un proveedor");
      const fullDocType = docType + (docNumber ? ` #${docNumber}` : '');
      if (paymentCondition === 'Contado') {
          setPaymentList([]);
          setCurrentPayment({ ...currentPayment, method: 'Efectivo', amount: total.toFixed(2), reference: '', accountId: '' });
          setShowPaymentModal(true);
      } else {
          setTicketData({
              id: 'P-' + Math.floor(Math.random() * 100000).toString(),
              date: new Date().toLocaleDateString('es-PE'),
              time: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
              supplier: selectedSupplier,
              docType: fullDocType,
              items: [...cart],
              total: total,
              subtotal: subtotal,
              igv: igv,
              currency: currency,
              condition: 'CRÉDITO (' + creditDays + ' DÍAS)',
              payments: []
          });
          
          onProcessPurchase(cart, total, fullDocType, selectedSupplier.name, 'Credito', creditDays, undefined, currency, parseFloat(exchangeRate));
          setCart([]); setDocNumber(''); 
          setShowTicket(true);
      }
  };

  const handleFinalizePurchase = () => {
      if (getPaymentTotal() < total - 0.05) return alert("Falta completar el pago.");
      const fullDocType = docType + (docNumber ? ` #${docNumber}` : '');
      
      setTicketData({
          id: 'P-' + Math.floor(Math.random() * 100000).toString(),
          date: new Date().toLocaleDateString('es-PE'),
          time: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
          supplier: selectedSupplier!,
          docType: fullDocType,
          items: [...cart],
          total: total,
          subtotal: subtotal,
          igv: igv,
          currency: currency,
          condition: 'CONTADO',
          payments: paymentList
      });

      onProcessPurchase(cart, total, fullDocType, selectedSupplier!.name, 'Contado', 0, paymentList, currency, parseFloat(exchangeRate));
      setCart([]); setDocNumber(''); setShowPaymentModal(false); 
      setShowTicket(true);
  };

  const availableBankAccounts = useMemo(() => {
      return bankAccounts.filter(acc => acc.useInPurchases && acc.currency === currency);
  }, [bankAccounts, currency]);

  return (
    <div className="flex h-full gap-4 animate-in fade-in duration-500">
      <style>{`
        @media print {
            body * { visibility: hidden; }
            #print-area, #print-area * { visibility: visible; }
            #print-area {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                margin: 0;
                padding: 0;
                background: white !important;
                color: black !important;
                transform: scale(1) !important;
            }
            .no-print { display: none !important; }
        }
        .a4-preview-container {
            width: 800px;
            transform-origin: top center;
        }
        .tabular-nums {
            font-variant-numeric: tabular-nums;
        }
        @media (max-width: 900px) {
            .a4-preview-container { transform: scale(0.7); }
        }
        @media (max-width: 600px) {
            .a4-preview-container { transform: scale(0.45); }
        }
      `}</style>

      <div className="flex-1 flex flex-col gap-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-3 border-b border-slate-100 dark:border-slate-700 flex gap-3 bg-slate-50/50 dark:bg-slate-700/30">
           <div className="flex-1 flex gap-2">
               <div className="relative flex-1">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                 <input ref={searchInputRef} autoFocus type="text" className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl shadow-sm focus:border-blue-500 outline-none text-sm text-slate-900 dark:text-white" placeholder="Buscar producto a comprar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
               </div>
               <div className="relative w-40 shrink-0">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
                    <select className="w-full pl-8 pr-8 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl shadow-sm appearance-none outline-none cursor-pointer text-xs font-bold text-slate-700 dark:text-white" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
                        <option value="">Categorías</option>
                        {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
               </div>
           </div>
           {filteredProducts.length > 0 && (
                <div className="absolute top-[70px] left-6 right-[310px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 max-h-[calc(100vh-250px)] overflow-y-auto p-1">
                   {filteredProducts.map(p => (
                      <div key={p.id} onClick={() => addToCart(p)} className="p-2 hover:bg-blue-50 dark:hover:bg-slate-700 cursor-pointer rounded-lg border-b border-slate-50 last:border-0 dark:border-slate-700 flex justify-between items-center group">
                         <div>
                            <div className="font-bold text-xs text-slate-700 dark:text-slate-200 group-hover:text-blue-700">{p.name}</div>
                            <div className="text-[9px] text-slate-400 flex gap-2"><span>SKU: {p.code}</span><span>Stock: {p.stock}</span></div>
                         </div>
                         <div className="font-bold text-xs text-slate-800 dark:text-white">
                            {formatSymbol(currency)} {currency === systemBaseCurrency ? p.price.toFixed(2) : (p.price / parseFloat(exchangeRate)).toFixed(2)}
                         </div>
                      </div>
                   ))}
                </div>
           )}
        </div>

        <div className="flex-1 overflow-auto">
           {cart.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-600"><ShoppingBag size={64} strokeWidth={1}/><p className="mt-4 font-medium uppercase text-xs tracking-widest">Lista de compra vacía</p></div>
           ) : (
             <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-black uppercase tracking-tighter border-b">
                    <tr><th className="px-4 py-3">Artículo</th><th className="px-4 py-3 text-center">Cant.</th><th className="px-4 py-3 text-right">Costo Unit.</th><th className="px-4 py-3 text-right">Total</th><th className="px-4 py-3 text-center"></th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                   {cart.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors group">
                         <td className="px-4 py-1.5">
                            <div className="font-black text-slate-800 dark:text-white uppercase tracking-tight">{item.name}</div>
                            <div className="text-[9px] text-slate-400 font-mono">{item.code}</div>
                         </td>
                         <td className="px-4 py-1.5">
                            <div className="flex items-center justify-center gap-2">
                               <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-slate-100 rounded text-slate-400"><Minus size={12}/></button>
                               <span className="w-6 text-center font-black text-slate-800 dark:text-white text-sm">{item.quantity}</span>
                               <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-slate-100 rounded text-slate-400"><Plus size={12}/></button>
                            </div>
                         </td>
                         <td className="px-4 py-1.5 text-right">
                            {editingItemId === item.id ? (
                                <input type="number" autoFocus className="w-20 p-1 border border-blue-500 rounded text-right font-black text-sm" value={tempCost} onChange={e => setTempCost(e.target.value)} onBlur={() => saveCost(item.id)} onKeyDown={e => e.key === 'Enter' && saveCost(item.id)} />
                            ) : (
                                <div className="flex items-center justify-end gap-1.5 group cursor-pointer" onClick={() => startEditingCost(item)}>
                                    <span className="font-bold text-slate-600 dark:text-slate-300 text-sm">{formatSymbol(currency)} {item.price.toFixed(2)}</span>
                                    <Edit3 size={10} className="opacity-0 group-hover:opacity-100 text-blue-500"/>
                                </div>
                            )}
                         </td>
                         <td className="px-4 py-1.5 text-right font-black text-slate-900 dark:text-white text-sm">{formatSymbol(currency)} {item.total.toFixed(2)}</td>
                         <td className="px-4 py-1.5 text-center">
                            <button onClick={() => removeFromCart(item.id)} className="p-1 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={14}/></button>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
           )}
        </div>
        
        <div className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 p-4 shrink-0">
           <div className="flex justify-between items-center mb-1"><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Subtotal</span><span className="font-bold text-slate-700 dark:text-slate-300 text-sm">{formatSymbol(currency)} {subtotal.toFixed(2)}</span></div>
           <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-200 dark:border-slate-700">
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">IGV (18%)</span>
               <span className={`font-bold text-sm ${hasNoIGV ? 'text-slate-300 dark:text-slate-600 italic' : 'text-slate-700 dark:text-slate-300'}`}>
                   {hasNoIGV ? 'EXONERADO' : `${formatSymbol(currency)} ${igv.toFixed(2)}`}
               </span>
           </div>
           <div className="flex justify-between items-center"><span className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-2 uppercase tracking-tighter"><DollarSign size={14}/> TOTAL COMPRA</span><span className="text-2xl font-black text-blue-600">{formatSymbol(currency)} {total.toFixed(2)}</span></div>
        </div>
      </div>

      {/* PANEL LATERAL REORDENADO */}
      <div className="w-72 flex flex-col gap-3 shrink-0">
         <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-2">
                <label className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1.5 tracking-widest"><Truck size={12}/> Proveedor</label>
                <button onClick={() => setShowSupplierModal(true)} className="p-1 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-md transition-all" title="Nuevo Proveedor"><Plus size={14}/></button>
            </div>
            <div className="min-w-0 relative">
                <input list="supplier-suggestions" className="w-full bg-slate-50 dark:bg-slate-900 font-bold text-slate-800 dark:text-white outline-none border border-slate-100 dark:border-slate-700 rounded-lg text-xs py-1.5 px-2 uppercase" value={supplierSearchTerm} onChange={handleSupplierSearchChange} placeholder="BUSCAR..." />
                <datalist id="supplier-suggestions">{suppliers.map(s => <option key={s.id} value={s.name}>{s.ruc ? `RUC: ${s.ruc}` : ''}</option>)}</datalist>
            </div>
         </div>

         <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-3">
             <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1.5 tracking-widest"><FileText size={12}/> Documento</label>
                <select value={docType} onChange={e => setDocType(e.target.value)} className="w-full p-2 bg-slate-900 text-white rounded-lg text-xs font-bold outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer uppercase">
                    <option value="FACTURA DE COMPRA">FACTURA DE COMPRA (IGV)</option>
                    <option value="BOLETA DE VENTA">BOLETA DE VENTA</option>
                    <option value="DUA">DUA (ADUANAS)</option>
                    <option value="TICKET DE COMPRA">TICKET DE COMPRA</option>
                    <option value="NOTA DE COMPRA">NOTA DE COMPRA</option>
                    <option value="NOTA DE ENTRADA">NOTA DE ENTRADA (INTERNA)</option>
                </select>
             </div>
             <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1.5 tracking-widest"><Hash size={12}/> Nro Comprobante</label>
                <input type="text" className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-white uppercase outline-none focus:border-blue-500" value={docNumber} onChange={e => setDocNumber(e.target.value)} placeholder="EJ: 001-001234" />
             </div>
         </div>

         <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-3">
             <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1.5 tracking-widest"><Globe size={12}/> Divisa Compra</label>
                <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
                    <button onClick={() => setCurrency(systemBaseCurrency)} className={`flex-1 py-1 text-[10px] font-black rounded-md transition-all uppercase ${currency === systemBaseCurrency ? 'bg-white shadow text-emerald-600' : 'text-slate-500'}`}>{formatSymbol(systemBaseCurrency)}</button>
                    <button onClick={() => setCurrency('USD')} className={`flex-1 py-1 text-[10px] font-black rounded-md transition-all uppercase ${currency === 'USD' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>USD ($)</button>
                </div>
             </div>
             {currency !== systemBaseCurrency && (
                 <div className="space-y-1 animate-in slide-in-from-top-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1.5 tracking-widest"><Zap size={12}/> Tipo de Cambio</label>
                    <input type="number" step="0.01" className="w-full p-2 bg-yellow-50 dark:bg-slate-900 border border-yellow-200 dark:border-slate-700 rounded-lg text-xs font-black text-yellow-700 dark:text-yellow-400 outline-none" value={exchangeRate} onChange={e => setExchangeRate(e.target.value)} />
                 </div>
             )}
         </div>

         <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col gap-2">
             <label className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1.5 tracking-widest"><CreditCard size={12}/> Pago</label>
             <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
                 <button onClick={() => setPaymentCondition('Contado')} className={`flex-1 py-1.5 text-[9px] font-black rounded-md transition-all uppercase ${paymentCondition === 'Contado' ? 'bg-white shadow text-emerald-600' : 'text-slate-500'}`}>CONTADO</button>
                 <button onClick={() => setPaymentCondition('Credito')} className={`flex-1 py-1.5 text-[9px] font-black rounded-md transition-all uppercase ${paymentCondition === 'Credito' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>CRÉDITO</button>
             </div>
         </div>

         <div className="flex-1"></div>

         <button disabled={cart.length === 0} onClick={handleProcess} className="w-full py-4 bg-blue-600 text-white rounded-2xl shadow-lg hover:bg-blue-700 transition-all flex flex-col items-center justify-center group active:scale-95 disabled:opacity-50">
            <div className="text-[9px] font-black opacity-80 uppercase tracking-widest mb-0.5">FINALIZAR COMPRA</div>
            <div className="text-xl font-black flex items-center gap-2">{formatSymbol(currency)} {total.toFixed(2)} <PackagePlus size={18}/></div>
         </button>
      </div>

      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[999] flex items-center justify-center p-4">
           <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-[720px] overflow-hidden flex flex-col border border-white/20 animate-in zoom-in-95 duration-300">
              <div className="px-6 py-4 flex justify-between items-center border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                  <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2 uppercase tracking-tighter"><Banknote size={18} className="text-primary-600"/> Confirmar Pago <span className="mx-1 text-slate-300">|</span> <span className="text-slate-400 font-bold text-[10px] uppercase">COMPRA AL CONTADO ({formatSymbol(currency)})</span></h3>
                  <button onClick={() => setShowPaymentModal(false)} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"><X size={18}/></button>
              </div>
              <div className="flex flex-1 min-h-[360px]">
                  <div className="w-[45%] p-6 flex flex-col border-r border-slate-100 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-900/30">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><ListChecks size={14}/> DESGLOSE DE PAGOS</h4>
                      <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl mb-6 bg-white dark:bg-slate-800/50 overflow-hidden">
                          {paymentList.length === 0 ? (
                              <div className="text-center p-8 opacity-40"><Tablet size={48} className="mx-auto mb-3 text-slate-300"/><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No hay pagos registrados</p></div>
                          ) : (
                              <div className="w-full h-full overflow-y-auto p-3 space-y-2">
                                  {paymentList.map(p => (
                                      <div key={p.id} className="flex justify-between items-center p-3 bg-white dark:bg-slate-700 rounded-xl shadow-sm border border-slate-100 dark:border-slate-600">
                                          <div><p className="text-[10px] font-black uppercase text-slate-700 dark:text-white">{p.method}</p>{p.bankName && <p className="text-[8px] text-slate-400 truncate uppercase mt-1">{p.bankName}</p>}{p.reference && <p className="text-[8px] text-slate-400 font-mono mt-0.5">REF: {p.reference}</p>}</div>
                                          <div className="flex items-center gap-3"><span className="font-black text-xs">{formatSymbol(currency)} {p.amount.toFixed(2)}</span><button onClick={() => setPaymentList(paymentList.filter(x => x.id !== p.id))} className="text-red-300 hover:text-red-500"><Trash2 size={14}/></button></div>
                                      </div>
                                  ))}
                              </div>
                          )}
                      </div>
                      <div className="space-y-2 pt-3">
                          <div className="flex justify-between text-xs font-bold text-slate-500"><span>Total Compra:</span><span className="text-slate-800 dark:text-white">{formatSymbol(currency)} {total.toFixed(2)}</span></div>
                          <div className="flex justify-between items-baseline pt-2 border-t border-slate-200"><span className="font-black text-red-600 text-[10px] uppercase">Falta por Pagar:</span><span className="text-2xl font-black text-red-600 tracking-tighter">{formatSymbol(currency)} {remainingTotal.toFixed(2)}</span></div>
                      </div>
                  </div>
                  <div className="flex-1 p-6 flex flex-col gap-5">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Plus size={14}/> AGREGAR PAGO (EGRESO)</h4>
                      <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-2">
                              {['Efectivo', 'Transferencia', 'Yape/Plin', 'Tarjeta', 'Deposito', 'Saldo Favor'].map(m => (
                                <button key={m} onClick={() => setCurrentPayment({...currentPayment, method: m as any, reference: '', accountId: ''})} className={`py-2 px-3 rounded-xl border-2 font-bold text-[10px] uppercase transition-all ${currentPayment.method === m ? 'bg-primary-600 border-primary-600 text-white shadow-lg' : 'bg-white dark:bg-slate-700 text-slate-400 border-slate-100 hover:border-slate-200'}`}>{m === 'Saldo Favor' ? 'Billetera' : m}</button>
                              ))}
                          </div>
                          
                          {currentPayment.method !== 'Efectivo' && currentPayment.method !== 'Saldo Favor' && (
                              <div className="space-y-3 animate-in slide-in-from-top-1 duration-200 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                                  <div>
                                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Cuenta Origen ({formatSymbol(currency)})</label>
                                      <select className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold outline-none" value={currentPayment.accountId} onChange={e => setCurrentPayment({...currentPayment, accountId: e.target.value})}>
                                          <option value="">-- SELECCIONAR CUENTA --</option>
                                          {availableBankAccounts.map(b => <option key={b.id} value={b.id}>{b.alias || b.bankName} - {b.accountNumber}</option>)}
                                      </select>
                                  </div>
                              </div>
                          )}

                          <div className="space-y-1 pt-1">
                              <div className="flex justify-between items-center mb-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">MONTO A PAGAR</label><span className="text-[9px] font-black text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">RESTANTE: {remainingTotal.toFixed(2)}</span></div>
                              <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300 italic">{formatSymbol(currency)}</span><input ref={paymentAmountRef} type="number" className="w-full pl-12 p-4 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-2xl text-4xl font-black text-slate-800 dark:text-white outline-none focus:border-primary-500 shadow-inner" value={currentPayment.amount} onChange={e => setCurrentPayment({...currentPayment, amount: e.target.value})} /></div>
                          </div>
                          <button onClick={handleAddPayment} className="w-full py-3.5 bg-slate-800 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl hover:opacity-90 transition-all uppercase text-[11px] tracking-widest"><Plus size={18}/> Agregar Pago</button>
                      </div>
                  </div>
              </div>
              <div className="p-5 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
                  <button onClick={() => setShowPaymentModal(false)} className="px-6 py-3.5 text-slate-500 font-black hover:bg-slate-200 dark:hover:bg-slate-800 rounded-2xl transition-all uppercase tracking-widest text-[10px]">Cancelar</button>
                  <button onClick={handleFinalizePurchase} disabled={remainingTotal > 0.05} className="px-10 py-3.5 bg-primary-600 text-white font-black rounded-2xl shadow-xl hover:bg-primary-700 transition-all uppercase tracking-widest text-[10px] flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"><CheckCircle size={18}/> Confirmar Compra</button>
              </div>
           </div>
        </div>
      )}

      {showTicket && ticketData && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
            <div className={`bg-zinc-100 p-4 shadow-2xl rounded-2xl animate-in fade-in zoom-in-95 overflow-hidden flex flex-col gap-4 ${printFormat === 'A4' ? 'max-w-4xl w-full h-[90vh]' : 'max-w-sm w-full h-auto'}`}>
                
                <div className="no-print bg-white p-2 rounded-xl border flex gap-2 shadow-sm shrink-0">
                    <button onClick={() => setPrintFormat('80mm')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${printFormat === '80mm' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>
                        <Layout size={14}/> Ticket 80mm
                    </button>
                    <button onClick={() => setPrintFormat('A4')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${printFormat === 'A4' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>
                        <FileIcon size={14}/> Documento A4
                    </button>
                </div>

                <div id="print-area" className="flex-1 overflow-auto p-4 bg-zinc-200 no-scrollbar rounded-xl flex justify-center items-start">
                    {printFormat === '80mm' ? (
                        <div className="bg-white w-[300px] p-6 shadow-sm font-mono text-[10px] text-black mx-auto shrink-0 tabular-nums">
                            <div className="text-center mb-4 pb-2 border-b-2 border-dashed border-black">
                                <h2 className="font-bold text-xs uppercase tracking-tighter">SapiSoft ERP</h2>
                                <p className="text-[8px] text-black font-bold uppercase">LOGÍSTICA - COMPRAS</p>
                            </div>
                            <div className="mb-3 space-y-0.5 text-black">
                                <div className="flex justify-between"><span>Orden:</span> <span className="font-bold">#{ticketData.id}</span></div>
                                <div className="flex justify-between"><span>Fecha:</span> <span className="font-bold">{ticketData.date}</span></div>
                                <div className="flex justify-between"><span>Prov:</span> <span className="font-bold truncate max-w-[150px]">{ticketData.supplier.name}</span></div>
                                <div className="flex justify-between"><span>Doc:</span> <span className="uppercase font-bold">{ticketData.docType}</span></div>
                                <div className="flex justify-between"><span>Pago:</span> <span className="font-black uppercase">{ticketData.condition}</span></div>
                            </div>
                            <div className="border-y border-dashed border-black py-2 mb-3">
                                <div className="grid grid-cols-[1fr_22px_40px_45px] font-black text-[8px] mb-1 border-b border-black pb-1 uppercase text-black">
                                    <span>Art/Cod/Ubic</span>
                                    <span className="text-center">Cant</span>
                                    <span className="text-right">Unit</span>
                                    <span className="text-right">Total</span>
                                </div>
                                {ticketData.items.map((item: CartItem, idx: number) => (
                                    <div key={idx} className="grid grid-cols-[1fr_22px_40px_45px] mb-1 last:mb-0 leading-tight text-black">
                                        <div className="flex flex-col min-w-0">
                                            <span className="uppercase truncate pr-1 font-bold">{item.name}</span>
                                            <div className="flex flex-wrap gap-1 text-[7px] text-black font-black truncate">
                                                <span>{item.code}</span>
                                                {item.brand && <span className="text-slate-600">[{item.brand}]</span>}
                                                {item.location && <span className="font-bold">[{item.location}]</span>}
                                            </div>
                                        </div>
                                        <span className="text-center font-black">{item.quantity}</span>
                                        <span className="text-right font-medium">{item.price.toFixed(0)}</span>
                                        <span className="text-right font-black">{(item.price * item.quantity).toFixed(0)}</span>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="space-y-1 mb-4 border-b-2 border-black pb-2 text-black">
                                <div className="flex justify-between"><span>Subtotal</span><span className="font-bold">{ticketData.subtotal.toFixed(2)}</span></div>
                                <div className="flex justify-between">
                                    <span>{ticketData.igv > 0 ? 'IGV (18%)' : 'IGV (0%)'}</span>
                                    <span className="font-bold">{ticketData.igv.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-xs font-black"><span>TOTAL {formatSymbol(ticketData.currency)}</span><span>{ticketData.total.toFixed(2)}</span></div>
                            </div>
                            
                            {ticketData.payments && ticketData.payments.length > 0 && (
                                <div className="bg-slate-50 p-2 rounded-lg space-y-1 mb-4 text-black border border-black">
                                    <p className="text-[8px] font-black uppercase mb-1">PAGOS:</p>
                                    {ticketData.payments.map((p: any, i: number) => (
                                        <div key={i} className="flex justify-between items-center text-[9px] font-bold">
                                            <span>{p.method.toUpperCase()}</span>
                                            <span>{p.amount.toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="mt-6 text-center italic text-[8px] text-black font-bold">Comprobante de Recepción Interna</div>
                        </div>
                    ) : (
                        <div className="a4-preview-container bg-white p-12 shadow-sm font-sans text-xs text-slate-800 mx-auto min-h-[1100px] flex flex-col shrink-0">
                            <div className="flex justify-between items-start mb-8 border-b-2 border-blue-600 pb-6">
                                <div className="space-y-1">
                                    <h1 className="text-2xl font-black text-blue-600 uppercase tracking-tighter">SapiSoft ERP</h1>
                                    <p className="font-bold text-slate-500">GESTIÓN LOGÍSTICA E INVENTARIOS</p>
                                    <p className="text-[10px]">Av. La Cultura 1234, Cusco, Perú</p>
                                    <p className="text-[10px]">Telf: +51 987 654 321 | RUC: 20601234567</p>
                                </div>
                                <div className="bg-slate-50 border-2 border-slate-200 p-4 rounded-xl text-center min-w-[200px]">
                                    <p className="font-black text-sm uppercase mb-1">R.U.C. 20601234567</p>
                                    <p className="bg-blue-600 text-white py-1 px-2 font-black text-[10px] rounded mb-1">{ticketData.docType.toUpperCase()}</p>
                                    <p className="font-mono text-lg font-black">{ticketData.id}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8 mb-8">
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                    <p className="text-[9px] font-black text-blue-600 uppercase mb-2 border-b pb-1">Datos del Proveedor</p>
                                    <div className="space-y-1">
                                        <p className="font-black text-sm uppercase">{ticketData.supplier.name}</p>
                                        <p><strong>RUC:</strong> {ticketData.supplier.ruc}</p>
                                        <p><strong>Dirección:</strong> {ticketData.supplier.address || 'No registrada'}</p>
                                        <p><strong>Contacto:</strong> {ticketData.supplier.contactName || '---'}</p>
                                    </div>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                    <p className="text-[9px] font-black text-blue-600 uppercase mb-2 border-b pb-1">Información Compra</p>
                                    <div className="space-y-1">
                                        <p><strong>Fecha de Emisión:</strong> {ticketData.date}</p>
                                        <p><strong>Hora:</strong> {ticketData.time}</p>
                                        <p><strong>Condición de Pago:</strong> {ticketData.condition}</p>
                                        <p><strong>Moneda:</strong> {formatSymbol(ticketData.currency)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-blue-600 text-white">
                                            <th className="p-2 text-left border border-blue-600 uppercase text-[8px] w-20">SKU</th>
                                            <th className="p-2 text-left border border-blue-600 uppercase text-[8px] w-20">Marca</th>
                                            <th className="p-2 text-left border border-blue-600 uppercase text-[8px]">Descripción del Artículo</th>
                                            <th className="p-2 text-center border border-blue-600 uppercase text-[8px] w-16">Ubicación</th>
                                            <th className="p-2 text-center border border-blue-600 uppercase text-[8px] w-12">Cant.</th>
                                            <th className="p-2 text-right border border-blue-600 uppercase text-[8px] w-24">Precio Unit.</th>
                                            <th className="p-2 text-right border border-blue-600 uppercase text-[8px] w-24">Total Neto</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ticketData.items.map((item: CartItem, i: number) => (
                                            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                                <td className="p-2 border border-slate-200 font-mono text-[9px]">{item.code}</td>
                                                <td className="p-2 border border-slate-200 text-[9px] uppercase">{item.brand || '---'}</td>
                                                <td className="p-2 border border-slate-200 uppercase font-medium text-[9px]">{item.name}</td>
                                                <td className="p-2 border border-slate-200 text-center text-[9px] text-slate-400 uppercase">{item.location || '-'}</td>
                                                <td className="p-2 border border-slate-200 text-center font-black text-[10px]">{item.quantity}</td>
                                                <td className="p-2 border border-slate-200 text-right text-[10px]">{item.price.toFixed(2)}</td>
                                                <td className="p-2 border border-slate-200 text-right font-black text-[10px]">{(item.price * item.quantity).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex justify-end pt-8">
                                <div className="w-72 space-y-2">
                                    <div className="flex justify-between p-2 bg-slate-50 border rounded-lg">
                                        <span className="font-bold text-slate-500 uppercase text-[10px]">Subtotal:</span>
                                        <span className="font-bold font-mono">{formatSymbol(ticketData.currency)} {ticketData.subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between p-2 bg-slate-50 border rounded-lg">
                                        <span className="font-bold text-slate-500 uppercase text-[10px]">I.G.V. (18%):</span>
                                        <span className="font-bold font-mono">{formatSymbol(ticketData.currency)} {ticketData.igv.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between p-3 bg-blue-600 text-white rounded-xl shadow-lg border-2 border-blue-700">
                                        <span className="font-black uppercase">TOTAL COMPRA:</span>
                                        <span className="text-lg font-black font-mono">{formatSymbol(ticketData.currency)} {ticketData.total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="no-print flex gap-2 shrink-0 bg-white p-4 rounded-xl border border-slate-200">
                    <button onClick={() => setShowTicket(false)} className="flex-1 py-3 bg-white text-slate-500 font-black rounded-xl text-[10px] uppercase border hover:bg-slate-50 transition-all">
                        Finalizar y Cerrar
                    </button>
                    <button onClick={() => window.print()} className="flex-1 py-3 bg-blue-600 text-white font-black rounded-xl text-[10px] flex items-center justify-center gap-2 shadow-lg hover:bg-blue-700 transition-all active:scale-95 uppercase tracking-widest">
                        <Printer size={16}/> Imprimir {printFormat}
                    </button>
                </div>
            </div>
        </div>
       )}

      {showSupplierModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
           <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl w-full max-w-3xl border border-white/20 animate-in zoom-in-95 duration-300 overflow-hidden">
               <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50">
                   <h3 className="font-black text-base text-slate-800 dark:text-white flex items-center gap-3 uppercase tracking-tighter"><Plus className="text-orange-600" size={20}/> Nuevo Proveedor</h3>
                   <button onClick={() => setShowSupplierModal(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"><X size={20}/></button>
               </div>
               <div className="p-8 space-y-6">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Razón Social / Nombre Comercial</label>
                        <input type="text" className="w-full p-3.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-bold uppercase outline-none focus:border-orange-500 shadow-sm text-sm" value={newSupplierData.name} onChange={e => setNewSupplierData({...newSupplierData, name: e.target.value})} placeholder="EJ. IMPORTACIONES PERU S.A.C." autoFocus />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">RUC / Identificación Fiscal</label>
                            <input type="text" className="w-full p-3.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-bold outline-none focus:border-orange-500 text-sm" value={newSupplierData.ruc} onChange={e => setNewSupplierData({...newSupplierData, ruc: e.target.value})} placeholder="2060..." />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Teléfono / WhatsApp</label>
                            <input type="text" className="w-full p-3.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-bold outline-none focus:border-orange-500 text-sm" value={newSupplierData.phone} onChange={e => setNewSupplierData({...newSupplierData, phone: e.target.value})} placeholder="999 999 999" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Dirección Fiscal</label>
                        <input type="text" className="w-full p-3.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-bold uppercase outline-none focus:border-orange-500 text-sm" value={newSupplierData.address} onChange={e => setNewSupplierData({...newSupplierData, address: e.target.value})} placeholder="AV. INDUSTRIAL 123" />
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button onClick={() => setShowSupplierModal(false)} className="px-10 py-4 text-slate-500 font-bold hover:bg-slate-100 rounded-2xl transition-all uppercase tracking-widest text-xs">Cancelar</button>
                        <button onClick={() => { 
                            if (!newSupplierData.name || !newSupplierData.ruc) return alert("Nombre y RUC son obligatorios."); 
                            const newSup = { id: Date.now().toString(), ...newSupplierData, name: newSupplierData.name.toUpperCase() };
                            onAddSupplier(newSup); 
                            setSelectedSupplier(newSup); 
                            setSupplierSearchTerm(newSup.name);
                            setShowSupplierModal(false); 
                        }} className="px-12 py-4 bg-orange-600 text-white font-black rounded-2xl hover:bg-orange-700 shadow-xl transition-all text-xs uppercase tracking-widest">Guardar Proveedor</button>
                    </div>
               </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseModule;
