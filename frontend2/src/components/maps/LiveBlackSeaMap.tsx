
import { useMemo, useState } from 'react'
import { divIcon } from 'leaflet'
import { MapContainer, TileLayer, CircleMarker, Marker, Popup } from 'react-leaflet'
import type {
  FeatureCollection,
  HabitatProperties,
  EnvironmentProperties,
  VesselProperties,
} from '../../types'

interface Props {
  habitats: FeatureCollection<HabitatProperties>
  environment: FeatureCollection<EnvironmentProperties>
  vessels: FeatureCollection<VesselProperties>
}

function gpsIcon(heading: number | null) {
  const rotation = Number.isFinite(heading) ? heading ?? 0 : 0

  return divIcon({
    className: 'gps-vessel-icon',
    html: `
      <div style="
        width: 27px;
        height: 27px;
        display: flex;
        align-items: center;
        justify-content: center;
        transform: rotate(${rotation}deg);
        filter: drop-shadow(0 0 4px rgba(242,184,75,.65));
      ">
        <svg width="25" height="25" viewBox="0 0 25 25">
          <circle cx="12.5" cy="12.5" r="10.5"
            fill="#f2b84b" fill-opacity=".18"
            stroke="#f2b84b" stroke-width="1.2"/>
          <path d="M12.5 3 L18 19 L12.5 15.5 L7 19 Z"
            fill="#ffd477" stroke="#8b5b12" stroke-width=".8"/>
        </svg>
      </div>
    `,
    iconSize: [27, 27],
    iconAnchor: [13.5, 13.5],
  })
}

function latestVesselPositions(
  features: FeatureCollection<VesselProperties>['features'],
) {
  const latest = new Map<string, (typeof features)[number]>()

  for (const feature of features) {
    const key = feature.properties.vessel_id
    const previous = latest.get(key)

    if (
      !previous ||
      new Date(feature.properties.observed_at).getTime() >
        new Date(previous.properties.observed_at).getTime()
    ) {
      latest.set(key, feature)
    }
  }

  return Array.from(latest.values())
}

export default function LiveBlackSeaMap({
  habitats,
  environment,
  vessels,
}: Props) {
  const [showHabitats, setShowHabitats] = useState(true)
  const [showEnvironment, setShowEnvironment] = useState(true)
  const [showVessels, setShowVessels] = useState(true)

  const currentVessels = useMemo(
    () => latestVesselPositions(vessels.features),
    [vessels.features],
  )

  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#102536]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 p-4">
        <div>
          <h3 className="font-semibold text-white">Black Sea · Live monitoring</h3>
          <p className="text-xs text-slate-500">
            Latest vessel positions and recorded ecosystem observations
          </p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs">
          <label className="flex items-center gap-2 text-emerald-400">
            <input
              type="checkbox"
              checked={showHabitats}
              onChange={(e) => setShowHabitats(e.target.checked)}
            />
            Seagrass
          </label>

          <label className="flex items-center gap-2 text-cyan-400">
            <input
              type="checkbox"
              checked={showEnvironment}
              onChange={(e) => setShowEnvironment(e.target.checked)}
            />
            Environment
          </label>

          <label className="flex items-center gap-2 text-amber-400">
            <input
              type="checkbox"
              checked={showVessels}
              onChange={(e) => setShowVessels(e.target.checked)}
            />
            Vessels
          </label>
        </div>
      </div>

      <MapContainer
        center={[43.2, 34.5]}
        zoom={6}
        scrollWheelZoom
        style={{ height: '580px', width: '100%', background: '#071521' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {showHabitats &&
          habitats.features.map((feature) => {
            const [longitude, latitude] = feature.geometry.coordinates
            if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return null

            return (
              <CircleMarker
                key={`habitat-${feature.properties.id}`}
                center={[latitude, longitude]}
                radius={10}
                pathOptions={{
                  color: '#39d98a',
                  weight: 1,
                  opacity: 0.55,
                  fillColor: '#20c878',
                  fillOpacity: 0.16,
                }}
              >
                <Popup>
                  <strong>Seagrass habitat observation</strong>
                  <br />
                  {feature.properties.scientific_name ||
                    feature.properties.species ||
                    'Unknown species'}
                  <br />
                  Observed: {feature.properties.observed_at || 'Unknown'}
                  <br />
                  Source: {feature.properties.source || 'Unknown'}
                </Popup>
              </CircleMarker>
            )
          })}

        {showEnvironment &&
          environment.features.map((feature) => {
            const [longitude, latitude] = feature.geometry.coordinates
            if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return null

            return (
              <CircleMarker
                key={`environment-${feature.properties.id}`}
                center={[latitude, longitude]}
                radius={2.5}
                pathOptions={{
                  color: '#36d9ed',
                  weight: 0.5,
                  opacity: 0.25,
                  fillColor: '#36d9ed',
                  fillOpacity: 0.22,
                }}
              >
                <Popup>
                  <strong>Environmental observation</strong>
                  <br />
                  {feature.properties.variable}: {feature.properties.value}{' '}
                  {feature.properties.unit || ''}
                  <br />
                  Observed: {feature.properties.observed_at}
                  <br />
                  Source: {feature.properties.source || 'Unknown'}
                  {feature.properties.is_simulated && (
                    <p>Simulated record</p>
                  )}
                </Popup>
              </CircleMarker>
            )
          })}

        {showVessels &&
          currentVessels.map((feature) => {
            const [longitude, latitude] = feature.geometry.coordinates
            if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return null

            return (
              <Marker
                key={`vessel-${feature.properties.vessel_id}`}
                position={[latitude, longitude]}
                icon={gpsIcon(feature.properties.heading)}
              >
                <Popup>
                  <strong>Vessel {feature.properties.vessel_id}</strong>
                  <br />
                  Speed: {feature.properties.speed_knots ?? 'Unknown'} knots
                  <br />
                  Heading: {feature.properties.heading ?? 'Unknown'}°
                  <br />
                  Observed: {feature.properties.observed_at}
                  <br />
                  {feature.properties.is_simulated ? 'SIMULATED AIS' : 'AIS DATA'}
                </Popup>
              </Marker>
            )
          })}
      </MapContainer>

      <div className="flex flex-wrap gap-5 border-t border-slate-800 px-4 py-3 text-xs text-slate-400">
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 opacity-70" />
          Seagrass observations
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-cyan-400 opacity-50" />
          Environmental measurements
        </span>
        <span className="flex items-center gap-2">
          <span className="text-amber-400">▲</span>
          Latest position per vessel
        </span>
      </div>
    </div>
  )
}
