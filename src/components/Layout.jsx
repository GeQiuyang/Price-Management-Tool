import { Link, useLocation } from 'react-router-dom'

const navStyles = `
  .nav-link {
    display: flex;
    align-items: center;
    padding: 10px 20px;
    color: #9CA3AF;
    text-decoration: none;
    font-size: 13px;
    font-weight: 500;
    letter-spacing: -0.1px;
    transition: all 0.15s ease;
    border-radius: 0 8px 8px 0;
    margin: 0 8px 0 0;
    padding-left: 17px;
    position: relative;
  }
  
  .nav-link:hover {
    color: #E5E7EB;
    background-color: rgba(255, 255, 255, 0.05);
  }
  
  .nav-link.active {
    color: #FFFFFF;
    background-color: rgba(59, 130, 246, 0.1);
    border-left: 3px solid #3B82F6;
    padding-left: 17px;
  }
  
  .nav-link.active:hover {
    background-color: rgba(59, 130, 246, 0.15);
  }
`

export default function Layout({ children }) {
  const location = useLocation()

  const navItems = [
    { path: '/', label: '产品目录' },
    { path: '/costs', label: '成本数据' },
    { path: '/customers', label: '客户分段' },
    { path: '/currencies', label: '货币管理' },
    { path: '/taxes-units', label: '税费与计量单位' },
    { path: '/markets-channels', label: '市场与渠道' },
  ]

  return (
    <div style={styles.container}>
      <style>{navStyles}</style>
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <h1 style={styles.title}>价格管理工具</h1>
        </div>
        <ul style={styles.navList}>
          {navItems.map((item) => (
            <li key={item.path} style={styles.navItem}>
              <Link
                to={item.path}
                className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </aside>
      <main style={styles.main}>{children}</main>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#F7F9FC',
  },
  sidebar: {
    width: '240px',
    backgroundColor: '#111827',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
  },
  sidebarHeader: {
    padding: '24px 20px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: '17px',
    fontWeight: '600',
    margin: 0,
    letterSpacing: '-0.3px',
    color: '#FFFFFF',
  },
  navList: {
    listStyle: 'none',
    padding: '12px 0',
    margin: 0,
  },
  navItem: {
    marginBottom: '2px',
  },
  main: {
    flex: 1,
    padding: '24px',
    maxWidth: '1400px',
    width: '100%',
    marginTop: 0,
    marginRight: 'auto',
    marginBottom: 0,
    marginLeft: 'auto',
  },
}
