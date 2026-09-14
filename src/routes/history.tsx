import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/sky/Shell";
import { ArcadeButton, NeonPanel, StatusBadge } from "@/components/sky/ui";
import { useGame } from "@/lib/game-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Flight History — Sky Crash" },
      { name: "description", content: "Review every Sky Crash flight: bets, multipliers and results." },
      { property: "og:title", content: "Flight History — Sky Crash" },
      { property: "og:description", content: "Review your past Sky Crash flights." },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { flights } = useGame();

  return (
    <Shell skin="sunset-runway" dim={0.65}>
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="text-center font-display text-2xl font-black uppercase tracking-[0.2em] text-electric text-glow-blue sm:text-3xl">
          Flight History
        </h1>

        {flights.length === 0 ? (
          <NeonPanel className="mt-6 text-center" accent="blue">
            <p className="font-arcade text-sm text-magenta text-glow-magenta">No flights yet</p>
            <p className="mt-2 text-sm text-muted-foreground">Your first flight is waiting.</p>
            <Link to="/play" className="mt-5 inline-block">
              <ArcadeButton size="lg">Take Off</ArcadeButton>
            </Link>
          </NeonPanel>
        ) : (
          <ul className="mt-6 space-y-3">
            {flights.map((f) => (
              <li
                key={f.id}
                className="neon-panel clip-hud grid grid-cols-2 gap-3 p-4 sm:grid-cols-5 sm:items-center"
              >
                <div className="min-w-0">
                  <p className="font-arcade text-[7px] uppercase tracking-[0.3em] text-muted-foreground">
                    Flight
                  </p>
                  <p className="truncate font-arcade text-[10px] text-foreground">#{f.id}</p>
                </div>
                <div>
                  <p className="font-arcade text-[7px] uppercase tracking-[0.3em] text-muted-foreground">
                    Bet
                  </p>
                  <p className="font-arcade text-[10px] text-ember">{f.bet.toLocaleString()}</p>
                </div>
                <div>
                  <p className="font-arcade text-[7px] uppercase tracking-[0.3em] text-muted-foreground">
                    Multiplier
                  </p>
                  <p className="font-arcade text-[10px] text-electric">{f.multiplier.toFixed(2)}x</p>
                </div>
                <div>
                  <p className="font-arcade text-[7px] uppercase tracking-[0.3em] text-muted-foreground">
                    Result
                  </p>
                  <p
                    className={cn(
                      "font-arcade text-[10px]",
                      f.result >= 0 ? "text-lime text-glow-lime" : "text-danger",
                    )}
                  >
                    {f.result >= 0 ? "+" : ""}
                    {f.result.toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-2 sm:justify-end">
                  <StatusBadge status={f.status} />
                  <span className="font-arcade text-[7px] text-muted-foreground">{f.date}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Shell>
  );
}
