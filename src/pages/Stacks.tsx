import { useState } from 'react'
import {
  ChevronUp,
  ChevronDown,
  GitBranch,
  ArrowUpToLine,
  Home,
  Circle,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  RefreshCw,
  Send,
  Layers,
} from 'lucide-react'
import clsx from 'clsx'
import { currentStack, type Branch } from '../data/mock'

function CIBadge({ status }: { status: string }) {
  switch (status) {
    case 'passing':
      return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400"><CheckCircle2 className="h-3 w-3" /> Passing</span>
    case 'failing':
      return <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-xs font-medium text-rose-400"><AlertCircle className="h-3 w-3" /> Failing</span>
    case 'pending':
      return <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400"><Clock className="h-3 w-3" /> Pending</span>
    default:
      return <span className="inline-flex items-center gap-1 rounded-full bg-gray-500/10 px-2 py-0.5 text-xs font-medium text-gray-400"><Circle className="h-3 w-3" /> None</span>
  }
}

function ReviewBadge({ status }: { status: string }) {
  switch (status) {
    case 'approved':
      return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">Approved</span>
    case 'changes_requested':
      return <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-xs font-medium text-rose-400">Changes Requested</span>
    case 'pending':
      return <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400">Pending Review</span>
    default:
      return null
  }
}

