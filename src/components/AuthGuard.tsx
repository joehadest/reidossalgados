'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AuthCookieManager from '@/utils/auth-cookies';
import AuthNotification from './AuthNotification';

interface AuthGuardProps {
    children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
    const router = useRouter();
    const pathname = usePathname();
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const [notification, setNotification] = useState<{
        message: string;
        type: 'warning' | 'info' | 'error';
        show: boolean;
    }>({ message: '', type: 'info', show: false });
    
    // Páginas que não precisam de autenticação
    const publicPages = ['/admin/login', '/admin/init'];
    const isPublicPage = publicPages.includes(pathname);

    const showNotification = (message: string, type: 'warning' | 'info' | 'error' = 'info') => {
        setNotification({ message, type, show: true });
    };

    const hideNotification = () => {
        setNotification(prev => ({ ...prev, show: false }));
    };

    useEffect(() => {
        // Não verificar autenticação em páginas públicas
        if (isPublicPage) {
            return;
        }

        const checkAuth = () => {
            const isAuth = AuthCookieManager.isAuthenticated();
            
            console.log('Verificação de autenticação:', {
                pathname,
                isAuth,
                cookie: AuthCookieManager.getAuthCookie(),
                timestamp: new Date().toISOString()
            });
            
            if (!isAuth) {
                console.log('Usuário não autenticado, redirecionando para login...');
                showNotification('Sessão expirada. Redirecionando para login...', 'warning');
                
                // Limpar cookie inválido
                AuthCookieManager.removeAuthCookie();
                
                setTimeout(() => {
                    router.push('/admin/login');
                }, 2000); // Aguardar 2 segundos para mostrar a notificação
                
                return false;
            }
            
            // Renovar cookie para manter sessão ativa
            AuthCookieManager.renewAuthCookie();
            return true;
        };

        // Verificação inicial
        const initialCheck = checkAuth();
        
        if (initialCheck) {
            // Configurar verificação periódica a cada 30 segundos
            intervalRef.current = setInterval(() => {
                checkAuth();
            }, 30000); // 30 segundos
        }

        // Cleanup
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [pathname, isPublicPage, router]);

    // Verificar quando a página ganha foco (usuário volta para a aba)
    useEffect(() => {
        if (isPublicPage) {
            return;
        }

        const handleFocus = () => {
            console.log('Página ganhou foco, verificando autenticação...');
            const isAuth = AuthCookieManager.isAuthenticated();
            
            if (!isAuth) {
                console.log('Sessão expirada durante inatividade');
                showNotification('Sessão expirada por inatividade. Redirecionando...', 'error');
                
                AuthCookieManager.removeAuthCookie();
                
                setTimeout(() => {
                    router.push('/admin/login');
                }, 2000);
            } else {
                // Renovar cookie
                AuthCookieManager.renewAuthCookie();
            }
        };

        window.addEventListener('focus', handleFocus);
        window.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                handleFocus();
            }
        });

        return () => {
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('visibilitychange', handleFocus);
        };
    }, [isPublicPage, router]);

    return (
        <>
            <AuthNotification
                message={notification.message}
                type={notification.type}
                show={notification.show}
                onClose={hideNotification}
            />
            {children}
        </>
    );
}
