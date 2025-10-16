"""
Kerala Agriculture Data Service - Database Integration
Provides intelligent data access and context for the AI farming assistant using SQL queries.
"""

from supabase import Client
from datetime import datetime
from typing import Dict, List, Optional
import pandas as pd

class KeralaAgricultureDataService:
    def __init__(self, supabase_client: Client):
        """Initialize the agriculture data service with a Supabase client."""
        self.supabase = supabase_client
    
    def get_crop_recommendations_for_district(self, district: str, season: str = None) -> Dict:
        """Get crop recommendations based on district and season using SQL."""
        try:
            query = self.supabase.table("comprehensive_agriculture_data").select("*").ilike("district_name", f"%{district}%")
            if season:
                query = query.ilike("season", f"%{season}%")
            
            response = query.execute()
            
            if not response.data:
                return {"error": f"No data found for district: {district}"}
            
            recommendations = {}
            for row in response.data:
                category = row.get("category", "Uncategorized")
                if category not in recommendations:
                    recommendations[category] = []
                
                recommendations[category].append({
                    "crop": row["crop_name"],
                    "season": row["season"],
                    "planting_period": row["planting_period"],
                    "harvest_period": row["harvest_period"],
                    "is_major_district": row["is_major_district"],
                    "cultivation_type": row["cultivation_type"]
                })
            
            return {
                "district": district,
                "total_crops": len(response.data),
                "recommendations": recommendations
            }
            
        except Exception as e:
            return {"error": f"Error processing district data: {e}"}

    def get_historical_productivity_data(self, crop: str, district: str = None, years: int = 5) -> Dict:
        """Get historical productivity data for a specific crop using SQL."""
        try:
            current_year = datetime.now().year
            start_year = current_year - years

            query = self.supabase.table("historical_agriculture_data").select("*") \
                .ilike("crop_name", f"%{crop}%") \
                .gte("year", start_year)

            if district:
                query = query.ilike("district_name", f"%{district}%")

            response = query.execute()

            if not response.data:
                return {"error": f"No historical data found for crop: {crop}"}

            # Perform calculations in Python for simplicity, but could be done in SQL
            df = pd.DataFrame(response.data)
            
            stats = {
                "crop": crop,
                "district": district or "All Districts",
                "years_analyzed": len(df['year'].unique()),
                "total_records": len(df),
                "average_productivity": round(df['productivity_tonnes_per_hectare'].mean(), 2),
                "max_productivity": round(df['productivity_tonnes_per_hectare'].max(), 2),
                "min_productivity": round(df['productivity_tonnes_per_hectare'].min(), 2),
                "average_area": round(df['area_hectares'].mean(), 2),
                "total_production_last_year": 0,
                "weather_impact_trends": []
            }

            if not df.empty:
                latest_year = df['year'].max()
                latest_data = df[df['year'] == latest_year]
                stats["total_production_last_year"] = round(latest_data['production_tonnes'].sum(), 2)

            weather_trends = df.groupby('year')['weather_impact_factor'].mean()
            for year, impact in weather_trends.items():
                trend = "Good" if impact >= 1.0 else "Poor" if impact < 0.8 else "Average"
                stats["weather_impact_trends"].append({
                    "year": int(year),
                    "impact_factor": round(float(impact), 3),
                    "trend": trend
                })

            return stats

        except Exception as e:
            return {"error": f"Error processing historical data: {e}"}

    def get_seasonal_calendar(self, month: int, district: str = None) -> Dict:
        """Get seasonal planting calendar based on comprehensive data using SQL."""
        try:
            month_names = [
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
            ]
            current_month_name = month_names[month - 1]

            query = self.supabase.table("comprehensive_agriculture_data").select("*") \
                .ilike("planting_period", f"%{current_month_name}%")

            if district:
                query = query.ilike("district_name", f"%{district}%")
            
            response = query.execute()

            suitable_crops = response.data
            
            calendar_by_category = {}
            for crop in suitable_crops:
                category = crop.get('category', 'Uncategorized')
                if category not in calendar_by_category:
                    calendar_by_category[category] = []
                calendar_by_category[category].append(crop)

            return {
                "month": current_month_name,
                "district": district or "All Districts",
                "total_suitable_crops": len(suitable_crops),
                "calendar_by_category": calendar_by_category,
            }

        except Exception as e:
            return {"error": f"Error generating seasonal calendar: {e}"}

# This is a placeholder for the global instance.
# The actual instance will be created in main.py and passed to the service.
agriculture_data_service = None
