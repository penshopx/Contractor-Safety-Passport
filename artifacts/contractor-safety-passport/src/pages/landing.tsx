import { Link } from "wouter";
import { ShieldCheck, ArrowRight, Activity, Users, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background selection:bg-primary selection:text-primary-foreground">
      <header className="px-6 h-16 flex items-center border-b border-border/50 bg-card/30 backdrop-blur shrink-0 justify-between relative z-10">
        <div className="flex items-center gap-2 font-bold text-lg text-primary tracking-tight">
          <ShieldCheck className="h-6 w-6" />
          <span>Safety Passport</span>
        </div>
        <div className="flex items-center gap-4">
           <Button variant="ghost" asChild className="hidden sm:inline-flex text-muted-foreground hover:text-foreground">
             <Link href="/sign-in">Masuk</Link>
          </Button>
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium">
             <Link href="/sign-up">Mulai</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center relative overflow-hidden px-6 py-24">
        {/* Background effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />
        <div className="absolute top-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

        <div className="max-w-4xl mx-auto w-full flex flex-col items-center text-center relative z-10 space-y-8">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm text-primary ring-1 ring-inset ring-primary/20 mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse" />
             Kepatuhan Keselamatan Siap Lapangan
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground max-w-3xl animate-in fade-in slide-in-from-bottom-6 duration-700 delay-150 fill-mode-both">
             Keselamatan Operasional untuk <span className="text-primary">Kontraktor Indonesia</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300 fill-mode-both">
             Pastikan kesiapan lapangan dengan kepatuhan CSMS dan SMKK otomatis. Kelola personel, dokumen, dan aktivitas lapangan dalam satu ruang kerja terpadu.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500 fill-mode-both">
            <Button size="lg" asChild className="h-12 px-8 text-base bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/sign-up">
                 Mulai Ruang Kerja Anda
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-12 px-8 text-base border-border bg-card/50 hover:bg-accent hover:text-accent-foreground">
               <Link href="/sign-in">Masuk</Link>
            </Button>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid sm:grid-cols-3 gap-6 max-w-5xl mx-auto mt-24 relative z-10 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-700 fill-mode-both">
          <div className="bg-card/50 border border-border/50 rounded-xl p-6 backdrop-blur-sm">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 border border-primary/20">
              <FileText className="h-6 w-6 text-primary" />
            </div>
             <h3 className="text-lg font-semibold text-foreground mb-2">Dokumen Otomatis</h3>
             <p className="text-sm text-muted-foreground leading-relaxed">Buat dokumen CSMS dan SMKK yang sesuai secara instan menggunakan templat standar.</p>
          </div>
          <div className="bg-card/50 border border-border/50 rounded-xl p-6 backdrop-blur-sm">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 border border-primary/20">
              <Users className="h-6 w-6 text-primary" />
            </div>
             <h3 className="text-lg font-semibold text-foreground mb-2">Pelacakan Personel</h3>
             <p className="text-sm text-muted-foreground leading-relaxed">Pantau masa berlaku sertifikat, peran, dan kesiapan seluruh tim lapangan secara waktu nyata.</p>
          </div>
          <div className="bg-card/50 border border-border/50 rounded-xl p-6 backdrop-blur-sm">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 border border-primary/20">
              <Activity className="h-6 w-6 text-primary" />
            </div>
             <h3 className="text-lg font-semibold text-foreground mb-2">Aktivitas Lapangan</h3>
             <p className="text-sm text-muted-foreground leading-relaxed">Catat toolbox meeting, inspeksi, dan intervensi keselamatan langsung dari lokasi kerja.</p>
          </div>
        </div>
      </main>

      <footer className="py-6 text-center border-t border-border/50 bg-card/30 shrink-0">
         <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Contractor Safety Passport. Dibuat untuk keunggulan operasional.</p>
      </footer>
    </div>
  );
}