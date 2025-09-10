'use client';
import React, { useState, useEffect } from 'react';
import { FaEdit, FaSave, FaTimes, FaTrash, FaSearch } from 'react-icons/fa';
import { MenuItem } from '@/types/menu';

export default function AdminEditMenu() {
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [editingItem, setEditingItem] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<MenuItem>>({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

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
            
            if (menuData.success) setMenuItems(menuData.data);
            if (catData.success) setCategories(catData.data);
        } catch (error) {
            console.error('Erro ao buscar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (item: MenuItem) => {
        setEditingItem(item._id);
        setEditForm({
            name: item.name,
            description: item.description,
            price: item.price,
            available: item.available
        });
    };

    const handleSave = async () => {
        if (!editingItem) return;

        try {
            const response = await fetch(`/api/menu`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    _id: editingItem,
                    ...editForm
                })
            });

            const data = await response.json();
            
            if (data.success) {
                await fetchData(); // Recarrega os dados
                setEditingItem(null);
                setEditForm({});
                alert('Item atualizado com sucesso!');
            } else {
                alert('Erro ao atualizar item: ' + data.message);
            }
        } catch (error) {
            console.error('Erro ao salvar:', error);
            alert('Erro ao salvar alterações');
        }
    };

    const handleDelete = async (itemId: string) => {
        if (!confirm('Tem certeza que deseja deletar este item?')) return;

        try {
            const response = await fetch(`/api/menu`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ _id: itemId })
            });

            const data = await response.json();
            
            if (data.success) {
                await fetchData();
                alert('Item deletado com sucesso!');
            } else {
                alert('Erro ao deletar item: ' + data.message);
            }
        } catch (error) {
            console.error('Erro ao deletar:', error);
            alert('Erro ao deletar item');
        }
    };

    const filteredItems = menuItems.filter(item => {
        const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const getCategoryName = (categoryId: string) => {
        const category = categories.find(cat => cat._id === categoryId);
        return category?.name || 'Categoria não encontrada';
    };

    if (loading) {
        return <div className="text-center py-8 text-white">Carregando itens do menu...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-lg">
                <h2 className="text-2xl font-bold text-white mb-6">Editar Menu</h2>
                
                {/* Filtros */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="flex-1">
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar item..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-gray-700 text-white pl-10 pr-4 py-2 rounded-lg border border-gray-600 focus:border-yellow-500 focus:outline-none"
                            />
                        </div>
                    </div>
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-yellow-500 focus:outline-none"
                    >
                        <option value="all">Todas as categorias</option>
                        {categories.map(cat => (
                            <option key={cat._id} value={cat._id}>{cat.name}</option>
                        ))}
                    </select>
                </div>

                {/* Lista de itens */}
                <div className="space-y-4">
                    {filteredItems.map(item => (
                        <div key={item._id} className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                            {editingItem === item._id ? (
                                // Modo de edição
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-gray-300 mb-2">Nome</label>
                                            <input
                                                type="text"
                                                value={editForm.name || ''}
                                                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                                                className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg border border-gray-500 focus:border-yellow-500 focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-gray-300 mb-2">Preço</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={editForm.price || ''}
                                                onChange={(e) => setEditForm({...editForm, price: parseFloat(e.target.value)})}
                                                className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg border border-gray-500 focus:border-yellow-500 focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-gray-300 mb-2">Descrição</label>
                                        <textarea
                                            value={editForm.description || ''}
                                            onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                                            className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg border border-gray-500 focus:border-yellow-500 focus:outline-none"
                                            rows={3}
                                        />
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <label className="flex items-center gap-2 text-gray-300">
                                            <input
                                                type="checkbox"
                                                checked={editForm.available ?? true}
                                                onChange={(e) => setEditForm({...editForm, available: e.target.checked})}
                                                className="rounded"
                                            />
                                            Item disponível
                                        </label>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleSave}
                                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                                        >
                                            <FaSave /> Salvar
                                        </button>
                                        <button
                                            onClick={() => {setEditingItem(null); setEditForm({});}}
                                            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2"
                                        >
                                            <FaTimes /> Cancelar
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                // Modo de visualização
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-bold text-white">{item.name}</h3>
                                            <span className="text-yellow-400 font-bold">
                                                R$ {parseFloat(String(item.price || 0)).toFixed(2).replace('.', ',')}
                                            </span>
                                            {!item.available && (
                                                <span className="bg-red-600 text-white text-xs px-2 py-1 rounded">
                                                    Indisponível
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-gray-300 text-sm mb-2">{item.description}</p>
                                        <p className="text-gray-400 text-xs">
                                            Categoria: {getCategoryName(item.category?.toString() || '')}
                                        </p>
                                    </div>
                                    <div className="flex gap-2 ml-4">
                                        <button
                                            onClick={() => handleEdit(item)}
                                            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"
                                            title="Editar item"
                                        >
                                            <FaEdit />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item._id)}
                                            className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700"
                                            title="Deletar item"
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {filteredItems.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                        Nenhum item encontrado.
                    </div>
                )}
            </div>
        </div>
    );
}
