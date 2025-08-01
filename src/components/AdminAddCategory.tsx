import React, { useState, useEffect } from 'react';
import { FaTrash, FaEdit, FaCheck, FaTimes, FaSmile, FaGripVertical } from 'react-icons/fa';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Lista de emojis comuns para alimentos
const foodEmojis = [
  '🍔', '🍕', '🌮', '🌯', '🥪', '🍗', '🍖', '🥩', '🥓', '🍟', '🌭',
  '🥐', '🥖', '🥨', '🥯', '🍞', '🥞', '🧇', '🥮', '🍩', '🍪', '🎂', '🍰',
  '🧁', '🥧', '🍫', '🍬', '🍭', '🍮', '🍯', '🍡', '🍧', '🍨', '🍦',
  '🥛', '☕', '🍵', '🧃', '🥤', '🧋', '🍶', '🍺', '🍷', '🍸', '🍹',
  '🧉', '🥂', '🥃', '🍴', '🍽️', '🥄', '🥢', '🧆', '🥟', '🥠', '🥡',
];

// Componente para item arrastável
function SortableItem({
  category,
  editId,
  editValue,
  editEmoji,
  showEditEmojiPicker,
  removingId,
  onEdit,
  onEditSave,
  onEditCancel,
  onRemove,
  onEditValueChange,
  onToggleEmojiPicker,
  onEmojiSelect,
  foodEmojis
}: {
  category: { _id: string, name: string, emoji?: string, orderIndex?: number };
  editId: string | null;
  editValue: string;
  editEmoji: string;
  showEditEmojiPicker: boolean;
  removingId: string | null;
  onEdit: (cat: { _id: string, name: string, emoji?: string }) => void;
  onEditSave: (id: string) => void;
  onEditCancel: () => void;
  onRemove: (id: string) => void;
  onEditValueChange: (value: string) => void;
  onToggleEmojiPicker: () => void;
  onEmojiSelect: (emoji: string) => void;
  foodEmojis: string[];
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`bg-gray-900 rounded px-3 py-2 text-white border border-gray-700 flex items-center justify-between gap-2 transition-all ${isDragging ? 'shadow-lg bg-gray-800 scale-105 border-yellow-500' : ''
        }`}
    >
      {editId === category._id ? (
        <div className="w-full flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={editValue}
              onChange={e => onEditValueChange(e.target.value)}
              className="bg-gray-800 border border-yellow-500 rounded px-2 py-1 text-white flex-grow"
              autoFocus
            />
            <button onClick={() => onEditSave(category._id)} className="text-green-400 hover:text-green-300"><FaCheck /></button>
            <button onClick={onEditCancel} className="text-red-400 hover:text-red-300"><FaTimes /></button>
          </div>

          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 flex items-center justify-center bg-gray-800 border border-yellow-500 rounded text-xl cursor-pointer"
              onClick={onToggleEmojiPicker}
            >
              {editEmoji}
            </div>
            <button
              type="button"
              className="text-xs p-1 bg-blue-600 hover:bg-blue-500 rounded text-white flex items-center"
              onClick={onToggleEmojiPicker}
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
                    onClick={() => onEmojiSelect(e)}
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
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-yellow-400 p-1"
            >
              <FaGripVertical />
            </div>
            <span className="text-xl" role="img" aria-label={`Emoji para ${category.name}`}>
              {category.emoji || '🍽️'}
            </span>
            <span>{category.name}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => onEdit(category)} className="text-yellow-400 hover:text-yellow-300"><FaEdit /></button>
            <button onClick={() => onRemove(category._id)} className={`text-red-500 hover:text-red-400 ${removingId === category._id ? 'opacity-50 pointer-events-none' : ''}`} disabled={removingId === category._id}><FaTrash /></button>
          </div>
        </>
      )}
    </li>
  );
}

