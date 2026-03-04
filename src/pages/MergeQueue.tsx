import { useEffect, useState } from 'react'
import {
  ListOrdered,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  SkipForward,
  ArrowRight,
  Shield,
  Globe,
  Zap,
  RefreshCw,
  GitMerge,
  Eye,
  FileCode2,
} from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../context/AuthContext'
import {
  searchPRs, fetchPR, fetchCheckRuns, fetchPRReviews, mergePR,
  repoFromUrl, timeAgo,
  type GHPullRequest, type GHCheckRun, type GHReview,
} from '../lib/github'
import { Loading, ErrorState, Empty } from '../components/PageState'

interface QueueItem {
  pr: GHPullRequest
  repo: string
  checks: GHCheckRun[]
  reviews: GHReview[]
  status: 'ready' | 'running' | 'waiting' | 'failed'
}

function CIJobBadge({ check }: { check: GHCheckRun }) {
  const m: Record<string, { icon: React.ReactNode; bg: string; text: string }> = {
    success: { icon: <CheckCircle2 className="h-3 w-3" />, bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
    failure: { icon: <AlertCircle className="h-3 w-3" />, bg: 'bg-rose-500/10', text: 'text-rose-400' },
    in_progress: { icon: <Loader2 className="h-3 w-3 animate-spin" />, bg: 'bg-blue-500/10', text: 'text-blue-400' },
    queued: { icon: <Clock className="h-3 w-3" />, bg: 'bg-gray-500/10', text: 'text-gray-400' },
    skipped: { icon: <SkipForward className="h-3 w-3" />, bg: 'bg-gray-500/10', text: 'text-gray-500' },
    neutral: { icon: <CheckCircle2 className="h-3 w-3" />, bg: 'bg-gray-500/10', text: 'text-gray-400' },
  }
  const conclusionOrStatus = check.conclusion || check.status
  const s = m[conclusionOrStatus] || m.queued

  return (
    <div className={clsx('flex items-center gap-2 rounded-lg px-3 py-2', s.bg)}>
      <span className={s.text}>{s.icon}</span>
      <span className={clsx('text-xs font-medium truncate', s.text)}>{check.name}</span>
    </div>
  )
}

function QueueCard({ item, index, onMerged }: { item: QueueItem; index: number; onMerged: () => void }) {
  const { token } = useAuth()
  const [merging, setMerging] = useState(false)
  const [mergeResult, setMergeResult] = useState<{ ok: boolean; msg: string } | null>(null)

  const statusColors: Record<string, string> = {
    running: 'border-blue-500/30 bg-blue-500/5',
    waiting: 'border-gray-800 bg-gray-900/50',
    ready: 'border-emerald-500/30 bg-emerald-500/5',
    failed: 'border-rose-500/30 bg-rose-500/5',
  }

  const statusBadge: Record<string, { color: string; label: string }> = {
    running: { color: 'bg-blue-500/10 text-blue-400', label: 'CI Running' },
    waiting: { color: 'bg-gray-500/10 text-gray-400', label: 'Waiting' },
    ready: { color: 'bg-emerald-500/10 text-emerald-400', label: 'Ready to Merge' },
    failed: { color: 'bg-rose-500/10 text-rose-400', label: 'CI Failed' },
  }

  const badge = statusBadge[item.status]
  const hasApproval = item.reviews.some(r => r.state === 'APPROVED')
  const [owner, repoName] = item.repo.split('/')

  async function handleMerge(method: 'squash' | 'merge' | 'rebase') {
    if (!token || merging) return
    if (!confirm(`Merge PR #${item.pr.number} via ${method}?`)) return
    setMerging(true)
    setMergeResult(null)
    try {
      await mergePR(token, owner, repoName, item.pr.number, method)
      setMergeResult({ ok: true, msg: 'Merged!' })
      setTimeout(onMerged, 1500)
    } catch (err) {
      setMergeResult({ ok: false, msg: err instanceof Error ? err.message : 'Merge failed' })
    } finally {
      setMerging(false)
    }
  }

  return (
    <div
      className={clsx('animate-fade-in rounded-xl border p-5 transition-all', statusColors[item.status])}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={clsx(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-bold',
            item.status === 'failed' ? 'bg-rose-500/10 text-rose-400' :
            item.status === 'ready' ? 'bg-emerald-500/10 text-emerald-400' :
            'bg-gray-800 text-gray-300'
          )}>
            #{index + 1}
          </div>
          <div className="min-w-0">
            <h3 className="font-medium text-gray-100">{item.pr.title}</h3>
            <p className="mt-0.5 text-sm text-gray-500">
              #{item.pr.number} · {item.repo} · by {item.pr.user.login}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={clsx('rounded-full px-2.5 py-0.5 text-xs font-medium', badge.color)}>
            {badge.label}
          </span>
          {hasApproval && (
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400">Approved</span>
          )}
        </div>
      </div>

      {item.checks.length > 0 && (
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {item.checks.slice(0, 8).map(check => (
            <CIJobBadge key={check.id} check={check} />
          ))}
          {item.checks.length > 8 && (
            <div className="flex items-center text-xs text-gray-500">+{item.checks.length - 8} more</div>
          )}
        </div>
      )}

      <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
        <span>
          <span className="text-emerald-400">+{item.pr.additions}</span>{' '}
          <span className="text-rose-400">-{item.pr.deletions}</span>
        </span>
        <span className="flex items-center gap-1">
          {item.pr.head.ref} <ArrowRight className="h-3 w-3" /> {item.pr.base.ref}
        </span>
        <span className="ml-auto">{timeAgo(item.pr.updated_at)}</span>
      </div>

      {mergeResult && (
        <div className={clsx(
          'mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-xs',
          mergeResult.ok ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
        )}>
          {mergeResult.ok ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
          {mergeResult.msg}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-800/50 pt-4">
        <a
          href={item.pr.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:border-gray-500 hover:text-white"
        >
          <Eye className="h-3.5 w-3.5" />
          Open on GitHub
        </a>
        <a
          href={`${item.pr.html_url}/files`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:border-gray-500 hover:text-white"
        >
          <FileCode2 className="h-3.5 w-3.5" />
          Files
        </a>
        {item.status === 'ready' && !mergeResult?.ok && (
          <>
            <div className="h-4 w-px bg-gray-800 mx-1" />
            <button
              onClick={() => handleMerge('squash')}
              disabled={merging}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
            >
              {merging ? <Loader2 className="h-3 w-3 animate-spin" /> : <GitMerge className="h-3 w-3" />}
              Squash & Merge
            </button>
            <button
              onClick={() => handleMerge('merge')}
              disabled={merging}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-700/50 px-3 py-1.5 text-xs font-medium text-emerald-400 transition-colors hover:border-emerald-600 hover:bg-emerald-600/10 disabled:opacity-50"
            >
              Merge Commit
            </button>
            <button
              onClick={() => handleMerge('rebase')}
              disabled={merging}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-700/50 px-3 py-1.5 text-xs font-medium text-emerald-400 transition-colors hover:border-emerald-600 hover:bg-emerald-600/10 disabled:opacity-50"
            >
              Rebase
            </button>
          </>
        )}
        {item.status !== 'ready' && !mergeResult?.ok && (
          <a
            href={`${item.pr.html_url}#partial-pull-merging`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-700/50 bg-emerald-600/10 px-3 py-1.5 text-xs font-medium text-emerald-400 transition-colors hover:border-emerald-600 hover:bg-emerald-600/20"
          >
            <GitMerge className="h-3.5 w-3.5" />
            Merge on GitHub
          </a>
        )}
      </div>
    </div>
  )
}

export default function MergeQueuePage() {
  const { token, user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [queue, setQueue] = useState<QueueItem[]>([])

  async function load() {
    if (!token || !user) return
    try {
      setLoading(true)
      setError(null)

      const result = await searchPRs(
        token,
        `type:pr is:open review:approved involves:${user.login}`,
        20
      )

      const items: QueueItem[] = []

      await Promise.all(
        result.items.filter(i => i.pull_request).map(async (item) => {
          const { owner, repo } = repoFromUrl(item.repository_url)
          try {
            const [pr, reviews] = await Promise.all([
              fetchPR(token, owner, repo, item.number),
              fetchPRReviews(token, owner, repo, item.number),
            ])

            let checks: GHCheckRun[] = []
            if (pr.head.sha) {
              try {
                const c = await fetchCheckRuns(token, owner, repo, pr.head.sha)
                checks = c.check_runs || []
              } catch { /* no checks */ }
            }

            let status: QueueItem['status'] = 'waiting'
            if (checks.length > 0) {
              if (checks.some(c => c.conclusion === 'failure')) status = 'failed'
              else if (checks.some(c => c.status === 'in_progress')) status = 'running'
              else if (checks.every(c => c.conclusion === 'success' || c.conclusion === 'skipped' || c.conclusion === 'neutral')) status = 'ready'
            }

            items.push({ pr, repo: `${owner}/${repo}`, checks, reviews, status })
          } catch { /* skip */ }
        })
      )

      const order: Record<string, number> = { ready: 0, running: 1, waiting: 2, failed: 3 }
      items.sort((a, b) => order[a.status] - order[b.status])
      setQueue(items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [token, user])

  if (loading) return <Loading message="Checking merge readiness..." />
  if (error) return <ErrorState message={error} onRetry={load} />

  const ready = queue.filter(i => i.status === 'ready').length
  const running = queue.filter(i => i.status === 'running').length
  const failed = queue.filter(i => i.status === 'failed').length

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6 lg:p-8">
      <div className="animate-fade-in flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ListOrdered className="h-6 w-6 text-rose-400" />
            Merge Queue
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Approved PRs and their CI status. {ready > 0 ? `${ready} ready to merge.` : ''}
          </p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-3 py-2 text-sm font-medium text-gray-300 hover:border-gray-600 hover:text-white transition-colors"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-4 animate-fade-in" style={{ animationDelay: '100ms' }}>
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
          <p className="text-sm text-gray-400">Approved PRs</p>
          <p className="mt-1 text-2xl font-bold text-gray-100">{queue.length}</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
          <p className="text-sm text-gray-400">Ready</p>
          <p className="mt-1 text-2xl font-bold text-emerald-400">{ready}</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
          <p className="text-sm text-gray-400">CI Running</p>
          <p className="mt-1 text-2xl font-bold text-blue-400">{running}</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
          <p className="text-sm text-gray-400">Failed</p>
          <p className="mt-1 text-2xl font-bold text-rose-400">{failed}</p>
        </div>
      </div>

      {queue.length === 0 ? (
        <Empty
          icon={<GitMerge className="h-10 w-10" />}
          message="No approved PRs waiting to merge."
        />
      ) : (
        <div className="space-y-4">
          {queue.map((item, i) => (
            <QueueCard key={item.pr.number} item={item} index={i} onMerged={load} />
          ))}
        </div>
      )}

      <div className="animate-fade-in grid gap-4 sm:grid-cols-3" style={{ animationDelay: '500ms' }}>
        <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-5">
          <Shield className="h-5 w-5 text-brand-400 mb-2" />
          <h3 className="text-sm font-semibold text-gray-200">Keep Main Green</h3>
          <p className="mt-1 text-xs text-gray-500 leading-relaxed">
            Every PR is validated against the latest main before merging.
          </p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-5">
          <Globe className="h-5 w-5 text-emerald-400 mb-2" />
          <h3 className="text-sm font-semibold text-gray-200">Merge From Anywhere</h3>
          <p className="mt-1 text-xs text-gray-500 leading-relaxed">
            Merge from the UI, GitHub, or your terminal with <code className="text-brand-400">mgt submit</code>.
          </p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-5">
          <Zap className="h-5 w-5 text-amber-400 mb-2" />
          <h3 className="text-sm font-semibold text-gray-200">Save CI Time</h3>
          <p className="mt-1 text-xs text-gray-500 leading-relaxed">
            Intelligent CI optimizations skip redundant tests, saving time and money.
          </p>
        </div>
      </div>
    </div>
  )
}
