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
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [itens, setItens] = useState<MenuItem[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<Partial<MenuItem>>({});
  const [removingId, setRemovingId] = useState<string | null>(null);

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
        category: form.category, // Usar diretamente o ID da categoria
        image: form.image,
        destaque: form.destaque,
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
        setForm({ name: '', description: '', price: '', category: categorias.length > 0 ? categorias[0]._id : '', image: '', destaque: false });
        fetchItens(); // Atualiza lista
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
    setEditItem({ ...item });
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
        <div className="overflow-x-auto">
          <ul className="space-y-1 min-w-[220px]">
            {itens.length === 0 ? (
              <div className="text-gray-400 text-sm">Nenhum item cadastrado ainda.</div>
            ) : (
              <ul className="space-y-1">
                {itens.map((item) => (
                  <li key={item._id} className={`bg-gray-900 rounded px-3 py-2 text-white border border-gray-700 ${editId === item._id ? 'p-4' : 'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1'}`}>
                    {editId === item._id ? (
                      <div className="w-full space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-300 mb-1">Nome</label>
                          <input
                            type="text"
                            value={editItem.name || ''}
                            onChange={e => setEditItem({ ...editItem, name: e.target.value })}
                            className="w-full bg-gray-800 border border-yellow-500 rounded px-3 py-2 text-white text-sm"
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
                              className="w-full bg-gray-800 border border-yellow-500 rounded px-3 py-2 text-white text-sm"
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
                              className="w-full bg-gray-800 border border-yellow-500 rounded px-3 py-2 text-white text-sm"
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
                            className="w-full bg-gray-800 border border-yellow-500 rounded px-3 py-2 text-white text-sm"
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
                            className="w-full bg-gray-800 border border-yellow-500 rounded px-3 py-2 text-white text-sm"
                            placeholder="https://exemplo.com/imagem.jpg"
                          />
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
                          <span className="font-bold text-yellow-400 block">{item.name}</span>
                          <span className="text-xs text-gray-400 block">Categoria: {categorias.find(cat => cat._id === item.category)?.name || item.category}</span>
                          <span className="text-xs text-gray-400 block">Preço: R$ {item.price?.toFixed(2)}</span>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleEdit(item)} className="text-yellow-400 hover:text-yellow-300"><FaEdit /></button>
                          <button onClick={() => handleRemove(item._id!)} className={`text-red-500 hover:text-red-400 ${removingId === item._id ? 'opacity-50 pointer-events-none' : ''}`} disabled={removingId === item._id}><FaTrash /></button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
} 