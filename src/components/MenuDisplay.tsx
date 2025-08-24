'use client';
import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRestaurantStatus } from '@/contexts/RestaurantStatusContext';
import ItemModal from './ItemModal';
import Cart from './Cart';
import { MenuItem } from '@/types/menu';
import Image from 'next/image';
import { FaExclamationCircle, FaWhatsapp, FaShare, FaShoppingCart, FaPlus, FaPrint, FaBars, FaTimes, FaUtensils, FaIceCream, FaCoffee, FaGlassWhiskey, FaWineGlass, FaSearch } from 'react-icons/fa';
import { useCart } from '../contexts/CartContext';
import { CartItem } from '../types/cart';
import PastaModal from './PastaModal';
import MiniItemModal from './MiniItemModal';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.01, // Reduzido ainda mais para performance
            duration: 0.15 // Mais rápido
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 }, // Reduzido movimento
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 300, // Mais rápido
            damping: 25,
            duration: 0.2 // Mais rápido
        }
    }
};

const categoryVariants = {
    hidden: { opacity: 0, x: -10 }, // Reduzido movimento
    visible: {
        opacity: 1,
        x: 0,
        transition: {
            type: "spring",
            stiffness: 400, // Mais rápido
            damping: 25,
            duration: 0.15 // Mais rápido
        }
    }
};

