import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArcadeButton, CRTOverlay, CreditDisplay } from "@/components/sky/ui";
import { SkyEnvironment, SKY_SKINS, type SkinId } from "@/components/sky/SkyEnvironment";
import { Ambient } from "@/components/sky/Ambient";
import { NavDock } from "@/components/sky/NavDock";
import { Wordmark } from "@/components/sky/Shell";
import { Aircraft } from "@/components/sky/Aircraft";
import { CRAFTS, RARITY_STYLE, getCraft, type CraftId, type Rarity } from "@/lib/craft";
import { gameStore, useGame } from "@/lib/game-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/hangar")({
  head: () => ({
    meta: [
      { title: "The Hangar — Sky Crash" },
      {
        name: "description",
        content:
          "Customise your aircraft and your sky. Try on liveries, preview environments and equip your loadout before take-off.",
      },
      { property: "og:title", content: "The Hangar — Sky Crash" },
      {
        property: "og:description",
        content: "Try on aircraft skins and sky environments, then take off.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HangarPage,
});

function RarityBadge({ rarity }: { rarity: Rarity }) {
  const s = RARITY_STYLE[rarity];
  return (
    <span
      className={cn(
        "clip-hud inline-block border px-2 py-1 font-arcade text-[7px] uppercase leading-none",
        s.border,
        s.text,
        rarity === "LEGENDARY" || rarity === "SPECIAL" ? s.glow : "",
      )}
    >
      {rarity}
    </span>
  );
}

type Tab = "aircraft" | "skies";

function HangarPage() {
  const { credits, craft, skin } = useGame();
  const [tab, setTab] = useState<Tab>("aircraft");

  /** Aircraft currently on the preview pad (not necessarily equipped). */
  const [previewCraft, setPreviewCraft] = useState<CraftId>(craft);
  const [outgoing, setOutgoing] = useState<CraftId | null>(null);
  const [enterKey, setEnterKey] = useState(0);

  /** Sky currently shown behind the pad. */
  const [previewSky, setPreviewSky] = useState<SkinId>(skin === "taking-off" ? "sunset-runway" : skin);

  const active = getCraft(previewCraft);
  const activeSky = SKY_SKINS.find((s) => s.id === previewSky) ?? SKY_SKINS[0]!;

  const tryOn = useCallback(
    (id: CraftId) => {
      if (id === previewCraft) return;
      setOutgoing(previewCraft);
      setPreviewCraft(id);
      setEnterKey((k) => k + 1);
    },
    [previewCraft],
  );

  useEffect(() => {
    if (!outgoing) return;
    const t = setTimeout(() => setOutgoing(null), 620);
    return () => clearTimeout(t);
  }, [outgoing]);

  const craftEquipped = craft === previewCraft;
  const skyEquipped = skin === previewSky;

  return (
    <div className="relative min-h-screen overflow-hidden bg-void">
      <SkyEnvironment skin={previewSky} dim={0.5} />
      <Ambient skin={previewSky} />
      <CRTOverlay />

      <header className="relative z-20 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-4 sm:px-8">
        <div className="min-w-0">
          <Wordmark compact />
        </div>
        <CreditDisplay credits={credits} />
      </header>

      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-44 sm:px-6">
        <h1 className="font-display text-2xl font-black uppercase tracking-[0.3em] text-magenta text-glow-magenta sm:text-4xl">
          Hangar
        </h1>
        <p className="mt-1 font-arcade text-[8px] uppercase tracking-[0.34em] text-muted-foreground">
          Loadout · Aircraft &amp; Skies
        </p>

        {/* Tabs */}
        <div className="mt-5 flex gap-2">
          {(["aircraft", "skies"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "clip-hud border-2 px-5 py-2 font-arcade text-[9px] uppercase tracking-[0.2em] transition-all duration-150",
                tab === t
                  ? "border-ember bg-[image:var(--grad-sunset)] text-void [box-shadow:var(--glow-ember)]"
                  : "border-violet/50 text-muted-foreground hover:border-electric hover:text-electric",
              )}
            >
              {t === "aircraft" ? "Aircraft" : "Skies"}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
          {/* ---------- Preview stage ---------- */}
          <section
            aria-label="Preview"
            className="neon-panel clip-hud relative min-h-[300px] overflow-hidden p-4 sm:min-h-[380px]"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse at 30% 80%, color-mix(in oklab, var(--neon-violet) 30%, transparent), transparent 65%)",
              }}
            />
            <div className="relative grid h-full min-h-[260px] place-items-center sm:min-h-[330px]">
              <div style={{ animation: "camera-idle 6s ease-in-out infinite" }}>
                {outgoing ? (
                  <div
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                    style={{ animation: "craft-exit-preview 560ms cubic-bezier(0.4,0,0.7,1) forwards" }}
                  >
                    <Aircraft craft={outgoing} size={260} idle={false} trail={false} />
                  </div>
                ) : null}
                <div
                  key={enterKey}
                  style={{
                    animation:
                      enterKey > 0 ? "craft-enter-preview 700ms cubic-bezier(0.2,0.8,0.3,1) 180ms both" : undefined,
                  }}
                >
                  <Aircraft craft={previewCraft} size={280} trailIntensity={0.7} />
                </div>
              </div>
            </div>

            <p className="relative mt-2 text-center font-arcade text-[7px] uppercase tracking-[0.3em] text-muted-foreground">
              {activeSky.name} · Preview Bay
            </p>
          </section>

          {/* ---------- Detail panel ---------- */}
          <section aria-label="Details" className="neon-panel clip-hud p-5">
            {tab === "aircraft" ? (
              <div className="animate-sky-pop">
                <p className="font-display text-2xl font-black uppercase tracking-[0.2em] text-foreground">
                  {active.name}
                </p>
                <div className="mt-2">
                  <RarityBadge rarity={active.rarity} />
                </div>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{active.blurb}</p>

                <p className="mt-5 font-arcade text-[7px] uppercase tracking-[0.3em] text-muted-foreground">
                  Status
                </p>
                <p
                  className={cn(
                    "font-arcade text-sm",
                    craftEquipped ? "text-lime text-glow-lime" : "text-ember text-glow-ember",
                  )}
                >
                  {craftEquipped ? "Equipped" : "Trying On"}
                </p>

                <div className="mt-6 flex flex-col gap-3">
                  <ArcadeButton
                    size="lg"
                    variant="primary"
                    disabled={craftEquipped}
                    onClick={() => gameStore.setCraft(previewCraft)}
                  >
                    {craftEquipped ? "Equipped" : "Equip Aircraft"}
                  </ArcadeButton>
                  <Link to="/play">
                    <ArcadeButton size="sm" variant="blue" className="w-full">
                      To The Runway
                    </ArcadeButton>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="animate-sky-pop">
                <p className="font-display text-2xl font-black uppercase tracking-[0.2em] text-foreground">
                  {activeSky.name}
                </p>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{activeSky.blurb}</p>

                <p className="mt-5 font-arcade text-[7px] uppercase tracking-[0.3em] text-muted-foreground">
                  Status
                </p>
                <p
                  className={cn(
                    "font-arcade text-sm",
                    skyEquipped ? "text-lime text-glow-lime" : "text-electric text-glow-blue",
                  )}
                >
                  {skyEquipped ? "Equipped" : "Previewing"}
                </p>

                <div className="mt-6 flex flex-col gap-3">
                  <ArcadeButton
                    size="lg"
                    variant="primary"
                    disabled={skyEquipped}
                    onClick={() => gameStore.setSkin(previewSky)}
                  >
                    {skyEquipped ? "Equipped" : "Equip Sky"}
                  </ArcadeButton>
                  <Link to="/play">
                    <ArcadeButton size="sm" variant="blue" className="w-full">
                      To The Runway
                    </ArcadeButton>
                  </Link>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* ---------- Selector rail ---------- */}
        <div className="mt-6">
          {tab === "aircraft" ? (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {CRAFTS.map((c) => {
                const s = RARITY_STYLE[c.rarity];
                const selected = previewCraft === c.id;
                return (
                  <li key={c.id}>
                    <button
                      onClick={() => tryOn(c.id)}
                      className={cn(
                        "clip-hud flex w-full items-center gap-3 border-2 bg-void/60 p-3 text-left transition-all duration-150 hover:-translate-y-0.5",
                        selected ? cn(s.border, s.glow) : "border-violet/40 hover:border-electric",
                      )}
                    >
                      <img
                        src={c.src}
                        alt=""
                        width={1024}
                        height={1024}
                        loading="lazy"
                        className="h-14 w-14 shrink-0 object-contain"
                        style={{ transform: `rotate(${c.rotate}deg)` }}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block font-arcade text-[8px] uppercase text-foreground">
                          {c.name}
                        </span>
                        <span className={cn("mt-1 block font-arcade text-[6px] uppercase", s.text)}>
                          {c.rarity}
                        </span>
                        <span className="mt-1 block text-[11px] leading-snug text-muted-foreground">
                          {craft === c.id ? "Equipped" : selected ? "On the pad" : "Try on"}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {SKY_SKINS.filter((s) => s.id !== "taking-off").map((s) => (
                <li key={s.id}>
                  <button
                    onClick={() => setPreviewSky(s.id)}
                    className={cn(
                      "clip-hud w-full overflow-hidden border-2 text-left transition-all duration-150 hover:-translate-y-0.5",
                      previewSky === s.id
                        ? "border-lime [box-shadow:var(--glow-lime)]"
                        : "border-violet/40 hover:border-magenta",
                    )}
                  >
                    <img
                      src={s.src}
                      alt=""
                      width={1920}
                      height={1088}
                      loading="lazy"
                      className="h-20 w-full object-cover"
                    />
                    <span className="block px-2 py-2 font-arcade text-[7px] uppercase text-foreground">
                      {s.name}
                      {skin === s.id ? (
                        <span className="ml-1 text-lime">·EQ</span>
                      ) : null}
                    </span>
                  </button>
                </li>
              ))}
              <li>
                <button
                  onClick={() => setPreviewSky("taking-off")}
                  className={cn(
                    "clip-hud h-full w-full border-2 p-3 text-left transition-all duration-150 hover:-translate-y-0.5",
                    previewSky === "taking-off"
                      ? "border-ember [box-shadow:var(--glow-ember)]"
                      : "border-violet/40 hover:border-ember",
                  )}
                >
                  <span className="block font-arcade text-[8px] uppercase text-ember">Taking Off</span>
                  <span className="mt-2 block text-[11px] leading-snug text-muted-foreground">
                    Dynamic: runway → cloud deck → orbit as the multiplier climbs.
                  </span>
                </button>
              </li>
            </ul>
          )}
        </div>
      </main>

      <NavDock />
    </div>
  );
}
