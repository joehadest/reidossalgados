'use client';
import React, { useState, useEffect } from 'react';
import AdminOrders from '@/components/AdminOrders';
import AdminSettings from '@/components/AdminSettings';
import AdminAddItem from '@/components/AdminAddItem';
import AdminAddCategory from '@/components/AdminAddCategory';

export default function AdminPanel() {
    const [activeTab, setActiveTab] = useState<'config' | 'orders' | 'addItem' | 'addCategory'>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('adminActiveTab') as 'config' | 'orders' | 'addItem' | 'addCategory') || 'config';
        }
        return 'config';
    });

    useEffect(() => {
        localStorage.setItem('adminActiveTab', activeTab);
    }, [activeTab]);

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-8 gap-2 sm:gap-0">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-yellow-500 text-center sm:text-left">Painel Administrativo</h1>
                    {/* Pode adicionar um botão de logout aqui */}
                </div>

                {/* Mobile Tabs - Grid Layout */}
                <div className="lg:hidden mb-4 sm:mb-6">
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        <button
                            onClick={() => setActiveTab('config')}
                            className={`py-3 px-3 sm:px-4 font-medium text-sm sm:text-base rounded-lg transition-all duration-200 ${
                                activeTab === 'config'
                                    ? 'bg-yellow-500 text-gray-900 shadow-lg'
                                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700'
                            }`}
                        >
                            ⚙️ Configurações
                        </button>
                        <button
                            onClick={() => setActiveTab('orders')}
                            className={`py-3 px-3 sm:px-4 font-medium text-sm sm:text-base rounded-lg transition-all duration-200 ${
                                activeTab === 'orders'
                                    ? 'bg-yellow-500 text-gray-900 shadow-lg'
                                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700'
                            }`}
                        >
                            📋 Pedidos
                        </button>
                        <button
                            onClick={() => setActiveTab('addItem')}
                            className={`py-3 px-3 sm:px-4 font-medium text-sm sm:text-base rounded-lg transition-all duration-200 ${
                                activeTab === 'addItem'
                                    ? 'bg-yellow-500 text-gray-900 shadow-lg'
                                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700'
                            }`}
                        >
                            ➕ Adicionar Item
                        </button>
                        <button
                            onClick={() => setActiveTab('addCategory')}
                            className={`py-3 px-3 sm:px-4 font-medium text-sm sm:text-base rounded-lg transition-all duration-200 ${
                                activeTab === 'addCategory'
                                    ? 'bg-yellow-500 text-gray-900 shadow-lg'
                                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700'
                            }`}
                        >
                            📂 Adicionar Categoria
                        </button>
                    </div>
                </div>

                {/* Desktop Tabs - Horizontal Layout */}
                <div className="hidden lg:block mb-6 border-b border-gray-700">
                    <div className="flex gap-4 overflow-x-auto scrollbar-hide">
                        <button
                            onClick={() => setActiveTab('config')}
                            className={`py-3 px-6 font-medium text-base transition-colors ${
                                activeTab === 'config'
                                    ? 'border-b-2 border-yellow-500 text-yellow-500'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            Configurações
                        </button>
                        <button
                            onClick={() => setActiveTab('orders')}
                            className={`py-3 px-6 font-medium text-base transition-colors ${
                                activeTab === 'orders'
                                    ? 'border-b-2 border-yellow-500 text-yellow-500'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            Pedidos
                        </button>
                        <button
                            onClick={() => setActiveTab('addItem')}
                            className={`py-3 px-6 font-medium text-base transition-colors ${
                                activeTab === 'addItem'
                                    ? 'border-b-2 border-yellow-500 text-yellow-500'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            Adicionar Item
                        </button>
                        <button
                            onClick={() => setActiveTab('addCategory')}
                            className={`py-3 px-6 font-medium text-base transition-colors ${
                                activeTab === 'addCategory'
                                    ? 'border-b-2 border-yellow-500 text-yellow-500'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            Adicionar Categoria
                        </button>
                    </div>
                </div>

                <div>
                    {activeTab === 'config' && <AdminSettings />}
                    {activeTab === 'orders' && <AdminOrders />}
                    {activeTab === 'addItem' && <AdminAddItem />}
                    {activeTab === 'addCategory' && <AdminAddCategory />}
                </div>
            </div>
        </div>
    );
} 