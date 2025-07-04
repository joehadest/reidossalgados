import { NextResponse } from 'next/server';
import { Pedido } from '@/types';

// Importar o array temporário de pedidos (será compartilhado com a rota principal)
// Nota: Em uma implementação real, isso deveria ser um módulo separado
let pedidosTemp: (Pedido & { _id: string })[] = [];

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const pedido = pedidosTemp.find(p => p._id === params.id);

        if (!pedido) {
            return NextResponse.json(
                { error: 'Pedido não encontrado' },
                { status: 404 }
            );
        }

        return NextResponse.json(pedido);
    } catch (error) {
        console.error('Erro ao buscar pedido:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar pedido' },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const updates = await request.json();

        // Atualiza o timestamp
        updates.updatedAt = new Date().toISOString();

        const index = pedidosTemp.findIndex(p => p._id === params.id);
        if (index === -1) {
            return NextResponse.json(
                { error: 'Pedido não encontrado' },
                { status: 404 }
            );
        }

        const statusAnterior = pedidosTemp[index].status;
        pedidosTemp[index] = { ...pedidosTemp[index], ...updates };

        // Registra mudança de status (apenas log, sem banco de dados)
        if (updates.status) {
            console.log(`Status do pedido ${params.id} alterado para: ${updates.status}`);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Erro ao atualizar pedido:', error);
        return NextResponse.json(
            { error: 'Erro ao atualizar pedido' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const index = pedidosTemp.findIndex(p => p._id === params.id);
        if (index === -1) {
            return NextResponse.json(
                { error: 'Pedido não encontrado' },
                { status: 404 }
            );
        }

        pedidosTemp.splice(index, 1);

        // Registra remoção (apenas log, sem banco de dados)
        console.log(`Pedido ${params.id} removido`);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Erro ao remover pedido:', error);
        return NextResponse.json(
            { error: 'Erro ao remover pedido' },
            { status: 500 }
        );
    }
}