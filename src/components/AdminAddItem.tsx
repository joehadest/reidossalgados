import React, { useState, useEffect } from 'react';
import { MenuItem } from '../types/menu';
import { FaTrash, FaEdit, FaCheck, FaTimes } from 'react-icons/fa';

export default function AdminAddItem() {
  const [categorias, setCategorias] = useState<{_id: string, name: string}[]>([]);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image: '',
    destaque: false,
    available: true, // Por padrão, novos itens são marcados como disponíveis
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [itens, setItens] = useState<MenuItem[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<Partial<MenuItem>>({});
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Filtra os itens baseado no termo de busca
  const filteredItens = itens.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  useEffect(() => {
    async function fetchCategorias() {
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          const categoriasData = data.data.map((cat: any) => ({ _id: cat._id, name: cat.name }));
          setCategorias(categoriasData);
          
          // Definir a primeira categoria como padrão se não houver categoria selecionada
          if (categoriasData.length > 0 && !form.category) {
            setForm(prev => ({ ...prev, category: categoriasData[0]._id }));
          }
        }
      } catch (err) {
        setCategorias([]);
      }
    }
    fetchCategorias();
  }, []);

  // Buscar itens do cardápio do backend
  const fetchItens = async () => {
    try {
      const res = await fetch('/api/menu');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setItens(data.data);
      }
    } catch (err) {
      setItens([]);
    }
  };
  useEffect(() => {
    fetchItens();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox' && e.target instanceof HTMLInputElement) {
      const checked = (e.target as HTMLInputElement).checked;
      setForm(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');
    try {
      const categoriaSelecionada = categorias.find(cat => cat._id === form.category);
      const payload = {
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        category: form.category,
        image: form.image,
        destaque: form.destaque,
        available: form.available,
        borderOptions: {},
        extraOptions: {},
        ingredients: [],
      };
      const res = await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Item adicionado com sucesso!');
        setForm({ name: '', description: '', price: '', category: categorias.length > 0 ? categorias[0]._id : '', image: '', destaque: false, available: true });
        fetchItens();
      } else {
        setError(data.message || 'Erro ao adicionar item.');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja remover este item?')) return;
    setRemovingId(id);
    setSuccess('');
    setError('');
    try {
      const res = await fetch(`/api/menu?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setSuccess('Item removido com sucesso!');
        fetchItens();
      } else {
        setError(data.message || 'Erro ao remover item.');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor.');
    } finally {
      setRemovingId(null);
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditId(item._id);
    // Garantir que available seja true quando não definido
    setEditItem({ 
      ...item,
      available: item.available !== false
    });
  };

  const handleEditSave = async (id: string) => {
    if (!editItem.name || !editItem.price || !editItem.category) return;
    setLoading(true);
    setSuccess('');
    setError('');
    try {
      const res = await fetch(`/api/menu?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editItem.name,
          price: typeof editItem.price === 'number' ? editItem.price : parseFloat(editItem.price as string) || 0,
          category: editItem.category,
          description: editItem.description,
          image: editItem.image,
          destaque: editItem.destaque,
          available: editItem.available !== false, // Garante que available seja true quando não definido
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Item editado com sucesso!');
        setEditId(null);
        setEditItem({});
        fetchItens();
      } else {
        setError(data.message || 'Erro ao editar item.');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl w-full mx-auto bg-gray-800 rounded-xl p-3 sm:p-6 shadow-lg border border-yellow-500/30">
      <h2 className="text-xl sm:text-2xl font-bold text-yellow-500 mb-4 sm:mb-6 text-center">Adicionar Novo Item ao Cardápio</h2>
      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
        {success && <div className="bg-green-700/20 text-green-400 rounded p-2 text-center">{success}</div>}
        {error && <div className="bg-red-700/20 text-red-400 rounded p-2 text-center">{error}</div>}
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-1">Nome</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full p-2 rounded bg-gray-900 border border-gray-700 text-white focus:border-yellow-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-1">Descrição</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            required
            rows={2}
            className="w-full p-2 rounded bg-gray-900 border border-gray-700 text-white focus:border-yellow-500"
          />
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-200 mb-1">Preço (R$)</label>
            <input
              type="number"
              name="price"
              value={form.price}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              className="w-full p-2 rounded bg-gray-900 border border-gray-700 text-white focus:border-yellow-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-200 mb-1">Categoria</label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="w-full p-2 rounded bg-gray-900 border border-gray-700 text-white focus:border-yellow-500"
            >
              {categorias.length === 0 ? (
                <option value="">Nenhuma categoria</option>
              ) : (
                categorias.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))
              )}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-1">Imagem (URL)</label>
          <input
            type="text"
            name="image"
            value={form.image}
            onChange={handleChange}
            className="w-full p-2 rounded bg-gray-900 border border-gray-700 text-white focus:border-yellow-500"
          />
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              name="destaque"
              checked={form.destaque}
              onChange={handleChange}
              className="h-4 w-4 text-yellow-500 focus:ring-yellow-400 border-gray-700 rounded"
            />
            <label className="text-gray-200 text-sm">Destaque</label>
          </div>
          
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              name="available"
              checked={form.available}
              onChange={handleChange}
              className="h-4 w-4 text-green-500 focus:ring-green-400 border-gray-700 rounded"
            />
            <label className="text-gray-200 text-sm">Disponível</label>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold rounded-lg transition-colors mt-4 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? 'Adicionando...' : 'Adicionar Item'}
        </button>
      </form>

      <div className="mt-6 sm:mt-8">
        <h3 className="text-base sm:text-lg font-semibold text-yellow-400 mb-2">Itens cadastrados</h3>
        
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar itens por nome ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 pl-8 rounded bg-gray-900 border border-gray-700 text-white focus:border-yellow-500"
            />
            <svg
              className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        <div className="overflow-x-auto">
          {itens.length === 0 ? (
            <div className="text-gray-400 text-sm">Nenhum item cadastrado ainda.</div>
          ) : filteredItens.length === 0 ? (
            <div className="text-gray-400 text-sm">Nenhum item encontrado para "{searchTerm}"</div>
          ) : (
            <div className="space-y-6">
              {categorias.map((categoria) => {
                const itensCategoria = filteredItens.filter(item => item.category === categoria._id);
                if (itensCategoria.length === 0) return null;
                
                return (
                  <div key={categoria._id} className="bg-gray-900/50 rounded-lg p-4">
                    <h4 className="text-yellow-500 font-medium mb-3 border-b border-yellow-500/30 pb-2">{categoria.name}</h4>
                    <ul className="space-y-2">
                      {itensCategoria.map((item) => (
                        <li key={item._id} className={`bg-gray-800 rounded px-3 py-2 text-white border border-gray-700 hover:border-yellow-500/50 transition-colors ${editId === item._id ? 'p-4' : 'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1'}`}>
                          {editId === item._id ? (
                            <div className="w-full space-y-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-300 mb-1">Nome</label>
                                <input
                                  type="text"
                                  value={editItem.name || ''}
                                  onChange={e => setEditItem({ ...editItem, name: e.target.value })}
                                  className="w-full bg-gray-900 border border-yellow-500 rounded px-3 py-2 text-white text-sm"
                                  placeholder="Nome do item"
                                  autoFocus
                                />
                              </div>
                              <div className="flex gap-3">
                                <div className="flex-1">
                                  <label className="block text-xs font-medium text-gray-300 mb-1">Preço (R$)</label>
                                  <input
                                    type="number"
                                    value={editItem.price?.toString() || ''}
                                    onChange={e => setEditItem({ ...editItem, price: parseFloat(e.target.value) || 0 })}
                                    className="w-full bg-gray-900 border border-yellow-500 rounded px-3 py-2 text-white text-sm"
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                  />
                                </div>
                                <div className="flex-1">
                                  <label className="block text-xs font-medium text-gray-300 mb-1">Categoria</label>
                                  <select
                                    value={editItem.category || ''}
                                    onChange={e => setEditItem({ ...editItem, category: e.target.value })}
                                    className="w-full bg-gray-900 border border-yellow-500 rounded px-3 py-2 text-white text-sm"
                                  >
                                    {categorias.length === 0 ? (
                                      <option value="">Nenhuma categoria</option>
                                    ) : (
                                      categorias.map(cat => (
                                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                                      ))
                                    )}
                                  </select>
                                </div>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-300 mb-1">Descrição</label>
                                <textarea
                                  value={editItem.description || ''}
                                  onChange={e => setEditItem({ ...editItem, description: e.target.value })}
                                  className="w-full bg-gray-900 border border-yellow-500 rounded px-3 py-2 text-white text-sm"
                                  placeholder="Descrição do item"
                                  rows={2}
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-300 mb-1">Imagem (URL)</label>
                                <input
                                  type="text"
                                  value={editItem.image || ''}
                                  onChange={e => setEditItem({ ...editItem, image: e.target.value })}
                                  className="w-full bg-gray-900 border border-yellow-500 rounded px-3 py-2 text-white text-sm"
                                  placeholder="https://exemplo.com/imagem.jpg"
                                />
                              </div>
                              <div className="flex items-center gap-6 pt-2">
                                <div className="flex items-center gap-3">
                                  <input
                                    type="checkbox"
                                    checked={editItem.destaque || false}
                                    onChange={e => setEditItem({ ...editItem, destaque: e.target.checked })}
                                    className="h-4 w-4 text-yellow-500 focus:ring-yellow-400 border-gray-700 rounded"
                                  />
                                  <label className="text-gray-300 text-sm">Destaque</label>
                                </div>
                                <div className="flex items-center gap-3">
                                  <input
                                    type="checkbox"
                                    checked={editItem.available}
                                    onChange={e => setEditItem({ ...editItem, available: e.target.checked })}
                                    className="h-4 w-4 text-green-500 focus:ring-green-400 border-gray-700 rounded"
                                  />
                                  <label className="text-gray-300 text-sm">Disponível</label>
                                </div>
                              </div>
                              <div className="flex gap-2 pt-2">
                                <button 
                                  onClick={() => handleEditSave(item._id!)} 
                                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                                >
                                  <FaCheck className="inline mr-1" />
                                  Salvar
                                </button>
                                <button 
                                  onClick={() => { setEditId(null); setEditItem({}); }} 
                                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                                >
                                  <FaTimes className="inline mr-1" />
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-yellow-400">{item.name}</span>
                                  {!item.available ? (
                                    <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">
                                      Indisponível
                                    </span>
                                  ) : (
                                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                                      Disponível
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-gray-400 block">{item.description}</span>
                                <span className="text-xs text-gray-400 block">Preço: R$ {item.price?.toFixed(2)}</span>
                              </div>
                              <div className="flex gap-2 mt-2 sm:mt-0">
                                <button 
                                  onClick={() => handleEdit(item)} 
                                  className="text-yellow-400 hover:text-yellow-300 transition-colors"
                                  title="Editar item"
                                >
                                  <FaEdit />
                                </button>
                                <button 
                                  onClick={() => handleRemove(item._id!)} 
                                  className={`text-red-500 hover:text-red-400 transition-colors ${removingId === item._id ? 'opacity-50 pointer-events-none' : ''}`} 
                                  disabled={removingId === item._id}
                                  title="Remover item"
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
