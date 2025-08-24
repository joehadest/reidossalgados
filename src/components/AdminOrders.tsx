// src/components/AdminOrders.tsx

'use client';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaWhatsapp, FaPrint, FaCheckCircle, FaTimesCircle, FaClock, FaMotorcycle, FaShoppingBag, FaUtensils, FaUser, FaMapMarkerAlt, FaPhone, FaMoneyBillWave, FaTrash } from 'react-icons/fa';
import PrintButton from './PrintButton';
import { Pedido } from '../types/cart'; // Usando a tipagem correta

type PedidoStatus = 'pendente' | 'preparando' | 'pronto' | 'em_entrega' | 'entregue' | 'cancelado';

export default function AdminOrders() {
    const [pedidos, setPedidos] = useState<Pedido[]>([]);
    const [pedidoSelecionado, setPedidoSelecionado] = useState<Pedido | null>(null);
    const [loading, setLoading] = useState(true);
    const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
    const [deletingOrder, setDeletingOrder] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [orderToDelete, setOrderToDelete] = useState<Pedido | null>(null);

    useEffect(() => {
        const fetchPedidos = async () => {
            try {
                const res = await fetch('/api/pedidos');
                const data = await res.json();
                if (data.success) {
                    const sortedPedidos = data.data.sort((a: Pedido, b: Pedido) => new Date(b.data).getTime() - new Date(a.data).getTime());
                    setPedidos(sortedPedidos);
                }
            } catch (error) { console.error("Erro ao buscar pedidos:", error); }
            finally { setLoading(false); }
        };
        fetchPedidos();
        const interval = setInterval(fetchPedidos, 30000); // Atualiza a cada 30 segundos
        return () => clearInterval(interval);
    }, []);

    const updateOrderStatus = async (orderId: string, newStatus: PedidoStatus) => {
        setUpdatingStatus(orderId);
        try {
            const res = await fetch(`/api/pedidos?id=${orderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            const data = await res.json();
            if (data.success) {
                setPedidos(pedidos.map(order => order._id === orderId ? { ...order, status: newStatus } : order));
                if (pedidoSelecionado?._id === orderId) {
                    setPedidoSelecionado({ ...pedidoSelecionado, status: newStatus });
                }
            }
        } catch (err) { console.error('Erro ao atualizar status:', err); }
        finally { setUpdatingStatus(null); }
    };

    const deleteOrder = async (orderId: string) => {
        setDeletingOrder(orderId);
        try {
            const res = await fetch(`/api/pedidos/${orderId}`, {
                method: 'DELETE',
            });
            const data = await res.json();
            if (data.success) {
                // Remove o pedido da lista
                setPedidos(pedidos.filter(order => order._id !== orderId));
                
                // Se o pedido selecionado foi deletado, limpa a seleção
                if (pedidoSelecionado?._id === orderId) {
                    setPedidoSelecionado(null);
                }
                
                setShowDeleteConfirm(false);
                setOrderToDelete(null);
            } else {
                alert('Erro ao deletar pedido: ' + (data.message || 'Erro desconhecido'));
            }
        } catch (err) { 
            console.error('Erro ao deletar pedido:', err);
            alert('Erro ao deletar pedido. Tente novamente.');
        }
        finally { 
            setDeletingOrder(null); 
        }
    };

    const handleDeleteClick = (pedido: Pedido) => {
        setOrderToDelete(pedido);
        setShowDeleteConfirm(true);
    };

    const getStatusText = (status: PedidoStatus) => ({ pendente: 'Pendente', preparando: 'Preparando', pronto: 'Pronto', em_entrega: 'Em Entrega', entregue: 'Entregue', cancelado: 'Cancelado' }[status]);
    const getStatusColor = (status: PedidoStatus) => ({ pendente: 'bg-yellow-500', preparando: 'bg-blue-500', pronto: 'bg-green-500', em_entrega: 'bg-purple-500', entregue: 'bg-gray-700', cancelado: 'bg-red-600' }[status]);

    const getNextStatus = (currentStatus: PedidoStatus): PedidoStatus | null => {
        const sequence: PedidoStatus[] = ['pendente', 'preparando', 'pronto', 'em_entrega', 'entregue'];
        const currentIndex = sequence.indexOf(currentStatus);
        if (currentIndex > -1 && currentIndex < sequence.length - 1) {
            return sequence[currentIndex + 1];
        }
        return null;
    };

    const calcularTotal = (pedido: Pedido) => {
        const subtotal = pedido.itens.reduce((acc, item) => acc + item.preco * item.quantidade, 0);
        return subtotal + (pedido.endereco?.deliveryFee || 0);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('pt-BR');
    };

    const formatAddress = (endereco: any) => {
        if (!endereco) return 'Retirada no local';
        
        console.log('Endereço recebido:', endereco);
        
        // Se endereco.address existe e é um objeto
        if (endereco.address && typeof endereco.address === 'object') {
            const addr = endereco.address;
            if (addr.street && addr.number && addr.neighborhood) {
                return `${addr.street}, ${addr.number}${addr.complement ? ` - ${addr.complement}` : ''}, ${addr.neighborhood}`;
            }
        }
        
        // Se endereco.address é uma string (formato antigo)
        if (endereco.address && typeof endereco.address === 'string') {
            return endereco.address;
        }
        
        // Se endereco tem os campos diretamente
        if (endereco.street && endereco.number && endereco.neighborhood) {
            return `${endereco.street}, ${endereco.number}${endereco.complement ? ` - ${endereco.complement}` : ''}, ${endereco.neighborhood}`;
        }
        
        // Se endereco é uma string
        if (typeof endereco === 'string') {
            return endereco;
        }
        
        console.log('Estrutura de endereço não reconhecida:', endereco);
        return 'Endereço não especificado';
    };

    if (loading) return <div className="text-center py-8 text-white">Carregando pedidos...</div>;

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold text-white mb-4">Painel de Pedidos</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 bg-gray-800 p-4 rounded-lg max-h-[80vh] overflow-y-auto">
                    <h3 className="text-lg font-semibold text-white mb-3">Fila de Pedidos</h3>
                    {pedidos.map(pedido => (
                        <div key={pedido._id} className={`p-3 rounded-lg mb-2 transition-colors ${pedidoSelecionado?._id === pedido._id ? 'bg-yellow-500/20' : 'hover:bg-gray-700'}`}>
                            <div 
                                onClick={() => setPedidoSelecionado(pedido)} 
                                className="cursor-pointer flex-1"
                            >
                                <p className="font-bold text-white">#{pedido._id.slice(-6)} - {pedido.cliente.nome}</p>
                                <p className="text-sm text-gray-300">{pedido.tipoEntrega === 'entrega' ? 'Entrega' : 'Retirada'}</p>
                                <span className={`text-xs px-2 py-1 rounded-full text-white ${getStatusColor(pedido.status)}`}>{getStatusText(pedido.status)}</span>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteClick(pedido);
                                }}
                                className="mt-2 text-red-400 hover:text-red-300 text-sm flex items-center gap-1"
                                title="Remover pedido"
                            >
                                <FaTrash className="text-xs" />
                                Remover
                            </button>
                        </div>
                    ))}
                </div>
                <div className="md:col-span-2 bg-gray-800 p-6 rounded-lg">
                    <AnimatePresence>
                        {pedidoSelecionado && (
                            <motion.div key={pedidoSelecionado._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xl font-bold text-white">Pedido #{pedidoSelecionado._id.slice(-6)}</h3>
                                    <div className="flex gap-2">
                                        <PrintButton orderId={pedidoSelecionado._id} />
                                        <button
                                            onClick={() => handleDeleteClick(pedidoSelecionado)}
                                            className="bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center gap-2 hover:bg-red-700"
                                            title="Remover pedido"
                                        >
                                            <FaTrash className="text-sm" />
                                            Remover
                                        </button>
                                    </div>
                                </div>

                                {/* Informações do Cliente */}
                                <div className="bg-gray-700 p-4 rounded-lg mb-4">
                                    <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                        <FaUser className="text-yellow-500" />
                                        Informações do Cliente
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-white font-medium">{pedidoSelecionado.cliente.nome}</p>
                                            <p className="text-gray-300 text-sm flex items-center gap-2">
                                                <FaPhone className="text-yellow-500" />
                                                {pedidoSelecionado.cliente.telefone}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-gray-300 text-sm flex items-center gap-2">
                                                <FaMapMarkerAlt className="text-yellow-500" />
                                                {formatAddress(pedidoSelecionado.endereco)}
                                            </p>
                                            <p className="text-gray-300 text-sm">
                                                {pedidoSelecionado.tipoEntrega === 'entrega' ? 'Entrega' : 'Retirada no local'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Informações do Pedido */}
                                <div className="bg-gray-700 p-4 rounded-lg mb-4">
                                    <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                        <FaShoppingBag className="text-yellow-500" />
                                        Detalhes do Pedido
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-gray-300">Data: {formatDate(pedidoSelecionado.data)}</p>
                                            <p className="text-gray-300">Forma de Pagamento: {pedidoSelecionado.formaPagamento}</p>
                                            {pedidoSelecionado.troco && (
                                                <p className="text-gray-300">Troco: R$ {pedidoSelecionado.troco}</p>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-gray-300">Status: <span className={`px-2 py-1 rounded-full text-white text-xs ${getStatusColor(pedidoSelecionado.status)}`}>{getStatusText(pedidoSelecionado.status)}</span></p>
                                            <p className="text-gray-300">Total: R$ {calcularTotal(pedidoSelecionado).toFixed(2)}</p>
                                            {pedidoSelecionado.observacoes && (
                                                <p className="text-gray-300">Observações: {pedidoSelecionado.observacoes}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Itens do Pedido */}
                                <div className="bg-gray-700 p-4 rounded-lg mb-4">
                                    <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                        <FaUtensils className="text-yellow-500" />
                                        Itens do Pedido
                                    </h4>
                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {pedidoSelecionado.itens.map((item, index) => (
                                            <div key={index} className="bg-gray-600 p-3 rounded">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <p className="font-bold text-white">{item.quantidade}x {item.nome}</p>
                                                        <p className="text-yellow-400 font-medium">R$ {(item.preco * item.quantidade).toFixed(2)}</p>
                                                    </div>
                                                </div>
                                                <div className="text-xs text-gray-300 mt-1">
                                                    {item.extras && item.extras.length > 0 && (
                                                        <p>Extras: {item.extras.join(', ')}</p>
                                                    )}
                                                    {item.observacao && (
                                                        <p>Obs: {item.observacao}</p>
                                                    )}
                                                    {item.size && (
                                                        <p>Tamanho: {item.size}</p>
                                                    )}
                                                    {item.border && (
                                                        <p>Borda: {item.border}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Botões de Ação */}
                                <div className="flex justify-end gap-2">
                                    {getNextStatus(pedidoSelecionado.status) && (
                                        <button
                                            onClick={() => updateOrderStatus(pedidoSelecionado._id, getNextStatus(pedidoSelecionado.status)!)}
                                            disabled={updatingStatus === pedidoSelecionado._id}
                                            className="bg-yellow-500 text-black font-bold py-2 px-4 rounded hover:bg-yellow-600 disabled:opacity-50"
                                        >
                                            {updatingStatus === pedidoSelecionado._id ? 'Atualizando...' : 'Avançar Status'}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => updateOrderStatus(pedidoSelecionado._id, 'cancelado')}
                                        className="bg-red-600 text-white font-bold py-2 px-4 rounded hover:bg-red-700"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Modal de Confirmação de Exclusão */}
            <AnimatePresence>
                {showDeleteConfirm && orderToDelete && (
                    <motion.div 
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div 
                            className="bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4"
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 50, opacity: 0 }}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <FaTrash className="text-red-500 text-xl" />
                                <h2 className="text-xl font-bold text-white">Confirmar Exclusão</h2>
                            </div>
                            
                            <p className="text-gray-300 mb-6">
                                Tem certeza que deseja remover o pedido <strong>#{orderToDelete._id.slice(-6)}</strong> de <strong>{orderToDelete.cliente.nome}</strong>?
                            </p>
                            
                            <p className="text-red-400 text-sm mb-6">
                                ⚠️ Esta ação não pode ser desfeita. O pedido será removido permanentemente do banco de dados.
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowDeleteConfirm(false);
                                        setOrderToDelete(null);
                                    }}
                                    className="flex-1 bg-gray-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-700"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => deleteOrder(orderToDelete._id)}
                                    disabled={deletingOrder === orderToDelete._id}
                                    className="flex-1 bg-red-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {deletingOrder === orderToDelete._id ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            Removendo...
                                        </>
                                    ) : (
                                        <>
                                            <FaTrash />
                                            Remover
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}