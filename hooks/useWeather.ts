'use client'

import { useThemeContext } from '@/components/theme/ThemeProvider'

export function useWeather() {
  const ctx = useThemeContext()
  return {
    weatherData: ctx.weatherData,
    weatherLoading: ctx.weatherLoading,
    city: ctx.city,
    unit: ctx.unit,
    weatherEnabled: ctx.weatherEnabled,
    setCity: ctx.setCity,
    setUnit: ctx.setUnit,
    toggleWeather: ctx.toggleWeather,
    refreshWeather: ctx.refreshWeather,
  }
}
