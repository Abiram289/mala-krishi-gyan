# V2.2 - Integrated SQL-based Data Service and Dashboard Endpoint
from fastapi import FastAPI, Depends, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime
import os
from dotenv import load_dotenv
import google.generativeai as genai
import requests
from google.cloud import texttospeech
from agriculture_data_service import KeralaAgricultureDataService

# --- Environment and Client Setup ---
load_dotenv("../.env")
load_dotenv()

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not all([SUPABASE_URL, SUPABASE_KEY, GEMINI_API_KEY]):
    raise RuntimeError("One or more environment variables are missing.")

genai.configure(api_key=GEMINI_API_KEY)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Service Instantiation ---
agriculture_data_service = KeralaAgricultureDataService(supabase)

# --- V2 Pydantic Models ---

class Crop(BaseModel):
    crop_id: int
    crop_name: str
    ideal_planting_season: Optional[str] = None
    time_to_harvest_days: Optional[int] = None

class Planting(BaseModel):
    planting_id: int
    plot_id: int
    crop_id: int
    planting_date: date
    expected_yield: Optional[float] = None
    actual_yield: Optional[float] = None
    harvest_date: Optional[date] = None
    crop: Crop

class FarmCreate(BaseModel):
    farm_name: str
    district_id: int

class FarmPlotCreate(BaseModel):
    farm_id: int
    plot_name: str
    area_acres: float
    soil_type_id: int

class PlantingCreate(BaseModel):
    plot_id: int
    crop_id: int
    planting_date: date

class ActivityLogCreate(BaseModel):
    planting_id: int
    activity_type: str
    activity_date: date
    notes: Optional[str] = None
    cost: Optional[float] = None

class ActivityCreate(BaseModel):
    planting_id: int
    activity_type: str
    notes: Optional[str] = None
    cost: Optional[float] = None
    scheduled_for: datetime

class Activity(ActivityCreate):
    activity_id: int
    status: str
    created_at: datetime
    completed_at: Optional[datetime] = None

class ActivityLogUpdate(BaseModel):
    activity_type: Optional[str] = None
    activity_date: Optional[date] = None
    notes: Optional[str] = None
    cost: Optional[float] = None

class ChatMessage(BaseModel):
    message: str

# --- Auth Helper ---
def get_current_user(authorization: str = Header(..., alias="Authorization")):
    try:
        scheme, credentials = authorization.split(" ")
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid authentication scheme")
        user_response = supabase.auth.get_user(jwt=credentials)
        return user_response.user
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {e}")

# --- API Endpoints ---

@app.get("/")
def root():
    return {"message": "Kerala Krishi Sahai API V2.2 is running 🚀"}

# --- Dashboard Endpoint ---
@app.get("/dashboard-stats")
def get_dashboard_stats(user=Depends(get_current_user)):
    """Returns a variety of statistics for the user's farm using a single, complex SQL function."""
    response = supabase.rpc("get_user_dashboard_stats", {"p_user_id": user.id}).execute()
    return response.data

@app.get("/crop-calendar")
def get_crop_calendar(month: int, user=Depends(get_current_user)):
    """Returns the crop calendar data for a given month using a single, complex SQL function."""
    response = supabase.rpc("get_crop_calendar", {"p_month": month}).execute()
    return response.data

@app.get("/weather")
def get_weather(lat: Optional[float] = None, lon: Optional[float] = None, language: Optional[str] = "en", user=Depends(get_current_user)):
    if not lat or not lon:
        # Default to a location in Kerala if not provided
        lat = 10.8505
        lon = 76.2711

    try:
        # Using Open-Meteo API with more explicit current weather fields
        url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,is_day"
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()

        current_weather = data.get("current", {})
        
        # Safe access using .get() with default values
        temp = current_weather.get("temperature_2m")
        humidity = current_weather.get("relative_humidity_2m", 50) # Default to 50 if not available
        is_day = current_weather.get("is_day", 1)
        wind_speed = current_weather.get("wind_speed_10m", 0)

        if temp is None:
            raise HTTPException(status_code=500, detail="Temperature data not available from weather service.")

        weather_data = {
            "temperature": temp,
            "humidity": humidity,
            "condition": "sunny" if is_day else "cloudy", # Simple condition mapping
            "windSpeed": wind_speed,
            "location": f"Lat: {lat}, Lon: {lon}",
            "description": "Clear sky", # Placeholder
            "alerts": [] # Placeholder
        }
        return weather_data
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Error fetching weather data: {e}")
    except Exception as e:
        # Catch any other potential errors (e.g., JSON parsing, key errors)
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred while processing weather data: {e}")

