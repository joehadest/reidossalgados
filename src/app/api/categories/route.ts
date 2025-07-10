import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection('categories');
    const categories = await collection.find({}).toArray();
    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Erro ao buscar categorias' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json();
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
    const result = await collection.insertOne({ name });
    return NextResponse.json({ success: true, data: { _id: result.insertedId, name } });
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
    const { name } = await request.json();
    if (!id || !name) {
      return NextResponse.json({ success: false, message: 'ID e nome obrigatórios' }, { status: 400 });
    }
    const { db } = await connectToDatabase();
    const collection = db.collection('categories');
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { name } }
    );
    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, message: 'Categoria não encontrada' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Erro ao editar categoria' }, { status: 500 });
  }
} 