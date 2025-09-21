interface WeatherResponse {
  main: {
    temp: number;
    humidity: number;
    feels_like: number;
  };
  weather: Array<{
    main: string;
    description: string;
    icon: string;
  }>;
  wind: {
    speed: number;
  };
  name: string;
  sys: {
    country: string;
  };
}

interface WeatherData {
  temperature: number;
  humidity: number;
  condition: 'sunny' | 'cloudy' | 'rainy';
  windSpeed: number;
  location: string;
  description: string;
  alerts: string[];
}

const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Default to Kochi, Kerala coordinates if no location provided
const DEFAULT_LAT = 9.9312;
const DEFAULT_LON = 76.2673;

const mapWeatherCondition = (weatherMain: string): 'sunny' | 'cloudy' | 'rainy' => {
  const main = weatherMain.toLowerCase();
  if (main.includes('rain') || main.includes('drizzle') || main.includes('thunderstorm')) {
    return 'rainy';
  } else if (main.includes('clear')) {
    return 'sunny';
  } else {
    return 'cloudy';
  }
};

const generateFarmingAlerts = (weather: WeatherResponse, language: string = 'en'): string[] => {
  const alerts: string[] = [];
  const temp = Math.round(weather.main.temp);
  const humidity = weather.main.humidity;
  const condition = weather.weather[0].main.toLowerCase();
  
  // Temperature-based alerts
  if (temp > 35) {
    alerts.push(language === 'ml' 
      ? 'ഉയർന്ന താപനില - വിളകളുടെ ജലസേചനം വർദ്ധിപ്പിക്കുക'
      : 'High temperature - Increase crop irrigation'
    );
  }
  
  // Humidity-based alerts
  if (humidity > 80) {
    alerts.push(language === 'ml' 
      ? 'ഉയർന്ന ആർദ്രത - കീടങ്ങളുടെ പ്രവർത്തനം വർദ്ധിക്കാം'
      : 'High humidity - Increased pest activity possible'
    );
  }
  
  // Rain-based alerts
  if (condition.includes('rain')) {
    alerts.push(language === 'ml' 
      ? 'മഴ പ്രതീക്ഷിക്കുന്നു - വിളവെടുപ്പ് മാറ്റിവയ്ക്കുക'
      : 'Rain expected - Postpone harvesting activities'
    );
  }
  
  // Seasonal advice for September (current month)
  const currentMonth = new Date().getMonth();
  if (currentMonth === 8) { // September (0-indexed)
    alerts.push(language === 'ml' 
      ? 'റാബി വിളകൾ നടുന്നതിനുള്ള അനുയോജ്യ സമയം'
      : 'Ideal time for Rabi crop planning'
    );
  }
  
  return alerts;
};

export const fetchWeatherData = async (lat?: number, lon?: number, language: string = 'en'): Promise<WeatherData> => {
  try {
    // Use provided coordinates or default to Kochi, Kerala
    const latitude = lat || DEFAULT_LAT;
    const longitude = lon || DEFAULT_LON;
    
    const response = await fetch(
      `${BASE_URL}/weather?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}&units=metric`
    );
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }
    
    const data: WeatherResponse = await response.json();
    
    return {
      temperature: Math.round(data.main.temp),
      humidity: data.main.humidity,
      condition: mapWeatherCondition(data.weather[0].main),
      windSpeed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
      location: `${data.name}, ${data.sys.country}`,
      description: data.weather[0].description,
      alerts: generateFarmingAlerts(data, language)
    };
  } catch (error) {
    console.error('Failed to fetch weather data:', error);
    
    // Return fallback data for Kerala
    return {
      temperature: 28,
      humidity: 75,
      condition: 'cloudy',
      windSpeed: 12,
      location: 'Kochi, IN',
      description: 'Partly cloudy',
      alerts: language === 'ml' 
        ? ['കാലാവസ്ഥാ വിവരങ്ങൾ ലഭിക്കുന്നില്ല', 'സാധാരണ കൃഷി പ്രവർത്തനങ്ങൾ തുടരുക']
        : ['Weather data unavailable', 'Continue normal farming activities']
    };
  }
};

// Alternative: Use backend weather endpoint (recommended for production)
export const fetchWeatherFromBackend = async (): Promise<WeatherData> => {
  const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';
  
  try {
    const response = await fetch(`${BACKEND_URL}/weather`, {
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token') || ''}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Backend weather API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch weather from backend:', error);
    
    // Fallback to direct API call
    return fetchWeatherData();
  }
};

export const parseLocationCoordinates = (location: string): { lat: number; lon: number } | null => {
  try {
    // Try to parse coordinates from "lat, lon" format
    const coords = location.split(',').map(coord => parseFloat(coord.trim()));
    if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
      return { lat: coords[0], lon: coords[1] };
    }
  } catch (error) {
    console.error('Failed to parse location coordinates:', error);
  }
  
  return null;
};
