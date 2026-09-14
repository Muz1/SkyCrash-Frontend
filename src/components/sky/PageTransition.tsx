import { useEffect, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import logo from "@/assets/logo-skycrash.png";
import { useGame } from "@/lib/game-store";
import { Aircraft } from "./Aircraft";

const DURATION = 3400;

/**
 * Screen transition: on every route change the equipped aircraft climbs the
 * canonical 45° path from the bottom-left of the viewport to the top-right,
 * dragging a neon wipe behind it that reveals the next screen.
 */
export function PageTransition() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { craft } = useGame();
  const [flightKey, setFlightKey] = useState(0);
  const lastPath = useRef(pathname);

  useEffect(() => {
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    setFlightKey((k) => k + 1);
  }, [pathname]);

  useEffect(() => {
    if (flightKey === 0) return;
    const t = setTimeout(() => setFlightKey(0), DURATION + 200);
    return () => clearTimeout(t);
  }, [flightKey]);

  if (flightKey === 0) return null;

  return (
    <div key={flightKey} aria-hidden className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          animation: `transition-wipe ${DURATION}ms cubic-bezier(0.33,0,0.2,1) forwards`,
          background:
            "radial-gradient(ellipse at 10% 110%, color-mix(in oklab, var(--neon-magenta) 42%, transparent), oklch(0.11 0.06 285 / 0.8) 72%)",
        }}
      />
      <div
        className="absolute -left-1/2 bottom-0 h-[220%] w-[3px] origin-bottom rotate-[-45deg]"
        style={{
          animation: `transition-wipe ${DURATION}ms cubic-bezier(0.33,0,0.2,1) forwards`,
          background:
            "linear-gradient(to top, color-mix(in oklab, var(--neon-blue) 80%, transparent), transparent)",
        }}
      />
      <img
        src={logo}
        alt=""
        width={1152}
        height={576}
        className="absolute left-1/2 top-1/2 w-[46vw] max-w-md -translate-x-1/2 -translate-y-1/2 opacity-0"
        style={{ animation: `transition-wipe ${DURATION}ms cubic-bezier(0.33,0,0.2,1) forwards` }}
      />
      <div
        className="absolute left-0 top-0"
        style={{
          animation: `craft-diagonal ${DURATION}ms cubic-bezier(0.22,0.61,0.36,1) forwards`,
          willChange: "transform",
        }}
      >
        <div style={{ animation: `craft-sway ${DURATION}ms ease-in-out` }}>
          <Aircraft
            craft={craft}
            size={420}
            idle={false}
            trailIntensity={1.6}
            className="w-[48vw] max-w-[460px]"
            style={{ width: "min(48vw, 460px)", height: "min(48vw, 460px)" }}
          />
        </div>
      </div>
    </div>
  );
}
