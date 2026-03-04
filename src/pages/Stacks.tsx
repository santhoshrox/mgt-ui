import { useEffect, useState } from 'react'
import {
  GitBranch,
  Home,
  CheckCircle2,
  Clock,
  AlertCircle,
  Circle,
  RefreshCw,
  ExternalLink,
  Layers,
  ChevronDown,
} from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../context/AuthContext'
import {
  searchPRs, fetchPR, repoFromUrl, timeAgo,
  type GHPullRequest,
} from '../lib/github'
import { Loading, ErrorState, Empty } from '../components/PageState'

interface StackedPR {
  pr: GHPullRequest
  repo: string
  children: StackedPR[]
  depth: number
}

function buildStacks(prs: GHPullRequest[], defaultBranch = 'main'): StackedPR[][] {
  const byHeadRef = new Map<string, GHPullRequest>()
  prs.forEach(pr => byHeadRef.set(pr.head.ref, pr))

  const visited = new Set<number>()
  const stacks: StackedPR[][] = []

  function buildChain(pr: GHPullRequest, depth: number): StackedPR {
    visited.add(pr.number)
    const repo = pr.head.repo?.full_name || ''
    const children = prs
      .filter(p => p.base.ref === pr.head.ref && p.number !== pr.number && !visited.has(p.number))
      .map(p => buildChain(p, depth + 1))
    return { pr, repo, children, depth }
  }

  const roots = prs.filter(pr => {
    const isBase = [defaultBranch, 'main', 'master', 'develop'].includes(pr.base.ref)
    const hasParentPR = prs.some(p => p.head.ref === pr.base.ref && p.number !== pr.number)
    return isBase || !hasParentPR
  })

  for (const root of roots) {
    if (visited.has(root.number)) continue
    const chain = buildChain(root, 0)
    const flatStack: StackedPR[] = []
    function flatten(node: StackedPR) {
      flatStack.push(node)
      node.children.forEach(c => flatten(c))
    }
    flatten(chain)
    if (flatStack.length > 0) stacks.push(flatStack)
  }

  for (const pr of prs) {
    if (!visited.has(pr.number)) {
      stacks.push([{ pr, repo: pr.head.repo?.full_name || '', children: [], depth: 0 }])
    }
  }

  return stacks.sort((a, b) => b.length - a.length)
}