export default function AdminAddCategory() {
  const [category, setCategory] = useState('');
  const [emoji, setEmoji] = useState('🍽️'); // Emoji padrão
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [categorias, setCategorias] = useState<{ _id: string, name: string, emoji?: string, orderIndex?: number }[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editEmoji, setEditEmoji] = useState('');
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showEditEmojiPicker, setShowEditEmojiPicker] = useState(false);
  const [isReordering, setIsReordering] = useState(false);

  // Configurar sensores para drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Buscar categorias do backend
  const fetchCategorias = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        // Ordenar categorias pelo orderIndex
        const sortedCategories = data.data
          .map((cat: any) => ({
            _id: cat._id,
            name: cat.name,
            emoji: cat.emoji || '🍽️', // Usar emoji padrão se não estiver definido
            orderIndex: cat.orderIndex || 0
          }))
          .sort((a: { orderIndex: number }, b: { orderIndex: number }) => a.orderIndex - b.orderIndex);

        setCategorias(sortedCategories);
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
        body: JSON.stringify({ name: category, emoji })
      });

      const data = await res.json();
      if (data.success) {
        setCategory('');
        setEmoji('🍽️');
        setSuccess('Categoria adicionada com sucesso!');
        fetchCategorias();
      } else {
        setError(data.message || 'Erro ao adicionar categoria.');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (cat: { _id: string, name: string, emoji?: string }) => {
    setEditId(cat._id);
    setEditValue(cat.name);
    setEditEmoji(cat.emoji || '🍽️');
  };

  const handleEditSave = async (id: string) => {
    try {
      const res = await fetch(`/api/categories?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editValue, emoji: editEmoji })
      });

      const data = await res.json();
      if (data.success) {
        setEditId(null);
        setEditValue('');
        setEditEmoji('');
        setShowEditEmojiPicker(false);
        setSuccess('Categoria editada com sucesso!');
        setTimeout(() => setSuccess(''), 3000);
        fetchCategorias();
      } else {
        setError(data.message || 'Erro ao editar categoria.');
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleRemove = async (id: string) => {
    setRemovingId(id);
    try {
      const res = await fetch(`/api/categories?id=${id}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      if (data.success) {
        setSuccess('Categoria removida com sucesso!');
        setTimeout(() => setSuccess(''), 3000);
        fetchCategorias();
      } else {
        setError(data.message || 'Erro ao remover categoria.');
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setRemovingId(null);
    }
  };

  // Função para lidar com o drag and drop
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = categorias.findIndex(cat => cat._id === active.id);
    const newIndex = categorias.findIndex(cat => cat._id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Reordenar array localmente
    const reorderedCategories = arrayMove(categorias, oldIndex, newIndex);

    // Atualizar estado local imediatamente para feedback visual
    setCategorias(reorderedCategories);

    // Atualizar no backend
    setIsReordering(true);
    try {
      const res = await fetch('/api/categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: reorderedCategories })
      });

      const data = await res.json();
      if (data.success) {
        setSuccess('Ordem das categorias atualizada com sucesso!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Erro ao reordenar categorias.');
        setTimeout(() => setError(''), 3000);
        // Reverter mudanças em caso de erro
        fetchCategorias();
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor.');
      setTimeout(() => setError(''), 3000);
      // Reverter mudanças em caso de erro
      fetchCategorias();
    } finally {
      setIsReordering(false);
    }
  };

  return (
    <div className="max-w-xl w-full mx-auto bg-gray-800 rounded-xl p-3 sm:p-6 shadow-lg border border-yellow-500/30">
      <h2 className="text-lg sm:text-xl font-bold text-yellow-500 mb-3 sm:mb-4">Gerenciar Categorias</h2>

      {success && (
        <div className="bg-green-500/20 border border-green-500 rounded p-2 mb-3 text-green-400 text-sm">
          {success}
        </div>
      )}

      {error && (
        <div className="bg-red-500/20 border border-red-500 rounded p-2 mb-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-yellow-400">Categorias cadastradas</h3>
          {isReordering && (
            <div className="text-sm text-yellow-400 flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400 mr-2"></div>
              Salvando ordem...
            </div>
          )}
        </div>
        <div className="text-xs text-gray-400 mb-3">
          📌 Arraste as categorias para alterar sua ordem no cardápio
        </div>
        <div className="overflow-x-auto">
          {categorias.length === 0 ? (
            <div className="text-gray-400 text-sm">Nenhuma categoria cadastrada ainda.</div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={categorias.map(cat => cat._id)} strategy={verticalListSortingStrategy}>
                <ul className="space-y-1 min-w-[220px]">
                  {categorias.map((cat) => (
                    <SortableItem
                      key={cat._id}
                      category={cat}
                      editId={editId}
                      editValue={editValue}
                      editEmoji={editEmoji}
                      showEditEmojiPicker={showEditEmojiPicker}
                      removingId={removingId}
                      onEdit={handleEdit}
                      onEditSave={handleEditSave}
                      onEditCancel={() => {
                        setEditId(null);
                        setEditValue('');
                        setEditEmoji('');
                        setShowEditEmojiPicker(false);
                      }}
                      onRemove={handleRemove}
                      onEditValueChange={setEditValue}
                      onToggleEmojiPicker={() => setShowEditEmojiPicker(!showEditEmojiPicker)}
                      onEmojiSelect={(emoji) => {
                        setEditEmoji(emoji);
                        setShowEditEmojiPicker(false);
                      }}
                      foodEmojis={foodEmojis}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>
    </div>
  );
}