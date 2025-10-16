import { useState, useEffect } from "react";
import { MessageCircle, Activity, CloudSun, Calendar, Building, Users } from "lucide-react";
import { useLanguage } from "@/components/LanguageToggle";
import { NavigationCard } from "@/components/NavigationCard";
import heroImage from "@/assets/kerala-farm-hero.jpg";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/App";
import { apiClient } from "@/lib/apiClient";

const Index = () => {
  const { t, language } = useLanguage();
  const { profile } = useAuth();
  const [weatherSummary, setWeatherSummary] = useState<{ temp: number; condition: string; humidity: number } | null>(null);

  useEffect(() => {
    const loadWeatherSummary = async () => {
      try {
        const weatherData = await apiClient.getWeather();
        setWeatherSummary({
          temp: weatherData.temperature,
          condition: weatherData.description,
          humidity: weatherData.humidity
        });
      } catch (error) {
        console.error('Failed to load weather summary:', error);
        // Keep default values
        setWeatherSummary({
          temp: 28,
          condition: language === 'ml' ? 'ഭാഗികമായി മേഘാവൃതം' : 'Partly cloudy',
          humidity: 75
        });
      }
    };

    loadWeatherSummary();
  }, [language]);

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

      {/* Instructions Section */}
      <Card className="p-6">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 text-card-foreground">{t('howToUseTitle')}</h2>
        <ul className="list-disc list-inside space-y-2 text-left text-muted-foreground">
          <li>{t('instruction1')}</li>
          <li>{t('instruction2')}</li>
          <li>{t('instruction3')}</li>
          <li>{t('instruction4')}</li>
          <li>{t('instruction5')}</li>
        </ul>
      </Card>

      {/* Navigation Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <NavigationCard
          icon={MessageCircle}
          title={t('chat')}
          href="/chat"
          gradient={false}
        />
        
        <NavigationCard
          icon={Activity}
          title={t('activities')}
          href="/activities"
          gradient={false}
        />
        
        <NavigationCard
          icon={CloudSun}
          title={t('weather')}
          href="/weather"
          gradient={false}
        />
        
        <NavigationCard
          icon={Calendar}
          title={t('calendar')}
          href="/crop-calendar"
          gradient={false}
        />
        
        <NavigationCard
          icon={Building}
          title={t('schemes')}
          href="/government-schemes"
          gradient={false}
        />
        
        <NavigationCard
          icon={Users}
          title={t('community')}
          href="/community"
          gradient={false}
        />
      </div>

      {/* Quick Weather Summary */}
      <div className="bg-kerala-coconut rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CloudSun className="h-8 w-8 text-primary" />
            <div>
              <p className="font-semibold">{t('todayWeather')}</p>
              <p className="text-sm text-muted-foreground">
                {weatherSummary ? `${weatherSummary.temp}°C, ${weatherSummary.condition}` : `28°C, ${t('partlyCloudy')}`}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">{t('humidity')}</p>
            <p className="font-semibold">{weatherSummary ? `${weatherSummary.humidity}%` : '75%'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
