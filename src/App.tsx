import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import Home from "./pages/Home";
import JournalSession from "./pages/JournalSession";
import History from "./pages/History";
import HabitLog from "./pages/HabitLog";
import HabitsCheckin from "./pages/HabitsCheckin";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner position="top-center" />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<AppShell><Home /></AppShell>} />
            <Route path="/journal/:type" element={<AppShell hideNav><JournalSession /></AppShell>} />
            <Route path="/habit-log" element={<AppShell><HabitLog /></AppShell>} />
            <Route path="/habits" element={<AppShell hideNav><HabitsCheckin /></AppShell>} />
            <Route path="/history" element={<AppShell><History /></AppShell>} />
            <Route path="/profile" element={<AppShell><Profile /></AppShell>} />
            <Route path="/auth" element={<Navigate to="/" replace />} />
            <Route path="/onboarding" element={<Navigate to="/" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
