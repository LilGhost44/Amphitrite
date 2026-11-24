
import type {
  FeatureCollection,
  HabitatProperties,
  EnvironmentProperties,
  VesselProperties,
  ImageRecord,
} from '../types'

const API_BASE = '/api/v1'

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`)

  if (!response.ok) {
    throw new Error(
      `API request failed: ${response.status} ${response.statusText}`
    )
  }

  return response.json() as Promise<T>
}

export const api = {
  habitats: () =>
    request<FeatureCollection<HabitatProperties>>('/habitats?limit=3000'),

  environment: () =>
    request<FeatureCollection<EnvironmentProperties>>('/environment?limit=5000'),

  vessels: () =>
    request<FeatureCollection<VesselProperties>>('/vessels?limit=5000'),

  images: () =>
    request<ImageRecord[]>('/images'),
}
