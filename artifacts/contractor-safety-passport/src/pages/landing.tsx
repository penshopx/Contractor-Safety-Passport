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
  ArrowDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export default function LandingPage() {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background selection:bg-primary selection:text-primary-foreground">
      <header className="px-6 h-20 flex items-center border-b border-border/50 bg-card/30 backdrop-blur shrink-0 justify-between relative z-10 sticky top-0">
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

        {/* 1. ATTENTION (Hero) */}
        <section className="w-full px-6 py-24 md:py-32 flex flex-col items-center text-center relative z-10 border-b border-border/20">
          <div className="max-w-4xl mx-auto flex flex-col items-center space-y-8">
            <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary shadow-sm">
              <ShieldCheck className="mr-2 h-4 w-4" />
              Kesiapan Operasional Kontraktor
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground max-w-4xl leading-[1.1]">
              Kelola Kesiapan Keselamatan <br className="hidden md:block"/> Tanpa <span className="text-primary">Kehilangan Konteks</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
              Satukan pengelolaan persyaratan CSMS, perencanaan SMKK, pemantauan personel, dan dokumentasi lapangan dalam satu ruang kerja yang terstruktur. Bantu tim konstruksi Anda bekerja dengan panduan yang jelas.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-6 w-full sm:w-auto">
              <Button size="lg" asChild className="w-full sm:w-auto h-12 px-8 text-base bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
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
        </section>

        {/* 2. INTEREST (The Problem & Connected Workflow) */}
        <section className="w-full px-6 py-24 bg-card/10 border-b border-border/20 relative z-10">
          <div className="max-w-5xl mx-auto space-y-24">
            
            {/* The Problem */}
            <div className="flex flex-col md:flex-row items-center gap-16">
              <div className="flex-1 space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground">Koordinasi Terhambat oleh Data yang Tersebar</h2>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    Menyocokkan dokumen persyaratan tender, mengawasi masa berlaku sertifikat personel, serta mengumpulkan bukti kegiatan lapangan dari berbagai saluran sering kali menyulitkan pengawasan.
                  </p>
                  <p>
                    Tanpa acuan yang terintegrasi, tim kesulitan memantau kelengkapan kewajiban administratif proyek, atau memastikan apakah bukti lapangan relevan dengan tahap operasional saat ini.
                  </p>
                  <p>
                    Contractor Safety Passport merancang ruang kerja yang menyatukan alur informasi ini agar tim perencana di kantor dan pengawas di lapangan beroperasi dengan konteks yang sama.
                  </p>
                </div>
              </div>
              <div className="flex-1 w-full max-w-md bg-card/50 border border-border/50 rounded-2xl p-6 shadow-xl relative overflow-hidden backdrop-blur-sm">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                  <Activity className="w-48 h-48" />
                </div>
                <div className="space-y-4 relative z-10">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border/50">
                    <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-foreground text-sm">Dokumen Terkonsolidasi</div>
                      <div className="text-xs text-muted-foreground mt-1">Akses persyaratan administratif dari satu titik.</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border/50">
                    <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-foreground text-sm">Visibilitas Kolaboratif</div>
                      <div className="text-xs text-muted-foreground mt-1">Anggota berwenang bekerja dari draf dan status yang sama.</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border/50">
                    <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-foreground text-sm">Rekam Jejak Tersusun</div>
                      <div className="text-xs text-muted-foreground mt-1">Riwayat aktivitas yang dapat ditelusuri per proyek.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* How the workflow connects */}
            <div className="space-y-12 pt-8 border-t border-border/20">
              <div className="text-center max-w-2xl mx-auto space-y-4">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Alur Kerja Keselamatan yang Terhubung</h2>
                <p className="text-muted-foreground">
                  Dari tahap pengumpulan syarat awal hingga pelaporan pelaksanaan operasional, sistem mempertahankan benang merah antar data.
                </p>
              </div>

              <div className="relative">
                {/* Connecting Line (Desktop) */}
                <div className="hidden md:block absolute top-1/2 left-0 w-full h-[2px] bg-border/50 -translate-y-1/2 z-0" />
                
                <div className="grid md:grid-cols-4 gap-8 relative z-10">
                  <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm flex flex-col items-center text-center space-y-4 relative">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground">1. Persyaratan Proyek</h3>
                    <p className="text-sm text-muted-foreground">Penerimaan dan analisis syarat awal dokumen tender dan kualifikasi.</p>
                  </div>
                  <div className="hidden md:flex absolute top-1/2 left-[25%] -translate-x-1/2 -translate-y-1/2 z-20 text-muted-foreground/30">
                    <ArrowRight className="w-6 h-6" />
                  </div>

                  <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm flex flex-col items-center text-center space-y-4 relative">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                      <ClipboardList className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground">2. Kesiapan & BOQ</h3>
                    <p className="text-sm text-muted-foreground">Penyusunan ruang kerja CSMS dan perencanaan anggaran SMKK.</p>
                  </div>
                  <div className="hidden md:flex absolute top-1/2 left-[50%] -translate-x-1/2 -translate-y-1/2 z-20 text-muted-foreground/30">
                    <ArrowRight className="w-6 h-6" />
                  </div>

                  <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm flex flex-col items-center text-center space-y-4 relative">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                      <HardHat className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground">3. Bukti Lapangan</h3>
                    <p className="text-sm text-muted-foreground">Pencatatan kegiatan pengawasan, inspeksi, dan temuan lokasi.</p>
                  </div>
                  <div className="hidden md:flex absolute top-1/2 left-[75%] -translate-x-1/2 -translate-y-1/2 z-20 text-muted-foreground/30">
                    <ArrowRight className="w-6 h-6" />
                  </div>

                  <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm flex flex-col items-center text-center space-y-4 relative">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                      <FileBarChart className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground">4. Pelaporan & Tinjauan</h3>
                    <p className="text-sm text-muted-foreground">Penggabungan catatan lapangan ke dalam struktur laporan evaluasi.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* 3. DESIRE (Flagship Capabilities) */}
        <section className="w-full px-6 py-24 border-b border-border/20 relative z-10">
          <div className="max-w-5xl mx-auto space-y-32">
            
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">Fitur Unggulan yang Menjawab Kebutuhan Lapangan</h2>
              <p className="text-muted-foreground text-lg">
                Fasilitas ruang kerja yang dibangun secara khusus untuk mendukung kebutuhan operasional harian tim keselamatan.
              </p>
            </div>

            {/* Feature 1: CSMS Readiness Workspace */}
            <div className="flex flex-col md:flex-row items-center gap-12 md:gap-16">
              <div className="flex-1 space-y-6">
                <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm text-primary">
                  <ClipboardList className="mr-2 h-4 w-4" /> Ruang Kerja Spesifik
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-foreground">Pemantauan Kesiapan CSMS per Proyek</h3>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    <strong className="text-foreground">Tantangan:</strong> Melacak kelengkapan berbagai dokumen untuk proyek yang berbeda sering memicu kebingungan mengenai versi dan status terakhir.
                  </p>
                  <p>
                    <strong className="text-foreground">Pendekatan Kami:</strong> Kami menyediakan ruang kerja kesiapan khusus untuk setiap proyek. Fasilitas ini memetakan profil organisasi aktif, tahapan evaluasi yang sedang berjalan, dan daftar tindak lanjut.
                  </p>
                  <p>
                    <strong className="text-foreground">Nilai Praktis:</strong> Pengguna mendapatkan panduan visual tentang apa yang sudah lengkap dan apa yang masih berstatus draf atau memerlukan penyesuaian dari editor tim.
                  </p>
                </div>
              </div>
              <div className="flex-1 w-full bg-card/30 border border-border/50 rounded-2xl p-6 shadow-lg">
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-border/50 pb-4">
                    <div className="space-y-1">
                      <div className="w-32 h-4 bg-muted rounded"></div>
                      <div className="w-24 h-3 bg-muted/50 rounded"></div>
                    </div>
                    <div className="w-16 h-6 bg-primary/20 rounded-full"></div>
                  </div>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4 p-3 bg-background rounded-lg border border-border/50">
                      <div className={`w-4 h-4 rounded-full border flex-shrink-0 ${i === 1 ? 'bg-primary border-primary' : 'border-muted-foreground/30'}`}></div>
                      <div className="flex-1 space-y-2">
                        <div className="w-3/4 h-3 bg-muted rounded"></div>
                        <div className="w-1/2 h-2 bg-muted/50 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Feature 2: Fit Matching */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-12 md:gap-16">
              <div className="flex-1 space-y-6">
                <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm text-primary">
                  <Scale className="mr-2 h-4 w-4" /> Dukungan Keputusan
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-foreground">Pencocokan Kualifikasi Proyek</h3>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    <strong className="text-foreground">Tantangan:</strong> Menilai apakah perusahaan memenuhi standar klasifikasi tender memerlukan tinjauan silang manual yang berisiko terlewat.
                  </p>
                  <p>
                    <strong className="text-foreground">Pendekatan Kami:</strong> Sistem menampilkan perbandingan berdampingan antara kualifikasi yang diklaim organisasi dengan persyaratan spesifik proyek, menyoroti kecocokan, kesenjangan profil, dan peringatan awal.
                  </p>
                  <p>
                    <strong className="text-foreground">Nilai Praktis:</strong> Membantu tim menilai posisi mereka terhadap persyaratan proyek sebelum mengajukan dokumen final, sebagai bentuk dukungan mitigasi administrasi.
                  </p>
                </div>
              </div>
              <div className="flex-1 w-full bg-card/30 border border-border/50 rounded-2xl p-6 shadow-lg">
                <div className="flex gap-4 mb-4 text-sm text-muted-foreground font-medium">
                  <div className="flex-1 pb-2 border-b border-border">Syarat Proyek</div>
                  <div className="flex-1 pb-2 border-b border-border">Profil Tersedia</div>
                </div>
                <div className="space-y-3">
                  <div className="flex gap-4">
                    <div className="flex-1 p-3 bg-background rounded-lg border border-border/50 text-xs">Klasifikasi Risiko Tinggi</div>
                    <div className="flex-1 p-3 bg-primary/10 rounded-lg border border-primary/20 text-xs text-primary flex justify-between">Risiko Tinggi <CheckCircle className="w-4 h-4"/></div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1 p-3 bg-background rounded-lg border border-border/50 text-xs">Tenaga Ahli K3 Sesuai Syarat</div>
                    <div className="flex-1 p-3 bg-destructive/10 rounded-lg border border-destructive/20 text-xs text-destructive-foreground flex justify-between">Bukti Kompetensi Belum Lengkap</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 3: Shared BOQ */}
            <div className="flex flex-col md:flex-row items-center gap-12 md:gap-16">
              <div className="flex-1 space-y-6">
                <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm text-primary">
                  <Calculator className="mr-2 h-4 w-4" /> Perencanaan Terpadu
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-foreground">Penyusunan BOQ SMKK Kolaboratif</h3>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    <strong className="text-foreground">Tantangan:</strong> Estimasi anggaran keselamatan sering dikerjakan pada berkas terpisah tanpa referensi riwayat harga yang seragam.
                  </p>
                  <p>
                    <strong className="text-foreground">Pendekatan Kami:</strong> Lingkungan penyusunan draf biaya (BOQ) yang tertaut dengan proyek. Menggunakan pengelompokan kategori yang jelas, menyimpan rekaman referensi harga katalog, dan melindunginya dari konflik perubahan bersama.
                  </p>
                  <p>
                    <strong className="text-foreground">Nilai Praktis:</strong> Dokumen rancangan dapat diekspor langsung ke PDF/CSV setelah disepakati tim internal, mendukung penyajian anggaran keselamatan operasional.
                  </p>
                </div>
              </div>
              <div className="flex-1 w-full bg-card/30 border border-border/50 rounded-2xl p-6 shadow-lg overflow-hidden">
                <div className="w-full space-y-2">
                  <div className="grid grid-cols-4 gap-2 text-xs font-medium text-muted-foreground pb-2 border-b border-border/50">
                    <div className="col-span-2">Item Pekerjaan</div>
                    <div>Vol</div>
                    <div>Harga (Rp)</div>
                  </div>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="grid grid-cols-4 gap-2 text-xs py-2 border-b border-border/20">
                      <div className="col-span-2 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary/50"></div>
                        <div className="w-full h-2 bg-muted rounded"></div>
                      </div>
                      <div className="h-2 w-4 bg-muted rounded mt-1"></div>
                      <div className="h-2 w-12 bg-muted rounded mt-1"></div>
                    </div>
                  ))}
                  <div className="pt-2 flex justify-end">
                    <div className="w-24 h-4 bg-primary/20 rounded"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 4: Offline Capture */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-12 md:gap-16">
              <div className="flex-1 space-y-6">
                <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm text-primary">
                  <WifiOff className="mr-2 h-4 w-4" /> Ketahanan Jaringan
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-foreground">Pengumpulan Bukti Lapangan Luring</h3>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    <strong className="text-foreground">Tantangan:</strong> Pengawas lapangan kesulitan melaporkan inspeksi, temuan, atau aktivitas toolbox meeting karena tidak ada koneksi internet di lokasi proyek.
                  </p>
                  <p>
                    <strong className="text-foreground">Pendekatan Kami:</strong> Perekaman aktivitas via perangkat bergerak tetap berjalan luring. Sistem menyerap foto, data konteks lokasi, dan tanda tangan pelaksana, lalu menyimpannya dalam antrean.
                  </p>
                  <p>
                    <strong className="text-foreground">Nilai Praktis:</strong> Pengguna dapat melakukan sinkronisasi ulang saat koneksi tersedia kembali, menjaga alur komunikasi informasi lapangan ke tim manajemen proyek di kantor.
                  </p>
                </div>
              </div>
              <div className="flex-1 w-full flex justify-center">
                <div className="relative w-48 h-80 bg-background border-[4px] border-border rounded-[2rem] shadow-xl overflow-hidden flex flex-col">
                  <div className="h-6 bg-card flex justify-center items-center gap-1 border-b border-border/50">
                     <div className="w-10 h-1 bg-border rounded-full"></div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col gap-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                      <span>Toolbox Meeting</span>
                      <WifiOff className="w-3 h-3 text-destructive" />
                    </div>
                    <div className="h-20 bg-muted/30 rounded-lg border border-border/50 flex items-center justify-center">
                      <div className="w-8 h-8 rounded bg-muted"></div>
                    </div>
                    <div className="space-y-2 mt-2">
                      <div className="h-2 bg-muted rounded w-3/4"></div>
                      <div className="h-2 bg-muted rounded w-1/2"></div>
                      <div className="h-2 bg-muted rounded w-full"></div>
                    </div>
                    <div className="mt-auto h-8 bg-primary/50 rounded-md border border-primary/20 flex items-center justify-center text-[10px] text-foreground font-medium">
                      Simpan ke Antrean
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* 4. SUPPORTING CAPABILITIES */}
        <section className="w-full px-6 py-24 bg-card/5 border-b border-border/20 relative z-10">
           <div className="max-w-5xl mx-auto space-y-12">
              <div className="text-center max-w-2xl mx-auto space-y-4">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Infrastruktur Kapabilitas Pendukung</h2>
                <p className="text-muted-foreground">
                  Lapisan pengelola untuk mendukung operasional sistem secara keseluruhan.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                <div className="bg-card/50 border border-border/50 rounded-xl p-6 backdrop-blur-sm">
                  <Users className="h-6 w-6 text-primary mb-4" />
                  <h4 className="font-semibold text-foreground mb-2">Status Personel</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Pemantauan masa kedaluwarsa sertifikat dan kelengkapan peran anggota tim kerja operasional.
                  </p>
                </div>
                <div className="bg-card/50 border border-border/50 rounded-xl p-6 backdrop-blur-sm">
                  <Activity className="h-6 w-6 text-primary mb-4" />
                  <h4 className="font-semibold text-foreground mb-2">Riwayat Bukti Lapangan</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Rekaman laporan kejadian, intervensi keselamatan, dan pengawasan yang ditautkan ke profil proyek.
                  </p>
                </div>
                <div className="bg-card/50 border border-border/50 rounded-xl p-6 backdrop-blur-sm">
                  <FileBarChart className="h-6 w-6 text-primary mb-4" />
                  <h4 className="font-semibold text-foreground mb-2">Laporan Bulanan</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Kompilasi ringkasan SMKK bulanan dengan bidang status tinjauan yang dapat diunduh untuk keperluan administratif.
                  </p>
                </div>
                <div className="bg-card/50 border border-border/50 rounded-xl p-6 backdrop-blur-sm">
                  <Building className="h-6 w-6 text-primary mb-4" />
                  <h4 className="font-semibold text-foreground mb-2">Akses Berbasis Peran</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Undangan organisasi dan pembatasan wewenang baca/tulis untuk membantu mengendalikan akses ke data operasional internal.
                  </p>
                </div>
                <div className="bg-card/50 border border-border/50 rounded-xl p-6 backdrop-blur-sm">
                  <GitMerge className="h-6 w-6 text-primary mb-4" />
                  <h4 className="font-semibold text-foreground mb-2">Perlindungan Konflik Draf</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Konteks peringatan saat rekan kerja memperbarui versi data kesiapan pada waktu yang sama.
                  </p>
                </div>
              </div>
           </div>
        </section>

        {/* 5. ACTION (Final CTA) */}
        <section className="w-full px-6 py-24 md:py-32 bg-card/20 relative z-10 flex flex-col items-center text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground">Siap Membangun Lingkungan Kerja yang Lebih Terstruktur?</h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Mulailah menyatukan manajemen dokumen persiapan proyek Anda dengan laporan operasional lapangan.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button size="lg" asChild className="w-full sm:w-auto h-12 px-8 text-base bg-primary text-primary-foreground hover:bg-primary/90">
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
