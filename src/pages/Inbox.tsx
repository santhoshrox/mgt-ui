import { useState, useEffect, useMemo } from 'react'
import {
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  MessageSquare,
  GitPullRequest,
  GitMerge,
  Circle,
  ExternalLink,
  Loader2,
  FileCode2,
  MessageCircle,
  Eye,
} from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../context/AuthContext'
import {
  searchPRs, fetchPR, fetchPRReviews, fetchCheckRuns, mergePR,
  repoFromUrl, timeAgo,
  type GHSearchItem, type GHPullRequest, type GHReview, type GHCheckRun,
} from '../lib/github'
import { Loading, ErrorState, Empty } from '../components/PageState'

type Section = 'authored' | 'review' | 'involved'
type FilterStatus = 'all' | 'open' | 'merged' | 'draft'

interface PRListItem {
  key: string
  item: GHSearchItem
  repo: string
  section: Section
}

function PRStatusIcon({ state, draft, merged }: { state: string; draft?: boolean; merged?: boolean }) {
  if (merged) return <GitMerge className="h-4 w-4 text-purple-400" />
  if (draft) return <GitPullRequest className="h-4 w-4 text-gray-500" />
  if (state === 'open') return <GitPullRequest className="h-4 w-4 text-emerald-400" />
  return <Circle className="h-4 w-4 text-gray-500" />
}

function CIIndicator({ status }: { status?: string }) {
  switch (status) {
    case 'passing': return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
    case 'failing': return <AlertCircle className="h-3.5 w-3.5 text-rose-400" />
    case 'pending': return <Clock className="h-3.5 w-3.5 text-amber-400" />
    default: return null
  }
}

function ReviewBadge({ reviews }: { reviews: GHReview[] }) {
  const hasApproval = reviews.some(r => r.state === 'APPROVED')
  const hasChanges = reviews.some(r => r.state === 'CHANGES_REQUESTED')
  if (hasChanges) return <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-xs text-rose-400">Changes Requested</span>
  if (hasApproval) return <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400">Approved</span>
  if (reviews.length > 0) return <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400">Reviewed</span>
  return null
}

