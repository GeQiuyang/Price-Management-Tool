import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'

const sidebarStyles = `
  .sidebar {
    width: 268px;
    background: linear-gradient(180deg, #0F172A 0%, #1E293B 50%, #0F172A 100%);
    color: #fff;
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: 100;
    overflow-y: auto;
    border-right: 1px solid rgba(212, 175, 55, 0.08);
  }
  
  .sidebar::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 200px;
    background: linear-gradient(180deg, rgba(212, 175, 55, 0.03) 0%, transparent 100%);
    pointer-events: none;
  }
  
  .sidebar-header {
    padding: 32px 28px 28px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    position: relative;
  }
  
  .sidebar-logo {
    display: flex;
    align-items: center;
    gap: 14px;
    text-decoration: none;
  }
  
  .sidebar-logo-icon {
    width: 42px;
    height: 42px;
    background: linear-gradient(135deg, #D4AF37 0%, #E8C547 50%, #D4AF37 100%);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    font-weight: 700;
    color: #0F172A;
    box-shadow: 0 4px 16px rgba(212, 175, 55, 0.35);
    position: relative;
    overflow: hidden;
  }
  
  .sidebar-logo-icon::after {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.3) 50%, transparent 60%);
    animation: shimmer 3s infinite;
  }
  
  @keyframes shimmer {
    0% { transform: translateX(-100%) rotate(45deg); }
    100% { transform: translateX(100%) rotate(45deg); }
  }
  
  .sidebar-logo-text {
    font-family: 'Playfair Display', serif;
    font-size: 22px;
    font-weight: 600;
    letter-spacing: -0.5px;
    color: #FFFFFF;
    background: linear-gradient(135deg, #FFFFFF 0%, #E8C547 50%, #D4AF37 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .nav-section-label {
    padding: 28px 28px 12px;
    font-size: 11px;
    font-weight: 600;
    color: rgba(212, 175, 55, 0.7);
    text-transform: uppercase;
    letter-spacing: 1.5px;
  }

  .nav-list {
    list-style: none;
    padding: 4px 16px;
    margin: 0;
  }
  
  .nav-link {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 18px;
    color: rgba(255, 255, 255, 0.6);
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    letter-spacing: -0.1px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 12px;
    margin-bottom: 4px;
    position: relative;
    overflow: hidden;
  }
  
  .nav-link::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 0;
    background: linear-gradient(180deg, #D4AF37 0%, #E8C547 100%);
    border-radius: 0 3px 3px 0;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .nav-link:hover {
    color: #FFFFFF;
    background: rgba(255, 255, 255, 0.05);
    transform: translateX(4px);
  }
  
  .nav-link.active {
    color: #FFFFFF;
    background: linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(212, 175, 55, 0.08) 100%);
    box-shadow: 0 4px 20px rgba(212, 175, 55, 0.1);
  }
  
  .nav-link.active::before {
    height: 24px;
  }
  
  .nav-link.active:hover {
    background: linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.12) 100%);
  }
  
  .nav-icon {
    font-size: 0;
    width: 0;
    text-align: center;
    flex-shrink: 0;
  }
  
  .nav-badge {
    margin-left: auto;
    font-size: 10px;
    font-weight: 600;
    padding: 3px 10px;
    border-radius: 999px;
    background: rgba(212, 175, 55, 0.2);
    color: #E8C547;
    letter-spacing: 0.5px;
  }
  
  .sidebar-footer {
    margin-top: auto;
    padding: 20px 24px 24px;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    position: relative;
  }
  
  .sidebar-footer::before {
    content: '';
    position: absolute;
    top: 0;
    left: 24px;
    right: 24px;
    height: 1px;
    background: linear-gradient(90deg, transparent 0%, rgba(212, 175, 55, 0.3) 50%, transparent 100%);
  }
  
  .user-info {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 14px;
    margin-bottom: 14px;
    transition: all 0.3s ease;
  }
  
  .user-info:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(212, 175, 55, 0.2);
  }
  
  .user-avatar {
    width: 44px;
    height: 44px;
    background: linear-gradient(135deg, #D4AF37 0%, #AA8C2C 100%);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    font-weight: 600;
    color: #0F172A;
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
  }
  
  .user-details {
    flex: 1;
    min-width: 0;
  }
  
  .user-name {
    font-size: 14px;
    font-weight: 600;
    color: #FFFFFF;
    margin: 0 0 3px 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .user-role {
    font-size: 12px;
    color: rgba(212, 175, 55, 0.8);
    margin: 0;
    font-weight: 500;
    letter-spacing: 0.3px;
  }
  
  .logout-button {
    width: 100%;
    padding: 14px 18px;
    background: rgba(239, 68, 68, 0.08);
    color: #FCA5A5;
    border: 1px solid rgba(239, 68, 68, 0.15);
    border-radius: 12px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    gap: 10px;
    justify-content: center;
    letter-spacing: 0.2px;
  }
  
  .logout-button:hover {
    background: rgba(239, 68, 68, 0.15);
    color: #FCA5A5;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(239, 68, 68, 0.2);
  }
  
  .logout-button:active {
    transform: translateY(0);
  }
  
  .sidebar-footer-text {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.3);
    text-align: center;
    margin-top: 16px;
    letter-spacing: 0.5px;
  }
  
  .main-content {
    flex: 1;
    margin-left: 268px;
    padding: 36px 40px;
    max-width: calc(100vw - 268px);
    animation: contentFadeIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }
  
  @keyframes contentFadeIn {
    from { 
      opacity: 0; 
      transform: translateY(12px); 
    }
    to { 
      opacity: 1; 
      transform: translateY(0); 
    }
  }
`

