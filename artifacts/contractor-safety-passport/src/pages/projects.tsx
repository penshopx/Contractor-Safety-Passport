import { useState } from "react";
import { Link } from "wouter";
import { useListProjects, useCreateProject, getListProjectsQueryKey } from "@workspace/api-client-react";
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
import { Plus, Search, MapPin, Building2 } from "lucide-react";
import { toast } from "sonner";
import { ProjectStandard, ProjectStatus } from "@workspace/api-client-react";

const createProjectSchema = z.object({
  name: z.string().min(1, "Nama proyek wajib diisi"),
  client: z.string().min(1, "Nama klien wajib diisi"),
  location: z.string().min(1, "Lokasi wajib diisi"),
  standard: z.nativeEnum(ProjectStandard),
  status: z.nativeEnum(ProjectStatus),
  startDate: z.string().min(1, "Tanggal mulai wajib diisi"),
  value: z.coerce.number().min(0, "Nilai proyek tidak boleh negatif")
});

export default function ProjectsPage() {
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  
  const { data: projects, isLoading } = useListProjects();
  const createProject = useCreateProject();

  const filteredProjects = projects?.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.client.toLowerCase().includes(search.toLowerCase())
  );

  const form = useForm<z.infer<typeof createProjectSchema>>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: "",
      client: "",
      location: "",
      standard: "SMKK",
      status: "active",
      startDate: new Date().toISOString().split('T')[0],
      value: 0
    }
  });

  const onSubmit = (values: z.infer<typeof createProjectSchema>) => {
    createProject.mutate(
      { data: values },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
          setIsDialogOpen(false);
          form.reset();
          toast.success("Proyek berhasil ditambahkan");
        },
        onError: () => {
          toast.error("Gagal menambahkan proyek");
        }
      }
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manajemen Proyek</h1>
          <p className="text-muted-foreground mt-1">Lacak dan kelola implementasi K3 di seluruh proyek Anda.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shrink-0 gap-2">
              <Plus className="h-4 w-4" /> Proyek Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] border-border/50 bg-card/95 backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle>Tambah Proyek Baru</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Nama Proyek</FormLabel><FormControl><Input placeholder="Pembangunan Gudang..." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="client" render={({ field }) => (
                    <FormItem><FormLabel>Klien/Pemberi Kerja</FormLabel><FormControl><Input placeholder="PT Maju Jaya..." {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="location" render={({ field }) => (
                    <FormItem><FormLabel>Lokasi</FormLabel><FormControl><Input placeholder="Jakarta..." {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="standard" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Standar K3</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Pilih Standar" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="SMKK">SMKK (PUPR)</SelectItem>
                          <SelectItem value="CSMS">CSMS (Migas)</SelectItem>
                          <SelectItem value="SMKK + CSMS">SMKK & CSMS</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Pilih Status" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="active">Aktif Berjalan</SelectItem>
                          <SelectItem value="tender">Tahap Tender</SelectItem>
                          <SelectItem value="completed">Selesai</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="startDate" render={({ field }) => (
                    <FormItem><FormLabel>Tanggal Mulai</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="value" render={({ field }) => (
                    <FormItem><FormLabel>Nilai Kontrak (Rp)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="pt-4 flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
                  <Button type="submit" disabled={createProject.isPending}>
                    {createProject.isPending ? "Menyimpan..." : "Simpan Proyek"}
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
              placeholder="Cari proyek atau klien..." 
              className="pl-9 bg-background/50 border-border/50 focus-visible:ring-primary"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/50">
                <TableHead>Nama Proyek</TableHead>
                <TableHead>Standar</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progres</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    Memuat data...
                  </TableCell>
                </TableRow>
              ) : filteredProjects?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    Tidak ada proyek ditemukan.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProjects?.map((project) => (
                  <TableRow key={project.id} className="border-border/50 hover:bg-muted/50 transition-colors">
                    <TableCell>
                      <div className="font-medium text-foreground">{project.name}</div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> {project.client}</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {project.location}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">{project.standard}</Badge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={project.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-full h-2 max-w-[100px] bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all duration-500 ease-out" 
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono">{project.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10">
                        <Link href={`/projects/${project.id}`}>
                          Detail
                        </Link>
                      </Button>
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

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'active':
      return <Badge className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30">Aktif</Badge>;
    case 'tender':
      return <Badge variant="secondary" className="bg-accent text-accent-foreground border-accent-foreground/20 hover:bg-accent/80">Tender</Badge>;
    case 'completed':
      return <Badge variant="outline" className="text-muted-foreground border-border/50">Selesai</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}