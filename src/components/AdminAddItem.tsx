import React, { useState, useEffect } from 'react';
import { MenuItem, SalgadoFlavor } from '../types/menu';
import { FaTrash, FaEdit, FaCheck, FaTimes, FaPlus, FaMinus } from 'react-icons/fa';

export default function AdminAddItem() {
  const [categorias, setCategorias] = useState<{ _id: string, name: string, emoji?: string }[]>([]);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image: '',
    destaque: false,
    available: true,
  });
  const [flavors, setFlavors] = useState<SalgadoFlavor[]>([{ name: '', description: '', price: 0, available: true }]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [itens, setItens] = useState<MenuItem[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<Partial<MenuItem>>({});
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalFlavors, setModalFlavors] = useState<SalgadoFlavor[]>([]);
  const [sortBy, setSortBy] = useState<'date' | 'alphabetical' | 'priceAsc' | 'priceDesc' | 'availability' | 'category'>('date');

  // Filtra os itens baseado no termo de busca
  const filteredItens = itens.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Função para ordenar os itens
  const sortItems = (items: MenuItem[]) => {
    return [...items].sort((a, b) => {
      switch (sortBy) {
        case 'alphabetical':
          return a.name.localeCompare(b.name);
        
        case 'priceAsc':
          const priceA = a.isMainType && a.flavors?.length ? 
            Math.min(...a.flavors.map(f => f.price)) : (a.price || 0);
          const priceB = b.isMainType && b.flavors?.length ? 
            Math.min(...b.flavors.map(f => f.price)) : (b.price || 0);
          return priceA - priceB;
        
        case 'priceDesc':
          const priceDescA = a.isMainType && a.flavors?.length ? 
            Math.max(...a.flavors.map(f => f.price)) : (a.price || 0);
          const priceDescB = b.isMainType && b.flavors?.length ? 
            Math.max(...b.flavors.map(f => f.price)) : (b.price || 0);
          return priceDescB - priceDescA;
        
        case 'availability':
          // Disponíveis primeiro
          if (a.available && !b.available) return -1;
          if (!a.available && b.available) return 1;
          return a.name.localeCompare(b.name);
        
        case 'category':
          // Ordenar por categoria primeiro, depois por nome
          const categoryA = categorias.find(cat => cat._id === a.category)?.name || '';
          const categoryB = categorias.find(cat => cat._id === b.category)?.name || '';
          const categoryCompare = categoryA.localeCompare(categoryB);
          return categoryCompare !== 0 ? categoryCompare : a.name.localeCompare(b.name);
        
        case 'date':
        default:
          // Por data de criação (mais recentes primeiro)
          const dateA = a._id ? new Date(parseInt(a._id.substring(0, 8), 16) * 1000) : new Date(0);
          const dateB = b._id ? new Date(parseInt(b._id.substring(0, 8), 16) * 1000) : new Date(0);
          return dateB.getTime() - dateA.getTime();
      }
    });
  };

  // Aplica ordenação aos itens filtrados
  const sortedAndFilteredItens = sortItems(filteredItens);

  useEffect(() => {
    async function fetchCategorias() {
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          const categoriasData = data.data.map((cat: any) => ({
            _id: cat._id,
            name: cat.name,
            emoji: cat.emoji || '🍽️' // Emoji padrão se não tiver
          }));
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

  // Funções para gerenciar sabores
  const addFlavor = () => {
    setFlavors([...flavors, { name: '', description: '', price: 0, available: true }]);
  };

  const removeFlavor = (index: number) => {
    if (flavors.length > 1) {
      setFlavors(flavors.filter((_, i) => i !== index));
    }
  };

  const updateFlavor = (index: number, field: keyof SalgadoFlavor, value: any) => {
    const updatedFlavors = flavors.map((flavor, i) => 
      i === index ? { ...flavor, [field]: value } : flavor
    );
    setFlavors(updatedFlavors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');
    
    try {
      // Validar sabores
      const validFlavors = flavors.filter(flavor => flavor.name.trim() && flavor.price > 0);
      if (validFlavors.length === 0) {
        setError('Adicione pelo menos um sabor válido.');
        setLoading(false);
        return;
      }

      // Criar o tipo principal
      const mainTypePayload = {
        name: form.name,
        description: form.description,
        price: parseFloat(form.price) || validFlavors[0].price, // Preço base ou do primeiro sabor
        category: form.category,
        image: form.image,
        destaque: form.destaque,
        available: form.available,
        isMainType: true,
        flavors: validFlavors,
        borderOptions: {},
        extraOptions: {},
        ingredients: [],
      };

      const res = await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mainTypePayload),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(`Item "${form.name}" adicionado com ${validFlavors.length} sabor(es)!`);
        setForm({ 
          name: '', 
          description: '', 
          price: '', 
          category: categorias.length > 0 ? categorias[0]._id : '', 
          image: '', 
          destaque: false, 
          available: true
        });
        setFlavors([{ name: '', description: '', price: 0, available: true }]);
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

  // Funções para gerenciar sabores no modal
  const addModalFlavor = () => {
    setModalFlavors([...modalFlavors, { name: '', description: '', price: 0, available: true }]);
  };

  const removeModalFlavor = (index: number) => {
    if (modalFlavors.length > 1) {
      setModalFlavors(modalFlavors.filter((_, i) => i !== index));
    }
  };

  const updateModalFlavor = (index: number, field: keyof SalgadoFlavor, value: any) => {
    const updatedFlavors = modalFlavors.map((flavor, i) => 
      i === index ? { ...flavor, [field]: value } : flavor
    );
    setModalFlavors(updatedFlavors);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditId(null);
    setEditItem({});
    setModalFlavors([]);
    setError('');
    setSuccess('');
  };

  const handleEdit = (item: MenuItem) => {
    setEditId(item._id);
    setEditItem({
      ...item,
      available: item.available !== false
    });
    
    // Carregar sabores para o modal
    if (item.isMainType && item.flavors && item.flavors.length > 0) {
      const editableFlavors = item.flavors.map((flavor: SalgadoFlavor) => ({
        ...flavor,
        _id: flavor._id || undefined
      }));
      setModalFlavors(editableFlavors);
    } else if (item.isMainType) {
      setModalFlavors([{ name: '', description: '', price: 0, available: true }]);
    } else {
      setModalFlavors([]);
    }
    
    setIsModalOpen(true);
  };

  const handleEditSave = async (id: string) => {
    if (!editItem.name || !editItem.category) {
      setError('Nome e categoria são obrigatórios.');
      return;
    }
    
    setLoading(true);
    setSuccess('');
    setError('');
    
    try {
      let updateData: any = {
        name: editItem.name,
        category: editItem.category,
        description: editItem.description || '',
        image: editItem.image || '',
        destaque: editItem.destaque || false,
        available: editItem.available !== false,
      };

      // Se for um item organizado (com sabores), incluir os sabores
      if (editItem.isMainType) {
        const validFlavors = modalFlavors.filter(flavor => flavor.name.trim() && flavor.price > 0);
        
        if (validFlavors.length === 0) {
          setError('Adicione pelo menos um sabor válido para o item.');
          setLoading(false);
          return;
        }
        
        updateData.flavors = validFlavors;
        updateData.isMainType = true;
        updateData.price = editItem.price || (validFlavors.length > 0 ? validFlavors[0].price : 0);
        
        // Garantir que outros campos de tipo estão definidos
        updateData.borderOptions = editItem.borderOptions || {};
        updateData.extraOptions = editItem.extraOptions || {};
        updateData.ingredients = editItem.ingredients || [];
      } else {
        // Para itens simples, garantir que o preço seja válido
        if (!editItem.price || editItem.price <= 0) {
          setError('Preço deve ser maior que zero.');
          setLoading(false);
          return;
        }
        updateData.price = typeof editItem.price === 'number' ? editItem.price : parseFloat(editItem.price as string) || 0;
        
        // Remover campos específicos de tipos se existirem
        updateData.isMainType = false;
        updateData.flavors = [];
        updateData.parentType = null;
      }

      const res = await fetch(`/api/menu?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(editItem.isMainType ? 'Item editado com sucesso!' : 'Item editado com sucesso!');
        closeModal();
        fetchItens();
      } else {
        setError(data.message || 'Erro ao editar item.');
      }
    } catch (err) {
      console.error('Erro ao editar item:', err);
      setError('Erro ao conectar com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl w-full mx-auto bg-gray-800 rounded-xl p-3 sm:p-6 shadow-lg border border-yellow-500/30">
      <h2 className="text-xl sm:text-2xl font-bold text-yellow-500 mb-4 sm:mb-6 text-center">Adicionar Item</h2>

      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
        {success && <div className="bg-green-700/20 text-green-400 rounded p-2 text-center">{success}</div>}
        {error && <div className="bg-red-700/20 text-red-400 rounded p-2 text-center">{error}</div>}
        
        <div className="bg-blue-900/20 border border-blue-500/30 rounded p-3 mb-4">
          <p className="text-blue-400 text-sm">
            <strong>Sistema Organizado:</strong> Crie um item (ex: "Coxinha", "Refrigerantes") e adicione vários sabores abaixo.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-200 mb-1">Nome do Item</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            placeholder="Ex: Coxinha, Refrigerantes, Doces..."
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
            placeholder="Descrição geral do item"
            className="w-full p-2 rounded bg-gray-900 border border-gray-700 text-white focus:border-yellow-500"
          />
        </div>

        <div>
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
                <option key={cat._id} value={cat._id}>{cat.emoji || '🍽️'} {cat.name}</option>
              ))
            )}
          </select>
        </div>

        {/* Seção de Sabores */}
        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-600">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-yellow-500 font-medium">Sabores</h4>
            <button
              type="button"
              onClick={addFlavor}
              className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 px-3 py-1 rounded text-sm font-medium transition-colors"
            >
              <FaPlus className="inline mr-1" />
              Adicionar
            </button>
          </div>

          <div className="space-y-3">
            {flavors.map((flavor, index) => (
              <div key={index} className="bg-gray-800 rounded p-3 border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-300">Sabor {index + 1}</span>
                  {flavors.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFlavor(index)}
                      className="text-red-500 hover:text-red-400 transition-colors"
                    >
                      <FaMinus />
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 gap-2">
                  <input
                    type="text"
                    placeholder="Nome do sabor (ex: Frango, Queijo...)"
                    value={flavor.name}
                    onChange={(e) => updateFlavor(index, 'name', e.target.value)}
                    className="w-full p-2 rounded bg-gray-900 border border-gray-700 text-white focus:border-yellow-500 text-sm"
                  />
                  
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Preço"
                      value={flavor.price}
                      onChange={(e) => updateFlavor(index, 'price', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                      className="flex-1 p-2 rounded bg-gray-900 border border-gray-700 text-white focus:border-yellow-500 text-sm"
                    />
                    
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={flavor.available}
                        onChange={(e) => updateFlavor(index, 'available', e.target.checked)}
                        className="h-4 w-4 text-green-500 focus:ring-green-400 border-gray-700 rounded"
                      />
                      <label className="text-gray-300 text-sm">Disponível</label>
                    </div>
                  </div>
                  
                  <input
                    type="text"
                    placeholder="Descrição (opcional)"
                    value={flavor.description || ''}
                    onChange={(e) => updateFlavor(index, 'description', e.target.value)}
                    className="w-full p-2 rounded bg-gray-900 border border-gray-700 text-white focus:border-yellow-500 text-sm"
                  />
                </div>
              </div>
            ))}
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

        <div className="mb-4 space-y-3">
          {/* Dropdown de Ordenação */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Ordenar por:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="w-full p-2 rounded bg-gray-900 border border-gray-700 text-white focus:border-yellow-500"
            >
              <option value="date">📅 Data de adição (mais recentes primeiro)</option>
              <option value="alphabetical">🔤 Ordem alfabética (A-Z)</option>
              <option value="category">🏷️ Por categoria</option>
              <option value="priceAsc">💰 Preço crescente (menor primeiro)</option>
              <option value="priceDesc">💸 Preço decrescente (maior primeiro)</option>
              <option value="availability">✅ Disponibilidade (disponíveis primeiro)</option>
            </select>
          </div>

          {/* Barra de Busca */}
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

        {/* Informações sobre a exibição atual */}
        {sortedAndFilteredItens.length > 0 && (
          <div className="mb-3 text-xs text-gray-400 flex items-center justify-between">
            <span>
              Exibindo {sortedAndFilteredItens.length} de {itens.length} itens
              {searchTerm && ` para "${searchTerm}"`}
            </span>
            <span className="flex items-center gap-1">
              🔄 {
                sortBy === 'date' ? 'Por data de adição' :
                sortBy === 'alphabetical' ? 'Alfabética A-Z' :
                sortBy === 'category' ? 'Por categoria' :
                sortBy === 'priceAsc' ? 'Preço crescente' :
                sortBy === 'priceDesc' ? 'Preço decrescente' :
                'Por disponibilidade'
              }
            </span>
          </div>
        )}

        <div className="overflow-x-auto">
          {itens.length === 0 ? (
            <div className="text-gray-400 text-sm">Nenhum item cadastrado ainda.</div>
          ) : sortedAndFilteredItens.length === 0 ? (
            <div className="text-gray-400 text-sm">Nenhum item encontrado para "{searchTerm}"</div>
          ) : (
            <div className="space-y-6">
              {categorias.map((categoria) => {
                const itensCategoria = sortedAndFilteredItens.filter(item => item.category === categoria._id);
                if (itensCategoria.length === 0) return null;

                return (
                  <div key={categoria._id} className="bg-gray-900/50 rounded-lg p-4">
                    <h4 className="text-yellow-500 font-medium mb-3 border-b border-yellow-500/30 pb-2">{categoria.name}</h4>
                    <ul className="space-y-3">
                      {itensCategoria.map((item) => (
                        <li key={item._id} className="bg-gray-800 rounded border border-gray-700 hover:border-yellow-500/50 transition-colors">
                          {item.isMainType ? (
                            // Exibição para itens organizados
                            <div className="p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-yellow-400 text-lg">🍽️ {item.name}</span>
                                  {!item.available && (
                                    <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">
                                      Indisponível
                                    </span>
                                  )}
                                </div>
                                <div className="flex gap-2">
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
                              </div>
                              
                              <p className="text-gray-400 text-sm mb-3">{item.description}</p>
                              
                              {item.flavors && item.flavors.length > 0 && (
                                <div className="bg-gray-900/70 rounded p-3 border border-gray-600">
                                  <h5 className="text-green-400 font-medium mb-2 text-sm">Sabores disponíveis:</h5>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {item.flavors.map((flavor, index) => (
                                      <div key={index} className="flex items-center justify-between bg-gray-800 rounded px-3 py-2">
                                        <div>
                                          <span className={`text-sm font-medium ${flavor.available ? 'text-white' : 'text-gray-500 line-through'}`}>
                                            {flavor.name}
                                          </span>
                                          {flavor.description && (
                                            <p className="text-xs text-gray-400">{flavor.description}</p>
                                          )}
                                        </div>
                                        <div className="text-right">
                                          <span className={`text-sm font-bold ${flavor.available ? 'text-green-400' : 'text-gray-500'}`}>
                                            R$ {flavor.price.toFixed(2)}
                                          </span>
                                          {!flavor.available && (
                                            <p className="text-xs text-red-400">Indisponível</p>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            // Exibição para itens simples
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 px-3 py-2">
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
                            </div>
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

      {/* Modal de Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-yellow-500/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-yellow-500">
                {editItem.isMainType ? '🍽️ Editar Item' : '📝 Editar Item'}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <FaTimes size={20} />
              </button>
            </div>

            {success && <div className="bg-green-700/20 text-green-400 rounded p-2 text-center mb-4">{success}</div>}
            {error && <div className="bg-red-700/20 text-red-400 rounded p-2 text-center mb-4">{error}</div>}
            
            <div className="space-y-4">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">
                  {editItem.isMainType ? 'Nome do Item' : 'Nome'}
                </label>
                <input
                  type="text"
                  value={editItem.name || ''}
                  onChange={e => setEditItem({ ...editItem, name: e.target.value })}
                  className="w-full p-3 rounded bg-gray-900 border border-gray-700 text-white focus:border-yellow-500"
                  placeholder={editItem.isMainType ? "Ex: Coxinha, Refrigerantes..." : "Nome do item"}
                />
              </div>

              {/* Categoria */}
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">Categoria</label>
                <select
                  value={editItem.category || ''}
                  onChange={e => setEditItem({ ...editItem, category: e.target.value })}
                  className="w-full p-3 rounded bg-gray-900 border border-gray-700 text-white focus:border-yellow-500"
                >
                  {categorias.length === 0 ? (
                    <option value="">Nenhuma categoria</option>
                  ) : (
                    categorias.map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.emoji || '🍽️'} {cat.name}</option>
                    ))
                  )}
                </select>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">Descrição</label>
                <textarea
                  value={editItem.description || ''}
                  onChange={e => setEditItem({ ...editItem, description: e.target.value })}
                  className="w-full p-3 rounded bg-gray-900 border border-gray-700 text-white focus:border-yellow-500"
                  rows={3}
                  placeholder="Descrição do item"
                />
              </div>

              {/* Preço para itens simples */}
              {!editItem.isMainType && (
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">Preço (R$)</label>
                  <input
                    type="number"
                    value={editItem.price?.toString() || ''}
                    onChange={e => setEditItem({ ...editItem, price: parseFloat(e.target.value) || 0 })}
                    className="w-full p-3 rounded bg-gray-900 border border-gray-700 text-white focus:border-yellow-500"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              )}

              {/* Sabores para itens organizados */}
              {editItem.isMainType && (
                <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-600">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-yellow-500 font-medium">Sabores</h4>
                    <button
                      type="button"
                      onClick={addModalFlavor}
                      className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 px-3 py-1 rounded text-sm font-medium transition-colors"
                    >
                      <FaPlus className="inline mr-1" />
                      Adicionar
                    </button>
                  </div>

                  <div className="space-y-3">
                    {modalFlavors.map((flavor, index) => (
                      <div key={index} className="bg-gray-800 rounded p-3 border border-gray-700">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-300">Sabor {index + 1}</span>
                          {modalFlavors.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeModalFlavor(index)}
                              className="text-red-500 hover:text-red-400 transition-colors"
                            >
                              <FaMinus />
                            </button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 gap-2">
                          <input
                            type="text"
                            placeholder="Nome do sabor (ex: Frango, Queijo...)"
                            value={flavor.name}
                            onChange={(e) => updateModalFlavor(index, 'name', e.target.value)}
                            className="w-full p-2 rounded bg-gray-900 border border-gray-700 text-white focus:border-yellow-500 text-sm"
                          />
                          
                          <div className="flex gap-2">
                            <input
                              type="number"
                              placeholder="Preço"
                              value={flavor.price}
                              onChange={(e) => updateModalFlavor(index, 'price', parseFloat(e.target.value) || 0)}
                              min="0"
                              step="0.01"
                              className="flex-1 p-2 rounded bg-gray-900 border border-gray-700 text-white focus:border-yellow-500 text-sm"
                            />
                            
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={flavor.available}
                                onChange={(e) => updateModalFlavor(index, 'available', e.target.checked)}
                                className="h-4 w-4 text-green-500 focus:ring-green-400 border-gray-700 rounded"
                              />
                              <label className="text-gray-300 text-sm">Disponível</label>
                            </div>
                          </div>
                          
                          <input
                            type="text"
                            placeholder="Descrição (opcional)"
                            value={flavor.description || ''}
                            onChange={(e) => updateModalFlavor(index, 'description', e.target.value)}
                            className="w-full p-2 rounded bg-gray-900 border border-gray-700 text-white focus:border-yellow-500 text-sm"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Imagem */}
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">Imagem (URL)</label>
                <input
                  type="text"
                  value={editItem.image || ''}
                  onChange={e => setEditItem({ ...editItem, image: e.target.value })}
                  className="w-full p-3 rounded bg-gray-900 border border-gray-700 text-white focus:border-yellow-500"
                  placeholder="https://exemplo.com/imagem.jpg"
                />
              </div>

              {/* Opções */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={editItem.destaque || false}
                    onChange={e => setEditItem({ ...editItem, destaque: e.target.checked })}
                    className="h-4 w-4 text-yellow-500 focus:ring-yellow-400 border-gray-700 rounded"
                  />
                  <label className="text-gray-200 text-sm">Destaque</label>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={editItem.available !== false}
                    onChange={e => setEditItem({ ...editItem, available: e.target.checked })}
                    className="h-4 w-4 text-green-500 focus:ring-green-400 border-gray-700 rounded"
                  />
                  <label className="text-gray-200 text-sm">Disponível</label>
                </div>
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => handleEditSave(editId!)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-60"
                  disabled={loading}
                >
                  <FaCheck className="inline mr-2" />
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
                <button
                  onClick={closeModal}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                >
                  <FaTimes className="inline mr-2" />
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
