from fastapi import FastAPI, Depends, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from pydantic import BaseModel
import os
from dotenv import load_dotenv
import google.generativeai as genai
from google.cloud import texttospeech
import requests
import base64

# Load environment variables from parent directory
load_dotenv("../.env")
# Also try loading from current directory as fallback
load_dotenv()

# Debug environment loading
print(f"\n🔍 ENVIRONMENT DEBUG:")
print(f"Current working directory: {os.getcwd()}")
print(f"GOOGLE_APPLICATION_CREDENTIALS from env: {os.getenv('GOOGLE_APPLICATION_CREDENTIALS')}")
if os.getenv('GOOGLE_APPLICATION_CREDENTIALS'):
    cred_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
    abs_path = os.path.abspath(cred_path)
    print(f"Absolute credentials path: {abs_path}")
    print(f"Credentials file exists: {os.path.exists(abs_path)}")
print("\n")

import json
import tempfile

# For Railway deployment - create credentials file from environment variable
if os.getenv("GOOGLE_APPLICATION_CREDENTIALS_JSON"):
    credentials_json = os.getenv("GOOGLE_APPLICATION_CREDENTIALS_JSON")
    with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.json') as f:
        f.write(credentials_json)
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = f.name

# Fix relative path for local development
if os.getenv("GOOGLE_APPLICATION_CREDENTIALS") and os.getenv("GOOGLE_APPLICATION_CREDENTIALS").startswith('./'):
    # Convert relative path to absolute path from parent directory
    parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    relative_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")[2:]  # Remove './'
    absolute_path = os.path.join(parent_dir, relative_path)
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = absolute_path
    print(f"Fixed relative path to: {absolute_path}")

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")
GOOGLE_APPLICATION_CREDENTIALS = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("Missing SUPABASE_URL or SUPABASE_KEY in environment")

if not GEMINI_API_KEY:
    raise RuntimeError("Missing GEMINI_API_KEY in environment")

# Configure Gemini AI
genai.configure(api_key=GEMINI_API_KEY)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI()

# Allow frontend to call backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # You can restrict to ["http://localhost:3000"] later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------
# Models
# ------------------------
class TestCreate(BaseModel):
    name: str
    ph: float
    temperature: float
    turbidity: float
    tds: float
    prediction: str

class ChatMessage(BaseModel):
    message: str
    preferred_language: str = "en"  # "en" for English, "ml" for Malayalam
    voice_input_language: str = "en"

class ProfileUpdate(BaseModel):
    username: str | None = None
    full_name: str | None = None
    avatar_url: str | None = None
    farm_size: float | None = None
    location: str | None = None
    soil_type: str | None = None

class ActivityCreate(BaseModel):
    title: str
    type: str  # 'planting', 'watering', 'fertilizing', 'harvesting'
    date: str  # ISO date string
    notes: str | None = None

class ActivityUpdate(BaseModel):
    title: str | None = None
    type: str | None = None
    status: str | None = None  # 'completed', 'pending', 'scheduled'
    date: str | None = None
    notes: str | None = None

class TextToSpeechRequest(BaseModel):
    text: str
    language: str = "en"  # "en" for English, "ml" for Malayalam


# ------------------------
# Auth Helper
# ------------------------
def get_current_user(authorization: str = Header(..., alias="Authorization")):
    """
    Extracts the current user from the Authorization header.
    Expects "Authorization: Bearer <token>".
    """
    print("get_current_user: Function entered.")
    print(f"get_current_user: Raw Authorization header: {authorization}")

    try:
        scheme, credentials = authorization.split(" ")
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid authentication scheme")

        print(f"get_current_user: Received token credentials: {credentials[:30]}...")
        user_response = supabase.auth.get_user(jwt=credentials)
        user = user_response.user
        if not user:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")

        print(f"get_current_user: User authenticated: {user.id}")
        return user
    except Exception as e:
        print(f"get_current_user: Exception during token validation: {type(e).__name__} - {e}")
        raise HTTPException(status_code=401, detail="Invalid or expired token")


# ------------------------
# Routes
# ------------------------

