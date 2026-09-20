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
import { useListProjects } from '@workspace/api-client-react';
import { 
  useSafetyBoqStore, 
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
            {initialData ? "Edit Item BOQ" : "Tambah Item BOQ Baru"}
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
  const { items, addItem, updateItem, removeItem, isLoaded } = useSafetyBoqStore();
  const { data: projects } = useListProjects();
  
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SafetyBoqItem | null>(null);

  const projectItems = useMemo(() => {
    if (selectedProjectId === 'all') return items.filter(item => !item.projectId);
    const numId = Number(selectedProjectId);
    return items.filter(item => item.projectId === numId);
  }, [items, selectedProjectId]);

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
    setEditingItem(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (item: SafetyBoqItem) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus item ini?")) {
      removeItem(id);
      toast.success("Item berhasil dihapus");
    }
  };

  const handleSave = (data: BoqFormValues) => {
    if (editingItem) {
      updateItem(editingItem.id, data);
      toast.success("Item berhasil diperbarui");
    } else {
      addItem({
        ...data,
        projectId: selectedProjectId === 'all' ? null : Number(selectedProjectId)
      });
      toast.success("Item berhasil ditambahkan");
    }
  };

  const handleExportPdf = () => {
    const projName = selectedProjectId === 'all' ? 'Draft Umum' : projects?.find(p => p.id === Number(selectedProjectId))?.name || 'Proyek';
    exportBoqPdf(projectItems, projName);
    toast.success("PDF berhasil diekspor");
  };

  const handleExportCsv = () => {
    const projName = selectedProjectId === 'all' ? 'Draft Umum' : projects?.find(p => p.id === Number(selectedProjectId))?.name || 'Proyek';
    exportBoqCsv(projectItems, projName);
    toast.success("CSV berhasil diekspor");
  };

  if (!isLoaded) return null;

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
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
              <SelectItem value="all">Draft Umum (Tanpa Proyek)</SelectItem>
              {projects?.map(p => (
                <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={handleOpenCreate} className="gap-2" data-testid="button-create-item">
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
              {projectItems.length === 0 ? (
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
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
    </div>
  );
}