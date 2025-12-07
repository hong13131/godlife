import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/supabase";

async function ensureUser(authUserId: string) {
  return prisma.user.findUnique({
    where: { authUserId },
    select: { id: true, teamId: true },
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const { user } = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const me = await ensureUser(user.id);
  if (!me) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const body = await req.json();
  const { title, targetCount, unit, category, notes, status, startDate, endDate } =
    body;

  const goal = await prisma.goal.findFirst({
    where: { id: params.id, userId: me.id },
  });
  if (!goal) {
    return NextResponse.json({ error: "Goal not found" }, { status: 404 });
  }

  const updated = await prisma.goal.update({
    where: { id: params.id },
    data: {
      title,
      targetCount: targetCount !== undefined ? Number(targetCount) : undefined,
      unit,
      category,
      notes,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } },
) {
  const { user } = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const me = await ensureUser(user.id);
  if (!me) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await prisma.goal.deleteMany({
    where: { id: params.id, userId: me.id },
  });

  return NextResponse.json({ ok: true });
}
