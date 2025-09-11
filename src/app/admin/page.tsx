'use client';
import React, { useState, useEffect } from 'react';
import AdminOrders from '@/components/AdminOrders';
import AdminSettings from '@/components/AdminSettings';
import AdminAddItem from '@/components/AdminAddItem';
import AdminAddCategory from '@/components/AdminAddCategory';
import AdminEditMenu from '@/components/AdminEditMenu';
import AdminEarnings from '@/components/AdminEarnings';
import AuthGuard from '@/components/AuthGuard';
import LogoutButton from '@/components/LogoutButton';

export default function AdminPanel() {
    const [activeTab, setActiveTab] = useState<'config' | 'orders' | 'addItem' | 'addCategory' | 'editMenu' | 'earnings'>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('adminActiveTab') as any) || 'config';
        }
        return 'config';
    });

    useEffect(() => { localStorage.setItem('adminActiveTab', activeTab); }, [activeTab]);

    return (
        <AuthGuard>
            <div className="min-h-screen bg-gray-900 text-white">
                <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-8 gap-2 sm:gap-0">
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-yellow-500 text-center sm:text-left">Painel Administrativo</h1>
                        <LogoutButton variant="secondary" />
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
                            onClick={() => setActiveTab('editMenu')}
                            className={`py-3 px-3 sm:px-4 font-medium text-sm sm:text-base rounded-lg transition-all duration-200 ${
                                activeTab === 'editMenu'
                                    ? 'bg-yellow-500 text-gray-900 shadow-lg'
                                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700'
                            }`}
                        >
                            ✏️ Editar Menu
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
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:gap-3 mt-2">
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
                        <button
                            onClick={() => setActiveTab('earnings')}
                            className={`py-3 px-3 sm:px-4 font-medium text-sm sm:text-base rounded-lg transition-all duration-200 ${
                                activeTab === 'earnings'
                                    ? 'bg-yellow-500 text-gray-900 shadow-lg'
                                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700'
                            }`}
                        >
                            💰 Ganhos
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
                            onClick={() => setActiveTab('editMenu')}
                            className={`py-3 px-6 font-medium text-base transition-colors ${
                                activeTab === 'editMenu'
                                    ? 'border-b-2 border-yellow-500 text-yellow-500'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            Editar Menu
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
                        <button
                            onClick={() => setActiveTab('earnings')}
                            className={`py-3 px-6 font-medium text-base transition-colors ${
                                activeTab === 'earnings'
                                    ? 'border-b-2 border-yellow-500 text-yellow-500'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            Ganhos
                        </button>
                    </div>
                </div>

                <div>
                    {activeTab === 'config' && <AdminSettings />}
                    {activeTab === 'orders' && <AdminOrders />}
                    {activeTab === 'editMenu' && <AdminEditMenu />}
                    {activeTab === 'addItem' && <AdminAddItem />}
                    {activeTab === 'addCategory' && <AdminAddCategory />}
                    {activeTab === 'earnings' && <AdminEarnings />}
                </div>
            </div>
        </div>
        </AuthGuard>
    );
}