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

        if (password.length < 6) {
            return NextResponse.json(
                { success: false, message: 'A senha deve ter pelo menos 6 caracteres' },
                { status: 400 }
            );
        }

        const { db } = await connectToDatabase();

        // Verificar se já existe um administrador
        const existingAdmin = await db.collection('admin').findOne({});
        
        if (existingAdmin) {
            return NextResponse.json(
                { success: false, message: 'Administrador já configurado' },
                { status: 400 }
            );
        }

        // Criptografar a senha
        const hashedPassword = await bcrypt.hash(password, 12);

        // Criar o documento do administrador
        await db.collection('admin').insertOne({
            password: hashedPassword,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        return NextResponse.json(
            { success: true, message: 'Administrador configurado com sucesso!' },
            { status: 200 }
        );

    } catch (error) {
        console.error('Erro ao inicializar administrador:', error);
        return NextResponse.json(
            { success: false, message: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
} 