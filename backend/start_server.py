#!/usr/bin/env python3
import uvicorn
from main import app

if __name__ == "__main__":
    print("Starting Mala Krishi Gyan Backend Server...")
    print("Server will be available at: http://localhost:8081")
    print("API Documentation: http://localhost:8081/docs")
    print("Press CTRL+C to stop the server")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8081,
        reload=True,  # Enable auto-reload during development
        log_level="info"
    )