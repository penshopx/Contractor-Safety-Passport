import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { 
  ShieldCheck, 
  ShieldAlert, 
  HardHat, 
  Eye, 
  UserPlus,
  Mail,
  Loader2,
  Trash2,
  X
} from 'lucide-react';

import {
  useGetOrganizationContext,
  useListOrganizationMembers,
  useInviteOrganizationMember,
  useRemoveOrganizationMember,
  useRevokeOrganizationInvitation,
  useUpdateOrganizationMemberRole,
  getListOrganizationMembersQueryKey,
} from '@workspace/api-client-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const formSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  role: z.enum(["safety_expert", "field_officer", "viewer"], {
    required_error: "Pilih peran pengguna",
  }),
});
type AssignableRole = z.infer<typeof formSchema>["role"];

const RoleIcon = ({ role, className = "h-4 w-4" }: { role: string, className?: string }) => {
  switch (role) {
    case 'owner': return <ShieldCheck className={`${className} text-primary`} />;
    case 'safety_expert': return <ShieldAlert className={`${className} text-amber-500`} />;
    case 'field_officer': return <HardHat className={`${className} text-emerald-500`} />;
    case 'viewer': return <Eye className={`${className} text-blue-500`} />;
    default: return null;
  }
};

const RoleLabel = ({ role }: { role: string }) => {
  switch (role) {
    case 'owner': return 'Pemilik';
    case 'safety_expert': return 'Ahli K3';
    case 'field_officer': return 'Petugas Lapangan';
    case 'viewer': return 'Pemantau';
    default: return role;
  }
};

const formatDate = (isoString: string) => {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(new Date(isoString));
};

