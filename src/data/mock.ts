export interface Branch {
  name: string
  pr?: PullRequest
  status: 'current' | 'above' | 'below' | 'trunk'
}

export interface PullRequest {
  id: number
  number: number
  title: string
  author: string
  authorAvatar: string
  repo: string
  status: 'open' | 'merged' | 'closed' | 'draft'
  ciStatus: 'passing' | 'failing' | 'pending' | 'none'
  reviewStatus: 'approved' | 'changes_requested' | 'pending' | 'none'
  additions: number
  deletions: number
  comments: number
  labels: string[]
  createdAt: string
  updatedAt: string
  baseBranch: string
  headBranch: string
  stackPosition?: number
  stackSize?: number
}

export interface ReviewComment {
  id: number
  file: string
  line: number
  body: string
  author: string
  authorAvatar: string
  type: 'bug' | 'suggestion' | 'nitpick' | 'question'
  aiGenerated: boolean
  resolved: boolean
  createdAt: string
  codeSnippet: string
  suggestion?: string
}

export interface MergeQueueItem {
  id: number
  pr: PullRequest
  position: number
  estimatedMergeTime: string
  ciJobs: CIJob[]
  status: 'waiting' | 'running' | 'ready' | 'failed'
}

export interface CIJob {
  name: string
  status: 'passing' | 'failing' | 'running' | 'queued' | 'skipped'
  duration?: string
}

export interface InsightMetric {
  label: string
  value: number | string
  change?: number
  unit?: string
}

export interface TimeSeriesPoint {
  date: string
  prsOpened: number
  prsMerged: number
  reviewsDone: number
}

const avatars = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=santhosh',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=alex',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=jordan',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=casey',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=riley',
]

export const currentStack: Branch[] = [
  { name: 'main', status: 'trunk' },
  { name: 'santhosh/auth-middleware', status: 'below', pr: { id: 1, number: 42, title: 'Add JWT auth middleware', author: 'santhosh', authorAvatar: avatars[0], repo: 'acme/backend', status: 'open', ciStatus: 'passing', reviewStatus: 'approved', additions: 124, deletions: 18, comments: 3, labels: ['auth', 'middleware'], createdAt: '2026-02-28T10:00:00Z', updatedAt: '2026-03-02T14:30:00Z', baseBranch: 'main', headBranch: 'santhosh/auth-middleware', stackPosition: 1, stackSize: 4 } },
  { name: 'santhosh/user-model', status: 'below', pr: { id: 2, number: 43, title: 'Add User model with roles', author: 'santhosh', authorAvatar: avatars[0], repo: 'acme/backend', status: 'open', ciStatus: 'passing', reviewStatus: 'pending', additions: 89, deletions: 4, comments: 1, labels: ['models'], createdAt: '2026-02-28T11:00:00Z', updatedAt: '2026-03-02T15:00:00Z', baseBranch: 'santhosh/auth-middleware', headBranch: 'santhosh/user-model', stackPosition: 2, stackSize: 4 } },
  { name: 'santhosh/rbac-checks', status: 'current', pr: { id: 3, number: 44, title: 'Implement RBAC permission checks', author: 'santhosh', authorAvatar: avatars[0], repo: 'acme/backend', status: 'open', ciStatus: 'pending', reviewStatus: 'none', additions: 203, deletions: 12, comments: 0, labels: ['auth', 'security'], createdAt: '2026-03-01T09:00:00Z', updatedAt: '2026-03-03T08:00:00Z', baseBranch: 'santhosh/user-model', headBranch: 'santhosh/rbac-checks', stackPosition: 3, stackSize: 4 } },
  { name: 'santhosh/rbac-tests', status: 'above', pr: { id: 4, number: 45, title: 'Add RBAC integration tests', author: 'santhosh', authorAvatar: avatars[0], repo: 'acme/backend', status: 'draft', ciStatus: 'none', reviewStatus: 'none', additions: 312, deletions: 0, comments: 0, labels: ['tests'], createdAt: '2026-03-02T10:00:00Z', updatedAt: '2026-03-03T07:00:00Z', baseBranch: 'santhosh/rbac-checks', headBranch: 'santhosh/rbac-tests', stackPosition: 4, stackSize: 4 } },
]

