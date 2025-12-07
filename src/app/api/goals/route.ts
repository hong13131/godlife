import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/supabase";

async function ensureUser(authUserId: string, email?: string, name?: string) {
  const existing = await prisma.user.findUnique({
    where: { authUserId },
  });
  if (existing) return existing;

  return prisma.user.create({
    data: {
      authUserId,
      email: email ?? "",
      name,
    },
  });
}

export async function GET(req: Request) {
  const { user } = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const monthParam = url.searchParams.get("month"); // YYYY-MM
  const monthStart = monthParam
    ? new Date(`${monthParam}-01T00:00:00.000Z`)
    : new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const me = await ensureUser(user.id, user.email, user.user_metadata?.full_name);

  const goals = await prisma.goal.findMany({
    where: { userId: me.id, month: monthStart },
    include: { checks: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(goals);
}

export async function POST(req: Request) {
  const { user } = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    title,
    targetCount,
    unit,
    category,
    notes,
    month,
    startDate,
    endDate,
  } = body;

  if (!title || !targetCount || !unit) {
    return NextResponse.json(
      { error: "title, targetCount, unit are required" },
      { status: 400 },
    );
  }

  const monthStart = month
    ? new Date(`${month}-01T00:00:00.000Z`)
    : new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const me = await ensureUser(user.id, user.email, user.user_metadata?.full_name);

  const goal = await prisma.goal.create({
    data: {
      title,
      targetCount: Number(targetCount),
      unit,
      category,
      notes,
      month: monthStart,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      userId: me.id,
      teamId: me.teamId,
    },
  });

  return NextResponse.json(goal, { status: 201 });
}
