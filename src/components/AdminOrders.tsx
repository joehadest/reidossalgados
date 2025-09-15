// src/components/AdminOrders.tsx

'use client';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaTrash, FaUser, FaMapMarkerAlt, FaMoneyBillWave,
    FaStickyNote, FaBoxOpen, FaClock, FaUtensils, FaMotorcycle,
    FaCheckCircle, FaTimesCircle, FaShoppingBag, FaBell, FaTimes
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
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [previousPedidos, setPreviousPedidos] = useState<Pedido[]>([]);
    // Ref para sempre ter acesso à lista anterior dentro do setInterval (evita closure desatualizada)
    const previousPedidosRef = useRef<Pedido[]>([]);
    const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
    const [showNotification, setShowNotification] = useState(false);
    const [newPedido, setNewPedido] = useState<Pedido | null>(null);

    // Ref para o container dos detalhes do pedido (para scroll automático)
    const detalhesPedidoRef = useRef<HTMLDivElement>(null);

    const playSound = () => {
        if (!notificationsEnabled) {
            console.log('Som não tocado: notificações desabilitadas');
            return;
        }
        console.log('Tocando som de notificação');
        const audio = new Audio('/sound/bell-notification-337658.mp3');
        audio.loop = true;
        audio.play().catch(err => console.error('Erro ao tocar som:', err));
        setCurrentAudio(audio);
    };

    const stopSound = () => {
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            setCurrentAudio(null);
        }
    };

    const closeNotification = () => {
        setShowNotification(false);
        setNewPedido(null);
        stopSound();
    };

    const fetchPedidos = async () => {
        try {
            const res = await fetch('/api/pedidos', { cache: 'no-store' });
            const data = await res.json();
            if (!data.success) return;

            const sortedPedidos: Pedido[] = data.data.sort((a: Pedido, b: Pedido) => new Date(b.data).getTime() - new Date(a.data).getTime());

            // Conjunto de IDs anteriores (sempre atualizado via ref)
            const prevList = previousPedidosRef.current;
            const prevIds = new Set(prevList.map(p => p._id));
            const novos = sortedPedidos.filter(p => !prevIds.has(p._id));

            console.log('[Pedidos] Fetch:', {
                qtdNovaResposta: sortedPedidos.length,
                qtdAnterior: prevList.length,
                novosDetectados: novos.map(n => n._id),
                notificacoesAtivas: notificationsEnabled,
                loadingInicial: loading
            });

            if (notificationsEnabled && prevList.length > 0 && novos.length > 0) {
                // Pega o mais recente entre os novos (já estão ordenados por data)
                const novoPedido = novos[0];
                console.log('🚨 NOVO PEDIDO DETECTADO:', novoPedido);
                setNewPedido(novoPedido);
                setShowNotification(true);
                playSound();
            }

            setPedidos(sortedPedidos);
            setPreviousPedidos(sortedPedidos);
        } catch (error) {
            console.error('Erro ao buscar pedidos:', error);
        } finally {
            if (loading) setLoading(false);
        }
    };

    // Mantém o ref sincronizado com o estado sempre que previousPedidos mudar
    useEffect(() => {
        previousPedidosRef.current = previousPedidos;
    }, [previousPedidos]);

    useEffect(() => {
        fetchPedidos();
        const interval = setInterval(() => {
            fetchPedidos();
        }, 10000); // 10s para um pouco mais de responsividade
        return () => clearInterval(interval);
        // fetchPedidos não entra nas deps para não recriar loop; usamos ref para dados atuais
        // notificationsEnabled entra para evitar notificação se o usuário desativar no meio
    }, [notificationsEnabled]);

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

    const handlePedidoClick = (pedido: Pedido) => {
        setPedidoSelecionado(pedido);
        stopSound(); // Parar som ao visualizar pedido

        // Scroll automático para os detalhes do pedido (útil em mobile)
        setTimeout(() => {
            if (detalhesPedidoRef.current) {
                const element = detalhesPedidoRef.current;
                const headerOffset = 100; // Offset para compensar o header fixo
                const elementPosition = element.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        }, 100); // Pequeno delay para garantir que o componente seja renderizado
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

    // Calcular estatísticas do dia usando useMemo para otimização
    const estatisticasDoDia = useMemo(() => {
        const hoje = new Date();
        const hojeString = hoje.toISOString().split('T')[0]; // Formato YYYY-MM-DD

        const pedidosDoDia = pedidos.filter(pedido => {
            const pedidoData = new Date(pedido.data).toISOString().split('T')[0];
            return pedidoData === hojeString;
        });

        const pedidosEntregues = pedidosDoDia.filter(p => p.status === 'entregue');
        const pedidosPendentes = pedidosDoDia.filter(p => p.status === 'pendente');
        const pedidosEmAndamento = pedidosDoDia.filter(p => ['preparando', 'pronto', 'em_entrega'].includes(p.status));
        const pedidosCancelados = pedidosDoDia.filter(p => p.status === 'cancelado');

        const lucroDoDia = pedidosEntregues.reduce((total, pedido) => total + pedido.total, 0);

        return {
            totalPedidos: pedidosDoDia.length,
            pedidosEntregues: pedidosEntregues.length,
            pedidosPendentes: pedidosPendentes.length,
            pedidosEmAndamento: pedidosEmAndamento.length,
            pedidosCancelados: pedidosCancelados.length,
            lucroDoDia
        };
    }, [pedidos]);

    const { totalPedidos, pedidosEntregues, pedidosPendentes, pedidosEmAndamento, pedidosCancelados, lucroDoDia } = estatisticasDoDia;

    const getAddressObject = (endereco: any): Address | null => {
        if (!endereco) return null;
        if ('address' in endereco && typeof endereco.address === 'object') return endereco.address;
        return endereco as Address;
    };

    if (loading) return <div className="text-center py-8 text-white">Carregando pedidos...</div>;

    const addr = getAddressObject(pedidoSelecionado?.endereco);

    const handleNotificationsToggle = () => {
        const newState = !notificationsEnabled;
        setNotificationsEnabled(newState);
        if (!newState) {
            stopSound();
            setShowNotification(false);
            setNewPedido(null);
        }
    };

    const viewPedido = (pedido: Pedido) => {
        setPedidoSelecionado(pedido);
        closeNotification();
    };

    // (Removido: função de teste de notificação)

    return (
        <div className="p-1 sm:p-4 min-h-screen">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-white">Painel de Pedidos</h2>
                <div className="flex gap-2">
                    <button
                        onClick={handleNotificationsToggle}
                        className={`p-2 rounded-full ${notificationsEnabled ? 'bg-yellow-500 text-black' : 'bg-gray-600 text-white'} hover:bg-yellow-600 transition-colors`}
                        title={notificationsEnabled ? 'Desativar notificações' : 'Ativar notificações'}
                    >
                        <FaBell />
                    </button>
                </div>
            </div>

            {/* Card do Lucro do Dia */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-4 mb-4 border border-green-500/30">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FaMoneyBillWave className="text-white text-2xl" />
                        <div>
                            <h3 className="text-lg font-bold text-white">Lucro do Dia</h3>
                            <p className="text-green-100 text-sm">Pedidos entregues hoje</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold text-white">R$ {lucroDoDia.toFixed(2).replace('.', ',')}</p>
                        <p className="text-green-100 text-xs">
                            {pedidosEntregues} de {totalPedidos} pedidos entregues
                        </p>
                    </div>
                </div>
            </div>

            {/* Card de Estatísticas do Dia */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-3 border border-blue-500/30">
                    <div className="flex items-center gap-2">
                        <FaClock className="text-white text-lg" />
                        <div>
                            <p className="text-blue-100 text-xs">Pendentes</p>
                            <p className="text-white font-bold text-lg">{pedidosPendentes}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 rounded-lg p-3 border border-yellow-500/30">
                    <div className="flex items-center gap-2">
                        <FaUtensils className="text-white text-lg" />
                        <div>
                            <p className="text-yellow-100 text-xs">Em Andamento</p>
                            <p className="text-white font-bold text-lg">{pedidosEmAndamento}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-3 border border-green-500/30">
                    <div className="flex items-center gap-2">
                        <FaCheckCircle className="text-white text-lg" />
                        <div>
                            <p className="text-green-100 text-xs">Entregues</p>
                            <p className="text-white font-bold text-lg">{pedidosEntregues}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-lg p-3 border border-red-500/30">
                    <div className="flex items-center gap-2">
                        <FaTimesCircle className="text-white text-lg" />
                        <div>
                            <p className="text-red-100 text-xs">Cancelados</p>
                            <p className="text-white font-bold text-lg">{pedidosCancelados}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Card de Notificação Flutuante */}
            <AnimatePresence>
                {showNotification && newPedido && (() => {
                    const itemCount = newPedido.itens.reduce((acc, it) => acc + it.quantidade, 0);
                    const minutos = Math.max(0, Math.floor((Date.now() - new Date(newPedido.data).getTime()) / 60000));
                    return (
                        <motion.div
                            initial={{ opacity: 0, y: -40, x: '-50%' }}
                            animate={{ opacity: 1, y: 0, x: '-50%' }}
                            exit={{ opacity: 0, y: -40, x: '-50%' }}
                            role="alert"
                            aria-live="assertive"
                            className="fixed top-4 left-1/2 z-50 max-w-sm w-full mx-4"
                        >
                            <div className="relative overflow-hidden rounded-xl shadow-xl ring-2 ring-yellow-500/40 bg-gray-900 text-white">
                                <div className="p-4 relative flex gap-3">
                                    <div className="flex flex-col items-center">
                                        <div className="w-10 h-10 rounded-full bg-yellow-500/20 border border-yellow-400/30 flex items-center justify-center text-xl animate-bounce">🔔</div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-extrabold text-base tracking-tight text-yellow-300 drop-shadow-sm">Novo Pedido Recebido</h3>
                                        <p className="text-sm mt-1 font-semibold truncate text-white">#{newPedido._id.slice(-6)} · {newPedido.cliente.nome}</p>
                                        <p className="text-xs mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5 text-gray-300">
                                            <span>{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
                                            <span>• {newPedido.formaPagamento}</span>
                                            <span>• {newPedido.tipoEntrega === 'entrega' ? 'Entrega' : 'Retirada'}</span>
                                            <span>• há {minutos} min</span>
                                        </p>
                                        <p className="text-sm font-bold mt-2 text-gray-200">Total: <span className="text-yellow-300">R$ {newPedido.total.toFixed(2)}</span></p>
                                        <div className="mt-3 flex gap-2">
                                            <button
                                                onClick={() => viewPedido(newPedido)}
                                                className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold py-2 px-3 rounded-lg text-xs tracking-wide transition-colors shadow focus:outline-none focus:ring-2 focus:ring-yellow-300/80 focus:ring-offset-2 focus:ring-offset-gray-900"
                                            >
                                                Ver Detalhes
                                            </button>
                                            <button
                                                onClick={closeNotification}
                                                className="px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-semibold text-xs transition-colors shadow focus:outline-none focus:ring-2 focus:ring-yellow-300/60 focus:ring-offset-2 focus:ring-offset-gray-900"
                                            >
                                                Fechar
                                            </button>
                                        </div>
                                    </div>
                                    <button
                                        onClick={closeNotification}
                                        className="absolute top-2 right-2 p-1 rounded-md bg-gray-700/70 hover:bg-gray-600 text-yellow-300 hover:text-white transition-colors shadow focus:outline-none focus:ring-2 focus:ring-yellow-400/70"
                                        aria-label="Fechar notificação"
                                    >
                                        <FaTimes />
                                    </button>
                                </div>
                                <div className="h-1 w-full bg-gray-700">
                                    <div className="h-full bg-yellow-400 animate-[shrink_12s_linear_forwards] origin-left" />
                                </div>
                            </div>
                        </motion.div>
                    );
                })()}
            </AnimatePresence>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Coluna da Fila de Pedidos */}
                <div className="lg:col-span-1 bg-gray-800 p-2 sm:p-4 rounded-lg max-h-[50vh] sm:max-h-[60vh] overflow-y-auto overflow-x-hidden border border-yellow-500/20 scrollbar-thin scrollbar-thumb-yellow-500 scrollbar-track-gray-800">
                    <h3 className="text-lg font-semibold text-white mb-3 text-center sm:text-left">Fila de Pedidos</h3>
                    {pedidos.length > 0 ? pedidos.map(pedido => {
                        const status = StatusInfo[pedido.status] || StatusInfo.pendente;
                        return (
                            <div key={pedido._id} onClick={() => handlePedidoClick(pedido)} className={`p-3 rounded-lg mb-2 transition-all duration-200 cursor-pointer ${pedidoSelecionado?._id === pedido._id ? 'bg-yellow-500/20 border-l-4 border-yellow-500' : 'bg-gray-900/50 hover:bg-gray-700/80'}`}>
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
                        )
                    }) : <p className="text-gray-500 text-center">Nenhum pedido no momento.</p>}
                </div>

                {/* Coluna de Detalhes do Pedido */}
                <div ref={detalhesPedidoRef} className="lg:col-span-2 bg-gray-800 p-3 sm:p-6 rounded-lg border border-yellow-500/20 max-h-[70vh] sm:max-h-[80vh] overflow-y-auto scrollbar-thin scrollbar-thumb-yellow-500 scrollbar-track-gray-800">
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

                                {/* Itens do Pedido - Layout melhorado */}
                                <div className="bg-gray-900/55 p-5 rounded-lg border border-gray-800">
                                    <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                                        <h4 className="font-semibold text-white flex items-center gap-2 text-lg"><FaBoxOpen className="text-yellow-500" /> Itens do Pedido</h4>
                                        <span className="text-xs font-medium bg-yellow-500/20 text-yellow-400 px-2.5 py-1 rounded-full border border-yellow-500/30 tracking-wide">{pedidoSelecionado.itens.length} ITEM{pedidoSelecionado.itens.length !== 1 && 'S'}</span>
                                    </div>
                                    <div className="max-h-72 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent space-y-4">
                                        {pedidoSelecionado.itens.map((item, index) => {
                                            const totalItem = item.preco * item.quantidade;
                                            return (
                                                <div key={index} className="relative group rounded-xl border border-gray-700/60 bg-gradient-to-br from-gray-800/70 to-gray-850/60 p-4 hover:border-yellow-500/60 transition-colors">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex-1 space-y-1">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="inline-flex items-center justify-center bg-yellow-500 text-gray-900 font-bold text-[11px] w-6 h-6 rounded-full shadow-sm">{item.quantidade}</span>
                                                                <p className="font-semibold text-white leading-snug text-sm md:text-base">{item.nome}</p>
                                                                {item.size && (<span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-700 text-gray-300 border border-gray-600 uppercase tracking-wide">{item.size}</span>)}
                                                                {item.border && (<span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-700/30 text-purple-300 border border-purple-500/40 tracking-wide">Borda: {item.border}</span>)}
                                                            </div>
                                                            {item.extras && item.extras.length > 0 && (
                                                                <p className="text-[11px] text-gray-300 leading-relaxed"><span className="text-gray-400">Sabores:</span> {item.extras.join(', ')}</p>
                                                            )}
                                                            {item.observacao && (
                                                                <p className="text-[11px] text-gray-400 italic">Obs: {item.observacao}</p>
                                                            )}
                                                        </div>
                                                        <div className="text-right flex flex-col items-end min-w-[72px]">
                                                            <span className="text-xs text-gray-400">Unit.</span>
                                                            <span className="text-sm font-semibold text-yellow-400">R$ {item.preco.toFixed(2)}</span>
                                                            {item.quantidade > 1 && (
                                                                <span className="mt-1 text-[11px] text-gray-500">Total: <span className="text-gray-300 font-medium">R$ {totalItem.toFixed(2)}</span></span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="absolute -left-px top-3 bottom-3 w-1 bg-gradient-to-b from-yellow-500/0 via-yellow-500/70 to-yellow-500/0 rounded-r opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                            );
                                        })}
                                        {pedidoSelecionado.itens.length === 0 && (
                                            <div className="text-center text-gray-500 text-sm py-8">Nenhum item neste pedido.</div>
                                        )}
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