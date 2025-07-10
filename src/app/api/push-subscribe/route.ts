import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST(request: Request) {
    const { subscription, pedidoId } = await request.json();

    console.log('Recebendo subscription:', subscription, 'para pedido:', pedidoId);

    try {
        const { db } = await connectToDatabase();
        const collection = db.collection('push_subscriptions');

        // Salvar subscription no banco de dados
        await collection.updateOne(
            { pedidoId },
            { $set: { subscription, pedidoId, createdAt: new Date().toISOString() } },
            { upsert: true }
        );

        console.log('pushSubscription salva com sucesso para o pedido:', pedidoId);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Erro ao salvar pushSubscription:', error);
        return NextResponse.json({ success: false, message: 'Erro ao salvar pushSubscription' }, { status: 500 });
    }
} 