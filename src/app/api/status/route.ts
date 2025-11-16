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

interface SettingsDoc {
    isOpen: boolean;
    businessHours: Record<string, { open: boolean; start: string; end: string }>;
}

export async function GET(request: Request) {
    try {
        console.log('🚀 Iniciando busca de status...');

        const { db } = await connectToDatabase();
        const settingsCollection = db.collection<SettingsDoc>('settings');

        // Buscar configurações existentes
        let settings: SettingsDoc | null = await settingsCollection.findOne({});
        if (!settings) {
            console.log('📝 Nenhuma configuração encontrada. Criando padrão...');
            const defaultSettings: SettingsDoc = {
                isOpen: false,
                businessHours: {
                    monday: { open: false, start: '18:00', end: '23:00' },
                    tuesday: { open: false, start: '18:00', end: '23:00' },
                    wednesday: { open: true, start: '18:00', end: '23:00' },
                    thursday: { open: true, start: '18:00', end: '23:00' },
                    friday: { open: true, start: '18:00', end: '23:00' },
                    saturday: { open: true, start: '18:00', end: '23:00' },
                    sunday: { open: true, start: '18:00', end: '23:00' }
                }
            };
            await settingsCollection.insertOne(defaultSettings);
            settings = defaultSettings;
        }

        const businessHours = settings.businessHours || {};
        const englishToPt: Record<string, string> = {
            monday: 'segunda',
            tuesday: 'terça',
            wednesday: 'quarta',
            thursday: 'quinta',
            friday: 'sexta',
            saturday: 'sábado',
            sunday: 'domingo'
        };

        const now = new Date();
        const todayEn = now.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'America/Sao_Paulo' }).toLowerCase();
        const todayHours = businessHours[todayEn];

        let calculatedOpen = isCurrentlyOpen(businessHours);
        if (typeof settings.isOpen === 'boolean') {
            calculatedOpen = settings.isOpen;
        }

        const horarioAbertura = todayHours?.start || '18:00';
        const horarioFechamento = todayHours?.end || '23:00';
        const diasFuncionamento = Object.entries(businessHours)
            .filter(([_, v]: any) => v && v.open)
            .map(([k]) => englishToPt[k] || k);

        const status: RestaurantStatus = {
            isOpen: calculatedOpen,
            horarioAbertura,
            horarioFechamento,
            diasFuncionamento,
            mensagemFechado: 'Estamos fechados. Volte em breve!'
        };

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