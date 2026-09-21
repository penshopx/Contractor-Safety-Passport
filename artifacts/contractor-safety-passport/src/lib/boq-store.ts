import { useState, useEffect, useCallback } from 'react';
import * as z from "zod";

export interface SafetyBoqItem {
  id: string;
  description: string;
  category: string;
  volume: number;
  unit: string;
  unitPrice: number;
  migrationKey?: string | null;
  catalogItemId?: string | null;
  priceRegion?: string | null;
  priceSource?: string | null;
  priceUpdatedAt?: string | null;
  risk: string;
  stage: string;
  controlNeed: string;
  projectId?: number | null;
  updatedAt?: string;
}

export const safetyPriceCatalogItemInputSchema = z.object({
  description: z.string().min(1, "Deskripsi wajib diisi"),
  category: z.string().min(1, "Kategori wajib dipilih"),
  unit: z.string().min(1, "Satuan wajib diisi"),
  referencePrice: z.coerce.number().min(0, "Harga acuan tidak boleh negatif"),
  region: z.string().min(1, "Wilayah wajib diisi"),
  source: z.string().min(1, "Sumber harga wajib diisi"),
  priceUpdatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal pembaruan tidak valid"),
  risk: z.string().min(1, "Risiko wajib dipilih"),
  stage: z.string().min(1, "Tahapan wajib dipilih"),
  controlNeed: z.string().min(1, "Kebutuhan pengendalian wajib diisi"),
});

export type SafetyPriceCatalogItemInput = z.infer<
  typeof safetyPriceCatalogItemInputSchema
>;

export type LegacySafetyPriceCatalogItem = SafetyPriceCatalogItemInput & {
  id: string;
};

export type SafetyPriceCatalogSnapshotSource = SafetyPriceCatalogItemInput & {
  id: string;
};

export function createSafetyBoqCatalogSnapshot(
  catalogItem: SafetyPriceCatalogSnapshotSource,
  projectId: number | null,
  id = crypto.randomUUID(),
): SafetyBoqItem {
  return {
    id,
    description: catalogItem.description,
    category: catalogItem.category,
    volume: 1,
    unit: catalogItem.unit,
    unitPrice: catalogItem.referencePrice,
    catalogItemId: catalogItem.id,
    priceRegion: catalogItem.region,
    priceSource: catalogItem.source,
    priceUpdatedAt: catalogItem.priceUpdatedAt,
    risk: catalogItem.risk,
    stage: catalogItem.stage,
    controlNeed: catalogItem.controlNeed,
    projectId,
  };
}

export const CATEGORIES = [
  "Dokumen RKK",
  "Sosialisasi & Pelatihan",
  "APD & APK",
  "Asuransi & Perizinan",
  "Personel K3",
  "Fasilitas Kesehatan",
  "Rambu & Peringatan",
  "Inspeksi & Audit",
  "Pengendalian Risiko"
] as const;

export const RISKS = ["Rendah", "Sedang", "Tinggi"] as const;

export const STAGES = ["Persiapan", "Pelaksanaan", "Penyelesaian"] as const;

const SEED_BOQ_ITEMS: SafetyBoqItem[] = [
  {
    id: "seed-1",
    description: "Penyusunan Rencana Keselamatan Konstruksi (RKK)",
    category: "Dokumen RKK",
    volume: 1,
    unit: "Ls",
    unitPrice: 2500000,
    risk: "Sedang",
    stage: "Persiapan",
    controlNeed: "Dokumen tender wajib",
    projectId: null
  },
  {
    id: "seed-2",
    description: "Helm Keselamatan (Safety Helmet)",
    category: "APD & APK",
    volume: 20,
    unit: "Bh",
    unitPrice: 75000,
    risk: "Tinggi",
    stage: "Pelaksanaan",
    controlNeed: "Pelindung kepala wajib",
    projectId: null
  },
  {
    id: "seed-3",
    description: "Spanduk Keselamatan dan Kesehatan Kerja",
    category: "Rambu & Peringatan",
    volume: 3,
    unit: "Lbr",
    unitPrice: 200000,
    risk: "Rendah",
    stage: "Persiapan",
    controlNeed: "Kampanye kesadaran K3",
    projectId: null
  }
];

