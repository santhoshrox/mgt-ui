import { useState } from 'react'
import {
  Bot,
  Bug,
  Lightbulb,
  MessageCircleQuestion,
  Pencil,
  Check,
  ChevronDown,
  ChevronRight,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  FileCode2,
} from 'lucide-react'
import clsx from 'clsx'
import { reviewComments, type ReviewComment } from '../data/mock'

function TypeIcon({ type }: { type: ReviewComment['type'] }) {
  switch (type) {
    case 'bug':
      return <Bug className="h-4 w-4 text-rose-400" />
    case 'suggestion':
      return <Lightbulb className="h-4 w-4 text-amber-400" />
    case 'question':
      return <MessageCircleQuestion className="h-4 w-4 text-cyan-400" />
    case 'nitpick':
      return <Pencil className="h-4 w-4 text-gray-400" />
  }
}

function typeBadge(type: ReviewComment['type']) {
  const styles: Record<string, string> = {
    bug: 'bg-rose-500/10 text-rose-400',
    suggestion: 'bg-amber-500/10 text-amber-400',
    question: 'bg-cyan-500/10 text-cyan-400',
    nitpick: 'bg-gray-500/10 text-gray-400',
  }
  return styles[type]
}

function ReviewCard({ comment }: { comment: ReviewComment }) {
  const [expanded, setExpanded] = useState(!comment.resolved)
  const [showSuggestion, setShowSuggestion] = useState(false)

  return (
    <div
      className={clsx(
        'animate-fade-in rounded-xl border transition-all',
        comment.resolved
          ? 'border-gray-800/50 bg-gray-900/20 opacity-60'
          : 'border-gray-800 bg-gray-900/50'
      )}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-start gap-3 p-4 text-left"
      >
        <TypeIcon type={comment.type} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={clsx('rounded-full px-2 py-0.5 text-xs font-medium capitalize', typeBadge(comment.type))}>
              {comment.type}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <FileCode2 className="h-3 w-3" />
              {comment.file}:{comment.line}
            </span>
            {comment.resolved && (
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400">
                <Check className="h-3 w-3" /> Resolved
              </span>
            )}
            {comment.aiGenerated && (
              <span className="flex items-center gap-1 text-xs text-brand-400">
                <Sparkles className="h-3 w-3" /> AI
              </span>
            )}
          </div>
          <p className="mt-1.5 text-sm text-gray-300 leading-relaxed">{comment.body}</p>
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
            <p className="mb-2 text-xs font-medium text-gray-500">Current Code</p>
            <pre className="overflow-x-auto rounded-lg bg-gray-950 p-4 text-xs leading-relaxed">
              <code className="text-gray-300">{comment.codeSnippet}</code>
            </pre>
          </div>

          {comment.suggestion && (
            <div>
              <button
                onClick={(e) => { e.stopPropagation(); setShowSuggestion(!showSuggestion) }}
                className="mb-2 flex items-center gap-1 text-xs font-medium text-brand-400 hover:text-brand-300"
              >
                <Lightbulb className="h-3 w-3" />
                {showSuggestion ? 'Hide' : 'View'} suggested fix
              </button>
              {showSuggestion && (
                <pre className="overflow-x-auto rounded-lg bg-emerald-950/30 border border-emerald-800/20 p-4 text-xs leading-relaxed">
                  <code className="text-emerald-300">{comment.suggestion}</code>
                </pre>
              )}
            </div>
          )}

          <div className="flex items-center gap-3 pt-1">
            <span className="text-xs text-gray-500">Is this helpful?</span>
            <button className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-800 hover:text-emerald-400 transition-colors">
              <ThumbsUp className="h-3.5 w-3.5" />
            </button>
            <button className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-800 hover:text-rose-400 transition-colors">
              <ThumbsDown className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AIReviews() {
  const [filterType, setFilterType] = useState<string>('all')

  const filtered = filterType === 'all'
    ? reviewComments
    : reviewComments.filter(c => c.type === filterType)

  const stats = {
    bugs: reviewComments.filter(c => c.type === 'bug').length,
    suggestions: reviewComments.filter(c => c.type === 'suggestion').length,
    questions: reviewComments.filter(c => c.type === 'question').length,
    nitpicks: reviewComments.filter(c => c.type === 'nitpick').length,
    resolved: reviewComments.filter(c => c.resolved).length,
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6 lg:p-8">
      <div className="animate-fade-in">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Bot className="h-6 w-6 text-brand-400" />
              AI Reviews
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              Automatic code review powered by Diamond. Catches bugs, suggests fixes, and learns from feedback.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400">
            <Sparkles className="h-3.5 w-3.5" />
            Scanning active
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-5 animate-fade-in" style={{ animationDelay: '100ms' }}>
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 text-center">
          <p className="text-2xl font-bold text-rose-400">{stats.bugs}</p>
          <p className="mt-0.5 text-xs text-gray-500">Bugs</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 text-center">
          <p className="text-2xl font-bold text-amber-400">{stats.suggestions}</p>
          <p className="mt-0.5 text-xs text-gray-500">Suggestions</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 text-center">
          <p className="text-2xl font-bold text-cyan-400">{stats.questions}</p>
          <p className="mt-0.5 text-xs text-gray-500">Questions</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 text-center">
          <p className="text-2xl font-bold text-gray-400">{stats.nitpicks}</p>
          <p className="mt-0.5 text-xs text-gray-500">Nitpicks</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 text-center">
          <p className="text-2xl font-bold text-emerald-400">{stats.resolved}</p>
          <p className="mt-0.5 text-xs text-gray-500">Resolved</p>
        </div>
      </div>

      <div className="flex items-center gap-2 animate-fade-in" style={{ animationDelay: '150ms' }}>
        <div className="flex items-center gap-1 rounded-lg border border-gray-800 bg-gray-900/50 p-0.5">
          {['all', 'bug', 'suggestion', 'question', 'nitpick'].map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={clsx(
                'rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors',
                filterType === t
                  ? 'bg-gray-700 text-gray-100'
                  : 'text-gray-400 hover:text-gray-200'
              )}
            >
              {t === 'all' ? 'All' : t}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((comment, i) => (
          <div key={comment.id} style={{ animationDelay: `${200 + i * 80}ms` }}>
            <ReviewCard comment={comment} />
          </div>
        ))}
      </div>

      <div className="animate-fade-in rounded-xl border border-gray-800 bg-gray-900/40 p-5" style={{ animationDelay: '600ms' }}>
        <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand-400" /> How AI Reviews Work
        </h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium text-gray-300">Instant Feedback</p>
            <p className="mt-1 text-xs text-gray-500">Automatically scans opened PRs for bugs, logical errors, and other technical pitfalls.</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-300">Codebase Awareness</p>
            <p className="mt-1 text-xs text-gray-500">Feedback is context-aware, analyzing your entire codebase for relevant suggestions.</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-300">Custom Rules</p>
            <p className="mt-1 text-xs text-gray-500">Define and enforce custom patterns with AI prompts and regex rules.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
