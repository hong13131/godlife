"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { useSession } from "@/hooks/useSession";
import { CheckCircle2, Loader2, LogOut, Shield, Users, Home } from "lucide-react";

type Member = {
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

export default function SharedDashboardPage() {
  const { user, loading, signOut } = useSession();
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [members, setMembers] = useState<Member[]>([]);
  const [teamName, setTeamName] = useState("");
  const [inviteCode, setInviteCode] = useState<string | undefined>(undefined);
  const [myRole, setMyRole] = useState<string>("");
  const [joinCode, setJoinCode] = useState("");
  const [newTeamName, setNewTeamName] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createName, setCreateName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function fetchWithAuth(input: RequestInfo, init: RequestInit = {}) {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    if (!token) throw new Error("로그인이 필요합니다.");
    return fetch(input, {
      ...init,
      headers: {
        ...init.headers,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
  }

  async function loadTeam() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetchWithAuth("/api/dashboard/team");
      if (!res.ok) {
        const text = await res.text();
        if (text.includes("No team joined")) {
          setError("아직 팀에 가입하지 않았습니다. 초대 코드로 가입하거나 팀을 생성하세요.");
          setMembers([]);
          setTeamName("");
          setInviteCode(undefined);
          setMyRole("");
          setShowCreateForm(true);
          return;
        }
        throw new Error(text);
      }
      const data = await res.json();
      setTeamName(data.team.name);
      setInviteCode(data.team.inviteCode);
      setMyRole(data.meRole);
      setMembers(data.members);
      setError(null);
      setShowCreateForm(false);
    } catch (err) {
      console.error(err);
      setError("팀 정보를 불러오지 못했습니다. 초대 코드로 팀에 먼저 가입하세요.");
    } finally {
      setBusy(false);
    }
  }

  async function joinTeam() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetchWithAuth("/api/team/join", {
        method: "POST",
        body: JSON.stringify({ inviteCode: joinCode }),
      });
      if (!res.ok) throw new Error(await res.text());
      await loadTeam();
      setJoinCode("");
    } catch (err) {
      console.error(err);
      setError("팀 가입에 실패했습니다. 초대 코드를 확인하세요.");
    } finally {
      setBusy(false);
    }
  }

  async function regenerateInvite() {
    setBusy(true);
    try {
      const res = await fetchWithAuth("/api/team/invite", { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setInviteCode(data.inviteCode);
    } catch (err) {
      console.error(err);
      setError("초대 코드 생성에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function renameTeam() {
    if (!newTeamName) return;
    setBusy(true);
    try {
      const res = await fetchWithAuth("/api/team/update", {
        method: "PATCH",
        body: JSON.stringify({ name: newTeamName }),
      });
      if (!res.ok) throw new Error(await res.text());
      setTeamName(newTeamName);
      setNewTeamName("");
    } catch (err) {
      console.error(err);
      setError("팀 이름 변경에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function leaveTeam() {
    setBusy(true);
    try {
      const res = await fetchWithAuth("/api/team/leave", { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      setMembers([]);
      setTeamName("");
      setInviteCode(undefined);
      setError("팀을 탈퇴했습니다. 초대 코드로 다시 가입하세요.");
    } catch (err) {
      console.error(err);
      setError("팀 탈퇴에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function createTeam() {
    if (!createName) {
      setError("팀 이름을 입력하세요.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetchWithAuth("/api/team/create", {
        method: "POST",
        body: JSON.stringify({ name: createName }),
      });
      if (!res.ok) throw new Error(await res.text());
      setCreateName("");
      await loadTeam();
    } catch (err) {
      console.error(err);
      setError("팀 생성에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (user) loadTeam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-50">
        <div className="flex items-center gap-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          로딩 중...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50">
        <div className="mx-auto flex max-w-md flex-col gap-3 px-5 py-16">
          <p className="text-lg font-semibold">로그인 후 이용해주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-5 py-10">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-emerald-200">Godlife · 공유 대시보드</p>
            <h1 className="text-2xl font-semibold">{teamName || "팀 없음"}</h1>
            <p className="text-sm text-slate-300">
              팀원별 진행률과 최근 활동을 확인하세요.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-200">
            <a
              href="/dashboard"
              className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-50 hover:bg-white/15"
            >
              <Home className="h-4 w-4" />
              개인 대시보드
            </a>
            <span>{user.email}</span>
            <button
              onClick={signOut}
              className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-50 hover:bg-white/15"
            >
              <LogOut className="h-4 w-4" />
              로그아웃
            </button>
          </div>
        </header>

        {error && (
          <div className="rounded-lg border border-amber-400/50 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-200">
              <Users className="h-4 w-4 text-emerald-300" />
              <span>팀원 {members.length}명</span>
            </div>
            <button
              onClick={loadTeam}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200 hover:bg-white/15"
            >
              {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              새로고침
            </button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4 text-xs text-slate-200">
              <p className="text-sm font-semibold text-slate-50">초대 코드로 팀 가입</p>
              <div className="mt-2 flex gap-2">
                <input
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-emerald-300"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="초대 코드 입력"
                />
                <button
                  onClick={joinTeam}
                  disabled={busy || !joinCode}
                  className="rounded-lg bg-emerald-400 px-3 py-2 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-500/30 hover:translate-y-[-1px]"
                >
                  가입
                </button>
              </div>
            </div>

            {showCreateForm && (
              <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4 text-xs text-slate-200">
                <p className="text-sm font-semibold text-slate-50">팀 생성</p>
                <div className="mt-2 flex gap-2">
                  <input
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-emerald-300"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder="팀 이름 입력"
                  />
                  <button
                    onClick={createTeam}
                    disabled={busy || !createName}
                    className="rounded-lg bg-emerald-400 px-3 py-2 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-500/30 hover:translate-y-[-1px]"
                  >
                    생성
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  팀을 만들면 내가 ADMIN으로 설정됩니다.
                </p>
              </div>
            )}

            {myRole === "ADMIN" && (
              <div className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 p-4 text-xs text-emerald-50">
                <p className="text-sm font-semibold text-emerald-100">팀 초대 코드</p>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    readOnly
                    className="w-full rounded-lg border border-emerald-400/60 bg-emerald-950/50 px-3 py-2 text-sm text-emerald-50"
                    value={inviteCode ?? "생성 후 표시됩니다"}
                  />
                  <button
                    onClick={regenerateInvite}
                    disabled={busy}
                    className="rounded-lg bg-emerald-400 px-3 py-2 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-500/30 hover:translate-y-[-1px]"
                  >
                    새 코드
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-emerald-100/80">
                  관리자만 생성/조회 가능합니다.
                </p>

                <div className="mt-3 space-y-2 text-emerald-50">
                  <p className="text-sm font-semibold">팀 이름 변경</p>
                  <div className="flex gap-2">
                    <input
                      className="w-full rounded-lg border border-emerald-400/60 bg-emerald-950/50 px-3 py-2 text-sm text-emerald-50"
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                      placeholder="새 팀 이름"
                    />
                    <button
                      onClick={renameTeam}
                      disabled={busy || !newTeamName}
                      className="rounded-lg bg-emerald-400 px-3 py-2 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-500/30 hover:translate-y-[-1px]"
                    >
                      변경
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <button
              onClick={loadTeam}
              disabled={busy}
              className="rounded-full bg-white/10 px-3 py-2 text-slate-200 hover:bg-white/15"
            >
              새로고침
            </button>
            <button
              onClick={leaveTeam}
              disabled={busy}
              className="rounded-full bg-white/10 px-3 py-2 text-red-200 hover:bg-white/15"
            >
              팀 탈퇴
            </button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {members.map((m) => (
              <div
                key={m.id}
                className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{m.name || m.email}</p>
                    <p className="text-xs text-slate-400">{m.email}</p>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-300">
                      <span className="rounded-full bg-white/10 px-2 py-1">
                        진행률 {m.completion}%
                      </span>
                      <span className="rounded-full bg-white/10 px-2 py-1">
                        목표 {m.goals}개
                      </span>
                      {m.role === "ADMIN" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/20 px-2 py-1 text-[11px] font-semibold text-emerald-100">
                          <Shield className="h-3.5 w-3.5" />
                          Admin
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-400/20 text-sm font-semibold text-emerald-100">
                    {m.completion}%
                  </div>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-sky-400"
                    style={{ width: `${m.completion}%` }}
                  />
                </div>

                <div className="space-y-2 text-xs text-slate-200">
                  <p className="text-[11px] text-slate-400">목표별 진행률</p>
                  {m.goalsDetail.length === 0 && (
                    <p className="text-slate-400">등록된 목표 없음</p>
                  )}
                  {m.goalsDetail.map((g) => (
                    <div
                      key={g.id}
                      className="space-y-1 rounded-lg bg-white/5 p-3"
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-200">
                        <span className="font-semibold text-slate-50">{g.title}</span>
                        <span className="text-slate-300">
                          {g.checks} / {g.targetCount} {g.unit} · {g.progress}%
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-sky-400"
                          style={{ width: `${g.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 text-xs text-slate-200">
                  <p className="text-[11px] text-slate-400">최근 체크</p>
                  {m.recentChecks.length === 0 && (
                    <p className="text-slate-400">기록 없음</p>
                  )}
                  {m.recentChecks.map((c, idx) => (
                    <div
                      key={`${c.goalTitle}-${c.date}-${idx}`}
                      className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                        <span className="text-slate-100">{c.goalTitle}</span>
                      </div>
                      <span className="text-slate-300">{c.date.slice(0, 10)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
