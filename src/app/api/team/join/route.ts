import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/supabase";

export async function POST(req: Request) {
  const { user } = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const inviteCode = body.inviteCode as string | undefined;
  if (!inviteCode) {
    return NextResponse.json({ error: "inviteCode is required" }, { status: 400 });
  }

  const team = await prisma.team.findUnique({ where: { inviteCode } });
  if (!team) {
    return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
  }

  const existingUser = await prisma.user.findUnique({
    where: { authUserId: user.id },
    select: { id: true, teamId: true },
  });

  if (!existingUser) {
    // 새 사용자라면 팀에 가입시킴
    const created = await prisma.user.create({
      data: {
        authUserId: user.id,
        email: user.email ?? "",
        name: user.user_metadata?.full_name ?? user.email ?? "사용자",
        role: "MEMBER",
        teamId: team.id,
      },
      select: { id: true, teamId: true },
    });
    return NextResponse.json({ ok: true, teamId: created.teamId });
  }

  // 이미 팀이 있으면 교체하거나 그대로 유지 (여기서는 초대 코드 우선으로 교체)
  const updated = await prisma.user.update({
    where: { authUserId: user.id },
    data: { teamId: team.id, role: "MEMBER" },
    select: { id: true, teamId: true },
  });

  return NextResponse.json({ ok: true, teamId: updated.teamId });
}
