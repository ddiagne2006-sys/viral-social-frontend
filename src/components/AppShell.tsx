import { faFolderOpen as farFolderOpen } from '@fortawesome/free-regular-svg-icons'
import {
  faCircleNotch,
  faClockRotateLeft,
  faGear,
  faRightFromBracket,
  faRobot,
  faTableCellsLarge,
  faWandMagicSparkles,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { type FormEvent, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'

import { useLogout, useMe } from '../api/auth'
import { initials } from '../domain/project'
import { fr } from '../i18n/fr'
import { paths } from '../paths'
import { Logo } from './Logo'
import { ShellSlotContext } from './shell/ShellSlotContext'
import { useErrorToast } from './toast/useErrorToast'
import { SearchField } from './ui/Fields'

function LogoutButton({ compact = false }: { compact?: boolean }) {
  const logout = useLogout()
  const showError = useErrorToast()
  const label = logout.isPending ? fr.account.loggingOut : fr.account.logout

  return (
    <button
      type="button"
      onClick={() => logout.mutate(undefined, { onError: showError })}
      disabled={logout.isPending}
      aria-label={compact ? label : undefined}
      className={`inline-flex min-h-touch items-center gap-3 rounded-field font-medium text-ink-soft hover:bg-nav-hover disabled:opacity-70 ${
        compact ? 'min-w-touch justify-center' : 'w-full px-3'
      }`}
    >
      <FontAwesomeIcon
        icon={logout.isPending ? faCircleNotch : faRightFromBracket}
        spin={logout.isPending}
        fixedWidth
        aria-hidden
      />
      {!compact && label}
    </button>
  )
}

/** Recherche de l'en-tête : ouvre « Mes projets » filtré. */
function HeaderSearch() {
  const navigate = useNavigate()
  const [value, setValue] = useState('')

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const search = value.trim()
    navigate(search ? `${paths.projects}?search=${encodeURIComponent(search)}` : paths.projects)
  }

  return (
    <form role="search" onSubmit={onSubmit} className="hidden w-full max-w-sm sm:block">
      <SearchField
        label={fr.nav.search}
        placeholder={fr.nav.searchPlaceholder}
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
    </form>
  )
}

const navItems = [
  { to: paths.dashboard, label: fr.nav.dashboard, icon: faTableCellsLarge },
  { to: paths.newVideo, label: fr.nav.newVideo, icon: faWandMagicSparkles },
  { to: paths.projects, label: fr.nav.projects, icon: farFolderOpen },
  { to: paths.settings, label: fr.nav.settings, icon: faGear },
]

const adminItems = [
  { to: paths.adminAgents, label: fr.nav.adminAgents, icon: faRobot },
  { to: paths.adminRuns, label: fr.nav.adminRuns, icon: faClockRotateLeft },
]

const sidebarLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex min-h-touch items-center gap-3 rounded-field px-3 font-medium transition-colors ${
    isActive ? 'bg-primary text-white' : 'text-ink-soft hover:bg-nav-hover'
  }`

export function AppShell() {
  const { data: user } = useMe()
  const [slot, setSlot] = useState<HTMLElement | null>(null)

  return (
    <ShellSlotContext.Provider value={slot}>
      <div className="min-h-dvh lg:flex">
        {/* Barre latérale, dès lg */}
        <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-sidebar lg:shrink-0 lg:flex-col lg:gap-6 lg:overflow-y-auto lg:bg-sidebar lg:px-3.5 lg:py-5">
          <Link to={paths.dashboard} className="flex min-h-touch items-center rounded-field px-2.5">
            <Logo />
          </Link>
          <nav aria-label={fr.nav.label}>
            <ul className="flex flex-col gap-1">
              {navItems.map((item) => (
                <li key={item.to}>
                  <NavLink to={item.to} end className={sidebarLinkClass}>
                    <FontAwesomeIcon icon={item.icon} fixedWidth aria-hidden />
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          {user?.role === 'admin' && (
            <nav aria-label={fr.nav.adminSection}>
              <p className="mb-1 px-3 text-xs font-medium tracking-wider text-muted uppercase">{fr.nav.adminSection}</p>
              <ul className="flex flex-col gap-1">
                {adminItems.map((item) => (
                  <li key={item.to}>
                    <NavLink to={item.to} className={sidebarLinkClass}>
                      <FontAwesomeIcon icon={item.icon} fixedWidth aria-hidden />
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
          )}
          <div className="mt-auto flex flex-col gap-3">
            {/* Panneau fourni par la page (par exemple « Agents IA » dans l'assistant) */}
            <div ref={setSlot} />
            <div className="flex flex-col gap-1 border-t border-line pt-3">
              {user && (
                <div className="flex min-w-0 items-center gap-2.5 px-3 py-1">
                  <span
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-avatar-bg font-bold text-avatar-ink"
                    aria-hidden="true"
                  >
                    {initials(user.full_name)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-ink">{user.full_name}</span>
                    <span className="block truncate text-xs text-muted">{user.email}</span>
                  </span>
                </div>
              )}
              <LogoutButton />
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex min-h-14 items-center gap-3 px-4 pt-2 sm:px-6 lg:px-8 lg:pt-5">
            <Link to={paths.dashboard} className="flex min-h-touch items-center lg:hidden">
              <Logo />
            </Link>
            <HeaderSearch />
            <Link
              to={paths.newVideo}
              className="bg-brand ml-auto hidden min-h-touch shrink-0 items-center gap-2 rounded-field px-4 font-medium text-white hover:opacity-90 sm:inline-flex"
            >
              <FontAwesomeIcon icon={faWandMagicSparkles} aria-hidden />
              {fr.nav.newVideo}
            </Link>
            <div className="ml-auto sm:ml-0 lg:hidden">
              <LogoutButton compact />
            </div>
          </header>

          {/* pb-24 : place pour la barre d'onglets fixe sur mobile */}
          <main className="min-w-0 flex-1 px-4 pb-24 pt-4 sm:px-6 lg:px-8 lg:pb-12">
            <Outlet />
          </main>
        </div>

        {/* Barre d'onglets, sur mobile */}
        <nav
          aria-label={fr.nav.label}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
        >
          <ul className="grid grid-cols-4">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end
                  className={({ isActive }) =>
                    `flex min-h-14 flex-col items-center justify-center gap-1 px-1 text-xs font-medium ${
                      isActive ? 'text-primary' : 'text-muted'
                    }`
                  }
                >
                  <FontAwesomeIcon icon={item.icon} className="text-lg" aria-hidden />
                  <span className="max-w-full truncate">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </ShellSlotContext.Provider>
  )
}
