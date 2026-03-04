import { useState } from 'react'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Calendar,
} from 'lucide-react'
import clsx from 'clsx'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { insightMetrics, timeSeriesData, devActivity } from '../data/mock'

type TimePeriod = 'week' | 'month' | 'quarter' | 'year'

function MetricCard({ metric }: { metric: typeof insightMetrics[0] }) {
  const isPositive = metric.change && metric.change > 0
  const isNegative = metric.change && metric.change < 0
  const improved = metric.label.includes('Wait') || metric.label.includes('Cycle') || metric.label.includes('Review Cycles')
    ? isNegative
    : isPositive

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
      <p className="text-sm text-gray-400">{metric.label}</p>
      <div className="mt-2 flex items-end gap-2">
        <span className="text-2xl font-bold text-gray-100">{metric.value}</span>
        {metric.unit && (
          <span className="mb-0.5 text-xs text-gray-500">{metric.unit}</span>
        )}
      </div>
      {metric.change !== undefined && (
        <div className={clsx(
          'mt-2 flex items-center gap-1 text-xs font-medium',
          improved ? 'text-emerald-400' : 'text-rose-400'
        )}>
          {improved ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {Math.abs(metric.change)}% vs last period
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

export default function Insights() {
  const [period, setPeriod] = useState<TimePeriod>('month')

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
      <div className="animate-fade-in flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-cyan-400" />
            Insights
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Track engineering velocity with data-driven metrics that matter.
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-gray-800 bg-gray-900/50 p-0.5">
          {(['week', 'month', 'quarter', 'year'] as TimePeriod[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={clsx(
                'rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors',
                period === p
                  ? 'bg-gray-700 text-gray-100'
                  : 'text-gray-400 hover:text-gray-200'
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
        {insightMetrics.map(metric => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="animate-fade-in rounded-xl border border-gray-800 bg-gray-900/50 p-5" style={{ animationDelay: '200ms' }}>
          <h3 className="text-sm font-semibold text-gray-300 mb-4">PR Activity Over Time</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={timeSeriesData}>
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
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 12 }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
              <Area type="monotone" dataKey="prsOpened" name="PRs Opened" stroke="#6366f1" fillOpacity={1} fill="url(#colorOpened)" />
              <Area type="monotone" dataKey="prsMerged" name="PRs Merged" stroke="#10b981" fillOpacity={1} fill="url(#colorMerged)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="animate-fade-in rounded-xl border border-gray-800 bg-gray-900/50 p-5" style={{ animationDelay: '300ms' }}>
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Reviews Completed</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 12 }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="reviewsDone" name="Reviews" fill="#818cf8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="animate-fade-in rounded-xl border border-gray-800 bg-gray-900/50 p-5" style={{ animationDelay: '400ms' }}>
        <h3 className="text-sm font-semibold text-gray-300 mb-4">Developer Activity</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="py-3 pr-4 text-left text-xs font-medium text-gray-500">Developer</th>
                <th className="py-3 px-4 text-right text-xs font-medium text-gray-500">PRs Merged</th>
                <th className="py-3 px-4 text-right text-xs font-medium text-gray-500">Reviews Done</th>
                <th className="py-3 pl-4 text-left text-xs font-medium text-gray-500">Activity</th>
              </tr>
            </thead>
            <tbody>
              {devActivity.map((dev, i) => {
                const maxActivity = Math.max(...devActivity.map(d => d.merged + d.reviewed))
                const pct = ((dev.merged + dev.reviewed) / maxActivity) * 100
                return (
                  <tr key={dev.name} className="border-b border-gray-800/50" style={{ animationDelay: `${450 + i * 50}ms` }}>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <img src={dev.avatar} alt={dev.name} className="h-6 w-6 rounded-full bg-gray-700" />
                        <span className="font-medium text-gray-200">{dev.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-emerald-400">{dev.merged}</td>
                    <td className="py-3 px-4 text-right font-medium text-brand-400">{dev.reviewed}</td>
                    <td className="py-3 pl-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-800">
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

      <div className="animate-fade-in grid gap-4 sm:grid-cols-3" style={{ animationDelay: '550ms' }}>
        <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-5">
          <TrendingUp className="h-5 w-5 text-emerald-400 mb-2" />
          <h3 className="text-sm font-semibold text-gray-200">Beyond Vanity Metrics</h3>
          <p className="mt-1 text-xs text-gray-500 leading-relaxed">
            Track data-driven metrics proven to enhance developer productivity — cycle time, review latency, and deploy frequency.
          </p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-5">
          <BarChart3 className="h-5 w-5 text-brand-400 mb-2" />
          <h3 className="text-sm font-semibold text-gray-200">Full Transparency</h3>
          <p className="mt-1 text-xs text-gray-500 leading-relaxed">
            Empower every team member with data regardless of their role. No more guesswork.
          </p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-5">
          <Calendar className="h-5 w-5 text-amber-400 mb-2" />
          <h3 className="text-sm font-semibold text-gray-200">Historical Record</h3>
          <p className="mt-1 text-xs text-gray-500 leading-relaxed">
            Measure trends over time to identify and fix bottlenecks in your engineering workflow.
          </p>
        </div>
      </div>
    </div>
  )
}
