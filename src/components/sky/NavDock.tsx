import { Link } from "@tanstack/react-router";
import { Home, Plane, Trophy, Warehouse, UserRound, Coins } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Home", Icon: Home, hero: false },
  { to: "/leaderboard", label: "Ranks", Icon: Trophy, hero: false },
  { to: "/hangar", label: "Hangar", Icon: Warehouse, hero: false },
  { to: "/play", label: "Play", Icon: Plane, hero: true },
  { to: "/history", label: "Flights", Icon: Coins, hero: false },
  { to: "/profile", label: "Pilot", Icon: UserRound, hero: false },
] as const;



export function NavDock() {
  return (
    <nav
      aria-label="Sky Crash navigation"
      className="fixed inset-x-0 bottom-0 z-30 flex justify-center px-2 pb-3 sm:pb-5"
    >
      <ul className="flex items-end gap-1.5 sm:gap-3">
        {items.map(({ to, label, Icon, hero }) => (
          <li key={to}>
            <Link
              to={to}
              aria-label={label}
              className={cn(
                "group grid place-items-center gap-1 border-2 transition-all duration-150 clip-hud",
                hero
                  ? "h-16 w-16 border-[oklch(0.98_0.05_90)] bg-[image:var(--grad-sunset)] text-void [text-shadow:0_1px_0_color-mix(in_oklab,white_50%,transparent)] [box-shadow:var(--glow-ember),0_0_0_4px_oklch(0.11_0.06_285_/_0.85)] hover:brightness-125 sm:h-20 sm:w-20"
                  : "h-12 w-12 border-violet/60 bg-void/70 text-muted-foreground hover:border-electric hover:text-electric hover:[box-shadow:var(--glow-blue)] sm:h-14 sm:w-16",
              )}
              activeProps={{
                className:
                  "!border-magenta !text-magenta [box-shadow:var(--glow-magenta)]",
              }}
              activeOptions={{ exact: to === "/" }}
            >
              <Icon className={hero ? "h-6 w-6 sm:h-7 sm:w-7" : "h-4 w-4"} aria-hidden />
              <span className="font-arcade text-[6px] uppercase leading-none sm:text-[7px]">
                {label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
