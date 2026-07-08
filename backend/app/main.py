from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.core.config import settings

# Initialize the FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Core backend services for DevWorkspace X SaaS workspace",
    version="1.0.0",
)

# Set up CORS middleware to allow frontend communication
if settings.ALLOWED_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Register routers
app.include_router(auth_router)
app.include_router(users_router)

@app.get("/", summary="Root Endpoint")
def root():
    """
    Root endpoint to confirm application status.
    """
    return {
        "message": "Welcome to DevWorkspace X Backend 🚀",
        "status": "healthy",
        "docs_url": "/docs"
    }