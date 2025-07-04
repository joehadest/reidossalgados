import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const isAuthenticated = request.cookies.get('isAuthenticated');
    const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
    const isLoginPage = request.nextUrl.pathname === '/admin/login';

    // Se não estiver autenticado e tentar acessar uma rota admin
    if (!isAuthenticated && isAdminRoute && !isLoginPage) {
        return NextResponse.redirect(new URL('/admin/login', request.url));
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