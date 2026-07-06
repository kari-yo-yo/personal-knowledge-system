export type WeatherType = 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'night' | 'default'

export interface ThemeState {
  weather: WeatherType
  weatherEnabled: boolean
  weatherLinked: boolean
  city: string
  unit: 'C' | 'F'
}

export const WEATHER_STORAGE_KEY = 'cosmic-theme-settings'

export const DEFAULT_THEME: ThemeState = {
  weather: 'default',
  weatherEnabled: true,
  weatherLinked: true,
  city: '',
  unit: 'C',
}

// wttr.in weatherCode 到天气类型的映射
// 参考: https://github.com/chubin/wttr.in/blob/master/lib/constants.py
export function mapWeatherCodeToType(code: string | number, isDay: boolean = true): WeatherType {
  const c = String(code)

  // 夜间判断
  if (!isDay) return 'night'

  // 晴天
  if (['113', '116'].includes(c)) return 'sunny'

  // 多云
  if (['119', '122', '143'].includes(c)) return 'cloudy'

  // 雨
  if (['176', '185', '263', '266', '281', '284', '293', '296', '299', '302', '305', '308', '311', '314', '317', '320', '353', '356', '359', '362', '365', '374', '377'].includes(c)) return 'rainy'

  // 雪
  if (['179', '182', '227', '230', '323', '326', '329', '332', '335', '338', '350', '368', '371', '392', '395'].includes(c)) return 'snowy'

  // 雷暴
  if (['200', '386', '389'].includes(c)) return 'rainy'

  // 雾/霾
  if (['248', '260'].includes(c)) return 'cloudy'

  return 'default'
}

export function getWeatherEmoji(type: WeatherType): string {
  const map: Record<WeatherType, string> = {
    sunny: '☀️',
    cloudy: '☁️',
    rainy: '🌧',
    snowy: '❄️',
    night: '🌙',
    default: '🌤',
  }
  return map[type] || '🌤'
}

export function getWeatherLabel(type: WeatherType): string {
  const map: Record<WeatherType, string> = {
    sunny: '晴',
    cloudy: '多云',
    rainy: '雨',
    snowy: '雪',
    night: '夜',
    default: '多云',
  }
  return map[type] || '多云'
}

export function loadThemeSettings(): ThemeState {
  if (typeof window === 'undefined') return DEFAULT_THEME
  try {
    const raw = localStorage.getItem(WEATHER_STORAGE_KEY)
    if (!raw) return DEFAULT_THEME
    return { ...DEFAULT_THEME, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_THEME
  }
}

export function saveThemeSettings(state: Partial<ThemeState>): void {
  if (typeof window === 'undefined') return
  try {
    const current = loadThemeSettings()
    const next = { ...current, ...state }
    localStorage.setItem(WEATHER_STORAGE_KEY, JSON.stringify(next))
  } catch {
    // ignore
  }
}
