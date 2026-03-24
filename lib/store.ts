import { create } from 'zustand';

type Theme = 'light' | 'dark';

export type Notification = {
  id: number;
  type: 'request' | 'accepted' | 'message' | 'system';
  title: string;
  body: string;
  read: boolean;
  created_at: string;
};

type AppState = {
  // Auth
  userId: string | null;
  isLoggedIn: boolean;
  isPremium: boolean;

  // Profile
  profileComplete: boolean;

  // Nearby
  nearbyRadius: 1000 | 5000 | 20000 | 'anywhere';

  // Chat
  unreadChats: number;

  // Notifications
  notifications: Notification[];
  unreadNotifications: number;

  // UI
  theme: Theme;

  // Actions
  setUser: (id: string | null, premium?: boolean) => void;
  setProfileComplete: (val: boolean) => void;
  setNearbyRadius: (radius: AppState['nearbyRadius']) => void;
  setUnreadChats: (count: number) => void;
  addNotification: (notif: Notification) => void;
  markNotificationsRead: () => void;
  setNotifications: (list: Notification[]) => void;
  setTheme: (theme: Theme) => void;
};

export const useAppStore = create<AppState>((set) => ({
  userId: null,
  isLoggedIn: false,
  isPremium: false,
  profileComplete: false,

  nearbyRadius: 5000,
  unreadChats: 0,

  notifications: [],
  unreadNotifications: 0,
  theme: 'dark',

  setUser: (id, premium = false) => set({ userId: id, isLoggedIn: !!id, isPremium: premium }),
  setProfileComplete: (val) => set({ profileComplete: val }),
  setNearbyRadius: (radius) => set({ nearbyRadius: radius }),
  setUnreadChats: (count) => set({ unreadChats: count }),

  addNotification: (notif) =>
    set((state) => ({
      notifications: [notif, ...state.notifications],
      unreadNotifications: state.unreadNotifications + 1,
    })),

  setNotifications: (list) =>
    set({
      notifications: list,
      unreadNotifications: list.filter((n) => !n.read).length,
    }),

  markNotificationsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadNotifications: 0,
    })),

  setTheme: (theme) => set({ theme }),
}));
