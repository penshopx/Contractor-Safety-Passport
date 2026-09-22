import { Link } from "wouter";
import { ArrowRight, Activity, Users, FileText, Building, ShieldCheck, CheckCircle } from "lucide-react";
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
              Kesiapan Operasional Proyek
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground max-w-4xl leading-[1.1]">
              Kelola Kesiapan Keselamatan <br className="hidden md:block"/> Tanpa <span className="text-primary">Kehilangan Konteks</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
              Satukan pengelolaan persyaratan CSMS, SMKK, pemantauan personel, dan dokumentasi lapangan. Bantu tim konstruksi Anda bekerja dengan panduan yang jelas.
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

        {/* 2. INTEREST (The Problem & Approach) */}
        <section className="w-full px-6 py-24 bg-card/10 border-b border-border/20 relative z-10">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-16">
            <div className="flex-1 space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">Koordinasi Terhambat oleh Data yang Tersebar</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Menyocokkan dokumen persyaratan, memeriksa masa berlaku sertifikat personel, dan mengumpulkan bukti kegiatan lapangan dari berbagai saluran sering kali menyulitkan pengawasan.
                </p>
                <p>
                  Tanpa acuan yang terintegrasi, tim kesulitan memastikan apakah personel yang ditugaskan memenuhi kualifikasi atau apakah kewajiban administratif proyek telah dilengkapi dengan benar.
                </p>
                <p>
                  Contractor Safety Passport merancang ruang kerja yang menyatukan alur informasi ini agar tim kantor dan pengawas lapangan berada pada halaman yang sama.
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
                    <div className="text-xs text-muted-foreground mt-1">Akses persyaratan dari satu titik.</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border/50">
                  <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-foreground text-sm">Visibilitas Kesiapan</div>
                    <div className="text-xs text-muted-foreground mt-1">Pemantauan sertifikat terpusat.</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border/50">
                  <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-foreground text-sm">Rekam Jejak Tersusun</div>
                    <div className="text-xs text-muted-foreground mt-1">Riwayat aktivitas yang dapat ditelusuri.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. DESIRE (Concrete Capabilities) */}
        <section className="w-full px-6 py-24 relative z-10">
          <div className="max-w-5xl mx-auto space-y-16">
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">Fasilitas Terpusat untuk Kesiapan Operasional</h2>
              <p className="text-muted-foreground text-lg">
                Dukung alur kerja harian dengan pengelolaan rekaman yang terstruktur dan mudah diakses.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Card 1 */}
              <div className="bg-card/40 border border-border/50 rounded-xl p-8 hover:bg-card/60 transition-colors">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 border border-primary/20">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                 <h3 className="text-xl font-semibold text-foreground mb-3">Status Kesiapan Personel</h3>
                 <p className="text-muted-foreground leading-relaxed">
                   Lacak masa berlaku sertifikat, kompetensi, dan kelengkapan peran setiap anggota tim sebelum mereka ditugaskan ke proyek operasional.
                 </p>
              </div>

              {/* Card 2 */}
              <div className="bg-card/40 border border-border/50 rounded-xl p-8 hover:bg-card/60 transition-colors">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 border border-primary/20">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                 <h3 className="text-xl font-semibold text-foreground mb-3">Pengelolaan Dokumen Terstruktur</h3>
                 <p className="text-muted-foreground leading-relaxed">
                   Simpan dan susun berkas kelengkapan CSMS serta dokumen SMKK dalam satu repositori yang mudah diakses untuk kebutuhan peninjauan.
                 </p>
              </div>

              {/* Card 3 */}
              <div className="bg-card/40 border border-border/50 rounded-xl p-8 hover:bg-card/60 transition-colors">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 border border-primary/20">
                  <Activity className="h-6 w-6 text-primary" />
                </div>
                 <h3 className="text-xl font-semibold text-foreground mb-3">Bukti Lapangan Tertelusur</h3>
                 <p className="text-muted-foreground leading-relaxed">
                   Dokumentasikan temuan inspeksi rutin, kehadiran toolbox meeting, dan catatan observasi keselamatan sebagai bukti pelaksanaan kegiatan.
                 </p>
              </div>

              {/* Card 4 */}
              <div className="bg-card/40 border border-border/50 rounded-xl p-8 hover:bg-card/60 transition-colors">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 border border-primary/20">
                  <Building className="h-6 w-6 text-primary" />
                </div>
                 <h3 className="text-xl font-semibold text-foreground mb-3">Koordinasi Kantor & Lapangan</h3>
                 <p className="text-muted-foreground leading-relaxed">
                   Hubungkan pelaporan aktivitas harian dari lokasi kerja dengan pemantauan dokumen di tingkat operasional.
                 </p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. ACTION (Final CTA) */}
        <section className="w-full px-6 py-24 md:py-32 bg-card/20 border-t border-border/20 relative z-10 flex flex-col items-center text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground">Siap Membangun Lingkungan Kerja yang Lebih Terstruktur?</h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Tingkatkan koordinasi dokumen operasional dan catatan keselamatan tim Anda mulai hari ini.
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
         <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Contractor Safety Passport. Dibuat untuk mendukung dokumentasi operasional.</p>
      </footer>
    </div>
  );
}
