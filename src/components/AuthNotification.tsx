'use client';
import React, { useState, useEffect } from 'react';
import { FaExclamationTriangle, FaInfoCircle, FaTimes } from 'react-icons/fa';

interface AuthNotificationProps {
    message: string;
    type: 'warning' | 'info' | 'error';
    show: boolean;
    onClose: () => void;
}

export default function AuthNotification({ message, type, show, onClose }: AuthNotificationProps) {
    useEffect(() => {
        if (show) {
            const timer = setTimeout(() => {
                onClose();
            }, 8000); // Auto close after 8 seconds

            return () => clearTimeout(timer);
        }
    }, [show, onClose]);

    if (!show) return null;

    const getIcon = () => {
        switch (type) {
            case 'warning':
                return <FaExclamationTriangle className="text-yellow-500" />;
            case 'error':
                return <FaExclamationTriangle className="text-red-500" />;
            case 'info':
            default:
                return <FaInfoCircle className="text-blue-500" />;
        }
    };

    const getBgColor = () => {
        switch (type) {
            case 'warning':
                return 'bg-yellow-500/10 border-yellow-500/30';
            case 'error':
                return 'bg-red-500/10 border-red-500/30';
            case 'info':
            default:
                return 'bg-blue-500/10 border-blue-500/30';
        }
    };

    return (
        <div className={`fixed top-4 left-4 right-4 z-50 ${getBgColor()} border rounded-lg p-4 backdrop-blur-md`}>
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                    {getIcon()}
                </div>
                <div className="flex-1">
                    <p className="text-white text-sm font-medium">
                        {message}
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
                >
                    <FaTimes size={14} />
                </button>
            </div>
        </div>
    );
}
