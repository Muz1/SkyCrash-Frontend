import { createFileRoute, Link } from "@tanstack/react-router";
import { CRTOverlay, ArcadeButton, NeonPanel } from "@/components/sky/ui";
import { SkyEnvironment } from "@/components/sky/SkyEnvironment";
import { Plane } from "@/components/sky/Plane";
import { NavDock } from "@/components/sky/NavDock";
import { Wordmark } from "@/components/sky/Shell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sky Crash — The Sky Is The Limit" },
      {
        name: "description",
        content:
          "A retro-futuristic aviation arcade game. Place your bet, climb the neon sky, and cash out before the flight crashes.",
      },
      { property: "og:title", content: "Sky Crash — The Sky Is The Limit" },
      {
        property: "og:description",
        content: "Retro arcade aviation. Bet, fly, cash out before the crash.",
      },
    ],
  }),
  component: Landing,
});

const steps = [
  { n: "1", t: "Take Off", d: "Place your bet and launch." },
  { n: "2", t: "Climb", d: "The multiplier rises with altitude." },
  { n: "3", t: "Cash Out", d: "Bank your credits before the crash." },
];

function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-void">
      <SkyEnvironment skin="sunset-runway" dim={0.22} priority />
      <CRTOverlay />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-end px-4 pb-44 pt-16 text-center sm:pb-48">
        <Plane
          size={230}
          className="mb-4 -translate-x-6 sm:mb-8 sm:size-auto"
          style={{ width: "min(70vw, 260px)" }}
        />

        <h1 className="sr-only">Sky Crash — The Sky Is The Limit</h1>
        <div aria-hidden>
          <Wordmark />
        </div>

        <div className="mt-8 flex flex-col items-center gap-3 sm:mt-10 sm:flex-row">
          <Link to="/play">
            <ArcadeButton size="xl" variant="primary">
              Play Sky Crash
            </ArcadeButton>
          </Link>
          <a href="#how-it-works">
            <ArcadeButton size="lg" variant="ghost">
              How It Works
            </ArcadeButton>
          </a>
        </div>

        <div className="mt-5 flex gap-3">
          <Link to="/login">
            <ArcadeButton size="sm" variant="blue" className="bg-void/80 backdrop-blur-sm">
              Login
            </ArcadeButton>
          </Link>
          <Link to="/signup">
            <ArcadeButton size="sm" variant="magenta" className="bg-void/80 backdrop-blur-sm">
              Create Account
            </ArcadeButton>
          </Link>
        </div>


        <section
          id="how-it-works"
          className="mt-14 grid w-full max-w-3xl gap-3 sm:grid-cols-3"
          aria-label="How the flight works"
        >
          {steps.map((s) => (
            <NeonPanel key={s.n} accent="magenta">
              <p className="font-arcade text-2xl text-magenta text-glow-magenta">{s.n}</p>
              <p className="mt-2 font-display text-sm font-black uppercase tracking-[0.2em] text-foreground">
                {s.t}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
            </NeonPanel>
          ))}
        </section>

        <p className="mt-10 font-arcade text-[8px] uppercase tracking-[0.3em] text-violet">
          High risk. High thrill. Beat the sky.
        </p>
      </div>

      <NavDock />
    </div>
  );
}
