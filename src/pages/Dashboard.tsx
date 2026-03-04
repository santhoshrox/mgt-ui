import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  GitBranch,
  Inbox,
  Bot,
  ListOrdered,
  BarChart3,
  ArrowRight,
  Terminal,
  GitPullRequest,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { searchPRs, fetchUserRepos, timeAgo, type GHSearchItem, type GHRepo } from '../lib/github'
import { Loading, ErrorState } from '../components/PageState'
import { mgtCommands } from '../data/mock'

const features = [
  { title: 'Stack Visualization', desc: 'View and navigate your branch stacks interactively.', icon: GitBranch, to: '/stacks', color: 'text-brand-400', bg: 'bg-brand-500/10' },
  { title: 'PR Inbox', desc: 'Unified inbox for PRs with filters, CI status, and reviews.', icon: Inbox, to: '/inbox', color: 'text-emerald-glow', bg: 'bg-emerald-500/10' },
  { title: 'AI Reviews', desc: 'Review comments on your PRs with code context.', icon: Bot, to: '/reviews', color: 'text-amber-glow', bg: 'bg-amber-500/10' },
  { title: 'Merge Queue', desc: 'Track approved PRs ready to merge with CI status.', icon: ListOrdered, to: '/merge-queue', color: 'text-rose-glow', bg: 'bg-rose-500/10' },
  { title: 'Insights', desc: 'Team velocity metrics — cycle time, review latency, deploy frequency.', icon: BarChart3, to: '/insights', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
]

function CIIcon({ status }: { status?: string }) {
  if (status === 'passing') return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
  if (status === 'failing') return <AlertCircle className="h-3.5 w-3.5 text-rose-400" />
  return <Clock className="h-3.5 w-3.5 text-gray-500" />
}

export default function Dashboard() {
  const { token, user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openPRs, setOpenPRs] = useState<GHSearchItem[]>([])
  const [reviewPRs, setReviewPRs] = useState<GHSearchItem[]>([])
  const [repos, setRepos] = useState<GHRepo[]>([])

  async function load() {
    if (!token || !user) return
    try {
      setLoading(true)
      setError(null)
      const [authored, reviews, repoList] = await Promise.all([
        searchPRs(token, `type:pr is:open author:${user.login}`),
        searchPRs(token, `type:pr is:open review-requested:${user.login}`),
        fetchUserRepos(token, 10),
      ])
      setOpenPRs(authored.items)
      setReviewPRs(reviews.items)
      setRepos(repoList)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [token, user])

  if (loading) return <Loading message="Fetching your GitHub data..." />
  if (error) return <ErrorState message={error} onRetry={load} />

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6 lg:p-8">
      <div className="animate-fade-in">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome, <span className="text-brand-400">{user?.name || user?.login}</span>
            </h1>
            <p className="mt-2 max-w-xl text-gray-400">
              Here's what's happening across your repositories.
            </p>
          </div>
          <a
            href="https://github.com/santhoshrox/mgt"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-2 rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:border-gray-600 hover:text-white sm:inline-flex"
          >
            <Terminal className="h-4 w-4" /> CLI Docs
          </a>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-fade-in" style={{ animationDelay: '100ms' }}>
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
          <p className="text-sm text-gray-400">Your Open PRs</p>
          <p className="mt-1 text-2xl font-bold">{openPRs.length}</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
          <p className="text-sm text-gray-400">Review Requests</p>
          <p className="mt-1 text-2xl font-bold">{reviewPRs.length}</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
          <p className="text-sm text-gray-400">Repositories</p>
          <p className="mt-1 text-2xl font-bold">{repos.length}</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
          <p className="text-sm text-gray-400">Member Since</p>
          <p className="mt-1 text-lg font-bold">{user?.created_at ? new Date(user.created_at).getFullYear() : '—'}</p>
        </div>
      </div>

      {openPRs.length > 0 && (
        <div className="animate-fade-in" style={{ animationDelay: '150ms' }}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Your Open Pull Requests</h2>
            <Link to="/inbox" className="flex items-center gap-1 text-sm text-brand-400 hover:text-brand-300">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="space-y-2">
            {openPRs.slice(0, 5).map(pr => {
              const repo = pr.repository_url.split('/repos/')[1]
              return (
                <a
                  key={`${repo}-${pr.number}`}
                  href={`https://github.com/${repo}/pull/${pr.number}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-900/50 p-4 transition-all hover:border-gray-700 hover:bg-gray-900"
                >
                  <GitPullRequest className={`h-4 w-4 ${pr.draft ? 'text-gray-500' : 'text-emerald-400'}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-200">{pr.title}</p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {repo}#{pr.number} · {timeAgo(pr.updated_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {pr.labels.slice(0, 2).map(l => (
                      <span key={l.name} className="rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-400">{l.name}</span>
                    ))}
                    <CIIcon />
                    <ExternalLink className="h-3.5 w-3.5 text-gray-600" />
                  </div>
                </a>
              )
            })}
          </div>
        </div>
      )}

      {reviewPRs.length > 0 && (
        <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Needs Your Review</h2>
            <Link to="/inbox" className="flex items-center gap-1 text-sm text-brand-400 hover:text-brand-300">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="space-y-2">
            {reviewPRs.slice(0, 5).map(pr => {
              const repo = pr.repository_url.split('/repos/')[1]
              return (
                <a
                  key={`${repo}-${pr.number}`}
                  href={`https://github.com/${repo}/pull/${pr.number}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-900/50 p-4 transition-all hover:border-gray-700 hover:bg-gray-900"
                >
                  <GitPullRequest className="h-4 w-4 text-amber-400" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-200">{pr.title}</p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {repo}#{pr.number} · by {pr.user.login} · {timeAgo(pr.updated_at)}
                    </p>
                  </div>
                  <img src={pr.user.avatar_url} alt={pr.user.login} className="h-5 w-5 rounded-full" />
                  <ExternalLink className="h-3.5 w-3.5 text-gray-600" />
                </a>
              )
            })}
          </div>
        </div>
      )}

      <div className="animate-fade-in" style={{ animationDelay: '250ms' }}>
        <h2 className="mb-4 text-lg font-semibold">Features</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ title, desc, icon: Icon, to, color, bg }) => (
            <Link
              key={to}
              to={to}
              className="group rounded-xl border border-gray-800 bg-gray-900/50 p-6 transition-all hover:border-gray-700 hover:bg-gray-900"
            >
              <div className={`inline-flex rounded-lg p-2.5 ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <h3 className="mt-4 font-semibold text-gray-100">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-400">{desc}</p>
              <div className="mt-4 flex items-center gap-1 text-sm font-medium text-brand-400 opacity-0 transition-opacity group-hover:opacity-100">
                Explore <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="animate-fade-in" style={{ animationDelay: '300ms' }}>
        <h2 className="mb-4 text-lg font-semibold">CLI Reference</h2>
        <div className="overflow-hidden rounded-xl border border-gray-800">
          <div className="bg-gray-900 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-rose-500/60" />
              <div className="h-3 w-3 rounded-full bg-amber-500/60" />
              <div className="h-3 w-3 rounded-full bg-emerald-500/60" />
              <span className="ml-3 text-xs text-gray-500">terminal</span>
            </div>
          </div>
          <div className="divide-y divide-gray-800/50 bg-gray-950 p-1">
            {mgtCommands.map(({ cmd, desc }) => (
              <div key={cmd} className="flex items-start gap-4 px-4 py-3">
                <code className="min-w-[10rem] shrink-0 text-sm font-medium text-brand-400">$ {cmd}</code>
                <span className="text-sm text-gray-400">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
