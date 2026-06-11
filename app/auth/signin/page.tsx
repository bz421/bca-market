'use client';

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { BarChart3, TrendingUp, Wallet, Zap } from "lucide-react";

const features = [
  { icon: TrendingUp, title: "Trade outcomes", desc: "Buy and sell shares on any event you could imagine" },
  { icon: Wallet, title: "Track portfolio", desc: "Watch positions and P&L in real time" },
  { icon: Zap, title: "Live prices", desc: "Market odds update as people trade" },
];

const preview = [
  { title: "Will the auditorium open before September?", yes: 12 },
  { title: "BCA wins the robotics regionals?", yes: 58 },
  { title: "Dr. Abramson out tomorrow?", yes: 34 },
];

export default function SignIn() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) router.push("/");
  }, [session, router]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-zinc-50">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 right-0 h-[28rem] w-[28rem] rounded-full bg-sky-100/70 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-emerald-100/50 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center gap-16 px-6 py-16 lg:flex-row lg:gap-20">
        <div className="max-w-xl flex-1">

          <h1 className="mt-6 text-5xl font-bold tracking-tight text-zinc-950 sm:text-6xl">
            BCA Market
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-zinc-600">
            Put your instincts to the test. Trade shares on real school events and see where the community stands before outcomes are decided.
          </p>

          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="cursor-pointer mt-10 flex w-full items-center justify-center gap-3 rounded-xl bg-zinc-950 px-8 py-3.5 text-[15px] font-medium text-white shadow-lg shadow-zinc-900/10 transition hover:bg-zinc-800 sm:w-auto"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>

          <div className="mt-14 grid gap-4 sm:grid-cols-3">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200/80">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                  <Icon className="h-4 w-4" />
                </div>
                <p className="mt-3 text-sm font-semibold text-zinc-900">{title}</p>
                <p className="mt-1 text-xs leading-relaxed text-zinc-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative w-full max-w-sm flex-1 lg:max-w-md">
          <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-sky-100/80 to-emerald-50/80 blur-sm" />
          <div className="relative space-y-4">
            {preview.map((m, i) => (
              <article
                key={m.title}
                className={`rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm ${i === 1 ? "scale-[1.02] shadow-md ring-2 ring-sky-100" : i === 0 ? "opacity-60" : "opacity-40"}`}
                style={{ transform: i === 0 ? "translateY(8px) scale(0.96)" : i === 2 ? "translateY(-8px) scale(0.94)" : undefined }}
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-sm font-bold leading-snug text-zinc-950">{m.title}</h2>
                  <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">Open</span>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-zinc-700">Yes</span>
                    <span className="font-mono font-semibold text-sky-700">{m.yes}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                    <div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-sky-600" style={{ width: `${m.yes}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-zinc-700">No</span>
                    <span className="font-mono font-semibold text-zinc-500">{100 - m.yes}%</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
