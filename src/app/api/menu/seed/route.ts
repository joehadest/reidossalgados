import { NextResponse } from 'next/server';

export async function POST() {
    return NextResponse.json(
        { 
            success: false, 
            message: 'Operação de seed desabilitada temporariamente - usando dados estáticos do arquivo menu.ts' 
        },
        { status: 405 }
    );
} 