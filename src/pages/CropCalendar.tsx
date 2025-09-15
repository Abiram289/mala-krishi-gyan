import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Calendar, Droplets, Sprout, Sun, CloudRain, Bug, Scissors } from "lucide-react";
import { useLanguage } from "@/components/LanguageToggle";
import { Link } from "react-router-dom";

interface CropPrediction {
  id: string;
  crop: string;
  stage: string;
  action: string;
  timing: string;
  priority: 'high' | 'medium' | 'low';
  description: string;
  icon: string;
}

export default function CropCalendar() {
  const { t } = useLanguage();
  
  const [currentMonth] = useState(new Date().getMonth());
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const predictions: CropPrediction[] = [
    {
      id: '1',
      crop: 'Rice',
      stage: 'Sowing',
      action: 'Plant Seedlings',
      timing: 'Sept 15-20',
      priority: 'high',
      description: 'Optimal time for transplanting rice seedlings in monsoon fields',
      icon: 'sprout'
    },
    {
      id: '2',
      crop: 'Coconut',
      stage: 'Maintenance',
      action: 'Apply Fertilizer',
      timing: 'Sept 18-25',
      priority: 'medium',
      description: 'Apply organic fertilizer around coconut trees for better yield',
      icon: 'droplets'
    },
    {
      id: '3',
      crop: 'Pepper',
      stage: 'Growing',
      action: 'Pest Control',
      timing: 'Sept 20-25',
      priority: 'high',
      description: 'Apply neem-based pest control due to high humidity',
      icon: 'bug'
    },
    {
      id: '4',
      crop: 'Vegetables',
      stage: 'Harvest',
      action: 'Harvest Time',
      timing: 'Sept 22-28',
      priority: 'high',
      description: 'Harvest leafy vegetables before heavy rains expected',
      icon: 'scissors'
    },
    {
      id: '5',
      crop: 'Banana',
      stage: 'Growing',
      action: 'Irrigation',
      timing: 'Sept 16-20',
      priority: 'medium',
      description: 'Deep irrigation before monsoon to strengthen root system',
      icon: 'droplets'
    }
  ];

  const weatherPredictions = [
    {
      date: 'Sept 16-20',
      condition: 'Heavy Rain Expected',
      impact: 'Good for rice, avoid harvesting',
      icon: 'cloud-rain'
    },
    {
      date: 'Sept 21-25',
      condition: 'Moderate Rain',
      impact: 'Perfect for transplanting',
      icon: 'droplets'
    },
    {
      date: 'Sept 26-30',
      condition: 'Sunny Intervals',
      impact: 'Ideal for pest control activities',
      icon: 'sun'
    }
  ];

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'sprout': return <Sprout className="h-4 w-4" />;
      case 'droplets': return <Droplets className="h-4 w-4" />;
      case 'bug': return <Bug className="h-4 w-4" />;
      case 'scissors': return <Scissors className="h-4 w-4" />;
      case 'sun': return <Sun className="h-4 w-4" />;
      case 'cloud-rain': return <CloudRain className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-destructive text-destructive-foreground';
      case 'medium': return 'bg-accent text-accent-foreground';
      case 'low': return 'bg-secondary text-secondary-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-kerala-spice via-kerala-coconut to-kerala-rice p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/">
            <Button variant="outline" size="sm" className="bg-white/90">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('back')}
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">{t('calendar')}</h1>
        </div>

        <Tabs defaultValue="predictions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="predictions">AI Predictions</TabsTrigger>
            <TabsTrigger value="weather">Weather Impact</TabsTrigger>
            <TabsTrigger value="schedule">Monthly Schedule</TabsTrigger>
          </TabsList>

          <TabsContent value="predictions" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Sprout className="h-5 w-5 text-primary" />
                AI Farming Predictions for {monthNames[currentMonth]}
              </h2>
              <div className="space-y-4">
                {predictions.map(prediction => (
                  <Card key={prediction.id} className="p-4 border-l-4 border-l-primary">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="text-primary mt-1">
                          {getIcon(prediction.icon)}
                        </div>
                        <div className="space-y-2">
                          <div>
                            <h3 className="font-semibold text-foreground">{prediction.crop}</h3>
                            <p className="text-sm text-muted-foreground">{prediction.stage} Stage</p>
                          </div>
                          <div>
                            <h4 className="font-medium text-primary">{prediction.action}</h4>
                            <p className="text-sm text-muted-foreground">{prediction.description}</p>
                          </div>
                          <p className="text-sm font-medium">⏰ {prediction.timing}</p>
                        </div>
                      </div>
                      <Badge className={getPriorityColor(prediction.priority)}>
                        {prediction.priority} priority
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="weather" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <CloudRain className="h-5 w-5 text-primary" />
                Weather-Based Farming Guidance
              </h2>
              <div className="space-y-4">
                {weatherPredictions.map((weather, index) => (
                  <Card key={index} className="p-4 bg-gradient-to-r from-primary/5 to-transparent">
                    <div className="flex items-center gap-4">
                      <div className="text-primary">
                        {getIcon(weather.icon)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{weather.date}</h3>
                          <Badge variant="outline">{weather.condition}</Badge>
                        </div>
                        <p className="text-muted-foreground">{weather.impact}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                {monthNames[currentMonth]} Farming Schedule
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="p-4">
                  <h3 className="font-semibold text-primary mb-3">Week 1 (Sept 1-7)</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Sprout className="h-3 w-3" />
                      Prepare rice nursery beds
                    </li>
                    <li className="flex items-center gap-2">
                      <Droplets className="h-3 w-3" />
                      Deep irrigation for perennial crops
                    </li>
                  </ul>
                </Card>
                <Card className="p-4">
                  <h3 className="font-semibold text-primary mb-3">Week 2 (Sept 8-14)</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Scissors className="h-3 w-3" />
                      Harvest summer vegetables
                    </li>
                    <li className="flex items-center gap-2">
                      <Bug className="h-3 w-3" />
                      Apply preventive pest control
                    </li>
                  </ul>
                </Card>
                <Card className="p-4">
                  <h3 className="font-semibold text-primary mb-3">Week 3 (Sept 15-21)</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Sprout className="h-3 w-3" />
                      Rice transplanting peak time
                    </li>
                    <li className="flex items-center gap-2">
                      <Droplets className="h-3 w-3" />
                      Fertilizer application for coconut
                    </li>
                  </ul>
                </Card>
                <Card className="p-4">
                  <h3 className="font-semibold text-primary mb-3">Week 4 (Sept 22-30)</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CloudRain className="h-3 w-3" />
                      Monitor drainage systems
                    </li>
                    <li className="flex items-center gap-2">
                      <Sprout className="h-3 w-3" />
                      Plant monsoon vegetables
                    </li>
                  </ul>
                </Card>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}