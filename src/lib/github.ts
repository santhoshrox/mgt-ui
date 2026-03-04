const API = 'https://api.github.com'

// ── Cache ──────────────────────────────────────────────────────────
const cache = new Map<string, { data: unknown; ts: number }>()

function getCached<T>(key: string, ttl = 60_000): T | null {
  const entry = cache.get(key)
  if (entry && Date.now() - entry.ts < ttl) return entry.data as T
  return null
}

function setCache(key: string, data: unknown) {
  cache.set(key, { data, ts: Date.now() })
}

export function clearCache() {
  cache.clear()
}

// ── Types ──────────────────────────────────────────────────────────
export interface GHUser {
  login: string
  avatar_url: string
  name: string | null
  bio: string | null
  html_url: string
  public_repos: number
  followers: number
  following: number
  created_at: string
}

export interface GHLabel {
  name: string
  color: string
}

export interface GHSearchItem {
  number: number
  title: string
  state: string
  draft?: boolean
  user: { login: string; avatar_url: string }
  labels: GHLabel[]
  created_at: string
  updated_at: string
  pull_request?: { url: string; merged_at: string | null }
  repository_url: string
  comments: number
  body: string | null
}

export interface GHSearchResult {
  total_count: number
  incomplete_results: boolean
  items: GHSearchItem[]
}

export interface GHPullRequest {
  number: number
  title: string
  state: string
  draft: boolean
  user: { login: string; avatar_url: string }
  labels: GHLabel[]
  created_at: string
  updated_at: string
  merged_at: string | null
  closed_at: string | null
  head: { ref: string; sha: string; repo: { full_name: string } | null }
  base: { ref: string }
  additions: number
  deletions: number
  comments: number
  review_comments: number
  mergeable_state: string
  merged: boolean
  html_url: string
  body: string | null
}

export interface GHReview {
  id: number
  user: { login: string; avatar_url: string }
  state: string // APPROVED, CHANGES_REQUESTED, COMMENTED, DISMISSED, PENDING
  body: string
  submitted_at: string
  html_url: string
}

export interface GHReviewComment {
  id: number
  user: { login: string; avatar_url: string }
  path: string
  line: number | null
  original_line: number | null
  body: string
  created_at: string
  updated_at: string
  diff_hunk: string
  html_url: string
  pull_request_url: string
}

export interface GHCheckRun {
  id: number
  name: string
  status: string // queued, in_progress, completed
  conclusion: string | null // success, failure, neutral, cancelled, skipped, timed_out, action_required
  started_at: string | null
  completed_at: string | null
  html_url: string
}

export interface GHRepo {
  full_name: string
  name: string
  owner: { login: string; avatar_url: string }
  html_url: string
  description: string | null
  language: string | null
  stargazers_count: number
  open_issues_count: number
  updated_at: string
  default_branch: string
  private: boolean
}

// ── Fetch wrapper ──────────────────────────────────────────────────
async function ghFetch<T>(token: string, path: string, ttl?: number): Promise<T> {
  const key = path
  if (ttl) {
    const hit = getCached<T>(key, ttl)
    if (hit) return hit
  }

  const res = await fetch(`${API}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })

  if (res.status === 401) throw new Error('UNAUTHORIZED')
  if (res.status === 403) {
    const remaining = res.headers.get('x-ratelimit-remaining')
    if (remaining === '0') throw new Error('RATE_LIMITED')
    throw new Error('FORBIDDEN')
  }
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${res.statusText}`)

  const data = await res.json()
  if (ttl) setCache(key, data)
  return data as T
}

// ── API functions ──────────────────────────────────────────────────

export async function fetchUser(token: string): Promise<GHUser> {
  return ghFetch<GHUser>(token, '/user', 300_000)
}

export async function searchPRs(
  token: string,
  query: string,
  perPage = 30
): Promise<GHSearchResult> {
  const q = encodeURIComponent(query)
  return ghFetch<GHSearchResult>(
    token,
    `/search/issues?q=${q}&per_page=${perPage}&sort=updated&order=desc`,
    30_000
  )
}

export async function fetchPR(
  token: string,
  owner: string,
  repo: string,
  number: number
): Promise<GHPullRequest> {
  return ghFetch<GHPullRequest>(token, `/repos/${owner}/${repo}/pulls/${number}`, 30_000)
}

export async function fetchPRReviews(
  token: string,
  owner: string,
  repo: string,
  number: number
): Promise<GHReview[]> {
  return ghFetch<GHReview[]>(token, `/repos/${owner}/${repo}/pulls/${number}/reviews`, 30_000)
}

export async function fetchReviewComments(
  token: string,
  owner: string,
  repo: string,
  number: number
): Promise<GHReviewComment[]> {
  return ghFetch<GHReviewComment[]>(
    token,
    `/repos/${owner}/${repo}/pulls/${number}/comments?per_page=100`,
    30_000
  )
}

export async function fetchCheckRuns(
  token: string,
  owner: string,
  repo: string,
  ref: string
): Promise<{ check_runs: GHCheckRun[] }> {
  return ghFetch(token, `/repos/${owner}/${repo}/commits/${ref}/check-runs?per_page=100`, 30_000)
}

export async function fetchUserRepos(
  token: string,
  perPage = 20
): Promise<GHRepo[]> {
  return ghFetch<GHRepo[]>(
    token,
    `/user/repos?sort=pushed&direction=desc&per_page=${perPage}&type=owner`,
    60_000
  )
}

export async function fetchRepoPRs(
  token: string,
  owner: string,
  repo: string,
  state: 'open' | 'closed' | 'all' = 'open',
  perPage = 30
): Promise<GHPullRequest[]> {
  return ghFetch<GHPullRequest[]>(
    token,
    `/repos/${owner}/${repo}/pulls?state=${state}&per_page=${perPage}&sort=updated&direction=desc`,
    30_000
  )
}

// ── Mutations ─────────────────────────────────────────────────────

export async function mergePR(
  token: string,
  owner: string,
  repo: string,
  number: number,
  method: 'merge' | 'squash' | 'rebase' = 'squash',
): Promise<{ sha: string; merged: boolean; message: string }> {
  const res = await fetch(`${API}/repos/${owner}/${repo}/pulls/${number}/merge`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify({ merge_method: method }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || `Merge failed (${res.status})`)
  }
  return res.json()
}

// ── Helpers ────────────────────────────────────────────────────────

export function repoFromUrl(repositoryUrl: string): { owner: string; repo: string } {
  const parts = repositoryUrl.replace(`${API}/repos/`, '').split('/')
  return { owner: parts[0], repo: parts[1] }
}

export function prUrlParts(prUrl: string): { owner: string; repo: string; number: number } {
  const parts = prUrl.replace(`${API}/repos/`, '').split('/')
  return { owner: parts[0], repo: parts[1], number: parseInt(parts[3], 10) }
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return `${Math.floor(days / 30)}mo ago`
}

export function hoursBetween(a: string, b: string): number {
  return Math.abs(new Date(b).getTime() - new Date(a).getTime()) / 3_600_000
}
