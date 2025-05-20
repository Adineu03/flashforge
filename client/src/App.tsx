import { Route, Switch } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "./components/Layout";

import DecksPage from "@/pages/DecksPage";
import CreatePage from "@/pages/CreatePage";
import ReviewPage from "@/pages/ReviewPage";
import StatsPage from "@/pages/StatsPage";
import NotFound from "@/pages/not-found";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Layout>
          <Switch>
            <Route path="/" component={DecksPage} />
            <Route path="/create" component={CreatePage} />
            <Route path="/review/:deckId" component={ReviewPage} />
            <Route path="/review" component={ReviewPage} />
            <Route path="/stats" component={StatsPage} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
