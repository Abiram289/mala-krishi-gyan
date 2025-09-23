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
from agriculture_data_service import agriculture_data_service

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
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY") or os.getenv("VITE_OPENWEATHER_API_KEY")
GOOGLE_APPLICATION_CREDENTIALS = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")

print(f"🌤️  OpenWeather API Key loaded: {'✅ Yes' if OPENWEATHER_API_KEY else '❌ No'}")
if OPENWEATHER_API_KEY:
    print(f"OpenWeather API Key: {OPENWEATHER_API_KEY[:10]}...{OPENWEATHER_API_KEY[-4:]}")

print(f"🤖 Gemini API Key loaded: {'✅ Yes' if GEMINI_API_KEY else '❌ No'}")
if GEMINI_API_KEY:
    print(f"Gemini API Key: {GEMINI_API_KEY[:10]}...{GEMINI_API_KEY[-4:]}")

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
    conversation_history: list = []  # Previous messages for context

class ProfileUpdate(BaseModel):
    username: str | None = None
    full_name: str | None = None
    avatar_url: str | None = None
    farm_size: float | None = None
    location: str | None = None
    district: str | None = None
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
                "district": profile.get("district"),
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
            "district": None,
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
        if profile_data.district is not None:
            update_data["district"] = profile_data.district
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


def translate_alert_to_malayalam(english_alert):
    """Translate weather alerts to Malayalam"""
    translations = {
        "🌡️ High temperature - Critical irrigation needed": "🌡️ ഉയർന്ന താപനില - ജലസേചനം അത്യാവശ്യം",
        "🌴 Coconut palms need deep watering - check soil moisture": "🌴 തേങ്ങാമരങ്ങൾക്ക് ആഴത്തിലുള്ള നനവ് വേണം - മണ്ണിലെ ഈർപ്പം പരിശോധിക്കുക",
        "🍌 Banana plants - provide shade nets if available": "🍌 വാഴച്ചെടികൾക്ക് നിഴൽവല നൽകുക",
        "🌡️ Cool weather - Excellent for hill crops": "🌡️ തണുത്ത കാലാവസ്ഥ - മലമുകളിലെ കൃഷിക്ക് അനുകൂലം",
        "☁️ Perfect temperature for cardamom & tea cultivation": "☁️ ഏലക്കയ്ക്കും ചായക്കും അനുകൂല താപനില",
        "💧 Very high humidity - Pest alert level HIGH": "💧 വളരെ ഉയർന്ന ആർദ്രത - കീടബാധയുടെ അപകടസാധ്യത ഉയർന്നത്",
        "🪫 Coconut: Check for rhinoceros beetle in crown": "🪫 തേങ്ങ: കിരീടത്തിൽ വണ്ട് പരിശോധിക്കുക",
        "🌳 Rubber: Apply preventive fungicide spray": "🌳 റബ്ബർ: കുമിൾനാശിനി സ്പ്രേ ചെയ്യുക",
        "🌶️ Pepper: Watch for foot rot - improve drainage": "🌶️ കുരുമുളക്: വേരുചീയൽ ശ്രദ്ധിക്കുക - നീർവാർച്ച മെച്ചപ്പെടുത്തുക",
        "🐛 General pest monitoring required - check all crops": "🐛 പൊതുവായ കീട നിരീക്ഷണം - എല്ലാ വിളകളും പരിശോധിക്കുക",
        "💧 High humidity - Favorable for rice growth": "💧 ഉയർന്ന ആർദ്രത - നെല്ല് കൃഷിക്ക് അനുകൂലം",
        "🌧️ Monsoon humidity - Perfect for rice transplanting": "🌧️ മൺസൂൺ ആർദ്രത - നെല്ല് നടീലിന് അനുകൂലം",
        "🍂 Post-monsoon humidity - Good for spice planting": "🍂 മൺസൂണ് ശേഷം - സുഗന്ധവ്യഞ്ജന കൃഷിക്ക് അനുകൂലം",
        "🌧️ Rainy weather - Pause coconut harvesting": "🌧️ മഴക്കാലം - തേങ്ങ പറിക്കൽ നിർത്തുക",
        "🌱 Good time for rice transplanting if flooded fields ready": "🌱 വയലുകൾ തയ്യാറായാൽ നെല്ല് നടാൻ ഉത്തമസമയം",
        "☔ Avoid rubber tapping during heavy rains": "☔ കനത്ത മഴയ്ക്കിടെ റബ്ബർ ചീകൽ ഒഴിവാക്കുക",
        "☀️ Dry weather - Ideal for rubber tapping (morning)": "☀️ വരണ്ട കാലാവസ്ഥ - റബ്ബർ ചീകലിന് അനുകൂലം (രാവിലെ)",
        "🌾 Good for drying harvested spices": "🌾 വിളവെടുത്ത സുഗന്ധവ്യഞ്ജനങ്ങൾ ഉണക്കാൻ നല്ലത്",
        "💨 Strong winds - Secure banana plants & coconut palms": "💨 ശക്തമായ കാറ്റ് - വാഴയും തേങ്ങയും സുരക്ഷിതമാക്കുക",
        "🌊 SW Monsoon - Peak rice planting season": "🌊 തെക്കുപടിഞ്ഞാറൻ മൺസൂൺ - നെല്ല് നടീലിന്റെ പ്രധാന കാലം",
        "🌾 Excellent for Kharif rice in Kuttanad region": "🌾 കുട്ടനാട് പ്രദേശത്ത് ഖറീഫ് നെല്ലിന് അനുകൂലം",
        "🌾 Post-monsoon - Rice harvest time in many areas": "🌾 മൺസൂൺ ശേഷം - പല പ്രദേശങ്ങളിലും നെല്ല് വിളവെടുക്കാൻ സമയം",
        "🌶️ Start pepper planting preparations": "🌶️ കുരുമുളക് നടീലിന് തയ്യാറെടുക്കുക",
        "🌊 NE Monsoon - Second growing season for vegetables": "🌊 വടക്കുകിഴക്കൻ മൺസൂൺ - പച്ചക്കറികളുടെ രണ്ടാം കൃഷിക്കാലം",
        "🌿 Cool weather perfect for cardamom flowering": "🌿 തണുത്ത കാലാവസ്ഥ ഏലക്ക പൂവിടലിന് അനുകൂലം",
        "☀️ Dry season - Focus on irrigation management": "☀️ വരണ്ട കാലം - ജലസേചന നിയന്ത്രണത്തിൽ ശ്രദ്ധിക്കുക",
        "🥥 Peak coconut harvesting season": "🥥 തേങ്ങ വിളവെടുപ്പിന്റെ പ്രധാന കാലം",
        "🔥 Hot season - Prepare land for monsoon crops": "🔥 ചൂടുകാലം - മൺസൂൺ വിളകൾക്കായി ഭൂമി തയ്യാറാക്കുക",
        "🌡️ Apply mulching to retain soil moisture": "🌡️ മണ്ണിലെ ഈർപ്പം നിലനിർത്താൻ പുതച്ചിൽ നൽകുക",
        "Weather data unavailable - using fallback data": "കാലാവസ്ഥാ വിവരങ്ങൾ ലഭ്യമല്ല - കരുതൽ വിവരങ്ങൾ ഉപയോഗിക്കുന്നു"
    }
    
    # Try to find exact match first
    if english_alert in translations:
        return translations[english_alert]
    
    # Try to find partial matches for dynamic content (like crop names)
    for english_key, malayalam_value in translations.items():
        if english_key.split(' - ')[0] in english_alert:
            # Handle dynamic parts like crop names
            return malayalam_value
    
    # If no translation found, return original
    return english_alert

