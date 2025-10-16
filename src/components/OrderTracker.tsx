"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaSearch, FaTimes, FaClock, FaCheckCircle, FaTruck, FaUtensils } from "react-icons/fa";

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
                    <div className="relative h-auto min-h-[96px] bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 flex flex-col items-center justify-center px-4 pt-6 pb-4 sm:pt-8 sm:pb-6">
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent rounded-t-2xl" />
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={onClose}
                            className="absolute top-2 right-2 w-7 h-7 bg-gray-900/80 backdrop-blur-sm rounded-full flex items-center justify-center text-yellow-500 hover:text-yellow-400 transition-colors z-20"
                            aria-label="Fechar"
                        >
                            <FaTimes className="text-sm" />
                        </motion.button>
                        <div className="relative z-10 w-full flex flex-col items-center justify-center mt-8 sm:mt-10">
                            <h2 className="text-2xl font-bold text-yellow-500 mb-2 text-center">Acompanhar Pedido</h2>
                            <p className="text-gray-300 text-sm text-center">Digite seu telefone ou ID do pedido</p>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 sm:p-6 overflow-y-auto">
                        {/* Search Form */}
                        <div className="space-y-4 mb-6">
                            <div className="flex flex-col xs:flex-row gap-2">
                                <button
                                    onClick={() => setSearchType("phone")}
                                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                                        searchType === "phone" ? "bg-yellow-500 text-gray-900" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                    }`}
                                >
                                    Telefone
                                </button>
                                <button
                                    onClick={() => setSearchType("id")}
                                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                                        searchType === "id" ? "bg-yellow-500 text-gray-900" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                    }`}
                                >
                                    ID do Pedido
                                </button>
                            </div>
                            <div className="flex flex-col xs:flex-row gap-2">
                                <input
                                    type="text"
                                    value={searchValue}
                                    onChange={(e) => setSearchValue(e.target.value)}
                                    placeholder={searchType === "phone" ? "Digite seu telefone" : "Digite o ID do pedido"}
                                    className="flex-1 p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500/50 min-w-0"
                                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                />
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleSearch}
                                    disabled={loading}
                                    className="bg-yellow-500 text-gray-900 p-3 rounded-lg font-bold hover:bg-yellow-400 transition-colors disabled:bg-gray-600 min-w-[48px]"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <FaSearch />
                                    )}
                                </motion.button>
                            </div>
                            {error && <div className="text-red-500 text-sm bg-red-500/10 p-3 rounded-lg">{error}</div>}
                        </div>

                        {/* Order Status */}
                        {order && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
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