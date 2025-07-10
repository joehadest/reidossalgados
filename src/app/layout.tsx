import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { StoreProvider } from '@/contexts/StoreContext';
import { MenuProvider } from '@/contexts/MenuContext';
import { CartProvider } from '@/contexts/CartContext';
import { RestaurantStatusProvider } from '@/contexts/RestaurantStatusContext';

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
    manifest: '/favicon/site.webmanifest',
    icons: {
        icon: [
            { url: '/favicon/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
            { url: '/favicon/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
        ],
        apple: [
            { url: '/favicon/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
        ],
        other: [
            { url: '/favicon/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
            { url: '/favicon/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
    },
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
                <link rel="manifest" href="/favicon/site.webmanifest" />
                <link rel="icon" type="image/x-icon" href="/favicon/favicon.ico" />
                <link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon-16x16.png" />
                <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png" />
                <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png" />
                <meta name="theme-color" content="#facc15" />
            </head>
            <body className="bg-gray-900 min-h-screen overflow-x-hidden">
                <RestaurantStatusProvider>
                <CartProvider>
                    <MenuProvider>
                        <StoreProvider>
                            <main className="min-h-screen">
                                {children}
                            </main>
                        </StoreProvider>
                    </MenuProvider>
                </CartProvider>
                </RestaurantStatusProvider>
            </body>
        </html>
    );
} 