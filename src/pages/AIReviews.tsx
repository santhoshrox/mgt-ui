import { useEffect, useState } from 'react'
import {
  Bot,
  MessageSquare,
  FileCode2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  Filter,
} from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../context/AuthContext'
import {
  searchPRs, fetchReviewComments, repoFromUrl, timeAgo,
  type GHReviewComment, type GHSearchItem,
} from '../lib/github'
import { Loading, ErrorState, Empty } from '../components/PageState'

interface EnrichedComment extends GHReviewComment {
  repo: string
  prNumber: number
  prTitle: string
}

function CommentCard({ comment }: { comment: EnrichedComment }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="animate-fade-in rounded-xl border border-gray-800 bg-gray-900/50 transition-all">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-start gap-3 p-4 text-left"
      >
        <img src={comment.user.avatar_url} alt={comment.user.login} className="mt-0.5 h-6 w-6 rounded-full" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-200">{comment.user.login}</span>
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <FileCode2 className="h-3 w-3" />
              {comment.path}
              {comment.line && `:${comment.line}`}
            </span>
            <span className="text-xs text-gray-600">·</span>
            <span className="text-xs text-gray-500">{timeAgo(comment.created_at)}</span>
          </div>
          <p className="mt-1.5 text-sm text-gray-300 leading-relaxed line-clamp-2">{comment.body}</p>
          <p className="mt-1 text-xs text-gray-500">
            on <span className="text-gray-400">{comment.repo}#{comment.prNumber}</span> · {comment.prTitle}
          </p>
        </div>
        {expanded ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-gray-500" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-gray-500" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-gray-800/50 p-4 space-y-4">
          <div>
            <p className="mb-2 text-xs font-medium text-gray-500">Diff Context</p>
            <pre className="overflow-x-auto rounded-lg bg-gray-950 p-4 text-xs leading-relaxed">
              <code className="text-gray-400">{comment.diff_hunk}</code>
            </pre>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-gray-500">Full Comment</p>
            <div className="rounded-lg bg-gray-950/60 p-4 text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
              {comment.body}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={comment.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300"
            >
              <ExternalLink className="h-3 w-3" /> View on GitHub
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AIReviewsPage() {
  const { token, user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [comments, setComments] = useState<EnrichedComment[]>([])
  const [filterUser, setFilterUser] = useState<string>('all')

  async function load() {
    if (!token || !user) return
    try {
      setLoading(true)
      setError(null)

      const result = await searchPRs(token, `type:pr is:open author:${user.login}`, 10)
      const prs = result.items.filter(i => i.pull_request)

      const allComments: EnrichedComment[] = []

      await Promise.all(
        prs.map(async (pr: GHSearchItem) => {
          const { owner, repo } = repoFromUrl(pr.repository_url)
          try {
            const rc = await fetchReviewComments(token, owner, repo, pr.number)
            rc.forEach(c => {
              allComments.push({
                ...c,
                repo: `${owner}/${repo}`,
                prNumber: pr.number,
                prTitle: pr.title,
              })
            })
          } catch { /* skip on error */ }
        })
      )

      allComments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setComments(allComments)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [token, user])

  const commentAuthors = [...new Set(comments.map(c => c.user.login))]
  const filtered = filterUser === 'all' ? comments : comments.filter(c => c.user.login === filterUser)

  const prCount = new Set(comments.map(c => `${c.repo}#${c.prNumber}`)).size

  if (loading) return <Loading message="Fetching review comments..." />
  if (error) return <ErrorState message={error} onRetry={load} />

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6 lg:p-8">
      <div className="animate-fade-in">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Bot className="h-6 w-6 text-brand-400" />
              Review Comments
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              All review comments on your open PRs, across {prCount} pull request{prCount !== 1 ? 's' : ''}.
            </p>
          </div>
          <button
            onClick={load}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-3 py-2 text-sm font-medium text-gray-300 hover:border-gray-600 hover:text-white transition-colors"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 animate-fade-in" style={{ animationDelay: '100ms' }}>
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 text-center">
          <p className="text-2xl font-bold text-gray-100">{comments.length}</p>
          <p className="mt-0.5 text-xs text-gray-500">Total Comments</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 text-center">
          <p className="text-2xl font-bold text-brand-400">{commentAuthors.length}</p>
          <p className="mt-0.5 text-xs text-gray-500">Reviewers</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 text-center">
          <p className="text-2xl font-bold text-emerald-400">{prCount}</p>
          <p className="mt-0.5 text-xs text-gray-500">PRs with Comments</p>
        </div>
      </div>

      {commentAuthors.length > 0 && (
        <div className="flex items-center gap-2 animate-fade-in" style={{ animationDelay: '150ms' }}>
          <Filter className="h-4 w-4 text-gray-500" />
          <div className="flex items-center gap-1 rounded-lg border border-gray-800 bg-gray-900/50 p-0.5">
            <button
              onClick={() => setFilterUser('all')}
              className={clsx(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                filterUser === 'all' ? 'bg-gray-700 text-gray-100' : 'text-gray-400 hover:text-gray-200'
              )}
            >
              All
            </button>
            {commentAuthors.map(author => (
              <button
                key={author}
                onClick={() => setFilterUser(author)}
                className={clsx(
                  'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                  filterUser === author ? 'bg-gray-700 text-gray-100' : 'text-gray-400 hover:text-gray-200'
                )}
              >
                {author}
              </button>
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <Empty
          icon={<MessageSquare className="h-10 w-10" />}
          message="No review comments on your open PRs yet."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((comment, i) => (
            <div key={comment.id} style={{ animationDelay: `${200 + i * 50}ms` }}>
              <CommentCard comment={comment} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
