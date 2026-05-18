// src/App.tsx — v3.8.5: unified /profilo, redirects per onboarding/brand/skill profilo
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import SkillPage from "./pages/SkillPage";
import History from "./pages/History";
import Watchlist from "./pages/Watchlist";
import Settings from "./pages/Settings";
import Icps from "./pages/Icps";
import Searches from "./pages/Searches";
import Profilo from "./pages/Profilo";
import Content from "./pages/Content";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/onboarding" element={<Navigate to="/profilo" replace />} />
            <Route path="/profilo" element={
              <ProtectedRoute>
                <Profilo />
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/skill/:skillId" element={
              <ProtectedRoute>
                <SkillPage />
              </ProtectedRoute>
            } />
            <Route path="/history" element={
              <ProtectedRoute>
                <History />
              </ProtectedRoute>
            } />
            <Route path="/watchlist" element={
              <ProtectedRoute>
                <Watchlist />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="/icps" element={
              <ProtectedRoute>
                <Icps />
              </ProtectedRoute>
            } />
            <Route path="/searches" element={
              <ProtectedRoute>
                <Searches />
              </ProtectedRoute>
            } />
            <Route path="/brand" element={
              <ProtectedRoute>
                <Brand />
              </ProtectedRoute>
            } />
            <Route path="/content" element={
              <ProtectedRoute>
                <Content />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
