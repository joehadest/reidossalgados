import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST() {
    try {
        const { db } = await connectToDatabase();
        const collection = db.collection('pedidos');

        // Buscar todos os pedidos
        const pedidos = await collection.find({}).toArray();
        
        console.log(`Encontrados ${pedidos.length} pedidos para verificar`);

        let updatedCount = 0;

        for (const pedido of pedidos) {
            let needsUpdate = false;
            let updatedPedido = { ...pedido };

            // Verificar se o endereço precisa ser migrado
            if (pedido.endereco && pedido.tipoEntrega === 'entrega') {
                console.log('Verificando pedido:', pedido._id);
                console.log('Endereço atual:', pedido.endereco);

                // Se endereco.address é uma string, converter para objeto
                if (typeof pedido.endereco.address === 'string') {
                    console.log('Convertendo endereço de string para objeto');
                    updatedPedido.endereco = {
                        address: {
                            street: pedido.endereco.address,
                            number: '',
                            complement: '',
                            neighborhood: pedido.endereco.neighborhood || '',
                            referencePoint: ''
                        },
                        deliveryFee: pedido.endereco.deliveryFee || 0,
                        estimatedTime: pedido.endereco.estimatedTime || '30-45 minutos'
                    };
                    needsUpdate = true;
                }

                // Se endereco não tem a estrutura correta
                if (!pedido.endereco.address || typeof pedido.endereco.address !== 'object') {
                    console.log('Estrutura de endereço incorreta, corrigindo...');
                    updatedPedido.endereco = {
                        address: {
                            street: pedido.endereco.street || '',
                            number: pedido.endereco.number || '',
                            complement: pedido.endereco.complement || '',
                            neighborhood: pedido.endereco.neighborhood || '',
                            referencePoint: pedido.endereco.referencePoint || ''
                        },
                        deliveryFee: pedido.endereco.deliveryFee || 0,
                        estimatedTime: pedido.endereco.estimatedTime || '30-45 minutos'
                    };
                    needsUpdate = true;
                }
            }

            // Atualizar se necessário
            if (needsUpdate) {
                await collection.updateOne(
                    { _id: pedido._id },
                    { $set: updatedPedido }
                );
                updatedCount++;
                console.log(`Pedido ${pedido._id} atualizado`);
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: `Migração concluída! ${updatedCount} pedidos atualizados de ${pedidos.length} total.`,
            updatedCount,
            totalCount: pedidos.length
        });
    } catch (error) {
        console.error('Erro na migração:', error);
        return NextResponse.json(
            { success: false, message: 'Erro na migração' },
            { status: 500 }
        );
    }
} 