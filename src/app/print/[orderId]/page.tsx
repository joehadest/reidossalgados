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
}

export default function PrintOrder() {
    const params = useParams();
    const orderId = params?.orderId as string;
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        console.log('useEffect executado, params:', params);
        
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
                console.log('Dados do pedido recebidos:', data);
                setOrder(data.data || data);
                console.log('Pedido definido no estado');
            } catch (err) {
                console.error('Erro na busca:', err);
                setError('Erro ao carregar pedido');
            } finally {
                setLoading(false);
                console.log('Loading finalizado');
            }
        };

        if (params?.orderId) {
            console.log('Iniciando busca do pedido');
            fetchOrder();
        } else {
            console.log('Params ou orderId não encontrado');
        }
    }, [params?.orderId]);

    useEffect(() => {
        // Auto-print quando a página carrega
        if (order && !loading) {
            setTimeout(() => {
                window.print();
            }, 500);
        }
    }, [order, loading]);

    const calculateItemPrice = (item: OrderItem) => {
        let price = item.preco || 0;

        // Adicionar preço da borda se houver
        if (item.border && item.size) {
            const borderPrice = item.size === 'G' ? 8.00 : 4.00;
            price += borderPrice;
        }

        // Adicionar preços dos extras se houver
        if (item.extras && item.extras.length > 0) {
            // Aqui você precisaria ter acesso aos preços dos extras
            // Por simplicidade, vou assumir um valor fixo
            price += item.extras.length * 2.00; // R$ 2,00 por extra
        }

        return price * (item.quantidade || 1);
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

    const formatPhone = (phone: string) => {
        if (!phone) return 'N/A';
        return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    };

    if (loading) {
        return (
            <div className="print-container">
                <div className="loading">Carregando pedido...</div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="print-container">
                <div className="error">Erro: {error || 'Pedido não encontrado'}</div>
            </div>
        );
    }

    // Log para debugar a estrutura do pedido
    console.log('Estrutura completa do pedido:', order);
    console.log('Cliente:', order.cliente);
    console.log('Itens:', order.itens);

    return (
        <div className="print-container">
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
                    <div><strong>Nome:</strong> {order.cliente?.nome || (order as any).customerName || 'N/A'}</div>
                    <div><strong>Telefone:</strong> {formatPhone(order.cliente?.telefone || (order as any).customerPhone || '')}</div>
                </div>
            </div>

            {/* Endereço (se for entrega) */}
            {((order.tipoEntrega === 'entrega') || (order as any).deliveryType === 'entrega') && (order.endereco || (order as any).customerAddress) && (
                <div className="address-info">
                    <div className="section-title">ENTREGA</div>
                    <div className="address-details">
                        {order.endereco ? (
                            <>
                                <div>{order.endereco.address.street}, {order.endereco.address.number}</div>
                                {order.endereco.address.complement && <div>Complemento: {order.endereco.address.complement}</div>}
                                <div>Bairro: {order.endereco.address.neighborhood}</div>
                                {order.endereco.address.referencePoint && <div>Referência: {order.endereco.address.referencePoint}</div>}
                            </>
                        ) : (
                            <>
                                <div>{(order as any).customerAddress}</div>
                                {(order as any).customerComplement && <div>Complemento: {(order as any).customerComplement}</div>}
                                <div>Bairro: {(order as any).customerNeighborhood}</div>
                                {(order as any).customerReferencePoint && <div>Referência: {(order as any).customerReferencePoint}</div>}
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Itens do Pedido */}
            <div className="order-items">
                <div className="section-title">ITENS</div>
                {order.itens && Array.isArray(order.itens) && order.itens.length > 0 ? (
                    order.itens.map((item: OrderItem, index: number) => (
                        <div key={index} className="item">
                            <div className="item-header">
                                <span className="item-quantity">{item.quantidade}x</span>
                                <span className="item-name">{item.nome}</span>
                                <span className="item-price">R$ {calculateItemPrice(item).toFixed(2)}</span>
                            </div>
                            {item.size && (
                                <div className="item-detail">Tamanho: {item.size}</div>
                            )}
                            {item.observacao && (
                                <div className="item-detail">Obs: {item.observacao}</div>
                            )}
                            {item.border && (
                                <div className="item-detail">Borda: {item.border}</div>
                            )}
                            {item.extras && item.extras.length > 0 && (
                                <div className="item-detail">Extras: {item.extras.join(', ')}</div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="item-detail">Nenhum item encontrado</div>
                )}
            </div>

            {/* Resumo Financeiro */}
            <div className="financial-summary">
                <div className="section-title">RESUMO</div>
                <div className="summary-line">
                    <span>Subtotal:</span>
                    <span>R$ {((order.total || 0) - (order.endereco?.deliveryFee || (order as any).deliveryFee || 0)).toFixed(2)}</span>
                </div>
                {(order.endereco?.deliveryFee || (order as any).deliveryFee || 0) > 0 && (
                    <div className="summary-line">
                        <span>Taxa de Entrega:</span>
                        <span>R$ {(order.endereco?.deliveryFee || (order as any).deliveryFee || 0).toFixed(2)}</span>
                    </div>
                )}
                <div className="summary-line total">
                    <span>TOTAL:</span>
                    <span>R$ {(order.total || 0).toFixed(2)}</span>
                </div>
            </div>

            {/* Informações de Pagamento */}
            <div className="payment-info">
                <div className="section-title">PAGAMENTO</div>
                <div className="payment-details">
                    <div><strong>Forma:</strong> {(order.formaPagamento || (order as any).paymentMethod || 'N/A').toUpperCase()}</div>
                    <div><strong>Tipo:</strong> {(order.tipoEntrega || (order as any).deliveryType || 'N/A').toUpperCase()}</div>
                    {(order.troco || (order as any).troco) && (
                        <div><strong>Troco para:</strong> R$ {order.troco || (order as any).troco}</div>
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

                .customer-info, .address-info, .order-items, .financial-summary, .payment-info, .order-status {
                    margin-bottom: 10px;
                }

                .customer-details, .address-details, .payment-details {
                    font-size: 11px;
                    line-height: 1.3;
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

                /* Estilos para impressão */
                @media print {
                    .print-button-container {
                        display: none;
                    }

                    .print-container {
                        width: 80mm;
                        max-width: 80mm;
                        margin: 0;
                        padding: 0;
                    }

                    body {
                        margin: 0;
                        padding: 0;
                    }

                    @page {
                        size: 80mm auto;
                        margin: 0;
                    }
                }
            `}</style>
        </div>
    );
} 