import { NextResponse } from 'next/server';

// Armazenamento temporário em memória para notificações
let notificationsTemp: any[] = [];
let nextNotificationId = 1;

// Armazenar conexões WebSocket ativas
const clients = new Map();

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
        return NextResponse.json({ error: 'Client ID é obrigatório' }, { status: 400 });
    }

    try {
        // Buscar notificações não lidas para este cliente
        const notifications = notificationsTemp
            .filter(n => n.clientId === clientId && !n.read)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return NextResponse.json({ success: true, data: notifications });
    } catch (error) {
        console.error('Erro ao buscar notificações:', error);
        return NextResponse.json(
            { success: false, message: 'Erro ao buscar notificações' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const { clientId, orderId, status, message } = await request.json();

        const notification = {
            _id: `temp_notif_${nextNotificationId++}`,
            clientId,
            orderId,
            status,
            message,
            read: false,
            createdAt: new Date().toISOString()
        };

        notificationsTemp.push(notification);

        // Notificar todos os clientes conectados
        clients.forEach((client) => {
            if (client.clientId === clientId) {
                client.send(JSON.stringify(notification));
            }
        });

        return NextResponse.json({ success: true, data: notification });
    } catch (error) {
        console.error('Erro ao criar notificação:', error);
        return NextResponse.json(
            { success: false, message: 'Erro ao criar notificação' },
            { status: 500 }
        );
    }
}

export async function PATCH(request: Request) {
    try {
        const { notificationId } = await request.json();

        const index = notificationsTemp.findIndex(n => n._id === notificationId);
        if (index !== -1) {
            notificationsTemp[index].read = true;
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Erro ao marcar notificação como lida:', error);
        return NextResponse.json(
            { success: false, message: 'Erro ao marcar notificação como lida' },
            { status: 500 }
        );
    }
} 