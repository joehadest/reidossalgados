import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST() {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection('categories');

    // Categorias padrão para o sistema
    const defaultCategories = [
      { name: 'Salgados', emoji: '🥟', orderIndex: 0 },
      { name: 'Bebidas', emoji: '🥤', orderIndex: 1 },
      { name: 'Doces', emoji: '🍰', orderIndex: 2 },
      { name: 'Lanches', emoji: '🍔', orderIndex: 3 },
      { name: 'Porções', emoji: '🍟', orderIndex: 4 }
    ];

    let addedCount = 0;
    let skippedCount = 0;

    for (const category of defaultCategories) {
      // Verificar se a categoria já existe
      const exists = await collection.findOne({ name: category.name });
      
      if (!exists) {
        await collection.insertOne(category);
        addedCount++;
      } else {
        skippedCount++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Seed executado com sucesso! ${addedCount} categorias adicionadas, ${skippedCount} já existiam.`,
      added: addedCount,
      skipped: skippedCount
    });

  } catch (error) {
    console.error('Erro ao executar seed de categorias:', error);
    return NextResponse.json(
      { success: false, message: 'Erro ao executar seed de categorias' }, 
      { status: 500 }
    );
  }
}