@app.post("/tts")
async def synthesize_speech(req: TextToSpeechRequest, user=Depends(get_current_user)):
    """Synthesize speech using Microsoft Edge TTS (free) and return base64 audio."""
    try:
        import edge_tts
        import io
        
        # Select voice based on requested language
        if req.language == "ml":
            voice = "ml-IN-MidhunNeural"  # Malayalam (India) - Male voice
            # Alternative: "ml-IN-SobhanaNeural"  # Malayalam (India) - Female voice
        else:
            voice = "en-IN-NeerjaNeural"  # English (India) - Female voice
            # Alternative: "en-IN-PrabhatNeural"  # English (India) - Male voice
        
        print(f"\n🎯 Edge TTS: Using voice '{voice}' for language '{req.language}'")
        print(f"Text to synthesize: {req.text[:50]}...")
        
        # Create TTS communication
        communicate = edge_tts.Communicate(req.text, voice)
        
        # Generate speech and collect audio data
        audio_data = b""
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_data += chunk["data"]
        
        if not audio_data:
            raise Exception("No audio data generated")
        
        # Convert to base64
        audio_base64 = base64.b64encode(audio_data).decode("utf-8")
        
        print(f"✅ Edge TTS: Successfully generated {len(audio_data)} bytes of audio")
        return {"audio": audio_base64, "contentType": "audio/mpeg"}
        
    except Exception as e:
        print(f"\n🚨 EDGE TTS ERROR:")
        print(f"Error Type: {type(e).__name__}")
        print(f"Error Message: {str(e)}")
        import traceback
        print(f"Full traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Edge TTS failed: {str(e)}")
@app.get("/")
def root():
    return {"message": "Kerala Krishi Sahai API is running 🚀"}


@app.get("/profile")
def get_profile(user=Depends(get_current_user)):
    """Returns the authenticated user's profile from the profiles table."""
    try:
        # Get profile from user_profiles table
        profile_response = supabase.table("user_profiles").select("*").eq("user_id", user.id).execute()
        
        # Get username from auth metadata as fallback
        user_meta = user.user_metadata or {}
        username = user_meta.get("username") or user_meta.get("full_name")
        
        if profile_response.data:
            # Profile exists in database
            profile = profile_response.data[0]
            return {
                "id": user.id,
                "email": user.email,
                "username": username,
                "full_name": profile.get("full_name"),
                "avatar_url": None,  # We'll add this later if needed
                "farm_size": float(profile.get("farm_size")) if profile.get("farm_size") else None,
                "location": profile.get("location"),
                "soil_type": profile.get("soil_type")
            }
        else:
            # No profile exists yet, return basic info
            return {
                "id": user.id,
                "email": user.email,
                "username": username,
                "full_name": None,
                "avatar_url": None,
                "farm_size": None,
                "location": None,
                "soil_type": None
            }
    except Exception as e:
        print(f"Error fetching profile: {type(e).__name__} - {e}")
        # Return basic user info on error
        user_meta = user.user_metadata or {}
        return {
            "id": user.id,
            "email": user.email,
            "username": user_meta.get("username") or user_meta.get("full_name"),
            "full_name": None,
            "avatar_url": None,
            "farm_size": None,
            "location": None,
            "soil_type": None
        }


@app.patch("/profile")
@app.put("/profile")
def update_profile(profile_data: ProfileUpdate, user=Depends(get_current_user)):
    """Updates the authenticated user's profile in the profiles table."""
    print(f"\n🔄 PROFILE UPDATE ENDPOINT CALLED FOR USER: {user.id}")
    print(f"📥 Received profile data: {profile_data}")
    
    try:
        # Prepare profile data for database
        update_data = {}
        if profile_data.full_name is not None:
            update_data["full_name"] = profile_data.full_name
        if profile_data.farm_size is not None:
            update_data["farm_size"] = profile_data.farm_size
        if profile_data.location is not None:
            update_data["location"] = profile_data.location
        if profile_data.soil_type is not None:
            update_data["soil_type"] = profile_data.soil_type
        
        print(f"💾 Upserting profile data: {update_data}")
        
        # Use upsert to insert or update profile
        result = supabase.table("user_profiles").upsert({
            "user_id": user.id,
            **update_data
        }, on_conflict="user_id").execute()
        
        print(f"✅ Profile upsert successful: {result.data}")
        
        return {
            "success": True, 
            "message": "Profile updated successfully",
            "data": result.data[0] if result.data else update_data
        }
        
    except Exception as e:
        print(f"❌ Profile update error: {type(e).__name__} - {e}")
        print(f"Full error details: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update profile: {str(e)}")


