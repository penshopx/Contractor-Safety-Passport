import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import {
  useGetProject,
  useUpdateProject,
  getGetProjectQueryKey,
  useListProjectClassifications,
  getListProjectClassificationsQueryKey,
  useGetOrganizationProjectFit,
  getGetOrganizationProjectFitQueryKey,
  useListConstructionClassifications,
  useAddProjectClassification,
  useGetOrganizationContext
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Building2,
  MapPin,
  CalendarDays,
  CheckCircle2,
  Save,
  Briefcase,
  AlertTriangle,
  Plus,
  Info
} from "lucide-react";
import { toast } from "sonner";
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
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const addProjClassSchema = z.object({
  classificationId: z.string().min(1, "Pilih klasifikasi"),
  role: z.enum(["PRIMARY", "SUPPORTING"]),
  requiredQualification: z.enum(["KECIL", "MENENGAH", "BESAR", "NONE"]),
});

type AddProjClassFormValues = z.infer<typeof addProjClassSchema>;

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const projectId = parseInt(id || "0", 10);
  const queryClient = useQueryClient();
  
  const { data: orgContext } = useGetOrganizationContext();
  const canEdit = orgContext?.role === "owner" || orgContext?.role === "safety_expert";

  const { data: project, isLoading: isProjectLoading, error } = useGetProject(projectId);
  const updateProject = useUpdateProject();

  const { data: projectClassifications, isLoading: isClassLoading } = useListProjectClassifications(projectId);
  const { data: projectFit, isLoading: isFitLoading } = useGetOrganizationProjectFit(projectId);
  
  const { data: referenceClassifications } = useListConstructionClassifications();
  const addProjectClass = useAddProjectClassification();

  const [progress, setProgress] = useState<string>("0");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  const form = useForm<AddProjClassFormValues>({
    resolver: zodResolver(addProjClassSchema),
    defaultValues: {
      classificationId: "",
      role: "PRIMARY",
      requiredQualification: "KECIL",
    },
  });

  useEffect(() => {
    if (project) {
      setProgress(project.progress.toString());
    }
  }, [project]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="text-destructive text-5xl">404</div>
        <h2 className="text-xl font-bold">Proyek tidak ditemukan</h2>
        <Button asChild variant="outline">
          <Link href="/projects">
            <span className="flex items-center"><ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Daftar</span>
          </Link>
        </Button>
      </div>
    );
  }

  const handleUpdateProgress = () => {
    const parsedProgress = parseInt(progress, 10);
    if (isNaN(parsedProgress) || parsedProgress < 0 || parsedProgress > 100) {
      toast.error("Progres harus antara 0 dan 100");
      return;
    }

    updateProject.mutate(
      { id: projectId, data: { progress: parsedProgress } },
      {
        onSuccess: (updatedProject) => {
          queryClient.setQueryData(getGetProjectQueryKey(projectId), updatedProject);
          toast.success("Progres berhasil diperbarui");
        },
        onError: () => {
          toast.error("Gagal memperbarui progres");
        }
      }
    );
  };

  const selectedProjectClassification = referenceClassifications?.find(
    (item) => item.id === form.watch("classificationId"),
  );

  const onSubmitAddClass = (data: AddProjClassFormValues) => {
    addProjectClass.mutate(
      {
        projectId,
        data: {
          classificationId: data.classificationId,
          role: data.role,
          requiredQualification: data.requiredQualification === "NONE"
            ? undefined
            : data.requiredQualification,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProjectClassificationsQueryKey(projectId) });
          queryClient.invalidateQueries({ queryKey: getGetOrganizationProjectFitQueryKey(projectId) });
          toast.success("Klasifikasi proyek ditambahkan");
          setIsAddDialogOpen(false);
          form.reset();
        },
        onError: () => {
          toast.error("Gagal menambahkan klasifikasi proyek");
        }
      }
    );
  };

  const getFitStatusBadge = (status: string) => {
    switch (status) {
      case "SESUAI":
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/30 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Sesuai</Badge>;
      case "SESUAI_BERSYARAT":
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Sesuai Bersyarat</Badge>;
      case "MEMERLUKAN_MITRA":
        return <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30 flex items-center gap-1"><Building2 className="w-3 h-3" /> Perlu KSO</Badge>;
      case "TIDAK_SESUAI":
        return <Badge className="bg-red-500/20 text-red-500 border-red-500/30 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Tidak Sesuai</Badge>;
      case "MENUNGGU_VERIFIKASI":
        return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30 flex items-center gap-1"><Info className="w-3 h-3" /> Menunggu Verifikasi</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground">
          <Link href="/projects">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          {isProjectLoading ? (
            <Skeleton className="h-8 w-64" />
          ) : (
            <h1 className="text-3xl font-bold tracking-tight">{project?.name}</h1>
          )}
        </div>
        {project && (
          <Badge className="bg-primary/20 text-primary border-primary/30 text-sm py-1 px-3">
            {project.status === 'active' ? 'Aktif' : project.status === 'tender' ? 'Tender' : 'Selesai'}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 border-border/50 bg-card/40 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Detail Proyek</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {isProjectLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Klien / Pemberi Kerja</span>
                    <div className="flex items-center gap-2 font-medium">
                      <Building2 className="h-4 w-4 text-primary" />
                      {project?.client}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Lokasi</span>
                    <div className="flex items-center gap-2 font-medium">
                      <MapPin className="h-4 w-4 text-primary" />
                      {project?.location}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Tanggal Mulai</span>
                    <div className="flex items-center gap-2 font-medium">
                      <CalendarDays className="h-4 w-4 text-primary" />
                      {project && new Date(project.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Standar K3</span>
                    <div className="flex items-center gap-2 font-medium">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      {project?.standard}
                    </div>
                  </div>
                  <div className="space-y-1 col-span-2 border-t border-border/50 pt-4 mt-2">
                    <span className="text-sm text-muted-foreground">Nilai Kontrak</span>
                    <div className="font-mono text-xl mt-1 tracking-tight">
                      Rp {project?.value.toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/40 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Progres Keseluruhan</CardTitle>
            <CardDescription>Update progres fisik lapangan</CardDescription>
          </CardHeader>
          <CardContent>
            {isProjectLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <div className="space-y-6">
                <div className="flex items-end gap-2">
                  <span className="text-5xl font-bold tracking-tighter text-primary">
                    {project?.progress}%
                  </span>
                </div>
                
                <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-1000 ease-out"
                    style={{ width: `${project?.progress}%` }}
                  />
                </div>

                <div className="pt-6 border-t border-border/50 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="progress">Update Progres (%)</Label>
                    <div className="flex gap-2">
                      <Input
                        id="progress"
                        type="number"
                        min="0"
                        max="100"
                        value={progress}
                        onChange={(e) => setProgress(e.target.value)}
                        className="bg-background/50 focus-visible:ring-primary"
                        data-testid="input-progress"
                      />
                      <Button
                        onClick={handleUpdateProgress}
                        disabled={updateProject.isPending || progress === project?.progress.toString()}
                        data-testid="button-save-progress"
                      >
                        {updateProject.isPending ? <Skeleton className="h-4 w-4 rounded-full" /> : <Save className="h-4 w-4 mr-2" />}
                        Simpan
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border/50 bg-card/40 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Persyaratan Klasifikasi</CardTitle>
              <CardDescription>Bidang dan sub-bidang yang dibutuhkan proyek</CardDescription>
            </div>
            {canEdit && (
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 gap-1" data-testid="button-add-project-class">
                    <Plus className="h-3.5 w-3.5" />
                    Tambah
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Tambah Persyaratan Proyek</DialogTitle>
                    <DialogDescription>
                      Tambahkan persyaratan bidang klasifikasi untuk proyek ini.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmitAddClass)} className="space-y-4 pt-4">
                      <FormField
                        control={form.control}
                        name="classificationId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bidang / Sub-bidang</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Pilih klasifikasi..." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <ScrollArea className="h-60">
                                  {referenceClassifications?.map((rc) => (
                                    <SelectItem key={rc.id} value={rc.id}>
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
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="role"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Peran</FormLabel>
                              <Select
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  const selected = referenceClassifications?.find((item) => item.id === value);
                                  form.setValue(
                                    "requiredQualification",
                                    selected?.allowedQualifications[0] ?? "NONE",
                                  );
                                }}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Pilih peran" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="PRIMARY">Utama (Primary)</SelectItem>
                                  <SelectItem value="SUPPORTING">Pendukung (Supporting)</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="requiredQualification"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Kualifikasi Min.</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Pilih kualifikasi" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {selectedProjectClassification?.allowedQualifications.length ? (
                                    selectedProjectClassification.allowedQualifications.map((qualification) => (
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
                      </div>
                      <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={addProjectClass.isPending} data-testid="button-submit-project-class">
                          {addProjectClass.isPending ? "Menyimpan..." : "Simpan Persyaratan"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}
          </CardHeader>
          <CardContent>
            {isClassLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : !projectClassifications || projectClassifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground border border-dashed rounded-lg bg-background/50">
                <Briefcase className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">Belum ada persyaratan klasifikasi</p>
              </div>
            ) : (
              <div className="space-y-3">
                {projectClassifications.map((pc) => (
                  <div key={`${pc.classificationId}-${pc.role}`} className="flex flex-col p-3 rounded-lg border border-border/50 bg-background/50" data-testid={`project-class-${pc.code}`}>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono bg-background text-xs">{pc.code}</Badge>
                          <span className="font-medium text-sm">{pc.name}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{pc.family}</p>
                      </div>
                      <Badge variant={pc.role === "PRIMARY" ? "default" : "secondary"} className="text-[10px]">
                        {pc.role === "PRIMARY" ? "Utama" : "Pendukung"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/40 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Analisis Kecocokan</CardTitle>
            <CardDescription>Evaluasi kemampuan perusahaan terhadap syarat proyek</CardDescription>
          </CardHeader>
          <CardContent>
            {isFitLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : !projectFit ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground border border-dashed rounded-lg bg-background/50">
                <Info className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">Tidak ada data klasifikasi untuk dianalisis</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border/50">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Status Kesesuaian</p>
                    {getFitStatusBadge(projectFit.status)}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Skor</p>
                    <span className="text-3xl font-bold text-primary">{projectFit.score}%</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Memenuhi Syarat ({projectFit.explanation.matched.length})
                    </h4>
                    {projectFit.explanation.matched.length > 0 ? (
                      <ul className="space-y-1">
                        {projectFit.explanation.matched.map(m => (
                          <li key={m} className="text-sm text-muted-foreground pl-6 relative">
                            <span className="absolute left-2 top-2 w-1.5 h-1.5 rounded-full bg-green-500/50" />
                            {m}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground pl-6 italic">Tidak ada</p>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      Tidak Memenuhi/Kurang ({projectFit.explanation.missing.length})
                    </h4>
                    {projectFit.explanation.missing.length > 0 ? (
                      <ul className="space-y-1">
                        {projectFit.explanation.missing.map(m => (
                          <li key={m} className="text-sm text-muted-foreground pl-6 relative">
                            <span className="absolute left-2 top-2 w-1.5 h-1.5 rounded-full bg-red-500/50" />
                            {m}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground pl-6 italic">Tidak ada syarat yang kurang</p>
                    )}
                  </div>

                  {projectFit.explanation.warnings.length > 0 && (
                    <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                      <h4 className="text-sm font-medium text-yellow-600 mb-2 flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        Catatan Tambahan
                      </h4>
                      <ul className="space-y-1">
                        {projectFit.explanation.warnings.map(w => (
                          <li key={w} className="text-sm text-yellow-600/90 pl-4 relative">
                            <span className="absolute left-0 top-1.5 w-1 h-1 rounded-full bg-yellow-500" />
                            {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}