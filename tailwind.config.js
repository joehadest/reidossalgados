/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        screens: {
            'xs': '360px',
            'sm': '640px',
            'md': '768px',
            'lg': '1024px',
            'xl': '1280px',
            '2xl': '1536px',
        },
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#facc15',
                    dark: '#eab308',
                    light: '#fde047',
                },
                background: {
                    DEFAULT: '#111827',
                    light: '#1f2937',
                    dark: '#0f172a',
                },
                surface: {
                    DEFAULT: '#1f2937',
                    light: '#374151',
                    dark: '#111827',
                },
                accent: {
                    DEFAULT: '#facc15',
                    dark: '#eab308',
                    light: '#fde047',
                },
                black: {
                    50: '#f8fafc',
                    100: '#f1f5f9',
                    200: '#e2e8f0',
                    300: '#cbd5e1',
                    400: '#94a3b8',
                    500: '#64748b',
                    600: '#475569',
                    700: '#334155',
                    800: '#1e293b',
                    900: '#0f172a',
                    950: '#000000',
                },
                yellow: {
                    400: '#fde047',
                    500: '#facc15',
                    600: '#eab308',
                    700: '#a16207',
                    800: '#854d0e',
                    900: '#713f12',
                },
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-in-out',
                'slide-up': 'slideUp 0.3s ease-out',
                'bounce-in': 'bounceIn 0.6s ease-out',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(100%)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                bounceIn: {
                    '0%': { transform: 'scale(0.3)', opacity: '0' },
                    '50%': { transform: 'scale(1.05)' },
                    '70%': { transform: 'scale(0.9)' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
            },
            boxShadow: {
                'glow': '0 0 20px rgba(250, 204, 21, 0.3)',
                'glow-lg': '0 0 30px rgba(250, 204, 21, 0.4)',
            },
        },
    },
    plugins: [],
} 