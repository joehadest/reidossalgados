import { NextResponse } from 'next/server';
import { menuItems } from '@/data/menu';

export async function GET() {
    try {
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
        return NextResponse.json(
            { success: false, message: 'Operação não suportada temporariamente - usando dados estáticos' },
            { status: 405 }
        );
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
        return NextResponse.json(
            { success: false, message: 'Operação não suportada temporariamente - usando dados estáticos' },
            { status: 405 }
        );
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
        return NextResponse.json(
            { success: false, message: 'Operação não suportada temporariamente - usando dados estáticos' },
            { status: 405 }
        );
    } catch (error) {
        console.error('Erro ao excluir item do menu:', error);
        return NextResponse.json(
            { success: false, message: 'Erro ao excluir item do menu' },
            { status: 500 }
        );
    }
} 