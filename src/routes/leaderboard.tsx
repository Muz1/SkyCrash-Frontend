import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/sky/Shell";
import { NeonPanel } from "@/components/sky/ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Sky Crash Leaderboard — Top Pilots" },
      { name: "description", content: "The highest scoring pilots in the Sky Crash arcade." },
      { property: "og:title", content: "Sky Crash Leaderboard — Top Pilots" },
      { property: "og:description", content: "See the highest scoring Sky Crash pilots." },
    ],
  }),
  component: LeaderboardPage,
});

const TABS = ["Today", "Week", "Month", "All Time"] as const;

const rows = [
  { rank: 1, name: "NOVA", score: 128450 },
  { rank: 2, name: "ACE", score: 104200 },
  { rank: 3, name: "SKYKING", score: 98500 },
  { rank: 4, name: "ORBIT", score: 76320 },
  { rank: 5, name: "JETFIRE", score: 64180 },
  { rank: 6, name: "VAPOR", score: 51900 },
  { rank: 7, name: "COMET", score: 44210 },
];

function LeaderboardPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Today");

  return (
    <Shell skin="cloud-city" dim={0.6}>
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="text-center font-display text-2xl font-black uppercase tracking-[0.2em] text-ember text-glow-ember sm:text-3xl">
          Sky Crash Leaderboard
        </h1>

        <div className="mt-5 flex justify-center gap-2">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "clip-hud border-2 px-3 py-1.5 font-arcade text-[8px] uppercase transition-all",
                tab === t
                  ? "border-magenta text-magenta [box-shadow:var(--glow-magenta)]"
                  : "border-violet/50 text-muted-foreground hover:border-electric hover:text-electric",
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <NeonPanel className="mt-6" accent="ember">
          <ul className="space-y-2">
            {rows.map((r) => (
              <li
                key={r.rank}
                className="clip-hud grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border border-violet/40 bg-void/50 px-3 py-2.5"
              >
                <span
                  className={cn(
                    "font-arcade text-[10px]",
                    r.rank === 1
                      ? "text-ember text-glow-ember"
                      : r.rank <= 3
                        ? "text-magenta"
                        : "text-muted-foreground",
                  )}
                >
                  #{r.rank}
                </span>
                <span className="truncate font-display text-sm font-black uppercase tracking-[0.18em] text-foreground">
                  {r.name}
                </span>
                <span className="font-arcade text-[10px] text-electric text-glow-blue">
                  {r.score.toLocaleString()}
                </span>
              </li>
            ))}

            <li className="clip-hud mt-4 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-2 border-lime bg-void/70 px-3 py-3 [box-shadow:var(--glow-lime)]">
              <span className="font-arcade text-[10px] text-lime">#27</span>
              <span className="truncate font-display text-sm font-black uppercase tracking-[0.18em] text-lime">
                You
              </span>
              <span className="font-arcade text-[10px] text-lime">12,450</span>
            </li>
          </ul>
        </NeonPanel>
      </div>
    </Shell>
  );
}
