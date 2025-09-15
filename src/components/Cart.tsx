// src/components/Cart.tsx

'use client';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../contexts/CartContext';
import { CartItem } from '../types/cart';
import { FaArrowRight, FaArrowLeft } from 'react-icons/fa';

interface CartProps {
    onClose: () => void;
    onCheckout: (orderDetails: any) => void;
}

// Componentes auxiliares (sem alteração)
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
    
    // Novo estado para controlar a aba/etapa atual
    const [step, setStep] = useState<'items' | 'details'>('items');

    // Estados do formulário (sem alteração)
    const [cliente, setCliente] = useState({ nome: '', telefone: '' });
    const [address, setAddress] = useState({ street: '', number: '', complement: '', neighborhood: '', referencePoint: '' });
    const [tipoEntrega, setTipoEntrega] = useState<'entrega' | 'retirada'>('entrega');
    const [formaPagamento, setFormaPagamento] = useState('');
    const [troco, setTroco] = useState('');
    const [observacoes, setObservacoes] = useState('');
    const [deliveryFees, setDeliveryFees] = useState<{ neighborhood: string; fee: number }[]>([]);
    const [feesLoading, setFeesLoading] = useState(false);

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
            setFeesLoading(true);
            try {
                const res = await fetch('/api/settings');
                const data = await res.json();
                if (data.success && data.data) setDeliveryFees(data.data.deliveryFees || []);
            } catch (err) { console.error('Erro ao buscar taxas:', err); }
            finally { setFeesLoading(false); }
        }
        fetchDeliveryFees();
    }, []);

    const calculateItemPrice = (item: CartItem) => item.price * item.quantity;
    const subtotal = items.reduce((total, item) => total + calculateItemPrice(item), 0);
    const deliveryFee = tipoEntrega === 'entrega' ? (deliveryFees.find(f => f.neighborhood === address.neighborhood)?.fee || 0) : 0;
    const total = subtotal + deliveryFee;

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onCheckout({ items, total, tipoEntrega, address, cliente, formaPagamento, troco, observacoes, deliveryFee });
    };

    const isCheckoutDisabled = tipoEntrega === 'entrega' && (!address.neighborhood || feesLoading);

    const closeButtonRef = useRef<HTMLButtonElement | null>(null);

    useEffect(() => {
        // Focar botão de fechar ao abrir para acessibilidade
        closeButtonRef.current?.focus();
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    return (
        <motion.div
            className="fixed inset-0 z-50"
            role="dialog"
            aria-modal="true"
            aria-label="Carrinho de compras"
            initial="hidden" animate="visible" exit="hidden"
        >
            <motion.button
                aria-label="Fechar carrinho"
                className="absolute inset-0 w-full h-full cursor-default bg-black/60 backdrop-blur-[1px] focus:outline-none"
                variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
                transition={{ duration: 0.25 }}
                onClick={onClose}
            />
            <motion.div
                className="absolute top-0 right-0 h-full w-full max-w-md bg-gradient-to-b from-gray-900 to-gray-950 flex flex-col border-l border-yellow-500/20 shadow-glow"
                variants={{ hidden: { x: '100%' }, visible: { x: '0%' } }}
                transition={{ type: 'spring', stiffness: 270, damping: 28 }}
            >
                {/* Header */}
                <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-gray-800/70 bg-gray-900/60 backdrop-blur supports-[backdrop-filter]:bg-gray-900/40">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-lg font-bold tracking-wide text-white flex items-center gap-2">
                                {step === 'items' ? 'Seu Carrinho' : 'Detalhes da Entrega'}
                            </h2>
                            <p className="text-[11px] uppercase tracking-wider text-gray-500 mt-1">
                                {step === 'items' ? 'Revise os itens antes de continuar' : 'Preencha os dados para finalizar'}
                            </p>
                        </div>
                        <button
                            ref={closeButtonRef}
                            onClick={onClose}
                            className="p-2 -mr-2 -mt-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        >
                            <span aria-hidden>&times;</span>
                        </button>
                    </div>
                    {items.length > 0 && (
                        <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                            <span>{items.reduce((sum, i) => sum + i.quantity, 0)} itens</span>
                            <span className="font-medium text-gray-300">Subtotal R$ {subtotal.toFixed(2)}</span>
                        </div>
                    )}
                </div>

                {items.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center px-6 text-center">
                        <div className="space-y-3">
                            <p className="text-gray-400 text-sm">Seu carrinho está vazio.</p>
                            <button
                                onClick={onClose}
                                className="text-yellow-500 text-xs font-semibold tracking-wide hover:text-yellow-400"
                            >Voltar ao cardápio</button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleFormSubmit} className="flex-1 flex flex-col min-h-0">
                        
                        <AnimatePresence mode="wait">
                            {step === 'items' && (
                                <motion.div
                                    key="items-step"
                                    initial={{ opacity: 0, x: -50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 50 }}
                                    transition={{ duration: 0.3 }}
                                    className="flex-1 flex flex-col min-h-0"
                                >
                                    {/* SEÇÃO DE ITENS COM ROLAGEM */}
                                    <div className="p-5 space-y-4 overflow-y-auto scrollbar-thin scrollbar-thumb-yellow-500/80 scrollbar-track-gray-800/40 flex-1">
                                        {items.map(item => (
                                            <div key={item._id} className="group rounded-lg border border-gray-800 bg-gray-850/40 hover:border-yellow-500/40 transition-colors p-4">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-medium text-sm text-white tracking-wide line-clamp-2 group-hover:text-yellow-400 transition-colors">{item.name}</h3>
                                                        <p className="text-[11px] text-gray-400 mt-1 line-clamp-2">{item.extras?.join(', ') || item.observation || item.size || 'Sem detalhes'}</p>
                                                    </div>
                                                    <p className="font-semibold text-sm text-yellow-400 whitespace-nowrap">R$ {calculateItemPrice(item).toFixed(2)}</p>
                                                </div>
                                                <div className="flex justify-between items-center mt-3">
                                                    <div className="flex items-center gap-2 bg-gray-900 rounded-full px-2 py-1">
                                                        <button type="button" onClick={() => updateQuantity(item._id, item.quantity - 1)} className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-700 hover:bg-gray-600 text-sm" aria-label="Diminuir quantidade">-</button>
                                                        <span className="text-sm w-5 text-center">{item.quantity}</span>
                                                        <button type="button" onClick={() => updateQuantity(item._id, item.quantity + 1)} className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-700 hover:bg-gray-600 text-sm" aria-label="Aumentar quantidade">+</button>
                                                    </div>
                                                    <button type="button" onClick={() => removeFromCart(item._id)} className="text-[11px] font-medium text-red-400 hover:text-red-500 tracking-wide uppercase">Remover</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Footer de ação */}
                                    <div className="flex-shrink-0 p-5 border-t border-gray-800/70 bg-gray-900/70 backdrop-blur supports-[backdrop-filter]:bg-gray-900/40">
                                        <div className="flex items-center justify-between mb-3 text-sm">
                                            <span className="text-gray-400">Itens:</span>
                                            <span className="font-semibold text-gray-200">{items.reduce((s,i)=>s+i.quantity,0)}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setStep('details')}
                                            className="w-full bg-yellow-500 text-gray-900 font-bold py-3 rounded-lg hover:bg-yellow-400 flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/20 active:scale-[0.98] transition"
                                        >
                                            Continuar <FaArrowRight className="text-sm" />
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {step === 'details' && (
                                <motion.div
                                    key="details-step"
                                    initial={{ opacity: 0, x: 50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -50 }}
                                    transition={{ duration: 0.3 }}
                                    className="flex-1 flex flex-col min-h-0"
                                >
                                    {/* SEÇÃO DO FORMULÁRIO COM ROLAGEM */}
                                    <div className="overflow-y-auto p-5 space-y-4 flex-1 scrollbar-thin scrollbar-thumb-yellow-500/80 scrollbar-track-gray-800/40">
                                        <InputField label="Nome" value={cliente.nome} onChange={(e:any) => setCliente({...cliente, nome: e.target.value})} required />
                                        <InputField label="Telefone" type="tel" value={cliente.telefone} onChange={(e:any) => setCliente({...cliente, telefone: e.target.value})} required />
                                        <SelectField label="Tipo de Entrega" value={tipoEntrega} onChange={(e:any) => setTipoEntrega(e.target.value as any)}>
                                            <option value="entrega">Entrega</option><option value="retirada">Retirada</option>
                                        </SelectField>
                                        {tipoEntrega === 'entrega' && (
                                            <>
                                                <SelectField label="Bairro" value={address.neighborhood} onChange={(e:any) => setAddress({...address, neighborhood: e.target.value})} required>
                                                    <option value="">{feesLoading ? 'Carregando...' : 'Selecione...'}</option>
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

                                    {/* RESUMO E BOTÕES DE AÇÃO */}
                                    <div className="flex-shrink-0 p-5 border-t border-gray-800/70 bg-gray-900/80 backdrop-blur space-y-4">
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between"><p className="text-gray-400">Subtotal</p> <p className="font-medium text-gray-200">R$ {subtotal.toFixed(2)}</p></div>
                                            {tipoEntrega === 'entrega' && <div className="flex justify-between"><p className="text-gray-400">Taxa de entrega</p> <p className="font-medium text-gray-200">{feesLoading ? '...' : `R$ ${deliveryFee.toFixed(2)}`}</p></div>}
                                            <div className="flex justify-between pt-2 border-t border-gray-800"><p className="font-semibold text-yellow-400">Total</p> <p className="font-bold text-yellow-400">R$ {total.toFixed(2)}</p></div>
                                        </div>
                                        <div className="flex gap-3">
                                            <button type="button" onClick={() => setStep('items')} className="w-1/3 bg-gray-800 text-white font-semibold py-3 rounded-lg hover:bg-gray-700 border border-gray-700 flex items-center justify-center active:scale-[0.97] transition">
                                                <FaArrowLeft />
                                            </button>
                                            <button type="submit" disabled={isCheckoutDisabled} className="w-2/3 relative bg-yellow-500 text-gray-900 font-bold py-3 rounded-lg hover:bg-yellow-400 disabled:bg-gray-600 disabled:cursor-not-allowed shadow-lg shadow-yellow-500/20 active:scale-[0.98] transition">
                                                <span className="absolute inset-y-0 left-0 w-1 bg-yellow-400/60 rounded-l" />
                                                {isCheckoutDisabled ? 'Selecione o Bairro' : 'Enviar Pedido'}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </form>
                )}
            </motion.div>
        </motion.div>
    );
}