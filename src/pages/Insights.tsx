import { useEffect, useState } from 'react'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  RefreshCw,
} from 'lucide-react'
import clsx from 'clsx'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { useAuth } from '../context/AuthContext'
import { searchPRs, hoursBetween, type GHSearchItem } from '../lib/github'
import { Loading, ErrorState } from '../components/PageState'

type TimePeriod = 'week' | 'month' | 'quarter' | 'year'

interface Metrics {
  prsMerged: number
  prsOpened: number
  avgCycleHours: number
  reviewsDone: number
  uniqueReviewers: number
  avgPRSize: number
}

interface WeeklyPoint {
  week: string
  merged: number
  opened: number
  reviewed: number
}

interface ReviewerStat {
  login: string
  avatar: string
  count: number
}

function periodDays(p: TimePeriod): number {
  return { week: 7, month: 30, quarter: 90, year: 365 }[p]
}

function dateNDaysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

function weekLabel(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function computeWeeklyData(merged: GHSearchItem[], opened: GHSearchItem[], period: TimePeriod): WeeklyPoint[] {
  const days = periodDays(period)
  const buckets = Math.min(Math.ceil(days / 7), 12)
  const now = Date.now()
  const points: WeeklyPoint[] = []

  for (let i = buckets - 1; i >= 0; i--) {
    const start = now - (i + 1) * 7 * 86400000
    const end = now - i * 7 * 86400000
    const label = weekLabel(new Date(end).toISOString())

    const m = merged.filter(pr => {
      const t = new Date(pr.pull_request?.merged_at || pr.updated_at).getTime()
      return t >= start && t < end
    }).length

    const o = opened.filter(pr => {
      const t = new Date(pr.created_at).getTime()
      return t >= start && t < end
    }).length

    points.push({ week: label, merged: m, opened: o, reviewed: 0 })
  }

  return points
}

function computeReviewers(items: GHSearchItem[]): ReviewerStat[] {
  const map = new Map<string, ReviewerStat>()
  items.forEach(item => {
    const key = item.user.login
    const existing = map.get(key)
    if (existing) {
      existing.count++
    } else {
      map.set(key, { login: key, avatar: item.user.avatar_url, count: 1 })
    }
  })
  return [...map.values()].sort((a, b) => b.count - a.count)
}

function MetricCard({ label, value, unit, change }: { label: string; value: string | number; unit?: string; change?: number }) {
  const improved = label.includes('Cycle') || label.includes('Wait')
    ? (change ?? 0) < 0
    : (change ?? 0) > 0

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
      <p className="text-sm text-gray-400">{label}</p>
      <div className="mt-2 flex items-end gap-2">
        <span className="text-2xl font-bold text-gray-100">{value}</span>
        {unit && <span className="mb-0.5 text-xs text-gray-500">{unit}</span>}
      </div>
      {change !== undefined && change !== 0 && (
        <div className={clsx(
          'mt-2 flex items-center gap-1 text-xs font-medium',
          improved ? 'text-emerald-400' : 'text-rose-400'
        )}>
          {improved ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          computed from your data
        </div>
      )}
    </div>
  )
}

const tooltipStyle = {
  contentStyle: {
    backgroundColor: '#111827',
    border: '1px solid #1f2937',
    borderRadius: '0.75rem',
    fontSize: '0.75rem',
    color: '#e5e7eb',
  },
  labelStyle: { color: '#9ca3af' },
}

export default function InsightsPage() {
  const { token, user } = useAuth()
  const [period, setPeriod] = useState<TimePeriod>('month')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [weeklyData, setWeeklyData] = useState<WeeklyPoint[]>([])
  const [reviewers, setReviewers] = useState<ReviewerStat[]>([])

  async function load() {
    if (!token || !user) return
    try {
      setLoading(true)
      setError(null)
      const since = dateNDaysAgo(periodDays(period))

      const [mergedResult, openedResult, reviewedResult] = await Promise.all([
        searchPRs(token, `type:pr author:${user.login} is:merged merged:>=${since}`, 100),
        searchPRs(token, `type:pr author:${user.login} created:>=${since}`, 100),
        searchPRs(token, `type:pr reviewed-by:${user.login} updated:>=${since}`, 100),
      ])

      const merged = mergedResult.items.filter(i => i.pull_request)
      const opened = openedResult.items.filter(i => i.pull_request)
      const reviewed = reviewedResult.items.filter(i => i.pull_request)

      const cycleHours = merged
        .filter(pr => pr.pull_request?.merged_at)
        .map(pr => hoursBetween(pr.created_at, pr.pull_request!.merged_at!))

      const avgCycle = cycleHours.length > 0 ? cycleHours.reduce((a, b) => a + b, 0) / cycleHours.length : 0

      const uniqueReviewerLogins = new Set(reviewed.map(r => r.user.login))

      setMetrics({
        prsMerged: merged.length,
        prsOpened: opened.length,
        avgCycleHours: avgCycle,
        reviewsDone: reviewed.length,
        uniqueReviewers: uniqueReviewerLogins.size,
        avgPRSize: 0,
      })

      setWeeklyData(computeWeeklyData(merged, opened, period))
      setReviewers(computeReviewers(reviewed))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [token, user, period])

  if (loading) return <Loading message="Computing insights..." />
  if (error) return <ErrorState message={error} onRetry={load} />

  function formatCycle(hours: number): string {
    if (hours < 1) return `${Math.round(hours * 60)}m`
    if (hours < 24) return `${hours.toFixed(1)}h`
    return `${(hours / 24).toFixed(1)}d`
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
      <div className="animate-fade-in flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-cyan-400" />
            Insights
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Your engineering metrics for the past {period}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-gray-800 bg-gray-900/50 p-0.5">
            {(['week', 'month', 'quarter', 'year'] as TimePeriod[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={clsx(
                  'rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors',
                  period === p ? 'bg-gray-700 text-gray-100' : 'text-gray-400 hover:text-gray-200'
                )}
              >
                {p}
              </button>
            ))}
          </div>
          <button
            onClick={load}
            className="rounded-lg border border-gray-700 p-2 text-gray-400 hover:border-gray-600 hover:text-white transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {metrics && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <MetricCard label="PRs Merged" value={metrics.prsMerged} unit={`this ${period}`} />
          <MetricCard label="PRs Opened" value={metrics.prsOpened} unit={`this ${period}`} />
          <MetricCard label="Avg Cycle Time" value={formatCycle(metrics.avgCycleHours)} unit="to merge" />
          <MetricCard label="Reviews Done" value={metrics.reviewsDone} unit={`this ${period}`} />
          <MetricCard label="Unique Reviewers" value={metrics.uniqueReviewers} unit="people" />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="animate-fade-in rounded-xl border border-gray-800 bg-gray-900/50 p-5" style={{ animationDelay: '200ms' }}>
          <h3 className="text-sm font-semibold text-gray-300 mb-4">PR Activity Over Time</h3>
          {weeklyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="colorOpened" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorMerged" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="week" tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} allowDecimals={false} />
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
                <Area type="monotone" dataKey="opened" name="Opened" stroke="#6366f1" fillOpacity={1} fill="url(#colorOpened)" />
                <Area type="monotone" dataKey="merged" name="Merged" stroke="#10b981" fillOpacity={1} fill="url(#colorMerged)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[280px] items-center justify-center text-sm text-gray-500">
              Not enough data for this period
            </div>
          )}
        </div>

        <div className="animate-fade-in rounded-xl border border-gray-800 bg-gray-900/50 p-5" style={{ animationDelay: '300ms' }}>
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Weekly Merge Rate</h3>
          {weeklyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="week" tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} allowDecimals={false} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="merged" name="Merged" fill="#818cf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[280px] items-center justify-center text-sm text-gray-500">
              Not enough data for this period
            </div>
          )}
        </div>
      </div>

      {reviewers.length > 0 && (
        <div className="animate-fade-in rounded-xl border border-gray-800 bg-gray-900/50 p-5" style={{ animationDelay: '400ms' }}>
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Who Reviewed Your PRs</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="py-3 pr-4 text-left text-xs font-medium text-gray-500">Reviewer</th>
                  <th className="py-3 px-4 text-right text-xs font-medium text-gray-500">Reviews</th>
                  <th className="py-3 pl-4 text-left text-xs font-medium text-gray-500">Activity</th>
                </tr>
              </thead>
              <tbody>
                {reviewers.map((r) => {
                  const maxCount = reviewers[0]?.count || 1
                  const pct = (r.count / maxCount) * 100
                  return (
                    <tr key={r.login} className="border-b border-gray-800/50">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <img src={r.avatar} alt={r.login} className="h-6 w-6 rounded-full bg-gray-700" />
                          <span className="font-medium text-gray-200">{r.login}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-brand-400">{r.count}</td>
                      <td className="py-3 pl-4">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-full max-w-[200px] overflow-hidden rounded-full bg-gray-800">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-brand-500 to-emerald-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="animate-fade-in grid gap-4 sm:grid-cols-3" style={{ animationDelay: '550ms' }}>
        <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-5">
          <TrendingUp className="h-5 w-5 text-emerald-400 mb-2" />
          <h3 className="text-sm font-semibold text-gray-200">Real Metrics</h3>
          <p className="mt-1 text-xs text-gray-500 leading-relaxed">
            All metrics are computed from your actual GitHub activity — PRs merged, review cycles, and cycle time.
          </p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-5">
          <BarChart3 className="h-5 w-5 text-brand-400 mb-2" />
          <h3 className="text-sm font-semibold text-gray-200">Time Periods</h3>
          <p className="mt-1 text-xs text-gray-500 leading-relaxed">
            Switch between week, month, quarter, and year views to analyze trends over different timeframes.
          </p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-5">
          <Calendar className="h-5 w-5 text-amber-400 mb-2" />
          <h3 className="text-sm font-semibold text-gray-200">Historical Trends</h3>
          <p className="mt-1 text-xs text-gray-500 leading-relaxed">
            Track your productivity over time to identify patterns and improve your workflow.
          </p>
        </div>
      </div>
    </div>
  )
}