export default function MenuDisplay() {
    const { isOpen, refreshStatus } = useRestaurantStatus();
    const { items: cartItems, addToCart, removeFromCart, updateQuantity, clearCart } = useCart();
    const { isOpen: restaurantIsOpen } = useRestaurantStatus();

    // Detectar se é iPhone para otimizações específicas
    const [isIPhone, setIsIPhone] = useState(false);
    const [iosVersion, setIosVersion] = useState<number | null>(null);

    // Detectar se é MacBook Air 2017 ou hardware similar (baixa performance)
    const [isLowEndDevice, setIsLowEndDevice] = useState(false);

    useEffect(() => {
        // Detectar iPhone e versão iOS
        const userAgent = navigator.userAgent;
        const isIOS = /iPad|iPhone|iPod/.test(userAgent);
        const isIPhoneDevice = /iPhone/.test(userAgent);

        setIsIPhone(isIPhoneDevice);

        if (isIOS) {
            const match = userAgent.match(/OS (\d+)_/);
            if (match) {
                setIosVersion(parseInt(match[1]));
            }
        }

        // Detectar hardware de baixa performance (MacBook Air 2017, etc)
        const detectLowEndDevice = () => {
            try {
                const memory = (navigator as any).deviceMemory;
                const cores = navigator.hardwareConcurrency;

                // MacBook Air 2017: 8GB RAM, 4 logical cores
                // Detectar baseado em memory limitada ou poucos cores
                let isOldHardware = false;

                if (memory && memory <= 8) {
                    isOldHardware = true;
                }

                if (cores && cores <= 4) {
                    isOldHardware = true;
                }

                // Teste rápido de performance
                const start = performance.now();
                for (let i = 0; i < 50000; i++) {
                    Math.random();
                }
                const end = performance.now();

                if ((end - start) > 8) {
                    isOldHardware = true;
                }

                setIsLowEndDevice(isOldHardware);

                if (isOldHardware) {
                    console.log('Hardware de baixa performance detectado (possivelmente MacBook Air 2017) - otimizações ativadas');
                    // Adicionar classe CSS para otimizações específicas
                    document.body.classList.add('low-end-device');
                }
            } catch (error) {
                console.warn('Erro na detecção de hardware:', error);
                setIsLowEndDevice(false);
            }
        };

        detectLowEndDevice();

        // Adicionar classe específica para iPhone no body
        if (isIPhoneDevice) {
            document.body.classList.add('iphone-device');
            // Prevenir zoom em inputs para iPhone
            const metaViewport = document.querySelector('meta[name="viewport"]');
            if (metaViewport) {
                metaViewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
            }
        }

        return () => {
            document.body.classList.remove('iphone-device');
            document.body.classList.remove('low-end-device');
        };
    }, []);

    const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [orderSuccessId, setOrderSuccessId] = useState<string | null>(null);
    const [showInfo, setShowInfo] = useState(false);
    const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
    const [orderDetails, setOrderDetails] = useState<CartItem[]>([]);
    const [formaPagamento, setFormaPagamento] = useState<string>('');
    const [showNotifications, setShowNotifications] = useState(false);
    const [tipoEntrega, setTipoEntrega] = useState<'entrega' | 'retirada'>('entrega');
    const [deliveryFees, setDeliveryFees] = useState<{ neighborhood: string; fee: number }[]>([]);
    const [selectedPasta, setSelectedPasta] = useState<MenuItem | null>(null);
    const [miniModalItem, setMiniModalItem] = useState<MenuItem | null>(null);
    const [businessHours, setBusinessHours] = useState<any>(null);
    const [isLoadingSettings, setIsLoadingSettings] = useState(true);
    const [categories, setCategories] = useState<{ _id: string, name: string, emoji?: string, orderIndex?: number }[]>([]);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [whatsappNumber, setWhatsappNumber] = useState<string>('');
    const [pixKey, setPixKey] = useState<string>('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const [menuTitle, setMenuTitle] = useState<string>('Cardápio Digital');
    const [showLogo, setShowLogo] = useState<boolean>(true);
    // Busca e modal de categorias
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const isSearching = useMemo(() => searchQuery.trim().length > 0, [searchQuery]);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

    // Filtro para itens de pizza (se existirem no banco) - Memoizado para performance
    const allPizzas = useMemo(() =>
        menuItems.filter((item: MenuItem) => item.category === 'pizzas'),
        [menuItems]
    );

    // Memoizar itens por categoria para evitar re-filtros desnecessários
    const itemsByCategory = useMemo(() => {
        const grouped: Record<string, MenuItem[]> = {};
        menuItems.forEach(item => {
            if (!grouped[item.category]) {
                grouped[item.category] = [];
            }
            grouped[item.category].push(item);
        });
        return grouped;
    }, [menuItems]);

    // Categorias para exibição (apenas as do backend)
    const displayCategories = useMemo(() => categories, [categories]);

    // Itens filtrados pela busca
    const filteredItemsByCategory = useMemo(() => {
        if (!isSearching) return itemsByCategory;
        const q = searchQuery.trim().toLowerCase();
        const filtered: Record<string, MenuItem[]> = {};
        Object.keys(itemsByCategory).forEach(catId => {
            const items = itemsByCategory[catId] || [];
            const matches = items.filter((it) => {
                const nameMatch = it.name?.toLowerCase().includes(q);
                const descMatch = it.description?.toLowerCase().includes(q);
                const flavorMatch = Array.isArray((it as any).flavors)
                    ? ((it as any).flavors as any[]).some(f => (f?.name || '').toLowerCase().includes(q) || (f?.description || '').toLowerCase().includes(q))
                    : false;
                return !!(nameMatch || descMatch || flavorMatch);
            });
            if (matches.length > 0) {
                filtered[catId] = matches;
            }
        });
        return filtered;
    }, [isSearching, searchQuery, itemsByCategory]);

    // Memoizar callbacks para evitar re-renders
    const handleCategoryClick = useCallback((categoryId: string) => {
        setIsManualScrolling(true);
        setSelectedCategory(categoryId);

        const element = document.getElementById(`category-${categoryId}`);
        if (element) {
            // Calcular a altura total do header sticky
            const stickyHeader = document.querySelector('.sticky') as HTMLElement;
            let headerHeight = stickyHeader ? stickyHeader.offsetHeight + 20 : (window.innerWidth < 640 ? 120 : 140);

            // Ajuste específico para iPhone devido ao notch e safe area
            if (isIPhone) {
                headerHeight += window.innerWidth < 400 ? 44 : 20; // Considerar notch do iPhone
            }

            // Calcular a posição exata onde deve rolar
            const elementRect = element.getBoundingClientRect();
            const elementTop = elementRect.top + window.pageYOffset;
            const targetPosition = elementTop - headerHeight;

            // Rolar diretamente para a posição calculada (sempre instantâneo para evitar travamentos)
            window.scrollTo({
                top: Math.max(0, targetPosition),
                behavior: 'auto'
            });
        }

        // Liberar o observer rapidamente para manter a interface responsiva
        setTimeout(() => setIsManualScrolling(false), 400);
    }, [isIPhone, isLowEndDevice]);

    const handleItemClick = useCallback((item: MenuItem) => {
        if (item.category === 'pizzas') {
            setSelectedItem(item);
        } else if (item.category === 'massas') {
            setSelectedPasta(item);
        } else {
            setMiniModalItem(item);
        }
    }, []);

    // Formatação monetária pt-BR
    const formatBRL = useCallback((n: number) => {
        try {
            return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        } catch {
            // Fallback para ambientes sem Intl configurado
            return (Math.round(n * 100) / 100).toFixed(2).replace('.', ',');
        }
    }, []);

    // Componente otimizado para item do menu
    const OptimizedMenuItem = React.memo(({ item }: { item: MenuItem }) => (
        <motion.div
            className="bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-200 border border-yellow-500 cursor-pointer hover:bg-gray-750 hover:border-yellow-400"
            style={{ willChange: isLowEndDevice ? 'auto' : 'transform' }}
            onClick={() => handleItemClick(item)}
        >
            <div className="relative h-32 sm:h-48">
                {item.image && (
                    <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                        className="object-cover"
                        loading="lazy" // Lazy loading para performance
                        placeholder="blur"
                        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R/AOzuFuJZHluIZnhkP2I5EcwuQWBIEjsxGTgAtgAOX/9k="
                    />
                )}
                {!item.available && (
                    <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                        <span className="text-red-400 font-bold text-sm bg-red-900/80 px-2 py-1 rounded">
                            Indisponível
                        </span>
                    </div>
                )}
            </div>
            <div className="p-3 sm:p-4">
                <h3 className="font-bold text-white text-base sm:text-lg mb-1 truncate">
                    {item.name}
                </h3>
                {item.description && (
                    <p className="text-gray-400 text-xs sm:text-sm mb-2 line-clamp-2">
                        {item.description}
                    </p>
                )}
                <div className="flex justify-between items-center">
                    <span className="text-yellow-500 font-bold text-lg">
                        {item.sizes && Object.keys(item.sizes).length > 0 ?
                            `R$ ${Math.min(...Object.values(item.sizes).filter(v => v !== undefined)).toFixed(2)}` :
                            `R$ ${item.price.toFixed(2)}`
                        }
                    </span>
                    <motion.button
                        whileHover={isLowEndDevice ? undefined : { scale: 1.1 }}
                        whileTap={isLowEndDevice ? undefined : { scale: 0.9 }}
                        transition={isLowEndDevice ? undefined : { duration: 0.15 }}
                        className="bg-yellow-500 hover:bg-yellow-400 text-black p-2 rounded-full transition-colors duration-150"
                        disabled={!item.available}
                    >
                        <FaPlus className="text-sm" />
                    </motion.button>
                </div>
            </div>
        </motion.div>
    ));

    OptimizedMenuItem.displayName = 'OptimizedMenuItem';

    // Função para obter ícone da categoria
    const getCategoryIcon = (categoryName: string) => {
        const name = categoryName.toLowerCase();
        if (name.includes('salgado') || name.includes('salgados')) return FaUtensils;
        if (name.includes('bebida') || name.includes('drink')) return FaGlassWhiskey;
        if (name.includes('sobremesa') || name.includes('dessert')) return FaIceCream;
        if (name.includes('café') || name.includes('coffee')) return FaCoffee;
        if (name.includes('vinho') || name.includes('wine')) return FaWineGlass;
        return FaUtensils; // Ícone padrão para salgados
    };

    // Função para formatar horários de funcionamento
    const formatBusinessHours = (hours: any) => {
        if (!hours) return null;

        const daysOfWeek = [
            { key: 'monday', label: 'Segunda' },
            { key: 'tuesday', label: 'Terça' },
            { key: 'wednesday', label: 'Quarta' },
            { key: 'thursday', label: 'Quinta' },
            { key: 'friday', label: 'Sexta' },
            { key: 'saturday', label: 'Sábado' },
            { key: 'sunday', label: 'Domingo' }
        ];

        return daysOfWeek.map(({ key, label }) => {
            const dayHours = hours[key];
            return {
                day: label,
                open: dayHours?.open || false,
                start: dayHours?.start || '00:00',
                end: dayHours?.end || '00:00'
            };
        });
    };

    // Buscar configurações do banco de dados
    useEffect(() => {
        async function fetchSettings() {
            try {
                setIsLoadingSettings(true);
                const res = await fetch('/api/settings');
                const data = await res.json();
                if (data.success && data.data) {
                    setBusinessHours(data.data.businessHours);
                    setDeliveryFees(data.data.deliveryFees || []);
                    // Buscar WhatsApp e PIX do banco
                    setWhatsappNumber(data.data.establishmentInfo?.contact?.whatsapp?.replace(/\D/g, ''));
                    setPixKey(data.data.establishmentInfo?.pixKey || '');

                    // Configurações de apresentação do cardápio
                    if (data.data.establishmentInfo?.menuTitle !== undefined) {
                        setMenuTitle(data.data.establishmentInfo.menuTitle);
                    }
                    if (data.data.establishmentInfo?.showLogo !== undefined) {
                        setShowLogo(data.data.establishmentInfo.showLogo);
                    }
                }
            } catch (err) {
                console.error('Erro ao carregar configurações:', err);
            } finally {
                setIsLoadingSettings(false);
            }
        }
        fetchSettings();
    }, []);

    // Buscar categorias do backend
    useEffect(() => {
        async function fetchCategories() {
            try {
                const res = await fetch('/api/categories');
                const data = await res.json();
                if (data.success && Array.isArray(data.data)) {
                    // Ordenar categorias pelo orderIndex
                    const sortedCategories = data.data
                        .map((cat: any) => ({
                            _id: cat._id,
                            name: cat.name,
                            emoji: cat.emoji || '🍽️', // Emoji padrão se não tiver
                            orderIndex: cat.orderIndex || 0
                        }))
                        .sort((a: { orderIndex: number }, b: { orderIndex: number }) => a.orderIndex - b.orderIndex);

                    setCategories(sortedCategories);
                }
            } catch (err) {
                setCategories([]);
            }
        }
        fetchCategories();
    }, []);

    // Buscar itens do cardápio do backend
    useEffect(() => {
        async function fetchMenuItems() {
            try {
                const res = await fetch('/api/menu');
                const data = await res.json();
                if (data.success && Array.isArray(data.data)) {
                    setMenuItems(data.data);
                }
            } catch (err) {
                setMenuItems([]);
            }
        }
        fetchMenuItems();
    }, []);

    // Estado para controlar se o scroll está sendo feito por clique ou por rolagem normal
    const [isManualScrolling, setIsManualScrolling] = useState(false);
    const observerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    // Destaque visual curto quando categoria muda automaticamente
    const [flashCategoryId, setFlashCategoryId] = useState<string | null>(null);
    const flashTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Debounce para o observer para melhorar performance
    const debouncedCategoryUpdate = useCallback((category: string) => {
        if (observerTimeoutRef.current) {
            clearTimeout(observerTimeoutRef.current);
        }

        observerTimeoutRef.current = setTimeout(() => {
            if (category !== selectedCategory) {
                setSelectedCategory(category);
                // Mostrar destaque curto no título apenas quando não for rolagem manual
                if (!isManualScrolling) {
                    if (flashTimeoutRef.current) {
                        clearTimeout(flashTimeoutRef.current);
                    }
                    setFlashCategoryId(category);
                    flashTimeoutRef.current = setTimeout(() => setFlashCategoryId(null), 1100);
                }
            }
        }, isIPhone ? 200 : 150); // Debounce reduzido para melhor responsividade
    }, [selectedCategory, isIPhone, isManualScrolling]);

    useEffect(() => {
        // Não atualiza categoria se estiver buscando
        if (isSearching) return;

        // Observer simplificado: só detecta o primeiro elemento visível e atualiza categoria
        const observer = new IntersectionObserver((entries) => {
            if (!isManualScrolling) {
                const firstVisible = entries.find(entry => entry.isIntersecting);
                if (firstVisible && firstVisible.target instanceof HTMLElement && firstVisible.target.id) {
                    const category = firstVisible.target.id.replace('category-', '');
                    debouncedCategoryUpdate(category);
                }
            }
        }, {
            rootMargin: '-100px 0px -20% 0px',
            threshold: [0, 0.15]
        });

        // Observa todos os elementos de categoria
        const timeoutId = setTimeout(() => {
            (displayCategories || []).forEach(category => {
                const element = document.getElementById(`category-${category._id}`);
                if (element) observer.observe(element);
            });
        }, 200);

        return () => {
            clearTimeout(timeoutId);
            if (observerTimeoutRef.current) clearTimeout(observerTimeoutRef.current);
            if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
            (displayCategories || []).forEach(category => {
                const element = document.getElementById(`category-${category._id}`);
                if (element) observer.unobserve(element);
            });
            observer.disconnect();
        };
    }, [displayCategories, isManualScrolling, selectedCategory, isSearching]);

    // Listener de scroll para detectar quando a rolagem termina
    useEffect(() => {
        let scrollTimeout: NodeJS.Timeout;

        const handleScroll = () => {
            // Se não estiver em modo manual, não fazer nada
            if (!isManualScrolling) return;

            // Limpar timeout anterior
            clearTimeout(scrollTimeout);

            // Setar um novo timeout para detectar quando a rolagem parou
            scrollTimeout = setTimeout(() => {
                // Permitir que o observer funcione novamente quando a rolagem parar
                setIsManualScrolling(false);
            }, 200); // Tempo para detectar o fim da rolagem
        };

        // Adicionar listener de scroll apenas quando em modo manual
        if (isManualScrolling) {
            window.addEventListener('scroll', handleScroll, { passive: true });
        }

        return () => {
            clearTimeout(scrollTimeout);
            window.removeEventListener('scroll', handleScroll);
        };
    }, [isManualScrolling]);

    // Definir categoria inicial e garantir visualização correta
    useEffect(() => {
        if ((displayCategories || []).length > 0 && !selectedCategory) {
            // Usar a primeira categoria da lista ordenada
            const firstCategory = displayCategories[0];
            const categoryId = firstCategory._id;
            setSelectedCategory(categoryId);

            // Pequeno atraso para garantir que os elementos do DOM foram renderizados
            setTimeout(() => {
                // Detectar tamanho da tela
                const isMobile = window.innerWidth < 640;

                // Garantir que a primeira categoria esteja visível na barra de categorias
                const categoryBtn = document.querySelector(`button[data-category="${categoryId}"]`);
                if (categoryBtn) {
                    const scrollContainer = categoryBtn.closest('.scrollbar-hide');
                    if (scrollContainer) {
                        // Centralizar tanto em mobile quanto em desktop
                        const btnRect = categoryBtn.getBoundingClientRect();
                        const containerRect = scrollContainer.getBoundingClientRect();

                        if (categoryBtn instanceof HTMLElement) {
                            const targetScrollLeft = categoryBtn.offsetLeft - (containerRect.width / 2) + (btnRect.width / 2);
                            const maxScroll = scrollContainer.scrollWidth - containerRect.width;
                            const finalScrollLeft = Math.max(0, Math.min(targetScrollLeft, maxScroll));

                            scrollContainer.scrollLeft = finalScrollLeft;
                        }
                    }
                }

                // Garantir que a seção da categoria esteja visível
                const categorySection = document.getElementById(`category-${categoryId}`);
                if (categorySection) {
                    const headerHeight = isMobile ? 100 : 120;

                    categorySection.scrollIntoView({
                        behavior: 'auto',
                        block: 'start'
                    });

                    window.scrollBy({
                        top: -headerHeight,
                        behavior: 'auto'
                    });
                }
            }, 300);
        }
    }, [displayCategories, selectedCategory]);    // Fechar menu com tecla Escape e swipe
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsMenuOpen(false);
            }
        };

        const handleTouchStart = (e: TouchEvent) => {
            setTouchStart(e.targetTouches[0].clientX);
        };

        const handleTouchMove = (e: TouchEvent) => {
            setTouchEnd(e.targetTouches[0].clientX);
        };

        const handleTouchEnd = () => {
            if (!touchStart || !touchEnd) return;

            const distance = touchStart - touchEnd;
            const isLeftSwipe = distance > 50;

            if (isLeftSwipe && isMenuOpen) {
                setIsMenuOpen(false);
            }

            setTouchStart(null);
            setTouchEnd(null);
        };

        if (isMenuOpen) {
            document.addEventListener('keydown', handleEscape);
            document.addEventListener('touchstart', handleTouchStart);
            document.addEventListener('touchmove', handleTouchMove);
            document.addEventListener('touchend', handleTouchEnd);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
            document.body.style.overflow = 'unset';
        };
    }, [isMenuOpen, touchStart, touchEnd]);

    // Scroll horizontal automático da barra de categorias - centralizado em desktop e mobile
    useEffect(() => {
        if (!selectedCategory) return;

        const btn = document.querySelector(`button[data-category='${selectedCategory}']`);
        if (!btn) return;

        // Detectar se estamos em modo mobile
        const isMobile = window.innerWidth < 640;

        // Centralizar a categoria selecionada na barra de navegação
        const scrollContainer = btn.closest('.scrollbar-hide');
        if (scrollContainer) {
            const btnRect = btn.getBoundingClientRect();
            const containerRect = scrollContainer.getBoundingClientRect();

            // Calcular a posição de scroll de acordo com o dispositivo
            let targetScrollLeft = 0;
            if (btn instanceof HTMLElement) {
                if (isMobile) {
                    // No mobile, centralizar o botão na tela
                    targetScrollLeft = btn.offsetLeft - (containerRect.width / 2) + (btnRect.width / 2);
                } else {
                    // No desktop, centralizar o botão
                    targetScrollLeft = btn.offsetLeft - (containerRect.width / 2) + (btnRect.width / 2);
                }

                // Adicionar verificação para evitar rolagem além dos limites
                const maxScroll = scrollContainer.scrollWidth - containerRect.width;
                targetScrollLeft = Math.max(0, Math.min(targetScrollLeft, maxScroll));
            }

            // Aplicar rolagem instantânea
            try {
                (scrollContainer as HTMLElement).style.scrollBehavior = 'auto';
            } catch { }
            scrollContainer.scrollTo({
                left: targetScrollLeft,
                behavior: 'auto'
            });
        } else {
            // Fallback para o método padrão se não encontrar o container
            (btn as HTMLElement).scrollIntoView({
                behavior: 'auto',
                inline: 'center',
                block: 'nearest'
            });
        }
    }, [selectedCategory]);

    useEffect(() => {
        const interval = setInterval(async () => {
            const notifyOrders = JSON.parse(localStorage.getItem('notifyOrders') || '[]');
            if (notifyOrders.length === 0) return;
            for (const orderId of notifyOrders) {
                try {
                    const res = await fetch(`/api/pedidos/${orderId}`);
                    if (!res.ok) continue;
                    const data = await res.json();
                    const pedido = data.data || data;
                    if (!pedido || !pedido.status) continue;
                    localStorage.setItem(`notifyStatus_${orderId}`, pedido.status);
                } catch (e) { /* ignorar erros */ }
            }
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    // Bloquear scroll para modal de WhatsApp
    useEffect(() => {
        if (showWhatsAppModal) {
            document.body.classList.add('overflow-hidden');
            const preventDefault = (e: Event) => e.preventDefault();
            document.body.addEventListener('touchmove', preventDefault, { passive: false });

            return () => {
                document.body.classList.remove('overflow-hidden');
                document.body.removeEventListener('touchmove', preventDefault);
            };
        } else {
            document.body.classList.remove('overflow-hidden');
        }
    }, [showWhatsAppModal]);

    // Bloquear scroll para modal de sucesso do pedido
    useEffect(() => {
        if (orderSuccessId) {
            document.body.classList.add('overflow-hidden');
            const preventDefault = (e: Event) => e.preventDefault();
            document.body.addEventListener('touchmove', preventDefault, { passive: false });

            return () => {
                document.body.classList.remove('overflow-hidden');
                document.body.removeEventListener('touchmove', preventDefault);
            };
        } else {
            document.body.classList.remove('overflow-hidden');
        }
    }, [orderSuccessId]); const calculateDeliveryFee = (neighborhood: string, tipoEntrega: string) => {
        if (tipoEntrega === 'retirada') return 0;
        const deliveryFee = deliveryFees.find(fee => fee.neighborhood === neighborhood);
        return deliveryFee ? deliveryFee.fee : 0;
    };

    const handleAddToCart = (item: MenuItem, quantity: number, observation: string, size?: string, border?: string, extras?: string[]) => {
        let price = item.price;
        if (item.category === 'pizzas' && size && item.sizes) {
            const sizeKey = size as keyof typeof item.sizes;

            if (observation && observation.includes('Meio a meio:')) {
                const [sabor1, sabor2] = observation.split('Meio a meio:')[1].split('/').map(s => s.trim());
                const pizzas = menuItems.filter((p: MenuItem) => p.category === 'pizzas');
                const pizza1 = pizzas.find((p: MenuItem) => p.name === sabor1);
                const pizza2 = pizzas.find((p: MenuItem) => p.name === sabor2);

                if (pizza1 && pizza2) {
                    const price1 = pizza1.sizes ? pizza1.sizes[sizeKey] || pizza1.price : pizza1.price;
                    const price2 = pizza2.sizes ? pizza2.sizes[sizeKey] || pizza2.price : pizza2.price;
                    price = Math.max(price1, price2);
                }
            } else {
                price = item.sizes[sizeKey] || price;
            }

            if (border && item.borderOptions) {
                const borderPrice = sizeKey === 'G' ? 8.00 : 4.00;
                price += borderPrice;
            }
            if (extras && item.extraOptions) {
                extras.forEach(extra => {
                    const extraPrice = item.extraOptions![extra];
                    if (extraPrice) {
                        price += extraPrice;
                    }
                });
            }
        }

        addToCart(item, quantity, observation, size, border, extras);
        setSelectedItem(null);
    };

    const handleCheckout = () => {
        const customerName = localStorage.getItem('customerName') || '';
        const customerPhone = localStorage.getItem('customerPhone') || '';
        const customerAddress = localStorage.getItem('customerAddress') || '';
        const customerNeighborhood = localStorage.getItem('customerNeighborhood') || '';
        const customerComplement = localStorage.getItem('customerComplement') || '';
        const customerReferencePoint = localStorage.getItem('customerReferencePoint') || '';
        const customerNumber = localStorage.getItem('customerNumber') || '';
        const troco = localStorage.getItem('troco') || '';

        const deliveryFee = calculateDeliveryFee(customerNeighborhood, tipoEntrega);
        const subtotal = cartItems.reduce((sum, item) => sum + calculateItemPrice(item), 0);
        const valorFinal = subtotal + deliveryFee;

        const customerInfo = `\nNome: ${customerName}\nTelefone: ${customerPhone}`;
        const addressInfo = tipoEntrega === 'entrega' ? `\nEndereço: ${customerAddress}, ${customerNumber}${customerComplement ? `, ${customerComplement}` : ''}\nBairro: ${customerNeighborhood}\nPonto de Referência: ${customerReferencePoint}` : '';
        const paymentInfo = formaPagamento === 'pix' ? '\nForma de Pagamento: PIX\n' :
            formaPagamento === 'dinheiro' ? `\nForma de Pagamento: Dinheiro${troco ? `\nTroco para: R$ ${troco}` : ''}\n` :
                formaPagamento === 'cartao' ? '\nForma de Pagamento: Cartão\n' : '';

        const message = `*Novo Pedido*\n${customerInfo}${addressInfo}${paymentInfo}\n*Itens:*\n${cartItems.map(item => {
            let itemText = `${item.quantity}x ${item.item.name}`;
            if (item.size) itemText += ` (${item.size})`;
            if (item.border) itemText += ` - Borda: ${item.border}`;
            if (item.extras && item.extras.length > 0) {
                itemText += ` - Extras: ${item.extras.join(', ')}`;
            }
            if (item.observation) itemText += ` - ${item.observation}`;
            itemText += ` - R$ ${calculateItemPrice(item).toFixed(2)}`;
            return itemText;
        }).join('\n')}\n\n*Valor Final: R$ ${valorFinal.toFixed(2)}*${formaPagamento === 'pix' ? `\n\n*Chave PIX para pagamento:* ${pixKey}` : ''}`;

        setOrderDetails(cartItems);
        setShowWhatsAppModal(true);
    };

    const calculateItemPrice = (item: CartItem) => {
        let price = item.item.price;

        if (item.size && item.item.sizes) {
            if (item.item.sizes[item.size as keyof typeof item.item.sizes]) {
                price = item.item.sizes[item.size as keyof typeof item.item.sizes] ?? price;
            }
        }

        if (
            item.item.category === 'pizzas' &&
            item.size &&
            item.item.sizes &&
            item.observation &&
            item.observation.includes('Meio a meio:')
        ) {
            const sizeKey = item.size as keyof typeof item.item.sizes;
            const [sabor1, sabor2] = item.observation
                .split('Meio a meio:')[1]
                .split('/')
                .map(s => s.trim());
            const pizzas = menuItems.filter((p: MenuItem) => p.category === 'pizzas');
            const pizza1 = pizzas.find((p: MenuItem) => p.name === sabor1);
            const pizza2 = pizzas.find((p: MenuItem) => p.name === sabor2);
            if (pizza1 && pizza2) {
                const price1 = pizza1.sizes ? pizza1.sizes[sizeKey] ?? pizza1.price : pizza1.price;
                const price2 = pizza2.sizes ? pizza2.sizes[sizeKey] ?? pizza2.price : pizza2.price;
                price = Math.max(price1, price2);
            }
        }

        if (item.item.category === 'pizzas' && item.size && item.item.sizes) {
            const sizeKey = item.size as keyof typeof item.item.sizes;
            if (item.border && item.item.borderOptions) {
                const borderPrice = sizeKey === 'G' ? 8.00 : 4.00;
                price += borderPrice;
            }
            if (item.extras && item.item.extraOptions) {
                item.extras.forEach(extra => {
                    const extraPrice = item.item.extraOptions![extra];
                    if (extraPrice) {
                        price += extraPrice;
                    }
                });
            }
        }

        return price * item.quantity;
    };

    const handleShareClick = () => {
        const customerName = localStorage.getItem('customerName') || '';
        const customerPhone = localStorage.getItem('customerPhone') || '';
        const customerAddress = localStorage.getItem('customerAddress') || '';
        const customerNeighborhood = localStorage.getItem('customerNeighborhood') || '';
        const customerComplement = localStorage.getItem('customerComplement') || '';
        const customerReferencePoint = localStorage.getItem('customerReferencePoint') || '';
        const customerNumber = localStorage.getItem('customerNumber') || '';
        const troco = localStorage.getItem('troco') || '';

        const deliveryFee = calculateDeliveryFee(customerNeighborhood, tipoEntrega);
        const subtotal = cartItems.reduce((sum, item) => sum + calculateItemPrice(item), 0);
        const valorFinal = subtotal + deliveryFee;

        const customerInfo = `\nNome: ${customerName}\nTelefone: ${customerPhone}`;
        const addressInfo = tipoEntrega === 'entrega' ? `\nEndereço: ${customerAddress}, ${customerNumber}${customerComplement ? `, ${customerComplement}` : ''}\nBairro: ${customerNeighborhood}\nPonto de Referência: ${customerReferencePoint}` : '';
        const paymentInfo = formaPagamento === 'pix' ? '\nForma de Pagamento: PIX\n' :
            formaPagamento === 'dinheiro' ? `\nForma de Pagamento: Dinheiro${troco ? `\nTroco para: R$ ${troco}` : ''}\n` :
                formaPagamento === 'cartao' ? '\nForma de Pagamento: Cartão\n' : '';

        const itemsInfo = cartItems.map(item => {
            let itemText = `${item.quantity}x ${item.item.name}`;
            if (item.size) itemText += ` (${item.size})`;
            if (item.border) itemText += ` - Borda: ${item.border}`;
            if (item.extras && item.extras.length > 0) {
                itemText += ` - Extras: ${item.extras.join(', ')}`;
            }
            if (item.observation) itemText += ` - ${item.observation}`;
            itemText += ` - R$ ${calculateItemPrice(item).toFixed(2)}`;
            return itemText;
        }).join('\n');

        const message = `*Novo Pedido*\n${customerInfo}${addressInfo}${paymentInfo}\n*Itens:*\n${itemsInfo}\n\n*Valor Final: R$ ${valorFinal.toFixed(2)}*\n\n*Chave PIX do estabelecimento:* ${pixKey}`;

        if (navigator.share) {
            navigator.share({
                title: 'Meu Pedido',
                text: message
            });
        } else {
            alert('Compartilhamento não suportado neste navegador.');
        }
        setShowWhatsAppModal(false);
    };

    const handleWhatsAppClick = () => {
        const customerName = localStorage.getItem('customerName') || '';
        const customerPhone = localStorage.getItem('customerPhone') || '';
        const customerAddress = localStorage.getItem('customerAddress') || '';
        const customerNeighborhood = localStorage.getItem('customerNeighborhood') || '';
        const customerComplement = localStorage.getItem('customerComplement') || '';
        const customerReferencePoint = localStorage.getItem('customerReferencePoint') || '';
        const customerNumber = localStorage.getItem('customerNumber') || '';
        const troco = localStorage.getItem('troco') || '';

        const deliveryFee = calculateDeliveryFee(customerNeighborhood, tipoEntrega);
        const subtotal = cartItems.reduce((sum, item) => sum + calculateItemPrice(item), 0);
        const valorFinal = subtotal + deliveryFee;

        const customerInfo = `\nNome: ${customerName}\nTelefone: ${customerPhone}`;
        const addressInfo = tipoEntrega === 'entrega' ? `\nEndereço: ${customerAddress}, ${customerNumber}${customerComplement ? `, ${customerComplement}` : ''}\nBairro: ${customerNeighborhood}\nPonto de Referência: ${customerReferencePoint}` : '';
        const paymentInfo = formaPagamento === 'pix' ? '\nForma de Pagamento: PIX\n' :
            formaPagamento === 'dinheiro' ? `\nForma de Pagamento: Dinheiro${troco ? `\nTroco para: R$ ${troco}` : ''}\n` :
                formaPagamento === 'cartao' ? '\nForma de Pagamento: Cartão\n' : '';

        const itemsInfo = cartItems.map(item => {
            let itemText = `${item.quantity}x ${item.item.name}`;
            if (item.size) itemText += ` (${item.size})`;
            if (item.border) itemText += ` - Borda: ${item.border}`;
            if (item.extras && item.extras.length > 0) {
                itemText += ` - Extras: ${item.extras.join(', ')}`;
            }
            if (item.observation) itemText += ` - ${item.observation}`;
            itemText += ` - R$ ${calculateItemPrice(item).toFixed(2)}`;
            return itemText;
        }).join('\n');

        const message = `*Novo Pedido*\n${customerInfo}${addressInfo}${paymentInfo}\n*Itens:*\n${itemsInfo}\n\n*Valor Final: R$ ${valorFinal.toFixed(2)}*\n\n*Chave PIX do estabelecimento:* ${pixKey}`;

        const whatsappUrl = `https://wa.me/55${whatsappNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        setShowWhatsAppModal(false);
    };

    useEffect(() => {
        if (orderSuccessId) {
            const notifyOrders = JSON.parse(localStorage.getItem('notifyOrders') || '[]');
            if (!notifyOrders.includes(orderSuccessId)) {
                notifyOrders.push(orderSuccessId);
                localStorage.setItem('notifyOrders', JSON.stringify(notifyOrders));
            }
            setOrderSuccessId(null);
        }
    }, [orderSuccessId]);

    const handlePastaClick = (item: MenuItem) => {
        setSelectedPasta(item);
    };

    const handlePastaClose = () => {
        setSelectedPasta(null);
    };

    const handlePastaAddToCart = (quantity: number, observation: string, size?: 'P' | 'G') => {
        if (selectedPasta) {
            addToCart(selectedPasta, quantity, observation, size);
            setSelectedPasta(null);
        }
    };

    // Forçar seleção da primeira categoria ao rolar para o topo
    // E detectar quando o usuário para de rolar para reativar o observer
    useEffect(() => {
        let scrollTimeout: NodeJS.Timeout;

        const handleScroll = () => {
            // Só realizar esta ação se não estiver em rolagem manual
            if (!isManualScrolling && window.scrollY < 30 && displayCategories.length > 0) {
                const salgadosCategory = displayCategories.find(cat => cat.name.toLowerCase().includes('salgado'));
                const firstCategoryId = salgadosCategory ? salgadosCategory._id : displayCategories[0]._id;
                if (selectedCategory !== firstCategoryId) {
                    setSelectedCategory(firstCategoryId);
                }
            }

            // Detectar quando o usuário para de rolar (debounce)
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                // Se estava em modo manual e parou de rolar, desabilitar o modo manual
                if (isManualScrolling) {
                    setIsManualScrolling(false);
                }
            }, 150); // 150ms após parar de rolar
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', handleScroll);
            clearTimeout(scrollTimeout);
        };
    }, [displayCategories, selectedCategory, isManualScrolling]);

    if (!restaurantIsOpen) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
                <div className="text-center max-w-md mx-auto">
                    <div className="bg-gray-800 rounded-2xl shadow-2xl border border-yellow-500/30 p-8">
                        {isLoadingSettings ? (
                            <div className="mb-6">
                                <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                    <svg className="w-8 h-8 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-bold text-yellow-500 mb-3">Rei dos Salgados</h2>
                                <p className="text-gray-300 text-lg">Verificando horário de funcionamento...</p>
                            </div>
                        ) : (
                            <div className="mb-6">
                                <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-bold text-yellow-500 mb-3">Estabelecimento Fechado</h2>
                                <p className="text-gray-300 text-lg">Desculpe, estamos fechados no momento.</p>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                                <h3 className="text-yellow-400 font-semibold mb-2">Horário de Funcionamento</h3>
                                <div className="text-gray-300 text-sm space-y-1">
                                    {isLoadingSettings ? (
                                        <div className="flex items-center justify-center py-4">
                                            <svg className="animate-spin h-6 w-6 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span className="ml-2 text-gray-400">Carregando horários...</span>
                                        </div>
                                    ) : businessHours ? (
                                        formatBusinessHours(businessHours)?.map((day, index) => (
                                            <div key={index} className="flex justify-between">
                                                <span>{day.day}:</span>
                                                {day.open ? (
                                                    <span className="text-white font-medium">
                                                        {day.start.slice(0, 2)}h{day.start.slice(3, 5)} às {day.end.slice(0, 2)}h{day.end.slice(3, 5)}
                                                    </span>
                                                ) : (
                                                    <span className="text-red-400 font-medium">Fechado</span>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-gray-400">Não encontramos horários disponíveis.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (isLoadingSettings) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="mb-6">
                        <div className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                            <svg className="w-10 h-10 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-yellow-500 mb-2">Rei dos Salgados</h2>
                        <p className="text-gray-400">Carregando cardápio...</p>
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-500"></div>
                        <span className="text-gray-400">Preparando tudo para você</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen bg-gray-900 ${isIPhone ? 'iphone-optimized' : ''}`}>
            <div className="max-w-7xl mx-auto px-4">
                {/* Barra de Navegação com Categorias - Versão otimizada para mobile e iPhone */}
                <div className={`sticky top-0 z-30 w-full bg-gray-900 shadow-lg border-b border-yellow-500/30 ${isIPhone ? 'safe-area-top' : ''}`}>
                    <div className="w-full flex flex-col">

                        {/* Barra de ações: busca e hambúrguer */}
                        <div className="w-full px-4 sm:px-6 pt-3 pb-1 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1">
                                <button
                                    aria-label="Buscar itens"
                                    onClick={() => setIsSearchOpen(v => !v)}
                                    className="p-2 rounded-lg bg-gray-800 text-gray-300 hover:text-yellow-400 border border-gray-700"
                                >
                                    <FaSearch />
                                </button>
                                {isSearchOpen && (
                                    <input
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Buscar item..."
                                        className="flex-1 min-w-0 bg-gray-800 text-gray-100 placeholder-gray-400 border border-gray-700 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-yellow-500"
                                    />
                                )}
                            </div>
                            <button
                                aria-label="Abrir lista de categorias"
                                onClick={() => setIsCategoryModalOpen(true)}
                                className="p-2 rounded-lg bg-gray-800 text-gray-300 hover:text-yellow-400 border border-gray-700"
                            >
                                <FaBars />
                            </button>
                        </div>

                        {/* Barra de Categorias Scrollável - Otimizada para mobile e iPhone */}
                        <div className="relative pb-1">
                            <div className={`w-full overflow-x-auto scrollbar-hide category-bar-container py-1 ${isIPhone ? 'ios-scroll-smooth' : ''}`}>
                                <div className="flex justify-start sm:justify-center space-x-2 sm:space-x-3 min-w-min px-4 sm:px-6 mx-auto">
                                    {displayCategories.map((cat) => {
                                        // Usar contagem de acordo com busca
                                        const sourceCount = isSearching ? filteredItemsByCategory : itemsByCategory;
                                        const itemCount = sourceCount[cat._id]?.length || 0;
                                        return (
                                            <button
                                                key={cat._id}
                                                onClick={() => handleCategoryClick(cat._id)}
                                                data-category={cat._id}
                                                aria-selected={selectedCategory === cat._id}
                                                className={`
                                                    relative flex items-center gap-1.5 sm:gap-2
                                                    px-2.5 sm:px-4 py-1.5 sm:py-2.5
                                                    rounded-lg
                                                    ${isIPhone ? 'touch-manipulation min-h-[44px]' : ''} 
                                                    ${selectedCategory === cat._id
                                                        ? 'bg-yellow-500 text-gray-900 font-medium shadow-lg active'
                                                        : 'bg-gray-800/80 text-gray-300 hover:bg-yellow-500/20 hover:text-yellow-400 border border-gray-700'}
                                                `}
                                            >
                                                <span
                                                    className={`text-base sm:text-lg ${selectedCategory === cat._id ? 'text-gray-900' : ''}`}
                                                    role="img"
                                                    aria-label={`Emoji para ${cat.name}`}
                                                >
                                                    {cat.emoji || '🍽️'}
                                                </span>
                                                {/* Texto completo sem truncamento */}
                                                <div className="flex flex-col items-start min-w-0 max-w-none">
                                                    <span className="text-2xs sm:text-xs font-medium whitespace-normal break-normal leading-tight">{cat.name}</span>
                                                    <span className="text-[9px] sm:text-[10px] opacity-75 whitespace-normal">{itemCount} {itemCount === 1 ? 'item' : 'itens'}</span>
                                                </div>
                                                {/* Overlay de toque removido para reduzir custo de pintura */}
                                                {selectedCategory === cat._id && (
                                                    <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-yellow-300" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>                {/* Menu lateral removido - todas as categorias agora aparecem na barra horizontal acima */}

                {/* Conteúdo Principal */}
                <div className="py-4">
                    {(displayCategories || []).length === 0 ? (
                        <div className="text-center text-gray-400 py-16 text-lg font-semibold">
                            Sem itens e categorias adicionadas
                        </div>
                    ) : (
                        <motion.div
                            className="space-y-8"
                        >
                            {(displayCategories || []).map(cat => {
                                const source = isSearching ? filteredItemsByCategory : itemsByCategory;
                                const itemsInCategory = source[cat._id] || [];
                                return (
                                    <div key={cat._id} id={`category-${cat._id}`} className="space-y-3 transition-colors duration-300 ease-in-out">
                                        <h2 className={`text-base sm:text-lg font-semibold text-white capitalize mb-2 sm:mb-4 mt-6 sm:mt-8 pl-3 sm:pl-4 tracking-wide flex items-center transition-colors duration-300 ${flashCategoryId === cat._id ? 'bg-yellow-500/10 ring-1 ring-yellow-400/40 rounded-md py-2 pr-3' : ''}`}
                                            aria-live={flashCategoryId === cat._id ? 'polite' : undefined}
                                        >
                                            <span className={`w-1.5 h-6 rounded-r-md mr-2.5 ${flashCategoryId === cat._id ? 'bg-yellow-300' : 'bg-yellow-500 opacity-70'}`}></span>
                                            {cat.name}
                                        </h2>
                                        <div className="space-y-2">
                                            {itemsInCategory.length === 0 ? (
                                                <div className="text-gray-500 text-sm italic px-4 py-6">{isSearching ? 'Nenhum item corresponde à sua busca' : 'Nenhum item nesta categoria'}</div>
                                            ) : (
                                                itemsInCategory.map((item: MenuItem) => (
                                                    <motion.div
                                                        key={item._id}
                                                        className={`bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-150 border border-yellow-500 hover:bg-gray-750 hover:border-yellow-400 w-full ${item.isMainType ? 'mb-4' : ''}`}
                                                        style={{ willChange: 'transform' }}
                                                        onClick={() => handleItemClick(item)}
                                                        initial={{ opacity: 0, y: 30 }}
                                                        whileInView={{ opacity: 1, y: 0 }}
                                                        viewport={{ once: true, amount: 0.2 }}
                                                        transition={{ duration: 0.4, ease: 'easeOut' }}
                                                    >
                                                        {item.isMainType ? (
                                                            // Exibição para tipos de salgados com sabores
                                                            <div className="p-4">
                                                                <div className="flex items-center gap-3 mb-3 min-w-0">
                                                                    <div className="flex-shrink-0 w-16 h-16 bg-gray-900 rounded-lg">
                                                                        <Image
                                                                            src={item.image || '/placeholder.jpg'}
                                                                            alt={item.name}
                                                                            width={64}
                                                                            height={64}
                                                                            className="object-cover w-full h-full rounded-lg"
                                                                            quality={75}
                                                                        />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center gap-2 mb-1 min-w-0">
                                                                            <h3 className="text-lg font-bold text-yellow-400 min-w-0 line-clamp-2 overflow-hidden break-normal hyphens-auto">
                                                                                {cat.emoji || '🍽️'} {item.name}
                                                                            </h3>
                                                                            {item.available === false && (
                                                                                <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">
                                                                                    Indisponível
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <p className="text-gray-400 text-xs sm:text-sm line-clamp-2 sm:line-clamp-3 overflow-hidden break-normal hyphens-auto">{item.description}</p>
                                                                    </div>
                                                                </div>

                                                                {item.flavors && item.flavors.length > 0 && (
                                                                    <div className="space-y-2">
                                                                        <h4 className="text-sm font-medium text-green-400 mb-2">Sabores disponíveis:</h4>
                                                                        <div className="grid grid-cols-1 gap-2">
                                                                            {item.flavors.map((flavor, index) => (
                                                                                <motion.div
                                                                                    key={index}
                                                                                    whileHover={{ scale: 1.02 }}
                                                                                    whileTap={{ scale: 0.98 }}
                                                                                    onClick={() => flavor.available && setMiniModalItem({
                                                                                        ...item,
                                                                                        name: `${item.name} - ${flavor.name}`,
                                                                                        description: flavor.description || item.description,
                                                                                        price: flavor.price,
                                                                                        available: flavor.available,
                                                                                        isMainType: false
                                                                                    } as MenuItem)}
                                                                                    className={`
                                                                                        bg-gray-900 rounded-lg p-3 transition-all duration-150 border
                                                                                        ${flavor.available
                                                                                            ? 'border-gray-600 hover:border-yellow-500 cursor-pointer hover:bg-gray-750'
                                                                                            : 'border-gray-700 opacity-60 cursor-not-allowed'
                                                                                        }
                                                                                    `}
                                                                                >
                                                                                    <div className="flex items-center justify-between">
                                                                                        <div className="flex-1">
                                                                                            <div className="flex items-center gap-2 mb-1">
                                                                                                <span className={`font-medium ${flavor.available ? 'text-white' : 'text-gray-500 line-through'}`}>
                                                                                                    {flavor.name}
                                                                                                </span>
                                                                                                {!flavor.available && (
                                                                                                    <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">
                                                                                                        Indisponível
                                                                                                    </span>
                                                                                                )}
                                                                                            </div>
                                                                                            {flavor.description && (
                                                                                                <p className="text-xs text-gray-400">{flavor.description}</p>
                                                                                            )}
                                                                                        </div>
                                                                                        <div className="flex items-center gap-2">
                                                                                            <span className={`font-bold text-lg ${flavor.available ? 'text-green-400' : 'text-gray-500'}`}>
                                                                                                R$ {formatBRL(flavor.price)}
                                                                                            </span>
                                                                                            {flavor.available && (
                                                                                                <motion.button
                                                                                                    whileHover={isLowEndDevice ? undefined : { scale: 1.03 }}
                                                                                                    whileTap={isLowEndDevice ? undefined : { scale: 0.97 }}
                                                                                                    transition={isLowEndDevice ? undefined : { duration: 0.1 }}
                                                                                                    onClick={(e) => {
                                                                                                        e.stopPropagation();
                                                                                                        setMiniModalItem({
                                                                                                            ...item,
                                                                                                            name: `${item.name} - ${flavor.name}`,
                                                                                                            description: flavor.description || item.description,
                                                                                                            price: flavor.price,
                                                                                                            available: flavor.available,
                                                                                                            isMainType: false
                                                                                                        } as MenuItem);
                                                                                                    }}
                                                                                                    className={`bg-yellow-500 text-gray-900 rounded-lg font-medium hover:bg-yellow-400 transition-colors duration-150 ${isIPhone ? 'p-3 touch-manipulation min-h-[36px] min-w-[36px]' : 'p-2'}`}
                                                                                                >
                                                                                                    <FaPlus className={`${isIPhone ? 'text-sm' : 'text-sm'}`} />
                                                                                                </motion.button>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                </motion.div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            // Card horizontal estilo site de referência
                                                            <div
                                                                onClick={() => setMiniModalItem(item)}
                                                                className="cursor-pointer p-4 hover:bg-gray-750 transition-colors duration-150"
                                                            >
                                                                <div className="flex items-center gap-4 w-full">
                                                                    {/* Imagem redonda */}
                                                                    <div className="flex-shrink-0 w-16 h-16 md:w-20 md:h-20 bg-gray-700 rounded-lg overflow-hidden">
                                                                        <Image
                                                                            src={item.image || '/placeholder.jpg'}
                                                                            alt={item.name}
                                                                            width={80}
                                                                            height={80}
                                                                            className="object-cover w-full h-full"
                                                                        />
                                                                    </div>

                                                                    {/* Conteúdo central */}
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <h3 className="text-base md:text-lg font-semibold text-white truncate" title={item.name}>
                                                                                {item.name}
                                                                            </h3>
                                                                            {item.available === false && (
                                                                                <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded whitespace-nowrap flex-shrink-0">
                                                                                    Indisponível
                                                                                </span>
                                                                            )}
                                                                        </div>

                                                                        <p className="text-gray-400 text-sm mb-2 line-clamp-2" title={item.description}>
                                                                            {item.description}
                                                                        </p>

                                                                        {/* Preço com badge de desconto */}
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="flex items-center gap-2">
                                                                                {/* Badge de desconto */}
                                                                                {typeof item.originalPrice === 'number' && item.originalPrice > (item.price || 0) && item.originalPrice > 0 && (
                                                                                    <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                                                                        -{Math.round(100 - (item.price / item.originalPrice) * 100)}%
                                                                                    </span>
                                                                                )}

                                                                                {/* Preços */}
                                                                                <div className="flex flex-col">
                                                                                    {item.sizes && Object.keys(item.sizes).length > 0 && (
                                                                                        <span className="text-xs text-gray-400">A partir de</span>
                                                                                    )}
                                                                                    <div className="flex items-center gap-2">
                                                                                        <span className="text-yellow-500 font-bold text-lg">
                                                                                            {(() => {
                                                                                                const base = item.sizes && Object.keys(item.sizes).length > 0
                                                                                                    ? Math.min(...(Object.values(item.sizes).filter(v => v !== undefined) as number[]))
                                                                                                    : item.price;
                                                                                                return `R$ ${formatBRL(base)}`;
                                                                                            })()}
                                                                                        </span>
                                                                                        {typeof item.originalPrice === 'number' && item.originalPrice > (item.price || 0) && (
                                                                                            <span className="text-sm text-gray-400 line-through">
                                                                                                R$ {formatBRL(item.originalPrice)}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Botão circular à direita */}
                                                                    <div className="flex-shrink-0">
                                                                        {item.available === false ? (
                                                                            <div className="text-xs text-red-400 text-center">
                                                                                Indisponível
                                                                            </div>
                                                                        ) : (
                                                                            <motion.button
                                                                                whileHover={isLowEndDevice ? undefined : { scale: 1.05 }}
                                                                                whileTap={isLowEndDevice ? undefined : { scale: 0.95 }}
                                                                                transition={isLowEndDevice ? undefined : { duration: 0.1 }}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setMiniModalItem(item);
                                                                                }}
                                                                                className="w-10 h-10 bg-yellow-500 hover:bg-yellow-400 text-gray-900 rounded-full flex items-center justify-center font-bold text-lg transition-colors duration-150"
                                                                            >
                                                                                +
                                                                            </motion.button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </motion.div>
                    )}
                </div>

                <AnimatePresence>
                    {selectedItem && (
                        <ItemModal
                            item={selectedItem}
                            onClose={() => setSelectedItem(null)}
                            // CORREÇÃO: Adicionamos os tipos corretos aos parâmetros da função
                            onAddToCart={(
                                quantity: number,
                                observation: string,
                                size?: string,
                                border?: string,
                                extras?: string[]
                            ) => {
                                handleAddToCart(selectedItem!, quantity, observation, size, border, extras);
                                setSelectedItem(null);
                            }}
                            allPizzas={allPizzas}
                        />
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {selectedPasta && (
                        <PastaModal
                            item={selectedPasta}
                            onClose={handlePastaClose}
                            onAddToCart={handlePastaAddToCart}
                        />
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {isCartOpen && (
                        <Cart
                            items={cartItems}
                            onUpdateQuantity={updateQuantity}
                            onRemoveItem={removeFromCart}
                            onCheckout={handleCheckout}
                            onClose={() => setIsCartOpen(false)}

                        />
                    )}
                </AnimatePresence>

                {/* Modal do WhatsApp */}
                <AnimatePresence>
                    {showWhatsAppModal && (
                        <motion.div
                            className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <motion.div
                                className="bg-gray-900 rounded-xl shadow-xl max-w-md w-full mx-4 text-center max-h-[90vh] flex flex-col"
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0.8 }}
                            >
                                {/* Cabeçalho fixo */}
                                <div className="p-6 pb-4 flex-shrink-0">
                                    <h2 className="text-2xl font-bold text-yellow-500">Confirme seu pedido</h2>
                                </div>

                                {/* Conteúdo scrollável */}
                                <div className="flex-1 min-h-0 overflow-y-auto px-6">
                                    <div className="bg-gray-800 p-4 rounded-lg text-left">
                                        <h3 className="text-yellow-500 font-semibold mb-2">Detalhes do seu pedido:</h3>
                                        <pre className="text-gray-300 whitespace-pre-wrap text-sm">
                                            {(() => {
                                                const customerName = localStorage.getItem('customerName') || '';
                                                const customerPhone = localStorage.getItem('customerPhone') || '';
                                                const customerAddress = localStorage.getItem('customerAddress') || '';
                                                const customerNeighborhood = localStorage.getItem('customerNeighborhood') || '';
                                                const customerComplement = localStorage.getItem('customerComplement') || '';
                                                const customerReferencePoint = localStorage.getItem('customerReferencePoint') || '';
                                                const customerNumber = localStorage.getItem('customerNumber') || '';
                                                const troco = localStorage.getItem('troco') || '';

                                                const deliveryFee = calculateDeliveryFee(customerNeighborhood, tipoEntrega);
                                                const subtotal = cartItems.reduce((sum, item) => sum + calculateItemPrice(item), 0);
                                                const valorFinal = subtotal + deliveryFee;

                                                const customerInfo = `\nNome: ${customerName}\nTelefone: ${customerPhone}`;
                                                const addressInfo = tipoEntrega === 'entrega' ? `\nEndereço: ${customerAddress}, ${customerNumber}${customerComplement ? `, ${customerComplement}` : ''}\nBairro: ${customerNeighborhood}\nPonto de Referência: ${customerReferencePoint}` : '';
                                                const paymentInfo = formaPagamento === 'pix' ? '\nForma de Pagamento: PIX\n' :
                                                    formaPagamento === 'dinheiro' ? `\nForma de Pagamento: Dinheiro${troco ? `\nTroco para: R$ ${troco}` : ''}\n` :
                                                        formaPagamento === 'cartao' ? '\nForma de Pagamento: Cartão\n' : '';

                                                const itemsInfo = cartItems.map(item => {
                                                    let itemName = item.item.name;

                                                    // Adicionar sabor se houver extras para itens não-pizza/massa
                                                    if (item.extras && item.extras.length > 0 && item.item.category !== 'pizzas' && item.item.category !== 'massas') {
                                                        itemName += ` - ${item.extras.join(', ')}`;
                                                    }

                                                    const sizeInfo = item.size ? ` (${item.size})` : '';
                                                    const obsInfo = item.observation ? ` - Obs: ${item.observation}` : '';
                                                    const priceInfo = ` - R$ ${calculateItemPrice(item).toFixed(2)}`;

                                                    return `${item.quantity}x ${itemName}${sizeInfo}${obsInfo}${priceInfo}`;
                                                }).join('\n');

                                                return `*Novo Pedido*\n${customerInfo}${addressInfo}${paymentInfo}\n*Itens:*\n${itemsInfo}\n\n*Valor Final: R$ ${valorFinal.toFixed(2)}*\n\n*Chave PIX do estabelecimento:* ${pixKey}`;
                                            })()}
                                        </pre>
                                    </div>
                                </div>

                                {/* Botões fixos na parte inferior */}
                                <div className="p-6 pt-4 flex-shrink-0 border-t border-gray-800">
                                    <div className="flex justify-center gap-4">
                                        <motion.button
                                            whileHover={isLowEndDevice ? undefined : { scale: 1.02 }}
                                            whileTap={isLowEndDevice ? undefined : { scale: 0.98 }}
                                            transition={isLowEndDevice ? undefined : { duration: 0.1 }}
                                            onClick={handleWhatsAppClick}
                                            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors duration-150"
                                        >
                                            <FaWhatsapp className="text-xl" />
                                            Enviar para WhatsApp
                                        </motion.button>
                                        <motion.button
                                            whileHover={isLowEndDevice ? undefined : { scale: 1.02 }}
                                            whileTap={isLowEndDevice ? undefined : { scale: 0.98 }}
                                            transition={isLowEndDevice ? undefined : { duration: 0.1 }}
                                            onClick={() => setShowWhatsAppModal(false)}
                                            className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors duration-150"
                                        >
                                            Cancelar
                                        </motion.button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Modal de sucesso do pedido */}
                <AnimatePresence>
                    {orderSuccessId && (
                        <motion.div
                            className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <motion.div
                                className="bg-gray-900 rounded-xl shadow-xl p-8 max-w-md w-full mx-4 text-center overflow-x-hidden"
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0.8 }}
                            >
                                <h2 className="text-2xl font-bold text-yellow-500 mb-4">Pedido Enviado!</h2>
                                <p className="text-gray-300 mb-2">Anote o número do seu pedido para acompanhar em <b>Pedidos</b>:</p>
                                <div className="text-3xl font-bold text-red-500 mb-4 break-all max-w-full" style={{ wordBreak: 'break-all' }}>{orderSuccessId}</div>

                                <div className="flex justify-center">
                                    <motion.button
                                        whileHover={isLowEndDevice ? undefined : { scale: 1.02 }}
                                        whileTap={isLowEndDevice ? undefined : { scale: 0.98 }}
                                        transition={isLowEndDevice ? undefined : { duration: 0.1 }}
                                        className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors duration-150"
                                        onClick={() => {
                                            setOrderSuccessId(null);
                                        }}
                                    >
                                        Fechar
                                    </motion.button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Botão flutuante do carrinho - Otimizado para iPhone */}
                {cartItems.length > 0 && (
                    <motion.div
                        className={`fixed ${isIPhone ? 'bottom-8 right-6 safe-area-bottom' : 'bottom-6 right-6'} z-40`}
                        initial={{ scale: 0, y: 100 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0, y: 100 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                    >
                        <button
                            onClick={() => setIsCartOpen(true)}
                            className={`bg-yellow-500 text-gray-900 rounded-full flex items-center justify-center shadow-lg hover:bg-yellow-400 transition-transform transform hover:scale-110 ${isIPhone ? 'w-14 h-14 touch-manipulation' : 'w-16 h-16'}`}
                            aria-label={`Ver carrinho com ${cartItems.reduce((total, item) => total + item.quantity, 0)} itens`}
                        >
                            <FaShoppingCart className={`${isIPhone ? 'text-xl' : 'text-2xl'}`} />
                            <span className={`absolute -top-1 -right-1 bg-gray-900 text-yellow-500 text-xs rounded-full flex items-center justify-center font-bold border-2 border-yellow-500 ${isIPhone ? 'w-5 h-5' : 'w-6 h-6'}`}>
                                {cartItems.reduce((total, item) => total + item.quantity, 0)}
                            </span>
                        </button>
                    </motion.div>
                )}

                <AnimatePresence>
                    {miniModalItem && (
                        <MiniItemModal
                            item={miniModalItem}
                            categories={categories}
                            onClose={() => setMiniModalItem(null)}
                            onAdd={(quantity, observation, extras) => {
                                handleAddToCart(miniModalItem, quantity, observation, Object.keys(miniModalItem.sizes ?? {})[0] ?? 'Única', undefined, extras);
                                setMiniModalItem(null);
                            }}
                        />
                    )}
                </AnimatePresence>

                {/* Modal de categorias (hambúrguer) */}
                <AnimatePresence>
                    {isCategoryModalOpen && (
                        <motion.div
                            className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/70"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsCategoryModalOpen(false)}
                        >
                            <motion.div
                                className="bg-gray-900 rounded-xl shadow-xl p-5 w-full max-w-md mx-4 border border-yellow-500/30"
                                initial={{ scale: 0.95 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0.95 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-yellow-500 font-semibold text-lg">Categorias</h3>
                                    <button className="p-2 rounded-lg bg-gray-800 text-gray-300 hover:text-yellow-400 border border-gray-700" onClick={() => setIsCategoryModalOpen(false)}>
                                        <FaTimes />
                                    </button>
                                </div>
                                <div className="max-h-[60vh] overflow-y-auto divide-y divide-gray-800">
                                    {(displayCategories || []).map(cat => {
                                        const source = isSearching ? filteredItemsByCategory : itemsByCategory;
                                        const count = (source[cat._id] || []).length;
                                        return (
                                            <button
                                                key={cat._id}
                                                onClick={() => { setIsCategoryModalOpen(false); handleCategoryClick(cat._id); }}
                                                className="w-full text-left px-3 py-3 hover:bg-gray-800 rounded-md flex items-center justify-between"
                                            >
                                                <span className="flex items-center gap-2">
                                                    <span role="img" aria-label={`Emoji para ${cat.name}`}>{cat.emoji || '🍽️'}</span>
                                                    <span className="text-white">{cat.name}</span>
                                                </span>
                                                <span className="text-xs text-gray-400 bg-gray-800 px-2 py-0.5 rounded-full border border-gray-700">{count}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}