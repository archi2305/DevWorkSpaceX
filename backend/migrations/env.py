import os
import sys
from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# Add app parent directory (backend root) to sys.path
# This permits Alembic to import app modules correctly when executing migrations
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.database.db import Base
# Import models here to ensure they are registered on Base.metadata
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
from app.models.ai import AIConversation, AIMessage
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

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Override sqlalchemy.url with the configuration from settings (loaded from .env)
# This keeps secrets out of alembic.ini
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Set target metadata for autogenerate support
target_metadata = Base.metadata

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
