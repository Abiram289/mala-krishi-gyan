import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Cloud, CloudRain, Sun, Thermometer, Droplets, Wind, AlertTriangle, MapPin, Loader } from "lucide-react";
import { useLanguage } from "./LanguageToggle";
import { fetchWeatherData, parseLocationCoordinates } from "@/lib/weatherService";
import { useAuth } from "@/App";
import { apiClient } from "@/lib/apiClient";

interface WeatherData {
  temperature: number;
  humidity: number;
  condition: 'sunny' | 'cloudy' | 'rainy';
  windSpeed: number;
  location: string;
  description: string;
  alerts: string[];
}

export const WeatherCard = () => {
  const { t, language } = useLanguage();
  const { profile } = useAuth();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadWeatherData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let lat: number | undefined;
        let lon: number | undefined;
        
        // Try to get location from user profile
        if (profile?.location) {
          const coords = parseLocationCoordinates(profile.location);
          if (coords) {
            lat = coords.lat;
            lon = coords.lon;
          }
        }
        
        try {
          const weatherData = await apiClient.getWeather(lat, lon, language);
          setWeather(weatherData);
        } catch (err) {
          console.error('Error loading weather data:', err);
          setError('Failed to load weather data');
        }
      } catch (err) {
        console.error('Error loading weather data:', err);
        setError('Failed to load weather data');
      } finally {
        setLoading(false);
      }
    };

    loadWeatherData();
  }, [profile?.location, language]);

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'sunny': return <Sun className="h-8 w-8 text-accent" />;
      case 'rainy': return <CloudRain className="h-8 w-8 text-kerala-backwater" />;
      default: return <Cloud className="h-8 w-8 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Card className="p-6 bg-gradient-to-br from-kerala-backwater/20 to-primary/5">
          <div className="flex items-center justify-center h-40">
            <div className="flex items-center space-x-2">
              <Loader className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">{language === 'ml' ? 'കാലാവസ്ഥ ലോഡ് ചെയ്യുന്നു...' : 'Loading weather data...'}</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="space-y-4">
        <Card className="p-6 bg-gradient-to-br from-kerala-backwater/20 to-primary/5">
          <div className="flex items-center justify-center h-40">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 text-accent mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {language === 'ml' ? 'കാലാവസ്ഥാ വിവരങ്ങൾ ലഭിക്കുന്നില്ല' : 'Weather data unavailable'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {language === 'ml' ? 'സാധാരണ കൃഷി പ്രവർത്തനങ്ങൾ തുടരുക' : 'Continue normal farming activities'}
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-6 bg-gradient-to-br from-kerala-backwater/20 to-primary/5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-card-foreground">{t('weatherTitle')}</h3>
            {weather.location && (
              <div className="flex items-center space-x-1 mt-1">
                <MapPin className="h-3 w-3 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{weather.location}</p>
              </div>
            )}
          </div>
          <div className="text-center">
            {getWeatherIcon(weather.condition)}
            <p className="text-xs text-muted-foreground mt-1 capitalize">{weather.description}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <Thermometer className="h-5 w-5 text-destructive" />
            <div>
              <p className="text-sm text-muted-foreground">{t('temperature')}</p>
              <p className="font-semibold">{weather.temperature}°C</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Droplets className="h-5 w-5 text-kerala-backwater" />
            <div>
              <p className="text-sm text-muted-foreground">{t('humidity')}</p>
              <p className="font-semibold">{weather.humidity}%</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Wind className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">{t('wind')}</p>
              <p className="font-semibold">{weather.windSpeed} km/h</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <CloudRain className="h-5 w-5 text-kerala-backwater" />
            <div>
              <p className="text-sm text-muted-foreground">{t('rainfall')}</p>
              <p className="font-semibold text-xs">{weather.condition === 'rainy' ? (language === 'ml' ? 'പ്രതീക്ഷിക്കുന്നു' : 'Expected') : (language === 'ml' ? 'ഇല്ല' : 'None')}</p>
            </div>
          </div>
        </div>
      </Card>

      {weather.alerts && weather.alerts.length > 0 && (
        <Card className="p-4 border-accent/50 bg-accent/5">
          <div className="flex items-center space-x-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-accent" />
            <h4 className="font-semibold text-accent">{t('alerts')}</h4>
          </div>
          <div className="space-y-2">
            {weather.alerts.map((alert, index) => (
              <Badge key={index} variant="secondary" className="text-xs mr-2 mb-2">
                {alert}
              </Badge>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};