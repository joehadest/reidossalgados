import { NextResponse } from 'next/server';
import { Pedido } from '@/types';

// Armazenamento temporário em memória (será perdido quando o servidor reiniciar)
let pedidosTemp: (Pedido & { _id: string })[] = [];
let nextId = 1;

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const telefone = searchParams.get('telefone');

        if (id) {
            const pedido = pedidosTemp.find(p => p._id === id);
            if (!pedido) {
                return NextResponse.json({ success: false, message: 'Pedido não encontrado' }, { status: 404 });
            }
            return NextResponse.json({ success: true, data: pedido });
        }

        let pedidosFiltrados = pedidosTemp;
        if (telefone) {
            pedidosFiltrados = pedidosTemp.filter(p => p.cliente?.telefone === telefone);
        }

        // Ordenar por data (mais recente primeiro)
        pedidosFiltrados.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

        return NextResponse.json({ success: true, data: pedidosFiltrados });
    } catch (error) {
        console.error('Erro ao buscar pedidos:', error);
        return NextResponse.json(
            { success: false, message: 'Erro ao buscar pedidos' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const pedido = await request.json();

        // Calcular o total se não for fornecido
        if (!pedido.total && pedido.itens) {
            pedido.total = pedido.itens.reduce((acc: number, item: any) => {
                return acc + (item.preco * item.quantidade);
            }, 0);
        }

        // Adicionar data se não fornecida
        if (!pedido.data) {
            pedido.data = new Date().toISOString();
        }

        // Garantir que o status seja válido
        if (!pedido.status) {
            pedido.status = 'pendente';
        }

        // Gerar ID único
        const novoPedido = {
            ...pedido,
            _id: `temp_${nextId++}`
        };

        pedidosTemp.push(novoPedido);
        
        return NextResponse.json({ success: true, pedidoId: novoPedido._id });
    } catch (error) {
        console.error('Erro ao criar pedido:', error);
        return NextResponse.json(
            { success: false, message: 'Erro ao criar pedido' },
            { status: 500 }
        );
    }
}

export async function PATCH(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const updates = await request.json();

        if (!id) {
            return NextResponse.json(
                { success: false, message: 'ID do pedido não fornecido' },
                { status: 400 }
            );
        }

        const index = pedidosTemp.findIndex(p => p._id === id);
        if (index === -1) {
            return NextResponse.json(
                { success: false, message: 'Pedido não encontrado' },
                { status: 404 }
            );
        }

        pedidosTemp[index] = { ...pedidosTemp[index], ...updates };

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Erro ao atualizar pedido:', error);
        return NextResponse.json(
            { success: false, message: 'Erro ao atualizar pedido' },
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
                { success: false, message: 'ID do pedido não fornecido' },
                { status: 400 }
            );
        }

        const index = pedidosTemp.findIndex(p => p._id === id);
        if (index === -1) {
            return NextResponse.json(
                { success: false, message: 'Pedido não encontrado' },
                { status: 404 }
            );
        }

        pedidosTemp.splice(index, 1);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Erro ao excluir pedido:', error);
        return NextResponse.json(
            { success: false, message: 'Erro ao excluir pedido' },
            { status: 500 }
        );
    }
} 