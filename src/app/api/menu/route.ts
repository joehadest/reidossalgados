import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const { db } = await connectToDatabase();
        const collection = db.collection('menu');

        // Buscar itens do menu do banco de dados
        let menuItems = await collection.find({}).toArray();

        // Se não existir, usar dados estáticos como fallback
        if (menuItems.length === 0) {
            const { menuItems: staticMenu } = await import('@/data/menu');
            menuItems = staticMenu as any;
        }

        return NextResponse.json({
            success: true,
            data: menuItems
        });
    } catch (error) {
        console.error('Erro ao buscar menu:', error);
        return NextResponse.json(
            { success: false, message: 'Erro ao buscar menu' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const item = await request.json();

        const { db } = await connectToDatabase();
        const collection = db.collection('menu');

        const result = await collection.insertOne(item);

        return NextResponse.json({
            success: true,
            data: { ...item, _id: result.insertedId }
        });
    } catch (error) {
        console.error('Erro ao criar item do menu:', error);
        return NextResponse.json(
            { success: false, message: 'Erro ao criar item do menu' },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        const url = new URL(request.url);
        const idFromQuery = url.searchParams.get('id');

        // Tenta parsear o corpo; se vier vazio, continua com objeto vazio
        let data: any = {};
        try {
            data = await request.json();
        } catch (_) { /* corpo possivelmente vazio */ }

        const bodyId = data?._id;
        const finalId = bodyId || idFromQuery;

        if (!finalId) {
            return NextResponse.json(
                { success: false, message: 'ID do item não fornecido' },
                { status: 400 }
            );
        }

        // Remove _id de dentro do objeto de atualização para não tentar sobrescrever
        if (data._id) delete data._id;
        const updates = data;

        const { db } = await connectToDatabase();
        const collection = db.collection('menu');

        const result = await collection.updateOne(
            { _id: new ObjectId(finalId) },
            { $set: updates }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json(
                { success: false, message: 'Item não encontrado' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Erro ao atualizar item do menu:', error);
        return NextResponse.json(
            { success: false, message: 'Erro ao atualizar item do menu' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    try {
        const { _id } = await request.json();

        if (!_id) {
            return NextResponse.json(
                { success: false, message: 'ID do item não fornecido' },
                { status: 400 }
            );
        }

        const { db } = await connectToDatabase();
        const collection = db.collection('menu');

        const result = await collection.deleteOne({ _id: new ObjectId(_id) });

        if (result.deletedCount === 0) {
            return NextResponse.json(
                { success: false, message: 'Item não encontrado' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Erro ao excluir item do menu:', error);
        return NextResponse.json(
            { success: false, message: 'Erro ao excluir item do menu' },
            { status: 500 }
        );
    }
} 