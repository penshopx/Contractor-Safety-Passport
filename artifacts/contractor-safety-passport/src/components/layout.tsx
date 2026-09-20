import { Link, useLocation } from "wouter";
import { 
  ShieldCheck, 
  LayoutDashboard, 
  FolderKanban, 
  CheckSquare, 
  FileText, 
  Users, 
  Award, 
  ActivitySquare 
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/" },
    { icon: FolderKanban, label: "Proyek", href: "/projects" },
    { icon: CheckSquare, label: "Kesiapan (Readiness)", href: "/readiness" },
    { icon: FileText, label: "Dokumen K3", href: "/documents" },
    { icon: Users, label: "Personel K3", href: "/people" },
    { icon: Award, label: "Sertifikat", href: "/certificates" },
    { icon: ActivitySquare, label: "Aktivitas Lapangan", href: "/field-activities" },
  ];

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="border-b border-border/50 p-4">
          <div className="flex items-center gap-2 font-bold text-lg text-primary tracking-tight">
            <ShieldCheck className="h-6 w-6" />
            <span>Safety Passport</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => {
                  // highlight if active. exact match for root, prefix match for others.
                  const isActive = 
                    item.href === "/" 
                      ? location === "/" 
                      : location.startsWith(item.href);

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={isActive}
                        className={isActive ? "bg-accent/50 text-accent-foreground font-medium" : "text-muted-foreground hover:text-foreground"}
                      >
                        <Link href={item.href} className="flex items-center gap-3 w-full py-2">
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="p-4 border-t border-border/50 text-xs text-muted-foreground">
          v1.0 (Ops-Ready)
        </SidebarFooter>
      </Sidebar>
      
      <SidebarInset className="bg-background flex flex-col h-screen overflow-hidden">
        <header className="h-14 border-b border-border/50 flex items-center px-4 bg-card/30 backdrop-blur-sm shrink-0">
          <SidebarTrigger />
        </header>
        <main className="flex-1 overflow-auto p-6 md:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}