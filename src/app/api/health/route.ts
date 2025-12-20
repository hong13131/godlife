import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  // Supabase free-tier auto pause를 늦추기 위한 최소 쿼리(활동)용 엔드포인트
  await prisma.$queryRaw`SELECT 1`;
  return NextResponse.json({ ok: true, ts: new Date().toISOString() });
}
