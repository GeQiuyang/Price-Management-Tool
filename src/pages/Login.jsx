import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Auth.css'

function Login() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const handleQuickLogin = async (role) => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('http://localhost:3001/api/auth/quick-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      })
      const data = await response.json()
      if (data.success) {
        localStorage.setItem('token', data.data.token)
        localStorage.setItem('user', JSON.stringify(data.data.user))
        navigate('/')
      } else {
        setError(data.error?.message || data.error || '登录失败')
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
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
      } else {
        setError(data.error?.message || '登录失败')
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-header">
          <h1>欢迎回来</h1>
          <p>请选择登录角色或使用账号密码登录</p>
        </div>

        <div className="quick-login-options" style={{ display: 'flex', gap: '10px', marginBottom: '20px', justifyContent: 'center' }}>
          <button type="button" onClick={() => handleQuickLogin('admin')} className="auth-button" style={{ flex: 1, backgroundColor: '#4f46e5' }}>管理员</button>
          <button type="button" onClick={() => handleQuickLogin('sales')} className="auth-button" style={{ flex: 1, backgroundColor: '#059669' }}>业务员</button>
          <button type="button" onClick={() => handleQuickLogin('foreign_trade')} className="auth-button" style={{ flex: 1, backgroundColor: '#d97706' }}>外贸员</button>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '20px', color: '#6b7280', fontSize: '14px' }}>
          或
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">用户名 / 邮箱</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="请输入用户名或邮箱"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">密码</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="请输入密码"
              required
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            还没有账号？{' '}
            <a href="/register">立即注册</a>
          </p>
          <p>
            <a href="/forgot-password">忘记密码？</a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
