// src/contexts/CartContext.tsx

'use client';
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { MenuItem } from '../types/menu';
import { CartItem, CartContextType } from '../types/cart';
import { menuItems as localPizzas } from '../data/menu'; // Usado como fallback para cálculo de pizza

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);

    const addToCart = (item: MenuItem, quantity: number, observation?: string, size?: string, border?: string, extras?: string[]) => {
        let price = item.price;
        // Lógica de cálculo de preço (mantida)
        if ((item.category === 'pizzas' || item.category === 'massas') && size && item.sizes) {
            const sizeKey = size as keyof typeof item.sizes;
            price = item.sizes[sizeKey] || price;
            if (item.category === 'pizzas') {
                if (observation && observation.includes('Meio a meio:')) {
                    const [sabor1, sabor2] = observation.split('Meio a meio:')[1].split('/').map(s => s.trim());
                    const pizzas = localPizzas.filter((p: MenuItem) => p.category === 'pizzas');
                    const pizza1 = pizzas.find((p: MenuItem) => p.name === sabor1);
                    const pizza2 = pizzas.find((p: MenuItem) => p.name === sabor2);
                    if (pizza1 && pizza2) {
                        const price1 = pizza1.sizes ? pizza1.sizes[sizeKey] || pizza1.price : pizza1.price;
                        const price2 = pizza2.sizes ? pizza2.sizes[sizeKey] || pizza2.price : pizza2.price;
                        price = Math.max(price1, price2);
                    }
                }
                if (border && item.borderOptions) { price += sizeKey === 'G' ? 8.00 : 4.00; }
            }
        }
        if (extras && extras.length > 0) {
            if (item.flavors && item.flavors.length > 0) {
                const flavor = item.flavors.find(f => f.name === extras[0]);
                if (flavor) price = flavor.price;
            } else if (item.extraOptions) {
                extras.forEach(extra => { price += item.extraOptions![extra] || 0; });
            }
        }

        const newItem: CartItem = {
            _id: `${item._id}_${Date.now()}`, // ID único
            item,
            quantity,
            observation,
            size,
            border,
            extras,
            name: item.name,
            price
        };

        setItems(prevItems => [...prevItems, newItem]); // Atualização segura
    };

    const removeFromCart = (cartItemId: string) => {
        setItems(prevItems => prevItems.filter(item => item._id !== cartItemId));
    };

    const updateQuantity = (cartItemId: string, quantity: number) => {
        setItems(prevItems =>
            prevItems.map(item =>
                item._id === cartItemId ? { ...item, quantity: Math.max(0, quantity) } : item
            ).filter(item => item.quantity > 0)
        );
    };

    const clearCart = () => {
        setItems([]);
    };

    return (
        <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}