import { ref } from "vue";
import { defineStore } from "pinia";
import bgmTrack1 from "@/assets/audio/bgm.m4a";
import bgmTrack2 from "@/assets/audio/bgm-2.m4a";

const MUTE_STORAGE_KEY = "skycrash:muted";
const PLAYLIST = [bgmTrack1, bgmTrack2];

export const useSoundStore = defineStore("sound", () => {
  const muted = ref(localStorage.getItem(MUTE_STORAGE_KEY) === "true");

  let bgm: HTMLAudioElement | null = null;
  let trackIndex = 0;
  let audioCtx: AudioContext | null = null;
  let musicRequested = false;

  // Plays the playlist back-to-back, looping to the first track after the last.
  function getBgm() {
    if (!bgm) {
      bgm = new Audio(PLAYLIST[trackIndex]);
      bgm.volume = 0.35;
      bgm.addEventListener("ended", () => {
        trackIndex = (trackIndex + 1) % PLAYLIST.length;
        if (!bgm) return;
        bgm.src = PLAYLIST[trackIndex]!;
        if (!muted.value) bgm.play().catch(() => undefined);
      });
    }
    return bgm;
  }

  // Sound effects are synthesized so they need no extra asset files.
  function getContext() {
    if (!audioCtx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtx = new Ctor();
    }
    if (audioCtx.state === "suspended") void audioCtx.resume();
    return audioCtx;
  }

  // Browsers block audio until a user gesture; call this from the first click/tap.
  function primeAudio() {
    musicRequested = true;
    if (!muted.value) getBgm().play().catch(() => undefined);
    getContext();
  }

  function setMuted(value: boolean) {
    muted.value = value;
    localStorage.setItem(MUTE_STORAGE_KEY, String(value));
    if (value) {
      bgm?.pause();
    } else if (musicRequested) {
      getBgm().play().catch(() => undefined);
    }
  }

  function toggleMute() {
    setMuted(!muted.value);
  }

  function tone(options: {
    frequency: number;
    duration: number;
    type?: OscillatorType;
    peakGain?: number;
    endFrequency?: number;
  }) {
    if (muted.value) return;
    try {
      const ctx = getContext();
      const now = ctx.currentTime;
      const { frequency, duration, type = "sine", peakGain = 0.16, endFrequency } = options;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, now);
      if (endFrequency) {
        osc.frequency.exponentialRampToValueAtTime(endFrequency, now + duration);
      }

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(peakGain, now + Math.min(0.05, duration / 4));
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration + 0.05);
    } catch {
      // Web Audio can be unavailable (e.g. autoplay policy) — sound effects are non-critical.
    }
  }

  function playSelect() {
    tone({ frequency: 720, duration: 0.09, type: "square", peakGain: 0.12 });
  }

  function playTakeoff() {
    tone({ frequency: 130, endFrequency: 760, duration: 0.65, type: "sawtooth", peakGain: 0.2 });
  }

  return {
    muted,
    primeAudio,
    setMuted,
    toggleMute,
    playSelect,
    playTakeoff,
  };
});
