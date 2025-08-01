import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection('categories');
    let categories = await collection.find({}).toArray();
    // Ordenação fixa desejada
    const order = [
      'Salgados',
      'Bebidas',
      'Sobremesas',
      'Mini salgados para eventos'
    ];
    categories.sort((a, b) => {
      const ia = order.findIndex(o => a.name.toLowerCase() === o.toLowerCase());
      const ib = order.findIndex(o => b.name.toLowerCase() === o.toLowerCase());
      if (ia === -1 && ib === -1) return 0;
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Erro ao buscar categorias' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, emoji } = await request.json();
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ success: false, message: 'Nome da categoria obrigatório' }, { status: 400 });
    }
    const { db } = await connectToDatabase();
    const collection = db.collection('categories');
    // Evitar duplicidade
    const exists = await collection.findOne({ name });
    if (exists) {
      return NextResponse.json({ success: false, message: 'Categoria já existe' }, { status: 400 });
    }
    // Inserir com emoji, se fornecido
    const result = await collection.insertOne({
      name,
      emoji: emoji || '🍽️' // Emoji padrão se não for fornecido
    });
    return NextResponse.json({ success: true, data: { _id: result.insertedId, name, emoji: emoji || '🍽️' } });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Erro ao adicionar categoria' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, message: 'ID da categoria não fornecido' }, { status: 400 });
    }
    const { db } = await connectToDatabase();
    const collection = db.collection('categories');
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, message: 'Categoria não encontrada' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Erro ao remover categoria' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const { name, emoji } = await request.json();
    if (!id || !name) {
      return NextResponse.json({ success: false, message: 'ID e nome obrigatórios' }, { status: 400 });
    }
    const { db } = await connectToDatabase();
    const collection = db.collection('categories');

    // Objeto para atualização
    const updateData: { name: string; emoji?: string } = { name };

    // Adicionar emoji apenas se estiver definido
    if (emoji !== undefined) {
      updateData.emoji = emoji;
    }

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, message: 'Categoria não encontrada' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Erro ao editar categoria' }, { status: 500 });
  }
}