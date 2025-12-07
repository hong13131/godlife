import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/supabase";
import { randomBytes } from "crypto";

function generateInviteCode() {
  return randomBytes(4).toString("hex");
}

export async function POST(req: Request) {
  const { user } = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 관리자만 생성한다고 가정 (단순히 role 체크)
  const me = await prisma.user.findUnique({
    where: { authUserId: user.id },
    select: { id: true, role: true, teamId: true },
  });
  if (!me) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (me.role !== "ADMIN") {
    return NextResponse.json({ error: "Only admin can create invite" }, { status: 403 });
  }

  const teamId = me.teamId;
  if (!teamId) {
    return NextResponse.json({ error: "No team assigned" }, { status: 400 });
  }

  const code = generateInviteCode();
  const team = await prisma.team.update({
    where: { id: teamId },
    data: { inviteCode: code },
    select: { id: true, inviteCode: true },
  });

  return NextResponse.json(team);
}
