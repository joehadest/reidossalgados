import { NextResponse } from 'next/server';
import { Pedido } from '@/types/cart';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const telefone = searchParams.get('telefone');

        const { db } = await connectToDatabase();
        const collection = db.collection('pedidos');

        if (id) {
            const pedido = await collection.findOne({ _id: new ObjectId(id) });
            if (!pedido) {
                return NextResponse.json({ success: false, message: 'Pedido não encontrado' }, { status: 404 });
            }
            return NextResponse.json({ success: true, data: pedido });
        }

        let query = {};
        if (telefone) {
            query = { 'cliente.telefone': telefone };
        }

        const pedidos = await collection.find(query).sort({ data: -1 }).toArray();

        return NextResponse.json({ success: true, data: pedidos });
    } catch (error) {
        console.error('Erro ao buscar pedidos:', error);
        return NextResponse.json(
            { success: false, message: 'Erro ao buscar pedidos' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const pedido = await request.json();

        // Calcular o total se não for fornecido
        if (!pedido.total && pedido.itens) {
            pedido.total = pedido.itens.reduce((acc: number, item: any) => {
                return acc + (item.preco * item.quantidade);
            }, 0);
        }

        // Adicionar data se não fornecida
        if (!pedido.data) {
            pedido.data = new Date().toISOString();
        }

        // Garantir que o status seja válido
        if (!pedido.status) {
            pedido.status = 'pendente';
        }

        const { db } = await connectToDatabase();
        const collection = db.collection('pedidos');

        const result = await collection.insertOne(pedido);
        
        return NextResponse.json({ success: true, pedidoId: result.insertedId.toString() });
    } catch (error) {
        console.error('Erro ao criar pedido:', error);
        return NextResponse.json(
            { success: false, message: 'Erro ao criar pedido' },
            { status: 500 }
        );
    }
}

export async function PATCH(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const updates = await request.json();

        if (!id) {
            return NextResponse.json(
                { success: false, message: 'ID do pedido não fornecido' },
                { status: 400 }
            );
        }

        const { db } = await connectToDatabase();
        const collection = db.collection('pedidos');

        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updates }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json(
                { success: false, message: 'Pedido não encontrado' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Erro ao atualizar pedido:', error);
        return NextResponse.json(
            { success: false, message: 'Erro ao atualizar pedido' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { success: false, message: 'ID do pedido não fornecido' },
                { status: 400 }
            );
        }

        const { db } = await connectToDatabase();
        const collection = db.collection('pedidos');

        const result = await collection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return NextResponse.json(
                { success: false, message: 'Pedido não encontrado' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Erro ao excluir pedido:', error);
        return NextResponse.json(
            { success: false, message: 'Erro ao excluir pedido' },
            { status: 500 }
        );
    }
} 