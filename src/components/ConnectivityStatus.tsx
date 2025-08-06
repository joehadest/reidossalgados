'use client';
import React, { useState, useEffect } from 'react';
import { FaWifi, FaExclamationTriangle } from 'react-icons/fa';

export default function ConnectivityStatus() {
    const [isOnline, setIsOnline] = useState(true);
    const [showOfflineMessage, setShowOfflineMessage] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            console.log('Conectividade restaurada');
            setIsOnline(true);
            setShowOfflineMessage(false);
        };

        const handleOffline = () => {
            console.log('Conectividade perdida');
            setIsOnline(false);
            setShowOfflineMessage(true);
        };

        // Verificar status inicial
        setIsOnline(navigator.onLine);

        // Adicionar listeners
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Verificação periódica da conectividade
        const checkConnectivity = async () => {
            try {
                // Tentar fazer uma requisição simples para verificar conectividade real
                const response = await fetch('/api/status', {
                    method: 'HEAD',
                    cache: 'no-cache'
                });
                
                if (!response.ok && isOnline) {
                    console.log('Problema de conectividade detectado via API');
                    setShowOfflineMessage(true);
                }
            } catch (error) {
                if (isOnline) {
                    console.log('Erro de conectividade:', error);
                    setShowOfflineMessage(true);
                }
            }
        };

        const interval = setInterval(checkConnectivity, 30000); // Verificar a cada 30 segundos

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(interval);
        };
    }, [isOnline]);

    if (!showOfflineMessage && isOnline) {
        return null;
    }

    return (
        <div className="fixed bottom-4 left-4 right-4 z-50 bg-red-500/90 border border-red-400 rounded-lg p-3 backdrop-blur-md">
            <div className="flex items-center gap-3">
                <FaExclamationTriangle className="text-white flex-shrink-0" />
                <div className="flex-1">
                    <p className="text-white text-sm font-medium">
                        {!isOnline ? 
                            'Sem conexão com a internet' : 
                            'Problema de conectividade detectado'
                        }
                    </p>
                    <p className="text-red-100 text-xs">
                        Isso pode causar problemas de autenticação
                    </p>
                </div>
                {isOnline && (
                    <button
                        onClick={() => setShowOfflineMessage(false)}
                        className="text-white hover:text-red-200 text-xs"
                    >
                        Ignorar
                    </button>
                )}
            </div>
        </div>
    );
}
