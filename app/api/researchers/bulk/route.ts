import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { ids, updates } = body as {
      ids: number[];
      updates: { stage?: string; contacted?: boolean };
    };

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ success: false, error: 'No IDs provided' }, { status: 400 });
    }

    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json({ success: false, error: 'No updates provided' }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (updates.stage !== undefined) data.stage = updates.stage;
    if (updates.contacted !== undefined) data.contacted = updates.contacted;

    const result = await prisma.researcher.updateMany({
      where: { id: { in: ids } },
      data,
    });

    return NextResponse.json({ success: true, updated: result.count });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
