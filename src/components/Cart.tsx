// src/components/Cart.tsx

'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../contexts/CartContext';
import { CartItem } from '../types/cart';

interface CartProps {
    onClose: () => void;
    onCheckout: (orderDetails: any) => void;
}

// Componentes auxiliares para o formulário com o CSS correto
const InputField = (props: any) => (
    <div>
        <label className="text-sm text-gray-400">{props.label || ' '}</label>
        <input {...props} className="w-full bg-gray-800 border border-gray-700 rounded p-2 mt-1 text-white placeholder-gray-500" />
    </div>
);
const SelectField = (props: any) => (
    <div>
        <label className="text-sm text-gray-400">{props.label}</label>
        <select {...props} className="w-full bg-gray-800 border border-gray-700 rounded p-2 mt-1 text-white">
            {props.children}
        </select>
    </div>
);

export default function Cart({ onClose, onCheckout }: CartProps) {
    const { items, updateQuantity, removeFromCart } = useCart();
    
    // Todo o seu estado de formulário permanece o mesmo
    const [cliente, setCliente] = useState({ nome: '', telefone: '' });
    const [address, setAddress] = useState({ street: '', number: '', complement: '', neighborhood: '', referencePoint: '' });
    const [tipoEntrega, setTipoEntrega] = useState<'entrega' | 'retirada'>('entrega');
    const [formaPagamento, setFormaPagamento] = useState('');
    const [troco, setTroco] = useState('');
    const [observacoes, setObservacoes] = useState('');
    const [deliveryFees, setDeliveryFees] = useState<{ neighborhood: string; fee: number }[]>([]);
    
    useEffect(() => {
        // Carrega dados salvos e taxas de entrega
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

    const calculateItemPrice = (item: CartItem) => item.price * item.quantity;
    const subtotal = items.reduce((total, item) => total + calculateItemPrice(item), 0);
    const deliveryFee = tipoEntrega === 'entrega' ? (deliveryFees.find(f => f.neighborhood === address.neighborhood)?.fee || 0) : 0;
    const total = subtotal + deliveryFee;

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onCheckout({ items, total, tipoEntrega, address, cliente, formaPagamento, troco, observacoes });
    };

    return (
        // O container principal agora cobre a tela inteira
        <motion.div
            className="fixed inset-0 z-50"
            initial="hidden"
            animate="visible"
            exit="hidden"
        >
            {/* Overlay escuro que fecha a sidebar ao ser clicado */}
            <motion.div
                className="absolute inset-0 bg-black/60"
                variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
                transition={{ duration: 0.3 }}
                onClick={onClose}
            />
            
            {/* A Sidebar em si, que desliza da direita */}
            <motion.div
                className="absolute top-0 right-0 h-full w-full max-w-md bg-gray-900 shadow-xl flex flex-col border-l border-yellow-500/20"
                variants={{ hidden: { x: '100%' }, visible: { x: '0%' } }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
                <div className="flex-shrink-0 p-6 flex justify-between items-center border-b border-gray-800">
                    <h2 className="text-xl font-bold text-white">Seu Pedido</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700">&times;</button>
                </div>

                {items.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center"><p className="text-gray-400">Seu carrinho está vazio.</p></div>
                ) : (
                    <form onSubmit={handleFormSubmit} className="flex-1 flex flex-col min-h-0">
                        {/* Seção de Itens com rolagem */}
                        <div className="p-6 space-y-4 overflow-y-auto max-h-[30vh] scrollbar-thin scrollbar-thumb-yellow-500 scrollbar-track-gray-800">
                            {items.map(item => (
                                <div key={item._id} className="flex flex-col p-4 bg-gray-800 rounded-lg">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1 mr-4">
                                            <h3 className="font-semibold text-white">{item.name}</h3>
                                            <p className="text-xs text-gray-400">{item.extras?.join(', ') || item.observation || item.size}</p>
                                        </div>
                                        <p className="font-semibold text-white whitespace-nowrap">R$ {calculateItemPrice(item).toFixed(2)}</p>
                                    </div>
                                    <div className="flex justify-between items-center mt-3">
                                        <div className="flex items-center gap-3">
                                            <button type="button" onClick={() => updateQuantity(item._id, item.quantity - 1)} className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-700 hover:bg-gray-600">-</button>
                                            <span>{item.quantity}</span>
                                            <button type="button" onClick={() => updateQuantity(item._id, item.quantity + 1)} className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-700 hover:bg-gray-600">+</button>
                                        </div>
                                        <button type="button" onClick={() => removeFromCart(item._id)} className="text-xs text-red-400 hover:text-red-500">Remover</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {/* Seção do Formulário com rolagem */}
                        <div className="overflow-y-auto p-6 space-y-4 border-t border-gray-800">
                            <InputField label="Nome" value={cliente.nome} onChange={(e:any) => setCliente({...cliente, nome: e.target.value})} required />
                            <InputField label="Telefone" type="tel" value={cliente.telefone} onChange={(e:any) => setCliente({...cliente, telefone: e.target.value})} required />
                            <SelectField label="Tipo de Entrega" value={tipoEntrega} onChange={(e:any) => setTipoEntrega(e.target.value as any)}>
                                <option value="entrega">Entrega</option><option value="retirada">Retirada</option>
                            </SelectField>
                            {tipoEntrega === 'entrega' && (
                                <>
                                    <SelectField label="Bairro" value={address.neighborhood} onChange={(e:any) => setAddress({...address, neighborhood: e.target.value})} required>
                                        <option value="">Selecione...</option>
                                        {deliveryFees.map(f => <option key={f.neighborhood} value={f.neighborhood}>{f.neighborhood} - R$ {f.fee.toFixed(2)}</option>)}
                                    </SelectField>
                                    <InputField label="Rua" value={address.street} onChange={(e:any) => setAddress({...address, street: e.target.value})} required />
                                    <div className="grid grid-cols-2 gap-4">
                                        <InputField placeholder="Número" value={address.number} onChange={(e:any) => setAddress({...address, number: e.target.value})} required/>
                                        <InputField placeholder="Complemento" value={address.complement} onChange={(e:any) => setAddress({...address, complement: e.target.value})} />
                                    </div>
                                    <InputField label="Ponto de Referência" value={address.referencePoint} onChange={(e:any) => setAddress({...address, referencePoint: e.target.value})} />
                                </>
                            )}
                            <SelectField label="Forma de Pagamento" value={formaPagamento} onChange={(e:any) => setFormaPagamento(e.target.value)} required>
                                <option value="">Selecione...</option><option value="dinheiro">Dinheiro</option><option value="pix">PIX</option><option value="cartao">Cartão</option>
                            </SelectField>
                            {formaPagamento === 'dinheiro' && <InputField placeholder="Troco para quanto?" value={troco} onChange={(e:any) => setTroco(e.target.value)} />}
                            <div><label className="text-sm text-gray-400">Observações</label><textarea value={observacoes} onChange={(e:any) => setObservacoes(e.target.value)} className="w-full bg-gray-800 border-gray-700 rounded p-2 mt-1 text-white" rows={2}></textarea></div>
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