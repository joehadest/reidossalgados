import Cookies from 'js-cookie';

export interface CookieOptions {
    expires?: number;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
    path?: string;
    domain?: string;
}

class AuthCookieManager {
    private static readonly AUTH_COOKIE_NAME = 'isAuthenticated';
    private static readonly DEFAULT_EXPIRES_DAYS = 1;

    /**
     * Define um cookie de autenticação com configurações seguras para mobile
     */
    static setAuthCookie(value: string = 'true'): void {
        try {
            const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
            
            const options: CookieOptions = {
                expires: this.DEFAULT_EXPIRES_DAYS,
                secure: isSecure,
                sameSite: 'lax', // Melhor compatibilidade com mobile
                path: '/'
            };

            console.log('Definindo cookie de autenticação:', { value, options });
            Cookies.set(this.AUTH_COOKIE_NAME, value, options);
            
            // Verificar se o cookie foi definido
            setTimeout(() => {
                const cookieValue = this.getAuthCookie();
                console.log('Cookie verificado após definir:', cookieValue);
            }, 100);
        } catch (error) {
            console.error('Erro ao definir cookie de autenticação:', error);
        }
    }

    /**
     * Obtém o valor do cookie de autenticação
     */
    static getAuthCookie(): string | undefined {
        try {
            const value = Cookies.get(this.AUTH_COOKIE_NAME);
            console.log('Cookie obtido:', value);
            return value;
        } catch (error) {
            console.error('Erro ao obter cookie de autenticação:', error);
            return undefined;
        }
    }

    /**
     * Verifica se o usuário está autenticado
     */
    static isAuthenticated(): boolean {
        const cookieValue = this.getAuthCookie();
        const isAuth = cookieValue === 'true';
        console.log('Verificação de autenticação:', { cookieValue, isAuth });
        return isAuth;
    }

    /**
     * Remove o cookie de autenticação (logout)
     */
    static removeAuthCookie(): void {
        try {
            console.log('Removendo cookie de autenticação');
            Cookies.remove(this.AUTH_COOKIE_NAME, { path: '/' });
            
            // Verificar se o cookie foi removido
            setTimeout(() => {
                const cookieValue = this.getAuthCookie();
                console.log('Cookie verificado após remoção:', cookieValue);
            }, 100);
        } catch (error) {
            console.error('Erro ao remover cookie de autenticação:', error);
        }
    }

    /**
     * Renova o cookie de autenticação (refresh da sessão)
     */
    static renewAuthCookie(): void {
        if (this.isAuthenticated()) {
            console.log('Renovando cookie de autenticação');
            this.setAuthCookie('true');
        }
    }

    /**
     * Diagnóstico do estado dos cookies para debug
     */
    static diagnose(): void {
        console.log('=== DIAGNÓSTICO DE COOKIES ===');
        console.log('User Agent:', navigator.userAgent);
        console.log('Protocol:', window.location.protocol);
        console.log('Host:', window.location.host);
        console.log('Cookies disponíveis:', document.cookie);
        console.log('Cookie de auth:', this.getAuthCookie());
        console.log('Está autenticado:', this.isAuthenticated());
        console.log('=============================');
    }
}

export default AuthCookieManager;
