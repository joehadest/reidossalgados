'use client';
import React from 'react';
import { FaPrint } from 'react-icons/fa';

interface PrintButtonProps {
    orderId: string;
    className?: string;
    children?: React.ReactNode;
}

export default function PrintButton({ orderId, className = '', children }: PrintButtonProps) {
    const handlePrint = () => {
        const printWindow = window.open(`/print/${orderId}`, '_blank');
        if (printWindow) {
            printWindow.focus();
        }
    };

    return (
        <button
            onClick={handlePrint}
            className={`bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center gap-2 hover:bg-blue-700 ${className}`}
            title="Imprimir pedido"
        >
            <FaPrint className="text-sm" />
            {children || 'Imprimir'}
        </button>
    );
} 