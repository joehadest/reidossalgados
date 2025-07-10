import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST() {
    try {
        const { db } = await connectToDatabase();
        const collection = db.collection('pedidos');

        // Limpar dados existentes
        await collection.deleteMany({});

        // Dados de exemplo para pedidos
        const samplePedidos = [
            {
                cliente: {
                    nome: 'João Silva',
                    telefone: '8498729126',
                    endereco: 'Rua Maria Luiza Dantas, 123'
                },
                itens: [
                    { nome: 'Coxinha de Frango', preco: 6.50, quantidade: 2 },
                    { nome: 'Risole de Carne', preco: 5.00, quantidade: 1 }
                ],
                total: 18.00,
                status: 'pendente',
                data: new Date().toISOString(),
                observacoes: 'Sem cebola na coxinha'
            },
            {
                cliente: {
                    nome: 'Maria Santos',
                    telefone: '8498765432',
                    endereco: 'Av. Principal, 456'
                },
                itens: [
                    { nome: 'Empada de Frango', preco: 7.00, quantidade: 3 },
                    { nome: 'Pastel de Queijo', preco: 4.50, quantidade: 2 }
                ],
                total: 30.00,
                status: 'preparando',
                data: new Date(Date.now() - 3600000).toISOString(), // 1 hora atrás
                observacoes: 'Entrega urgente'
            }
        ];

        // Inserir dados de exemplo
        const result = await collection.insertMany(samplePedidos);

        return NextResponse.json({ 
            success: true, 
            message: `Pedidos de exemplo criados com sucesso! ${result.insertedCount} pedidos inseridos.`,
            insertedCount: result.insertedCount
        });
    } catch (error) {
        console.error('Erro ao criar pedidos de exemplo:', error);
        return NextResponse.json(
            { success: false, message: 'Erro ao criar pedidos de exemplo' },
            { status: 500 }
    );
    }
} 