'use client'

import { useWeather } from '@/hooks/useWeather'
import { getWttrIcon } from '@/lib/weather'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

export function WeatherWidget() {
  const { weatherData, weatherLoading, weatherEnabled, unit } = useWeather()

  if (!weatherEnabled) return null

  return (
    <Link href="/settings" className="weather-display">
      {weatherLoading && !weatherData ? (
        <Loader2 size={14} className="animate-spin" />
      ) : weatherData ? (
        <>
          <span className="text-base">
            {getWttrIcon(weatherData.code, weatherData.isDay)}
          </span>
          <span className="font-medium">
            {unit === 'C' ? weatherData.temp : weatherData.tempF}°{unit}
          </span>
          <span className="hidden sm:inline opacity-70">
            {weatherData.condition}
          </span>
          <span className="hidden md:inline opacity-50 text-xs">
            {weatherData.city}
          </span>
        </>
      ) : (
        <span className="opacity-50">--</span>
      )}
    </Link>
  )
}
