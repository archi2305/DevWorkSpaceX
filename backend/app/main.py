from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError
from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.projects import router as projects_router
from app.api.tasks import router as tasks_router
from app.api.dashboard import router as dashboard_router
from app.api.search import router as search_router
from app.api.dashboard_unified import router as dashboard_unified_router
from app.api.team import router as team_router
from app.api.document import router as document_router
from app.api.file_asset import router as file_router
from app.api.calendar import router as calendar_router
from app.api.notification import router as notification_router, websocket_endpoint
from app.api.ai import router as ai_router
from app.api.analytics import router as analytics_router
from app.api.workspace import router as workspace_settings_router
from app.api.comment import router as comments_router
from app.api.activity import router as activity_timeline_router
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
app.include_router(projects_router)
app.include_router(tasks_router)
app.include_router(dashboard_router)
app.include_router(search_router)
app.include_router(dashboard_unified_router)
app.include_router(team_router)
app.include_router(document_router)
app.include_router(file_router)
app.include_router(calendar_router)
app.include_router(notification_router)
app.include_router(ai_router)
app.include_router(analytics_router)
app.include_router(workspace_settings_router)
app.include_router(comments_router)
app.include_router(activity_timeline_router)
app.add_api_websocket_route("/notifications/ws", websocket_endpoint)

# --- Global Exception Handlers ---

@app.exception_handler(SQLAlchemyError)
def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    """
    Handle database connection or integrity issues gracefully.
    """
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "A database error occurred. Please try again later."}
    )

@app.exception_handler(Exception)
def general_exception_handler(request: Request, exc: Exception):
    """
    Catch-all for unhandled generic errors.
    """
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": f"Internal Server Error: {str(exc)}"}
    )

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