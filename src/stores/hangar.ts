import { ref } from "vue";
import { defineStore } from "pinia";
import { api } from "@/lib/api";
import type { CraftId } from "@/lib/craft";
import type { SkinId } from "@/lib/skyEnvironments";

interface HangarLoadoutResponse {
  craftId: string;
  skinId: string;
}

export const useHangarStore = defineStore("hangar", () => {
  const craftId = ref<CraftId>("jet");
  const skinId = ref<SkinId>("sunset-runway");
  const loaded = ref(false);

  async function fetchLoadout() {
    const response = await api.get<HangarLoadoutResponse>("/api/hangar/loadout");
    craftId.value = response.craftId as CraftId;
    skinId.value = response.skinId as SkinId;
    loaded.value = true;
  }

  async function equip(nextCraftId: CraftId, nextSkinId: SkinId) {
    const response = await api.put<HangarLoadoutResponse>("/api/hangar/loadout", {
      craftId: nextCraftId,
      skinId: nextSkinId,
    });
    craftId.value = response.craftId as CraftId;
    skinId.value = response.skinId as SkinId;
  }

  return { craftId, skinId, loaded, fetchLoadout, equip };
});
