import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

import { AppLayout } from '@/components/layout';
import DashboardPage from '@/pages/dashboard';
import ProjectsPage from '@/pages/projects';
import ProjectDetailPage from '@/pages/projects-detail';
import ReadinessPage from '@/pages/readiness';
import DocumentsPage from '@/pages/documents';
import DocumentGeneratorPage from '@/pages/document-generator';
import PeoplePage from '@/pages/people';
import CertificatesPage from '@/pages/certificates';
import FieldActivitiesPage from '@/pages/field-activities';

const queryClient = new QueryClient();

function Router() {
  return (
    <AppLayout>
      <RoutedErrorBoundary>
        <Switch>
          <Route path="/" component={DashboardPage} />
          <Route path="/projects" component={ProjectsPage} />
          <Route path="/projects/:id" component={ProjectDetailPage} />
          <Route path="/readiness" component={ReadinessPage} />
          <Route path="/documents" component={DocumentsPage} />
          <Route path="/document-generator" component={DocumentGeneratorPage} />
          <Route path="/people" component={PeoplePage} />
          <Route path="/certificates" component={CertificatesPage} />
          <Route path="/field-activities" component={FieldActivitiesPage} />
          <Route component={NotFound} />
        </Switch>
      </RoutedErrorBoundary>
    </AppLayout>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;