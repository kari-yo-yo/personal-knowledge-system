'use client'

import { useThemeContext } from '@/components/theme/ThemeProvider'

export function useTheme() {
  const ctx = useThemeContext()
  return {
    weather: ctx.weather,
    weatherEnabled: ctx.weatherEnabled,
    weatherLinked: ctx.weatherLinked,
    toggleWeather: ctx.toggleWeather,
    toggleWeatherLink: ctx.toggleWeatherLink,
  }
}
