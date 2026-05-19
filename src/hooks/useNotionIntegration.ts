import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export interface NotionIntegration {
  apiToken: string;
  databaseId: string;
  enabled: boolean;
  lastSynced: number | null;
  lastError: string | null;
}

interface State {
  integration: NotionIntegration | null;
  loading: boolean;
  save: (input: { apiToken: string; databaseId: string }) => Promise<void>;
  toggle: (enabled: boolean) => Promise<void>;
  disconnect: () => Promise<void>;
  refresh: () => void;
}

export function useNotionIntegration(): State {
  const { mode, user } = useAuth();
  const cloudReady = mode === 'authenticated' && !!supabase && !!user;
  const userId = user?.id ?? null;

  const [integration, setIntegration] = useState<NotionIntegration | null>(null);
  const [loading, setLoading] = useState(cloudReady);
  const [bump, setBump] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!cloudReady || !supabase || !userId) {
        setIntegration(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data } = await supabase
        .from('notion_integrations')
        .select('api_token, database_id, enabled, last_synced, last_error')
        .eq('user_id', userId)
        .maybeSingle();
      if (cancelled) return;
      setIntegration(
        data
          ? {
              apiToken: data.api_token,
              databaseId: data.database_id,
              enabled: !!data.enabled,
              lastSynced: data.last_synced
                ? new Date(data.last_synced).getTime()
                : null,
              lastError: data.last_error,
            }
          : null,
      );
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [cloudReady, userId, bump]);

  const save = useCallback(
    async (input: { apiToken: string; databaseId: string }) => {
      if (!supabase || !userId) return;
      await supabase.from('notion_integrations').upsert(
        {
          user_id: userId,
          api_token: input.apiToken,
          database_id: input.databaseId,
          enabled: true,
          last_error: null,
        },
        { onConflict: 'user_id' },
      );
      setBump((n) => n + 1);
    },
    [userId],
  );

  const toggle = useCallback(
    async (enabled: boolean) => {
      if (!supabase || !userId) return;
      await supabase
        .from('notion_integrations')
        .update({ enabled })
        .eq('user_id', userId);
      setBump((n) => n + 1);
    },
    [userId],
  );

  const disconnect = useCallback(async () => {
    if (!supabase || !userId) return;
    await supabase.from('notion_integrations').delete().eq('user_id', userId);
    setBump((n) => n + 1);
  }, [userId]);

  const refresh = useCallback(() => setBump((n) => n + 1), []);

  return useMemo(
    () => ({ integration, loading, save, toggle, disconnect, refresh }),
    [integration, loading, save, toggle, disconnect, refresh],
  );
}
