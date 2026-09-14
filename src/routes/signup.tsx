import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArcadeButton, ArcadeField, CRTOverlay } from "@/components/sky/ui";
import { SkyEnvironment } from "@/components/sky/SkyEnvironment";
import { Wordmark } from "@/components/sky/Shell";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Join The Flight — Sky Crash" },
      { name: "description", content: "Create your Sky Crash pilot account and start flying." },
      { property: "og:title", content: "Join The Flight — Sky Crash" },
      { property: "og:description", content: "Create your Sky Crash pilot account." },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-void px-4 py-12">
      <SkyEnvironment skin="cloud-city" dim={0.55} />
      <CRTOverlay />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <Wordmark compact />
        </div>

        <form
          className="neon-panel clip-hud crt-scan p-6 sm:p-8"
          onSubmit={(e) => {
            e.preventDefault();
            setLoading(true);
            setTimeout(() => navigate({ to: "/play" }), 900);
          }}
        >
          <h1 className="text-center font-display text-xl font-black uppercase tracking-[0.18em] text-lime text-glow-lime">
            Join The Flight
          </h1>
          <p className="mt-1 text-center text-xs uppercase tracking-[0.25em] text-muted-foreground">
            Register your call sign
          </p>

          <div className="mt-7 space-y-4">
            <ArcadeField label="Username" name="username" placeholder="pilot_name" />
            <ArcadeField label="Email" name="email" type="email" placeholder="pilot@skycrash.io" />
            <ArcadeField label="Password" name="password" type="password" placeholder="••••••••" />
            <ArcadeField
              label="Confirm Password"
              name="confirm"
              type="password"
              placeholder="••••••••"
            />
          </div>

          <label className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
            <input type="checkbox" required className="accent-[var(--neon-lime)]" />I agree to the
            flight terms
          </label>

          <ArcadeButton
            type="submit"
            size="lg"
            variant="cash"
            className="mt-6 w-full"
            disabled={loading}
          >
            {loading ? "Establishing Flight Path…" : "Create Account"}
          </ArcadeButton>

          <p className="mt-5 text-center text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Already a pilot?{" "}
            <Link to="/login" className="text-electric hover:text-glow-blue">
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
