// src/components/Cart.tsx

'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useCart } from '../contexts/CartContext';
import { CartItem } from '../types/cart';

interface CartProps {
    onClose: () => void;
    onCheckout: (orderDetails: any) => void;
}

const calculateUnitPrice = (item: CartItem): number => item.price;
const calculateItemPrice = (item: CartItem) => calculateUnitPrice(item) * item.quantity;

export default function Cart({ onClose, onCheckout }: CartProps) {
    const { items, updateQuantity, removeFromCart } = useCart();

    const [cliente, setCliente] = useState({ nome: '', telefone: '' });
    const [address, setAddress] = useState({ street: '', number: '', complement: '', neighborhood: '', referencePoint: '' });
    const [tipoEntrega, setTipoEntrega] = useState<'entrega' | 'retirada'>('entrega');
    const [formaPagamento, setFormaPagamento] = useState('');
    const [troco, setTroco] = useState('');
    const [observacoes, setObservacoes] = useState('');
    const [deliveryFees, setDeliveryFees] = useState<{ neighborhood: string; fee: number }[]>([]);

    useEffect(() => {
        setCliente({ nome: localStorage.getItem('customerName') || '', telefone: localStorage.getItem('customerPhone') || '' });
        setAddress({
            street: localStorage.getItem('customerStreet') || '',
            number: localStorage.getItem('customerNumber') || '',
            complement: localStorage.getItem('customerComplement') || '',
            neighborhood: localStorage.getItem('customerNeighborhood') || '',
            referencePoint: localStorage.getItem('customerReferencePoint') || ''
        });
        setTipoEntrega((localStorage.getItem('tipoEntrega') as any) || 'entrega');

        async function fetchDeliveryFees() {
            try {
                const res = await fetch('/api/settings');
                const data = await res.json();
                if (data.success && data.data) setDeliveryFees(data.data.deliveryFees || []);
            } catch (err) { console.error('Erro ao buscar taxas:', err); }
        }
        fetchDeliveryFees();
    }, []);

    const calculateDeliveryFee = (neighborhood: string) => {
        if (tipoEntrega === 'retirada') return 0;
        const feeInfo = deliveryFees.find(fee => fee.neighborhood === neighborhood);
        return feeInfo ? feeInfo.fee : 0;
    };

    const subtotal = items.reduce((total, item) => total + calculateItemPrice(item), 0);
    const deliveryFee = calculateDeliveryFee(address.neighborhood);
    const total = subtotal + deliveryFee;

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        localStorage.setItem('customerName', cliente.nome);
        localStorage.setItem('customerPhone', cliente.telefone);
        localStorage.setItem('tipoEntrega', tipoEntrega);
        if (tipoEntrega === 'entrega') {
            localStorage.setItem('customerStreet', address.street);
            localStorage.setItem('customerNumber', address.number);
            localStorage.setItem('customerComplement', address.complement);
            localStorage.setItem('customerNeighborhood', address.neighborhood);
            localStorage.setItem('customerReferencePoint', address.referencePoint);
        }

        onCheckout({
            itens: items, 
            total, 
            tipoEntrega, 
            address, 
            cliente, 
            formaPagamento, 
            troco, 
            observacoes,
            deliveryFee: deliveryFee
        });
    };

    return (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div
                className="bg-gray-900 rounded-xl shadow-xl max-w-md w-full text-gray-200 border border-yellow-500/50 relative max-h-[90vh] flex flex-col"
                initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
            >
                <div className="flex-shrink-0 p-6 flex justify-between items-center border-b border-gray-800">
                    <h2 className="text-xl font-bold text-white">Seu Pedido</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700">&times;</button>
                </div>

                {items.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-gray-400 text-center py-8">Seu carrinho está vazio.</p>
                    </div>
                ) : (
                    <form onSubmit={handleFormSubmit} className="flex-1 flex flex-col min-h-0">
                        {/* SEÇÃO DOS ITENS COM ROLAGEM */}
                        <div className="p-6 space-y-3 overflow-y-auto max-h-[25vh] scrollbar-thin scrollbar-thumb-yellow-500 scrollbar-track-gray-800">
                            {items.map(item => (
                                <div key={item._id} className="flex flex-col p-3 bg-gray-800 rounded-lg">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-white">{item.name}</h3>
                                            <p className="text-xs text-gray-400">{item.extras?.join(', ') || item.observation || item.size}</p>
                                        </div>
                                        <p className="font-semibold text-white">R$ {calculateItemPrice(item).toFixed(2)}</p>
                                    </div>
                                    <div className="flex justify-between items-center mt-2">
                                        <div className="flex items-center gap-2">
                                            <button type="button" onClick={() => updateQuantity(item._id, item.quantity - 1)} className="p-1 rounded-full bg-gray-700 hover:bg-gray-600">-</button>
                                            <span>{item.quantity}</span>
                                            <button type="button" onClick={() => updateQuantity(item._id, item.quantity + 1)} className="p-1 rounded-full bg-gray-700 hover:bg-gray-600">+</button>
                                        </div>
                                        <button type="button" onClick={() => removeFromCart(item._id)} className="text-xs text-red-400 hover:text-red-500">Remover</button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* SEÇÃO DO FORMULÁRIO COM ROLAGEM */}
                        <div className="overflow-y-auto p-6 space-y-4 border-t border-gray-800">
                            {/* CSS CORRIGIDO PARA TODOS OS CAMPOS ABAIXO */}
                            <div>
                                <label className="text-sm text-gray-400">Nome</label>
                                <input type="text" value={cliente.nome} onChange={e => setCliente({ ...cliente, nome: e.target.value })} className="w-full bg-gray-800 border-gray-700 rounded p-2 mt-1 text-white" required />
                            </div>
                            <div>
                                <label className="text-sm text-gray-400">Telefone</label>
                                <input type="tel" value={cliente.telefone} onChange={e => setCliente({ ...cliente, telefone: e.target.value })} className="w-full bg-gray-800 border-gray-700 rounded p-2 mt-1 text-white" required />
                            </div>
                            <div>
                                <label className="text-sm text-gray-400">Tipo de Entrega</label>
                                <select value={tipoEntrega} onChange={e => setTipoEntrega(e.target.value as any)} className="w-full bg-gray-800 border-gray-700 rounded p-2 mt-1 text-white">
                                    <option value="entrega">Entrega</option>
                                    <option value="retirada">Retirada</option>
                                </select>
                            </div>
                            {tipoEntrega === 'entrega' && (
                                <>
                                    <div>
                                        <label className="text-sm text-gray-400">Bairro</label>
                                        <select value={address.neighborhood} onChange={e => setAddress({ ...address, neighborhood: e.target.value })} className="w-full bg-gray-800 border-gray-700 rounded p-2 mt-1 text-white" required>
                                            <option value="">Selecione...</option>
                                            {deliveryFees.map(f => <option key={f.neighborhood} value={f.neighborhood}>{f.neighborhood} - R$ {f.fee.toFixed(2)}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-400">Rua</label>
                                        <input type="text" value={address.street} onChange={e => setAddress({ ...address, street: e.target.value })} className="w-full bg-gray-800 border-gray-700 rounded p-2 mt-1 text-white" required />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input type="text" value={address.number} onChange={e => setAddress({ ...address, number: e.target.value })} placeholder="Número" className="w-full bg-gray-800 border-gray-700 rounded p-2 text-white" required />
                                        <input type="text" value={address.complement} onChange={e => setAddress({ ...address, complement: e.target.value })} placeholder="Complemento" className="w-full bg-gray-800 border-gray-700 rounded p-2 text-white" />
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-400">Ponto de Referência</label>
                                        <input type="text" value={address.referencePoint} onChange={e => setAddress({ ...address, referencePoint: e.target.value })} className="w-full bg-gray-800 border-gray-700 rounded p-2 mt-1 text-white" />
                                    </div>
                                </>
                            )}
                            <div>
                                <label className="text-sm text-gray-400">Forma de Pagamento</label>
                                <select value={formaPagamento} onChange={e => setFormaPagamento(e.target.value)} className="w-full bg-gray-800 border-gray-700 rounded p-2 mt-1 text-white" required>
                                    <option value="">Selecione...</option>
                                    <option value="dinheiro">Dinheiro</option>
                                    <option value="pix">PIX</option>
                                    <option value="cartao">Cartão</option>
                                </select>
                            </div>
                            {formaPagamento === 'dinheiro' && <div><input type="text" value={troco} onChange={e => setTroco(e.target.value)} placeholder="Troco para quanto?" className="w-full bg-gray-800 border-gray-700 rounded p-2 text-white" /></div>}
                            <div>
                                <label className="text-sm text-gray-400">Observações</label>
                                <textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} className="w-full bg-gray-800 border-gray-700 rounded p-2 mt-1 text-white" rows={2}></textarea>
                            </div>
                        </div>

                        <div className="flex-shrink-0 p-6 border-t border-gray-800 space-y-3">
                            <div className="flex justify-between font-semibold"><p>Subtotal:</p> <p>R$ {subtotal.toFixed(2)}</p></div>
                            {tipoEntrega === 'entrega' && <div className="flex justify-between text-gray-400"><p>Taxa de entrega:</p> <p>R$ {deliveryFee.toFixed(2)}</p></div>}
                            <div className="flex justify-between font-bold text-lg mt-1"><p>Total:</p> <p>R$ {total.toFixed(2)}</p></div>
                            <button type="submit" className="w-full bg-yellow-500 text-gray-900 font-bold py-3 rounded-lg hover:bg-yellow-400">Enviar Pedido</button>
                        </div>
                    </form>
                )}
            </motion.div>
        </motion.div>
    );
}