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
            <Link href="/sign-in">Log in</Link>
          </Button>
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium">
            <Link href="/sign-up">Get Started</Link>
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
            Field-Ready Safety Compliance
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground max-w-3xl animate-in fade-in slide-in-from-bottom-6 duration-700 delay-150 fill-mode-both">
            Operational Safety for <span className="text-primary">Indonesian Contractors</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300 fill-mode-both">
            Ensure field readiness with automated CSMS & SMKK compliance. Track personnel, manage documents, and monitor field activities in one unified workspace.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500 fill-mode-both">
            <Button size="lg" asChild className="h-12 px-8 text-base bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/sign-up">
                Start Your Workspace
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-12 px-8 text-base border-border bg-card/50 hover:bg-accent hover:text-accent-foreground">
              <Link href="/sign-in">Log In</Link>
            </Button>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid sm:grid-cols-3 gap-6 max-w-5xl mx-auto mt-24 relative z-10 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-700 fill-mode-both">
          <div className="bg-card/50 border border-border/50 rounded-xl p-6 backdrop-blur-sm">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 border border-primary/20">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Automated Documents</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">Generate compliant CSMS and SMKK documentation instantly using standard templates.</p>
          </div>
          <div className="bg-card/50 border border-border/50 rounded-xl p-6 backdrop-blur-sm">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 border border-primary/20">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Personnel Tracking</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">Monitor certificate expirations, roles, and readiness of all your field teams in real-time.</p>
          </div>
          <div className="bg-card/50 border border-border/50 rounded-xl p-6 backdrop-blur-sm">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 border border-primary/20">
              <Activity className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Field Activities</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">Log toolbox meetings, inspections, and safety interventions straight from the worksite.</p>
          </div>
        </div>
      </main>

      <footer className="py-6 text-center border-t border-border/50 bg-card/30 shrink-0">
        <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Contractor Safety Passport. Built for operational excellence.</p>
      </footer>
    </div>
  );
}