
import { useState } from 'react'
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
} from 'react-leaflet'
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

export default function BlackSeaMap({
  habitats,
  environment,
  vessels,
}: Props) {
  const [showHabitats, setShowHabitats] = useState(true)
  const [showEnvironment, setShowEnvironment] = useState(true)
  const [showVessels, setShowVessels] = useState(true)

  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#102536]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 p-4">
        <div>
          <h3 className="font-semibold text-white">Black Sea map</h3>
          <p className="text-xs text-slate-500">
            Historical geospatial observations
          </p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs">
          <label className="flex items-center gap-2 text-emerald-400">
            <input
              type="checkbox"
              checked={showHabitats}
              onChange={(e) => setShowHabitats(e.target.checked)}
            />
            Habitats
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
        style={{ height: '540px', width: '100%', background: '#071521' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {showHabitats &&
          habitats.features.map((feature) => {
            const [longitude, latitude] = feature.geometry.coordinates
            if (longitude == null || latitude == null) return null

            return (
              <CircleMarker
                key={`habitat-${feature.properties.id}`}
                center={[latitude, longitude]}
                radius={6}
                pathOptions={{
                  color: '#45c486',
                  fillColor: '#45c486',
                  fillOpacity: 0.85,
                }}
              >
                <Popup>
                  <strong>Habitat observation</strong>
                  <br />
                  {feature.properties.scientific_name || feature.properties.species || 'Unknown species'}
                  <br />
                  Date: {feature.properties.observed_at || 'Unknown'}
                  <br />
                  Source: {feature.properties.source || 'Unknown'}
                </Popup>
              </CircleMarker>
            )
          })}

        {showEnvironment &&
          environment.features.map((feature) => {
            const [longitude, latitude] = feature.geometry.coordinates
            if (longitude == null || latitude == null) return null

            return (
              <CircleMarker
                key={`environment-${feature.properties.id}`}
                center={[latitude, longitude]}
                radius={5}
                pathOptions={{
                  color: '#20c5d8',
                  fillColor: '#20c5d8',
                  fillOpacity: 0.75,
                }}
              >
                <Popup>
                  <strong>Environmental observation</strong>
                  <br />
                  {feature.properties.variable}: {feature.properties.value} {feature.properties.unit || ''}
                  <br />
                  Date: {feature.properties.observed_at}
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
          vessels.features.map((feature) => {
            const [longitude, latitude] = feature.geometry.coordinates
            if (longitude == null || latitude == null) return null

            return (
              <CircleMarker
                key={`vessel-${feature.properties.id}`}
                center={[latitude, longitude]}
                radius={6}
                pathOptions={{
                  color: '#f2b84b',
                  fillColor: '#f2b84b',
                  fillOpacity: 0.85,
                }}
              >
                <Popup>
                  <strong>Vessel {feature.properties.vessel_id}</strong>
                  <br />
                  Speed: {feature.properties.speed_knots ?? 'Unknown'} knots
                  <br />
                  Heading: {feature.properties.heading ?? 'Unknown'}°
                  <br />
                  Date: {feature.properties.observed_at}
                  <br />
                  {feature.properties.is_simulated ? 'SIMULATED AIS' : 'AIS DATA'}
                </Popup>
              </CircleMarker>
            )
          })}
      </MapContainer>
    </div>
  )
}