function TeamSkeleton() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/50">
            <CardHeader className="pb-4 border-b border-border/50">
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="p-0">
               <div className="divide-y divide-border/50">
                  {[1,2,3].map(i => (
                    <div key={i} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div>
                          <Skeleton className="h-4 w-32 mb-2" />
                          <Skeleton className="h-3 w-48" />
                        </div>
                      </div>
                      <Skeleton className="h-8 w-32" />
                    </div>
                  ))}
               </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-4 border-b border-border/50">
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                 {[1,2].map(i => (
                   <div key={i} className="p-4">
                     <Skeleton className="h-4 w-32 mb-3" />
                     <Skeleton className="h-3 w-24" />
                   </div>
                 ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function TeamPage() {
  const queryClient = useQueryClient();
  const { data: orgContext } = useGetOrganizationContext();
  const [open, setOpen] = useState(false);

  const isOwner = orgContext?.role === 'owner';

  const { data, isLoading, isError } = useListOrganizationMembers({
    query: {
      enabled: isOwner,
      queryKey: getListOrganizationMembersQueryKey(),
    }
  });

  const inviteMember = useInviteOrganizationMember();
  const updateRole = useUpdateOrganizationMemberRole();
  const removeMember = useRemoveOrganizationMember();
  const revokeInvitation = useRevokeOrganizationInvitation();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      role: "viewer",
    },
  });

  if (!isOwner) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-in zoom-in-95 duration-500">
        <div className="h-20 w-20 bg-destructive/10 rounded-full flex items-center justify-center mb-6 border border-destructive/20 shadow-sm">
          <ShieldAlert className="h-10 w-10 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold mb-3 tracking-tight">Akses Ditolak</h1>
        <p className="text-muted-foreground max-w-md leading-relaxed">
          Hanya pemilik workspace yang dapat mengakses halaman manajemen tim. Silakan hubungi pemilik jika Anda memerlukan perubahan akses.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return <TeamSkeleton />;
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
        <ShieldAlert className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Gagal Memuat Data</h2>
        <p className="text-muted-foreground">Terjadi kesalahan saat mengambil data tim. Silakan muat ulang halaman.</p>
      </div>
    );
  }

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    inviteMember.mutate({ data: values }, {
      onSuccess: () => {
        toast.success("Undangan berhasil dikirim");
        queryClient.invalidateQueries({ queryKey: getListOrganizationMembersQueryKey() });
        setOpen(false);
        form.reset();
      },
      onError: (error) => {
        const msg = error.status === 409
          ? "Pengguna dengan email ini sudah ada di dalam tim atau sudah diundang."
          : "Gagal mengirim undangan. Silakan coba lagi.";
        toast.error(msg);
      }
    });
  };

  const handleRoleChange = (userId: string, newRole: AssignableRole) => {
    updateRole.mutate({ userId, data: { role: newRole } }, {
      onSuccess: () => {
        toast.success("Peran berhasil diperbarui");
        queryClient.invalidateQueries({ queryKey: getListOrganizationMembersQueryKey() });
      },
      onError: () => {
        toast.error("Gagal memperbarui peran pengguna.");
      }
    });
  };

  const refreshTeam = () =>
    queryClient.invalidateQueries({ queryKey: getListOrganizationMembersQueryKey() });

  const handleRemoveMember = (userId: string) => {
    removeMember.mutate({ userId }, {
      onSuccess: () => {
        toast.success("Akses anggota berhasil dicabut");
        refreshTeam();
      },
      onError: () => {
        toast.error("Gagal mencabut akses anggota.");
      }
    });
  };

  const handleRevokeInvitation = (invitationId: string) => {
    revokeInvitation.mutate({ invitationId }, {
      onSuccess: () => {
        toast.success("Undangan berhasil dibatalkan");
        refreshTeam();
      },
      onError: () => {
        toast.error("Gagal membatalkan undangan.");
      }
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Manajemen Tim</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Kelola akses dan peran anggota di workspace Anda.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="shrink-0 gap-2 shadow-sm">
              <UserPlus className="h-4 w-4" />
              Undang Anggota
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md border-border/50 shadow-xl">
            <DialogHeader>
              <DialogTitle>Undang Anggota Tim</DialogTitle>
              <DialogDescription>
                Kirimkan undangan ke email rekan Anda untuk bergabung dengan workspace ini.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 mt-2">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alamat Email</FormLabel>
                      <FormControl>
                        <Input placeholder="email@contoh.com" {...field} className="bg-background/50 focus-visible:bg-background transition-colors" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Peran Pengguna</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background/50 focus-visible:bg-background transition-colors">
                            <SelectValue placeholder="Pilih peran..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="safety_expert">
                            <div className="flex items-center gap-2">
                              <ShieldAlert className="h-4 w-4 text-amber-500" />
                              <span>Ahli K3</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="field_officer">
                            <div className="flex items-center gap-2">
                              <HardHat className="h-4 w-4 text-emerald-500" />
                              <span>Petugas Lapangan</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="viewer">
                            <div className="flex items-center gap-2">
                              <Eye className="h-4 w-4 text-blue-500" />
                              <span>Pemantau</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={inviteMember.isPending}>
                    {inviteMember.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {inviteMember.isPending ? "Mengirim..." : "Kirim Undangan"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
        <div className="xl:col-span-2 space-y-6">
          <Card className="border-border/50 shadow-sm overflow-hidden bg-card">
            <CardHeader className="pb-4 border-b border-border/50 bg-card/50">
              <CardTitle>Anggota Aktif</CardTitle>
              <CardDescription>
                Pengguna yang memiliki akses ke workspace.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {data.members.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center justify-center">
                   <p className="text-sm text-muted-foreground">Belum ada anggota aktif.</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {data.members.map((member) => {
                    const isCurrentUserOwner = member.role === 'owner';
                    const initials = member.name 
                      ? member.name.substring(0, 2).toUpperCase() 
                      : member.email.substring(0, 2).toUpperCase();
                      
                    return (
                      <div key={member.userId} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-accent/20 transition-colors">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-10 w-10 border border-primary/20 shadow-sm">
                            <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium text-sm text-foreground truncate">
                              {member.name || 'Pengguna Tanpa Nama'}
                            </span>
                            <span className="text-xs text-muted-foreground truncate">
                              {member.email}
                            </span>
                            <span className="text-[10px] text-muted-foreground/70 mt-0.5">
                              Bergabung: {formatDate(member.joinedAt)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center sm:w-auto w-full justify-end">
                          {isCurrentUserOwner ? (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-md">
                              <RoleIcon role={member.role} />
                              <span className="text-xs font-semibold text-primary"><RoleLabel role={member.role} /></span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Select
                                value={member.role}
                                onValueChange={(val) => handleRoleChange(member.userId, val as AssignableRole)}
                                disabled={updateRole.isPending && updateRole.variables?.userId === member.userId}
                              >
                                <SelectTrigger
                                  className="w-[170px] h-9 bg-background/50 border-border/50 shadow-sm"
                                  data-testid={`select-role-${member.userId}`}
                                >
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="safety_expert">
                                    <div className="flex items-center gap-2">
                                      <ShieldAlert className="h-4 w-4 text-amber-500" />
                                      <span>Ahli K3</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="field_officer">
                                    <div className="flex items-center gap-2">
                                      <HardHat className="h-4 w-4 text-emerald-500" />
                                      <span>Petugas Lapangan</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="viewer">
                                    <div className="flex items-center gap-2">
                                      <Eye className="h-4 w-4 text-blue-500" />
                                      <span>Pemantau</span>
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-muted-foreground hover:text-destructive"
                                    disabled={removeMember.isPending}
                                    data-testid={`button-remove-member-${member.userId}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Cabut akses {member.name}</span>
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Cabut akses anggota?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {member.name} ({member.email}) tidak akan dapat mengakses workspace ini lagi.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleRemoveMember(member.userId)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      data-testid={`button-confirm-remove-member-${member.userId}`}
                                    >
                                      Cabut Akses
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="xl:col-span-1 space-y-6">
          <Card className="border-border/50 shadow-sm bg-card/30 overflow-hidden">
            <CardHeader className="pb-4 border-b border-border/50 bg-card/50">
              <CardTitle className="text-base flex items-center gap-2">
                Menunggu Konfirmasi
                {data.invitations.length > 0 && (
                  <Badge variant="secondary" className="ml-auto bg-primary/20 text-primary border-none">
                    {data.invitations.length}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs">
                Undangan yang belum diterima.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {data.invitations.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center justify-center">
                   <div className="h-12 w-12 rounded-full bg-accent/50 flex items-center justify-center mb-3">
                     <Mail className="h-5 w-5 text-muted-foreground/70" />
                   </div>
                   <p className="text-sm text-muted-foreground font-medium">Tidak ada undangan</p>
                   <p className="text-xs text-muted-foreground/70 mt-1">Semua anggota telah bergabung.</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {data.invitations.map((invitation) => (
                    <div key={invitation.id} className="p-4 hover:bg-accent/10 transition-colors">
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <p className="text-sm font-medium truncate flex-1" title={invitation.email}>
                          {invitation.email}
                        </p>
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px] font-semibold uppercase tracking-wider shrink-0">
                          Pending
                        </Badge>
                      </div>
                       <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium bg-accent/30 px-2 py-1 rounded-md">
                          <RoleIcon role={invitation.role} className="h-3 w-3" />
                          <span><RoleLabel role={invitation.role} /></span>
                        </div>
                         <div className="flex items-center gap-1">
                           <span className="text-[10px] text-muted-foreground/70">
                             {formatDate(invitation.createdAt)}
                           </span>
                           <AlertDialog>
                             <AlertDialogTrigger asChild>
                               <Button
                                 variant="ghost"
                                 size="icon"
                                 className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                 disabled={revokeInvitation.isPending}
                                 data-testid={`button-revoke-invitation-${invitation.id}`}
                               >
                                 <X className="h-4 w-4" />
                                 <span className="sr-only">Batalkan undangan {invitation.email}</span>
                               </Button>
                             </AlertDialogTrigger>
                             <AlertDialogContent>
                               <AlertDialogHeader>
                                 <AlertDialogTitle>Batalkan undangan?</AlertDialogTitle>
                                 <AlertDialogDescription>
                                   Undangan untuk {invitation.email} akan dicabut dan tidak dapat digunakan lagi.
                                 </AlertDialogDescription>
                               </AlertDialogHeader>
                               <AlertDialogFooter>
                                 <AlertDialogCancel>Kembali</AlertDialogCancel>
                                 <AlertDialogAction
                                   onClick={() => handleRevokeInvitation(invitation.id)}
                                   className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                   data-testid={`button-confirm-revoke-invitation-${invitation.id}`}
                                 >
                                   Batalkan Undangan
                                 </AlertDialogAction>
                               </AlertDialogFooter>
                             </AlertDialogContent>
                           </AlertDialog>
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
