
import { BrowserRouter, NavLink, Routes, Route, Navigate } from 'react-router-dom'
import {
  Activity,
  Anchor,
  ChartNoAxesCombined,
  Radar,
  Waves,
  Settings,
  Database,
} from 'lucide-react'
import HistoricalDashboard from './pages/historical/HistoricalDashboard'
import LiveDashboard from './pages/live/LiveDashboard'

function Sidebar() {
  const linkStyle = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition ${
      isActive
        ? 'bg-cyan-500/15 text-cyan-300'
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`

  return (
    <aside className="w-64 shrink-0 border-r border-slate-800 bg-[#091a28] p-5">
      <div className="mb-10 flex items-center gap-3">
        <div className="rounded-xl bg-cyan-500/15 p-2 text-cyan-400">
          <Waves size={25} />
        </div>
        <div>
          <h1 className="font-bold tracking-wide">BLACKSEA</h1>
          <p className="text-xs tracking-[0.2em] text-cyan-400">SENTINEL</p>
        </div>
      </div>

      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-600">
        Monitoring
      </p>

      <nav className="space-y-2">
        <NavLink to="/historical" className={linkStyle}>
          <ChartNoAxesCombined size={18} />
          Historical dashboard
        </NavLink>

        <NavLink to="/live" className={linkStyle}>
          <Radar size={18} />
          Live monitoring
        </NavLink>
      </nav>

      <div className="my-7 border-t border-slate-800" />

      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-600">
        System
      </p>

      <div className="space-y-4 px-3 text-sm text-slate-500">
        <div className="flex items-center gap-3">
          <Database size={17} /> Data sources
        </div>
        <div className="flex items-center gap-3">
          <Anchor size={17} /> Vessels
        </div>
        <div className="flex items-center gap-3">
          <Settings size={17} /> Settings
        </div>
      </div>

      <div className="mt-12 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
        <div className="flex items-center gap-2 text-xs text-emerald-400">
          <Activity size={15} />
          Platform online
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Black Sea environmental monitoring
        </p>
      </div>
    </aside>
  )
}

function Header() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-800 px-7">
      <div>
        <p className="text-sm text-slate-400">
          MARINE ENVIRONMENTAL MONITORING
        </p>
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
        SYSTEM STATUS: ONLINE
      </div>
    </header>
  )
}

/*function HistoricalDashboard() {
  return (
    <div>
      <h2 className="text-2xl font-bold">Historical analytics</h2>
      <p className="mt-2 text-slate-400">
        Explore imported observations and environmental changes over time.
      </p>
    </div>
  )
}*/

/*function LiveDashboard() {
  return (
    <div>
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-bold">Live monitoring</h2>
        <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">
          LIVE MODE
        </span>
      </div>
      <p className="mt-2 text-slate-400">
        Monitor vessel activity and the latest available environmental data.
      </p>
    </div>
  )
}*/

function AppLayout() {
  return (
    <div className="flex min-h-screen bg-[#071521] text-slate-100">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <Header />
        <div className="p-7">
          <Routes>
            <Route path="/historical" element={<HistoricalDashboard />} />
            <Route path="/live" element={<LiveDashboard />} />
            <Route path="*" element={<Navigate to="/historical" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  )
}