const STORAGE_KEY = 'safety_passport_boq_v1';
export const LEGACY_CATALOG_STORAGE_KEY = 'safety_passport_price_catalog_v1';
const MIGRATION_SOURCE_STORAGE_KEY = 'safety_passport_boq_migration_source_v1';

export function parseLegacySafetyPriceCatalog(serialized: string | null) {
  if (!serialized) return [];
  try {
    const parsed = JSON.parse(serialized);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      if (!item || typeof item !== "object" || typeof item.id !== "string") return [];
      const result = safetyPriceCatalogItemInputSchema.safeParse(item);
      return result.success ? [{ ...result.data, id: item.id }] : [];
    });
  } catch {
    return [];
  }
}

export function readLegacySafetyPriceCatalog() {
  return parseLegacySafetyPriceCatalog(localStorage.getItem(LEGACY_CATALOG_STORAGE_KEY));
}

export function writeLegacySafetyPriceCatalog(items: LegacySafetyPriceCatalogItem[]) {
  if (items.length === 0) {
    localStorage.removeItem(LEGACY_CATALOG_STORAGE_KEY);
    return;
  }
  localStorage.setItem(LEGACY_CATALOG_STORAGE_KEY, JSON.stringify(items));
}

export function getBoqMigrationKey(
  organizationId: string,
  projectId: number,
  migrationSourceId: string,
  localItemId: string,
) {
  return `local-boq:${organizationId}:${projectId}:${migrationSourceId}:${localItemId}`;
}

export function getBoqMigrationItemId(migrationKey: string) {
  let firstHash = 2166136261;
  let secondHash = 2166136261;
  for (let index = 0; index < migrationKey.length; index += 1) {
    firstHash = Math.imul(firstHash ^ migrationKey.charCodeAt(index), 16777619);
    secondHash = Math.imul(
      secondHash ^ migrationKey.charCodeAt(migrationKey.length - index - 1),
      16777619,
    );
  }
  return `migrated-${(firstHash >>> 0).toString(36)}-${(secondHash >>> 0).toString(36)}`;
}

function getOrCreateBoqMigrationSourceId() {
  const stored = localStorage.getItem(MIGRATION_SOURCE_STORAGE_KEY);
  if (stored) return stored;

  const sourceId = crypto.randomUUID();
  localStorage.setItem(MIGRATION_SOURCE_STORAGE_KEY, sourceId);
  return sourceId;
}

export function useLocalSafetyBoqStore() {
  const [items, setItems] = useState<SafetyBoqItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [migrationSourceId, setMigrationSourceId] = useState<string | null>(null);

  useEffect(() => {
    try {
      setMigrationSourceId(getOrCreateBoqMigrationSourceId());
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      } else {
        setItems(SEED_BOQ_ITEMS);
      }
    } catch (e) {
      console.error("Failed to load BOQ items", e);
      setItems(SEED_BOQ_ITEMS);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, isLoaded]);

  const addItem = useCallback((item: Omit<SafetyBoqItem, 'id'>) => {
    const newItem = { ...item, id: crypto.randomUUID() };
    setItems((prev) => [...prev, newItem]);
  }, []);

  const updateItem = useCallback((id: string, updates: Partial<Omit<SafetyBoqItem, 'id'>>) => {
    setItems((prev) => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter(item => item.id !== id));
  }, []);
  
  const removeItems = useCallback((ids: string[]) => {
    const removedIds = new Set(ids);
    setItems((prev) => prev.filter((item) => !removedIds.has(item.id)));
  }, []);

  return {
    items,
    addItem,
    updateItem,
    removeItem,
    removeItems,
    isLoaded,
    migrationSourceId,
  };
}
