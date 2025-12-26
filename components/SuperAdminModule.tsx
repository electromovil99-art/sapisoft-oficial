
import React, { useState, useMemo, useEffect } from 'react';
import { 
    Building2, Plus, Search, User, Globe, CheckCircle, XCircle, Calendar, CreditCard, X, Edit, Power, 
    Lock, Banknote, QrCode, Save, AlertTriangle, TrendingUp, Clock, DollarSign, ArrowUpRight, Flame, 
    Wallet, Zap, Star, Crown, ChevronRight, Check, History, Calculator, ArrowRight, Gift, MessageCircle, 
    FileText, Landmark, Filter, PieChart, Trash2, AlertOctagon, Database, Activity, ShieldAlert, BadgeCheck, ShieldCheck, Scale, Info, PiggyBank, RefreshCw, Layers, Receipt, CreditCard as CardIcon, ArrowDownLeft, Trash, ArrowRightLeft, ExternalLink, Link, Settings2, ShieldQuestion
} from 'lucide-react';
import { Tenant, SystemUser, IndustryType, PlanType, TenantInvoice, MasterAccount, MasterMovement } from '../types';

interface SuperAdminModuleProps {
    tenants: Tenant[];
    onAddTenant: (tenant: Tenant, adminUser: SystemUser) => void;
    onUpdateTenant: (id: string, updates: Partial<Tenant>, newPassword?: string) => void;
    onDeleteTenant: (id: string) => void;
    onResetTenantData: (id: string) => void;
}

type MainTab = 'DASHBOARD' | 'BUSINESSES' | 'COLLECTIONS' | 'MAINTENANCE';

const PLAN_PRICES: Record<PlanType, number> = {
    'BASICO': 39,
    'INTERMEDIO': 69,
    'FULL': 99
};

