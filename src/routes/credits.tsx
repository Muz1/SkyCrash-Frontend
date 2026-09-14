import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/sky/Shell";
import { ArcadeButton, NeonPanel } from "@/components/sky/ui";
import { gameStore, useGame } from "@/lib/game-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/credits")({
  head: () => ({
    meta: [
      { title: "Credits — Sky Crash Arcade Bank" },
      { name: "description", content: "Your Sky Crash credit balance and arcade top-up options." },
      { property: "og:title", content: "Credits — Sky Crash Arcade Bank" },
      { property: "og:description", content: "Your Sky Crash credit balance." },
    ],
  }),
  component: CreditsPage,
});

const packs = [
  { amount: 500, label: "Warm Up" },
  { amount: 2500, label: "Full Tank" },
  { amount: 10000, label: "Afterburner" },
];

function CreditsPage() {
  const { credits } = useGame();
  const [claimed, setClaimed] = useState<number | null>(null);

  return (
    <Shell skin="deep-space" dim={0.55}>
      <div className="mx-auto w-full max-w-2xl text-center">
        <h1 className="font-display text-2xl font-black uppercase tracking-[0.2em] text-ember text-glow-ember sm:text-3xl">
          Your Credits
        </h1>

        <NeonPanel className="mt-6" accent="ember">
          <p className="font-arcade text-4xl text-ember text-glow-ember sm:text-5xl">
            {credits.toLocaleString()}
          </p>
          <p className="mt-2 font-arcade text-[8px] uppercase tracking-[0.4em] text-muted-foreground">
            Arcade balance
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {packs.map((p) => (
              <button
                key={p.amount}
                onClick={() => {
                  gameStore.addCredits(p.amount);
                  setClaimed(p.amount);
                }}
                className={cn(
                  "clip-hud border-2 border-violet/60 bg-void/60 p-4 transition-all hover:border-lime hover:[box-shadow:var(--glow-lime)]",
                )}
              >
                <span className="block font-arcade text-base text-lime">
                  +{p.amount.toLocaleString()}
                </span>
                <span className="mt-1 block font-display text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                  {p.label}
                </span>
              </button>
            ))}
          </div>

          <p
            role="status"
            className="mt-5 min-h-5 font-arcade text-[8px] uppercase tracking-[0.28em] text-lime"
          >
            {claimed ? `Insert coin — ${claimed.toLocaleString()} credits loaded` : ""}
          </p>

          <Link to="/play" className="mt-4 inline-block">
            <ArcadeButton size="lg">Back To The Sky</ArcadeButton>
          </Link>
        </NeonPanel>

        <p className="mt-6 text-xs uppercase tracking-[0.25em] text-muted-foreground">
          Prototype interface — no real payments are processed.
        </p>
      </div>
    </Shell>
  );
}