function CIBadge({ status }: { status: string }) {
  const m: Record<string, { icon: React.ReactNode; cls: string; label: string }> = {
    passing: { icon: <CheckCircle2 className="h-3 w-3" />, cls: 'bg-emerald-500/10 text-emerald-400', label: 'Passing' },
    failing: { icon: <AlertCircle className="h-3 w-3" />, cls: 'bg-rose-500/10 text-rose-400', label: 'Failing' },
    pending: { icon: <Clock className="h-3 w-3" />, cls: 'bg-amber-500/10 text-amber-400', label: 'Pending' },
  }
  const s = m[status] || { icon: <Circle className="h-3 w-3" />, cls: 'bg-gray-500/10 text-gray-400', label: 'Unknown' }
  return <span className={clsx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', s.cls)}>{s.icon} {s.label}</span>
}

function StackNode({ node, index, isLast }: { node: StackedPR; index: number; total: number; isLast: boolean }) {
  const { pr } = node
  const isFirst = index === 0
  return (
    <div className="animate-fade-in relative" style={{ animationDelay: `${index * 80}ms` }}>
      <div className="flex items-stretch gap-4">
        <div className="flex flex-col items-center">
          <div className={clsx(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2',
            isFirst ? 'border-brand-500 bg-brand-600/20' : 'border-gray-700 bg-gray-800/50',
          )}>
            <GitBranch className={clsx('h-4 w-4', isFirst ? 'text-brand-400' : 'text-gray-400')} />
          </div>
          {!isLast && <div className={clsx('w-0.5 flex-1 min-h-4', isFirst ? 'bg-brand-500/40' : 'bg-gray-700/50')} />}
        </div>

        <div className={clsx(
          'mb-3 flex-1 rounded-xl border p-4 transition-all',
          isFirst ? 'border-brand-500/30 bg-brand-600/5' : 'border-gray-800 bg-gray-900/40',
        )}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <code className={clsx('text-sm font-semibold', isFirst ? 'text-brand-400' : 'text-gray-200')}>
                  {pr.head.ref}
                </code>
                {pr.draft && <span className="rounded-full bg-gray-700 px-2 py-0.5 text-xs text-gray-300">Draft</span>}
                {isFirst && <span className="rounded-full bg-brand-500/20 px-2 py-0.5 text-xs font-medium text-brand-300">top</span>}
              </div>
              <p className="mt-1 text-sm text-gray-400">
                #{pr.number} · {pr.title}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {pr.merged_at ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2 py-0.5 text-xs text-purple-400">Merged</span>
                ) : (
                  <CIBadge status={pr.mergeable_state === 'clean' ? 'passing' : pr.mergeable_state === 'unstable' ? 'failing' : 'pending'} />
                )}
                <span className="text-xs text-gray-500">
                  <span className="text-emerald-400">+{pr.additions}</span>{' '}
                  <span className="text-rose-400">-{pr.deletions}</span>
                </span>
                <span className="text-xs text-gray-500">→ {pr.base.ref}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{timeAgo(pr.updated_at)}</span>
              <a
                href={pr.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-gray-300"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function StacksPage() {
  const { token, user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stacks, setStacks] = useState<StackedPR[][]>([])
  const [expandedStack, setExpandedStack] = useState<number>(0)

  async function load() {
    if (!token || !user) return
    try {
      setLoading(true)
      setError(null)

      const result = await searchPRs(token, `type:pr is:open author:${user.login}`, 50)
      const prItems = result.items.filter(i => i.pull_request)

      const fullPRs = await Promise.all(
        prItems.map(item => {
          const { owner, repo } = repoFromUrl(item.repository_url)
          return fetchPR(token, owner, repo, item.number).catch(() => null)
        })
      )

      const validPRs = fullPRs.filter((p): p is GHPullRequest => p !== null)
      const detected = buildStacks(validPRs)
      setStacks(detected)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [token, user])

  if (loading) return <Loading message="Detecting stacks from your PRs..." />
  if (error) return <ErrorState message={error} onRetry={load} />

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6 lg:p-8">
      <div className="animate-fade-in flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stack Visualization</h1>
          <p className="mt-1 text-sm text-gray-400">
            {stacks.length > 0
              ? `Detected ${stacks.length} stack${stacks.length > 1 ? 's' : ''} from your open PRs (${stacks.reduce((s, st) => s + st.length, 0)} PRs)`
              : 'No stacked PRs detected'}
          </p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-3 py-2 text-sm font-medium text-gray-300 hover:border-gray-600 hover:text-white transition-colors"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {stacks.length === 0 && (
        <Empty
          icon={<Layers className="h-10 w-10" />}
          message="No stacked PRs found. Create stacked PRs with mgt create to see them here."
        />
      )}

      {stacks.map((stack, si) => (
        <div key={si} className="animate-fade-in" style={{ animationDelay: `${si * 100}ms` }}>
          <button
            onClick={() => setExpandedStack(expandedStack === si ? -1 : si)}
            className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-300 hover:text-gray-100 transition-colors"
          >
            <ChevronDown className={clsx('h-4 w-4 transition-transform', expandedStack !== si && '-rotate-90')} />
            <Layers className="h-4 w-4 text-brand-400" />
            Stack {si + 1}
            <span className="ml-1 rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-400">
              {stack.length} PR{stack.length > 1 ? 's' : ''}
            </span>
            {stack[0]?.repo && (
              <span className="text-xs text-gray-500 font-normal">{stack[0].repo}</span>
            )}
          </button>

          {expandedStack === si && (
            <div className="ml-2">
              {stack.map((node, i) => (
                <StackNode
                  key={node.pr.number}
                  node={node}
                  index={i}
                  total={stack.length}
                  isLast={i === stack.length - 1}
                />
              ))}
              <div className="flex items-stretch gap-4 animate-fade-in" style={{ animationDelay: `${stack.length * 80}ms` }}>
                <div className="flex flex-col items-center">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-gray-600 bg-gray-800">
                    <Home className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
                <div className="mb-3 flex-1 rounded-xl border border-gray-800 bg-gray-900/30 p-4">
                  <code className="text-sm text-gray-400">{stack[stack.length - 1]?.pr.base.ref || 'main'}</code>
                  <p className="mt-1 text-xs text-gray-500">Base branch</p>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      <div className="animate-fade-in rounded-xl border border-gray-800 bg-gray-900/40 p-5" style={{ animationDelay: '500ms' }}>
        <h3 className="text-sm font-semibold text-gray-300">How Stack Detection Works</h3>
        <p className="mt-2 text-xs text-gray-500 leading-relaxed">
          Stacks are detected by analyzing your open PRs' base and head branches. When a PR's base branch
          matches another PR's head branch, they form a chain. This mirrors how <code className="text-brand-400">mgt create</code> and
          <code className="text-brand-400"> mgt stack-submit</code> organize your branches.
        </p>
      </div>
    </div>
  )
}
