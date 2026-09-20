import { useState } from "react";
import { useListCertificates, useCreateCertificate, getListCertificatesQueryKey, CertificateInputStatus } from "@workspace/api-client-react";
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
import { Plus, Search, Award, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

const createCertSchema = z.object({
  owner: z.string().min(1, "Pemilik/Entitas wajib diisi"),
  credential: z.string().min(1, "Nama Kredensial wajib diisi"),
  issuer: z.string().min(1, "Penerbit wajib diisi"),
  expiresAt: z.string().min(1, "Tanggal Kedaluwarsa wajib diisi"),
  status: z.nativeEnum(CertificateInputStatus),
});

export default function CertificatesPage() {
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  
  const { data: certificates, isLoading } = useListCertificates();
  const createCert = useCreateCertificate();

  const filteredCerts = certificates?.filter(c => 
    c.owner.toLowerCase().includes(search.toLowerCase()) || 
    c.credential.toLowerCase().includes(search.toLowerCase())
  );

  const form = useForm<z.infer<typeof createCertSchema>>({
    resolver: zodResolver(createCertSchema),
    defaultValues: {
      owner: "",
      credential: "",
      issuer: "Kemenaker",
      expiresAt: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      status: "valid"
    }
  });

  const onSubmit = (values: z.infer<typeof createCertSchema>) => {
    createCert.mutate(
      { data: values },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCertificatesQueryKey() });
          setIsDialogOpen(false);
          form.reset();
          toast.success("Sertifikat berhasil ditambahkan");
        },
        onError: () => {
          toast.error("Gagal menambahkan sertifikat");
        }
      }
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sertifikat & Izin Alat</h1>
          <p className="text-muted-foreground mt-1">Lacak masa berlaku SIO, SILO, dan sertifikasi badan usaha.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shrink-0 gap-2">
              <Plus className="h-4 w-4" /> Tambah Sertifikat
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] border-border/50 bg-card/95 backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle>Input Sertifikat Baru</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                <FormField control={form.control} name="credential" render={({ field }) => (
                  <FormItem><FormLabel>Nama Kredensial / Alat</FormLabel><FormControl><Input placeholder="SIO Crane / SMK3..." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="owner" render={({ field }) => (
                  <FormItem><FormLabel>Pemilik (Alat/Personel/Badan)</FormLabel><FormControl><Input placeholder="Crane 01 / PT Jaya..." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="issuer" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Penerbit</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Pilih Penerbit" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="Kemenaker">Kemenaker</SelectItem>
                        <SelectItem value="PUPR">Kementerian PUPR</SelectItem>
                        <SelectItem value="ESDM">Kementerian ESDM (Migas)</SelectItem>
                        <SelectItem value="Internal">Internal (Inspeksi)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="expiresAt" render={({ field }) => (
                    <FormItem><FormLabel>Tanggal Kedaluwarsa</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status Saat Ini</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="valid">Berlaku</SelectItem>
                          <SelectItem value="expiring">Hampir Habis</SelectItem>
                          <SelectItem value="expired">Kedaluwarsa</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="pt-4 flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
                  <Button type="submit" disabled={createCert.isPending}>
                    {createCert.isPending ? "Menyimpan..." : "Simpan"}
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
              placeholder="Cari kredensial atau pemilik..." 
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
                <TableHead>Kredensial</TableHead>
                <TableHead>Pemilik / Objek</TableHead>
                <TableHead>Penerbit</TableHead>
                <TableHead>Berlaku Hingga</TableHead>
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
              ) : filteredCerts?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    Tidak ada sertifikat ditemukan.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCerts?.map((cert) => (
                  <TableRow key={cert.id} className="border-border/50 hover:bg-muted/50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-md bg-secondary/50 text-foreground">
                          <Award className="h-4 w-4" />
                        </div>
                        <span className="font-medium text-foreground">{cert.credential}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{cert.owner}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-[10px] bg-background">{cert.issuer}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-mono text-muted-foreground">
                        {new Date(cert.expiresAt).toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: 'numeric'})}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {cert.status === 'valid' ? (
                        <Badge className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30">Berlaku</Badge>
                      ) : cert.status === 'expiring' ? (
                        <Badge className="bg-accent/20 text-accent-foreground border-accent/30 hover:bg-accent/30 flex items-center gap-1 ml-auto">
                          <ShieldAlert className="h-3 w-3" /> Hampir Habis
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="bg-destructive/20 text-destructive border-destructive/30 hover:bg-destructive/30">Kedaluwarsa</Badge>
                      )}
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