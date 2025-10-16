
import os
import pandas as pd
from supabase import create_client, Client
from dotenv import load_dotenv

# --- Environment and Client Setup ---
load_dotenv("../.env")
load_dotenv()

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY")

if not all([SUPABASE_URL, SUPABASE_KEY]):
    raise RuntimeError("One or more environment variables are missing.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def populate_historical_data():
    print("Populating historical_agriculture_data...")
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        historical_path = os.path.join(current_dir, "kerala_agriculture_10year_historical_data.csv")
        if os.path.exists(historical_path):
            df = pd.read_csv(historical_path)
            df = df.rename(columns={
                'Crop': 'crop_name',
                'District': 'district_name',
                'Year': 'year',
                'Season': 'season',
                'Area_Hectares': 'area_hectares',
                'Production_Tonnes': 'production_tonnes',
                'Productivity_Tonnes_per_Hectare': 'productivity_tonnes_per_hectare',
                'Weather_Impact_Factor': 'weather_impact_factor',
                'Sowing_Period': 'sowing_period',
                'Harvest_Period': 'harvest_period'
            })
            data_to_insert = df.to_dict(orient='records')
            response = supabase.table('historical_agriculture_data').insert(data_to_insert).execute()
            print(f"Inserted {len(response.data)} records into historical_agriculture_data.")
        else:
            print(f"File not found: {historical_path}")
    except Exception as e:
        print(f"Error populating historical_agriculture_data: {e}")

def populate_comprehensive_data():
    print("Populating comprehensive_agriculture_data...")
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        comprehensive_path = os.path.join(current_dir, "kerala_comprehensive_agriculture_data.csv")
        if os.path.exists(comprehensive_path):
            df = pd.read_csv(comprehensive_path)
            df = df.rename(columns={
                'District': 'district_name',
                'Category': 'category',
                'Crop': 'crop_name',
                'Season': 'season',
                'Planting_Period': 'planting_period',
                'Harvest_Period': 'harvest_period',
                'Is_Major_District': 'is_major_district',
                'Cultivation_Type': 'cultivation_type'
            })
            data_to_insert = df.to_dict(orient='records')
            response = supabase.table('comprehensive_agriculture_data').insert(data_to_insert).execute()
            print(f"Inserted {len(response.data)} records into comprehensive_agriculture_data.")
        else:
            print(f"File not found: {comprehensive_path}")
    except Exception as e:
        print(f"Error populating comprehensive_agriculture_data: {e}")

if __name__ == "__main__":
    populate_historical_data()
    populate_comprehensive_data()
