import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const isAuthenticatedCookie = request.cookies.get('isAuthenticated');
    const isAuthenticated = isAuthenticatedCookie?.value === 'true';
    const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
    const isLoginPage = request.nextUrl.pathname === '/admin/login';
    const isInitPage = request.nextUrl.pathname === '/admin/init';

    // Permitir acesso à página de inicialização
    if (isInitPage) {
        return NextResponse.next();
    }

    // Se não estiver autenticado e tentar acessar uma rota admin
    if (!isAuthenticated && isAdminRoute && !isLoginPage) {
        const response = NextResponse.redirect(new URL('/admin/login', request.url));
        // Limpar cookie inválido se existir
        if (isAuthenticatedCookie && isAuthenticatedCookie.value !== 'true') {
            response.cookies.delete('isAuthenticated');
        }
        return response;
    }

    // Se estiver autenticado e tentar acessar a página de login
    if (isAuthenticated && isLoginPage) {
        return NextResponse.redirect(new URL('/admin', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: '/admin/:path*',
}; 