'use client';
import React, { useState } from 'react';
import { FaTools, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

export default function MigrateAddressPage() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const handleMigrate = async () => {
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await fetch('/api/pedidos/migrate-address', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (data.success) {
                setResult(data);
            } else {
                setError(data.message || 'Erro na migração');
            }
        } catch (err) {
            setError('Erro ao conectar com o servidor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <div className="max-w-4xl mx-auto">
                <div className="bg-gray-800 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <FaTools className="text-yellow-500 text-2xl" />
                        <h1 className="text-2xl font-bold">Migração de Endereços</h1>
                    </div>

                    <div className="bg-gray-700 rounded-lg p-4 mb-6">
                        <h2 className="text-lg font-semibold mb-3">O que esta migração faz:</h2>
                        <ul className="space-y-2 text-gray-300">
                            <li>• Verifica todos os pedidos existentes no banco de dados</li>
                            <li>• Corrige a estrutura dos dados de endereço</li>
                            <li>• Converte endereços em formato string para objeto estruturado</li>
                            <li>• Garante que todos os pedidos tenham a estrutura correta</li>
                        </ul>
                    </div>

                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
                        <div className="flex items-center gap-2 mb-2">
                            <FaExclamationTriangle className="text-yellow-500" />
                            <span className="font-semibold text-yellow-500">Atenção</span>
                        </div>
                        <p className="text-gray-300">
                            Esta operação irá modificar os dados existentes no banco de dados. 
                            Certifique-se de que você tem um backup antes de prosseguir.
                        </p>
                    </div>

                    <button
                        onClick={handleMigrate}
                        disabled={loading}
                        className="bg-yellow-500 text-gray-900 font-bold py-3 px-6 rounded-lg hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
                                Executando migração...
                            </>
                        ) : (
                            <>
                                <FaTools />
                                Executar Migração
                            </>
                        )}
                    </button>

                    {result && (
                        <div className="mt-6 bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <FaCheckCircle className="text-green-500" />
                                <span className="font-semibold text-green-500">Migração Concluída</span>
                            </div>
                            <p className="text-gray-300 mb-2">{result.message}</p>
                            <div className="text-sm text-gray-400">
                                <p>Pedidos atualizados: {result.updatedCount}</p>
                                <p>Total de pedidos: {result.totalCount}</p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mt-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <FaExclamationTriangle className="text-red-500" />
                                <span className="font-semibold text-red-500">Erro</span>
                            </div>
                            <p className="text-gray-300">{error}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 