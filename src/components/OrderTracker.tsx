'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaTimes, FaClock, FaCheckCircle, FaTruck, FaUtensils } from 'react-icons/fa';

interface OrderStatus {
    _id: string;
    status: string;
    data: string;
    cliente: {
        nome: string;
        telefone: string;
    };
    itens: Array<{
        nome: string;
        quantidade: number;
        preco: number;
    }>;
    total: number;
    observacoes?: string;
    endereco?: {
        rua: string;
        numero: string;
        bairro: string;
        complemento?: string;
        pontoReferencia?: string;
    };
    tipoEntrega: 'entrega' | 'retirada';
    formaPagamento: string;
}

interface OrderTrackerProps {
    onClose: () => void;
}

const statusConfig = {
    'pendente': {
        label: 'Pedido Pendente',
        icon: FaClock,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-500/20',
        description: 'Seu pedido foi recebido e está sendo preparado'
    },
    'preparando': {
        label: 'Em Preparação',
        icon: FaUtensils,
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/20',
        description: 'Seu pedido está sendo preparado na cozinha'
    },
    'pronto': {
        label: 'Pedido Pronto',
        icon: FaCheckCircle,
        color: 'text-green-500',
        bgColor: 'bg-green-500/20',
        description: 'Seu pedido está pronto para entrega/retirada'
    },
    'entregando': {
        label: 'Em Entrega',
        icon: FaTruck,
        color: 'text-purple-500',
        bgColor: 'bg-purple-500/20',
        description: 'Seu pedido está a caminho'
    },
    'entregue': {
        label: 'Entregue',
        icon: FaCheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-600/20',
        description: 'Pedido entregue com sucesso!'
    },
    'cancelado': {
        label: 'Cancelado',
        icon: FaTimes,
        color: 'text-red-500',
        bgColor: 'bg-red-500/20',
        description: 'Pedido foi cancelado'
    }
};

