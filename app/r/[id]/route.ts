import { NextRequest, NextResponse } from 'next/server';
import { resolveRedirect } from '@/lib/data';

// Next.js 16: params é assíncrono.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = await resolveRedirect(id);
  if (!url) return new NextResponse('Link não encontrado', { status: 404 });
  return NextResponse.redirect(url, 302);
}
