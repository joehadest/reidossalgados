// src/app/print/[orderId]/page.tsx

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
        address?: {
            street: string;
            number: string;
            complement?: string;
            neighborhood: string;
            referencePoint?: string;
        };
        deliveryFee?: number;
        estimatedTime?: string;
    }; 
    itens: OrderItem[]; 
    total: number; 
    formaPagamento: string;
    tipoEntrega: string; 
    troco?: string; 
    data: string; 
    status: string; 
    observacoes?: string;
}

export default function PrintOrder() {
    const params = useParams();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (params?.orderId) {
            console.log('Buscando pedido com ID:', params.orderId);
            fetch(`/api/pedidos/${params.orderId}`)
                .then(res => {
                    console.log('Status da resposta:', res.status);
                    console.log('Headers da resposta:', res.headers);
                    return res.json();
                })
                .then(data => {
                    console.log('Dados recebidos:', data);
                    if (data._id) {
                        setOrder(data);
                        // Auto-print após carregar os dados
                        setTimeout(() => {
                            console.log('Iniciando impressão automática...');
                            window.print();
                        }, 1000);
                    } else {
                        console.error('Pedido não encontrado nos dados:', data);
                        setError('Pedido não encontrado');
                    }
                })
                .catch((err) => {
                    console.error('Erro ao buscar pedido:', err);
                    setError('Erro ao carregar pedido');
                })
                .finally(() => setLoading(false));
        }
    }, [params?.orderId]);

    const handlePrint = () => {
        window.print();
    };

    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleString('pt-BR');
        } catch {
            return dateString;
        }
    };

    const formatAddress = (endereco: any) => {
        if (!endereco) return 'Retirada no local';
        
        if (endereco.address) {
            const addr = endereco.address;
            return `${addr.street}, ${addr.number}${addr.complement ? ` - ${addr.complement}` : ''}, ${addr.neighborhood}`;
        }
        
        return 'Endereço não especificado';
    };

    const calcularTotal = (order: Order) => {
        const subtotal = order.itens.reduce((acc, item) => acc + item.preco * item.quantidade, 0);
        return subtotal + (order.endereco?.deliveryFee || 0);
    };

    if (loading) return (
        <div className="print-container">
            <div className="text-center py-8">Carregando pedido...</div>
        </div>
    );

    if (error || !order) return (
        <div className="print-container">
            <div className="text-center py-8 text-red-600">
                {error || 'Pedido não encontrado'}
            </div>
        </div>
    );

    const addr = order.endereco?.address || order.endereco;

    return (
        <div className="print-container">
            {/* Botão de impressão - visível apenas na tela */}
            <div className="no-print print-button">
                <button 
                    onClick={handlePrint}
                    className="bg-blue-600 text-white px-4 py-2 rounded mb-4"
                >
                    Imprimir Pedido
                </button>
            </div>

            <div className="header">
                <h1>REI DOS SALGADOS</h1>
                <div className="order-info">
                    <div>PEDIDO #{(order._id || '').slice(-6)}</div>
                    <div>{formatDate(order.data)}</div>
                </div>
            </div>

            <div className="customer-info">
                <h2>CLIENTE</h2>
                <p><strong>Nome:</strong> {order.cliente.nome}</p>
                <p><strong>Telefone:</strong> {order.cliente.telefone}</p>
                {order.tipoEntrega === 'entrega' && (
                    <p><strong>Endereço:</strong> {formatAddress(order.endereco)}</p>
                )}
                <p><strong>Tipo:</strong> {order.tipoEntrega === 'entrega' ? 'Entrega' : 'Retirada'}</p>
            </div>

            <div className="payment-info">
                <h2>PAGAMENTO</h2>
                <p><strong>Forma:</strong> {order.formaPagamento}</p>
                {order.troco && <p><strong>Troco:</strong> R$ {order.troco}</p>}
            </div>

            <div className="items">
                <h2>ITENS</h2>
                {order.itens.map((item, index) => (
                    <div key={index} className="item">
                        <div className="item-header">
                            <span className="quantity">{item.quantidade}x</span>
                            <span className="name">{item.nome}</span>
                            <span className="price">R$ {(item.preco * item.quantidade).toFixed(2)}</span>
                        </div>
                        {(item.extras && item.extras.length > 0) && (
                            <div className="extras">Extras: {item.extras.join(', ')}</div>
                        )}
                        {item.observacao && (
                            <div className="observation">Obs: {item.observacao}</div>
                        )}
                        {item.size && (
                            <div className="size">Tamanho: {item.size}</div>
                        )}
                        {item.border && (
                            <div className="border">Borda: {item.border}</div>
                        )}
                    </div>
                ))}
            </div>

            {order.observacoes && (
                <div className="order-notes">
                    <h2>OBSERVAÇÕES</h2>
                    <p>{order.observacoes}</p>
                </div>
            )}

            <div className="total">
                <h2>TOTAL: R$ {calcularTotal(order).toFixed(2)}</h2>
                {order.endereco?.deliveryFee && order.endereco.deliveryFee > 0 && (
                    <p className="delivery-fee">Taxa de entrega: R$ {order.endereco.deliveryFee.toFixed(2)}</p>
                )}
            </div>

            <div className="footer">
                <p>Obrigado pela preferência!</p>
                <p>Rei dos Salgados</p>
            </div>

            <style jsx>{`
                .print-container {
                    max-width: 80mm;
                    margin: 0 auto;
                    padding: 10px;
                    font-family: 'Courier New', monospace;
                    font-size: 12px;
                    line-height: 1.2;
                    background: white;
                    color: black;
                }

                .print-button {
                    text-align: center;
                    margin-bottom: 20px;
                }

                .header {
                    text-align: center;
                    border-bottom: 2px solid #000;
                    padding-bottom: 10px;
                    margin-bottom: 15px;
                }

                .header h1 {
                    font-size: 16px;
                    font-weight: bold;
                    margin: 0 0 5px 0;
                }

                .order-info {
                    font-size: 11px;
                }

                .customer-info, .payment-info, .items, .order-notes, .total {
                    margin-bottom: 15px;
                }

                .customer-info h2, .payment-info h2, .items h2, .order-notes h2, .total h2 {
                    font-size: 13px;
                    font-weight: bold;
                    border-bottom: 1px solid #000;
                    padding-bottom: 3px;
                    margin-bottom: 8px;
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
                }

                .quantity {
                    font-weight: bold;
                    margin-right: 5px;
                }

                .name {
                    flex: 1;
                    margin-right: 5px;
                }

                .price {
                    font-weight: bold;
                }

                .extras, .observation, .size, .border {
                    font-size: 10px;
                    color: #666;
                    margin-left: 15px;
                    margin-top: 2px;
                }

                .total {
                    text-align: center;
                    border-top: 2px solid #000;
                    padding-top: 10px;
                }

                .total h2 {
                    font-size: 14px;
                    margin: 0;
                }

                .delivery-fee {
                    font-size: 11px;
                    color: #666;
                    margin-top: 5px;
                }

                .footer {
                    text-align: center;
                    margin-top: 20px;
                    padding-top: 10px;
                    border-top: 1px solid #000;
                    font-size: 11px;
                }

                @media print {
                    @page {
                        margin: 0;
                        size: 80mm auto;
                    }
                    
                    body {
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                        color: black !important;
                    }
                    
                    .print-container {
                        max-width: none;
                        margin: 0;
                        padding: 5px;
                    }

                    .no-print {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
}