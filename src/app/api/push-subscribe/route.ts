import { NextResponse } from 'next/server';

// Armazenamento temporário em memória para push subscriptions
let pushSubscriptionsTemp: { [pedidoId: string]: any } = {};

export async function POST(request: Request) {
    const { subscription, pedidoId } = await request.json();

    console.log('Recebendo subscription:', subscription, 'para pedido:', pedidoId);

    try {
        // Salvar subscription temporariamente
        pushSubscriptionsTemp[pedidoId] = subscription;

        console.log('pushSubscription salva com sucesso para o pedido:', pedidoId);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Erro ao salvar pushSubscription:', error);
        return NextResponse.json({ success: false, message: 'Erro ao salvar pushSubscription' }, { status: 500 });
    }
} 