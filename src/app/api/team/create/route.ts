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

  const body = await req.json();
  const name = body.name as string | undefined;
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  const inviteCode = generateInviteCode();

  // 현재 사용자 조회
  const existing = await prisma.user.findUnique({
    where: { authUserId: user.id },
    select: { id: true, teamId: true },
  });

  // 이미 팀이 있다면 새 팀을 만들지 않음
  if (existing?.teamId) {
    return NextResponse.json({ error: "Already in a team" }, { status: 400 });
  }

  // 팀 생성 + 사용자 ADMIN 지정
  const team = await prisma.team.create({
    data: {
      name,
      inviteCode,
      users: existing
        ? undefined
        : {
            create: {
              authUserId: user.id,
              email: user.email ?? "",
              name: user.user_metadata?.full_name ?? user.email ?? "사용자",
              role: "ADMIN",
            },
          },
    },
    select: { id: true, name: true, inviteCode: true },
  });

  // 기존 사용자라면 팀 배정 + ADMIN 승격
  if (existing) {
    await prisma.user.update({
      where: { authUserId: user.id },
      data: { teamId: team.id, role: "ADMIN" },
    });
  }

  return NextResponse.json({ team });
}
