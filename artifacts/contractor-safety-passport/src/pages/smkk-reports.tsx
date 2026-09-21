import { useState, useMemo } from "react";
import {
  getListMonthlyReportsQueryKey,
  useCreateMonthlyReport,
  useListFieldActivities,
  useListMonthlyReports,
  useListProjects,
  useUpdateMonthlyReport,
  type MonthlyReport,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { downloadPdf, type ProjectDocumentData } from "@/lib/document-generator";
import {
  countInvalidProjectActivityDates,
  createSmkkDocumentData,
  selectMonthlyProjectActivities,
  summarizeSmkkActivities,
} from "@/lib/smkk-report";
import { FileSpreadsheet, Loader2, FileDown, Search, Save, FolderOpen } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

function formatDateMonthYear(monthString: string) {
  if (!monthString) return "-";
  const [year, month] = monthString.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
}

export default function SmkkReportsPage() {
  const queryClient = useQueryClient();
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7) // YYYY-MM
  );
  
  const [evaluation, setEvaluation] = useState("");
  const [notes, setNotes] = useState("");
  const [preparedBy, setPreparedBy] = useState("");
  const [reviewedBy, setReviewedBy] = useState("");
  const [approvedBy, setApprovedBy] = useState("");
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [openedReportId, setOpenedReportId] = useState<number | null>(null);

  const providerName = "Penyedia Jasa";

  const { data: projects, isLoading: isLoadingProjects } = useListProjects();
  const { data: activities, isLoading: isLoadingActivities } = useListFieldActivities();
  const { data: savedReports, isLoading: isLoadingReports } = useListMonthlyReports();
  const createReport = useCreateMonthlyReport();
  const updateReport = useUpdateMonthlyReport();

  const selectedProject = projects?.find(p => String(p.id) === selectedProjectId);
  
  const filteredActivities = useMemo(() => {
    return selectMonthlyProjectActivities(
      activities,
      selectedProject?.id ?? 0,
      selectedMonth,
    );
  }, [activities, selectedProject?.id, selectedMonth]);

  const invalidActivityDateCount = useMemo(
    () =>
      countInvalidProjectActivityDates(
        activities,
        selectedProject?.id ?? 0,
      ),
    [activities, selectedProject?.id],
  );

  const summary = useMemo(
    () => summarizeSmkkActivities(filteredActivities),
    [filteredActivities],
  );

  const openReport = (report: MonthlyReport) => {
    setOpenedReportId(report.id);
    setSelectedProjectId(String(report.projectId));
    setSelectedMonth(report.period);
    setEvaluation(report.evaluation);
    setNotes(report.notes);
    setPreparedBy(report.preparedBy);
    setReviewedBy(report.reviewedBy);
    setApprovedBy(report.approvedBy);
    toast.success("Laporan tersimpan dibuka");
  };

  const saveReport = (status: "draft" | "final") => {
    if (!selectedProject) return;
    const data = {
      status,
      evaluation,
      notes,
      preparedBy,
      reviewedBy,
      approvedBy,
    };
    const onSuccess = (report: MonthlyReport) => {
      setOpenedReportId(report.id);
      queryClient.invalidateQueries({ queryKey: getListMonthlyReportsQueryKey() });
      toast.success(status === "final" ? "Laporan ditandai final" : "Draf laporan tersimpan");
    };
    const onError = (error: unknown) => {
      const apiError = error as { status?: number; data?: { error?: string } };
      toast.error(
        apiError.status === 409
          ? apiError.data?.error ?? "Laporan periode ini sudah ada. Buka dari daftar arsip."
          : "Gagal menyimpan laporan",
      );
    };
    if (openedReportId) {
      updateReport.mutate({ id: openedReportId, data }, { onSuccess, onError });
    } else {
      createReport.mutate(
        { data: { projectId: selectedProject.id, period: selectedMonth, ...data } },
        { onSuccess, onError },
      );
    }
  };

  const handleDownload = async () => {
    if (!selectedProject) return;
    setIsGenerating(true);

    try {
      const docData: ProjectDocumentData = createSmkkDocumentData(
        {
          name: selectedProject.name,
          client: selectedProject.client,
          location: selectedProject.location,
          standard: selectedProject.standard,
          startDate: selectedProject.startDate,
          endDate: selectedProject.endDate,
          progress: selectedProject.progress,
          value: selectedProject.value,
        },
        filteredActivities,
        summary,
        {
          period: formatDateMonthYear(selectedMonth),
          providerName,
          evaluation,
          notes,
          preparedBy,
          reviewedBy,
          approvedBy,
        },
      );
      
      await downloadPdf(docData);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="border-border/50 bg-card/40 backdrop-blur-sm shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FolderOpen className="h-5 w-5 text-primary" />
            Arsip Laporan Bulanan
          </CardTitle>
          <CardDescription>Buka kembali draf atau unduh ulang laporan final per proyek dan periode.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingReports ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Memuat arsip laporan...
            </div>
          ) : savedReports?.length ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {savedReports.map((report) => (
                <div key={report.id} className="rounded-lg border border-border/60 bg-background/40 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{report.projectName}</p>
                      <p className="text-sm text-muted-foreground">{formatDateMonthYear(report.period)}</p>
                    </div>
                    <Badge variant={report.status === "final" ? "default" : "secondary"}>
                      {report.status === "final" ? "Final" : "Draf"}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>Disusun: {report.preparedBy || "-"}</p>
                    <p>Diperiksa: {report.reviewedBy || "-"}</p>
                    <p>Disetujui: {report.approvedBy || "-"}</p>
                  </div>
                  <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => openReport(report)}>
                    <FolderOpen className="h-4 w-4" /> Buka laporan
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Belum ada laporan yang disimpan.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
      <div className="lg:col-span-5 space-y-6">
        <Card className="border-border/50 bg-card/40 backdrop-blur-sm shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <FileSpreadsheet className="h-5 w-5" /> 
              Laporan Bulanan SMKK
            </CardTitle>
            <CardDescription>
              Pilih proyek dan bulan untuk menyusun rekapitulasi aktivitas lapangan otomatis.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project-select">Proyek</Label>
              <Select value={selectedProjectId} onValueChange={(value) => {
                setSelectedProjectId(value);
                setOpenedReportId(null);
              }}>
                <SelectTrigger id="project-select" data-testid="select-project">
                  <SelectValue placeholder={isLoadingProjects ? "Memuat proyek..." : "Pilih proyek..."} />
                </SelectTrigger>
                <SelectContent>
                  {projects?.map(p => (
                    <SelectItem key={p.id} value={String(p.id)} data-testid={`select-project-${p.id}`}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="month-select">Bulan Laporan</Label>
              <Input 
                id="month-select"
                type="month" 
                value={selectedMonth} 
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setOpenedReportId(null);
                }}
                data-testid="input-month-selector"
                className="bg-input/50 border-input-border text-foreground focus-visible:ring-primary"
              />
            </div>
            
            <div className="space-y-2 pt-2">
              <Label htmlFor="evaluation">Evaluasi Kinerja Keselamatan</Label>
              <textarea 
                id="evaluation"
                value={evaluation}
                onChange={e => setEvaluation(e.target.value)}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-input/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                placeholder="Catat evaluasi atau insiden yang terjadi bulan ini..."
                data-testid="input-evaluation"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Catatan Tambahan & Tindak Lanjut</Label>
              <textarea 
                id="notes"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-input/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                placeholder="Rekomendasi tindak lanjut untuk bulan berikutnya..."
                data-testid="input-notes"
              />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border/50 bg-card/40 backdrop-blur-sm shadow-sm">
          <CardHeader>
             <CardTitle className="text-lg">Pengesahan Laporan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="preparedBy">Disusun Oleh (Penyedia Jasa)</Label>
              <Input 
                id="preparedBy"
                value={preparedBy}
                onChange={e => setPreparedBy(e.target.value)}
                placeholder="Nama Petugas K3"
                data-testid="input-prepared-by"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reviewedBy">Diperiksa Oleh (Konsultan MK)</Label>
              <Input 
                id="reviewedBy"
                value={reviewedBy}
                onChange={e => setReviewedBy(e.target.value)}
                placeholder="Nama Konsultan Pengawas"
                data-testid="input-reviewed-by"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="approvedBy">Disetujui Oleh (Pemberi Tugas)</Label>
              <Input 
                id="approvedBy"
                value={approvedBy}
                onChange={e => setApprovedBy(e.target.value)}
                placeholder="Nama Wakil Pemberi Tugas"
                data-testid="input-approved-by"
              />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="lg:col-span-7">
        <Card className="border-border/50 bg-card shadow-lg flex flex-col h-[calc(100vh-10rem)] min-h-[800px]">
            <div className="p-4 border-b border-border/50 flex flex-wrap justify-between items-center gap-3 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
             <h2 className="font-semibold text-sm flex items-center gap-2">
               <Search className="h-4 w-4 text-muted-foreground" /> Pratinjau Dokumen
             </h2>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => saveReport("draft")}
                  disabled={!selectedProjectId || createReport.isPending || updateReport.isPending}
                  data-testid="button-save-draft"
                >
                  <Save className="h-4 w-4 mr-2" /> Simpan Draf
                </Button>
                <Button
                  variant="outline"
                  onClick={() => saveReport("final")}
                  disabled={!selectedProjectId || createReport.isPending || updateReport.isPending}
                  data-testid="button-save-final"
                >
                  Simpan Final
                </Button>
                <Button
                  onClick={handleDownload}
                  disabled={!selectedProjectId || isGenerating}
                  data-testid="button-download-pdf"
                  className="bg-primary text-primary-foreground font-semibold"
                >
                  {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
                  Unduh PDF
                </Button>
              </div>
           </div>
           <ScrollArea className="flex-1 bg-muted/40 p-4 md:p-8">
              {selectedProjectId ? (
               <div className="bg-white text-black p-8 md:p-12 shadow-md max-w-[210mm] mx-auto min-h-[297mm] flex flex-col gap-6 font-sans text-[11px] md:text-sm">
                  <div className="text-center mb-4">
                    <h1 className="text-lg md:text-xl font-bold uppercase tracking-wide border-b-2 border-black pb-4 mb-4">Laporan Bulanan Pelaksanaan SMKK</h1>
                    <div className="font-bold text-base">{selectedProject?.name}</div>
                    <div className="text-gray-600 mt-1">Periode: {formatDateMonthYear(selectedMonth)}</div>
                  </div>

                   {invalidActivityDateCount > 0 && (
                     <div
                       role="alert"
                       data-testid="invalid-activity-date-warning"
                       className="border border-amber-400 bg-amber-50 p-3 text-left text-amber-900"
                     >
                       <span className="font-semibold">
                         {invalidActivityDateCount} aktivitas tidak dimasukkan.
                       </span>{" "}
                       Tanggal aktivitas kosong atau tidak valid. Perbaiki tanggal aktivitas agar dapat masuk ke laporan bulanan.
                     </div>
                   )}

                  <div className="space-y-2">
                    <h3 className="font-bold bg-gray-100 p-1.5 border border-gray-300">1. Identitas Proyek</h3>
                    <table className="w-full border-collapse border border-gray-300 text-left">
                      <tbody>
                        <tr className="border-b border-gray-300">
                          <th className="p-2 border-r border-gray-300 w-1/3">Pemberi Tugas</th>
                          <td className="p-2">{selectedProject?.client || "-"}</td>
                        </tr>
                        <tr className="border-b border-gray-300">
                          <th className="p-2 border-r border-gray-300">Penyedia Jasa</th>
                          <td className="p-2">{providerName}</td>
                        </tr>
                        <tr className="border-b border-gray-300">
                          <th className="p-2 border-r border-gray-300">Lokasi</th>
                          <td className="p-2">{selectedProject?.location || "-"}</td>
                        </tr>
                        <tr className="border-b border-gray-300">
                          <th className="p-2 border-r border-gray-300">Capaian Program</th>
                          <td className="p-2">{selectedProject?.progress ?? 0}%</td>
                        </tr>
                        <tr>
                          <th className="p-2 border-r border-gray-300">Nilai Proyek</th>
                          <td className="p-2">{selectedProject ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(selectedProject.value) : "-"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="space-y-2 mt-2">
                    <h3 className="font-bold bg-gray-100 p-1.5 border border-gray-300">2. Evaluasi Kinerja Keselamatan</h3>
                    <div className="border border-gray-300 p-3 min-h-[60px] whitespace-pre-wrap">
                      {evaluation || <span className="text-gray-400 italic">Tidak ada evaluasi khusus.</span>}
                    </div>
                  </div>

                  <div className="space-y-2 mt-2">
                    <h3 className="font-bold bg-gray-100 p-1.5 border border-gray-300">3. Rekapitulasi Aktivitas Lapangan</h3>
                    <table className="w-full border-collapse border border-gray-300 text-left">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="p-2 border border-gray-300">Jenis Aktivitas</th>
                          <th className="p-2 border border-gray-300 w-24 text-center">Jumlah</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr><td className="p-2 border border-gray-300">Toolbox Meeting</td><td className="p-2 border border-gray-300 text-center">{summary.toolbox}</td></tr>
                        <tr><td className="p-2 border border-gray-300">Inspeksi / Patrol</td><td className="p-2 border border-gray-300 text-center">{summary.inspection}</td></tr>
                        <tr><td className="p-2 border border-gray-300">Izin Kerja (PTW)</td><td className="p-2 border border-gray-300 text-center">{summary.permit}</td></tr>
                        <tr><td className="p-2 border border-gray-300">Laporan Near Miss / Insiden</td><td className="p-2 border border-gray-300 text-center">{summary.nearMiss}</td></tr>
                        <tr><td className="p-2 border border-gray-300 text-red-600 font-semibold">Temuan Terbuka (Open/Review)</td><td className="p-2 border border-gray-300 text-center text-red-600 font-semibold">{summary.openFindings}</td></tr>
                        <tr><td className="p-2 border border-gray-300 text-green-600 font-semibold">Temuan Selesai (Closed)</td><td className="p-2 border border-gray-300 text-center text-green-600 font-semibold">{summary.closedFindings}</td></tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="space-y-2 mt-2">
                    <h3 className="font-bold bg-gray-100 p-1.5 border border-gray-300">4. Rincian Aktivitas</h3>
                    {filteredActivities.length > 0 ? (
                      <table className="w-full border-collapse border border-gray-300 text-left text-xs md:text-xs">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="p-2 border border-gray-300 w-24">Tanggal</th>
                            <th className="p-2 border border-gray-300 w-32">Jenis</th>
                            <th className="p-2 border border-gray-300">Kegiatan</th>
                            <th className="p-2 border border-gray-300 w-32">Pelaksana / Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredActivities.map(a => (
                            <tr key={a.id}>
                              <td className="p-2 border border-gray-300 whitespace-nowrap">{new Date(a.occurredAt).toLocaleDateString('id-ID')}</td>
                              <td className="p-2 border border-gray-300">{a.type}</td>
                              <td className="p-2 border border-gray-300">{a.title}</td>
                              <td className="p-2 border border-gray-300">
                                <div>{a.actor}</div>
                                <div className="text-gray-500 font-medium capitalize text-[10px] mt-0.5">{a.status}</div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="border border-gray-300 p-4 text-center text-gray-500 italic bg-gray-50/50">
                        {isLoadingActivities ? "Memuat aktivitas..." : "Belum ada kegiatan lapangan bulan ini."}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 mt-2">
                    <h3 className="font-bold bg-gray-100 p-1.5 border border-gray-300">5. Catatan Dokumentasi</h3>
                    <div className="border border-gray-300 p-3 min-h-[60px] whitespace-pre-wrap">
                      {notes || <span className="text-gray-400 italic">Tidak ada catatan tambahan.</span>}
                    </div>
                  </div>

                  <div className="space-y-2 mt-6 page-break-inside-avoid">
                    <h3 className="font-bold bg-gray-100 p-1.5 border border-gray-300">6. Pengesahan</h3>
                    <table className="w-full border-collapse border border-gray-300 text-center table-fixed h-32">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="p-2 border border-gray-300">Disusun Oleh</th>
                          <th className="p-2 border border-gray-300">Diperiksa Oleh</th>
                          <th className="p-2 border border-gray-300">Disetujui Oleh</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="p-2 border border-gray-300 align-bottom font-semibold h-24 text-sm">{preparedBy || "-"}</td>
                          <td className="p-2 border border-gray-300 align-bottom font-semibold h-24 text-sm">{reviewedBy || "-"}</td>
                          <td className="p-2 border border-gray-300 align-bottom font-semibold h-24 text-sm">{approvedBy || "-"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
               </div>
             ) : (
               <div className="h-full min-h-[50vh] flex flex-col items-center justify-center text-muted-foreground opacity-60">
                 <FileSpreadsheet className="h-16 w-16 mb-4" />
                 <p className="text-lg font-medium">Pilih proyek terlebih dahulu</p>
                 <p className="text-sm">Pratinjau dokumen akan tampil di sini</p>
               </div>
             )}
           </ScrollArea>
        </Card>
      </div>
      </div>
    </div>
  );
}