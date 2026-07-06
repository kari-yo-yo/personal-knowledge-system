'use client'

import { useWeather } from '@/hooks/useWeather'
import { useTheme } from '@/hooks/useTheme'
import { GlassCard } from '@/components/theme/GlassCard'
import { LoadingSpinner } from '@/components/animations/LoadingSpinner'
import { getWttrIcon } from '@/lib/weather'
import {
  RefreshCw,
  MapPin,
  Thermometer,
  Cloud,
  Palette,
} from 'lucide-react'

export default function SettingsPage() {
  const {
    weatherData,
    weatherLoading,
    city,
    unit,
    weatherEnabled,
    setCity,
    setUnit,
    toggleWeather,
    refreshWeather,
  } = useWeather()

  const { weatherLinked, toggleWeatherLink } = useTheme()

  return (
    <div
      className="min-h-screen p-4 md:p-8"
      style={{ background: 'var(--bg-deep)' }}
    >
      <div className="max-w-2xl mx-auto relative z-10">
        <h1
          className="text-2xl font-bold mb-6"
          style={{ color: 'var(--text-primary)' }}
        >
          设置
        </h1>

        <div className="space-y-4">
          {/* 天气设置 */}
          <GlassCard>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Cloud
                  size={18}
                  style={{ color: 'var(--accent-aurora)' }}
                />
                <h2
                  className="font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  天气系统
                </h2>
              </div>

              <div className="space-y-3">
                {/* 天气显示开关 */}
                <div className="flex items-center justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>
                    显示天气
                  </span>
                  <button
                    onClick={toggleWeather}
                    className={`w-11 h-6 rounded-full transition-colors relative ${
                      weatherEnabled
                        ? 'bg-[var(--accent-nebula)]'
                        : 'bg-white/10'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        weatherEnabled
                          ? 'translate-x-5'
                          : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>

                {/* 天气联动开关 */}
                <div className="flex items-center justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>
                    天气联动主题氛围
                  </span>
                  <button
                    onClick={toggleWeatherLink}
                    className={`w-11 h-6 rounded-full transition-colors relative ${
                      weatherLinked
                        ? 'bg-[var(--accent-nebula)]'
                        : 'bg-white/10'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        weatherLinked
                          ? 'translate-x-5'
                          : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>

                {/* 城市输入 */}
                <div className="flex items-center gap-2">
                  <MapPin
                    size={16}
                    style={{ color: 'var(--text-muted)' }}
                  />
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="输入城市名称（留空自动定位）"
                    className="star-input flex-1 text-sm"
                  />
                </div>

                {/* 温度单位 */}
                <div className="flex items-center gap-2">
                  <Thermometer
                    size={16}
                    style={{ color: 'var(--text-muted)' }}
                  />
                  <div className="flex bg-white/5 rounded-lg p-0.5">
                    <button
                      onClick={() => setUnit('C')}
                      className={`px-3 py-1 rounded-md text-sm transition-colors ${
                        unit === 'C'
                          ? 'bg-[var(--accent-nebula)] text-white'
                          : 'text-[var(--text-muted)]'
                      }`}
                    >
                      °C
                    </button>
                    <button
                      onClick={() => setUnit('F')}
                      className={`px-3 py-1 rounded-md text-sm transition-colors ${
                        unit === 'F'
                          ? 'bg-[var(--accent-nebula)] text-white'
                          : 'text-[var(--text-muted)]'
                      }`}
                    >
                      °F
                    </button>
                  </div>
                </div>

                {/* 手动刷新 */}
                <button
                  onClick={refreshWeather}
                  disabled={weatherLoading}
                  className="glow-btn w-full flex items-center justify-center gap-2 mt-2"
                >
                  {weatherLoading ? (
                    <LoadingSpinner size={20} />
                  ) : (
                    <RefreshCw size={16} />
                  )}
                  刷新天气
                </button>

                {/* 当前天气信息 */}
                {weatherData && (
                  <div className="mt-3 p-3 rounded-lg bg-white/5 text-sm space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {getWttrIcon(
                          weatherData.code,
                          weatherData.isDay
                        )}
                      </span>
                      <span style={{ color: 'var(--text-primary)' }}>
                        {weatherData.city} · {weatherData.condition} ·{' '}
                        {unit === 'C'
                          ? weatherData.temp
                          : weatherData.tempF}
                        °{unit}
                      </span>
                    </div>
                    <div
                      className="flex gap-4 text-xs"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <span>湿度 {weatherData.humidity}%</span>
                      <span>风速 {weatherData.windSpeed} km/h</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </GlassCard>

          {/* 主题信息 */}
          <GlassCard hover={false}>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Palette
                  size={18}
                  style={{ color: 'var(--accent-nebula)' }}
                />
                <h2
                  className="font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  主题
                </h2>
              </div>
              <p
                className="text-sm"
                style={{ color: 'var(--text-muted)' }}
              >
                当前使用宇宙星空主题。天气联动开启时，页面氛围会根据天气自动变化。
              </p>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
