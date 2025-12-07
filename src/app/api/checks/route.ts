import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/supabase";

async function ensureUser(authUserId: string) {
  return prisma.user.findUnique({
    where: { authUserId },
    select: { id: true },
  });
}

export async function POST(req: Request) {
  const { user } = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const me = await ensureUser(user.id);
  if (!me) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const body = await req.json();
  const { goalId, date, value = 1 } = body;
  if (!goalId || !date) {
    return NextResponse.json(
      { error: "goalId and date are required" },
      { status: 400 },
    );
  }

  const goal = await prisma.goal.findFirst({
    where: { id: goalId, userId: me.id },
  });
  if (!goal) {
    return NextResponse.json({ error: "Goal not found" }, { status: 404 });
  }

  const checkDate = new Date(date);

  const upserted = await prisma.check.upsert({
    where: { goalId_date: { goalId, date: checkDate } },
    update: { value: Number(value) },
    create: { goalId, date: checkDate, value: Number(value) },
  });

  return NextResponse.json(upserted, { status: 201 });
}

export async function DELETE(req: Request) {
  const { user } = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const me = await ensureUser(user.id);
  if (!me) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const url = new URL(req.url);
  const goalId = url.searchParams.get("goalId");
  const date = url.searchParams.get("date");
  if (!goalId || !date) {
    return NextResponse.json(
      { error: "goalId and date query params are required" },
      { status: 400 },
    );
  }

  const goal = await prisma.goal.findFirst({
    where: { id: goalId, userId: me.id },
  });
  if (!goal) {
    return NextResponse.json({ error: "Goal not found" }, { status: 404 });
  }

  await prisma.check.deleteMany({
    where: { goalId, date: new Date(date) },
  });

  return NextResponse.json({ ok: true });
}
