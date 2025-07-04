import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
// import Header from '@/components/Header';
import { StoreProvider } from '@/contexts/StoreContext';
import { MenuProvider } from '@/contexts/MenuContext';
import { CartProvider } from '@/contexts/CartContext';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
    themeColor: '#facc15',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
};

export const metadata: Metadata = {
    title: "Rei dos Salgados - Cardápio Digital",
    description: "Cardápio digital do Rei dos Salgados",
    manifest: '/manifest.json',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: "Rei dos Salgados"
    }
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="pt-BR">
            <head>
                <link rel="manifest" href="/manifest.json" />
                <meta name="theme-color" content="#facc15" />
                {/* Logo e favicon removidos temporariamente */}
            </head>
            <body className="bg-gray-900 min-h-screen">
                <CartProvider>
                    <MenuProvider>
                        <StoreProvider>
                            <main className="min-h-screen">
                                {children}
                            </main>
                        </StoreProvider>
                    </MenuProvider>
                </CartProvider>
            </body>
        </html>
    );
} 