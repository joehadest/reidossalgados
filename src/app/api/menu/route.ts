import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

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
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const updates = await request.json();

        if (!id) {
        return NextResponse.json(
                { success: false, message: 'ID do item não fornecido' },
                { status: 400 }
            );
        }

        const { db } = await connectToDatabase();
        const collection = db.collection('menu');

        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
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
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { success: false, message: 'ID do item não fornecido' },
                { status: 400 }
            );
        }

        const { db } = await connectToDatabase();
        const collection = db.collection('menu');

        const result = await collection.deleteOne({ _id: new ObjectId(id) });

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