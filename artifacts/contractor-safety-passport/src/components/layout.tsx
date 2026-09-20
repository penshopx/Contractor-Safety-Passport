import { Link, useLocation } from "wouter";
import { 
  ShieldCheck, 
  LayoutDashboard, 
  FolderKanban, 
  CheckSquare, 
  FileText, 
  Users, 
  Award, 
  ActivitySquare,
  FileCog,
  LogOut,
  Building2,
  User,
  ShieldAlert,
  HardHat,
  Eye,
  FileSpreadsheet
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
import { useClerk, useUser } from "@clerk/react";
import { useGetOrganizationContext } from "@workspace/api-client-react";
import { Button } from "./ui/button";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const ROLE_LABELS: Record<string, { label: string, icon: any }> = {
  owner: { label: "Workspace Owner", icon: ShieldCheck },
  safety_expert: { label: "Safety Expert", icon: ShieldAlert },
  field_officer: { label: "Field Officer", icon: HardHat },
  viewer: { label: "Viewer", icon: Eye },
};

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { signOut } = useClerk();
  const { user } = useUser();
  const { data: orgContext } = useGetOrganizationContext();

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: FolderKanban, label: "Projects", href: "/projects" },
    { icon: CheckSquare, label: "Readiness", href: "/readiness" },
    { icon: FileText, label: "Safety Docs", href: "/documents" },
    { icon: FileCog, label: "Doc Generator", href: "/document-generator" },
    { icon: FileSpreadsheet, label: "SMKK Reports", href: "/smkk-reports" },
    { icon: Users, label: "Personnel", href: "/people" },
    { icon: Award, label: "Certificates", href: "/certificates" },
    { icon: ActivitySquare, label: "Field Activity", href: "/field-activities" },
  ];

  const roleInfo = orgContext?.role ? ROLE_LABELS[orgContext.role] : { label: "Member", icon: User };
  const RoleIcon = roleInfo.icon;

  return (
    <SidebarProvider>
      <Sidebar className="border-r border-border/50">
        <SidebarHeader className="border-b border-border/50 p-4 bg-sidebar">
          <div className="flex items-center gap-2 font-bold text-lg text-primary tracking-tight mb-4">
            <ShieldCheck className="h-6 w-6" />
            <span>Safety Passport</span>
          </div>
          
          {orgContext && (
            <div className="px-2 py-3 bg-card/50 rounded-lg border border-border/50">
              <div className="flex items-center gap-2 text-foreground font-medium text-sm mb-1">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{orgContext.organizationName}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                <RoleIcon className="h-3 w-3" />
                <span>{roleInfo.label}</span>
              </div>
            </div>
          )}
        </SidebarHeader>
        
        <SidebarContent className="bg-sidebar">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => {
                  const isActive = 
                    item.href === "/dashboard" 
                      ? location === "/dashboard" 
                      : location.startsWith(item.href);

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={isActive}
                        className={isActive ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"}
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

        <SidebarFooter className="p-4 border-t border-border/50 bg-sidebar flex flex-col gap-4">
          {user && (
            <div className="flex items-center gap-3 px-2">
              <div className="h-8 w-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-primary uppercase">
                  {user.primaryEmailAddress?.emailAddress?.charAt(0) || "U"}
                </span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-foreground truncate">
                  {user.fullName || user.primaryEmailAddress?.emailAddress?.split('@')[0]}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {user.primaryEmailAddress?.emailAddress}
                </span>
              </div>
            </div>
          )}
          <Button 
            variant="outline" 
            className="w-full justify-start text-muted-foreground hover:text-foreground border-border/50" 
            onClick={() => signOut({ redirectUrl: basePath || "/" })}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </SidebarFooter>
      </Sidebar>
      
      <SidebarInset className="bg-background flex flex-col h-[100dvh] overflow-hidden">
        <header className="h-14 border-b border-border/50 flex items-center px-4 bg-card/30 backdrop-blur-md shrink-0 sticky top-0 z-10">
          <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
          <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
            {orgContext && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-accent/50 border border-border/50">
                <Building2 className="h-3.5 w-3.5" />
                {orgContext.organizationName}
              </span>
            )}
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}