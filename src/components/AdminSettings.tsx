'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useRestaurantStatus } from '@/contexts/RestaurantStatusContext';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

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

interface EstablishmentInfo {
    name: string;
    menuTitle?: string; // Título personalizado do cardápio
    showLogo?: boolean; // Opção para mostrar ou esconder o logo
    address: {
        street: string;
        city: string;
        state: string;
    };
    contact: {
        phone: string;
        whatsapp: string;
    };
    paymentMethods: string[];
    socialMedia: {
        instagram: string;
    };
    about: string;
    pixKey?: string; // Added pixKey to the interface
}

export default function AdminSettings() {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');
    const [isSavingHours, setIsSavingHours] = useState(false);
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
    const [establishmentInfo, setEstablishmentInfo] = useState<EstablishmentInfo>({
        name: 'Rei dos Salgados',
        menuTitle: 'Cardápio Digital',
        showLogo: true,
        address: {
            street: 'Rua Maria Luiza Dantas',
            city: 'Alto Rodrigues',
            state: 'RN'
        },
        contact: {
            phone: '+55 84 9872-9126',
            whatsapp: '+55 84 9872-9126'
        },
        paymentMethods: ['Cartão de Crédito', 'Cartão de Débito', 'PIX', 'Dinheiro'],
        socialMedia: {
            instagram: '@reidossalgados'
        },
        about: 'Especialistas em salgados artesanais, oferecendo qualidade e sabor em cada pedido. Nossos produtos são feitos com ingredientes frescos e selecionados.'
    });
    const [newNeighborhood, setNewNeighborhood] = useState('');
    const [newFee, setNewFee] = useState('');
    const [newPaymentMethod, setNewPaymentMethod] = useState('');
    const { isOpen, refreshStatus } = useRestaurantStatus();

    // Estados para mudança de senha
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState('');

    // Estados para visualizar senhas
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const fetchSettings = useCallback(async () => {
        try {
            const res = await fetch('/api/settings');
            const data = await res.json();
            if (data.success && data.data) {
                setDeliveryFees(data.data.deliveryFees || []);
                if (data.data.businessHours) {
                    setBusinessHours(data.data.businessHours);
                }
                if (data.data.establishmentInfo) {
                    setEstablishmentInfo(data.data.establishmentInfo);
                }
            }
        } catch (err) {
            console.error('Erro ao carregar configurações:', err);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

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

    const handleAddPaymentMethod = () => {
        if (!newPaymentMethod.trim()) return;
        setEstablishmentInfo(prev => ({
            ...prev,
            paymentMethods: [...prev.paymentMethods, newPaymentMethod.trim()]
        }));
        setNewPaymentMethod('');
    };

    const handleRemovePaymentMethod = (index: number) => {
        setEstablishmentInfo(prev => ({
            ...prev,
            paymentMethods: prev.paymentMethods.filter((_, i) => i !== index)
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveMessage('');
        try {
            const res = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    deliveryFees,
                    businessHours,
                    establishmentInfo
                })
            });
            const data = await res.json();
            if (data.success) {
                setSaveMessage('Alterações salvas com sucesso!');
                // Atualizar o status do restaurante após salvar
                await refreshStatus();
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

    const handleBusinessHoursChange = async (day: keyof BusinessHoursConfig, field: 'open' | 'start' | 'end', value: string | boolean) => {
        const updatedBusinessHours = {
            ...businessHours,
            [day]: { ...businessHours[day], [field]: value }
        };

        setBusinessHours(updatedBusinessHours);
        setIsSavingHours(true);

        // Salvar automaticamente quando alterar horários
        try {
            const res = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    deliveryFees,
                    businessHours: updatedBusinessHours,
                    establishmentInfo
                })
            });

            if (res.ok) {
                // Atualizar o status do restaurante
                await refreshStatus();
                setSaveMessage('Horários atualizados!');
                setTimeout(() => setSaveMessage(''), 2000);
            }
        } catch (error) {
            console.error('Erro ao salvar horários:', error);
            setSaveMessage('Erro ao salvar horários');
            setTimeout(() => setSaveMessage(''), 3000);
        } finally {
            setIsSavingHours(false);
        }
    };

    const handleChangePassword = async () => {
        // Validações
        if (!currentPassword || !newPassword || !confirmPassword) {
            setPasswordMessage('Todos os campos são obrigatórios');
            return;
        }

        if (newPassword.length < 6) {
            setPasswordMessage('A nova senha deve ter pelo menos 6 caracteres');
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordMessage('As senhas não coincidem');
            return;
        }

        setIsChangingPassword(true);
        setPasswordMessage('');

        try {
            const res = await fetch('/api/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword,
                    newPassword
                })
            });

            const data = await res.json();

            if (data.success) {
                setPasswordMessage('Senha alterada com sucesso!');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setShowPasswordChange(false);
            } else {
                setPasswordMessage(data.message || 'Erro ao alterar senha');
            }
        } catch (error) {
            setPasswordMessage('Erro ao alterar senha');
        } finally {
            setIsChangingPassword(false);
            setTimeout(() => setPasswordMessage(''), 3000);
        }
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
        <div className="space-y-4 sm:space-y-8 p-2 sm:p-0">
            {/* Status Atual */}
            <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md">
                <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Status da Loja</h2>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <span className={`px-3 sm:px-4 py-2 rounded-full font-semibold text-sm sm:text-base text-center ${isOpen ? 'bg-green-500 text-white' : 'bg-red-600 text-white'}`}>
                        {isOpen ? 'Aberto Agora' : 'Fechado Agora'}
                    </span>
                    <span className="text-gray-400 text-xs sm:text-sm">Baseado nos horários abaixo.</span>
                    {isSavingHours && (
                        <span className="text-yellow-500 text-xs sm:text-sm">Salvando...</span>
                    )}
                </div>
                {saveMessage && (
                    <div className="mt-2 text-xs sm:text-sm">
                        <span className={saveMessage.includes('Erro') ? 'text-red-500' : 'text-green-500'}>
                            {saveMessage}
                        </span>
                    </div>
                )}
            </div>

            {/* Alterar Senha */}
            <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-3 sm:mb-4">
                    <h2 className="text-lg sm:text-xl font-bold text-white">Alterar Senha</h2>
                    <button
                        onClick={() => setShowPasswordChange(!showPasswordChange)}
                        className="bg-yellow-500 text-gray-900 px-3 py-2 rounded-lg hover:bg-yellow-400 transition-colors text-sm font-medium"
                    >
                        {showPasswordChange ? 'Cancelar' : 'Alterar Senha'}
                    </button>
                </div>

                {showPasswordChange && (
                    <div className="space-y-4 sm:space-y-6">
                        <div>
                            <label className="block text-white font-medium mb-2 text-sm sm:text-base">Senha Atual</label>
                            <div className="relative">
                                <input
                                    type={showCurrentPassword ? 'text' : 'password'}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="w-full p-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm pr-10"
                                    placeholder="Digite sua senha atual"
                                />
                                <span className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer" onClick={() => setShowCurrentPassword(!showCurrentPassword)}>
                                    {showCurrentPassword ? <FaEyeSlash className="text-gray-400" /> : <FaEye className="text-gray-400" />}
                                </span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-white font-medium mb-2 text-sm sm:text-base">Nova Senha</label>
                            <div className="relative">
                                <input
                                    type={showNewPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full p-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm pr-10"
                                    placeholder="Digite a nova senha (mín. 6 caracteres)"
                                />
                                <span className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer" onClick={() => setShowNewPassword(!showNewPassword)}>
                                    {showNewPassword ? <FaEyeSlash className="text-gray-400" /> : <FaEye className="text-gray-400" />}
                                </span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-white font-medium mb-2 text-sm sm:text-base">Confirmar Nova Senha</label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full p-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm pr-10"
                                    placeholder="Confirme a nova senha"
                                />
                                <span className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                    {showConfirmPassword ? <FaEyeSlash className="text-gray-400" /> : <FaEye className="text-gray-400" />}
                                </span>
                            </div>
                        </div>

                        {passwordMessage && (
                            <div className="text-sm">
                                <span className={passwordMessage.includes('sucesso') ? 'text-green-500' : 'text-red-500'}>
                                    {passwordMessage}
                                </span>
                            </div>
                        )}

                        <button
                            onClick={handleChangePassword}
                            disabled={isChangingPassword}
                            className="w-full bg-yellow-500 text-gray-900 font-bold py-3 px-6 rounded-lg hover:bg-yellow-400 transition-colors disabled:bg-gray-600 text-sm sm:text-base"
                        >
                            {isChangingPassword ? 'Alterando...' : 'Alterar Senha'}
                        </button>
                    </div>
                )}
            </div>

            {/* Horários de Funcionamento */}
            <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md">
                <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Horários de Funcionamento</h2>
                <div className="space-y-3 sm:space-y-4">
                    {daysOfWeek.map(({ key, label }) => (
                        <div key={key} className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 items-center">
                            <label className="flex items-center space-x-2 sm:space-x-3 text-white text-sm sm:text-base">
                                <input
                                    type="checkbox"
                                    checked={businessHours[key]?.open ?? false}
                                    onChange={(e) => handleBusinessHoursChange(key, 'open', e.target.checked)}
                                    disabled={isSavingHours}
                                    className="form-checkbox h-4 w-4 sm:h-5 sm:w-5 rounded bg-gray-700 border-gray-600 text-yellow-500 focus:ring-yellow-500 disabled:opacity-50"
                                />
                                <span>{label}</span>
                                {isSavingHours && (
                                    <span className="text-yellow-500 text-xs">Salvando...</span>
                                )}
                            </label>
                            <div className="flex items-center col-span-1 sm:col-span-2 gap-2">
                                <input
                                    type="time"
                                    value={businessHours[key]?.start ?? '18:00'}
                                    onChange={(e) => handleBusinessHoursChange(key, 'start', e.target.value)}
                                    disabled={!businessHours[key]?.open || isSavingHours}
                                    className="p-2 w-full rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50 text-sm"
                                />
                                <span className="text-gray-400 text-xs sm:text-sm">até</span>
                                <input
                                    type="time"
                                    value={businessHours[key]?.end ?? '23:00'}
                                    onChange={(e) => handleBusinessHoursChange(key, 'end', e.target.value)}
                                    disabled={!businessHours[key]?.open || isSavingHours}
                                    className="p-2 w-full rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50 text-sm"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Taxas de Entrega */}
            <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md">
                <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Taxas de Entrega por Bairro</h2>
                <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                    {deliveryFees.map((item, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-700 p-3 rounded-lg">
                            <span className="text-white text-sm sm:text-base truncate flex-1 mr-2">{item.neighborhood}</span>
                            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                                <span className="text-yellow-500 font-semibold text-sm sm:text-base">R$ {item.fee.toFixed(2)}</span>
                                <button onClick={() => handleRemoveFee(index)} className="text-red-500 hover:text-red-400 text-lg sm:text-xl">&times;</button>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <input
                        type="text"
                        placeholder="Nome do Bairro"
                        value={newNeighborhood}
                        onChange={(e) => setNewNeighborhood(e.target.value)}
                        className="p-2 flex-grow rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
                    />
                    <input
                        type="number"
                        placeholder="Taxa (ex: 5.00)"
                        value={newFee}
                        onChange={(e) => setNewFee(e.target.value)}
                        className="p-2 w-full sm:w-32 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
                    />
                    <button onClick={handleAddFee} className="bg-yellow-500 text-gray-900 font-bold py-2 px-4 rounded-lg hover:bg-yellow-400 transition-colors text-sm sm:text-base">Adicionar</button>
                </div>
            </div>

            {/* Informações do Estabelecimento */}
            <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md">
                <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Informações do Estabelecimento</h2>
                <div className="space-y-4 sm:space-y-6">
                    {/* Nome do Estabelecimento */}
                    <div>
                        <label className="block text-white font-medium mb-2 text-sm sm:text-base">Nome do Estabelecimento</label>
                        <input
                            type="text"
                            value={establishmentInfo.name}
                            onChange={(e) => setEstablishmentInfo(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full p-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
                        />
                    </div>

                    {/* Título do Cardápio */}
                    <div>
                        <label className="block text-white font-medium mb-2 text-sm sm:text-base">Título do Cardápio</label>
                        <input
                            type="text"
                            value={establishmentInfo.menuTitle || ''}
                            onChange={(e) => setEstablishmentInfo(prev => ({ ...prev, menuTitle: e.target.value }))}
                            className="w-full p-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
                            placeholder="Ex: Cardápio Digital, Menu, etc."
                        />
                        <p className="text-gray-400 text-xs mt-1">Este título aparecerá no topo do cardápio</p>
                    </div>

                    {/* Mostrar Logo */}
                    <div>
                        <label className="flex items-center space-x-3">
                            <input
                                type="checkbox"
                                checked={establishmentInfo.showLogo ?? true}
                                onChange={(e) => setEstablishmentInfo(prev => ({ ...prev, showLogo: e.target.checked }))}
                                className="form-checkbox h-5 w-5 text-yellow-500 rounded focus:ring-yellow-500"
                            />
                            <span className="text-white font-medium text-sm sm:text-base">Mostrar logo no topo do cardápio</span>
                        </label>
                    </div>

                    {/* Endereço */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        <div className="sm:col-span-2 lg:col-span-1">
                            <label className="block text-white font-medium mb-2 text-sm sm:text-base">Rua</label>
                            <input
                                type="text"
                                value={establishmentInfo.address.street}
                                onChange={(e) => setEstablishmentInfo(prev => ({
                                    ...prev,
                                    address: { ...prev.address, street: e.target.value }
                                }))}
                                className="w-full p-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-white font-medium mb-2 text-sm sm:text-base">Cidade</label>
                            <input
                                type="text"
                                value={establishmentInfo.address.city}
                                onChange={(e) => setEstablishmentInfo(prev => ({
                                    ...prev,
                                    address: { ...prev.address, city: e.target.value }
                                }))}
                                className="w-full p-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-white font-medium mb-2 text-sm sm:text-base">Estado</label>
                            <input
                                type="text"
                                value={establishmentInfo.address.state}
                                onChange={(e) => setEstablishmentInfo(prev => ({
                                    ...prev,
                                    address: { ...prev.address, state: e.target.value }
                                }))}
                                className="w-full p-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
                            />
                        </div>
                    </div>

                    {/* Contato */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                            <label className="block text-white font-medium mb-2 text-sm sm:text-base">Telefone</label>
                            <input
                                type="text"
                                value={establishmentInfo.contact.phone}
                                onChange={(e) => setEstablishmentInfo(prev => ({
                                    ...prev,
                                    contact: { ...prev.contact, phone: e.target.value }
                                }))}
                                className="w-full p-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-white font-medium mb-2 text-sm sm:text-base">WhatsApp</label>
                            <input
                                type="text"
                                value={establishmentInfo.contact.whatsapp}
                                onChange={(e) => setEstablishmentInfo(prev => ({
                                    ...prev,
                                    contact: { ...prev.contact, whatsapp: e.target.value }
                                }))}
                                className="w-full p-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
                            />
                        </div>
                    </div>

                    {/* Formas de Pagamento */}
                    <div>
                        <label className="block text-white font-medium mb-2 text-sm sm:text-base">Formas de Pagamento</label>
                        <div className="space-y-2 mb-3 sm:mb-4">
                            {establishmentInfo.paymentMethods.map((method, index) => (
                                <div key={index} className="flex items-center justify-between bg-gray-700 p-3 rounded-lg">
                                    <span className="text-white text-sm sm:text-base truncate flex-1 mr-2">{method}</span>
                                    <button
                                        onClick={() => handleRemovePaymentMethod(index)}
                                        className="text-red-500 hover:text-red-400 text-lg sm:text-xl flex-shrink-0"
                                    >
                                        &times;
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                            <input
                                type="text"
                                placeholder="Nova forma de pagamento"
                                value={newPaymentMethod}
                                onChange={(e) => setNewPaymentMethod(e.target.value)}
                                className="flex-grow p-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
                            />
                            <button
                                onClick={handleAddPaymentMethod}
                                className="bg-yellow-500 text-gray-900 font-bold py-2 px-4 rounded-lg hover:bg-yellow-400 transition-colors text-sm sm:text-base"
                            >
                                Adicionar
                            </button>
                        </div>
                    </div>

                    {/* Redes Sociais */}
                    <div>
                        <label className="block text-white font-medium mb-2 text-sm sm:text-base">Instagram</label>
                        <input
                            type="text"
                            value={establishmentInfo.socialMedia.instagram}
                            onChange={(e) => setEstablishmentInfo(prev => ({
                                ...prev,
                                socialMedia: { ...prev.socialMedia, instagram: e.target.value }
                            }))}
                            className="w-full p-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
                        />
                    </div>

                    {/* Sobre Nós */}
                    <div>
                        <label className="block text-white font-medium mb-2 text-sm sm:text-base">Sobre Nós</label>
                        <textarea
                            value={establishmentInfo.about}
                            onChange={(e) => setEstablishmentInfo(prev => ({ ...prev, about: e.target.value }))}
                            rows={4}
                            className="w-full p-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none text-sm"
                        />
                    </div>

                    {/* Chave PIX */}
                    <div>
                        <label className="block text-white font-medium mb-2 text-sm sm:text-base">Chave PIX</label>
                        <input
                            type="text"
                            value={establishmentInfo.pixKey || ''}
                            onChange={(e) => setEstablishmentInfo(prev => ({ ...prev, pixKey: e.target.value }))}
                            className="w-full p-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Salvar Alterações */}
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-end items-center gap-3 sm:gap-4">
                {saveMessage && <span className="text-green-500 text-sm sm:text-base">{saveMessage}</span>}
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full sm:w-auto bg-yellow-500 text-gray-900 font-bold py-3 px-6 rounded-lg hover:bg-yellow-400 transition-colors disabled:bg-gray-600 text-sm sm:text-base"
                >
                    {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </div>
        </div>
    );
} 