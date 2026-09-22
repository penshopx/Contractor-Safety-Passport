import { useState, useMemo } from "react";
import {
  useListConstructionClassifications,
  useListOrganizationClassifications,
  useAddOrganizationClassification,
  getListOrganizationClassificationsQueryKey,
  useGetOrganizationContext
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Search,
  Plus,
  CheckCircle2,
  Clock,
  XCircle,
  Briefcase,
  Layers,
  FileCheck
} from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

const addClassificationSchema = z.object({
  classificationId: z.string().min(1, "Pilih klasifikasi"),
  qualification: z.enum(["KECIL", "MENENGAH", "BESAR", "NONE"]),
  evidenceStatus: z.enum(["MENUNGGU_VERIFIKASI", "TERVERIFIKASI", "DITOLAK"]),
  evidenceReference: z.string().optional(),
  notes: z.string().optional(),
});

type AddClassificationFormValues = z.infer<typeof addClassificationSchema>;

export default function ClassificationsPage() {
  const { data: orgContext } = useGetOrganizationContext();
  const canEdit = orgContext?.role === "owner" || orgContext?.role === "safety_expert";

  const { data: referenceClassifications, isLoading: isRefLoading } = useListConstructionClassifications();
  const { data: orgClassifications, isLoading: isOrgLoading } = useListOrganizationClassifications();
  const addOrgClass = useAddOrganizationClassification();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const form = useForm<AddClassificationFormValues>({
    resolver: zodResolver(addClassificationSchema),
    defaultValues: {
      classificationId: "",
      qualification: "KECIL",
      evidenceStatus: "MENUNGGU_VERIFIKASI",
      evidenceReference: "",
      notes: "",
    },
  });

  const selectedOrganizationClassification = referenceClassifications?.find(
    (item) => item.id === form.watch("classificationId"),
  );

  const onSubmit = (data: AddClassificationFormValues) => {
    addOrgClass.mutate(
      {
        data: {
          ...data,
          qualification: data.qualification === "NONE" ? undefined : data.qualification,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListOrganizationClassificationsQueryKey() });
          toast.success("Kemampuan berhasil ditambahkan");
          setIsAddDialogOpen(false);
          form.reset();
        },
        onError: () => {
          toast.error("Gagal menambahkan kemampuan");
        }
      }
    );
  };

  const filteredReferences = useMemo(() => {
    if (!referenceClassifications) return [];
    const lowerQuery = searchQuery.toLowerCase();
    return referenceClassifications.filter(
      c => c.code.toLowerCase().includes(lowerQuery) ||
           c.name.toLowerCase().includes(lowerQuery) ||
           c.family.toLowerCase().includes(lowerQuery)
    );
  }, [referenceClassifications, searchQuery]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "TERVERIFIKASI":
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/30 flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3" /> Terverifikasi</Badge>;
      case "MENUNGGU_VERIFIKASI":
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30 flex items-center gap-1.5"><Clock className="w-3 h-3" /> Menunggu</Badge>;
      case "DITOLAK":
        return <Badge className="bg-red-500/20 text-red-500 border-red-500/30 flex items-center gap-1.5"><XCircle className="w-3 h-3" /> Ditolak</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Briefcase className="h-8 w-8 text-primary" />
            Klasifikasi & Kemampuan
          </h1>
          <p className="text-muted-foreground mt-1">
            Kelola bidang kemampuan kontraktor dan referensi SBU/SBUJK.
          </p>
        </div>
        
        {canEdit && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-classification" className="gap-2 shrink-0">
                <Plus className="h-4 w-4" />
                Tambah Kemampuan
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] border-border/50 bg-background/95 backdrop-blur-xl">
              <DialogHeader>
                <DialogTitle>Tambah Kemampuan Perusahaan</DialogTitle>
                <DialogDescription>
                  Pilih klasifikasi dari direktori referensi untuk diklaim sebagai kemampuan perusahaan.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="classificationId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bidang / Sub-bidang</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            const selected = referenceClassifications?.find((item) => item.id === value);
                            form.setValue(
                              "qualification",
                              selected?.allowedQualifications[0] ?? "NONE",
                            );
                          }}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-classification-id">
                              <SelectValue placeholder="Pilih klasifikasi..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <ScrollArea className="h-60">
                              {referenceClassifications?.map((rc) => (
                                <SelectItem key={rc.id} value={rc.id} data-testid={`option-classification-${rc.code}`}>
                                  <span className="font-mono text-xs mr-2">{rc.code}</span>
                                  {rc.name}
                                </SelectItem>
                              ))}
                            </ScrollArea>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="qualification"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kualifikasi</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-qualification">
                              <SelectValue placeholder="Pilih kualifikasi" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {selectedOrganizationClassification?.allowedQualifications.length ? (
                              selectedOrganizationClassification.allowedQualifications.map((qualification) => (
                                <SelectItem key={qualification} value={qualification}>
                                  {qualification === "KECIL" ? "Kecil" : qualification === "MENENGAH" ? "Menengah" : "Besar"}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="NONE">Tidak ditentukan</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="evidenceStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status Bukti</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-evidence-status">
                                <SelectValue placeholder="Pilih status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="MENUNGGU_VERIFIKASI">Menunggu Verifikasi</SelectItem>
                              <SelectItem value="TERVERIFIKASI">Terverifikasi</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="evidenceReference"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Referensi Bukti (No. SBU)</FormLabel>
                          <FormControl>
                            <Input placeholder="Contoh: SBU-12345" {...field} value={field.value || ""} data-testid="input-evidence-reference" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Catatan</FormLabel>
                        <FormControl>
                          <Input placeholder="Catatan tambahan (opsional)" {...field} value={field.value || ""} data-testid="input-notes" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end pt-4">
                    <Button
                      type="submit"
                      disabled={addOrgClass.isPending}
                      className="w-full sm:w-auto"
                      data-testid="button-submit-classification"
                    >
                      {addOrgClass.isPending ? "Menyimpan..." : "Simpan Kemampuan"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs defaultValue="capabilities" className="w-full">
        <TabsList className="grid w-full sm:w-[400px] grid-cols-2 bg-background border border-border/50">
          <TabsTrigger value="capabilities" data-testid="tab-capabilities">Kemampuan Perusahaan</TabsTrigger>
          <TabsTrigger value="directory" data-testid="tab-directory">Direktori Referensi</TabsTrigger>
        </TabsList>

        <TabsContent value="capabilities" className="mt-6 space-y-4 outline-none">
          {isOrgLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : !orgClassifications || orgClassifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center border border-border/50 border-dashed rounded-xl bg-card/20" data-testid="empty-capabilities">
              <Layers className="h-10 w-10 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Belum ada kemampuan</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                Organisasi Anda belum memiliki klasifikasi kemampuan yang terdaftar. Tambahkan klasifikasi sesuai dengan SBU yang Anda miliki.
              </p>
              {canEdit && (
                <Button variant="outline" className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" /> Tambah Kemampuan
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {orgClassifications.map((c) => (
                <Card key={c.classificationId} className="border-border/50 bg-card/40 backdrop-blur-sm overflow-hidden relative" data-testid={`card-org-classification-${c.code}`}>
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <Badge variant="secondary" className="font-mono">{c.code}</Badge>
                        <CardTitle className="text-lg leading-tight">{c.name}</CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          <span>{c.family}</span>
                          <span className="text-border">•</span>
                          <span>{c.nature}</span>
                        </CardDescription>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {getStatusBadge(c.evidenceStatus || "MENUNGGU_VERIFIKASI")}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-4 text-sm mt-2">
                      <div className="space-y-1">
                        <span className="text-muted-foreground block text-xs">Kualifikasi</span>
                        <span className="font-medium flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-primary" /> 
                          {c.qualification || "-"}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground block text-xs">Referensi</span>
                        <span className="font-medium flex items-center gap-1">
                          <FileCheck className="w-3 h-3 text-primary" />
                          {c.evidenceReference || "-"}
                        </span>
                      </div>
                    </div>
                    {c.notes && (
                      <div className="mt-4 pt-3 border-t border-border/30 text-sm text-muted-foreground">
                        "{c.notes}"
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="directory" className="mt-6 outline-none space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari kode, nama, atau keluarga..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background/50"
              data-testid="input-search-directory"
            />
          </div>

          {isRefLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : (
            <div className="border border-border/50 rounded-xl overflow-hidden bg-card/20 backdrop-blur-sm">
              <div className="grid grid-cols-12 gap-4 p-4 font-medium text-sm text-muted-foreground border-b border-border/50 bg-card/40">
                <div className="col-span-2 sm:col-span-1">Kode</div>
                <div className="col-span-10 sm:col-span-6">Nama Sub-Bidang</div>
                <div className="hidden sm:block sm:col-span-3">Keluarga</div>
                <div className="hidden sm:block sm:col-span-2">Sifat</div>
              </div>
              
              <ScrollArea className="h-[600px]">
                {filteredReferences.length > 0 ? (
                  <div className="divide-y divide-border/30">
                    {filteredReferences.map((ref) => (
                      <div key={ref.id} className="grid grid-cols-12 gap-4 p-4 text-sm hover:bg-accent/30 transition-colors" data-testid={`row-directory-${ref.code}`}>
                        <div className="col-span-2 sm:col-span-1 font-mono text-primary font-medium">{ref.code}</div>
                        <div className="col-span-10 sm:col-span-6 font-medium text-foreground">{ref.name}</div>
                        <div className="hidden sm:block sm:col-span-3 text-muted-foreground">{ref.family}</div>
                        <div className="hidden sm:block sm:col-span-2">
                          <Badge variant="outline" className="text-xs font-normal">{ref.nature}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    Tidak ada klasifikasi yang cocok dengan pencarian.
                  </div>
                )}
              </ScrollArea>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
