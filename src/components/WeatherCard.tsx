import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Cloud, CloudRain, Sun, Thermometer, Droplets, Wind, AlertTriangle } from "lucide-react";
import { useLanguage } from "./LanguageToggle";

interface WeatherData {
  temperature: number;
  humidity: number;
  condition: 'sunny' | 'cloudy' | 'rainy';
  windSpeed: number;
  alerts: string[];
}

export const WeatherCard = () => {
  const { t } = useLanguage();
  
  // Mock weather data - in real app this would come from API
  const weather: WeatherData = {
    temperature: 28,
    humidity: 75,
    condition: 'cloudy',
    windSpeed: 12,
    alerts: ['Heavy rain expected tomorrow', 'Pest activity high due to humidity']
  };

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'sunny': return <Sun className="h-8 w-8 text-accent" />;
      case 'rainy': return <CloudRain className="h-8 w-8 text-kerala-backwater" />;
      default: return <Cloud className="h-8 w-8 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-6 bg-gradient-to-br from-kerala-backwater/20 to-primary/5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-card-foreground">{t('weatherTitle')}</h3>
          {getWeatherIcon(weather.condition)}
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
              <p className="text-sm text-muted-foreground">Wind</p>
              <p className="font-semibold">{weather.windSpeed} km/h</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <CloudRain className="h-5 w-5 text-kerala-backwater" />
            <div>
              <p className="text-sm text-muted-foreground">{t('rainfall')}</p>
              <p className="font-semibold">Expected</p>
            </div>
          </div>
        </div>
      </Card>

      {weather.alerts.length > 0 && (
        <Card className="p-4 border-accent/50 bg-accent/5">
          <div className="flex items-center space-x-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-accent" />
            <h4 className="font-semibold text-accent">Alerts</h4>
          </div>
          <div className="space-y-2">
            {weather.alerts.map((alert, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {alert}
              </Badge>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};