import '../globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: "Impressão - Rei dos Salgados",
    description: "Página de impressão de pedidos",
};

export default function PrintLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="pt-BR">
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <meta name="theme-color" content="#facc15" />
                <style>{`
                    @media print {
                        @page {
                            margin: 0;
                            size: 80mm auto;
                        }
                        
                        body {
                            margin: 0 !important;
                            padding: 0 !important;
                            background: white !important;
                            color: black !important;
                            font-family: 'Courier New', monospace !important;
                            line-height: 1.2 !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        
                        /* Ocultar elementos do navegador */
                        header, footer, nav, aside {
                            display: none !important;
                        }

                        .no-print {
                            display: none !important;
                        }
                    }

                    /* Estilos para tela */
                    body {
                        background: white;
                        color: black;
                        font-family: 'Courier New', monospace;
                        margin: 0;
                        padding: 0;
                    }

                    .print-container {
                        max-width: 80mm;
                        margin: 0 auto;
                        background: white;
                        color: black;
                    }
                `}</style>
            </head>
            <body className="bg-white text-black print:bg-white print:text-black">
                {children}
            </body>
        </html>
    );
} 