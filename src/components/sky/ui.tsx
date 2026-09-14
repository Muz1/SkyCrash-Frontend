import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ---------------- ArcadeButton ---------------- */

export const arcadeButton = cva(
  "relative inline-flex select-none items-center justify-center gap-2 font-display font-black uppercase tracking-[0.14em] transition-all duration-150 clip-hud border-2 disabled:pointer-events-none disabled:opacity-40 disabled:saturate-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-void active:translate-y-[2px]",
  {
    variants: {
      variant: {
        primary:
          "border-[oklch(0.98_0.05_90)] text-void bg-[image:var(--grad-sunset)] [text-shadow:0_1px_0_color-mix(in_oklab,white_55%,transparent)] [box-shadow:var(--glow-ember),0_0_0_4px_oklch(0.11_0.06_285_/_0.85),inset_0_-4px_0_color-mix(in_oklab,black_28%,transparent)] hover:brightness-125 hover:[box-shadow:var(--glow-ember),0_0_34px_var(--neon-orange),0_0_0_4px_oklch(0.11_0.06_285_/_0.85)] focus-visible:ring-ember",
        cash: "border-lime text-lime bg-[linear-gradient(180deg,color-mix(in_oklab,var(--neon-lime)_20%,transparent),transparent)] [box-shadow:var(--glow-lime),inset_0_0_18px_color-mix(in_oklab,var(--neon-lime)_22%,transparent)] hover:bg-[color-mix(in_oklab,var(--neon-lime)_30%,transparent)] hover:text-foreground focus-visible:ring-lime",
        magenta:
          "border-magenta text-magenta bg-[linear-gradient(180deg,color-mix(in_oklab,var(--neon-magenta)_20%,transparent),transparent)] [box-shadow:var(--glow-magenta)] hover:text-foreground hover:bg-[color-mix(in_oklab,var(--neon-magenta)_30%,transparent)] focus-visible:ring-magenta",
        blue: "border-electric text-electric bg-[linear-gradient(180deg,color-mix(in_oklab,var(--neon-blue)_16%,transparent),transparent)] [box-shadow:var(--glow-blue)] hover:text-foreground hover:bg-[color-mix(in_oklab,var(--neon-blue)_26%,transparent)] focus-visible:ring-electric",
        ghost:
          "border-violet/60 text-muted-foreground bg-void/40 hover:text-foreground hover:border-violet hover:[box-shadow:0_0_14px_color-mix(in_oklab,var(--neon-violet)_55%,transparent)] focus-visible:ring-violet",
        danger:
          "border-danger text-danger bg-[linear-gradient(180deg,color-mix(in_oklab,var(--neon-red)_22%,transparent),transparent)] [box-shadow:0_0_10px_color-mix(in_oklab,var(--neon-red)_80%,transparent)] hover:text-foreground focus-visible:ring-danger",
      },
      size: {
        sm: "px-3 py-1.5 text-[10px]",
        md: "px-5 py-2.5 text-xs sm:text-sm",
        lg: "px-8 py-4 text-base sm:text-lg",
        xl: "px-10 py-5 text-lg sm:text-2xl",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ArcadeButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof arcadeButton> {}

export function ArcadeButton({ className, variant, size, ...props }: ArcadeButtonProps) {
  return <button className={cn(arcadeButton({ variant, size }), className)} {...props} />;
}

/* ---------------- NeonPanel ---------------- */

export function NeonPanel({
  children,
  className,
  title,
  accent = "violet",
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  accent?: "violet" | "magenta" | "blue" | "lime" | "ember";
}) {
  const accentClass = {
    violet: "text-violet",
    magenta: "text-magenta",
    blue: "text-electric",
    lime: "text-lime",
    ember: "text-ember",
  }[accent];

  return (
    <section className={cn("neon-panel clip-hud crt-scan", className)}>
      {title ? (
        <header className="border-b border-border/70 px-4 py-2">
          <h2
            className={cn(
              "font-display text-[10px] font-black uppercase tracking-[0.32em] sm:text-xs",
              accentClass,
            )}
          >
            {title}
          </h2>
        </header>
      ) : null}
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

/* ---------------- Displays ---------------- */

export function ScoreDisplay({
  value,
  label,
  className,
  tone = "blue",
}: {
  value: ReactNode;
  label?: string;
  className?: string;
  tone?: "blue" | "lime" | "magenta" | "ember";
}) {
  const tones = {
    blue: "text-electric text-glow-blue",
    lime: "text-lime text-glow-lime",
    magenta: "text-magenta text-glow-magenta",
    ember: "text-ember text-glow-ember",
  };
  return (
    <div className={cn("text-center", className)}>
      {label ? (
        <p className="font-display text-[9px] uppercase tracking-[0.4em] text-muted-foreground">
          {label}
        </p>
      ) : null}
      <p className={cn("font-arcade text-2xl leading-tight sm:text-3xl", tones[tone])}>{value}</p>
    </div>
  );
}

export function CreditDisplay({ credits }: { credits: number }) {
  return (
    <div className="neon-panel clip-hud flex items-center gap-3 px-4 py-2">
      <span
        className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[image:var(--grad-sunset)] font-arcade text-[8px] text-void"
        aria-hidden
      >
        $
      </span>
      <div className="min-w-0 leading-none">
        <p className="font-display text-[8px] uppercase tracking-[0.34em] text-muted-foreground">
          Credits
        </p>
        <p className="font-arcade text-sm text-ember text-glow-ember">
          {credits.toLocaleString()}
        </p>
      </div>
    </div>
  );
}

/* ---------------- Field ---------------- */

export function ArcadeField({
  label,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-display text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
        {label}
      </span>
      <input
        className={cn(
          "clip-hud w-full border-2 border-violet/50 bg-void/70 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 transition-all focus:border-magenta focus:outline-none focus:[box-shadow:var(--glow-magenta)]",
          className,
        )}
        {...props}
      />
    </label>
  );
}

/* ---------------- CRT Overlay ---------------- */

export function CRTOverlay() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-50"
      style={{
        background:
          "radial-gradient(ellipse at center, transparent 58%, rgba(0,0,0,0.5) 100%)",
      }}
    />
  );
}


/* ---------------- Badges ---------------- */

export function StatusBadge({
  status,
}: {
  status: "CASHED OUT" | "CRASHED" | "NEW" | "TOP" | "LIVE";
}) {
  const map: Record<string, string> = {
    "CASHED OUT": "border-lime text-lime",
    CRASHED: "border-danger text-danger",
    NEW: "border-electric text-electric",
    TOP: "border-ember text-ember",
    LIVE: "border-magenta text-magenta",
  };
  return (
    <span
      className={cn(
        "clip-hud inline-block border px-2 py-1 font-arcade text-[7px] uppercase leading-none",
        map[status],
      )}
    >
      {status}
    </span>
  );
}
