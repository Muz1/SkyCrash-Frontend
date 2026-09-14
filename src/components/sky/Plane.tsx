import { cn } from "@/lib/utils";
import { useGame } from "@/lib/game-store";
import { Aircraft } from "./Aircraft";
import type { CraftId } from "@/lib/craft";

/**
 * Convenience wrapper that flies whatever craft the player has equipped.
 * Always oriented along the canonical 45° bottom-left → top-right vector.
 */
export function Plane({
  className,
  size = 180,
  trail = true,
  trailIntensity = 1,
  crashing = false,
  style,
  craft,
}: {
  className?: string;
  size?: number;
  trail?: boolean;
  trailIntensity?: number;
  crashing?: boolean;
  style?: React.CSSProperties;
  craft?: CraftId;
}) {
  const game = useGame();
  const aircraftProps = {
    craft: craft ?? game.craft,
    size,
    trail,
    trailIntensity,
    crashing,
    ...(className === undefined ? {} : { className }),
    ...(style === undefined ? {} : { style }),
  };

  return <Aircraft {...aircraftProps} />;
}

/** Big chunky 80s arcade explosion used when a flight crashes. */
export function Explosion({ size = 260 }: { size?: number }) {
  const px = Math.max(6, Math.round(size / 26));

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      style={{ width: size, height: size }}
    >
      {/* full-stage strobe flash */}
      <span
        className="fixed inset-0 bg-[var(--neon-orange)]"
        style={{ animation: "explode-strobe 700ms steps(1,end) forwards" }}
      />

      {/* white-hot flash core */}
      <span
        className="absolute inset-0 rounded-full"
        style={{
          animation: "explode-flash 700ms steps(6,end) forwards",
          background:
            "radial-gradient(circle, oklch(0.99 0.03 95) 0%, oklch(0.98 0.05 90) 28%, var(--neon-orange) 52%, transparent 68%)",
        }}
      />

      {/* fireball */}
      <span
        className="absolute inset-0 rounded-full"
        style={{
          animation: "explode-core 1.1s steps(8,end) forwards",
          background:
            "radial-gradient(circle, oklch(0.98 0.05 90) 0%, var(--neon-orange) 38%, color-mix(in oklab, var(--neon-red) 85%, transparent) 64%, transparent 74%)",
        }}
      />

      {/* stacked shockwave rings */}
      {[0, 140, 300, 460].map((delay, i) => (
        <span
          key={delay}
          className={cn(
            "absolute inset-0 rounded-full",
            i % 2 ? "border-4 border-danger" : "border-4 border-ember",
          )}
          style={{ animation: `explode-ring 1.1s steps(10,end) ${delay}ms forwards` }}
        />
      ))}

      {/* pixel debris blocks */}
      {Array.from({ length: 24 }, (_, i) => {
        const a = (i / 24) * Math.PI * 2 + (i % 3) * 0.12;
        const dist = size * (0.42 + (i % 4) * 0.16);
        const scale = 1 + (i % 3);
        return (
          <span
            key={i}
            className="absolute left-1/2 top-1/2"
            style={
              {
                width: px * scale * 0.6,
                height: px * scale * 0.6,
                background:
                  i % 3 === 0
                    ? "var(--neon-red)"
                    : i % 3 === 1
                      ? "var(--neon-orange)"
                      : "oklch(0.98 0.05 90)",
                boxShadow: "0 0 12px color-mix(in oklab, var(--neon-orange) 80%, transparent)",
                "--dx": `${Math.cos(a) * dist}px`,
                "--dy": `${Math.sin(a) * dist}px`,
                "--rot": `${(i % 2 ? 1 : -1) * 320}deg`,
                animation: `explode-block ${900 + (i % 5) * 120}ms steps(9,end) ${i * 14}ms forwards`,
              } as React.CSSProperties
            }
          />
        );
      })}

      {/* smoke puffs */}
      {Array.from({ length: 7 }, (_, i) => {
        const a = (i / 7) * Math.PI * 2;
        return (
          <span
            key={`s${i}`}
            className="absolute left-1/2 top-1/2 rounded-full blur-[2px]"
            style={
              {
                width: size * 0.34,
                height: size * 0.34,
                background: "color-mix(in oklab, var(--neon-violet) 55%, transparent)",
                "--dx": `${Math.cos(a) * size * 0.32}px`,
                "--dy": `${Math.sin(a) * size * 0.32 - size * 0.1}px`,
                animation: `explode-smoke 1.4s ease-out ${180 + i * 60}ms forwards`,
              } as React.CSSProperties
            }
          />
        );
      })}

      {/* arcade BOOM! callout */}
      <span
        className="absolute left-1/2 top-1/2 whitespace-nowrap font-arcade text-2xl text-ember [text-shadow:0_0_18px_var(--neon-orange),4px_4px_0_color-mix(in_oklab,var(--neon-red)_90%,transparent)] sm:text-4xl"
        style={{ animation: "explode-boom 1.5s steps(12,end) 120ms forwards" }}
      >
        BOOM!
      </span>
    </div>
  );
}