export const SuperAdminModule: React.FC<SuperAdminModuleProps> = ({ tenants, onAddTenant, onUpdateTenant, onDeleteTenant, onResetTenantData }) => {
    const [activeMainTab, setActiveMainTab] = useState<MainTab>('DASHBOARD');
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    
    // --- PADDLE CONFIGURATION STATE ---
    const [paddleConfig, setPaddleConfig] = useState({
        clientToken: 'ptp_sample_token_123456789',
        isSandbox: true,
        prices: {
            'BASICO': 'pri_01hkv9...',
            'INTERMEDIO': 'pri_01hkvj...',
            'FULL': 'pri_01hkvm...'
        }
    });

    const [masterAccounts, setMasterAccounts] = useState<MasterAccount[]>([
        { id: 'MA-00', name: 'BÓVEDA / CAJA FÍSICA CENTRAL', type: 'PHYSICAL_CASH', currency: 'PEN', balance: 500.00 },
        { id: 'MA-01', name: 'BCP RECAUDACIÓN', type: 'BANK', currency: 'PEN', balance: 4500.00, accountNumber: '193-987234-01' },
        { id: 'MA-02', name: 'dLocal Go (RECAUDACIÓN LATAM)', type: 'BANK', currency: 'PEN', balance: 1250.00 },
        { id: 'MA-03', name: 'Paddle (COBROS GLOBALES)', type: 'BANK', currency: 'USD', balance: 850.00 }
    ]);

    const [invoices, setInvoices] = useState<TenantInvoice[]>([
        { id: 'INV-1021', tenantId: 'tenant-01', tenantName: 'SAPISOFT', date: '01/12/2024', dueDate: '15/12/2024', amount: 99.00, creditApplied: 0, netAmount: 99.00, status: 'PAID', planType: 'FULL' },
        { id: 'INV-2045', tenantId: 'tenant-01', tenantName: 'IMPORTACIONES CUSCO', date: '22/02/2025', dueDate: '05/03/2025', amount: 69.00, creditApplied: 20.00, netAmount: 49.00, status: 'PENDING', planType: 'INTERMEDIO' }
    ]);

    const [masterMovements, setMasterMovements] = useState<MasterMovement[]>([
        { id: 'M-1', date: '01/12/2024', time: '10:00', type: 'Ingreso', accountId: 'MA-01', accountName: 'BCP RECAUDACIÓN', amount: 99.00, concept: 'Cobro Suscripción FULL - SAPISOFT', tenantId: 'tenant-01' }
    ]);

    // Inicializar Paddle con el token de configuración
    useEffect(() => {
        if (typeof window !== 'undefined' && (window as any).Paddle) {
            const paddle = (window as any).Paddle;
            paddle.Environment.set(paddleConfig.isSandbox ? 'sandbox' : 'production');
            paddle.Initialize({ token: paddleConfig.clientToken });
        }
    }, [paddleConfig.clientToken, paddleConfig.isSandbox]);

    const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
    const [initialPlanBeforeEdit, setInitialPlanBeforeEdit] = useState<PlanType | null>(null);
    const [adminPasswordReset, setAdminPasswordReset] = useState('');
    const [formData, setFormData] = useState({
        companyName: '', industry: 'TECH' as IndustryType, ownerName: '', username: '', password: '', phone: '', baseCurrency: 'PEN'
    });

    const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<TenantInvoice | null>(null);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [isGeneratingLink, setIsGeneratingLink] = useState(false);
    const [isPaddleLoading, setIsPaddleLoading] = useState(false);

    const [transferData, setTransferData] = useState({ fromId: '', toId: '', amount: '', ref: '' });
    const [payData, setPayData] = useState({ accountId: '', ref: '' });

    const totalMasterBalance = masterAccounts.reduce((acc, a) => acc + (a.currency === 'PEN' ? a.balance : a.balance * 3.75), 0);
    const pendingCollection = invoices.filter(inv => inv.status === 'PENDING').reduce((acc, inv) => acc + inv.netAmount, 0);

    const evolutionCalculation = useMemo(() => {
        if (!editingTenant || !initialPlanBeforeEdit) return null;
        if (editingTenant.planType === initialPlanBeforeEdit) return null;
        const oldPrice = PLAN_PRICES[initialPlanBeforeEdit];
        const newPrice = PLAN_PRICES[editingTenant.planType];
        const priceDiff = newPrice - oldPrice;
        try {
            const [day, month, year] = editingTenant.subscriptionEnd.split('/').map(Number);
            const expiryDate = new Date(year, month - 1, day);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const diffTime = expiryDate.getTime() - today.getTime();
            const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
            const proratedAmount = (Math.abs(priceDiff) / 30) * daysRemaining;
            return {
                type: priceDiff > 0 ? 'UPGRADE' : 'DOWNGRADE',
                diff: Math.abs(priceDiff),
                daysRemaining,
                amount: proratedAmount.toFixed(2),
                label: priceDiff > 0 ? 'Monto a Cobrar hoy' : 'Crédito a Favor generado'
            };
        } catch (e) { return null; }
    }, [editingTenant, initialPlanBeforeEdit]);

    // --- PADDLE CHECKOUT LOGIC ---
    const handlePaddleCheckout = (invoice: TenantInvoice) => {
        if (!(window as any).Paddle) return alert("Error: SDK de Paddle no disponible.");
        
        setIsPaddleLoading(true);
        const paddle = (window as any).Paddle;

        paddle.Checkout.open({
            settings: {
                displayMode: 'overlay',
                theme: 'light',
                locale: 'es'
            },
            items: [{
                priceId: paddleConfig.prices[invoice.planType],
                quantity: 1
            }],
            customer: {
                email: 'cliente@sapisoft.com'
            },
            eventCallback: (data: any) => {
                if (data.name === 'checkout.completed') {
                    processPaddlePayment(invoice, data.data.transaction_id);
                }
            }
        });

        // Simulación para propósitos de demo si no hay token real
        if (paddleConfig.clientToken.includes('sample')) {
            setTimeout(() => {
                processPaddlePayment(invoice, 'P-TXN-' + Math.random().toString(36).substr(2, 9).toUpperCase());
            }, 2000);
        }
    };

    const processPaddlePayment = (invoice: TenantInvoice, txnId: string) => {
        setInvoices(invoices.map(inv => 
            inv.id === invoice.id ? { ...inv, status: 'PAID', paddleId: txnId, externalId: txnId } : inv
        ));
        
        const usdAmount = invoice.netAmount / 3.75;
        setMasterAccounts(masterAccounts.map(acc => 
            acc.id === 'MA-03' ? { ...acc, balance: acc.balance + usdAmount } : acc
        ));

        const newMove: MasterMovement = {
            id: 'M-' + Date.now(),
            date: new Date().toLocaleDateString('es-PE'),
            time: new Date().toLocaleTimeString('es-PE'),
            type: 'Ingreso',
            accountId: 'MA-03',
            accountName: 'Paddle Global',
            amount: usdAmount,
            concept: `Cobro Global (Paddle) - Plan ${invoice.planType} - ${invoice.tenantName}`,
            reference: txnId,
            tenantId: invoice.tenantId
        };
        setMasterMovements([newMove, ...masterMovements]);
        setIsPaddleLoading(false);
        alert(`¡Pago Global Completado!\nLos fondos se acreditaron en la cuenta Paddle USD.`);
    };

    const handleGenerateDLocalLink = (invoice: TenantInvoice) => {
        setIsGeneratingLink(true);
        setTimeout(() => {
            const mockLink = `https://checkout.dlocalgo.com/pay/${Math.random().toString(36).substr(2, 8)}`;
            setInvoices(invoices.map(inv => 
                inv.id === invoice.id ? { ...inv, paymentLink: mockLink, externalId: 'DLG-' + Math.random().toString(36).substr(2, 5).toUpperCase() } : inv
            ));
            setIsGeneratingLink(false);
            alert("¡Link de dLocal Go generado correctamente!");
        }, 1500);
    };

    const handleRegisterCollection = () => {
        if (!selectedInvoiceForPayment || !payData.accountId) return alert("Seleccione cuenta destino.");
        const account = masterAccounts.find(a => a.id === payData.accountId);
        if (!account) return;
        setInvoices(invoices.map(inv => inv.id === selectedInvoiceForPayment.id ? { ...inv, status: 'PAID' } : inv));
        setMasterAccounts(masterAccounts.map(acc => acc.id === payData.accountId ? { ...acc, balance: acc.balance + selectedInvoiceForPayment.netAmount } : acc));
        const newMove: MasterMovement = {
            id: 'M-' + Date.now(),
            date: new Date().toLocaleDateString('es-PE'),
            time: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
            type: 'Ingreso',
            accountId: account.id,
            accountName: account.name,
            amount: selectedInvoiceForPayment.netAmount,
            concept: `Recaudación Recibo #${selectedInvoiceForPayment.id} (${selectedInvoiceForPayment.tenantName})`,
            reference: payData.ref,
            tenantId: selectedInvoiceForPayment.tenantId
        };
        setMasterMovements([newMove, ...masterMovements]);
        setSelectedInvoiceForPayment(null);
        setPayData({ accountId: '', ref: '' });
    };

    const handleExecuteTransfer = () => {
        const amt = parseFloat(transferData.amount);
        if (!transferData.fromId || !transferData.toId || isNaN(amt) || amt <= 0) return alert("Datos de transferencia inválidos.");
        const fromAcc = masterAccounts.find(a => a.id === transferData.fromId);
        const toAcc = masterAccounts.find(a => a.id === transferData.toId);
        if (!fromAcc || !toAcc || fromAcc.balance < amt) return alert("Saldo insuficiente.");
        setMasterAccounts(masterAccounts.map(acc => {
            if (acc.id === transferData.fromId) return { ...acc, balance: acc.balance - amt };
            if (acc.id === transferData.toId) return { ...acc, balance: acc.balance + amt };
            return acc;
        }));
        const moveOut: MasterMovement = { id: 'TR-OUT-' + Date.now(), date: new Date().toLocaleDateString('es-PE'), time: new Date().toLocaleTimeString('es-PE'), type: 'Egreso', accountId: fromAcc.id, accountName: fromAcc.name, amount: amt, concept: `Transferencia a ${toAcc.name}`, reference: transferData.ref };
        const moveIn: MasterMovement = { id: 'TR-IN-' + Date.now(), date: new Date().toLocaleDateString('es-PE'), time: new Date().toLocaleTimeString('es-PE'), type: 'Ingreso', accountId: toAcc.id, accountName: toAcc.name, amount: amt, concept: `Transferencia desde ${fromAcc.name}`, reference: transferData.ref };
        setMasterMovements([moveIn, moveOut, ...masterMovements]);
        setShowTransferModal(false);
    };

    const generateNewInvoice = (tenant: Tenant) => {
        const credit = tenant.creditBalance || 0;
        const amount = PLAN_PRICES[tenant.planType];
        const net = Math.max(0, amount - credit);
        const newInv: TenantInvoice = {
            id: 'INV-' + Math.floor(1000 + Math.random() * 9000),
            tenantId: tenant.id, tenantName: tenant.companyName, date: new Date().toLocaleDateString('es-PE'),
            dueDate: new Date(Date.now() + 15 * 86400000).toLocaleDateString('es-PE'),
            amount: amount, creditApplied: credit, netAmount: net, status: 'PENDING', planType: tenant.planType
        };
        setInvoices([newInv, ...invoices]);
        onUpdateTenant(tenant.id, { creditBalance: 0 });
    };

    const handleCreate = () => {
        if (!formData.companyName || !formData.username || !formData.password) return alert("Faltan datos críticos.");
        const newTenant: Tenant = {
            id: 'TEN-' + Math.random().toString(36).substr(2, 6).toUpperCase(), 
            companyName: formData.companyName.toUpperCase(), industry: formData.industry, ownerName: formData.ownerName, 
            phone: formData.phone, status: 'ACTIVE', planType: 'BASICO', 
            subscriptionEnd: new Date(Date.now() + 15 * 86400000).toLocaleDateString('es-PE'),
            baseCurrency: formData.baseCurrency, creditBalance: 0
        };
        const newAdmin: SystemUser = {
            id: 'USR-' + Math.random().toString(36).substr(2, 6).toUpperCase(), username: formData.username, 
            password: formData.password, fullName: formData.ownerName || 'Admin ' + formData.companyName, 
            role: 'ADMIN', active: true, permissions: ['ALL'], industry: formData.industry, 
            companyName: formData.companyName.toUpperCase()
        };
        onAddTenant(newTenant, newAdmin);
        setShowCreateModal(false);
    };

    return (
        <div className="flex flex-col h-full gap-4 animate-in fade-in duration-500">
            
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 shrink-0">
                {[
                    { id: 'DASHBOARD', icon: Activity, label: 'Vista General' },
                    { id: 'BUSINESSES', icon: Building2, label: 'Empresas SaaS' },
                    { id: 'COLLECTIONS', icon: Receipt, label: 'Hub Financiero' },
                    { id: 'MAINTENANCE', icon: ShieldCheck, label: 'Mantenimiento' }
                ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveMainTab(tab.id as MainTab)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${activeMainTab === tab.id ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}><tab.icon size={14}/> {tab.label}</button>
                ))}
            </div>

            {activeMainTab === 'DASHBOARD' && (
                <div className="flex flex-col gap-6 flex-1 overflow-auto no-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden">
                            <div className="relative z-10">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Recaudación Total</p>
                                <div className="text-3xl font-black text-emerald-600">S/ {totalMasterBalance.toFixed(2)}</div>
                                <div className="mt-2 text-[10px] font-bold text-slate-400">Fondos en Bóveda, dLocal y Paddle</div>
                            </div>
                            <Activity className="absolute -right-4 -bottom-4 text-emerald-500/5 w-24 h-24"/>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm border-l-4 border-l-blue-500">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Cuentas por Cobrar</p>
                            <div className="text-3xl font-black text-blue-600">S/ {pendingCollection.toFixed(2)}</div>
                            <div className="mt-2 text-[10px] font-bold text-slate-400">{invoices.filter(i=>i.status==='PENDING').length} Recibos Pendientes</div>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden group">
                            <div className="relative z-10">
                                <p className="text-[9px] font-black text-paddle uppercase tracking-widest mb-1">Pasarela Paddle (Global)</p>
                                <div className="text-2xl font-black text-slate-800 dark:text-white">$ {masterAccounts.find(a=>a.id==='MA-03')?.balance.toFixed(2)}</div>
                                <div className="mt-2 flex gap-1 items-center">
                                    <div className="w-1.5 h-1.5 bg-paddle rounded-full animate-pulse"></div>
                                    <span className="text-[9px] font-black text-paddle uppercase tracking-widest">Merchant of Record OK</span>
                                </div>
                            </div>
                            <Globe className="absolute -right-4 -bottom-4 text-emerald-500/10 w-24 h-24 group-hover:rotate-45 transition-transform duration-700"/>
                        </div>
                        <div className="bg-slate-900 p-6 rounded-[2rem] shadow-xl relative overflow-hidden flex flex-col justify-center border border-white/10">
                            <div className="relative z-10">
                                <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest mb-1">SaaS Infrastructure</p>
                                <div className="text-xl font-black text-white flex items-center gap-2">MULTI-GATEWAY ACTIVE <ShieldCheck size={20} className="text-emerald-400"/></div>
                            </div>
                            <Zap size={100} className="absolute -right-6 -bottom-6 text-white/5 rotate-12"/>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
                        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
                            <div className="p-6 border-b flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                                <h3 className="font-black text-xs text-slate-700 dark:text-white uppercase tracking-widest flex items-center gap-2"><Landmark size={16} className="text-primary-500"/> Bóveda Central y Pasarelas</h3>
                                <button onClick={() => setShowTransferModal(true)} className="px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-100 rounded-xl text-[9px] font-black uppercase text-blue-600 flex items-center gap-1.5 shadow-sm hover:bg-blue-50 transition-all"><ArrowRightLeft size={12}/> Transferir</button>
                            </div>
                            <div className="flex-1 overflow-auto p-4 space-y-3">
                                {masterAccounts.map(acc => (
                                    <div key={acc.id} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700 transition-all hover:border-primary-200">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-2xl shadow-sm ${acc.id === 'MA-03' ? 'bg-emerald-100 text-emerald-600' : acc.type === 'PHYSICAL_CASH' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                                                {acc.id === 'MA-03' ? <Globe size={20}/> : acc.type === 'PHYSICAL_CASH' ? <Banknote size={20}/> : <Landmark size={20}/>}
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tighter">{acc.name}</p>
                                                <p className="text-[8px] font-black text-slate-400 uppercase mt-0.5">{acc.type.replace('_',' ')}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-lg font-black ${acc.balance > 0 ? 'text-slate-800 dark:text-white' : 'text-slate-300'}`}>
                                                {acc.currency} {acc.balance.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
                            <div className="p-6 border-b flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                                <h3 className="font-black text-xs text-slate-700 dark:text-white uppercase tracking-widest flex items-center gap-2"><History size={16} className="text-orange-500"/> Flujo de Fondos Globales</h3>
                            </div>
                            <div className="flex-1 overflow-auto p-2">
                                <table className="w-full text-left text-[10px]">
                                    <thead className="text-slate-400 font-black uppercase tracking-widest">
                                        <tr><th className="px-4 py-3">Momento</th><th className="px-4 py-3">Gateway</th><th className="px-4 py-3 text-right">Monto</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50 font-medium">
                                        {masterMovements.map(m => (
                                            <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-3 text-slate-400"><div>{m.date}</div><div className="text-[8px] font-bold">{m.time}</div></td>
                                                <td className="px-4 py-3"><div className="font-black text-slate-700 dark:text-slate-200 uppercase truncate max-w-[180px]">{m.concept}</div><div className="text-[8px] text-slate-400 font-bold uppercase">{m.accountName}</div></td>
                                                <td className={`px-4 py-3 text-right font-black ${m.type === 'Ingreso' ? 'text-emerald-600' : 'text-red-600'}`}>{m.accountId === 'MA-03' ? '$' : 'S/'} {m.amount.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeMainTab === 'BUSINESSES' && (
                <div className="flex flex-col gap-4 flex-1 min-h-0">
                    <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                            <input type="text" placeholder="Filtrar empresas..." className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 rounded-xl text-xs w-full outline-none focus:border-purple-500" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        </div>
                        <button onClick={() => setShowCreateModal(true)} className="px-5 py-2.5 bg-purple-600 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-purple-700 shadow-lg active:scale-95 transition-all">
                            <Plus size={14}/> Nueva Empresa
                        </button>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col">
                        <div className="overflow-auto flex-1 no-scrollbar">
                            <table className="w-full text-[10px] text-left">
                                <thead className="sticky top-0 bg-slate-50 dark:bg-slate-700 text-slate-400 font-black uppercase tracking-widest border-b z-10">
                                    <tr><th className="px-6 py-4">Tenant / Business</th><th className="px-6 py-4 text-center">Plan Actual</th><th className="px-6 py-4 text-center">Vencimiento</th><th className="px-6 py-4 text-center">Estado</th><th className="px-6 py-4 text-center">Acciones</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                                    {tenants.filter(t => t.companyName.includes(searchTerm.toUpperCase())).map(t => (
                                        <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4"><div className="font-black text-slate-800 dark:text-white uppercase text-xs">{t.companyName}</div><div className="text-[9px] text-slate-400 font-bold mt-0.5 uppercase flex items-center gap-2"><User size={10}/> {t.ownerName} <span className="text-slate-200">|</span> <Globe size={10}/> {t.industry}</div></td>
                                            <td className="px-6 py-4 text-center"><span className={`px-2.5 py-1 rounded-lg font-black text-[9px] uppercase border ${t.planType === 'FULL' ? 'bg-purple-50 text-purple-600 border-purple-100' : t.planType === 'INTERMEDIO' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>{t.planType}</span></td>
                                            <td className="px-6 py-4 text-center font-bold text-slate-600 dark:text-slate-300">{t.subscriptionEnd}</td>
                                            <td className="px-6 py-4 text-center"><span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase border ${t.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>{t.status === 'ACTIVE' ? 'ACTIVA' : 'INACTIVA'}</span></td>
                                            <td className="px-6 py-4 text-center"><div className="flex items-center justify-center gap-2"><button onClick={() => generateNewInvoice(t)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all" title="Generar Recibo"><Receipt size={16}/></button><button onClick={() => { setEditingTenant(t); setInitialPlanBeforeEdit(t.planType); }} className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all" title="Gestionar"><Edit size={16}/></button><button onClick={() => onUpdateTenant(t.id, { status: t.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })} className={`p-2 rounded-xl transition-all ${t.status === 'ACTIVE' ? 'text-slate-400 hover:text-red-500 hover:bg-red-50' : 'text-emerald-500 hover:bg-emerald-50'}`} title={t.status === 'ACTIVE' ? 'Suspender' : 'Activar'}><Power size={16}/></button></div></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeMainTab === 'COLLECTIONS' && (
                <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col flex-1 overflow-hidden">
                    <div className="p-6 border-b flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                        <h3 className="font-black text-xs uppercase tracking-widest text-slate-700 dark:text-white flex items-center gap-2"><DollarSign size={16} className="text-emerald-500"/> Hub de Cobranzas Global</h3>
                        <div className="text-right"><p className="text-[9px] font-black text-slate-400 uppercase">Recaudación Pendiente</p><p className="text-sm font-black text-blue-600">S/ {pendingCollection.toFixed(2)}</p></div>
                    </div>
                    <div className="flex-1 overflow-auto p-4 no-scrollbar">
                        <table className="w-full text-left text-[10px]">
                            <thead className="text-slate-400 font-black uppercase border-b tracking-wider">
                                <tr><th className="px-4 py-3">Recibo</th><th className="px-4 py-3">Empresa</th><th className="px-4 py-3">Total Neto</th><th className="px-4 py-3">Vencimiento</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3 text-center">Checkout Multi-Pasarela</th></tr>
                            </thead>
                            <tbody>
                                {invoices.map(inv => (
                                    <tr key={inv.id} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-4 font-mono text-slate-400">#{inv.id}</td>
                                        <td className="px-4 py-4 font-black uppercase text-slate-700 dark:text-slate-200">{inv.tenantName}</td>
                                        <td className="px-4 py-4 font-black text-slate-900 dark:text-white">S/ {inv.netAmount.toFixed(2)}</td>
                                        <td className="px-4 py-4 font-bold text-slate-500">{inv.dueDate}</td>
                                        <td className="px-4 py-4 uppercase"><span className={`px-2 py-0.5 rounded-full text-[8px] font-black border ${inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>{inv.status === 'PAID' ? 'PAGADO' : 'PENDIENTE'}</span></td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                {inv.status === 'PENDING' ? (
                                                    <>
                                                        <button onClick={() => setSelectedInvoiceForPayment(inv)} className="p-2 bg-slate-800 text-white rounded-xl shadow-md hover:bg-slate-900 transition-all" title="Cobro Manual"><Banknote size={14}/></button>
                                                        <button onClick={() => handleGenerateDLocalLink(inv)} className={`p-2 rounded-xl shadow-md transition-all ${inv.paymentLink ? 'bg-blue-100 text-blue-600 border border-blue-200' : 'bg-blue-600 text-white hover:bg-blue-700'}`} title="dLocal Go (LATAM)"><Link size={14}/></button>
                                                        <button onClick={() => handlePaddleCheckout(inv)} disabled={isPaddleLoading} className="p-2 bg-paddle text-slate-900 rounded-xl shadow-md hover:bg-emerald-500 transition-all flex items-center justify-center" title="Paddle Checkout (Global)">{isPaddleLoading ? <RefreshCw size={14} className="animate-spin"/> : <Globe size={14}/>}</button>
                                                    </>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        {inv.paddleId && <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-lg font-black text-[7px] uppercase border border-emerald-200">VÍA PADDLE</span>}
                                                        <span className="text-[8px] font-mono text-slate-400">ID: {inv.externalId}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeMainTab === 'MAINTENANCE' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0 overflow-auto no-scrollbar">
                    {/* CONFIG PADDLE GLOBAL */}
                    <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-200 p-8 shadow-sm flex flex-col gap-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-paddle text-slate-900 rounded-2xl shadow-lg">
                                <Globe size={24}/>
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tighter">Pasarela Paddle Global</h3>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Configuración Merchant of Record</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Client Side Token</label>
                                <div className="relative">
                                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                                    <input 
                                        type="password" 
                                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] font-mono outline-none focus:border-paddle" 
                                        value={paddleConfig.clientToken}
                                        onChange={(e) => setPaddleConfig({...paddleConfig, clientToken: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-3">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b pb-1">Price IDs (Checkout Mapping)</p>
                                {(['BASICO', 'INTERMEDIO', 'FULL'] as PlanType[]).map(plan => (
                                    <div key={plan} className="flex flex-col gap-1">
                                        <span className="text-[8px] font-black text-slate-500">{plan}</span>
                                        <input 
                                            type="text" 
                                            className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[9px] font-mono outline-none" 
                                            value={paddleConfig.prices[plan]}
                                            onChange={(e) => setPaddleConfig({...paddleConfig, prices: {...paddleConfig.prices, [plan]: e.target.value}})}
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                                <input 
                                    type="checkbox" 
                                    id="sandbox" 
                                    checked={paddleConfig.isSandbox}
                                    onChange={(e) => setPaddleConfig({...paddleConfig, isSandbox: e.target.checked})}
                                    className="w-4 h-4 text-paddle rounded focus:ring-paddle"
                                />
                                <label htmlFor="sandbox" className="text-[10px] font-black text-blue-700 dark:text-blue-300 uppercase cursor-pointer">Activar Modo Sandbox (Entorno de Pruebas)</label>
                            </div>
                        </div>

                        <div className="mt-auto">
                            <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:opacity-90 active:scale-95 transition-all">Sincronizar Pasarela</button>
                        </div>
                    </div>

                    {/* ESTADISTICAS SISTEMA */}
                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-200 p-8 shadow-sm flex flex-col gap-6">
                            <h3 className="font-black text-xs uppercase tracking-widest text-slate-400 flex items-center gap-2"><Database size={16}/> Salud del Sistema</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700">
                                    <span className="text-[10px] font-black text-slate-500 uppercase">Supabase Realtime</span>
                                    <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div><span className="text-[10px] font-black text-emerald-600 uppercase">ONLINE</span></span>
                                </div>
                                <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700">
                                    <span className="text-[10px] font-black text-slate-500 uppercase">Uptime Mensual</span>
                                    <span className="text-[10px] font-black text-slate-700 dark:text-white uppercase">99.98%</span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-200 p-8 shadow-sm flex flex-col gap-6">
                            <h3 className="font-black text-xs uppercase tracking-widest text-slate-400 flex items-center gap-2"><ShieldAlert size={16}/> Logs de Seguridad</h3>
                            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                {[
                                    { date: '22/02 14:30', event: 'Cambio de Plan', user: 'Master', target: 'IMPORTACIONES CUSCO' },
                                    { date: '22/02 12:15', event: 'Reseteo Password', user: 'Master', target: 'SAPISOFT' },
                                    { date: '21/02 18:00', event: 'Nuevo Tenant', user: 'Master', target: 'FARMACIA LIMA' }
                                ].map((log, i) => (
                                    <div key={i} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700 flex justify-between items-center">
                                        <div className="min-w-0">
                                            <p className="text-[9px] font-black text-slate-800 dark:text-white uppercase truncate">{log.event}</p>
                                            <p className="text-[8px] text-slate-400 font-bold">{log.target}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-[8px] font-black text-slate-400">{log.date}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showTransferModal && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[1100] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl w-full max-w-md border border-white/20 animate-in zoom-in-95 overflow-hidden">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-blue-50/50">
                            <h3 className="font-black text-lg text-blue-800 uppercase tracking-tighter flex items-center gap-3"><ArrowRightLeft size={24}/> Transferencia Maestro</h3>
                            <button onClick={() => setShowTransferModal(false)} className="p-2 hover:bg-blue-100 rounded-full transition-colors"><X size={24}/></button>
                        </div>
                        <div className="p-8 space-y-5">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase block">Desde</label>
                                    <select className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold" value={transferData.fromId} onChange={e => setTransferData({...transferData, fromId: e.target.value})}>
                                        <option value="">-- ORIGEN --</option>
                                        {masterAccounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.currency} {a.balance.toFixed(2)})</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase block">Hacia</label>
                                    <select className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold" value={transferData.toId} onChange={e => setTransferData({...transferData, toId: e.target.value})}>
                                        <option value="">-- DESTINO --</option>
                                        {masterAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase block">Monto</label>
                                <input type="number" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-2xl font-black text-center" value={transferData.amount} onChange={e => setTransferData({...transferData, amount: e.target.value})} placeholder="0.00" />
                            </div>
                            <button onClick={handleExecuteTransfer} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl active:scale-95 transition-all">Confirmar Operación Interna</button>
                        </div>
                    </div>
                </div>
            )}

            {selectedInvoiceForPayment && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[1100] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-white/20 animate-in zoom-in-95 overflow-hidden">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-emerald-50/50">
                            <h3 className="font-black text-lg text-emerald-800 uppercase tracking-tighter flex items-center gap-3"><CreditCard size={24}/> Conciliar Cobro Manual</h3>
                            <button onClick={() => setSelectedInvoiceForPayment(null)} className="p-2 hover:bg-emerald-100 rounded-full transition-colors"><X size={24}/></button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Recibo de Plataforma</p>
                                <p className="font-black text-slate-700 uppercase mb-1">{selectedInvoiceForPayment.tenantName}</p>
                                <p className="text-3xl font-black text-emerald-600">S/ {selectedInvoiceForPayment.netAmount.toFixed(2)}</p>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase block">Cuenta Destino Maestro</label>
                                    <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none text-sm uppercase" value={payData.accountId} onChange={e => setPayData({...payData, accountId: e.target.value})}>
                                        <option value="">-- SELECCIONE CANAL --</option>
                                        {masterAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase block">Nro de Operación / Ref</label>
                                    <input type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none text-sm uppercase" value={payData.ref} onChange={e => setPayData({...payData, ref: e.target.value})} placeholder="EJ. CAJA-001 O BCP-488" />
                                </div>
                            </div>
                            <button onClick={handleRegisterCollection} className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl active:scale-95 transition-all">Confirmar Ingreso de Fondos</button>
                        </div>
                    </div>
                </div>
            )}

            {showCreateModal && (
                <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl w-full max-w-lg border border-white/20 animate-in zoom-in-95 overflow-hidden">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                            <h3 className="font-black text-lg text-slate-800 dark:text-white uppercase tracking-tighter flex items-center gap-3"><Building2 className="text-purple-600" size={24}/> Nueva Empresa en SapiSoft</h3>
                            <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={24}/></button>
                        </div>
                        <div className="p-10 space-y-6">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Nombre Comercial</label>
                                <input type="text" className="w-full p-4 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl font-bold uppercase outline-none focus:border-purple-500 shadow-sm text-sm" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} placeholder="EJ. IMPORTACIONES TECNO" autoFocus />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Usuario Administrador</label>
                                    <input type="text" className="w-full p-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-bold outline-none focus:border-purple-500 text-sm" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} placeholder="admin_empresa" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Clave de Acceso</label>
                                    <input type="password" placeholder="****" className="w-full p-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-bold outline-none focus:border-purple-500 text-sm" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Industria / Rubro</label>
                                <select className="w-full p-4 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl font-bold outline-none focus:border-purple-500 text-sm uppercase" value={formData.industry} onChange={e => setFormData({...formData, industry: e.target.value as any})}>
                                    <option value="TECH">Tecnología / Celulares</option>
                                    <option value="PHARMA">Farmacia / Salud</option>
                                    <option value="RETAIL">Comercio Minorista</option>
                                </select>
                            </div>
                            <button onClick={handleCreate} className="w-full py-5 bg-purple-600 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest hover:bg-purple-700 shadow-xl transition-all active:scale-95">Registrar Empresa y Activar Licencia</button>
                        </div>
                    </div>
                </div>
            )}

            {editingTenant && (
                <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl w-full max-w-2xl border border-white/20 animate-in slide-in-from-bottom-4 overflow-hidden">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-start bg-slate-50/50">
                            <div>
                                <h3 className="font-black text-2xl text-slate-800 dark:text-white uppercase tracking-tighter leading-none">{editingTenant.companyName}</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2"><Crown size={12} className="text-amber-500"/> Gestión de Licencia y Sistema</p>
                            </div>
                            <button onClick={() => { setEditingTenant(null); setInitialPlanBeforeEdit(null); }} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"><X size={24}/></button>
                        </div>
                        
                        <div className="p-10 space-y-8 overflow-y-auto max-h-[70vh] no-scrollbar">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Zap size={14} className="text-purple-600"/> Seleccionar Nivel de Plan</label>
                                <div className="grid grid-cols-3 gap-4">
                                    {(['BASICO', 'INTERMEDIO', 'FULL'] as PlanType[]).map(p => (
                                        <button key={p} onClick={() => setEditingTenant({...editingTenant, planType: p})} className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${editingTenant.planType === p ? 'bg-purple-50 border-purple-600 shadow-md' : 'bg-white border-slate-100 opacity-60'}`}>
                                            <span className={`text-[10px] font-black ${editingTenant.planType === p ? 'text-purple-600' : 'text-slate-400'}`}>{p}</span>
                                            <span className="text-xs font-bold text-slate-700">S/ {PLAN_PRICES[p]}.00</span>
                                            {initialPlanBeforeEdit === p && <span className="text-[8px] font-black text-slate-400 uppercase">(Actual)</span>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {evolutionCalculation && (
                                <div className={`p-6 rounded-[2rem] shadow-xl animate-in zoom-in-95 border border-white/20 relative overflow-hidden text-white ${evolutionCalculation.type === 'UPGRADE' ? 'bg-emerald-600' : 'bg-blue-600'}`}>
                                    <div className="relative z-10 flex justify-between items-center">
                                        <div className="space-y-1">
                                            <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                                {evolutionCalculation.type === 'UPGRADE' ? <Scale size={16}/> : <PiggyBank size={16}/>}
                                                {evolutionCalculation.type === 'UPGRADE' ? 'Ajuste por Upgrade' : 'Saldo por Downgrade'}
                                            </h4>
                                            <p className="text-[10px] font-bold max-w-[250px] opacity-90">{evolutionCalculation.type === 'UPGRADE' ? `El cliente sube de plan. Se cobrará la diferencia.` : `El cliente baja de plan. Se acreditará la diferencia.`}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black uppercase mb-1 opacity-80">{evolutionCalculation.label}</p>
                                            <p className="text-4xl font-black leading-none">S/ {evolutionCalculation.amount}</p>
                                        </div>
                                    </div>
                                    <Activity className="absolute -right-4 -bottom-4 text-white/10 w-32 h-32 rotate-12"/>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-8 pt-2">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vencimiento Suscripción</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                                        <input type="text" className="w-full pl-12 p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-sm outline-none focus:border-purple-500" value={editingTenant.subscriptionEnd} onChange={e => setEditingTenant({...editingTenant, subscriptionEnd: e.target.value})} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-red-500 uppercase tracking-widest">Reset Master Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                                        <input type="password" placeholder="Nueva clave..." className="w-full pl-12 p-4 bg-rose-50 border border-rose-100 rounded-2xl font-bold text-sm outline-none focus:border-red-500" value={adminPasswordReset} onChange={e => setAdminPasswordReset(e.target.value)} />
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-6">
                                <button onClick={() => { setEditingTenant(null); setInitialPlanBeforeEdit(null); }} className="flex-1 py-4 text-slate-500 font-black uppercase text-xs tracking-widest hover:bg-slate-100 rounded-[1.5rem] transition-all">Cancelar</button>
                                <button onClick={() => { 
                                    let updates: Partial<Tenant> = { ...editingTenant };
                                    if (evolutionCalculation?.type === 'DOWNGRADE') {
                                        const currentCredit = editingTenant.creditBalance || 0;
                                        updates.creditBalance = currentCredit + parseFloat(evolutionCalculation.amount);
                                    }
                                    onUpdateTenant(editingTenant.id, updates, adminPasswordReset || undefined);
                                    setEditingTenant(null); setInitialPlanBeforeEdit(null); setAdminPasswordReset('');
                                }} className="flex-1 py-4 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest hover:opacity-90 shadow-xl transition-all">Guardar Cambios Maestro</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminModule;
