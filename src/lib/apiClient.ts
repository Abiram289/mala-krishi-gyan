import { supabase } from "./supabase";
import { Profile } from "../App"; // Import Profile interface

// --- V2.1 API Client with Chat History ---

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!BASE_URL) {
  throw new Error("VITE_API_BASE_URL is not configured.");
}

const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    console.error("Authentication error, redirecting to login.", error);
    window.location.href = "/auth";
    throw new Error("User not authenticated.");
  }

  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${session.access_token}`);
  if (!headers.has("Content-Type") && options.body) {
      headers.set("Content-Type", "application/json");
  }
  options.headers = headers;

  const response = await fetch(url, options);

  if (response.status === 401) {
    await supabase.auth.signOut();
    window.location.href = "/auth";
    throw new Error("Session expired. Please log in again.");
  }

  return response;
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(errorData.detail || `API Error: ${response.statusText}`);
  }
  return response.json() as Promise<T>;
};

// --- Typed Interfaces for API Data ---
export interface District { district_id: number; district_name: string; }
export interface SoilType { soil_type_id: number; soil_name: string; description: string; }
export interface Crop { crop_id: number; crop_name: string; }
export interface Farm { farm_id: number; farm_name: string; district: { district_name: string; }; }
export interface FarmPlot { plot_id: number; plot_name: string; soil_type: { soil_name: string; }; }
export interface Plot extends FarmPlot { farm_id: number; farms: { farm_name: string; }; }
export interface PlantingCreate { plot_id: number; crop_id: number; planting_date: string; }
export interface Planting { planting_id: number; crop_id: number; crop: { crop_name: string; }; planting_date: string; }

// Interface for the new, detailed Activity model
export interface Activity {
  activity_id: number;
  planting_id: number;
  activity_type: string;
  notes: string | null;
  cost: number | null;
  status: 'scheduled' | 'done';
  scheduled_for: string; // ISO datetime string
  completed_at: string | null; // ISO datetime string
  created_at: string; // ISO datetime string
}

// Interface for creating a new activity
export interface ActivityCreate {
  planting_id: number;
  activity_type: string;
  notes?: string;
  cost?: number;
  scheduled_for: string; // ISO datetime string
}

export interface ChatMessageFromDB {
    sender: 'user' | 'bot';
    content: string;
    created_at: string;
}

// --- The Exported API Client ---
export const apiClient = {
  // Master Data
  getDistricts: (): Promise<District[]> => fetchWithAuth("/master-data/districts").then(handleResponse),
  getSoilTypes: (): Promise<SoilType[]> => fetchWithAuth("/master-data/soil-types").then(handleResponse),
  getCrops: (): Promise<Crop[]> => fetchWithAuth("/master-data/crops").then(handleResponse),

  // Profile & Farms
  getProfile: (): Promise<Profile> => fetchWithAuth("/profile").then(handleResponse),
  updateProfile: (profileData: Partial<Profile>): Promise<Profile> =>
    fetchWithAuth("/profile", { method: "PUT", body: JSON.stringify(profileData) }).then(handleResponse),
  getFarms: (): Promise<Farm[]> => fetchWithAuth("/farms").then(handleResponse),
  createFarm: (data: { farm_name: string; district_id: number }): Promise<Farm> =>
    fetchWithAuth("/farms", { method: "POST", body: JSON.stringify(data) }).then(handleResponse),

  // Plots, Plantings, Activities
  getPlotsForFarm: (farmId: number): Promise<FarmPlot[]> => fetchWithAuth(`/farms/${farmId}/plots`).then(handleResponse),
  getPlots: (): Promise<Plot[]> => fetchWithAuth("/plots").then(handleResponse),
  createPlot: (data: any): Promise<FarmPlot> => fetchWithAuth("/plots", { method: "POST", body: JSON.stringify(data) }).then(handleResponse),
  createPlanting: (data: PlantingCreate): Promise<Planting> => fetchWithAuth("/plantings", { method: "POST", body: JSON.stringify(data) }).then(handleResponse),
  
  // New Activity Scheduling Methods
  getActivities: (status?: 'scheduled' | 'done'): Promise<Activity[]> => {
    const url = status ? `/activities?status=${status}` : '/activities';
    return fetchWithAuth(url).then(handleResponse);
  },
  createActivity: (newActivity: ActivityCreate): Promise<Activity> => 
    fetchWithAuth("/activities", { method: "POST", body: JSON.stringify(newActivity) }).then(handleResponse),
  completeActivity: (activityId: number): Promise<Activity> => 
    fetchWithAuth(`/activities/${activityId}/complete`, { method: "PUT" }).then(handleResponse),
  getPlantings: (): Promise<Planting[]> => fetchWithAuth("/plantings").then(handleResponse),

  // Legacy Activity Methods (can be removed if not used elsewhere)
  getActivitiesForPlanting: (plantingId: number): Promise<Activity[]> => fetchWithAuth(`/plantings/${plantingId}/activities`).then(handleResponse),


  // Calendar
  getCropCalendar: (month: number): Promise<any> => fetchWithAuth(`/crop-calendar?month=${month}`).then(handleResponse),

  // Weather
  getWeather: (lat?: number, lon?: number, language?: string): Promise<any> => {
    const params = new URLSearchParams();
    if (lat) params.set("lat", lat.toString());
    if (lon) params.set("lon", lon.toString());
    if (language) params.set("language", language);
    const queryString = params.toString();
    const url = queryString ? `/weather?${queryString}` : "/weather";
    return fetchWithAuth(url).then(handleResponse);
  },

  // Text-to-Speech
  textToSpeech: (text: string, language: string = 'en'): Promise<any> => 
    fetchWithAuth("/tts", {
      method: "POST",
      body: JSON.stringify({ text, language }),
    }).then(handleResponse),

  // Chat
  getChatHistory: (): Promise<ChatMessageFromDB[]> => 
    fetchWithAuth("/chat/history").then(handleResponse),

  postChatMessage: (message: string): Promise<{ reply: string }> =>
    fetchWithAuth("/chat", {
      method: "POST",
      body: JSON.stringify({ message }),
    }).then(handleResponse),
};
