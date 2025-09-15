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

const OptimizedMenuItem = React.memo(({ item, onClick }: { item: MenuItem; onClick: (item: MenuItem) => void }) => {
    const hasDiscount = item.originalPrice && item.originalPrice > item.price;
    const discountPercent = hasDiscount ? Math.round(((item.originalPrice! - item.price) / item.originalPrice!) * 100) : 0;
    return (
        <motion.div
            className={`relative bg-gradient-to-br from-gray-800 to-gray-850/70 rounded-xl shadow-lg overflow-hidden border border-gray-700/40 transition-colors group ${item.available ? 'cursor-pointer hover:border-yellow-500/80 hover:shadow-glow' : 'opacity-60 cursor-not-allowed'}`}
            onClick={() => { if (item.available) onClick(item); }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
        >
            <div className="relative h-36 xs:h-40 md:h-44 overflow-hidden">
                {item.image && (
                    <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="(max-width: 640px) 100vw, 50vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        quality={75}
                    />
                )}
                {hasDiscount && (
                    <div className="absolute top-2 left-2 bg-green-500 text-gray-900 text-xs font-extrabold px-2 py-1 rounded shadow">
                        -{discountPercent}%
                    </div>
                )}
                {item.destaque && (
                    <div className="absolute top-2 right-2 bg-yellow-500/90 text-gray-900 text-[10px] font-bold px-2 py-1 rounded-full tracking-wide shadow-glow">
                        DESTAQUE
                    </div>
                )}
                {!item.available && (
                    <div className="absolute inset-0 backdrop-blur-[2px] bg-black/60 flex items-center justify-center">
                        <span className="text-red-300 font-bold text-xs md:text-sm bg-red-900/70 px-3 py-1 rounded-full border border-red-500/40 select-none">Indisponível</span>
                    </div>
                )}
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-yellow-500/0 via-yellow-500/60 to-yellow-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="p-3 md:p-4">
                <h3 className="font-semibold text-white text-sm md:text-base mb-1 line-clamp-2 group-hover:text-yellow-400 transition-colors">
                    {item.name || 'Nome não disponível'}
                </h3>
                {item.description && (
                    <p className="text-gray-400 text-[11px] md:text-xs mb-2 line-clamp-2">{item.description}</p>
                )}
                <div className="flex items-end gap-2 mt-2 md:mt-3">
                    <div className="text-yellow-400 font-bold text-base md:text-lg">
                        R$ {(() => {
                            const price = parseFloat(String(item.price || 0));
                            return price.toFixed(2).replace('.', ',');
                        })()}
                    </div>
                    {hasDiscount && (
                        <div className="text-gray-400 line-through text-xs font-medium">
                            R$ {item.originalPrice!.toFixed(2).replace('.', ',')}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
});
OptimizedMenuItem.displayName = 'OptimizedMenuItem';

export default function MenuDisplay() {
    const { isOpen: restaurantIsOpen } = useRestaurantStatus();
    const { items: cartItems, addToCart, clearCart } = useCart();
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [categories, setCategories] = useState<{ _id: string, name: string, emoji?: string, orderIndex?: number }[]>([]);
    const [settings, setSettings] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null); // Unificação: um único modal para todos os itens
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [isManualScrolling, setIsManualScrolling] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
    const [orderDetails, setOrderDetails] = useState<any>(null);
    const [sortOption, setSortOption] = useState<'nome' | 'preco-asc' | 'preco-desc'>('nome');
    const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
    const [showHighlights, setShowHighlights] = useState(true);
    const [showFilterSheet, setShowFilterSheet] = useState(false);
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
                
                if (menuData.success) {
                    // Filtrar itens com dados válidos
                    const validItems = menuData.data.filter((item: any) => 
                        item.name && 
                        typeof item.price === 'number' && 
                        !isNaN(item.price)
                    );
                    setMenuItems(validItems);
                }
                if (catData.success && catData.data.length > 0) {
                    const sorted = catData.data.sort((a: any, b: any) => (a.orderIndex || 0) - (b.orderIndex || 0));
                    setCategories(sorted);
                    if (!selectedCategory) setSelectedCategory(sorted[0]._id);
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
            // Estrutura do endereço corrigida aqui
            const pedidoParaAPI = {
                itens: details.items.map((item: any) => ({ 
                    nome: item.name, quantidade: item.quantity, preco: item.price,
                    observacao: item.observation, size: item.size, border: item.border, extras: item.extras 
                })),
                total: details.total, 
                tipoEntrega: details.tipoEntrega, 
                // A estrutura do 'endereco' agora é aninhada e inclui a taxa de entrega
                endereco: details.tipoEntrega === 'entrega' ? {
                    address: details.address,
                    deliveryFee: details.deliveryFee,
                    estimatedTime: "30-45 min" // Você pode ajustar isso se necessário
                } : undefined, 
                cliente: details.cliente, 
                observacoes: details.observacoes, 
                formaPagamento: details.formaPagamento, 
                troco: details.formaPagamento === 'dinheiro' ? details.troco : undefined
            };

            const response = await fetch('/api/pedidos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pedidoParaAPI) });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Falha ao registrar o pedido.');
            
            setOrderDetails(details);
            setShowWhatsAppModal(true);
            clearCart();
        } catch (error) { 
            console.error("Erro no checkout:", error); 
            alert("Houve um erro ao enviar seu pedido."); 
        }
    };
    
    const isSearching = useMemo(() => searchQuery.trim().length > 0, [searchQuery]);
    const processedItems = useMemo(() => {
        let items = [...menuItems];
        // Filtrar apenas disponíveis se marcado
        if (showOnlyAvailable) items = items.filter(i => i.available !== false);
        // Ordenação
        items.sort((a, b) => {
            switch (sortOption) {
                case 'preco-asc': return (a.price || 0) - (b.price || 0);
                case 'preco-desc': return (b.price || 0) - (a.price || 0);
                case 'nome':
                default:
                    return (a.name || '').localeCompare(b.name || '', 'pt-BR', { sensitivity: 'base' });
            }
        });
        return items;
    }, [menuItems, sortOption, showOnlyAvailable]);

    const highlights = useMemo(() => processedItems.filter(i => i.destaque), [processedItems]);

    const itemsByCategory = useMemo(() => {
        // Remover duplicatas baseado no nome do item
        const uniqueItems = processedItems.filter((item, index, self) =>
            index === self.findIndex(i => i.name === item.name)
        );
        return uniqueItems.reduce((acc, item) => {
            const catId = item.category.toString();
            if (!acc[catId]) acc[catId] = [];
            acc[catId].push(item);
            return acc;
        }, {} as Record<string, MenuItem[]>);
    }, [processedItems]);
    const filteredItemsByCategory = useMemo(() => { if (!isSearching) return itemsByCategory; const q = searchQuery.trim().toLowerCase(); const filtered: Record<string, MenuItem[]> = {}; Object.keys(itemsByCategory).forEach(catId => { const matches = itemsByCategory[catId].filter(it => it.name?.toLowerCase().includes(q) || it.description?.toLowerCase().includes(q)); if (matches.length > 0) filtered[catId] = matches; }); return filtered; }, [isSearching, searchQuery, itemsByCategory]);
    const displayCategories = useMemo(() => { const source = isSearching ? filteredItemsByCategory : itemsByCategory; return categories.filter(cat => source[cat._id] && source[cat._id].length > 0); }, [categories, itemsByCategory, filteredItemsByCategory, isSearching]);
    
    const handleItemClick = useCallback((item: MenuItem) => {
        // Agora qualquer item abre o mesmo modal moderno
        setSelectedItem(item);
    }, []);
    
    const handleCategoryClick = useCallback((catId: string) => { setIsManualScrolling(true); setSelectedCategory(catId); const el = categorySectionRefs.current[catId]; if (el) { const headerHeight = (document.querySelector('.sticky-header') as HTMLElement)?.offsetHeight || 120; const elPos = el.getBoundingClientRect().top + window.scrollY; const offset = elPos - headerHeight - 16; window.scrollTo({ top: offset, behavior: 'smooth' }); if (manualScrollTimeoutRef.current) clearTimeout(manualScrollTimeoutRef.current); manualScrollTimeoutRef.current = setTimeout(() => setIsManualScrolling(false), 1000); } }, []);
    
    useEffect(() => { if (isManualScrolling || displayCategories.length === 0) return; const obs = new IntersectionObserver((entries) => { if (isManualScrolling) return; const visible = entries.filter(e => e.isIntersecting); if (visible.length > 0) { visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top); const catId = visible[0].target.id.replace('category-', ''); setSelectedCategory(catId); } }, { rootMargin: '-140px 0px -40% 0px', threshold: 0.1 }); displayCategories.forEach(cat => { const el = document.getElementById(`category-${cat._id}`); if (el) obs.observe(el); }); return () => obs.disconnect(); }, [displayCategories, isManualScrolling]);
    
    useEffect(() => { if (!selectedCategory || !categoryBarRef.current) return; const btn = categoryButtonRefs.current[selectedCategory]; const cont = categoryBarRef.current; if (btn && cont) { const contWidth = cont.offsetWidth; const btnWidth = btn.offsetWidth; const btnLeft = btn.offsetLeft; const scroll = btnLeft - (contWidth / 2) + (btnWidth / 2); cont.scrollTo({ left: scroll, behavior: 'smooth' }); } }, [selectedCategory]);

    const handleWhatsAppClick = () => {
        if (!orderDetails || !settings) {
            alert("Erro: Detalhes do pedido ou configurações não encontrados.");
            return;
        }
        
        const whatsappNumber = settings.establishmentInfo?.contact?.whatsapp?.replace(/\D/g, '');
        if (!whatsappNumber) {
            alert("O número de WhatsApp não foi configurado no painel de configurações.");
            return;
        }

        const { 
            cliente, 
            address, 
            tipoEntrega, 
            items, 
            total, 
            formaPagamento, 
            troco, 
            deliveryFee,
            observacoes
        } = orderDetails || {};

        // --- Construção dos Itens ---
        const itemsText = items.map((item: any) => {
            let itemDetails = `*${item.quantity}x ${item.name}*`;
            if (item.size) itemDetails += ` (${item.size})`;
            if (item.border) itemDetails += `\n  - _Borda: ${item.border}_`;
            if (item.extras && item.extras.length > 0) itemDetails += `\n  - _Sabores: ${item.extras.join(', ')}_`;
            if (item.observation) itemDetails += `\n  - _Obs: ${item.observation}_`;
            return itemDetails;
        }).join('\n\n');

        // --- Construção da Entrega ---
        let deliveryText = `*Tipo:* ${tipoEntrega === 'entrega' ? 'ENTREGA' : 'RETIRADA'}`;
        if (tipoEntrega === 'entrega' && address) {
            deliveryText += `\n*Bairro:* ${address.neighborhood || 'Não informado'}`;
            deliveryText += `\n*Endereço:* ${address.street}, ${address.number}`;
            if (address.complement) deliveryText += `\n*Complemento:* ${address.complement}`;
            if (address.referencePoint) deliveryText += `\n*Ponto de Ref.:* ${address.referencePoint}`;
        }
        
        // --- Construção do Pagamento ---
        const subtotal = total - (deliveryFee || 0);
        let paymentText = `*Subtotal:* R$ ${subtotal.toFixed(2)}`;
        if (deliveryFee > 0) {
            paymentText += `\n*Taxa de Entrega:* R$ ${deliveryFee.toFixed(2)}`;
        }
        paymentText += `\n*TOTAL A PAGAR: R$ ${total.toFixed(2)}*`;
        paymentText += `\n\n*Forma de Pagamento:* ${formaPagamento.toUpperCase()}`;
        
        if (formaPagamento === 'dinheiro' && troco) {
            paymentText += `\n*Troco para:* R$ ${troco}`;
        }

        const pixKey = settings.establishmentInfo?.pixKey;
        if (formaPagamento === 'pix' && pixKey) {
            paymentText += `\n🔑 *CHAVE PIX:* ${pixKey}\n_Por favor, envie o comprovante._`;
        }

        // --- Montagem da Mensagem Final ---
        const message = `*🍔 NOVO PEDIDO - REI DOS SALGADOS 🍔*\n\n` +
                        `-----------------------------------\n` +
                        `*👤 DADOS DO CLIENTE*\n` +
                        `*Nome:* ${cliente.nome}\n` +
                        `*Telefone:* ${cliente.telefone}\n\n` +
                        `-----------------------------------\n` +
                        `*🛵 DADOS DA ENTREGA*\n` +
                        `${deliveryText}\n\n` +
                        `-----------------------------------\n` +
                        `*📋 ITENS DO PEDIDO*\n\n` +
                        `${itemsText}\n\n` +
                        `-----------------------------------\n` +
                        `${observacoes ? `*📝 OBSERVAÇÕES GERAIS*\n_${observacoes}_\n\n-----------------------------------\n` : ''}` +
                        `*💰 PAGAMENTO E TOTAIS*\n` +
                        `${paymentText}`;

        window.open(`https://wa.me/55${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
        setShowWhatsAppModal(false);
    };

    if (isLoading) return (
        <div className="min-h-screen bg-gray-900">
            <div className="max-w-7xl mx-auto p-4 animate-pulse">
                <div className="h-10 bg-gray-800 rounded w-full mb-6" />
                <div className="flex gap-3 overflow-x-hidden mb-8">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-9 w-28 bg-gray-800 rounded-full" />
                    ))}
                </div>
                <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700/40">
                            <div className="h-40 bg-gray-700/40" />
                            <div className="p-4 space-y-3">
                                <div className="h-4 bg-gray-700 rounded w-3/4" />
                                <div className="h-3 bg-gray-700/70 rounded w-full" />
                                <div className="h-3 bg-gray-700/50 rounded w-2/3" />
                                <div className="h-6 bg-gray-700 rounded w-24 mt-4" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
    if (!restaurantIsOpen) return <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4"><div className="text-center max-w-md mx-auto"><div className="bg-gray-800 rounded-2xl shadow-2xl border border-yellow-500/30 p-8"><div className="mb-6"><h2 className="text-2xl font-bold text-yellow-500 mb-3">Estabelecimento Fechado</h2></div></div></div></div>;

    return (
        <div className="min-h-screen bg-gray-900">
            <div className="max-w-7xl mx-auto">
                <div className="sticky top-0 z-30 bg-gray-900/80 backdrop-blur-lg border-b border-gray-700/50 sticky-header">
                    <div className="p-4 space-y-3">
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                type="search"
                                placeholder="Buscar no cardápio..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-gray-800 text-white rounded-lg pl-10 pr-4 py-2 border border-gray-700 focus:ring-2 focus:ring-yellow-500 outline-none"
                            />
                            <button
                                onClick={() => setShowFilterSheet(true)}
                                className="sm:hidden absolute right-2 top-1/2 -translate-y-1/2 text-xs bg-yellow-500 text-gray-900 font-semibold px-3 py-1 rounded-md shadow focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            >Filtros</button>
                        </div>
                        <div className="hidden sm:flex flex-wrap gap-3 items-center text-xs sm:text-sm">
                            <div className="flex items-center gap-2 bg-gray-800/70 px-3 py-2 rounded-lg border border-gray-700">
                                <label className="font-medium text-gray-300">Ordenar:</label>
                                <select
                                    value={sortOption}
                                    onChange={e => setSortOption(e.target.value as any)}
                                    className="bg-gray-900 text-white rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-yellow-500"
                                >
                                    <option value="nome">Nome (A-Z)</option>
                                    <option value="preco-asc">Preço (Menor)</option>
                                    <option value="preco-desc">Preço (Maior)</option>
                                </select>
                            </div>
                            <label className="flex items-center gap-2 bg-gray-800/70 px-3 py-2 rounded-lg border border-gray-700 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={showOnlyAvailable}
                                    onChange={e => setShowOnlyAvailable(e.target.checked)}
                                    className="form-checkbox h-4 w-4 text-yellow-500 rounded border-gray-600"
                                />
                                <span className="text-gray-300">Só disponíveis</span>
                            </label>
                            {highlights.length > 0 && (
                                <label className="flex items-center gap-2 bg-gray-800/70 px-3 py-2 rounded-lg border border-gray-700 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={showHighlights}
                                        onChange={e => setShowHighlights(e.target.checked)}
                                        className="form-checkbox h-4 w-4 text-yellow-500 rounded border-gray-600"
                                    />
                                    <span className="text-gray-300">Ver destaques</span>
                                </label>
                            )}
                        </div>
                    </div>
                    <div className="relative px-4 pb-3">
                        {/* Gradientes laterais */}
                        <div className="pointer-events-none absolute left-0 top-0 h-full w-6 bg-gradient-to-r from-gray-900 to-transparent" />
                        <div className="pointer-events-none absolute right-0 top-0 h-full w-6 bg-gradient-to-l from-gray-900 to-transparent" />
                        <div ref={categoryBarRef} className="flex space-x-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-pl-4">
                            {displayCategories.map(cat => (
                                <button
                                    key={cat._id}
                                    ref={(el) => { categoryButtonRefs.current[cat._id] = el; }}
                                    onClick={() => handleCategoryClick(cat._id)}
                                    className={`relative px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-300 whitespace-nowrap flex items-center gap-2 border border-gray-700/60 snap-start ${selectedCategory === cat._id ? 'text-gray-900' : 'text-gray-300 hover:text-white'}`}
                                >
                                    {selectedCategory === cat._id && (
                                        <motion.div
                                            layoutId="category-pill"
                                            className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 shadow-glow"
                                            style={{ zIndex: -1 }}
                                            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                                        />
                                    )}
                                    <span className="relative z-10">{cat.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <main className="p-4">
                    <div className="space-y-12">
                        {showHighlights && highlights.length > 0 && (
                            <section>
                                <h2 className="text-2xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
                                    <span className="inline-block w-2 h-8 bg-yellow-500 rounded" /> Destaques
                                </h2>
                                <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                                    {highlights.map(item => (
                                        <OptimizedMenuItem key={item._id || item.name} item={item} onClick={handleItemClick} />
                                    ))}
                                </div>
                            </section>
                        )}
                        {displayCategories.map(cat => {
                            const items = filteredItemsByCategory[cat._id] || [];
                            return (
                                <section key={cat._id} id={`category-${cat._id}`} ref={(el) => { categorySectionRefs.current[cat._id] = el; }}>
                                    <h2 className="text-2xl font-bold text-white mb-4 border-l-4 border-yellow-500 pl-3">{cat.name}</h2>
                                    <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                                        {items.map(item => (
                                            <OptimizedMenuItem key={item._id || item.name} item={item} onClick={handleItemClick} />
                                        ))}
                                    </div>
                                </section>
                            );
                        })}
                    </div>
                </main>
            </div>
            <AnimatePresence>
                {selectedItem && (
                    <ItemModal
                        item={selectedItem}
                        onClose={() => setSelectedItem(null)}
                        onAddToCart={(q, o, s, b, e) => {
                            addToCart(selectedItem, q, o, s, b, e);
                            setSelectedItem(null);
                        }}
                        allPizzas={menuItems.filter(i => i.category.toString().includes('pizza'))}
                    />
                )}
            </AnimatePresence>
            {/* Modais antigos (MiniItemModal, PastaModal) removidos após unificação */}
            {cartItems.length > 0 && (<div className="fixed bottom-6 right-6 z-40"><motion.button onClick={() => setIsCartOpen(true)} className="w-16 h-16 bg-yellow-500 text-gray-900 rounded-full flex items-center justify-center shadow-lg" initial={{ scale: 0 }} animate={{ scale: 1 }}><FaShoppingCart size={24} /><span className="absolute -top-1 -right-1 bg-gray-900 text-yellow-500 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-yellow-500">{cartItems.reduce((t, i) => t + i.quantity, 0)}</span></motion.button></div>)}
            <AnimatePresence>{isCartOpen && <Cart onClose={() => setIsCartOpen(false)} onCheckout={handleCheckout} />}</AnimatePresence>
            <AnimatePresence>{showWhatsAppModal && (<motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-70"><motion.div className="bg-gray-800 rounded-lg shadow-xl p-6 max-w-sm w-full mx-4"><h2 className="text-xl font-bold text-yellow-500 mb-4">Pedido Enviado!</h2><p className="text-gray-300 mb-6">Seu pedido foi registrado. Clique abaixo para confirmar via WhatsApp.</p><button onClick={handleWhatsAppClick} className="w-full flex items-center justify-center gap-2 bg-green-500 text-white font-bold py-3 rounded-lg hover:bg-green-600"><FaWhatsapp /> Enviar para WhatsApp</button><button onClick={() => setShowWhatsAppModal(false)} className="w-full mt-2 bg-gray-700 text-gray-300 font-bold py-3 rounded-lg hover:bg-gray-600">Fechar</button></motion.div></motion.div>)}</AnimatePresence>
            {/* Bottom Sheet Filtros Mobile */}
            <AnimatePresence>
                {showFilterSheet && (
                    <motion.div
                        className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-[2px] sm:hidden"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowFilterSheet(false)}
                    >
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                            className="bg-gray-800 rounded-t-2xl p-5 pb-8 shadow-2xl border-t border-gray-700"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="w-12 h-1.5 bg-gray-600 rounded-full mx-auto mb-4" />
                            <h3 className="text-yellow-400 font-semibold text-sm mb-4 tracking-wide">Filtros e Ordenação</h3>
                            <div className="space-y-5 text-xs">
                                <div className="space-y-2">
                                    <label className="block text-gray-300 font-medium">Ordenar por</label>
                                    <select
                                        value={sortOption}
                                        onChange={e => setSortOption(e.target.value as any)}
                                        className="w-full bg-gray-900 text-white rounded-md px-3 py-2 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-yellow-500"
                                    >
                                        <option value="nome">Nome (A-Z)</option>
                                        <option value="preco-asc">Preço (Menor)</option>
                                        <option value="preco-desc">Preço (Maior)</option>
                                    </select>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <label className="flex items-center gap-3 bg-gray-900 px-3 py-2 rounded-lg border border-gray-700 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={showOnlyAvailable}
                                            onChange={e => setShowOnlyAvailable(e.target.checked)}
                                            className="form-checkbox h-4 w-4 text-yellow-500 rounded border-gray-600"
                                        />
                                        <span className="text-gray-300 text-sm">Só disponíveis</span>
                                    </label>
                                    {highlights.length > 0 && (
                                        <label className="flex items-center gap-3 bg-gray-900 px-3 py-2 rounded-lg border border-gray-700 cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                checked={showHighlights}
                                                onChange={e => setShowHighlights(e.target.checked)}
                                                className="form-checkbox h-4 w-4 text-yellow-500 rounded border-gray-600"
                                            />
                                            <span className="text-gray-300 text-sm">Mostrar destaques</span>
                                        </label>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => setShowFilterSheet(false)}
                                className="mt-6 w-full bg-yellow-500 text-gray-900 font-bold py-3 rounded-lg shadow hover:bg-yellow-400 active:scale-[0.98] transition"
                            >Aplicar</button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}