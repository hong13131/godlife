import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/supabase";

function formatKstDate(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date);
}

type MemberSummary = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  completion: number;
  goals: number;
  goalsDetail: {
    id: string;
    title: string;
    targetCount: number;
    unit: string;
    progress: number;
    checks: number;
  }[];
  recentChecks: { date: string; goalTitle: string }[];
};

export async function GET(req: Request) {
  const { user } = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const me = await prisma.user.findUnique({
    where: { authUserId: user.id },
    select: { id: true, teamId: true, role: true },
  });

  if (!me?.teamId) {
    return NextResponse.json({ error: "No team joined" }, { status: 400 });
  }

  const team = await prisma.team.findUnique({
    where: { id: me.teamId },
    include: {
      users: {
        include: {
          goals: { include: { checks: true } },
        },
      },
    },
  });

  if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });

  const members: MemberSummary[] = team.users.map((u) => {
    const totalTarget = u.goals.reduce((sum, g) => sum + (g.targetCount || 0), 0);
    const totalDone = u.goals.reduce(
      (sum, g) => sum + g.checks.reduce((s, c) => s + c.value, 0),
      0,
    );
    const completion =
      totalTarget > 0 ? Math.min(100, Math.round((totalDone / totalTarget) * 100)) : 0;

    const recentChecks = u.goals
      .flatMap((g) =>
        g.checks.map((c) => ({ date: formatKstDate(c.date), goalTitle: g.title })),
      )
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .slice(0, 3);

    const goalsDetail = u.goals.map((g) => {
      const done = g.checks.reduce((s, c) => s + c.value, 0);
      const prog =
        g.targetCount > 0 ? Math.min(100, Math.round((done / g.targetCount) * 100)) : 0;
      return {
        id: g.id,
        title: g.title,
        targetCount: g.targetCount,
        unit: g.unit,
        progress: prog,
        checks: done,
      };
    });

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      completion,
      goals: u.goals.length,
      goalsDetail,
      recentChecks,
    };
  });

  const response: {
    team: { id: string; name: string; inviteCode?: string };
    members: MemberSummary[];
    meRole: string;
  } = {
    team: {
      id: team.id,
      name: team.name,
      inviteCode: me.role === "ADMIN" ? team.inviteCode : undefined,
    },
    members,
    meRole: me.role,
  };

  return NextResponse.json(response);
}
