# 🌾 Kerala Krishi - AI-Powered Personal Farming Assistant

[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)](https://typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104.1-green.svg)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.12-yellow.svg)](https://python.org/)

> **"Krishi Sakhi"** - Your digital farming companion for Kerala farmers with advanced Malayalam voice interface and AI-powered agricultural guidance.

## 🎯 Problem Statement

Kerala's smallholder farmers face several interconnected challenges:
- **Lack of personalized agricultural advice** specific to Kerala's diverse climatic conditions
- **Language barriers** with most digital platforms operating in English
- **Absence of activity tracking** limiting learning from past seasons
- **Information fragmentation** making it difficult to access comprehensive farming guidance

## ✨ Solution Overview

**Kerala Krishi** addresses these challenges through:
- 🎤 **Advanced Malayalam Voice Interface** with agricultural terminology
- 🤖 **AI-Powered Personalized Advisory** using Google Gemini
- 🌱 **Kerala-Specific Agricultural Knowledge** (crops, soil types, seasons)
- 📊 **Smart Activity Tracking** with voice input capabilities
- 🌤️ **Real-time Weather Integration** with farming alerts
- 🏛️ **Government Schemes Information** for Kerala farmers

## 🏗️ Project Structure

```
mala-krishi-gyan/
├── frontend/                 # React + TypeScript frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Application pages
│   │   ├── lib/             # Utilities and services
│   │   └── hooks/           # Custom React hooks
│   └── public/              # Static assets
├── backend/                  # FastAPI Python backend
│   ├── main.py              # FastAPI application
│   ├── start_server.py      # Server startup script
│   └── requirements.txt     # Python dependencies
└── README.md                # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.12+
- OpenWeatherMap API key (free)

### 1. Environment Setup

Create `.env` in root directory:
```env
VITE_SUPABASE_URL="https://lvadunvfhmgrenxgbhla.supabase.co"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
VITE_API_BASE_URL="http://localhost:8081"
GEMINI_API_KEY="your-gemini-api-key"
VITE_OPENWEATHER_API_KEY="your-openweather-api-key"
```

Create `backend/.env`:
```env
VITE_SUPABASE_URL="https://lvadunvfhmgrenxgbhla.supabase.co"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
GEMINI_API_KEY="your-gemini-api-key"
OPENWEATHER_API_KEY="your-openweather-api-key"
```

### 2. Installation

**Frontend:**
```bash
npm install
```

**Backend:**
```bash
cd backend
pip install -r requirements.txt
```

### 3. Development Servers

**Backend (Terminal 1):**
```bash
cd backend
python start_server.py
```
*Backend runs on: http://localhost:8081*

**Frontend (Terminal 2):**
```bash
npm run dev
```
*Frontend runs on: http://localhost:8000*

## 🌟 Features

### ✅ Completed
- 🎤 **Malayalam Voice Recognition** with agricultural terminology
- 🤖 **AI Chat Assistant** powered by Google Gemini
- 👤 **User Authentication** via Supabase
- 🌾 **Farm Profiling** with Kerala soil types
- 🌤️ **Real-time Weather** with farming alerts
- 📱 **Mobile-responsive** design
- 🌍 **Bilingual Interface** (English/Malayalam)

### 🔄 In Development
- 📊 Activity persistence to database
- 🏛️ Government schemes integration
- 👥 Community forum features

## 🛠️ Tech Stack

**Frontend:** React 18 + TypeScript + Vite + shadcn/ui + Tailwind CSS  
**Backend:** FastAPI + Python + Supabase + Google Gemini AI  
**APIs:** OpenWeatherMap + Web Speech API  

## 📊 Project Status: 85% Complete

| Component | Status | Completion |
|-----------|--------|-----------|
| Voice Interface | ✅ Complete | 100% |
| AI Assistant | ✅ Complete | 100% |
| User Profiles | ✅ Complete | 100% |
| Weather API | ✅ Complete | 100% |
| Activity Tracking | ⚠️ UI Done | 80% |
| Gov Schemes | ⚠️ Basic | 40% |

## 🎯 Hackathon Highlights

- **Only solution** with advanced Malayalam agricultural voice interface
- **Kerala-specific** optimization for local crops and soil types
- **Production-ready** AI integration with seasonal intelligence
- **85% problem statement coverage** with exceptional technical quality

## 🔧 How can I edit this code?


**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

To deploy this project, build the application using `npm run build` and then upload the contents of the generated `dist` folder to your hosting provider.

