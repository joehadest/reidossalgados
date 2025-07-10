'use client';
import React, { useEffect, useState, useRef } from 'react';
import { FaShareAlt } from 'react-icons/fa';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import Notification from './Notification';
import { Pedido } from '../types/cart';

interface Endereco {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    zipCode: string;
    deliveryFee: number;
    estimatedTime: string;
}

interface PedidoItem {
    nome: string;
    quantidade: number;
    preco: number;
    observacao?: string;
    size?: string;
    border?: string;
    extras?: string[];
}

interface Cliente {
    nome: string;
    telefone: string;
}

type PedidoStatus = 'pendente' | 'preparando' | 'pronto' | 'em_entrega' | 'entregue' | 'cancelado';

export default function AdminOrders() {
    const [pedidos, setPedidos] = useState<Pedido[]>([]);
    const [loading, setLoading] = useState(true);
    const [pedidoSelecionado, setPedidoSelecionado] = useState<Pedido | null>(null);
    const [mensagem, setMensagem] = useState<string | null>(null);
    const [mensagemCompartilhamento, setMensagemCompartilhamento] = useState<string | null>(null);
    const [phoneFilter, setPhoneFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
    const [notification, setNotification] = useState<string | null>(null);

    const fetchPedidos = async () => {
        try {
            const res = await fetch('/api/pedidos');
            const data = await res.json();
            if (data.success) {
                const novosPedidos = data.data.filter((novoPedido: Pedido) =>
                    !pedidos.some(pedido => pedido._id === novoPedido._id)
                );

                if (novosPedidos.length > 0) {
                    setNotification(`Novo pedido recebido! #${novosPedidos[0]._id.slice(-6)}`);
                    const notifyOrders = JSON.parse(localStorage.getItem('notifyOrders') || '[]');
                    if (!notifyOrders.includes(novosPedidos[0]._id)) {
                        notifyOrders.push(novosPedidos[0]._id);
                        localStorage.setItem('notifyOrders', JSON.stringify(notifyOrders));
                    }
                }

                setPedidos(data.data);
            }
        } catch (err) {
            console.error('Erro ao buscar pedidos:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPedidos();
    }, []);

    useEffect(() => {
        const interval = setInterval(fetchPedidos, 30000);
        return () => clearInterval(interval);
    }, [pedidos]);

    const handleRemoverPedido = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja remover este pedido?')) return;

        try {
            setLoading(true);
            const res = await fetch(`/api/pedidos?id=${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await res.json();

            if (data.success) {
                setPedidos((prev) => prev.filter((p) => p._id !== id));
                setMensagem('Pedido removido com sucesso!');
                setTimeout(() => setMensagem(null), 3000);
            } else {
                console.error('Erro na resposta:', data);
                setMensagem(data.message || 'Erro ao remover pedido.');
                setTimeout(() => setMensagem(null), 3000);
            }
        } catch (err) {
            console.error('Erro ao remover pedido:', err);
            setMensagem('Erro ao remover pedido. Tente novamente.');
            setTimeout(() => setMensagem(null), 3000);
        } finally {
            setLoading(false);
        }
    };

    const handleCompartilharPedido = (pedido: Pedido) => {
        const endereco = pedido.endereco;
        const enderecoFormatado = endereco ? 
            `${endereco.address.street}, ${endereco.address.number}${endereco.address.complement ? ` - ${endereco.address.complement}` : ''}, ${endereco.address.neighborhood}` : 
            'Retirada no local';

        const formaPagamento = pedido.formaPagamento === 'pix' ? 'PIX' :
            pedido.formaPagamento === 'cartao' ? 'Cartão' : 'Dinheiro';

        const troco = pedido.formaPagamento === 'dinheiro' && pedido.troco ? 
            `\nTroco: R$ ${pedido.troco}` : '';

        const taxaEntrega = pedido.endereco?.deliveryFee ? 
            `\nTaxa de Entrega: R$ ${pedido.endereco.deliveryFee}` : '';

        const itensFormatados = pedido.itens.map(item => {
            let itemStr = `${item.nome}`;
            if (item.size) itemStr += ` (${item.size})`;
            itemStr += ` x${item.quantidade}`;
            if (item.border) itemStr += `\nBorda: ${item.border}`;
            if (item.extras && item.extras.length > 0) itemStr += `\nExtras: ${item.extras.join(', ')}`;
            if (item.observacao) itemStr += `\nObs: ${item.observacao}`;
            itemStr += ` - R$ ${(item.preco * item.quantidade).toFixed(2)}`;
            return itemStr;
        }).join('\n\n');

        const subtotal = pedido.itens.reduce((total, item) => total + (item.preco * item.quantidade), 0);
        const total = subtotal + (pedido.endereco?.deliveryFee || 0);

        const mensagem = `*Rei dos Salgados - Pedido #${pedido._id}*\n\n` +
                `*Data:* ${new Date(pedido.data).toLocaleString()}\n` +
            `*Status:* ${pedido.status}\n\n` +
                `*Cliente:*\n` +
            `Nome: ${pedido.cliente.nome}\n` +
            `Telefone: ${pedido.cliente.telefone}\n\n` +
            `*Endereço:*\n${enderecoFormatado}\n\n` +
            `*Itens do Pedido:*\n${itensFormatados}\n\n` +
            `*Forma de Pagamento:* ${formaPagamento}${troco}\n` +
            `*Subtotal:* R$ ${subtotal.toFixed(2)}${taxaEntrega}\n` +
            `*Total:* R$ ${total.toFixed(2)}\n\n` +
            `*Observações:*\n${pedido.observacoes || 'Nenhuma observação'}`;

        if (navigator.share) {
            navigator.share({
                title: `Pedido #${pedido._id}`,
                text: mensagem
            });
        } else {
            alert('Compartilhamento não suportado neste navegador.');
        }
    };

    const updateOrderStatus = async (orderId: string, newStatus: PedidoStatus) => {
        try {
            setUpdatingStatus(orderId);
            const res = await fetch(`/api/pedidos?id=${orderId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Erro ao atualizar status do pedido');
            }

            if (data.success) {
                setPedidos(pedidos.map(order =>
                    order._id === orderId
                        ? { ...order, status: newStatus }
                        : order
                ));
                setMensagem('Status atualizado com sucesso!');
                setNotification(`Status do pedido #${orderId.slice(-6)} atualizado para ${getStatusText(newStatus)}`);
                
                // Enviar notificação em tempo real
                const timestamp = new Date().toLocaleString('pt-BR');
                const message = `Status do pedido #${orderId.slice(-6)} atualizado para ${getStatusText(newStatus)}`;
                
                // Enviar para o servidor de notificações
                await fetch('/api/notifications', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        clientId: pedidos.find(p => p._id === orderId)?.cliente.telefone,
                        orderId,
                        status: newStatus,
                        message,
                        timestamp
                    }),
                });
                
                // Atualizar localStorage para compatibilidade com o sistema atual
                const notifyOrders = JSON.parse(localStorage.getItem('notifyOrders') || '[]');
                if (!notifyOrders.includes(orderId)) {
                    notifyOrders.push(orderId);
                    localStorage.setItem('notifyOrders', JSON.stringify(notifyOrders));
                }
                localStorage.setItem(`notifyStatus_${orderId}`, newStatus);
                localStorage.setItem(`notifyTimestamp_${orderId}`, timestamp);
                
                setTimeout(() => setMensagem(null), 3000);
            } else {
                throw new Error(data.message || 'Erro ao atualizar status do pedido');
            }
        } catch (err) {
            console.error('Erro ao atualizar status:', err);
            setMensagem('Erro ao atualizar status do pedido. Por favor, tente novamente.');
            setTimeout(() => setMensagem(null), 3000);
        } finally {
            setUpdatingStatus(null);
        }
    };

    const getStatusColor = (status: PedidoStatus) => {
        const colors = {
            pendente: 'bg-yellow-500 text-gray-900',
            preparando: 'bg-blue-500 text-white',
            pronto: 'bg-green-500 text-white',
            em_entrega: 'bg-purple-500 text-white',
            entregue: 'bg-gray-700 text-gray-300',
            cancelado: 'bg-red-600 text-white'
        };
        return colors[status];
    };

    const getStatusText = (status: PedidoStatus) => {
        const texts = {
            pendente: 'Pendente',
            preparando: 'Preparando',
            pronto: 'Pronto',
            em_entrega: 'Em Entrega',
            entregue: 'Entregue',
            cancelado: 'Cancelado'
        };
        return texts[status];
    };

    const getNextStatus = (currentStatus: PedidoStatus): PedidoStatus | null => {
        switch (currentStatus) {
            case 'pendente':
                return 'preparando';
            case 'preparando':
                return 'pronto';
            case 'pronto':
                return 'em_entrega';
            case 'em_entrega':
                return 'entregue';
            default:
                return 'cancelado';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('pt-BR');
    };

    const calcularTotal = (pedido: Pedido) => {
        const subtotal = pedido.itens.reduce((acc, item) => acc + item.preco * item.quantidade, 0);
        return subtotal + (pedido.endereco?.deliveryFee || 0);
    };

    const filteredPedidos = pedidos
        .filter(p => !phoneFilter || p.cliente.telefone.includes(phoneFilter))
        .filter(p => !statusFilter || p.status === statusFilter);

    if (loading) {
        return <div className="text-center py-8">Carregando pedidos...</div>;
    }

    return (
        <div className="p-2 sm:p-0">
            {notification && <Notification message={notification} onClose={() => setNotification(null)} />}
            
            <div className="bg-gray-800 p-3 sm:p-4 rounded-lg shadow-md mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Filtros</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <input
                        type="text"
                        placeholder="Filtrar por telefone"
                        value={phoneFilter}
                        onChange={(e) => setPhoneFilter(e.target.value)}
                        className="p-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
                    />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="p-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
                    >
                        <option value="">Todos os status</option>
                        <option value="pendente">Pendente</option>
                        <option value="preparando">Preparando</option>
                        <option value="pronto">Pronto</option>
                        <option value="em_entrega">Em Entrega</option>
                        <option value="entregue">Entregue</option>
                        <option value="cancelado">Cancelado</option>
                    </select>
                </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-700 text-gray-300">
                            <tr>
                                <th className="p-3 text-left">ID</th>
                                <th className="p-3 text-left">Cliente</th>
                                <th className="p-3 text-left">Data</th>
                                <th className="p-3 text-left">Total</th>
                                <th className="p-3 text-left">Status</th>
                                <th className="p-3 text-left">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {filteredPedidos.map((pedido) => (
                                <tr 
                                    key={pedido._id} 
                                    className="hover:bg-gray-700 transition-colors cursor-pointer"
                                    onClick={() => setPedidoSelecionado(pedido)}
                                >
                                    <td className="p-3 font-mono text-xs">{pedido._id.slice(-6)}</td>
                                    <td className="p-3">{pedido.cliente.nome} <br /> <span className="text-gray-400">{pedido.cliente.telefone}</span></td>
                                    <td className="p-3">{formatDate(pedido.data)}</td>
                                    <td className="p-3 font-semibold">R$ {calcularTotal(pedido).toFixed(2)}</td>
                                    <td className="p-3">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(pedido.status)}`}>
                                            {getStatusText(pedido.status)}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                            {getNextStatus(pedido.status) && (
                                                <button
                                                    onClick={() => updateOrderStatus(pedido._id, getNextStatus(pedido.status)!)}
                                                    className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-1 px-3 rounded-lg text-xs transition-colors disabled:bg-gray-600"
                                                    disabled={updatingStatus === pedido._id}
                                                >
                                                    Avançar Status
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleCompartilharPedido(pedido)}
                                                className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-1 px-3 rounded-lg text-xs transition-colors"
                                            >
                                                Compartilhar
                                            </button>
                                            <button
                                                onClick={() => handleRemoverPedido(pedido._id)}
                                                className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded-lg text-xs transition-colors"
                                            >
                                                Remover
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-3">
                {filteredPedidos.map((pedido) => (
                    <div 
                        key={pedido._id} 
                        className="bg-gray-800 rounded-lg p-4 shadow-md cursor-pointer hover:bg-gray-750 transition-colors"
                        onClick={() => setPedidoSelecionado(pedido)}
                    >
                        {/* Header */}
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h3 className="text-white font-semibold text-sm">#{pedido._id.slice(-6)}</h3>
                                <p className="text-gray-400 text-xs">{formatDate(pedido.data)}</p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(pedido.status)}`}>
                                {getStatusText(pedido.status)}
                            </span>
                        </div>

                        {/* Cliente */}
                        <div className="mb-3">
                            <p className="text-white font-medium text-sm">{pedido.cliente.nome}</p>
                            <p className="text-gray-400 text-xs">{pedido.cliente.telefone}</p>
                        </div>

                        {/* Total */}
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-yellow-500 font-semibold text-sm">Total</span>
                            <span className="text-yellow-500 font-bold">R$ {calcularTotal(pedido).toFixed(2)}</span>
                        </div>

                        {/* Ações */}
                        <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                            {getNextStatus(pedido.status) && (
                                <button
                                    onClick={() => updateOrderStatus(pedido._id, getNextStatus(pedido.status)!)}
                                    className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-2 px-3 rounded-lg text-xs transition-colors disabled:bg-gray-600 flex-1"
                                    disabled={updatingStatus === pedido._id}
                                >
                                    {updatingStatus === pedido._id ? 'Atualizando...' : 'Avançar'}
                                </button>
                            )}
                            <button
                                onClick={() => handleCompartilharPedido(pedido)}
                                className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-3 rounded-lg text-xs transition-colors flex-1"
                            >
                                Compartilhar
                            </button>
                            <button
                                onClick={() => handleRemoverPedido(pedido._id)}
                                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded-lg text-xs transition-colors flex-1"
                            >
                                Remover
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {pedidoSelecionado && (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-2 sm:p-4"
            onClick={() => setPedidoSelecionado(null)}
        >
            <div
              className="bg-gray-900 rounded-xl shadow-xl p-4 sm:p-8 w-full max-w-md mx-auto text-gray-200 border border-yellow-500 relative max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg sm:text-xl font-bold text-yellow-500">Pedido #{pedidoSelecionado._id}</h3>
                <button
                    className="text-gray-400 hover:text-white text-xl sm:text-2xl focus:outline-none"
                    onClick={() => setPedidoSelecionado(null)}
                    aria-label="Fechar modal de pedido"
                >
                    &times;
                </button>
              </div>

              {/* Detalhes do Pedido */}
              <div className="space-y-3 sm:space-y-4">
                  {/* Informações do Cliente */}
                  <div className="bg-gray-800 rounded-lg p-3 sm:p-4">
                      <h4 className="text-yellow-500 font-semibold mb-2 text-sm sm:text-base">Cliente</h4>
                      <p className="text-white text-sm sm:text-base">{pedidoSelecionado.cliente.nome}</p>
                      <p className="text-gray-400 text-xs sm:text-sm">{pedidoSelecionado.cliente.telefone}</p>
                  </div>

                  {/* Data e Status */}
                  <div className="bg-gray-800 rounded-lg p-3 sm:p-4">
                      <div className="flex justify-between items-center mb-2">
                          <h4 className="text-yellow-500 font-semibold text-sm sm:text-base">Data do Pedido</h4>
                          <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(pedidoSelecionado.status)}`}>
                              {getStatusText(pedidoSelecionado.status)}
                          </span>
                      </div>
                      <p className="text-gray-300 text-sm sm:text-base">{formatDate(pedidoSelecionado.data)}</p>
                  </div>

                  {/* Endereço de Entrega */}
                  {pedidoSelecionado.endereco && (
                      <div className="bg-gray-800 rounded-lg p-3 sm:p-4">
                          <h4 className="text-yellow-500 font-semibold mb-2 text-sm sm:text-base">Endereço de Entrega</h4>
                          <p className="text-gray-300 text-sm sm:text-base">
                              {pedidoSelecionado.endereco.address.street}, {pedidoSelecionado.endereco.address.number}
                              {pedidoSelecionado.endereco.address.complement && ` - ${pedidoSelecionado.endereco.address.complement}`}
                          </p>
                          <p className="text-gray-400 text-xs sm:text-sm">{pedidoSelecionado.endereco.address.neighborhood}</p>
                          {pedidoSelecionado.endereco.deliveryFee > 0 && (
                              <p className="text-yellow-500 mt-1 text-sm">Taxa de entrega: R$ {pedidoSelecionado.endereco.deliveryFee.toFixed(2)}</p>
                          )}
                      </div>
                  )}

                  {/* Itens do Pedido */}
                  <div className="bg-gray-800 rounded-lg p-3 sm:p-4">
                      <h4 className="text-yellow-500 font-semibold mb-3 text-sm sm:text-base">Itens do Pedido</h4>
                      <div className="space-y-3">
                          {pedidoSelecionado.itens.map((item, index) => (
                              <div key={index} className="border-b border-gray-700 pb-2 last:border-b-0">
                                  <div className="flex justify-between items-start">
                                      <div className="flex-1">
                                          <p className="text-white font-medium text-sm sm:text-base">
                                              {item.quantidade}x {item.nome}
                                          </p>
                                          {item.size && <p className="text-gray-400 text-xs sm:text-sm">Tamanho: {item.size}</p>}
                                          {item.border && <p className="text-gray-400 text-xs sm:text-sm">Borda: {item.border}</p>}
                                          {item.extras && item.extras.length > 0 && (
                                              <p className="text-gray-400 text-xs sm:text-sm">Extras: {item.extras.join(', ')}</p>
                                          )}
                                          {item.observacao && (
                                              <p className="text-gray-400 text-xs sm:text-sm italic">Obs: {item.observacao}</p>
                                          )}
                                      </div>
                                      <p className="text-yellow-500 font-semibold ml-2 text-sm sm:text-base">
                                          R$ {(item.preco * item.quantidade).toFixed(2)}
                                      </p>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>

                  {/* Forma de Pagamento */}
                  <div className="bg-gray-800 rounded-lg p-3 sm:p-4">
                      <h4 className="text-yellow-500 font-semibold mb-2 text-sm sm:text-base">Forma de Pagamento</h4>
                      <p className="text-white capitalize text-sm sm:text-base">{pedidoSelecionado.formaPagamento}</p>
                      {pedidoSelecionado.troco && (
                          <p className="text-gray-400 text-sm">Troco: R$ {pedidoSelecionado.troco}</p>
                      )}
                  </div>

                  {/* Observações */}
                  {pedidoSelecionado.observacoes && (
                      <div className="bg-gray-800 rounded-lg p-3 sm:p-4">
                          <h4 className="text-yellow-500 font-semibold mb-2 text-sm sm:text-base">Observações</h4>
                          <p className="text-gray-300 text-sm sm:text-base">{pedidoSelecionado.observacoes}</p>
                      </div>
                  )}

                  {/* Total */}
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 sm:p-4">
                      <div className="flex justify-between items-center">
                          <span className="text-yellow-500 font-semibold text-sm sm:text-base">Total do Pedido</span>
                          <span className="text-yellow-500 text-lg sm:text-xl font-bold">R$ {calcularTotal(pedidoSelecionado).toFixed(2)}</span>
                      </div>
                  </div>
              </div>

              <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-2">
                            {getNextStatus(pedidoSelecionado.status) && (
                                <button
                                    onClick={() => updateOrderStatus(pedidoSelecionado._id, getNextStatus(pedidoSelecionado.status)!)}
                                    className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-600 text-sm"
                                    disabled={updatingStatus === pedidoSelecionado._id}
                                >
                                    {updatingStatus === pedidoSelecionado._id ? 'Atualizando...' : 'Avançar Status'}
                                </button>
                            )}
                            <button
                                onClick={() => updateOrderStatus(pedidoSelecionado._id, 'cancelado')}
                                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
                            >
                                Cancelar Pedido
                            </button>
                            <button
                                className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
                                onClick={() => handleCompartilharPedido(pedidoSelecionado)}
                            >
                                Compartilhar
                            </button>
                        </div>
            </div>
        </div>
      )}
        </div>
    );
} 