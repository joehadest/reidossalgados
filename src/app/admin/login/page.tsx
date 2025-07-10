'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { motion, AnimatePresence } from 'framer-motion';
import { FaLock, FaEye, FaEyeSlash, FaShieldAlt, FaCrown } from 'react-icons/fa';
import Image from 'next/image';

export default function LoginPage() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            const data = await res.json();

            if (data.success) {
                // Armazena o status de autenticação em um cookie
                Cookies.set('isAuthenticated', 'true', { expires: 1 }); // Expira em 1 dia
                router.push('/admin');
            } else {
                setError(data.message || 'Erro na autenticação');
            }
        } catch (error) {
            setError('Erro de conexão. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]"></div>
            </div>

            {/* Animated Background Elements */}
            <motion.div
                animate={{
                    rotate: 360,
                    scale: [1, 1.1, 1],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear"
                }}
                className="absolute top-10 left-10 w-32 h-32 bg-yellow-500/10 rounded-full blur-xl"
                style={{
                    animation: 'float 3s ease-in-out infinite'
                }}
            />
            <motion.div
                animate={{
                    rotate: -360,
                    scale: [1.1, 1, 1.1],
                }}
                transition={{
                    duration: 25,
                    repeat: Infinity,
                    ease: "linear"
                }}
                className="absolute bottom-10 right-10 w-40 h-40 bg-yellow-500/10 rounded-full blur-xl"
                style={{
                    animation: 'float 3s ease-in-out infinite 1.5s'
                }}
            />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="relative z-10 w-full max-w-md"
            >
                {/* Card Principal */}
                <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="bg-gray-800/90 backdrop-blur-md rounded-3xl shadow-2xl border border-yellow-500/30 p-8 relative overflow-hidden hover:transform hover:scale-[1.02] hover:shadow-3xl transition-all duration-300"
                >
                    {/* Decorative Elements */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 to-yellow-600"></div>
                    <div 
                        className="absolute -top-4 -right-4 w-8 h-8 bg-yellow-500/20 rounded-full"
                        style={{
                            animation: 'glow 2s ease-in-out infinite'
                        }}
                    ></div>
                    <div 
                        className="absolute -bottom-4 -left-4 w-6 h-6 bg-yellow-500/20 rounded-full"
                        style={{
                            animation: 'glow 2s ease-in-out infinite 1s'
                        }}
                    ></div>

                    {/* Logo e Título */}
                    <div className="text-center mb-8">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                            className="mx-auto mb-6 w-24 h-24 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center shadow-lg relative"
                            style={{
                                animation: 'glow 2s ease-in-out infinite'
                            }}
                        >
                            <FaCrown className="text-4xl text-gray-900" />
                            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 opacity-20 animate-pulse"></div>
                        </motion.div>
                        
                        <motion.h1
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.6 }}
                            className="text-2xl sm:text-3xl font-bold text-white mb-2"
                        >
                            Rei dos Salgados
                        </motion.h1>
                        
                        <motion.h2
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.7 }}
                            className="text-lg sm:text-xl font-semibold text-yellow-500 mb-2"
                            style={{
                                background: 'linear-gradient(45deg, #f59e0b, #fbbf24, #f59e0b)',
                                backgroundSize: '200% 200%',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                                animation: 'shimmer 3s ease-in-out infinite'
                            }}
                        >
                            Painel Administrativo
                        </motion.h2>
                        
                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.8 }}
                            className="text-gray-400 text-sm sm:text-base"
                        >
                            Acesso restrito ao gerenciamento
                        </motion.p>
                </div>

                    {/* Formulário */}
                    <motion.form
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 1 }}
                        onSubmit={handleSubmit}
                        className="space-y-6"
                    >
                        {/* Campo de Senha */}
                        <div className="space-y-2">
                            <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                                Senha de Acesso
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FaLock className="h-5 w-5 text-gray-400 group-focus-within:text-yellow-500 transition-colors" />
                                </div>
                            <input
                                id="password"
                                name="password"
                                    type={showPassword ? 'text' : 'password'}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-10 pr-12 py-4 border-2 border-gray-600 rounded-xl bg-gray-700/50 text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all duration-200 text-sm sm:text-base group-hover:border-gray-500"
                                    placeholder="Digite sua senha"
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300 transition-colors"
                                    disabled={isLoading}
                                >
                                    {showPassword ? <FaEyeSlash className="h-5 w-5" /> : <FaEye className="h-5 w-5" />}
                                </button>
                        </div>
                    </div>

                        {/* Mensagem de Erro */}
                        <AnimatePresence>
                    {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, height: 'auto', scale: 1 }}
                                    exit={{ opacity: 0, height: 0, scale: 0.9 }}
                                    className="bg-red-500/10 border border-red-500/20 rounded-lg p-4"
                                >
                                    <p className="text-red-400 text-sm text-center font-medium">{error}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Botão de Login */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-gray-900 font-bold py-4 px-6 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base shadow-lg hover:shadow-xl"
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900 mr-3"></div>
                                    Verificando...
                                </div>
                            ) : (
                                <div className="flex items-center justify-center">
                                    <FaShieldAlt className="mr-2" />
                                    Acessar Painel
                    </div>
                            )}
                        </motion.button>
                    </motion.form>

                    {/* Informações Adicionais */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 1.2 }}
                        className="mt-8 pt-6 border-t border-gray-700/50"
                    >
                        <div className="text-center space-y-2">
                            <p className="text-xs text-gray-500">
                                ⚠️ Acesso restrito apenas para administradores autorizados
                            </p>
                            <p className="text-xs text-gray-600">
                                Mantenha suas credenciais seguras
                            </p>
            </div>
                    </motion.div>
                </motion.div>

                {/* Footer */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 1.4 }}
                    className="text-center mt-6"
                >
                    <p className="text-gray-500 text-xs">
                        Rei dos Salgados © 2024 - Sistema de Gerenciamento
                    </p>
                </motion.div>
            </motion.div>

            {/* CSS Animations */}
            <style jsx>{`
                @keyframes float {
                    0%, 100% {
                        transform: translateY(0px);
                    }
                    50% {
                        transform: translateY(-10px);
                    }
                }

                @keyframes glow {
                    0%, 100% {
                        box-shadow: 0 0 20px rgba(245, 158, 11, 0.3);
                    }
                    50% {
                        box-shadow: 0 0 30px rgba(245, 158, 11, 0.6);
                    }
                }

                @keyframes shimmer {
                    0% {
                        background-position: -200px 0;
                    }
                    100% {
                        background-position: calc(200px + 100%) 0;
                    }
                }
            `}</style>
        </div>
    );
} 