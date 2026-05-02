export type StopType = 'home' | 'travel' | 'study' | 'current'

export interface JourneyStop {
  city: string
  country: string
  lat: number
  lng: number
  type: StopType
  order: number
}

export const JOURNEY: JourneyStop[] = [
  // Origin: Spain
  { city: 'Madrid', country: 'Spain', lat: 40.4168, lng: -3.7038, type: 'home', order: 1 },

  // Interrail through Europe
  { city: 'Lisbon', country: 'Portugal', lat: 38.7223, lng: -9.1393, type: 'travel', order: 2 },
  { city: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522, type: 'travel', order: 3 },
  { city: 'Brussels', country: 'Belgium', lat: 50.8503, lng: 4.3517, type: 'travel', order: 4 },
  { city: 'Amsterdam', country: 'Netherlands', lat: 52.3676, lng: 4.9041, type: 'travel', order: 5 },
  { city: 'Berlin', country: 'Germany', lat: 52.5200, lng: 13.4050, type: 'travel', order: 6 },
  { city: 'Prague', country: 'Czech Republic', lat: 50.0755, lng: 14.4378, type: 'travel', order: 7 },
  { city: 'Vienna', country: 'Austria', lat: 48.2082, lng: 16.3738, type: 'travel', order: 8 },
  { city: 'Budapest', country: 'Hungary', lat: 47.4979, lng: 19.0402, type: 'travel', order: 9 },
  { city: 'Split', country: 'Croatia', lat: 43.5081, lng: 16.4402, type: 'travel', order: 10 },
  { city: 'Rome', country: 'Italy', lat: 41.9028, lng: 12.4964, type: 'travel', order: 11 },
  { city: 'Vatican City', country: 'Vatican', lat: 41.9029, lng: 12.4534, type: 'travel', order: 12 },
  { city: 'Dublin', country: 'Ireland', lat: 53.3498, lng: -6.2603, type: 'travel', order: 13 },

  // Back to Spain
  { city: 'Madrid', country: 'Spain', lat: 40.4168, lng: -3.7038, type: 'home', order: 14 },

  // USA — Utah study + road trips
  { city: 'Logan, UT', country: 'USA', lat: 41.7370, lng: -111.8338, type: 'study', order: 15 },
  { city: 'Salt Lake City', country: 'USA', lat: 40.7608, lng: -111.8910, type: 'travel', order: 16 },
  { city: 'Yellowstone', country: 'USA', lat: 44.4280, lng: -110.5885, type: 'travel', order: 17 },
  { city: 'Grand Tetons', country: 'USA', lat: 43.7904, lng: -110.6818, type: 'travel', order: 18 },
  { city: 'Idaho', country: 'USA', lat: 43.6150, lng: -116.2023, type: 'travel', order: 19 },
  { city: 'Montana', country: 'USA', lat: 46.5891, lng: -112.0391, type: 'travel', order: 20 },
  { city: 'Denver', country: 'USA', lat: 39.7392, lng: -104.9903, type: 'travel', order: 21 },
  { city: 'Las Vegas', country: 'USA', lat: 36.1699, lng: -115.1398, type: 'travel', order: 22 },
  { city: 'Red Rock', country: 'USA', lat: 36.1357, lng: -115.4271, type: 'travel', order: 23 },
  { city: 'Phoenix', country: 'USA', lat: 33.4484, lng: -112.0740, type: 'travel', order: 24 },
  { city: 'San Diego', country: 'USA', lat: 32.7157, lng: -117.1611, type: 'travel', order: 25 },
  { city: 'San Francisco', country: 'USA', lat: 37.7749, lng: -122.4194, type: 'travel', order: 26 },
  { city: 'San Jose', country: 'USA', lat: 37.3382, lng: -121.8863, type: 'travel', order: 27 },
  { city: 'Stanford', country: 'USA', lat: 37.4275, lng: -122.1697, type: 'travel', order: 28 },
  { city: 'Kansas City', country: 'USA', lat: 39.0997, lng: -94.5786, type: 'travel', order: 29 },
  { city: 'Birmingham, AL', country: 'USA', lat: 33.5186, lng: -86.8104, type: 'travel', order: 30 },
  { city: 'Boston', country: 'USA', lat: 42.3601, lng: -71.0589, type: 'travel', order: 31 },
  { city: 'MIT', country: 'USA', lat: 42.3601, lng: -71.0942, type: 'travel', order: 32 },
  { city: 'Harvard', country: 'USA', lat: 42.3744, lng: -71.1169, type: 'travel', order: 33 },
  { city: 'New Hampshire', country: 'USA', lat: 42.9956, lng: -71.4548, type: 'travel', order: 34 },
  { city: 'Maine', country: 'USA', lat: 43.6591, lng: -70.2568, type: 'travel', order: 35 },
  { city: 'Connecticut', country: 'USA', lat: 41.7658, lng: -72.6734, type: 'travel', order: 36 },
  { city: 'New York', country: 'USA', lat: 40.7128, lng: -74.0060, type: 'travel', order: 37 },

  // Back to Spain
  { city: 'Madrid', country: 'Spain', lat: 40.4168, lng: -3.7038, type: 'home', order: 38 },

  // Recent travels
  { city: 'Florence', country: 'Italy', lat: 43.7696, lng: 11.2558, type: 'travel', order: 39 },
  { city: 'London', country: 'England', lat: 51.5074, lng: -0.1278, type: 'travel', order: 40 },

  // Currently
  { city: 'Madrid', country: 'Spain', lat: 40.4168, lng: -3.7038, type: 'current', order: 41 },
]

// Unique stops deduped by rounded lat/lng (for breadcrumb rendering)
export function getUniqueStops(): JourneyStop[] {
  const seen = new Set<string>()
  return JOURNEY.filter((s) => {
    const key = `${Math.round(s.lat * 10)},${Math.round(s.lng * 10)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
