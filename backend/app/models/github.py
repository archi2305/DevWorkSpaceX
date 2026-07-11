import uuid
from datetime import datetime
from sqlalchemy import String, ForeignKey, DateTime, Integer, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.db import Base

class GithubRepository(Base):
    __tablename__ = "github_repositories"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    html_url: Mapped[str] = mapped_column(String(500), nullable=False)

class GithubPullRequest(Base):
    __tablename__ = "github_pull_requests"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    repository_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("github_repositories.id", ondelete="CASCADE"), nullable=False)
    number: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    state: Mapped[str] = mapped_column(String(50), default="open", nullable=False) # open, closed, merged
    html_url: Mapped[str] = mapped_column(String(500), nullable=False)
    task_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("tasks.id", ondelete="SET NULL"), nullable=True)

    task = relationship("Task", backref="pull_requests")

class GithubCommit(Base):
    __tablename__ = "github_commits"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    repository_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("github_repositories.id", ondelete="CASCADE"), nullable=False)
    sha: Mapped[str] = mapped_column(String(100), nullable=False)
    message: Mapped[str] = mapped_column(String(500), nullable=False)
    author: Mapped[str] = mapped_column(String(100), nullable=False)
    html_url: Mapped[str] = mapped_column(String(500), nullable=False)

class GithubIssue(Base):
    __tablename__ = "github_issues"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    repository_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("github_repositories.id", ondelete="CASCADE"), nullable=False)
    number: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    state: Mapped[str] = mapped_column(String(50), default="open", nullable=False)
    html_url: Mapped[str] = mapped_column(String(500), nullable=False)

class GithubBranch(Base):
    __tablename__ = "github_branches"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    repository_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("github_repositories.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    protected: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

class GithubDeployment(Base):
    __tablename__ = "github_deployments"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    repository_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("github_repositories.id", ondelete="CASCADE"), nullable=False)
    environment: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False) # success, failure, pending
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

class GithubWorkflowRun(Base):
    __tablename__ = "github_workflow_runs"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    repository_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("github_repositories.id", ondelete="CASCADE"), nullable=False)
    run_number: Mapped[int] = mapped_column(Integer, nullable=False)
    event: Mapped[str] = mapped_column(String(50), nullable=False) # push, pull_request
    status: Mapped[str] = mapped_column(String(50), nullable=False) # completed, in_progress, queued
    conclusion: Mapped[str | None] = mapped_column(String(50), nullable=True) # success, failure, cancelled
    html_url: Mapped[str] = mapped_column(String(500), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
