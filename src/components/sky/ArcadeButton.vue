<script setup lang="ts">
import { computed } from "vue";
import { cva, type VariantProps } from "class-variance-authority";
import { useSoundStore } from "@/stores/sound";

const sound = useSoundStore();

const arcadeButton = cva(
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

export type ArcadeButtonVariant = NonNullable<VariantProps<typeof arcadeButton>["variant"]>;
export type ArcadeButtonSize = NonNullable<VariantProps<typeof arcadeButton>["size"]>;

const props = withDefaults(
  defineProps<{ variant?: ArcadeButtonVariant; size?: ArcadeButtonSize }>(),
  { variant: "primary", size: "md" },
);

const classes = computed(() => arcadeButton({ variant: props.variant, size: props.size }));
</script>

<template>
  <button :class="classes" @click="sound.playSelect()">
    <slot />
  </button>
</template>
