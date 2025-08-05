'use client';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRestaurantStatus } from '@/contexts/RestaurantStatusContext';
import ItemModal from './ItemModal';
import Cart from './Cart';
import { MenuItem } from '@/types/menu';
import Image from 'next/image';
import { FaExclamationCircle, FaWhatsapp, FaShare, FaShoppingCart, FaPlus, FaPrint, FaBars, FaTimes, FaUtensils, FaIceCream, FaCoffee, FaGlassWhiskey, FaWineGlass } from 'react-icons/fa';
import { useCart } from '../contexts/CartContext';
import { CartItem } from '../types/cart';
import PastaModal from './PastaModal';
import MiniItemModal from './MiniItemModal';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.03, // Reduzido de 0.1 para 0.03
            duration: 0.2 // Adicionado duração mais rápida
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 200, // Aumentado de 100 para 200
            damping: 20, // Adicionado damping para reduzir oscilação
            duration: 0.3 // Duração mais rápida
        }
    }
};

const categoryVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
        opacity: 1,
        x: 0,
        transition: {
            type: "spring",
            stiffness: 200, // Aumentado de 100 para 200
            damping: 20, // Adicionado damping
            duration: 0.25 // Duração mais rápida
        }
    }
};

export default function MenuDisplay() {
    const { isOpen, refreshStatus } = useRestaurantStatus();
    const { items: cartItems, addToCart, removeFromCart, updateQuantity, clearCart } = useCart();
    const { isOpen: restaurantIsOpen } = useRestaurantStatus();

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

    // Filtro para itens de pizza (se existirem no banco)
    const allPizzas = menuItems.filter((item: MenuItem) => item.category === 'pizzas');

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

    useEffect(() => {
        // Detectar se estamos em mobile para ajustar o observer
        const isMobile = window.innerWidth < 640;

        const observer = new IntersectionObserver(
            (entries) => {
                // Só atualizar categoria automaticamente se NÃO estiver em rolagem manual
                if (!isManualScrolling) {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            const category = entry.target.id.replace('category-', '');
                            setSelectedCategory(category);
                        }
                    });
                }
            },
            {
                rootMargin: isMobile ? '-100px 0px -50% 0px' : '-120px 0px -40% 0px',
                threshold: isMobile ? 0.1 : 0.2
            }
        );

        setTimeout(() => {
            (categories || []).forEach(category => {
                const element = document.getElementById(`category-${category._id}`);
                if (element) {
                    observer.observe(element);
                }
            });
        }, 500);

        return () => {
            (categories || []).forEach(category => {
                const element = document.getElementById(`category-${category._id}`);
                if (element) {
                    observer.unobserve(element);
                }
            });
        };
    }, [categories]);

    // Definir categoria inicial e garantir visualização correta
    useEffect(() => {
        if ((categories || []).length > 0 && !selectedCategory) {
            // Usar a primeira categoria da lista ordenada
            const firstCategory = categories[0];
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
    }, [categories, selectedCategory]);    // Fechar menu com tecla Escape e swipe
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

            // Aplicar rolagem suave
            scrollContainer.scrollTo({
                left: targetScrollLeft,
                behavior: 'smooth'
            });
        } else {
            // Fallback para o método padrão se não encontrar o container
            btn.scrollIntoView({
                behavior: 'smooth',
                inline: 'center',
                block: 'nearest'
            });
        }
    }, [selectedCategory]);

    const handleCategoryClick = (category: string | null) => {
        setSelectedCategory(category);

        if (category) {
            const element = document.getElementById(`category-${category}`);
            if (element) {
                // Ativar o modo de rolagem manual para evitar que o observer mude a categoria
                setIsManualScrolling(true);

                // Detectar tamanho da tela para ajustar offset
                const isMobile = window.innerWidth < 640;
                const headerHeight = isMobile ? 100 : 120;

                // Calcular a posição do elemento
                const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;

                // Rolagem em uma única etapa, sem setTimeout aninhados
                window.scrollTo({
                    top: elementPosition - headerHeight,
                    behavior: 'smooth'
                });

                // Desativar o modo de rolagem manual após concluir a animação
                setTimeout(() => {
                    setIsManualScrolling(false);
                }, 400); // Reduzido de 800 para 400ms

                // Efeito visual de feedback para indicar a mudança de categoria
                element.classList.add('bg-yellow-500/10');
                setTimeout(() => {
                    element.classList.remove('bg-yellow-500/10');
                }, 250); // Reduzido de 500 para 250ms
            }
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }; useEffect(() => {
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

    const calculateDeliveryFee = (neighborhood: string, tipoEntrega: string) => {
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

        const message = `*Novo Pedido*\n${customerInfo}${addressInfo}${paymentInfo}\n*Itens:*\n${cartItems.map(item => `${item.quantity}x ${item.item.name}${item.size ? ` (${item.size})` : ''}${item.observation ? ` - ${item.observation}` : ''} - R$ ${calculateItemPrice(item).toFixed(2)}`).join('\n')}\n\n*Valor Final: R$ ${valorFinal.toFixed(2)}*${formaPagamento === 'pix' ? `\n\n*Chave PIX para pagamento:* ${pixKey}` : ''}`;

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

        const itemsInfo = cartItems.map(item =>
            `${item.quantity}x ${item.item.name}${item.size ? ` (${item.size})` : ''}${item.observation ? ` - ${item.observation}` : ''} - R$ ${calculateItemPrice(item).toFixed(2)}`
        ).join('\n');

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

        const itemsInfo = cartItems.map(item =>
            `${item.quantity}x ${item.item.name}${item.size ? ` (${item.size})` : ''}${item.observation ? ` - ${item.observation}` : ''} - R$ ${calculateItemPrice(item).toFixed(2)}`
        ).join('\n');

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
    // Mas apenas quando não estiver em rolagem manual
    useEffect(() => {
        const handleScroll = () => {
            // Só realizar esta ação se não estiver em rolagem manual
            if (!isManualScrolling && window.scrollY < 30 && categories.length > 0) {
                const salgadosCategory = categories.find(cat => cat.name.toLowerCase().includes('salgado'));
                const firstCategoryId = salgadosCategory ? salgadosCategory._id : categories[0]._id;
                if (selectedCategory !== firstCategoryId) {
                    setSelectedCategory(firstCategoryId);
                }
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [categories, selectedCategory, isManualScrolling]);

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
        <div className="min-h-screen bg-gray-900">
            <div className="max-w-7xl mx-auto px-4">
                {/* Barra de Navegação com Categorias - Versão otimizada para mobile */}
                <div className="sticky top-0 z-30 w-full bg-gray-900 shadow-lg border-b border-yellow-500/30">
                    <div className="w-full flex flex-col">

                        {/* Barra de Categorias Scrollável - Otimizada para mobile */}
                        <div className="relative pt-3 pb-1">
                            <div className="w-full overflow-x-auto scrollbar-hide category-bar-container py-1">
                                <div className="flex justify-start sm:justify-center space-x-2 sm:space-x-3 min-w-min px-4 sm:px-6 mx-auto">
                                    {categories.map((cat) => {
                                        // Usar o emoji da categoria em vez do ícone, se estiver disponível
                                        const itemCount = menuItems.filter((item) => item.category === cat._id).length;
                                        return (
                                            <motion.button
                                                key={cat._id}
                                                whileHover={{ scale: 1.03 }}
                                                whileTap={{ scale: 0.97 }}
                                                transition={{ duration: 0.15 }}
                                                onClick={() => handleCategoryClick(cat._id)}
                                                data-category={cat._id}
                                                aria-selected={selectedCategory === cat._id}
                                                className={`
                                                    relative flex items-center gap-1.5 sm:gap-2
                                                    px-2.5 sm:px-4 py-1.5 sm:py-2.5
                                                    rounded-lg transition-all duration-150
                                                    ${selectedCategory === cat._id
                                                        ? 'bg-yellow-500 text-gray-900 font-medium shadow-lg active'
                                                        : 'bg-gray-800/80 text-gray-300 hover:bg-yellow-500/20 hover:text-yellow-400 border border-gray-700'}
                                                `}
                                            >
                                                <span
                                                    className={`text-base sm:text-lg ${selectedCategory === cat._id ? 'text-gray-900' : ''} transition-transform duration-200 ${selectedCategory === cat._id ? 'scale-110' : ''}`}
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
                                                {/* Efeito de toque para feedback tátil em mobile */}
                                                <div className="absolute inset-0 bg-white/10 opacity-0 rounded-lg touch-ripple-effect"></div>
                                                {selectedCategory === cat._id && (
                                                    <motion.div
                                                        layoutId="categoryIndicator"
                                                        className="absolute -bottom-1 left-0 w-full h-0.5 bg-yellow-300"
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        transition={{ duration: 0.2 }}
                                                    />
                                                )}
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>                {/* Menu lateral removido - todas as categorias agora aparecem na barra horizontal acima */}

                {/* Conteúdo Principal */}
                <div className="py-4">
                    {(categories || []).length === 0 ? (
                        <div className="text-center text-gray-400 py-16 text-lg font-semibold">
                            Sem itens e categorias adicionadas
                        </div>
                    ) : (
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="space-y-8"
                        >
                            {(categories || []).map(cat => {
                                const itemsInCategory = menuItems.filter((item: MenuItem) => item.category === cat._id);
                                return (
                                    <div key={cat._id} id={`category-${cat._id}`} className="space-y-3 transition-colors duration-300 ease-in-out">
                                        <h2 className="text-base sm:text-lg font-semibold text-white capitalize mb-2 sm:mb-4 mt-6 sm:mt-8 pl-3 sm:pl-4 tracking-wide flex items-center">
                                            <span className="w-1.5 h-6 bg-yellow-500 rounded-r-md mr-2.5 opacity-70"></span>
                                            {cat.name}
                                        </h2>
                                        <div className="flex flex-col gap-4">
                                            {itemsInCategory.length === 0 ? (
                                                <div className="text-gray-500 text-sm italic px-4 py-6">Nenhum item nesta categoria</div>
                                            ) : (
                                                itemsInCategory.map((item: MenuItem) => (
                                                    <motion.div
                                                        key={item._id}
                                                        variants={itemVariants}
                                                        initial="hidden"
                                                        animate="visible"
                                                        onClick={() => setMiniModalItem(item)}
                                                        className="bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-150 border border-yellow-500 cursor-pointer hover:bg-gray-750 hover:border-yellow-400"
                                                    >
                                                        <div className="flex flex-col sm:flex-row w-full">
                                                            {/* Imagem */}
                                                            <div className="flex-shrink-0 w-full sm:w-24 md:w-28 h-32 sm:h-24 md:h-28 bg-gray-900">
                                                                <Image
                                                                    src={item.image || '/placeholder.jpg'}
                                                                    alt={item.name}
                                                                    width={112}
                                                                    height={112}
                                                                    className="object-cover w-full h-full"
                                                                />
                                                            </div>

                                                            {/* Conteúdo */}
                                                            <div className="flex-1 p-3 md:p-4 flex flex-col justify-between min-h-0 w-full">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <h3 className="text-base md:text-lg font-semibold text-white break-words line-clamp-2 leading-tight" title={item.name}>
                                                                            {item.name}
                                                                        </h3>
                                                                        {item.available === false && (
                                                                            <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded whitespace-nowrap">
                                                                                Indisponível
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-gray-400 text-xs md:text-sm mb-3 line-clamp-2 sm:line-clamp-3 break-words leading-relaxed" title={item.description}>
                                                                        {item.description}
                                                                    </p>
                                                                </div>

                                                                {/* Preço e Botão */}
                                                                <div className="flex items-center justify-between mt-auto w-full">
                                                                    <span className="text-yellow-500 font-bold text-lg md:text-xl">R$ {item.price.toFixed(2)}</span>
                                                                    {item.available === false ? (
                                                                        <span className="text-sm text-red-400 font-medium">
                                                                            Item indisponível
                                                                        </span>
                                                                    ) : (
                                                                        <motion.button
                                                                            whileHover={{ scale: 1.03 }}
                                                                            whileTap={{ scale: 0.97 }}
                                                                            transition={{ duration: 0.1 }}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setMiniModalItem(item);
                                                                            }}
                                                                            className="bg-yellow-500 text-gray-900 p-2 md:p-3 rounded-lg font-medium hover:bg-yellow-400 transition-colors duration-150 flex-shrink-0"
                                                                        >
                                                                            <FaPlus className="text-sm md:text-base" />
                                                                        </motion.button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
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
                            onAddToCart={(quantity, observation, size, border, extras) => {
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
                                className="bg-gray-900 rounded-xl shadow-xl p-8 max-w-md w-full mx-4 text-center max-h-[90vh] overflow-y-auto overflow-x-hidden"
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0.8 }}
                            >
                                <h2 className="text-2xl font-bold text-yellow-500 mb-4">Confirme seu pedido</h2>
                                <div className="bg-gray-800 p-4 rounded-lg mb-6 text-left">
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

                                            const itemsInfo = cartItems.map(item =>
                                                `${item.quantity}x ${item.item.name}${item.size ? ` (${item.size})` : ''}${item.observation ? ` - ${item.observation}` : ''} - R$ ${calculateItemPrice(item).toFixed(2)}`
                                            ).join('\n');

                                            return `*Novo Pedido*\n${customerInfo}${addressInfo}${paymentInfo}\n*Itens:*\n${itemsInfo}\n\n*Valor Final: R$ ${valorFinal.toFixed(2)}*\n\n*Chave PIX do estabelecimento:* ${pixKey}`;
                                        })()}
                                    </pre>
                                </div>

                                <div className="flex justify-center gap-4">
                                    <motion.button
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                        transition={{ duration: 0.1 }}
                                        onClick={handleWhatsAppClick}
                                        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors duration-150"
                                    >
                                        <FaWhatsapp className="text-xl" />
                                        Enviar para WhatsApp
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                        transition={{ duration: 0.1 }}
                                        onClick={() => setShowWhatsAppModal(false)}
                                        className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors duration-150"
                                    >
                                        Cancelar
                                    </motion.button>
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
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                        transition={{ duration: 0.1 }}
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

                {/* Botão flutuante do carrinho */}
                {cartItems.length > 0 && (
                    <motion.div
                        className="fixed bottom-6 right-6 z-40"
                        initial={{ scale: 0, y: 100 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0, y: 100 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                    >
                        <button
                            onClick={() => setIsCartOpen(true)}
                            className="bg-yellow-500 text-gray-900 rounded-full w-16 h-16 flex items-center justify-center shadow-lg hover:bg-yellow-400 transition-transform transform hover:scale-110"
                            aria-label={`Ver carrinho com ${cartItems.reduce((total, item) => total + item.quantity, 0)} itens`}
                        >
                            <FaShoppingCart className="text-2xl" />
                            <span className="absolute -top-1 -right-1 bg-gray-900 text-yellow-500 text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold border-2 border-yellow-500">
                                {cartItems.reduce((total, item) => total + item.quantity, 0)}
                            </span>
                        </button>
                    </motion.div>
                )}

                <AnimatePresence>
                    {miniModalItem && (
                        <MiniItemModal
                            item={miniModalItem}
                            onClose={() => setMiniModalItem(null)}
                            onAdd={(quantity, observation) => {
                                handleAddToCart(miniModalItem, quantity, observation, Object.keys(miniModalItem.sizes ?? {})[0] ?? 'Única');
                                setMiniModalItem(null);
                            }}
                        />
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}