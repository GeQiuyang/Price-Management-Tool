import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../lib/api'

function Login() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    })
    setError('')
  }

  const handleQuickLogin = async (role) => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/auth/quick-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      const data = await response.json()

      if (data.success) {
        localStorage.setItem('token', data.data.token)
        localStorage.setItem('user', JSON.stringify(data.data.user))
        navigate('/')
        return
      }

      setError(data.error?.message || data.error || '登录失败')
    } catch (error) {
      setError('网络错误,请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        localStorage.setItem('token', data.data.token)

        if (data.data.refreshToken) {
          localStorage.setItem('refreshToken', data.data.refreshToken)
        } else {
          localStorage.removeItem('refreshToken')
        }

        localStorage.setItem('user', JSON.stringify(data.data.user))
        navigate('/')
        return
      }

      setError(data.error?.message || '登录失败')
    } catch (error) {
      setError('网络错误,请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const roleButtons = [
    ['管理员', 'admin'],
    ['业务员', 'sales'],
    ['外贸员', 'foreign_trade'],
  ]

  return (
    <div className="flex min-h-screen items-center justify-center overflow-hidden bg-hero-glow px-6 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.88),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(0,113,227,0.12),transparent_22%)]" />
      <div className="relative grid w-full max-w-6xl overflow-hidden rounded-[40px] border border-white/70 bg-white/[0.72] shadow-float backdrop-blur-2xl lg:grid-cols-[1.08fr_0.92fr]">
        <div className="hidden min-h-[760px] flex-col justify-between bg-[linear-gradient(180deg,#f8fafc_0%,#e9eef6_100%)] p-10 lg:flex">
          <div>
            <p className="text-sm uppercase tracking-[0.32em] text-slate">Vector 价格管理平台</p>
            <h1 className="mt-6 max-w-md text-[4.25rem] font-semibold leading-[0.95] tracking-[-0.07em] text-ink">
              Apple 风格的价格管理工作台。
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-slate">
              以极简界面、超大字号和克制动效,重塑价格、海运费、报价与客户管理流程。
            </p>
          </div>
          <div className="grid gap-4">
            <div className="rounded-[30px] bg-[#111111] p-7 text-white">
              <p className="text-xs uppercase tracking-[0.28em] text-white/56">界面预览</p>
              <div className="mt-8 grid grid-cols-3 gap-3">
                {[72, 104, 82].map((height) => (
                  <div key={height} className="rounded-[20px] bg-white/10" style={{ height: `${height}px` }} />
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-[30px] bg-white/[0.78] p-6">
                <p className="text-3xl font-semibold tracking-[-0.05em] text-ink">0.6s</p>
                <p className="mt-3 text-sm text-slate">细腻动效节奏</p>
              </div>
              <div className="rounded-[30px] bg-white/[0.78] p-6">
                <p className="text-3xl font-semibold tracking-[-0.05em] text-ink">3</p>
                <p className="mt-3 text-sm text-slate">快捷登录角色</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-10 lg:p-12">
          <div className="mx-auto max-w-md">
            <div className="mb-10">
              <p className="text-sm uppercase tracking-[0.32em] text-slate">登录入口</p>
              <h2 className="mt-4 text-5xl font-semibold tracking-[-0.06em] text-ink md:text-6xl">欢迎回来</h2>
              <p className="mt-4 text-base leading-7 text-slate">请选择快捷角色,或使用账号密码登录。</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {roleButtons.map(([label, value]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleQuickLogin(value)}
                  disabled={loading}
                  className="rounded-full border border-black/8 bg-white px-4 py-3 text-sm text-ink transition duration-500 hover:-translate-y-0.5 hover:shadow-apple disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="my-8 flex items-center gap-4 text-xs uppercase tracking-[0.32em] text-slate">
              <div className="h-px flex-1 bg-black/8" />
              <span>或使用账号继续</span>
              <div className="h-px flex-1 bg-black/8" />
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <label className="block">
                <span className="mb-2 block text-sm text-slate">用户名 / 邮箱</span>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="请输入用户名或邮箱"
                  required
                  className="w-full rounded-[22px] border border-black/8 bg-white/80 px-5 py-4 text-base outline-none transition focus:border-black/20 focus:shadow-apple"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm text-slate">密码</span>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="请输入密码"
                  required
                  className="w-full rounded-[22px] border border-black/8 bg-white/80 px-5 py-4 text-base outline-none transition focus:border-black/20 focus:shadow-apple"
                />
              </label>

              {error ? (
                <div className="rounded-[22px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
              ) : null}

              <button type="submit" disabled={loading} className="apple-button-primary w-full py-4 text-base disabled:opacity-60">
                {loading ? '登录中...' : '登录'}
              </button>
            </form>

            <div className="mt-8 flex items-center justify-between text-sm text-slate">
              <a href="/register" className="transition hover:text-ink">
                创建账号
              </a>
              <a href="/forgot-password" className="transition hover:text-ink">
                忘记密码
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
