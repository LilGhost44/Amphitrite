
export interface GeoJSONFeature<P> {
  type: 'Feature'
  geometry: {
    type: 'Point'
    coordinates: [number, number]
  }
  properties: P
}

export interface FeatureCollection<P> {
  type: 'FeatureCollection'
  features: GeoJSONFeature<P>[]
}

export interface HabitatProperties {
  id: number
  scientific_name: string | null
  species: string | null
  observed_at: string | null
  source: string | null
}

export interface EnvironmentProperties {
  id: number
  observed_at: string
  variable: string
  value: number
  unit: string | null
  source: string | null
  source_dataset: string | null
  quality_flag: string | null
  is_simulated: boolean
}

export interface VesselProperties {
  id: number
  vessel_id: string
  observed_at: string
  speed_knots: number | null
  heading: number | null
  is_simulated: boolean
}

export interface ImageRecord {
  id: number
  filename: string
  stored_path: string
  source: string | null
  is_simulated: boolean
  created_at: string
}
