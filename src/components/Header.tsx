'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMenu } from '@/contexts/MenuContext';
import { FaExclamationCircle, FaSearch } from 'react-icons/fa';
import { useCart } from '@/contexts/CartContext';
import { useRestaurantStatus } from '@/contexts/RestaurantStatusContext';
import Cart from './Cart';
import OrderTracker from './OrderTracker';
import Image from 'next/image';

export default function Header() {
    const [showInfo, setShowInfo] = useState(false);
    const [showOrderTracker, setShowOrderTracker] = useState(false);
    const { items, updateQuantity, removeFromCart } = useCart();
    const [isCartOpen, setIsCartOpen] = useState(false);
    const { isOpen, loading } = useRestaurantStatus();

    const totalItems = items.reduce((total: number, item: any) => total + item.quantity, 0);

    // Bloquear scroll quando modais estão abertos
    useEffect(() => {
        const hasModalOpen = showInfo || showOrderTracker || isCartOpen;

        if (hasModalOpen) {
            document.body.classList.add('overflow-hidden');
        } else {
            document.body.classList.remove('overflow-hidden');
        }

        return () => document.body.classList.remove('overflow-hidden');
    }, [showInfo, showOrderTracker, isCartOpen]);

    const handleCheckout = (orderId: string) => {
        // Implementar checkout
        console.log('Checkout:', orderId);
    };

    return (
        <header className="bg-gray-900 border-b border-yellow-500 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3"
                >
                    <Image
                        src="/logo/logoreidossalgados.png"
                        alt="Rei dos Salgados"
                        width={130}
                        height={130}
                        className="rounded-lg"
                    />
                    <button
                        className="ml-2 bg-yellow-500 text-black p-2 rounded-full shadow hover:bg-yellow-400 transition-colors flex items-center justify-center"
                        onClick={() => setShowInfo(true)}
                        aria-label="Informações do restaurante"
                    >
                        <FaExclamationCircle className="w-5 h-5" />
                    </button>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-4"
                >
                    {/* Botão de Acompanhar Pedido */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowOrderTracker(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <FaSearch className="w-4 h-4" />
                        <span className="hidden xs:inline sm:inline md:inline">Pedido</span>
                        <span className="inline xs:hidden sm:hidden md:hidden">Pedido</span>
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg ${isOpen
                            ? 'bg-yellow-500 hover:bg-yellow-400 text-black'
                            : 'bg-gray-700 hover:bg-gray-800 text-white'
                            }`}
                        disabled={loading}
                    >
                        <span className="relative flex h-3 w-3">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isOpen ? 'bg-yellow-400' : 'bg-gray-500'} opacity-75`}></span>
                            <span className={`relative inline-flex rounded-full h-3 w-3 ${isOpen ? 'bg-yellow-500' : 'bg-gray-600'}`}></span>
                        </span>
                        <span className="hidden xs:inline sm:inline md:inline">{loading ? 'Carregando...' : isOpen ? 'Aberto' : 'Fechado'}</span>
                        <span className="inline xs:hidden sm:hidden md:hidden">{loading ? '...' : isOpen ? 'Ab...' : 'Fech...'}</span>
                    </motion.button>
                </motion.div>
            </div>

            {/* Modal de informações do restaurante */}
            {showInfo && (
                <AnimatePresence>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60"
                        onClick={() => setShowInfo(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: 20 }}
                            transition={{
                                type: "spring",
                                damping: 25,
                                stiffness: 300
                            }}
                            className="bg-gray-900 rounded-xl shadow-xl p-8 max-w-md w-full mx-4 text-gray-200 border border-yellow-500 relative max-h-[80vh] overflow-y-auto overflow-x-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="absolute top-2 right-2 text-yellow-500 hover:text-yellow-400 text-2xl focus:outline-none"
                                onClick={() => setShowInfo(false)}
                                aria-label="Fechar informações"
                            >
                                &times;
                            </motion.button>
                            <h2 className="text-2xl font-bold text-yellow-500 mb-4 text-center">Rei dos Salgados</h2>
                            <div className="space-y-4 text-base">
                                <div>
                                    <span className="font-semibold text-yellow-400">Horário de Funcionamento</span><br />
                                    Quarta a Segunda: <span className="text-white">18h00 às 23h00</span><br />
                                    Terça: <span className="text-white">Fechado</span>
                                </div>
                                <div>
                                    <span className="font-semibold text-yellow-400">Endereço</span><br />
                                    Rua Maria Luiza Dantas<br />
                                    Alto Rodrigues - RN
                                </div>
                                <div>
                                    <span className="font-semibold text-yellow-400">Contato</span><br />
                                    Telefone/WhatsApp: <span className="text-white">+55 84 9872-9126</span>
                                </div>
                                <div>
                                    <span className="font-semibold text-yellow-400">Formas de Pagamento</span><br />
                                    Aceitamos cartões de crédito/débito, PIX e dinheiro
                                </div>
                                <div>
                                    <span className="font-semibold text-yellow-400">Redes Sociais</span><br />
                                    Instagram: <span className="text-white">@reidossalgados</span>
                                </div>
                                <div>
                                    <span className="font-semibold text-yellow-400">Sobre Nós</span><br />
                                    Especialistas em salgados artesanais, oferecendo qualidade e sabor em cada pedido. Nossos produtos são feitos com ingredientes frescos e selecionados.
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </AnimatePresence>
            )}

            {isCartOpen && (
                <Cart
                    items={items}
                    onUpdateQuantity={updateQuantity}
                    onRemoveItem={removeFromCart}
                    onCheckout={handleCheckout}
                    onClose={() => setIsCartOpen(false)}
                />
            )}

            {/* Modal de Acompanhamento de Pedidos */}
            {showOrderTracker && (
                <OrderTracker onClose={() => setShowOrderTracker(false)} />
            )}
        </header>
    );
} 