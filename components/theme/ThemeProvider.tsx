'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { ThemeState, WeatherType, DEFAULT_THEME, loadThemeSettings, saveThemeSettings, mapWeatherCodeToType } from '@/lib/theme'
import { WeatherData, getCachedWeather, setCachedWeather } from '@/lib/weather'

interface ThemeContextValue extends ThemeState {
  weatherData: WeatherData | null
  weatherLoading: boolean
  setCity: (city: string) => void
  setUnit: (unit: 'C' | 'F') => void
  toggleWeather: () => void
  toggleWeatherLink: () => void
  refreshWeather: () => Promise<void>
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ThemeState>(DEFAULT_THEME)
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = loadThemeSettings()
    setState(saved)
    setMounted(true)
  }, [])

  // 从 localStorage 加载缓存的天气数据
  useEffect(() => {
    if (!mounted) return
    const cache = getCachedWeather()
    if (cache && state.weatherEnabled) {
      setWeatherData(cache.data)
    }
  }, [mounted])

  // 天气数据获取
  const fetchWeather = useCallback(async (city?: string) => {
    if (!state.weatherEnabled) return
    setWeatherLoading(true)
    try {
      const targetCity = city || state.city
      const url = targetCity
        ? `/api/weather?city=${encodeURIComponent(targetCity)}`
        : '/api/weather'

      const res = await fetch(url, { cache: 'no-store' })
      if (!res.ok) throw new Error('Weather fetch failed')

      const data: WeatherData = await res.json()
      setWeatherData(data)
      setCachedWeather({ data, timestamp: Date.now(), city: data.city })

      // 更新城市（如果是自动定位）
      if (!state.city && data.city) {
        setState((prev) => {
          const next = { ...prev, city: data.city }
          saveThemeSettings(next)
          return next
        })
      }

      // 联动主题
      if (state.weatherLinked) {
        const weatherType = mapWeatherCodeToType(data.code, data.isDay)
        setState((prev) => {
          const next = { ...prev, weather: weatherType }
          saveThemeSettings(next)
          return next
        })
      }
    } catch (err) {
      console.error('Weather fetch error:', err)
    } finally {
      setWeatherLoading(false)
    }
  }, [state.weatherEnabled, state.city, state.weatherLinked])

  // 初始获取 + 轮询
  useEffect(() => {
    if (!mounted || !state.weatherEnabled) return

    fetchWeather()

    const interval = setInterval(() => {
      fetchWeather()
    }, 5 * 60 * 1000) // 5 分钟轮询

    return () => clearInterval(interval)
  }, [mounted, state.weatherEnabled, state.city, fetchWeather])

  // 设置 data-weather 属性
  useEffect(() => {
    if (!mounted) return
    const html = document.documentElement
    if (state.weatherLinked && state.weather !== 'default') {
      html.setAttribute('data-weather', state.weather)
    } else {
      html.removeAttribute('data-weather')
    }
  }, [mounted, state.weather, state.weatherLinked])

  const setCity = useCallback((city: string) => {
    setState((prev) => {
      const next = { ...prev, city }
      saveThemeSettings(next)
      return next
    })
    fetchWeather(city)
  }, [fetchWeather])

  const setUnit = useCallback((unit: 'C' | 'F') => {
    setState((prev) => {
      const next = { ...prev, unit }
      saveThemeSettings(next)
      return next
    })
  }, [])

  const toggleWeather = useCallback(() => {
    setState((prev) => {
      const next = { ...prev, weatherEnabled: !prev.weatherEnabled }
      saveThemeSettings(next)
      return next
    })
  }, [])

  const toggleWeatherLink = useCallback(() => {
    setState((prev) => {
      const next = { ...prev, weatherLinked: !prev.weatherLinked }
      saveThemeSettings(next)
      return next
    })
  }, [])

  const refreshWeather = useCallback(async () => {
    await fetchWeather()
  }, [fetchWeather])

  const value: ThemeContextValue = {
    ...state,
    weatherData,
    weatherLoading,
    setCity,
    setUnit,
    toggleWeather,
    toggleWeatherLink,
    refreshWeather,
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useThemeContext() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useThemeContext must be used within ThemeProvider')
  return ctx
}
