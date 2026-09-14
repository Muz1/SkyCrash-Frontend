import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { CRTOverlay, CreditDisplay } from "./ui";
import { NavDock } from "./NavDock";
import { SkyEnvironment, type SkinId } from "./SkyEnvironment";
import { Ambient } from "./Ambient";
import { PageTransition } from "./PageTransition";
import logo from "@/assets/logo-skycrash.png";
import { cn } from "@/lib/utils";
import { useGame } from "@/lib/game-store";

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="block leading-none">
      <img
        src={logo}
        alt="Sky Crash"
        width={1152}
        height={576}
        className={cn(
          "h-auto w-auto drop-shadow-[0_0_22px_color-mix(in_oklab,var(--neon-magenta)_55%,transparent)]",
          compact ? "max-h-11" : "max-h-40 sm:max-h-56",
        )}
      />
      {!compact ? (
        <span className="mt-2 block font-arcade text-[8px] uppercase tracking-[0.42em] text-electric text-glow-blue sm:text-xs">
          The sky is the limit
        </span>
      ) : null}
    </Link>
  );
}

export function Shell({
  children,
  skin = "sunset-runway",
  dim = 0.45,
  className,
  showHud = true,
}: {
  children: ReactNode;
  skin?: SkinId;
  dim?: number;
  className?: string;
  showHud?: boolean;
}) {
  const { credits } = useGame();
  return (
    <div className="relative min-h-screen overflow-hidden bg-void">
      <SkyEnvironment skin={skin} dim={dim} />
      <Ambient skin={skin} />
      <PageTransition />
      <CRTOverlay />
      {showHud ? (
        <header className="relative z-20 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-4 sm:px-8">
          <div className="min-w-0">
            <Wordmark compact />
          </div>
          <CreditDisplay credits={credits} />
        </header>
      ) : null}
      <main className={cn("relative z-10 px-4 pb-40 sm:px-8", className)}>{children}</main>
      <NavDock />
    </div>
  );
}
