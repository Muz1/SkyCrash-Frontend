import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/sky/Shell";
import { NeonPanel } from "@/components/sky/ui";
import { useGame } from "@/lib/game-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Pilot Profile — Sky Crash" },
      { name: "description", content: "Your Sky Crash pilot stats, level and arcade achievements." },
      { property: "og:title", content: "Pilot Profile — Sky Crash" },
      { property: "og:description", content: "Your Sky Crash pilot stats and achievements." },
    ],
  }),
  component: ProfilePage,
});

const achievements = [
  { name: "First Flight", d: "Completed your first flight.", got: true },
  { name: "Into Orbit", d: "Reached an impressive altitude.", got: true },
  { name: "Spacewalk", d: "Reached the space environment.", got: false },
  { name: "High Roller", d: "Large successful cash-out.", got: true },
  { name: "Sky Legend", d: "Elite pilot achievement.", got: false },
];

function ProfilePage() {
  const { pilot, flights } = useGame();
  const wins = flights.filter((f) => f.status === "CASHED OUT").length;
  const best = flights.reduce((m, f) => Math.max(m, f.multiplier), 0);
  const biggest = flights.reduce((m, f) => Math.max(m, f.result), 0);

  const stats = [
    { label: "Total Flights", value: flights.length.toString() },
    { label: "Win Rate", value: `${Math.round((wins / Math.max(flights.length, 1)) * 100)}%` },
    { label: "Highest Multiplier", value: `${best.toFixed(2)}x` },
    { label: "Biggest Cash-Out", value: biggest.toLocaleString() },
  ];

  return (
    <Shell skin="deep-space" dim={0.5}>
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="text-center font-display text-2xl font-black uppercase tracking-[0.2em] text-magenta text-glow-magenta sm:text-3xl">
          Pilot Profile
        </h1>

        <NeonPanel className="mt-6" accent="magenta">
          <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4">
            <div className="grid h-16 w-16 shrink-0 place-items-center border-2 border-electric bg-void/70 clip-hud font-arcade text-lg text-electric text-glow-blue">
              {pilot.slice(0, 2)}
            </div>
            <div className="min-w-0">
              <p className="truncate font-display text-xl font-black uppercase tracking-[0.18em] text-foreground">
                {pilot}
              </p>
              <p className="font-arcade text-[8px] uppercase tracking-[0.3em] text-ember">
                Level 27 · 6,250 / 10,000 XP
              </p>
              <div className="mt-2 h-2 w-full max-w-xs border border-violet/60 clip-hud">
                <div className="h-full w-[62%] bg-[image:var(--grad-sunset)]" />
              </div>
            </div>
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="clip-hud border border-violet/40 bg-void/50 p-3">
                <dt className="font-arcade text-[7px] uppercase tracking-[0.24em] text-muted-foreground">
                  {s.label}
                </dt>
                <dd className="mt-1 font-arcade text-sm text-electric text-glow-blue">{s.value}</dd>
              </div>
            ))}
          </dl>
        </NeonPanel>

        <NeonPanel className="mt-5" title="Achievements" accent="lime">
          <ul className="grid gap-3 sm:grid-cols-2">
            {achievements.map((a) => (
              <li
                key={a.name}
                className={cn(
                  "clip-hud grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 border-2 p-3",
                  a.got
                    ? "border-lime/70 bg-void/60 [box-shadow:0_0_14px_color-mix(in_oklab,var(--neon-lime)_35%,transparent)]"
                    : "border-violet/30 bg-void/40 opacity-55",
                )}
              >
                <span
                  className={cn(
                    "grid h-9 w-9 shrink-0 place-items-center rounded-full font-arcade text-[8px]",
                    a.got ? "bg-lime text-void" : "bg-muted text-muted-foreground",
                  )}
                  aria-hidden
                >
                  ★
                </span>
                <div className="min-w-0">
                  <p className="truncate font-display text-xs font-black uppercase tracking-[0.16em] text-foreground">
                    {a.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{a.d}</p>
                </div>
              </li>
            ))}
          </ul>
        </NeonPanel>
      </div>
    </Shell>
  );
}
