# backend/app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware # <-- Import this
from .api.endpoints import router as api_router

# Create the FastAPI app instance
app = FastAPI(
    title="Power Monitoring System API",
    description="API for monitoring and controlling campus power usage.",
    version="1.0.0"
)

# --- ADD THIS SECTION FOR CORS ---
# Define the list of allowed origins.
# For development, this will be your React app's URL.
origins = [
    "http://localhost:5173", # The default Vite dev server port
    "http://localhost:3000", # A common alternative (e.g., Create React App)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # Allow all methods (GET, POST, etc.)
    allow_headers=["*"], # Allow all headers
)
# ---------------------------------

# Include the API router
app.include_router(api_router, prefix="/api", tags=["API"])

@app.get("/health", tags=["Health Check"])
def health_check():
    """Simple health check endpoint."""
    return {"status": "healthy"}