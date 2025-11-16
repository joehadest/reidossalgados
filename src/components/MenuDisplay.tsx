// src/components/MenuDisplay.tsx

'use client';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useRestaurantStatus } from '@/contexts/RestaurantStatusContext';
import ItemModal from './ItemModal';
import Cart from './Cart';
import { MenuItem } from '@/types/menu';
import Image from 'next/image';
import { FaShoppingCart, FaWhatsapp } from 'react-icons/fa';
import { useCart } from '../contexts/CartContext';
import { useMenu } from '@/contexts/MenuContext';
import SearchBar from './SearchBar';

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
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 25vw"
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
    const { filter } = useMenu();
    const { isOpen: restaurantIsOpen } = useRestaurantStatus();
    const { items: cartItems, addToCart, clearCart } = useCart();
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [categories, setCategories] = useState<{ _id: string, name: string, emoji?: string, orderIndex?: number }[]>([]);
    const [settings, setSettings] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [isManualScrolling, setIsManualScrolling] = useState(false);
    // busca movida para o contexto (MenuContext)
    const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
    const [orderDetails, setOrderDetails] = useState<any>(null);
    const [sortOption, setSortOption] = useState<'nome' | 'preco-asc' | 'preco-desc'>('nome');
    const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
    const [showHighlights, setShowHighlights] = useState(true);
    const [showFilterSheet, setShowFilterSheet] = useState(false);
    const categorySectionRefs = useRef<Record<string, HTMLElement | null>>({});
    const categoryButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
    const categoryLabelRefs = useRef<Record<string, HTMLSpanElement | null>>({});
    const categoryBarRef = useRef<HTMLDivElement | null>(null);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const scrollRafRef = useRef<number | null>(null);
    const lastScrollYRef = useRef<number>(0);
    const lastScrollTsRef = useRef<number>(0);
    const fastUntilTsRef = useRef<number>(0);
    const stabilizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingCategoryRef = useRef<string | null>(null);
    const prefersReducedMotion = useReducedMotion();

    // Indicador sublinhado animado (acompanha o botão ativo)
    const [indicator, setIndicator] = useState<{ left: number; width: number }>({ left: 0, width: 0 });
    const [indicatorReady, setIndicatorReady] = useState(false);
    const [showLeftFade, setShowLeftFade] = useState(false);
    const [showRightFade, setShowRightFade] = useState(false);

    const updateScrollFades = useCallback(() => {
        const cont = categoryBarRef.current;
        if (!cont) return;
        const atStart = cont.scrollLeft <= 2;
        const atEnd = cont.scrollLeft + cont.clientWidth >= cont.scrollWidth - 2;
        setShowLeftFade(!atStart);
        setShowRightFade(!atEnd);
    }, []);

    const measureIndicator = useCallback(() => {
        if (!selectedCategory) return;
        const cont = categoryBarRef.current;
        const btn = categoryButtonRefs.current[selectedCategory];
        const label = categoryLabelRefs.current[selectedCategory];
        if (!cont || !btn) return;
        // Preferir a largura/posição do texto (label) para maior precisão visual
        let left = btn.offsetLeft - cont.scrollLeft;
        let width = Math.max(btn.offsetWidth, 16);
        if (label) {
            left = btn.offsetLeft + label.offsetLeft - cont.scrollLeft;
            width = Math.max(label.offsetWidth + 10, 16); // acolchoar 10px no total
        }
        setIndicator({ left, width });
    }, [selectedCategory]);

    useEffect(() => {
        async function fetchData() {
            try {
                const [menuRes, catRes, settingsRes] = await Promise.all([fetch('/api/menu'), fetch('/api/categories'), fetch('/api/settings')]);
                const menuData = await menuRes.json();
                const catData = await catRes.json();
                const settingsData = await settingsRes.json();

                if (menuData.success) {
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
            const pedidoParaAPI = {
                itens: details.items.map((item: any) => ({
                    nome: item.name, quantidade: item.quantity, preco: item.price,
                    observacao: item.observation, size: item.size, border: item.border, extras: item.extras
                })),
                total: details.total,
                tipoEntrega: details.tipoEntrega,
                endereco: details.tipoEntrega === 'entrega' ? {
                    address: details.address,
                    deliveryFee: details.deliveryFee,
                    estimatedTime: "30-45 min"
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

    const isSearching = useMemo(() => filter.trim().length > 0, [filter]);
    const processedItems = useMemo(() => {
        let items = [...menuItems];
        if (showOnlyAvailable) items = items.filter(i => i.available !== false);
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
    const filteredItemsByCategory = useMemo(() => {
        if (!isSearching) return itemsByCategory;
        const q = filter.trim().toLowerCase();
        const filtered: Record<string, MenuItem[]> = {};
        Object.keys(itemsByCategory).forEach(catId => {
            const matches = itemsByCategory[catId].filter(it =>
                it.name?.toLowerCase().includes(q) || it.description?.toLowerCase().includes(q)
            );
            if (matches.length > 0) filtered[catId] = matches;
        });
        return filtered;
    }, [isSearching, filter, itemsByCategory]);
    const displayCategories = useMemo(() => { const source = isSearching ? filteredItemsByCategory : itemsByCategory; return categories.filter(cat => source[cat._id] && source[cat._id].length > 0); }, [categories, itemsByCategory, filteredItemsByCategory, isSearching]);

    // Quando categorias exibíveis mudarem, medir indicador e atualizar fades
    useEffect(() => {
        let raf1 = 0;
        let t: any;
        setIndicatorReady(false);
        raf1 = requestAnimationFrame(() => {
            measureIndicator();
            updateScrollFades();
            t = setTimeout(() => setIndicatorReady(true), 60); // pequeno atraso para estabilizar layout
        });
        return () => { cancelAnimationFrame(raf1); if (t) clearTimeout(t); };
    }, [displayCategories, measureIndicator, updateScrollFades]);

    const handleItemClick = useCallback((item: MenuItem) => {
        setSelectedItem(item);
    }, []);

    const handleCategoryClick = useCallback((catId: string) => {
        setIsManualScrolling(true);
        setSelectedCategory(catId);
        const el = categorySectionRefs.current[catId];
        if (el) {
            const headerHeight = (document.querySelector('.sticky-category-bar') as HTMLElement)?.offsetHeight || 70;
            const elPos = el.getBoundingClientRect().top + window.scrollY;
            const offset = elPos - headerHeight - 16;
            window.scrollTo({ top: offset, behavior: 'smooth' });
            // reativa o scroll spy após o movimento terminar
            setTimeout(() => {
                setIsManualScrolling(false);
            }, 260);
        }
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
            scrollTimeoutRef.current = setTimeout(() => {
                setIsManualScrolling(false);
            }, 150);
        };

        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
        };
    }, []);


    // Scroll spy preciso com base nas posições das seções
    const sectionPositionsRef = useRef<Array<{ id: string; top: number }>>([]);

    const recomputeSectionPositions = useCallback(() => {
        sectionPositionsRef.current = displayCategories
            .map(cat => {
                const el = document.getElementById(`category-${cat._id}`);
                const top = el ? el.getBoundingClientRect().top + window.scrollY : Infinity;
                return { id: cat._id, top };
            })
            .filter(p => Number.isFinite(p.top))
            .sort((a, b) => a.top - b.top);
    }, [displayCategories]);

    const updateActiveCategoryOnScroll = useCallback(() => {
        if (isManualScrolling) return;
        const bar = document.querySelector('.sticky-category-bar') as HTMLElement | null;
        const barHeight = bar?.offsetHeight ?? 70;
        const viewportH = window.innerHeight || document.documentElement.clientHeight || 0;
        const anchorOffset = Math.min(Math.max(Math.round(viewportH * 0.35), 120), 360);
        const anchorY = window.scrollY + barHeight + 8 + anchorOffset;
        const positions = sectionPositionsRef.current;
        if (positions.length === 0) return;

        // Borda superior: se o âncora está acima da primeira seção, selecionar a primeira
        if (anchorY < positions[0].top) {
            const candidateId = positions[0].id;
            if (candidateId && candidateId !== selectedCategory) {
                const now = performance.now();
                const isFast = now < fastUntilTsRef.current;
                const delay = isFast ? 160 : 90;
                if (pendingCategoryRef.current !== candidateId) {
                    pendingCategoryRef.current = candidateId;
                    if (stabilizeTimerRef.current) clearTimeout(stabilizeTimerRef.current);
                    stabilizeTimerRef.current = setTimeout(() => {
                        if (pendingCategoryRef.current) {
                            setSelectedCategory(pendingCategoryRef.current);
                            pendingCategoryRef.current = null;
                        }
                    }, delay);
                }
            }
            return;
        }

        // Borda inferior: se o âncora está após a última seção, selecionar a última
        const lastIdx = positions.length - 1;
        if (anchorY >= positions[lastIdx].top) {
            const candidateId = positions[lastIdx].id;
            if (candidateId && candidateId !== selectedCategory) {
                const now = performance.now();
                const isFast = now < fastUntilTsRef.current;
                const delay = isFast ? 160 : 90;
                if (pendingCategoryRef.current !== candidateId) {
                    pendingCategoryRef.current = candidateId;
                    if (stabilizeTimerRef.current) clearTimeout(stabilizeTimerRef.current);
                    stabilizeTimerRef.current = setTimeout(() => {
                        if (pendingCategoryRef.current) {
                            setSelectedCategory(pendingCategoryRef.current);
                            pendingCategoryRef.current = null;
                        }
                    }, delay);
                }
            }
            return;
        }

        // posições já ordenadas; encontrar o intervalo que contém anchorY
        let idx = 0;
        for (let i = 0; i < positions.length; i++) {
            const cur = positions[i];
            const next = positions[i + 1];
            if (next && cur.top <= anchorY && anchorY < next.top) {
                idx = i;
                break;
            }
        }
        const candidateId = positions[idx].id;
        if (!candidateId || candidateId === selectedCategory) return;

        // Estabilizar a troca de categoria para evitar flicker em rolagem rápida
        const now = performance.now();
        const isFast = now < fastUntilTsRef.current;
        const delay = isFast ? 160 : 90;

        if (pendingCategoryRef.current === candidateId) {
            // já aguardando esta categoria
            return;
        }
        pendingCategoryRef.current = candidateId;
        if (stabilizeTimerRef.current) clearTimeout(stabilizeTimerRef.current);
        stabilizeTimerRef.current = setTimeout(() => {
            if (pendingCategoryRef.current) {
                setSelectedCategory(pendingCategoryRef.current);
                pendingCategoryRef.current = null;
            }
        }, delay);
    }, [isManualScrolling, selectedCategory]);

    useEffect(() => {
        // Recalcular quando categorias mudarem
        const id = requestAnimationFrame(() => {
            recomputeSectionPositions();
            updateActiveCategoryOnScroll();
        });
        return () => cancelAnimationFrame(id);
    }, [recomputeSectionPositions, updateActiveCategoryOnScroll]);

    useEffect(() => {
        const onScroll = () => {
            if (scrollRafRef.current != null) return;
            scrollRafRef.current = requestAnimationFrame(() => {
                const now = performance.now();
                const y = window.scrollY;
                const dy = y - lastScrollYRef.current;
                const dt = Math.max(now - lastScrollTsRef.current, 1);
                const velocity = Math.abs(dy) / dt * 1000; // px/s
                if (velocity > 1400) {
                    fastUntilTsRef.current = now + 220; // janela de rolagem rápida
                }
                lastScrollYRef.current = y;
                lastScrollTsRef.current = now;

                updateActiveCategoryOnScroll();
                scrollRafRef.current && cancelAnimationFrame(scrollRafRef.current);
                scrollRafRef.current = null;
            });
        };
        const onResize = () => {
            const id = requestAnimationFrame(() => {
                recomputeSectionPositions();
                updateActiveCategoryOnScroll();
            });
            return () => cancelAnimationFrame(id);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onResize);
        return () => {
            window.removeEventListener('scroll', onScroll as any);
            window.removeEventListener('resize', onResize as any);
            if (scrollRafRef.current != null) {
                cancelAnimationFrame(scrollRafRef.current);
                scrollRafRef.current = null;
            }
            if (stabilizeTimerRef.current) {
                clearTimeout(stabilizeTimerRef.current);
                stabilizeTimerRef.current = null;
            }
        };
    }, [recomputeSectionPositions, updateActiveCategoryOnScroll]);

    useEffect(() => {
        if (!selectedCategory || !categoryBarRef.current) return;
        const btn = categoryButtonRefs.current[selectedCategory];
        const cont = categoryBarRef.current;
        if (btn && cont) {
            const contWidth = cont.offsetWidth;
            const btnWidth = btn.offsetWidth;
            const btnLeft = btn.offsetLeft;
            const scroll = btnLeft - (contWidth / 2) + (btnWidth / 2);
            // scroll imediato para reduzir atraso perceptível
            cont.scrollTo({ left: scroll, behavior: 'auto' });
            // medir e atualizar o indicador após centragem
            requestAnimationFrame(() => {
                measureIndicator();
                updateScrollFades();
            });
        }
    }, [selectedCategory, measureIndicator, updateScrollFades]);

    // Atualiza indicador em resize
    useEffect(() => {
        const onResize = () => {
            measureIndicator();
            updateScrollFades();
        };
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [measureIndicator, updateScrollFades]);

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

        // Evita conflitos de formatação do WhatsApp (ex.: _itálico_ e *negrito*) inserindo zero-width space
        const ZWSP = '\u200B';
        const sanitize = (t: any) => (t ?? '').toString().replace(/([*_~`])/g, `${ZWSP}$1${ZWSP}`);

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

        const itemsText = items.map((item: any) => {
            let itemDetails = `*${sanitize(item.quantity)}x ${sanitize(item.name)}*`;
            if (item.size) itemDetails += ` (${sanitize(item.size)})`;
            if (item.border) itemDetails += `\n  - Borda: ${sanitize(item.border)}`;
            if (item.extras && item.extras.length > 0) itemDetails += `\n  - Sabores: ${item.extras.map((e: any) => sanitize(e)).join(', ')}`;
            if (item.observation) itemDetails += `\n  - Obs: ${sanitize(item.observation)}`;
            return itemDetails;
        }).join('\n\n');

        let deliveryText = `*Tipo:* ${tipoEntrega === 'entrega' ? 'ENTREGA' : 'RETIRADA'}`;
        if (tipoEntrega === 'entrega' && address) {
            deliveryText += `\n*Bairro:* ${sanitize(address.neighborhood) || 'Não informado'}`;
            deliveryText += `\n*Endereço:* ${sanitize(address.street)}, ${sanitize(address.number)}`;
            if (address.complement) deliveryText += `\n*Complemento:* ${sanitize(address.complement)}`;
            if (address.referencePoint) deliveryText += `\n*Ponto de Ref.:* ${sanitize(address.referencePoint)}`;
        }

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
            paymentText += `\n🔑 *CHAVE PIX:* ${sanitize(pixKey)}\nPor favor, envie o comprovante.`;
        }

        const message = `*🍔 NOVO PEDIDO - REI DOS SALGADOS 🍔*\n\n` +
            `-----------------------------------\n` +
            `*👤 DADOS DO CLIENTE*\n` +
            `*Nome:* ${sanitize(cliente.nome)}\n` +
            `*Telefone:* ${sanitize(cliente.telefone)}\n\n` +
            `-----------------------------------\n` +
            `*🛵 DADOS DA ENTREGA*\n` +
            `${deliveryText}\n\n` +
            `-----------------------------------\n` +
            `*📋 ITENS DO PEDIDO*\n\n` +
            `${itemsText}\n\n` +
            `-----------------------------------\n` +
            `${observacoes ? `*📝 OBSERVAÇÕES GERAIS*\n${sanitize(observacoes)}\n\n-----------------------------------\n` : ''}` +
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
    if (!restaurantIsOpen) {
        // Usa o estado global de settings já carregado acima.
        const getNextOpeningTime = () => {
            if (!settings?.businessHours) return null;
            const now = new Date();
            const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
            let currentDayIndex = now.getDay();
            
            for (let i = 0; i < 7; i++) {
                const checkIndex = (currentDayIndex + i) % 7;
                const dayKey = days[checkIndex];
                const dayHours = settings.businessHours[dayKey];
                
                if (dayHours?.open) {
                    const isToday = i === 0;
                    const dayLabel = isToday ? 'hoje' : i === 1 ? 'amanhã' : dayNames[checkIndex];
                    return { day: dayLabel, time: dayHours.start };
                }
            }
            return null;
        };

        const nextOpening = getNextOpeningTime();
        
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
                {/* Decorações de fundo */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-yellow-500/5 rounded-full blur-3xl" />
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-yellow-500/3 rounded-full blur-3xl" />
                </div>
                
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center max-w-lg mx-auto relative z-10"
                >
                    <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl shadow-2xl border border-gray-700/50 p-8 sm:p-12 backdrop-blur-sm">
                        {/* Ícone animado */}
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2, type: "spring" }}
                            className="mb-6 relative inline-block"
                        >
                            <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/30 flex items-center justify-center backdrop-blur-sm">
                                <svg className="w-12 h-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500/80 flex items-center justify-center"
                            >
                                <span className="text-white text-xs font-bold">!</span>
                            </motion.div>
                        </motion.div>

                        <motion.h2
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-3xl sm:text-4xl font-extrabold text-white mb-3 tracking-tight"
                        >
                            Estamos Fechados
                        </motion.h2>
                        
                        <motion.p
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-gray-400 mb-8 leading-relaxed"
                        >
                            No momento não estamos aceitando pedidos, mas voltaremos em breve!
                        </motion.p>

                        {/* Próximo horário */}
                        {nextOpening && (
                            <motion.div
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="mb-8 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30"
                            >
                                <p className="text-yellow-400 font-semibold mb-1">Próximo horário de abertura</p>
                                <p className="text-white text-lg">
                                    <span className="capitalize">{nextOpening.day}</span> às <span className="font-bold">{nextOpening.time}</span>
                                </p>
                            </motion.div>
                        )}

                        {/* Horários da semana */}
                        {settings?.businessHours && (
                            <motion.div
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50"
                            >
                                <h3 className="text-yellow-400 font-semibold mb-4 flex items-center justify-center gap-2">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Horário de Funcionamento
                                </h3>
                                <div className="space-y-2 text-sm">
                                    {[
                                        { key: 'monday', label: 'Segunda' },
                                        { key: 'tuesday', label: 'Terça' },
                                        { key: 'wednesday', label: 'Quarta' },
                                        { key: 'thursday', label: 'Quinta' },
                                        { key: 'friday', label: 'Sexta' },
                                        { key: 'saturday', label: 'Sábado' },
                                        { key: 'sunday', label: 'Domingo' }
                                    ].map(d => {
                                        const hours = settings.businessHours[d.key];
                                        const isOpen = hours?.open;
                                        return (
                                            <div key={d.key} className="flex justify-between items-center py-1">
                                                <span className="text-gray-400">{d.label}</span>
                                                <span className={`font-medium ${isOpen ? 'text-green-400' : 'text-red-400'}`}>
                                                    {isOpen ? `${hours.start} - ${hours.end}` : 'Fechado'}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}

                        {/* Botão de contato */}
                        {settings?.establishmentInfo?.contact?.whatsapp && (
                            <motion.div
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.7 }}
                                className="mt-8"
                            >
                                <a
                                    href={`https://wa.me/${settings.establishmentInfo.contact.whatsapp.replace(/\D/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors shadow-lg"
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                    </svg>
                                    Entre em contato
                                </a>
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
            <div className="max-w-7xl mx-auto">
                {/* Cabeçalho Não-Fixo */}
                <div className="p-4 space-y-3">
                    <div className="relative">
                        <SearchBar />
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

                {/* Barra de Categoria Fixa */}
                <motion.div
                    initial={prefersReducedMotion ? false : { y: -10, opacity: 0 }}
                    animate={prefersReducedMotion ? {} : { y: 0, opacity: 1 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="sticky top-0 z-30 bg-gray-900/80 backdrop-blur-lg border-b border-t border-gray-700/50 sticky-category-bar"
                >
                    <div className="relative px-4 py-3">
                        {/* Fades laterais dinâmicos */}
                        <motion.div
                            aria-hidden
                            className="pointer-events-none absolute left-0 top-0 h-full w-6 bg-gradient-to-r from-gray-900 to-transparent"
                            animate={{ opacity: showLeftFade ? 1 : 0 }}
                            transition={{ duration: 0.2 }}
                        />
                        <motion.div
                            aria-hidden
                            className="pointer-events-none absolute right-0 top-0 h-full w-6 bg-gradient-to-l from-gray-900 to-transparent"
                            animate={{ opacity: showRightFade ? 1 : 0 }}
                            transition={{ duration: 0.2 }}
                        />
                        <div
                            ref={categoryBarRef}
                            onScroll={() => {
                                // throttle com rAF
                                if (!(categoryBarRef.current as any)?._scrollTicking) {
                                    (categoryBarRef.current as any)._scrollTicking = true;
                                    requestAnimationFrame(() => {
                                        updateScrollFades();
                                        measureIndicator();
                                        if (categoryBarRef.current) (categoryBarRef.current as any)._scrollTicking = false;
                                    });
                                }
                            }}
                            className="relative flex space-x-2 snap-x snap-mandatory overflow-x-auto scrollbar-hide category-bar-container"
                        >
                            {/* Indicador sublinhado */}
                            <motion.div
                                aria-hidden
                                className="absolute bottom-0 h-0.5 bg-yellow-500 rounded-full"
                                initial={false}
                                animate={{ x: indicator.left, width: indicator.width, opacity: indicatorReady && indicator.width > 0 ? 1 : 0 }}
                                transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 700, damping: 32 }}
                                style={{ pointerEvents: 'none', left: 0, willChange: 'transform, width, opacity' }}
                            />
                            {displayCategories.map(cat => (
                                <motion.button
                                    key={cat._id}
                                    ref={(el) => { categoryButtonRefs.current[cat._id] = el; }}
                                    onClick={() => handleCategoryClick(cat._id)}
                                    whileHover={prefersReducedMotion ? {} : { scale: 1.03 }}
                                    whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
                                    className={`relative px-3 sm:px-4 py-2 rounded-full text-xs xs:text-sm font-semibold transition-colors duration-300 whitespace-nowrap flex items-center gap-2 border border-gray-700/60 snap-start overflow-hidden flex-shrink-0 ${selectedCategory === cat._id ? 'text-gray-900' : 'text-gray-300 hover:text-white'}`}
                                >
                                    {selectedCategory === cat._id && (
                                        <motion.div
                                            layoutId="category-pill"
                                            className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 shadow-glow"
                                            style={{ zIndex: -1 }}
                                            transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 900, damping: 40 }}
                                        />
                                    )}
                                    <span
                                        ref={(el) => { categoryLabelRefs.current[cat._id] = el; }}
                                        className="relative z-10 truncate max-w-[60vw] sm:max-w-none"
                                    >
                                        {cat.name}
                                    </span>
                                </motion.button>
                            ))}
                        </div>
                    </div>
                </motion.div>

                <main className="px-4 pb-4 pt-6">
                    <div className="space-y-12">
                        {showHighlights && highlights.length > 0 && (
                            <section>
                                <h2 className="text-2xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
                                    <span className="inline-block w-2 h-8 bg-yellow-500 rounded" /> Destaques
                                </h2>
                                <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 w-full">
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
                                    <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 w-full">
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