@app.post("/tests")
def create_test(test: TestCreate, user=Depends(get_current_user)):
    """Stores a water test result linked to the authenticated user."""
    try:
        data = supabase.table("tests").insert({
            "user_id": user.id,
            "name": test.name,
            "ph": test.ph,
            "temperature": test.temperature,
            "turbidity": test.turbidity,
            "tds": test.tds,
            "prediction": test.prediction
        }).execute()

        return {"success": True, "data": data.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")


@app.get("/tests")
def list_tests(user=Depends(get_current_user)):
    """Lists all water test results of the authenticated user."""
    try:
        data = supabase.table("tests").select("*").eq("user_id", user.id).execute()
        return {"tests": data.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")


@app.delete("/tests/{test_id}")
def delete_test(test_id: int, user=Depends(get_current_user)):
    """Deletes a water test result by ID (if it belongs to the authenticated user)."""
    try:
        supabase.table("tests").delete().eq("id", test_id).eq("user_id", user.id).execute()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")


# ------------------------
# Activity Management Routes
# ------------------------
@app.post("/activities")
def create_activity(activity: ActivityCreate, user=Depends(get_current_user)):
    """Creates a new farming activity for the authenticated user."""
    try:
        # Parse the date string to ensure it's valid
        from datetime import datetime
        try:
            parsed_date = datetime.fromisoformat(activity.date.replace('Z', '+00:00'))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use ISO format (YYYY-MM-DD)")
        
        data = supabase.table("activities").insert({
            "user_id": user.id,
            "title": activity.title,
            "type": activity.type,
            "status": "scheduled",  # Default status for new activities
            "date": activity.date,
            "notes": activity.notes,
            "created_at": datetime.now().isoformat()
        }).execute()
        
        return {"success": True, "data": data.data[0]}
    except Exception as e:
        print(f"Activity creation error: {type(e).__name__} - {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/activities")
def list_activities(user=Depends(get_current_user)):
    """Lists all farming activities for the authenticated user."""
    try:
        data = supabase.table("activities").select("*").eq("user_id", user.id).order("date", desc=True).execute()
        return {"activities": data.data}
    except Exception as e:
        print(f"Activity fetch error: {type(e).__name__} - {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.put("/activities/{activity_id}")
def update_activity(activity_id: int, activity_data: ActivityUpdate, user=Depends(get_current_user)):
    """Updates a farming activity by ID (if it belongs to the authenticated user)."""
    try:
        # Prepare update data (only include non-None values)
        update_data = {}
        if activity_data.title is not None:
            update_data["title"] = activity_data.title
        if activity_data.type is not None:
            update_data["type"] = activity_data.type
        if activity_data.status is not None:
            update_data["status"] = activity_data.status
        if activity_data.date is not None:
            # Validate date format
            from datetime import datetime
            try:
                datetime.fromisoformat(activity_data.date.replace('Z', '+00:00'))
                update_data["date"] = activity_data.date
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid date format")
        if activity_data.notes is not None:
            update_data["notes"] = activity_data.notes
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No valid fields to update")
        
        # Add updated timestamp
        from datetime import datetime
        update_data["updated_at"] = datetime.now().isoformat()
        
        data = supabase.table("activities").update(update_data).eq("id", activity_id).eq("user_id", user.id).execute()
        
        if not data.data:
            raise HTTPException(status_code=404, detail="Activity not found or access denied")
        
        return {"success": True, "data": data.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Activity update error: {type(e).__name__} - {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.delete("/activities/{activity_id}")
def delete_activity(activity_id: int, user=Depends(get_current_user)):
    """Deletes a farming activity by ID (if it belongs to the authenticated user)."""
    try:
        result = supabase.table("activities").delete().eq("id", activity_id).eq("user_id", user.id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Activity not found or access denied")
        
        return {"success": True, "message": "Activity deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Activity deletion error: {type(e).__name__} - {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


def get_current_season(month):
    """Determine Indian agricultural season and planning phase based on month"""
    if month in [6, 7, 8]:  # June-August
        return "Kharif (Monsoon) season - Active growing"
    elif month == 9:  # September
        return "Late Kharif/Pre-Rabi planning - Time to plan Rabi crops"
    elif month == 10:  # October
        return "Rabi planting season - Optimal time for winter crops"
    elif month in [11, 12, 1, 2]:  # November-February
        return "Rabi (Winter) season - Active growing"
    elif month == 3:  # March
        return "Late Rabi/Pre-Zaid planning - Time to plan summer crops"
    elif month in [4, 5]:  # April-May
        return "Zaid (Summer) season - Hot weather crops"
    else:
        return "Transitional period"

@app.get("/weather")
def get_weather(lat: float = None, lon: float = None, user=Depends(get_current_user)):
    """Get weather data for user's location or coordinates."""
    try:
        # Get user profile for location if coordinates not provided
        if lat is None or lon is None:
            user_meta = user.user_metadata or {}
            user_location = user_meta.get("location")
            
            if user_location:
                # Try to parse coordinates from "lat, lon" format
                try:
                    coords = user_location.split(',')
                    if len(coords) == 2:
                        lat = float(coords[0].strip())
                        lon = float(coords[1].strip())
                except:
                    pass
            
            # Default to Kochi, Kerala if no coordinates available
            if lat is None or lon is None:
                lat, lon = 9.9312, 76.2673
        
        if not OPENWEATHER_API_KEY:
            # Return mock data if no API key
            return {
                "temperature": 28,
                "humidity": 75,
                "condition": "cloudy",
                "windSpeed": 12,
                "location": "Kochi, IN",
                "description": "Partly cloudy",
                "alerts": ["Weather data unavailable - using mock data"]
            }
        
        # Fetch weather data from OpenWeatherMap
        response = requests.get(
            f"https://api.openweathermap.org/data/2.5/weather",
            params={
                "lat": lat,
                "lon": lon,
                "appid": OPENWEATHER_API_KEY,
                "units": "metric"
            }
        )
        
        if response.status_code != 200:
            raise Exception(f"Weather API error: {response.status_code}")
        
        data = response.json()
        
        # Map weather condition
        weather_main = data["weather"][0]["main"].lower()
        if "rain" in weather_main or "drizzle" in weather_main or "thunderstorm" in weather_main:
            condition = "rainy"
        elif "clear" in weather_main:
            condition = "sunny"
        else:
            condition = "cloudy"
        
        # Generate farming alerts
        alerts = []
        temp = round(data["main"]["temp"])
        humidity = data["main"]["humidity"]
        
        if temp > 35:
            alerts.append("High temperature - Increase crop irrigation")
        if humidity > 80:
            alerts.append("High humidity - Monitor for pest activity")
        if condition == "rainy":
            alerts.append("Rain expected - Postpone harvesting activities")
        
        # September-specific advice
        from datetime import datetime
        if datetime.now().month == 9:
            alerts.append("Ideal time for Rabi crop planning")
        
        return {
            "temperature": temp,
            "humidity": humidity,
            "condition": condition,
            "windSpeed": round(data["wind"]["speed"] * 3.6),  # Convert m/s to km/h
            "location": f"{data['name']}, {data['sys']['country']}",
            "description": data["weather"][0]["description"],
            "alerts": alerts
        }
        
    except Exception as e:
        print(f"Weather error: {type(e).__name__} - {e}")
        # Return fallback data
        return {
            "temperature": 28,
            "humidity": 75,
            "condition": "cloudy",
            "windSpeed": 12,
            "location": "Kochi, IN",
            "description": "Partly cloudy",
            "alerts": ["Weather data unavailable - using fallback data"]
        }


@app.post("/chat")
def chat_with_ai(message: ChatMessage, user=Depends(get_current_user)):
    """Context-aware chat endpoint using Gemini AI with user profile integration."""
    try:
        # Get user profile information for context
        user_meta = user.user_metadata or {}
        
        # Extract profile details
        username = user_meta.get("username") or user_meta.get("full_name") or "Farmer"
        farm_size = user_meta.get("farm_size")
        location = user_meta.get("location")
        soil_type = user_meta.get("soil_type")
        
        # Get current date for seasonal awareness
        from datetime import datetime
        current_date = datetime.now()
        current_month = current_date.strftime("%B")
        current_season = get_current_season(current_date.month)
        
        # Initialize Gemini model
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Build personalized context
        personal_context = f"\n\nCURRENT CONTEXT:\n"
        personal_context += f"- Current Date: {current_date.strftime('%B %d, %Y')}\n"
        personal_context += f"- Agricultural Season: {current_season}\n"
        personal_context += f"- Month: {current_month} (Consider seasonal planting cycles)\n"
        
        personal_context += f"\n\nFARMER PROFILE:\n"
        personal_context += f"- Farmer Name: {username}\n"
        
        if farm_size:
            personal_context += f"- Farm Size: {farm_size} acres\n"
        if location:
            personal_context += f"- Location: {location}\n"
        if soil_type:
            personal_context += f"- Soil Type: {soil_type}\n"
            
        if not any([farm_size, location, soil_type]):
            personal_context += "- Profile: Incomplete (gently encourage completing profile, but provide general seasonal advice)\n"
        
        # Create a personalized system prompt
        system_prompt = f"""
        You are Mala Krishi Gyan AI, a personalized agricultural assistant for {username}.
        
        CORE EXPERTISE:
        - Crop management and cultivation practices
        - Soil health and fertilizer recommendations
        - Weather-related farming advice
        - Pest and disease management
        - Government schemes and subsidies for farmers
        - Sustainable farming practices
        - Market prices and crop planning
        - Farm economics and profit optimization
        
        PERSONALIZATION GUIDELINES:
        1. Always address the farmer by name ({username})
        2. Use current date and season information to provide timely advice
        3. Reference their specific farm details when available
        4. Scale recommendations to their farm size if known
        5. Consider their soil type for crop and fertilizer suggestions
        6. Factor in their location for climate-specific advice
        7. Even with incomplete profiles, provide valuable seasonal advice
        8. Gently encourage profile completion for better recommendations
        
        RESPONSE STYLE:
        - Personal and friendly tone
        - Practical, actionable advice
        - Season-appropriate recommendations (September = Rabi planning time!)
        - Consider local context when possible
        - Provide specific numbers/quantities when relevant
        - Ask follow-up questions to better understand their needs
        
        SEPTEMBER SPECIFIC GUIDANCE:
        - September is the PERFECT time to plan and prepare for Rabi (winter) crops
        - Rabi crops are typically sown in October-November
        - Popular Rabi crops: Wheat, barley, peas, chickpeas, mustard, onion
        - This is planning and soil preparation time, not active Kharif season
        
        LANGUAGE GUIDELINES:
        - If preferred_language is "ml" (Malayalam), respond in Malayalam language
        - If preferred_language is "en" (English), respond in English language
        - Always maintain agricultural expertise regardless of language
        - Use appropriate agricultural terms in the selected language
        - For Malayalam: Use proper Malayalam script (മലയാളം) and agricultural terminology
        
        If the question is not agriculture-related, politely redirect to farming topics while maintaining the personal connection.
        {personal_context}
        """
        
        # Create context-aware prompt with user message
        language_instruction = ""
        if message.preferred_language == "ml":
            language_instruction = "\n\n[IMPORTANT: Respond in Malayalam language using Malayalam script (മലയാളം). Use proper Malayalam agricultural terms and maintain a helpful, friendly tone in Malayalam.]"
        
        full_prompt = f"{system_prompt}{language_instruction}\n\nFarmer's Question: {message.message}\nPreferred Response Language: {message.preferred_language}\nVoice Input Language: {message.voice_input_language}\n\nPersonalized Response:"
        
        # Generate response using Gemini
        response = model.generate_content(full_prompt)
        
        return {"reply": response.text}
        
    except Exception as e:
        print(f"Chat error: {type(e).__name__} - {e}")
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")


# ------------------------
# Run the app (for local testing)
# ------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8081)
