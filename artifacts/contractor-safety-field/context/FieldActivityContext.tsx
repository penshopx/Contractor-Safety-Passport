import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { useAuth } from '@clerk/expo';
import {
  getListFieldActivitiesQueryKey,
  getOrganizationContext,
  type FieldActivityInput,
  useCreateFieldActivity,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';

const STORAGE_PREFIX = 'safety-passport-field-queue-v2';
const LAST_ORG_PREFIX = 'safety-passport-field-last-org-v1';

export type QueueStatus = 'pending' | 'syncing' | 'synced' | 'failed';
export type QueuedActivity = FieldActivityInput & {
  localStatus: QueueStatus;
  lastError?: string;
};

type ContextValue = {
  queue: QueuedActivity[];
  isReady: boolean;
  isSyncing: boolean;
  addActivity: (activity: FieldActivityInput) => Promise<void>;
  syncNow: () => Promise<void>;
};

const FieldActivityContext = createContext<ContextValue | null>(null);

export function FieldActivityProvider({ children }: { children: React.ReactNode }) {
  const { userId, getToken } = useAuth();
  const [organizationId, setOrganizationId] = useState<string>();
  const [queue, setQueue] = useState<QueuedActivity[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const queueRef = useRef<QueuedActivity[]>([]);
  const isSyncingRef = useRef(false);
  const syncNowRef = useRef<() => Promise<void>>(async () => undefined);
  const createActivity = useCreateFieldActivity({
    request: organizationId ? { headers: { 'x-organization-id': organizationId } } : undefined,
  });
  const queryClient = useQueryClient();
  const storageKey = useMemo(
    () => userId && organizationId ? `${STORAGE_PREFIX}:${userId}:${organizationId}` : undefined,
    [organizationId, userId],
  );

  const updateQueue = useCallback((next: QueuedActivity[]) => {
    queueRef.current = next;
    setQueue(next);
  }, []);

  useEffect(() => {
    updateQueue([]);
    setIsReady(false);
    setOrganizationId(undefined);
    if (!userId) return;
    let cancelled = false;
    void AsyncStorage.getItem(`${LAST_ORG_PREFIX}:${userId}`).then((savedOrganizationId) => {
      if (!cancelled && savedOrganizationId) setOrganizationId(savedOrganizationId);
    });
    void getToken()
      .then((token) => getOrganizationContext(token ? { headers: { Authorization: `Bearer ${token}` } } : undefined))
      .then((context) => {
        if (cancelled || !context) return;
        setOrganizationId(context.organizationId);
        void AsyncStorage.setItem(`${LAST_ORG_PREFIX}:${userId}`, context.organizationId);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [getToken, updateQueue, userId]);

  useEffect(() => {
    if (!storageKey) return;
    setIsReady(false);
    updateQueue([]);
    AsyncStorage.getItem(storageKey)
      .then((value) => {
        const stored = value ? (JSON.parse(value) as QueuedActivity[]) : [];
        updateQueue(stored.map((item) => item.localStatus === 'syncing' ? { ...item, localStatus: 'pending' } : item));
      })
      .finally(() => setIsReady(true));
  }, [storageKey, updateQueue]);

  const persist = useCallback(async (next: QueuedActivity[]) => {
    if (!storageKey) throw new Error('Ruang kerja belum tersedia');
    updateQueue(next);
    await AsyncStorage.setItem(storageKey, JSON.stringify(next));
  }, [storageKey, updateQueue]);

  const syncNow = useCallback(async () => {
    if (!isReady || !storageKey || isSyncingRef.current) return;
    const pending = queueRef.current.filter((item) => item.localStatus !== 'synced');
    if (pending.length === 0) return;
    isSyncingRef.current = true;
    setIsSyncing(true);
    let next = [...queueRef.current];
    try {
      for (const item of pending) {
        next = next.map((entry) =>
          entry.clientId === item.clientId ? { ...entry, localStatus: 'syncing', lastError: undefined } : entry,
        );
        await persist(next);
        try {
          await createActivity.mutateAsync({ data: item });
          next = next.map((entry) =>
            entry.clientId === item.clientId ? { ...entry, localStatus: 'synced', lastError: undefined } : entry,
          );
        } catch (error) {
          next = next.map((entry) =>
            entry.clientId === item.clientId
              ? { ...entry, localStatus: 'failed', lastError: error instanceof Error ? error.message : 'Belum ada koneksi' }
              : entry,
          );
        }
        await persist(next);
      }
      await queryClient.invalidateQueries({ queryKey: getListFieldActivitiesQueryKey() });
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
    }
  }, [createActivity, isReady, persist, queryClient, storageKey]);

  useEffect(() => {
    syncNowRef.current = syncNow;
  }, [syncNow]);

  const addActivity = useCallback(async (activity: FieldActivityInput) => {
    const next: QueuedActivity[] = [{ ...activity, localStatus: 'pending' }, ...queueRef.current];
    await persist(next);
    await syncNowRef.current();
  }, [persist]);

  useEffect(() => {
    if (!isReady) return;
    void syncNowRef.current();
    const networkSubscription = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable !== false) void syncNowRef.current();
    });
    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void syncNowRef.current();
    });
    return () => {
      networkSubscription();
      appStateSubscription.remove();
    };
  }, [isReady, storageKey]);

  const value = useMemo(
    () => ({ queue, isReady, isSyncing, addActivity, syncNow }),
    [queue, isReady, isSyncing, addActivity, syncNow],
  );
  return <FieldActivityContext.Provider value={value}>{children}</FieldActivityContext.Provider>;
}

export function useFieldActivities() {
  const value = useContext(FieldActivityContext);
  if (!value) throw new Error('useFieldActivities must be used inside FieldActivityProvider');
  return value;
}