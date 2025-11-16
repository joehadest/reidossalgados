'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaExclamationCircle, FaSearch, FaShoppingCart, FaMapMarkerAlt, FaClock, FaPhone, FaWhatsapp, FaInstagram, FaMoneyBillWave, FaKey, FaMoon, FaSun } from 'react-icons/fa';
import { useCart } from '@/contexts/CartContext';
import { useRestaurantStatus } from '@/contexts/RestaurantStatusContext';
import { useTheme } from '@/contexts/ThemeContext';
import Cart from './Cart';
import OrderTracker from './OrderTracker';
import Image from 'next/image';

export default function Header() {
    const [showInfo, setShowInfo] = useState(false);
    const [settings, setSettings] = useState<any>(null);
    const [copyMsg, setCopyMsg] = useState<string>('');
    const [showOrderTracker, setShowOrderTracker] = useState(false);
    const { items } = useCart();
    const [isCartOpen, setIsCartOpen] = useState(false);
    const { isOpen, loading } = useRestaurantStatus();
    const { theme, toggleTheme } = useTheme();

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

    const handleCheckout = (orderDetails: any) => {
        // Implementar checkout
        console.log('Checkout:', orderDetails);
        setIsCartOpen(false);
    };

    // Carregar configurações apenas quando abrir o modal
    useEffect(() => {
        let active = true;
        const load = async () => {
            if (!showInfo) return;
            try {
                const res = await fetch('/api/settings');
                const data = await res.json();
                if (active && data?.success) setSettings(data.data);
            } catch (e) {
                // silencioso
            }
        };
        load();
        return () => { active = false; };
    }, [showInfo]);

    const info = settings?.establishmentInfo || {
        name: 'Rei dos Salgados',
        address: { street: 'Rua Maria Luiza Dantas', city: 'Alto Rodrigues', state: 'RN' },
        contact: { phone: '+55 84 9872-9126', whatsapp: '+55 84 9872-9126' },
        paymentMethods: ['Cartão de Crédito', 'Cartão de Débito', 'PIX', 'Dinheiro'],
        socialMedia: { instagram: '@reidossalgados' },
        about: 'Especialistas em salgados artesanais, oferecendo qualidade e sabor em cada pedido. Nossos produtos são feitos com ingredientes frescos e selecionados.',
        pixKey: settings?.establishmentInfo?.pixKey
    };
    const bh = settings?.businessHours;

    // Dia atual para destacar no horário de funcionamento
    const weekdayIndex = new Date().getDay(); // 0=Dom, 1=Seg ...
    const weekdayMap: Record<number, string> = {
        0: 'sunday',
        1: 'monday',
        2: 'tuesday',
        3: 'wednesday',
        4: 'thursday',
        5: 'friday',
        6: 'saturday',
    };
    const todayKey = weekdayMap[weekdayIndex];

    const handleCopyPix = async () => {
        const pix = info?.pixKey;
        if (!pix) return;
        try {
            await navigator.clipboard.writeText(String(pix));
            setCopyMsg('PIX copiado!');
            setTimeout(() => setCopyMsg(''), 1500);
        } catch {
            setCopyMsg('Falha ao copiar');
            setTimeout(() => setCopyMsg(''), 1500);
        }
    };

    return (
        <header className="bg-white dark:bg-gray-900 border-b border-yellow-500 shadow-lg transition-colors duration-300">
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
                    {/* Botão do Carrinho */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsCartOpen(true)}
                        className="bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-lg flex items-center gap-2 transition-colors relative"
                    >
                        <FaShoppingCart className="w-4 h-4" />
                        <span className="hidden xs:inline sm:inline md:inline">Carrinho</span>
                        <span className="inline xs:hidden sm:hidden md:hidden">Carrinho</span>
                        {totalItems > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                {totalItems}
                            </span>
                        )}
                    </motion.button>

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

                    {/* Botão de tema (reposicionado ao lado do botão Pedido) */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={toggleTheme}
                        className="bg-gray-800 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 text-yellow-400 p-2.5 rounded-lg transition-colors flex items-center justify-center border border-gray-700 dark:border-gray-600 shadow-lg"
                        aria-label={`Alternar para tema ${theme === 'dark' ? 'claro' : 'escuro'}`}
                        title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
                    >
                        {theme === 'dark' ? <FaSun className="w-5 h-5" /> : <FaMoon className="w-5 h-5" />}
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg ${isOpen
                            ? 'bg-yellow-500 hover:bg-yellow-400 text-black'
                            : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-800 text-gray-900 dark:text-white'
                            }`}
                        disabled={loading}
                    >
                        <span className="relative flex h-3 w-3">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isOpen ? 'bg-yellow-400' : 'bg-gray-500 dark:bg-gray-500'} opacity-75`}></span>
                            <span className={`relative inline-flex rounded-full h-3 w-3 ${isOpen ? 'bg-yellow-500' : 'bg-gray-600 dark:bg-gray-600'}`}></span>
                        </span>
                        <span className="hidden xs:inline sm:inline md:inline">{loading ? 'Carregando...' : isOpen ? 'Aberto' : 'Fechado'}</span>
                        <span className="inline xs:hidden sm:hidden md:hidden">{loading ? '...' : isOpen ? 'Ab...' : 'Fech...'}</span>
                    </motion.button>
                </motion.div>
            </div>

            {/* Modal de informações do restaurante (visual refinado) */}
            {showInfo && (
                <AnimatePresence>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowInfo(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.97, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.97, y: 16 }}
                            transition={{ type: 'spring', damping: 28, stiffness: 360 }}
                            className="relative w-full mx-4 overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-b from-gray-900 to-gray-950 text-gray-200 shadow-2xl max-h-[90vh] md:max-w-2xl lg:max-w-3xl xl:max-w-4xl"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Topo com logo e status */}
                            <div className="relative h-28 md:h-32 lg:h-40 bg-gradient-to-r from-yellow-500/15 via-yellow-500/5 to-transparent">
                                <button
                                    onClick={() => setShowInfo(false)}
                                    className="absolute top-3 right-3 h-9 w-9 rounded-full bg-gray-800/80 hover:bg-gray-700 text-yellow-400 text-xl leading-none flex items-center justify-center border border-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                    aria-label="Fechar"
                                >
                                    ×
                                </button>
                                <div className="absolute inset-0 flex items-center gap-4 px-5 md:px-6 lg:px-8">
                                    <div className="relative w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-xl overflow-hidden ring-2 ring-yellow-500/40 shadow-glow bg-gray-800">
                                        <Image src="/logo/logoreidossalgados.png" alt={info.name} fill sizes="(max-width: 768px) 64px, (max-width: 1024px) 80px, 96px" className="object-cover" />
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-xl md:text-2xl lg:text-3xl font-extrabold text-white leading-tight">{info.name}</h2>
                                        <div className="mt-1 inline-flex items-center gap-2">
                                            <span className={`px-2 py-0.5 text-xs rounded-full border ${isOpen ? 'bg-green-500/15 text-green-300 border-green-500/40' : 'bg-red-500/15 text-red-300 border-red-500/40'}`}>
                                                {isOpen ? 'Aberto agora' : 'Fechado no momento'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Conteúdo */}
                            <div className="p-5 md:p-6 lg:p-8 space-y-5 overflow-y-auto max-h-[calc(90vh-13rem)] custom-scroll">
                                <div className="grid gap-5 lg:grid-cols-2">
                                    {/* Coluna Esquerda */}
                                    <div className="space-y-5">
                                        {/* Endereço */}
                                        <div className="rounded-lg border border-gray-800 bg-gray-900/60 p-4 md:p-5">
                                            <div className="flex items-start gap-3">
                                                <div className="mt-0.5 text-yellow-400"><FaMapMarkerAlt /></div>
                                                <div className="flex-1">
                                                    <p className="text-sm text-gray-400">Endereço</p>
                                                    <p className="text-white font-medium leading-snug">{info.address?.street}</p>
                                                    <p className="text-gray-300 text-sm">{info.address?.city} - {info.address?.state}</p>
                                                    <div className="mt-2">
                                                        <button
                                                            onClick={async () => {
                                                                try {
                                                                    await navigator.clipboard.writeText(`${info.address?.street}, ${info.address?.city} - ${info.address?.state}`);
                                                                } catch {}
                                                            }}
                                                            className="text-xs px-2 py-1 rounded border border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
                                                        >
                                                            Copiar endereço
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Horário */}
                                        <div className="rounded-lg border border-gray-800 bg-gray-900/60 p-4 md:p-5">
                                            <div className="flex items-start gap-3">
                                                <div className="mt-0.5 text-yellow-400"><FaClock /></div>
                                                <div className="flex-1">
                                                    <p className="text-sm text-gray-400">Horário de Funcionamento</p>
                                                    {bh ? (
                                                        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-300">
                                                            {[
                                                                { key: 'monday', label: 'Segunda' },
                                                                { key: 'tuesday', label: 'Terça' },
                                                                { key: 'wednesday', label: 'Quarta' },
                                                                { key: 'thursday', label: 'Quinta' },
                                                                { key: 'friday', label: 'Sexta' },
                                                                { key: 'saturday', label: 'Sábado' },
                                                                { key: 'sunday', label: 'Domingo' },
                                                            ].map((d: any) => (
                                                                <div key={d.key} className="flex items-center justify-between">
                                                                    <span className={`text-gray-400 ${d.key === todayKey ? 'text-yellow-300' : ''}`}>{d.label}</span>
                                                                    <span className={`font-medium ${d.key === todayKey ? 'text-yellow-200 bg-yellow-500/10 border border-yellow-500/30 rounded px-2 py-0.5' : 'text-white'}`}>
                                                                        {bh?.[d.key]?.open ? `${bh?.[d.key]?.start} - ${bh?.[d.key]?.end}` : 'Fechado'}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <p className="text-white font-medium leading-snug">Quarta a Segunda: 18:00 às 23:00</p>
                                                            <p className="text-gray-300 text-sm">Terça: Fechado</p>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Contato */}
                                        <div className="rounded-lg border border-gray-800 bg-gray-900/60 p-4 md:p-5">
                                            <div className="flex items-start gap-3">
                                                <div className="mt-0.5 text-yellow-400"><FaPhone /></div>
                                                <div className="flex-1">
                                                    <p className="text-sm text-gray-400">Contato</p>
                                                    <a href={`tel:${String(info.contact?.phone || '')}`} className="text-white font-medium leading-snug hover:underline">
                                                        {info.contact?.phone}
                                                    </a>
                                                    <div className="mt-2">
                                                        <a
                                                            href={`https://wa.me/${String(info.contact?.whatsapp || '').replace(/\D/g, '')}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-2 rounded-lg bg-green-500/90 hover:bg-green-500 text-white text-sm font-semibold px-3 py-2 transition"
                                                        >
                                                            <FaWhatsapp /> Conversar no WhatsApp
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Coluna Direita */}
                                    <div className="space-y-5">
                                        {/* Pagamentos */}
                                        <div className="rounded-lg border border-gray-800 bg-gray-900/60 p-4 md:p-5">
                                            <div className="flex items-start gap-3">
                                                <div className="mt-0.5 text-yellow-400"><FaMoneyBillWave /></div>
                                                <div className="flex-1">
                                                    <p className="text-sm text-gray-400">Formas de Pagamento</p>
                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                        {(info.paymentMethods || []).map((m: string) => (
                                                            <span key={m} className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-800 border border-gray-700 text-gray-200">
                                                                {m}
                                                            </span>
                                                        ))}
                                                    </div>
                                                    {info.pixKey && (
                                                        <div className="mt-3 flex items-center gap-2">
                                                            <span className="inline-flex items-center gap-2 text-yellow-300 text-sm"><FaKey /> PIX: <span className="text-white break-all">{info.pixKey}</span></span>
                                                            <button onClick={handleCopyPix} className="text-xs px-2 py-1 rounded border border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10">Copiar</button>
                                                            {copyMsg && <span className="text-xs text-gray-400">{copyMsg}</span>}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Redes sociais */}
                                        <div className="rounded-lg border border-gray-800 bg-gray-900/60 p-4 md:p-5">
                                            <div className="flex items-start gap-3">
                                                <div className="mt-0.5 text-yellow-400"><FaInstagram /></div>
                                                <div>
                                                    <p className="text-sm text-gray-400">Redes Sociais</p>
                                                    <a
                                                        href={`https://instagram.com/${String(info.socialMedia?.instagram || '').replace('@', '')}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-white font-medium hover:underline"
                                                    >
                                                        {info.socialMedia?.instagram}
                                                    </a>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Sobre */}
                                        <div className="rounded-lg border border-gray-800 bg-gray-900/60 p-4 md:p-5">
                                            <p className="text-sm text-gray-400 mb-1">Sobre nós</p>
                                            <p className="text-gray-200 leading-relaxed text-sm">{info.about}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Rodapé fixo do modal */}
                            <div className="px-5 md:px-6 lg:px-8 py-4 border-t border-gray-800 bg-gradient-to-b from-gray-900/80 to-gray-950/80">
                                <div className="flex items-center justify-end">
                                    <button
                                        onClick={() => setShowInfo(false)}
                                        className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-yellow-500 text-black font-semibold hover:bg-yellow-400 transition-colors"
                                    >
                                        Fechar
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </AnimatePresence>
            )}

            {isCartOpen && (
                <Cart
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