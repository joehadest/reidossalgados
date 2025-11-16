"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaSearch, FaTimes, FaClock, FaCheckCircle, FaTruck, FaUtensils, FaSync, FaCopy, FaWhatsapp } from "react-icons/fa";

type PedidoStatus = "pendente" | "preparando" | "pronto" | "entregando" | "entregue" | "cancelado" | string;

interface OrderStatus {
    _id: string;
    status: PedidoStatus;
    data: string;
    cliente: { nome: string; telefone: string };
    itens: Array<{ nome: string; quantidade: number; preco: number }>;
    total: number;
    observacoes?: string;
    endereco?: { rua: string; numero: string; bairro: string; complemento?: string; pontoReferencia?: string };
    tipoEntrega: "entrega" | "retirada";
    formaPagamento: string;
}

interface OrderTrackerProps {
    onClose: () => void;
}

const STATUS = {
    pendente: { label: "Pedido Pendente", icon: FaClock, color: "text-yellow-500", chip: "bg-yellow-500/20", desc: "Seu pedido foi recebido e está sendo preparado" },
    preparando: { label: "Em Preparação", icon: FaUtensils, color: "text-blue-500", chip: "bg-blue-500/20", desc: "Seu pedido está sendo preparado na cozinha" },
    pronto: { label: "Pedido Pronto", icon: FaCheckCircle, color: "text-green-500", chip: "bg-green-500/20", desc: "Seu pedido está pronto para entrega/retirada" },
    entregando: { label: "Em Entrega", icon: FaTruck, color: "text-purple-500", chip: "bg-purple-500/20", desc: "Seu pedido está a caminho" },
    entregue: { label: "Entregue", icon: FaCheckCircle, color: "text-green-600", chip: "bg-green-600/20", desc: "Pedido entregue com sucesso!" },
    cancelado: { label: "Cancelado", icon: FaTimes, color: "text-red-500", chip: "bg-red-500/20", desc: "Pedido foi cancelado" },
} as const;