def get_current_season(month):
    """Determine Kerala agricultural season based on dual monsoon pattern"""
    if month in [6, 7, 8, 9]:  # June-September
        return "Southwest Monsoon season - Main rice planting, coconut care"
    elif month in [10, 11, 12]:  # October-December
        return "Northeast Monsoon season - Second crops, spice planting"
    elif month in [1, 2, 3]:  # January-March
        return "Post-monsoon dry season - Harvest time, coconut peak harvest"
    elif month in [4, 5]:  # April-May
        return "Pre-monsoon hot season - Land preparation, water conservation"
    else:
        return "Transitional period"

def get_kerala_crop_calendar(month, district=None):
    """Get Kerala-specific crop calendar based on dual monsoon system"""
    from datetime import datetime
    
    # Kerala monsoon seasons
    if month in [6, 7, 8, 9]:  # June-September
        season = "Southwest Monsoon"
        rainfall_period = "Main rainy season (75% annual rainfall)"
    elif month in [10, 11, 12]:  # October-December  
        season = "Northeast Monsoon"
        rainfall_period = "Secondary rainy season (20% annual rainfall)"
    elif month in [1, 2, 3]:  # January-March
        season = "Post-monsoon Dry"
        rainfall_period = "Dry harvest season"
    else:  # April-May
        season = "Pre-monsoon Hot"
        rainfall_period = "Hot dry season - land preparation"
    
    # Base crop predictions for Kerala
    predictions = []
    weather_guidance = []
    monthly_schedule = {"weeks": []}
    
    month_names = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ]
    
    current_month_name = month_names[month - 1]
    
    # Season-specific crop activities
    if month in [6, 7, 8, 9]:  # SW Monsoon - Main growing season
        predictions = [
            {
                "id": "rice_sw",
                "crop": "Rice",
                "stage": "Kharif Season",
                "action": "Transplant Seedlings",
                "timing": f"{current_month_name} 15-25",
                "priority": "high",
                "description": "Southwest monsoon ideal for Kharif rice transplanting in flooded paddies",
                "icon": "sprout"
            },
            {
                "id": "coconut_sw",
                "crop": "Coconut",
                "stage": "Growth Period", 
                "action": "Drainage & Pest Control",
                "timing": f"{current_month_name} 10-20",
                "priority": "high",
                "description": "High humidity increases rhinoceros beetle risk - check and treat",
                "icon": "bug"
            },
            {
                "id": "pepper_sw",
                "crop": "Pepper",
                "stage": "Planting Season",
                "action": "Plant New Vines",
                "timing": f"{current_month_name} 5-15",
                "priority": "medium",
                "description": "Monsoon moisture perfect for pepper vine establishment",
                "icon": "sprout"
            },
            {
                "id": "cardamom_sw",
                "crop": "Cardamom",
                "stage": "Planting",
                "action": "Transplant Seedlings",
                "timing": f"{current_month_name} 1-15",
                "priority": "medium",
                "description": "Monsoon season ideal for cardamom in shaded hill areas",
                "icon": "sprout"
            }
        ]
        
        # Generate current-aware weather guidance with realistic periods
        from datetime import datetime, timedelta
        import calendar
        
        current_date = datetime.now()
        current_day = current_date.day
        days_in_month = calendar.monthrange(current_date.year, month)[1]
        
        # Create 3 dynamic periods based on current date and month length
        period1_end = min(days_in_month, max(10, current_day + 3))  # At least next 3 days or day 10
        period2_start = period1_end + 1
        period2_end = min(days_in_month, period1_end + 10)
        period3_start = period2_end + 1
        
        weather_guidance = [
            {
                "date": f"{current_month_name} {max(1, current_day)}-{period1_end}",
                "condition": "Heavy Monsoon Rains" if current_day <= period1_end else "Recent Heavy Rains",
                "impact": "Perfect for rice planting, ensure proper field drainage for coconut groves",
                "icon": "cloud-rain"
            },
            {
                "date": f"{current_month_name} {period2_start}-{period2_end}",
                "condition": "Consistent Southwest Monsoon",
                "impact": "Ideal for spice planting, monitor for increased pest activity due to humidity",
                "icon": "droplets"
            },
            {
                "date": f"{current_month_name} {period3_start}-{days_in_month}",
                "condition": "Moderate Monsoon Showers",
                "impact": "Good for transplanting operations, avoid over-watering established crops",
                "icon": "cloud-rain"
            }
        ]
    
    elif month in [10, 11, 12]:  # NE Monsoon - Second crop season
        predictions = [
            {
                "id": "rice_ne",
                "crop": "Rice",
                "stage": "Rabi Season",
                "action": "Second Crop Planting",
                "timing": f"{current_month_name} 1-15",
                "priority": "medium",
                "description": "Northeast monsoon supports Rabi rice in suitable areas",
                "icon": "sprout"
            },
            {
                "id": "vegetables_ne",
                "crop": "Vegetables",
                "stage": "Winter Growing",
                "action": "Plant Leafy Greens",
                "timing": f"{current_month_name} 5-20",
                "priority": "high",
                "description": "Cool weather perfect for amaranth, spinach, radish",
                "icon": "sprout"
            },
            {
                "id": "spices_ne",
                "crop": "Spices",
                "stage": "Planting",
                "action": "Plant Turmeric & Ginger",
                "timing": f"{current_month_name} 10-25",
                "priority": "medium",
                "description": "NE monsoon moisture good for rhizome planting",
                "icon": "sprout"
            },
            {
                "id": "coconut_ne",
                "crop": "Coconut",
                "stage": "Maintenance",
                "action": "Apply Organic Manure",
                "timing": f"{current_month_name} 15-30",
                "priority": "medium",
                "description": "Post-monsoon nutrition boost for next season yield",
                "icon": "droplets"
            }
        ]
        
        # NE Monsoon - dynamic weather guidance
        current_date = datetime.now()
        current_day = current_date.day
        days_in_month = calendar.monthrange(current_date.year, month)[1]
        
        period1_end = min(days_in_month, max(12, current_day + 5))
        period2_start = period1_end + 1
        period2_end = min(days_in_month, period1_end + 8)
        period3_start = period2_end + 1
        
        weather_guidance = [
            {
                "date": f"{current_month_name} {max(1, current_day)}-{period1_end}",
                "condition": "Northeast Monsoon Active", 
                "impact": "Good for second crops, less intense rainfall than SW monsoon",
                "icon": "droplets"
            },
            {
                "date": f"{current_month_name} {period2_start}-{period2_end}",
                "condition": "Scattered NE Showers",
                "impact": "Perfect for vegetable planting, moderate watering needed",
                "icon": "cloud-rain"
            },
            {
                "date": f"{current_month_name} {period3_start}-{days_in_month}",
                "condition": "Clearing Weather Periods",
                "impact": "Good for land preparation and harvesting late Kharif crops",
                "icon": "sun"
            }
        ]
    
    elif month in [1, 2, 3]:  # Post-monsoon dry season - Harvest time
        predictions = [
            {
                "id": "coconut_harvest",
                "crop": "Coconut",
                "stage": "Peak Harvest",
                "action": "Harvest Mature Nuts",
                "timing": f"{current_month_name} 1-30",
                "priority": "high",
                "description": "Dry season - peak coconut harvest period with good quality",
                "icon": "scissors"
            },
            {
                "id": "pepper_harvest",
                "crop": "Pepper",
                "stage": "Harvest",
                "action": "Harvest Peppercorns",
                "timing": f"{current_month_name} 10-25",
                "priority": "high",
                "description": "Dry weather perfect for pepper harvest and drying",
                "icon": "scissors"
            },
            {
                "id": "cardamom_harvest",
                "crop": "Cardamom", 
                "stage": "Harvest",
                "action": "Harvest Pods",
                "timing": f"{current_month_name} 5-20",
                "priority": "medium",
                "description": "Hand-pick mature cardamom pods when 3/4 mature",
                "icon": "scissors"
            },
            {
                "id": "rubber_tapping",
                "crop": "Rubber",
                "stage": "Peak Tapping",
                "action": "Daily Latex Collection",
                "timing": f"{current_month_name} 1-30",
                "priority": "high",
                "description": "Dry season ideal for rubber tapping - best latex flow",
                "icon": "droplets"
            }
        ]
        
        # Dry season - dynamic weather guidance
        current_date = datetime.now()
        current_day = current_date.day
        days_in_month = calendar.monthrange(current_date.year, month)[1]
        
        period1_end = min(days_in_month, max(10, current_day + 4))
        period2_start = period1_end + 1
        period2_end = min(days_in_month, period1_end + 12)
        period3_start = period2_end + 1
        
        weather_guidance = [
            {
                "date": f"{current_month_name} {max(1, current_day)}-{period1_end}",
                "condition": "Clear Dry Weather",
                "impact": "Perfect for harvesting and sun-drying spices and coconut",
                "icon": "sun"
            },
            {
                "date": f"{current_month_name} {period2_start}-{period2_end}", 
                "condition": "Hot Sunny Days",
                "impact": "Peak rubber tapping season - ensure adequate irrigation for all crops",
                "icon": "sun"
            },
            {
                "date": f"{current_month_name} {period3_start}-{days_in_month}",
                "condition": "Dry Season Peak",
                "impact": "Focus on water conservation, complete major harvesting activities",
                "icon": "sun"
            }
        ]
    
    else:  # April-May - Pre-monsoon hot season
        predictions = [
            {
                "id": "land_prep",
                "crop": "General",
                "stage": "Preparation",
                "action": "Land Preparation",
                "timing": f"{current_month_name} 1-20",
                "priority": "high",
                "description": "Prepare fields for monsoon planting - plowing, organic matter",
                "icon": "sprout"
            },
            {
                "id": "coconut_summer",
                "crop": "Coconut",
                "stage": "Summer Care",
                "action": "Deep Irrigation",
                "timing": f"{current_month_name} 5-25",
                "priority": "high",
                "description": "Hot season - increase watering frequency for coconut",
                "icon": "droplets"
            },
            {
                "id": "rubber_rest",
                "crop": "Rubber",
                "stage": "Rest Period",
                "action": "Reduce Tapping",
                "timing": f"{current_month_name} 15-30",
                "priority": "medium",
                "description": "Hot season - reduce tapping frequency, tree maintenance",
                "icon": "scissors"
            },
            {
                "id": "water_conservation",
                "crop": "General",
                "stage": "Conservation",
                "action": "Water Management",
                "timing": f"{current_month_name} 1-30",
                "priority": "high",
                "description": "Install drip irrigation, mulching, rainwater harvesting",
                "icon": "droplets"
            }
        ]
        
        # Pre-monsoon hot season - dynamic weather guidance
        current_date = datetime.now()
        current_day = current_date.day
        days_in_month = calendar.monthrange(current_date.year, month)[1]
        
        period1_end = min(days_in_month, max(8, current_day + 3))
        period2_start = period1_end + 1
        period2_end = min(days_in_month, period1_end + 12)
        period3_start = period2_end + 1
        
        weather_guidance = [
            {
                "date": f"{current_month_name} {max(1, current_day)}-{period1_end}",
                "condition": "Hot & Dry Conditions",
                "impact": "Increase irrigation frequency, prepare fields for upcoming monsoon",
                "icon": "sun"
            },
            {
                "date": f"{current_month_name} {period2_start}-{period2_end}",
                "condition": "Peak Summer Heat",
                "impact": "Critical irrigation period - provide shade nets for sensitive crops",
                "icon": "sun"
            },
            {
                "date": f"{current_month_name} {period3_start}-{days_in_month}",
                "condition": "Pre-monsoon Preparation",
                "impact": "Complete final land preparation, install drainage before monsoon onset",
                "icon": "sun"
            }
        ]
    
    # Generate weekly schedule based on season
    weeks = []
    for week_num in range(1, 5):
        week_start = (week_num - 1) * 7 + 1
        week_end = min(week_num * 7, 30)
        week_name = f"Week {week_num} ({current_month_name} {week_start}-{week_end})"
        
        activities = []
        if month in [6, 7, 8, 9]:  # SW Monsoon
            if week_num == 1:
                activities = [
                    {"text": "Prepare rice nursery beds", "icon": "sprout"},
                    {"text": "Check drainage in coconut groves", "icon": "droplets"}
                ]
            elif week_num == 2:
                activities = [
                    {"text": "Transplant rice seedlings", "icon": "sprout"},
                    {"text": "Apply preventive pest control", "icon": "bug"}
                ]
            elif week_num == 3:
                activities = [
                    {"text": "Plant pepper vines", "icon": "sprout"},
                    {"text": "Monitor high-humidity pests", "icon": "bug"}
                ]
            else:
                activities = [
                    {"text": "Weed management in rice fields", "icon": "scissors"},
                    {"text": "Cardamom plantation care", "icon": "droplets"}
                ]
        elif month in [10, 11, 12]:  # NE Monsoon
            if week_num == 1:
                activities = [
                    {"text": "Plant winter vegetables", "icon": "sprout"},
                    {"text": "Second crop rice preparation", "icon": "sprout"}
                ]
            elif week_num == 2:
                activities = [
                    {"text": "Harvest late Kharif rice", "icon": "scissors"},
                    {"text": "Plant turmeric rhizomes", "icon": "sprout"}
                ]
            elif week_num == 3:
                activities = [
                    {"text": "Apply organic manure to coconut", "icon": "droplets"},
                    {"text": "Ginger planting", "icon": "sprout"}
                ]
            else:
                activities = [
                    {"text": "Leafy vegetable harvesting", "icon": "scissors"},
                    {"text": "Land preparation for next season", "icon": "sprout"}
                ]
        elif month in [1, 2, 3]:  # Dry season
            if week_num == 1:
                activities = [
                    {"text": "Peak coconut harvesting", "icon": "scissors"},
                    {"text": "Daily rubber tapping", "icon": "droplets"}
                ]
            elif week_num == 2:
                activities = [
                    {"text": "Harvest and dry pepper", "icon": "scissors"},
                    {"text": "Cardamom pod collection", "icon": "scissors"}
                ]
            elif week_num == 3:
                activities = [
                    {"text": "Spice processing and storage", "icon": "scissors"},
                    {"text": "Post-harvest field cleaning", "icon": "sprout"}
                ]
            else:
                activities = [
                    {"text": "Tree pruning and maintenance", "icon": "scissors"},
                    {"text": "Irrigation system check", "icon": "droplets"}
                ]
        else:  # Pre-monsoon hot season
            if week_num == 1:
                activities = [
                    {"text": "Deep plowing of fields", "icon": "sprout"},
                    {"text": "Install irrigation systems", "icon": "droplets"}
                ]
            elif week_num == 2:
                activities = [
                    {"text": "Apply organic compost", "icon": "droplets"},
                    {"text": "Repair farm infrastructure", "icon": "sprout"}
                ]
            elif week_num == 3:
                activities = [
                    {"text": "Water conservation measures", "icon": "droplets"},
                    {"text": "Summer pruning of trees", "icon": "scissors"}
                ]
            else:
                activities = [
                    {"text": "Final monsoon preparations", "icon": "sprout"},
                    {"text": "Seedling nursery setup", "icon": "sprout"}
                ]
        
        weeks.append({
            "title": week_name,
            "activities": activities
        })
    
    monthly_schedule["weeks"] = weeks
    
    # Add district-specific recommendations if available
    district_note = ""
    if district:
        district_advice = {
            "Thiruvananthapuram": "Coastal climate - focus on coconut, cashew. Watch for saltwater effects.",
            "Kollam": "Cashew belt - ideal for cashew processing, coconut cultivation.",
            "Pathanamthitta": "Spice hills - perfect for pepper, cardamom in elevated areas.",
            "Alappuzha": "Rice bowl - Kuttanad paddy cultivation, backwater farming.",
            "Kottayam": "Rubber hub - major rubber tapping, spice cultivation.",
            "Idukki": "High altitude - tea, coffee, cardamom in cool climate.",
            "Ernakulam": "Commercial zone - mixed farming, urban agriculture.",
            "Thrissur": "Agricultural center - rice, coconut, banana cultivation.",
            "Palakkad": "Rice granary - paddy fields, coconut, vegetables.",
            "Malappuram": "Diverse farming - coconut, arecanut, spices.",
            "Kozhikode": "Spice coast - pepper, coconut, banana cultivation.",
            "Wayanad": "Coffee hills - coffee, pepper, banana in highlands.",
            "Kannur": "Coconut region - major coconut production zone.",
            "Kasaragod": "Northern border - coconut, cashew, arecanut."
        }
        district_note = district_advice.get(district, f"District-specific advice for {district}")
    
    return {
        "season": season,
        "rainfall_period": rainfall_period,
        "month": current_month_name,
        "predictions": predictions,
        "weather_guidance": weather_guidance,
        "monthly_schedule": monthly_schedule,
        "district_note": district_note
    }

