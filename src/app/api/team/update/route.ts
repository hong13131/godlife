import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/supabase";

export async function PATCH(req: Request) {
  const { user } = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const name = body.name as string | undefined;
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  const me = await prisma.user.findUnique({
    where: { authUserId: user.id },
    select: { id: true, role: true, teamId: true },
  });
  if (!me?.teamId) return NextResponse.json({ error: "No team joined" }, { status: 400 });
  if (me.role !== "ADMIN")
    return NextResponse.json({ error: "Only admin can rename team" }, { status: 403 });

  const updated = await prisma.team.update({
    where: { id: me.teamId },
    data: { name },
    select: { id: true, name: true },
  });

  return NextResponse.json({ team: updated });
}
