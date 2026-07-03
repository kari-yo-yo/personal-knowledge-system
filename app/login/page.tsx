'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthContext'
import Link from 'next/link'

const securityQuestions = [
  '我最喜欢的动物是什么？',
  '我小时候的梦想是什么？',
  '我出生的城市是哪里？',
  '我最爱的颜色是什么？',
  '我最好的朋友叫什么名字？',
]

type ViewMode = 'login' | 'register' | 'forgot'

export default function LoginPage() {
  const [mode, setMode] = useState<ViewMode>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [securityQuestion, setSecurityQuestion] = useState(securityQuestions[0])
  const [securityAnswer, setSecurityAnswer] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fetchedQuestion, setFetchedQuestion] = useState('')
  const [step, setStep] = useState(1)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { refresh } = useAuth()

  const resetAll = () => {
    setError('')
    setSuccess('')
    setUsername('')
    setPassword('')
    setEmail('')
    setSecurityAnswer('')
    setNewPassword('')
    setConfirmPassword('')
    setFetchedQuestion('')
    setStep(1)
  }

  const switchMode = (m: ViewMode) => {
    setMode(m)
    resetAll()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (mode === 'register') {
        if (password !== confirmPassword) {
          setError('两次密码不一致')
          setLoading(false)
          return
        }

        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password, email, securityQuestion, securityAnswer }),
        })
        const data = await res.json()

        if (!res.ok) {
          setError(data.error || '注册失败')
          setLoading(false)
          return
        }

        await refresh()
        router.replace('/')
      } else if (mode === 'login') {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        })
        const data = await res.json()

        if (!res.ok) {
          setError(data.error || '登录失败')
          setLoading(false)
          return
        }

        await refresh()
        router.replace('/')
      } else if (mode === 'forgot') {
        if (step === 1) {
          const res = await fetch(`/api/auth/forgot?username=${encodeURIComponent(username)}`)
          const data = await res.json()
          if (!res.ok) {
            setError(data.error || '用户不存在')
            setLoading(false)
            return
          }
          setFetchedQuestion(data.securityQuestion)
          setStep(2)
          setLoading(false)
          return
        } else {
          if (newPassword !== confirmPassword) {
            setError('两次密码不一致')
            setLoading(false)
            return
          }

          const res = await fetch('/api/auth/forgot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, securityAnswer, newPassword }),
          })
          const data = await res.json()

          if (!res.ok) {
            setError(data.error || '重置失败')
            setLoading(false)
            return
          }

          setSuccess(data.message)
          setTimeout(() => switchMode('login'), 2000)
        }
      }
    } catch {
      setError('网络错误，请重试')
    }

    setLoading(false)
  }

  const getPup = () => {
    if (mode === 'register') return '/pups/pup-wave.svg'
    if (mode === 'forgot') return '/pups/pup-think.svg'
    return '/pups/pup-sit.svg'
  }

  const getTitle = () => {
    if (mode === 'register') return '创建账号'
    if (mode === 'forgot') return '找回密码'
    return '欢迎回来'
  }

  const getSubtitle = () => {
    if (mode === 'register') return '注册一个新账号，开始你的知识之旅~'
    if (mode === 'forgot') return '回答安全问题，重置你的密码~'
    return '登录你的账号，小狗等你回来~'
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#FFF8F0' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <img
            src={getPup()}
            alt="小狗"
            className="puppy-float max-w-[100px] md:max-w-[120px] h-auto mx-auto"
          />
          <h1 className="text-2xl font-bold mt-3" style={{ color: '#5D4E37' }}>
            {getTitle()}
          </h1>
          <p className="text-base mt-1" style={{ color: '#8B7D6B' }}>
            {getSubtitle()}
          </p>
        </div>

        <div className="bg-white rounded-2xl border p-6" style={{ borderColor: '#F0E6D8' }}>
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Username - always needed */}
            <div>
              <label className="block text-base font-semibold mb-1.5" style={{ color: '#5D4E37' }}>
                用户名
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
                required
                minLength={2}
                maxLength={20}
                className="w-full px-4 py-3 border-2 rounded-xl text-lg focus:outline-none focus:ring-2"
                style={{ borderColor: '#D4C5B0', background: '#FFFFFF', color: '#3E2F1C', caretColor: '#FF6B8A' }}
              />
            </div>

            {/* Password - login and register */}
            {mode !== 'forgot' && (
              <div>
                <label className="block text-base font-semibold mb-1.5" style={{ color: '#5D4E37' }}>
                  密码
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'register' ? '至少6位密码' : '请输入密码'}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 border-2 rounded-xl text-lg focus:outline-none focus:ring-2"
                  style={{ borderColor: '#D4C5B0', background: '#FFFFFF', color: '#3E2F1C', caretColor: '#FF6B8A' }}
                />
              </div>
            )}

            {/* Register extra fields */}
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-base font-semibold mb-1.5" style={{ color: '#5D4E37' }}>
                    确认密码
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="再输入一次密码"
                    required
                    minLength={6}
                    className="w-full px-4 py-3 border-2 rounded-xl text-lg focus:outline-none focus:ring-2"
                    style={{ borderColor: '#D4C5B0', background: '#FFFFFF', color: '#3E2F1C', caretColor: '#FF6B8A' }}
                  />
                </div>

                <div>
                  <label className="block text-base font-semibold mb-1.5" style={{ color: '#5D4E37' }}>
                    邮箱（可选）
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="用于找回密码"
                    className="w-full px-4 py-3 border-2 rounded-xl text-lg focus:outline-none focus:ring-2"
                    style={{ borderColor: '#D4C5B0', background: '#FFFFFF', color: '#3E2F1C', caretColor: '#FF6B8A' }}
                  />
                </div>

                <div>
                  <label className="block text-base font-semibold mb-1.5" style={{ color: '#5D4E37' }}>
                    安全问题
                  </label>
                  <select
                    value={securityQuestion}
                    onChange={(e) => setSecurityQuestion(e.target.value)}
                    className="w-full px-4 py-3 border-2 rounded-xl text-lg focus:outline-none focus:ring-2"
                    style={{ borderColor: '#D4C5B0', background: '#FFFFFF', color: '#3E2F1C' }}
                  >
                    {securityQuestions.map((q) => (
                      <option key={q} value={q}>{q}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-base font-semibold mb-1.5" style={{ color: '#5D4E37' }}>
                    安全问题答案
                  </label>
                  <input
                    type="text"
                    value={securityAnswer}
                    onChange={(e) => setSecurityAnswer(e.target.value)}
                    placeholder="请记住这个答案"
                    required
                    className="w-full px-4 py-3 border-2 rounded-xl text-lg focus:outline-none focus:ring-2"
                    style={{ borderColor: '#D4C5B0', background: '#FFFFFF', color: '#3E2F1C', caretColor: '#FF6B8A' }}
                  />
                </div>
              </>
            )}

            {/* Forgot password step 2 */}
            {mode === 'forgot' && step === 2 && (
              <>
                <div className="p-3 rounded-lg bg-[#FFF8F0] border border-[#F0E6D8]">
                  <span className="text-sm text-[#8B7D6B]">安全问题</span>
                  <p className="text-base font-medium text-[#5D4E37]">{fetchedQuestion}</p>
                </div>

                <div>
                  <label className="block text-base font-semibold mb-1.5" style={{ color: '#5D4E37' }}>
                    答案
                  </label>
                  <input
                    type="text"
                    value={securityAnswer}
                    onChange={(e) => setSecurityAnswer(e.target.value)}
                    placeholder="请输入安全问题的答案"
                    required
                    className="w-full px-4 py-3 border-2 rounded-xl text-lg focus:outline-none focus:ring-2"
                    style={{ borderColor: '#D4C5B0', background: '#FFFFFF', color: '#3E2F1C', caretColor: '#FF6B8A' }}
                  />
                </div>

                <div>
                  <label className="block text-base font-semibold mb-1.5" style={{ color: '#5D4E37' }}>
                    新密码
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="至少6位"
                    required
                    minLength={6}
                    className="w-full px-4 py-3 border-2 rounded-xl text-lg focus:outline-none focus:ring-2"
                    style={{ borderColor: '#D4C5B0', background: '#FFFFFF', color: '#3E2F1C', caretColor: '#FF6B8A' }}
                  />
                </div>

                <div>
                  <label className="block text-base font-semibold mb-1.5" style={{ color: '#5D4E37' }}>
                    确认新密码
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="再输入一次新密码"
                    required
                    minLength={6}
                    className="w-full px-4 py-3 border-2 rounded-xl text-lg focus:outline-none focus:ring-2"
                    style={{ borderColor: '#D4C5B0', background: '#FFFFFF', color: '#3E2F1C', caretColor: '#FF6B8A' }}
                  />
                </div>
              </>
            )}

            {error && (
              <div className="p-3 rounded-lg text-base font-medium" style={{ background: '#FFF0F0', color: '#D32F2F', border: '1px solid #FFCDD2' }}>
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 rounded-lg text-base font-medium" style={{ background: '#F0FFF4', color: '#276749', border: '1px solid #C6F6D5' }}>
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !username.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 text-white rounded-xl text-lg font-semibold disabled:opacity-50 transition-colors"
              style={{ background: '#FF6B8A' }}
            >
              {loading ? <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
              {mode === 'forgot' && step === 1 ? '下一步' : mode === 'forgot' && step === 2 ? '重置密码' : mode === 'register' ? '注册' : '登录'}
            </button>
          </form>

          <div className="mt-4 text-center space-y-2">
            {mode === 'login' && (
              <>
                <button onClick={() => switchMode('forgot')} className="text-sm hover:underline font-medium" style={{ color: '#FF6B8A' }}>
                  忘记密码？
                </button>
                <br />
                <button onClick={() => switchMode('register')} className="text-base hover:underline font-medium" style={{ color: '#8B7D6B' }}>
                  没有账号？去注册
                </button>
              </>
            )}
            {mode === 'register' && (
              <button onClick={() => switchMode('login')} className="text-base hover:underline font-medium" style={{ color: '#8B7D6B' }}>
                已有账号？去登录
              </button>
            )}
            {mode === 'forgot' && (
              <button onClick={() => switchMode('login')} className="text-base hover:underline font-medium" style={{ color: '#8B7D6B' }}>
                想起密码了？去登录
              </button>
            )}
          </div>
        </div>

        <div className="text-center mt-6">
          <Link href="/" className="text-sm hover:underline" style={{ color: '#8B7D6B' }}>
            返回首页
          </Link>
        </div>
      </div>
    </div>
  )
}
