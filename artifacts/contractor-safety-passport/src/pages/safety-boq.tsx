import { useState, useMemo, useEffect } from 'react';
import { 
  Calculator, 
  Download, 
  Plus, 
  Trash2, 
  Pencil, 
  FileText,
  FileSpreadsheet,
  BarChart3,
  TrendingUp,
  ShieldAlert,
  ClipboardList
  ,CloudUpload
  ,Loader2
  ,BookOpen
  ,MapPin
  ,Database
  ,CalendarDays
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  getGetProjectSafetyBoqQueryKey,
  useGetOrganizationContext,
  useGetProjectSafetyBoq,
  useListSafetyPriceCatalogItems,
  getListSafetyPriceCatalogItemsQueryKey,
  useCreateSafetyPriceCatalogItem,
  useUpdateSafetyPriceCatalogItem,
  useDeleteSafetyPriceCatalogItem,
  useListProjects,
  useReplaceProjectSafetyBoq,
  type SafetyPriceCatalogItem,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { 
  createSafetyBoqCatalogSnapshot,
  getBoqMigrationItemId,
  getBoqMigrationKey,
  readLegacySafetyPriceCatalog,
  safetyPriceCatalogItemInputSchema,
  useLocalSafetyBoqStore,
  writeLegacySafetyPriceCatalog,
  SafetyBoqItem, 
  CATEGORIES, 
  RISKS, 
  STAGES 
} from '@/lib/boq-store';
import { formatCurrency, exportBoqPdf, exportBoqCsv } from '@/lib/boq-export';
import { 
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const boqSchema = z.object({
  description: z.string().min(1, "Deskripsi wajib diisi"),
  category: z.string().min(1, "Kategori wajib dipilih"),
  volume: z.coerce.number().min(0.01, "Volume harus lebih dari 0"),
  unit: z.string().min(1, "Satuan wajib diisi"),
  unitPrice: z.coerce.number().min(0, "Harga satuan tidak boleh negatif"),
  risk: z.string().min(1, "Risiko wajib dipilih"),
  stage: z.string().min(1, "Tahapan wajib dipilih"),
  controlNeed: z.string().min(1, "Kebutuhan pengendalian wajib diisi"),
});

type BoqFormValues = z.infer<typeof boqSchema>;

const catalogSchema = safetyPriceCatalogItemInputSchema;
type CatalogFormValues = z.infer<typeof safetyPriceCatalogItemInputSchema>;

function CatalogItemDialog({
  isOpen,
  onClose,
  initialData,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialData?: SafetyPriceCatalogItem | null;
  onSave: (data: CatalogFormValues) => void;
}) {
  const form = useForm<CatalogFormValues>({
    resolver: zodResolver(catalogSchema),
    defaultValues: {
      description: "", category: "", unit: "Bh", referencePrice: 0,
      region: "", source: "", priceUpdatedAt: new Date().toISOString().slice(0, 10),
      risk: "Sedang", stage: "Pelaksanaan", controlNeed: "Harga acuan katalog",
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    form.reset(initialData ? {
      description: initialData.description,
      category: initialData.category,
      unit: initialData.unit,
      referencePrice: initialData.referencePrice,
      region: initialData.region,
      source: initialData.source,
      priceUpdatedAt: initialData.priceUpdatedAt,
      risk: initialData.risk,
      stage: initialData.stage,
      controlNeed: initialData.controlNeed,
    } : {
      description: "", category: "", unit: "Bh", referencePrice: 0,
      region: "", source: "", priceUpdatedAt: new Date().toISOString().slice(0, 10),
      risk: "Sedang", stage: "Pelaksanaan", controlNeed: "Harga acuan katalog",
    });
  }, [form, initialData, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[640px] bg-card border-border">
        <DialogHeader><DialogTitle>{initialData ? "Ubah Item Katalog" : "Tambah Item Katalog"}</DialogTitle></DialogHeader>
        <form onSubmit={form.handleSubmit((data) => { onSave(data); onClose(); })} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="catalog-description">Nama Item Standar</Label>
            <Input id="catalog-description" {...form.register("description")} data-testid="input-catalog-description" />
            {form.formState.errors.description && <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Kategori</Label>
              <Controller control={form.control} name="category" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger data-testid="select-catalog-category"><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}</SelectContent>
                </Select>
              )} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="catalog-unit">Satuan</Label>
              <Input id="catalog-unit" {...form.register("unit")} data-testid="input-catalog-unit" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="catalog-price">Harga Acuan (Rp)</Label>
              <Input id="catalog-price" type="number" {...form.register("referencePrice")} data-testid="input-catalog-price" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="catalog-region">Wilayah</Label>
              <Input id="catalog-region" {...form.register("region")} placeholder="Contoh: Jabodetabek" data-testid="input-catalog-region" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="catalog-source">Sumber Harga</Label>
              <Input id="catalog-source" {...form.register("source")} placeholder="Pemasok / standar harga" data-testid="input-catalog-source" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="catalog-date">Tanggal Pembaruan</Label>
              <Input id="catalog-date" type="date" {...form.register("priceUpdatedAt")} data-testid="input-catalog-date" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Risiko Bawaan</Label>
              <Controller control={form.control} name="risk" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}><SelectTrigger data-testid="select-catalog-risk"><SelectValue /></SelectTrigger>
                  <SelectContent>{RISKS.map((risk) => <SelectItem key={risk} value={risk}>{risk}</SelectItem>)}</SelectContent>
                </Select>
              )} />
            </div>
            <div className="space-y-2">
              <Label>Tahap Bawaan</Label>
              <Controller control={form.control} name="stage" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}><SelectTrigger data-testid="select-catalog-stage"><SelectValue /></SelectTrigger>
                  <SelectContent>{STAGES.map((stage) => <SelectItem key={stage} value={stage}>{stage}</SelectItem>)}</SelectContent>
                </Select>
              )} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="catalog-note">Catatan Pengendalian Bawaan</Label>
            <Textarea id="catalog-note" {...form.register("controlNeed")} data-testid="textarea-catalog-note" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} data-testid="button-cancel-catalog">Batal</Button>
            <Button type="submit" data-testid="button-save-catalog">Simpan ke Katalog</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function BoqItemDialog({
  isOpen,
  onClose,
  initialData,
  onSave
}: {
  isOpen: boolean;
  onClose: () => void;
  initialData?: SafetyBoqItem | null;
  onSave: (data: BoqFormValues) => void;
}) {
  const form = useForm<BoqFormValues>({
    resolver: zodResolver(boqSchema),
    defaultValues: {
      description: "",
      category: "",
      volume: 1,
      unit: "Ls",
      unitPrice: 0,
      risk: "",
      stage: "",
      controlNeed: ""
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        form.reset({
          description: initialData.description,
          category: initialData.category,
          volume: initialData.volume,
          unit: initialData.unit,
          unitPrice: initialData.unitPrice,
          risk: initialData.risk,
          stage: initialData.stage,
          controlNeed: initialData.controlNeed
        });
      } else {
        form.reset({
          description: "",
          category: "",
          volume: 1,
          unit: "Ls",
          unitPrice: 0,
          risk: "",
          stage: "",
          controlNeed: ""
        });
      }
    }
  }, [isOpen, initialData, form]);

  const onSubmit = (data: BoqFormValues) => {
    onSave(data);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight">
            {initialData ? "Ubah Item BOQ" : "Tambah Item BOQ Baru"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="description" className="text-foreground">Deskripsi Pekerjaan</Label>
            <Input
              id="description"
              {...form.register("description")}
              className="bg-input/50"
              placeholder="Contoh: Rambu Keselamatan"
              data-testid="input-description"
            />
            {form.formState.errors.description && (
              <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category" className="text-foreground">Kategori</Label>
              <Controller
                control={form.control}
                name="category"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="bg-input/50" data-testid="select-category">
                      <SelectValue placeholder="Pilih Kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.category && (
                <p className="text-sm text-destructive">{form.formState.errors.category.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="risk" className="text-foreground">Tingkat Risiko</Label>
              <Controller
                control={form.control}
                name="risk"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="bg-input/50" data-testid="select-risk">
                      <SelectValue placeholder="Pilih Risiko" />
                    </SelectTrigger>
                    <SelectContent>
                      {RISKS.map(r => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.risk && (
                <p className="text-sm text-destructive">{form.formState.errors.risk.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="volume" className="text-foreground">Volume</Label>
              <Input
                id="volume"
                type="number"
                step="any"
                {...form.register("volume")}
                className="bg-input/50"
                data-testid="input-volume"
              />
              {form.formState.errors.volume && (
                <p className="text-sm text-destructive">{form.formState.errors.volume.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit" className="text-foreground">Satuan</Label>
              <Input
                id="unit"
                {...form.register("unit")}
                className="bg-input/50"
                placeholder="Ls, Bh, Set"
                data-testid="input-unit"
              />
              {form.formState.errors.unit && (
                <p className="text-sm text-destructive">{form.formState.errors.unit.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="unitPrice" className="text-foreground">Harga Satuan (Rp)</Label>
              <Input
                id="unitPrice"
                type="number"
                {...form.register("unitPrice")}
                className="bg-input/50"
                data-testid="input-unitprice"
              />
              {form.formState.errors.unitPrice && (
                <p className="text-sm text-destructive">{form.formState.errors.unitPrice.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label htmlFor="stage" className="text-foreground">Tahapan Pekerjaan</Label>
              <Controller
                control={form.control}
                name="stage"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="bg-input/50" data-testid="select-stage">
                      <SelectValue placeholder="Pilih Tahapan" />
                    </SelectTrigger>
                    <SelectContent>
                      {STAGES.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.stage && (
                <p className="text-sm text-destructive">{form.formState.errors.stage.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="controlNeed" className="text-foreground">Kebutuhan Pengendalian / Catatan</Label>
            <Textarea
              id="controlNeed"
              {...form.register("controlNeed")}
              className="bg-input/50 resize-none h-20"
              placeholder="Jelaskan kebutuhan pengendalian risiko..."
              data-testid="textarea-controlneed"
            />
            {form.formState.errors.controlNeed && (
              <p className="text-sm text-destructive">{form.formState.errors.controlNeed.message}</p>
            )}
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} data-testid="button-cancel">
              Batal
            </Button>
            <Button type="submit" data-testid="button-save">
              Simpan Item
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function SafetyBoqPage() {
  const queryClient = useQueryClient();
  const {
    items: localItems,
    addItem: addLocalItem,
    updateItem: updateLocalItem,
    removeItem: removeLocalItem,
    removeItems: removeLocalItems,
    isLoaded: isLocalLoaded,
    migrationSourceId,
  } = useLocalSafetyBoqStore();
  const { data: projects } = useListProjects();
  const { data: organization } = useGetOrganizationContext();
  const {
    data: catalogItems = [],
    isLoading: isCatalogLoading,
    isError: isCatalogError,
    refetch: refetchCatalog,
  } = useListSafetyPriceCatalogItems({
    query: {
      queryKey: getListSafetyPriceCatalogItemsQueryKey(),
      staleTime: 10_000,
      refetchInterval: 15_000,
      refetchOnWindowFocus: true,
    },
  });
  const createCatalogItem = useCreateSafetyPriceCatalogItem();
  const updateCatalogItem = useUpdateSafetyPriceCatalogItem();
  const deleteCatalogItem = useDeleteSafetyPriceCatalogItem();
  
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SafetyBoqItem | null>(null);
  const [isCatalogDialogOpen, setIsCatalogDialogOpen] = useState(false);
  const [editingCatalogItem, setEditingCatalogItem] = useState<SafetyPriceCatalogItem | null>(null);
  const [legacyCatalogItems, setLegacyCatalogItems] = useState(readLegacySafetyPriceCatalog);
  const [isImportingLegacyCatalog, setIsImportingLegacyCatalog] = useState(false);
  const [conflictingEdit, setConflictingEdit] = useState<{
    base: SafetyBoqItem[];
    proposed: SafetyBoqItem[];
    successMessage: string;
  } | null>(null);
  const projectId = selectedProjectId === 'all' ? null : Number(selectedProjectId);
  const {
    data: sharedItems,
    isLoading: isLoadingShared,
    isFetching: isRefreshingShared,
    isSuccess: isSharedReady,
    isError: isSharedError,
    refetch: refetchShared,
  } = useGetProjectSafetyBoq(projectId ?? 0, {
    query: {
      queryKey: getGetProjectSafetyBoqQueryKey(projectId ?? 0),
      enabled: projectId !== null,
      refetchOnWindowFocus: true,
      staleTime: 15_000,
    },
  });
  const replaceSharedDraft = useReplaceProjectSafetyBoq();
  const canEditShared = organization?.role === "owner" || organization?.role === "safety_expert";
  const canEditCatalog = canEditShared;
  const canMutateShared = projectId !== null && canEditShared && isSharedReady && !isRefreshingShared;

  const projectItems = useMemo(() => {
    if (projectId === null) return localItems.filter(item => !item.projectId);
    return sharedItems?.items ?? [];
  }, [localItems, projectId, sharedItems]);
  const migratableItems = useMemo(
    () => projectId === null
      ? []
      : localItems.filter((item) => item.projectId == null || item.projectId === projectId),
    [localItems, projectId],
  );

  const totalCost = projectItems.reduce((acc, curr) => acc + (curr.volume * curr.unitPrice), 0);

  const topCategory = useMemo(() => {
    const costByCategory = projectItems.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + (curr.volume * curr.unitPrice);
      return acc;
    }, {} as Record<string, number>);
    const sorted = Object.entries(costByCategory).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? sorted[0] : null;
  }, [projectItems]);

  const topRiskCost = useMemo(() => {
    const costByRisk = projectItems.reduce((acc, curr) => {
      acc[curr.risk] = (acc[curr.risk] || 0) + (curr.volume * curr.unitPrice);
      return acc;
    }, {} as Record<string, number>);
    return costByRisk['Tinggi'] || 0;
  }, [projectItems]);

  const categoryRecap = useMemo(() => (
    CATEGORIES
      .map(category => ({
        label: category,
        total: projectItems
          .filter(item => item.category === category)
          .reduce((sum, item) => sum + item.volume * item.unitPrice, 0)
      }))
      .filter(entry => entry.total > 0)
      .sort((a, b) => b.total - a.total)
  ), [projectItems]);

  const riskRecap = useMemo(() => (
    RISKS.map(risk => ({
      label: risk,
      total: projectItems
        .filter(item => item.risk === risk)
        .reduce((sum, item) => sum + item.volume * item.unitPrice, 0)
    }))
  ), [projectItems]);

  const handleOpenCreate = () => {
    if (projectId !== null && !canMutateShared) return;
    setEditingItem(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (item: SafetyBoqItem) => {
    if (projectId !== null && !canMutateShared) return;
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (projectId !== null && !canMutateShared) return;
    if (window.confirm("Apakah Anda yakin ingin menghapus item ini?")) {
      if (projectId === null) {
        removeLocalItem(id);
        toast.success("Item berhasil dihapus");
        return;
      }
      saveSharedItems(projectItems.filter((item) => item.id !== id), "Item berhasil dihapus");
    }
  };

  const saveSharedItems = (nextItems: SafetyBoqItem[], successMessage: string) => {
    if (!canMutateShared || projectId === null) return;
    replaceSharedDraft.mutate(
      {
        projectId,
        data: {
          revision: sharedItems.revision,
          items: nextItems.map(({ updatedAt: _updatedAt, projectId: _projectId, ...item }) => item),
        },
      },
      {
        onSuccess: (savedDraft) => {
          queryClient.setQueryData(getGetProjectSafetyBoqQueryKey(projectId), savedDraft);
          toast.success(successMessage);
        },
        onError: async (error) => {
          if (error.status === 409) {
            setConflictingEdit({ base: projectItems, proposed: nextItems, successMessage });
            await refetchShared();
            toast.warning("Draf terbaru dimuat. Perubahan Anda tetap disimpan untuk ditinjau atau digabungkan.");
            return;
          }
          toast.error(
            error.status === 403
              ? "Peran Anda tidak dapat mengubah draft BOQ proyek."
              : "Draf BOQ gagal disimpan. Perubahan belum diterapkan.",
          );
        },
      },
    );
  };

  const handleSave = (data: BoqFormValues) => {
    if (editingItem) {
      if (projectId === null) {
        updateLocalItem(editingItem.id, data);
        toast.success("Item berhasil diperbarui");
      } else {
        saveSharedItems(
          projectItems.map((item) => item.id === editingItem.id ? { ...item, ...data } : item),
          "Item berhasil diperbarui",
        );
      }
    } else {
      if (projectId === null) {
        addLocalItem({ ...data, projectId: null });
        toast.success("Item berhasil ditambahkan");
      } else {
        saveSharedItems(
          [...projectItems, { ...data, id: crypto.randomUUID(), projectId }],
          "Item berhasil ditambahkan",
        );
      }
    }
  };

  const handleUseCatalogItem = (catalogItem: SafetyPriceCatalogItem) => {
    if (projectId !== null && !canMutateShared) return;
    const snapshot = createSafetyBoqCatalogSnapshot(catalogItem, projectId);
    if (projectId === null) {
      const { id: _id, ...localSnapshot } = snapshot;
      addLocalItem(localSnapshot);
      toast.success("Item katalog ditambahkan. Harga BOQ dapat disesuaikan.");
    } else {
      saveSharedItems([...projectItems, snapshot], "Item katalog ditambahkan ke draft proyek");
    }
  };

  const handleSaveCatalogItem = (data: CatalogFormValues) => {
    if (editingCatalogItem) {
      updateCatalogItem.mutate(
        { id: editingCatalogItem.id, data },
        {
          onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: getListSafetyPriceCatalogItemsQueryKey() });
            toast.success("Item katalog diperbarui tanpa mengubah draft lama");
          },
          onError: () => toast.error("Item katalog gagal diperbarui"),
        },
      );
    } else {
      createCatalogItem.mutate(
        { data },
        {
          onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: getListSafetyPriceCatalogItemsQueryKey() });
            toast.success("Item standar disimpan ke katalog workspace");
          },
          onError: () => toast.error("Item katalog gagal ditambahkan"),
        },
      );
    }
  };

  const handleDeleteCatalogItem = (id: string) => {
    if (!canEditCatalog || !window.confirm("Hapus item katalog ini? Draf BOQ yang sudah memakai item tetap aman.")) return;
    deleteCatalogItem.mutate(
      { id },
      {
        onSuccess: async () => {
          await queryClient.invalidateQueries({ queryKey: getListSafetyPriceCatalogItemsQueryKey() });
          toast.success("Item katalog dihapus. Draf lama tetap tidak berubah.");
        },
        onError: () => toast.error("Item katalog gagal dihapus"),
      },
    );
  };

  const handleImportLegacyCatalog = async () => {
    if (!canEditCatalog || legacyCatalogItems.length === 0 || isImportingLegacyCatalog) return;
    setIsImportingLegacyCatalog(true);
    let remaining = [...legacyCatalogItems];
    let importedCount = 0;
    try {
      for (const { id, ...data } of legacyCatalogItems) {
        await createCatalogItem.mutateAsync({ data });
        remaining = remaining.filter((item) => item.id !== id);
        writeLegacySafetyPriceCatalog(remaining);
        setLegacyCatalogItems(remaining);
        importedCount += 1;
      }
      await queryClient.invalidateQueries({ queryKey: getListSafetyPriceCatalogItemsQueryKey() });
      toast.success(`${importedCount} item katalog perangkat dipindahkan ke workspace`);
    } catch {
      await queryClient.invalidateQueries({ queryKey: getListSafetyPriceCatalogItemsQueryKey() });
      toast.error(
        importedCount > 0
          ? `${importedCount} item berhasil dipindahkan. Item tersisa tetap aman di perangkat.`
          : "Katalog perangkat belum berhasil dipindahkan dan tetap aman.",
      );
    } finally {
      setIsImportingLegacyCatalog(false);
    }
  };

  const handleMigrateLocal = () => {
    if (
      !canMutateShared
      || projectId === null
      || !organization
      || !migrationSourceId
      || migratableItems.length === 0
    ) return;
    const migrated = migratableItems.map((item) => {
      const migrationKey = getBoqMigrationKey(
        organization.organizationId,
        projectId,
        migrationSourceId,
        item.id,
      );
      return {
        ...item,
        id: getBoqMigrationItemId(migrationKey),
        migrationKey,
        projectId,
      };
    });
    const serverMigrationKeys = new Set(
      projectItems.flatMap((item) => item.migrationKey ? [item.migrationKey] : []),
    );
    const pendingMigrations = migrated.filter(
      (item) => !serverMigrationKeys.has(item.migrationKey),
    );
    if (pendingMigrations.length === 0) {
      removeLocalItems(migratableItems.map((item) => item.id));
      toast.success(`${migratableItems.length} item lokal sudah tersimpan di draft proyek`);
      return;
    }
    replaceSharedDraft.mutate(
      {
        projectId,
        data: {
          revision: sharedItems!.revision,
          items: [...projectItems, ...pendingMigrations].map(
            ({ updatedAt: _updatedAt, projectId: _projectId, ...item }) => item,
          ),
        },
      },
      {
        onSuccess: (savedDraft) => {
          queryClient.setQueryData(getGetProjectSafetyBoqQueryKey(projectId), savedDraft);
          removeLocalItems(migratableItems.map((item) => item.id));
          toast.success(`${migratableItems.length} item lokal dipindahkan ke draft proyek`);
        },
        onError: async (error) => {
          if (error.status === 409) {
            await refetchShared();
              toast.warning("Draf berubah. Data lokal tetap aman; silakan coba pindahkan lagi.");
            return;
          }
          toast.error("Data lokal belum dipindahkan dan tetap aman di perangkat ini.");
        },
      },
    );
  };

  const mergeConflictingEdit = () => {
    if (!conflictingEdit || !sharedItems) return;
    const baseById = new Map(conflictingEdit.base.map((item) => [item.id, item]));
    const proposedById = new Map(conflictingEdit.proposed.map((item) => [item.id, item]));
    const changedIds = new Set(
      conflictingEdit.proposed
        .filter((item) => JSON.stringify(item) !== JSON.stringify(baseById.get(item.id)))
        .map((item) => item.id),
    );
    const deletedIds = new Set(
      conflictingEdit.base
        .filter((item) => !proposedById.has(item.id))
        .map((item) => item.id),
    );
    const merged = sharedItems.items
      .filter((item) => !deletedIds.has(item.id))
      .map((item) => changedIds.has(item.id) ? proposedById.get(item.id)! : item);
    for (const item of conflictingEdit.proposed) {
      if (!baseById.has(item.id) && !merged.some((candidate) => candidate.id === item.id)) {
        merged.push(item);
      }
    }
    const successMessage = conflictingEdit.successMessage;
    setConflictingEdit(null);
    saveSharedItems(merged, `${successMessage} setelah digabungkan`);
  };

  const handleExportPdf = () => {
    const projName = selectedProjectId === 'all' ? 'Draf Umum' : projects?.find(p => p.id === Number(selectedProjectId))?.name || 'Proyek';
    exportBoqPdf(projectItems, projName);
    toast.success("PDF berhasil diekspor");
  };

  const handleExportCsv = () => {
    const projName = selectedProjectId === 'all' ? 'Draf Umum' : projects?.find(p => p.id === Number(selectedProjectId))?.name || 'Proyek';
    exportBoqCsv(projectItems, projName);
    toast.success("CSV berhasil diekspor");
  };

  if (!isLocalLoaded) return null;

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      <Dialog open={conflictingEdit !== null} onOpenChange={() => undefined}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Draf BOQ telah berubah</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Anggota tim lain menyimpan perubahan lebih dulu. Draf terbaru sudah dimuat, dan perubahan Anda masih disimpan sementara.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConflictingEdit(null)}>
              Gunakan draft terbaru
            </Button>
            <Button onClick={mergeConflictingEdit}>
              Gabungkan edit saya
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Calculator className="h-8 w-8 text-primary" />
            Kalkulator BOQ SMKK
          </h1>
          <p className="text-muted-foreground mt-1">
            Hitung estimasi biaya penerapan SMKK secara presisi untuk tender dan pelaksanaan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
            <SelectTrigger className="w-full md:w-[260px] bg-card border-border/50" data-testid="select-project-filter">
              <SelectValue placeholder="Pilih Proyek" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Draf Umum (Tanpa Proyek)</SelectItem>
              {projects?.map(p => (
                <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {projectId !== null && migratableItems.length > 0 && canEditShared && (
            <Button
              variant="outline"
              onClick={handleMigrateLocal}
              disabled={!canMutateShared || !migrationSourceId || replaceSharedDraft.isPending}
              className="gap-2"
              data-testid="button-migrate-local-boq"
            >
              <CloudUpload className="h-4 w-4" />
              Pindahkan {migratableItems.length} Item Lokal
            </Button>
          )}

          <Button
            onClick={handleOpenCreate}
            disabled={(projectId !== null && !canMutateShared) || replaceSharedDraft.isPending}
            className="gap-2"
            data-testid="button-create-item"
          >
            <Plus className="h-4 w-4" />
            Tambah Item
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2" data-testid="button-export-menu">
                <Download className="h-4 w-4" />
                Ekspor
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled={projectItems.length === 0} onClick={handleExportPdf} className="gap-2 cursor-pointer" data-testid="menu-export-pdf">
                <FileText className="h-4 w-4 text-primary" />
                Sebagai PDF
              </DropdownMenuItem>
              <DropdownMenuItem disabled={projectItems.length === 0} onClick={handleExportCsv} className="gap-2 cursor-pointer" data-testid="menu-export-csv">
                <FileSpreadsheet className="h-4 w-4 text-green-500" />
                Sebagai CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {projectId !== null && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {isLoadingShared || isRefreshingShared ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          <span>
            {canEditShared
              ? "Draf proyek dibagikan ke anggota ruang kerja dan diperbarui dari server."
              : "Anda dapat melihat draft terbaru. Hanya Owner dan Ahli K3 yang dapat mengubahnya."}
          </span>
        </div>
      )}

      {projectId !== null && isSharedError && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-destructive">
              Draf proyek gagal dimuat. Semua perubahan diblokir agar data yang sudah ada tidak tertimpa.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refetchShared()}
              disabled={isRefreshingShared}
            >
              {isRefreshingShared && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Coba Lagi
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="border-primary/20 bg-card/70">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg"><BookOpen className="h-5 w-5 text-primary" />Katalog Harga Keselamatan</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Pilih harga acuan untuk membuat salinan di BOQ. Perubahan katalog berikutnya tidak mengubah harga draft lama.</p>
          </div>
          {canEditCatalog && (
            <div className="flex flex-wrap justify-end gap-2">
              {legacyCatalogItems.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => void handleImportLegacyCatalog()}
                  disabled={isImportingLegacyCatalog}
                  data-testid="button-import-legacy-catalog"
                >
                  {isImportingLegacyCatalog ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CloudUpload className="mr-2 h-4 w-4" />}
                  Impor {legacyCatalogItems.length} Item Perangkat
                </Button>
              )}
              <Button variant="outline" onClick={() => { setEditingCatalogItem(null); setIsCatalogDialogOpen(true); }} data-testid="button-create-catalog-item">
                <Plus className="mr-2 h-4 w-4" />Item Katalog
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {isCatalogLoading ? (
              <div className="col-span-full py-8 text-center text-muted-foreground">
                <Loader2 className="mx-auto h-6 w-6 animate-spin" />
              </div>
            ) : isCatalogError ? (
              <div className="col-span-full flex items-center justify-between gap-4 rounded-lg border border-destructive/40 bg-destructive/5 p-4">
                <p className="text-sm text-destructive">Katalog workspace gagal dimuat.</p>
                <Button variant="outline" size="sm" onClick={() => void refetchCatalog()}>Coba Lagi</Button>
              </div>
            ) : catalogItems.length === 0 ? (
              <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
                Belum ada item dalam katalog workspace.
              </p>
            ) : catalogItems.map((item) => (
              <div key={item.id} className="rounded-lg border border-border/60 bg-background/40 p-4" data-testid={`card-catalog-${item.id}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{item.description}</p>
                    <p className="mt-1 text-lg font-bold text-primary">{formatCurrency(item.referencePrice)} <span className="text-xs font-normal text-muted-foreground">/ {item.unit}</span></p>
                  </div>
                  {canEditCatalog && (
                    <div className="flex">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingCatalogItem(item); setIsCatalogDialogOpen(true); }} data-testid={`button-edit-catalog-${item.id}`}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteCatalogItem(item.id)} disabled={deleteCatalogItem.isPending} data-testid={`button-delete-catalog-${item.id}`}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  )}
                </div>
                <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                  <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" />{item.region}</p>
                  <p className="flex items-center gap-2"><Database className="h-3.5 w-3.5" />{item.source}</p>
                  <p className="flex items-center gap-2"><CalendarDays className="h-3.5 w-3.5" />Diperbarui {item.priceUpdatedAt}</p>
                </div>
                <Button className="mt-4 w-full" onClick={() => handleUseCatalogItem(item)} disabled={projectId !== null && !canMutateShared} data-testid={`button-use-catalog-${item.id}`}>
                  Tambahkan ke BOQ
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Total Keseluruhan BOQ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-foreground" data-testid="text-total-cost">
              {formatCurrency(totalCost)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Dari {projectItems.length} item terdaftar
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-chart-2" />
              Kategori Terbesar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-foreground truncate" data-testid="text-top-category">
              {topCategory ? topCategory[0] : "-"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {topCategory ? formatCurrency(topCategory[1]) : "Rp 0"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-destructive" />
              Alokasi Risiko Tinggi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-foreground" data-testid="text-top-risk">
              {formatCurrency(topRiskCost)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Investasi untuk mitigasi risiko tinggi
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="text-base">Rekap per Kategori Biaya</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {categoryRecap.length ? categoryRecap.map(entry => (
              <div key={entry.label} className="flex items-center justify-between gap-4 border-b border-border/50 pb-3 last:border-0 last:pb-0">
                <span className="text-sm text-muted-foreground">{entry.label}</span>
                <span className="font-mono text-sm font-semibold" data-testid={`text-category-recap-${entry.label}`}>
                  {formatCurrency(entry.total)}
                </span>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground">Belum ada biaya untuk direkap.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="text-base">Rekap Alokasi per Risiko</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {riskRecap.map(entry => {
              const percentage = totalCost > 0 ? (entry.total / totalCost) * 100 : 0;
              return (
                <div key={entry.label} className="space-y-2" data-testid={`risk-recap-${entry.label}`}>
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-muted-foreground">Risiko {entry.label}</span>
                    <span className="font-mono font-semibold">{formatCurrency(entry.total)} · {percentage.toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        entry.label === "Tinggi" ? "bg-destructive" : entry.label === "Sedang" ? "bg-amber-500" : "bg-green-500"
                      )}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-4 py-4 font-medium">Uraian Pekerjaan</th>
                <th className="px-4 py-4 font-medium">Kategori</th>
                <th className="px-4 py-4 font-medium text-right">Vol</th>
                <th className="px-4 py-4 font-medium">Sat</th>
                <th className="px-4 py-4 font-medium text-right">Harga Satuan</th>
                <th className="px-4 py-4 font-medium text-right">Total</th>
                <th className="px-4 py-4 font-medium">Risiko</th>
                <th className="px-4 py-4 font-medium">Tahap</th>
                <th className="px-4 py-4 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingShared && projectId !== null ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                  </td>
                </tr>
              ) : projectItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center">
                      <ClipboardList className="h-12 w-12 text-muted-foreground/30 mb-3" />
                      <p>Belum ada item BOQ untuk proyek ini.</p>
                      <Button variant="link" onClick={handleOpenCreate} className="mt-2 text-primary">
                        Tambah item pertama Anda
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                projectItems.map((item, i) => (
                  <tr 
                    key={item.id} 
                    className="bg-card border-b border-border/50 hover:bg-accent/20 transition-colors group"
                    data-testid={`row-boq-item-${i}`}
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      <div className="max-w-[250px] truncate" title={item.description}>
                        {item.description}
                      </div>
                      <div className="text-xs text-muted-foreground font-normal truncate mt-0.5" title={item.controlNeed}>
                        {item.controlNeed}
                      </div>
                      {item.priceSource && (
                        <div className="mt-1 text-[11px] text-muted-foreground" data-testid={`text-price-snapshot-${item.id}`}>
                          Acuan: {item.priceRegion} · {item.priceSource} · {item.priceUpdatedAt}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-secondary text-secondary-foreground border border-border/50">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">{item.volume}</td>
                    <td className="px-4 py-3 text-muted-foreground">{item.unit}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(item.unitPrice)}</td>
                    <td className="px-4 py-3 text-right font-medium text-foreground">
                      {formatCurrency(item.volume * item.unitPrice)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border",
                        item.risk === 'Tinggi' ? "bg-destructive/10 text-destructive border-destructive/20" :
                        item.risk === 'Sedang' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                        "bg-green-500/10 text-green-500 border-green-500/20"
                      )}>
                        {item.risk}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{item.stage}</td>
                    <td className="px-4 py-3 text-right">
                      <div className={cn(
                        "flex items-center justify-end gap-1 transition-opacity",
                        projectId !== null && !canMutateShared ? "hidden" : "opacity-0 group-hover:opacity-100",
                      )}>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 hover:bg-primary/20 hover:text-primary"
                          onClick={() => handleOpenEdit(item)}
                          data-testid={`button-edit-${i}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 hover:bg-destructive/20 hover:text-destructive"
                          onClick={() => handleDelete(item.id)}
                          data-testid={`button-delete-${i}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <BoqItemDialog 
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        initialData={editingItem}
        onSave={handleSave}
      />
      <CatalogItemDialog
        isOpen={isCatalogDialogOpen}
        onClose={() => setIsCatalogDialogOpen(false)}
        initialData={editingCatalogItem}
        onSave={handleSaveCatalogItem}
      />
    </div>
  );
}