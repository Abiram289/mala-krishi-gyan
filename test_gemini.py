#!/usr/bin/env python3
"""
Simple test script to check Gemini API connectivity and quota
"""

import os
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

def test_gemini_api():
    print("🤖 Testing Gemini API...")
    print(f"API Key: {GEMINI_API_KEY[:10]}..." if GEMINI_API_KEY else "❌ No API key found")
    
    if not GEMINI_API_KEY:
        print("❌ GEMINI_API_KEY not found in environment")
        return False
    
    try:
        # Configure Gemini
        genai.configure(api_key=GEMINI_API_KEY)
        
        # Create model
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        print("📡 Sending test request to Gemini...")
        
        # Test with simple prompt
        response = model.generate_content("Hello, can you respond with just 'API working'?")
        
        print(f"✅ Success! Response: {response.text}")
        return True
        
    except Exception as e:
        print(f"❌ Gemini API Error: {type(e).__name__}")
        print(f"Error details: {str(e)}")
        
        # Check specific error types
        if "PERMISSION_DENIED" in str(e):
            print("🔑 Issue: API key invalid or permissions denied")
        elif "RESOURCE_EXHAUSTED" in str(e):
            print("📊 Issue: Quota exceeded - check billing/usage")
        elif "UNAVAILABLE" in str(e):
            print("🌐 Issue: Service temporarily unavailable")
        elif "DEADLINE_EXCEEDED" in str(e):
            print("⏱️ Issue: Request timeout")
        else:
            print("🔍 Unknown error - check API key and internet connection")
        
        return False

if __name__ == "__main__":
    test_gemini_api()