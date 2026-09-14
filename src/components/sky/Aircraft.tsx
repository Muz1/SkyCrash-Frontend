import { cn } from "@/lib/utils";
import { getCraft, type CraftId } from "@/lib/craft";

/**
 * Canonical flight vector for the whole game: bottom-left → top-right at 45°.
 * Every aircraft sprite is normalised to this heading.
 */
export const FLIGHT_ANGLE = 45;

/**
 * Particle exhaust trail that sits behind the aircraft along the reverse of
 * the flight vector. Purely transform/opacity driven so it stays cheap.
 */
export function AircraftTrail({
  size,
  color,
  intensity = 1,
}: {
  size: number;
  color: string;
  intensity?: number;
}) {
  const len = size * (0.9 + intensity * 0.9);

  return (
    <span aria-hidden className="pointer-events-none absolute left-0 top-0">
      {/* soft heat streak */}
      <span
        className="absolute origin-left rounded-full blur-[3px]"
        style={{
          width: len,
          height: Math.max(4, size * 0.055),
          transform: `rotate(180deg) translateY(-50%)`,
          background: `linear-gradient(90deg, transparent, color-mix(in oklab, ${color} 70%, transparent) 55%, color-mix(in oklab, ${color} 95%, transparent))`,
          opacity: 0.28 + intensity * 0.5,
          animation: "trail-pulse 900ms ease-in-out infinite",
        }}
      />
      {/* particles peeling off behind the engines */}
      {Array.from({ length: 10 }, (_, i) => (
        <span
          key={i}
          className="absolute rounded-[1px]"
          style={
            {
              width: Math.max(3, size * 0.035),
              height: Math.max(3, size * 0.035),
              background: i % 3 === 0 ? "oklch(0.98 0.05 90)" : color,
              opacity: 0,
              "--tx": `${-len * (0.35 + (i % 5) * 0.16)}px`,
              "--ty": `${(i % 2 ? 1 : -1) * size * 0.035 * (1 + (i % 3))}px`,
              animation: `trail-particle ${1100 + (i % 4) * 260}ms linear ${i * 95}ms infinite`,
            } as React.CSSProperties
          }
        />
      ))}
    </span>
  );
}

/**
 * The aircraft itself. Always renders nose-toward-top-right and keeps its
 * trail attached, whatever sprite the player has equipped.
 */
export function Aircraft({
  craft,
  size = 200,
  trail = true,
  trailIntensity = 1,
  crashing = false,
  idle = true,
  className,
  style,
}: {
  craft: CraftId;
  size?: number;
  trail?: boolean;
  trailIntensity?: number;
  crashing?: boolean;
  idle?: boolean;
  className?: string | undefined;
  style?: React.CSSProperties | undefined;
}) {
  const c = getCraft(craft);

  return (
    <div
      className={cn("pointer-events-none relative", className)}
      style={{ width: size, height: size, ...style }}
    >
      {trail && !crashing ? (
        <span
          className="absolute left-[26%] top-[74%]"
          style={{ transform: `rotate(-${FLIGHT_ANGLE}deg)` }}
        >
          <AircraftTrail size={size} color={c.trail} intensity={trailIntensity} />
        </span>
      ) : null}
      <img
        src={c.src}
        alt={`${c.name} aircraft`}
        width={1024}
        height={1024}
        className={cn(
          "relative h-full w-full object-contain drop-shadow-[0_0_22px_color-mix(in_oklab,var(--neon-magenta)_45%,transparent)]",
          crashing ? "animate-sky-spiral" : idle ? "animate-sky-float" : undefined,
        )}
        style={{ transform: `rotate(${c.rotate}deg)`, willChange: "transform" }}
      />
    </div>
  );
}
