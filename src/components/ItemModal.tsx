// src/components/ItemModal.tsx

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { X } from 'lucide-react';
import { MenuItem } from '@/types/menu';
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { isIphone } from '@/utils/device-utils';

// Interface de Props CORRIGIDA
interface ItemModalProps {
    item: MenuItem | null;
    onClose: () => void;
    // Adicionamos a prop 'onAddToCart' de volta, com a tipagem correta
    onAddToCart: (
        quantity: number,
        observation: string,
        size?: string,
        border?: string,
        extras?: string[]
    ) => void;
    allPizzas: MenuItem[]; // Prop para meio a meio
}

const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.18 } },
    exit: { opacity: 0, transition: { duration: 0.18 } },
};

const modalVariants = {
    hidden: { opacity: 0, y: 60, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', damping: 26, stiffness: 260 } },
    exit: { opacity: 0, y: 40, scale: 0.98, transition: { duration: 0.18 } },
};

const ItemModal: React.FC<ItemModalProps> = ({ item, onClose, onAddToCart, allPizzas }) => {
    const [quantity, setQuantity] = useState(1);
    const [size, setSize] = useState<string | undefined>(undefined);
    const [observation, setObservation] = useState('');
    const [selectedFlavor, setSelectedFlavor] = useState<string | null>(null);
    const [selectedExtras, setSelectedExtras] = useState<string[]>([]); // Para extraOptions
    const [selectedBorder, setSelectedBorder] = useState<string | null>(null);
    const [showFlavorWarning, setShowFlavorWarning] = useState(false);
    const [deviceClass, setDeviceClass] = useState('');
    const closeBtnRef = useRef<HTMLButtonElement | null>(null);

    useEffect(() => {
        if (isIphone()) setDeviceClass('iphone-device');
        document.body.style.overflow = 'hidden';
        const keyHandler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', keyHandler);
        setTimeout(() => closeBtnRef.current?.focus(), 50);
        return () => { document.body.style.overflow = 'auto'; window.removeEventListener('keydown', keyHandler); };
    }, [onClose]);

    // Define o tamanho inicial quando o modal abre
    useEffect(() => {
        if (item && item.sizes) {
            const firstSize = Object.keys(item.sizes)[0];
            setSize(firstSize);
        }
    }, [item]);


    if (!item) return null;

    // Cálculo de preço base considerando sizes OU flavors
    const currentBasePrice = useMemo(() => {
        // Se houver sabores disponíveis, priorizamos preço do sabor selecionado
        const availableFlavors = item.flavors?.filter(f => f.available) || [];
        if (availableFlavors.length > 0) {
            if (selectedFlavor) {
                const flavor = availableFlavors.find(f => f.name === selectedFlavor);
                if (flavor) return flavor.price;
            }
            // Sem sabor selecionado ainda: mostrar preço base (ou primeiro sabor disponível)
            return item.price || availableFlavors[0]?.price || 0;
        }
        // Caso sem sabores, usar size se existir
        if (size && item.sizes && item.sizes[size] !== undefined) return item.sizes[size]!;
        return item.price || 0;
    }, [item, size, selectedFlavor]);

    const extrasTotal = useMemo(() => {
        if (!item.extraOptions) return 0;
        return selectedExtras.reduce((sum, ex) => sum + (item.extraOptions?.[ex] || 0), 0);
    }, [selectedExtras, item.extraOptions]);

    const borderPrice = useMemo(() => {
        if (!selectedBorder || !item.borderOptions) return 0;
        return item.borderOptions[selectedBorder] || 0;
    }, [selectedBorder, item.borderOptions]);

    const totalPrice = (currentBasePrice + extrasTotal + borderPrice) * quantity;

    const hasFlavorRequirement = useMemo(() => {
        const avail = item.flavors?.filter(f => f.available) || [];
        return avail.length > 0;
    }, [item.flavors]);

    const handleAddToCartClick = () => {
        if (!item.available) return; // Segurança extra
        if (hasFlavorRequirement && !selectedFlavor) {
            setShowFlavorWarning(true);
            return;
        }
        const extrasList: string[] = [];
        if (selectedFlavor) extrasList.push(selectedFlavor);
        if (selectedExtras.length > 0) extrasList.push(...selectedExtras);
        onAddToCart(quantity, observation, size, selectedBorder || undefined, extrasList.length ? extrasList : undefined);
        onClose();
    };

    const toggleExtra = (key: string) => {
        setSelectedExtras(prev => prev.includes(key) ? prev.filter(e => e !== key) : [...prev, key]);
    };

    return (
        <AnimatePresence>
            <motion.div
                className={`fixed inset-0 z-50 flex items-end md:items-center md:justify-center bg-black/60 ${deviceClass}`}
                onClick={onClose}
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={backdropVariants}
                style={{ backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
            >
                <motion.div
                    role="dialog"
                    aria-modal="true"
                    aria-label={`Adicionar ${item.name}`}
                    className="relative w-full md:max-w-xl md:rounded-2xl rounded-t-3xl bg-gradient-to-b from-gray-900 to-gray-950 shadow-2xl border border-gray-800/70 flex flex-col max-h-[100vh] md:max-h-[90vh] overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                    variants={modalVariants}
                >
                    {/* Botão de fechar agora é fixo em relação ao modal */}
                    <button
                        ref={closeBtnRef}
                        onClick={onClose}
                        className="absolute top-3 right-3 z-20 bg-gray-900/70 backdrop-blur px-2.5 py-2 rounded-full text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        aria-label="Fechar modal"
                    >
                        <X size={18} />
                    </button>

                    {/* Header / Imagem */}
                    <div className="relative w-full h-52 md:h-60 overflow-hidden flex-shrink-0">
                        <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes="(max-width: 768px) 100vw, 50vw"
                            className="object-cover"
                            priority
                            quality={75}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-black/40" />
                        <div className="absolute bottom-3 left-4 right-4">
                            <h2 className="text-xl md:text-2xl font-bold text-white drop-shadow-md leading-tight">{item.name}</h2>
                        </div>
                    </div>

                    {/* Conteúdo scrollável com rolagem suave para iOS */}
                    <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6 scrollbar-hide ios-scroll-smooth">
                        {item.description && (
                            <p className="text-sm text-gray-300 leading-relaxed">{item.description}</p>
                        )}

                        {/* Seção de Sabores (flavors) */}
                        {item.flavors && item.flavors.filter(f => f.available).length > 0 && (
                            <div className="space-y-3">
                                <p className="text-xs font-semibold tracking-wide text-gray-400 uppercase">{item.flavorLabel || 'Sabores'}</p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {item.flavors.filter(f => f.available).map(f => {
                                        const active = selectedFlavor === f.name;
                                        return (
                                            <button
                                                key={f.name}
                                                type="button"
                                                onClick={() => { setSelectedFlavor(f.name); setShowFlavorWarning(false); }}
                                                className={`relative flex flex-col items-center justify-center rounded-lg border px-2 py-2 text-center text-xs font-medium transition select-none ${active ? 'border-yellow-500 bg-yellow-500/10 text-yellow-400 shadow-glow' : 'border-gray-700 bg-gray-800/60 hover:border-gray-600 text-gray-300'}`}
                                            >
                                                <span className="line-clamp-2 leading-tight">{f.name}</span>
                                                <span className="mt-1 text-[10px] text-gray-400">R$ {f.price.toFixed(2)}</span>
                                                {active && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-yellow-500" />}
                                            </button>
                                        );
                                    })}
                                </div>
                                {showFlavorWarning && !selectedFlavor && (
                                    <p className="text-[11px] text-red-400 font-medium">Selecione um sabor antes de continuar.</p>
                                )}
                            </div>
                        )}

                        {/* Seção de Tamanhos (sizes) - ocultar se houver sabores disponíveis */}
                        {(!item.flavors || item.flavors.filter(f => f.available).length === 0) && item.sizes && (
                            <div className="space-y-3">
                                <p className="text-xs font-semibold tracking-wide text-gray-400 uppercase">Tamanhos</p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {Object.keys(item.sizes).map(sizeKey => {
                                        const active = size === sizeKey;
                                        const price = item.sizes![sizeKey as keyof typeof item.sizes];
                                        return (
                                            <button
                                                key={sizeKey}
                                                type="button"
                                                onClick={() => setSize(sizeKey)}
                                                className={`relative flex flex-col items-center justify-center rounded-lg border px-2 py-2 text-center text-xs font-medium transition select-none ${active ? 'border-yellow-500 bg-yellow-500/10 text-yellow-400 shadow-glow' : 'border-gray-700 bg-gray-800/60 hover:border-gray-600 text-gray-300'}`}
                                            >
                                                <span>{sizeKey.toUpperCase()}</span>
                                                <span className="mt-1 text-[10px] text-gray-400">R$ {price?.toFixed(2)}</span>
                                                {active && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-yellow-500" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Borda (borderOptions) */}
                        {item.borderOptions && Object.keys(item.borderOptions).length > 0 && (
                            <div className="space-y-3">
                                <p className="text-xs font-semibold tracking-wide text-gray-400 uppercase">Borda</p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {Object.entries(item.borderOptions).map(([border, price]) => {
                                        const active = selectedBorder === border;
                                        return (
                                            <button
                                                key={border}
                                                type="button"
                                                onClick={() => setSelectedBorder(active ? null : border)}
                                                className={`relative flex flex-col items-center justify-center rounded-lg border px-2 py-2 text-center text-xs font-medium transition select-none ${active ? 'border-yellow-500 bg-yellow-500/10 text-yellow-400 shadow-glow' : 'border-gray-700 bg-gray-800/60 hover:border-gray-600 text-gray-300'}`}
                                            >
                                                <span className="line-clamp-2 leading-tight">{border}</span>
                                                <span className="mt-1 text-[10px] text-gray-400">+ R$ {price.toFixed(2)}</span>
                                                {active && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-yellow-500" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Extras (extraOptions) */}
                        {item.extraOptions && Object.keys(item.extraOptions).length > 0 && (
                            <div className="space-y-3">
                                <p className="text-xs font-semibold tracking-wide text-gray-400 uppercase">Extras</p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {Object.entries(item.extraOptions).map(([extra, price]) => {
                                        const active = selectedExtras.includes(extra);
                                        return (
                                            <button
                                                key={extra}
                                                type="button"
                                                onClick={() => toggleExtra(extra)}
                                                className={`relative flex flex-col items-center justify-center rounded-lg border px-2 py-2 text-center text-xs font-medium transition select-none ${active ? 'border-yellow-500 bg-yellow-500/10 text-yellow-400 shadow-glow' : 'border-gray-700 bg-gray-800/60 hover:border-gray-600 text-gray-300'}`}
                                            >
                                                <span className="line-clamp-2 leading-tight">{extra}</span>
                                                <span className="mt-1 text-[10px] text-gray-400">+ R$ {price.toFixed(2)}</span>
                                                {active && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-yellow-500" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Quantidade */}
                        <div className="space-y-3">
                            <p className="text-xs font-semibold tracking-wide text-gray-400 uppercase">Quantidade</p>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 bg-gray-800 rounded-full px-2 py-1">
                                    <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-700 hover:bg-gray-600 text-white text-lg" aria-label="Diminuir">-</button>
                                    <span className="font-bold text-lg text-white min-w-[2ch] text-center">{quantity}</span>
                                    <button onClick={() => setQuantity(q => q + 1)} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-700 hover:bg-gray-600 text-white text-lg" aria-label="Aumentar">+</button>
                                </div>
                                <div className="text-sm text-gray-400">Preço unitário: <span className="text-gray-200 font-medium">R$ {currentBasePrice.toFixed(2)}</span></div>
                            </div>
                        </div>

                        {/* Observação */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold tracking-wide text-gray-400 uppercase">Observações</label>
                            <textarea
                                value={observation}
                                onChange={(e) => setObservation(e.target.value)}
                                rows={2}
                                className="w-full resize-none bg-gray-800/70 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500"
                                placeholder="Ex: sem cebola, pouco sal..."
                            />
                        </div>
                    </div>

                    {/* Footer fixo */}
                    <div className="flex-shrink-0 p-5 border-t border-gray-800/70 bg-gray-900/85 backdrop-blur supports-[backdrop-filter]:bg-gray-900/60">
                        <div className="flex items-end justify-between mb-3">
                            <div>
                                <p className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold">Total</p>
                                <p className="text-2xl font-bold text-yellow-400 leading-none mt-1">R$ {totalPrice.toFixed(2)}</p>
                            </div>
                            {item.sizes && size && (
                                <p className="text-[11px] text-gray-500">Base: {size.toUpperCase()}</p>
                            )}
                        </div>
                        {item.available ? (
                            <button
                                onClick={handleAddToCartClick}
                                className="w-full relative bg-yellow-500 text-gray-900 font-bold py-4 rounded-lg hover:bg-yellow-400 active:scale-[0.985] transition shadow-lg shadow-yellow-500/20 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                            >
                                Adicionar ao Carrinho
                                <span className="absolute inset-y-0 left-0 w-1 bg-yellow-400/70 rounded-l" />
                            </button>
                        ) : (
                            <div className="w-full relative bg-gray-700 text-gray-400 font-bold py-4 rounded-lg cursor-not-allowed text-center border border-gray-600">
                                Indisponível
                                <span className="absolute inset-y-0 left-0 w-1 bg-gray-600 rounded-l" />
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ItemModal;