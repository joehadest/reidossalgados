// src/components/MenuDisplay.tsx

'use client';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRestaurantStatus } from '@/contexts/RestaurantStatusContext';
import ItemModal from './ItemModal';
import Cart from './Cart';
import { MenuItem } from '@/types/menu';
import Image from 'next/image';
import { FaShoppingCart, FaWhatsapp, FaSearch } from 'react-icons/fa';
import { useCart } from '../contexts/CartContext';
import PastaModal from './PastaModal';
import MiniItemModal from './MiniItemModal';

const OptimizedMenuItem = React.memo(({ item, onClick }: { item: MenuItem; onClick: (item: MenuItem) => void }) => (
    <motion.div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden cursor-pointer border border-transparent hover:border-yellow-500 transition-colors group" onClick={() => onClick(item)} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.3, ease: "easeOut" }}>
        <div className="relative h-40 overflow-hidden">
            {item.image && <Image src={item.image} alt={item.name} fill sizes="(max-width: 640px) 100vw, 50vw" className="object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" quality={75} />}
            {!item.available && <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center"><span className="text-red-400 font-bold text-sm bg-red-900/80 px-2 py-1 rounded">Indisponível</span></div>}
        </div>
        <div className="p-4">
            <h3 className="font-bold text-white text-lg mb-1 truncate">{item.name}</h3>
            {item.description && <p className="text-gray-400 text-sm mb-2 line-clamp-2">{item.description}</p>}
            <div className="flex justify-between items-center mt-3"><span className="text-yellow-500 font-bold text-lg">R$ {(item.price || 0).toFixed(2).replace('.', ',')}</span></div>
        </div>
    </motion.div>
));
OptimizedMenuItem.displayName = 'OptimizedMenuItem';

export default function MenuDisplay() {
    const { isOpen: restaurantIsOpen } = useRestaurantStatus();
    const { items: cartItems, addToCart, clearCart } = useCart();
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [categories, setCategories] = useState<{ _id: string, name: string, emoji?: string, orderIndex?: number }[]>([]);
    const [settings, setSettings] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
    const [selectedPasta, setSelectedPasta] = useState<MenuItem | null>(null);
    const [miniModalItem, setMiniModalItem] = useState<MenuItem | null>(null);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [isManualScrolling, setIsManualScrolling] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
    const [orderDetails, setOrderDetails] = useState<any>(null);
    const categorySectionRefs = useRef<Record<string, HTMLElement | null>>({});
    const categoryButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
    const categoryBarRef = useRef<HTMLDivElement | null>(null);
    const manualScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const [menuRes, catRes, settingsRes] = await Promise.all([fetch('/api/menu'), fetch('/api/categories'), fetch('/api/settings')]);
                const menuData = await menuRes.json();
                const catData = await catRes.json();
                const settingsData = await settingsRes.json();
                if (menuData.success) setMenuItems(menuData.data);
                if (catData.success && catData.data.length > 0) {
                    const sortedCategories = catData.data.sort((a: any, b: any) => (a.orderIndex || 0) - (b.orderIndex || 0));
                    setCategories(sortedCategories);
                    if (!selectedCategory) setSelectedCategory(sortedCategories[0]._id);
                }
                if (settingsData.success) setSettings(settingsData.data);
            } catch (error) { console.error("Falha ao buscar dados:", error); }
            finally { setIsLoading(false); }
        }
        fetchData();
    }, []);

    const handleCheckout = async (details: any) => {
        setIsCartOpen(false);
        try {
            // Estruturar corretamente os dados do endereço
            let endereco = undefined;
            if (details.tipoEntrega === 'entrega' && details.address) {
                endereco = {
                    address: {
                        street: details.address.street,
                        number: details.address.number,
                        complement: details.address.complement,
                        neighborhood: details.address.neighborhood,
                        referencePoint: details.address.referencePoint
                    },
                    deliveryFee: details.deliveryFee || 0,
                    estimatedTime: '30-45 minutos'
                };
            }

            const pedidoParaAPI = {
                itens: details.itens.map((item: any) => ({ 
                    nome: item.name, 
                    quantidade: item.quantity, 
                    preco: item.price, 
                    observacao: item.observation, 
                    size: item.size, 
                    border: item.border, 
                    extras: item.extras 
                })),
                total: details.total, 
                tipoEntrega: details.tipoEntrega, 
                endereco: endereco, 
                cliente: details.cliente, 
                observacoes: details.observacoes, 
                formaPagamento: details.formaPagamento, 
                troco: details.formaPagamento === 'dinheiro' ? details.troco : undefined,
                status: 'pendente',
                data: new Date().toISOString()
            };
            
            console.log('Dados do pedido sendo enviados:', pedidoParaAPI);
            
            const response = await fetch('/api/pedidos', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify(pedidoParaAPI) 
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Falha ao registrar o pedido.');
            setOrderDetails(details);
            setShowWhatsAppModal(true);
            clearCart();
        } catch (error) { 
            console.error("Erro no checkout:", error); 
            alert("Houve um erro ao enviar seu pedido. Tente novamente."); 
        }
    };

    const isSearching = useMemo(() => searchQuery.trim().length > 0, [searchQuery]);
    const itemsByCategory = useMemo(() => menuItems.reduce((acc, item) => { const catId = item.category.toString(); if (!acc[catId]) acc[catId] = []; acc[catId].push(item); return acc; }, {} as Record<string, MenuItem[]>), [menuItems]);
    const filteredItemsByCategory = useMemo(() => { if (!isSearching) return itemsByCategory; const q = searchQuery.trim().toLowerCase(); const filtered: Record<string, MenuItem[]> = {}; Object.keys(itemsByCategory).forEach(catId => { const matches = itemsByCategory[catId].filter(it => it.name?.toLowerCase().includes(q) || it.description?.toLowerCase().includes(q)); if (matches.length > 0) filtered[catId] = matches; }); return filtered; }, [isSearching, searchQuery, itemsByCategory]);
    const displayCategories = useMemo(() => { const source = isSearching ? filteredItemsByCategory : itemsByCategory; return categories.filter(cat => source[cat._id] && source[cat._id].length > 0); }, [categories, itemsByCategory, filteredItemsByCategory, isSearching]);
    const handleItemClick = useCallback((item: MenuItem) => { const catName = categories.find(c => c._id === item.category.toString())?.name.toLowerCase() || ''; if (catName.includes('pizza')) setSelectedItem(item); else if (catName.includes('massa')) setSelectedPasta(item); else setMiniModalItem(item); }, [categories]);
    const handleCategoryClick = useCallback((catId: string) => { setIsManualScrolling(true); setSelectedCategory(catId); const el = categorySectionRefs.current[catId]; if (el) { const headerHeight = (document.querySelector('.sticky-header') as HTMLElement)?.offsetHeight || 120; const elPos = el.getBoundingClientRect().top + window.scrollY; const offset = elPos - headerHeight - 16; window.scrollTo({ top: offset, behavior: 'smooth' }); if (manualScrollTimeoutRef.current) clearTimeout(manualScrollTimeoutRef.current); manualScrollTimeoutRef.current = setTimeout(() => setIsManualScrolling(false), 1000); } }, []);
    useEffect(() => { if (isManualScrolling || displayCategories.length === 0) return; const obs = new IntersectionObserver((entries) => { if (isManualScrolling) return; const visible = entries.filter(e => e.isIntersecting); if (visible.length > 0) { visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top); const catId = visible[0].target.id.replace('category-', ''); setSelectedCategory(catId); } }, { rootMargin: '-140px 0px -40% 0px', threshold: 0.1 }); displayCategories.forEach(cat => { const el = document.getElementById(`category-${cat._id}`); if (el) obs.observe(el); }); return () => obs.disconnect(); }, [displayCategories, isManualScrolling]);
    useEffect(() => { if (!selectedCategory || !categoryBarRef.current) return; const btn = categoryButtonRefs.current[selectedCategory]; const cont = categoryBarRef.current; if (btn && cont) { const contWidth = cont.offsetWidth; const btnWidth = btn.offsetWidth; const btnLeft = btn.offsetLeft; const scroll = btnLeft - (contWidth / 2) + (btnWidth / 2); cont.scrollTo({ left: scroll, behavior: 'smooth' }); } }, [selectedCategory]);

    const handleWhatsAppClick = () => { /* ... sua lógica de abrir whatsapp ... */ };

    if (isLoading) {
        return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Carregando Cardápio...</div>;
    }

    if (!restaurantIsOpen) {
        return <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4"><div className="text-center max-w-md mx-auto"><div className="bg-gray-800 rounded-2xl shadow-2xl border border-yellow-500/30 p-8"><div className="mb-6"><div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4"><svg className="w-8 h-8 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div><h2 className="text-2xl font-bold text-yellow-500 mb-3">Estabelecimento Fechado</h2><p className="text-gray-300 text-lg">Desculpe, estamos fechados no momento.</p></div></div></div></div>;
    }

    return (
        <div className="min-h-screen bg-gray-900">
            <div className="max-w-7xl mx-auto">
                <div className="sticky top-0 z-30 bg-gray-900/80 backdrop-blur-lg border-b border-gray-700/50 sticky-header">
                    <div className="p-4"><input type="search" placeholder="Buscar no cardápio..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-gray-800 text-white rounded-lg px-4 py-2 border border-gray-700 focus:ring-2 focus:ring-yellow-500 outline-none" /></div>
                    <div className="relative px-4 pb-3">
                        <div ref={categoryBarRef} className="flex space-x-2 overflow-x-auto scrollbar-hide">
                            {displayCategories.map(cat => (
                                <button key={cat._id} ref={(el) => { categoryButtonRefs.current[cat._id] = el; }} onClick={() => handleCategoryClick(cat._id)} className={`relative px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-300 whitespace-nowrap ${selectedCategory === cat._id ? 'text-gray-900' : 'text-gray-300 hover:text-white'}`}>
                                    {selectedCategory === cat._id && (<motion.div layoutId="category-pill" className="absolute inset-0 bg-yellow-500 rounded-full" style={{ zIndex: -1 }} transition={{ type: 'spring', stiffness: 350, damping: 30 }} />)}
                                    <span className="relative z-10">{cat.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <main className="p-4">
                    <div className="space-y-12">
                        {displayCategories.map(cat => {
                            const items = filteredItemsByCategory[cat._id] || [];
                            return (
                                <section key={cat._id} id={`category-${cat._id}`} ref={(el) => { categorySectionRefs.current[cat._id] = el; }}>
                                    <h2 className="text-2xl font-bold text-white mb-4 border-l-4 border-yellow-500 pl-3">{cat.name}</h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {items.map(item => (<OptimizedMenuItem key={item._id} item={item} onClick={handleItemClick} />))}
                                    </div>
                                </section>
                            );
                        })}
                    </div>
                </main>
            </div>
            <AnimatePresence>{selectedItem && <ItemModal item={selectedItem} onClose={() => setSelectedItem(null)} onAddToCart={(q, o, s, b, e) => { addToCart(selectedItem, q, o, s, b, e); setSelectedItem(null); }} allPizzas={menuItems.filter(i => i.category.toString().includes('pizza'))} />}</AnimatePresence>
            <AnimatePresence>{selectedPasta && <PastaModal item={selectedPasta} onClose={() => setSelectedPasta(null)} onAddToCart={(q, o, s) => { addToCart(selectedPasta, q, o, s); setSelectedPasta(null); }} />}</AnimatePresence>
            <AnimatePresence>{miniModalItem && <MiniItemModal item={miniModalItem} onClose={() => setMiniModalItem(null)} onAdd={(q, o, e) => { addToCart(miniModalItem, q, o, undefined, undefined, e); setMiniModalItem(null); }} categories={categories} />}</AnimatePresence>
            {cartItems.length > 0 && (<div className="fixed bottom-6 right-6 z-40"><motion.button onClick={() => setIsCartOpen(true)} className="w-16 h-16 bg-yellow-500 text-gray-900 rounded-full flex items-center justify-center shadow-lg" initial={{ scale: 0 }} animate={{ scale: 1 }}><FaShoppingCart size={24} /><span className="absolute -top-1 -right-1 bg-gray-900 text-yellow-500 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-yellow-500">{cartItems.reduce((t, i) => t + i.quantity, 0)}</span></motion.button></div>)}
            <AnimatePresence>{isCartOpen && <Cart onClose={() => setIsCartOpen(false)} onCheckout={handleCheckout} />}</AnimatePresence>
            <AnimatePresence>{showWhatsAppModal && (<motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-70"><motion.div className="bg-gray-800 rounded-lg shadow-xl p-6 max-w-sm w-full mx-4"><h2 className="text-xl font-bold text-yellow-500 mb-4">Pedido Enviado!</h2><p className="text-gray-300 mb-6">Seu pedido foi registrado. Clique abaixo para confirmar via WhatsApp.</p><button onClick={handleWhatsAppClick} className="w-full flex items-center justify-center gap-2 bg-green-500 text-white font-bold py-3 rounded-lg hover:bg-green-600"><FaWhatsapp /> Enviar para WhatsApp</button><button onClick={() => setShowWhatsAppModal(false)} className="w-full mt-2 bg-gray-700 text-gray-300 font-bold py-3 rounded-lg hover:bg-gray-600">Fechar</button></motion.div></motion.div>)}</AnimatePresence>
        </div>
    );
}