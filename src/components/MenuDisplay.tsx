'use client';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMenu } from '@/contexts/MenuContext';
import ItemModal from './ItemModal';
import Cart from './Cart';
import { MenuItem } from '@/types/menu';
import Image from 'next/image';
import { FaExclamationCircle, FaWhatsapp, FaShare, FaShoppingCart, FaPlus } from 'react-icons/fa';
import { useCart } from '../contexts/CartContext';
import { CartItem } from '../types/cart';
import { menuItems as staticMenuItems, categories } from '../data/menu';
import PastaModal from './PastaModal';
import MiniItemModal from './MiniItemModal';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
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
            stiffness: 100
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
            stiffness: 100
        }
    }
};

export default function MenuDisplay() {
    const { isOpen, toggleOpen } = useMenu();
    const { items: cartItems, addToCart, removeFromCart, updateQuantity, clearCart } = useCart();
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

    const menuItems = staticMenuItems;
    const allPizzas = menuItems.filter(item => item.category === 'pizzas');
    const categoriesContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const category = entry.target.id.replace('category-', '');
                        setSelectedCategory(category);

                        // Scroll horizontal para a categoria selecionada
                        if (categoriesContainerRef.current) {
                            const categoryButton = categoriesContainerRef.current.querySelector(`[data-category="${category}"]`);
                            if (categoryButton) {
                                const container = categoriesContainerRef.current;
                                const button = categoryButton as HTMLElement;
                                const containerWidth = container.offsetWidth;
                                const buttonLeft = button.offsetLeft;
                                const buttonWidth = button.offsetWidth;

                                // Centraliza o botão no container
                                const scrollLeft = buttonLeft - (containerWidth / 2) + (buttonWidth / 2);
                                container.scrollTo({
                                    left: scrollLeft,
                                    behavior: 'smooth'
                                });
                            }
                        }
                    }
                });
            },
            {
                rootMargin: '-100px 0px -50% 0px',
                threshold: 0
            }
        );

        categories.forEach(category => {
            const element = document.getElementById(`category-${category}`);
            if (element) {
                observer.observe(element);
            }
        });

        return () => {
            categories.forEach(category => {
                const element = document.getElementById(`category-${category}`);
                if (element) {
                    observer.unobserve(element);
                }
            });
        };
    }, [categories]);

    const handleCategoryClick = (category: string | null) => {
        setSelectedCategory(category);
        if (category) {
            const element = document.getElementById(`category-${category}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

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
        }, 5000); // 5 segundos
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        // Buscar taxas de entrega do banco
        async function fetchDeliveryFees() {
            try {
                const res = await fetch('/api/settings');
                const data = await res.json();
                if (data.success && data.data) {
                    console.log('Taxas de entrega carregadas:', data.data.deliveryFees);
                    setDeliveryFees(data.data.deliveryFees || []);
                }
            } catch (err) {
                console.error('Erro ao carregar taxas de entrega:', err);
            }
        }
        fetchDeliveryFees();
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

            // Se for pizza meio a meio, pega o preço mais alto dos dois sabores
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

        const message = `*Novo Pedido*\n${customerInfo}${addressInfo}${paymentInfo}\n*Itens:*\n${cartItems.map(item => `${item.quantity}x ${item.item.name}${item.size ? ` (${item.size})` : ''}${item.observation ? ` - ${item.observation}` : ''} - R$ ${calculateItemPrice(item).toFixed(2)}`).join('\n')}\n\n*Valor Final: R$ ${valorFinal.toFixed(2)}*${formaPagamento === 'pix' ? '\n\n*Chave PIX para pagamento:* 84 99872-9126' : ''}`;

        setOrderDetails(cartItems);
        setShowWhatsAppModal(true);
    };
    const calculateItemPrice = (item: CartItem) => {
        let price = item.item.price;

        // Se o item tem tamanhos (sizes) e um tamanho foi selecionado, usa o preço do tamanho
        if (item.size && item.item.sizes) {
            // Garante que o tamanho existe nas opções
            if (item.item.sizes[item.size as keyof typeof item.item.sizes]) {
                price = item.item.sizes[item.size as keyof typeof item.item.sizes] ?? price;
            }
        }

        // Lógica especial para pizzas meio a meio
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

        // Borda e extras (apenas para pizzas)
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

        const message = `*Novo Pedido*\n${customerInfo}${addressInfo}${paymentInfo}\n*Itens:*\n${itemsInfo}\n\n*Valor Final: R$ ${valorFinal.toFixed(2)}*\n\n*Chave PIX do estabelecimento:* 84 99872-9126`;

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

        const message = `*Novo Pedido*\n${customerInfo}${addressInfo}${paymentInfo}\n*Itens:*\n${itemsInfo}\n\n*Valor Final: R$ ${valorFinal.toFixed(2)}*\n\n*Chave PIX do estabelecimento:* 84 99872-9126`;

        const whatsappUrl = `https://wa.me/558498729126?text=${encodeURIComponent(message)}`;
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

    if (!isOpen) {
        return (
            <div className="text-center py-8">
                <h2 className="text-2xl font-bold text-red-600 mb-4">Estabelecimento Fechado</h2>
                <p className="text-gray-400 mb-4">Desculpe, estamos fechados no momento.</p>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleOpen}
                    className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
                >
                    Abrir para Pedidos
                </motion.button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 p-4">
            <div className="max-w-7xl mx-auto px-4 py-4">
                <div className="sticky top-0 z-20 w-full bg-gray-900 border-b border-yellow-500 shadow-sm">
                    <div className="flex justify-center gap-8 py-2 overflow-x-auto">
                        {categories.map(category => (
                            <button
                                key={category}
                                onClick={() => handleCategoryClick(category)}
                                className={`
                                    text-base md:text-lg font-bold uppercase tracking-wide px-2 md:px-4 transition-colors
                                    ${selectedCategory === category
                                        ? 'text-yellow-400 border-b-2 border-yellow-400'
                                        : 'text-white hover:text-yellow-400 border-b-2 border-transparent'}
                                `}
                                style={{ background: 'none', outline: 'none' }}
                            >
                                {category === 'salgados' ? 'Salgados' : 'Porções'}
                            </button>
                        ))}
                    </div>
                </div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-8"
                >
                    {categories.map(category => (
                        <div key={category} id={`category-${category}`} className="space-y-4">
                            <h2 className="text-lg font-semibold text-white capitalize mb-4 mt-8 pl-4 tracking-wide">
                                {category}
                            </h2>
                            <div className="flex flex-col gap-4">
                                {menuItems
                                    .filter(item => item.category === category)
                                    .map((item) => (
                                        <motion.div
                                            key={item._id}
                                            variants={itemVariants}
                                            initial="hidden"
                                            animate="visible"
                                            onClick={() => setMiniModalItem(item)}
                                            className="flex items-center bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-yellow-500 p-2 md:p-4 cursor-pointer hover:bg-gray-750"
                                        >
                                            <div className="flex-shrink-0 w-20 h-20 md:w-28 md:h-28 rounded-lg overflow-hidden bg-gray-900">
                                                <Image
                                                    src={item.image || '/placeholder.jpg'}
                                                    alt={item.name}
                                                    width={112}
                                                    height={112}
                                                    className="object-cover w-full h-full"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0 px-3 md:px-6">
                                                <h3 className="text-base md:text-lg font-semibold text-white mb-1 break-words">{item.name}</h3>
                                                <p className="text-gray-400 text-xs md:text-sm mb-2 line-clamp-2">{item.description}</p>
                                                <span className="text-yellow-500 font-bold text-base md:text-lg">R$ {item.price.toFixed(2)}</span>
                                            </div>
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setMiniModalItem(item);
                                                }}
                                                className="bg-yellow-500 text-gray-900 p-3 rounded-lg font-medium hover:bg-yellow-400 transition-colors duration-200 ml-2 relative z-10"
                                            >
                                                <FaPlus />
                                            </motion.button>
                                        </motion.div>
                                    ))}
                            </div>
                        </div>
                    ))}
                </motion.div>

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
                                className="bg-gray-900 rounded-xl shadow-xl p-8 max-w-md w-full mx-4 text-center max-h-[90vh] overflow-y-auto"
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

                                            return `*Novo Pedido*\n${customerInfo}${addressInfo}${paymentInfo}\n*Itens:*\n${itemsInfo}\n\n*Valor Final: R$ ${valorFinal.toFixed(2)}*\n\n*Chave PIX do estabelecimento:* 84 99872-9126`;
                                        })()}
                                    </pre>
                                </div>

                                <div className="flex justify-center gap-4">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleWhatsAppClick}
                                        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                                    >
                                        <FaWhatsapp className="text-xl" />
                                        Enviar para WhatsApp
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setShowWhatsAppModal(false)}
                                        className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
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
                                className="bg-gray-900 rounded-xl shadow-xl p-8 max-w-md w-full mx-4 text-center"
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0.8 }}
                            >
                                <h2 className="text-2xl font-bold text-yellow-500 mb-4">Pedido Enviado!</h2>
                                <p className="text-gray-300 mb-2">Anote o número do seu pedido para acompanhar em <b>Pedidos</b>:</p>
                                <div className="text-3xl font-bold text-red-500 mb-4 break-all max-w-full" style={{ wordBreak: 'break-all' }}>{orderSuccessId}</div>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 mt-2"
                                    onClick={() => {
                                        setOrderSuccessId(null);
                                    }}
                                >
                                    OK
                                </motion.button>
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