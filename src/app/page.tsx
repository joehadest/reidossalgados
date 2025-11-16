'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRestaurantStatus } from '@/contexts/RestaurantStatusContext';
import { FaInfoCircle, FaSearch, FaWhatsapp, FaKey } from 'react-icons/fa';
import Image from 'next/image';
import MenuDisplay from '@/components/MenuDisplay';
import OrderTracker from '@/components/OrderTracker';

export default function Home() {
    const { isOpen, loading } = useRestaurantStatus();
    const [showInfo, setShowInfo] = useState(false);
    const [showOrderTracker, setShowOrderTracker] = useState(false);
    const [establishmentInfo, setEstablishmentInfo] = useState<any>(null);
    const [infoLoading, setInfoLoading] = useState(true);
    const [copyMsg, setCopyMsg] = useState<string>('');

    // Bloquear scroll quando modais estão abertos
    useEffect(() => {
        const hasModalOpen = showInfo || showOrderTracker;

        if (hasModalOpen) {
            document.body.classList.add('overflow-hidden');
        } else {
            document.body.classList.remove('overflow-hidden');
        }

        return () => document.body.classList.remove('overflow-hidden');
    }, [showInfo, showOrderTracker]);

    // Função para buscar informações do estabelecimento
    const fetchEstablishmentInfo = async () => {
        try {
            setInfoLoading(true);
            const response = await fetch('/api/settings');
            const data = await response.json();

            if (data.success && data.data) {
                setEstablishmentInfo({
                    ...data.data.establishmentInfo,
                    businessHours: data.data.businessHours
                });
            }
        } catch (error) {
            console.error('Erro ao buscar informações do estabelecimento:', error);
        } finally {
            setInfoLoading(false);
        }
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
        return daysOfWeek.map(({ key, label }) => ({ key, label, ...hours[key] }));
    };

    useEffect(() => {
        fetchEstablishmentInfo();
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
        <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
            {/* Banner + Logo + Info */}
            <div className="relative w-full flex justify-center mb-28 pb-4">
                <div className="w-full relative">
                    <Image
                        src="/banner/banner.png"
                        alt="Banner Rei dos Salgados"
                        width={1600}
                        height={260}
                        className="w-full h-[120px] md:h-[220px] lg:h-[260px] object-cover rounded-l-2xl rounded-r-2xl rounded-t-none rounded-b-none"
                        priority
                    />
                    {/* Logo sobreposta */}
                    <div className="absolute left-0 right-0 -bottom-20 sm:-bottom-32 flex items-center w-full max-w-6xl mx-auto mt-3 px-4">
                        <Image
                            src="/logo/logoreidossalgados.png"
                            alt="Logo Rei dos Salgados"
                            width={80}
                            height={80}
                            className="rounded-xl border-4 border-white shadow-lg bg-white sm:w-[130px] sm:h-[130px] w-[80px] h-[80px] flex-shrink-0"
                        />
                        {/* Nome e ícones */}
                        <div className="ml-3 sm:ml-6 flex flex-col justify-center min-w-0 mt-3 flex-1">
                            <div className="flex items-center min-w-0 justify-start">
                                <span className="text-lg sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white drop-shadow-lg brand-name whitespace-nowrap leading-normal flex-shrink-0 transition-colors duration-300">
                                    Rei dos Salgados
                                </span>
                                <button
                                    className="bg-transparent text-gray-900 dark:text-white p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors flex items-center justify-center ml-2 mt-0,5 sm:mt-3"
                                    onClick={() => setShowInfo(true)}
                                    aria-label="Informações do restaurante"
                                >
                                    <FaInfoCircle className="text-lg sm:text-xl" />
                                </button>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-4 mt-1 sm:mt-2 text-gray-900 dark:text-white/90 text-xs sm:text-sm">
                                <span className={`flex items-center gap-1 bg-black/10 dark:bg-white/20 px-2 py-1 rounded transition-colors ${loading ? 'opacity-50' : ''}`}>
                                    <span className={`w-2 h-2 rounded-full mr-1 ${isOpen ? 'bg-green-400' : 'bg-red-400'}`}></span>
                                    {loading ? 'Carregando...' : isOpen ? 'Aberto' : 'Fechado'}
                                </span>

                                {/* Botão de Acompanhar Pedido */}
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setShowOrderTracker(true)}
                                    className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 px-2 py-1 rounded flex items-center gap-1 transition-colors text-xs font-medium"
                                >
                                    <FaSearch className="w-3 h-3" />
                                    <span>Pedido</span>
                                </motion.button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de informações do restaurante (visual refinado) */}
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
                            className="bg-gray-900 rounded-2xl shadow-2xl border border-yellow-500/30 overflow-hidden max-h-[90vh] overflow-y-auto w-full max-w-2xl lg:max-w-3xl mx-2 custom-scroll"
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
                                    <FaInfoCircle className="text-base" />
                                </motion.button>
                            </div>
                            {/* Conteúdo */}
                            <div className="p-3 sm:p-6">
                                <h2 className="text-lg sm:text-2xl font-bold text-yellow-500 mb-4 text-center">
                                    {establishmentInfo?.name || 'Rei dos Salgados'}
                                </h2>
                                <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
                                    {/* Coluna Esquerda */}
                                    <div className="space-y-4 sm:space-y-5">
                                        {/* Endereço */}
                                        <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4 border border-gray-700">
                                            <h3 className="text-yellow-400 font-semibold text-xs sm:text-base mb-2 flex items-center gap-2">
                                                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                                                Endereço
                                            </h3>
                                            <div className="text-gray-300 text-xs sm:text-sm">
                                                <p className="text-white">{establishmentInfo?.address?.street || 'Rua Maria Luiza Dantas'}</p>
                                                <p>{(establishmentInfo?.address?.city || 'Alto Rodrigues')} - {(establishmentInfo?.address?.state || 'RN')}</p>
                                                <div className="mt-2">
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                const s = establishmentInfo?.address?.street || 'Rua Maria Luiza Dantas';
                                                                const c = establishmentInfo?.address?.city || 'Alto Rodrigues';
                                                                const st = establishmentInfo?.address?.state || 'RN';
                                                                await navigator.clipboard.writeText(`${s}, ${c} - ${st}`);
                                                                setCopyMsg('Endereço copiado!');
                                                                setTimeout(() => setCopyMsg(''), 1500);
                                                            } catch {}
                                                        }}
                                                        className="text-xs px-2 py-1 rounded border border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
                                                    >
                                                        Copiar endereço
                                                    </button>
                                                    {copyMsg && <span className="ml-2 text-xs text-gray-400">{copyMsg}</span>}
                                                </div>
                                            </div>
                                        </div>
                                        {/* Horário */}
                                        <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4 border border-gray-700">
                                            <h3 className="text-yellow-400 font-semibold text-xs sm:text-base mb-2 flex items-center gap-2">
                                                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                                                Horário de Funcionamento
                                            </h3>
                                            <div className="text-gray-300 text-xs sm:text-sm space-y-1">
                                                {infoLoading ? (
                                                    <div className="text-gray-400">Carregando horários...</div>
                                                ) : establishmentInfo?.businessHours ? (
                                                    (() => {
                                                        const weekdayIndex = new Date().getDay();
                                                        const weekdayMap: Record<number, { key: string; label: string }> = {
                                                            0: { key: 'sunday', label: 'Domingo' },
                                                            1: { key: 'monday', label: 'Segunda' },
                                                            2: { key: 'tuesday', label: 'Terça' },
                                                            3: { key: 'wednesday', label: 'Quarta' },
                                                            4: { key: 'thursday', label: 'Quinta' },
                                                            5: { key: 'friday', label: 'Sexta' },
                                                            6: { key: 'saturday', label: 'Sábado' },
                                                        };
                                                        const today = weekdayMap[weekdayIndex];
                                                        const days = formatBusinessHours(establishmentInfo.businessHours) || [];
                                                        return days.map((d: any, idx: number) => (
                                                            <div key={idx} className="flex justify-between items-center">
                                                                <span className={`${d.key === today.key ? 'text-yellow-300' : ''}`}>{d.label}:</span>
                                                                <span className={`${d.open ? (d.key === today.key ? 'text-yellow-200 bg-yellow-500/10 border border-yellow-500/30 rounded px-2 py-0.5 font-medium' : 'text-white font-medium') : 'text-red-400 font-medium'}`}>
                                                                    {d.open ? `${d.start} às ${d.end}` : 'Fechado'}
                                                                </span>
                                                            </div>
                                                        ));
                                                    })()
                                                ) : (
                                                    <div className="text-gray-400">Horários não disponíveis</div>
                                                )}
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
                                                <a href={`tel:${String(establishmentInfo?.contact?.phone || '+55 84 9872-9126')}`} className="text-white font-medium text-sm sm:text-base hover:underline">
                                                    {establishmentInfo?.contact?.phone || '+55 84 9872-9126'}
                                                </a>
                                                <div className="mt-2">
                                                    <a
                                                        href={`https://wa.me/${String(establishmentInfo?.contact?.whatsapp || '').replace(/\D/g, '')}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 rounded-lg bg-green-500/90 hover:bg-green-500 text-white text-xs sm:text-sm font-semibold px-3 py-2 transition"
                                                    >
                                                        <FaWhatsapp /> Conversar no WhatsApp
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Coluna Direita */}
                                    <div className="space-y-4 sm:space-y-5">
                                        {/* Pagamentos */}
                                        <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4 border border-gray-700">
                                            <h3 className="text-yellow-400 font-semibold text-xs sm:text-base mb-2 flex items-center gap-2">
                                                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                                                Formas de Pagamento
                                            </h3>
                                            <div className="text-gray-300 text-xs sm:text-sm">
                                                <div className="mt-1 sm:mt-2 flex flex-wrap gap-2">
                                                    {(establishmentInfo?.paymentMethods && establishmentInfo.paymentMethods.length > 0
                                                        ? establishmentInfo.paymentMethods
                                                        : ['Cartão de Crédito', 'Cartão de Débito', 'PIX', 'Dinheiro']
                                                    ).map((m: string) => (
                                                        <span key={m} className="px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-medium bg-gray-800 border border-gray-700 text-gray-200">
                                                            {m}
                                                        </span>
                                                    ))}
                                                </div>
                                                {establishmentInfo?.pixKey && (
                                                    <div className="mt-3 flex items-center gap-2">
                                                        <span className="inline-flex items-center gap-2 text-yellow-300 text-xs sm:text-sm"><FaKey /> PIX: <span className="text-white break-all">{establishmentInfo.pixKey}</span></span>
                                                        <button
                                                            onClick={async () => {
                                                                try {
                                                                    await navigator.clipboard.writeText(String(establishmentInfo.pixKey));
                                                                    setCopyMsg('PIX copiado!');
                                                                    setTimeout(() => setCopyMsg(''), 1500);
                                                                } catch {}
                                                            }}
                                                            className="text-[11px] sm:text-xs px-2 py-1 rounded border border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
                                                        >
                                                            Copiar
                                                        </button>
                                                        {copyMsg && <span className="text-[11px] sm:text-xs text-gray-400">{copyMsg}</span>}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {/* Redes Sociais */}
                                        <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4 border border-gray-700">
                                            <h3 className="text-yellow-400 font-semibold text-xs sm:text-base mb-2 flex items-center gap-2">
                                                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                                                Redes Sociais
                                            </h3>
                                            <div className="text-gray-300 text-xs sm:text-sm">
                                                <a
                                                    href={`https://instagram.com/${String(establishmentInfo?.socialMedia?.instagram || '@reidossalgados').replace('@', '')}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-white font-medium hover:underline"
                                                >
                                                    {establishmentInfo?.socialMedia?.instagram || '@reidossalgados'}
                                                </a>
                                            </div>
                                        </div>
                                        {/* Sobre Nós */}
                                        <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4 border border-gray-700">
                                            <h3 className="text-yellow-400 font-semibold text-xs sm:text-base mb-2 flex items-center gap-2">
                                                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                                                Sobre Nós
                                            </h3>
                                            <div className="text-gray-300 text-xs sm:text-sm leading-relaxed">
                                                <p>{establishmentInfo?.about || 'Especialistas em salgados artesanais, oferecendo qualidade e sabor em cada pedido. Nossos produtos são feitos com ingredientes frescos e selecionados.'}</p>
                                            </div>
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

            {/* Modal de Acompanhamento de Pedidos */}
            <AnimatePresence>
                {showOrderTracker && (
                    <OrderTracker onClose={() => setShowOrderTracker(false)} />
                )}
            </AnimatePresence>
        </div>
    );
}