function StackNode({ branch, index, total }: { branch: Branch; index: number; total: number }) {
  const isCurrent = branch.status === 'current'
  const isTrunk = branch.status === 'trunk'

  return (
    <div
      className={clsx(
        'animate-fade-in relative',
      )}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex items-stretch gap-4">
        <div className="flex flex-col items-center">
          <div
            className={clsx(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all',
              isTrunk && 'border-gray-600 bg-gray-800',
              isCurrent && 'border-brand-500 bg-brand-600/20 animate-pulse-glow',
              branch.status === 'above' && 'border-gray-700 bg-gray-800/50',
              branch.status === 'below' && 'border-emerald-600/50 bg-emerald-600/10',
            )}
          >
            {isTrunk ? (
              <Home className="h-4 w-4 text-gray-400" />
            ) : (
              <GitBranch className={clsx('h-4 w-4', isCurrent ? 'text-brand-400' : 'text-gray-400')} />
            )}
          </div>
          {index < total - 1 && (
            <div className={clsx(
              'w-0.5 flex-1 min-h-4',
              isCurrent ? 'bg-brand-500/40' : 'bg-gray-700/50'
            )} />
          )}
        </div>

        <div
          className={clsx(
            'mb-3 flex-1 rounded-xl border p-4 transition-all',
            isTrunk && 'border-gray-800 bg-gray-900/30',
            isCurrent && 'border-brand-500/30 bg-brand-600/5',
            branch.status === 'above' && 'border-gray-800/50 bg-gray-900/20 opacity-60',
            branch.status === 'below' && 'border-gray-800 bg-gray-900/40',
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <code className={clsx(
                  'text-sm font-semibold',
                  isCurrent ? 'text-brand-400' : 'text-gray-200'
                )}>
                  {branch.name}
                </code>
                {isCurrent && (
                  <span className="rounded-full bg-brand-500/20 px-2 py-0.5 text-xs font-medium text-brand-300">
                    HEAD
                  </span>
                )}
                {branch.pr?.status === 'draft' && (
                  <span className="rounded-full bg-gray-700 px-2 py-0.5 text-xs font-medium text-gray-300">
                    Draft
                  </span>
                )}
              </div>
              {branch.pr && (
                <>
                  <p className="mt-1 text-sm text-gray-400">
                    #{branch.pr.number} · {branch.pr.title}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <CIBadge status={branch.pr.ciStatus} />
                    <ReviewBadge status={branch.pr.reviewStatus} />
                    <span className="text-xs text-gray-500">
                      <span className="text-emerald-400">+{branch.pr.additions}</span>{' '}
                      <span className="text-rose-400">-{branch.pr.deletions}</span>
                    </span>
                  </div>
                </>
              )}
              {isTrunk && (
                <p className="mt-1 text-sm text-gray-500">Trunk branch</p>
              )}
            </div>
            {branch.pr?.stackPosition && (
              <span className="shrink-0 rounded-lg bg-gray-800 px-2 py-1 text-xs text-gray-400">
                {branch.pr.stackPosition}/{branch.pr.stackSize}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Stacks() {
  const [stack] = useState(currentStack)
  const reversedStack = [...stack].reverse()

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6 lg:p-8">
      <div className="animate-fade-in flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stack Visualization</h1>
          <p className="mt-1 text-sm text-gray-400">
            Navigate your stacked branches. Currently on{' '}
            <code className="text-brand-400">santhosh/rbac-checks</code>
          </p>
        </div>
      </div>

      <div className="animate-fade-in flex flex-wrap gap-2" style={{ animationDelay: '100ms' }}>
        <button className="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800/80 px-3 py-2 text-sm font-medium text-gray-200 transition-colors hover:border-brand-500/40 hover:bg-brand-600/10 hover:text-brand-300">
          <ChevronUp className="h-4 w-4" /> Up
        </button>
        <button className="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800/80 px-3 py-2 text-sm font-medium text-gray-200 transition-colors hover:border-brand-500/40 hover:bg-brand-600/10 hover:text-brand-300">
          <ChevronDown className="h-4 w-4" /> Down
        </button>
        <button className="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800/80 px-3 py-2 text-sm font-medium text-gray-200 transition-colors hover:border-brand-500/40 hover:bg-brand-600/10 hover:text-brand-300">
          <ArrowUpToLine className="h-4 w-4" /> Top
        </button>
        <button className="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800/80 px-3 py-2 text-sm font-medium text-gray-200 transition-colors hover:border-brand-500/40 hover:bg-brand-600/10 hover:text-brand-300">
          <Home className="h-4 w-4" /> Trunk
        </button>
        <div className="w-px bg-gray-800" />
        <button className="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800/80 px-3 py-2 text-sm font-medium text-gray-200 transition-colors hover:border-emerald-500/40 hover:bg-emerald-600/10 hover:text-emerald-300">
          <Plus className="h-4 w-4" /> Create
        </button>
        <button className="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800/80 px-3 py-2 text-sm font-medium text-gray-200 transition-colors hover:border-emerald-500/40 hover:bg-emerald-600/10 hover:text-emerald-300">
          <Send className="h-4 w-4" /> Submit
        </button>
        <button className="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800/80 px-3 py-2 text-sm font-medium text-gray-200 transition-colors hover:border-emerald-500/40 hover:bg-emerald-600/10 hover:text-emerald-300">
          <Layers className="h-4 w-4" /> Stack Submit
        </button>
        <button className="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800/80 px-3 py-2 text-sm font-medium text-gray-200 transition-colors hover:border-cyan-500/40 hover:bg-cyan-600/10 hover:text-cyan-300">
          <RefreshCw className="h-4 w-4" /> Restack
        </button>
      </div>

      <div className="mt-6">
        {reversedStack.map((branch, i) => (
          <StackNode key={branch.name} branch={branch} index={i} total={reversedStack.length} />
        ))}
      </div>

      <div className="animate-fade-in rounded-xl border border-gray-800 bg-gray-900/40 p-5" style={{ animationDelay: '500ms' }}>
        <h3 className="text-sm font-semibold text-gray-300">Terminal Preview</h3>
        <div className="mt-3 rounded-lg bg-gray-950 p-4 font-mono text-sm">
          <div className="text-gray-500">$ mgt log</div>
          <div className="mt-2 space-y-1">
            <div className="text-gray-500">  ┌─ <span className="text-gray-400">santhosh/rbac-tests</span> <span className="text-gray-600">(draft)</span></div>
            <div className="text-brand-400">  ├─ santhosh/rbac-checks <span className="text-brand-300">◀ HEAD</span></div>
            <div className="text-emerald-400">  ├─ <span className="text-gray-300">santhosh/user-model</span> <span className="text-emerald-500">✓ approved</span></div>
            <div className="text-emerald-400">  ├─ <span className="text-gray-300">santhosh/auth-middleware</span> <span className="text-emerald-500">✓ approved</span></div>
            <div className="text-gray-600">  └─ main</div>
          </div>
        </div>
      </div>
    </div>
  )
}
