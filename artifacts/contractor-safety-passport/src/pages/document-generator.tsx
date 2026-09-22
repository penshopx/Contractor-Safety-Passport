import { useState } from "react";
import { 
  useListDocumentTemplates, 
  useListCsmsProfiles,
  useListProjects, 
  useGenerateDocument,
  GeneratedDocument,
  GeneratedDocumentInputTemplate,
} from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { FileCog, Printer, AlertTriangle, FileText } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

const generatorSchema = z.object({
  projectId: z.coerce.number().min(1, "Pilih proyek"),
  template: z.nativeEnum(GeneratedDocumentInputTemplate, { required_error: "Pilih template dokumen" }),
  companyName: z.string().min(3, "Nama perusahaan wajib diisi"),
  directorName: z.string().min(3, "Nama pimpinan wajib diisi"),
  safetyLead: z.string().min(3, "Nama penanggung jawab K3 wajib diisi"),
  scopeOfWork: z.string().min(10, "Lingkup pekerjaan wajib diisi"),
  commitment: z.string().optional(),
  emergencyContact: z.string().optional(),
  csmsProfileId: z.string().min(1).optional(),
}).superRefine((values, context) => {
  if (values.template === GeneratedDocumentInputTemplate.CSMS_PRAKUALIFIKASI && !values.csmsProfileId) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["csmsProfileId"],
      message: "Pilih issuer dan versi pedoman CSMS",
    });
  }
});

