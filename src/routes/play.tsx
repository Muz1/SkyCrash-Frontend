import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArcadeButton, CRTOverlay, CreditDisplay, NeonPanel } from "@/components/sky/ui";
import { SkyEnvironment } from "@/components/sky/SkyEnvironment";
import { Ambient } from "@/components/sky/Ambient";
import { Explosion, Plane } from "@/components/sky/Plane";
import { NavDock } from "@/components/sky/NavDock";
import { Wordmark } from "@/components/sky/Shell";
import { BET_STEPS, formatBet, gameStore, useGame } from "@/lib/game-store";
import { getCraft } from "@/lib/craft";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/play")({
  head: () => ({
    meta: [
      { title: "Active Flight — Sky Crash" },
      {
        name: "description",
        content: "Place your bet, watch the multiplier climb, and cash out before the crash.",
      },
      { property: "og:title", content: "Active Flight — Sky Crash" },
      { property: "og:description", content: "Bet, fly, cash out before the crash." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PlayPage,
});

type Phase = "betting" | "launching" | "flying" | "cashed" | "crashed";

function Coins() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {Array.from({ length: 14 }, (_, i) => (
        <span
          key={i}
          className="absolute left-1/2 top-1/2 h-3 w-3 rounded-full bg-[image:var(--grad-sunset)]"
          style={
            {
              "--dx": `${(i % 2 ? 1 : -1) * (30 + i * 12)}px`,
              "--dy": `${-60 - (i % 5) * 26}px`,
              animation: `coin-fly 1s ease-out ${i * 40}ms forwards`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

function PlayPage() {
  const { credits, skin, craft } = useGame();
  const [phase, setPhase] = useState<Phase>("betting");
  const [bet, setBet] = useState(250);
  const [autoCashout, setAutoCashout] = useState(2.0);
  const [multiplier, setMultiplier] = useState(1);
  const [crashPoint, setCrashPoint] = useState(0);
  const [payout, setPayout] = useState(0);
  const raf = useRef<number | null>(null);

  const stop = () => {
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = null;
  };
  useEffect(() => stop, []);

  const startFlight = () => {
    if (bet > credits) return;
    gameStore.placeBet(bet);
    setPhase("launching");
    setMultiplier(1);
    const cp = 1 + Math.pow(Math.random(), 2.2) * 12;
    setCrashPoint(Number(cp.toFixed(2)));
    setTimeout(() => setPhase("flying"), 1400);
  };

  const cashOut = useCallback(
    (atMultiplier: number) => {
      stop();
      const won = Math.round(bet * atMultiplier);
      setPayout(won);
      setMultiplier(atMultiplier);
      setPhase("cashed");
      gameStore.recordFlight({
        bet,
        multiplier: Number(atMultiplier.toFixed(2)),
        result: won - bet,
        status: "CASHED OUT",
      });
    },
    [bet],
  );

  useEffect(() => {
    if (phase !== "flying") return;
    const t0 = performance.now();
    const tick = (now: number) => {
      const elapsed = (now - t0) / 1000;
      const m = Number(Math.pow(1.09, elapsed * 7).toFixed(2));
      if (m >= crashPoint) {
        stop();
        setMultiplier(crashPoint);
        setPhase("crashed");
        gameStore.recordFlight({ bet, multiplier: crashPoint, result: -bet, status: "CRASHED" });
        return;
      }
      if (autoCashout > 1 && m >= autoCashout) {
        cashOut(autoCashout);
        return;
      }
      setMultiplier(m);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return stop;
  }, [phase, crashPoint, autoCashout, bet, cashOut]);

  const flying = phase === "flying";
  const climb = Math.min((multiplier - 1) / 8, 1);
  const takeoffCurve = Math.pow(climb, 1.85);
  const airborne = phase !== "betting" && phase !== "launching";
  const ascent = airborne ? climb : 0;
  const potential = Math.round(bet * multiplier);
  /** Final seconds before the crash: the airframe starts to shake. */
  const unstable = flying && crashPoint > 0 && multiplier >= crashPoint - 0.35;

  const craftInfo = getCraft(craft);

  return (
    <div className="relative min-h-screen overflow-hidden bg-void">
      {/* Camera layer — the whole world bounces, not just the UI */}
      <div
        className="absolute inset-0"
        style={{
          animation:
            phase === "crashed"
              ? "camera-impact 900ms cubic-bezier(0.3,0,0.2,1) both"
              : flying
                ? `camera-climb ${Math.max(0.9, 2.4 - climb * 1.4)}s ease-in-out infinite`
                : "camera-idle 7s ease-in-out infinite",
          willChange: "transform",
        }}
      >
        <SkyEnvironment skin={skin} progress={ascent} dim={phase === "crashed" ? 0.5 : 0.34} />
        <Ambient skin={skin} progress={ascent} />
      </div>
      <CRTOverlay />

      {/* HUD */}
      <header className="relative z-20 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-4 sm:px-8">
        <div className="min-w-0">
          <Wordmark compact />
        </div>
        <CreditDisplay credits={credits} />
      </header>

      <main className="relative z-10 mx-auto flex min-h-[70vh] w-full max-w-6xl flex-col items-center px-4 pb-44">
        {/* Multiplier */}
        <div className="relative mt-2 text-center">
          <p className="font-arcade text-[8px] uppercase tracking-[0.5em] text-muted-foreground">
            Multiplier
          </p>
          <p
            key={Math.floor(multiplier * 10)}
            className={cn(
              "font-arcade text-5xl leading-none sm:text-7xl",
              phase === "crashed"
                ? "text-danger [text-shadow:0_0_18px_color-mix(in_oklab,var(--neon-red)_90%,transparent)]"
                : phase === "cashed"
                  ? "text-lime text-glow-lime"
                  : "text-electric text-glow-blue",
            )}
            style={{ animation: flying ? "multiplier-tick 220ms ease-out" : undefined }}
          >
            {multiplier.toFixed(2)}x
          </p>
        </div>

        {/* Flight stage — canonical 45° bottom-left → top-right trajectory */}
        <div className="relative h-[42vh] min-h-[260px] w-full">
          {/* trajectory guide */}
          <div
            aria-hidden
            className="absolute bottom-[10%] left-[8%] h-[2px] w-[92%] origin-left -rotate-45 opacity-25"
            style={{
              background:
                "repeating-linear-gradient(90deg, color-mix(in oklab, var(--neon-blue) 60%, transparent) 0 12px, transparent 12px 26px)",
            }}
          />
          <div
            className="absolute bottom-[-5%] transition-transform duration-500 ease-out"
            style={{
              left: "calc(50% - 50vw)",
              transform: `translate3d(calc((100vw - 180px) * ${climb}), calc((200px - 42vh) * ${takeoffCurve}), 0) scale(${1 + climb * 0.12})`,
              willChange: "transform",
            }}
          >
            <div style={{ animation: unstable ? "craft-stutter 220ms linear infinite" : undefined }}>
              <Plane
                size={200}
                crashing={phase === "crashed"}
                trail={airborne}
                trailIntensity={0.6 + climb}
              />
              {phase === "cashed" ? <Coins /> : null}
              {phase === "crashed" ? (
                <div className="absolute left-1/2 top-1/2">
                  <Explosion size={300} />
                </div>
              ) : null}
            </div>
          </div>


          {phase === "launching" ? (
            <div className="absolute inset-x-0 bottom-6 text-center">
              <p className="font-arcade text-[9px] uppercase tracking-[0.3em] text-ember animate-sky-pulse">
                {craftInfo.name} spooling up…
              </p>
              <div className="mx-auto mt-3 h-2 w-56 border border-ember/60 clip-hud">
                <div
                  className="h-full bg-[image:var(--grad-sunset)]"
                  style={{ animation: "sky-pulse 1.4s linear infinite", width: "70%" }}
                />
              </div>
            </div>
          ) : null}

          {unstable ? (
            <p className="absolute inset-x-0 top-2 text-center font-arcade text-[9px] uppercase tracking-[0.3em] text-danger animate-sky-pulse">
              ⚠ Airframe unstable
            </p>
          ) : null}

        </div>

        {/* Result overlays */}
        {phase === "cashed" ? (
          <div className="animate-sky-pop neon-panel clip-hud w-full max-w-md p-6 text-center">
            <p className="font-display text-sm font-black uppercase tracking-[0.3em] text-lime text-glow-lime">
              Cashed Out
            </p>
            <p className="mt-3 font-arcade text-3xl text-lime text-glow-lime">
              +{payout.toLocaleString()}
            </p>
            <p className="font-arcade text-[8px] uppercase tracking-[0.4em] text-ember">Credits</p>
            <ArcadeButton className="mt-6 w-full" size="lg" onClick={() => setPhase("betting")}>
              Next Flight
            </ArcadeButton>
          </div>
        ) : null}

        {phase === "crashed" ? (
          <div className="animate-sky-pop neon-panel clip-hud w-full max-w-md border-danger/70 p-6 text-center">
            <p className="font-display text-xl font-black uppercase tracking-[0.24em] text-danger [text-shadow:0_0_16px_color-mix(in_oklab,var(--neon-red)_85%,transparent)]">
              Flight Over
            </p>
            <p className="mt-4 font-arcade text-[8px] uppercase tracking-[0.4em] text-muted-foreground">
              Crashed at
            </p>
            <p className="font-arcade text-3xl text-ember text-glow-ember">
              {crashPoint.toFixed(2)}x
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <ArcadeButton size="lg" onClick={() => setPhase("betting")}>
                Try Again
              </ArcadeButton>
              <Link to="/hangar">
                <ArcadeButton size="sm" variant="ghost" className="w-full">
                  Return To Hangar
                </ArcadeButton>
              </Link>
            </div>
          </div>
        ) : null}
      </main>

      {/* Bottom controls */}
      <div className="fixed inset-x-0 bottom-24 z-20 px-4 sm:bottom-28">
        <div className="mx-auto w-full max-w-4xl">
          {phase === "betting" ? (
            <NeonPanel accent="magenta" className="w-full">
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                <div className="min-w-0">
                  <p className="font-display text-lg font-black uppercase tracking-[0.2em] text-magenta text-glow-magenta">
                    New Flight
                  </p>
                  <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
                    Place your bet
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {BET_STEPS.map((v) => (
                      <button
                        key={v}
                        onClick={() => setBet(v)}
                        className={cn(
                          "clip-hud border-2 px-3 py-1.5 font-arcade text-[9px] transition-all duration-150 active:translate-y-[1px]",
                          bet === v
                            ? "border-ember text-ember [box-shadow:var(--glow-ember)]"
                            : "border-violet/50 text-muted-foreground hover:border-electric hover:text-electric",
                        )}
                      >
                        {formatBet(v)}
                      </button>
                    ))}
                    <button
                      onClick={() => setBet(credits)}
                      className="clip-hud border-2 border-magenta/60 px-3 py-1.5 font-arcade text-[9px] text-magenta transition-all hover:[box-shadow:var(--glow-magenta)]"
                    >
                      Max
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-4">
                    <div>
                      <p className="font-arcade text-[7px] uppercase tracking-[0.3em] text-muted-foreground">
                        Bet Amount
                      </p>
                      <p className="font-arcade text-xl text-ember text-glow-ember">
                        {bet.toLocaleString()}
                      </p>
                    </div>
                    <label className="min-w-[180px]">
                      <span className="font-arcade text-[7px] uppercase tracking-[0.3em] text-muted-foreground">
                        Auto cashout {autoCashout.toFixed(2)}x
                      </span>
                      <input
                        type="range"
                        min={1}
                        max={10}
                        step={0.25}
                        value={autoCashout}
                        onChange={(e) => setAutoCashout(Number(e.target.value))}
                        className="mt-1 w-full accent-[var(--neon-blue)]"
                      />
                    </label>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <ArcadeButton
                    size="xl"
                    variant="primary"
                    onClick={startFlight}
                    disabled={bet > credits}
                  >
                    Place Bet
                  </ArcadeButton>
                  <Link to="/hangar">
                    <ArcadeButton size="sm" variant="blue" className="w-full">
                      Hangar · {craftInfo.name}
                    </ArcadeButton>
                  </Link>
                </div>
              </div>
            </NeonPanel>
          ) : null}

          {flying ? (
            <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 sm:gap-5">
              <div className="neon-panel clip-hud px-4 py-3">
                <p className="font-arcade text-[7px] uppercase tracking-[0.3em] text-muted-foreground">
                  Bet
                </p>
                <p className="font-arcade text-base text-ember text-glow-ember">
                  {bet.toLocaleString()}
                </p>
              </div>
              <ArcadeButton
                variant="cash"
                size="xl"
                className="w-full flex-col !gap-0 py-5"
                onClick={() => cashOut(multiplier)}
              >
                <span>Cash Out</span>
                <span className="font-arcade text-base sm:text-xl">
                  +{potential.toLocaleString()}
                </span>
              </ArcadeButton>
            </div>
          ) : null}
        </div>
      </div>

      <NavDock />
    </div>
  );
}
