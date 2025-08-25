// src/app/print/[orderId]/page.tsx

'use client';
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Pedido } from '@/types/cart'; // Importa a tipagem do pedido

export default function PrintOrder() {
    const params = useParams();
    const [order, setOrder] = useState<Pedido | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params?.orderId) {
            fetch(`/api/pedidos/${params.orderId}`)
                .then(res => res.json())
                .then(data => {
                    // Lida com a resposta da API, que pode ter o pedido dentro de um campo "data"
                    const orderData = data.success ? data.data : data;
                    if (orderData?._id) {
                        setOrder(orderData);
                        // Dispara a impressão automaticamente após um pequeno delay
                        setTimeout(() => window.print(), 500);
                    } else {
                        setOrder(null);
                    }
                })
                .catch(() => setOrder(null))
                .finally(() => setLoading(false));
        }
    }, [params?.orderId]);

    const formatDate = (dateString: string) => new Date(dateString).toLocaleString('pt-BR');
    
    // **FUNÇÃO DE FORMATAÇÃO DE ENDEREÇO CORRIGIDA**
    const formatAddress = (endereco: any) => {
        if (!endereco) return 'Retirada no local';
        
        // Prioriza a estrutura nova (endereco.address), mas funciona com a antiga (endereco)
        const addr = endereco.address || endereco;
        
        if (addr.street && addr.number && addr.neighborhood) {
            return `${addr.street}, ${addr.number}${addr.complement ? ` - ${addr.complement}` : ''}, ${addr.neighborhood}`;
        }
        
        return 'Endereço não especificado';
    };
    
    if (loading) return <div className="print-container">Carregando pedido para impressão...</div>;
    if (!order) return <div className="print-container error">Erro: Pedido não encontrado.</div>;
    
    return (
        <div className="print-container">
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
                <p><strong>Tipo:</strong> {order.tipoEntrega === 'entrega' ? 'ENTREGA' : 'RETIRADA'}</p>
                {order.tipoEntrega === 'entrega' && (
                    <p><strong>Endereço:</strong> {formatAddress(order.endereco)}</p>
                )}
            </div>

            <div className="payment-info">
                <h2>PAGAMENTO</h2>
                <p><strong>Forma:</strong> {order.formaPagamento}</p>
                {order.troco && <p><strong>Troco para:</strong> R$ {order.troco}</p>}
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
                        <div className="details">
                            {item.size && <span>Tamanho: {item.size} | </span>}
                            {item.border && <span>Borda: {item.border} | </span>}
                            {item.extras && item.extras.length > 0 && <span>Extras: {item.extras.join(', ')}</span>}
                            {item.observacao && <div className="observation">Obs: {item.observacao}</div>}
                        </div>
                    </div>
                ))}
            </div>

            {order.observacoes && (
                <div className="order-notes">
                    <h2>OBSERVAÇÕES DO PEDIDO</h2>
                    <p>{order.observacoes}</p>
                </div>
            )}

            <div className="total">
                <h2>TOTAL: R$ {order.total.toFixed(2)}</h2>
            </div>

            <div className="footer">
                <p>Obrigado pela preferência!</p>
            </div>

            {/* O seu CSS <style jsx> original continua aqui */}
            <style jsx>{`
                /* ... seu CSS completo para impressão ... */
            `}</style>
        </div>
    );
}