export default function Layout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token')
      await fetch('http://localhost:3001/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
    } catch (error) {
      console.error('登出失败:', error)
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      navigate('/login')
    }
  }

  const navItems = [
    { path: '/products', label: '产品管理', section: '业务管理' },
    { path: '/costs', label: '成本与定价' },
    { path: '/customers', label: '客户管理' },
    { path: '/markets-channels', label: '市场与渠道' },
    { path: '/freight-simulator', label: '海运费模拟', section: '业务工具' },
    { path: '/quote-generator', label: '报价生成器' },
    { path: '/currencies', label: '货币与汇率', section: '系统设置' },
    { path: '/tax-rules', label: '税费规则' },
    { path: '/system-settings', label: '系统参数' },
    { path: '/audit-logs', label: '审计日志', section: '数据管理' },
    { path: '/backup-restore', label: '备份恢复' },
    { path: '/recycle-bin', label: '回收站', section: '其他' },
  ]

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  let currentSection = null

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      <style>{sidebarStyles}</style>
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">S</div>
            <span className="sidebar-logo-text">SalesForce</span>
          </div>
        </div>
        <nav>
          {navItems.map((item) => {
            const showSection = item.section && item.section !== currentSection
            if (item.section) currentSection = item.section
            return (
              <div key={item.path}>
                {showSection && (
                  <div className="nav-section-label">{item.section}</div>
                )}
                <ul className="nav-list" style={{ padding: showSection ? '0 16px' : undefined }}>
                  <li>
                    <Link
                      to={item.path}
                      className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                    >
                      {item.label}
                    </Link>
                  </li>
                </ul>
              </div>
            )
          })}
        </nav>
        <div className="sidebar-footer">
          {user && (
            <div className="user-info">
              <div className="user-avatar">
                {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
              </div>
              <div className="user-details">
                <p className="user-name">{user.full_name || user.username}</p>
                <p className="user-role">{user.role?.display_name || '用户'}</p>
              </div>
            </div>
          )}
          <button className="logout-button" onClick={handleLogout}>
            退出登录
          </button>
          <div className="sidebar-footer-text">SalesForce v1.0</div>
        </div>
      </aside>
      <main className="main-content" key={location.pathname}>{children}</main>
    </div>
  )
}
