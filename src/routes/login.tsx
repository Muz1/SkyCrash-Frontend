import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArcadeButton, ArcadeField, CRTOverlay } from "@/components/sky/ui";
import { SkyEnvironment } from "@/components/sky/SkyEnvironment";
import { Wordmark } from "@/components/sky/Shell";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Welcome Back, Pilot — Sky Crash" },
      { name: "description", content: "Log in to your Sky Crash pilot account and take off." },
      { property: "og:title", content: "Welcome Back, Pilot — Sky Crash" },
      { property: "og:description", content: "Log in to your Sky Crash pilot account." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-void px-4 py-12">
      <SkyEnvironment skin="sunset-runway" dim={0.55} />
      <CRTOverlay />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <Wordmark compact />
        </div>

        <form
          className="neon-panel clip-hud crt-scan p-6 sm:p-8"
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            if (!data.get("username") || !data.get("password")) {
              setError("Flight system error — check your credentials.");
              return;
            }
            setError("");
            setLoading(true);
            setTimeout(() => navigate({ to: "/play" }), 900);
          }}
        >
          <h1 className="text-center font-display text-xl font-black uppercase tracking-[0.18em] text-magenta text-glow-magenta">
            Welcome Back, Pilot
          </h1>
          <p className="mt-1 text-center text-xs uppercase tracking-[0.25em] text-muted-foreground">
            Cleared for boarding
          </p>

          <div className="mt-7 space-y-4">
            <ArcadeField label="Username" name="username" autoComplete="username" placeholder="pilot_name" />
            <ArcadeField
              label="Password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </div>

          {error ? (
            <p role="alert" className="mt-4 font-arcade text-[8px] uppercase leading-relaxed text-danger">
              {error}
            </p>
          ) : null}

          <div className="mt-5 flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 text-muted-foreground">
              <input type="checkbox" className="accent-[var(--neon-magenta)]" /> Remember me
            </label>
            <button type="button" className="text-electric hover:text-glow-blue">
              Forgot password?
            </button>
          </div>

          <ArcadeButton
            type="submit"
            size="lg"
            variant="primary"
            className="mt-7 w-full"
            disabled={loading}
          >
            {loading ? "Preparing Aircraft…" : "Login"}
          </ArcadeButton>

          <p className="mt-5 text-center text-xs uppercase tracking-[0.2em] text-muted-foreground">
            New here?{" "}
            <Link to="/signup" className="text-lime hover:text-glow-lime">
              Create account
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
