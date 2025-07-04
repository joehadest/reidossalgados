import { NextResponse } from 'next/server';
import { RestaurantStatus } from '@/types';

// Armazenamento temporário em memória para status do restaurante
let statusTemp: RestaurantStatus = {
    isOpen: false,
    horarioAbertura: '18:00',
    horarioFechamento: '23:00',
    diasFuncionamento: ['quarta', 'quinta', 'sexta', 'sabado', 'domingo', 'segunda'],
    mensagemFechado: 'Estamos fechados. Volte em breve!'
};

export async function GET() {
    try {
        return NextResponse.json(statusTemp);
    } catch (error) {
        console.error('Erro ao buscar status:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar status' },
            { status: 500 }
        );
    }
}

export async function PATCH(request: Request) {
    try {
        const updates = await request.json();

        // Atualizar status temporário
        statusTemp = { ...statusTemp, ...updates };

        // Registra mudança (apenas log, sem banco de dados)
        console.log(`Status do restaurante alterado: ${updates.isOpen ? 'Aberto' : 'Fechado'}`);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        return NextResponse.json(
            { error: 'Erro ao atualizar status' },
            { status: 500 }
        );
    }
} 