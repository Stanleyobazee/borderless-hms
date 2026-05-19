import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, setValue, formState: { errors } } = useForm()

  // Handle browser autofill which doesn't trigger onChange events
  useEffect(() => {
    const interval = setInterval(() => {
      const u = document.querySelector('input[name="username"]')
      const p = document.querySelector('input[name="password"]')
      if (u?.value) setValue('username', u.value)
      if (p?.value) setValue('password', p.value)
    }, 500)
    return () => clearInterval(interval)
  }, [setValue])

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await login(data.username, data.password)
      toast.success('Welcome back')
      navigate('/')
    } catch {
      toast.error('Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-ink-50">
      {/* Left panel — brand */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden bg-ink-900 flex-col">
        {/* Background pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M28 12h4v4h4v4h-4v4h-4v-4h-4v-4h4zM8 32h4v4h4v4H12v-4H8v-4zm32 0h4v4h4v4h-4v-4h-4v-4z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Radial glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-sienna-500/10 blur-[120px] pointer-events-none" />

        {/* Content */}
        <div className="relative flex flex-col h-full px-14 py-12">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sienna-500 flex items-center justify-center shadow-glow-sienna">
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
                <path d="M12 4v4m0 8v4M4 12h4m8 0h4" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                <rect x="3" y="3" width="18" height="18" rx="4" stroke="white" strokeWidth="1.5" opacity="0.4"/>
              </svg>
            </div>
            <span className="text-white font-display font-semibold text-xl">Borderless HMS</span>
          </div>

          {/* Hero text */}
          <div className="flex-1 flex flex-col justify-center max-w-sm">
            <p className="text-sienna-400 text-sm font-semibold uppercase tracking-widest mb-4">
              Clinical Operations
            </p>
            <h1 className="font-display text-5xl font-semibold text-white leading-[1.1] mb-6">
              Healthcare<br />
              <span className="text-sienna-400">managed</span><br />
              with precision.
            </h1>
            <p className="text-ink-400 text-base leading-relaxed">
              A unified platform for patient records, physician scheduling, and appointment management — built for modern healthcare teams.
            </p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { n: '99.9%', label: 'Uptime SLA' },
              { n: 'HIPAA', label: 'Compliant' },
              { n: '< 50ms', label: 'API latency' },
            ].map((s) => (
              <div key={s.label} className="border border-white/8 rounded-xl p-4">
                <p className="text-white font-display font-semibold text-xl">{s.n}</p>
                <p className="text-ink-500 text-xs mt-0.5 uppercase tracking-wide">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-sm animate-fade-up">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-sienna-500 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                <path d="M12 4v4m0 8v4M4 12h4m8 0h4" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="font-display font-semibold text-lg text-ink-900">Borderless HMS</span>
          </div>

          <h2 className="font-display text-3xl font-semibold text-ink-900 mb-1">Sign in</h2>
          <p className="text-ink-400 text-sm mb-8">Enter your credentials to access the dashboard.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="field-label">Username</label>
              <input
                {...register('username', { required: 'Username is required' })}
                type="text"
                placeholder="admin"
                autoComplete="username"
                className="input-field"
              />
              {errors.username && (
                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                  <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 3.75a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0v-3.5zm.75 7.5a.875.875 0 110-1.75.875.875 0 010 1.75z"/></svg>
                  {errors.username.message}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="field-label mb-0">Password</label>
              </div>
              <input
                {...register('password', { required: 'Password is required' })}
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                className="input-field"
              />
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                  <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 3.75a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0v-3.5zm.75 7.5a.875.875 0 110-1.75.875.875 0 010 1.75z"/></svg>
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base rounded-xl"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Signing in…
                </span>
              ) : 'Sign in →'}
            </button>
          </form>

          {/* Default credentials hint */}
          <div className="mt-8 p-4 rounded-xl bg-ink-100/60 border border-ink-200">
            <p className="text-[11px] font-bold text-ink-500 uppercase tracking-widest mb-2">Demo credentials</p>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-ink-400">Username</span>
                <code className="font-mono text-ink-800 bg-white px-1.5 py-0.5 rounded border border-ink-200">admin</code>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-ink-400">Password</span>
                <code className="font-mono text-ink-800 bg-white px-1.5 py-0.5 rounded border border-ink-200">Admin@12345</code>
              </div>
            </div>
          </div>

          <p className="text-center text-ink-300 text-xs mt-10">
            © 2025 Borderless Technology Academy
          </p>
        </div>
      </div>
    </div>
  )
}
