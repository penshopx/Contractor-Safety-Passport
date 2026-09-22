import { useEffect, useMemo, useState } from "react";
import {
  getGetProjectCsmsReadinessQueryKey,
  useGetOrganizationContext,
  useGetProjectCsmsReadiness,
  useListProjects,
  useListCsmsProfiles,
  useUpdateProjectCsmsReadiness,
  type CsmsReadinessItemStatusStatus,
  type ProjectCsmsReadiness,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Circle, Clock3, Loader2, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

type ItemKind = "question" | "evidence" | "validation";

const itemKey = (stageCode: string, kind: ItemKind, index: number) =>
  `${stageCode}:${kind}:${index}`;

export default function ReadinessPage() {
  const queryClient = useQueryClient();
  const [projectId, setProjectId] = useState<number | null>(null);
  const { data: projects, isLoading: projectsLoading } = useListProjects();
  const { data: profiles } = useListCsmsProfiles();
  const { data: organization } = useGetOrganizationContext();
  const canEdit =
    organization?.role === "owner" || organization?.role === "safety_expert";

  useEffect(() => {
    if (projectId === null && projects?.length) setProjectId(projects[0].id);
  }, [projectId, projects]);

  const {
    data: readiness,
    isLoading: readinessLoading,
    isError,
  } = useGetProjectCsmsReadiness(projectId ?? 0, {
    query: {
      enabled: projectId !== null,
      queryKey: getGetProjectCsmsReadinessQueryKey(projectId ?? 0),
    },
  });
  const updateReadiness = useUpdateProjectCsmsReadiness();

  const statuses = useMemo(
    () => new Map(readiness?.itemStatuses.map((item) => [item.key, item.status])),
    [readiness],
  );

  const save = (
    profileId: string,
    nextStatuses: Array<{ key: string; status: CsmsReadinessItemStatusStatus }>,
  ) => {
    if (projectId === null || !readiness) return;
    updateReadiness.mutate(
      {
        projectId,
        data: {
          profileId,
          revision: readiness.revision,
          itemStatuses: nextStatuses,
        },
      },
      {
        onSuccess: (result) => {
          queryClient.setQueryData(
            getGetProjectCsmsReadinessQueryKey(projectId),
            result,
          );
        },
        onError: (error) => {
          const conflict = getReadinessConflict(error);
          if (conflict) {
            queryClient.setQueryData(
              getGetProjectCsmsReadinessQueryKey(projectId),
              conflict,
            );
            toast.warning(
              "Perubahan tidak disimpan karena kesiapan telah diubah pengguna lain. Status terbaru sudah dimuat.",
            );
            return;
          }
          toast.error("Status kesiapan gagal disimpan");
        },
      },
    );
  };

  const updateItem = (
    key: string,
    status: CsmsReadinessItemStatusStatus,
  ) => {
    if (!readiness) return;
    const next = new Map(statuses);
    if (next.get(key) === status) next.delete(key);
    else next.set(key, status);
    save(
      readiness.profileId,
      Array.from(next, ([itemKeyValue, itemStatus]) => ({
        key: itemKeyValue,
        status: itemStatus,
      })),
    );
  };

  const selectedProject = projects?.find((project) => project.id === projectId);
  const selectableProfiles = profiles?.filter(
    (profile) => !profile.archived || profile.id === readiness?.profileId,
  );
  const isLoading = projectsLoading || (projectId !== null && readinessLoading);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Kesiapan Proyek CSMS</h1>
        <p className="mt-1 text-lg text-muted-foreground">
          Pantau pertanyaan, bukti, dan validasi pada setiap tahap profil principal.
        </p>
      </div>

      <Card className="border-border/50 bg-card/40 backdrop-blur-sm">
        <CardContent className="grid gap-4 p-5 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Proyek</label>
            <Select
              value={projectId?.toString() ?? ""}
              onValueChange={(value) => setProjectId(Number(value))}
            >
              <SelectTrigger><SelectValue placeholder="Pilih proyek" /></SelectTrigger>
              <SelectContent>
                {projects?.map((project) => (
                  <SelectItem key={project.id} value={project.id.toString()}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Profil CSMS aktif</label>
            <Select
              value={readiness?.profileId ?? ""}
              disabled={!readiness || !canEdit || updateReadiness.isPending}
              onValueChange={(value) => save(value, [])}
            >
              <SelectTrigger><SelectValue placeholder="Pilih profil" /></SelectTrigger>
              <SelectContent>
                {selectableProfiles?.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.issuer} · {profile.version}
                    {profile.archived ? " · Diarsipkan" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {!projectsLoading && !projects?.length ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">
          Tambahkan proyek terlebih dahulu untuk mulai memantau kesiapan CSMS.
        </CardContent></Card>
      ) : isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : isError || !readiness ? (
        <Card><CardContent className="p-8 text-center text-destructive">
          Data kesiapan proyek tidak dapat dimuat.
        </CardContent></Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <ScoreCard title="Kesiapan keseluruhan" value={`${readiness.overallProgress}%`} icon={<ShieldCheck className="h-5 w-5 text-primary" />} />
            <ScoreCard title="Butir lengkap" value={`${readiness.completed}/${readiness.total}`} icon={<CheckCircle2 className="h-5 w-5 text-primary" />} />
            <ScoreCard title="Perlu tindak lanjut" value={String(readiness.followUp)} icon={<AlertCircle className="h-5 w-5 text-amber-400" />} />
            <ScoreCard title="Tahap CSMS" value={String(readiness.stages.length)} icon={<Circle className="h-5 w-5 text-muted-foreground" />} />
          </div>

          <Card className="border-border/50 bg-card/40 backdrop-blur-sm">
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle>{selectedProject?.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {readiness.issuer} · {readiness.version}
                  </CardDescription>
                  {readiness.updatedAt && readiness.updatedByName && (
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <UserRound className="h-3.5 w-3.5" />
                        Terakhir diubah oleh {readiness.updatedByName}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock3 className="h-3.5 w-3.5" />
                        {formatUpdatedAt(readiness.updatedAt)}
                      </span>
                    </div>
                  )}
                </div>
                {updateReadiness.isPending && (
                  <Badge variant="outline" className="gap-1.5">
                    <Loader2 className="h-3 w-3 animate-spin" /> Menyimpan
                  </Badge>
                )}
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
                <div className="h-full bg-primary transition-all" style={{ width: `${readiness.overallProgress}%` }} />
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" defaultValue={[readiness.stages[0]?.code ?? ""]} className="space-y-3">
                {readiness.stages.map((stage) => (
                  <AccordionItem key={stage.code} value={stage.code} className="rounded-lg border border-border/60 px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex flex-1 items-center gap-3 pr-4 text-left">
                        <Badge variant="outline" className="font-mono">{stage.code}</Badge>
                        <div className="flex-1">
                          <p className="font-semibold">{stage.name}</p>
                          <p className="text-xs font-normal text-muted-foreground">
                            {stage.completed}/{stage.total} lengkap
                            {stage.followUp > 0 ? ` · ${stage.followUp} tindak lanjut` : ""}
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-primary">{stage.progress}%</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-5 pb-5">
                      <p className="text-sm text-muted-foreground">{stage.purpose}</p>
                      <ItemGroup title="Pertanyaan" kind="question" stageCode={stage.code} items={stage.questions} statuses={statuses} disabled={!canEdit || updateReadiness.isPending} onUpdate={updateItem} />
                      <ItemGroup title="Bukti" kind="evidence" stageCode={stage.code} items={stage.evidence} statuses={statuses} disabled={!canEdit || updateReadiness.isPending} onUpdate={updateItem} />
                      <ItemGroup title="Validasi" kind="validation" stageCode={stage.code} items={stage.validations} statuses={statuses} disabled={!canEdit || updateReadiness.isPending} onUpdate={updateItem} />
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

const formatUpdatedAt = (value: string) =>
  new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

const getReadinessConflict = (error: unknown): ProjectCsmsReadiness | null => {
  if (
    !error ||
    typeof error !== "object" ||
    !("status" in error) ||
    error.status !== 409 ||
    !("data" in error)
  ) {
    return null;
  }
  const data = error.data;
  if (
    !data ||
    typeof data !== "object" ||
    !("projectId" in data) ||
    !("revision" in data) ||
    !("itemStatuses" in data)
  ) {
    return null;
  }
  return data as ProjectCsmsReadiness;
};

function ItemGroup({
  title, kind, stageCode, items, statuses, disabled, onUpdate,
}: {
  title: string;
  kind: ItemKind;
  stageCode: string;
  items: string[];
  statuses: Map<string, CsmsReadinessItemStatusStatus>;
  disabled: boolean;
  onUpdate: (key: string, status: CsmsReadinessItemStatusStatus) => void;
}) {
  return (
    <section className="space-y-2">
      <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h4>
      {items.map((item, index) => {
        const key = itemKey(stageCode, kind, index);
        const status = statuses.get(key);
        return (
          <div key={key} className="flex flex-col gap-3 rounded-md border border-border/50 bg-background/40 p-3 sm:flex-row sm:items-center">
            <p className="flex-1 text-sm leading-relaxed">{item}</p>
            <div className="flex shrink-0 gap-2">
              <Button type="button" size="sm" variant={status === "complete" ? "default" : "outline"} disabled={disabled} onClick={() => onUpdate(key, "complete")}>
                <CheckCircle2 className="mr-1.5 h-4 w-4" /> Lengkap
              </Button>
              <Button type="button" size="sm" variant={status === "follow_up" ? "destructive" : "outline"} disabled={disabled} onClick={() => onUpdate(key, "follow_up")}>
                <AlertCircle className="mr-1.5 h-4 w-4" /> Tindak lanjut
              </Button>
            </div>
          </div>
        );
      })}
    </section>
  );
}

function ScoreCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <Card className="border-border/50 bg-card/40">
      <CardContent className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{title}</p>
          {icon}
        </div>
        <p className="text-3xl font-bold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}