import React, { useState } from 'react';
import { FaSync, FaEye, FaPlay, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

export default function MenuMigration() {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handlePreview = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    
    try {
      const response = await fetch('/api/migrate-menu', { method: 'GET' });
      const data = await response.json();
      
      if (data.success) {
        setPreview(data);
      } else {
        setError(data.message || 'Erro ao visualizar migração');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleMigrate = async () => {
    if (!window.confirm('Tem certeza que deseja migrar todos os itens? Esta ação não pode ser desfeita.')) {
      return;
    }

    setLoading(true);
    setError('');
    setPreview(null);
    
    try {
      const response = await fetch('/api/migrate-menu', { method: 'POST' });
      const data = await response.json();
      
      if (data.success) {
        setResult(data);
      } else {
        setError(data.message || 'Erro durante a migração');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-gray-800 rounded-xl p-6 shadow-lg border border-yellow-500/30">
      <h2 className="text-2xl font-bold text-yellow-500 mb-6 text-center">
        <FaSync className="inline mr-2" />
        Migração para Tipos de Salgados
      </h2>

      <div className="bg-blue-900/20 border border-blue-500/30 rounded p-4 mb-6">
        <h3 className="text-blue-400 font-semibold mb-2">O que faz esta migração?</h3>
        <ul className="text-blue-300 text-sm space-y-1">
          <li>• Converte itens individuais em "Tipos de Salgados" com sabores</li>
          <li>• Agrupa itens similares (ex: "Coxinha - Frango", "Coxinha - Queijo" → Tipo "Coxinha")</li>
          <li>• Mantém todos os preços e configurações originais</li>
          <li>• Organiza o cardápio de forma mais profissional</li>
        </ul>
      </div>

      {error && (
        <div className="bg-red-700/20 text-red-400 rounded p-3 mb-4 flex items-center">
          <FaExclamationTriangle className="mr-2" />
          {error}
        </div>
      )}

      {result && (
        <div className="bg-green-700/20 text-green-400 rounded p-4 mb-6">
          <div className="flex items-center mb-3">
            <FaCheckCircle className="mr-2" />
            <h3 className="font-semibold">Migração Concluída!</h3>
          </div>
          <p className="mb-3">{result.message}</p>
          
          {result.results && result.results.length > 0 && (
            <div className="bg-gray-900/50 rounded p-3">
              <h4 className="text-sm font-medium mb-2">Detalhes da migração:</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {result.results.map((item: any, index: number) => (
                  <div key={index} className="text-xs">
                    {item.action === 'converted_to_type' ? (
                      <span>✓ Convertido "{item.original}" → Tipo "{item.newType}" (1 sabor)</span>
                    ) : (
                      <span>✓ Agrupado {item.original.length} itens → Tipo "{item.newType}" ({item.flavors} sabores)</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {preview && (
        <div className="bg-gray-900/50 rounded p-4 mb-6">
          <h3 className="text-yellow-400 font-semibold mb-3">Preview da Migração</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-800 rounded p-3">
              <h4 className="text-green-400 text-sm font-medium">Resumo</h4>
              <p className="text-gray-300 text-sm">
                {preview.totalItemsToMigrate} itens serão organizados em {preview.typesToCreate} tipos de salgados
              </p>
            </div>
          </div>
          
          {preview.preview && preview.preview.length > 0 && (
            <div>
              <h4 className="text-gray-300 text-sm font-medium mb-2">Tipos que serão criados:</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {preview.preview.map((type: any, index: number) => (
                  <div key={index} className="bg-gray-800 rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-yellow-400 font-medium">{type.newTypeName}</h5>
                      <span className="text-xs text-gray-400">{type.flavorsCount} sabor(es)</span>
                    </div>
                    <div className="text-xs text-gray-400 space-y-1">
                      {type.itemsToGroup.map((item: any, itemIndex: number) => (
                        <div key={itemIndex} className="flex justify-between">
                          <span>{item.name}</span>
                          <span>R$ {item.price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-4 justify-center">
        <button
          onClick={handlePreview}
          disabled={loading}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          <FaEye />
          {loading ? 'Carregando...' : 'Visualizar Migração'}
        </button>

        {preview && !result && (
          <button
            onClick={handleMigrate}
            disabled={loading}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            <FaPlay />
            {loading ? 'Migrando...' : 'Executar Migração'}
          </button>
        )}
      </div>

      {result && (
        <div className="text-center mt-4">
          <p className="text-green-400 text-sm">
            ✅ Migração concluída! Recarregue a página para ver os novos tipos de salgados.
          </p>
        </div>
      )}
    </div>
  );
}
