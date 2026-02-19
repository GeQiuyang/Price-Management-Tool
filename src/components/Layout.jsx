import { Link, useLocation } from 'react-router-dom'

const sidebarStyles = `
  .sidebar {
    width: 260px;
    background: linear-gradient(180deg, #0F172A 0%, #1E293B 100%);
    color: #fff;
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: 100;
    overflow-y: auto;
    border-right: 1px solid rgba(255, 255, 255, 0.06);
  }
  
  .sidebar-header {
    padding: 28px 24px 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }
  
  .sidebar-logo {
    display: flex;
    align-items: center;
    gap: 12px;
    text-decoration: none;
  }
  
  .sidebar-logo-icon {
    width: 36px;
    height: 36px;
    background: var(--gradient-primary);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
  }
  
  .sidebar-logo-text {
    font-size: 19px;
    font-weight: 700;
    letter-spacing: -0.5px;
    color: #FFFFFF;
    background: linear-gradient(135deg, #FFFFFF 0%, #C7D2FE 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .nav-section-label {
    padding: 20px 24px 8px;
    font-size: 11px;
    font-weight: 600;
    color: rgba(148, 163, 184, 0.6);
    text-transform: uppercase;
    letter-spacing: 1.2px;
  }

  .nav-list {
    list-style: none;
    padding: 8px 12px;
    margin: 0;
  }
  
  .nav-link {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    color: #94A3B8;
    text-decoration: none;
    font-size: 13.5px;
    font-weight: 500;
    letter-spacing: -0.1px;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 10px;
    margin-bottom: 2px;
    position: relative;
  }
  
  .nav-link:hover {
    color: #E2E8F0;
    background-color: rgba(255, 255, 255, 0.06);
  }
  
  .nav-link.active {
    color: #FFFFFF;
    background: linear-gradient(135deg, rgba(79, 70, 229, 0.2) 0%, rgba(124, 58, 237, 0.15) 100%);
    box-shadow: 0 0 0 1px rgba(79, 70, 229, 0.3) inset;
  }
  
  .nav-link.active .nav-icon {
    filter: none;
    transform: scale(1.05);
  }
  
  .nav-link.active:hover {
    background: linear-gradient(135deg, rgba(79, 70, 229, 0.25) 0%, rgba(124, 58, 237, 0.2) 100%);
  }
  
  .nav-icon {
    font-size: 18px;
    width: 24px;
    text-align: center;
    transition: transform 0.2s ease;
    flex-shrink: 0;
  }
  
  .nav-link:hover .nav-icon {
    transform: scale(1.1);
  }
  
  .nav-badge {
    margin-left: auto;
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 999px;
    background: rgba(79, 70, 229, 0.2);
    color: #818CF8;
  }
  
  .sidebar-footer {
    margin-top: auto;
    padding: 16px 24px 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }
  
  .sidebar-footer-text {
    font-size: 11px;
    color: rgba(148, 163, 184, 0.4);
    text-align: center;
  }
  
  .main-content {
    flex: 1;
    margin-left: 260px;
    padding: 28px 32px;
    max-width: 1400px;
    animation: fadeInUp 0.3s ease forwards;
  }
  
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
`

export default function Layout({ children }) {
  const location = useLocation()

  const navItems = [
    { path: '/', label: '总览', icon: '📊', section: '业务管理' },
    { path: '/products', label: '产品管理', icon: '📦' },
    { path: '/costs', label: '成本与定价', icon: '💰' },
    { path: '/customers', label: '客户管理', icon: '👥' },
    { path: '/markets-channels', label: '市场与渠道', icon: '🌍' },
    { path: '/freight-simulator', label: '海运费模拟', icon: '�', section: '业务工具' },
    { path: '/quote-generator', label: '报价生成器', icon: '📋' },
    { path: '/currencies', label: '货币与汇率', icon: '�', section: '系统设置' },
    { path: '/tax-rules', label: '税费规则', icon: '📐' },
    { path: '/system-settings', label: '系统参数', icon: '⚙️' },
    { path: '/recycle-bin', label: '回收站', icon: '🗑️', section: '其他' },
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
            <div className="sidebar-logo-icon">⚡</div>
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
                <ul className="nav-list" style={{ padding: showSection ? '0 12px' : undefined }}>
                  <li>
                    <Link
                      to={item.path}
                      className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                    >
                      <span className="nav-icon">{item.icon}</span>
                      {item.label}
                    </Link>
                  </li>
                </ul>
              </div>
            )
          })}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-footer-text">SalesForce v1.0</div>
        </div>
      </aside>
      <main className="main-content" key={location.pathname}>{children}</main>
    </div>
  )
}
