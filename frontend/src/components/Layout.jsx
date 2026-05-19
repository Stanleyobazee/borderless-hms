import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV = [
  {
    href: '/',
    label: 'Dashboard',
    exact: true,
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path d="M2 10a8 8 0 1116 0A8 8 0 012 10zm8-5a1 1 0 00-1 1v3H6a1 1 0 100 2h3v3a1 1 0 102 0v-3h3a1 1 0 100-2h-3V6a1 1 0 00-1-1z" />
      </svg>
    ),
  },
  {
    href: '/patients',
    label: 'Patients',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
      </svg>
    ),
  },
  {
    href: '/doctors',
    label: 'Doctors',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    href: '/appointments',
    label: 'Appointments',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    href: '/departments',
    label: 'Departments',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
      </svg>
    ),
  },
]

function NavItem({ item, active, onClick }) {
  return (
    <Link
      to={item.href}
      onClick={onClick}
      className={`
        relative flex items-center gap-3 px-4 py-2.5 mx-2 rounded-xl text-sm font-medium
        transition-all duration-200 group
        ${active
          ? 'nav-item-active bg-white/10 text-white'
          : 'text-ink-300 hover:bg-white/6 hover:text-white'
        }
      `}
    >
      <span className={`transition-colors duration-200 ${active ? 'text-sienna-400' : 'text-ink-400 group-hover:text-ink-200'}`}>
        {item.icon}
      </span>
      <span>{item.label}</span>
    </Link>
  )
}

export default function Layout({ children }) {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const isActive = (item) =>
    item.exact ? location.pathname === item.href : location.pathname.startsWith(item.href)

  const handleLogout = () => { logout(); navigate('/login') }

  const initials = `${user?.first_name?.[0] ?? ''}${user?.last_name?.[0] ?? ''}`

  const Sidebar = () => (
    <aside className="flex flex-col h-full bg-ink-900 w-64 flex-shrink-0">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/8">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sienna-500 flex items-center justify-center flex-shrink-0 shadow-glow-sienna">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
              <path d="M12 4v4m0 8v4M4 12h4m8 0h4" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              <rect x="3" y="3" width="18" height="18" rx="4" stroke="white" strokeWidth="1.5" opacity="0.4"/>
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-white font-display font-semibold text-base leading-tight tracking-tight">Borderless</p>
            <p className="text-ink-400 text-[11px] uppercase tracking-widest">Health System</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <p className="px-6 mb-2 text-[10px] font-bold text-ink-600 uppercase tracking-widest">Main Menu</p>
        <div className="space-y-0.5">
          {NAV.map((item) => (
            <NavItem
              key={item.href}
              item={item}
              active={isActive(item)}
              onClick={() => setOpen(false)}
            />
          ))}
        </div>
      </nav>

      {/* User profile */}
      <div className="px-3 py-4 border-t border-white/8">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/6 transition-colors cursor-default">
          <div className="w-8 h-8 rounded-lg bg-sienna-500/20 border border-sienna-500/30 flex items-center justify-center text-sienna-400 text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate leading-tight">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-ink-500 text-[11px] capitalize truncate">{user?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="text-ink-600 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-400/10"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h6a1 1 0 100-2H4V5h5a1 1 0 100-2H3zm10.293 3.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L14.586 11H8a1 1 0 110-2h6.586l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd"/>
            </svg>
          </button>
        </div>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-col">
        <Sidebar />
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-ink-900/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative flex flex-col w-64 animate-slide-in">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex-shrink-0 h-14 bg-white border-b border-ink-100 flex items-center px-4 gap-3">
          <button
            onClick={() => setOpen(true)}
            className="lg:hidden btn-ghost rounded-xl"
            aria-label="Open menu"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
            </svg>
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-ink-400 font-sans">
            <span className="text-ink-300">Borderless HMS</span>
            <span>/</span>
            <span className="text-ink-700 font-medium capitalize">
              {location.pathname === '/' ? 'Dashboard' : location.pathname.slice(1)}
            </span>
          </div>

          <div className="flex-1" />

          {/* Status pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-jade-50 border border-jade-200">
            <span className="w-1.5 h-1.5 rounded-full bg-jade-500 animate-pulse" />
            <span className="text-jade-700 text-[11px] font-semibold uppercase tracking-wide">Live</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {children}
        </main>
      </div>
    </div>
  )
}
