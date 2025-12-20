"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { useSession } from "@/hooks/useSession";
import {
  CheckCircle2,
  Loader2,
  LogOut,
  PencilLine,
  Plus,
  Trash2,
  X,
  Users,
} from "lucide-react";

type Goal = {
  id: string;
  title: string;
  targetCount: number;
  unit: string;
  category?: string | null;
  notes?: string | null;
  month: string;
  checks: { id: string; date: string; value: number }[];
};

function formatMonth(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatKstDate(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date);
}

function toDateKey(input: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
  return formatKstDate(new Date(input));
}

function isSameDay(a: string, b: string) {
  return toDateKey(a) === toDateKey(b);
}

function daysInMonth(monthStr: string) {
  const [year, month] = monthStr.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, 1));
  const result: string[] = [];
  while (start.getUTCMonth() === month - 1) {
    result.push(start.toISOString().slice(0, 10));
    start.setUTCDate(start.getUTCDate() + 1);
  }
  return result;
}

export default function DashboardPage() {
  const { user, loading, signOut } = useSession();
  const supabase = useMemo(() => supabaseBrowser(), []);

  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [goals, setGoals] = useState<Goal[]>([]);
  const [month, setMonth] = useState(formatMonth(new Date()));
  const [form, setForm] = useState({
    title: "",
    targetCount: "10",
    unit: "회",
    category: "운동",
  });
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    targetCount: "10",
    unit: "회",
    category: "",
  });
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [today, setToday] = useState(() => formatKstDate(new Date()));

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

  async function loadGoals(selectedMonth = month) {
    try {
      const res = await fetchWithAuth(`/api/goals?month=${selectedMonth}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setGoals(data);
      if (!selectedGoalId && data.length > 0) {
        setSelectedGoalId(data[0].id);
      }
    } catch (err) {
      console.error(err);
      setMessage("목표를 불러오지 못했습니다.");
    }
  }

  async function handleAuth() {
    setBusy(true);
    setMessage(null);
    if (authMode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage(error.message);
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setMessage(error.message);
      else setMessage("가입 완료! 이메일을 확인해주세요.");
    }
    setBusy(false);
  }

  async function handleCreateGoal() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetchWithAuth("/api/goals", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          targetCount: Number(form.targetCount),
          month,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setForm((prev) => ({ ...prev, title: "" }));
      await loadGoals();
    } catch (err) {
      console.error(err);
      setMessage("목표 생성에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function handleUpdateGoal() {
    if (!editId) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetchWithAuth(`/api/goals/${editId}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: editForm.title,
          targetCount: Number(editForm.targetCount),
          unit: editForm.unit,
          category: editForm.category,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setEditId(null);
      await loadGoals();
    } catch (err) {
      console.error(err);
      setMessage("목표 수정에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteGoal(id: string) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetchWithAuth(`/api/goals/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      await loadGoals();
    } catch (err) {
      console.error(err);
      setMessage("목표 삭제에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleCheck(goalId: string) {
    setBusy(true);
    setMessage(null);
    const goal = goals.find((g) => g.id === goalId);
    const hasToday = goal?.checks.some((c) => isSameDay(c.date, today));
    try {
      if (hasToday) {
        const res = await fetchWithAuth(
          `/api/checks?goalId=${goalId}&date=${today}`,
          { method: "DELETE" },
        );
        if (!res.ok) throw new Error(await res.text());
      } else {
        const res = await fetchWithAuth("/api/checks", {
          method: "POST",
          body: JSON.stringify({ goalId, date: today }),
        });
        if (!res.ok) throw new Error(await res.text());
      }
      await loadGoals();
    } catch (err) {
      console.error(err);
      setMessage("체크 처리에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function setCheckForDate(goalId: string, date: string, checked: boolean) {
    setBusy(true);
    setMessage(null);
    try {
      if (checked) {
        const res = await fetchWithAuth("/api/checks", {
          method: "POST",
          body: JSON.stringify({ goalId, date }),
        });
        if (!res.ok) throw new Error(await res.text());
      } else {
        const res = await fetchWithAuth(
          `/api/checks?goalId=${goalId}&date=${date}`,
          { method: "DELETE" },
        );
        if (!res.ok) throw new Error(await res.text());
      }
      await loadGoals();
    } catch (err) {
      console.error(err);
      setMessage("체크 처리에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  function countByDate(goal: Goal, date: string) {
    return goal.checks
      .filter((c) => isSameDay(c.date, date))
      .reduce((sum, c) => sum + c.value, 0);
  }

  async function incrementToday(goalId: string, delta: number) {
    setBusy(true);
    setMessage(null);
    try {
      if (delta > 0) {
        const res = await fetchWithAuth("/api/checks", {
          method: "POST",
          body: JSON.stringify({ goalId, date: today, value: delta }),
        });
        if (!res.ok) throw new Error(await res.text());
      } else {
        const res = await fetchWithAuth(
          `/api/checks?goalId=${goalId}&date=${today}`,
          { method: "DELETE" },
        );
        if (!res.ok) throw new Error(await res.text());
      }
      await loadGoals();
    } catch (err) {
      console.error(err);
      setMessage("체크 처리에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (user) {
      loadGoals();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    const interval = setInterval(() => {
      setToday(formatKstDate(new Date()));
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  const selectedGoal = goals.find((g) => g.id === selectedGoalId) || null;
  const calendarDays = daysInMonth(month);

  const goalCounts: Record<string, number> = goals.reduce((acc, g) => {
    acc[g.id] = g.checks.reduce((sum, c) => sum + c.value, 0);
    return acc;
  }, {} as Record<string, number>);

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
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50">
        <div className="mx-auto flex max-w-md flex-col gap-6 px-5 py-16">
          <div className="space-y-2">
            <p className="text-sm text-emerald-200">Godlife · 갓생 트래커</p>
            <h1 className="text-3xl font-semibold">로그인 / 가입</h1>
            <p className="text-sm text-slate-300">
              이메일/비번으로 바로 시작하세요. 가입이면 메일 인증을 확인해 주세요.
            </p>
          </div>
          <div className="flex gap-2 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur">
            <button
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${authMode === "signin" ? "bg-emerald-400 text-emerald-950" : "bg-white/5 text-slate-200"}`}
              onClick={() => setAuthMode("signin")}
            >
              로그인
            </button>
            <button
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${authMode === "signup" ? "bg-emerald-400 text-emerald-950" : "bg-white/5 text-slate-200"}`}
              onClick={() => setAuthMode("signup")}
            >
              회원가입
            </button>
          </div>
          <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-5">
            <label className="space-y-1 text-sm text-slate-200">
              <span>이메일</span>
              <input
                className="w-full rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-white outline-none focus:border-emerald-300"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="you@example.com"
              />
            </label>
            <label className="space-y-1 text-sm text-slate-200">
              <span>비밀번호</span>
              <input
                className="w-full rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-white outline-none focus:border-emerald-300"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="8자 이상"
              />
            </label>
            {message && <p className="text-xs text-amber-200">{message}</p>}
            <button
              onClick={handleAuth}
              disabled={busy}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-500/30 transition hover:translate-y-[-1px]"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {authMode === "signin" ? "로그인" : "가입"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-5 py-10">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-emerald-200">Godlife · 갓생 트래커</p>
            <h1 className="text-2xl font-semibold">대시보드</h1>
            <p className="text-sm text-slate-300">
              월 목표를 만들고 오늘 체크를 토글하세요.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-200">
            <a
              href="/dashboard/shared"
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-50 hover:bg-white/15"
            >
              <Users className="h-4 w-4" />
              공유 대시보드
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

        <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 sm:grid-cols-2">
          <label className="space-y-1 text-sm text-slate-200">
            <span>월 선택 (YYYY-MM)</span>
            <input
              className="w-full rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-white outline-none focus:border-emerald-300"
              value={month}
              onChange={(e) => {
                setMonth(e.target.value);
                loadGoals(e.target.value);
              }}
            />
          </label>
          <div className="space-y-1 text-sm text-slate-200">
            <span>오늘 날짜</span>
            <p className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100">
              {today}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="mb-3 text-lg font-semibold">목표 추가</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-sm text-slate-200">
              <span>제목</span>
              <input
                className="w-full rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-white outline-none focus:border-emerald-300"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="헬스 10회"
              />
            </label>
            <label className="space-y-1 text-sm text-slate-200">
              <span>카테고리</span>
              <input
                className="w-full rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-white outline-none focus:border-emerald-300"
                value={form.category}
                onChange={(e) =>
                  setForm((p) => ({ ...p, category: e.target.value }))
                }
                placeholder="운동 / 독서"
              />
            </label>
            <label className="space-y-1 text-sm text-slate-200">
              <span>목표 횟수</span>
              <input
                className="w-full rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-white outline-none focus:border-emerald-300"
                value={form.targetCount}
                onChange={(e) =>
                  setForm((p) => ({ ...p, targetCount: e.target.value }))
                }
                type="number"
                min={1}
              />
            </label>
            <label className="space-y-1 text-sm text-slate-200">
              <span>단위</span>
              <input
                className="w-full rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-white outline-none focus:border-emerald-300"
                value={form.unit}
                onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))}
                placeholder="회 / 권 / km"
              />
            </label>
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            {message && <p className="text-xs text-amber-200">{message}</p>}
            <button
              onClick={handleCreateGoal}
              disabled={busy || !form.title}
              className="inline-flex items-center justify-center gap-2 self-end rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-500/30 transition hover:translate-y-[-1px]"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              목표 추가
            </button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {goals.map((goal) => {
            const done = goalCounts[goal.id] ?? 0;
            const pct = Math.min(100, Math.round((done / goal.targetCount) * 100));
            const hasToday = goal.checks.some((c) => isSameDay(c.date, today));
            return (
              <div
                key={goal.id}
                className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-slate-300">{goal.category ?? "목표"}</p>
                    <p className="text-base font-semibold">{goal.title}</p>
                    <p className="text-xs text-slate-400">
                      {done} / {goal.targetCount} {goal.unit} · {pct}%
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => toggleCheck(goal.id)}
                      disabled={busy}
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${hasToday ? "bg-emerald-400 text-emerald-950" : "bg-white/10 text-slate-200"} hover:translate-y-[-1px]`}
                    >
                      {hasToday ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                      {hasToday ? "오늘 완료" : "오늘 체크"}
                    </button>
                    <button
                      onClick={() => {
                        setEditId(goal.id);
                        setEditForm({
                          title: goal.title,
                          targetCount: String(goal.targetCount),
                          unit: goal.unit,
                          category: goal.category ?? "",
                        });
                      }}
                      disabled={busy}
                      className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200 hover:translate-y-[-1px]"
                    >
                      <PencilLine className="h-4 w-4" />
                      수정
                    </button>
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      disabled={busy}
                      className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-red-200 hover:translate-y-[-1px]"
                    >
                      <Trash2 className="h-4 w-4" />
                      삭제
                    </button>
                  </div>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-sky-400"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex flex-wrap gap-2 text-[11px] text-slate-300">
                  <span className="rounded-full bg-white/10 px-2 py-1">월 {month}</span>
                  <span className="rounded-full bg-white/10 px-2 py-1">체크 {done}회</span>
                </div>
              </div>
            );
          })}
        </div>

        {goals.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-4 text-sm text-slate-200">
            아직 목표가 없습니다. 목표를 추가해 보세요.
          </div>
        )}

        {goals.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-100">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs text-slate-300">캘린더 체크</p>
                <h3 className="text-lg font-semibold">월별 캘린더에서 체크/해제</h3>
                <p className="text-xs text-slate-400">
                  날짜를 누르면 해당 목표의 체크를 추가/삭제합니다. 오늘은 +1/-삭제 버튼도 지원.
                </p>
              </div>
              <select
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-emerald-300 sm:w-64"
                value={selectedGoalId ?? ""}
                onChange={(e) => setSelectedGoalId(e.target.value)}
              >
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
              {goals.map((g) => {
                const isActive = g.id === selectedGoalId;
                return (
                  <button
                    key={g.id}
                    onClick={() => setSelectedGoalId(g.id)}
                    className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold transition ${
                      isActive
                        ? "border-emerald-300 bg-emerald-400/20 text-emerald-100"
                        : "border-white/10 bg-white/5 text-slate-200 hover:border-white/20"
                    }`}
                  >
                    {g.title}
                  </button>
                );
              })}
            </div>

            {selectedGoal && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <span className="rounded-full bg-white/10 px-2 py-1">
                    {selectedGoal.category ?? "목표"}
                  </span>
                  <span className="rounded-full bg-white/10 px-2 py-1">
                    {selectedGoal.targetCount} {selectedGoal.unit}
                  </span>
                  <span className="rounded-full bg-white/10 px-2 py-1">
                    체크 {selectedGoal.checks.length}회
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    onClick={() => incrementToday(selectedGoal.id, 1)}
                    disabled={busy}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-400 px-3 py-2 text-xs font-semibold text-emerald-950 shadow-lg shadow-emerald-500/30 hover:translate-y-[-1px]"
                  >
                    +1 오늘 체크
                  </button>
                  <button
                    onClick={() => incrementToday(selectedGoal.id, -1)}
                    disabled={busy}
                    className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-slate-200 hover:translate-y-[-1px]"
                  >
                    오늘 체크 삭제
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-2 rounded-xl border border-white/10 bg-slate-900/70 p-3">
                  {calendarDays.map((d) => {
                    const count = countByDate(selectedGoal, d);
                    const has = count > 0;
                    return (
                      <button
                        key={d}
                        onClick={() => setCheckForDate(selectedGoal.id, d, !has)}
                        className={`flex h-14 flex-col items-center justify-center rounded-lg border text-xs font-semibold transition ${
                          has
                            ? "border-emerald-300 bg-emerald-400/20 text-emerald-100"
                            : "border-white/10 bg-white/5 text-slate-200 hover:border-white/20"
                        }`}
                      >
                        <span>{d.slice(-2)}</span>
                        {has ? (
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>{count}</span>
                          </span>
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {editId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-5 text-slate-50 shadow-xl">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-semibold">목표 수정</h3>
                <button
                  onClick={() => setEditId(null)}
                  className="rounded-full bg-white/10 p-1 text-slate-200 hover:bg-white/15"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-3">
                <label className="space-y-1 text-sm text-slate-200">
                  <span>제목</span>
                  <input
                    className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-emerald-300"
                    value={editForm.title}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, title: e.target.value }))
                    }
                  />
                </label>
                <label className="space-y-1 text-sm text-slate-200">
                  <span>카테고리</span>
                  <input
                    className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-emerald-300"
                    value={editForm.category}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, category: e.target.value }))
                    }
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1 text-sm text-slate-200">
                    <span>목표 횟수</span>
                    <input
                      className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-emerald-300"
                      value={editForm.targetCount}
                      onChange={(e) =>
                        setEditForm((p) => ({ ...p, targetCount: e.target.value }))
                      }
                      type="number"
                      min={1}
                    />
                  </label>
                  <label className="space-y-1 text-sm text-slate-200">
                    <span>단위</span>
                    <input
                      className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-emerald-300"
                      value={editForm.unit}
                      onChange={(e) =>
                        setEditForm((p) => ({ ...p, unit: e.target.value }))
                      }
                    />
                  </label>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-slate-300">
                {message && <span className="text-amber-200">{message}</span>}
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditId(null)}
                    className="rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/15"
                  >
                    닫기
                  </button>
                  <button
                    onClick={handleUpdateGoal}
                    disabled={busy}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-400 px-3 py-2 text-xs font-semibold text-emerald-950 shadow-lg shadow-emerald-500/30 hover:translate-y-[-1px]"
                  >
                    {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                    저장
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
