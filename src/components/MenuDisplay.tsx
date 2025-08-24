// src/components/MenuDisplay.tsx

'use client';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRestaurantStatus } from '@/contexts/RestaurantStatusContext';
import ItemModal from './ItemModal';
import Cart from './Cart';
import { MenuItem } from '@/types/menu';
import Image from 'next/image';
import { FaShoppingCart, FaSearch } from 'react-icons/fa';
import { useCart } from '../contexts/CartContext';
import { CartItem } from '../types/cart';
import PastaModal from './PastaModal';
import MiniItemModal from './MiniItemModal';

// Componente otimizado para item do menu
const OptimizedMenuItem = React.memo(({ item, onClick, isLowEndDevice }: { item: MenuItem, onClick: (item: MenuItem) => void, isLowEndDevice: boolean }) => (
    <motion.div
        className="bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-200 border border-yellow-500/50 cursor-pointer hover:bg-gray-700 hover:border-yellow-400"
        style={{ willChange: 'transform' }}
        onClick={() => onClick(item)}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
    >
        <div className="relative h-40">
            {item.image && (
                <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                    className="object-cover"
                    loading="lazy"
                    placeholder="blur"
                    quality={75}
                    blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/+F9PQAI8wNPvd7POQAAAABJRU5ErkJggg=="
                />
            )}
            {!item.available && (
                <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                    <span className="text-red-400 font-bold text-sm bg-red-900/80 px-2 py-1 rounded">Indisponível</span>
                </div>
            )}
        </div>
        <div className="p-4">
            <h3 className="font-bold text-white text-lg mb-1 truncate">{item.name}</h3>
            {item.description && <p className="text-gray-400 text-sm mb-2 line-clamp-2">{item.description}</p>}
            <div className="flex justify-between items-center mt-3">
                <span className="text-yellow-500 font-bold text-lg">
                    R$ {(item.price || 0).toFixed(2).replace('.', ',')}
                </span>
            </div>
        </div>
    </motion.div>
));
OptimizedMenuItem.displayName = 'OptimizedMenuItem';

