'use client';
import React, { useState, useEffect } from 'react';
import { FaPlus, FaMinus, FaTrash, FaShoppingCart, FaUser, FaPhone, FaMoneyBillWave, FaCheck } from 'react-icons/fa';
import { MenuItem } from '@/types/menu';

interface CartItem {
    item: MenuItem;
    quantity: number;
    size?: string;
    border?: string;
    extras?: string[];
    observation?: string;
}

export default function AdminBalcao() {
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [categories, setCategories] = useState<{ _id: string, name: string, emoji?: string }[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    
    // Dados do cliente
    const [clienteNome, setClienteNome] = useState('');
    const [clienteTelefone, setClienteTelefone] = useState('');
    const [formaPagamento, setFormaPagamento] = useState<'pix' | 'dinheiro' | 'cartao'>('dinheiro');
    const [troco, setTroco] = useState('');
    const [observacoes, setObservacoes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [menuRes, catRes] = await Promise.all([
                fetch('/api/menu'),
                fetch('/api/categories')
            ]);
            
            const menuData = await menuRes.json();
            const catData = await catRes.json();
            
            if (menuData.success) {
                setMenuItems(menuData.data.filter((item: MenuItem) => item.available !== false));
            }
            if (catData.success) {
                setCategories(catData.data);
            }
        } catch (error) {
            console.error('Erro ao buscar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    const addToCart = (item: MenuItem) => {
        const existingItem = cart.find(c => c.item._id === item._id && !c.size && !c.border);
        if (existingItem) {
            setCart(cart.map(c => 
                c.item._id === item._id && !c.size && !c.border
                    ? { ...c, quantity: c.quantity + 1 }
                    : c
            ));
        } else {
            setCart([...cart, { item, quantity: 1 }]);
        }
    };

    const removeFromCart = (index: number) => {
        setCart(cart.filter((_, i) => i !== index));
    };

    const updateQuantity = (index: number, delta: number) => {
        const newCart = [...cart];
        newCart[index].quantity += delta;
        if (newCart[index].quantity <= 0) {
            removeFromCart(index);
        } else {
            setCart(newCart);
        }
    };

    const calculateTotal = () => {
        return cart.reduce((total, cartItem) => {
            let itemPrice = cartItem.item.price;
            
            // Adicionar preço do tamanho se houver
            if (cartItem.size && cartItem.item.sizes && cartItem.item.sizes[cartItem.size]) {
                const sizePrice = cartItem.item.sizes[cartItem.size];
                if (sizePrice !== undefined) {
                    itemPrice = sizePrice;
                }
            }
            
            // Adicionar preço da borda se houver
            if (cartItem.border && cartItem.item.borderOptions && cartItem.item.borderOptions[cartItem.border]) {
                const borderPrice = cartItem.item.borderOptions[cartItem.border];
                if (borderPrice !== undefined) {
                    itemPrice += borderPrice;
                }
            }
            
            // Adicionar preços dos extras se houver
            if (cartItem.extras && cartItem.item.extraOptions) {
                cartItem.extras.forEach(extra => {
                    if (cartItem.item.extraOptions && cartItem.item.extraOptions[extra]) {
                        const extraPrice = cartItem.item.extraOptions[extra];
                        if (extraPrice !== undefined) {
                            itemPrice += extraPrice;
                        }
                    }
                });
            }
            
            return total + (itemPrice * cartItem.quantity);
        }, 0);
    };

    const filteredItems = menuItems.filter(item => {
        const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.description?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const handleSubmit = async () => {
        if (cart.length === 0) {
            alert('Adicione pelo menos um item ao carrinho');
            return;
        }

        if (!clienteNome.trim()) {
            alert('Informe o nome do cliente');
            return;
        }

        if (!clienteTelefone.trim()) {
            alert('Informe o telefone do cliente');
            return;
        }

        setIsSubmitting(true);

        try {
            const pedido = {
                itens: cart.map(cartItem => {
                    let itemPrice = cartItem.item.price;
                    
                    if (cartItem.size && cartItem.item.sizes && cartItem.item.sizes[cartItem.size]) {
                        const sizePrice = cartItem.item.sizes[cartItem.size];
                        if (sizePrice !== undefined) {
                            itemPrice = sizePrice;
                        }
                    }
                    
                    if (cartItem.border && cartItem.item.borderOptions && cartItem.item.borderOptions[cartItem.border]) {
                        const borderPrice = cartItem.item.borderOptions[cartItem.border];
                        if (borderPrice !== undefined) {
                            itemPrice += borderPrice;
                        }
                    }
                    
                    if (cartItem.extras && cartItem.item.extraOptions) {
                        cartItem.extras.forEach(extra => {
                            if (cartItem.item.extraOptions && cartItem.item.extraOptions[extra]) {
                                const extraPrice = cartItem.item.extraOptions[extra];
                                if (extraPrice !== undefined) {
                                    itemPrice += extraPrice;
                                }
                            }
                        });
                    }

                    return {
                        nome: cartItem.item.name,
                        quantidade: cartItem.quantity,
                        preco: itemPrice,
                        observacao: cartItem.observation,
                        size: cartItem.size,
                        border: cartItem.border,
                        extras: cartItem.extras
                    };
                }),
                total: calculateTotal(),
                tipoEntrega: 'retirada' as const,
                cliente: {
                    nome: clienteNome.trim(),
                    telefone: clienteTelefone.trim()
                },
                formaPagamento,
                troco: formaPagamento === 'dinheiro' && troco ? troco : undefined,
                observacoes: observacoes.trim() || undefined,
                status: 'pendente' as const,
                data: new Date().toISOString()
            };

            const response = await fetch('/api/pedidos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pedido)
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Erro ao criar pedido');
            }

            // Limpar formulário
            setCart([]);
            setClienteNome('');
            setClienteTelefone('');
            setFormaPagamento('dinheiro');
            setTroco('');
            setObservacoes('');
            setShowSuccess(true);
            
            setTimeout(() => {
                setShowSuccess(false);
            }, 3000);

        } catch (error) {
            console.error('Erro ao criar pedido:', error);
            alert('Erro ao criar pedido. Tente novamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="text-center py-8 text-white">
                <p>Carregando menu...</p>
            </div>
        );
    }

    return (
        <div className="p-1 sm:p-4 min-h-screen">
            <div className="mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Pedido de Balcão</h2>
                <p className="text-gray-400 text-sm">Registre pedidos feitos presencialmente no estabelecimento</p>
            </div>

            {/* Mensagem de sucesso */}
            {showSuccess && (
                <div className="mb-4 p-4 bg-green-600 text-white rounded-lg flex items-center gap-2">
                    <FaCheck /> Pedido criado com sucesso!
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Coluna do Menu */}
                <div className="lg:col-span-2 bg-gray-800 p-4 rounded-lg border border-yellow-500/20">
                    {/* Filtros */}
                    <div className="mb-4 space-y-3">
                        <input
                            type="text"
                            placeholder="🔍 Buscar item..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg border border-gray-700 focus:border-yellow-500 focus:outline-none"
                        />
                        
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-yellow-500 scrollbar-track-gray-800">
                            <button
                                onClick={() => setSelectedCategory('all')}
                                className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium transition-colors ${
                                    selectedCategory === 'all'
                                        ? 'bg-yellow-500 text-gray-900'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                            >
                                Todos
                            </button>
                            {categories.map(cat => (
                                <button
                                    key={cat._id}
                                    onClick={() => setSelectedCategory(cat._id)}
                                    className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium transition-colors ${
                                        selectedCategory === cat._id
                                            ? 'bg-yellow-500 text-gray-900'
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                                >
                                    {cat.emoji && <span className="mr-1">{cat.emoji}</span>}
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Lista de Itens */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-yellow-500 scrollbar-track-gray-800">
                        {filteredItems.map(item => (
                            <div
                                key={item._id}
                                className="bg-gray-900 p-3 rounded-lg border border-gray-700 hover:border-yellow-500/50 transition-colors cursor-pointer"
                                onClick={() => addToCart(item)}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-white text-sm">{item.name}</h3>
                                        {item.description && (
                                            <p className="text-xs text-gray-400 mt-1 line-clamp-2">{item.description}</p>
                                        )}
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            addToCart(item);
                                        }}
                                        className="ml-2 p-2 bg-yellow-500 text-gray-900 rounded-lg hover:bg-yellow-400 transition-colors"
                                    >
                                        <FaPlus size={12} />
                                    </button>
                                </div>
                                <p className="text-yellow-400 font-bold text-sm">R$ {item.price.toFixed(2)}</p>
                            </div>
                        ))}
                    </div>

                    {filteredItems.length === 0 && (
                        <div className="text-center text-gray-500 py-8">
                            <p>Nenhum item encontrado</p>
                        </div>
                    )}
                </div>

                {/* Coluna do Carrinho e Formulário */}
                <div className="lg:col-span-1 space-y-4">
                    {/* Carrinho */}
                    <div className="bg-gray-800 p-4 rounded-lg border border-yellow-500/20">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <FaShoppingCart /> Carrinho ({cart.length})
                        </h3>
                        
                        <div className="space-y-2 max-h-[40vh] overflow-y-auto scrollbar-thin scrollbar-thumb-yellow-500 scrollbar-track-gray-800 mb-4">
                            {cart.length === 0 ? (
                                <p className="text-gray-500 text-center py-4">Carrinho vazio</p>
                            ) : (
                                cart.map((cartItem, index) => {
                                    let itemPrice = cartItem.item.price;
                                    if (cartItem.size && cartItem.item.sizes && cartItem.item.sizes[cartItem.size]) {
                                        const sizePrice = cartItem.item.sizes[cartItem.size];
                                        if (sizePrice !== undefined) {
                                            itemPrice = sizePrice;
                                        }
                                    }
                                    if (cartItem.border && cartItem.item.borderOptions && cartItem.item.borderOptions[cartItem.border]) {
                                        const borderPrice = cartItem.item.borderOptions[cartItem.border];
                                        if (borderPrice !== undefined) {
                                            itemPrice += borderPrice;
                                        }
                                    }
                                    if (cartItem.extras && cartItem.item.extraOptions) {
                                        cartItem.extras.forEach(extra => {
                                            if (cartItem.item.extraOptions && cartItem.item.extraOptions[extra]) {
                                                const extraPrice = cartItem.item.extraOptions[extra];
                                                if (extraPrice !== undefined) {
                                                    itemPrice += extraPrice;
                                                }
                                            }
                                        });
                                    }

                                    return (
                                        <div key={index} className="bg-gray-900 p-3 rounded-lg">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex-1">
                                                    <p className="font-semibold text-white text-sm">{cartItem.item.name}</p>
                                                    <p className="text-xs text-gray-400">R$ {itemPrice.toFixed(2)} cada</p>
                                                </div>
                                                <button
                                                    onClick={() => removeFromCart(index)}
                                                    className="ml-2 p-1 text-red-400 hover:text-red-300"
                                                >
                                                    <FaTrash size={12} />
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => updateQuantity(index, -1)}
                                                    className="p-1 bg-gray-700 text-white rounded hover:bg-gray-600"
                                                >
                                                    <FaMinus size={10} />
                                                </button>
                                                <span className="text-white font-bold w-8 text-center">{cartItem.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(index, 1)}
                                                    className="p-1 bg-gray-700 text-white rounded hover:bg-gray-600"
                                                >
                                                    <FaPlus size={10} />
                                                </button>
                                                <span className="ml-auto text-yellow-400 font-bold">
                                                    R$ {(itemPrice * cartItem.quantity).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <div className="border-t border-gray-700 pt-4">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-lg font-bold text-white">Total:</span>
                                <span className="text-2xl font-bold text-yellow-400">R$ {calculateTotal().toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Formulário do Cliente */}
                    <div className="bg-gray-800 p-4 rounded-lg border border-yellow-500/20">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <FaUser /> Dados do Cliente
                        </h3>
                        
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm text-gray-300 mb-1">Nome *</label>
                                <input
                                    type="text"
                                    value={clienteNome}
                                    onChange={(e) => setClienteNome(e.target.value)}
                                    placeholder="Nome do cliente"
                                    className="w-full px-3 py-2 bg-gray-900 text-white rounded-lg border border-gray-700 focus:border-yellow-500 focus:outline-none"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm text-gray-300 mb-1">Telefone *</label>
                                <input
                                    type="tel"
                                    value={clienteTelefone}
                                    onChange={(e) => setClienteTelefone(e.target.value)}
                                    placeholder="(00) 00000-0000"
                                    className="w-full px-3 py-2 bg-gray-900 text-white rounded-lg border border-gray-700 focus:border-yellow-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-300 mb-1 flex items-center gap-2">
                                    <FaMoneyBillWave /> Forma de Pagamento *
                                </label>
                                <select
                                    value={formaPagamento}
                                    onChange={(e) => setFormaPagamento(e.target.value as 'pix' | 'dinheiro' | 'cartao')}
                                    className="w-full px-3 py-2 bg-gray-900 text-white rounded-lg border border-gray-700 focus:border-yellow-500 focus:outline-none"
                                >
                                    <option value="dinheiro">Dinheiro</option>
                                    <option value="pix">PIX</option>
                                    <option value="cartao">Cartão</option>
                                </select>
                            </div>

                            {formaPagamento === 'dinheiro' && (
                                <div>
                                    <label className="block text-sm text-gray-300 mb-1">Troco para</label>
                                    <input
                                        type="text"
                                        value={troco}
                                        onChange={(e) => setTroco(e.target.value)}
                                        placeholder="0,00"
                                        className="w-full px-3 py-2 bg-gray-900 text-white rounded-lg border border-gray-700 focus:border-yellow-500 focus:outline-none"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm text-gray-300 mb-1">Observações</label>
                                <textarea
                                    value={observacoes}
                                    onChange={(e) => setObservacoes(e.target.value)}
                                    placeholder="Observações do pedido..."
                                    rows={3}
                                    className="w-full px-3 py-2 bg-gray-900 text-white rounded-lg border border-gray-700 focus:border-yellow-500 focus:outline-none resize-none"
                                />
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting || cart.length === 0}
                                className="w-full bg-yellow-500 text-gray-900 font-bold py-3 px-4 rounded-lg hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <span className="animate-spin">⏳</span>
                                        <span>Criando pedido...</span>
                                    </>
                                ) : (
                                    <>
                                        <FaCheck /> Criar Pedido
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

