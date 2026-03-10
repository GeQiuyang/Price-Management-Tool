import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { API_URL } from '../lib/api'

function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    phone: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    })
    setError('')
  }

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致')
      return false
    }
    if (formData.password.length < 6) {
      setError('密码长度至少为6个字符')
      return false
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      setError('密码必须包含大小写字母和数字')
      return false
    }
    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      setError('用户名只能包含字母、数字和下划线')
      return false
    }
    return true
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const { confirmPassword, ...registerData } = formData
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        setTimeout(() => {
          navigate('/login')
        }, 2000)
        return
      }

      setError(data.error?.message || '注册失败')
    } catch (error) {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-hero-glow px-6">
        <div className="rounded-[36px] border border-white/70 bg-white/[0.78] px-10 py-14 text-center shadow-float backdrop-blur-2xl">
          <p className="text-sm uppercase tracking-[0.32em] text-slate">账号已就绪</p>
          <h1 className="mt-4 text-5xl font-semibold tracking-[-0.06em] text-ink">注册成功</h1>
          <p className="mt-4 text-base text-slate">正在跳转到登录页面...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#ffffff_0%,#eef2f7_100%)] px-6 py-10">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-[40px] border border-white/70 bg-white/[0.72] shadow-float backdrop-blur-2xl lg:grid-cols-[0.9fr_1.1fr]">
        <div className="hidden bg-[#111111] p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.32em] text-white/55">创建账号</p>
            <h1 className="mt-6 text-[4rem] font-semibold leading-[0.95] tracking-[-0.07em]">
              开启更精致的业务工作台体验。
            </h1>
            <p className="mt-6 max-w-md text-lg leading-8 text-white/70">
              注册流程延续同样的 Apple 风格克制感，用清晰留白、聚焦输入和轻量动效提升体验。
            </p>
          </div>
          <div className="rounded-[32px] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl">
            <p className="text-3xl font-semibold tracking-[-0.05em]">默认安全</p>
            <p className="mt-4 text-sm leading-7 text-white/[0.64]">在授予访问权限前，会先校验密码强度、身份字段和账号基础规范。</p>
          </div>
        </div>

        <div className="p-6 md:p-10 lg:p-12">
          <div className="mx-auto max-w-2xl">
            <p className="text-sm uppercase tracking-[0.32em] text-slate">注册入口</p>
            <h2 className="mt-4 text-5xl font-semibold tracking-[-0.06em] text-ink md:text-6xl">创建账号</h2>
            <p className="mt-4 text-base leading-7 text-slate">注册后即可使用全新的 Apple 风格价格管理界面。</p>

            <form className="mt-10 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
              <label className="block">
                <span className="mb-2 block text-sm text-slate">用户名 *</span>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  minLength={3}
                  maxLength={50}
                  className="w-full rounded-[22px] border border-black/8 bg-white/80 px-5 py-4 text-base outline-none transition focus:border-black/20 focus:shadow-apple"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm text-slate">邮箱 *</span>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full rounded-[22px] border border-black/8 bg-white/80 px-5 py-4 text-base outline-none transition focus:border-black/20 focus:shadow-apple"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm text-slate">姓名</span>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  maxLength={100}
                  className="w-full rounded-[22px] border border-black/8 bg-white/80 px-5 py-4 text-base outline-none transition focus:border-black/20 focus:shadow-apple"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm text-slate">手机号</span>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  pattern="1[3-9]\d{9}"
                  className="w-full rounded-[22px] border border-black/8 bg-white/80 px-5 py-4 text-base outline-none transition focus:border-black/20 focus:shadow-apple"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm text-slate">密码 *</span>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="w-full rounded-[22px] border border-black/8 bg-white/80 px-5 py-4 text-base outline-none transition focus:border-black/20 focus:shadow-apple"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm text-slate">确认密码 *</span>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="w-full rounded-[22px] border border-black/8 bg-white/80 px-5 py-4 text-base outline-none transition focus:border-black/20 focus:shadow-apple"
                />
              </label>

              {error ? (
                <div className="md:col-span-2 rounded-[22px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
              ) : null}

              <div className="md:col-span-2 pt-2">
                <button type="submit" disabled={loading} className="apple-button-primary w-full py-4 text-base disabled:opacity-60">
                  {loading ? '注册中...' : '注册'}
                </button>
              </div>
            </form>

            <div className="mt-8 text-sm text-slate">
              已有账号？{' '}
              <Link to="/login" className="text-ink transition hover:opacity-70">
                立即登录
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
