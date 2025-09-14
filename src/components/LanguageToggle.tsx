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
    harvestSeason: "Harvest Season"
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
    harvestSeason: "വിളവെടുപ്പ് കാലം"
  }
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<'en' | 'ml'>('en');
  
  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
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
      className="flex items-center gap-2 bg-primary-light/10 border-primary-light text-primary hover:bg-primary-light hover:text-primary-foreground"
    >
      <Globe className="h-4 w-4" />
      {language === 'en' ? 'മലയാളം' : 'English'}
    </Button>
  );
};