import { NextResponse } from 'next/server';
import { Pedido } from '@/types';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        console.log('API: Buscando pedido com ID:', params.id);
        
        const { db } = await connectToDatabase();
        const collection = db.collection('pedidos');

        const pedido = await collection.findOne({ _id: new ObjectId(params.id) });

        console.log('API: Pedido encontrado:', pedido);

        if (!pedido) {
            console.log('API: Pedido não encontrado');
            return NextResponse.json(
                { error: 'Pedido não encontrado' },
                { status: 404 }
            );
        }

        // Converter ObjectId para string
        const pedidoResponse = {
            ...pedido,
            _id: pedido._id.toString()
        };

        console.log('API: Retornando pedido:', pedidoResponse);
        return NextResponse.json(pedidoResponse);
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

        const { db } = await connectToDatabase();
        const collection = db.collection('pedidos');

        const result = await collection.updateOne(
            { _id: new ObjectId(params.id) },
            { $set: updates }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json(
                { error: 'Pedido não encontrado' },
                { status: 404 }
            );
        }

        // Registra mudança de status
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
        const { db } = await connectToDatabase();
        const collection = db.collection('pedidos');

        const result = await collection.deleteOne({ _id: new ObjectId(params.id) });

        if (result.deletedCount === 0) {
            return NextResponse.json(
                { error: 'Pedido não encontrado' },
                { status: 404 }
            );
        }

        // Registra remoção
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