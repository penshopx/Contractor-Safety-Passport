import { useGetDashboardSummary, useListActivity } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, AlertTriangle, FileCheck, FolderKanban, ShieldAlert, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary();
  const { data: activities, isLoading: isLoadingActivities } = useListActivity();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dasbor Operasional</h1>
        <p className="text-muted-foreground mt-1 text-lg">Ringkasan status kepatuhan K3 dan aktivitas proyek.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard 
          title="Kesiapan K3 (SMKK/CSMS)"
          value={summary ? `${summary.readinessScore}%` : "-"}
          icon={ShieldAlert}
          loading={isLoadingSummary}
          valueClass={summary && summary.readinessScore >= 80 ? "text-primary" : "text-destructive"}
        />
        <SummaryCard 
          title="Proyek Aktif"
          value={summary?.activeProjects ?? "-"}
          icon={FolderKanban}
          loading={isLoadingSummary}
        />
        <SummaryCard 
          title="Personel Dilacak"
          value={summary?.peopleTracked ?? "-"}
          icon={Users}
          loading={isLoadingSummary}
        />
        <SummaryCard 
          title="Dokumen Siap"
          value={summary ? `${summary.documentReady} / ${summary.documentTotal}` : "-"}
          icon={FileCheck}
          loading={isLoadingSummary}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-border/50 bg-card/40 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Aktivitas Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingActivities ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : activities && activities.length > 0 ? (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4 p-3 rounded-md bg-background/50 border border-border/30 hover:border-border transition-colors">
                    <div className="mt-1 bg-primary/10 text-primary p-2 rounded-full">
                      <Activity className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <p className="font-medium text-sm text-foreground">{activity.title}</p>
                        <span className="text-xs text-muted-foreground font-mono">{new Date(activity.timestamp).toLocaleDateString('id-ID')}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                      <p className="text-xs text-muted-foreground mt-2 border-t border-border/30 pt-2 inline-block">Oleh: {activity.actor}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Belum ada aktivitas tercatat.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-destructive/5 backdrop-blur-sm border-destructive/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Perlu Perhatian
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-background/50 p-3 rounded-md border border-border/30">
                  <span className="text-sm font-medium">Sertifikat Hampir Kedaluwarsa</span>
                  <Badge variant="destructive">{summary?.expiringSoon ?? 0}</Badge>
                </div>
                <div className="flex justify-between items-center bg-background/50 p-3 rounded-md border border-border/30">
                  <span className="text-sm font-medium">Tindakan Lapangan Terbuka</span>
                  <Badge variant="secondary" className="bg-primary/20 text-primary hover:bg-primary/30">{summary?.openActions ?? 0}</Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, icon: Icon, loading, valueClass = "" }: any) {
  return (
    <Card className="border-border/50 bg-card/40 backdrop-blur-sm overflow-hidden group">
      <CardContent className="p-6 relative">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground tracking-tight">{title}</p>
          <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        <div className="mt-4">
          {loading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <span className={`text-3xl font-bold tracking-tighter ${valueClass}`}>{value}</span>
          )}
        </div>
        <div className="absolute -right-6 -bottom-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
          <Icon className="h-32 w-32" />
        </div>
      </CardContent>
    </Card>
  );
}