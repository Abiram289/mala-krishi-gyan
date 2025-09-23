"""
Kerala Agriculture Data Service - CSV Data Integration
Provides intelligent data access and context for the AI farming assistant
"""

import pandas as pd
import os
from datetime import datetime
from typing import Dict, List, Optional, Tuple

class KeralaAgricultureDataService:
    def __init__(self):
        """Initialize the agriculture data service with CSV data loading."""
        self.historical_data = None
        self.comprehensive_data = None
        self.load_data()
    
    def load_data(self):
        """Load both CSV datasets into memory."""
        try:
            # Get the directory of this script
            current_dir = os.path.dirname(os.path.abspath(__file__))
            
            # Load historical data (10 years)
            historical_path = os.path.join(current_dir, "kerala_agriculture_10year_historical_data.csv")
            if os.path.exists(historical_path):
                self.historical_data = pd.read_csv(historical_path)
                print(f"✅ Loaded historical data: {len(self.historical_data)} records")
            else:
                print(f"❌ Historical data file not found: {historical_path}")
            
            # Load comprehensive crop-district mapping
            comprehensive_path = os.path.join(current_dir, "kerala_comprehensive_agriculture_data.csv")
            if os.path.exists(comprehensive_path):
                self.comprehensive_data = pd.read_csv(comprehensive_path)
                print(f"✅ Loaded comprehensive data: {len(self.comprehensive_data)} records")
            else:
                print(f"❌ Comprehensive data file not found: {comprehensive_path}")
                
        except Exception as e:
            print(f"❌ Error loading agriculture data: {e}")
    
    def get_crop_recommendations_for_district(self, district: str, season: str = None) -> Dict:
        """Get crop recommendations based on district and season."""
        if self.comprehensive_data is None:
            return {"error": "Comprehensive data not available"}
        
        try:
            # Filter by district
            district_crops = self.comprehensive_data[
                self.comprehensive_data['District'].str.contains(district, case=False, na=False)
            ]
            
            if district_crops.empty:
                return {"error": f"No data found for district: {district}"}
            
            # Group by crop category
            recommendations = {}
            for category in district_crops['Category'].unique():
                category_crops = district_crops[district_crops['Category'] == category]
                recommendations[category] = []
                
                for _, crop in category_crops.iterrows():
                    crop_info = {
                        "crop": crop['Crop'],
                        "season": crop['Season'],
                        "planting_period": crop['Planting_Period'],
                        "harvest_period": crop['Harvest_Period'],
                        "is_major_district": crop['Is_Major_District'],
                        "cultivation_type": crop['Cultivation_Type']
                    }
                    recommendations[category].append(crop_info)
            
            return {
                "district": district,
                "total_crops": len(district_crops),
                "recommendations": recommendations
            }
            
        except Exception as e:
            return {"error": f"Error processing district data: {e}"}
    
    def get_historical_productivity_data(self, crop: str, district: str = None, years: int = 5) -> Dict:
        """Get historical productivity data for a specific crop."""
        if self.historical_data is None:
            return {"error": "Historical data not available"}
        
        try:
            # Filter by crop
            crop_data = self.historical_data[
                self.historical_data['Crop'].str.contains(crop, case=False, na=False)
            ]
            
            # Filter by district if specified
            if district:
                crop_data = crop_data[
                    crop_data['District'].str.contains(district, case=False, na=False)
                ]
            
            if crop_data.empty:
                return {"error": f"No historical data found for crop: {crop}"}
            
            # Get recent years data
            current_year = datetime.now().year
            start_year = current_year - years
            recent_data = crop_data[crop_data['Year'] >= start_year]
            
            # Calculate statistics
            stats = {
                "crop": crop,
                "district": district or "All Districts",
                "years_analyzed": len(recent_data['Year'].unique()),
                "total_records": len(recent_data),
                "average_productivity": round(recent_data['Productivity_Tonnes_per_Hectare'].mean(), 2),
                "max_productivity": round(recent_data['Productivity_Tonnes_per_Hectare'].max(), 2),
                "min_productivity": round(recent_data['Productivity_Tonnes_per_Hectare'].min(), 2),
                "average_area": round(recent_data['Area_Hectares'].mean(), 2),
                "total_production_last_year": 0,
                "weather_impact_trends": []
            }
            
            # Get latest year data
            if len(recent_data) > 0:
                latest_year = recent_data['Year'].max()
                latest_data = recent_data[recent_data['Year'] == latest_year]
                stats["total_production_last_year"] = round(latest_data['Production_Tonnes'].sum(), 2)
            
            # Analyze weather impact trends
            weather_trends = recent_data.groupby('Year')['Weather_Impact_Factor'].mean()
            for year, impact in weather_trends.items():
                trend = "Good" if impact >= 1.0 else "Poor" if impact < 0.8 else "Average"
                stats["weather_impact_trends"].append({
                    "year": int(year),
                    "impact_factor": round(float(impact), 3),
                    "trend": trend
                })
            
            # Get seasonal breakdown for rice
            if crop.lower() == 'rice':
                seasonal_data = {}
                for season in recent_data['Season'].unique():
                    season_data = recent_data[recent_data['Season'] == season]
                    seasonal_data[season] = {
                        "average_productivity": round(season_data['Productivity_Tonnes_per_Hectare'].mean(), 2),
                        "average_area": round(season_data['Area_Hectares'].mean(), 2),
                        "sowing_period": season_data['Sowing_Period'].iloc[0] if len(season_data) > 0 else "N/A",
                        "harvest_period": season_data['Harvest_Period'].iloc[0] if len(season_data) > 0 else "N/A"
                    }
                stats["seasonal_breakdown"] = seasonal_data
            
            # Get district-wise comparison if no specific district
            if not district:
                district_comparison = recent_data.groupby('District').agg({
                    'Productivity_Tonnes_per_Hectare': 'mean',
                    'Area_Hectares': 'mean',
                    'Production_Tonnes': 'sum'
                }).round(2)
                
                stats["top_districts"] = district_comparison.sort_values(
                    'Productivity_Tonnes_per_Hectare', ascending=False
                ).head(5).to_dict('index')
            
            return stats
            
        except Exception as e:
            return {"error": f"Error processing historical data: {e}"}
    
    def get_seasonal_calendar(self, month: int, district: str = None) -> Dict:
        """Get seasonal planting calendar based on comprehensive data."""
        if self.comprehensive_data is None:
            return {"error": "Comprehensive data not available"}
        
        try:
            # Filter by district if specified
            calendar_data = self.comprehensive_data.copy()
            if district:
                calendar_data = calendar_data[
                    calendar_data['District'].str.contains(district, case=False, na=False)
                ]
            
            month_names = [
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
            ]
            
            current_month = month_names[month - 1]
            
            # Find crops suitable for current month
            suitable_crops = []
            
            for _, crop in calendar_data.iterrows():
                planting_period = str(crop['Planting_Period']).lower()
                
                # Check if current month is in planting period
                if current_month.lower() in planting_period or self._is_month_in_period(month, planting_period):
                    suitable_crops.append({
                        "crop": crop['Crop'],
                        "district": crop['District'],
                        "category": crop['Category'],
                        "season": crop['Season'],
                        "planting_period": crop['Planting_Period'],
                        "harvest_period": crop['Harvest_Period'],
                        "is_major_district": crop['Is_Major_District'],
                        "cultivation_type": crop['Cultivation_Type']
                    })
            
            # Group by category
            calendar_by_category = {}
            for crop in suitable_crops:
                category = crop['category']
                if category not in calendar_by_category:
                    calendar_by_category[category] = []
                calendar_by_category[category].append(crop)
            
            return {
                "month": current_month,
                "district": district or "All Districts",
                "total_suitable_crops": len(suitable_crops),
                "calendar_by_category": calendar_by_category,
                "major_district_crops": [c for c in suitable_crops if c['is_major_district']],
                "intensive_cultivation_crops": [c for c in suitable_crops if c['cultivation_type'] == 'Intensive']
            }
            
        except Exception as e:
            return {"error": f"Error generating seasonal calendar: {e}"}
    
    def _is_month_in_period(self, month: int, period_str: str) -> bool:
        """Check if a month falls within a planting period string."""
        try:
            month_names = [
                "january", "february", "march", "april", "may", "june",
                "july", "august", "september", "october", "november", "december"
            ]
            
            current_month_name = month_names[month - 1]
            period_lower = period_str.lower()
            
            # Check for month name or common patterns
            if current_month_name in period_lower:
                return True
            
            # Check for monsoon patterns
            if month in [6, 7, 8, 9] and ("monsoon" in period_lower or "june" in period_lower or "july" in period_lower):
                return True
            
            # Check for seasonal patterns
            if month in [10, 11, 12] and ("rabi" in period_lower or "winter" in period_lower):
                return True
                
            if month in [4, 5] and ("summer" in period_lower):
                return True
            
            return False
            
        except:
            return False
    
    def get_weather_impact_analysis(self, years: List[int] = None) -> Dict:
        """Analyze weather impact on crop production."""
        if self.historical_data is None:
            return {"error": "Historical data not available"}
        
        try:
            if not years:
                years = list(range(2019, 2024))  # Default to recent 5 years
            
            # Filter by specified years
            weather_data = self.historical_data[self.historical_data['Year'].isin(years)]
            
            if weather_data.empty:
                return {"error": "No data found for specified years"}
            
            # Analyze weather impact by year
            yearly_impact = weather_data.groupby('Year').agg({
                'Weather_Impact_Factor': ['mean', 'std', 'min', 'max'],
                'Productivity_Tonnes_per_Hectare': 'mean',
                'Production_Tonnes': 'sum'
            }).round(3)
            
            # Categorize years by weather impact
            good_years = []
            poor_years = []
            average_years = []
            
            for year in years:
                year_data = weather_data[weather_data['Year'] == year]
                if len(year_data) > 0:
                    avg_impact = year_data['Weather_Impact_Factor'].mean()
                    if avg_impact >= 1.0:
                        good_years.append(year)
                    elif avg_impact < 0.8:
                        poor_years.append(year)
                    else:
                        average_years.append(year)
            
            # Crop-wise weather sensitivity
            crop_sensitivity = weather_data.groupby('Crop').agg({
                'Weather_Impact_Factor': ['mean', 'std'],
                'Productivity_Tonnes_per_Hectare': 'mean'
            }).round(3)
            
            # Most weather-sensitive crops (high standard deviation)
            sensitive_crops = crop_sensitivity.sort_values(
                ('Weather_Impact_Factor', 'std'), ascending=False
            ).head(5)
            
            return {
                "analysis_period": f"{min(years)} - {max(years)}",
                "total_records_analyzed": len(weather_data),
                "good_weather_years": good_years,
                "poor_weather_years": poor_years,
                "average_weather_years": average_years,
                "yearly_analysis": yearly_impact.to_dict('index'),
                "most_weather_sensitive_crops": sensitive_crops.index.tolist()[:5],
                "crop_weather_sensitivity": crop_sensitivity.to_dict('index'),
                "overall_weather_trend": {
                    "average_impact": round(weather_data['Weather_Impact_Factor'].mean(), 3),
                    "impact_variability": round(weather_data['Weather_Impact_Factor'].std(), 3)
                }
            }
            
        except Exception as e:
            return {"error": f"Error analyzing weather impact: {e}"}
    
    def get_district_specialization_analysis(self) -> Dict:
        """Analyze district specialization based on comprehensive data."""
        if self.comprehensive_data is None:
            return {"error": "Comprehensive data not available"}
        
        try:
            # District-wise crop count and specialization
            district_analysis = {}
            
            for district in self.comprehensive_data['District'].unique():
                district_data = self.comprehensive_data[self.comprehensive_data['District'] == district]
                
                # Count crops by category
                category_counts = district_data['Category'].value_counts().to_dict()
                
                # Major district crops (where district is a major producer)
                major_crops = district_data[district_data['Is_Major_District'] == True]['Crop'].tolist()
                
                # Intensive cultivation crops
                intensive_crops = district_data[district_data['Cultivation_Type'] == 'Intensive']['Crop'].tolist()
                
                district_analysis[district] = {
                    "total_crops": len(district_data),
                    "category_distribution": category_counts,
                    "major_specialty_crops": major_crops,
                    "intensive_cultivation_crops": intensive_crops,
                    "specialization_score": len(major_crops) / len(district_data) if len(district_data) > 0 else 0
                }
            
            # Find most specialized districts
            specialized_districts = sorted(
                district_analysis.items(),
                key=lambda x: x[1]['specialization_score'],
                reverse=True
            )[:5]
            
            # Crop-wise major districts
            crop_districts = {}
            for crop in self.comprehensive_data['Crop'].unique():
                crop_data = self.comprehensive_data[self.comprehensive_data['Crop'] == crop]
                major_districts = crop_data[crop_data['Is_Major_District'] == True]['District'].tolist()
                if major_districts:
                    crop_districts[crop] = major_districts
            
            return {
                "district_analysis": district_analysis,
                "most_specialized_districts": [{"district": d[0], "score": round(d[1]['specialization_score'], 3)} for d in specialized_districts],
                "crop_major_districts": crop_districts,
                "total_districts_analyzed": len(district_analysis)
            }
            
        except Exception as e:
            return {"error": f"Error analyzing district specialization: {e}"}
    
    def get_ai_context_for_query(self, user_query: str, district: str = None, current_month: int = None) -> str:
        """Generate contextual data insights for AI responses."""
        context = []
        
        try:
            # Detect crop mentions in query
            query_lower = user_query.lower()
            mentioned_crops = []
            
            if self.comprehensive_data is not None:
                for crop in self.comprehensive_data['Crop'].unique():
                    if crop.lower() in query_lower:
                        mentioned_crops.append(crop)
            
            # Add historical context for mentioned crops
            if mentioned_crops and self.historical_data is not None:
                for crop in mentioned_crops[:2]:  # Limit to first 2 crops
                    productivity_data = self.get_historical_productivity_data(crop, district, years=3)
                    if "error" not in productivity_data:
                        context.append(f"\n📊 {crop.upper()} DATA (Recent 3 years):")
                        context.append(f"- Average productivity: {productivity_data['average_productivity']} tonnes/hectare")
                        context.append(f"- Records from {productivity_data['years_analyzed']} years")
                        
                        if "seasonal_breakdown" in productivity_data:
                            context.append(f"- Best season: Check seasonal productivity data")
                        
                        if "weather_impact_trends" in productivity_data:
                            recent_trends = productivity_data["weather_impact_trends"][-2:]
                            for trend in recent_trends:
                                context.append(f"- {trend['year']}: {trend['trend']} weather (factor: {trend['impact_factor']})")
            
            # Add seasonal context if current month is provided
            if current_month and district:
                seasonal_data = self.get_seasonal_calendar(current_month, district)
                if "error" not in seasonal_data:
                    suitable_crops = seasonal_data.get("total_suitable_crops", 0)
                    if suitable_crops > 0:
                        context.append(f"\n🌱 CURRENT MONTH PLANTING ({seasonal_data['month']}):")
                        context.append(f"- {suitable_crops} crops suitable for planting this month in {district}")
                        
                        # Add category-wise recommendations
                        calendar_by_category = seasonal_data.get("calendar_by_category", {})
                        for category, crops in calendar_by_category.items():
                            if len(crops) > 0:
                                crop_names = [c["crop"] for c in crops[:3]]  # First 3 crops
                                context.append(f"- {category}: {', '.join(crop_names)}")
            
            # Add district specialization context
            if district and self.comprehensive_data is not None:
                district_recs = self.get_crop_recommendations_for_district(district)
                if "error" not in district_recs:
                    context.append(f"\n🗺️ {district.upper()} SPECIALIZATION:")
                    context.append(f"- Total suitable crops: {district_recs['total_crops']}")
                    
                    # Add major categories
                    recommendations = district_recs.get("recommendations", {})
                    for category, crops in recommendations.items():
                        major_crops = [c["crop"] for c in crops if c["is_major_district"]]
                        if major_crops:
                            context.append(f"- {category} major crops: {', '.join(major_crops[:3])}")
            
            return "".join(context) if context else ""
            
        except Exception as e:
            return f"\n❌ Data context error: {e}"
    
    def get_smart_recommendations(self, district: str, current_month: int, user_profile: Dict = None) -> Dict:
        """Get intelligent recommendations based on all available data."""
        recommendations = {
            "immediate_actions": [],
            "seasonal_planting": [],
            "district_advantages": [],
            "productivity_insights": [],
            "weather_considerations": []
        }
        
        try:
            # Get seasonal calendar
            seasonal_data = self.get_seasonal_calendar(current_month, district)
            if "error" not in seasonal_data:
                # Immediate planting opportunities
                calendar_by_category = seasonal_data.get("calendar_by_category", {})
                for category, crops in calendar_by_category.items():
                    for crop in crops[:2]:  # Top 2 crops per category
                        recommendations["seasonal_planting"].append({
                            "crop": crop["crop"],
                            "category": category,
                            "planting_period": crop["planting_period"],
                            "harvest_period": crop["harvest_period"],
                            "is_major_district": crop["is_major_district"]
                        })
            
            # Get district specialization
            district_recs = self.get_crop_recommendations_for_district(district)
            if "error" not in district_recs:
                for category, crops in district_recs.get("recommendations", {}).items():
                    major_crops = [c for c in crops if c["is_major_district"]]
                    if major_crops:
                        recommendations["district_advantages"].append({
                            "category": category,
                            "major_crops": [c["crop"] for c in major_crops[:3]],
                            "advantage": f"{district} is a major producer"
                        })
            
            # Get productivity insights from historical data
            if self.historical_data is not None:
                # Find most productive crops in district
                district_historical = self.historical_data[
                    self.historical_data['District'].str.contains(district, case=False, na=False)
                ]
                
                if not district_historical.empty:
                    # Top productive crops
                    top_productive = district_historical.groupby('Crop')['Productivity_Tonnes_per_Hectare'].mean().sort_values(ascending=False).head(3)
                    
                    for crop, productivity in top_productive.items():
                        recommendations["productivity_insights"].append({
                            "crop": crop,
                            "average_productivity": round(productivity, 2),
                            "insight": f"High productivity crop for {district}"
                        })
            
            # Weather-based recommendations
            current_year = datetime.now().year
            weather_analysis = self.get_weather_impact_analysis([current_year - 1, current_year - 2])
            if "error" not in weather_analysis:
                sensitive_crops = weather_analysis.get("most_weather_sensitive_crops", [])
                if sensitive_crops:
                    recommendations["weather_considerations"].extend([
                        f"Monitor weather closely for {crop}" for crop in sensitive_crops[:2]
                    ])
                
                # Recent weather trends
                recent_years = weather_analysis.get("good_weather_years", []) + weather_analysis.get("poor_weather_years", [])
                if recent_years:
                    last_year = max(recent_years)
                    if last_year in weather_analysis.get("good_weather_years", []):
                        recommendations["weather_considerations"].append("Previous year had good weather - consider expanding cultivation")
                    elif last_year in weather_analysis.get("poor_weather_years", []):
                        recommendations["weather_considerations"].append("Previous year had challenging weather - focus on resilient crops")
            
            return recommendations
            
        except Exception as e:
            return {"error": f"Error generating smart recommendations: {e}"}

# Global instance
agriculture_data_service = KeralaAgricultureDataService()