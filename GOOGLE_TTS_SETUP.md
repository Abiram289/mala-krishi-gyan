# Google Text-to-Speech Setup Guide

## Prerequisites
You need a Google Cloud account with the Text-to-Speech API enabled.

## Steps

### 1. Enable Google Cloud Text-to-Speech API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Cloud Text-to-Speech API**
4. Go to **APIs & Services > Credentials**

### 2. Create Service Account
1. Click **Create Credentials > Service Account**
2. Enter name: `kerala-krishi-tts`
3. Click **Create and Continue**
4. Add role: **Cloud Text-to-Speech > Text-to-Speech User**
5. Click **Done**

### 3. Download Credentials
1. Click on your service account email
2. Go to **Keys** tab
3. Click **Add Key > Create New Key**
4. Select **JSON** format
5. Download the file

### 4. Local Development Setup
1. Rename the downloaded file to `google-credentials.json`
2. Place it in your project root directory: `D:\SIH\mala-krishi-gyan\google-credentials.json`
3. Add to `.env` file: `GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json`

### 5. Railway Deployment Setup
1. Copy the entire contents of `google-credentials.json`
2. In Railway dashboard → Your service → Variables
3. Add variable:
   - **Key**: `GOOGLE_APPLICATION_CREDENTIALS_JSON`
   - **Value**: Paste the entire JSON content

### 6. Update Backend for Railway
Add this to the beginning of `backend/main.py`:

```python
import json
import tempfile

# For Railway deployment - create credentials file from environment variable
if os.getenv("GOOGLE_APPLICATION_CREDENTIALS_JSON"):
    credentials_json = os.getenv("GOOGLE_APPLICATION_CREDENTIALS_JSON")
    with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.json') as f:
        f.write(credentials_json)
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = f.name
```

### 7. Security Note
- **Never commit `google-credentials.json` to Git!**
- Add it to `.gitignore`
- Only use environment variables in production

### 8. Test the Setup
1. Start your backend: `cd backend && python -m uvicorn main:app --reload --port 8081`
2. Test TTS endpoint: `POST http://localhost:8081/tts`
3. Send body: `{"text": "നമസ്കാരം, കേരള കൃഷി സഹായ്", "language": "ml"}`

## Voice Options
The API supports:
- **Malayalam (ml-IN)**: High-quality native Malayalam voices
- **English (en-IN)**: Indian-accented English voices

## Pricing
- Google TTS is free for up to 1 million characters per month
- Perfect for a farming assistant application