import { useState } from "react";
import { MessageCircle, Activity, CloudSun, Calendar, Building, Sprout } from "lucide-react";
import { LanguageProvider, LanguageToggle, useLanguage } from "@/components/LanguageToggle";
import { NavigationCard } from "@/components/NavigationCard";
import { ChatInterface } from "@/components/ChatInterface";
import { ActivityLog } from "@/components/ActivityLog";
import { WeatherCard } from "@/components/WeatherCard";
import heroImage from "@/assets/kerala-farm-hero.jpg";

type ViewType = 'home' | 'chat' | 'activities' | 'weather' | 'calendar' | 'schemes';

const AppContent = () => {
  const { t } = useLanguage();
  const [currentView, setCurrentView] = useState<ViewType>('home');

  const navigationItems = [
    { 
      icon: MessageCircle, 
      key: 'chat' as ViewType, 
      title: t('chat'),
      gradient: true
    },
    { 
      icon: Activity, 
      key: 'activities' as ViewType, 
      title: t('activities')
    },
    { 
      icon: CloudSun, 
      key: 'weather' as ViewType, 
      title: t('weather')
    },
    { 
      icon: Calendar, 
      key: 'calendar' as ViewType, 
      title: t('calendar')
    },
    { 
      icon: Building, 
      key: 'schemes' as ViewType, 
      title: t('schemes')
    },
  ];

  const renderContent = () => {
    switch (currentView) {
      case 'chat':
        return <ChatInterface />;
      case 'activities':
        return <ActivityLog />;
      case 'weather':
        return <WeatherCard />;
      case 'calendar':
        return (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">{t('calendarTitle')}</h3>
            <p className="text-muted-foreground">Crop calendar feature coming soon...</p>
          </div>
        );
      case 'schemes':
        return (
          <div className="text-center py-12">
            <Building className="h-16 w-16 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">{t('schemes')}</h3>
            <p className="text-muted-foreground">Government schemes information coming soon...</p>
          </div>
        );
      default:
        return (
          <div className="space-y-8">
            {/* Hero Section */}
            <div className="relative rounded-2xl overflow-hidden">
              <img 
                src={heroImage} 
                alt="Kerala farming landscape"
                className="w-full h-48 sm:h-64 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-primary/20 flex items-end">
                <div className="p-6 text-primary-foreground">
                  <h1 className="text-2xl sm:text-3xl font-bold mb-2">{t('welcome')}</h1>
                  <p className="text-sm sm:text-base opacity-90">{t('subtitle')}</p>
                </div>
              </div>
            </div>

            {/* Navigation Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {navigationItems.map((item) => (
                <NavigationCard
                  key={item.key}
                  icon={item.icon}
                  title={item.title}
                  onClick={() => setCurrentView(item.key)}
                  gradient={item.gradient}
                />
              ))}
            </div>

            {/* Quick Weather Summary */}
            <div className="bg-kerala-coconut rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CloudSun className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-semibold">Today's Weather</p>
                    <p className="text-sm text-muted-foreground">28°C, Partly Cloudy</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Humidity</p>
                  <p className="font-semibold">75%</p>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {currentView !== 'home' && (
              <button 
                onClick={() => setCurrentView('home')}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <Sprout className="h-5 w-5 text-primary" />
              </button>
            )}
            <h1 className="font-bold text-lg text-primary">Kerala Krishi</h1>
          </div>
          <LanguageToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-6">
        {renderContent()}
      </main>
    </div>
  );
};

const Index = () => {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
};

export default Index;
