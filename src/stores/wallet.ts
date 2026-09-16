import { ref } from "vue";
import { defineStore } from "pinia";
import { api, ApiError } from "@/lib/api";
import { useAuthStore } from "./auth";

export interface CreditTransaction {
  id: string;
  amount: number;
  type: string;
  balanceAfter: number;
  description: string;
  createdAtUtc: string;
}

export const useWalletStore = defineStore("wallet", () => {
  const transactions = ref<CreditTransaction[]>([]);
  const loading = ref(false);
  const topupError = ref("");

  async function fetchTransactions() {
    loading.value = true;
    try {
      transactions.value = await api.get<CreditTransaction[]>("/api/wallet/transactions?take=50");
    } finally {
      loading.value = false;
    }
  }

  async function demoTopup() {
    const auth = useAuthStore();
    topupError.value = "";
    try {
      const result = await api.post<{ creditBalance: number }>("/api/wallet/demo-topup");
      auth.applyCreditBalance(result.creditBalance);
      return true;
    } catch (err) {
      if (err instanceof ApiError) {
        topupError.value = err.message;
      } else {
        topupError.value = "Top-up failed.";
      }
      return false;
    }
  }

  return { transactions, loading, topupError, fetchTransactions, demoTopup };
});
