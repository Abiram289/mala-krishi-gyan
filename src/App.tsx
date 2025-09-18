import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import CropCalendar from "./pages/CropCalendar";
import GovernmentSchemes from "./pages/GovernmentSchemes";
import { ClerkProvider, SignedIn, SignedOut, SignIn, SignUp } from "@clerk/clerk-react";
import Profile from "./pages/Profile";
import MainLayout from "./layouts/MainLayout";
import AuthLayout from "./layouts/AuthLayout";
import Chat from "./pages/Chat";
import Activities from "./pages/Activities";
import Weather from "./pages/Weather";
import Community from "./pages/Community";
import Notifications from "./pages/Notifications";
import { LanguageProvider } from "@/components/LanguageToggle";

const queryClient = new QueryClient();

// Get the Clerk publishable key from the environment variables
const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error(
    "Missing Clerk publishable key. Please set VITE_CLERK_PUBLISHABLE_KEY in your .env file."
  );
}

const ClerkProviderWithRoutes = () => {
  const navigate = useNavigate();

  return (
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY}
      navigate={(to) => navigate(to)}
    >
      <Routes>
        <Route
          path="/"
          element={
            <SignedIn>
              <MainLayout />
            </SignedIn>
          }
        >
          <Route index element={<Index />} />
          <Route path="profile" element={<Profile />} />
          <Route path="chat" element={<Chat />} />
          <Route path="activities" element={<Activities />} />
          <Route path="weather" element={<Weather />} />
          <Route path="crop-calendar" element={<CropCalendar />} />
          <Route path="government-schemes" element={<GovernmentSchemes />} />
          <Route path="community" element={<Community />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>

        <Route
          element={<AuthLayout />}
        >
          <Route
            path="/sign-in/*"
            element={<SignIn routing="path" path="/sign-in" />}
          />
          <Route
            path="/sign-up/*"
            element={<SignUp routing="path" path="/sign-up" />}
          />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </ClerkProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ClerkProviderWithRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;