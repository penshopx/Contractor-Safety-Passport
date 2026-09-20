import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  recoverQueue,
  syncQueuedActivities,
  type QueuedActivity,
} from './fieldActivityQueue.ts';

const activity = (
  clientId: string,
  localStatus: QueuedActivity['localStatus'] = 'pending',
): QueuedActivity => ({
  clientId,
  type: 'Inspection',
  title: `Inspeksi ${clientId}`,
  project: 'Proyek Uji',
  actor: 'Petugas Lapangan',
  status: 'complete',
  occurredAt: '2026-09-20T08:00:00.000Z',
  localStatus,
});

describe('antrean aktivitas lapangan', () => {
  it('memulihkan item yang sedang dikirim setelah aplikasi ditutup paksa', () => {
    const stored = JSON.stringify([
      activity('belum-dikirim'),
      activity('terputus-saat-kirim', 'syncing'),
      activity('sudah-dikirim', 'synced'),
    ]);

    const restored = recoverQueue(JSON.parse(stored) as QueuedActivity[]);

    assert.deepEqual(
      restored.map((item) => [item.clientId, item.localStatus]),
      [
        ['belum-dikirim', 'pending'],
        ['terputus-saat-kirim', 'pending'],
        ['sudah-dikirim', 'synced'],
      ],
    );
  });

  it('mempertahankan kegagalan parsial lalu hanya mengulang item yang belum sukses', async () => {
    let persisted = [activity('sukses'), activity('gagal-sementara')];
    const serverClientIds = new Set<string>();
    let failSecondItem = true;

    const mutate = async (
      updater: (current: QueuedActivity[]) => QueuedActivity[],
    ) => {
      persisted = structuredClone(updater(persisted));
      return persisted;
    };
    const send = async (item: QueuedActivity) => {
      if (item.clientId === 'gagal-sementara' && failSecondItem) {
        throw new Error('Koneksi terputus');
      }
      serverClientIds.add(item.clientId);
    };

    await syncQueuedActivities(persisted, mutate, send);

    assert.deepEqual(
      persisted.map((item) => item.localStatus),
      ['synced', 'failed'],
    );
    assert.equal(serverClientIds.size, 1);

    failSecondItem = false;
    await syncQueuedActivities(persisted, mutate, send);

    assert.deepEqual(
      persisted.map((item) => item.localStatus),
      ['synced', 'synced'],
    );
    assert.equal(serverClientIds.size, 2);
    assert.equal(
      persisted.filter((item) => item.localStatus !== 'synced').length,
      0,
    );
  });

  it('tidak menimpa item baru yang ditambahkan saat sinkronisasi berjalan', async () => {
    let persisted = [activity('sedang-dikirim')];
    const sent: string[] = [];
    let releaseFirst!: () => void;
    const firstBlocked = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    let firstStarted!: () => void;
    const started = new Promise<void>((resolve) => {
      firstStarted = resolve;
    });
    let mutationChain = Promise.resolve();
    const mutate = (
      updater: (current: QueuedActivity[]) => QueuedActivity[],
    ) => {
      let result = persisted;
      const operation = mutationChain.then(() => {
        result = structuredClone(updater(persisted));
        persisted = result;
      });
      mutationChain = operation;
      return operation.then(() => result);
    };

    const firstSync = syncQueuedActivities(persisted, mutate, async (item) => {
      firstStarted();
      await firstBlocked;
      sent.push(item.clientId);
    });
    await started;
    await mutate((current) => [activity('ditambahkan-saat-sync'), ...current]);
    releaseFirst();
    await firstSync;

    assert.deepEqual(
      persisted.map((item) => [item.clientId, item.localStatus]),
      [
        ['ditambahkan-saat-sync', 'pending'],
        ['sedang-dikirim', 'synced'],
      ],
    );

    await syncQueuedActivities(persisted, mutate, async (item) => {
      sent.push(item.clientId);
    });

    assert.deepEqual(
      persisted.map((item) => item.localStatus),
      ['synced', 'synced'],
    );
    assert.deepEqual(sent.sort(), ['ditambahkan-saat-sync', 'sedang-dikirim']);
  });
});