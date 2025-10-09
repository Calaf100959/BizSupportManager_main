import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import HomePage from "@/pages/home";
import SearchPage from "@/pages/search";
import OfficeFormPage from "@/pages/office-form";
import OfficeDetailPage from "@/pages/office-detail";
import PersonFormPage from "@/pages/person-form";
import ExportPage from "@/pages/export";
import KartePage from "@/pages/karte";
import WorklogPage from "@/pages/worklog";

function AuthenticatedApp() {
  const { isAuthenticated, isLoading } = useAuth();
  const style = {
    "--sidebar-width": "18rem",
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium">読み込み中...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b bg-background">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="text-sm text-muted-foreground">顧客管理システム</div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            <Switch>
              <Route path="/" component={HomePage} />
              <Route path="/search" component={SearchPage} />
              <Route path="/office/new" component={OfficeFormPage} />
              <Route path="/office/:officeId/detail" component={OfficeDetailPage} />
              <Route path="/office/:officeId/person/new" component={PersonFormPage} />
              <Route path="/office/:officeId/person/:personId" component={PersonFormPage} />
              <Route path="/office/:id" component={OfficeFormPage} />
              <Route path="/export" component={ExportPage} />
              <Route path="/karte" component={KartePage} />
              <Route path="/worklog" component={WorklogPage} />
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthenticatedApp />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
