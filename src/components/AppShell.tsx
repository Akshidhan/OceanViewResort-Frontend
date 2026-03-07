import { useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../state/useAuth.ts'

type NavItem = {
  to: string
  label: string
  blurb: string
}

const navItems: NavItem[] = [
  { to: '/reservations', label: 'Reservations', blurb: 'Bookings and stay dates' },
  { to: '/rooms', label: 'Rooms', blurb: 'Inventory and pricing' },
  { to: '/bills', label: 'Bills', blurb: 'Invoices and totals' },
]

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { logout } = useAuth()
  const location = useLocation()

  const currentLabel = useMemo(() => {
    return navItems.find((item) => location.pathname.startsWith(item.to))?.label ?? 'Dashboard'
  }, [location.pathname])

  return (
    <div className="min-h-screen p-3 md:p-5">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-7xl overflow-hidden rounded-[24px] border border-[#d4e0da] bg-[#f7fbf9]/70 shadow-[0_20px_40px_rgba(14,43,30,0.08)] backdrop-blur-sm">
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-[#d6e2dc] bg-[#f9fcfa] p-5 transition-transform duration-200 md:static md:translate-x-0 ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="rounded-2xl border border-[#d7e4de] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5a7065]">Ocean View Resort</p>
            <h1 className="mt-2 text-xl font-extrabold tracking-tight text-[#13251c]">Hotel Operations</h1>
            <p className="mt-2 text-sm text-[#5c7066]">Manage rooms, reservations, and billing from one place.</p>
          </div>

          <nav className="mt-6 space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `block rounded-xl border p-3 transition ${
                    isActive
                      ? 'border-[#a9c8b9] bg-[#e9f3ee]'
                      : 'border-transparent bg-transparent hover:border-[#d5e2dc] hover:bg-white'
                  }`
                }
              >
                <p className="text-sm font-bold text-[#12221a]">{item.label}</p>
                <p className="mt-1 text-xs text-[#60776b]">{item.blurb}</p>
              </NavLink>
            ))}
          </nav>

          <button
            type="button"
            className="ovr-button-muted mt-8 w-full"
            onClick={() => {
              logout()
              setMobileOpen(false)
            }}
          >
            Logout
          </button>
        </aside>

        {mobileOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-30 bg-black/20 md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu overlay"
          />
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-[#d6e2dc] bg-white/80 px-4 py-3 md:px-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.17em] text-[#5f7569]">Section</p>
              <p className="text-lg font-bold tracking-tight text-[#13261d]">{currentLabel}</p>
            </div>
            <button
              type="button"
              className="ovr-button-muted md:hidden"
              onClick={() => setMobileOpen((previous) => !previous)}
            >
              Menu
            </button>
          </header>

          <main className="min-w-0 flex-1 p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
