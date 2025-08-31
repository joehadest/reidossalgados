// src/components/AdminOrders.tsx

'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FaTrash, FaUser, FaMapMarkerAlt, FaMoneyBillWave, 
    FaStickyNote, FaBoxOpen, FaClock, FaUtensils, FaMotorcycle, 
    FaCheckCircle, FaTimesCircle, FaShoppingBag 
} from 'react-icons/fa';
import PrintButton from './PrintButton';
import { Pedido, Address } from '../types/cart';

type PedidoStatus = 'pendente' | 'preparando' | 'pronto' | 'em_entrega' | 'entregue' | 'cancelado';

export default function AdminOrders() {
    const [pedidos, setPedidos] = useState<Pedido[]>([]);
    const [pedidoSelecionado, setPedidoSelecionado] = useState<Pedido | null>(null);
    const [loading, setLoading] = useState(true);
    const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
    const [deletingOrder, setDeletingOrder] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [orderToDelete, setOrderToDelete] = useState<Pedido | null>(null);

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

    useEffect(() => {
        fetchPedidos();
        const interval = setInterval(fetchPedidos, 15000);
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
                await fetchPedidos();
                if (pedidoSelecionado?._id === orderId) {
                   setPedidoSelecionado(prev => prev ? { ...prev, status: newStatus } : null);
                }
            }
        } catch (err) { console.error('Erro ao atualizar status:', err); }
        finally { setUpdatingStatus(null); }
    };
    
    const deleteOrder = async (orderId: string) => {
        setDeletingOrder(orderId);
        try {
            const res = await fetch(`/api/pedidos/${orderId}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                setPedidos(pedidos.filter(order => order._id !== orderId));
                setPedidoSelecionado(null);
                setShowDeleteConfirm(false);
                setOrderToDelete(null);
            } else {
                alert('Erro ao deletar pedido: ' + (data.message || 'Erro desconhecido'));
            }
        } catch (err) { 
            console.error('Erro ao deletar pedido:', err);
            alert('Erro ao deletar pedido. Tente novamente.');
        }
        finally { setDeletingOrder(null); }
    };

    const handleDeleteClick = (pedido: Pedido) => {
        setOrderToDelete(pedido);
        setShowDeleteConfirm(true);
    };

    const StatusInfo: Record<PedidoStatus, { text: string; color: string; icon: React.ElementType }> = {
        pendente: { text: 'Pendente', color: 'bg-yellow-500', icon: FaClock },
        preparando: { text: 'Preparando', color: 'bg-blue-500', icon: FaUtensils },
        pronto: { text: 'Pronto', color: 'bg-green-500', icon: FaShoppingBag },
        em_entrega: { text: 'Em Entrega', color: 'bg-purple-500', icon: FaMotorcycle },
        entregue: { text: 'Entregue', color: 'bg-gray-700', icon: FaCheckCircle },
        cancelado: { text: 'Cancelado', color: 'bg-red-600', icon: FaTimesCircle },
    };

    const getNextStatus = (currentStatus: PedidoStatus): PedidoStatus | null => {
        const sequence: PedidoStatus[] = ['pendente', 'preparando', 'pronto', 'em_entrega', 'entregue'];
        const currentIndex = sequence.indexOf(currentStatus);
        if (currentIndex > -1 && currentIndex < sequence.length - 1) {
            return sequence[currentIndex + 1];
        }
        return null;
    };
    
    const formatDate = (dateString: string) => new Date(dateString).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const getAddressObject = (endereco: any): Address | null => {
        if (!endereco) return null;
        if ('address' in endereco && typeof endereco.address === 'object') return endereco.address;
        return endereco as Address;
    };

    if (loading) return <div className="text-center py-8 text-white">Carregando pedidos...</div>;
    
    const addr = getAddressObject(pedidoSelecionado?.endereco);

    return (
        <div className="p-1 sm:p-4 min-h-screen">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Painel de Pedidos</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Coluna da Fila de Pedidos */}
                <div className="lg:col-span-1 bg-gray-800 p-2 sm:p-4 rounded-lg max-h-[50vh] sm:max-h-[60vh] overflow-y-auto overflow-x-hidden border border-yellow-500/20 scrollbar-thin scrollbar-thumb-yellow-500 scrollbar-track-gray-800">
                    <h3 className="text-lg font-semibold text-white mb-3 text-center sm:text-left">Fila de Pedidos</h3>
                    {pedidos.length > 0 ? pedidos.map(pedido => {
                        const status = StatusInfo[pedido.status] || StatusInfo.pendente;
                        return (
                        <div key={pedido._id} onClick={() => setPedidoSelecionado(pedido)} className={`p-3 rounded-lg mb-2 transition-all duration-200 cursor-pointer ${pedidoSelecionado?._id === pedido._id ? 'bg-yellow-500/20 border-l-4 border-yellow-500' : 'bg-gray-900/50 hover:bg-gray-700/80'}`}>
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <p className="font-bold text-white truncate">#{pedido._id.slice(-6)} - {pedido.cliente.nome}</p>
                                    <p className="text-xs text-gray-400">{formatDate(pedido.data)}</p>
                                </div>
                                <div className={`text-xs px-2 py-1 rounded-full text-white font-semibold flex items-center gap-1 ${status.color}`}>
                                    <status.icon />
                                    <span>{status.text}</span>
                                </div>
                            </div>
                        </div>
                    )}) : <p className="text-gray-500 text-center">Nenhum pedido no momento.</p>}
                </div>

                {/* Coluna de Detalhes do Pedido */}
                <div className="lg:col-span-2 bg-gray-800 p-3 sm:p-6 rounded-lg border border-yellow-500/20 max-h-[70vh] sm:max-h-[80vh] overflow-y-auto scrollbar-thin scrollbar-thumb-yellow-500 scrollbar-track-gray-800">
                    <AnimatePresence>
                        {pedidoSelecionado ? (
                            <motion.div key={pedidoSelecionado._id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                                <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-2">
                                    <h3 className="text-lg sm:text-xl font-bold text-white">Detalhes do Pedido #{pedidoSelecionado._id.slice(-6)}</h3>
                                    <div className="flex gap-2 self-end sm:self-center">
                                        <PrintButton orderId={pedidoSelecionado._id} />
                                        <button onClick={() => handleDeleteClick(pedidoSelecionado)} className="bg-red-600 text-white font-medium py-2 px-3 rounded-lg flex items-center gap-2 hover:bg-red-700 text-sm">
                                            <FaTrash /> <span className="hidden sm:inline">Remover</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Informações do Cliente */}
                                    <div className="bg-gray-900/50 p-4 rounded-lg">
                                        <h4 className="font-semibold text-white mb-3 flex items-center gap-2"><FaUser className="text-yellow-500" /> Cliente</h4>
                                        <p className="text-white"><strong>Nome:</strong> {pedidoSelecionado.cliente.nome}</p>
                                        <p className="text-gray-300"><strong>Telefone:</strong> {pedidoSelecionado.cliente.telefone}</p>
                                    </div>

                                    {/* Informações de Entrega */}
                                    <div className="bg-gray-900/50 p-4 rounded-lg">
                                        <h4 className="font-semibold text-white mb-3 flex items-center gap-2"><FaMapMarkerAlt className="text-yellow-500" /> Entrega</h4>
                                        <p className="text-white"><strong>Tipo:</strong> {pedidoSelecionado.tipoEntrega === 'entrega' ? 'Entrega' : 'Retirada'}</p>
                                        {pedidoSelecionado.tipoEntrega === 'entrega' && addr && (
                                            <>
                                                <p className="text-gray-300"><strong>Bairro:</strong> {addr.neighborhood || 'Não informado'}</p>
                                                <p className="text-gray-300"><strong>Endereço:</strong> {`${addr.street}, ${addr.number}${addr.complement ? ` - ${addr.complement}` : ''}`}</p>
                                                {addr.referencePoint && <p className="text-gray-300"><strong>Ref:</strong> {addr.referencePoint}</p>}
                                            </>
                                        )}
                                    </div>

                                    {/* Informações de Pagamento */}
                                    <div className="bg-gray-900/50 p-4 rounded-lg">
                                        <h4 className="font-semibold text-white mb-3 flex items-center gap-2"><FaMoneyBillWave className="text-yellow-500" /> Pagamento</h4>
                                        <p className="text-white"><strong>Forma:</strong> {pedidoSelecionado.formaPagamento}</p>
                                        {pedidoSelecionado.troco && <p className="text-gray-300"><strong>Troco para:</strong> R$ {pedidoSelecionado.troco}</p>}
                                        <p className="font-bold text-xl text-yellow-400 mt-2">Total: R$ {pedidoSelecionado.total.toFixed(2)}</p>
                                    </div>
                                    
                                    {/* Observações */}
                                    {pedidoSelecionado.observacoes && (
                                        <div className="bg-gray-900/50 p-4 rounded-lg">
                                            <h4 className="font-semibold text-white mb-3 flex items-center gap-2"><FaStickyNote className="text-yellow-500" /> Observações</h4>
                                            <p className="text-gray-300">{pedidoSelecionado.observacoes}</p>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Itens do Pedido */}
                                <div className="bg-gray-900/50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-white mb-3 flex items-center gap-2"><FaBoxOpen className="text-yellow-500" /> Itens do Pedido</h4>
                                    <div className="space-y-2 max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-yellow-500 scrollbar-track-gray-800">
                                        {pedidoSelecionado.itens.map((item, index) => (
                                            <div key={index} className="bg-gray-800 p-2 rounded-md text-sm">
                                                <p className="font-bold text-white">{item.quantidade}x {item.nome}</p>
                                                <div className="text-xs text-gray-400 mt-1">
                                                    {item.extras && item.extras.length > 0 && <p>Sabores: {item.extras.join(', ')}</p>}
                                                    {item.observacao && <p>Obs: {item.observacao}</p>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Ações do Pedido */}
                                <div className="flex flex-col sm:flex-row justify-end items-center gap-2">
                                    <span className="text-gray-400 text-sm">Status Atual: <strong className="text-white">{StatusInfo[pedidoSelecionado.status].text}</strong></span>
                                    {getNextStatus(pedidoSelecionado.status) && (
                                        <button onClick={() => updateOrderStatus(pedidoSelecionado._id, getNextStatus(pedidoSelecionado.status)!)} disabled={updatingStatus === pedidoSelecionado._id} className="w-full sm:w-auto bg-yellow-500 text-black font-bold py-2 px-4 rounded hover:bg-yellow-600 disabled:opacity-50">
                                            {updatingStatus ? 'Aguarde...' : `Mover para ${StatusInfo[getNextStatus(pedidoSelecionado.status)!].text}`}
                                        </button>
                                    )}
                                    {pedidoSelecionado.status !== 'cancelado' && (
                                        <button onClick={() => updateOrderStatus(pedidoSelecionado._id, 'cancelado')} className="w-full sm:w-auto bg-red-600 text-white font-bold py-2 px-4 rounded hover:bg-red-700">
                                            Cancelar Pedido
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ) : (
                           <div className="text-center text-gray-500 h-full flex flex-col items-center justify-center py-8">
                                <FaClock size={40} className="mb-4" />
                                <p>Selecione um pedido na fila para ver os detalhes.</p>
                           </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <AnimatePresence>
                {showDeleteConfirm && orderToDelete && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4 border border-red-500/30">
                            <h2 className="text-xl font-bold text-white mb-4">Confirmar Exclusão</h2>
                            <p className="text-gray-300 mb-6">Tem certeza que deseja remover o pedido <strong>#{orderToDelete._id.slice(-6)}</strong> de <strong>{orderToDelete.cliente.nome}</strong>? Esta ação não pode ser desfeita.</p>
                            <div className="flex gap-3">
                                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 bg-gray-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-700">Cancelar</button>
                                <button onClick={() => deleteOrder(orderToDelete._id)} disabled={deletingOrder === orderToDelete._id} className="flex-1 bg-red-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50">
                                    {deletingOrder ? 'Removendo...' : 'Sim, Remover'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}