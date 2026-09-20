import { useState } from "react";
import { useListDocuments, useCreateDocument, getListDocumentsQueryKey } from "@workspace/api-client-react";
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
import { Link } from "wouter";
import { Plus, Search, FileText, CheckCircle2, Clock, XCircle, FileCog, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { DocumentInputStandard, DocumentInputStatus } from "@workspace/api-client-react";

const createDocSchema = z.object({
  name: z.string().min(1, "Nama dokumen wajib diisi"),
  type: z.string().min(1, "Jenis dokumen wajib diisi"),
  standard: z.nativeEnum(DocumentInputStandard),
  project: z.string().min(1, "Nama proyek/organisasi wajib diisi"),
  status: z.nativeEnum(DocumentInputStatus),
});

export default function DocumentsPage() {
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  
  const { data: documents, isLoading } = useListDocuments();
  const createDoc = useCreateDocument();

  const filteredDocs = documents?.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) || 
    d.project.toLowerCase().includes(search.toLowerCase())
  );

  const form = useForm<z.infer<typeof createDocSchema>>({
    resolver: zodResolver(createDocSchema),
    defaultValues: {
      name: "",
      type: "Kebijakan",
      standard: "SMKK",
      project: "Internal",
      status: "review"
    }
  });

  const onSubmit = (values: z.infer<typeof createDocSchema>) => {
    createDoc.mutate(
      { data: values },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
          setIsDialogOpen(false);
          form.reset();
          toast.success("Dokumen berhasil ditambahkan");
        },
        onError: () => {
          toast.error("Gagal menambahkan dokumen");
        }
      }
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Register Dokumen K3</h1>
          <p className="text-muted-foreground mt-1">Kelola dan pantau validitas dokumen prosedur K3.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Link href="/document-generator" data-testid="link-document-generator">
            <Button variant="outline" className="shrink-0 gap-2 border-primary/50 text-primary hover:bg-primary/10">
              <FileCog className="h-4 w-4" /> Generator RKK & CSMS
            </Button>
          </Link>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="shrink-0 gap-2" data-testid="button-new-document">
                <Plus className="h-4 w-4" /> Dokumen Baru
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] border-border/50 bg-card/95 backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle>Tambah Register Dokumen</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Nama Dokumen</FormLabel><FormControl><Input placeholder="JSA Pekerjaan Galian..." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="type" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jenis</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Pilih Jenis" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="Kebijakan">Kebijakan</SelectItem>
                          <SelectItem value="Prosedur">Prosedur / SOP</SelectItem>
                          <SelectItem value="Formulir">Formulir</SelectItem>
                          <SelectItem value="JSA/IBPRP">JSA / IBPRP</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="standard" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Standar</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Standar" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="SMKK">SMKK</SelectItem>
                          <SelectItem value="CSMS">CSMS</SelectItem>
                          <SelectItem value="SMKK + CSMS">SMKK & CSMS</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="project" render={({ field }) => (
                  <FormItem><FormLabel>Relasi Proyek</FormLabel><FormControl><Input placeholder="Internal / Nama Proyek..." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status Dokumen</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Pilih Status" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="ready">Disetujui / Berlaku</SelectItem>
                        <SelectItem value="review">Dalam Tinjauan</SelectItem>
                        <SelectItem value="missing">Perlu Dibuat / Kosong</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="pt-4 flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
                  <Button type="submit" disabled={createDoc.isPending}>
                    {createDoc.isPending ? "Menyimpan..." : "Simpan"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      </div>

      <Card className="border-border/50 bg-card/40 backdrop-blur-sm">
        <div className="p-4 border-b border-border/50 flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Cari dokumen..." 
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
                <TableHead>Nama Dokumen</TableHead>
                <TableHead>Jenis & Standar</TableHead>
                <TableHead>Proyek</TableHead>
                <TableHead>Update Terakhir</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    Memuat data...
                  </TableCell>
                </TableRow>
              ) : filteredDocs?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    Tidak ada dokumen ditemukan.
                  </TableCell>
                </TableRow>
              ) : (
                filteredDocs?.map((doc) => (
                  <TableRow key={doc.id} className="border-border/50 hover:bg-muted/50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-md ${doc.status === 'ready' ? 'bg-primary/10 text-primary' : doc.status === 'review' ? 'bg-accent/10 text-accent-foreground' : 'bg-destructive/10 text-destructive'}`}>
                          <FileText className="h-4 w-4" />
                        </div>
                        <span className="font-medium text-foreground">{doc.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 items-start">
                        <span className="text-xs">{doc.type}</span>
                        <Badge variant="outline" className="text-[10px] font-mono h-4 bg-background/50">{doc.standard}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{doc.project}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground font-mono">
                        {new Date(doc.updatedAt).toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: 'numeric'})}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DocStatusBadge status={doc.status} />
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

function DocStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'ready':
      return (
        <div className="flex items-center justify-end gap-1.5 text-primary">
          <CheckCircle2 className="h-4 w-4" />
          <span className="text-sm font-medium">Disetujui</span>
        </div>
      );
    case 'review':
      return (
        <div className="flex items-center justify-end gap-1.5 text-accent-foreground">
          <Clock className="h-4 w-4" />
          <span className="text-sm font-medium">Tinjauan</span>
        </div>
      );
    case 'missing':
      return (
        <div className="flex items-center justify-end gap-1.5 text-destructive">
          <XCircle className="h-4 w-4" />
          <span className="text-sm font-medium">Kosong</span>
        </div>
      );
    default:
      return <span>{status}</span>;
  }
}