export const inboxPRs: PullRequest[] = [
  { id: 5, number: 101, title: 'Fix memory leak in WebSocket handler', author: 'alex', authorAvatar: avatars[1], repo: 'acme/backend', status: 'open', ciStatus: 'passing', reviewStatus: 'pending', additions: 45, deletions: 23, comments: 2, labels: ['bug', 'critical'], createdAt: '2026-03-02T08:00:00Z', updatedAt: '2026-03-03T10:00:00Z', baseBranch: 'main', headBranch: 'alex/fix-ws-leak' },
  { id: 6, number: 102, title: 'Migrate to PostgreSQL 17', author: 'jordan', authorAvatar: avatars[2], repo: 'acme/backend', status: 'open', ciStatus: 'failing', reviewStatus: 'changes_requested', additions: 1250, deletions: 890, comments: 12, labels: ['migration', 'database'], createdAt: '2026-02-25T14:00:00Z', updatedAt: '2026-03-03T09:30:00Z', baseBranch: 'main', headBranch: 'jordan/pg17-migration' },
  { id: 7, number: 103, title: 'Add dark mode toggle to settings', author: 'casey', authorAvatar: avatars[3], repo: 'acme/frontend', status: 'open', ciStatus: 'passing', reviewStatus: 'approved', additions: 78, deletions: 15, comments: 5, labels: ['ui', 'feature'], createdAt: '2026-03-01T16:00:00Z', updatedAt: '2026-03-03T11:00:00Z', baseBranch: 'main', headBranch: 'casey/dark-mode' },
  { id: 8, number: 104, title: 'Optimize image loading pipeline', author: 'riley', authorAvatar: avatars[4], repo: 'acme/frontend', status: 'open', ciStatus: 'passing', reviewStatus: 'pending', additions: 167, deletions: 43, comments: 3, labels: ['performance'], createdAt: '2026-03-02T11:00:00Z', updatedAt: '2026-03-03T07:45:00Z', baseBranch: 'main', headBranch: 'riley/image-pipeline' },
  { id: 9, number: 105, title: 'Implement rate limiting middleware', author: 'santhosh', authorAvatar: avatars[0], repo: 'acme/backend', status: 'merged', ciStatus: 'passing', reviewStatus: 'approved', additions: 95, deletions: 8, comments: 4, labels: ['security', 'middleware'], createdAt: '2026-02-27T09:00:00Z', updatedAt: '2026-03-02T16:00:00Z', baseBranch: 'main', headBranch: 'santhosh/rate-limiter' },
  { id: 10, number: 106, title: 'Add Stripe webhook handlers', author: 'alex', authorAvatar: avatars[1], repo: 'acme/backend', status: 'open', ciStatus: 'pending', reviewStatus: 'none', additions: 234, deletions: 12, comments: 0, labels: ['payments', 'feature'], createdAt: '2026-03-03T06:00:00Z', updatedAt: '2026-03-03T06:00:00Z', baseBranch: 'main', headBranch: 'alex/stripe-webhooks' },
  { id: 11, number: 107, title: 'Refactor error handling to use Result type', author: 'jordan', authorAvatar: avatars[2], repo: 'acme/backend', status: 'open', ciStatus: 'passing', reviewStatus: 'approved', additions: 456, deletions: 312, comments: 8, labels: ['refactor', 'dx'], createdAt: '2026-02-26T13:00:00Z', updatedAt: '2026-03-03T08:15:00Z', baseBranch: 'main', headBranch: 'jordan/result-type' },
  { id: 12, number: 108, title: 'Add E2E tests for checkout flow', author: 'casey', authorAvatar: avatars[3], repo: 'acme/frontend', status: 'draft', ciStatus: 'none', reviewStatus: 'none', additions: 567, deletions: 0, comments: 1, labels: ['tests', 'e2e'], createdAt: '2026-03-03T04:00:00Z', updatedAt: '2026-03-03T04:00:00Z', baseBranch: 'main', headBranch: 'casey/checkout-e2e' },
]

