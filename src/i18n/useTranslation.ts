import { useMemo } from 'react';
import { useSettings } from '../context/SettingsContext';
import { format, type Strings, TRANSLATIONS } from './translations';

export interface Translator {
  t: Strings;
  /** プレースホルダ補間ヘルパー。t.someKey と vars を渡す。 */
  f: (template: string, vars?: Record<string, string | number>) => string;
}

export function useTranslation(): Translator {
  const { locale } = useSettings();
  return useMemo(
    () => ({
      t: TRANSLATIONS[locale],
      f: format,
    }),
    [locale],
  );
}
