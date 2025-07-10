import { NextResponse } from 'next/server';
import { RestaurantStatus } from '@/types';
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
        console.log('🚀 Iniciando busca de status...');
        
        const { db } = await connectToDatabase();
        console.log('✅ Conexão com banco estabelecida');
        
        const settingsCollection = db.collection('settings');
        console.log('✅ Coleção settings acessada');

        // Buscar configurações do banco de dados
        let settings = await settingsCollection.findOne({});
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
                }
            };

            await settingsCollection.insertOne(defaultSettings);
            settings = defaultSettings as any;
            console.log('✅ Configurações padrão criadas');
        }

        // Calcular se está aberto baseado nos horários
        const isOpen = isCurrentlyOpen(settings!.businessHours);
        console.log('🔍 Status calculado:', isOpen);

        // Criar objeto de status compatível
        const status: RestaurantStatus = {
            isOpen,
    horarioAbertura: '18:00',
    horarioFechamento: '23:00',
    diasFuncionamento: ['quarta', 'quinta', 'sexta', 'sabado', 'domingo', 'segunda'],
    mensagemFechado: 'Estamos fechados. Volte em breve!'
};

        console.log('✅ Status retornado com sucesso:', status);
        return NextResponse.json(status);
    } catch (error) {
        console.error('❌ Erro ao buscar status:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar status', details: error instanceof Error ? error.message : 'Erro desconhecido' },
            { status: 500 }
        );
    }
}

export async function PATCH(request: Request) {
    try {
        const updates = await request.json();

        const { db } = await connectToDatabase();
        const settingsCollection = db.collection('settings');

        // Buscar configurações atuais
        let settings = await settingsCollection.findOne({});
        
        if (!settings) {
            // Se não existir, criar configurações padrão
            settings = {
                isOpen: false,
                businessHours: {
                    monday: { open: false, start: '08:00', end: '18:00' },
                    tuesday: { open: false, start: '08:00', end: '18:00' },
                    wednesday: { open: false, start: '08:00', end: '18:00' },
                    thursday: { open: false, start: '08:00', end: '18:00' },
                    friday: { open: false, start: '08:00', end: '18:00' },
                    saturday: { open: false, start: '08:00', end: '18:00' },
                    sunday: { open: false, start: '08:00', end: '18:00' }
                }
            } as any;
        }

        // Atualizar configurações
        await settingsCollection.updateOne(
            {},
            { $set: { ...settings, ...updates } },
            { upsert: true }
        );

        // Registra mudança
        console.log(`Status do restaurante alterado: ${updates.isOpen ? 'Aberto' : 'Fechado'}`);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        return NextResponse.json(
            { error: 'Erro ao atualizar status', details: error instanceof Error ? error.message : 'Erro desconhecido' },
            { status: 500 }
        );
    }
} 