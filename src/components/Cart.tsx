'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AddressModal from './AddressModal';
import { MenuItem } from '../types/menu';
import { CartItem } from '../types/cart';
import { menuItems } from '../data/menu';
import { calculatePizzaPrice } from '../utils/priceCalculator';

interface CartProps {
    items: CartItem[];
    onUpdateQuantity: (itemId: string, quantity: number) => void;
    onRemoveItem: (itemId: string) => void;
    onCheckout: (orderId: string) => void;
    onClose: () => void;
}

const cartVariants = {
    hidden: { x: '100%' },
    visible: {
        x: 0,
        transition: {
            type: "spring",
            damping: 25,
            stiffness: 300
        }
    },
    exit: {
        x: '100%',
        transition: {
            duration: 0.2
        }
    }
};

const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
};

const itemVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: {
        opacity: 1,
        x: 0,
        transition: {
            type: "spring",
            stiffness: 100
        }
    },
    exit: {
        opacity: 0,
        x: -20,
        transition: {
            duration: 0.2
        }
    }
};

const calculateItemPrice = (item: CartItem) => {
    if ((item.item.category === 'pizzas' || item.item.category === 'massas') && item.size && item.item.sizes) {
        const sizeKey = item.size as keyof typeof item.item.sizes;
        let price = 0;

        if (item.item.category === 'pizzas') {
        // Se for pizza meio a meio, pega o preço mais alto dos dois sabores
        if (item.observation && item.observation.includes('Meio a meio:')) {
            const [sabor1, sabor2] = item.observation.split('Meio a meio:')[1].split('/').map(s => s.trim());
            const pizzas = menuItems.filter((p: MenuItem) => p.category === 'pizzas');
            const pizza1 = pizzas.find((p: MenuItem) => p.name === sabor1);
            const pizza2 = pizzas.find((p: MenuItem) => p.name === sabor2);

            if (pizza1 && pizza2) {
                const price1 = pizza1.sizes ? pizza1.sizes[sizeKey] || pizza1.price : pizza1.price;
                const price2 = pizza2.sizes ? pizza2.sizes[sizeKey] || pizza2.price : pizza2.price;
                price = Math.max(price1, price2);
            }
        } else {
            price = item.item.sizes[sizeKey] || item.item.price;
        }

        // Adiciona o preço da borda se houver
        if (item.border && item.item.borderOptions) {
            const borderPrice = sizeKey === 'G' ? 8.00 : 4.00;
            price += borderPrice;
        }

        // Adiciona o preço dos extras se houver
        if (item.extras && item.item.extraOptions) {
            item.extras.forEach(extra => {
                const extraPrice = item.item.extraOptions![extra];
                if (extraPrice) {
                    price += extraPrice;
                }
            });
            }
        } else {
            // Para massas, apenas pega o preço do tamanho
            price = item.item.sizes[sizeKey] || item.item.price;
        }

        return price * item.quantity;
    }
    return item.item.price * item.quantity;
};

const calculateUnitPrice = (item: CartItem) => {
    if ((item.item.category === 'pizzas' || item.item.category === 'massas') && item.size && item.item.sizes) {
        const sizeKey = item.size as keyof typeof item.item.sizes;
        let price = 0;

        if (item.item.category === 'pizzas') {
        // Se for pizza meio a meio, pega o preço mais alto dos dois sabores
        if (item.observation && item.observation.includes('Meio a meio:')) {
            const [sabor1, sabor2] = item.observation.split('Meio a meio:')[1].split('/').map(s => s.trim());
            const pizzas = menuItems.filter((p: MenuItem) => p.category === 'pizzas');
            const pizza1 = pizzas.find((p: MenuItem) => p.name === sabor1);
            const pizza2 = pizzas.find((p: MenuItem) => p.name === sabor2);

            if (pizza1 && pizza2) {
                const price1 = pizza1.sizes ? pizza1.sizes[sizeKey] || pizza1.price : pizza1.price;
                const price2 = pizza2.sizes ? pizza2.sizes[sizeKey] || pizza2.price : pizza2.price;
                price = Math.max(price1, price2);
            }
        } else {
            price = item.item.sizes[sizeKey] || item.item.price;
        }

        // Adiciona o preço da borda se houver
        if (item.border && item.item.borderOptions) {
            const borderPrice = sizeKey === 'G' ? 8.00 : 4.00;
            price += borderPrice;
        }

        // Adiciona o preço dos extras se houver
        if (item.extras && item.item.extraOptions) {
            item.extras.forEach(extra => {
                const extraPrice = item.item.extraOptions![extra];
                if (extraPrice) {
                    price += extraPrice;
                }
            });
            }
        } else {
            // Para massas, apenas pega o preço do tamanho
            price = item.item.sizes[sizeKey] || item.item.price;
        }

        return price;
    }
    return item.item.price;
};

