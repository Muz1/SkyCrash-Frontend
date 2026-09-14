import { useSyncExternalStore } from "react";
import type { SkinId } from "@/components/sky/SkyEnvironment";
import type { CraftId } from "@/lib/craft";

export type FlightStatus = "CASHED OUT" | "CRASHED";

export interface Flight {
  id: number;
  bet: number;
  multiplier: number;
  result: number;
  status: FlightStatus;
  date: string;
}

interface GameState {
  credits: number;
  skin: SkinId;
  craft: CraftId;
  flights: Flight[];
  pilot: string;
}

const seedFlights: Flight[] = [
  { id: 8291, bet: 250, multiplier: 3.42, result: 605, status: "CASHED OUT", date: "24 AUG" },
  { id: 8290, bet: 250, multiplier: 2.18, result: -250, status: "CRASHED", date: "24 AUG" },
  { id: 8289, bet: 500, multiplier: 5.12, result: 2060, status: "CASHED OUT", date: "23 AUG" },
  { id: 8288, bet: 100, multiplier: 1.36, result: -100, status: "CRASHED", date: "23 AUG" },
  { id: 8287, bet: 1000, multiplier: 1.78, result: 780, status: "CASHED OUT", date: "22 AUG" },
];

let state: GameState = {
  credits: 1250,
  skin: "sunset-runway",
  craft: "jet",
  flights: seedFlights,
  pilot: "NOVAPILOT",
};

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export const gameStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  get: () => state,
  setSkin(skin: SkinId) {
    state = { ...state, skin };
    emit();
  },
  setCraft(craft: CraftId) {
    state = { ...state, craft };
    emit();
  },
  addCredits(amount: number) {
    state = { ...state, credits: state.credits + amount };
    emit();
  },
  placeBet(bet: number) {
    state = { ...state, credits: state.credits - bet };
    emit();
  },
  recordFlight(flight: Omit<Flight, "id" | "date">) {
    const entry: Flight = {
      ...flight,
      id: (state.flights[0]?.id ?? 8000) + 1,
      date: new Date()
        .toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
        .toUpperCase(),
    };
    state = {
      ...state,
      flights: [entry, ...state.flights],
      credits: flight.status === "CASHED OUT" ? state.credits + flight.result : state.credits,
    };
    emit();
  },
};

export function useGame() {
  return useSyncExternalStore(
    gameStore.subscribe,
    gameStore.get,
    gameStore.get,
  );
}

export const BET_STEPS = [100, 250, 500, 1000, 2000, 5000] as const;

export function formatBet(v: number) {
  return v >= 1000 ? `${v / 1000}K` : `${v}`;
}
