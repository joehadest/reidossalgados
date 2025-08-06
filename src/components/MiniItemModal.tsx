import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaMinus, FaTimes, FaStar, FaInfoCircle } from 'react-icons/fa';
import { MenuItem } from '../types/menu';
import Image from 'next/image';

interface MiniItemModalProps {
  item: MenuItem;
  onClose: () => void;
  onAdd: (quantity: number, observation: string, extras?: string[]) => void;
}

export default function MiniItemModal({ item, onClose, onAdd }: MiniItemModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [observation, setObservation] = useState('');
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);

  useEffect(() => {
    // Função mais inteligente que permite scroll dentro do modal
    const preventScroll = (e: TouchEvent) => {
      const target = e.target as Element;
      const modalContent = document.querySelector('[data-modal-content]');

      // Se o evento não é dentro do modal, bloqueia
      if (modalContent && !modalContent.contains(target)) {
        e.preventDefault();
      }
    };

    // Bloquear scroll do body
    document.body.classList.add('overflow-hidden');

    // Prevenir scroll em dispositivos touch apenas fora do modal
    document.body.addEventListener('touchmove', preventScroll, { passive: false });

    return () => {
      document.body.classList.remove('overflow-hidden');
      document.body.removeEventListener('touchmove', preventScroll);
    };
  }, []);

  const toggleExtra = (extra: string) => {
    // Verificar se o extra é um sabor (flavor) ou uma opção extra (extraOption)
    const isFlavor = item.flavors?.some(flavor => flavor.name === extra);
    const isExtraOption = item.extraOptions && Object.keys(item.extraOptions).includes(extra);

    if (isFlavor) {
      // Para sabores (flavors), permitir apenas uma seleção
      setSelectedExtras(prev => {
        // Remove outros sabores e mantém apenas extras
        const currentExtras = prev.filter(e =>
          item.extraOptions && Object.keys(item.extraOptions).includes(e)
        );
        // Se o sabor já está selecionado, remove. Senão, adiciona.
        return prev.includes(extra)
          ? currentExtras
          : [...currentExtras, extra];
      });
    } else if (isExtraOption) {
      // Para extras/coberturas, permitir múltiplas seleções
      setSelectedExtras(prev =>
        prev.includes(extra)
          ? prev.filter(e => e !== extra)
          : [...prev, extra]
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar se tem sabores disponíveis e se algum foi selecionado
    if (item.flavors && item.flavors.length > 0) {
      const hasSelectedFlavor = selectedExtras.some(extra =>
        item.flavors?.some(flavor => flavor.name === extra)
      );

      if (!hasSelectedFlavor) {
        return; // Não permite envio sem sabor selecionado
      }
    }

    let finalObservation = observation;

    // Não incluir os extras na observação, pois agora são passados separadamente

    onAdd(quantity, finalObservation, selectedExtras);
  };

  // Calcular preço total incluindo extras e sabores
  const calculatePrice = () => {
    let total = 0;
    let hasSelectedFlavor = false;

    selectedExtras.forEach(extra => {
      // Se é um sabor, usar o preço do sabor
      const flavor = item.flavors?.find(f => f.name === extra);
      if (flavor) {
        total += flavor.price;
        hasSelectedFlavor = true;
      } else if (item.extraOptions?.[extra] !== undefined) {
        // Se é um extra, somar o preço do extra
        total += item.extraOptions[extra];
      }
    });

    // Se não há sabor selecionado e tem flavors disponíveis, usar preço base
    if (!hasSelectedFlavor && item.flavors && item.flavors.length > 0) {
      total += item.price;
    } else if (!hasSelectedFlavor && (!item.flavors || item.flavors.length === 0)) {
      // Se não tem flavors, usar preço base
      total += item.price;
    }

    return total;
  };

  const totalPrice = calculatePrice() * quantity;

  // Verificar se precisa selecionar sabor
  const needsFlavorSelection = item.flavors && item.flavors.length > 0;
  const hasSelectedFlavor = needsFlavorSelection ? selectedExtras.some(extra =>
    item.flavors?.some(flavor => flavor.name === extra)
  ) : true;

  const canAddToCart = !needsFlavorSelection || hasSelectedFlavor;

  if (!item.available) {
    // Only show header with image and description if item is unavailable
    return (
      <AnimatePresence>
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            data-modal-content
            className="bg-gray-900 rounded-2xl w-full max-w-md mx-2 shadow-2xl border border-red-500/30 overflow-hidden max-h-[90vh] overflow-y-auto overflow-x-hidden"
            initial={{ scale: 0.9, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 30, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="relative h-32 sm:h-48 bg-gradient-to-br from-red-500/20 to-red-600/20">
              {item.image && (
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover opacity-50"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent"></div>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="absolute top-3 right-3 w-8 h-8 bg-gray-900/80 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-gray-800 transition-colors"
              >
                <FaTimes />
              </motion.button>

              <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 right-2 sm:right-4">
                <h2 className="text-lg sm:text-2xl font-bold text-white mb-1 drop-shadow-lg">{item.name}</h2>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-red-400 text-base sm:text-lg">Item Indisponível</span>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              {item.description && (
                <div className="mb-4">
                  <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">{item.description}</p>
                </div>
              )}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="w-full py-2.5 sm:py-3 px-3 sm:px-4 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium text-sm sm:text-base"
              >
                Fechar
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          data-modal-content
          className="bg-gray-900 rounded-2xl w-full max-w-md mx-2 shadow-2xl border border-yellow-500/30 overflow-hidden max-h-[90vh] overflow-y-auto overflow-x-hidden"
          initial={{ scale: 0.9, y: 30, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 30, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header com imagem */}
          <div className="relative h-32 sm:h-48 bg-gradient-to-br from-yellow-500/20 to-yellow-600/20">
            {item.image && (
              <Image
                src={item.image}
                alt={item.name}
                fill
                className="object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent"></div>

            {/* Botão fechar */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="absolute top-3 right-3 w-8 h-8 bg-gray-900/80 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-gray-800 transition-colors"
            >
              <FaTimes />
            </motion.button>

            {/* Badge de destaque */}
            {item.destaque && (
              <div className="absolute top-3 left-3 bg-yellow-500 text-gray-900 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                <FaStar className="text-xs" />
                Destaque
              </div>
            )}

            {/* Informações do item */}
            <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 right-2 sm:right-4">
              <h2 className="text-lg sm:text-2xl font-bold text-white mb-1 drop-shadow-lg">{item.name}</h2>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-yellow-400 font-bold text-base sm:text-lg">R$ {item.price.toFixed(2)}</span>
                {item.category && (
                  <span className="text-gray-300 text-xs sm:text-sm bg-gray-800/80 px-2 py-1 rounded-full">
                    {item.category === 'salgados' ? 'Salgado' : 'Porção'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Conteúdo */}
          <div className="p-4 sm:p-6">
            {/* Descrição */}
            {item.description && (
              <div className="mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-2 flex items-center gap-2">
                  <FaInfoCircle className="text-yellow-500 text-sm sm:text-base" />
                  Descrição
                </h3>
                <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">{item.description}</p>
              </div>
            )}

            {/* Extras/Coberturas ou Sabores */}
            {((item.extraOptions && Object.keys(item.extraOptions).length > 0) || (item.flavors && item.flavors.length > 0)) && (
              <div className="mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  {item.flavors && item.flavors.length > 0 ? '🍽️ Sabores Disponíveis' : '🍫 Extras/Coberturas'}
                </h3>

                {/* Se tem flavors, mostrar sabores */}
                {item.flavors && item.flavors.length > 0 && (
                  <div className="grid grid-cols-1 gap-2 sm:gap-3">
                    {item.flavors.map((flavor) => (
                      <motion.button
                        key={flavor.name}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => toggleExtra(flavor.name)}
                        className={`p-2 sm:p-3 rounded-lg border-2 transition-all text-xs sm:text-sm text-left ${selectedExtras.includes(flavor.name)
                          ? 'border-yellow-500 bg-yellow-500/20 text-yellow-400'
                          : 'border-gray-700 hover:border-yellow-500 text-gray-300'
                          }`}
                      >
                        <div className="font-semibold">{flavor.name}</div>
                        {flavor.description && (
                          <div className="text-xs opacity-80 mt-1">{flavor.description}</div>
                        )}
                        <div className="text-xs opacity-80 mt-1">
                          R$ {flavor.price.toFixed(2)}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}

                {/* Se tem extraOptions, mostrar extras */}
                {item.extraOptions && Object.keys(item.extraOptions).length > 0 && (
                  <>
                    {/* Se tem flavors também, adicionar uma separação visual */}
                    {item.flavors && item.flavors.length > 0 && (
                      <div className="mt-4 mb-3">
                        <h3 className="text-sm sm:text-base font-semibold text-blue-400 mb-3">
                          🍫 Extras/Coberturas (Opcionais)
                        </h3>
                      </div>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                      {Object.entries(item.extraOptions).map(([extra, price]) => (
                        <motion.button
                          key={extra}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="button"
                          onClick={() => toggleExtra(extra)}
                          className={`p-2 sm:p-3 rounded-lg border-2 transition-all text-xs sm:text-sm ${selectedExtras.includes(extra)
                            ? 'border-yellow-500 bg-yellow-500/20 text-yellow-400'
                            : 'border-gray-700 hover:border-yellow-500 text-gray-300'
                            }`}
                        >
                          <div className="font-semibold">{extra}</div>
                          <div className="text-xs opacity-80">
                            {price > 0 ? `+ R$ ${price.toFixed(2)}` : 'Grátis'}
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </>
                )}

                {selectedExtras.length > 0 && (
                  <div className="mt-2 text-xs text-yellow-400">
                    {item.flavors && item.flavors.length > 0 ? 'Sabor selecionado: ' : 'Selecionados: '}{selectedExtras.join(', ')}
                  </div>
                )}
              </div>
            )}



            {/* Formulário */}
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              {/* Quantidade */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2 sm:mb-3">
                  Quantidade
                </label>
                <div className="flex items-center justify-center gap-3 sm:gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.1 }}
                    type="button"
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-800 text-yellow-500 hover:bg-gray-700 border-2 border-gray-700 hover:border-yellow-500 transition-all duration-150 flex items-center justify-center"
                  >
                    <FaMinus className="text-sm sm:text-base" />
                  </motion.button>

                  <div className="text-center">
                    <input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={e => setQuantity(Math.max(1, Number(e.target.value)))}
                      className="w-14 sm:w-16 text-center bg-gray-800 text-white text-lg sm:text-xl font-bold border-2 border-gray-700 rounded-lg focus:outline-none focus:border-yellow-500 transition-colors"
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.1 }}
                    type="button"
                    onClick={() => setQuantity(q => q + 1)}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-800 text-yellow-500 hover:bg-gray-700 border-2 border-gray-700 hover:border-yellow-500 transition-all duration-150 flex items-center justify-center"
                  >
                    <FaPlus className="text-sm sm:text-base" />
                  </motion.button>
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                  Observações (opcional)
                </label>
                <textarea
                  value={observation}
                  onChange={e => setObservation(e.target.value)}
                  className="w-full bg-gray-800 text-white border-2 border-gray-700 rounded-lg p-2 sm:p-3 focus:outline-none focus:border-yellow-500 transition-colors resize-none text-xs sm:text-sm"
                  rows={2}
                  placeholder=""
                />
              </div>

              {/* Preço total */}
              <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4 border border-gray-700">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-xs sm:text-sm">Preço unitário:</span>
                  <span className="text-white font-semibold text-sm sm:text-base">R$ {calculatePrice().toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-gray-300 text-xs sm:text-sm">Quantidade:</span>
                  <span className="text-white font-semibold text-sm sm:text-base">{quantity}</span>
                </div>
                <div className="border-t border-gray-700 mt-3 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-base sm:text-lg font-semibold text-white">Total:</span>
                    <span className="text-xl sm:text-2xl font-bold text-yellow-500">R$ {totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Botões */}
              <div className="flex flex-col gap-2 sm:gap-3 pt-2">
                {/* Mensagem de aviso se precisa selecionar sabor */}
                {needsFlavorSelection && !hasSelectedFlavor && (
                  <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-2 sm:p-3">
                    <p className="text-yellow-400 text-xs sm:text-sm text-center font-medium">
                      ⚠️ Selecione um sabor para continuar
                    </p>
                  </div>
                )}

                <div className="flex gap-2 sm:gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2.5 sm:py-3 px-3 sm:px-4 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium text-sm sm:text-base"
                  >
                    {!item.available ? 'Fechar' : 'Cancelar'}
                  </motion.button>
                  {item.available && (
                    <motion.button
                      whileHover={canAddToCart ? { scale: 1.02 } : {}}
                      whileTap={canAddToCart ? { scale: 0.98 } : {}}
                      type="submit"
                      disabled={!canAddToCart}
                      className={`flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg transition-all font-bold shadow-lg text-sm sm:text-base ${canAddToCart
                          ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-gray-900 hover:from-yellow-600 hover:to-yellow-700'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
                        }`}
                    >
                      Adicionar ao Carrinho
                    </motion.button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
} 