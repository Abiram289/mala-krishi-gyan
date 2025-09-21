import { useState, createContext, useContext, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

interface LanguageContextType {
  language: 'en' | 'ml';
  setLanguage: (lang: 'en' | 'ml') => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  en: {
    // Navigation
    home: "Home",
    chat: "AI Assistant",
    activities: "Activities", 
    weather: "Weather",
    calendar: "Crop Calendar",
    schemes: "Gov Schemes",
    
    // Home page
    welcome: "Welcome to Kerala Farming Assistant",
    subtitle: "Your AI-powered farming companion for better harvests",
    getStarted: "Get Started",
    howToUseTitle: "How to Use This Platform",
    instruction1: "Use the AI Assistant to get instant answers to your farming questions.",
    instruction2: "Track your farm activities and set reminders in the Activities section.",
    instruction3: "Check real-time weather updates and alerts relevant to your farm.",
    instruction4: "Plan your crops with the Crop Calendar, optimized for Kerala's climate.",
    instruction5: "Discover and apply for government schemes and subsidies for farmers.",
    
    // Common
    loading: "Loading...",
    comingSoon: "Coming soon...",
    
    // Chat
    chatTitle: "AI Farming Assistant",
    chatPlaceholder: "Ask me about farming, weather, crops...",
    send: "Send",
    
    // Activities
    activitiesTitle: "Farm Activities",
    addActivity: "Add Activity",
    todayTasks: "Today's Tasks",
    
    // Weather
    weatherTitle: "Weather & Alerts",
    temperature: "Temperature",
    humidity: "Humidity",
    rainfall: "Rainfall",
    wind: "Wind",
    todayWeather: "Today's Weather",
    partlyCloudy: "Partly Cloudy",
    alerts: "Alerts",
    
    // Calendar
    calendarTitle: "Crop Calendar",
    plantingSeason: "Planting Season",
    harvestSeason: "Harvest Season",
    
    
    // Weather alerts
    heavyRainAlert: "Heavy rain expected tomorrow",
    pestActivityAlert: "Pest activity high due to humidity",
    
    // Navigation & Common
    back: "Back",
    signOut: "Sign Out",
    profile: "Profile",
    community: "Community",
    notifications: "Notifications",
    
    // Profile page
    profileTitle: "Profile",
    welcomeProfile: "Welcome",
    viewUpdateDetails: "View and update your farm details below.",
    farmDetails: "Farm Details",
    personalInfo: "Personal Information",
    fullName: "Full Name",
    username: "Username",
    email: "Email",
    farmSize: "Farm Size (acres)",
    location: "Location",
    soilType: "Soil Type",
    saveProfile: "Save Profile",
    
    // Government Schemes
    schemesTitle: "Government Schemes",
    availableSchemes: "Available Schemes",
    schemeDetails: "Scheme Details",
    eligibility: "Eligibility",
    apply: "Apply",
    
    // Community
    communityTitle: "Community",
    discussionForum: "Discussion Forum",
    askQuestion: "Ask a Question",
    recentDiscussions: "Recent Discussions",
    
    // Notifications
    notificationsTitle: "Notifications",
    allNotifications: "All Notifications",
    markAsRead: "Mark as Read",
    
    // Error messages
    error: "Error",
    tryAgain: "Try Again",
    networkError: "Network Error",
    
    // Success messages
    success: "Success",
    saved: "Saved",
    updated: "Updated"
  },
  ml: {
    // Navigation - Malayalam
    home: "ഹോം",
    chat: "AI സഹായി", 
    activities: "പ്രവർത്തനങ്ങൾ",
    weather: "കാലാവസ്ഥ",
    calendar: "വിള കലണ്ടർ",
    schemes: "സർക്കാർ പദ്ധതികൾ",
    
    // Home page
    welcome: "കേരള കൃഷി സഹായിയിലേക്ക് സ്വാഗതം",
    subtitle: "മികച്ച വിളവിനായി നിങ്ങളുടെ AI കൃഷി സഹയാത്രി",
    getStarted: "ആരംഭിക്കുക",
    howToUseTitle: "ഈ പ്ലാറ്റ്ഫോം എങ്ങനെ ഉപയോഗിക്കാം",
    instruction1: "നിങ്ങളുടെ കാർഷിക ചോദ്യങ്ങൾക്ക് തൽക്ഷണ ഉത്തരങ്ങൾ ലഭിക്കാൻ AI അസിസ്റ്റന്റ് ഉപയോഗിക്കുക.",
    instruction2: "പ്രവർത്തനങ്ങൾ വിഭാഗത്തിൽ നിങ്ങളുടെ കാർഷിക പ്രവർത്തനങ്ങൾ ട്രാക്ക് ചെയ്യുകയും ഓർമ്മപ്പെടുത്തലുകൾ സജ്ജീകരിക്കുകയും ചെയ്യുക.",
    instruction3: "നിങ്ങളുടെ കൃഷിയിടത്തിന് പ്രസക്തമായ തത്സമയ കാലാവസ്ഥാ അപ്‌ഡേറ്റുകളും മുന്നറിയിപ്പുകളും പരിശോധിക്കുക.",
    instruction4: "കേരളത്തിലെ കാലാവസ്ഥയ്ക്ക് അനുയോജ്യമായ വിള കലണ്ടർ ഉപയോഗിച്ച് നിങ്ങളുടെ വിളകൾ ആസൂത്രണം ചെയ്യുക.",
    instruction5: "കർഷകർക്കുള്ള സർക്കാർ പദ്ധതികളും സബ്സിഡികളും കണ്ടെത്തുകയും അപേക്ഷിക്കുകയും ചെയ്യുക.",
    
    // Common
    loading: "ലോഡിംഗ്...",
    comingSoon: "ഉടൻ വരുന്നു...",
    
    // Chat
    chatTitle: "AI കൃഷി സഹായി",
    chatPlaceholder: "കൃഷി, കാലാവസ്ഥ, വിളകൾ എന്നിവയെക്കുറിച്ച് ചോദിക്കുക...",
    send: "അയയ്ക്കുക",
    
    // Activities
    activitiesTitle: "കാർഷിക പ്രവർത്തനങ്ങൾ",
    addActivity: "പ്രവർത്തനം ചേർക്കുക",
    todayTasks: "ഇന്നത്തെ ജോലികൾ",
    
    // Weather
    weatherTitle: "കാലാവസ്ഥയും മുന്നറിയിപ്പുകളും",
    temperature: "താപനില",
    humidity: "ആർദ്രത",
    rainfall: "മഴ",
    wind: "കാറ്റ്",
    todayWeather: "ഇന്നത്തെ കാലാവസ്ഥ",
    partlyCloudy: "ഭാഗികമായി മേഘാവൃതം",
    alerts: "മുന്നറിയിപ്പുകൾ",
    
    // Calendar
    calendarTitle: "വിള കലണ്ടർ",
    plantingSeason: "വിതയൽ കാലം",
    harvestSeason: "വിളവെടുപ്പ് കാലം",
    
    // Weather alerts
    heavyRainAlert: "നാളെ കനത്ത മഴ പ്രതീക്ഷിക്കുന്നു",
    pestActivityAlert: "ആർദ്രത കാരണം കീട പ്രവർത്തനം കൂടുതൽ",
    
    // Navigation & Common
    back: "തിരികെ",
    signOut: "സൈൻ ഔട്ട്",
    profile: "പ്രൊഫൈൽ",
    community: "കമ്മ്യൂണിറ്റി",
    notifications: "അറിയിപ്പുകൾ",
    
    // Profile page
    profileTitle: "പ്രൊഫൈൽ",
    welcomeProfile: "സ്വാഗതം",
    viewUpdateDetails: "നിങ്ങളുടെ കൃഷിയിടത്തിന്റെ വിശദാംശങ്ങൾ കാണുകയും അപ്‌ഡേറ്റ് ചെയ്യുകയും ചെയ്യുക.",
    farmDetails: "കൃഷിയിടത്തിന്റെ വിശദാംശങ്ങൾ",
    personalInfo: "വ്യക്തിഗത വിവരങ്ങൾ",
    fullName: "പൂർണ്ണ നാമം",
    username: "ഉപയോക്തൃനാമം",
    email: "ഇമെയിൽ",
    farmSize: "കൃഷിയിടത്തിന്റെ വലുപ്പം (ഏക്കർ)",
    location: "സ്ഥലം",
    soilType: "മണ്ണിന്റെ തരം",
    saveProfile: "പ്രൊഫൈൽ സേവ് ചെയ്യുക",
    
    // Government Schemes
    schemesTitle: "സർക്കാർ പദ്ധതികൾ",
    availableSchemes: "ലഭ്യമായ പദ്ധതികൾ",
    schemeDetails: "പദ്ധതിയുടെ വിശദാംശങ്ങൾ",
    eligibility: "യോഗ്യത",
    apply: "അപേക്ഷിക്കുക",
    
    // Community
    communityTitle: "കമ്മ്യൂണിറ്റി",
    discussionForum: "ചർച്ചാ വേദി",
    askQuestion: "ഒരു ചോദ്യം ചോദിക്കുക",
    recentDiscussions: "സമീപകാല ചർച്ചകൾ",
    
    // Notifications
    notificationsTitle: "അറിയിപ്പുകൾ",
    allNotifications: "എല്ലാ അറിയിപ്പുകളും",
    markAsRead: "വായിച്ചതായി അടയാളപ്പെടുത്തുക",
    
    // Error messages
    error: "പിശക്",
    tryAgain: "വീണ്ടും ശ്രമിക്കുക",
    networkError: "നെറ്റ്‌വർക്ക് പിശക്",
    
    // Success messages
    success: "വിജയം",
    saved: "സേവ് ചെയ്തു",
    updated: "അപ്‌ഡേറ്റ് ചെയ്തു"
  }
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<'en' | 'ml'>(() => {
    // Get language from localStorage or default to 'en'
    return (localStorage.getItem('kerala-krishi-lang') as 'en' | 'ml') || 'en';
  });
  
  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  const handleLanguageChange = (newLang: 'en' | 'ml') => {
    setLanguage(newLang);
    localStorage.setItem('kerala-krishi-lang', newLang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleLanguageChange, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageToggle = () => {
  const { language, setLanguage } = useLanguage();
  
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setLanguage(language === 'en' ? 'ml' : 'en')}
      className="flex items-center gap-2 bg-primary-light/10 border-primary-light text-primary hover:bg-primary-light hover:text-primary-foreground min-w-[100px] justify-center"
    >
      <Globe className="h-4 w-4 flex-shrink-0" />
      <span className="truncate">{language === 'en' ? 'മലയാളം' : 'English'}</span>
    </Button>
  );
};