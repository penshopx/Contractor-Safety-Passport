import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  applyQueueRetention,
  dedupeByKey,
  recoverQueue,
  SYNCED_ACTIVITY_RETENTION_LIMIT,
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
  it('membatasi riwayat tersinkron tanpa menghapus item yang masih perlu ditangani', () => {
    const unresolved = [
      activity('pending', 'pending'),
      activity('failed', 'failed'),
      activity('syncing', 'syncing'),
    ];
    const synced = Array.from(
      { length: SYNCED_ACTIVITY_RETENTION_LIMIT + 2 },
      (_, index) => activity(`synced-${index}`, 'synced'),
    );

    const retained = applyQueueRetention([
      synced[0]!,
      unresolved[0]!,
      ...synced.slice(1),
      unresolved[1]!,
      unresolved[2]!,
    ]);

    assert.equal(
      retained.filter((item) => item.localStatus === 'synced').length,
      SYNCED_ACTIVITY_RETENTION_LIMIT,
    );
    assert.deepEqual(
      retained.filter((item) => item.localStatus !== 'synced').map((item) => item.clientId),
      ['pending', 'failed', 'syncing'],
    );
    assert.ok(retained.some((item) => item.clientId === 'synced-0'));
    assert.ok(!retained.some((item) => item.clientId === `synced-${SYNCED_ACTIVITY_RETENTION_LIMIT + 1}`));
  });

  it('menerapkan retensi dan memulihkan kiriman terputus saat aplikasi dibuka kembali', () => {
    const stored = JSON.stringify([
      activity('terputus', 'syncing'),
      activity('gagal', 'failed'),
      ...Array.from(
        { length: SYNCED_ACTIVITY_RETENTION_LIMIT + 1 },
        (_, index) => activity(`lama-${index}`, 'synced'),
      ),
    ]);

    const restored = recoverQueue(JSON.parse(stored) as QueuedActivity[]);

    assert.equal(restored.find((item) => item.clientId === 'terputus')?.localStatus, 'pending');
    assert.ok(restored.some((item) => item.clientId === 'gagal'));
    assert.equal(
      restored.filter((item) => item.localStatus === 'synced').length,
      SYNCED_ACTIVITY_RETENTION_LIMIT,
    );
  });

  it('menghapus duplikat server berdasarkan clientId setelah riwayat lokal dibersihkan', () => {
    const rows = dedupeByKey([
      activity('unik', 'synced'),
      activity('duplikat', 'synced'),
      { ...activity('duplikat', 'synced'), title: 'Salinan server' },
    ], (item) => item.clientId);

    assert.deepEqual(rows.map((item) => item.clientId), ['unik', 'duplikat']);
    assert.equal(rows[1]?.title, 'Inspeksi duplikat');
  });

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

  it('memakai ulang jalur foto setelah aplikasi berhenti sebelum aktivitas tersimpan', async () => {
    let persisted = [{
      ...activity('foto-sudah-diunggah'),
      localPhotoUri: 'file:///bukti-inspeksi.jpg',
      photoContentType: 'image/jpeg' as const,
    }];
    let uploadUrlRequests = 0;
    let activityCreateRequests = 0;
    let failActivityCreation = true;

    const mutate = async (
      updater: (current: QueuedActivity[]) => QueuedActivity[],
    ) => {
      persisted = structuredClone(updater(persisted));
      return persisted;
    };
    const send = async (
      item: QueuedActivity,
      checkpoint: (patch: Partial<QueuedActivity>) => Promise<void>,
    ) => {
      let photoObjectPath = item.photoObjectPath;
      if (item.localPhotoUri && !photoObjectPath) {
        uploadUrlRequests += 1;
        photoObjectPath = 'evidence/foto-sudah-diunggah.jpg';
        await checkpoint({ photoObjectPath });
      }

      activityCreateRequests += 1;
      if (failActivityCreation) throw new Error('Pembuatan aktivitas gagal');
      assert.equal(photoObjectPath, 'evidence/foto-sudah-diunggah.jpg');
    };

    await syncQueuedActivities(persisted, mutate, send);

    assert.equal(persisted[0]?.localStatus, 'failed');
    assert.equal(
      persisted[0]?.photoObjectPath,
      'evidence/foto-sudah-diunggah.jpg',
    );
    assert.equal(uploadUrlRequests, 1);
    assert.equal(activityCreateRequests, 1);

    persisted = recoverQueue(
      JSON.parse(JSON.stringify(persisted)) as QueuedActivity[],
    );
    failActivityCreation = false;
    await syncQueuedActivities(persisted, mutate, send);

    assert.equal(persisted[0]?.localStatus, 'synced');
    assert.equal(uploadUrlRequests, 1);
    assert.equal(activityCreateRequests, 2);
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