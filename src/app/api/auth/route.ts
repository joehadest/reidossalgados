import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../mongodb';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
    try {
        const { password } = await request.json();

        // Validações
        if (!password) {
            return NextResponse.json(
                { success: false, message: 'Senha é obrigatória' },
                { status: 400 }
            );
        }

        const { db } = await connectToDatabase();

        // Buscar o administrador no banco de dados
        const adminDoc = await db.collection('admin').findOne({});
        
        if (!adminDoc) {
            return NextResponse.json(
                { success: false, message: 'Administrador não configurado. Use a API /api/init-admin primeiro.' },
                { status: 404 }
            );
        }

        // Verificar se a senha está correta
        const isPasswordValid = await bcrypt.compare(password, adminDoc.password);
        
        if (!isPasswordValid) {
            return NextResponse.json(
                { success: false, message: 'Senha incorreta' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { success: true, message: 'Autenticação realizada com sucesso!' },
            { status: 200 }
        );

    } catch (error) {
        console.error('Erro na autenticação:', error);
        return NextResponse.json(
            { success: false, message: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
} 