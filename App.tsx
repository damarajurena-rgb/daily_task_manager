import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { TimerProvider } from "@/context/timer-context";

import { TodayPage } from "@/pages/today";
import { PlannerPage } from "@/pages/planner";
import { AllTasksPage } from "@/pages/all-tasks";
import { TimerPage } from "@/pages/timer";
import { ResourcesPage } from "@/pages/resources";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={TodayPage} />
      <Route path="/planner" component={PlannerPage} />
      <Route path="/all" component={AllTasksPage} />
      <Route path="/timer" component={TimerPage} />
      <Route path="/resources" component={ResourcesPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <TimerProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TimerProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
