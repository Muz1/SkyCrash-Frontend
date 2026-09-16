import { ref } from "vue";
import { defineStore } from "pinia";
import type { HubConnection } from "@microsoft/signalr";
import { HubConnectionState } from "@microsoft/signalr";
import { createGameHubConnection } from "@/lib/signalr";
import { useAuthStore } from "./auth";

export type RoundStatus = "Unknown" | "Waiting" | "Running" | "Crashed";
export type ConnectionState = "disconnected" | "connecting" | "connected";

interface RoundSnapshot {
  roundId: string;
  roundNumber: number;
  status: RoundStatus;
  serverSeedHash: string;
  currentMultiplier: number;
  crashMultiplier: number | null;
  countdownSeconds: number;
}

interface RoundWaitingPayload {
  roundId: string;
  roundNumber: number;
  serverSeedHash: string;
  countdownSeconds: number;
}

interface RoundCrashedPayload {
  roundId: string;
  crashMultiplier: number;
  serverSeed: string;
  serverSeedHash: string;
}

interface BetConfirmedPayload {
  betId: string;
  amount: number;
  newBalance: number;
}

interface CashOutConfirmedPayload {
  betId: string;
  cashOutMultiplier: number;
  payout: number;
  newBalance: number;
}

export const useRoundStore = defineStore("round", () => {
  const connectionState = ref<ConnectionState>("disconnected");
  const status = ref<RoundStatus>("Unknown");
  const roundId = ref<string | null>(null);
  const roundNumber = ref<number | null>(null);
  const serverSeedHash = ref<string | null>(null);
  const multiplier = ref(1);
  const crashMultiplier = ref<number | null>(null);
  const countdownSeconds = ref(0);

  const myBetId = ref<string | null>(null);
  const myBetAmount = ref<number | null>(null);
  const myCashOut = ref<{ cashOutMultiplier: number; payout: number } | null>(null);

  const betRejectedMessage = ref("");
  const cashOutRejectedMessage = ref("");

  let connection: HubConnection | null = null;
  let countdownTimer: ReturnType<typeof setInterval> | null = null;

  function stopCountdown() {
    if (countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
  }

  function startCountdown(seconds: number) {
    stopCountdown();
    countdownSeconds.value = seconds;
    countdownTimer = setInterval(() => {
      countdownSeconds.value = Math.max(0, countdownSeconds.value - 1);
      if (countdownSeconds.value === 0) stopCountdown();
    }, 1000);
  }

  function resetRoundBetState() {
    myBetId.value = null;
    myBetAmount.value = null;
    myCashOut.value = null;
    betRejectedMessage.value = "";
    cashOutRejectedMessage.value = "";
  }

  async function connect() {
    if (connection) return;
    const auth = useAuthStore();
    connection = createGameHubConnection();

    connection.on("RoundSnapshot", (snapshot: RoundSnapshot) => {
      status.value = snapshot.status;
      roundId.value = snapshot.roundId;
      roundNumber.value = snapshot.roundNumber;
      serverSeedHash.value = snapshot.serverSeedHash;
      multiplier.value = snapshot.currentMultiplier;
      crashMultiplier.value = snapshot.crashMultiplier;
      if (snapshot.status === "Waiting") startCountdown(snapshot.countdownSeconds);
    });

    connection.on("RoundWaiting", (payload: RoundWaitingPayload) => {
      status.value = "Waiting";
      roundId.value = payload.roundId;
      roundNumber.value = payload.roundNumber;
      serverSeedHash.value = payload.serverSeedHash;
      multiplier.value = 1;
      crashMultiplier.value = null;
      resetRoundBetState();
      startCountdown(payload.countdownSeconds);
    });

    connection.on("RoundStarted", () => {
      status.value = "Running";
      multiplier.value = 1;
      stopCountdown();
    });

    connection.on("MultiplierTick", (payload: { roundId: string; multiplier: number }) => {
      multiplier.value = payload.multiplier;
    });

    connection.on("RoundCrashed", (payload: RoundCrashedPayload) => {
      status.value = "Crashed";
      crashMultiplier.value = payload.crashMultiplier;
      multiplier.value = payload.crashMultiplier;
    });

    connection.on("BetConfirmed", (payload: BetConfirmedPayload) => {
      myBetId.value = payload.betId;
      myBetAmount.value = payload.amount;
      betRejectedMessage.value = "";
      auth.applyCreditBalance(payload.newBalance);
    });

    connection.on("BetRejected", (payload: { message: string }) => {
      betRejectedMessage.value = payload.message;
    });

    connection.on("CashOutConfirmed", (payload: CashOutConfirmedPayload) => {
      myCashOut.value = { cashOutMultiplier: payload.cashOutMultiplier, payout: payload.payout };
      cashOutRejectedMessage.value = "";
      auth.applyCreditBalance(payload.newBalance);
    });

    connection.on("CashOutRejected", (payload: { message: string }) => {
      cashOutRejectedMessage.value = payload.message;
    });

    connection.onreconnecting(() => (connectionState.value = "connecting"));
    connection.onreconnected(() => (connectionState.value = "connected"));
    connection.onclose(() => (connectionState.value = "disconnected"));

    connectionState.value = "connecting";
    try {
      await connection.start();
      connectionState.value = "connected";
    } catch {
      connectionState.value = "disconnected";
    }
  }

  async function disconnect() {
    stopCountdown();
    if (connection && connection.state !== HubConnectionState.Disconnected) {
      await connection.stop();
    }
    connection = null;
    connectionState.value = "disconnected";
  }

  async function placeBet(amount: number) {
    betRejectedMessage.value = "";
    if (!connection || connection.state !== HubConnectionState.Connected) {
      betRejectedMessage.value = "Not connected to the game server.";
      return;
    }
    try {
      await connection.invoke("PlaceBet", amount);
    } catch {
      betRejectedMessage.value = "Could not place bet — try again.";
    }
  }

  async function cashOut() {
    cashOutRejectedMessage.value = "";
    if (!connection || connection.state !== HubConnectionState.Connected) {
      cashOutRejectedMessage.value = "Not connected to the game server.";
      return;
    }
    try {
      await connection.invoke("CashOut");
    } catch {
      cashOutRejectedMessage.value = "Could not cash out — try again.";
    }
  }

  return {
    connectionState,
    status,
    roundId,
    roundNumber,
    serverSeedHash,
    multiplier,
    crashMultiplier,
    countdownSeconds,
    myBetId,
    myBetAmount,
    myCashOut,
    betRejectedMessage,
    cashOutRejectedMessage,
    connect,
    disconnect,
    placeBet,
    cashOut,
  };
});
