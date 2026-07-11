import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, status, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.workspace import ConnectedAccount, Workspace
from app.models.github import (
    GithubRepository,
    GithubPullRequest,
    GithubCommit,
    GithubIssue,
    GithubBranch,
    GithubDeployment
)
from app.schemas.github import (
    GithubRepositoryResponse,
    GithubRepositoryCreate,
    GithubPullRequestResponse,
    GithubPullRequestCreate,
    GithubCommitResponse,
    GithubIssueResponse,
    GithubBranchResponse,
    GithubDeploymentResponse,
    LinkTaskRequest,
    OAuthCallbackRequest
)

router = APIRouter(prefix="/github", tags=["GitHub Integration"])

@router.get("/oauth/url", summary="Get GitHub OAuth authorize URL")
def get_oauth_url(current_user: User = Depends(get_current_user)):
    client_id = "Iv1.github_client_id_mock_123"
    redirect_uri = "http://localhost:3000/settings"
    authorize_url = f"https://github.com/login/oauth/authorize?client_id={client_id}&redirect_uri={redirect_uri}&scope=repo,user"
    return {"url": authorize_url}

@router.post("/oauth/callback", summary="Link GitHub OAuth code")
def oauth_callback(
    request: OAuthCallbackRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Mocking token exchange and retrieving profile details
    github_username = "octocat"
    
    # Check if already connected
    existing = db.query(ConnectedAccount).filter(
        ConnectedAccount.user_id == current_user.id,
        ConnectedAccount.provider == "github"
    ).first()
    
    if not existing:
        existing = ConnectedAccount(
            user_id=current_user.id,
            provider="github",
            username=github_username
        )
        db.add(existing)
        db.commit()
        db.refresh(existing)
        
    return {"status": "connected", "username": github_username}

@router.get("/repositories", response_model=List[GithubRepositoryResponse], summary="List connected repositories")
def list_repositories(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ws = db.query(Workspace).first()
    if not ws:
        return []
    
    repos = db.query(GithubRepository).filter(GithubRepository.workspace_id == ws.id).all()
    if not repos:
        # Seed mock repository
        repo = GithubRepository(
            workspace_id=ws.id,
            name="core-service",
            full_name="acme/core-service",
            html_url="https://github.com/acme/core-service"
        )
        db.add(repo)
        db.commit()
        db.refresh(repo)
        repos = [repo]
        
    return repos

@router.post("/repositories", response_model=GithubRepositoryResponse, status_code=status.HTTP_201_CREATED)
def create_repository(
    repo_data: GithubRepositoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ws = db.query(Workspace).first()
    if not ws:
        raise HTTPException(status_code=400, detail="Workspace not found")
        
    repo = GithubRepository(
        workspace_id=ws.id,
        name=repo_data.name,
        full_name=repo_data.full_name,
        html_url=repo_data.html_url
    )
    db.add(repo)
    db.commit()
    db.refresh(repo)
    return repo

@router.get("/pull-requests", response_model=List[GithubPullRequestResponse])
def list_pull_requests(
    repository_id: Optional[uuid.UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(GithubPullRequest)
    if repository_id:
        query = query.filter(GithubPullRequest.repository_id == repository_id)
        
    prs = query.all()
    if not prs and repository_id:
        # Seed mock PR
        pr = GithubPullRequest(
            repository_id=repository_id,
            number=42,
            title="feat: implement secure OAuth layer",
            state="open",
            html_url="https://github.com/acme/core-service/pull/42"
        )
        db.add(pr)
        db.commit()
        db.refresh(pr)
        prs = [pr]
        
    return prs

@router.post("/pull-requests", response_model=GithubPullRequestResponse, status_code=status.HTTP_201_CREATED)
def create_pull_request(
    pr_data: GithubPullRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    pr = GithubPullRequest(
        repository_id=pr_data.repository_id,
        number=pr_data.number,
        title=pr_data.title,
        state=pr_data.state,
        html_url=pr_data.html_url,
        task_id=pr_data.task_id
    )
    db.add(pr)
    db.commit()
    db.refresh(pr)
    return pr

@router.patch("/pull-requests/{pr_id}/link-task", response_model=GithubPullRequestResponse)
def link_task_to_pr(
    pr_id: uuid.UUID,
    link_data: LinkTaskRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    pr = db.query(GithubPullRequest).filter(GithubPullRequest.id == pr_id).first()
    if not pr:
        raise HTTPException(status_code=404, detail="Pull request not found")
        
    pr.task_id = link_data.task_id
    db.commit()
    db.refresh(pr)
    return pr

@router.get("/commits", response_model=List[GithubCommitResponse])
def list_commits(
    repository_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    commits = db.query(GithubCommit).filter(GithubCommit.repository_id == repository_id).all()
    if not commits:
        commit = GithubCommit(
            repository_id=repository_id,
            sha="9eeb1968846c86639c28d7c9a8055be396fc3e0b",
            message="refactor: streamline OAuth controllers",
            author="octocat",
            html_url="https://github.com/acme/core-service/commit/9eeb19688"
        )
        db.add(commit)
        db.commit()
        db.refresh(commit)
        commits = [commit]
    return commits

@router.get("/issues", response_model=List[GithubIssueResponse])
def list_issues(
    repository_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    issues = db.query(GithubIssue).filter(GithubIssue.repository_id == repository_id).all()
    if not issues:
        issue = GithubIssue(
            repository_id=repository_id,
            number=108,
            title="bug: session cookie fails to expire on system logouts",
            state="open",
            html_url="https://github.com/acme/core-service/issues/108"
        )
        db.add(issue)
        db.commit()
        db.refresh(issue)
        issues = [issue]
    return issues

@router.get("/branches", response_model=List[GithubBranchResponse])
def list_branches(
    repository_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    branches = db.query(GithubBranch).filter(GithubBranch.repository_id == repository_id).all()
    if not branches:
        branch = GithubBranch(
            repository_id=repository_id,
            name="main",
            protected=True
        )
        db.add(branch)
        db.commit()
        db.refresh(branch)
        branches = [branch]
    return branches

@router.get("/deployments", response_model=List[GithubDeploymentResponse])
def list_deployments(
    repository_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    deployments = db.query(GithubDeployment).filter(GithubDeployment.repository_id == repository_id).all()
    if not deployments:
        deployment = GithubDeployment(
            repository_id=repository_id,
            environment="production",
            status="success"
        )
        db.add(deployment)
        db.commit()
        db.refresh(deployment)
        deployments = [deployment]
    return deployments

@router.post("/webhook", summary="Receive GitHub Webhook Events")
async def github_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Webhook dispatcher to capture GitHub push and pull request activities.
    """
    payload = await request.json()
    event_type = request.headers.get("X-GitHub-Event", "ping")

    if event_type == "ping":
        return {"status": "pong"}

    elif event_type == "pull_request":
        # Handle PR events
        action = payload.get("action")
        pr_data = payload.get("pull_request", {})
        repo_data = payload.get("repository", {})
        
        repo = db.query(GithubRepository).filter(GithubRepository.full_name == repo_data.get("full_name")).first()
        if repo:
            pr = db.query(GithubPullRequest).filter(
                GithubPullRequest.repository_id == repo.id,
                GithubPullRequest.number == pr_data.get("number")
            ).first()
            
            state = "open" if pr_data.get("state") == "open" else ("merged" if pr_data.get("merged") else "closed")
            
            if not pr:
                pr = GithubPullRequest(
                    repository_id=repo.id,
                    number=pr_data.get("number"),
                    title=pr_data.get("title"),
                    state=state,
                    html_url=pr_data.get("html_url")
                )
                db.add(pr)
            else:
                pr.title = pr_data.get("title")
                pr.state = state
            db.commit()

    return {"status": "processed"}