export default function DocumentGeneratorPage() {
  const { data: projects, isLoading: projectsLoading } = useListProjects();
  const { data: templates, isLoading: templatesLoading } = useListDocumentTemplates();
  const { data: csmsProfiles, isLoading: profilesLoading } = useListCsmsProfiles();
  const generateDoc = useGenerateDocument();
  
  const [generatedDoc, setGeneratedDoc] = useState<GeneratedDocument | null>(null);

  const form = useForm<z.infer<typeof generatorSchema>>({
    resolver: zodResolver(generatorSchema),
    defaultValues: {
      projectId: 0,
      template: undefined,
      companyName: "",
      directorName: "",
      safetyLead: "",
      scopeOfWork: "",
      commitment: "Kami berkomitmen untuk menjalankan semua persyaratan K3 yang berlaku sesuai perundangan.",
      emergencyContact: "",
      csmsProfileId: undefined,
    }
  });
  const selectedTemplate = form.watch("template");
  const selectedProfileId = form.watch("csmsProfileId");
  const selectedProfile = csmsProfiles?.find((profile) => profile.id === selectedProfileId);
  const isCsms = selectedTemplate === GeneratedDocumentInputTemplate.CSMS_PRAKUALIFIKASI;

  const onSubmit = (values: z.infer<typeof generatorSchema>) => {
    generateDoc.mutate(
      { data: values },
      {
        onSuccess: (data) => {
          setGeneratedDoc(data);
          toast.success("Dokumen berhasil di-generate");
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        onError: () => {
          toast.error("Gagal melakukan generate dokumen");
        }
      }
    );
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header - hide on print */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Generator Dokumen (RKK & CSMS)</h1>
          <p className="text-muted-foreground mt-1">Buat dokumen draf K3 untuk tender atau pelaksanaan secara otomatis berdasarkan template.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Column - hide on print */}
        <div className="lg:col-span-4 space-y-6 print:hidden">
          <Alert className="bg-secondary/50 border-primary/20">
            <AlertTriangle className="h-4 w-4 text-primary" />
            <AlertTitle>Perhatian</AlertTitle>
            <AlertDescription className="text-xs text-muted-foreground mt-1">
              Dokumen yang dihasilkan adalah <strong>draf</strong>. Anda wajib melakukan peninjauan bersama ahli K3 yang kompeten sebelum disahkan atau diajukan sebagai kepatuhan hukum.
            </AlertDescription>
          </Alert>

          <Card className="border-border/50 bg-card/40 backdrop-blur-sm shadow-md">
            <CardHeader>
              <CardTitle className="text-xl">Parameter Dokumen</CardTitle>
              <CardDescription>Lengkapi data untuk membuat dokumen.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" data-testid="form-generate-document">
                  
                  <FormField control={form.control} name="projectId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proyek</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ? field.value.toString() : ""} disabled={projectsLoading}>
                        <FormControl>
                          <SelectTrigger data-testid="select-project">
                            <SelectValue placeholder="Pilih Proyek" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {projects?.map(p => (
                            <SelectItem key={p.id} value={p.id.toString()}>{p.name} - {p.client}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="template" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template Dokumen</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          if (value !== GeneratedDocumentInputTemplate.CSMS_PRAKUALIFIKASI) {
                            form.setValue("csmsProfileId", undefined);
                          }
                        }}
                        value={field.value ?? ""}
                        disabled={templatesLoading}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-template">
                            <SelectValue placeholder="Pilih Template" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {templates?.map(t => (
                            <SelectItem key={t.id} value={t.id}>
                              <div className="flex flex-col items-start text-left">
                                <span>{t.name}</span>
                                <span className="text-xs text-muted-foreground">{t.standard}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  {isCsms && (
                    <FormField control={form.control} name="csmsProfileId" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Issuer & Versi Pedoman</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? ""} disabled={profilesLoading}>
                          <FormControl>
                            <SelectTrigger data-testid="select-csms-profile">
                              <SelectValue placeholder="Pilih profil CSMS" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {csmsProfiles?.filter((profile) => !profile.archived).map((profile) => (
                              <SelectItem key={profile.id} value={profile.id}>
                                <div className="flex flex-col items-start text-left">
                                  <span>{profile.issuer}</span>
                                  <span className="text-xs text-muted-foreground">{profile.version}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  )}

                  {isCsms && selectedProfile && (
                    <div className="rounded-md border border-border/60 bg-background/40 p-3 space-y-2" data-testid="csms-profile-summary">
                      <div>
                        <p className="text-sm font-semibold">{selectedProfile.title}</p>
                        <p className="text-xs text-muted-foreground">{selectedProfile.source}</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedProfile.stages.map((stage, index) => (
                          <span key={stage.code} className="rounded-full border border-primary/30 bg-primary/5 px-2 py-1 text-[11px] text-primary">
                            {index + 1}. {stage.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <Separator className="my-2 bg-border/50" />

                  <FormField control={form.control} name="companyName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Perusahaan</FormLabel>
                      <FormControl>
                        <Input placeholder="PT Kontraktor Maju" data-testid="input-company-name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="directorName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pimpinan Perusahaan</FormLabel>
                      <FormControl>
                        <Input placeholder="Budi Santoso (Direktur)" data-testid="input-director-name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="safetyLead" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Penanggung Jawab K3</FormLabel>
                      <FormControl>
                        <Input placeholder="Andi Kurniawan (Ahli K3 Umum)" data-testid="input-safety-lead" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="scopeOfWork" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lingkup Pekerjaan</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Pekerjaan struktur baja dan sipil..." 
                          className="resize-none h-20"
                          data-testid="input-scope-of-work"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="emergencyContact" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kontak Darurat (Opsional)</FormLabel>
                      <FormControl>
                        <Input placeholder="0812-3456-7890 (Klinik/RS Terdekat)" data-testid="input-emergency-contact" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <Button 
                    type="submit" 
                    className="w-full gap-2 font-semibold" 
                    disabled={generateDoc.isPending}
                    data-testid="button-generate"
                  >
                    {generateDoc.isPending ? (
                      <>Menghasilkan...</>
                    ) : (
                      <><FileCog className="h-4 w-4" /> Buat Draf</>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Preview Column - takes full width on print */}
        <div className="lg:col-span-8">
          {!generatedDoc ? (
            <div className="flex flex-col items-center justify-center h-[500px] border-2 border-dashed border-border/50 rounded-lg bg-card/10 text-muted-foreground print:hidden">
              <FileText className="h-16 w-16 mb-4 opacity-20" />
              <p className="text-lg font-medium text-foreground/50">Belum ada dokumen yang dihasilkan.</p>
              <p className="text-sm">Silakan isi form di samping untuk membuat draf dokumen.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Action Bar - hide on print */}
              <div className="flex justify-end gap-3 print:hidden">
                <Button variant="outline" onClick={handlePrint} className="gap-2" data-testid="button-print">
                  <Printer className="h-4 w-4" /> Cetak / Simpan PDF
                </Button>
              </div>

              {/* The Document / Paper View */}
              <div 
                className="bg-white text-black p-8 md:p-12 shadow-xl rounded-sm max-w-[210mm] mx-auto overflow-hidden print:shadow-none print:p-0 print:m-0 print:w-full print:max-w-none"
                data-testid="document-preview-container"
              >
                {/* Document Header */}
                <div className="border-b-2 border-black pb-6 mb-6">
                  <div className="flex flex-col items-center text-center space-y-2">
                    <span className="border-2 border-black px-3 py-1 text-xs font-bold tracking-[0.2em]">
                      {generatedDoc.draftStatus}
                    </span>
                    <h2 className="text-2xl font-bold uppercase tracking-wider">{generatedDoc.title}</h2>
                    <h3 className="text-lg font-semibold uppercase">{generatedDoc.projectName}</h3>
                    <p className="text-sm font-medium">{generatedDoc.companyName}</p>
                  </div>
                  
                  <div className="flex justify-between items-end mt-8 text-xs font-mono font-medium">
                    <div className="flex flex-col">
                      <span>No. Dokumen: {generatedDoc.documentNumber}</span>
                      <span>Tanggal: {new Date(generatedDoc.generatedAt).toLocaleDateString('id-ID', {day: '2-digit', month: 'long', year: 'numeric'})}</span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span>Standar: {generatedDoc.standard}</span>
                      <span>Template: {generatedDoc.template.replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-[110px_1fr] gap-x-3 gap-y-1 border-t border-black/20 pt-3 text-xs">
                    <span className="font-semibold">Issuer</span><span>{generatedDoc.issuer}</span>
                    <span className="font-semibold">Versi pedoman</span><span>{generatedDoc.guidelineVersion}</span>
                    <span className="font-semibold">Sumber</span><span>{generatedDoc.source}</span>
                  </div>
                </div>

                {/* Document Sections */}
                <div className="space-y-8 min-h-[600px]">
                  {generatedDoc.sections.map((section) => (
                    <div key={section.code} className="space-y-4 print:break-inside-avoid">
                      <h4 className="text-lg font-bold border-b border-black/20 pb-1">
                        {section.code}. {section.title}
                      </h4>
                      
                      {section.narrative && section.narrative.length > 0 && (
                        <div className="space-y-2">
                          {section.narrative.map((p, i) => (
                            <p key={i} className="text-sm text-justify leading-relaxed">
                              {p}
                            </p>
                          ))}
                        </div>
                      )}

                      {section.rows && section.rows.length > 0 && (
                        <div className="border border-black/30 rounded-sm overflow-hidden mt-3">
                          <table className="w-full text-sm">
                            <tbody>
                              {section.rows.map((row, i) => (
                                <tr key={i} className="border-b border-black/20 last:border-0">
                                  <td className="p-2 font-medium bg-black/5 w-1/3 border-r border-black/20 align-top">
                                    {row.label}
                                  </td>
                                  <td className="p-2 w-2/3 align-top whitespace-pre-wrap">
                                    {row.value || "-"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Signatures */}
                <div className="mt-16 pt-8 print:break-inside-avoid flex justify-between items-start text-center">
                  <div className="w-1/3 flex flex-col items-center">
                    <p className="text-sm mb-16">Dibuat oleh,</p>
                    <p className="font-bold border-b border-black min-w-[150px] pb-1">
                      {form.getValues().safetyLead}
                    </p>
                    <p className="text-xs mt-1">Penanggung Jawab K3</p>
                  </div>
                  <div className="w-1/3 flex flex-col items-center">
                    <p className="text-sm mb-16">Disetujui oleh,</p>
                    <p className="font-bold border-b border-black min-w-[150px] pb-1">
                      {form.getValues().directorName}
                    </p>
                    <p className="text-xs mt-1">Pimpinan Perusahaan</p>
                  </div>
                </div>

                {/* Print Footer / Disclaimer */}
                <div className="mt-16 pt-4 border-t border-black/20 text-[10px] text-gray-500 italic text-justify print:break-inside-avoid">
                  <strong>DISCLAIMER:</strong> {generatedDoc.disclaimer}
                  <br />
                  <strong>Referensi Dasar:</strong> {generatedDoc.sources.join(', ')}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Print styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body, html {
            background-color: white !important;
            color: black !important;
            height: auto !important;
          }
          
          /* Force sidebar layout to hide its side components */
          [data-sidebar="sidebar"], 
          header, 
          aside {
            display: none !important;
          }
          
          /* Remove layout paddings */
          main {
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
          }
          
          /* Ensure inset flows correctly */
          [data-sidebar="inset"] {
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            overflow: visible !important;
            width: 100% !important;
            min-height: auto !important;
          }
          
          /* Typography adjustments for print */
          @page {
            margin: 1.5cm;
          }
        }
      `}} />
    </div>
  );
}