export const reviewComments: ReviewComment[] = [
  {
    id: 1, file: 'pkg/auth/middleware.go', line: 47,
    body: 'The token validation does not check for expiration. An expired JWT will still pass this check, which is a security vulnerability.',
    author: 'Diamond', authorAvatar: '', type: 'bug', aiGenerated: true, resolved: false,
    createdAt: '2026-03-03T08:00:00Z',
    codeSnippet: `func ValidateToken(tokenStr string) (*Claims, error) {\n\ttoken, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {\n\t\treturn signingKey, nil\n\t})\n\tif err != nil {\n\t\treturn nil, err\n\t}\n\tclaims := token.Claims.(jwt.MapClaims)\n\treturn &Claims{UserID: claims["uid"].(string)}, nil\n}`,
    suggestion: `func ValidateToken(tokenStr string) (*Claims, error) {\n\ttoken, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(t *jwt.Token) (interface{}, error) {\n\t\tif _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {\n\t\t\treturn nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])\n\t\t}\n\t\treturn signingKey, nil\n\t})\n\tif err != nil {\n\t\treturn nil, err\n\t}\n\tclaims, ok := token.Claims.(*Claims)\n\tif !ok || !token.Valid {\n\t\treturn nil, ErrInvalidToken\n\t}\n\treturn claims, nil\n}`,
  },
  {
    id: 2, file: 'pkg/auth/middleware.go', line: 23,
    body: 'Consider using a constant-time comparison for the API key check to prevent timing attacks.',
    author: 'Diamond', authorAvatar: '', type: 'suggestion', aiGenerated: true, resolved: false,
    createdAt: '2026-03-03T08:01:00Z',
    codeSnippet: `if apiKey == expectedKey {\n\tnext.ServeHTTP(w, r)\n\treturn\n}`,
    suggestion: `if subtle.ConstantTimeCompare([]byte(apiKey), []byte(expectedKey)) == 1 {\n\tnext.ServeHTTP(w, r)\n\treturn\n}`,
  },
  {
    id: 3, file: 'pkg/models/user.go', line: 34,
    body: 'The `Role` field defaults to an empty string. This means a user created without an explicit role will have no permissions, which could silently break access control if callers forget to set it.',
    author: 'Diamond', authorAvatar: '', type: 'bug', aiGenerated: true, resolved: true,
    createdAt: '2026-03-03T08:02:00Z',
    codeSnippet: `type User struct {\n\tID    string \`json:"id"\`\n\tEmail string \`json:"email"\`\n\tRole  string \`json:"role"\`\n}`,
    suggestion: `type User struct {\n\tID    string \`json:"id"\`\n\tEmail string \`json:"email"\`\n\tRole  string \`json:"role" default:"viewer"\`\n}\n\nfunc NewUser(id, email string) *User {\n\treturn &User{ID: id, Email: email, Role: "viewer"}\n}`,
  },
  {
    id: 4, file: 'pkg/auth/rbac.go', line: 15,
    body: 'Nit: the permission constants could use a typed enum pattern for better type safety.',
    author: 'Diamond', authorAvatar: '', type: 'nitpick', aiGenerated: true, resolved: false,
    createdAt: '2026-03-03T08:03:00Z',
    codeSnippet: `const (\n\tPermRead   = "read"\n\tPermWrite  = "write"\n\tPermAdmin  = "admin"\n\tPermDelete = "delete"\n)`,
  },
  {
    id: 5, file: 'pkg/auth/rbac.go', line: 58,
    body: 'What happens if the `permissions` map is nil? This would panic at runtime.',
    author: 'Diamond', authorAvatar: '', type: 'question', aiGenerated: true, resolved: false,
    createdAt: '2026-03-03T08:04:00Z',
    codeSnippet: `func HasPermission(role string, perm string) bool {\n\tperms := permissions[role]\n\tfor _, p := range perms {\n\t\tif p == perm {\n\t\t\treturn true\n\t\t}\n\t}\n\treturn false\n}`,
  },
]

