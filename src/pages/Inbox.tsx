import { useState, useMemo } from 'react'
import {
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  MessageSquare,
  GitPullRequest,
  GitMerge,
  Circle,
  ChevronDown,
} from 'lucide-react'
import clsx from 'clsx'
import { inboxPRs, type PullRequest } from '../data/mock'

type FilterStatus = 'all' | 'open' | 'merged' | 'draft'
type SortKey = 'updated' | 'created' | 'comments'

function PRStatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'open':
      return <GitPullRequest className="h-4 w-4 text-emerald-400" />
    case 'merged':
      return <GitMerge className="h-4 w-4 text-purple-400" />
    case 'draft':
      return <GitPullRequest className="h-4 w-4 text-gray-500" />
    default:
      return <Circle className="h-4 w-4 text-gray-500" />
  }
}

function CIIndicator({ status }: { status: string }) {
  switch (status) {
    case 'passing':
      return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
    case 'failing':
      return <AlertCircle className="h-3.5 w-3.5 text-rose-400" />
    case 'pending':
      return <Clock className="h-3.5 w-3.5 text-amber-400" />
    default:
      return null
  }
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return 'just now'
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function PRRow({ pr, selected, onClick }: { pr: PullRequest; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'w-full text-left px-5 py-4 transition-colors border-b border-gray-800/50',
        selected ? 'bg-brand-600/5' : 'hover:bg-gray-800/30'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          <PRStatusIcon status={pr.status} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium text-gray-100">{pr.title}</span>
            <span className="shrink-0 text-xs text-gray-500">#{pr.number}</span>
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <img
                src={pr.authorAvatar}
                alt={pr.author}
                className="h-4 w-4 rounded-full bg-gray-700"
              />
              {pr.author}
            </span>
            <span>{pr.repo}</span>
            <span>{timeAgo(pr.updatedAt)}</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {pr.labels.map(label => (
              <span
                key={label}
                className="rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-400"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <CIIndicator status={pr.ciStatus} />
          {pr.comments > 0 && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <MessageSquare className="h-3 w-3" /> {pr.comments}
            </span>
          )}
          <span className="text-xs text-gray-500">
            <span className="text-emerald-400">+{pr.additions}</span>{' '}
            <span className="text-rose-400">-{pr.deletions}</span>
          </span>
        </div>
      </div>
    </button>
  )
}

function PRDetail({ pr }: { pr: PullRequest }) {
  return (
    <div className="animate-slide-in space-y-5 p-6">
      <div className="flex items-start gap-3">
        <PRStatusIcon status={pr.status} />
        <div>
          <h2 className="text-lg font-semibold text-gray-100">{pr.title}</h2>
          <p className="mt-0.5 text-sm text-gray-400">
            #{pr.number} · {pr.repo} · {pr.headBranch} → {pr.baseBranch}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
          <p className="text-xs text-gray-500">CI Status</p>
          <div className="mt-1 flex items-center gap-2">
            <CIIndicator status={pr.ciStatus} />
            <span className="text-sm font-medium capitalize text-gray-200">{pr.ciStatus}</span>
          </div>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
          <p className="text-xs text-gray-500">Review Status</p>
          <span className={clsx(
            'text-sm font-medium capitalize',
            pr.reviewStatus === 'approved' && 'text-emerald-400',
            pr.reviewStatus === 'changes_requested' && 'text-rose-400',
            pr.reviewStatus === 'pending' && 'text-amber-400',
            pr.reviewStatus === 'none' && 'text-gray-400',
          )}>
            {pr.reviewStatus === 'changes_requested' ? 'Changes requested' : pr.reviewStatus}
          </span>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
          <p className="text-xs text-gray-500">Changes</p>
          <p className="mt-1 text-sm">
            <span className="font-medium text-emerald-400">+{pr.additions}</span>{' '}
            <span className="font-medium text-rose-400">-{pr.deletions}</span>
          </p>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
          <p className="text-xs text-gray-500">Comments</p>
          <p className="mt-1 text-sm font-medium text-gray-200">{pr.comments}</p>
        </div>
      </div>

      <div>
        <p className="text-xs text-gray-500 mb-2">Author</p>
        <div className="flex items-center gap-2">
          <img src={pr.authorAvatar} alt={pr.author} className="h-8 w-8 rounded-full bg-gray-700" />
          <div>
            <p className="text-sm font-medium text-gray-200">{pr.author}</p>
            <p className="text-xs text-gray-500">Updated {timeAgo(pr.updatedAt)}</p>
          </div>
        </div>
      </div>

      <div>
        <p className="text-xs text-gray-500 mb-2">Labels</p>
        <div className="flex flex-wrap gap-2">
          {pr.labels.map(label => (
            <span key={label} className="rounded-full bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-300">
              {label}
            </span>
          ))}
        </div>
      </div>

      {pr.stackPosition && (
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
          <p className="text-xs text-gray-500 mb-1">Stack Info</p>
          <p className="text-sm text-gray-200">
            Position {pr.stackPosition} of {pr.stackSize} in stack
          </p>
        </div>
      )}
    </div>
  )
}

export default function Inbox() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [sort, setSort] = useState<SortKey>('updated')
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const filtered = useMemo(() => {
    let prs = [...inboxPRs]
    if (search) {
      const q = search.toLowerCase()
      prs = prs.filter(pr =>
        pr.title.toLowerCase().includes(q) ||
        pr.author.toLowerCase().includes(q) ||
        pr.repo.toLowerCase().includes(q) ||
        pr.labels.some(l => l.toLowerCase().includes(q))
      )
    }
    if (filter !== 'all') {
      prs = prs.filter(pr => pr.status === filter)
    }
    prs.sort((a, b) => {
      if (sort === 'updated') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      if (sort === 'created') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      return b.comments - a.comments
    })
    return prs
  }, [search, filter, sort])

  const selectedPR = selectedId ? inboxPRs.find(pr => pr.id === selectedId) : null

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
                    filter === f
                      ? 'bg-gray-700 text-gray-100'
                      : 'text-gray-400 hover:text-gray-200'
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="relative ml-auto">
              <button className="flex items-center gap-1 rounded-lg border border-gray-800 bg-gray-900/50 px-3 py-1.5 text-xs text-gray-400">
                <Filter className="h-3 w-3" />
                Sort: {sort}
                <ChevronDown className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.map(pr => (
            <PRRow
              key={pr.id}
              pr={pr}
              selected={selectedId === pr.id}
              onClick={() => setSelectedId(pr.id)}
            />
          ))}
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center p-12 text-gray-500">
              <Search className="h-8 w-8 mb-3" />
              <p className="text-sm">No PRs match your filters</p>
            </div>
          )}
        </div>
      </div>

      {selectedPR ? (
        <div className="flex-1 overflow-y-auto">
          <div className="border-b border-gray-800 p-4 lg:hidden">
            <button
              onClick={() => setSelectedId(null)}
              className="text-sm text-brand-400 hover:text-brand-300"
            >
              ← Back to list
            </button>
          </div>
          <PRDetail pr={selectedPR} />
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
