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
import { apiClient } from "./lib/apiClient";
import ErrorBoundary, { APIErrorBoundary } from "./components/ErrorBoundary";
import { sessionManager } from "./lib/sessionManager";
import SessionDebugger from "./components/SessionDebugger";

// Debounce utility
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

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
  const [profileFetchInProgress, setProfileFetchInProgress] = useState(false);

  const fetchProfile = async () => {
    // Prevent multiple concurrent profile fetches
    if (profileFetchInProgress) {
      console.log('Profile fetch already in progress, skipping');
      return;
    }
    
    setProfileFetchInProgress(true);
    setProfileLoading(true);
    try {
      // Increase timeout to 10 seconds for better reliability
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 10000)
      );
      
      const profilePromise = apiClient.getProfile();
      
      const data = await Promise.race([profilePromise, timeoutPromise]) as any;

      setProfile(data);
      console.log('Profile loaded successfully');
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Authentication') || error.message.includes('auth')) {
          // Don't log auth errors as profile errors
          console.log('Skipping profile fetch due to auth issues');
          return;
        }
        console.warn("Profile fetch error (non-critical):", error.message);
      }
      setProfile(null); // Clear profile on error but don't crash
    } finally {
      setProfileLoading(false);
      setProfileFetchInProgress(false);
    }
  };

  // Function to check if session is about to expire and refresh if needed
  const checkAndRefreshSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session check error:', error);
        return;
      }
      
      if (session) {
        const now = Math.floor(Date.now() / 1000);
        const expiresAt = session.expires_at || 0;
        const timeUntilExpiry = expiresAt - now;
        
        // If token expires in less than 5 minutes, try to refresh
        if (timeUntilExpiry < 300) {
          console.log('Token expires soon, attempting refresh...');
          const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError) {
            console.error('Session refresh failed:', refreshError);
            // If refresh fails, user will be logged out by auth state change
            return;
          }
          
          if (refreshedSession) {
            console.log('Session refreshed successfully');
            setSession(refreshedSession);
            setUser(refreshedSession.user);
          }
        }
      }
    } catch (error) {
      console.error('Session check error:', error);
    }
  };

  useEffect(() => {
    const initializeSession = async () => {
      setLoading(true);
      try {
        // Try to get session quickly without timeout first
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Initial session fetch error:', error);
          setSession(null);
          setUser(null);
        } else {
          // Set session and user immediately to show UI faster
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            // Make profile fetching non-blocking
            fetchProfile().catch(err => console.error("Background profile fetch error:", err));
            
            // Set up session manager monitoring (replaces manual intervals)
            sessionManager.onSessionExpired(() => {
              console.log('Session expired, clearing local state');
              setSession(null);
              setUser(null);
              setProfile(null);
            });
            
            sessionManager.startSessionMonitoring();
            
            // Log initial session info for debugging
            if (process.env.NODE_ENV === 'development') {
              sessionManager.logSessionInfo();
            }
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error("AuthProvider: Error during session initialization:", error);
        setSession(null);
        setUser(null);
        setLoading(false);
      }
    };

    initializeSession();

    // Debounced auth state handler to prevent rapid changes
    const debouncedAuthHandler = debounce(async (event: string, session: any) => {
      console.log('Auth state changed (debounced):', event, session?.user?.id);
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Make profile fetching non-blocking with additional delay to avoid conflicts
        setTimeout(() => {
          fetchProfile().catch(err => console.error("Background profile fetch error:", err));
        }, 500);
        
        // Session monitoring is handled by sessionManager
      } else {
        setProfile(null); // Clear profile on logout
        
        // Clear session monitoring on logout
        sessionManager.stopSessionMonitoring();
      }
    }, 300); // 300ms debounce

    const { data: { subscription } } = supabase.auth.onAuthStateChange(debouncedAuthHandler);

    return () => {
      subscription.unsubscribe();
      
      // Clean up session monitoring on component unmount
      sessionManager.stopSessionMonitoring();
    };
  }, []); // Remove sessionCheckInterval dependency to prevent infinite re-renders

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
  const { session, loading, profileLoading } = useAuth();
  const [isStable, setIsStable] = React.useState(false);

  // Add stability delay to prevent flickering during auth state changes
  React.useEffect(() => {
    if (!loading) {
      const timeout = setTimeout(() => {
        setIsStable(true);
      }, 500); // Wait 500ms after loading ends to ensure stability
      
      return () => clearTimeout(timeout);
    } else {
      setIsStable(false);
    }
  }, [loading]);

  if (loading || !isStable) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <div>Loading authentication...</div>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

// --- Main App Component ---
const App = () => (
  <ErrorBoundary>
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
                  <Route index element={<APIErrorBoundary><Index /></APIErrorBoundary>} />
                  <Route path="profile" element={<APIErrorBoundary><Profile /></APIErrorBoundary>} />
                  <Route path="chat" element={<APIErrorBoundary><Chat /></APIErrorBoundary>} />
                  <Route path="activities" element={<APIErrorBoundary><Activities /></APIErrorBoundary>} />
                  <Route path="weather" element={<APIErrorBoundary><Weather /></APIErrorBoundary>} />
                  <Route path="crop-calendar" element={<APIErrorBoundary><CropCalendar /></APIErrorBoundary>} />
                  <Route path="government-schemes" element={<APIErrorBoundary><GovernmentSchemes /></APIErrorBoundary>} />
                  <Route path="community" element={<APIErrorBoundary><Community /></APIErrorBoundary>} />
                  <Route path="notifications" element={<APIErrorBoundary><Notifications /></APIErrorBoundary>} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
          <SessionDebugger />
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
