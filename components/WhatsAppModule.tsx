
import React, { useState, useEffect, useRef } from 'react';
import { Search, MoreVertical, Paperclip, Smile, Mic, Send, CheckCheck, X, Play, Square, Users, Zap, Loader2, QrCode, User, Image as ImageIcon, Globe, Lock, ArrowLeft, ArrowRight, RotateCcw, ShieldCheck, Download, CheckCircle } from 'lucide-react';
import { Product, Client, Chat, Message } from '../types';

interface WhatsAppModuleProps {
    products: Product[];
    clients: Client[];
    chats: Chat[]; // Now from parent
    setChats: React.Dispatch<React.SetStateAction<Chat[]>>; // Now from parent
    initialContact?: { name: string, phone: string, message?: string }; // Added message prop
}

const WhatsAppModule: React.FC<WhatsAppModuleProps> = ({ products, clients, chats, setChats, initialContact }) => {
    const [step, setStep] = useState<'LOGIN' | 'APP'>('LOGIN');
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [inputText, setInputText] = useState('');
    
    // --- EXTENSION STATE ---
    const [isExtensionOpen, setIsExtensionOpen] = useState(false); 
    const [bulkMessage, setBulkMessage] = useState('Hola {NOMBRE}, tu servicio técnico ya está listo. Total: S/ 0.00');
    const [campaignImage, setCampaignImage] = useState<string | null>(null); 
    const [msgInterval, setMsgInterval] = useState(3);
    const [isSending, setIsSending] = useState(false);
    const [sendingProgress, setSendingProgress] = useState(0);
    const [logs, setLogs] = useState<string[]>([]);
    const [antiBanMode, setAntiBanMode] = useState(true);
    const [chatLoading, setChatLoading] = useState(false);
    const [showReport, setShowReport] = useState(false);
    const [campaignStats, setCampaignStats] = useState({ sent: 0, failed: 0, startTime: 0, endTime: 0 });

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const logsEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- INTEGRATION EFFECT ---
    useEffect(() => {
        if (initialContact) {
            setStep('APP');
            const exist = chats.find(c => c.name === initialContact.name);
            
            if (exist) {
                setActiveChatId(exist.id);
            } else {
                // Create new chat
                const newChat: Chat = {
                    id: Math.random().toString(),
                    name: initialContact.name,
                    phone: initialContact.phone,
                    avatar: initialContact.name.substring(0,2).toUpperCase(),
                    lastMessage: '',
                    lastMessageTime: 'Ahora',
                    unread: 0,
                    messages: []
                };
                setChats(prev => [newChat, ...prev]);
                setActiveChatId(newChat.id);
            }

            // Pre-fill message if provided
            if (initialContact.message) {
                setInputText(initialContact.message);
            }
        }
    }, [initialContact, chats, setChats]); // Added chats and setChats to dependency array

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chats, activeChatId, isSending, chatLoading]); 

    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCampaignImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSendMessage = () => {
        if (!inputText.trim() && !campaignImage) return;
        if (!activeChatId) return;

        const newMsg: Message = {
            id: Math.random().toString(),
            text: inputText,
            sender: 'me',
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            status: 'sent'
        };

        setChats(prev => prev.map(c => c.id === activeChatId ? { 
            ...c, 
            messages: [...c.messages, newMsg],
            lastMessage: inputText || 'Imagen',
            lastMessageTime: 'Ahora'
        } : c));

        setInputText('');
    };

    // --- MASS SENDER LOGIC ---
    useEffect(() => {
        let timer: any;

        if (isSending && sendingProgress < clients.length) {
            const client = clients[sendingProgress];
            const personalizedMsg = bulkMessage.replace('{NOMBRE}', client.name.split(' ')[0]).replace('{DNI}', client.dni);
            const randomDelay = antiBanMode ? Math.random() * 2000 : 0; 
            const totalInterval = (msgInterval * 1000) + randomDelay;

            setLogs(prev => [...prev, `🔍 Conectando con ${client.name}...`]);
            
            timer = setTimeout(() => {
                setChatLoading(true);
                setTimeout(() => {
                    let existingChat = chats.find(c => c.name === client.name);
                    let chatIdToUse = existingChat ? existingChat.id : Math.random().toString();

                    if (!existingChat) {
                        const newChat: Chat = {
                            id: chatIdToUse,
                            name: client.name,
                            phone: client.phone || 'Unknown',
                            avatar: client.name.substring(0,2),
                            lastMessage: '',
                            lastMessageTime: 'Ahora',
                            unread: 0,
                            messages: []
                        };
                        setChats(prev => [newChat, ...prev]);
                    }
                    setActiveChatId(chatIdToUse);
                    setChatLoading(false);

                    const processingTime = campaignImage ? 1500 : 500; 
                    if (campaignImage) setLogs(prev => [...prev, `🖼️ Subiendo imagen...`]);

                    setTimeout(() => {
                        if (campaignImage) {
                            const imgMsg: Message = { id: Math.random().toString(), text: '', image: campaignImage, sender: 'me', time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), status: 'sent' };
                            setChats(prev => prev.map(c => c.id === chatIdToUse ? { ...c, messages: [...c.messages, imgMsg] } : c));
                        }

                        setLogs(prev => [...prev, `⌨️ Escribiendo texto...`]);
                        let charIndex = 0;
                        const typingSpeed = antiBanMode ? 30 + Math.random() * 30 : 20;

                        const typingInterval = window.setInterval(() => {
                            setInputText(personalizedMsg.substring(0, charIndex + 1));
                            charIndex++;
                            if (charIndex > personalizedMsg.length) window.clearInterval(typingInterval);
                        }, typingSpeed);

                        setTimeout(() => {
                            const textMsg: Message = { id: Math.random().toString(), text: personalizedMsg, sender: 'me', time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), status: 'sent' };
                            setChats(prev => prev.map(c => c.id === chatIdToUse ? { ...c, messages: [...c.messages, textMsg], lastMessage: personalizedMsg, lastMessageTime: 'Ahora' } : c));
                            setInputText('');
                            setLogs(prev => [...prev, `✅ Enviado a ${client.name}`]);
                            setSendingProgress(prev => prev + 1);
                            setCampaignStats(prev => ({ ...prev, sent: prev.sent + 1 }));
                        }, 1000 + (personalizedMsg.length * typingSpeed));
                    }, processingTime);
                }, 600);
            }, totalInterval); 
        } else if (isSending && sendingProgress >= clients.length) {
            setIsSending(false);
            setLogs(prev => [...prev, `🎉 CAMPAÑA FINALIZADA.`]);
            setCampaignStats(prev => ({ ...prev, endTime: Date.now() }));
            setTimeout(() => setShowReport(true), 1000);
        }
        return () => clearTimeout(timer);
    }, [isSending, sendingProgress, clients, chats, bulkMessage, msgInterval, campaignImage, antiBanMode, setChats]); // Added setChats to dependencies

    if (step === 'LOGIN') {
        return (
            <div className="flex flex-col h-full bg-[#d1d7db] relative overflow-hidden font-sans">
                <div className="h-[220px] bg-[#00a884] w-full absolute top-0 left-0 z-0"></div>
                <div className="z-10 flex-1 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-[1000px] h-[70vh] flex overflow-hidden">
                        <div className="flex-1 p-12 flex flex-col justify-between">
                            <div>
                                <h1 className="text-3xl font-light text-[#41525d] mb-10">Usar WhatsApp en tu computadora</h1>
                                <ol className="text-lg text-[#3b4a54] space-y-5 list-decimal list-inside">
                                    <li>Abre WhatsApp en tu teléfono</li>
                                    <li>Toca <strong>Menú</strong> o <strong>Configuración</strong></li>
                                    <li>Vincula tu dispositivo escaneando el código</li>
                                </ol>
                            </div>
                            <div className="text-[#008069] font-medium cursor-pointer">¿Necesitas ayuda?</div>
                        </div>
                        <div className="w-[400px] flex items-center justify-center border-l border-gray-100">
                            <div className="relative group cursor-pointer" onClick={() => setStep('APP')}>
                                <div className="border-4 border-white shadow-sm p-2 bg-white"><QrCode size={260} className="text-[#111b21]"/></div>
                                <div className="absolute inset-0 flex items-center justify-center bg-[#111b21]/80 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="text-white text-center font-bold">CLICK PARA SIMULAR<br/>INICIO DE SESIÓN</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-200 overflow-hidden rounded-xl border border-slate-300 shadow-2xl relative">
            <div className="bg-[#dee1e6] px-4 py-2 flex items-center gap-3 border-b border-[#bdc1c6] shrink-0">
                <div className="flex gap-2 text-slate-500">
                    <ArrowLeft size={16} className="cursor-not-allowed opacity-50"/>
                    <ArrowRight size={16} className="cursor-not-allowed opacity-50"/>
                    <RotateCcw size={16} className="hover:text-slate-800 cursor-pointer"/>
                </div>
                <div className="flex-1 bg-white rounded-full px-4 py-1.5 flex items-center gap-2 border border-slate-300 text-xs text-slate-600 shadow-sm">
                    <Lock size={12} className="text-emerald-600"/>
                    <span className="flex-1">web.whatsapp.com</span>
                    <Globe size={12} className="opacity-0"/> 
                </div>
                <div className="flex gap-3 text-slate-600"><User size={16}/><MoreVertical size={16}/></div>
            </div>

            <div className="flex flex-1 overflow-hidden relative">
                <div className="w-[380px] flex flex-col border-r border-[#e9edef] bg-white h-full">
                    <div className="h-[60px] bg-[#f0f2f5] flex items-center justify-between px-4 shrink-0">
                        <div className="w-10 h-10 rounded-full bg-[#dfe3e5] flex items-center justify-center text-gray-500"><User size={24}/></div>
                        <div className="flex gap-6 text-[#54656f]"><Users size={20} /><MoreVertical size={20} /></div>
                    </div>
                    <div className="p-2 border-b border-[#f0f2f5]">
                        <div className="bg-[#f0f2f5] rounded-lg flex items-center px-4 py-2">
                            <Search size={18} className="text-[#54656f] mr-4"/>
                            <input type="text" placeholder="Busca un chat o inicia uno nuevo" className="bg-transparent text-sm w-full outline-none placeholder-[#54656f]"/>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto bg-white">
                        {chats.map(chat => (
                            <div key={chat.id} onClick={() => { setActiveChatId(chat.id); setChats(chats.map(c => c.id === chat.id ? {...c, unread: 0} : c)) }}
                                className={`flex items-center px-3 py-3 cursor-pointer hover:bg-[#f5f6f6] ${activeChatId === chat.id ? 'bg-[#f0f2f5]' : ''}`}>
                                <div className="w-12 h-12 rounded-full bg-[#dfe3e5] flex items-center justify-center text-gray-600 font-bold text-lg mr-3 shrink-0">{chat.avatar}</div>
                                <div className="flex-1 min-w-0 border-b border-[#f0f2f5] pb-3">
                                    <div className="flex justify-between items-baseline mb-1"><span className="text-[#111b21] font-normal text-base truncate">{chat.name}</span><span className="text-xs text-[#667781]">{chat.lastMessageTime}</span></div>
                                    <div className="flex justify-between items-center"><p className="text-sm text-[#667781] truncate pr-2">{chat.lastMessage}</p>{chat.unread > 0 && (<span className="bg-[#25d366] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">{chat.unread}</span>)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {activeChatId ? (
                    <div className="flex-1 flex flex-col bg-[#efeae2] relative">
                        <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")' }}></div>
                        {chatLoading && (
                            <div className="absolute inset-0 z-20 bg-[#efeae2] flex flex-col items-center justify-center">
                                <Loader2 size={48} className="text-[#00a884] animate-spin mb-4"/>
                                <span className="text-[#41525d] text-sm font-medium">Cargando mensajes...</span>
                                <div className="text-xs text-gray-400 mt-2 flex items-center gap-1"><Lock size={10}/> End-to-end encrypted</div>
                            </div>
                        )}
                        <div className="h-[60px] bg-[#f0f2f5] flex items-center justify-between px-4 shrink-0 z-10 border-b border-[#d1d7db]">
                            <div className="flex items-center"><div className="w-10 h-10 rounded-full bg-[#dfe3e5] flex items-center justify-center text-gray-600 font-bold mr-3">{chats.find(c => c.id === activeChatId)?.avatar}</div><div className="flex flex-col"><span className="text-[#111b21] font-normal">{chats.find(c => c.id === activeChatId)?.name}</span><span className="text-xs text-[#667781]">en línea</span></div></div>
                            <div className="flex gap-6 text-[#54656f]"><Search size={20}/><MoreVertical size={20}/></div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 space-y-2 z-10 scrollbar-thin">
                            {chats.find(c => c.id === activeChatId)?.messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[65%] rounded-lg shadow-sm text-sm relative overflow-hidden ${msg.sender === 'me' ? 'bg-[#d9fdd3] rounded-tr-none' : 'bg-white rounded-tl-none'}`}>
                                        {msg.image && <img src={msg.image} alt="Sent" className="w-full h-auto object-cover max-h-[300px]" />}
                                        <div className="px-2 py-1.5">
                                            {msg.text && <p className="text-[#111b21] leading-relaxed whitespace-pre-line">{msg.text}</p>}
                                            <div className="flex justify-end items-center gap-1 mt-1 select-none"><span className="text-[10px] text-[#667781]">{msg.time}</span>{msg.sender === 'me' && <CheckCheck size={14} className="text-[#53bdeb]"/>}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="min-h-[62px] bg-[#f0f2f5] px-4 py-2 flex items-center gap-2 z-10">
                            <Smile size={24} className="text-[#54656f] cursor-pointer"/>
                            <Paperclip size={24} className="text-[#54656f] cursor-pointer"/>
                            <div className="flex-1 bg-white rounded-lg py-2 px-4 mx-2"><input type="text" className="w-full text-sm outline-none placeholder-[#667781] text-[#111b21]" placeholder="Escribe un mensaje" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}/></div>
                            {inputText ? <Send size={24} className="text-[#54656f] cursor-pointer" onClick={handleSendMessage}/> : <Mic size={24} className="text-[#54656f] cursor-pointer"/>}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 bg-[#f0f2f5] flex items-center justify-center border-b-[6px] border-[#25d366]"><div className="text-center text-[#41525d]"><h1 className="text-3xl font-light mb-4">WhatsApp Web</h1><p className="text-sm">Envía y recibe mensajes sin necesidad de tener tu teléfono conectado.</p></div></div>
                )}

                {isExtensionOpen ? (
                    <div className="absolute right-4 top-4 bottom-4 w-80 bg-white shadow-2xl rounded-lg border border-gray-200 z-[999] flex flex-col animate-in slide-in-from-right-10 duration-300">
                        <div className="bg-emerald-600 p-4 rounded-t-lg text-white flex justify-between items-start shadow-md">
                            <div><h3 className="font-bold flex items-center gap-2"><Zap size={18} fill="currentColor"/> SapiSoft Sender</h3><p className="text-[10px] opacity-90">Extensión de Navegador v3.0</p></div>
                            <button onClick={() => setIsExtensionOpen(false)} className="hover:bg-white/20 p-1 rounded transition-colors"><X size={16}/></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-slate-50">
                            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Users size={12}/> Clientes</span>
                                <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded text-xs">{clients.length} cargados</span>
                            </div>
                            <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg flex items-center justify-between">
                                <div><p className="text-xs font-bold text-blue-700 flex items-center gap-1"><ShieldCheck size={12}/> Modo Anti-Bloqueo</p><p className="text-[10px] text-blue-500">Simula comportamiento humano</p></div>
                                <button onClick={() => setAntiBanMode(!antiBanMode)} className={`w-10 h-5 rounded-full relative transition-colors ${antiBanMode ? 'bg-blue-600' : 'bg-slate-300'}`}><div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${antiBanMode ? 'translate-x-5' : ''}`}></div></button>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-600 mb-1.5 block flex items-center gap-1"><ImageIcon size={12}/> Adjuntar Imagen (Opcional)</label>
                                <div className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors relative ${campaignImage ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 hover:border-emerald-400 bg-white'}`}>
                                    <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleImageUpload} ref={fileInputRef}/>
                                    {campaignImage ? (<div className="relative"><img src={campaignImage} alt="Preview" className="h-24 mx-auto rounded shadow-sm object-cover"/><button onClick={(e) => { e.preventDefault(); setCampaignImage(null); if(fileInputRef.current) fileInputRef.current.value=''; }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600"><X size={12}/></button></div>) : (<div className="text-slate-400"><Paperclip size={24} className="mx-auto mb-1"/><span className="text-[10px]">Click para subir imagen</span></div>)}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-600 mb-1.5 block">Mensaje Texto</label>
                                <textarea className="w-full p-3 border border-slate-300 rounded-lg text-xs h-24 focus:border-emerald-500 outline-none resize-none bg-white text-slate-700" value={bulkMessage} onChange={(e) => setBulkMessage(e.target.value)} placeholder="Hola {NOMBRE}..."></textarea>
                                <div className="flex gap-2 mt-1"><span className="cursor-pointer text-[9px] bg-slate-200 px-2 py-0.5 rounded text-slate-600 hover:bg-slate-300" onClick={() => setBulkMessage(prev => prev + ' {NOMBRE}')}>+ Nombre</span><span className="cursor-pointer text-[9px] bg-slate-200 px-2 py-0.5 rounded text-slate-600 hover:bg-slate-300" onClick={() => setBulkMessage(prev => prev + ' {DNI}')}>+ DNI</span></div>
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-1.5"><label className="text-xs font-bold text-slate-600">Intervalo</label><span className="text-xs font-bold text-emerald-600">{msgInterval}s {antiBanMode ? '(+Var)' : ''}</span></div>
                                <input type="range" min="2" max="10" className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500" value={msgInterval} onChange={(e) => setMsgInterval(Number(e.target.value))}/>
                            </div>
                            <div className="bg-black/90 rounded-lg p-3 h-24 overflow-y-auto font-mono text-[9px] text-green-400 border border-slate-700 shadow-inner">
                                {logs.length === 0 ? <span className="opacity-50">// Listo para iniciar...</span> : logs.map((l, i) => <div key={i}>{l}</div>)}
                                <div ref={logsEndRef}/>
                            </div>
                        </div>
                        <div className="p-4 bg-white border-t border-slate-200">
                            {isSending ? (
                                <button onClick={() => setIsSending(false)} className="w-full py-2.5 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2 text-sm animate-pulse"><Square size={14} fill="currentColor"/> DETENER</button>
                            ) : (
                                <button onClick={() => { setIsSending(true); setSendingProgress(0); setLogs([]); setCampaignStats({ sent: 0, failed: 0, startTime: Date.now(), endTime: 0 }); }} className="w-full py-2.5 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 text-sm shadow-lg shadow-emerald-200"><Play size={14} fill="currentColor"/> INICIAR CAMPAÑA</button>
                            )}
                            <div className="text-center mt-2"><span className="text-[10px] text-slate-400">{sendingProgress} / {clients.length}</span><div className="w-full bg-slate-100 h-1.5 mt-1 rounded-full overflow-hidden"><div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${(sendingProgress / clients.length) * 100}%` }}></div></div></div>
                        </div>
                    </div>
                ) : (
                    <button onClick={() => setIsExtensionOpen(true)} className="absolute right-0 top-1/2 -translate-y-1/2 bg-emerald-600 text-white p-3 rounded-l-xl shadow-xl z-40 hover:bg-emerald-700 transition-transform hover:-translate-x-1" title="Abrir SapiSoft Sender"><Zap size={20}/></button>
                )}
            </div>
        </div>
    );
};

export default WhatsAppModule;