export default function OrderTracker({ onClose }: OrderTrackerProps) {
    const [searchType, setSearchType] = useState<"id" | "phone">("phone");
    const [searchValue, setSearchValue] = useState("");
    const [loading, setLoading] = useState(false);
    const [order, setOrder] = useState<OrderStatus | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState<string | null>(null);

    useEffect(() => {
        // Trava o scroll do body (iOS-friendly) enquanto o modal estiver aberto
        const body = document.body;
        const prev = { overflow: body.style.overflow, position: body.style.position, top: body.style.top, width: body.style.width };
        const y = window.scrollY;
        body.style.overflow = "hidden";
        body.style.position = "fixed";
        body.style.top = `-${y}px`;
        body.style.width = "100%";
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => {
            window.removeEventListener("keydown", onKey);
            body.style.overflow = prev.overflow;
            body.style.position = prev.position;
            body.style.top = prev.top;
            body.style.width = prev.width;
            window.scrollTo(0, y);
        };
    }, [onClose]);

    const handleSearch = async () => {
        if (!searchValue.trim()) {
            setError("Por favor, insira um valor para busca");
            return;
        }
        setLoading(true);
        setError(null);
        setOrder(null);
        try {
            const url =
                searchType === "id"
                    ? `/api/pedidos?id=${encodeURIComponent(searchValue.trim())}`
                    : `/api/pedidos?telefone=${encodeURIComponent(searchValue.trim())}`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.success && data.data) {
                if (Array.isArray(data.data)) setOrder(data.data[0] || null);
                else setOrder(data.data as OrderStatus);
            } else {
                setError("Pedido não encontrado. Verifique os dados informados.");
            }
        } catch (e) {
            setError("Erro ao buscar pedido. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    const refresh = async () => {
        if (!order) return handleSearch();
        // Reutiliza o mesmo critério de busca: se veio por telefone, usa telefone; se por id, usa id
        setLoading(true);
        setError(null);
        try {
            const fromId = order._id ? `/api/pedidos?id=${encodeURIComponent(order._id)}` : null;
            const fromPhone = order.cliente?.telefone ? `/api/pedidos?telefone=${encodeURIComponent(order.cliente.telefone)}` : null;
            const url = fromId || fromPhone;
            if (!url) return;
            const res = await fetch(url);
            const data = await res.json();
            if (data.success && data.data) {
                if (Array.isArray(data.data)) setOrder(data.data[0] || null);
                else setOrder(data.data as OrderStatus);
            }
        } catch (e) {
            // silencioso
        } finally {
            setLoading(false);
        }
    };

    const copyOrderId = async () => {
        if (!order?._id) return;
        try {
            await navigator.clipboard.writeText(order._id);
            setCopied('Código copiado!');
            setTimeout(() => setCopied(null), 1200);
        } catch {}
    };

    const whatsappShareLink = () => {
        if (!order) return '#';
        const msg = `Pedido #${order._id?.slice(-6)}\nStatus: ${getStatus(order.status).label}\nTotal: R$ ${order.total.toFixed(2)}`;
        const phone = order.cliente?.telefone ? order.cliente.telefone.replace(/\D/g, '') : '';
        return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    };

    const formatDate = (s: string) =>
        new Date(s).toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });

        const getStatus = (s: string) => (STATUS as any)[s] || STATUS.pendente;

        const stages = ["pendente", "preparando", "pronto", "entregando", "entregue"] as const;

        const currentStageIndex = (st: string) => {
            const idx = (stages as readonly string[]).indexOf(st);
            return idx === -1 ? 0 : idx;
        };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overscroll-none"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 30 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="bg-gray-900 rounded-2xl shadow-2xl border border-yellow-500/30 max-h-[90vh] w-full max-w-md mx-2 flex flex-col overscroll-contain"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="relative h-auto min-h-[140px] bg-gradient-to-br from-yellow-500/20 via-yellow-600/10 to-transparent flex flex-col items-center justify-center px-4 pt-8 pb-6 sm:pt-10 sm:pb-8 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent rounded-t-2xl" />
                        {/* Decorações de fundo */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-yellow-500/5 rounded-full blur-2xl" />
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={onClose}
                            className="absolute top-3 right-3 w-8 h-8 bg-gray-900/80 backdrop-blur-sm rounded-full flex items-center justify-center text-yellow-500 hover:text-yellow-400 transition-colors z-20 border border-gray-800/50"
                            aria-label="Fechar"
                        >
                            <FaTimes className="text-sm" />
                        </motion.button>
                        <div className="relative z-10 w-full flex flex-col items-center justify-center">
                            {/* Ícone ilustrativo */}
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.4, type: "spring" }}
                                className="mb-4 relative"
                            >
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border border-yellow-500/30 flex items-center justify-center backdrop-blur-sm">
                                    <FaSearch className="text-3xl text-yellow-400" />
                                </div>
                                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center animate-pulse">
                                    <div className="w-2 h-2 rounded-full bg-white" />
                                </div>
                            </motion.div>
                            <motion.h2
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                className="text-2xl sm:text-3xl font-extrabold text-white mb-2 text-center tracking-tight"
                            >
                                Acompanhar Pedido
                            </motion.h2>
                            <motion.p
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="text-gray-400 text-sm text-center max-w-xs"
                            >
                                Informe seu telefone ou código do pedido para ver o status em tempo real
                            </motion.p>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 sm:p-6 overflow-y-auto custom-scroll">
                        {/* Search Form */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="space-y-4 mb-6"
                        >
                            {/* Tipo de busca com estilo card */}
                            <div className="bg-gray-800/40 rounded-xl p-1 border border-gray-700/50 backdrop-blur-sm">
                                <div className="flex gap-2">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setSearchType("phone")}
                                        className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                                            searchType === "phone"
                                                ? "bg-yellow-500 text-gray-900 shadow-lg shadow-yellow-500/25"
                                                : "bg-transparent text-gray-400 hover:text-gray-200"
                                        }`}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            <FaSearch className="text-sm" />
                                            <span className="text-sm">Telefone</span>
                                        </div>
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setSearchType("id")}
                                        className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                                            searchType === "id"
                                                ? "bg-yellow-500 text-gray-900 shadow-lg shadow-yellow-500/25"
                                                : "bg-transparent text-gray-400 hover:text-gray-200"
                                        }`}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            <FaSearch className="text-sm" />
                                            <span className="text-sm">Código</span>
                                        </div>
                                    </motion.button>
                                </div>
                            </div>

                            {/* Campo de busca aprimorado */}
                            <div className="relative">
                                <div className="flex gap-2">
                                    <div className="flex-1 relative group">
                                        <input
                                            type="text"
                                            value={searchValue}
                                            onChange={(e) => setSearchValue(e.target.value)}
                                            placeholder={
                                                searchType === "phone"
                                                    ? "Ex: (84) 99999-9999"
                                                    : "Ex: 507f1f77bcf86cd799439011"
                                            }
                                            className="w-full p-4 pr-12 rounded-xl bg-gray-800/60 text-white border border-gray-700/70 focus:outline-none focus:ring-2 focus:ring-yellow-500/60 focus:border-yellow-500/50 transition-all placeholder:text-gray-500 group-hover:border-gray-600"
                                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                                            {searchType === "phone" ? "📱" : "🔖"}
                                        </div>
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleSearch}
                                        disabled={loading}
                                        className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-gray-900 px-6 rounded-xl font-bold hover:from-yellow-400 hover:to-yellow-500 transition-all disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed shadow-lg shadow-yellow-500/20 min-w-[64px] flex items-center justify-center"
                                    >
                                        {loading ? (
                                            <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <FaSearch className="text-lg" />
                                        )}
                                    </motion.button>
                                </div>
                            </div>

                            {/* Mensagem de erro melhorada */}
                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="flex items-start gap-3 text-sm bg-red-500/10 border border-red-500/30 p-4 rounded-xl"
                                    >
                                        <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <FaTimes className="text-xs text-red-400" />
                                        </div>
                                        <p className="text-red-400 flex-1">{error}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Dica visual quando não há pedido */}
                            {!order && !error && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="mt-8 text-center space-y-4"
                                >
                                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gray-800/40 border border-gray-700/50">
                                        <FaTruck className="text-4xl text-gray-600" />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-gray-400 text-sm font-medium">
                                            Nenhum pedido selecionado
                                        </p>
                                        <p className="text-gray-500 text-xs max-w-xs mx-auto leading-relaxed">
                                            Digite seu número de telefone ou o código do pedido acima para
                                            acompanhar o status em tempo real
                                        </p>
                                    </div>
                                    {/* Benefícios */}
                                    <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                                        <div className="space-y-1">
                                            <div className="w-10 h-10 mx-auto rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                                                <FaClock className="text-yellow-500 text-lg" />
                                            </div>
                                            <p className="text-[10px] text-gray-500 font-medium">Tempo Real</p>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="w-10 h-10 mx-auto rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                                <FaUtensils className="text-blue-400 text-lg" />
                                            </div>
                                            <p className="text-[10px] text-gray-500 font-medium">Status Detalhado</p>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="w-10 h-10 mx-auto rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                                                <FaCheckCircle className="text-green-400 text-lg" />
                                            </div>
                                            <p className="text-[10px] text-gray-500 font-medium">Notificações</p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>

                        {/* Order Status */}
                        {order && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                                {/* Ações rápidas */}
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <button onClick={refresh} disabled={loading} className="px-3 py-1.5 text-xs rounded-lg bg-gray-800 text-gray-200 border border-gray-700 hover:bg-gray-700 disabled:opacity-60 flex items-center gap-2">
                                            <FaSync className={`text-sm ${loading ? 'animate-spin' : ''}`} /> Atualizar
                                        </button>
                                        <button onClick={copyOrderId} className="px-3 py-1.5 text-xs rounded-lg bg-gray-800 text-gray-200 border border-gray-700 hover:bg-gray-700 flex items-center gap-2">
                                            <FaCopy className="text-sm" /> Copiar código
                                        </button>
                                        {copied && <span className="text-xs text-gray-400">{copied}</span>}
                                    </div>
                                    <a href={whatsappShareLink()} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 text-xs rounded-lg bg-green-500 text-white hover:bg-green-600 flex items-center gap-2">
                                        <FaWhatsapp className="text-sm" /> WhatsApp
                                    </a>
                                </div>
                                {/* Order Info */}
                                <div className="bg-gray-850/60 border border-gray-800/80 rounded-xl p-4">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="text-white font-semibold">Pedido #{order._id?.slice(-6)}</h3>
                                            <p className="text-gray-400 text-sm">{formatDate(order.data)}</p>
                                        </div>
                                        <span className="text-yellow-500 font-bold">R$ {order.total.toFixed(2)}</span>
                                    </div>
                                    <div className="mb-3">
                                        <p className="text-white font-medium">{order.cliente.nome}</p>
                                        <p className="text-gray-400 text-sm">{order.cliente.telefone}</p>
                                    </div>
                                    {order.tipoEntrega === "entrega" && order.endereco && (
                                        <div className="mb-3 text-sm">
                                            <p className="text-gray-300">
                                                {order.endereco.rua}, {order.endereco.numero}
                                                {order.endereco.complemento ? ` - ${order.endereco.complemento}` : ""}
                                            </p>
                                            <p className="text-gray-400">{order.endereco.bairro}</p>
                                        </div>
                                    )}
                                    <div className="space-y-2">
                                        {order.itens.map((item, idx) => (
                                            <div key={idx} className="flex justify-between text-sm">
                                                <span className="text-gray-300">
                                                    {item.quantidade}x {item.nome}
                                                </span>
                                                <span className="text-gray-400">R$ {(item.preco * item.quantidade).toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                    {order.observacoes && (
                                        <div className="mt-3 p-2 bg-gray-800/70 rounded text-sm">
                                            <p className="text-gray-300">
                                                <strong>Observações:</strong> {order.observacoes}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Status */}
                                <div className="bg-gray-850/60 border border-gray-800/80 rounded-xl p-4">
                                    <div className="flex items-center gap-3 mb-3">
                                        {(() => {
                                            const s = getStatus(order.status);
                                            const Icon = s.icon;
                                            return (
                                                <div className={`p-2 rounded-full ${s.chip}`}>
                                                    <Icon className={`text-xl ${s.color}`} />
                                                </div>
                                            );
                                        })()}
                                        <div>
                                            <h4 className="text-white font-semibold">{getStatus(order.status).label}</h4>
                                            <p className="text-gray-400 text-sm">{getStatus(order.status).desc}</p>
                                        </div>
                                    </div>
                                    {/* Timeline */}
                                    <div className="mt-4 grid grid-cols-4 gap-2 text-[10px] sm:text-xs text-gray-400">
                                        {["pendente", "preparando", "pronto", "entregando"].map((st, i) => {
                                            const active = currentStageIndex(order.status) >= i;
                                            const label = getStatus(st).label.split(" ")[0];
                                            return (
                                                <div key={st} className="flex flex-col items-center">
                                                    <div className={`w-full h-1.5 rounded-full ${active ? "bg-yellow-500" : "bg-gray-700"}`} />
                                                    <span className={`mt-1 ${active ? "text-yellow-400" : ""}`}>{label}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}