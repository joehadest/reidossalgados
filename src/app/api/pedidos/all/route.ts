import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function DELETE() {
    try {
        const { db } = await connectToDatabase();
        const collection = db.collection('pedidos');

        const result = await collection.deleteMany({});

        return NextResponse.json({ 
            success: true, 
            deletedCount: result.deletedCount 
        });
    } catch (error) {
        console.error('Erro ao excluir todos os pedidos:', error);
        return NextResponse.json(
            { success: false, message: 'Erro ao excluir pedidos' },
            { status: 500 }
        );
    }
}

