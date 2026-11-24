
import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  Leaf,
  Ship,
  Images,
  RefreshCw,
} from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import MetricCard from '../../components/MetricCard'
import BlackSeaMap from '../../components/maps/BlackSeaMap'
import { api } from '../../services/api'

import type {
  FeatureCollection,
  HabitatProperties,
  EnvironmentProperties,
  VesselProperties,
  ImageRecord,
} from '../../types'

const emptyHabitats: FeatureCollection<HabitatProperties> = {
  type: 'FeatureCollection',
  features: [],
}

const emptyEnvironment: FeatureCollection<EnvironmentProperties> = {
  type: 'FeatureCollection',
  features: [],
}

const emptyVessels: FeatureCollection<VesselProperties> = {
  type: 'FeatureCollection',
  features: [],
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString()
}

export default function HistoricalDashboard() {
  const [habitats, setHabitats] = useState(emptyHabitats)
  const [environment, setEnvironment] = useState(emptyEnvironment)
  const [vessels, setVessels] = useState(emptyVessels)
  const [images, setImages] = useState<ImageRecord[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  async function loadData() {
    try {
      setError(null)

      const [habitatData, environmentData, vesselData, imageData] =
        await Promise.all([
          api.habitats(),
          api.environment(),
          api.vessels(),
          api.images(),
        ])

      setHabitats(habitatData)
      setEnvironment(environmentData)
      setVessels(vesselData)
      setImages(imageData)
      setLastUpdated(new Date())
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to load dashboard data'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const chartData = useMemo(() => {
    const observations = environment.features

    const sstObservations = observations.filter((item) => {
      const variable = item.properties.variable.toLowerCase()
      return variable.includes('sst') ||
        variable.includes('sea_surface_temperature')
    })

    const selectedObservations =
      sstObservations.length > 0 ? sstObservations : observations

    const grouped = new Map<string, { total: number; count: number }>()

    selectedObservations.forEach((item) => {
      const date = item.properties.observed_at?.slice(0, 10)
      const value = Number(item.properties.value)

      if (!date || !Number.isFinite(value)) return

      const current = grouped.get(date) || { total: 0, count: 0 }
      current.total += value
      current.count += 1
      grouped.set(date, current)
    })

    return {
      variable: selectedObservations[0]?.properties.variable || null,
      unit: selectedObservations[0]?.properties.unit || '',
      points: Array.from(grouped.entries())
        .map(([date, values]) => ({
          date,
          average: Number((values.total / values.count).toFixed(2)),
        }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    }
  }, [environment])

  const simulatedVessels = vessels.features.filter(
    (item) => item.properties.is_simulated
  ).length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-white">
              Historical analytics
            </h2>
            <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300">
              HISTORICAL MODE
            </span>
          </div>

          <p className="mt-2 text-sm text-slate-400">
            Explore stored marine observations across the Black Sea.
          </p>
        </div>

        <button
          onClick={() => void loadData()}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh data
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          Could not load all dashboard data: {error}
          <p className="mt-1 text-xs text-red-300/70">
            Check that the FastAPI service is running and its endpoints are accessible.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Habitat records"
          value={habitats.features.length}
          description="Stored seagrass observations"
          icon={Leaf}
          color="text-emerald-400"
        />

        <MetricCard
          title="Environmental samples"
          value={environment.features.length}
          description="Stored environmental measurements"
          icon={Activity}
          color="text-cyan-400"
        />

        <MetricCard
          title="Vessel positions"
          value={vessels.features.length}
          description={`${simulatedVessels} simulated positions`}
          icon={Ship}
          color="text-amber-400"
        />

        <MetricCard
          title="Images"
          value={images.length}
          description="Registered image records"
          icon={Images}
          color="text-violet-400"
        />
      </div>

      {loading && (
        <div className="rounded-xl border border-slate-800 bg-[#102536] p-4 text-sm text-slate-400">
          Loading records from the database...
        </div>
      )}

      <BlackSeaMap
        habitats={habitats}
        environment={environment}
        vessels={vessels}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <section className="rounded-xl border border-slate-800 bg-[#102536] p-5 xl:col-span-2">
          <div className="mb-5">
            <h3 className="font-semibold text-white">
              Environmental observations over time
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Daily averages of {chartData.variable || 'available measurements'}
              {chartData.unit ? ` (${chartData.unit})` : ''}
            </p>
          </div>

          {chartData.points.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.points}>
                  <CartesianGrid stroke="#263c4c" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    stroke="#718096"
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    stroke="#718096"
                    tick={{ fontSize: 11 }}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip
                    labelFormatter={(label) => formatDate(String(label))}
                    contentStyle={{
                      background: '#102536',
                      border: '1px solid #294255',
                      borderRadius: '8px',
                      color: '#e7f0f5',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="average"
                    name="Daily average"
                    stroke="#20c5d8"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-72 items-center justify-center text-sm text-slate-500">
              No environmental measurements available for the chart.
            </div>
          )}
        </section>

        <section className="rounded-xl border border-slate-800 bg-[#102536] p-5">
          <h3 className="font-semibold text-white">Data overview</h3>

          <div className="mt-5 space-y-5">
            <div>
              <p className="text-xs text-slate-500">Habitat species</p>
              <p className="mt-1 text-lg font-semibold text-white">
                {new Set(
                  habitats.features
                    .map((item) => item.properties.scientific_name)
                    .filter(Boolean)
                ).size}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Environmental variables</p>
              <p className="mt-1 text-lg font-semibold text-white">
                {new Set(
                  environment.features.map((item) => item.properties.variable)
                ).size}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Last dashboard refresh</p>
              <p className="mt-1 text-sm text-white">
                {lastUpdated?.toLocaleTimeString() || 'Not yet refreshed'}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