export default function Cart({ items, onUpdateQuantity, onRemoveItem, onCheckout, onClose }: CartProps) {
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [address, setAddress] = useState({
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        referencePoint: ''
    });

    const [selectedNeighborhood, setSelectedNeighborhood] = useState('');

    const [cliente, setCliente] = useState({
        nome: '',
        telefone: ''
    });

    const [formaPagamento, setFormaPagamento] = useState('');
    const [observacoes, setObservacoes] = useState('');
    const [troco, setTroco] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [deliveryFees, setDeliveryFees] = useState<{ neighborhood: string; fee: number }[]>([
        { neighborhood: 'Centro', fee: 5.00 },
        { neighborhood: 'Bairro', fee: 8.00 }
    ]);
    const [tipoEntrega, setTipoEntrega] = useState<'entrega' | 'retirada'>('entrega');

    useEffect(() => {
        // Buscar taxas de entrega do banco
        async function fetchDeliveryFees() {
            try {
                const res = await fetch('/api/settings');
                const data = await res.json();
                if (data.success && data.data) {
                    setDeliveryFees(data.data.deliveryFees || []);
                }
            } catch (err) {
                console.error('Erro ao carregar taxas de entrega:', err);
            }
        }
        fetchDeliveryFees();
    }, []);

    useEffect(() => {
        // Carregar dados do endereço do localStorage
        const savedNeighborhood = localStorage.getItem('customerNeighborhood');
        const savedStreet = localStorage.getItem('customerStreet');
        const savedNumber = localStorage.getItem('customerNumber');
        const savedComplement = localStorage.getItem('customerComplement');
        const savedReferencePoint = localStorage.getItem('customerReferencePoint');

        if (savedNeighborhood) {
            setAddress(prev => ({
                ...prev,
                neighborhood: savedNeighborhood,
                street: savedStreet || '',
                number: savedNumber || '',
                complement: savedComplement || '',
                referencePoint: savedReferencePoint || ''
            }));
        }
    }, []);

    const calculateDeliveryFee = (neighborhood: string) => {
        if (tipoEntrega === 'retirada') return 0;

        const deliveryFee = deliveryFees.find(fee => fee.neighborhood === neighborhood);
        return deliveryFee ? deliveryFee.fee : 0;
    };

    const subtotal = items.reduce((total, item) => total + calculateItemPrice(item), 0);
    const deliveryFee = calculateDeliveryFee(address.neighborhood);
    const total = subtotal + deliveryFee;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Salvar o telefone do cliente no localStorage
            localStorage.setItem('customerPhone', cliente.telefone);
            localStorage.setItem('customerName', cliente.nome);
            localStorage.setItem('customerTroco', troco);

            const pedido = {
                itens: items.map(item => ({
                    nome: item.item.name,
                    quantidade: item.quantity,
                    preco: calculateUnitPrice(item),
                    observacao: item.observation,
                    size: item.size,
                    border: item.border,
                    extras: item.extras
                })),
                total,
                tipoEntrega,
                endereco: tipoEntrega === 'entrega' ? {
                    address,
                    deliveryFee: calculateDeliveryFee(address.neighborhood),
                    estimatedTime: '30-45 minutos'
                } : undefined,
                cliente,
                observacoes,
                formaPagamento,
                troco: formaPagamento === 'dinheiro' ? troco : undefined
            };

            const response = await fetch('/api/pedidos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(pedido),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Erro ao processar pedido');
            }

            onCheckout(data.orderId);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao processar pedido');
        } finally {
            setLoading(false);
        }
    };

    const handleAddressSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Salvar o bairro no localStorage
        localStorage.setItem('customerNeighborhood', address.neighborhood);
        localStorage.setItem('customerStreet', address.street);
        localStorage.setItem('customerNumber', address.number);
        localStorage.setItem('customerComplement', address.complement || '');
        localStorage.setItem('customerReferencePoint', address.referencePoint);
        setShowAddressForm(false);
    };

    useEffect(() => {
        document.body.classList.add('overflow-hidden');
        return () => document.body.classList.remove('overflow-hidden');
    }, []);

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50 p-2 sm:p-4 overflow-y-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <motion.div
                    className="bg-gray-900 rounded-xl shadow-xl p-8 max-w-md w-full mx-4 text-gray-200 border border-yellow-500 relative max-h-[80vh] overflow-y-auto overflow-x-hidden"
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                    <button
                        onClick={onClose}
                        className="absolute top-2 right-2 text-gray-400 hover:text-white"
                    >
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-white">Carrinho</h2>

                    {items.length === 0 ? (
                        <p className="text-gray-300 text-center py-4">Seu carrinho está vazio</p>
                    ) : (
                        <>
                            <div className="space-y-3 sm:space-y-4 max-h-[25vh] sm:max-h-[30vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-red-600 scrollbar-track-gray-800">
                                {items.map((item, index) => (
                                    <motion.div
                                        key={index}
                                        className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 p-3 sm:p-4 bg-gray-800 rounded-lg"
                                        variants={itemVariants}
                                        initial="hidden"
                                        animate="visible"
                                        exit="exit"
                                    >
                                        <div className="flex-1 w-full">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-gray-200 text-sm sm:text-base">{item.item.name}</h3>
                                                    {(item.item.category === 'pizzas' || item.item.category === 'massas') && (
                                                        <div className="text-xs sm:text-sm text-gray-400">
                                                            {item.size && <span>Tamanho: {item.size}</span>}
                                                            {item.item.category === 'pizzas' && item.border && <span> • Borda: {item.border}</span>}
                                                            {item.item.category === 'pizzas' && item.extras && item.extras.length > 0 && (
                                                                <span> • Extras: {item.extras.join(', ')}</span>
                                                            )}
                                                        </div>
                                                    )}
                                                    {item.observation && (
                                                        <p className="text-xs sm:text-sm text-gray-400">Obs: {item.observation}</p>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs sm:text-sm text-gray-400">
                                                        R$ {calculateUnitPrice(item).toFixed(2)} un.
                                                    </p>
                                                    <p className="font-semibold text-gray-200 text-sm sm:text-base">
                                                        R$ {calculateItemPrice(item).toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center mt-2">
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => onUpdateQuantity(item.item._id, Math.max(1, item.quantity - 1))}
                                                        className="text-gray-400 hover:text-white text-sm sm:text-base"
                                                    >
                                                        -
                                                    </button>
                                                    <span className="text-gray-200 text-sm sm:text-base">{item.quantity}</span>
                                                    <button
                                                        onClick={() => onUpdateQuantity(item.item._id, item.quantity + 1)}
                                                        className="text-gray-400 hover:text-white text-sm sm:text-base"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => onRemoveItem(item.item._id)}
                                                    className="text-gray-400 hover:text-red-500 text-xs sm:text-sm"
                                                >
                                                    Remover
                                                </motion.button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-800">
                                <div className="flex justify-between text-base sm:text-lg font-semibold text-white">
                                    <span>Total:</span>
                                    <span>R$ {total.toFixed(2)}</span>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="mt-4 sm:mt-6 space-y-3 sm:space-y-4 max-h-[35vh] sm:max-h-[40vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-red-600 scrollbar-track-gray-800">
                                <div>
                                    <label htmlFor="nome" className="block text-xs sm:text-sm font-medium text-gray-200">Nome</label>
                                    <input
                                        type="text"
                                        id="nome"
                                        value={cliente.nome}
                                        onChange={(e) => setCliente({ ...cliente, nome: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-2 border-yellow-500 bg-gray-800 text-white text-sm sm:text-base shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="telefone" className="block text-xs sm:text-sm font-medium text-gray-200">Telefone</label>
                                    <input
                                        type="tel"
                                        id="telefone"
                                        value={cliente.telefone}
                                        onChange={(e) => setCliente({ ...cliente, telefone: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-2 border-yellow-500 bg-gray-800 text-white text-sm sm:text-base shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-200">Tipo de Entrega</label>
                                    <div className="mt-2 space-x-4">
                                        <label className="inline-flex items-center">
                                            <input
                                                type="radio"
                                                value="entrega"
                                                checked={tipoEntrega === 'entrega'}
                                                onChange={(e) => {
                                                    setTipoEntrega(e.target.value as 'entrega');
                                                    localStorage.setItem('tipoEntrega', e.target.value);
                                                }}
                                                className="form-radio text-red-600"
                                            />
                                            <span className="ml-2 text-white text-sm sm:text-base">Entrega</span>
                                        </label>
                                        <label className="inline-flex items-center">
                                            <input
                                                type="radio"
                                                value="retirada"
                                                checked={tipoEntrega === 'retirada'}
                                                onChange={(e) => {
                                                    setTipoEntrega(e.target.value as 'retirada');
                                                    localStorage.setItem('tipoEntrega', e.target.value);
                                                }}
                                                className="form-radio text-red-600"
                                            />
                                            <span className="ml-2 text-white text-sm sm:text-base">Retirada no Local</span>
                                        </label>
                                    </div>
                                </div>

                                {tipoEntrega === 'entrega' && (
                                    <>
                                        <div className="mb-4 p-3 bg-gray-800 rounded-lg">
                                            <p className="text-sm text-gray-300">
                                                Taxas de entrega:
                                                {deliveryFees.map((fee, index) => (
                                                    <span key={index} className="block">
                                                        • {fee.neighborhood}: R$ {fee.fee.toFixed(2)}
                                                    </span>
                                                ))}
                                            </p>
                                        </div>
                                        <div className="mb-4">
                                            <label htmlFor="neighborhood" className="block text-xs sm:text-sm font-medium text-gray-200">Bairro</label>
                                            <select
                                                id="neighborhood"
                                                value={selectedNeighborhood}
                                                onChange={(e) => {
                                                    setSelectedNeighborhood(e.target.value);
                                                    setAddress({ ...address, neighborhood: e.target.value });
                                                    localStorage.setItem('customerNeighborhood', e.target.value);
                                                }}
                                                className="mt-1 block w-full rounded-md border-2 border-yellow-500 bg-gray-800 text-white text-sm sm:text-base shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
                                                required={tipoEntrega === 'entrega'}
                                            >
                                                <option value="">Selecione o bairro</option>
                                                {deliveryFees.map((fee, index) => (
                                                    <option key={index} value={fee.neighborhood}>
                                                        {fee.neighborhood} - R$ {fee.fee.toFixed(2)}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label htmlFor="street" className="block text-xs sm:text-sm font-medium text-gray-200">Rua</label>
                                            <input
                                                type="text"
                                                id="street"
                                                value={address.street}
                                                onChange={(e) => {
                                                    setAddress({ ...address, street: e.target.value });
                                                    localStorage.setItem('customerStreet', e.target.value);
                                                }}
                                                className="mt-1 block w-full rounded-md border-2 border-yellow-500 bg-gray-800 text-white text-sm sm:text-base shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
                                                required={tipoEntrega === 'entrega'}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label htmlFor="number" className="block text-xs sm:text-sm font-medium text-gray-200">Número</label>
                                                <input
                                                    type="text"
                                                    id="number"
                                                    value={address.number}
                                                    onChange={(e) => {
                                                        setAddress({ ...address, number: e.target.value });
                                                        localStorage.setItem('customerNumber', e.target.value);
                                                    }}
                                                    className="mt-1 block w-full rounded-md border-2 border-yellow-500 bg-gray-800 text-white text-sm sm:text-base shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
                                                    required={tipoEntrega === 'entrega'}
                                                />
                                            </div>

                                            <div>
                                                <label htmlFor="complement" className="block text-xs sm:text-sm font-medium text-gray-200">Complemento</label>
                                                <input
                                                    type="text"
                                                    id="complement"
                                                    value={address.complement}
                                                    onChange={(e) => {
                                                        setAddress({ ...address, complement: e.target.value });
                                                        localStorage.setItem('customerComplement', e.target.value);
                                                    }}
                                                    className="mt-1 block w-full rounded-md border-2 border-yellow-500 bg-gray-800 text-white text-sm sm:text-base shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label htmlFor="referencePoint" className="block text-xs sm:text-sm font-medium text-gray-200">Ponto de Referência</label>
                                                <input
                                                    type="text"
                                                    id="referencePoint"
                                                    value={address.referencePoint}
                                                    onChange={(e) => {
                                                        setAddress({ ...address, referencePoint: e.target.value });
                                                        localStorage.setItem('customerReferencePoint', e.target.value);
                                                    }}
                                                    className="mt-1 block w-full rounded-md border-2 border-yellow-500 bg-gray-800 text-white text-sm sm:text-base shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div>
                                    <label htmlFor="formaPagamento" className="block text-xs sm:text-sm font-medium text-gray-200">Forma de Pagamento</label>
                                    <select
                                        id="formaPagamento"
                                        value={formaPagamento}
                                        onChange={(e) => setFormaPagamento(e.target.value)}
                                        className="mt-1 block w-full rounded-md border-2 border-yellow-500 bg-gray-800 text-white text-sm sm:text-base shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
                                        required
                                    >
                                        <option value="">Selecione a forma de pagamento</option>
                                        <option value="dinheiro">Dinheiro</option>
                                        <option value="pix">PIX</option>
                                        <option value="cartao">Cartão</option>
                                    </select>
                                </div>

                                {formaPagamento === 'dinheiro' && (
                                    <div className="mb-4">
                                        <label htmlFor="troco" className="block text-xs sm:text-sm font-medium text-gray-200">Troco para quanto?</label>
                                        <input
                                            type="text"
                                            id="troco"
                                            value={troco}
                                            onChange={(e) => setTroco(e.target.value)}
                                            placeholder="Ex: 50,00"
                                            className="mt-1 block w-full rounded-md border-2 border-yellow-500 bg-gray-800 text-white text-sm sm:text-base shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
                                            required={formaPagamento === 'dinheiro'}
                                        />
                                    </div>
                                )}

                                <div>
                                    <label htmlFor="observacoes" className="block text-xs sm:text-sm font-medium text-gray-200">Observações</label>
                                    <textarea
                                        id="observacoes"
                                        value={observacoes}
                                        onChange={(e) => setObservacoes(e.target.value)}
                                        className="mt-1 block w-full rounded-md border-2 border-yellow-500 bg-gray-800 text-white text-sm sm:text-base shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
                                        rows={2}
                                    />
                                </div>

                                {error && (
                                    <div className="text-red-500 text-sm mt-2">
                                        {error}
                                    </div>
                                )}

                                <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-2">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="w-full sm:flex-1 px-4 py-2 bg-gray-700 text-white text-sm sm:text-base rounded hover:bg-gray-600 transition-colors"
                                    >
                                        Continuar Comprando
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading || items.length === 0}
                                        className="w-full bg-yellow-500 text-gray-900 font-bold py-3 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center gap-2 hover:bg-yellow-400 disabled:bg-gray-600 disabled:cursor-not-allowed"
                                    >
                                        {loading ? (
                                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0v4c3.314 0 6.363 1.178 8.807 3.193z"></path>
                                            </svg>
                                        ) : 'Finalizar Pedido'}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
} 