@app.post("/tts")
async def text_to_speech(request: Request, user=Depends(get_current_user)):
    body = await request.json()
    text = body.get("text")
    language = body.get("language", "en")

    if not text:
        raise HTTPException(status_code=400, detail="Text is required.")

    try:
        client = texttospeech.TextToSpeechClient()

        synthesis_input = texttospeech.SynthesisInput(text=text)

        voice_params = {
            "language_code": f"{language}-IN" if language == "ml" else f"{language}-US",
            "ssml_gender": texttospeech.SsmlVoiceGender.NEUTRAL,
        }

        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3
        )

        response = client.synthesize_speech(
            input=synthesis_input, voice=voice_params, audio_config=audio_config
        )

        return {"audio": response.audio_content, "contentType": "audio/mpeg"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error synthesizing speech: {e}")


# --- Master Data Endpoints ---
@app.get("/master-data/districts")
def get_districts(user=Depends(get_current_user)):
    response = supabase.table("districts").select("district_id, district_name").execute()
    return response.data

@app.get("/master-data/soil-types")
def get_soil_types(user=Depends(get_current_user)):
    response = supabase.table("soil_types").select("soil_type_id, soil_name, description").execute()
    return response.data

@app.get("/master-data/crops")
def get_crops(user=Depends(get_current_user)):
    response = supabase.table("crops").select("crop_id, crop_name").execute()
    return response.data

# --- User Profile Endpoint ---
@app.get("/profile")
def get_profile(user=Depends(get_current_user)):
    profile_res = supabase.table("user_app_profiles").select("*").eq("id", user.id).execute()
    if not profile_res.data:
        user_meta = user.user_metadata or {}
        full_name = user_meta.get("full_name") or user_meta.get("user_name")
        insert_res = supabase.table("user_app_profiles").insert({"id": user.id, "full_name": full_name}).execute()
        if not insert_res.data:
            raise HTTPException(status_code=500, detail="Failed to create user profile.")
        return insert_res.data[0]
    return profile_res.data[0]

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    farm_size: Optional[float] = None
    district_id: Optional[int] = None
    soil_type_id: Optional[int] = None

@app.put("/profile")
def update_profile(profile_data: UserProfileUpdate, user=Depends(get_current_user)):
    update_fields = profile_data.dict(exclude_unset=True)
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields provided for update.")

    response = supabase.table("user_app_profiles").update(update_fields).eq("id", user.id).execute()
    if response.data:
        return response.data[0]
    raise HTTPException(status_code=500, detail="Failed to update user profile.")

# --- Farm, Plot, Planting, Activity Endpoints (CRUD) ---
@app.get("/farms")
def get_user_farms(user=Depends(get_current_user)):
    response = supabase.table("farms").select("*, district:districts(district_name), farm_plots(count)").eq("owner_id", user.id).execute()
    return response.data

@app.post("/farms")
def create_farm(farm_data: FarmCreate, user=Depends(get_current_user)):
    """Creates a new farm and a default plot for it."""
    # 1. Create the farm
    farm_response = supabase.table("farms").insert({
        "owner_id": user.id,
        **farm_data.dict()
    }).execute()

    if not farm_response.data:
        raise HTTPException(status_code=500, detail="Failed to create farm.")
    
    new_farm = farm_response.data[0]
    new_farm_id = new_farm['farm_id']

    # 2. Get a default soil type for the plot
    soil_types_response = supabase.table("soil_types").select("soil_type_id").limit(1).execute()
    if not soil_types_response.data:
        # This indicates a configuration problem (no master data for soil types)
        # We'll log a warning and return the farm, but the plot won't be created.
        print(f"Warning: Farm {new_farm_id} was created, but could not create a default plot because no soil types are defined.")
        return new_farm

    default_soil_id = soil_types_response.data[0]['soil_type_id']

    # 3. Create the default plot
    default_plot_data = {
        "farm_id": new_farm_id,
        "plot_name": farm_data.farm_name,  # Use the farm's name for the plot
        "area_acres": 1.0,                 # Default area
        "soil_type_id": default_soil_id
    }
    
    plot_response = supabase.table("farm_plots").insert(default_plot_data).execute()

    if not plot_response.data:
        # Log a warning if the plot creation fails but the farm was created.
        print(f"Warning: Farm {new_farm_id} was created, but the default plot creation failed.")

    # Return the original farm data as the response
    return new_farm

@app.get("/farms/{farm_id}/plots")
def get_farm_plots(farm_id: int, user=Depends(get_current_user)):
    response = supabase.table("farm_plots").select("*, soil_type:soil_types(soil_name)").eq("farm_id", farm_id).execute()
    return response.data

@app.post("/plots")
def create_plot(plot_data: FarmPlotCreate, user=Depends(get_current_user)):
    """Creates a new plot for the user."""
    # Security check: Ensure the farm_id belongs to the user.
    farm_check = supabase.table("farms").select("farm_id").eq("owner_id", user.id).eq("farm_id", plot_data.farm_id).execute()
    if not farm_check.data:
        raise HTTPException(status_code=403, detail="You do not have permission to add a plot to this farm.")

    response = supabase.table("farm_plots").insert(plot_data.dict()).execute()
    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to create plot.")
    
    new_plot_id = response.data[0]['plot_id']
    plot_response = supabase.table("farm_plots").select("*, soil_types(soil_name)").eq("plot_id", new_plot_id).single().execute()

    return plot_response.data

@app.get("/plantings")
def get_user_plantings(user=Depends(get_current_user)):
    """Fetches all plantings owned by the current user across all their farms."""
    # We need to join through farms and farm_plots to filter by owner_id
    # This is a simplified query; a database view or function could optimize this.
    # For now, we get all farms, then all plots, then all plantings.
    farms_response = supabase.table("farms").select("farm_id").eq("owner_id", user.id).execute()
    if not farms_response.data:
        return []
    farm_ids = [f['farm_id'] for f in farms_response.data]

    plots_response = supabase.table("farm_plots").select("plot_id").in_("farm_id", farm_ids).execute()
    if not plots_response.data:
        return []
    plot_ids = [p['plot_id'] for p in plots_response.data]

    plantings_response = supabase.table("plantings").select("*, crop:crops(*)").in_("plot_id", plot_ids).execute()
    return plantings_response.data

@app.get("/plots")
def get_user_plots(user=Depends(get_current_user)):
    """Fetches all plots for a user, creating default plots for farms that are missing them."""
    # 1. Get all of the user's farms
    farms_response = supabase.table("farms").select("farm_id, farm_name").eq("owner_id", user.id).execute()
    if not farms_response.data:
        return []
    
    user_farms = farms_response.data
    farm_ids = [f['farm_id'] for f in user_farms]

    # 2. Get all existing plots for those farms
    plots_response = supabase.table("farm_plots").select("farm_id").in_("farm_id", farm_ids).execute()
    existing_plot_farm_ids = {p['farm_id'] for p in plots_response.data} if plots_response.data else set()

    # 3. Identify farms missing a default plot and create them one-by-one
    missing_plot_farms = [farm for farm in user_farms if farm['farm_id'] not in existing_plot_farm_ids]

    if missing_plot_farms:
        soil_types_response = supabase.table("soil_types").select("soil_type_id").limit(1).execute()
        if not soil_types_response.data:
            raise HTTPException(status_code=500, detail="Cannot create default plot: No soil types defined in database.")
        default_soil_id = soil_types_response.data[0]['soil_type_id']

        for farm in missing_plot_farms:
            plot_to_create = {
                "farm_id": farm['farm_id'],
                "plot_name": farm['farm_name'],
                "area_acres": 1.0,
                "soil_type_id": default_soil_id,
            }
            # Insert each plot individually to avoid potential batch-insert issues
            supabase.table("farm_plots").insert(plot_to_create).execute()

    # 4. Return the complete list of plots for the user
    final_plots_response = supabase.table("farm_plots").select("*, farms(farm_name)").in_("farm_id", farm_ids).execute()
    return final_plots_response.data

@app.post("/plantings", response_model=Planting)
def create_planting(planting_data: PlantingCreate, user=Depends(get_current_user)):
    """Creates a new planting for the user."""
    # Security check: Ensure the plot_id belongs to the user.
    plots_response = supabase.table("farm_plots").select("plot_id, farm_id").eq("plot_id", planting_data.plot_id).execute()
    if not plots_response.data:
        raise HTTPException(status_code=404, detail="Plot not found.")
    
    farm_id = plots_response.data[0]['farm_id']
    farm_check = supabase.table("farms").select("farm_id").eq("owner_id", user.id).eq("farm_id", farm_id).execute()
    if not farm_check.data:
        raise HTTPException(status_code=403, detail="You do not have permission to add a planting to this plot.")

    # --- DEBUGGING AND MANUAL SERIALIZATION ---
    print("--- EXECUTING create_planting v3 ---")
    planting_dict = planting_data.model_dump()
    planting_dict['planting_date'] = planting_dict['planting_date'].isoformat()
    print(f"--- SERIALIZED PAYLOAD: {planting_dict} ---")

    response = supabase.table("plantings").insert(planting_dict).execute()
    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to create planting.")
    
    # The insert response doesn't include the nested crop, so we fetch it again
    new_planting = supabase.table("plantings").select("*, crop:crops(*)").eq("planting_id", response.data[0]['planting_id']).single().execute()
    return new_planting.data

# --- Activity Scheduling Endpoints ---

@app.get("/activities", response_model=List[Activity])
def get_activities(status: Optional[str] = None, user=Depends(get_current_user)):
    """Fetches all activities for the current user, with optional status filtering."""
    query = supabase.table("user_activities").select("*").eq("owner_id", user.id)
    if status:
        query = query.eq("status", status)
    
    response = query.order("scheduled_for", desc=False).execute()
    return response.data

@app.post("/activities", response_model=Activity)
def create_activity(activity_data: ActivityCreate, user=Depends(get_current_user)):
    """Creates a new scheduled activity for the user."""
    # Corrected Security Check:
    # 1. Get the plot_id from the planting_id to start the ownership check.
    planting_res = supabase.table("plantings").select("plot_id").eq("planting_id", activity_data.planting_id).execute()
    if not planting_res.data:
        raise HTTPException(status_code=404, detail="Planting not found.")

    # 2. Get the farm_id from the plot_id.
    plot_res = supabase.table("farm_plots").select("farm_id").eq("plot_id", planting_res.data[0]['plot_id']).execute()
    if not plot_res.data:
        raise HTTPException(status_code=404, detail="Associated plot not found.")

    # 3. Verify the user owns the farm associated with the plot.
    farm_res = supabase.table("farms").select("farm_id").eq("owner_id", user.id).eq("farm_id", plot_res.data[0]['farm_id']).execute()
    if not farm_res.data:
        raise HTTPException(status_code=403, detail="You do not have permission to add an activity to this planting.")

    # If all checks pass, create the activity.
    response = supabase.table("activities_log").insert(activity_data.model_dump(mode='json')).execute()
    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to create activity.")
    
    # The insert doesn't return all columns, so we fetch the new activity to match the response model.
    new_activity = supabase.table("user_activities").select("*").eq("activity_id", response.data[0]['activity_id']).single().execute()
    return new_activity.data

@app.put("/activities/{activity_id}/complete", response_model=Activity)
def complete_activity(activity_id: int, user=Depends(get_current_user)):
    """Marks an activity as complete."""
    # Security check: Ensure the activity belongs to the user.
    activity_check = supabase.table("user_activities").select("activity_id").eq("owner_id", user.id).eq("activity_id", activity_id).execute()
    if not activity_check.data:
        raise HTTPException(status_code=404, detail="Activity not found or you do not have permission.")

    update_data = {
        "status": "done",
        "completed_at": datetime.now().isoformat()
    }
    response = supabase.table("activities_log").update(update_data).eq("activity_id", activity_id).execute()
    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to update activity.")
    return response.data[0]


# ... (other CRUD endpoints for plots, plantings, activities can be added here) ...

# --- Chat History Endpoints ---

@app.get("/chat/history")
def get_chat_history(user=Depends(get_current_user)):
    """Fetches the chat history for the authenticated user."""
    response = supabase.table("chat_messages").select("sender, content, created_at").eq("user_id", user.id).order("created_at", desc=False).execute()
    return response.data

@app.post("/chat")
def chat_with_ai(message: ChatMessage, user=Depends(get_current_user)):
    """Receives a user message, gets an AI reply, and saves both to the database."""
    try:
        # 1. Save user's message
        supabase.table("chat_messages").insert({
            "user_id": user.id,
            "sender": "user",
            "content": message.message
        }).execute()

        # 2. Get AI context from the database
        context_response = supabase.rpc("get_ai_context", {"p_user_id": user.id, "p_user_query": message.message}).execute()
        db_context = context_response.data if context_response.data else ""

        system_prompt = f"You are a helpful farming assistant. Use the following context to answer the user's question:\n{db_context}"
        full_prompt = f"{system_prompt}\n\nUser's question: {message.message}"

        # 3. Call Gemini AI
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(full_prompt)
        bot_reply = response.text

        # 4. Save bot's reply
        supabase.table("chat_messages").insert({
            "user_id": user.id,
            "sender": "bot",
            "content": bot_reply
        }).execute()

        return {"reply": bot_reply}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

# --- Main Execution ---
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8081)