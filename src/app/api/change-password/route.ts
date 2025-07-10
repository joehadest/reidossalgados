import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../mongodb';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
    try {
        const { currentPassword, newPassword } = await request.json();

        // Validações
        if (!currentPassword || !newPassword) {
            return NextResponse.json(
                { success: false, message: 'Senha atual e nova senha são obrigatórias' },
                { status: 400 }
            );
        }

        if (newPassword.length < 6) {
            return NextResponse.json(
                { success: false, message: 'A nova senha deve ter pelo menos 6 caracteres' },
                { status: 400 }
            );
        }

        const { db } = await connectToDatabase();

        // Buscar a senha atual do administrador
        const adminDoc = await db.collection('admin').findOne({});
        
        if (!adminDoc) {
            return NextResponse.json(
                { success: false, message: 'Configuração de administrador não encontrada' },
                { status: 404 }
            );
        }

        // Verificar se a senha atual está correta
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, adminDoc.password);
        
        if (!isCurrentPasswordValid) {
            return NextResponse.json(
                { success: false, message: 'Senha atual incorreta' },
                { status: 401 }
            );
        }

        // Criptografar a nova senha
        const hashedNewPassword = await bcrypt.hash(newPassword, 12);

        // Atualizar a senha no banco de dados
        await db.collection('admin').updateOne(
            { _id: adminDoc._id },
            { $set: { password: hashedNewPassword } }
        );

        return NextResponse.json(
            { success: true, message: 'Senha alterada com sucesso!' },
            { status: 200 }
        );

    } catch (error) {
        console.error('Erro ao alterar senha:', error);
        return NextResponse.json(
            { success: false, message: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
} 