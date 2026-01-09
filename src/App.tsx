import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import AppHome from "./pages/app/AppHome";
import FridgePage from "./pages/app/FridgePage";
import PantryPage from "./pages/app/PantryPage";
import MealsPage from "./pages/app/MealsPage";
import MealPlanPage from "./pages/app/MealPlanPage";
import ChefPage from "./pages/app/ChefPage";
import SuggestionsPage from "./pages/app/SuggestionsPage";
import ProfilePage from "./pages/app/ProfilePage";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/auth" element={<Auth />} />
    <Route path="/app" element={<ProtectedRoute><AppHome /></ProtectedRoute>} />
    <Route path="/app/fridge" element={<ProtectedRoute><FridgePage /></ProtectedRoute>} />
    <Route path="/app/pantry" element={<ProtectedRoute><PantryPage /></ProtectedRoute>} />
    <Route path="/app/meals" element={<ProtectedRoute><MealsPage /></ProtectedRoute>} />
    <Route path="/app/plan" element={<ProtectedRoute><MealPlanPage /></ProtectedRoute>} />
    <Route path="/app/chef" element={<ProtectedRoute><ChefPage /></ProtectedRoute>} />
    <Route path="/app/suggestions" element={<ProtectedRoute><SuggestionsPage /></ProtectedRoute>} />
    <Route path="/app/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
