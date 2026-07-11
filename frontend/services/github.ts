import { api } from './api'

export interface GithubRepository {
  id: string
  workspace_id: string
  name: string
  full_name: string
  html_url: string
}

export interface GithubPullRequest {
  id: string
  repository_id: string
  number: number
  title: string
  state: string
  html_url: string
  task_id?: string
}

export interface GithubCommit {
  id: string
  repository_id: string
  sha: string
  message: string
  author: string
  html_url: string
}

export interface GithubIssue {
  id: string
  repository_id: string
  number: number
  title: string
  state: string
  html_url: string
}

export interface GithubBranch {
  id: string
  repository_id: string
  name: string
  protected: boolean
}

export interface GithubDeployment {
  id: string
  repository_id: string
  environment: string
  status: string
  updated_at: string
}

export const githubService = {
  async getOAuthUrl(): Promise<string> {
    const response = await api.get<{ url: string }>('/github/oauth/url')
    return response.data.url
  },

  async callbackOAuth(code: string): Promise<{ status: string; username: string }> {
    const response = await api.post('/github/oauth/callback', { code })
    return response.data
  },

  async getRepositories(): Promise<GithubRepository[]> {
    const response = await api.get<GithubRepository[]>('/github/repositories')
    return response.data
  },

  async getPullRequests(repositoryId?: string): Promise<GithubPullRequest[]> {
    const response = await api.get<GithubPullRequest[]>('/github/pull-requests', {
      params: repositoryId ? { repository_id: repositoryId } : {}
    })
    return response.data
  },

  async linkTaskToPR(prId: string, taskId: string): Promise<GithubPullRequest> {
    const response = await api.patch<GithubPullRequest>(`/github/pull-requests/${prId}/link-task`, {
      task_id: taskId
    })
    return response.data
  },

  async getCommits(repositoryId: string): Promise<GithubCommit[]> {
    const response = await api.get<GithubCommit[]>('/github/commits', {
      params: { repository_id: repositoryId }
    })
    return response.data
  },

  async getIssues(repositoryId: string): Promise<GithubIssue[]> {
    const response = await api.get<GithubIssue[]>('/github/issues', {
      params: { repository_id: repositoryId }
    })
    return response.data
  },

  async getBranches(repositoryId: string): Promise<GithubBranch[]> {
    const response = await api.get<GithubBranch[]>('/github/branches', {
      params: { repository_id: repositoryId }
    })
    return response.data
  },

  async getDeployments(repositoryId: string): Promise<GithubDeployment[]> {
    const response = await api.get<GithubDeployment[]>('/github/deployments', {
      params: { repository_id: repositoryId }
    })
    return response.data
  }
}
