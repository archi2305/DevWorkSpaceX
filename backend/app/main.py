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
from app.api.activity import router as activity_timeline_router
from app.api.collaboration import router as collaboration_router
from app.api.sprint import router as sprint_router
from app.api.label import router as label_router
from app.api.saved_filter import router as saved_filter_router
from app.api.milestone import router as milestone_router
from app.api.release import router as release_router
from app.api.workload import router as workload_router
from app.api.automation import router as automation_router
from app.api.notification import router as notification_router, websocket_endpoint
from app.api.ai import router as ai_router
from app.api.analytics import router as analytics_router
from app.api.workspace import router as workspace_settings_router
from app.api.comment import router as comments_router
from app.api.time_log import router as time_log_router
from app.api.report import router as report_router
from app.api.github import router as github_router
from app.api.invitation import router as invitation_router
from app.api.custom_field import router as custom_field_router
from app.api.recurring_task import router as recurring_task_router
from app.api.user_profile import router as user_profile_router
from app.api.user_preference import router as user_preference_router
from app.api.integration import router as integration_router
from app.api.export import router as export_router
from app.api.webhooks import router as webhooks_router
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
app.include_router(milestone_router)
app.include_router(release_router)
app.include_router(workload_router)
app.include_router(automation_router)
app.include_router(analytics_router)
app.include_router(workspace_settings_router)
app.include_router(comments_router)
app.include_router(github_router)
app.include_router(activity_timeline_router)
app.include_router(collaboration_router)
app.include_router(sprint_router)
app.include_router(label_router)
app.include_router(saved_filter_router)
app.include_router(time_log_router)
app.include_router(report_router)
app.include_router(invitation_router)
app.include_router(custom_field_router)
app.include_router(recurring_task_router)
app.include_router(user_profile_router)
app.include_router(user_preference_router)
app.include_router(integration_router)
app.include_router(export_router)
app.include_router(webhooks_router)
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