import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { api, ApiError, setAuthToken } from "@/lib/api";

export interface PlayerProfile {
  playerId: string;
  username: string;
  email: string;
  creditBalance: number;
  memberSinceUtc: string;
  isAdmin: boolean;
}

interface AuthResponse {
  token: string;
  playerId: string;
  username: string;
  expiresAtUtc: string;
}

const TOKEN_KEY = "skycrash_token";

export const useAuthStore = defineStore("auth", () => {
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY));
  const player = ref<PlayerProfile | null>(null);
  const ready = ref(false);

  if (token.value) setAuthToken(token.value);

  const isAuthenticated = computed(() => token.value !== null && player.value !== null);

  function setToken(next: string | null) {
    token.value = next;
    setAuthToken(next);
    if (next) localStorage.setItem(TOKEN_KEY, next);
    else localStorage.removeItem(TOKEN_KEY);
  }

  async function fetchProfile() {
    player.value = await api.get<PlayerProfile>("/api/players/me");
  }

  async function login(username: string, password: string) {
    const response = await api.post<AuthResponse>("/api/auth/login", { username, password });
    setToken(response.token);
    await fetchProfile();
  }

  async function register(username: string, email: string, password: string) {
    const response = await api.post<AuthResponse>("/api/auth/register", {
      username,
      email,
      password,
    });
    setToken(response.token);
    await fetchProfile();
  }

  function logout() {
    setToken(null);
    player.value = null;
  }

  function applyCreditBalance(balance: number) {
    if (player.value) player.value.creditBalance = balance;
  }

  /** Restores the session from a stored token on app start. */
  async function restore() {
    if (token.value) {
      try {
        await fetchProfile();
      } catch (err) {
        if (err instanceof ApiError && (err.status === 401 || err.status === 404)) {
          setToken(null);
          player.value = null;
        }
      }
    }
    ready.value = true;
  }

  return {
    token,
    player,
    ready,
    isAuthenticated,
    login,
    register,
    logout,
    fetchProfile,
    applyCreditBalance,
    restore,
  };
});
