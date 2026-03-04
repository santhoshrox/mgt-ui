import { useState } from 'react'
import { Terminal, Key, ExternalLink, Loader2, AlertCircle, Eye, EyeOff, Github } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const SCOPES = ['repo', 'read:user', 'read:org']

export default function Login() {
  const { login, loading, error } = useAuth()
  const [token, setToken] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [validating, setValidating] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = token.trim()
    if (!trimmed) {
      setLocalError('Please enter a token')
      return
    }
    setLocalError(null)
    setValidating(true)
    const ok = await login(trimmed)
    setValidating(false)
    if (!ok) {
      setLocalError('Could not authenticate. Check your token and try again.')
    }
  }

  const isLoading = loading || validating
  const displayError = localError || error

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 p-6">
      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600">
            <Terminal className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-100">
            Sign in to <span className="text-brand-400">mgt</span>
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Connect your GitHub account to power the dashboard with real data.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-6 space-y-4">
            <div>
              <label htmlFor="token" className="mb-1.5 flex items-center gap-2 text-sm font-medium text-gray-300">
                <Key className="h-4 w-4 text-gray-500" />
                Personal Access Token
              </label>
              <div className="relative">
                <input
                  id="token"
                  type={showToken ? 'text' : 'password'}
                  value={token}
                  onChange={e => { setToken(e.target.value); setLocalError(null) }}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  autoFocus
                  spellCheck={false}
                  autoComplete="off"
                  className="w-full rounded-lg border border-gray-700 bg-gray-950 py-2.5 pl-4 pr-10 font-mono text-sm text-gray-200 placeholder-gray-600 outline-none transition-colors focus:border-brand-500/60 focus:ring-1 focus:ring-brand-500/30"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  tabIndex={-1}
                >
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {displayError && (
              <div className="flex items-start gap-2 rounded-lg bg-rose-500/10 px-3 py-2.5 text-sm text-rose-400">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {displayError}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !token.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Github className="h-4 w-4" />
                  Connect GitHub
                </>
              )}
            </button>
          </div>

          <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-5 space-y-3">
            <h3 className="text-sm font-semibold text-gray-300">How to create a token</h3>
            <ol className="space-y-2 text-xs text-gray-400 leading-relaxed">
              <li className="flex gap-2">
                <span className="shrink-0 font-mono text-brand-400">1.</span>
                Go to{' '}
                <a
                  href={`https://github.com/settings/tokens/new?scopes=${SCOPES.join(',')}&description=mgt-ui`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-brand-400 hover:text-brand-300 underline underline-offset-2"
                >
                  GitHub Token Settings <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li className="flex gap-2">
                <span className="shrink-0 font-mono text-brand-400">2.</span>
                <span>Select <strong>Classic</strong> token, set a name like <code className="text-brand-400">mgt-ui</code></span>
              </li>
              <li className="flex gap-2">
                <span className="shrink-0 font-mono text-brand-400">3.</span>
                <span>Enable these scopes:</span>
              </li>
            </ol>
            <div className="flex flex-wrap gap-1.5 pl-5">
              {SCOPES.map(s => (
                <code key={s} className="rounded-md bg-gray-800 px-2 py-0.5 text-xs text-gray-300">{s}</code>
              ))}
            </div>
            <p className="pl-5 text-xs text-gray-500">
              Your token is stored only in your browser's localStorage and is never sent anywhere except to the GitHub API.
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
