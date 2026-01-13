import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection('categories');
    // Buscar categorias ordenadas por orderIndex (menor para maior)
    let categories = await collection.find({}).sort({ orderIndex: 1 }).toArray();

    // Se não houver orderIndex definido, inicializar com base na ordem atual
    if (categories.some(cat => cat.orderIndex === undefined)) {
      const categoriesWithoutOrder = categories.filter(cat => cat.orderIndex === undefined);
      for (let i = 0; i < categoriesWithoutOrder.length; i++) {
        await collection.updateOne(
          { _id: categoriesWithoutOrder[i]._id },
          { $set: { orderIndex: categories.length + i } }
        );
      }
      // Buscar novamente após inicializar
      categories = await collection.find({}).sort({ orderIndex: 1 }).toArray();
    }

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

    // Obter o próximo orderIndex
    const categoriesCount = await collection.countDocuments();

    // Inserir com emoji e orderIndex
    const result = await collection.insertOne({
      name,
      emoji: emoji || '🍽️', // Emoji padrão se não for fornecido
      orderIndex: categoriesCount // Adicionar ao final
    });
    return NextResponse.json({ success: true, data: { _id: result.insertedId, name, emoji: emoji || '🍽️', orderIndex: categoriesCount } });
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

// Nova função PATCH para reordenar categorias
export async function PATCH(request: Request) {
  try {
    const { categories } = await request.json();

    if (!Array.isArray(categories)) {
      return NextResponse.json({ success: false, message: 'Lista de categorias inválida' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const collection = db.collection('categories');

    // Atualizar o orderIndex de cada categoria
    const updatePromises = categories.map((category, index) => {
      return collection.updateOne(
        { _id: new ObjectId(category._id) },
        { $set: { orderIndex: index } }
      );
    });

    await Promise.all(updatePromises);

    return NextResponse.json({ success: true, message: 'Ordem das categorias atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao reordenar categorias:', error);
    return NextResponse.json({ success: false, message: 'Erro ao reordenar categorias' }, { status: 500 });
  }
}