'use client';
import React, { useState, useEffect } from 'react';
import AdminOrders from '@/components/AdminOrders';
import AdminSettings from '@/components/AdminSettings';

export default function AdminPanel() {
    const [activeTab, setActiveTab] = useState<'config' | 'orders'>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('adminActiveTab') as 'config' | 'orders') || 'config';
        }
        return 'config';
    });

    useEffect(() => {
        localStorage.setItem('adminActiveTab', activeTab);
    }, [activeTab]);

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-yellow-500">Painel Administrativo</h1>
                    {/* Pode adicionar um botão de logout aqui */}
                </div>

                <div className="mb-6 border-b border-gray-700">
                    <div className="flex space-x-4">
                        <button
                            onClick={() => setActiveTab('config')}
                            className={`py-2 px-4 font-medium transition-colors ${
                                activeTab === 'config'
                                    ? 'border-b-2 border-yellow-500 text-yellow-500'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            Configurações
                        </button>
                        <button
                            onClick={() => setActiveTab('orders')}
                            className={`py-2 px-4 font-medium transition-colors ${
                                activeTab === 'orders'
                                    ? 'border-b-2 border-yellow-500 text-yellow-500'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            Pedidos
                        </button>
                    </div>
                </div>

                <div>
                    {activeTab === 'config' ? <AdminSettings /> : <AdminOrders />}
                </div>
            </div>
        </div>
    );
} 