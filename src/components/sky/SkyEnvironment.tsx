import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import sunsetRunway from "@/assets/env-sunset-runway.jpg";
import cloudCity from "@/assets/env-cloud-city.jpg";
import deepSpace from "@/assets/env-deep-space.jpg";
import capeTown from "@/assets/env-cape-town.jpg";
import johannesburg from "@/assets/env-johannesburg.jpg";
import durban from "@/assets/env-durban.jpg";
import midnight from "@/assets/env-midnight.jpg";

export type SkinId =
  | "sunset-runway"
  | "cloud-city"
  | "deep-space"
  | "cape-town"
  | "johannesburg"
  | "durban"
  | "midnight"
  | "taking-off";

export const SKY_SKINS: {
  id: SkinId;
  name: string;
  src: string;
  blurb: string;
  /** Environment mood: drives ambient particles and lighting. */
  mood: "ground" | "high" | "space";
}[] = [
  {
    id: "sunset-runway",
    name: "Sunset Runway",
    src: sunsetRunway,
    blurb: "Where every flight begins.",
    mood: "ground",
  },
  {
    id: "cloud-city",
    name: "Cloud City",
    src: cloudCity,
    blurb: "Above the weather, below the stars.",
    mood: "high",
  },
  {
    id: "cape-town",
    name: "Cape Town",
    src: capeTown,
    blurb: "Table Mountain, the Atlantic and a burning horizon.",
    mood: "ground",
  },
  {
    id: "johannesburg",
    name: "Johannesburg",
    src: johannesburg,
    blurb: "Gold-hour towers and highways full of light.",
    mood: "ground",
  },
  {
    id: "durban",
    name: "Durban",
    src: durban,
    blurb: "Warm Indian Ocean air over the beachfront.",
    mood: "ground",
  },
  {
    id: "midnight",
    name: "Midnight",
    src: midnight,
    blurb: "Moonlight on the cloud deck.",
    mood: "high",
  },
  {
    id: "deep-space",
    name: "Deep Space",
    src: deepSpace,
    blurb: "Nothing left but the void.",
    mood: "space",
  },
  {
    id: "taking-off",
    name: "Taking Off",
    src: sunsetRunway,
    blurb: "Runway to orbit as the multiplier climbs.",
    mood: "ground",
  },
];

export function skinSrc(id: SkinId) {
  return SKY_SKINS.find((s) => s.id === id)?.src ?? sunsetRunway;
}

export function skinMood(id: SkinId) {
  return SKY_SKINS.find((s) => s.id === id)?.mood ?? "ground";
}

/** Opacities for the three sky layers of the "taking off" skin. */
export function ascentLayers(progress: number) {
  const p = Math.max(0, Math.min(1, progress));
  const cloud = Math.max(0, Math.min(1, (p - 0.12) / 0.36));
  const space = Math.max(0, Math.min(1, (p - 0.52) / 0.38));
  return { cloud, space };
}

function Stars({ opacity = 1 }: { opacity?: number }) {
  const stars = useMemo(
    () =>
      Array.from({ length: 44 }, (_, i) => ({
        left: (i * 37.7) % 100,
        top: (i * 61.3) % 65,
        d: (i % 7) * 0.4,
        s: 1 + (i % 3),
      })),
    [],
  );
  return (
    <div aria-hidden className="absolute inset-0 transition-opacity duration-700" style={{ opacity }}>
      {stars.map((s, i) => (
        <span
          key={i}
          className="animate-twinkle absolute rounded-full bg-white"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.s,
            height: s.s,
            animationDelay: `${s.d}s`,
          }}
        />
      ))}
    </div>
  );
}