function PRRow({ pr, repo, selected, onClick }: { pr: GHSearchItem; repo: string; selected: boolean; onClick: () => void }) {
  const merged = !!pr.pull_request?.merged_at
  const ghUrl = `https://github.com/${repo}/pull/${pr.number}`
  return (
    <div
      className={clsx(
        'flex items-start gap-3 px-5 py-4 border-b border-gray-800/50 transition-colors cursor-pointer',
        selected ? 'bg-brand-600/5' : 'hover:bg-gray-800/30'
      )}
      onClick={onClick}
    >
      <div className="mt-0.5">
        <PRStatusIcon state={pr.state} draft={pr.draft} merged={merged} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium text-gray-100">{pr.title}</span>
          <span className="shrink-0 text-xs text-gray-500">#{pr.number}</span>
        </div>
        <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <img src={pr.user.avatar_url} alt={pr.user.login} className="h-4 w-4 rounded-full bg-gray-700" />
            {pr.user.login}
          </span>
          <span>{repo}</span>
          <span>{timeAgo(pr.updated_at)}</span>
        </div>
        {pr.labels.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {pr.labels.slice(0, 4).map(l => (
              <span
                key={l.name}
                className="rounded-full px-2 py-0.5 text-xs"
                style={{ backgroundColor: `#${l.color}20`, color: `#${l.color}` }}
              >
                {l.name}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {pr.comments > 0 && (
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <MessageSquare className="h-3 w-3" /> {pr.comments}
          </span>
        )}
        <a
          href={ghUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          title="Open on GitHub"
          className="rounded-md p-1.5 text-gray-600 transition-colors hover:bg-gray-800 hover:text-gray-300"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  )
}

function PRDetail({ pr, repo, onMerged }: { pr: GHSearchItem; repo: string; onMerged?: () => void }) {
  const { token } = useAuth()
  const [full, setFull] = useState<GHPullRequest | null>(null)
  const [reviews, setReviews] = useState<GHReview[]>([])
  const [checks, setChecks] = useState<GHCheckRun[]>([])
  const [loading, setLoading] = useState(true)
  const [merging, setMerging] = useState(false)
  const [mergeResult, setMergeResult] = useState<{ ok: boolean; msg: string } | null>(null)

  const { owner, repo: repoName } = repoFromUrl(pr.repository_url)
  const ghUrl = `https://github.com/${repo}/pull/${pr.number}`
  const merged = !!pr.pull_request?.merged_at

  useEffect(() => {
    if (!token) return
    let cancelled = false
    setLoading(true)
    setMergeResult(null)
    Promise.all([
      fetchPR(token, owner, repoName, pr.number),
      fetchPRReviews(token, owner, repoName, pr.number),
    ]).then(async ([prData, reviewData]) => {
      if (cancelled) return
      setFull(prData)
      setReviews(reviewData)
      if (prData.head.sha) {
        try {
          const c = await fetchCheckRuns(token, owner, repoName, prData.head.sha)
          if (!cancelled) setChecks(c.check_runs || [])
        } catch { /* checks may not be available */ }
      }
    }).catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [token, owner, repoName, pr.number])

  function ciSummary() {
    if (checks.length === 0) return 'none'
    if (checks.some(c => c.conclusion === 'failure')) return 'failing'
    if (checks.every(c => c.conclusion === 'success' || c.conclusion === 'skipped')) return 'passing'
    return 'pending'
  }

  const hasApproval = reviews.some(r => r.state === 'APPROVED')
  const ciPassing = ciSummary() === 'passing'
  const canMerge = hasApproval && ciPassing && !merged && pr.state === 'open'

  async function handleMerge(method: 'squash' | 'merge' | 'rebase') {
    if (!token || merging) return
    if (!confirm(`Merge PR #${pr.number} via ${method}?`)) return
    setMerging(true)
    setMergeResult(null)
    try {
      await mergePR(token, owner, repoName, pr.number, method)
      setMergeResult({ ok: true, msg: 'PR merged successfully!' })
      onMerged?.()
    } catch (err) {
      setMergeResult({ ok: false, msg: err instanceof Error ? err.message : 'Merge failed' })
    } finally {
      setMerging(false)
    }
  }

  return (
    <div className="animate-slide-in space-y-5 p-6">
      <div className="flex items-start gap-3">
        <PRStatusIcon state={pr.state} draft={pr.draft} merged={merged} />
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-gray-100">{pr.title}</h2>
          <p className="mt-0.5 text-sm text-gray-400">#{pr.number} · {repo}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <a
          href={ghUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-white"
        >
          <Eye className="h-4 w-4" />
          Open on GitHub
        </a>
        <a
          href={`${ghUrl}/files`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:border-gray-500 hover:text-white"
        >
          <FileCode2 className="h-4 w-4" />
          View Files
        </a>
        <a
          href={`${ghUrl}#issuecomment-new`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:border-gray-500 hover:text-white"
        >
          <MessageCircle className="h-4 w-4" />
          Comment
        </a>
        {!merged && pr.state === 'open' && (
          <a
            href={`${ghUrl}#partial-pull-merging`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-emerald-700/50 bg-emerald-600/10 px-4 py-2 text-sm font-medium text-emerald-400 transition-colors hover:border-emerald-600 hover:bg-emerald-600/20"
          >
            <GitMerge className="h-4 w-4" />
            Merge on GitHub
          </a>
        )}
      </div>

      {canMerge && (
        <div className="rounded-lg border border-emerald-800/30 bg-emerald-950/30 p-4">
          <p className="text-xs font-medium text-emerald-400 mb-2.5">This PR is ready to merge — approved with passing CI</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleMerge('squash')}
              disabled={merging}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
            >
              {merging ? <Loader2 className="h-3 w-3 animate-spin" /> : <GitMerge className="h-3 w-3" />}
              Squash & Merge
            </button>
            <button
              onClick={() => handleMerge('merge')}
              disabled={merging}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:border-gray-500 hover:text-white disabled:opacity-50"
            >
              Merge Commit
            </button>
            <button
              onClick={() => handleMerge('rebase')}
              disabled={merging}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:border-gray-500 hover:text-white disabled:opacity-50"
            >
              Rebase & Merge
            </button>
          </div>
        </div>
      )}

      {mergeResult && (
        <div className={clsx(
          'flex items-center gap-2 rounded-lg px-4 py-3 text-sm',
          mergeResult.ok ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
        )}>
          {mergeResult.ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {mergeResult.msg}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
              <p className="text-xs text-gray-500">CI Status</p>
              <div className="mt-1 flex items-center gap-2">
                <CIIndicator status={ciSummary()} />
                <span className="text-sm font-medium capitalize text-gray-200">{ciSummary()}</span>
              </div>
              {checks.length > 0 && (
                <p className="mt-1 text-xs text-gray-500">
                  {checks.filter(c => c.conclusion === 'success').length}/{checks.length} passing
                </p>
              )}
            </div>
            <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
              <p className="text-xs text-gray-500">Reviews</p>
              <div className="mt-1">
                <ReviewBadge reviews={reviews} />
                {reviews.length === 0 && <span className="text-sm text-gray-400">No reviews</span>}
              </div>
            </div>
            {full && (
              <>
                <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
                  <p className="text-xs text-gray-500">Changes</p>
                  <p className="mt-1 text-sm">
                    <span className="font-medium text-emerald-400">+{full.additions}</span>{' '}
                    <span className="font-medium text-rose-400">-{full.deletions}</span>
                  </p>
                </div>
                <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
                  <p className="text-xs text-gray-500">Comments</p>
                  <p className="mt-1 text-sm font-medium text-gray-200">{full.comments + full.review_comments}</p>
                </div>
              </>
            )}
          </div>

          {full && (
            <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
              <p className="text-xs text-gray-500 mb-1">Branch</p>
              <p className="text-sm font-mono text-gray-300">
                {full.head.ref} → {full.base.ref}
              </p>
            </div>
          )}

          <div>
            <p className="text-xs text-gray-500 mb-2">Author</p>
            <div className="flex items-center gap-2">
              <img src={pr.user.avatar_url} alt={pr.user.login} className="h-8 w-8 rounded-full bg-gray-700" />
              <div>
                <p className="text-sm font-medium text-gray-200">{pr.user.login}</p>
                <p className="text-xs text-gray-500">Updated {timeAgo(pr.updated_at)}</p>
              </div>
            </div>
          </div>

          {pr.labels.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Labels</p>
              <div className="flex flex-wrap gap-2">
                {pr.labels.map(l => (
                  <span
                    key={l.name}
                    className="rounded-full px-3 py-1 text-xs font-medium"
                    style={{ backgroundColor: `#${l.color}20`, color: `#${l.color}` }}
                  >
                    {l.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {checks.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">CI Checks</p>
              <div className="space-y-1.5">
                {checks.map(c => (
                  <div key={c.id} className="flex items-center gap-2 text-xs">
                    <CIIndicator status={
                      c.conclusion === 'success' ? 'passing' :
                      c.conclusion === 'failure' ? 'failing' :
                      c.status === 'completed' ? 'passing' : 'pending'
                    } />
                    <span className="text-gray-300">{c.name}</span>
                    <span className="ml-auto text-gray-500 capitalize">{c.conclusion || c.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {reviews.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Review History</p>
              <div className="space-y-2">
                {reviews.filter(r => r.state !== 'PENDING').map(r => (
                  <div key={r.id} className="flex items-start gap-2 text-xs">
                    <img src={r.user.avatar_url} alt={r.user.login} className="mt-0.5 h-5 w-5 rounded-full" />
                    <div>
                      <span className="font-medium text-gray-300">{r.user.login}</span>
                      <span className={clsx(
                        'ml-2',
                        r.state === 'APPROVED' && 'text-emerald-400',
                        r.state === 'CHANGES_REQUESTED' && 'text-rose-400',
                        r.state === 'COMMENTED' && 'text-gray-400',
                      )}>
                        {r.state.toLowerCase().replace('_', ' ')}
                      </span>
                      {r.body && <p className="mt-0.5 text-gray-500">{r.body.slice(0, 120)}{r.body.length > 120 ? '...' : ''}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function InboxPage() {
  const { token, user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [allPRs, setAllPRs] = useState<PRListItem[]>([])
  const [section, setSection] = useState<Section>('authored')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [selectedKey, setSelectedKey] = useState<string | null>(null)

  async function load() {
    if (!token || !user) return
    try {
      setLoading(true)
      setError(null)

      const [authored, reviews, involved] = await Promise.all([
        searchPRs(token, `type:pr is:open author:${user.login}`, 50),
        searchPRs(token, `type:pr is:open review-requested:${user.login}`, 50),
        searchPRs(token, `type:pr is:open involves:${user.login} -author:${user.login} -review-requested:${user.login}`, 30),
      ])

      const toPRListItem = (items: GHSearchItem[], sec: Section): PRListItem[] =>
        items
          .filter(i => i.pull_request)
          .map(i => ({
            key: `${i.repository_url}-${i.number}`,
            item: i,
            repo: i.repository_url.split('/repos/')[1],
            section: sec,
          }))

      setAllPRs([
        ...toPRListItem(authored.items, 'authored'),
        ...toPRListItem(reviews.items, 'review'),
        ...toPRListItem(involved.items, 'involved'),
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [token, user])

  const filtered = useMemo(() => {
    let prs = allPRs.filter(p => p.section === section)
    if (search) {
      const q = search.toLowerCase()
      prs = prs.filter(p =>
        p.item.title.toLowerCase().includes(q) ||
        p.item.user.login.toLowerCase().includes(q) ||
        p.repo.toLowerCase().includes(q) ||
        p.item.labels.some(l => l.name.toLowerCase().includes(q))
      )
    }
    if (filter === 'draft') prs = prs.filter(p => p.item.draft)
    else if (filter === 'merged') prs = prs.filter(p => !!p.item.pull_request?.merged_at)
    else if (filter === 'open') prs = prs.filter(p => p.item.state === 'open' && !p.item.draft)
    return prs
  }, [allPRs, section, search, filter])

  const selectedPR = selectedKey ? allPRs.find(p => p.key === selectedKey) : null
  const sectionCounts = {
    authored: allPRs.filter(p => p.section === 'authored').length,
    review: allPRs.filter(p => p.section === 'review').length,
    involved: allPRs.filter(p => p.section === 'involved').length,
  }

  if (loading) return <Loading message="Fetching pull requests..." />
  if (error) return <ErrorState message={error} onRetry={load} />

  return (
    <div className="flex h-full">
      <div className={clsx(
        'flex flex-col border-r border-gray-800',
        selectedPR ? 'w-1/2 hidden lg:flex' : 'w-full'
      )}>
        <div className="border-b border-gray-800 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold tracking-tight">PR Inbox</h1>
            <span className="rounded-full bg-brand-500/10 px-2.5 py-0.5 text-xs font-medium text-brand-400">
              {filtered.length} PRs
            </span>
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-gray-800 bg-gray-900/50 p-0.5">
            {([
              ['authored', `Authored (${sectionCounts.authored})`],
              ['review', `Review (${sectionCounts.review})`],
              ['involved', `Involved (${sectionCounts.involved})`],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => { setSection(key); setSelectedKey(null) }}
                className={clsx(
                  'flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                  section === key ? 'bg-gray-700 text-gray-100' : 'text-gray-400 hover:text-gray-200'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search PRs by title, author, repo, label..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-800 bg-gray-900/50 py-2 pl-10 pr-4 text-sm text-gray-200 placeholder-gray-500 outline-none transition-colors focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border border-gray-800 bg-gray-900/50 p-0.5">
              {(['all', 'open', 'merged', 'draft'] as FilterStatus[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={clsx(
                    'rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors',
                    filter === f ? 'bg-gray-700 text-gray-100' : 'text-gray-400 hover:text-gray-200'
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.map(pr => (
            <PRRow
              key={pr.key}
              pr={pr.item}
              repo={pr.repo}
              selected={selectedKey === pr.key}
              onClick={() => setSelectedKey(pr.key)}
            />
          ))}
          {filtered.length === 0 && (
            <Empty
              icon={<Search className="h-8 w-8" />}
              message={allPRs.length === 0 ? 'No pull requests found' : 'No PRs match your filters'}
            />
          )}
        </div>
      </div>

      {selectedPR ? (
        <div className="flex-1 overflow-y-auto">
          <div className="border-b border-gray-800 p-4 lg:hidden">
            <button
              onClick={() => setSelectedKey(null)}
              className="text-sm text-brand-400 hover:text-brand-300"
            >
              ← Back to list
            </button>
          </div>
          <PRDetail pr={selectedPR.item} repo={selectedPR.repo} onMerged={() => { setSelectedKey(null); load() }} />
        </div>
      ) : (
        <div className="hidden flex-1 items-center justify-center text-gray-600 lg:flex">
          <div className="text-center">
            <GitPullRequest className="mx-auto h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm">Select a PR to view details</p>
          </div>
        </div>
      )}
    </div>
  )
}
