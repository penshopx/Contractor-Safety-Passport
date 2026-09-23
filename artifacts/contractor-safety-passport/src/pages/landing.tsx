import { Link } from "wouter";
import { 
  ArrowRight, 
  Activity, 
  Users, 
  FileText, 
  Building, 
  ShieldCheck, 
  CheckCircle,
  ClipboardList,
  WifiOff,
  Calculator,
  Scale,
  GitMerge,
  FileBarChart,
  HardHat,
  PlayCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

const getImageUrl = (path: string) => {
  const base = import.meta.env.BASE_URL || '/';
  const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
};

export default function LandingPage() {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background selection:bg-primary selection:text-primary-foreground">
      <header className="px-6 h-20 flex items-center border-b border-border/50 bg-card/30 backdrop-blur shrink-0 justify-between relative z-50 sticky top-0">
        <Logo />
        <div className="flex items-center gap-4">
           <Button variant="ghost" asChild className="hidden sm:inline-flex text-muted-foreground hover:text-foreground">
             <Link href="/sign-in">Masuk</Link>
          </Button>
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium shadow-sm">
             <Link href="/sign-up">Mulai</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none" />
        <div className="absolute top-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

        {/* 1. ATTENTION & VIDEO (Hero merged with Video to remove empty space) */}
        <section className="w-full px-6 pt-24 pb-20 md:pt-32 md:pb-28 flex flex-col items-center text-center relative z-10 border-b border-border/20">
          <div className="max-w-4xl mx-auto flex flex-col items-center space-y-8">
            <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary shadow-sm font-medium">
              <ShieldCheck className="mr-2 h-4 w-4" />
              Kesiapan Operasional Kontraktor
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground max-w-4xl leading-[1.15]">
              Kelola Kesiapan Keselamatan <br className="hidden md:block"/> Tanpa <span className="text-primary">Kehilangan Konteks</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
              Satukan pengelolaan persyaratan CSMS, perencanaan SMKK, pemantauan personel, dan dokumentasi lapangan dalam satu ruang kerja yang terstruktur.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 w-full sm:w-auto">
              <Button size="lg" asChild className="w-full sm:w-auto h-12 px-8 text-base bg-primary text-primary-foreground hover:bg-primary/90 shadow-md">
                <Link href="/sign-up">
                   Mulai Ruang Kerja Anda
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="w-full sm:w-auto h-12 px-8 text-base border-border bg-card/50 hover:bg-accent hover:text-accent-foreground">
                <Link href="/sign-in">Masuk</Link>
              </Button>
            </div>
          </div>

          {/* Video Player integrated into the hero fold */}
          <div className="w-full max-w-5xl mx-auto mt-16 md:mt-24">
             <div className="relative rounded-2xl overflow-hidden border border-border/50 shadow-2xl bg-card/50 backdrop-blur-sm">
                <div className="flex items-center px-4 py-3 bg-muted/30 border-b border-border/50">
                   <div className="flex space-x-2">
                      <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                   </div>
                   <div className="mx-auto text-xs text-muted-foreground/70 font-medium tracking-wide">Video pengantar Safety Passport</div>
                </div>
                <div className="aspect-video relative w-full bg-card/80">
                  <div className="absolute inset-0 flex items-center justify-center bg-card/50 -z-10">
                     <PlayCircle className="w-12 h-12 text-muted-foreground/30 animate-pulse" />
                  </div>
                  <iframe 
                    src="/safety-passport-video/?embed=1"
                    title="Video Pengantar Contractor Safety Passport"
                    className="absolute inset-0 w-full h-full"
                    loading="lazy"
                    allow="autoplay; fullscreen"
                  />
                </div>
             </div>
             <a
               href="/safety-passport-video/"
               target="_blank"
               rel="noopener noreferrer"
               className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80"
             >
               Buka video di pemutar penuh <ArrowRight className="h-4 w-4" />
             </a>
          </div>
        </section>

        {/* 2. INTEREST (The Problem & Connected Workflow) */}
        <section className="w-full px-6 py-20 md:py-28 bg-card/10 border-b border-border/20 relative z-10">
          <div className="max-w-5xl mx-auto space-y-24 md:space-y-32">
            
            {/* The Problem */}
            <div className="flex flex-col md:flex-row items-center gap-12 md:gap-16">
              <div className="flex-1 space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">Koordinasi Terhambat oleh Data yang Tersebar</h2>
                <div className="space-y-4 text-muted-foreground leading-relaxed text-lg">
                  <p>
                    Menyocokkan dokumen persyaratan tender, mengawasi masa berlaku sertifikat, dan mengumpulkan bukti kegiatan lapangan dari berbagai saluran menyulitkan pengawasan.
                  </p>
                  <p>
                    Contractor Safety Passport merancang ruang kerja yang menyatukan alur informasi ini, sehingga perencana di kantor dan pengawas di lapangan beroperasi dengan konteks yang sama.
                  </p>
                </div>
              </div>
              <div className="flex-1 w-full relative">
                <div className="relative rounded-2xl overflow-hidden border border-border/50 shadow-xl group bg-card">
                  <img 
                    src={getImageUrl('/images/safety-site.jpg')} 
                    alt="Pekerjaan konstruksi industri"
                    className="w-full h-auto aspect-square md:aspect-[4/3] object-cover transition-transform duration-700 group-hover:scale-105 opacity-90"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/20 to-transparent pointer-events-none" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="flex items-start gap-4 p-5 rounded-xl bg-card/90 backdrop-blur-md border border-border/50 shadow-sm">
                      <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                        <ShieldCheck className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">Menjembatani Jarak</div>
                        <div className="text-sm text-muted-foreground mt-1">Satu acuan data untuk pengawas lapangan dan perencana administrasi.</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* How the workflow connects */}
            <div className="space-y-12">
              <div className="text-center max-w-2xl mx-auto space-y-4">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Alur Kerja Keselamatan yang Terhubung</h2>
                <p className="text-muted-foreground text-lg">
                  Dari pengumpulan syarat awal hingga pelaporan operasional, sistem mempertahankan benang merah antar data.
                </p>
              </div>

              <div className="relative w-full rounded-3xl overflow-hidden border border-border/50 shadow-xl bg-card">
                 <div className="absolute inset-0 z-0 pointer-events-none">
                    <img 
                      src={getImageUrl('/images/connected-workflow.jpg')} 
                      alt="Ilustrasi jaringan data"
                      className="w-full h-full object-cover opacity-[0.15]"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/90 to-background/60" />
                 </div>
                 
                 <div className="relative z-10 p-8 md:p-12">
                   <div className="grid md:grid-cols-4 gap-6 relative">
                      {/* Desktop connecting line */}
                      <div className="hidden md:block absolute top-1/2 left-0 w-full h-[2px] bg-border/50 -translate-y-1/2 z-0" />

                      <div className="bg-card/90 backdrop-blur-md border border-border/50 rounded-2xl p-6 shadow-md flex flex-col items-center text-center space-y-4 relative z-10 hover:-translate-y-1 transition-transform">
                        <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center border border-primary/20 shadow-inner ring-4 ring-card">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div className="space-y-2">
                          <div className="text-[10px] font-bold tracking-widest text-primary uppercase">Fase 1</div>
                          <h3 className="font-semibold text-foreground text-sm">Persyaratan Proyek</h3>
                          <p className="text-xs text-muted-foreground leading-relaxed">Analisis syarat awal dokumen tender dan kualifikasi.</p>
                        </div>
                      </div>

                      <div className="bg-card/90 backdrop-blur-md border border-border/50 rounded-2xl p-6 shadow-md flex flex-col items-center text-center space-y-4 relative z-10 hover:-translate-y-1 transition-transform">
                        <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center border border-primary/20 shadow-inner ring-4 ring-card">
                          <ClipboardList className="w-5 h-5 text-primary" />
                        </div>
                        <div className="space-y-2">
                          <div className="text-[10px] font-bold tracking-widest text-primary uppercase">Fase 2</div>
                          <h3 className="font-semibold text-foreground text-sm">Kesiapan & BOQ</h3>
                          <p className="text-xs text-muted-foreground leading-relaxed">Penyusunan draf CSMS dan perencanaan anggaran SMKK.</p>
                        </div>
                      </div>

                      <div className="bg-card/90 backdrop-blur-md border border-border/50 rounded-2xl p-6 shadow-md flex flex-col items-center text-center space-y-4 relative z-10 hover:-translate-y-1 transition-transform">
                        <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center border border-primary/20 shadow-inner ring-4 ring-card">
                          <HardHat className="w-5 h-5 text-primary" />
                        </div>
                        <div className="space-y-2">
                          <div className="text-[10px] font-bold tracking-widest text-primary uppercase">Fase 3</div>
                          <h3 className="font-semibold text-foreground text-sm">Bukti Lapangan</h3>
                          <p className="text-xs text-muted-foreground leading-relaxed">Pencatatan kegiatan pengawasan dan temuan inspeksi.</p>
                        </div>
                      </div>

                      <div className="bg-card/90 backdrop-blur-md border border-border/50 rounded-2xl p-6 shadow-md flex flex-col items-center text-center space-y-4 relative z-10 hover:-translate-y-1 transition-transform">
                        <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center border border-primary/20 shadow-inner ring-4 ring-card">
                          <FileBarChart className="w-5 h-5 text-primary" />
                        </div>
                        <div className="space-y-2">
                          <div className="text-[10px] font-bold tracking-widest text-primary uppercase">Fase 4</div>
                          <h3 className="font-semibold text-foreground text-sm">Pelaporan Evaluasi</h3>
                          <p className="text-xs text-muted-foreground leading-relaxed">Penggabungan data lapangan ke struktur laporan resmi.</p>
                        </div>
                      </div>
                   </div>
                 </div>
              </div>
            </div>

          </div>
        </section>

        {/* 3. DESIRE (Flagship Capabilities) */}
        <section className="w-full px-6 py-20 md:py-28 border-b border-border/20 relative z-10">
          <div className="max-w-5xl mx-auto space-y-24 md:space-y-32">
            
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">Fitur yang Menjawab Kebutuhan Operasional</h2>
              <p className="text-muted-foreground text-lg">
                Fasilitas ruang kerja yang dibangun secara spesifik untuk tim keselamatan.
              </p>
            </div>

            {/* Feature 1: CSMS Readiness Workspace */}
            <div className="flex flex-col md:flex-row items-center gap-12 md:gap-16">
              <div className="flex-1 space-y-6">
                <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm text-primary font-medium">
                  <ClipboardList className="mr-2 h-4 w-4" /> Ruang Kerja Spesifik
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">Pemantauan Kesiapan CSMS per Proyek</h3>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    <strong className="text-foreground">Tantangan:</strong> Melacak kelengkapan berbagai dokumen memicu kebingungan versi dan status terakhir.
                  </p>
                  <p>
                    <strong className="text-foreground">Pendekatan Kami:</strong> Kami menyediakan ruang kerja kesiapan khusus untuk tiap proyek, memetakan profil aktif, dan daftar tindak lanjut.
                  </p>
                  <p>
                    <strong className="text-foreground">Nilai Praktis:</strong> Pengguna mendapatkan panduan visual mengenai bagian yang sudah lengkap dan apa yang memerlukan penyesuaian editor.
                  </p>
                </div>
              </div>
              <div className="flex-1 w-full bg-card/40 border border-border/50 rounded-2xl p-6 md:p-8 shadow-xl">
                <div className="space-y-5">
                  <div className="flex justify-between items-start border-b border-border/50 pb-5">
                    <div>
                      <div className="text-base font-semibold text-foreground">Kesiapan proyek</div>
                      <div className="text-sm text-muted-foreground mt-1">Tinjau persyaratan dan tindak lanjut</div>
                    </div>
                    <div className="px-3 py-1 bg-primary/15 text-primary text-[11px] font-bold rounded-full border border-primary/20 tracking-wider">
                      DRAF
                    </div>
                  </div>
                  <div className="space-y-3">
                     <div className="flex items-center gap-4 p-4 bg-background rounded-xl border border-border/50 shadow-sm">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <div className="flex-1">
                            <div className="text-sm font-semibold text-foreground">Dokumen persyaratan</div>
                            <div className="text-xs text-muted-foreground mt-0.5">Tercatat dalam ruang kerja</div>
                        </div>
                     </div>
                     <div className="flex items-center gap-4 p-4 bg-background rounded-xl border border-border/50 shadow-sm">
                        <Activity className="w-5 h-5 text-amber-500 flex-shrink-0" />
                        <div className="flex-1">
                            <div className="text-sm font-semibold text-foreground">Bukti kompetensi personel</div>
                           <div className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">Menunggu Tinjauan Internal</div>
                        </div>
                     </div>
                     <div className="flex items-center gap-4 p-4 bg-background rounded-xl border border-border/50 shadow-sm opacity-70">
                        <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 flex-shrink-0"></div>
                        <div className="flex-1">
                           <div className="text-sm font-semibold text-foreground">Prosedur Kerja Aman (SOP)</div>
                           <div className="text-xs text-muted-foreground mt-0.5">Belum diunggah</div>
                        </div>
                     </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 2: Fit Matching */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-12 md:gap-16">
              <div className="flex-1 space-y-6">
                <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm text-primary font-medium">
                  <Scale className="mr-2 h-4 w-4" /> Dukungan Keputusan
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">Pencocokan Kualifikasi Proyek</h3>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    <strong className="text-foreground">Tantangan:</strong> Menilai apakah perusahaan memenuhi standar tender memerlukan tinjauan manual yang berisiko terlewat.
                  </p>
                  <p>
                    <strong className="text-foreground">Pendekatan Kami:</strong> Perbandingan berdampingan antara kualifikasi organisasi dengan persyaratan proyek untuk menyoroti kecocokan dan peringatan.
                  </p>
                  <p>
                    <strong className="text-foreground">Nilai Praktis:</strong> Mendukung mitigasi administrasi sebelum pengajuan dokumen final.
                  </p>
                </div>
              </div>
              <div className="flex-1 w-full bg-card/40 border border-border/50 rounded-2xl p-6 md:p-8 shadow-xl">
                <div className="flex gap-4 mb-5 text-sm text-muted-foreground font-semibold">
                  <div className="flex-1 pb-3 border-b border-border/80">Syarat Proyek</div>
                  <div className="flex-1 pb-3 border-b border-border/80">Profil Tersedia</div>
                </div>
                <div className="space-y-3">
                  <div className="flex gap-3 items-center">
                    <div className="flex-1 p-3 bg-background rounded-xl border border-border/50 text-xs font-medium">Klasifikasi Bangunan Sipil</div>
                    <div className="flex-shrink-0 text-muted-foreground/50"><ArrowRight className="w-4 h-4"/></div>
                    <div className="flex-1 p-3 bg-primary/10 rounded-xl border border-primary/20 text-xs text-primary flex justify-between items-center font-semibold">
                      Klaim tercatat <FileText className="w-4 h-4"/>
                    </div>
                  </div>
                  <div className="flex gap-3 items-center">
                    <div className="flex-1 p-3 bg-background rounded-xl border border-border/50 text-xs font-medium">Kualifikasi proyek</div>
                    <div className="flex-shrink-0 text-muted-foreground/50"><ArrowRight className="w-4 h-4"/></div>
                    <div className="flex-1 p-3 bg-primary/10 rounded-xl border border-primary/20 text-xs text-primary flex justify-between items-center font-semibold">
                      Perlu ditinjau <Scale className="w-4 h-4"/>
                    </div>
                  </div>
                  <div className="flex gap-3 items-center">
                    <div className="flex-1 p-3 bg-background rounded-xl border border-border/50 text-xs font-medium">Bukti kompetensi</div>
                    <div className="flex-shrink-0 text-muted-foreground/50"><ArrowRight className="w-4 h-4"/></div>
                    <div className="flex-1 p-3 bg-destructive/10 rounded-xl border border-destructive/20 text-xs text-destructive flex justify-between items-center font-semibold">
                      Belum lengkap <FileText className="w-4 h-4"/>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 3: Shared BOQ */}
            <div className="flex flex-col md:flex-row items-center gap-12 md:gap-16">
              <div className="flex-1 space-y-6">
                <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm text-primary font-medium">
                  <Calculator className="mr-2 h-4 w-4" /> Perencanaan Terpadu
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">Penyusunan BOQ SMKK Kolaboratif</h3>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    <strong className="text-foreground">Tantangan:</strong> Estimasi anggaran keselamatan sering dikerjakan pada berkas terpisah tanpa referensi harga yang seragam.
                  </p>
                  <p>
                    <strong className="text-foreground">Pendekatan Kami:</strong> Lingkungan draf biaya (BOQ) yang tertaut dengan proyek. Menyimpan referensi harga dan mencegah konflik pengeditan ganda.
                  </p>
                  <p>
                    <strong className="text-foreground">Nilai Praktis:</strong> Dokumen siap diekspor ke PDF/CSV untuk penyajian anggaran operasional yang solid.
                  </p>
                </div>
              </div>
              <div className="flex-1 w-full bg-card/40 border border-border/50 rounded-2xl p-6 md:p-8 shadow-xl overflow-hidden">
                <div className="w-full space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-[11px] uppercase tracking-wider font-bold text-muted-foreground pb-3 border-b border-border/80">
                    <div className="col-span-6">Item SMKK</div>
                    <div className="col-span-2 text-right">Vol</div>
                    <div className="col-span-4 text-right">Subtotal (Rp)</div>
                  </div>
                  
                  <div className="grid grid-cols-12 gap-2 text-xs py-3 border-b border-border/30 items-center">
                    <div className="col-span-6 flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/80"></div>
                      <div className="font-semibold text-foreground">Helm Proyek Standar</div>
                    </div>
                    <div className="col-span-2 text-right text-muted-foreground">—</div>
                    <div className="col-span-4 text-right font-mono text-muted-foreground">Draf</div>
                  </div>
                  
                  <div className="grid grid-cols-12 gap-2 text-xs py-3 border-b border-border/30 items-center">
                    <div className="col-span-6 flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/80"></div>
                      <div className="font-semibold text-foreground">Jaring Pengaman</div>
                    </div>
                    <div className="col-span-2 text-right text-muted-foreground">—</div>
                    <div className="col-span-4 text-right font-mono text-muted-foreground">Draf</div>
                  </div>
                  
                  <div className="grid grid-cols-12 gap-2 text-xs py-3 border-b border-border/30 items-center">
                    <div className="col-span-6 flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/80"></div>
                      <div className="font-semibold text-foreground">Rambu Peringatan K3</div>
                    </div>
                    <div className="col-span-2 text-right text-muted-foreground">—</div>
                    <div className="col-span-4 text-right font-mono text-muted-foreground">Draf</div>
                  </div>

                  <div className="pt-5 flex justify-between items-center">
                    <div className="text-sm text-muted-foreground font-semibold">Total Estimasi</div>
                    <div className="text-base font-bold text-primary bg-primary/10 px-3 py-1 rounded-lg border border-primary/20">Belum dihitung</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 4: Offline Capture */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-12 md:gap-16">
              <div className="flex-1 space-y-6">
                <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm text-primary font-medium">
                  <WifiOff className="mr-2 h-4 w-4" /> Ketahanan Jaringan
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">Pengumpulan Bukti Lapangan Luring</h3>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    <strong className="text-foreground">Tantangan:</strong> Pengawas kesulitan melaporkan inspeksi harian karena hilangnya koneksi internet di lokasi proyek.
                  </p>
                  <p>
                    <strong className="text-foreground">Pendekatan Kami:</strong> Perekaman aktivitas berjalan luring. Catatan, foto, konteks lokasi, dan tanda tangan disimpan dalam antrean perangkat.
                  </p>
                  <p>
                    <strong className="text-foreground">Nilai Praktis:</strong> Saat koneksi kembali, aplikasi mencoba mengirim ulang antrean agar catatan lapangan dapat dilihat oleh tim di kantor.
                  </p>
                </div>
              </div>
              <div className="flex-1 w-full relative">
                <div className="relative rounded-2xl overflow-hidden border border-border/50 shadow-xl group bg-card">
                  <img 
                    src={getImageUrl('/images/field-supervisor.jpg')} 
                    alt="Pengawas lapangan menggunakan tablet untuk inspeksi"
                    className="w-full h-auto aspect-[4/3] object-cover transition-transform duration-700 group-hover:scale-105 opacity-90"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/20 to-transparent pointer-events-none" />
                  
                  <div className="absolute bottom-6 left-6 right-6 bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl p-5 shadow-2xl flex flex-col gap-4">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center border border-destructive/20 relative">
                              <WifiOff className="w-5 h-5 text-destructive" />
                              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive/50 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-destructive"></span>
                              </span>
                           </div>
                           <div>
                              <p className="text-sm font-bold text-foreground">Koneksi Terputus</p>
                              <p className="text-xs text-muted-foreground mt-0.5">Menyimpan draf secara lokal</p>
                           </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-foreground">3 Laporan</div>
                          <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mt-1">Antrean</div>
                        </div>
                     </div>
                     <div className="w-full bg-muted/50 rounded-full h-1.5 overflow-hidden">
                       <div className="bg-primary/60 h-full w-1/3 rounded-full relative overflow-hidden">
                         <div className="absolute inset-0 bg-white/20 w-full h-full animate-[slide_2s_ease-in-out_infinite]" />
                       </div>
                     </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* 4. SUPPORTING CAPABILITIES */}
        <section className="w-full px-6 py-20 md:py-28 bg-card/5 border-b border-border/20 relative z-10">
           <div className="max-w-5xl mx-auto space-y-12">
              <div className="text-center max-w-2xl mx-auto space-y-4">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Infrastruktur Kapabilitas Pendukung</h2>
                <p className="text-muted-foreground text-lg">
                  Lapisan fitur operasional untuk menjaga keandalan sistem dokumentasi secara menyeluruh.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                <div className="bg-card/50 border border-border/50 rounded-2xl p-8 backdrop-blur-sm hover:bg-card transition-colors shadow-sm group">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 mb-6 group-hover:scale-110 transition-transform">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-bold text-foreground mb-3 text-lg">Status Personel</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Pemantauan masa kedaluwarsa sertifikat dan kelengkapan peran operasional anggota tim lapangan.
                  </p>
                </div>
                
                <div className="bg-card/50 border border-border/50 rounded-2xl p-8 backdrop-blur-sm hover:bg-card transition-colors shadow-sm group">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 mb-6 group-hover:scale-110 transition-transform">
                    <Activity className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-bold text-foreground mb-3 text-lg">Riwayat Lapangan</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Rekaman pelaporan kejadian dan pengawasan harian yang terikat utuh pada profil proyek.
                  </p>
                </div>
                
                <div className="bg-card/50 border border-border/50 rounded-2xl p-8 backdrop-blur-sm hover:bg-card transition-colors shadow-sm group">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 mb-6 group-hover:scale-110 transition-transform">
                    <FileBarChart className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-bold text-foreground mb-3 text-lg">Laporan Bulanan</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Kompilasi ringkasan SMKK dengan bidang status tinjauan, siap diunduh untuk administrasi.
                  </p>
                </div>
                
                <div className="bg-card/50 border border-border/50 rounded-2xl p-8 backdrop-blur-sm hover:bg-card transition-colors shadow-sm group">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 mb-6 group-hover:scale-110 transition-transform">
                    <Building className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-bold text-foreground mb-3 text-lg">Akses Wewenang</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Undangan organisasi dan batasan hak akses baca/tulis guna melindungi privasi data internal.
                  </p>
                </div>
                
                <div className="bg-card/50 border border-border/50 rounded-2xl p-8 backdrop-blur-sm hover:bg-card transition-colors shadow-sm group">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 mb-6 group-hover:scale-110 transition-transform">
                    <GitMerge className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-bold text-foreground mb-3 text-lg">Proteksi Konflik</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Peringatan real-time ketika rekan kerja menyimpan versi draf baru di saat yang bersamaan.
                  </p>
                </div>
                
                <div className="bg-card/50 border border-border/50 rounded-2xl p-8 backdrop-blur-sm hover:bg-card transition-colors shadow-sm group flex flex-col justify-center items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">Pelajari Kapabilitas Selengkapnya</p>
                </div>
              </div>
           </div>
        </section>

        {/* 5. ACTION (Final CTA) */}
        <section className="w-full px-6 py-24 md:py-32 bg-card/20 relative z-10 flex flex-col items-center text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">Siap Membangun Lingkungan Kerja Terstruktur?</h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Satu titik temu untuk manajemen dokumen persiapan proyek dan pelaporan operasional lapangan.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              <Button size="lg" asChild className="w-full sm:w-auto h-12 px-8 text-base bg-primary text-primary-foreground hover:bg-primary/90 shadow-md">
                <Link href="/sign-up">
                  Buat Akun Anda
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="w-full sm:w-auto h-12 px-8 text-base border-border bg-background hover:bg-accent hover:text-accent-foreground">
                 <Link href="/sign-in">Masuk ke Ruang Kerja</Link>
              </Button>
            </div>
          </div>
        </section>

      </main>

      <footer className="py-8 text-center border-t border-border/50 bg-card/30 shrink-0">
         <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Contractor Safety Passport. Alat operasional untuk dokumentasi terstruktur.</p>
      </footer>
    </div>
  );
}