@app.get("/crop-calendar")
def get_crop_calendar(month: int = None, user=Depends(get_current_user)):
    """Get Kerala-specific crop calendar based on monsoon patterns and user's district with data insights"""
    try:
        from datetime import datetime
        
        # Use current month if not specified
        if month is None:
            month = datetime.now().month
        
        # Validate month parameter
        if not (1 <= month <= 12):
            raise HTTPException(status_code=400, detail="Month must be between 1 and 12")
        
        # Get user profile for district-specific advice
        district = None
        try:
            profile_response = supabase.table("user_profiles").select("district").eq("user_id", user.id).execute()
            if profile_response.data:
                district = profile_response.data[0].get("district")
        except Exception as e:
            print(f"Could not fetch user district: {e}")
        
        # Get Kerala-specific crop calendar
        calendar_data = get_kerala_crop_calendar(month, district)
        
        # Enhance with agriculture data insights
        if district:
            # Get data-driven seasonal recommendations
            seasonal_data = agriculture_data_service.get_seasonal_calendar(month, district)
            if "error" not in seasonal_data:
                calendar_data["data_driven_recommendations"] = {
                    "suitable_crops_count": seasonal_data.get("total_suitable_crops", 0),
                    "major_district_crops": [c["crop"] for c in seasonal_data.get("major_district_crops", [])[:5]],
                    "intensive_cultivation_crops": [c["crop"] for c in seasonal_data.get("intensive_cultivation_crops", [])[:5]],
                    "categories": list(seasonal_data.get("calendar_by_category", {}).keys())
                }
            
            # Get historical productivity insights
            historical_insights = []
            major_crops = ["Rice", "Coconut", "Rubber", "Pepper", "Cardamom"]
            for crop in major_crops:
                productivity_data = agriculture_data_service.get_historical_productivity_data(crop, district, years=3)
                if "error" not in productivity_data:
                    historical_insights.append({
                        "crop": crop,
                        "avg_productivity": productivity_data.get("average_productivity", 0),
                        "weather_trend": productivity_data.get("weather_impact_trends", [])[-1:] if productivity_data.get("weather_impact_trends") else []
                    })
            
            calendar_data["historical_insights"] = historical_insights[:3]  # Top 3 crops
            
            # Get smart recommendations
            smart_recs = agriculture_data_service.get_smart_recommendations(district, month)
            if "error" not in smart_recs:
                calendar_data["smart_recommendations"] = {
                    "seasonal_planting_opportunities": len(smart_recs.get("seasonal_planting", [])),
                    "district_advantages": [adv["category"] for adv in smart_recs.get("district_advantages", [])],
                    "high_productivity_crops": [insight["crop"] for insight in smart_recs.get("productivity_insights", [])[:3]]
                }
        
        return calendar_data
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Crop calendar error: {type(e).__name__} - {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get crop calendar: {str(e)}")

@app.get("/weather")
def get_weather(lat: float = None, lon: float = None, language: str = "en", user=Depends(get_current_user)):
    """Get weather data for user's location or coordinates with language-specific alerts."""
    try:
        # Get user profile for location if coordinates not provided
        if lat is None or lon is None:
            # Get user profile from database
            profile_response = supabase.table("user_profiles").select("*").eq("user_id", user.id).execute()
            
            if profile_response.data:
                profile = profile_response.data[0]
                user_location = profile.get("location")
                
                if user_location:
                    # Parse coordinates from formats like:
                    # "Chengalpattu, Tamil Nadu, India (12.9394, 80.1729)"
                    # or "12.9394, 80.1729"
                    try:
                        # Look for coordinates in parentheses first
                        if '(' in user_location and ')' in user_location:
                            coord_part = user_location.split('(')[1].split(')')[0]
                        else:
                            coord_part = user_location
                        
                        coords = coord_part.split(',')
                        if len(coords) == 2:
                            lat = float(coords[0].strip())
                            lon = float(coords[1].strip())
                            print(f"Weather: Using coordinates from profile: {lat}, {lon}")
                    except Exception as e:
                        print(f"Weather: Failed to parse coordinates from '{user_location}': {e}")
            
            # Default to Kochi, Kerala if no coordinates available
            if lat is None or lon is None:
                lat, lon = 9.9312, 76.2673
                print(f"Weather: Using default coordinates: {lat}, {lon}")
        
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
        
        # Generate Kerala-specific farming alerts with data context
        alerts = []
        temp = round(data["main"]["temp"])
        humidity = data["main"]["humidity"]
        wind_speed = round(data["wind"]["speed"] * 3.6)  # Convert m/s to km/h
        
        # Get user's district for context
        user_district = None
        try:
            profile_response = supabase.table("user_profiles").select("district").eq("user_id", user.id).execute()
            if profile_response.data:
                user_district = profile_response.data[0].get("district")
        except:
            pass
        
        # Get data-driven context for alerts
        from datetime import datetime
        current_month = datetime.now().month
        data_context = agriculture_data_service.get_ai_context_for_query(
            f"weather alert for {user_district or 'Kerala'}", 
            user_district, 
            current_month
        )
        
        # Enhanced temperature-based alerts with data insights
        if temp > 35:
            alerts.append("🌡️ High temperature - Critical irrigation needed")
            if user_district:
                # Get district-specific heat-sensitive crops
                district_data = agriculture_data_service.get_crop_recommendations_for_district(user_district)
                if "error" not in district_data:
                    plantation_crops = district_data.get("recommendations", {}).get("Plantation", [])
                    if plantation_crops:
                        heat_sensitive = [c["crop"] for c in plantation_crops[:2]]
                        alerts.append(f"☀️ Increase watering frequency for {', '.join(heat_sensitive)}")
            alerts.append("🌴 Coconut palms need deep watering - check soil moisture")
            alerts.append("🍌 Banana plants - provide shade nets if available")
        elif temp < 20:
            alerts.append("🌡️ Cool weather - Excellent for hill crops")
            if user_district in ["Idukki", "Wayanad"]:
                alerts.append("☁️ Perfect temperature for cardamom & tea cultivation")
        
        # Enhanced humidity-based alerts with data context
        if humidity > 85:
            alerts.append("💧 Very high humidity - Pest alert level HIGH")
            
            # District-specific high humidity alerts
            if user_district:
                district_data = agriculture_data_service.get_crop_recommendations_for_district(user_district)
                if "error" not in district_data:
                    # Get plantation crops for beetle/disease warnings
                    plantation_crops = district_data.get("recommendations", {}).get("Plantation", [])
                    spice_crops = district_data.get("recommendations", {}).get("Spice", [])
                    
                    if plantation_crops:
                        coconut_present = any("coconut" in c["crop"].lower() for c in plantation_crops)
                        rubber_present = any("rubber" in c["crop"].lower() for c in plantation_crops)
                        
                        if coconut_present:
                            alerts.append("🪫 Coconut: Check for rhinoceros beetle in crown")
                        if rubber_present:
                            alerts.append("🌳 Rubber: Apply preventive fungicide spray")
                    
                    if spice_crops:
                        pepper_present = any("pepper" in c["crop"].lower() for c in spice_crops)
                        if pepper_present:
                            alerts.append("🌶️ Pepper: Watch for foot rot - improve drainage")
            
            alerts.append("🐛 General pest monitoring required - check all crops")
            
        elif humidity > 75:
            alerts.append("💧 High humidity - Favorable for rice growth")
            
            # Add seasonal context for humidity
            if current_month in [6, 7, 8, 9]:
                alerts.append("🌧️ Monsoon humidity - Perfect for rice transplanting")
            elif current_month in [10, 11, 12]:
                alerts.append("🍂 Post-monsoon humidity - Good for spice planting")
        
        # Rain-based alerts for Kerala agriculture
        if condition == "rainy":
            alerts.append("🌧️ Rainy weather - Pause coconut harvesting")
            alerts.append("🌱 Good time for rice transplanting if flooded fields ready")
            alerts.append("☔ Avoid rubber tapping during heavy rains")
        elif condition == "sunny" and humidity < 60:
            alerts.append("☀️ Dry weather - Ideal for rubber tapping (morning)")
            alerts.append("🌾 Good for drying harvested spices")
        
        # Wind-based alerts
        if wind_speed > 25:
            alerts.append("💨 Strong winds - Secure banana plants & coconut palms")
        
        # Month-specific Kerala agricultural advice
        # datetime already imported above
        
        if current_month in [6, 7, 8]:  # Southwest monsoon
            alerts.append("🌊 SW Monsoon - Peak rice planting season")
            if condition == "rainy":
                alerts.append("🌾 Excellent for Kharif rice in Kuttanad region")
        elif current_month in [9, 10]:
            alerts.append("🌾 Post-monsoon - Rice harvest time in many areas")
            alerts.append("🌶️ Start pepper planting preparations")
        elif current_month in [10, 11, 12]:  # Northeast monsoon
            alerts.append("🌊 NE Monsoon - Second growing season for vegetables")
            if temp < 28:
                alerts.append("🌿 Cool weather perfect for cardamom flowering")
        elif current_month in [1, 2, 3]:  # Dry season
            alerts.append("☀️ Dry season - Focus on irrigation management")
            alerts.append("🥥 Peak coconut harvesting season")
        elif current_month in [4, 5]:  # Pre-monsoon
            alerts.append("🔥 Hot season - Prepare land for monsoon crops")
            if temp > 32:
                alerts.append("🌡️ Apply mulching to retain soil moisture")
        
        # Use user's actual location name if available, otherwise use API location
        display_location = f"{data['name']}, {data['sys']['country']}"
        if lat != 9.9312 or lon != 76.2673:  # Not default coordinates
            # Try to get user's location name from profile
            try:
                profile_response = supabase.table("user_profiles").select("location").eq("user_id", user.id).execute()
                if profile_response.data:
                    user_location = profile_response.data[0].get("location")
                    if user_location and '(' in user_location:
                        # Extract city name from "Chengalpattu, Tamil Nadu, India (12.9394, 80.1729)"
                        display_location = user_location.split('(')[0].strip()
            except:
                pass  # Use API location as fallback
        
        # Translate alerts to Malayalam if requested
        if language == "ml":
            translated_alerts = []
            for alert in alerts:
                translated_alerts.append(translate_alert_to_malayalam(alert))
            alerts = translated_alerts
        
        return {
            "temperature": temp,
            "humidity": humidity,
            "condition": condition,
            "windSpeed": round(data["wind"]["speed"] * 3.6),  # Convert m/s to km/h
            "location": display_location,
            "description": data["weather"][0]["description"],
            "alerts": alerts
        }
        
    except Exception as e:
        print(f"Weather error: {type(e).__name__} - {e}")
        # Return fallback data
        fallback_alert = "Weather data unavailable - using fallback data"
        if language == "ml":
            fallback_alert = translate_alert_to_malayalam(fallback_alert)
        
        return {
            "temperature": 28,
            "humidity": 75,
            "condition": "cloudy",
            "windSpeed": 12,
            "location": "Kochi, IN",
            "description": "Partly cloudy",
            "alerts": [fallback_alert]
        }


# ------------------------
# Agriculture Data API Endpoints
# ------------------------
@app.get("/agriculture/district-recommendations/{district}")
def get_district_crop_recommendations(district: str, season: str = None, user=Depends(get_current_user)):
    """Get crop recommendations for a specific district."""
    try:
        recommendations = agriculture_data_service.get_crop_recommendations_for_district(district, season)
        if "error" in recommendations:
            raise HTTPException(status_code=404, detail=recommendations["error"])
        return recommendations
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting recommendations: {str(e)}")

@app.get("/agriculture/productivity/{crop}")
def get_crop_productivity_data(crop: str, district: str = None, years: int = 5, user=Depends(get_current_user)):
    """Get historical productivity data for a crop."""
    try:
        # Get user's district if not specified
        if not district:
            try:
                profile_response = supabase.table("user_profiles").select("district").eq("user_id", user.id).execute()
                if profile_response.data:
                    district = profile_response.data[0].get("district")
            except:
                pass
        
        productivity_data = agriculture_data_service.get_historical_productivity_data(crop, district, years)
        if "error" in productivity_data:
            raise HTTPException(status_code=404, detail=productivity_data["error"])
        return productivity_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting productivity data: {str(e)}")

@app.get("/agriculture/seasonal-calendar")
def get_agriculture_seasonal_calendar(month: int = None, district: str = None, user=Depends(get_current_user)):
    """Get seasonal planting calendar based on comprehensive data."""
    try:
        from datetime import datetime
        
        if month is None:
            month = datetime.now().month
        
        # Get user's district if not specified
        if not district:
            try:
                profile_response = supabase.table("user_profiles").select("district").eq("user_id", user.id).execute()
                if profile_response.data:
                    district = profile_response.data[0].get("district")
            except:
                pass
        
        calendar_data = agriculture_data_service.get_seasonal_calendar(month, district)
        if "error" in calendar_data:
            raise HTTPException(status_code=404, detail=calendar_data["error"])
        return calendar_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting seasonal calendar: {str(e)}")

@app.get("/agriculture/weather-impact-analysis")
def get_weather_impact_analysis(years: str = None, user=Depends(get_current_user)):
    """Get weather impact analysis for specified years."""
    try:
        year_list = None
        if years:
            try:
                year_list = [int(y.strip()) for y in years.split(',')]
            except:
                raise HTTPException(status_code=400, detail="Invalid years format. Use comma-separated years like '2021,2022,2023'")
        
        analysis = agriculture_data_service.get_weather_impact_analysis(year_list)
        if "error" in analysis:
            raise HTTPException(status_code=404, detail=analysis["error"])
        return analysis
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting weather analysis: {str(e)}")

@app.get("/agriculture/district-specialization")
def get_district_specialization_analysis(user=Depends(get_current_user)):
    """Get district specialization analysis."""
    try:
        analysis = agriculture_data_service.get_district_specialization_analysis()
        if "error" in analysis:
            raise HTTPException(status_code=404, detail=analysis["error"])
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting specialization analysis: {str(e)}")

@app.get("/agriculture/smart-recommendations")
def get_smart_agricultural_recommendations(district: str = None, month: int = None, user=Depends(get_current_user)):
    """Get intelligent recommendations based on all available data."""
    try:
        from datetime import datetime
        
        # Get user profile if district/month not specified
        if not district or month is None:
            try:
                profile_response = supabase.table("user_profiles").select("*").eq("user_id", user.id).execute()
                if profile_response.data:
                    profile = profile_response.data[0]
                    if not district:
                        district = profile.get("district")
            except:
                pass
        
        if not district:
            raise HTTPException(status_code=400, detail="District is required. Please complete your profile.")
        
        if month is None:
            month = datetime.now().month
        
        recommendations = agriculture_data_service.get_smart_recommendations(district, month)
        if "error" in recommendations:
            raise HTTPException(status_code=404, detail=recommendations["error"])
        return recommendations
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating recommendations: {str(e)}")


@app.post("/chat")
def chat_with_ai(message: ChatMessage, user=Depends(get_current_user)):
    """Context-aware chat endpoint using Gemini AI with user profile integration."""
    try:
        # Get user profile information from database for context
        profile_response = supabase.table("user_profiles").select("*").eq("user_id", user.id).execute()
        
        # Get username from auth metadata as fallback
        user_meta = user.user_metadata or {}
        username = user_meta.get("username") or user_meta.get("full_name") or "Farmer"
        
        # Extract profile details from database
        if profile_response.data:
            profile = profile_response.data[0]
            farm_size = profile.get("farm_size")
            location = profile.get("location")
            district = profile.get("district")
            soil_type = profile.get("soil_type")
            full_name = profile.get("full_name")
            if full_name:
                username = full_name  # Use full name from profile if available
        else:
            # No profile exists yet
            farm_size = None
            location = None
            district = None
            soil_type = None
        
        # Get current date for seasonal awareness
        from datetime import datetime
        current_date = datetime.now()
        current_month = current_date.strftime("%B")
        current_season = get_current_season(current_date.month)
        
        # Get current weather data for contextual advice
        weather_data = None
        try:
            # Use the same weather logic as the weather endpoint
            lat = None
            lon = None
            if profile_response.data:
                profile = profile_response.data[0]
                user_location = profile.get("location")
                if user_location and '(' in user_location and ')' in user_location:
                    coord_part = user_location.split('(')[1].split(')')[0]
                    coords = coord_part.split(',')
                    if len(coords) == 2:
                        lat = float(coords[0].strip())
                        lon = float(coords[1].strip())
            
            if lat is None or lon is None:
                lat, lon = 9.9312, 76.2673  # Default to Kochi
                
            if OPENWEATHER_API_KEY:
                import requests
                response = requests.get(
                    f"https://api.openweathermap.org/data/2.5/weather",
                    params={"lat": lat, "lon": lon, "appid": OPENWEATHER_API_KEY, "units": "metric"}
                )
                if response.status_code == 200:
                    data = response.json()
                    weather_main = data["weather"][0]["main"].lower()
                    condition = "rainy" if "rain" in weather_main else ("sunny" if "clear" in weather_main else "cloudy")
                    weather_data = {
                        "temperature": round(data["main"]["temp"]),
                        "humidity": data["main"]["humidity"],
                        "condition": condition,
                        "description": data["weather"][0]["description"]
                    }
        except Exception as e:
            print(f"Weather fetch for AI context failed: {e}")
            
        # Get recent activities for context
        recent_activities = []
        try:
            activities_response = supabase.table("activities").select("*").eq("user_id", user.id).order("date", desc=True).limit(5).execute()
            if activities_response.data:
                recent_activities = activities_response.data
        except Exception as e:
            print(f"Activities fetch for AI context failed: {e}")
        
        # Initialize Gemini model
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Build personalized context with weather and activity data
        personal_context = f"\n\nCURRENT CONTEXT:\n"
        personal_context += f"- Current Date: {current_date.strftime('%B %d, %Y')}\n"
        personal_context += f"- Agricultural Season: {current_season}\n"
        personal_context += f"- Month: {current_month} (Consider seasonal planting cycles)\n"
        
        # Add weather context for better farming advice
        if weather_data:
            personal_context += f"\n\nCURRENT WEATHER:\n"
            personal_context += f"- Temperature: {weather_data['temperature']}°C\n"
            personal_context += f"- Humidity: {weather_data['humidity']}%\n"
            personal_context += f"- Condition: {weather_data['condition']} ({weather_data['description']})\n"
            
            # Add weather-based advice context
            if weather_data['temperature'] > 35:
                personal_context += f"- Advisory: High temperature - consider irrigation advice\n"
            if weather_data['humidity'] > 80:
                personal_context += f"- Advisory: High humidity - pest activity may increase\n"
            if weather_data['condition'] == 'rainy':
                personal_context += f"- Advisory: Rainy weather - consider postponing outdoor activities\n"
        
        # Add recent activities context
        if recent_activities:
            personal_context += f"\n\nRECENT FARM ACTIVITIES:\n"
            for activity in recent_activities[:3]:  # Last 3 activities
                activity_date = activity.get('date', 'Unknown date')
                activity_title = activity.get('title', 'Unknown activity')
                activity_type = activity.get('type', 'general')
                activity_status = activity.get('status', 'pending')
                personal_context += f"- {activity_date}: {activity_title} ({activity_type}) - {activity_status}\n"
        
        personal_context += f"\n\nFARMER PROFILE:\n"
        personal_context += f"- Farmer Name: {username}\n"
        
        if farm_size:
            personal_context += f"- Farm Size: {farm_size} acres\n"
        if location:
            personal_context += f"- Location: {location}\n"
        if district:
            personal_context += f"- Kerala District: {district}\n"
        if soil_type:
            personal_context += f"- Soil Type: {soil_type}\n"
            
        if not any([farm_size, location, district, soil_type]):
            personal_context += "- Profile: Incomplete (gently encourage completing profile, but provide general seasonal advice)\n"
        
        # Add comprehensive agriculture data context
        personal_context += f"\n\nKERALA AGRICULTURAL DATA INTELLIGENCE:\n"
        
        # Add real data context from CSV files
        data_context = agriculture_data_service.get_ai_context_for_query(message.message, district, current_date.month)
        if data_context:
            personal_context += data_context
        
        personal_context += f"\n\n🌴 MAJOR KERALA CROPS & SEASONS (Data-backed):\n"
        personal_context += f"- Coconut: Year-round, peak harvest Jan-Mar, avg productivity 7000+ nuts/ha\n"
        personal_context += f"- Rice: Kharif (Jun-Oct), Rabi (Nov-Mar), Mundakan (Apr-Aug), avg 3.2 tonnes/ha\n"
        personal_context += f"- Pepper: Plant Jun-Jul, harvest Nov-Feb, avg 0.35 tonnes/ha, weather-sensitive\n"
        personal_context += f"- Rubber: Tap Oct-Mar, rest Apr-Sep, avg 1.8 tonnes/ha latex\n"
        personal_context += f"- Cardamom: Plant Jun-Jul, harvest Oct-Feb, avg 0.18 tonnes/ha, Idukki major\n"
        personal_context += f"- Banana: Year-round planting, harvest 12-15 months, avg 35 tonnes/ha\n"
        
        personal_context += f"\n🌧️ KERALA MONSOON PATTERNS (Historical Data):\n"
        personal_context += f"- SW Monsoon: Jun-Sep (75% rainfall), weather impact factor 0.8-1.2\n"
        personal_context += f"- NE Monsoon: Oct-Dec (20% rainfall), good for second crops\n"
        personal_context += f"- Dry Season: Jan-May, irrigation critical, best productivity period\n"
        
        # Add recent weather impact analysis
        weather_analysis = agriculture_data_service.get_weather_impact_analysis([2021, 2022, 2023])
        if "error" not in weather_analysis:
            good_years = weather_analysis.get("good_weather_years", [])
            poor_years = weather_analysis.get("poor_weather_years", [])
            sensitive_crops = weather_analysis.get("most_weather_sensitive_crops", [])[:3]
            
            personal_context += f"- Recent good weather years: {', '.join(map(str, good_years))}\n"
            if poor_years:
                personal_context += f"- Recent challenging years: {', '.join(map(str, poor_years))}\n"
            if sensitive_crops:
                personal_context += f"- Weather-sensitive crops: {', '.join(sensitive_crops)}\n"
        
        personal_context += f"\n🐛 COMMON KERALA PEST & DISEASES:\n"
        personal_context += f"- Coconut: Rhinoceros beetle (high humidity), Red palm weevil\n"
        personal_context += f"- Pepper: Foot rot (monsoon), Pepper yellows disease\n"
        personal_context += f"- Rubber: Powdery mildew, Corynespora leaf fall (rainy season)\n"
        personal_context += f"- Rice: Blast disease, Brown planthopper (high humidity)\n"
        personal_context += f"- Cardamom: Thrips, Cardamom mosaic virus\n"
        
        personal_context += f"\n🏛️ KERALA GOVERNMENT SCHEMES (2024-25):\n"
        personal_context += f"- PM-KISAN: ₹6000/year for all farmers, direct bank transfer\n"
        personal_context += f"- Kerala Coconut Mission: Subsidy for planting, processing units\n"
        personal_context += f"- Pepper Development: ₹25,000/hectare for new plantations\n"
        personal_context += f"- Cardamom Development: 50% subsidy for plantation renovation\n"
        personal_context += f"- Kerala Rubber Board: Support for tapping, processing\n"
        personal_context += f"- Organic Certification: Financial support for organic farming\n"
        personal_context += f"- Krishi Vigyan Kendra: Free training & demonstrations\n"
        
        personal_context += f"\n🌱 KERALA SOIL & FARMING TIPS:\n"
        personal_context += f"- Laterite soil: Add organic matter, suitable for coconut/cashew\n"
        personal_context += f"- Red soil: Good drainage, ideal for spices & tea in hills\n"
        personal_context += f"- Alluvial soil: Fertile, perfect for rice in low-lying areas\n"
        personal_context += f"- Kari soil: Acidic peat, needs lime, good for rice with drainage\n"
        personal_context += f"- Coastal soil: Saline issues, coconut thrives, improve drainage\n"
        
        # Add enhanced district-specific advice with real data
        if district:
            personal_context += f"\n🗺️ DISTRICT-SPECIFIC DATA INSIGHTS ({district.upper()}):\n"
            
            # Get real district data
            district_data = agriculture_data_service.get_crop_recommendations_for_district(district)
            if "error" not in district_data:
                total_crops = district_data.get("total_crops", 0)
                recommendations = district_data.get("recommendations", {})
                
                personal_context += f"- Total suitable crops: {total_crops}\n"
                
                # Add category-wise major crops
                for category, crops in recommendations.items():
                    major_crops = [c["crop"] for c in crops if c["is_major_district"]]
                    if major_crops:
                        personal_context += f"- {category} specializations: {', '.join(major_crops[:3])}\n"
                
                # Get historical productivity data for district
                productivity_insights = []
                for crop_name in ["Rice", "Coconut", "Pepper", "Rubber"]:
                    prod_data = agriculture_data_service.get_historical_productivity_data(crop_name, district, years=3)
                    if "error" not in prod_data and prod_data.get("average_productivity", 0) > 0:
                        productivity_insights.append(f"{crop_name}: {prod_data['average_productivity']} t/ha")
                
                if productivity_insights:
                    personal_context += f"- Recent productivity data: {', '.join(productivity_insights[:3])}\n"
            else:
                # Fallback to static advice if data not available
                district_advice = {
                    "Thiruvananthapuram": "Coastal area - Focus on coconut, cashew, rubber. Watch for saltwater intrusion.",
                    "Kollam": "Cashew processing hub - Ideal for cashew, coconut, pepper cultivation.",
                    "Pathanamthitta": "Hilly terrain - Perfect for spices (pepper, cardamom), rubber plantations.",
                    "Alappuzha": "Backwater region - Rice cultivation in Kuttanad, coconut, banana farming.",
                    "Kottayam": "Rubber belt - Major rubber production, suitable for spices, rice.",
                    "Idukki": "High altitude - Tea, cardamom, coffee cultivation. Cool climate crops.",
                    "Ernakulam": "Commercial hub - Mixed farming, coconut, vegetable cultivation near city.",
                    "Thrissur": "Rice bowl - Paddy cultivation, coconut, banana, vegetable farming.",
                    "Palakkad": "Rice granary - Major rice production, coconut, sugarcane, vegetables.",
                    "Malappuram": "Coconut, arecanut, pepper cultivation. Good for mixed farming.",
                    "Kozhikode": "Spice coast - Pepper, coconut, banana, vegetable cultivation.",
                    "Wayanad": "Coffee & spice hills - Coffee, pepper, cardamom, banana cultivation.",
                    "Kannur": "Coconut & cashew region - Major coconut production, cashew, pepper.",
                    "Kasaragod": "Northernmost - Coconut, cashew, pepper, arecanut cultivation."
                }
                
                if district in district_advice:
                    personal_context += f"- {district_advice[district]}\n"
        
        # Create a personalized system prompt with context awareness
        system_prompt = f"""
        You are Kerala Krishi Sahai AI, a helpful farming friend for {username}. You talk like a knowledgeable neighbor, not a corporate assistant.
        
        COMMUNICATION STYLE:
        - Talk simply and directly, like you're chatting with a farmer friend
        - Keep responses SHORT (2-4 sentences max unless they ask for detailed help)
        - Use everyday language, avoid fancy words
        - Be warm and encouraging, not formal or robotic
        - Give ONE main tip per response, not long lists
        - Only give detailed answers when they specifically ask for more info
        
        CONTEXT-AWARE ADVICE:
        - Use current weather conditions to give relevant advice
        - Reference recent farm activities when giving suggestions
        - Consider seasonal timing for all recommendations
        - Factor in temperature, humidity, and weather conditions
        - Connect advice to their actual farming situation
        
        FARMER-FIRST APPROACH:
        - Remember you're talking to hardworking farmers, not office workers
        - Focus on practical solutions they can actually use
        - Give specific advice ("plant next week" not "consider planting")
        - Mention costs only when asked
        - Use local examples when possible
        - Reference their actual activities and weather
        
        YOUR EXPERTISE:
        - Weather-based crop timing and planting advice
        - Activity-specific pest/disease solutions
        - Real-time weather farming tips
        - Government schemes (explain simply)
        - Soil and fertilizer basics for their conditions
        
        LANGUAGE RULE:
        - English requests → Answer in simple English
        - Malayalam requests → Answer in Malayalam (മലയാളം)
        
        IMPORTANT: Use the weather and activity data provided to give specific, actionable advice!
        Remember: Short, helpful, farmer-friendly responses that use real context!
        {personal_context}
        """
        
        # Build conversation context if available
        conversation_context = ""
        if message.conversation_history:
            conversation_context = "\n\nPREVIOUS CONVERSATION (for context):";
            for msg in message.conversation_history[-3:]:  # Last 3 messages for context
                role = "Farmer" if msg.get('role') == 'user' else "You"
                conversation_context += f"\n{role}: {msg.get('content', '')}"
            conversation_context += "\n\n[Remember this conversation when responding to the new question]\n"
        
        # Create context-aware prompt with user message
        language_instruction = ""
        if message.preferred_language == "ml":
            language_instruction = "\n\n[IMPORTANT: Respond in Malayalam language using Malayalam script (മലയാളം). Use proper Malayalam agricultural terms and maintain a helpful, friendly tone in Malayalam.]"
        
        full_prompt = f"{system_prompt}{conversation_context}{language_instruction}\n\nFarmer's New Question: {message.message}\nPreferred Response Language: {message.preferred_language}\nVoice Input Language: {message.voice_input_language}\n\nPersonalized Response:"
        
        # Generate response using Gemini
        print(f"🤖 GEMINI DEBUG: Calling AI with prompt length: {len(full_prompt)} chars")
        print(f"🤖 GEMINI DEBUG: First 200 chars of prompt: {full_prompt[:200]}...")
        
        try:
            response = model.generate_content(full_prompt)
            print(f"🤖 GEMINI SUCCESS: Got response with length: {len(response.text) if response.text else 0} chars")
            return {"reply": response.text}
        except Exception as gemini_error:
            print(f"🤖 GEMINI ERROR: {type(gemini_error).__name__} - {gemini_error}")
            error_str = str(gemini_error)
            
            # Handle specific error types with better messages
            if "RESOURCE_EXHAUSTED" in error_str or "429" in error_str:
                return {
                    "reply": f"Hello {username}! 😅 I've been chatting a lot today and hit my daily quota limit. Please try again in a few minutes, or ask me about urgent farming questions and I'll help as best I can!"
                }
            elif "PERMISSION_DENIED" in error_str:
                return {
                    "reply": f"Hello {username}! 🔑 I'm having authentication issues with my AI service. The developers need to check my API access. Meanwhile, feel free to ask basic farming questions!"
                }
            elif "DEADLINE_EXCEEDED" in error_str or "timeout" in error_str.lower():
                return {
                    "reply": f"Hello {username}! ⏱️ My response took too long to generate. Can you try asking a shorter question? I'll respond faster!"
                }
            else:
                return {
                    "reply": f"Hello {username}! 🤖 I'm having trouble connecting to my AI brain right now. Please try again in a moment, or check if your farming question is urgent and I'll do my best to help!"
                }
        
    except Exception as e:
        print(f"Chat error: {type(e).__name__} - {e}")
        import traceback
        print(f"Full traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")


# ------------------------
# Run the app (for local testing)
# ------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8081)
