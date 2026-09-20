import { useState } from "react";
import { useListPeople, useCreatePerson, getListPeopleQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { PersonInputStatus } from "@workspace/api-client-react";

const createPersonSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  role: z.string().min(1, "Peran K3 wajib diisi"),
  level: z.string().min(1, "Tingkat wajib diisi"),
  skkni: z.string().min(1, "SKKNI/Sertifikasi wajib diisi"),
  project: z.string().min(1, "Penempatan proyek wajib diisi"),
  status: z.nativeEnum(PersonInputStatus),
});

export default function PeoplePage() {
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  
  const { data: people, isLoading } = useListPeople();
  const createPerson = useCreatePerson();

  const filteredPeople = people?.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.skkni.toLowerCase().includes(search.toLowerCase())
  );

  const form = useForm<z.infer<typeof createPersonSchema>>({
    resolver: zodResolver(createPersonSchema),
    defaultValues: {
      name: "",
      role: "Ahli K3 Konstruksi",
      level: "Muda",
      skkni: "",
      project: "Pusat",
      status: "active"
    }
  });

  const onSubmit = (values: z.infer<typeof createPersonSchema>) => {
    createPerson.mutate(
      { data: values },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListPeopleQueryKey() });
          setIsDialogOpen(false);
          form.reset();
          toast.success("Personel K3 berhasil ditambahkan");
        },
        onError: () => {
          toast.error("Gagal menambahkan personel");
        }
      }
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Personel K3</h1>
          <p className="text-muted-foreground mt-1">Daftar tenaga ahli dan petugas K3 dengan kompetensi SKKNI.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shrink-0 gap-2">
              <Plus className="h-4 w-4" /> Personel Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] border-border/50 bg-card/95 backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle>Tambah Personel K3</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Nama Lengkap</FormLabel><FormControl><Input placeholder="Budi Santoso..." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="role" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Peran</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Pilih Peran" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="Ahli K3 Konstruksi">Ahli K3 Konstruksi</SelectItem>
                          <SelectItem value="Petugas K3">Petugas K3</SelectItem>
                          <SelectItem value="Koordinator K3">Koordinator K3</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="level" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tingkat</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Pilih Tingkat" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="Utama">Utama</SelectItem>
                          <SelectItem value="Madya">Madya</SelectItem>
                          <SelectItem value="Muda">Muda</SelectItem>
                          <SelectItem value="Dasar">Dasar / Umum</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="skkni" render={({ field }) => (
                  <FormItem><FormLabel>Sertifikat SKKNI</FormLabel><FormControl><Input placeholder="No. Sertifikat / Kompetensi..." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="project" render={({ field }) => (
                    <FormItem><FormLabel>Penempatan</FormLabel><FormControl><Input placeholder="Internal / Proyek..." {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status Legalitas</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="active">Aktif & Valid</SelectItem>
                          <SelectItem value="expiring">Akan Kedaluwarsa</SelectItem>
                          <SelectItem value="missing">Tidak Valid / Kosong</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="pt-4 flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
                  <Button type="submit" disabled={createPerson.isPending}>
                    {createPerson.isPending ? "Menyimpan..." : "Simpan Personel"}
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
              placeholder="Cari nama atau nomor SKKNI..." 
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
                <TableHead>Nama & Kompetensi</TableHead>
                <TableHead>Peran & Tingkat</TableHead>
                <TableHead>Penempatan</TableHead>
                <TableHead className="text-right">Status Sertifikasi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    Memuat data...
                  </TableCell>
                </TableRow>
              ) : filteredPeople?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    Tidak ada personel ditemukan.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPeople?.map((person) => (
                  <TableRow key={person.id} className="border-border/50 hover:bg-muted/50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-primary/20 bg-primary/10">
                          <AvatarFallback className="text-primary bg-transparent text-xs font-semibold">{person.initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{person.name}</p>
                          <p className="text-xs text-muted-foreground font-mono mt-0.5">{person.skkni}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 items-start">
                        <span className="text-sm font-medium">{person.role}</span>
                        <Badge variant="secondary" className="bg-secondary text-secondary-foreground text-[10px] h-4 py-0">
                          {person.level}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{person.project}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      {person.status === 'active' ? (
                        <Badge className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30">Valid</Badge>
                      ) : person.status === 'expiring' ? (
                        <Badge className="bg-accent/20 text-accent-foreground border-accent/30 hover:bg-accent/30">Hampir Kedaluwarsa</Badge>
                      ) : (
                        <Badge variant="destructive" className="bg-destructive/20 text-destructive border-destructive/30 hover:bg-destructive/30">Tidak Valid</Badge>
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