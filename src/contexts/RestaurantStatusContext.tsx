'use client';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface RestaurantStatus {
    isOpen: boolean;
    horarioAbertura: string;
    horarioFechamento: string;
    diasFuncionamento: string[];
    mensagemFechado?: string;
}

interface RestaurantStatusContextType {
    status: RestaurantStatus | null;
    isOpen: boolean;
    loading: boolean;
    error: string | null;
    refreshStatus: () => Promise<void>;
}

const RestaurantStatusContext = createContext<RestaurantStatusContextType | undefined>(undefined);

export function RestaurantStatusProvider({ children }: { children: ReactNode }) {
    const [status, setStatus] = useState<RestaurantStatus | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStatus = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            const res = await fetch('/api/status');
            const data = await res.json();
            
            if (data.isOpen !== undefined) {
                setStatus(data);
                setIsOpen(data.isOpen);
            } else {
                throw new Error('Dados de status inválidos');
            }
        } catch (err) {
            console.error('Erro ao buscar status do restaurante:', err);
            setError('Erro ao carregar status do restaurante');
            // Fallback para status padrão
            setStatus({
                isOpen: false,
                horarioAbertura: '18:00',
                horarioFechamento: '23:00',
                diasFuncionamento: ['quarta', 'quinta', 'sexta', 'sabado', 'domingo', 'segunda'],
                mensagemFechado: 'Estamos fechados. Volte em breve!'
            });
            setIsOpen(false);
        } finally {
            setLoading(false);
        }
    }, []);

    const refreshStatus = useCallback(async () => {
        await fetchStatus();
    }, [fetchStatus]);

    // Carregar status inicial
    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    // Atualizar status a cada minuto
    useEffect(() => {
        const interval = setInterval(() => {
            fetchStatus();
        }, 60000); // 1 minuto

        return () => clearInterval(interval);
    }, [fetchStatus]);

    return (
        <RestaurantStatusContext.Provider value={{
            status,
            isOpen,
            loading,
            error,
            refreshStatus
        }}>
            {children}
        </RestaurantStatusContext.Provider>
    );
}

export function useRestaurantStatus() {
    const context = useContext(RestaurantStatusContext);
    if (context === undefined) {
        throw new Error('useRestaurantStatus deve ser usado dentro de um RestaurantStatusProvider');
    }
    return context;
} 