// src/app/print/[orderId]/page.tsx

'use client';
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Pedido, Address } from '@/types/cart'; 

export default function PrintOrder() {
    const params = useParams();
    const [order, setOrder] = useState<Pedido | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (params?.orderId) {
            fetch(`/api/pedidos/${params.orderId}`)
                .then(res => {
                    if (!res.ok) throw new Error('Pedido não encontrado');
                    return res.json();
                })
                .then(data => {
                    const orderData = data.success ? data.data : data;
                    if (orderData?._id) {
                        setOrder(orderData);
                        setTimeout(() => window.print(), 500);
                    } else {
                        throw new Error('Dados do pedido inválidos');
                    }
                })
                .catch(err => setError(err.message || 'Erro ao carregar pedido.'))
                .finally(() => setLoading(false));
        }
    }, [params?.orderId]);

    const formatDate = (dateString: string) => new Date(dateString).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    
    const getAddressObject = (endereco: any): Address | null => {
        if (!endereco) return null;
        if ('address' in endereco && typeof endereco.address === 'object') return endereco.address;
        return endereco as Address; 
    };
    
    if (loading) return <div className="print-container">Carregando...</div>;
    if (error) return <div className="print-container error">Erro: {error}</div>;
    if (!order) return <div className="print-container error">Pedido não encontrado.</div>;

    const deliveryFee = order.endereco?.deliveryFee || 0;
    const addr = getAddressObject(order.endereco);

    return (
        <div className="print-container">
            <div className="header"><h1>REI DOS SALGADOS</h1></div>
            <div className="divider"></div>
            <div className="order-info">
                <h2>CUPOM NÃO FISCAL</h2>
                <div className="info-grid">
                    <span>PEDIDO:</span> <strong>#{(order._id || '').slice(-6).toUpperCase()}</strong>
                    <span>DATA:</span> <strong>{formatDate(order.data)}</strong>
                    <span>TIPO:</span> <strong>{order.tipoEntrega?.toUpperCase()}</strong>
                </div>
            </div>
            <div className="divider"></div>
            <div className="customer-info">
                <h3>DADOS DO CLIENTE</h3>
                <div className="info-grid">
                    <span>NOME:</span> <p>{order.cliente.nome}</p>
                    <span>FONE:</span> <p>{order.cliente.telefone}</p>
                    {order.tipoEntrega === 'entrega' && addr && (
                        <>
                            <span>BAIRRO:</span> <p>{addr.neighborhood || 'Não informado'}</p>
                            <span>ENDEREÇO:</span> <p>{`${addr.street || ''}, ${addr.number || ''}${addr.complement ? ` - ${addr.complement}` : ''}`}</p>
                            {addr.referencePoint && (<><span>REF:</span> <p>{addr.referencePoint}</p></>)}
                        </>
                    )}
                </div>
            </div>
            <div className="divider dashed"></div>
            <div className="items">
                <h3>ITENS DO PEDIDO</h3>
                <table>
                    <thead><tr><th>QTD</th><th>DESCRIÇÃO</th><th className="right">TOTAL</th></tr></thead>
                    <tbody>
                        {order.itens.map((item, index) => (
                            <tr key={index}>
                                <td className="center">{item.quantidade}x</td>
                                <td>
                                    {item.nome}
                                    {item.size && <div className="item-detail">Tamanho: {item.size}</div>}
                                    {item.border && <div className="item-detail">Borda: {item.border}</div>}
                                    {item.extras && item.extras.length > 0 && <div className="item-detail">Extras: {item.extras.join(', ')}</div>}
                                    {item.observacao && <div className="item-detail">Obs: {item.observacao}</div>}
                                </td>
                                <td className="right">R$ {(item.preco * item.quantidade).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {order.observacoes && (
                <><div className="divider dashed"></div><div className="order-notes"><h3>OBSERVAÇÕES GERAIS</h3><p>{order.observacoes}</p></div></>
            )}
            <div className="divider dashed"></div>
            <div className="totals">
                <div className="total-grid">
                    <span>Subtotal:</span> <span className="right">R$ {(order.total - deliveryFee).toFixed(2)}</span>
                    {deliveryFee > 0 && (
                        <><span>Taxa de Entrega:</span> <span className="right">R$ {deliveryFee.toFixed(2)}</span></>
                    )}
                    <strong className="total-label">Total a Pagar:</strong> <strong className="total-value right">R$ {order.total.toFixed(2)}</strong>
                </div>
            </div>
            <div className="divider"></div>
            <div className="payment-info">
                <h3>PAGAMENTO</h3>
                <div className="info-grid">
                    <span>FORMA:</span> <strong>{order.formaPagamento.toUpperCase()}</strong>
                    {order.formaPagamento === 'dinheiro' && order.troco && (<><span>TROCO P/:</span> <strong>R$ {order.troco}</strong></>)}
                </div>
            </div>
            <div className="footer"><p>Obrigado pela preferência!</p></div>
            <style jsx>{`
                .print-container { font-family: 'Courier New', monospace; width: 80mm; padding: 3mm; box-sizing: border-box; font-size: 10px; background: white; color: black; }
                .header, .footer, .order-info { text-align: center; } h1 { font-size: 14px; font-weight: bold; margin: 0; } h2 { font-size: 11px; font-weight: bold; margin: 5px 0; border-top: 1px dashed black; border-bottom: 1px dashed black; padding: 2px 0; }
                h3 { font-size: 11px; font-weight: bold; margin: 8px 0 4px 0; } p { margin: 1px 0; } .divider { border-top: 1px solid black; margin: 5px 0; }
                .divider.dashed { border-top-style: dashed; } .info-grid { display: grid; grid-template-columns: 60px 1fr; gap: 1px 5px; } .info-grid span { font-weight: bold; }
                .info-grid p { margin: 0; word-break: break-word; } table { width: 100%; border-collapse: collapse; margin-top: 5px; } th, td { padding: 2px 0; vertical-align: top; }
                th { text-align: left; border-bottom: 1px dashed black; } .item-detail { font-size: 9px; color: #333; padding-left: 5px; } .totals { margin-top: 10px; }
                .total-grid { display: grid; grid-template-columns: 1fr auto; gap: 2px; } .total-label, .total-value { font-size: 12px; margin-top: 5px; }
                .center { text-align: center; vertical-align: middle; } .right { text-align: right; } .error { color: red; text-align: center; padding: 20px; }
            `}</style>
        </div>
    );
}