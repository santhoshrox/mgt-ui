import {
  ListOrdered,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  SkipForward,
  ArrowRight,
  Shield,
  Zap,
  Globe,
} from 'lucide-react'
import clsx from 'clsx'
import { mergeQueue, type MergeQueueItem, type CIJob } from '../data/mock'

function CIJobBadge({ job }: { job: CIJob }) {
  const styles: Record<string, { icon: React.ReactNode; bg: string; text: string }> = {
    passing: { icon: <CheckCircle2 className="h-3 w-3" />, bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
    failing: { icon: <AlertCircle className="h-3 w-3" />, bg: 'bg-rose-500/10', text: 'text-rose-400' },
    running: { icon: <Loader2 className="h-3 w-3 animate-spin" />, bg: 'bg-blue-500/10', text: 'text-blue-400' },
    queued: { icon: <Clock className="h-3 w-3" />, bg: 'bg-gray-500/10', text: 'text-gray-400' },
    skipped: { icon: <SkipForward className="h-3 w-3" />, bg: 'bg-gray-500/10', text: 'text-gray-500' },
  }
  const s = styles[job.status]

  return (
    <div className={clsx('flex items-center gap-2 rounded-lg px-3 py-2', s.bg)}>
      <span className={s.text}>{s.icon}</span>
      <span className={clsx('text-xs font-medium', s.text)}>{job.name}</span>
      {job.duration && (
        <span className="ml-auto text-xs text-gray-500">{job.duration}</span>
      )}
    </div>
  )
}

function QueueCard({ item, index }: { item: MergeQueueItem; index: number }) {
  const statusColors: Record<string, string> = {
    running: 'border-blue-500/30 bg-blue-500/5',
    waiting: 'border-gray-800 bg-gray-900/50',
    ready: 'border-emerald-500/30 bg-emerald-500/5',
    failed: 'border-rose-500/30 bg-rose-500/5',
  }

  const statusBadge: Record<string, { color: string; label: string }> = {
    running: { color: 'bg-blue-500/10 text-blue-400', label: 'Running CI' },
    waiting: { color: 'bg-gray-500/10 text-gray-400', label: 'Waiting' },
    ready: { color: 'bg-emerald-500/10 text-emerald-400', label: 'Ready to merge' },
    failed: { color: 'bg-rose-500/10 text-rose-400', label: 'Failed' },
  }

  const badge = statusBadge[item.status]

  return (
    <div
      className={clsx(
        'animate-fade-in rounded-xl border p-5 transition-all',
        statusColors[item.status]
      )}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={clsx(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-bold',
            item.status === 'failed' ? 'bg-rose-500/10 text-rose-400' : 'bg-gray-800 text-gray-300'
          )}>
            #{item.position}
          </div>
          <div>
            <h3 className="font-medium text-gray-100">{item.pr.title}</h3>
            <p className="mt-0.5 text-sm text-gray-500">
              #{item.pr.number} · {item.pr.repo} · by {item.pr.author}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={clsx('rounded-full px-2.5 py-0.5 text-xs font-medium', badge.color)}>
            {badge.label}
          </span>
          <span className="text-sm text-gray-500">
            ETA: {item.estimatedMergeTime}
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {item.ciJobs.map(job => (
          <CIJobBadge key={job.name} job={job} />
        ))}
      </div>

      <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
        <span>
          <span className="text-emerald-400">+{item.pr.additions}</span>{' '}
          <span className="text-rose-400">-{item.pr.deletions}</span>
        </span>
        <span className="flex items-center gap-1">
          {item.pr.headBranch} <ArrowRight className="h-3 w-3" /> {item.pr.baseBranch}
        </span>
      </div>
    </div>
  )
}

export default function MergeQueue() {
  const running = mergeQueue.filter(i => i.status === 'running').length
  const waiting = mergeQueue.filter(i => i.status === 'waiting').length
  const failed = mergeQueue.filter(i => i.status === 'failed').length

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6 lg:p-8">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <ListOrdered className="h-6 w-6 text-rose-400" />
          Merge Queue
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          Eliminate merge conflicts and keep main green. PRs are validated and merged in order.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-4 animate-fade-in" style={{ animationDelay: '100ms' }}>
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
          <p className="text-sm text-gray-400">In Queue</p>
          <p className="mt-1 text-2xl font-bold text-gray-100">{mergeQueue.length}</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
          <p className="text-sm text-gray-400">Running CI</p>
          <p className="mt-1 text-2xl font-bold text-blue-400">{running}</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
          <p className="text-sm text-gray-400">Waiting</p>
          <p className="mt-1 text-2xl font-bold text-gray-400">{waiting}</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
          <p className="text-sm text-gray-400">Failed</p>
          <p className="mt-1 text-2xl font-bold text-rose-400">{failed}</p>
        </div>
      </div>

      <div className="space-y-4">
        {mergeQueue.map((item, i) => (
          <QueueCard key={item.id} item={item} index={i} />
        ))}
      </div>

      <div className="animate-fade-in grid gap-4 sm:grid-cols-3" style={{ animationDelay: '500ms' }}>
        <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-5">
          <Shield className="h-5 w-5 text-brand-400 mb-2" />
          <h3 className="text-sm font-semibold text-gray-200">Keep Main Green</h3>
          <p className="mt-1 text-xs text-gray-500 leading-relaxed">
            Every PR is validated against the latest main before merging. No more broken builds.
          </p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-5">
          <Globe className="h-5 w-5 text-emerald-400 mb-2" />
          <h3 className="text-sm font-semibold text-gray-200">Merge From Anywhere</h3>
          <p className="mt-1 text-xs text-gray-500 leading-relaxed">
            Merge PRs from the UI, GitHub, or even your terminal with <code className="text-brand-400">mgt submit</code>.
          </p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-5">
          <Zap className="h-5 w-5 text-amber-400 mb-2" />
          <h3 className="text-sm font-semibold text-gray-200">Save CI Time</h3>
          <p className="mt-1 text-xs text-gray-500 leading-relaxed">
            Intelligent CI optimizations skip redundant tests, saving you time and money.
          </p>
        </div>
      </div>
    </div>
  )
}
