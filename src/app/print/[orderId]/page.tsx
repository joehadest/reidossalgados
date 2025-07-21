'use client';
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface OrderItem {
    nome: string;
    quantidade: number;
    preco: number;
    observacao?: string;
    size?: string;
    border?: string;
    extras?: string[];
}

interface Order {
    _id: string;
    cliente: {
        nome: string;
        telefone: string;
    };
    endereco?: {
        address: {
            street: string;
            number: string;
            complement?: string;
            neighborhood: string;
            referencePoint?: string;
        };
        deliveryFee: number;
        estimatedTime: string;
    };
    itens: OrderItem[];
    total: number;
    formaPagamento: 'pix' | 'dinheiro' | 'cartao';
    tipoEntrega: 'entrega' | 'retirada';
    troco?: string;
    data: string;
    status: string;
    observacoes?: string;
}

export default function PrintOrder() {
    const params = useParams();
    const orderId = params?.orderId as string;
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [debugInfo, setDebugInfo] = useState<string>('');

    useEffect(() => {
        console.log('=== DEBUG: Iniciando página de impressão ===');
        console.log('Params:', params);
        console.log('OrderId:', orderId);
        
        const fetchOrder = async () => {
            try {
                if (!params?.orderId) {
                    throw new Error('ID do pedido não fornecido');
                }
                
                console.log('Buscando pedido com ID:', params.orderId);
                const response = await fetch(`/api/pedidos/${params.orderId}`);
                console.log('Status da resposta:', response.status);
                
                if (!response.ok) {
                    throw new Error('Pedido não encontrado');
                }
                
                const data = await response.json();
                console.log('Dados brutos recebidos:', data);
                
                // Normalizar os dados para garantir compatibilidade
                const normalizedOrder = normalizeOrderData(data);
                console.log('Pedido normalizado:', normalizedOrder);
                
                setOrder(normalizedOrder);
                setDebugInfo(`Pedido carregado: ${normalizedOrder._id}`);
            } catch (err) {
                console.error('Erro na busca:', err);
                setError('Erro ao carregar pedido');
                setDebugInfo(`Erro: ${err}`);
            } finally {
                setLoading(false);
            }
        };

        if (params?.orderId) {
            fetchOrder();
        } else {
            setError('ID do pedido não fornecido');
            setLoading(false);
        }
    }, [params?.orderId]);

    // Função para normalizar os dados do pedido
    const normalizeOrderData = (data: any): Order => {
        console.log('=== NORMALIZAÇÃO DE DADOS ===');
        console.log('Dados de entrada:', data);
        
        // Se os dados já estão no formato correto, retornar diretamente
        if (data._id && data.cliente && data.itens) {
            console.log('Dados já estão no formato correto');
            return {
                _id: data._id.toString(),
                cliente: {
                    nome: data.cliente.nome || 'N/A',
                    telefone: data.cliente.telefone || 'N/A'
                },
                endereco: data.endereco,
                itens: data.itens || [],
                total: data.total || 0,
                formaPagamento: data.formaPagamento || 'dinheiro',
                tipoEntrega: data.tipoEntrega || 'retirada',
                troco: data.troco || '',
                data: data.data || new Date().toISOString(),
                status: data.status || 'pendente',
                observacoes: data.observacoes || ''
            };
        }

        // Se não, tentar normalizar
        const order = data.data || data;
        console.log('Dados para normalizar:', order);
        
        if (!order) {
            throw new Error('Dados do pedido inválidos');
        }

        const normalizedOrder: Order = {
            _id: order._id?.toString() || 'N/A',
            cliente: {
                nome: order.cliente?.nome || 'N/A',
                telefone: order.cliente?.telefone || 'N/A'
            },
            endereco: order.endereco,
            itens: Array.isArray(order.itens) ? order.itens : [],
            total: order.total || 0,
            formaPagamento: order.formaPagamento || 'dinheiro',
            tipoEntrega: order.tipoEntrega || 'retirada',
            troco: order.troco || '',
            data: order.data || new Date().toISOString(),
            status: order.status || 'pendente',
            observacoes: order.observacoes || ''
        };

        console.log('Pedido normalizado final:', normalizedOrder);
        return normalizedOrder;
    };

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return 'Data inválida';
            }
            return date.toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        } catch (error) {
            console.error('Erro ao formatar data:', error);
            return 'Data inválida';
        }
    };

    const formatPhone = (phone: string) => {
        if (!phone || phone === 'N/A') return 'N/A';
        const cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.length === 11) {
            return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        }
        return phone;
    };

    const formatText = (text: string) => {
        if (!text) return '';
        // Decodificar caracteres especiais
        try {
            return decodeURIComponent(escape(text));
        } catch {
            return text;
        }
    };

    if (loading) {
        return (
            <div className="print-container">
                <div className="loading">Carregando pedido...</div>
                <div className="debug-info">{debugInfo}</div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="print-container">
                <div className="error">Erro: {error || 'Pedido não encontrado'}</div>
                <div className="debug-info">{debugInfo}</div>
            </div>
        );
    }

    console.log('=== RENDERIZANDO PEDIDO ===');
    console.log('Order ID:', order._id);
    console.log('Cliente:', order.cliente);
    console.log('Itens:', order.itens);

    return (
        <div className="print-container">
            {/* Debug Info (visível apenas na tela) */}
            <div className="debug-info" style={{ display: 'none' }}>
                Debug: {debugInfo} | Order ID: {order._id}
            </div>

            {/* Cabeçalho */}
            <div className="header">
                <div className="logo">
                    <h1>REI DOS SALGADOS</h1>
                </div>
                <div className="order-info">
                    <div className="order-number">PEDIDO #{order._id}</div>
                    <div className="order-date">{formatDate(order.data)}</div>
                </div>
            </div>

            {/* Informações do Cliente */}
            <div className="customer-info">
                <div className="section-title">CLIENTE</div>
                <div className="customer-details">
                    <div><strong>Nome:</strong> {formatText(order.cliente?.nome || 'N/A')}</div>
                    <div><strong>Telefone:</strong> {formatPhone(order.cliente?.telefone || '')}</div>
                </div>
            </div>

            {/* Endereço (se for entrega) */}
            {order.tipoEntrega === 'entrega' && order.endereco && (
                <div className="address-info">
                    <div className="section-title">ENDEREÇO DE ENTREGA</div>
                    <div className="address-details">
                        <div>{formatText(order.endereco.address.street)}, {order.endereco.address.number}</div>
                        {order.endereco.address.complement && <div>Complemento: {formatText(order.endereco.address.complement)}</div>}
                        <div>Bairro: {formatText(order.endereco.address.neighborhood)}</div>
                        {order.endereco.address.referencePoint && <div>Referência: {formatText(order.endereco.address.referencePoint)}</div>}
                        {order.endereco.deliveryFee > 0 && (
                            <div className="delivery-fee">
                                <strong>Taxa de entrega: R$ {order.endereco.deliveryFee.toFixed(2)}</strong>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Itens do Pedido */}
            <div className="order-items">
                <div className="section-title">ITENS DO PEDIDO</div>
                {order.itens && Array.isArray(order.itens) && order.itens.length > 0 ? (
                    order.itens.map((item: OrderItem, index: number) => (
                        <div key={index} className="item">
                            <div className="item-header">
                                <span className="item-quantity">{item.quantidade}x</span>
                                <span className="item-name">{formatText(item.nome)}</span>
                                <span className="item-price">R$ {(item.preco * item.quantidade).toFixed(2)}</span>
                            </div>
                            {item.size && (
                                <div className="item-detail">Tamanho: {formatText(item.size)}</div>
                            )}
                            {item.observacao && (
                                <div className="item-detail">Obs: {formatText(item.observacao)}</div>
                            )}
                            {item.border && (
                                <div className="item-detail">Borda: {formatText(item.border)}</div>
                            )}
                            {item.extras && item.extras.length > 0 && (
                                <div className="item-detail">Extras: {item.extras.map(formatText).join(', ')}</div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="item-detail">Nenhum item encontrado</div>
                )}
            </div>

            {/* Observações */}
            {order.observacoes && (
                <div className="observations">
                    <div className="section-title">OBSERVAÇÕES</div>
                    <div className="observations-text">{formatText(order.observacoes)}</div>
                </div>
            )}

            {/* Resumo Financeiro */}
            <div className="financial-summary">
                <div className="section-title">RESUMO</div>
                <div className="summary-line">
                    <span>Subtotal:</span>
                    <span>R$ {order.itens.reduce((total, item) => total + (item.preco * item.quantidade), 0).toFixed(2)}</span>
                </div>
                {order.endereco?.deliveryFee && order.endereco.deliveryFee > 0 && (
                    <div className="summary-line">
                        <span>Taxa de Entrega:</span>
                        <span>R$ {order.endereco.deliveryFee.toFixed(2)}</span>
                    </div>
                )}
                <div className="summary-line total">
                    <span>TOTAL:</span>
                    <span>R$ {order.total.toFixed(2)}</span>
                </div>
            </div>

            {/* Informações de Pagamento */}
            <div className="payment-info">
                <div className="section-title">FORMA DE PAGAMENTO</div>
                <div className="payment-details">
                    <div><strong>Forma:</strong> {(order.formaPagamento || 'N/A').toUpperCase()}</div>
                    <div><strong>Tipo:</strong> {(order.tipoEntrega || 'N/A').toUpperCase()}</div>
                    {order.troco && (
                        <div><strong>Troco para:</strong> R$ {order.troco}</div>
                    )}
                </div>
            </div>

            {/* Status do Pedido */}
            <div className="order-status">
                <div className="section-title">STATUS</div>
                <div className="status-value">{(order.status || 'N/A').toUpperCase()}</div>
            </div>

            {/* Rodapé */}
            <div className="footer">
                <div className="divider"></div>
                <div className="footer-text">
                    <div>Obrigado pela preferência!</div>
                    <div>Rei dos Salgados</div>
                    <div>WhatsApp: (84) 99872-9126</div>
                </div>
            </div>

            {/* Botão de Impressão (visível apenas na tela) */}
            <div className="print-button-container">
                <button onClick={() => window.print()} className="print-button">
                    🖨️ Imprimir Pedido
                </button>
                <button onClick={() => window.close()} className="close-button">
                    ❌ Fechar
                </button>
            </div>

            <style jsx>{`
                .print-container {
                    width: 80mm;
                    max-width: 80mm;
                    margin: 0 auto;
                    padding: 5mm;
                    font-family: 'Courier New', monospace;
                    font-size: 12px;
                    line-height: 1.2;
                    background: white;
                    color: black;
                }

                .debug-info {
                    background: yellow;
                    padding: 10px;
                    margin: 10px 0;
                    font-size: 10px;
                    border: 1px solid red;
                }

                .header {
                    text-align: center;
                    margin-bottom: 10px;
                    border-bottom: 1px dashed #000;
                    padding-bottom: 10px;
                }

                .logo h1 {
                    font-size: 16px;
                    font-weight: bold;
                    margin: 0;
                    text-transform: uppercase;
                }

                .order-info {
                    margin-top: 5px;
                }

                .order-number {
                    font-size: 14px;
                    font-weight: bold;
                }

                .order-date {
                    font-size: 10px;
                    color: #666;
                }

                .section-title {
                    font-weight: bold;
                    text-transform: uppercase;
                    border-bottom: 1px solid #000;
                    margin: 10px 0 5px 0;
                    font-size: 11px;
                }

                .customer-info, .address-info, .order-items, .observations, .financial-summary, .payment-info, .order-status {
                    margin-bottom: 10px;
                }

                .customer-details, .address-details, .payment-details {
                    font-size: 11px;
                    line-height: 1.3;
                }

                .delivery-fee {
                    margin-top: 5px;
                    color: #000;
                }

                .observations-text {
                    font-size: 11px;
                    line-height: 1.3;
                    font-style: italic;
                }

                .item {
                    margin-bottom: 8px;
                    padding-bottom: 5px;
                    border-bottom: 1px dotted #ccc;
                }

                .item-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    font-weight: bold;
                }

                .item-quantity {
                    min-width: 20px;
                }

                .item-name {
                    flex: 1;
                    margin: 0 5px;
                }

                .item-price {
                    text-align: right;
                    min-width: 50px;
                }

                .item-detail {
                    font-size: 10px;
                    color: #666;
                    margin-left: 25px;
                    margin-top: 2px;
                }

                .summary-line {
                    display: flex;
                    justify-content: space-between;
                    margin: 3px 0;
                }

                .summary-line.total {
                    font-weight: bold;
                    font-size: 14px;
                    border-top: 1px solid #000;
                    padding-top: 5px;
                    margin-top: 5px;
                }

                .status-value {
                    font-weight: bold;
                    font-size: 14px;
                    text-align: center;
                    padding: 5px;
                    background: #f0f0f0;
                    border: 1px solid #000;
                }

                .footer {
                    margin-top: 15px;
                    text-align: center;
                }

                .divider {
                    border-top: 1px dashed #000;
                    margin: 10px 0;
                }

                .footer-text {
                    font-size: 10px;
                    line-height: 1.4;
                }

                .print-button-container {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    z-index: 1000;
                }

                .print-button, .close-button {
                    padding: 10px 15px;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: bold;
                }

                .print-button {
                    background: #007bff;
                    color: white;
                }

                .close-button {
                    background: #dc3545;
                    color: white;
                }

                .print-button:hover {
                    background: #0056b3;
                }

                .close-button:hover {
                    background: #c82333;
                }

                .loading, .error {
                    text-align: center;
                    padding: 50px 20px;
                    font-size: 16px;
                }

                .error {
                    color: red;
                }

                @media print {
                    .print-button-container, .debug-info {
                        display: none;
                    }
                    
                    .print-container {
                        width: 100%;
                        max-width: none;
                        margin: 0;
                        padding: 0mm !important;
                        box-sizing: border-box;
                    }

                    /* Remover cabeçalho e rodapé do navegador na impressão */
                    @page {
                        margin: 0;
                        size: 80mm auto;
                    }

                    body {
                        margin: 0;
                        padding: 0;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }

                    /* Ocultar elementos do navegador */
                    header, footer, nav, aside {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
} 