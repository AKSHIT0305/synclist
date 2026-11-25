import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const WIDGET_INTRO_KEY = 'synclist.widgetIntroSeen.v1';

type OnboardingState = {
  /** Null until read from storage. Per device: the widget prompt is about this phone's home screen. */
  widgetIntroSeen: boolean | null;
  load: () => Promise<void>;
  markWidgetIntroSeen: () => Promise<void>;
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  widgetIntroSeen: null,
  load: async () => {
    try {
      const value = await AsyncStorage.getItem(WIDGET_INTRO_KEY);
      set({ widgetIntroSeen: value === 'true' });
    } catch {
      set({ widgetIntroSeen: false });
    }
  },
  markWidgetIntroSeen: async () => {
    set({ widgetIntroSeen: true });
    await AsyncStorage.setItem(WIDGET_INTRO_KEY, 'true');
  },
}));
