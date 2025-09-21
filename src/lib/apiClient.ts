import { supabase } from "./supabase";

// 1. Get the base URL from environment variables
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

console.log("Frontend BASE_URL from env:", BASE_URL);

if (!BASE_URL) {
  console.error("VITE_API_BASE_URL is not set. Please check your .env file.");
}

// This is a wrapper around the native fetch API that automatically handles
// adding the Supabase auth token and signing the user out if the token is invalid.
// It now takes an endpoint (e.g., '/profile') instead of a full URL.
export const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
  console.log("--- fetchWithAuth DEBUG START ---");
  console.log("Endpoint:", endpoint);
  console.log("Initial Options:", JSON.stringify(options, null, 2));

  const url = `${BASE_URL}${endpoint}`;
  console.log(`fetchWithAuth: Attempting to fetch ${url}`);

  try {
    // Get the current session
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error("Error getting session:", error);
      throw new Error("Failed to get user session.");
    }

    if (!session) {
      console.log("fetchWithAuth: No session found, redirecting to /auth.");
      window.location.href = "/auth";
      return Promise.reject(new Error("User not authenticated."));
    }

    console.log("Session Object:", JSON.stringify(session, null, 2));

    console.log("fetchWithAuth: Session found. Adding Authorization header.");
    // Add the Authorization header to the request
    const headers = new Headers(options.headers);
    headers.set("Authorization", `Bearer ${session.access_token}`);
    options.headers = headers;

    console.log("Final Headers:", JSON.stringify(Object.fromEntries(headers.entries()), null, 2));
    console.log("--- fetchWithAuth DEBUG END ---");

    // Make the actual fetch request
    const response = await fetch(url, options);
    console.log(`fetchWithAuth: Received response with status ${response.status}`);

    // If the response is 401 (Unauthorized), the token is no longer valid.
    if (response.status === 401) {
      console.log("fetchWithAuth: 401 Unauthorized, signing out and redirecting.");
      await supabase.auth.signOut();
      window.location.href = "/auth"; 
      return Promise.reject(new Error("Authentication error: Session is invalid."));
    }

    return response;
  } catch (error) {
    console.error("An unexpected error occurred in fetchWithAuth:", error);
    throw error;
  }
};