export default function OrderTracker({ onClose }: OrderTrackerProps) {
    const [searchType, setSearchType] = useState<'id' | 'phone'>('phone');
    const [searchValue, setSearchValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [order, setOrder] = useState<OrderStatus | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        document.body.classList.add('overflow-hidden');
        return () => document.body.classList.remove('overflow-hidden');
    }, []);

    const handleSearch = async () => {
        if (!searchValue.trim()) {
            setError('Por favor, insira um valor para busca');
            return;
        }

        setLoading(true);
        setError(null);
        setOrder(null);

        try {
            const url = searchType === 'id'
                ? `/api/pedidos?id=${searchValue.trim()}`
                : `/api/pedidos?telefone=${searchValue.trim()}`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.success && data.data) {
                if (Array.isArray(data.data)) {
                    // Se retornou array, pegar o pedido mais recente
                    setOrder(data.data[0]);
                } else {
                    setOrder(data.data);
                }
            } else {
                setError('Pedido não encontrado. Verifique os dados informados.');
            }
        } catch (err) {
            setError('Erro ao buscar pedido. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusInfo = (status: string) => {
        return statusConfig[status as keyof typeof statusConfig] || statusConfig.pendente;
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 30 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="bg-gray-900 rounded-2xl shadow-2xl border border-yellow-500/30 overflow-hidden max-h-[90vh] overflow-y-auto overflow-x-hidden w-full max-w-md mx-2"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="relative h-auto min-h-[96px] bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 flex flex-col items-center justify-center px-4 pt-6 pb-4 sm:pt-8 sm:pb-6">
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent rounded-t-2xl"></div>
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={onClose}
                            className="absolute top-2 right-2 w-6 h-6 bg-gray-900/80 backdrop-blur-sm rounded-full flex items-center justify-center text-yellow-500 hover:text-yellow-400 transition-colors z-20"
                            aria-label="Fechar"
                        >
                            <span className="text-xl font-bold leading-none">-</span>
                        </motion.button>
                        <div className="relative z-10 w-full flex flex-col items-center justify-center mt-8 sm:mt-10">
                            <h2 className="text-2xl font-bold text-yellow-500 mb-2 text-center">Acompanhar Pedido</h2>
                            <p className="text-gray-300 text-sm text-center">Digite seu telefone ou ID do pedido</p>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 sm:p-6">
                        {/* Search Form */}
                        <div className="space-y-4 mb-6">
                            <div className="flex flex-col xs:flex-row gap-2">
                                <button
                                    onClick={() => setSearchType('phone')}
                                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${searchType === 'phone'
                                            ? 'bg-yellow-500 text-gray-900'
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        }`}
                                >
                                    Telefone
                                </button>
                                <button
                                    onClick={() => setSearchType('id')}
                                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${searchType === 'id'
                                            ? 'bg-yellow-500 text-gray-900'
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        }`}
                                >
                                    ID do Pedido
                                </button>
                            </div>
                            <div className="flex flex-col xs:flex-row gap-2">
                                <input
                                    type="text"
                                    value={searchValue}
                                    onChange={(e) => setSearchValue(e.target.value)}
                                    placeholder={searchType === 'phone' ? 'Digite seu telefone' : 'Digite o ID do pedido'}
                                    className="flex-1 p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 min-w-0"
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                />
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleSearch}
                                    disabled={loading}
                                    className="bg-yellow-500 text-gray-900 p-3 rounded-lg font-bold hover:bg-yellow-400 transition-colors disabled:bg-gray-600 min-w-[48px]"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <FaSearch />
                                    )}
                                </motion.button>
                            </div>
                            {error && (
                                <div className="text-red-500 text-sm bg-red-500/10 p-3 rounded-lg">
                                    {error}
                                </div>
                            )}
                        </div>

                        {/* Order Status */}
                        {order && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-4"
                            >
                                {/* Order Info */}
                                <div className="bg-gray-800 rounded-lg p-4">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="text-white font-semibold">Pedido #{order._id.slice(-6)}</h3>
                                            <p className="text-gray-400 text-sm">{formatDate(order.data)}</p>
                                        </div>
                                        <span className="text-yellow-500 font-bold">R$ {order.total.toFixed(2)}</span>
                                    </div>

                                    {/* Customer Info */}
                                    <div className="mb-3">
                                        <p className="text-white font-medium">{order.cliente.nome}</p>
                                        <p className="text-gray-400 text-sm">{order.cliente.telefone}</p>
                                    </div>

                                    {/* Delivery Info */}
                                    {order.tipoEntrega === 'entrega' && order.endereco && (
                                        <div className="mb-3 text-sm">
                                            <p className="text-gray-300">
                                                {order.endereco.rua}, {order.endereco.numero}
                                                {order.endereco.complemento && ` - ${order.endereco.complemento}`}
                                            </p>
                                            <p className="text-gray-400">{order.endereco.bairro}</p>
                                        </div>
                                    )}

                                    {/* Items */}
                                    <div className="space-y-2">
                                        {order.itens.map((item, index) => (
                                            <div key={index} className="flex justify-between text-sm">
                                                <span className="text-gray-300">
                                                    {item.quantidade}x {item.nome}
                                                </span>
                                                <span className="text-gray-400">
                                                    R$ {(item.preco * item.quantidade).toFixed(2)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {order.observacoes && (
                                        <div className="mt-3 p-2 bg-gray-700 rounded text-sm">
                                            <p className="text-gray-300"><strong>Observações:</strong> {order.observacoes}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Status */}
                                <div className="bg-gray-800 rounded-lg p-4">
                                    <div className="flex items-center gap-3 mb-3">
                                        {(() => {
                                            const statusInfo = getStatusInfo(order.status);
                                            const Icon = statusInfo.icon;
                                            return (
                                                <div className={`p-2 rounded-full ${statusInfo.bgColor}`}>
                                                    <Icon className={`text-xl ${statusInfo.color}`} />
                                                </div>
                                            );
                                        })()}
                                        <div>
                                            <h4 className="text-white font-semibold">
                                                {getStatusInfo(order.status).label}
                                            </h4>
                                            <p className="text-gray-400 text-sm">
                                                {getStatusInfo(order.status).description}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
} 