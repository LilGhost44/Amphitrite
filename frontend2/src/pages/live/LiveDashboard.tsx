
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity,
  Anchor,
  Leaf,
  RefreshCw,
  Thermometer,
  Waves,
  AlertTriangle,
  Clock3,
} from 'lucide-react'

import { api } from '../../services/api'
import type {
  FeatureCollection,
  HabitatProperties,
  EnvironmentProperties,
  VesselProperties,
} from '../../types'
import LiveBlackSeaMap from '../../components/maps/LiveBlackSeaMap'

type LiveData = {
  habitats: FeatureCollection<HabitatProperties>
  environment: FeatureCollection<EnvironmentProperties>
  vessels: FeatureCollection<VesselProperties>
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'Unknown'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Unknown' : date.toLocaleString()
}

function Metric({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string
  value: string | number
  subtitle: string
  icon: typeof Activity
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#102536] p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{title}</p>
        <Icon size={20} className="text-cyan-400" />
      </div>
      <p className="mt-4 text-2xl font-bold text-white">{value}</p>
      <p className="mt-2 text-xs text-slate-500">{subtitle}</p>
    </div>
  )
}

export default function LiveDashboard() {
  const [data, setData] = useState<LiveData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const loadData = useCallback(async () => {
    try {
      setError(null)

      const [habitats, environment, vessels] = await Promise.all([
        api.habitats(),
        api.environment(),
        api.vessels(),
      ])

      setData({ habitats, environment, vessels })
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load monitoring data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()

    const interval = window.setInterval(() => {
      void loadData()
    }, 30_000)

    return () => window.clearInterval(interval)
  }, [loadData])

  const currentVesselCount = useMemo(() => {
    if (!data) return 0
    return new Set(
      data.vessels.features.map((feature) => feature.properties.vessel_id),
    ).size
  }, [data])

  const latestSst = useMemo(() => {
    if (!data) return null

    const sstRecords = data.environment.features.filter((feature) => {
      const variable = feature.properties.variable.toLowerCase()
      return (
        variable.includes('sst') ||
        variable.includes('sea_surface_temperature') ||
        variable.includes('sea surface temperature')
      )
    })

    return sstRecords.sort(
      (a, b) =>
        new Date(b.properties.observed_at).getTime() -
        new Date(a.properties.observed_at).getTime(),
    )[0] ?? null
  }, [data])

  const habitatSpeciesCount = useMemo(() => {
    if (!data) return 0

    const species = data.habitats.features
      .map((feature) =>
        feature.properties.scientific_name || feature.properties.species,
      )
      .filter((value): value is string => Boolean(value))

    return new Set(species).size
  }, [data])

  const simulatedVessels = useMemo(() => {
    if (!data) return 0

    const latest = new Map<string, boolean>()

    for (const feature of data.vessels.features) {
      const id = feature.properties.vessel_id
      const previous = latest.get(id)

      if (previous === undefined || !feature.properties.is_simulated) {
        latest.set(id, feature.properties.is_simulated)
      }
    }

    return [...latest.values()].filter(Boolean).length
  }, [data])

  const suggestions = useMemo(() => {
    if (!data) return []

    const actions: string[] = []

    if (!latestSst) {
      actions.push(
        'No sea surface temperature observations were found. Check the environmental data ingestion.',
      )
    } else {
      actions.push(
        `Review the latest sea surface temperature observation from ${formatDate(latestSst.properties.observed_at)}.`,
      )
    }

    if (data.habitats.features.length > 0) {
      actions.push(
        'Continue monitoring the recorded seagrass observation locations and compare future surveys with these records.',
      )
    } else {
      actions.push(
        'No seagrass habitat observations were returned. Check the habitat dataset and ingestion status.',
      )
    }

    if (simulatedVessels > 0) {
      actions.push(
        `${simulatedVessels} vessel positions are marked as simulated. Verify AIS source status before treating them as real vessel traffic.`,
      )
    }

    if (data.vessels.features.length > 0 && data.habitats.features.length > 0) {
      actions.push(
        'Review vessel activity in relation to mapped seagrass observations. Map proximity is a screening aid, not proof of ecological impact.',
      )
    }

    return actions
  }, [data, latestSst, simulatedVessels])

  if (loading && !data) {
    return (
      <div className="p-8 text-slate-300">
        Loading live monitoring data...
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="rounded-xl border border-red-900 bg-red-950/30 p-6 text-red-300">
        <p className="font-semibold">Could not load monitoring data</p>
        <p className="mt-2 text-sm">{error}</p>
        <button
          onClick={() => void loadData()}
          className="mt-4 rounded-lg bg-red-900 px-4 py-2 text-sm text-white"
        >
          Try again
        </button>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white">Live monitoring</h2>
          <p className="mt-1 text-sm text-slate-400">
            Black Sea vessel activity and marine ecosystem observations
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right text-xs text-slate-500">
            <p className="flex items-center justify-end gap-1">
              <Clock3 size={13} />
              Last API refresh
            </p>
            <p className="mt-1 text-slate-300">
              {lastUpdated?.toLocaleTimeString() ?? 'Not yet refreshed'}
            </p>
          </div>

          <button
            onClick={() => void loadData()}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-[#102536] px-4 py-2 text-sm text-white hover:bg-slate-800 disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-amber-800 bg-amber-950/30 p-3 text-sm text-amber-300">
          Refresh failed. Showing the last successfully loaded data: {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          title="Vessels tracked"
          value={currentVesselCount}
          subtitle={`${simulatedVessels} marked as simulated`}
          icon={Anchor}
        />
        <Metric
          title="Habitat observations"
          value={data.habitats.features.length}
          subtitle={`${habitatSpeciesCount} distinct recorded species`}
          icon={Leaf}
        />
        <Metric
          title="Sea surface temperature"
          value={
            latestSst
              ? `${latestSst.properties.value} ${latestSst.properties.unit ?? ''}`
              : 'No data'
          }
          subtitle={
            latestSst
              ? `Observed ${formatDate(latestSst.properties.observed_at)}`
              : 'No SST variable found in the current response'
          }
          icon={Thermometer}
        />
        <Metric
          title="Environmental records"
          value={data.environment.features.length}
          subtitle="Measurements returned by the API"
          icon={Waves}
        />
      </div>

      <LiveBlackSeaMap
        habitats={data.habitats}
        environment={data.environment}
        vessels={data.vessels}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="rounded-xl border border-slate-800 bg-[#102536] p-5">
          <div className="mb-4 flex items-center gap-2">
            <Activity size={19} className="text-cyan-400" />
            <h3 className="font-semibold text-white">Environmental overview</h3>
          </div>

          {data.environment.features.length === 0 ? (
            <p className="text-sm text-slate-400">
              No environmental measurements are currently available.
            </p>
          ) : (
            <div className="space-y-3">
              {Object.entries(
                data.environment.features.reduce<
                  Record<string, (typeof data.environment.features)[number]>
                >((latest, feature) => {
                  const key = feature.properties.variable
                  const previous = latest[key]

                  if (
                    !previous ||
                    new Date(feature.properties.observed_at).getTime() >
                      new Date(previous.properties.observed_at).getTime()
                  ) {
                    latest[key] = feature
                  }

                  return latest
                }, {}),
              ).map(([variable, feature]) => (
                <div
                  key={variable}
                  className="flex items-center justify-between gap-4 border-b border-slate-800 pb-3 last:border-0"
                >
                  <div>
                    <p className="text-sm text-slate-200">{variable}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDate(feature.properties.observed_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-cyan-300">
                      {feature.properties.value} {feature.properties.unit ?? ''}
                    </p>
                    {feature.properties.is_simulated && (
                      <p className="text-xs text-amber-400">Simulated</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-slate-800 bg-[#102536] p-5">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle size={19} className="text-amber-400" />
            <h3 className="font-semibold text-white">Suggested monitoring actions</h3>
          </div>

          <div className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <div key={index} className="flex gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-400/10 text-xs text-amber-300">
                  {index + 1}
                </span>
                <p className="text-sm leading-6 text-slate-300">{suggestion}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <p className="text-xs text-slate-500">
        Data is refreshed from the API every 30 seconds. Observation timestamps
        indicate when measurements were recorded; they do not necessarily
        represent real-time conditions. Habitat markers show recorded
        observations, not surveyed habitat boundaries.
      </p>
    </div>
  )
}
