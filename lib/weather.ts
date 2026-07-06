export interface WeatherData {
  city: string
  temp: number
  tempF: number
  condition: string
  code: string
  humidity: number
  windSpeed: number
  isDay: boolean
  icon: string
}

export interface WeatherApiResponse {
  city: string
  temp: number
  tempF: number
  condition: string
  code: string
  humidity: number
  windSpeed: number
  isDay: boolean
  icon: string
}

export const WEATHER_CACHE_KEY = 'cosmic-weather-cache'
export const WEATHER_CACHE_TTL = 10 * 60 * 1000 // 10 minutes

export interface WeatherCache {
  data: WeatherData
  timestamp: number
  city: string
}

export function getCachedWeather(): WeatherCache | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(WEATHER_CACHE_KEY)
    if (!raw) return null
    const cache: WeatherCache = JSON.parse(raw)
    if (Date.now() - cache.timestamp > WEATHER_CACHE_TTL) return null
    return cache
  } catch {
    return null
  }
}

export function setCachedWeather(cache: WeatherCache): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(cache))
  } catch {
    // ignore
  }
}

// wttr.in weatherCode 到 emoji 的映射
export function getWttrIcon(code: string | number, isDay: boolean = true): string {
  const c = String(code)
  if (!isDay) return '🌙'
  if (c === '113') return '☀️'
  if (['116', '119'].includes(c)) return '🌤'
  if (['122', '143'].includes(c)) return '☁️'
  if (['176', '185', '263', '266', '281', '284', '293', '296', '299', '302', '305', '308', '311', '314', '317', '320', '353', '356', '359'].includes(c)) return '🌧'
  if (['362', '365', '374', '377'].includes(c)) return '🌦'
  if (['179', '182', '227', '230', '323', '326', '329', '332', '335', '338', '350', '368', '371'].includes(c)) return '❄️'
  if (['200', '386', '389', '392', '395'].includes(c)) return '⛈'
  if (['248', '260'].includes(c)) return '🌫'
  return '🌤'
}
