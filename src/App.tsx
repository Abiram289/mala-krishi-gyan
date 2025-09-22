import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import CropCalendar from "./pages/CropCalendar";
import GovernmentSchemes from "./pages/GovernmentSchemes";
import Profile from "./pages/Profile";
import MainLayout from "./layouts/MainLayout";
import Chat from "./pages/Chat";
import Activities from "./pages/Activities";
import Weather from "./pages/Weather";
import Community from "./pages/Community";
import Notifications from "./pages/Notifications";
import { LanguageProvider } from "@/components/LanguageToggle";
import { supabase } from "./lib/supabase";
import React, { useState, useEffect, useContext, createContext } from "react";
import AuthForm from "./components/auth/AuthForm";
import { fetchWithAuth } from "./lib/apiClient";

const queryClient = new QueryClient();

// --- Types ---
interface Profile {
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  farm_size: number | null;
  location: string | null;
  soil_type: string | null;
}

interface AuthContextType {
  session: any;
  user: any;
  profile: Profile | null;
  loading: boolean;
  profileLoading: boolean;
  refetchProfile: () => void;
}

// --- Auth Context ---
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- Auth Provider ---
const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);

  const fetchProfile = async () => {
    console.log("fetchProfile: Starting...");
    setProfileLoading(true);
    try {
      // Add timeout for profile fetching (reduced to 3 seconds)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 3000)
      );
      
      const profilePromise = fetchWithAuth('/profile');
      
      const response = await Promise.race([profilePromise, timeoutPromise]) as any;
      
      if (!response.ok) {
        if (response.status === 404) {
          setProfile(null); // User exists but has no profile yet
          console.log("fetchProfile: Profile not found (404).");
        } else {
          throw new Error('Failed to fetch profile');
        }
      } else {
        const data = await response.json();
        setProfile(data);
        console.log("fetchProfile: Profile fetched successfully.", data);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setProfile(null); // Clear profile on error
    } finally {
      setProfileLoading(false);
      console.log("fetchProfile: Finished.");
    }
  };

  useEffect(() => {
    console.log("AuthProvider: useEffect running.");
    const initializeSession = async () => {
      console.log("AuthProvider: initializeSession starting.");
      setLoading(true);
      try {
        // Try to get session quickly without timeout first
        const { data: { session } } = await supabase.auth.getSession();
        
        // Set session and user immediately to show UI faster
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false); // Set loading to false immediately after getting session
        
        console.log("AuthProvider: Session obtained.", session);
        if (session?.user) {
          console.log("AuthProvider: User found, starting profile fetch.");
          // Make profile fetching non-blocking
          fetchProfile().catch(err => console.error("Background profile fetch error:", err));
        }
      } catch (error) {
        console.error("AuthProvider: Error during session initialization:", error);
        setSession(null);
        setUser(null);
        setLoading(false);
      }
    };

    initializeSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log("AuthProvider: onAuthStateChange triggered.", _event, session);
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        console.log("AuthProvider: onAuthStateChange - User found, fetching profile.");
        // Make profile fetching non-blocking
        fetchProfile().catch(err => console.error("Background profile fetch error:", err));
      } else {
        setProfile(null); // Clear profile on logout
        console.log("AuthProvider: onAuthStateChange - No user, clearing profile.");
      }
    });

    return () => {
      subscription.unsubscribe();
      console.log("AuthProvider: useEffect cleanup.");
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, profileLoading, refetchProfile: fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

// --- Hooks and Components ---
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen"><div>Loading authentication...</div></div>;
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

// --- Main App Component ---
const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider>
            <Routes>
              <Route path="/auth" element={<AuthForm />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
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
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
