import {
  ArrowRight,
  Bell,
  CalendarRange,
  CheckCircle2,
  Flame,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";

const goals = [
  {
    title: "헬스 10회",
    progress: 7,
    target: 10,
    streak: 5,
    tone: "from-emerald-500/80 to-teal-400/70",
  },
  {
    title: "독서 2권",
    progress: 1,
    target: 2,
    streak: 8,
    tone: "from-indigo-500/80 to-sky-400/70",
  },
  {
    title: "러닝 40km",
    progress: 28,
    target: 40,
    streak: 3,
    tone: "from-amber-500/80 to-orange-400/70",
  },
];

const team = [
  { name: "민지", completion: 82, note: "체크 3건 남음" },
  { name: "현우", completion: 64, note: "연속 12일 달성" },
  { name: "지훈", completion: 92, note: "이번 주 만점" },
  { name: "소연", completion: 58, note: "주말 몰아치기" },
];

const features = [
  {
    icon: CalendarRange,
    title: "월 목표 + 캘린더",
    desc: "월별 목표 설정, 날짜별 체크, 모바일에서도 한 손 터치.",
  },
  {
    icon: Flame,
    title: "스트릭 & 진행률",
    desc: "목표별 진행률과 연속 달성 스트릭을 카드로 즉시 확인.",
  },
  {
    icon: Users,
    title: "공유 대시보드",
    desc: "팀 카드에서 친구별 달성률과 최근 활동을 한눈에.",
  },
  {
    icon: Bell,
    title: "알림",
    desc: "데일리 리마인더, 미완 항목 푸시/메일 알림 옵션.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 pb-20 pt-12 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-emerald-100 ring-1 ring-white/15 backdrop-blur">
            <Sparkles className="h-4 w-4" />
            모바일 우선 · 친구 10명 팀을 위한 갓생 트래커
          </div>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
                월 목표를 세우고, 캘린더로 체크하고, 팀과 공유하세요.
              </h1>
              <p className="max-w-2xl text-base text-slate-300 sm:text-lg">
                헬스 10회, 독서 2권처럼 월별 목표를 만들고 모바일에서도 바로
                체크. 개인 대시보드와 팀 공유 보드로 달성률, 스트릭, 리마인더를
                한 곳에서 관리합니다.
              </p>
            </div>
            <button className="inline-flex items-center justify-center gap-2 self-start rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-500/30 transition hover:translate-y-[-1px] hover:shadow-emerald-400/40 sm:text-base">
              바로 시작하기
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-emerald-500/10 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-300">이번 달 진행률</p>
                <p className="text-3xl font-semibold">74%</p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-400/90 px-3 py-1 text-xs font-semibold text-emerald-950">
                <Trophy className="h-4 w-4" />
                연속 8일 유지 중
              </div>
            </div>
            <div className="mt-6 grid gap-3">
              {goals.map((goal) => {
                const pct = Math.min(
                  100,
                  Math.round((goal.progress / goal.target) * 100),
                );
                return (
                  <div
                    key={goal.title}
                    className="overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm text-slate-300">월 목표</p>
                        <p className="text-base font-semibold">{goal.title}</p>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-emerald-200">
                        <Flame className="h-4 w-4" />
                        스트릭 {goal.streak}일
                      </div>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${goal.tone}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-300">
                      <span>
                        {goal.progress} / {goal.target}
                      </span>
                      <span>{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-5 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="flex items-center gap-3 text-sm text-slate-200">
                <Bell className="h-4 w-4" />
                저녁 9시에 리마인더 발송 · 미완 3건
              </div>
              <button className="text-xs font-semibold text-emerald-200 underline-offset-4 hover:underline">
                시간 변경
              </button>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-blue-500/10 backdrop-blur">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-300">공유 대시보드</p>
                  <h2 className="text-xl font-semibold">친구별 달성률</h2>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-100">
                  <Users className="h-4 w-4" />
                  10명 팀
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {team.map((member) => (
                  <div
                    key={member.name}
                    className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold">{member.name}</p>
                      <span className="text-xs text-slate-300">
                        {member.completion}%
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-sky-300"
                        style={{ width: `${member.completion}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-300">{member.note}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-dashed border-white/15 bg-white/5 px-4 py-3 text-sm text-slate-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                캘린더에서 하루에 여러 목표를 한 번에 체크할 수 있도록 모바일
                전용 퀵 액션 제공.
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-xl shadow-emerald-500/10">
              <div className="flex items-center gap-3">
                <CalendarRange className="h-5 w-5 text-emerald-300" />
                <div>
                  <p className="text-sm font-semibold">모바일 최적화</p>
                  <p className="text-xs text-slate-300">
                    하단 고정 CTA, 큰 터치 타겟, 저조도 대비 컬러
                  </p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-200 sm:grid-cols-3">
                <div className="rounded-lg bg-white/5 px-3 py-2">
                  <p className="font-semibold">오프라인</p>
                  <p className="text-xs text-slate-300">
                    React Query 캐시·PWA(선택)로 재방문 속도 향상
                  </p>
                </div>
                <div className="rounded-lg bg-white/5 px-3 py-2">
                  <p className="font-semibold">알림</p>
                  <p className="text-xs text-slate-300">
                    브라우저 푸시 + 이메일 백업
                  </p>
                </div>
                <div className="rounded-lg bg-white/5 px-3 py-2">
                  <p className="font-semibold">보안</p>
                  <p className="text-xs text-slate-300">
                    JWT 만료 1h · Refresh 7d · 팀 단위 접근 제어
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur sm:grid-cols-2">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
            >
              <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-emerald-200">
                <feature.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-50">
                  {feature.title}
                </p>
                <p className="text-xs text-slate-300">{feature.desc}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-slate-200 backdrop-blur">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-300" />
              <div>
                <p className="font-semibold text-slate-50">다음 단계</p>
                <p className="text-xs text-slate-300">
                  Supabase 연결 · Prisma 스키마 작성 · 알림 구독 UI 추가
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                Vercel + Supabase
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-indigo-100">
                모바일 퍼스트
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-amber-100">
                공유 대시보드
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
