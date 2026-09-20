import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useGetProject, useUpdateProject, getGetProjectQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Building2, MapPin, CalendarDays, CheckCircle2, Save } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const projectId = parseInt(id || "0", 10);
  const queryClient = useQueryClient();
  
  const { data: project, isLoading, error } = useGetProject(projectId);
  const updateProject = useUpdateProject();
  
  const [progress, setProgress] = useState<string>("0");
  
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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground">
          <Link href="/projects">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          {isLoading ? (
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
            {isLoading ? (
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
            {isLoading ? (
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
                      />
                      <Button 
                        onClick={handleUpdateProgress} 
                        disabled={updateProject.isPending || progress === project?.progress.toString()}
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
    </div>
  );
}