export const mergeQueue: MergeQueueItem[] = [
  {
    id: 1, position: 1, estimatedMergeTime: '2 min', status: 'running',
    pr: { id: 7, number: 103, title: 'Add dark mode toggle to settings', author: 'casey', authorAvatar: avatars[3], repo: 'acme/frontend', status: 'open', ciStatus: 'passing', reviewStatus: 'approved', additions: 78, deletions: 15, comments: 5, labels: ['ui', 'feature'], createdAt: '2026-03-01T16:00:00Z', updatedAt: '2026-03-03T11:00:00Z', baseBranch: 'main', headBranch: 'casey/dark-mode' },
    ciJobs: [
      { name: 'lint', status: 'passing', duration: '32s' },
      { name: 'unit-tests', status: 'passing', duration: '1m 12s' },
      { name: 'integration-tests', status: 'running' },
      { name: 'e2e-tests', status: 'queued' },
    ],
  },
  {
    id: 2, position: 2, estimatedMergeTime: '8 min', status: 'waiting',
    pr: { id: 11, number: 107, title: 'Refactor error handling to use Result type', author: 'jordan', authorAvatar: avatars[2], repo: 'acme/backend', status: 'open', ciStatus: 'passing', reviewStatus: 'approved', additions: 456, deletions: 312, comments: 8, labels: ['refactor', 'dx'], createdAt: '2026-02-26T13:00:00Z', updatedAt: '2026-03-03T08:15:00Z', baseBranch: 'main', headBranch: 'jordan/result-type' },
    ciJobs: [
      { name: 'lint', status: 'passing', duration: '28s' },
      { name: 'unit-tests', status: 'passing', duration: '2m 05s' },
      { name: 'integration-tests', status: 'skipped' },
      { name: 'build', status: 'passing', duration: '45s' },
    ],
  },
  {
    id: 3, position: 3, estimatedMergeTime: '15 min', status: 'waiting',
    pr: { id: 5, number: 101, title: 'Fix memory leak in WebSocket handler', author: 'alex', authorAvatar: avatars[1], repo: 'acme/backend', status: 'open', ciStatus: 'passing', reviewStatus: 'approved', additions: 45, deletions: 23, comments: 2, labels: ['bug', 'critical'], createdAt: '2026-03-02T08:00:00Z', updatedAt: '2026-03-03T10:00:00Z', baseBranch: 'main', headBranch: 'alex/fix-ws-leak' },
    ciJobs: [
      { name: 'lint', status: 'queued' },
      { name: 'unit-tests', status: 'queued' },
      { name: 'integration-tests', status: 'queued' },
      { name: 'build', status: 'queued' },
    ],
  },
  {
    id: 4, position: 4, estimatedMergeTime: '—', status: 'failed',
    pr: { id: 8, number: 104, title: 'Optimize image loading pipeline', author: 'riley', authorAvatar: avatars[4], repo: 'acme/frontend', status: 'open', ciStatus: 'failing', reviewStatus: 'approved', additions: 167, deletions: 43, comments: 3, labels: ['performance'], createdAt: '2026-03-02T11:00:00Z', updatedAt: '2026-03-03T07:45:00Z', baseBranch: 'main', headBranch: 'riley/image-pipeline' },
    ciJobs: [
      { name: 'lint', status: 'passing', duration: '25s' },
      { name: 'unit-tests', status: 'failing', duration: '1m 48s' },
      { name: 'integration-tests', status: 'skipped' },
      { name: 'build', status: 'skipped' },
    ],
  },
]

export const insightMetrics: InsightMetric[] = [
  { label: 'PRs Merged', value: 47, change: 12, unit: 'this week' },
  { label: 'Avg. Cycle Time', value: '4.2h', change: -18, unit: 'to merge' },
  { label: 'Review Wait', value: '28m', change: -32, unit: 'median' },
  { label: 'PRs Per Dev', value: 6.8, change: 8, unit: 'avg/week' },
  { label: 'Review Cycles', value: 1.4, change: -10, unit: 'avg' },
  { label: 'Deploy Freq', value: 3.2, change: 15, unit: 'per day' },
]

export const timeSeriesData: TimeSeriesPoint[] = [
  { date: 'Feb 3', prsOpened: 12, prsMerged: 9, reviewsDone: 24 },
  { date: 'Feb 10', prsOpened: 15, prsMerged: 11, reviewsDone: 28 },
  { date: 'Feb 17', prsOpened: 18, prsMerged: 16, reviewsDone: 35 },
  { date: 'Feb 24', prsOpened: 14, prsMerged: 13, reviewsDone: 30 },
  { date: 'Mar 3', prsOpened: 20, prsMerged: 17, reviewsDone: 38 },
]

export const devActivity = [
  { name: 'santhosh', merged: 12, reviewed: 8, avatar: avatars[0] },
  { name: 'alex', merged: 9, reviewed: 14, avatar: avatars[1] },
  { name: 'jordan', merged: 11, reviewed: 6, avatar: avatars[2] },
  { name: 'casey', merged: 8, reviewed: 10, avatar: avatars[3] },
  { name: 'riley', merged: 7, reviewed: 12, avatar: avatars[4] },
]

export const mgtCommands = [
  { cmd: 'mgt up', desc: 'Move up the stack. Opens interactive selector from trunk.' },
  { cmd: 'mgt down', desc: 'Move down the stack.' },
  { cmd: 'mgt trunk', desc: 'Switch to the main/trunk branch.' },
  { cmd: 'mgt top', desc: 'Jump to the tip of your current stack.' },
  { cmd: 'mgt create <name>', desc: 'Create a new stacked branch with optional prefix.' },
  { cmd: 'mgt submit', desc: 'Submit only the current branch as a PR.' },
  { cmd: 'mgt stack-submit', desc: 'Submit the entire stack as PRs.' },
  { cmd: 'mgt sync', desc: 'Pull trunk and cleanup merged branches.' },
  { cmd: 'mgt restack', desc: 'Pull trunk and restack the entire chain.' },
  { cmd: 'mgt config set/get', desc: 'Set or show configuration values.' },
]
