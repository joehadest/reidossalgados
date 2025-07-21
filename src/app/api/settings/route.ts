import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

// Função para verificar se o estabelecimento está aberto
function isCurrentlyOpen(businessHours: any): boolean {
    try {
        // Força o horário de Brasília
        const now = new Date();
        const currentTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
        const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long', timeZone: 'America/Sao_Paulo' }).toLowerCase();
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const today = days.find(d => d === dayOfWeek) || days[now.getDay()];

        console.log('🔍 Verificando status do estabelecimento:');
        console.log('📅 Dia da semana:', today);
        console.log('🕐 Hora atual:', currentTime);
        console.log('📋 Horários configurados:', businessHours);

        if (!businessHours || typeof businessHours !== 'object') {
            console.log('❌ Horários de negócio inválidos:', businessHours);
            return false;
        }

        const todayHours = businessHours[today];
        console.log('📅 Horários de hoje:', todayHours);

        if (!todayHours || !todayHours.open) {
            console.log('❌ Estabelecimento fechado: dia não configurado ou marcado como fechado');
            return false;
        }

        const isOpen = currentTime >= todayHours.start && currentTime <= todayHours.end;
        console.log(`⏰ Verificando horário: ${currentTime} >= ${todayHours.start} && ${currentTime} <= ${todayHours.end} = ${isOpen}`);
        
        return isOpen;
    } catch (error) {
        console.error('❌ Erro ao verificar horários:', error);
        return false;
    }
}

export async function GET() {
    try {
        console.log('🚀 Iniciando busca de configurações...');
        
        const { db } = await connectToDatabase();
        console.log('✅ Conexão com banco estabelecida');
        
        const collection = db.collection('settings');
        console.log('✅ Coleção settings acessada');

        // Buscar configurações do banco de dados
        let settings = await collection.findOne({});
        console.log('📋 Configurações encontradas:', settings ? 'Sim' : 'Não');

        // Se não existir, criar configurações padrão
        if (!settings) {
            console.log('📝 Criando configurações padrão...');
            const defaultSettings = {
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
                // Informações do estabelecimento
                establishmentInfo: {
                    name: 'Rei dos Salgados',
                    address: {
                        street: 'Rua Maria Luiza Dantas',
                        city: 'Alto Rodrigues',
                        state: 'RN'
                    },
                    contact: {
                        phone: '+55 84 9872-9126',
                        whatsapp: '+55 84 9872-9126'
                    },
                    paymentMethods: [
                        'Cartão de Crédito',
                        'Cartão de Débito', 
                        'PIX',
                        'Dinheiro'
                    ],
                    socialMedia: {
                        instagram: '@reidossalgados'
                    },
                    about: 'Especialistas em salgados artesanais, oferecendo qualidade e sabor em cada pedido. Nossos produtos são feitos com ingredientes frescos e selecionados.',
                    pixKey: '' // Adiciona campo pixKey
                },
    lastUpdated: new Date().toISOString()
};

            await collection.insertOne(defaultSettings);
            settings = defaultSettings as any;
            console.log('✅ Configurações padrão criadas');
}

        // Verifica se está aberto baseado no horário
        const isOpen = isCurrentlyOpen(settings!.businessHours);
        console.log('🔍 Status calculado:', isOpen);
        
        const currentSettings = { ...settings, isOpen };
        console.log('✅ Configurações retornadas com sucesso');

        return NextResponse.json({ success: true, data: currentSettings });
    } catch (error) {
        console.error('❌ Erro ao buscar configurações:', error);
        return NextResponse.json(
            { success: false, message: 'Erro ao buscar configurações', details: error instanceof Error ? error.message : 'Erro desconhecido' },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        console.log('🚀 Iniciando atualização de configurações...');
        
        const { isOpen, deliveryFees, businessHours, establishmentInfo } = await request.json();
        console.log('📝 Recebendo dados para atualização:', { isOpen, deliveryFees, businessHours, establishmentInfo });

        const { db } = await connectToDatabase();
        console.log('✅ Conexão com banco estabelecida');
        
        const collection = db.collection('settings');
        console.log('✅ Coleção settings acessada');

        // Recalcular se está aberto baseado nos horários
        const calculatedIsOpen = businessHours ? isCurrentlyOpen(businessHours) : false;
        console.log('🔍 Status recalculado:', calculatedIsOpen);

        const updatedSettings = {
            isOpen: calculatedIsOpen, // Usar o status calculado automaticamente
            deliveryFees: deliveryFees || [],
            businessHours: businessHours || {},
            establishmentInfo: establishmentInfo || {},
            lastUpdated: new Date().toISOString()
        };

        // Atualizar ou inserir configurações
        await collection.updateOne(
            {},
            { $set: updatedSettings },
            { upsert: true }
        );

        console.log('✅ Configurações salvas com sucesso:', updatedSettings);
        return NextResponse.json({ success: true, data: updatedSettings });
    } catch (error) {
        console.error('❌ Erro ao atualizar configurações:', error);
        return NextResponse.json(
            { success: false, message: 'Erro ao atualizar configurações', details: error instanceof Error ? error.message : 'Erro desconhecido' },
            { status: 500 }
        );
    }
} 