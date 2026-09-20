import { useGetReadinessSummary } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck, AlertCircle, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ReadinessPage() {
  const { data, isLoading } = useGetReadinessSummary();

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'done': return <ShieldCheck className="h-5 w-5 text-primary" />;
      case 'attention': return <AlertCircle className="h-5 w-5 text-accent-foreground" />;
      case 'missing': return <ShieldAlert className="h-5 w-5 text-destructive" />;
      default: return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'done': return <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-primary/30">Siap</Badge>;
      case 'attention': return <Badge className="bg-accent/20 text-accent-foreground hover:bg-accent/30 border-accent/30">Perhatian</Badge>;
      case 'missing': return <Badge variant="destructive" className="bg-destructive/20 text-destructive hover:bg-destructive/30 border-destructive/30">Belum Siap</Badge>;
      default: return null;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Kesiapan Pra-Kualifikasi</h1>
        <p className="text-muted-foreground mt-1 text-lg">Asesmen SMKK (PUPR) dan CSMS (Migas) untuk tender proyek.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ScoreCard 
          title="Skor Keseluruhan" 
          score={data?.overall} 
          loading={isLoading} 
          primary
        />
        <ScoreCard 
          title="SMKK (Konstruksi Umum)" 
          score={data?.smkk} 
          loading={isLoading} 
        />
        <ScoreCard 
          title="CSMS (Migas & Tambang)" 
          score={data?.csms} 
          loading={isLoading} 
        />
      </div>

      <Card className="border-border/50 bg-card/40 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Daftar Periksa Persyaratan</CardTitle>
          <CardDescription>Status dokumen dan elemen sistem berdasarkan standar yang berlaku</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : (
            <div className="space-y-3">
              {data?.checks.map((check) => (
                <div 
                  key={check.id} 
                  className={`flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-lg border transition-colors ${
                    check.status === 'missing' ? 'bg-destructive/5 border-destructive/20' : 
                    check.status === 'attention' ? 'bg-accent/5 border-accent/20' : 
                    'bg-background/50 border-border/50'
                  }`}
                >
                  <div className="shrink-0 pt-1 sm:pt-0">
                    {getStatusIcon(check.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-foreground">{check.title}</h4>
                      <Badge variant="outline" className="text-[10px] font-mono py-0 h-5 bg-background">
                        {check.standard}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{check.detail}</p>
                  </div>
                  <div className="shrink-0 flex items-center justify-end sm:justify-start">
                    {getStatusBadge(check.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ScoreCard({ title, score, loading, primary = false }: { title: string, score?: number, loading: boolean, primary?: boolean }) {
  return (
    <Card className={`border-border/50 bg-card/40 backdrop-blur-sm overflow-hidden ${primary ? 'ring-1 ring-primary/50' : ''}`}>
      <CardContent className="p-6">
        <p className="text-sm font-medium text-muted-foreground mb-4">{title}</p>
        {loading ? (
          <Skeleton className="h-14 w-24" />
        ) : (
          <div className="flex items-baseline gap-2">
            <span className={`text-6xl font-bold tracking-tighter ${primary ? 'text-primary' : 'text-foreground'}`}>
              {score ?? 0}
            </span>
            <span className="text-xl font-bold text-muted-foreground mb-1">%</span>
          </div>
        )}
        
        {!loading && score !== undefined && (
          <div className="w-full h-2 bg-secondary rounded-full mt-6 overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ease-out ${
                score >= 80 ? 'bg-primary' : score >= 60 ? 'bg-accent-foreground' : 'bg-destructive'
              }`}
              style={{ width: `${score}%` }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}