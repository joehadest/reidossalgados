import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

interface AggregatedDay { date: string; totalOrders: number; totalRevenue: number; avgTicket: number; }

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    const endDate = end ? new Date(end + 'T23:59:59.999Z') : new Date();
    const startDate = start ? new Date(start + 'T00:00:00.000Z') : new Date(endDate.getTime() - 6 * 24 * 60 * 60 * 1000);

    const { db } = await connectToDatabase();
    const collection = db.collection('pedidos');

    const pipeline: any[] = [
      { $match: { data: { $gte: startDate.toISOString(), $lte: endDate.toISOString() }, status: { $ne: 'cancelado' } } },
      { $addFields: { dataDate: { $substr: ['$data', 0, 10] } } },
      { $group: { _id: '$dataDate', totalOrders: { $sum: 1 }, totalRevenue: { $sum: '$total' } } },
      { $project: { _id: 0, date: '$_id', totalOrders: 1, totalRevenue: { $round: ['$totalRevenue', 2] }, avgTicket: { $cond: [ { $eq: ['$totalOrders', 0] }, 0, { $round: [ { $divide: ['$totalRevenue', '$totalOrders'] }, 2 ] } ] } } },
      { $sort: { date: 1 } }
    ];

    const results = await collection.aggregate(pipeline).toArray() as AggregatedDay[];

    const byDate: Record<string, AggregatedDay> = {};
    results.forEach((r: AggregatedDay) => { byDate[r.date] = r; });

    const filled: AggregatedDay[] = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0,10);
      if (byDate[key]) filled.push(byDate[key]); else filled.push({ date: key, totalOrders: 0, totalRevenue: 0, avgTicket: 0 });
    }

    const summary = filled.reduce((acc, day) => { acc.totalOrders += day.totalOrders; acc.totalRevenue += day.totalRevenue; return acc; }, { totalDays: filled.length, totalOrders: 0, totalRevenue: 0 } as { totalDays: number; totalOrders: number; totalRevenue: number; avgTicket?: number });
    summary.avgTicket = summary.totalOrders ? +(summary.totalRevenue / summary.totalOrders).toFixed(2) : 0;
    summary.totalRevenue = +summary.totalRevenue.toFixed(2);

    return NextResponse.json({ success: true, data: filled, summary });
  } catch (error) {
    console.error('Erro ao agregar ganhos:', error);
    return NextResponse.json({ success: false, message: 'Erro ao agregar ganhos' }, { status: 500 });
  }
}
