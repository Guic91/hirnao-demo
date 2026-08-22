"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Locale } from "./i18n";
import { getStoredUser, type UserData } from "./api";

interface AppState {
  locale: Locale;
  setLocale: (l: Locale) => void;
  user: UserData | null;
  setUser: (u: UserData | null) => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("fr");
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    const stored = getStoredUser<UserData>();
    if (stored) {
      setUser(stored);
      setLocale(stored.locale);
    }
  }, []);

  return (
    <AppContext.Provider value={{ locale, setLocale, user, setUser }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