export default function MenuDisplay() {
    const { isOpen: restaurantIsOpen } = useRestaurantStatus();
    const { items: cartItems, addToCart, updateQuantity, removeFromCart } = useCart();

    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [categories, setCategories] = useState<{ _id: string, name: string, emoji?: string }[]>([]);
    const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
    const [selectedPasta, setSelectedPasta] = useState<MenuItem | null>(null);
    const [miniModalItem, setMiniModalItem] = useState<MenuItem | null>(null);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [isManualScrolling, setIsManualScrolling] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLowEndDevice, setIsLowEndDevice] = useState(false);
    const [businessHours, setBusinessHours] = useState<any>(null);

    // Refs
    const categorySectionRefs = useRef<Record<string, HTMLElement | null>>({});
    const categoryButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
    const categoryBarRef = useRef<HTMLDivElement | null>(null);
    const observerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const manualScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const isLowPerf = /iPhone|iPad|iPod/.test(navigator.userAgent) || navigator.hardwareConcurrency <= 4;
        setIsLowEndDevice(isLowPerf);
    }, []);

    useEffect(() => {
        async function fetchData() {
            try {
                const [menuRes, catRes, settingsRes] = await Promise.all([
                    fetch('/api/menu'),
                    fetch('/api/categories'),
                    fetch('/api/settings')
                ]);
                const menuData = await menuRes.json();
                const catData = await catRes.json();
                const settingsData = await settingsRes.json();

                if (menuData.success) setMenuItems(menuData.data);
                if (catData.success && catData.data.length > 0) {
                    setCategories(catData.data);
                    if (!selectedCategory) {
                        setSelectedCategory(catData.data[0]._id);
                    }
                }
                if (settingsData.success) {
                    setBusinessHours(settingsData.data.businessHours);
                }
            } catch (error) {
                console.error("Falha ao buscar dados:", error);
            }
        }
        fetchData();
    }, [selectedCategory]);

    const isSearching = useMemo(() => searchQuery.trim().length > 0, [searchQuery]);

    const itemsByCategory = useMemo(() => {
        return menuItems.reduce((acc, item) => {
            const categoryId = item.category.toString();
            if (!acc[categoryId]) acc[categoryId] = [];
            acc[categoryId].push(item);
            return acc;
        }, {} as Record<string, MenuItem[]>);
    }, [menuItems]);

    const filteredItemsByCategory = useMemo(() => {
        if (!isSearching) return itemsByCategory;
        const q = searchQuery.trim().toLowerCase();
        const filtered: Record<string, MenuItem[]> = {};
        for (const catId in itemsByCategory) {
            const matches = itemsByCategory[catId].filter(it =>
                it.name?.toLowerCase().includes(q) || it.description?.toLowerCase().includes(q)
            );
            if (matches.length > 0) filtered[catId] = matches;
        }
        return filtered;
    }, [isSearching, searchQuery, itemsByCategory]);

    const displayCategories = useMemo(() => {
        const source = isSearching ? filteredItemsByCategory : itemsByCategory;
        return categories.filter(cat => source[cat._id] && source[cat._id].length > 0);
    }, [categories, itemsByCategory, filteredItemsByCategory, isSearching]);

    const handleItemClick = useCallback((item: MenuItem) => {
        const categoryName = categories.find(c => c._id === item.category.toString())?.name.toLowerCase() || '';
        if (categoryName.includes('pizza')) setSelectedItem(item);
        else if (categoryName.includes('massa')) setSelectedPasta(item);
        else setMiniModalItem(item);
    }, [categories]);

    const handleCategoryClick = useCallback((categoryId: string) => {
        setIsManualScrolling(true);
        setSelectedCategory(categoryId);

        const element = categorySectionRefs.current[categoryId];
        if (element) {
            const header = document.querySelector('.sticky-header') as HTMLElement;
            const headerHeight = header ? header.offsetHeight : 120;
            const elementPosition = element.getBoundingClientRect().top + window.scrollY;
            const offsetPosition = elementPosition - headerHeight - 16;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });

            if (manualScrollTimeoutRef.current) clearTimeout(manualScrollTimeoutRef.current);
            manualScrollTimeoutRef.current = setTimeout(() => {
                setIsManualScrolling(false);
            }, 1000);
        }
    }, []);

    useEffect(() => {
        if (isManualScrolling || displayCategories.length === 0) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (isManualScrolling) return;
                const visibleEntries = entries.filter(entry => entry.isIntersecting);
                if (visibleEntries.length === 0) return;
                visibleEntries.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

                const targetEntry = visibleEntries[0];
                const categoryId = targetEntry.target.id.replace('category-', '');

                if (observerTimeoutRef.current) clearTimeout(observerTimeoutRef.current);
                observerTimeoutRef.current = setTimeout(() => {
                    setSelectedCategory(categoryId);
                }, 150);
            },
            { rootMargin: '-140px 0px -40% 0px', threshold: 0.1 }
        );

        displayCategories.forEach(cat => {
            const element = document.getElementById(`category-${cat._id}`);
            if (element) {
                observer.observe(element);
            }
        });

        return () => {
            if (observerTimeoutRef.current) clearTimeout(observerTimeoutRef.current);
            observer.disconnect();
        };
    }, [displayCategories, isManualScrolling]);

    useEffect(() => {
        if (!selectedCategory || !categoryBarRef.current) return;

        const buttonElement = categoryButtonRefs.current[selectedCategory];
        const containerElement = categoryBarRef.current;

        if (buttonElement && containerElement) {
            const containerWidth = containerElement.offsetWidth;
            const buttonWidth = buttonElement.offsetWidth;
            const buttonOffsetLeft = buttonElement.offsetLeft;

            const scrollTo = buttonOffsetLeft - (containerWidth / 2) + (buttonWidth / 2);

            containerElement.scrollTo({
                left: scrollTo,
                behavior: 'smooth'
            });
        }
    }, [selectedCategory]);

    // NOVO EFEITO PARA CORRIGIR O TOPO DA PÁGINA
    useEffect(() => {
        let scrollTimeout: NodeJS.Timeout;

        const handleScroll = () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                // Se estiver no topo da página e houver categorias, força a seleção da primeira
                if (window.scrollY < 50 && displayCategories.length > 0) {
                    const firstCategoryId = displayCategories[0]._id;
                    if (selectedCategory !== firstCategoryId) {
                        setSelectedCategory(firstCategoryId);
                    }
                }
            }, 100); // Um pequeno delay para não disparar a todo momento
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', handleScroll);
            clearTimeout(scrollTimeout);
        };
    }, [displayCategories, selectedCategory]); // Depende das categorias e da categoria selecionada


    const formatBusinessHours = (hours: any) => {
        if (!hours) return [];
        const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayLabels: { [key: string]: string } = {
            sunday: 'Domingo', monday: 'Segunda', tuesday: 'Terça', wednesday: 'Quarta',
            thursday: 'Quinta', friday: 'Sexta', saturday: 'Sábado'
        };
        return daysOfWeek.map(key => ({
            day: dayLabels[key],
            ...hours[key]
        }));
    };

    if (!restaurantIsOpen) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
                <div className="text-center max-w-md mx-auto">
                    <div className="bg-gray-800 rounded-2xl shadow-2xl border border-yellow-500/30 p-8">
                        <div className="mb-6">
                            <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-yellow-500 mb-3">Estabelecimento Fechado</h2>
                            <p className="text-gray-300 text-lg">Desculpe, estamos fechados no momento.</p>
                        </div>
                        <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                            <h3 className="text-yellow-400 font-semibold mb-2">Horário de Funcionamento</h3>
                            <div className="text-gray-300 text-sm space-y-1">
                                {businessHours ? formatBusinessHours(businessHours).map((day, index) => (
                                    <div key={index} className="flex justify-between">
                                        <span>{day.day}:</span>
                                        {day.open ? (
                                            <span className="text-white font-medium">{day.start} às {day.end}</span>
                                        ) : (
                                            <span className="text-red-400 font-medium">Fechado</span>
                                        )}
                                    </div>
                                )) : <p>Carregando horários...</p>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const handleAddToCart = (item: MenuItem, quantity: number, observation?: string, size?: string, border?: string, extras?: string[]) => {
        addToCart(item, quantity, observation, size, border, extras);
    };

    return (
        <div className="min-h-screen bg-gray-900">
            <div className="max-w-7xl mx-auto">
                <div className="sticky top-0 z-30 bg-gray-900/80 backdrop-blur-lg border-b border-gray-700/50 sticky-header">
                    <div className="p-4 flex items-center gap-4">
                        <input
                            type="search"
                            placeholder="Buscar no cardápio..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-gray-800 text-white rounded-lg px-4 py-2 border border-gray-700 focus:ring-2 focus:ring-yellow-500 outline-none"
                        />
                    </div>
                    <div className="relative px-4 pb-3">
                        <div ref={categoryBarRef} className="flex space-x-2 overflow-x-auto scrollbar-hide">
                            {displayCategories.map(cat => (
                                <button
                                    key={cat._id}
                                    ref={(el) => { categoryButtonRefs.current[cat._id] = el; }}
                                    onClick={() => handleCategoryClick(cat._id)}
                                    className={`relative px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-300 whitespace-nowrap
                                        ${selectedCategory === cat._id ? 'text-gray-900' : 'text-gray-300 hover:text-white'}`}
                                >
                                    {selectedCategory === cat._id && (
                                        <motion.div
                                            layoutId="category-pill"
                                            className="absolute inset-0 bg-yellow-500 rounded-full"
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
                    {displayCategories.length === 0 ? (
                        <div className="text-center text-gray-400 py-16">
                            {isSearching ? 'Nenhum item encontrado.' : 'Carregando cardápio...'}
                        </div>
                    ) : (
                        <div className="space-y-12">
                            {displayCategories.map(cat => {
                                const items = filteredItemsByCategory[cat._id] || [];
                                return (
                                    <section key={cat._id} id={`category-${cat._id}`} ref={(el) => { categorySectionRefs.current[cat._id] = el; }}>
                                        <h2 className="text-2xl font-bold text-white mb-4 border-l-4 border-yellow-500 pl-3">{cat.name}</h2>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                            {items.map(item => (
                                                <OptimizedMenuItem key={item._id} item={item} onClick={handleItemClick} isLowEndDevice={isLowEndDevice} />
                                            ))}
                                        </div>
                                    </section>
                                );
                            })}
                        </div>
                    )}
                </main>
            </div>

            <AnimatePresence>
                {selectedItem && (
                    <ItemModal
                        item={selectedItem}
                        onClose={() => setSelectedItem(null)}
                        onAddToCart={(quantity, observation, size, border, extras) => {
                            if (selectedItem) handleAddToCart(selectedItem, quantity, observation, size, border, extras);
                        }}
                        allPizzas={menuItems.filter(i => {
                            const categoryName = categories.find(c => c._id === i.category.toString())?.name.toLowerCase() || '';
                            return categoryName.includes('pizza');
                        })}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>{selectedPasta && <PastaModal item={selectedPasta} onClose={() => setSelectedPasta(null)} onAddToCart={(q, o, s) => { if (selectedPasta) handleAddToCart(selectedPasta, q, o, s); setSelectedPasta(null); }} />}</AnimatePresence>
            <AnimatePresence>{miniModalItem && <MiniItemModal item={miniModalItem} onClose={() => setMiniModalItem(null)} onAdd={(q, o, e) => { if (miniModalItem) handleAddToCart(miniModalItem, q, o, undefined, undefined, e); setMiniModalItem(null); }} categories={categories} />}</AnimatePresence>

            {cartItems.length > 0 && (
                <div className="fixed bottom-6 right-6 z-40">
                    <motion.button
                        onClick={() => setIsCartOpen(true)}
                        className="w-16 h-16 bg-yellow-500 text-gray-900 rounded-full flex items-center justify-center shadow-lg"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                    >
                        <FaShoppingCart size={24} />
                        <span className="absolute -top-1 -right-1 bg-gray-900 text-yellow-500 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-yellow-500">
                            {cartItems.reduce((total, item) => total + item.quantity, 0)}
                        </span>
                    </motion.button>
                </div>
            )}

            <AnimatePresence>
                {isCartOpen && <Cart onClose={() => setIsCartOpen(false)} items={[]} onUpdateQuantity={function (itemId: string, quantity: number): void {
                    throw new Error('Function not implemented.');
                }} onRemoveItem={function (itemId: string): void {
                    throw new Error('Function not implemented.');
                }} onCheckout={function (orderId: string): void {
                    throw new Error('Function not implemented.');
                }} />}
            </AnimatePresence>
        </div>
    );
}