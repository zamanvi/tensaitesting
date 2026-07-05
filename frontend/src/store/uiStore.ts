import { create } from 'zustand';

type AppTab = 'ongoing' | 'new';

interface UiStore {
  appTab: AppTab;
  setAppTab: (tab: AppTab) => void;
}

export const useUiStore = create<UiStore>(set => ({
  appTab: 'ongoing',
  setAppTab: tab => set({ appTab: tab }),
}));
