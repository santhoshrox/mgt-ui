import { Link } from 'react-router-dom'
import {
  GitBranch,
  Inbox,
  Bot,
  ListOrdered,
  BarChart3,
  ArrowRight,
  Terminal,
  ChevronUp,
  ChevronDown,
  GitMerge,
  RefreshCw,
} from 'lucide-react'
import { mgtCommands, currentStack, inboxPRs } from '../data/mock'

const features = [
  {
    title: 'Stack Visualization',
    desc: 'View and navigate your branch stacks with an interactive visual tree.',
    icon: GitBranch,
    to: '/stacks',
    color: 'text-brand-400',
    bg: 'bg-brand-500/10',
  },
  {
    title: 'PR Inbox',
    desc: 'Unified inbox for all pull requests with filters, CI status, and review state.',
    icon: Inbox,
    to: '/inbox',
    color: 'text-emerald-glow',
    bg: 'bg-emerald-500/10',
  },
  {
    title: 'AI Reviews',
    desc: 'Automatic code review that catches bugs, suggests fixes, and learns from feedback.',
    icon: Bot,
    to: '/reviews',
    color: 'text-amber-glow',
    bg: 'bg-amber-500/10',
  },
  {
    title: 'Merge Queue',
    desc: 'Eliminate conflicts and keep main green with an intelligent merge queue.',
    icon: ListOrdered,
    to: '/merge-queue',
    color: 'text-rose-glow',
    bg: 'bg-rose-500/10',
  },
  {
    title: 'Insights',
    desc: 'Track team velocity with metrics for cycle time, review wait, and deployment frequency.',
    icon: BarChart3,
    to: '/insights',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
  },
]

const quickActions = [
  { icon: ChevronUp, label: 'mgt up', desc: 'Move up stack' },
  { icon: ChevronDown, label: 'mgt down', desc: 'Move down stack' },
  { icon: GitMerge, label: 'mgt submit', desc: 'Submit PR' },
  { icon: RefreshCw, label: 'mgt sync', desc: 'Sync & cleanup' },
]

export default function Dashboard() {
  const openPRs = inboxPRs.filter(pr => pr.status === 'open').length
  const stackSize = currentStack.filter(b => b.status !== 'trunk').length

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6 lg:p-8">
      <div className="animate-fade-in">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome to <span className="text-brand-400">mgt</span>
            </h1>
            <p className="mt-2 max-w-xl text-gray-400">
              Your enhanced Charcoal (gt) CLI with stack visualization, PR inbox,
              AI-powered reviews, merge queues, and team insights.
            </p>
          </div>
          <a
            href="https://github.com/santhoshrox/mgt"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:border-gray-600 hover:text-white sm:inline-flex items-center gap-2"
          >
            <Terminal className="h-4 w-4" />
            View on GitHub
          </a>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-fade-in" style={{ animationDelay: '100ms' }}>
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
          <p className="text-sm text-gray-400">Active Stack</p>
          <p className="mt-1 text-2xl font-bold">{stackSize} <span className="text-sm font-normal text-gray-500">branches</span></p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
          <p className="text-sm text-gray-400">Open PRs</p>
          <p className="mt-1 text-2xl font-bold">{openPRs} <span className="text-sm font-normal text-gray-500">awaiting review</span></p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
          <p className="text-sm text-gray-400">AI Issues Found</p>
          <p className="mt-1 text-2xl font-bold">5 <span className="text-sm font-normal text-gray-500">in latest scan</span></p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
          <p className="text-sm text-gray-400">Queue Position</p>
          <p className="mt-1 text-2xl font-bold">#1 <span className="text-sm font-normal text-gray-500">~2 min to merge</span></p>
        </div>
      </div>

      <div className="animate-fade-in" style={{ animationDelay: '150ms' }}>
        <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map(({ icon: Icon, label, desc }) => (
            <button
              key={label}
              className="group flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-900/50 p-4 text-left transition-all hover:border-brand-500/30 hover:bg-brand-600/5"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-800 transition-colors group-hover:bg-brand-600/20">
                <Icon className="h-5 w-5 text-gray-400 transition-colors group-hover:text-brand-400" />
              </div>
              <div>
                <p className="font-mono text-sm font-medium text-gray-200">{label}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
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

      <div className="animate-fade-in" style={{ animationDelay: '250ms' }}>
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
                <code className="min-w-[10rem] shrink-0 text-sm font-medium text-brand-400">
                  $ {cmd}
                </code>
                <span className="text-sm text-gray-400">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
