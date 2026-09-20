import { useState, useEffect, useCallback } from 'react';

export interface SafetyBoqItem {
  id: string;
  description: string;
  category: string;
  volume: number;
  unit: string;
  unitPrice: number;
  risk: string;
  stage: string;
  controlNeed: string;
  projectId?: number | null;
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

export function useSafetyBoqStore() {
  const [items, setItems] = useState<SafetyBoqItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
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
  
  const resetToSeed = useCallback(() => {
    setItems(SEED_BOQ_ITEMS);
  }, []);

  return { items, addItem, updateItem, removeItem, resetToSeed, isLoaded };
}