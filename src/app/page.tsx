'use client';
import React, { useState, useEffect } from 'react';
import MenuDisplay from '@/components/MenuDisplay';
import RecentOrders from '@/components/RecentOrders';
import { FaExclamationCircle } from 'react-icons/fa';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
    const [activeTab, setActiveTab] = useState<'menu' | 'orders'>('menu');
    const [hasNotification, setHasNotification] = useState(false);
    const [showInfo, setShowInfo] = useState(false);

    useEffect(() => {
        const checkNotifications = () => {
            const notifyOrders = JSON.parse(localStorage.getItem('notifyOrders') || '[]');
            if (notifyOrders.length > 0) {
                setHasNotification(true);
            }
        };

        checkNotifications();
        const interval = setInterval(checkNotifications, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (showInfo) {
            document.body.classList.add('overflow-hidden');
        } else {
            document.body.classList.remove('overflow-hidden');
        }
        return () => document.body.classList.remove('overflow-hidden');
    }, [showInfo]);

    return (
        <div className="min-h-screen bg-gray-900">
            {/* Banner + Logo + Info */}
            <div className="relative w-full flex justify-center mb-28 pb-4">
                <div className="w-full max-w-6xl relative">
                    <Image
                        src="/banner/banner.png"
                        alt="Banner Rei dos Salgados"
                        width={1600}
                        height={260}
                        className="w-full h-[120px] md:h-[220px] lg:h-[260px] object-cover rounded-l-2xl rounded-r-2xl rounded-t-none rounded-b-none"
                        priority
                    />
                    {/* Logo sobreposta */}
                    <div className="absolute left-2 sm:left-6 -bottom-20 sm:-bottom-32 flex items-center w-[95vw] max-w-[98vw] mt-3">
                        <Image
                            src="/logo/logoreidossalgados.png"
                            alt="Logo Rei dos Salgados"
                            width={80}
                            height={80}
                            className="rounded-xl border-4 border-white shadow-lg bg-white sm:w-[130px] sm:h-[130px] w-[80px] h-[80px]"
                        />
                        {/* Nome e ícones */}
                        <div className="ml-3 sm:ml-6 flex flex-col justify-center min-w-0 mt-3">
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="text-xl sm:text-4xl md:text-5xl font-bold text-white drop-shadow-lg break-words">Rei dos Salgados</span>
                                <button
                                    className="ml-1 bg-yellow-500 text-black p-3 rounded-full shadow hover:bg-yellow-400 transition-colors flex items-center justify-center"
                                    onClick={() => setShowInfo(true)}
                                    aria-label="Informações do restaurante"
                                >
                                    <FaExclamationCircle className="text-lg sm:text-2xl" />
                                </button>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-4 mt-1 sm:mt-2 text-white/90 text-xs sm:text-sm">
                                <span className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded"><span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span> Aberto</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de informações do restaurante */}
            <AnimatePresence>
                {showInfo && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-2 sm:p-4"
                        onClick={() => setShowInfo(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="bg-gray-900 rounded-2xl shadow-2xl border border-yellow-500/30 overflow-hidden max-h-[90vh] overflow-y-auto w-full max-w-md mx-2"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Header com logo */}
                            <div className="relative h-28 sm:h-40 bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 flex items-center justify-center">
                                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent"></div>
                                <div className="relative z-10 w-14 h-14 sm:w-20 sm:h-20 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-yellow-500">
                                    <Image
                                        src="/logo/logoreidossalgados.png"
                                        alt="Logo Rei dos Salgados"
                                        width={80}
                                        height={80}
                                        className="w-full h-full object-cover rounded-full"
                                    />
                                </div>
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setShowInfo(false)}
                                    className="absolute top-3 right-3 w-8 h-8 bg-gray-900/80 backdrop-blur-sm rounded-full flex items-center justify-center text-yellow-500 hover:text-yellow-400 transition-colors"
                                aria-label="Fechar informações"
                            >
                                    <FaExclamationCircle className="text-base" />
                            </motion.button>
                            </div>
                            {/* Conteúdo */}
                            <div className="p-3 sm:p-6">
                                <h2 className="text-lg sm:text-2xl font-bold text-yellow-500 mb-4 text-center">Rei dos Salgados</h2>
                                <div className="space-y-3 sm:space-y-5">
                                    {/* Horário */}
                                    <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4 border border-gray-700">
                                        <h3 className="text-yellow-400 font-semibold text-xs sm:text-base mb-2 flex items-center gap-2">
                                            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                                            Horário de Funcionamento
                                        </h3>
                                        <div className="text-gray-300 text-xs sm:text-sm space-y-1">
                                            <div className="flex justify-between">
                                                <span>Quarta a Segunda:</span>
                                                <span className="text-white font-medium">18h00 às 23h00</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Terça:</span>
                                                <span className="text-red-400 font-medium">Fechado</span>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Endereço */}
                                    <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4 border border-gray-700">
                                        <h3 className="text-yellow-400 font-semibold text-xs sm:text-base mb-2 flex items-center gap-2">
                                            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                                            Endereço
                                        </h3>
                                        <div className="text-gray-300 text-xs sm:text-sm">
                                            <p className="text-white">Rua Maria Luiza Dantas</p>
                                            <p>Alto Rodrigues - RN</p>
                                        </div>
                                    </div>
                                    {/* Contato */}
                                    <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4 border border-gray-700">
                                        <h3 className="text-yellow-400 font-semibold text-xs sm:text-base mb-2 flex items-center gap-2">
                                            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                                            Contato
                                        </h3>
                                        <div className="text-gray-300 text-xs sm:text-sm">
                                            <p>Telefone/WhatsApp:</p>
                                            <p className="text-white font-medium text-sm sm:text-base">+55 84 9872-9126</p>
                                        </div>
                                    </div>
                                    {/* Formas de Pagamento */}
                                    <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4 border border-gray-700">
                                        <h3 className="text-yellow-400 font-semibold text-xs sm:text-base mb-2 flex items-center gap-2">
                                            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                                            Formas de Pagamento
                                        </h3>
                                        <div className="text-gray-300 text-xs sm:text-sm">
                                            <p>Aceitamos cartões de crédito/débito, PIX e dinheiro</p>
                                        </div>
                                    </div>
                                    {/* Redes Sociais */}
                                    <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4 border border-gray-700">
                                        <h3 className="text-yellow-400 font-semibold text-xs sm:text-base mb-2 flex items-center gap-2">
                                            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                                            Redes Sociais
                                        </h3>
                                        <div className="text-gray-300 text-xs sm:text-sm">
                                            <p>Instagram: <span className="text-white font-medium">@reidossalgados</span></p>
                                </div>
                                </div>
                                    {/* Sobre Nós */}
                                    <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4 border border-gray-700">
                                        <h3 className="text-yellow-400 font-semibold text-xs sm:text-base mb-2 flex items-center gap-2">
                                            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                                            Sobre Nós
                                        </h3>
                                        <div className="text-gray-300 text-xs sm:text-sm leading-relaxed">
                                            <p>Especialistas em salgados artesanais, oferecendo qualidade e sabor em cada pedido. Nossos produtos são feitos com ingredientes frescos e selecionados.</p>
                                </div>
                                </div>
                                </div>
                                {/* Botão fechar */}
                                <div className="mt-6 pt-4 border-t border-gray-700">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setShowInfo(false)}
                                        className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-gray-900 rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition-all font-bold shadow-lg text-sm sm:text-base"
                                    >
                                        Fechar
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Conteúdo principal */}
            <div className="container mx-auto px-4">
                <MenuDisplay />
            </div>
        </div>
    );
} 