import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getListCsmsProfilesQueryKey,
  type CsmsProfile,
  type CsmsProfileInput,
  type CsmsStage,
  useCreateCsmsProfile,
  useGetOrganizationContext,
  useListCsmsProfiles,
  useSetCsmsProfileArchived,
  useUpdateCsmsProfile,
} from "@workspace/api-client-react";
import { Archive, ArchiveRestore, BookOpenCheck, CopyPlus, Loader2, Lock, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const emptyStage = (): CsmsStage => ({
  code: "",
  name: "",
  purpose: "",
  roles: [],
  questions: [],
  evidence: [],
  validations: [],
});

const emptyProfile = (): CsmsProfileInput => ({
  issuer: "",
  version: "",
  title: "",
  source: "",
  stages: [emptyStage()],
});

const lines = (value: string) =>
  value.split("\n").map((item) => item.trim()).filter(Boolean);

const findDuplicateStageCode = (stages: CsmsStage[]) => {
  const seen = new Set<string>();
  for (const stage of stages) {
    const code = stage.code.trim();
    const normalizedCode = code.toLowerCase();
    if (seen.has(normalizedCode)) return code;
    seen.add(normalizedCode);
  }
  return undefined;
};

export default function CsmsProfilesPage() {
  const queryClient = useQueryClient();
  const { data: organization } = useGetOrganizationContext();
  const { data: profiles, isLoading } = useListCsmsProfiles();
  const createProfile = useCreateCsmsProfile();
  const updateProfile = useUpdateCsmsProfile();
  const setArchived = useSetCsmsProfileArchived();
  const [selectedId, setSelectedId] = useState<string>("new");
  const [draft, setDraft] = useState<CsmsProfileInput>(emptyProfile);

  const selected = useMemo(
    () => profiles?.find((profile) => profile.id === selectedId),
    [profiles, selectedId],
  );
  const readOnly = selected?.builtIn || selected?.locked;
  const canManage = organization?.role === "owner";

  const loadProfile = (id: string) => {
    setSelectedId(id);
    if (id === "new") {
      setDraft(emptyProfile());
      return;
    }
    const profile = profiles?.find((item) => item.id === id);
    if (profile) {
      setDraft({
        issuer: profile.issuer,
        version: profile.version,
        title: profile.title,
        source: profile.source,
        stages: profile.stages,
      });
    }
  };

  const duplicateAsNew = () => {
    setSelectedId("new");
    setDraft((current) => ({ ...current, version: "" }));
  };

  const updateStage = (index: number, update: Partial<CsmsStage>) => {
    setDraft((current) => ({
      ...current,
      stages: current.stages.map((stage, stageIndex) =>
        stageIndex === index ? { ...stage, ...update } : stage,
      ),
    }));
  };

  const validate = () => {
    if (!draft.issuer.trim() || !draft.version.trim() || !draft.title.trim() || !draft.source.trim()) {
      toast.error("Issuer, versi, judul, dan sumber wajib diisi");
      return false;
    }
    if (
      draft.stages.length === 0 ||
      draft.stages.some(
        (stage) =>
          !stage.code.trim() ||
          !stage.name.trim() ||
          !stage.purpose.trim() ||
          !stage.roles.length ||
          !stage.questions.length ||
          !stage.evidence.length ||
          !stage.validations.length,
      )
    ) {
      toast.error("Setiap tahap harus memiliki kode, tujuan, peran, pertanyaan, bukti, dan validasi");
      return false;
    }
    const duplicateStageCode = findDuplicateStageCode(draft.stages);
    if (duplicateStageCode) {
      toast.error(
        `Kode tahap harus unik tanpa membedakan huruf besar-kecil. Kode duplikat: ${duplicateStageCode}`,
      );
      return false;
    }
    return true;
  };

  const save = () => {
    if (!validate()) return;
    const mutationOptions = {
      onSuccess: (profile: CsmsProfile) => {
        queryClient.invalidateQueries({ queryKey: getListCsmsProfilesQueryKey() });
        setSelectedId(profile.id);
        toast.success(selectedId === "new" ? "Versi pedoman dibuat" : "Versi pedoman diperbarui");
      },
      onError: (error: { data?: unknown }) => {
        const message =
          typeof error.data === "object" && error.data && "error" in error.data
            ? String(error.data.error)
            : "Profil CSMS gagal disimpan";
        toast.error(message);
      },
    };
    if (selectedId === "new") {
      createProfile.mutate({ data: draft }, mutationOptions);
    } else {
      updateProfile.mutate({ id: selectedId, data: draft }, mutationOptions);
    }
  };

  const toggleArchived = () => {
    if (!selected || selected.builtIn) return;
    setArchived.mutate(
      { id: selected.id, data: { archived: !selected.archived } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCsmsProfilesQueryKey() });
          toast.success(selected.archived ? "Versi pedoman dipulihkan" : "Versi pedoman diarsipkan");
        },
        onError: () => toast.error("Status arsip profil gagal diperbarui"),
      },
    );
  };

  if (!canManage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Akses admin diperlukan</CardTitle>
          <CardDescription>Hanya pemilik workspace yang dapat mengelola profil principal.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profil Principal CSMS</h1>
          <p className="mt-1 text-muted-foreground">
            Kelola issuer dan versi pedoman yang hanya tersedia di workspace ini.
          </p>
        </div>
        <Button variant="outline" onClick={() => loadProfile("new")}>
          <Plus className="mr-2 h-4 w-4" /> Versi baru
        </Button>
      </div>

      <Card className="border-border/50">
        <CardContent className="grid gap-4 p-5 md:grid-cols-[1fr_auto]">
          <Select value={selectedId} onValueChange={loadProfile} disabled={isLoading}>
            <SelectTrigger><SelectValue placeholder="Pilih profil" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="new">Profil dan versi baru</SelectItem>
              {profiles?.map((profile) => (
                <SelectItem key={profile.id} value={profile.id}>
                  {profile.issuer} · {profile.version}{profile.archived ? " · Diarsipkan" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selected && (
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {selected.builtIn
                  ? "Bawaan sistem"
                  : selected.archived
                    ? "Diarsipkan"
                    : selected.locked
                      ? "Sudah dipakai"
                      : "Draft"}
              </Badge>
              {!selected.builtIn && (
                <Button
                  variant="outline"
                  onClick={toggleArchived}
                  disabled={setArchived.isPending}
                >
                  {setArchived.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : selected.archived ? (
                    <ArchiveRestore className="mr-2 h-4 w-4" />
                  ) : (
                    <Archive className="mr-2 h-4 w-4" />
                  )}
                  {selected.archived ? "Pulihkan" : "Arsipkan"}
                </Button>
              )}
              {readOnly && (
                <Button variant="outline" onClick={duplicateAsNew}>
                  <CopyPlus className="mr-2 h-4 w-4" /> Salin sebagai versi baru
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {readOnly && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
          <Lock className="h-4 w-4" />
          Versi yang sudah dipakai tidak dapat diubah. Salin profil ini untuk membuat versi lanjutan.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BookOpenCheck className="h-5 w-5" /> Identitas pedoman</CardTitle>
          <CardDescription>Simpan setiap revisi pedoman sebagai versi tersendiri.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {(["issuer", "version", "title", "source"] as const).map((field) => (
            <label key={field} className={`space-y-2 ${field === "title" || field === "source" ? "md:col-span-2" : ""}`}>
              <span className="text-sm font-medium">
                {{ issuer: "Issuer / principal", version: "Versi pedoman", title: "Judul", source: "Sumber" }[field]}
              </span>
              <Input
                value={draft[field]}
                disabled={readOnly}
                onChange={(event) => setDraft({ ...draft, [field]: event.target.value })}
              />
            </label>
          ))}
        </CardContent>
      </Card>

      <div className="space-y-4">
        {draft.stages.map((stage, index) => (
          <Card key={`${index}-${stage.code}`}>
            <CardHeader className="flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle>Tahap {index + 1}</CardTitle>
                <CardDescription>Isi daftar dengan satu item per baris.</CardDescription>
              </div>
              {!readOnly && draft.stages.length > 1 && (
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Hapus tahap ${index + 1}`}
                  onClick={() => setDraft({ ...draft, stages: draft.stages.filter((_, itemIndex) => itemIndex !== index) })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium">Kode tahap</span>
                <Input value={stage.code} disabled={readOnly} onChange={(event) => updateStage(index, { code: event.target.value })} />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium">Nama tahap</span>
                <Input value={stage.name} disabled={readOnly} onChange={(event) => updateStage(index, { name: event.target.value })} />
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium">Tujuan</span>
                <Textarea value={stage.purpose} disabled={readOnly} onChange={(event) => updateStage(index, { purpose: event.target.value })} />
              </label>
              {(["roles", "questions", "evidence", "validations"] as const).map((field) => (
                <label key={field} className="space-y-2">
                  <span className="text-sm font-medium">
                    {{ roles: "Peran", questions: "Pertanyaan", evidence: "Bukti", validations: "Validasi" }[field]}
                  </span>
                  <Textarea
                    rows={5}
                    value={stage[field].join("\n")}
                    disabled={readOnly}
                    onChange={(event) => updateStage(index, { [field]: lines(event.target.value) })}
                  />
                </label>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {!readOnly && (
        <div className="flex flex-wrap justify-between gap-3">
          <Button variant="outline" onClick={() => setDraft({ ...draft, stages: [...draft.stages, emptyStage()] })}>
            <Plus className="mr-2 h-4 w-4" /> Tambah tahap
          </Button>
          <Button onClick={save} disabled={createProfile.isPending || updateProfile.isPending}>
            {(createProfile.isPending || updateProfile.isPending) ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Simpan versi
          </Button>
        </div>
      )}
    </div>
  );
}