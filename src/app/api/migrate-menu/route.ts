import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST() {
    try {
        const { db } = await connectToDatabase();
        const collection = db.collection('menu');

        // Buscar todos os itens que NÃO são tipos principais
        const itemsToMigrate = await collection.find({
            $or: [
                { isMainType: { $exists: false } },
                { isMainType: false }
            ]
        }).toArray();

        console.log(`Encontrados ${itemsToMigrate.length} itens para migrar`);

        if (itemsToMigrate.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'Nenhum item para migrar',
                migrated: 0
            });
        }

        // Agrupar itens por categoria e nome similar
        const groupedItems: { [key: string]: any[] } = {};

        for (const item of itemsToMigrate) {
            // Criar uma chave baseada no nome principal (antes de hífen ou traço)
            const baseName = item.name.split(/[-–—]/)[0].trim();
            const categoryKey = `${item.category}_${baseName.toLowerCase()}`;
            
            if (!groupedItems[categoryKey]) {
                groupedItems[categoryKey] = [];
            }
            groupedItems[categoryKey].push(item);
        }

        let migratedCount = 0;
        const results = [];

        for (const [groupKey, items] of Object.entries(groupedItems)) {
            if (items.length === 1) {
                // Item único - converter para tipo com um sabor
                const item = items[0];
                const newType = {
                    ...item,
                    isMainType: true,
                    flavors: [{
                        name: item.name.includes('-') ? item.name.split('-')[1].trim() : 'Tradicional',
                        description: item.description,
                        price: item.price,
                        available: item.available !== false
                    }]
                };

                await collection.replaceOne({ _id: item._id }, newType);
                migratedCount++;
                results.push({
                    action: 'converted_to_type',
                    original: item.name,
                    newType: newType.name,
                    flavors: 1
                });
            } else {
                // Múltiplos itens - agrupar em um tipo
                const baseName = items[0].name.split(/[-–—]/)[0].trim();
                
                // Criar o tipo principal baseado no primeiro item
                const mainType = {
                    ...items[0],
                    name: baseName,
                    description: `Salgados do tipo ${baseName}`,
                    isMainType: true,
                    flavors: items.map(item => ({
                        name: item.name.includes('-') ? item.name.split('-')[1].trim() : item.name,
                        description: item.description,
                        price: item.price,
                        available: item.available !== false
                    }))
                };

                // Inserir o novo tipo
                const insertResult = await collection.insertOne(mainType);
                
                // Remover os itens antigos
                const idsToRemove = items.map(item => item._id);
                await collection.deleteMany({ _id: { $in: idsToRemove } });

                migratedCount += items.length;
                results.push({
                    action: 'grouped_into_type',
                    original: items.map(i => i.name),
                    newType: baseName,
                    flavors: items.length
                });
            }
        }

        return NextResponse.json({
            success: true,
            message: `Migração concluída! ${migratedCount} itens migrados para ${Object.keys(groupedItems).length} tipos.`,
            migrated: migratedCount,
            results
        });

    } catch (error) {
        console.error('Erro na migração:', error);
        return NextResponse.json(
            { 
                success: false, 
                message: 'Erro durante a migração',
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            },
            { status: 500 }
        );
    }
}

// GET para verificar o que seria migrado (dry run)
export async function GET() {
    try {
        const { db } = await connectToDatabase();
        const collection = db.collection('menu');

        // Buscar todos os itens que NÃO são tipos principais
        const itemsToMigrate = await collection.find({
            $or: [
                { isMainType: { $exists: false } },
                { isMainType: false }
            ]
        }).toArray();

        // Agrupar itens por categoria e nome similar para preview
        const groupedItems: { [key: string]: any[] } = {};

        for (const item of itemsToMigrate) {
            const baseName = item.name.split(/[-–—]/)[0].trim();
            const categoryKey = `${item.category}_${baseName.toLowerCase()}`;
            
            if (!groupedItems[categoryKey]) {
                groupedItems[categoryKey] = [];
            }
            groupedItems[categoryKey].push({
                _id: item._id,
                name: item.name,
                price: item.price,
                category: item.category
            });
        }

        const preview = Object.entries(groupedItems).map(([groupKey, items]) => {
            const baseName = items[0].name.split(/[-–—]/)[0].trim();
            return {
                newTypeName: baseName,
                category: items[0].category,
                itemsToGroup: items,
                flavorsCount: items.length
            };
        });

        return NextResponse.json({
            success: true,
            totalItemsToMigrate: itemsToMigrate.length,
            typesToCreate: preview.length,
            preview
        });

    } catch (error) {
        console.error('Erro ao visualizar migração:', error);
        return NextResponse.json(
            { 
                success: false, 
                message: 'Erro ao visualizar migração',
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            },
            { status: 500 }
        );
    }
}
