import logging
from sqlalchemy.exc import SQLAlchemyError
from app.database.db import engine, Base

# Import all models to ensure they are registered on Base.metadata
from app.models.user import User
from app.models.project import Project
from app.models.task import Task
from app.models.activity import ActivityLog
from app.models.notification import Notification
from app.models.sprint import Sprint
from app.models.suggestion import AISuggestion
from app.models.workspace_member import WorkspaceMember
from app.models.document import Document, DocumentVersion
from app.models.file_asset import FileAsset
from app.models.comment import Comment, CommentReply
from app.models.ai import AIConversation, AIMessage, Blueprint
from app.models.workspace import Workspace, APIKey, UserSession, ConnectedAccount, APIKeyUsageHistory
from app.models.milestone import Milestone
from app.models.release import Release
from app.models.automation_rule import AutomationRule
from app.models.github import GithubRepository, GithubPullRequest, GithubCommit, GithubIssue, GithubBranch, GithubDeployment
from app.models.saved_filter import SavedFilter
from app.models.time_log import TimeLog
from app.models.custom_field import CustomFieldDefinition, CustomFieldValue
from app.models.recurring_task import RecurringTask, RecurringTaskHistory
from app.models.user_preference import UserPreference
from app.models.integration import Integration
from app.models.system_webhook import SystemWebhook
from app.models.chat_channel import ChatChannel, ChannelMessage
from app.models.support_ticket import SupportTicket
from app.models.faq import FAQ
from app.models.label import Label, task_labels
from app.models.token_blacklist import BlacklistedToken

logger = logging.getLogger(__name__)

def init_db():
    """
    Initialize database schema non-destructively.
    Creates all tables if they do not exist.
    """
    try:
        logger.info("Initializing database tables...")
        Base.metadata.create_all(bind=engine)
        logger.info("All database tables verified/created successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize database tables: {e}")
        raise e
