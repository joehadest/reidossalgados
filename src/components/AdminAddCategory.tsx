import React, { useState, useEffect } from 'react';
import { FaTrash, FaEdit, FaCheck, FaTimes, FaSmile } from 'react-icons/fa';

// Lista de emojis comuns para alimentos
const foodEmojis = [
  '🍔', '🍕', '🌮', '🌯', '🥪', '🍗', '🍖', '🥩', '🥓', '🍟', '🌭',
  '🥐', '🥖', '🥨', '🥯', '🍞', '🥞', '🧇', '🥮', '🍩', '🍪', '🎂', '🍰',
  '🧁', '🥧', '🍫', '🍬', '🍭', '🍮', '🍯', '🍡', '🍧', '🍨', '🍦',
  '🥛', '☕', '🍵', '🧃', '🥤', '🧋', '🍶', '🍺', '🍷', '🍸', '🍹',
  '🧉', '🥂', '🥃', '🍴', '🍽️', '🥄', '🥢', '🧆', '🥟', '🥠', '🥡',
];

export default function AdminAddCategory() {
  const [category, setCategory] = useState('');
  const [emoji, setEmoji] = useState('🍽️'); // Emoji padrão
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [categorias, setCategorias] = useState<{ _id: string, name: string, emoji?: string }[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editEmoji, setEditEmoji] = useState('');
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showEditEmojiPicker, setShowEditEmojiPicker] = useState(false);

  // Buscar categorias do backend
  const fetchCategorias = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setCategorias(data.data.map((cat: any) => ({
          _id: cat._id,
          name: cat.name,
          emoji: cat.emoji || '🍽️' // Usar emoji padrão se não estiver definido
        })));
      }
    } catch (err) {
      setCategorias([]);
    }
  };

  useEffect(() => {
    fetchCategorias();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: category.trim(),
          emoji: emoji
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Categoria adicionada com sucesso!');
        setCategory('');
        setEmoji('🍽️'); // Resetar para o emoji padrão
        fetchCategorias(); // Atualiza lista
      } else {
        setError(data.message || 'Erro ao adicionar categoria.');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja remover esta categoria?')) return;
    setRemovingId(id);
    setSuccess('');
    setError('');
    try {
      const res = await fetch(`/api/categories?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setSuccess('Categoria removida com sucesso!');
        fetchCategorias();
      } else {
        setError(data.message || 'Erro ao remover categoria.');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor.');
    } finally {
      setRemovingId(null);
    }
  };

  const handleEdit = (cat: { _id: string, name: string, emoji?: string }) => {
    setEditId(cat._id);
    setEditValue(cat.name);
    setEditEmoji(cat.emoji || '🍽️');
  };

  const handleEditSave = async (id: string) => {
    if (!editValue.trim()) return;
    setLoading(true);
    setSuccess('');
    setError('');
    try {
      const res = await fetch(`/api/categories?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editValue.trim(),
          emoji: editEmoji
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Categoria editada com sucesso!');
        setEditId(null);
        setEditValue('');
        setEditEmoji('');
        setShowEditEmojiPicker(false);
        fetchCategorias();
      } else {
        setError(data.message || 'Erro ao editar categoria.');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl w-full mx-auto bg-gray-800 rounded-xl p-3 sm:p-6 shadow-lg border border-yellow-500/30">
      <h2 className="text-xl sm:text-2xl font-bold text-yellow-500 mb-4 sm:mb-6 text-center">Adicionar Nova Categoria</h2>
      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
        {success && <div className="bg-green-700/20 text-green-400 rounded p-2 text-center">{success}</div>}
        {error && <div className="bg-red-700/20 text-red-400 rounded p-2 text-center">{error}</div>}
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-1">Nome da Categoria</label>
          <input
            type="text"
            value={category}
            onChange={e => setCategory(e.target.value)}
            required
            className="w-full p-2 rounded bg-gray-900 border border-gray-700 text-white focus:border-yellow-500"
            placeholder="Ex: Salgados, Bebidas, Sobremesas..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-200 mb-1">Emoji da Categoria</label>
          <div className="flex items-center">
            <div
              className="w-12 h-12 flex items-center justify-center bg-gray-900 border border-gray-700 rounded text-2xl cursor-pointer hover:bg-gray-800"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              {emoji}
            </div>
            <button
              type="button"
              className="ml-2 p-2 bg-blue-600 hover:bg-blue-500 rounded text-white flex items-center"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <FaSmile className="mr-1" /> Escolher Emoji
            </button>
          </div>

          {showEmojiPicker && (
            <div className="mt-2 p-2 bg-gray-900 border border-gray-700 rounded max-h-48 overflow-y-auto">
              <div className="grid grid-cols-8 gap-2">
                {foodEmojis.map((e) => (
                  <button
                    key={e}
                    type="button"
                    className={`w-8 h-8 text-xl flex items-center justify-center rounded hover:bg-gray-700 ${emoji === e ? 'bg-yellow-500/30' : ''}`}
                    onClick={() => {
                      setEmoji(e);
                      setShowEmojiPicker(false);
                    }}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          className="w-full py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold rounded-lg transition-colors mt-4 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? 'Adicionando...' : 'Adicionar Categoria'}
        </button>
      </form>
      <div className="mt-6 sm:mt-8">
        <h3 className="text-base sm:text-lg font-semibold text-yellow-400 mb-2">Categorias cadastradas</h3>
        <div className="overflow-x-auto">
          <ul className="space-y-1 min-w-[220px]">
            {categorias.length === 0 ? (
              <div className="text-gray-400 text-sm">Nenhuma categoria cadastrada ainda.</div>
            ) : (
              <ul className="space-y-1">
                {categorias.map((cat) => (
                  <li key={cat._id} className="bg-gray-900 rounded px-3 py-2 text-white border border-gray-700 flex items-center justify-between gap-2">
                    {editId === cat._id ? (
                      <div className="w-full flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            className="bg-gray-800 border border-yellow-500 rounded px-2 py-1 text-white flex-grow"
                            autoFocus
                          />
                          <button onClick={() => handleEditSave(cat._id)} className="text-green-400 hover:text-green-300"><FaCheck /></button>
                          <button onClick={() => { setEditId(null); setEditValue(''); setEditEmoji(''); setShowEditEmojiPicker(false); }} className="text-red-400 hover:text-red-300"><FaTimes /></button>
                        </div>

                        <div className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 flex items-center justify-center bg-gray-800 border border-yellow-500 rounded text-xl cursor-pointer"
                            onClick={() => setShowEditEmojiPicker(!showEditEmojiPicker)}
                          >
                            {editEmoji}
                          </div>
                          <button
                            type="button"
                            className="text-xs p-1 bg-blue-600 hover:bg-blue-500 rounded text-white flex items-center"
                            onClick={() => setShowEditEmojiPicker(!showEditEmojiPicker)}
                          >
                            <FaSmile className="mr-1" /> Trocar Emoji
                          </button>
                        </div>

                        {showEditEmojiPicker && (
                          <div className="p-1 bg-gray-800 border border-gray-600 rounded max-h-32 overflow-y-auto">
                            <div className="grid grid-cols-6 gap-1">
                              {foodEmojis.map((e) => (
                                <button
                                  key={e}
                                  type="button"
                                  className={`w-7 h-7 text-lg flex items-center justify-center rounded hover:bg-gray-700 ${editEmoji === e ? 'bg-yellow-500/30' : ''}`}
                                  onClick={() => {
                                    setEditEmoji(e);
                                    setShowEditEmojiPicker(false);
                                  }}
                                >
                                  {e}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="text-xl" role="img" aria-label={`Emoji para ${cat.name}`}>
                            {cat.emoji || '🍽️'}
                          </span>
                          <span>{cat.name}</span>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleEdit(cat)} className="text-yellow-400 hover:text-yellow-300"><FaEdit /></button>
                          <button onClick={() => handleRemove(cat._id)} className={`text-red-500 hover:text-red-400 ${removingId === cat._id ? 'opacity-50 pointer-events-none' : ''}`} disabled={removingId === cat._id}><FaTrash /></button>
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