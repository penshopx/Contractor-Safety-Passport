import { useState } from "react";
import { useListFieldActivities, useCreateFieldActivity, getListFieldActivitiesQueryKey, useListProjects } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Plus, Search, Megaphone, Stethoscope, AlertTriangle, FileSignature, Camera, MapPin, PenLine, Cloud } from "lucide-react";
import { toast } from "sonner";
import { FieldActivityInputType, FieldActivityInputStatus } from "@workspace/api-client-react";

const createActivitySchema = z.object({
  title: z.string().min(1, "Judul kegiatan wajib diisi"),
  type: z.nativeEnum(FieldActivityInputType),
  projectId: z.coerce.number().int().positive("Proyek wajib dipilih"),
  actor: z.string().min(1, "Pelaksana wajib diisi"),
  status: z.nativeEnum(FieldActivityInputStatus),
  notes: z.string().max(4000).optional(),
});

export default function FieldActivitiesPage() {
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  
  const { data: activities, isLoading } = useListFieldActivities();
  const { data: projects } = useListProjects();
  const createActivity = useCreateFieldActivity();

  const filteredActivities = activities?.filter(a => 
    a.title.toLowerCase().includes(search.toLowerCase()) || 
    a.project.toLowerCase().includes(search.toLowerCase())
  );

  const form = useForm<z.infer<typeof createActivitySchema>>({
    resolver: zodResolver(createActivitySchema),
    defaultValues: {
      title: "",
      type: "Toolbox",
      projectId: 0,
      actor: "",
      status: "open"
      ,notes: ""
    }
  });

  const onSubmit = (values: z.infer<typeof createActivitySchema>) => {
    const project = projects?.find((item) => item.id === values.projectId);
    if (!project) {
      form.setError("projectId", { message: "Proyek wajib dipilih" });
      return;
    }
    createActivity.mutate(
      { data: {
        ...values,
        project: project.name,
        notes: values.notes || undefined,
        clientId: `web-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
        occurredAt: new Date().toISOString(),
      } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListFieldActivitiesQueryKey() });
          setIsDialogOpen(false);
          form.reset();
          toast.success("Kegiatan lapangan berhasil dicatat");
        },
        onError: () => {
          toast.error("Gagal mencatat kegiatan");
        }
      }
    );
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'Toolbox': return <Megaphone className="h-4 w-4" />;
      case 'Inspection': return <Stethoscope className="h-4 w-4" />;
      case 'Near miss': return <AlertTriangle className="h-4 w-4 text-accent-foreground" />;
      case 'Permit to work': return <FileSignature className="h-4 w-4" />;
      default: return <Megaphone className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'complete': return <Badge className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30">Selesai</Badge>;
      case 'review': return <Badge className="bg-accent/20 text-accent-foreground border-accent/30 hover:bg-accent/30">Diperiksa</Badge>;
      case 'open': return <Badge variant="destructive" className="bg-destructive/20 text-destructive border-destructive/30 hover:bg-destructive/30">Terbuka / Aktif</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Aktivitas Lapangan</h1>
          <p className="text-muted-foreground mt-1">Laporan harian K3, inspeksi, dan izin kerja (PTW).</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shrink-0 gap-2">
              <Plus className="h-4 w-4" /> Catat Aktivitas
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] border-border/50 bg-card/95 backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle>Formulir Kegiatan Lapangan</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem><FormLabel>Judul Laporan</FormLabel><FormControl><Input placeholder="Toolbox Meeting Pagi / Inspeksi Apar..." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="type" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jenis Kegiatan</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Pilih Jenis" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="Toolbox">Toolbox Meeting</SelectItem>
                          <SelectItem value="Inspection">Inspeksi / Patrol</SelectItem>
                          <SelectItem value="Permit to work">Izin Kerja (PTW)</SelectItem>
                          <SelectItem value="Near miss">Laporan Near Miss</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status Laporan</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="open">Aktif / Terbuka</SelectItem>
                          <SelectItem value="review">Menunggu Validasi</SelectItem>
                          <SelectItem value="complete">Selesai / Ditutup</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem><FormLabel>Catatan / Temuan</FormLabel><FormControl><Input placeholder="Topik, temuan, atau tindakan koreksi..." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="projectId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proyek</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ? String(field.value) : ""}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Pilih proyek" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {projects?.map((project) => (
                            <SelectItem key={project.id} value={String(project.id)}>{project.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="actor" render={({ field }) => (
                    <FormItem><FormLabel>Penanggung Jawab</FormLabel><FormControl><Input placeholder="Nama Petugas..." {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="pt-4 flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
                  <Button type="submit" disabled={createActivity.isPending}>
                    {createActivity.isPending ? "Menyimpan..." : "Simpan Laporan"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border/50 bg-card/40 backdrop-blur-sm">
        <div className="p-4 border-b border-border/50 flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Cari aktivitas atau proyek..." 
              className="pl-9 bg-background/50 border-border/50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/50">
                <TableHead>Aktivitas</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead>Proyek</TableHead>
                <TableHead>Pelaksana / Waktu</TableHead>
                <TableHead>Bukti digital</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Memuat data...
                  </TableCell>
                </TableRow>
              ) : filteredActivities?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Tidak ada aktivitas ditemukan.
                  </TableCell>
                </TableRow>
              ) : (
                filteredActivities?.map((activity) => (
                  <TableRow key={activity.id} className="border-border/50 hover:bg-muted/50 transition-colors">
                    <TableCell>
                      <span className="font-medium text-foreground">{activity.title}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-secondary text-foreground">
                          {getActivityIcon(activity.type)}
                        </div>
                        <span className="text-sm">{activity.type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{activity.project}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium">{activity.actor}</span>
                        <span className="text-xs text-muted-foreground font-mono">
                          {new Date(activity.occurredAt).toLocaleString('id-ID', {day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'})}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        {activity.photoObjectPath ? (
                          <a href={`/api/storage${activity.photoObjectPath}`} target="_blank" rel="noreferrer" title="Buka foto bukti">
                            <img src={`/api/storage${activity.photoObjectPath}`} alt="Bukti lapangan" className="h-9 w-9 rounded-md object-cover ring-1 ring-border" />
                          </a>
                        ) : <Camera className="h-4 w-4 opacity-30" />}
                        <MapPin className={`h-4 w-4 ${activity.latitude != null ? "text-primary" : "opacity-30"}`} />
                        <PenLine className={`h-4 w-4 ${activity.signatureSvg ? "text-primary" : "opacity-30"}`} />
                        <Cloud className="h-4 w-4 text-emerald-400" />
                      </div>
                      {activity.notes ? <p className="mt-1 max-w-[220px] truncate text-xs text-muted-foreground" title={activity.notes}>{activity.notes}</p> : null}
                    </TableCell>
                    <TableCell className="text-right">
                      {getStatusBadge(activity.status)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}