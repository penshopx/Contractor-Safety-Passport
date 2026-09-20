import { useEffect, useRef, type ReactNode } from 'react';
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from 'wouter';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { useGetOrganizationContext } from '@workspace/api-client-react';

import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { AppLayout } from '@/components/layout';

import LandingPage from '@/pages/landing';
import SignInPage from '@/pages/sign-in';
import SignUpPage from '@/pages/sign-up';
import OnboardingPage from '@/pages/onboarding';

import DashboardPage from '@/pages/dashboard';
import ProjectsPage from '@/pages/projects';
import ProjectDetailPage from '@/pages/projects-detail';
import ReadinessPage from '@/pages/readiness';
import DocumentsPage from '@/pages/documents';
import DocumentGeneratorPage from '@/pages/document-generator';
import PeoplePage from '@/pages/people';
import CertificatesPage from '@/pages/certificates';
import FieldActivitiesPage from '@/pages/field-activities';
import SmkkReportsPage from '@/pages/smkk-reports';
import SafetyBoqPage from '@/pages/safety-boq';
import { Loader2 } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(200 100% 50%)",
    colorForeground: "hsl(0 0% 98%)",
    colorMutedForeground: "hsl(220 10% 65%)",
    colorDanger: "hsl(0 84% 60%)",
    colorBackground: "hsl(220 20% 6%)",
    colorInput: "hsl(220 20% 15%)",
    colorInputForeground: "hsl(0 0% 98%)",
    colorNeutral: "hsl(220 20% 12%)",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-card rounded-2xl w-[440px] max-w-full overflow-hidden border border-border/50 shadow-xl",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none border-t border-border/50",
    headerTitle: "text-foreground font-bold tracking-tight",
    headerSubtitle: "text-muted-foreground",
    socialButtonsBlockButtonText: "text-foreground font-medium",
    formFieldLabel: "text-foreground/90 font-medium",
    footerActionLink: "text-primary hover:text-primary/90 font-medium",
    footerActionText: "text-muted-foreground",
    dividerText: "text-muted-foreground",
    identityPreviewEditButton: "text-primary hover:text-primary/90",
    formFieldSuccessText: "text-green-500",
    alertText: "text-destructive-foreground",
    logoBox: "mb-2",
    logoImage: "w-10 h-10",
    socialButtonsBlockButton: "border border-border/50 bg-background hover:bg-accent hover:text-accent-foreground",
    formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90 font-medium",
    formFieldInput: "bg-input/50 border-input-border text-foreground focus-visible:ring-primary h-11",
    footerAction: "bg-card",
    dividerLine: "bg-border/50",
    alert: "bg-destructive/10 border border-destructive/20",
    otpCodeFieldInput: "bg-input/50 border-input-border text-foreground focus-visible:ring-primary",
    formFieldRow: "mb-4",
    main: "p-8",
  },
};

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function WorkspaceGate({ children }: { children: ReactNode }) {
  const { data: orgContext, isLoading, isError, error } = useGetOrganizationContext();

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground animate-pulse">Loading workspace...</p>
      </div>
    );
  }

  if (isError) {
    // If it's a 404 (not found), they need to onboard
    if (error?.status === 404) {
      return <Redirect to="/onboarding" />;
    }
    // For other errors, let ErrorBoundary catch or show generic error
    throw error;
  }

  if (!orgContext) {
    return <Redirect to="/onboarding" />;
  }

  // They have a workspace context, allow them in
  return <AppLayout>{children}</AppLayout>;
}

function AuthenticatedApp() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/onboarding" component={OnboardingPage} />
        
        {/* All business routes go through WorkspaceGate to ensure they have an organization */}
        <Route path="/dashboard" component={() => <WorkspaceGate><DashboardPage /></WorkspaceGate>} />
        <Route path="/projects" component={() => <WorkspaceGate><ProjectsPage /></WorkspaceGate>} />
        <Route path="/projects/:id" component={() => <WorkspaceGate><ProjectDetailPage /></WorkspaceGate>} />
        <Route path="/readiness" component={() => <WorkspaceGate><ReadinessPage /></WorkspaceGate>} />
        <Route path="/documents" component={() => <WorkspaceGate><DocumentsPage /></WorkspaceGate>} />
        <Route path="/document-generator" component={() => <WorkspaceGate><DocumentGeneratorPage /></WorkspaceGate>} />
        <Route path="/people" component={() => <WorkspaceGate><PeoplePage /></WorkspaceGate>} />
        <Route path="/certificates" component={() => <WorkspaceGate><CertificatesPage /></WorkspaceGate>} />
        <Route path="/field-activities" component={() => <WorkspaceGate><FieldActivitiesPage /></WorkspaceGate>} />
        <Route path="/smkk-reports" component={() => <WorkspaceGate><SmkkReportsPage /></WorkspaceGate>} />
        <Route path="/safety-boq" component={() => <WorkspaceGate><SafetyBoqPage /></WorkspaceGate>} />
        
        <Route component={() => <WorkspaceGate><NotFound /></WorkspaceGate>} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <LandingPage />
      </Show>
    </>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomeRedirect} />
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      
      {/* Protected routes */}
      <Route path="/:rest*">
        <Show when="signed-in">
          <AuthenticatedApp />
        </Show>
        <Show when="signed-out">
          <Redirect to="/sign-in" />
        </Show>
      </Route>
    </Switch>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Welcome back",
            subtitle: "Sign in to access your compliance workspace",
          },
        },
        signUp: {
          start: {
            title: "Create your account",
            subtitle: "Get started with Contractor Safety Passport",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ClerkQueryClientCacheInvalidator />
          <Router />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;