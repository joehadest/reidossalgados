import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { menuItems } from '@/data/menu';

export async function POST() {
    try {
        const { db } = await connectToDatabase();
        const collection = db.collection('menu');

        // Limpar dados existentes
        await collection.deleteMany({});

        // Inserir dados do menu
        const result = await collection.insertMany(menuItems as any);

        return NextResponse.json({ 
            success: true, 
            message: `Menu populado com sucesso! ${result.insertedCount} itens inseridos.`,
            insertedCount: result.insertedCount
        });
    } catch (error) {
        console.error('Erro ao popular menu:', error);
    return NextResponse.json(
            { success: false, message: 'Erro ao popular menu' },
            { status: 500 }
    );
    }
} 