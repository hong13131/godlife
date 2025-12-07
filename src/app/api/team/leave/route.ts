import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/supabase";

export async function POST(req: Request) {
  const { user } = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.user.findUnique({
    where: { authUserId: user.id },
    select: { id: true, teamId: true },
  });

  if (!existing?.teamId) {
    return NextResponse.json({ error: "No team joined" }, { status: 400 });
  }

  await prisma.user.update({
    where: { authUserId: user.id },
    data: { teamId: null, role: "MEMBER" },
  });

  return NextResponse.json({ ok: true });
}
