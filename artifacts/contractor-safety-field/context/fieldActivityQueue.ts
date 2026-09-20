import type { FieldActivityInput } from '@workspace/api-client-react';

export type QueueStatus = 'pending' | 'syncing' | 'synced' | 'failed';
export type QueuedActivity = FieldActivityInput & {
  localPhotoUri?: string;
  photoContentType?: 'image/jpeg' | 'image/png' | 'image/webp';
  localStatus: QueueStatus;
  lastError?: string;
};

export function recoverQueue(items: QueuedActivity[]): QueuedActivity[] {
  return items.map((item) =>
    item.localStatus === 'syncing'
      ? { ...item, localStatus: 'pending', lastError: undefined }
      : item,
  );
}

type SyncItem = (
  item: QueuedActivity,
  checkpoint: (patch: Partial<QueuedActivity>) => Promise<void>,
) => Promise<void>;

export type MutateQueue = (
  updater: (current: QueuedActivity[]) => QueuedActivity[],
) => Promise<QueuedActivity[]>;

export async function syncQueuedActivities(
  queue: QueuedActivity[],
  mutateQueue: MutateQueue,
  syncItem: SyncItem,
): Promise<QueuedActivity[]> {
  let latest = queue;
  const pendingClientIds = queue
    .filter((item) => item.localStatus !== 'synced')
    .map((item) => item.clientId);

  for (const clientId of pendingClientIds) {
    latest = await mutateQueue((current) =>
      current.map((entry) =>
        entry.clientId === clientId
          ? { ...entry, localStatus: 'syncing', lastError: undefined }
          : entry,
      ),
    );

    const current = latest.find((entry) => entry.clientId === clientId);
    if (!current) continue;

    try {
      await syncItem(current, async (patch) => {
        latest = await mutateQueue((queueNow) =>
          queueNow.map((entry) =>
            entry.clientId === clientId ? { ...entry, ...patch } : entry,
          ),
        );
      });
      latest = await mutateQueue((queueNow) =>
        queueNow.map((entry) =>
          entry.clientId === clientId
            ? { ...entry, localStatus: 'synced', lastError: undefined }
            : entry,
        ),
      );
    } catch (error) {
      latest = await mutateQueue((queueNow) =>
        queueNow.map((entry) =>
          entry.clientId === clientId
            ? {
                ...entry,
                localStatus: 'failed',
                lastError:
                  error instanceof Error ? error.message : 'Belum ada koneksi',
              }
            : entry,
        ),
      );
    }
  }

  return latest;
}