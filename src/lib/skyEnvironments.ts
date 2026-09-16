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

export { sunsetRunway, cloudCity, deepSpace };