function Clouds() {
  return (
    <div aria-hidden className="absolute inset-x-0 bottom-0 top-1/3 overflow-hidden">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="absolute h-24 w-64 rounded-full blur-2xl"
          style={{
            left: `${i * 34}%`,
            bottom: `${12 + i * 18}%`,
            background:
              i % 2 === 0
                ? "color-mix(in oklab, var(--neon-magenta) 45%, transparent)"
                : "color-mix(in oklab, var(--neon-violet) 50%, transparent)",
            animation: `sky-float ${10 + i * 3}s ease-in-out ${i}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Crossfading backdrop. Any change of `skin` fades the previous environment
 * out instead of hard-swapping it, so sky try-ons feel atmospheric.
 */
function CrossfadeBackdrop({ skin, priority }: { skin: SkinId; priority: boolean }) {
  const [layers, setLayers] = useState<{ id: number; src: string }[]>(() => [
    { id: 0, src: skinSrc(skin) },
  ]);
  const seq = useRef(0);
  const lastSkin = useRef(skin);

  useEffect(() => {
    if (lastSkin.current === skin) return;
    lastSkin.current = skin;
    seq.current += 1;
    const id = seq.current;
    setLayers((prev) => [...prev.slice(-2), { id, src: skinSrc(skin) }]);
    const t = setTimeout(() => setLayers((prev) => prev.filter((l) => l.id === id)), 1200);
    return () => clearTimeout(t);
  }, [skin]);

  return (
    <>
      {layers.map((l, i) => (
        <img
          key={l.id}
          src={l.src}
          alt=""
          width={1920}
          height={1088}
          loading={priority && i === 0 ? "eager" : "lazy"}
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            animation:
              i === layers.length - 1 && layers.length > 1
                ? "env-fade-in 1100ms ease-out both"
                : undefined,
          }}
        />
      ))}
    </>
  );
}

export function SkyEnvironment({
  skin = "sunset-runway",
  className,
  showGrid = true,
  dim = 0.35,
  priority = false,
  progress = 0,
}: {
  skin?: SkinId;
  className?: string;
  showGrid?: boolean;
  dim?: number;
  priority?: boolean;
  /** 0 → 1 ascent progress, only used by the "taking-off" skin. */
  progress?: number;
}) {
  const ascent = skin === "taking-off";
  const { cloud, space } = ascentLayers(progress);
  const mood = skinMood(skin);

  return (
    <div aria-hidden className={cn("absolute inset-0 overflow-hidden", className)}>
      {ascent ? (
        <div className="absolute inset-0">
          <img
            src={sunsetRunway}
            alt=""
            width={1920}
            height={1088}
            className="absolute inset-0 h-full w-full object-cover"
            style={{
              transform: `translate3d(0, ${progress * 6}%, 0) scale(${1 + progress * 0.06})`,
              willChange: "transform",
            }}
          />
          <img
            src={cloudCity}
            alt=""
            width={1920}
            height={1088}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ease-linear"
            style={{ opacity: cloud }}
          />
          <img
            src={deepSpace}
            alt=""
            width={1920}
            height={1088}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ease-linear"
            style={{ opacity: space }}
          />
        </div>
      ) : (
        <CrossfadeBackdrop skin={skin} priority={priority} />
      )}
      <Stars
        opacity={ascent ? 0.35 + space * 0.65 : mood === "ground" ? 0.35 : 1}
      />
      {ascent ? (
        <div className="transition-opacity duration-500" style={{ opacity: 1 - space }}>
          <Clouds />
        </div>
      ) : mood === "space" ? null : (
        <Clouds />
      )}
      {showGrid ? (
        <div
          className="grid-floor absolute inset-x-0 bottom-0 h-1/3 transition-opacity duration-500"
          style={{ opacity: ascent ? 1 - cloud : mood === "ground" ? 1 : 0.25 }}
        />
      ) : null}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          background: `linear-gradient(180deg, oklch(0.11 0.06 285 / ${dim + 0.25}) 0%, oklch(0.11 0.06 285 / ${dim}) 45%, oklch(0.11 0.06 285 / ${Math.min(dim + 0.5, 0.95)}) 100%)`,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 120%, color-mix(in oklab, var(--neon-magenta) 22%, transparent), transparent 60%)",
        }}
      />
    </div>
  );
}
