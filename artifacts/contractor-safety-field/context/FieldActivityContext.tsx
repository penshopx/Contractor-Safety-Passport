import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { useAuth } from '@clerk/expo';
import {
  getListFieldActivitiesQueryKey,
  getOrganizationContext,
  requestEvidenceUploadUrl,
  type FieldActivityInput,
  useCreateFieldActivity,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { fetch as expoFetch } from 'expo/fetch';
import {
  applyQueueRetention,
  recoverQueue,
  syncQueuedActivities,
  type QueuedActivity,
  type QueueStatus,
} from './fieldActivityQueue';

const STORAGE_PREFIX = 'safety-passport-field-queue-v2';
const LAST_ORG_PREFIX = 'safety-passport-field-last-org-v1';

export type { QueuedActivity, QueueStatus } from './fieldActivityQueue';
export type OfflineFieldActivityInput = FieldActivityInput & {
  localPhotoUri?: string;
  photoContentType?: 'image/jpeg' | 'image/png' | 'image/webp';
};

type ContextValue = {
  queue: QueuedActivity[];
  isReady: boolean;
  isSyncing: boolean;
  addActivity: (activity: OfflineFieldActivityInput) => Promise<void>;
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
  const persistChainRef = useRef<Promise<void>>(Promise.resolve());
  const isSyncingRef = useRef(false);
  const syncRequestedRef = useRef(false);
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
      .then(async (value) => {
        const stored = value ? (JSON.parse(value) as QueuedActivity[]) : [];
        const recovered = recoverQueue(stored);
        updateQueue(recovered);
        if (recovered.length !== stored.length || recovered.some((item, index) => item !== stored[index])) {
          await AsyncStorage.setItem(storageKey, JSON.stringify(recovered));
        }
      })
      .finally(() => setIsReady(true));
  }, [storageKey, updateQueue]);

  const mutateQueue = useCallback(async (
    updater: (current: QueuedActivity[]) => QueuedActivity[],
  ) => {
    if (!storageKey) throw new Error('Ruang kerja belum tersedia');
    let result = queueRef.current;
    const write = async () => {
      result = applyQueueRetention(updater(queueRef.current));
      updateQueue(result);
      await AsyncStorage.setItem(storageKey, JSON.stringify(result));
    };
    const operation = persistChainRef.current.then(write, write);
    persistChainRef.current = operation.then(
      () => undefined,
      () => undefined,
    );
    await operation;
    return result;
  }, [storageKey, updateQueue]);

  const syncNow = useCallback(async () => {
    if (!isReady || !storageKey) return;
    if (isSyncingRef.current) {
      syncRequestedRef.current = true;
      return;
    }
    if (!queueRef.current.some((item) => item.localStatus !== 'synced')) return;
    isSyncingRef.current = true;
    setIsSyncing(true);
    try {
      await syncQueuedActivities(
        queueRef.current,
        mutateQueue,
        async (item, checkpoint) => {
          let photoObjectPath = item.photoObjectPath;
          const legacyPhotoDataUrl = (item as QueuedActivity & { photoDataUrl?: string }).photoDataUrl;
          const photoSource = item.localPhotoUri ?? legacyPhotoDataUrl;
          if (photoSource && !photoObjectPath) {
            const photoResponse = await expoFetch(photoSource);
            if (!photoResponse.ok) throw new Error('Foto lokal tidak dapat dibaca');
            const photoBlob = await photoResponse.blob();
            const legacyContentType = legacyPhotoDataUrl?.match(/^data:(image\/(?:jpeg|png|webp));/)?.[1];
            const contentType = item.photoContentType
              ?? (legacyContentType === 'image/png' || legacyContentType === 'image/webp' ? legacyContentType : 'image/jpeg');
            const target = await requestEvidenceUploadUrl(
              {
                name: `bukti-${item.clientId}.${contentType.split('/')[1]}`,
                size: photoBlob.size,
                contentType,
              },
              { headers: { 'x-organization-id': organizationId! } },
            );
            const uploadResponse = await expoFetch(target.uploadURL, {
              method: 'PUT',
              headers: { 'Content-Type': contentType },
              body: photoBlob,
            });
            if (!uploadResponse.ok) throw new Error('Unggahan foto belum berhasil');
            photoObjectPath = target.objectPath;
            await checkpoint({ photoObjectPath });
          }
          const {
            localPhotoUri: _localPhotoUri,
            photoContentType: _photoContentType,
            photoDataUrl: _photoDataUrl,
            localStatus: _localStatus,
            lastError: _lastError,
            ...activityData
          } = { ...(item as QueuedActivity & { photoDataUrl?: string }), photoObjectPath };
          await createActivity.mutateAsync({ data: activityData });
        },
      );
      await queryClient.invalidateQueries({ queryKey: getListFieldActivitiesQueryKey() });
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
      if (syncRequestedRef.current) {
        syncRequestedRef.current = false;
        void syncNowRef.current();
      }
    }
  }, [createActivity, isReady, mutateQueue, organizationId, queryClient, storageKey]);

  useEffect(() => {
    syncNowRef.current = syncNow;
  }, [syncNow]);

  const addActivity = useCallback(async (activity: OfflineFieldActivityInput) => {
    await mutateQueue((current) => [
      { ...activity, localStatus: 'pending' },
      ...current,
    ]);
    await syncNowRef.current();
  }, [mutateQueue]);

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