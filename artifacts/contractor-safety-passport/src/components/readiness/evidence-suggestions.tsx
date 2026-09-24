import { useState } from "react";
import {
  useSuggestProjectCsmsEvidence,
  type CsmsEvidenceSuggestions,
  type ProjectCsmsReadiness,
} from "@workspace/api-client-react";
import { Lightbulb, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function EvidenceSuggestions({
  readiness,
}: {
  readiness: ProjectCsmsReadiness;
}) {
  const [result, setResult] = useState<CsmsEvidenceSuggestions | null>(null);
  const [error, setError] = useState(false);
  const mutation = useSuggestProjectCsmsEvidence();
  const current = result?.projectId === readiness.projectId &&
    result.profileId === readiness.profileId &&
    result.revision === readiness.revision &&
    result.version === readiness.version ? result : null;

  const requestSuggestions = () => {
    setError(false);
    setResult(null);
    mutation.mutate(
      { projectId: readiness.projectId },
      {
        onSuccess: (data) => setResult(data),
        onError: () => setError(true),
      },
    );
  };

  return (
    <Card className="border-primary/25 bg-card/60">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="h-5 w-5 text-primary" /> Saran tinjauan bukti
            </CardTitle>
            <CardDescription className="mt-2">
              AI hanya membantu menyusun langkah pemeriksaan untuk paling banyak lima bukti
              yang belum ditandai lengkap. Tidak membaca isi dokumen dan tidak mengubah status.
            </CardDescription>
          </div>
          <Badge variant="outline">Baca saja</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button type="button" variant="outline" disabled={mutation.isPending} onClick={requestSuggestions}>
          {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mutation.isPending ? "Menyusun saran..." : "Minta saran AI"}
        </Button>
        {error && <p role="alert" className="text-sm text-destructive">
          Saran tidak tersedia saat ini. Data kesiapan tetap aman; coba lagi nanti.
        </p>}
        {result && !current && !mutation.isPending && (
          <p className="text-sm text-amber-400">
            Data kesiapan atau profil telah berubah. Minta saran baru untuk melihat kondisi terbaru.
          </p>
        )}
        {current && (
          <div className="space-y-3" aria-live="polite">
            <p className="text-xs text-muted-foreground">
              Sumber: profil CSMS {current.issuer} · versi {current.version} · revisi kesiapan {current.revision}.
              Periksa bukti sebenarnya sebelum menandai butir lengkap.
            </p>
            {current.suggestions.length ? current.suggestions.map((item) => (
              <div key={item.key} className="rounded-md border border-border/60 bg-background/40 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{item.stageCode} · {item.stageName}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {item.status === "follow_up" ? "Ditandai tindak lanjut" : "Belum ditandai"}
                  </span>
                </div>
                <p className="mt-2 text-sm font-medium">{item.evidence}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.nextStep}</p>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground">
                Semua butir bukti pada profil ini sudah ditandai lengkap. Tetap tinjau bukti sebenarnya.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}