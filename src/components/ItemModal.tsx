// src/components/ItemModal.tsx

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { X } from 'lucide-react';
import { MenuItem } from '@/types/menu';
import React, { useEffect, useState } from 'react';
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
    visible: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.2 } },
};

const modalVariants = {
    hidden: { opacity: 0, translateY: 30 },
    visible: {
        opacity: 1,
        translateY: 0,
        transition: { type: 'spring', damping: 25, stiffness: 200 }
    },
    exit: {
        opacity: 0,
        translateY: 30,
        transition: { duration: 0.2 }
    },
};

const ItemModal: React.FC<ItemModalProps> = ({ item, onClose, onAddToCart, allPizzas }) => {
    const [quantity, setQuantity] = useState(1);
    const [size, setSize] = useState<string | undefined>(undefined);
    const [observation, setObservation] = useState('');
    // Adicione outros estados se precisar para 'border' e 'extras'
    const [deviceClass, setDeviceClass] = useState('');

    useEffect(() => {
        if (isIphone()) {
            setDeviceClass('iphone-device');
        }
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, []);

    // Define o tamanho inicial quando o modal abre
    useEffect(() => {
        if (item && item.sizes) {
            const firstSize = Object.keys(item.sizes)[0];
            setSize(firstSize);
        }
    }, [item]);


    if (!item) return null;

    const handleAddToCartClick = () => {
        // Chama a função recebida por props com os dados do modal
        onAddToCart(quantity, observation, size);
        onClose(); // Fecha o modal
    };

    return (
        <AnimatePresence>
            <motion.div
                className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 ${deviceClass}`}
                onClick={onClose}
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={backdropVariants}
                style={{
                    backdropFilter: 'blur(4px)',
                    WebkitBackdropFilter: 'blur(4px)',
                }}
            >
                <motion.div
                    className="bg-gray-800 rounded-2xl shadow-xl w-11/12 max-w-md mx-auto overflow-hidden border border-gray-700"
                    onClick={(e) => e.stopPropagation()}
                    variants={modalVariants}
                >
                    <div className="relative">
                        <Image
                            src={item.image}
                            alt={item.name}
                            width={500}
                            height={300}
                            className="w-full h-48 object-cover"
                            sizes="(max-width: 768px) 100vw, 50vw"
                            priority
                        />
                        <button
                            onClick={onClose}
                            className="absolute top-3 right-3 bg-gray-900 bg-opacity-60 rounded-full p-1.5 text-white hover:bg-opacity-80 transition-opacity"
                            aria-label="Fechar modal"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6">
                        <h2 className="text-2xl font-bold text-white mb-2">{item.name}</h2>
                        <p className="text-gray-400 mb-4">{item.description}</p>

                        {/* Lógica de seleção de tamanho (exemplo) */}
                        {item.sizes && (
                            <div className="mb-4">
                                <label className="text-white mb-2 block">Tamanho:</label>
                                <select
                                    value={size}
                                    onChange={(e) => setSize(e.target.value)}
                                    className="w-full bg-gray-700 text-white p-2 rounded"
                                >
                                    {Object.keys(item.sizes).map(sizeKey => (
                                        <option key={sizeKey} value={sizeKey}>{sizeKey.toUpperCase()} - R$ {item.sizes![sizeKey as keyof typeof item.sizes]?.toFixed(2)}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3 bg-gray-700 rounded-full">
                                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="px-3 py-2 text-white rounded-full hover:bg-gray-600 transition">-</button>
                                <span className="font-bold text-lg text-white">{quantity}</span>
                                <button onClick={() => setQuantity(q => q + 1)} className="px-3 py-2 text-white rounded-full hover:bg-gray-600 transition">+</button>
                            </div>
                        </div>

                        <button
                            onClick={handleAddToCartClick} // Chama a nova função
                            className="w-full bg-yellow-500 text-gray-900 font-bold py-3 rounded-lg hover:bg-yellow-400 transition-colors text-center"
                        >
                            Adicionar ao Carrinho
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ItemModal;