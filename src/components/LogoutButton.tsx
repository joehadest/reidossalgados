'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { FaSignOutAlt } from 'react-icons/fa';
import AuthCookieManager from '@/utils/auth-cookies';

interface LogoutButtonProps {
    className?: string;
    variant?: 'primary' | 'secondary' | 'minimal';
    showText?: boolean;
}

export default function LogoutButton({ 
    className = '', 
    variant = 'secondary',
    showText = true 
}: LogoutButtonProps) {
    const router = useRouter();

    const handleLogout = () => {
        try {
            console.log('Realizando logout...');
            
            // Remover cookie de autenticação
            AuthCookieManager.removeAuthCookie();
            
            // Aguardar um pouco para garantir que o cookie foi removido
            setTimeout(() => {
                console.log('Redirecionando para login após logout...');
                router.push('/admin/login');
            }, 100);
        } catch (error) {
            console.error('Erro durante logout:', error);
            // Forçar redirecionamento mesmo com erro
            router.push('/admin/login');
        }
    };

    const getButtonClasses = () => {
        const baseClasses = 'flex items-center gap-2 transition-colors duration-200';
        
        switch (variant) {
            case 'primary':
                return `${baseClasses} bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium`;
            case 'secondary':
                return `${baseClasses} bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm`;
            case 'minimal':
                return `${baseClasses} text-red-400 hover:text-red-300 text-sm`;
            default:
                return `${baseClasses} ${className}`;
        }
    };

    return (
        <button
            onClick={handleLogout}
            className={`${getButtonClasses()} ${className}`}
            title="Sair do sistema"
        >
            <FaSignOutAlt size={showText ? 14 : 16} />
            {showText && <span>Sair</span>}
        </button>
    );
}
