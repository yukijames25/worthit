import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { FontScale, Locale, ThemeMode } from '../types';

interface SettingsState {
  theme: ThemeMode;
  fontScale: FontScale;
  locale: Locale;
  /** 解決済みのモード（'system' を実際の light/dark に展開した値）。 */
  resolvedTheme: 'light' | 'dark';
}

interface SettingsActions {
  setTheme: (mode: ThemeMode) => void;
  setFontScale: (scale: FontScale) => void;
  setLocale: (locale: Locale) => void;
}

const SettingsContext = createContext<(SettingsState & SettingsActions) | null>(
  null,
);

const THEME_KEY = 'spendtype.theme';
const FONT_KEY = 'spendtype.fontScale';
const LOCALE_KEY = 'worthit.locale';

function readTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  const v = window.localStorage.getItem(THEME_KEY);
  if (v === 'light' || v === 'dark' || v === 'system') return v;
  return 'system';
}

function readFontScale(): FontScale {
  if (typeof window === 'undefined') return 'md';
  const v = window.localStorage.getItem(FONT_KEY);
  if (v === 'sm' || v === 'md' || v === 'lg') return v;
  return 'md';
}

function readLocale(): Locale {
  if (typeof window === 'undefined') return 'ja';
  const v = window.localStorage.getItem(LOCALE_KEY);
  if (v === 'ja' || v === 'en') return v;
  // 初回はブラウザの言語から推測
  const nav = (window.navigator?.language || 'ja').toLowerCase();
  return nav.startsWith('ja') ? 'ja' : 'en';
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => readTheme());
  const [fontScale, setFontScaleState] = useState<FontScale>(() =>
    readFontScale(),
  );
  const [locale, setLocaleState] = useState<Locale>(() => readLocale());
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() =>
    getSystemTheme(),
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) =>
      setSystemTheme(e.matches ? 'dark' : 'light');
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);

  const resolvedTheme: 'light' | 'dark' =
    theme === 'system' ? systemTheme : theme;

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.classList.toggle('dark', resolvedTheme === 'dark');
    root.classList.remove('font-scale-sm', 'font-scale-md', 'font-scale-lg');
    root.classList.add(`font-scale-${fontScale}`);
    root.setAttribute('lang', locale);
    const meta = document.querySelector(
      'meta[name="theme-color"]',
    ) as HTMLMetaElement | null;
    if (meta) {
      meta.content = resolvedTheme === 'dark' ? '#0a0c12' : '#f5f1ff';
    }
  }, [resolvedTheme, fontScale, locale]);

  const setTheme = useCallback((m: ThemeMode) => {
    setThemeState(m);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(THEME_KEY, m);
    }
  }, []);

  const setFontScale = useCallback((s: FontScale) => {
    setFontScaleState(s);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(FONT_KEY, s);
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LOCALE_KEY, l);
    }
  }, []);

  const value = useMemo(
    () => ({
      theme,
      fontScale,
      locale,
      resolvedTheme,
      setTheme,
      setFontScale,
      setLocale,
    }),
    [theme, fontScale, locale, resolvedTheme, setTheme, setFontScale, setLocale],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
