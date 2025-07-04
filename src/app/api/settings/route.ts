import { NextResponse } from 'next/server';

// Armazenamento temporário em memória para configurações
let settingsTemp = {
    isOpen: false,
    businessHours: {
        monday: { open: false, start: '08:00', end: '18:00' },
        tuesday: { open: false, start: '08:00', end: '18:00' },
        wednesday: { open: false, start: '08:00', end: '18:00' },
        thursday: { open: false, start: '08:00', end: '18:00' },
        friday: { open: false, start: '08:00', end: '18:00' },
        saturday: { open: false, start: '08:00', end: '18:00' },
        sunday: { open: false, start: '08:00', end: '18:00' }
    },
    deliveryFees: [
        { neighborhood: 'Centro', fee: 5.00 },
        { neighborhood: 'Bairro', fee: 8.00 }
    ],
    lastUpdated: new Date().toISOString()
};

// Função para verificar se o estabelecimento está aberto
function isCurrentlyOpen(businessHours: any): boolean {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Domingo, 1 = Segunda, etc.
    const currentTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[dayOfWeek];

    const todayHours = businessHours[today];
    if (!todayHours || !todayHours.open) return false;

    return currentTime >= todayHours.start && currentTime <= todayHours.end;
}

export async function GET() {
    try {
        // Verifica se está aberto baseado no horário
        const isOpen = isCurrentlyOpen(settingsTemp.businessHours);
        const currentSettings = { ...settingsTemp, isOpen };

        return NextResponse.json({ success: true, data: currentSettings });
    } catch (error) {
        console.error('Erro ao buscar configurações:', error);
        return NextResponse.json(
            { success: false, message: 'Erro ao buscar configurações' },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        const { isOpen, deliveryFees, businessHours } = await request.json();
        console.log('Recebendo dados para atualização:', { isOpen, deliveryFees, businessHours });

        // Atualizar configurações temporárias
        settingsTemp = {
            ...settingsTemp,
            isOpen,
            deliveryFees: deliveryFees || settingsTemp.deliveryFees,
            businessHours: businessHours || settingsTemp.businessHours,
            lastUpdated: new Date().toISOString()
        };

        console.log('Configurações salvas com sucesso:', settingsTemp);
        return NextResponse.json({ success: true, data: settingsTemp });
    } catch (error) {
        console.error('Erro ao atualizar configurações:', error);
        return NextResponse.json(
            { success: false, message: 'Erro ao atualizar configurações' },
            { status: 500 }
        );
    }
} 