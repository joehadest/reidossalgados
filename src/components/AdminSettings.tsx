'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface DeliveryFee {
    neighborhood: string;
    fee: number;
}

interface BusinessHours {
    open: boolean;
    start: string;
    end: string;
}

interface BusinessHoursConfig {
    monday: BusinessHours;
    tuesday: BusinessHours;
    wednesday: BusinessHours;
    thursday: BusinessHours;
    friday: BusinessHours;
    saturday: BusinessHours;
    sunday: BusinessHours;
}

export default function AdminSettings() {
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');
    const [deliveryFees, setDeliveryFees] = useState<DeliveryFee[]>([]);
    const [businessHours, setBusinessHours] = useState<BusinessHoursConfig>({
        monday: { open: true, start: '18:00', end: '23:00' },
        tuesday: { open: false, start: '18:00', end: '23:00' },
        wednesday: { open: true, start: '18:00', end: '23:00' },
        thursday: { open: true, start: '18:00', end: '23:00' },
        friday: { open: true, start: '18:00', end: '23:00' },
        saturday: { open: true, start: '18:00', end: '23:00' },
        sunday: { open: true, start: '18:00', end: '23:00' }
    });
    const [newNeighborhood, setNewNeighborhood] = useState('');
    const [newFee, setNewFee] = useState('');

    const fetchSettings = useCallback(async () => {
        try {
            const res = await fetch('/api/settings');
            const data = await res.json();
            if (data.success && data.data) {
                setDeliveryFees(data.data.deliveryFees || []);
                if (data.data.businessHours) {
                    setBusinessHours(data.data.businessHours);
                }
            }
        } catch (err) {
            console.error('Erro ao carregar configurações:', err);
        }
    }, []);

    const checkOpenStatus = useCallback(() => {
        const now = new Date();
        const diasSemana = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const currentDay = diasSemana[now.getDay()] as keyof BusinessHoursConfig;
        const currentTime = now.toLocaleTimeString('pt-BR', { hour12: false, hour: '2-digit', minute: '2-digit' });

        return businessHours[currentDay]?.open &&
            currentTime >= businessHours[currentDay].start &&
            currentTime <= businessHours[currentDay].end;
    }, [businessHours]);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    useEffect(() => {
        setIsOpen(checkOpenStatus());
        const interval = setInterval(() => {
            setIsOpen(checkOpenStatus());
        }, 60000);
        return () => clearInterval(interval);
    }, [checkOpenStatus]);

    const handleAddFee = () => {
        if (!newNeighborhood || !newFee) return;

        const fee = parseFloat(newFee);
        if (isNaN(fee) || fee < 0) {
            setSaveMessage('Taxa inválida');
            return;
        }

        setDeliveryFees(prev => [...prev, { neighborhood: newNeighborhood, fee }]);
        setNewNeighborhood('');
        setNewFee('');
    };

    const handleRemoveFee = (index: number) => {
        setDeliveryFees(prev => prev.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveMessage('');
        try {
            const res = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deliveryFees, businessHours })
            });
            const data = await res.json();
            if (data.success) {
                setSaveMessage('Alterações salvas com sucesso!');
            } else {
                setSaveMessage('Erro ao salvar alterações.');
            }
        } catch (error) {
            setSaveMessage('Erro ao salvar alterações.');
        } finally {
            setIsSaving(false);
            setTimeout(() => setSaveMessage(''), 3000);
        }
    };

    const handleBusinessHoursChange = (day: keyof BusinessHoursConfig, field: 'open' | 'start' | 'end', value: string | boolean) => {
        setBusinessHours(prev => ({
            ...prev,
            [day]: { ...prev[day], [field]: value }
        }));
    };

    const daysOfWeek = [
        { key: 'monday', label: 'Segunda' },
        { key: 'tuesday', label: 'Terça' },
        { key: 'wednesday', label: 'Quarta' },
        { key: 'thursday', label: 'Quinta' },
        { key: 'friday', label: 'Sexta' },
        { key: 'saturday', label: 'Sábado' },
        { key: 'sunday', label: 'Domingo' }
    ] as const;

    return (
        <div className="space-y-8">
            {/* Status Atual */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold text-white mb-4">Status da Loja</h2>
                <div className="flex items-center gap-4">
                    <span className={`px-4 py-2 rounded-full font-semibold ${isOpen ? 'bg-green-500 text-white' : 'bg-red-600 text-white'}`}>
                        {isOpen ? 'Aberto Agora' : 'Fechado Agora'}
                    </span>
                    <span className="text-gray-400 text-sm">Baseado nos horários abaixo.</span>
                </div>
            </div>

            {/* Horários de Funcionamento */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold text-white mb-4">Horários de Funcionamento</h2>
                <div className="space-y-4">
                    {daysOfWeek.map(({ key, label }) => (
                        <div key={key} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                            <label className="flex items-center space-x-3 text-white">
                                <input
                                    type="checkbox"
                                    checked={businessHours[key]?.open ?? false}
                                    onChange={(e) => handleBusinessHoursChange(key, 'open', e.target.checked)}
                                    className="form-checkbox h-5 w-5 rounded bg-gray-700 border-gray-600 text-yellow-500 focus:ring-yellow-500"
                                />
                                <span>{label}</span>
                            </label>
                            <div className="flex items-center col-span-2 gap-2">
                                <input
                                    type="time"
                                    value={businessHours[key]?.start ?? '18:00'}
                                    onChange={(e) => handleBusinessHoursChange(key, 'start', e.target.value)}
                                    disabled={!businessHours[key]?.open}
                                    className="p-2 w-full rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50"
                                />
                                <span className="text-gray-400">até</span>
                                <input
                                    type="time"
                                    value={businessHours[key]?.end ?? '23:00'}
                                    onChange={(e) => handleBusinessHoursChange(key, 'end', e.target.value)}
                                    disabled={!businessHours[key]?.open}
                                    className="p-2 w-full rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Taxas de Entrega */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold text-white mb-4">Taxas de Entrega por Bairro</h2>
                <div className="space-y-4 mb-6">
                    {deliveryFees.map((item, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-700 p-3 rounded-lg">
                            <span className="text-white">{item.neighborhood}</span>
                            <div className="flex items-center gap-4">
                                <span className="text-yellow-500 font-semibold">R$ {item.fee.toFixed(2)}</span>
                                <button onClick={() => handleRemoveFee(index)} className="text-red-500 hover:text-red-400">&times;</button>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex flex-col md:flex-row gap-4">
                    <input
                        type="text"
                        placeholder="Nome do Bairro"
                        value={newNeighborhood}
                        onChange={(e) => setNewNeighborhood(e.target.value)}
                        className="p-2 flex-grow rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                    <input
                        type="number"
                        placeholder="Taxa (ex: 5.00)"
                        value={newFee}
                        onChange={(e) => setNewFee(e.target.value)}
                        className="p-2 w-full md:w-32 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                    <button onClick={handleAddFee} className="bg-yellow-500 text-gray-900 font-bold py-2 px-4 rounded-lg hover:bg-yellow-400 transition-colors">Adicionar</button>
                </div>
            </div>

            {/* Salvar Alterações */}
            <div className="mt-8 flex justify-end items-center gap-4">
                {saveMessage && <span className="text-green-500">{saveMessage}</span>}
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-yellow-500 text-gray-900 font-bold py-3 px-6 rounded-lg hover:bg-yellow-400 transition-colors disabled:bg-gray-600"
                >
                    {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </div>
        </div>
    );
} 