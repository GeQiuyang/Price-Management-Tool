import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const API_URL = 'http://localhost:3001/api'

const dashboardStyles = `
  .dashboard-container {
    animation: fadeInUp 0.4s ease forwards;
  }
  
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .stat-card {
    padding: 24px;
    border-radius: 16px;
    color: #fff;
    position: relative;
    overflow: hidden;
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
    cursor: default;
  }
  
  .stat-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
  }
  
  .stat-card::before {
    content: '';
    position: absolute;
    top: -30%;
    right: -20%;
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
  }
  
  .stat-card::after {
    content: '';
    position: absolute;
    bottom: -40%;
    right: 10%;
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.06);
  }
  
  .welcome-card {
    background: #FFFFFF;
    border-radius: 16px;
    padding: 32px;
    border: 1px solid var(--border);
    box-shadow: var(--shadow-sm);
    transition: box-shadow 0.3s ease;
  }
  
  .welcome-card:hover {
    box-shadow: var(--shadow-md);
  }
  
  .quick-action {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 20px;
    border-radius: 12px;
    background: var(--bg-tertiary);
    text-decoration: none;
    color: var(--text-primary);
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s ease;
    border: 1px solid transparent;
  }
  
  .quick-action:hover {
    background: var(--primary-bg);
    border-color: var(--primary-light);
    color: var(--primary);
    transform: translateX(4px);
  }
  
  .quick-action-icon {
    font-size: 20px;
    width: 28px;
    text-align: center;
  }
  
  .info-card {
    background: #FFFFFF;
    border-radius: 16px;
    padding: 28px;
    border: 1px solid var(--border);
    box-shadow: var(--shadow-sm);
    transition: box-shadow 0.3s ease;
  }
  
  .info-card:hover {
    box-shadow: var(--shadow-md);
  }
`

export default function Dashboard() {
  const [stats, setStats] = useState({
    products: 0,
    costs: 0,
    customers: 0,
    currencies: 0,
    recycleBin: 0,
  })
  const [loading, setLoading] = useState(true)

  const getGreeting = () => {
    const h = new Date().getHours()
    if (h < 6) return '🌙 夜深了'
    if (h < 12) return '🌅 早上好'
    if (h < 14) return '☀️ 中午好'
    if (h < 18) return '🌤️ 下午好'
    return '🌆 晚上好'
  }

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [products, costs, customers, currencies, recycleBin] = await Promise.all([
          fetch(`${API_URL}/products`).then(r => r.json()),
          fetch(`${API_URL}/costs`).then(r => r.json()),
          fetch(`${API_URL}/customers`).then(r => r.json()),
          fetch(`${API_URL}/currencies`).then(r => r.json()),
          fetch(`${API_URL}/recycle-bin`).then(r => r.json()),
        ])
        setStats({
          products: Array.isArray(products) ? products.length : 0,
          costs: Array.isArray(costs) ? costs.length : 0,
          customers: Array.isArray(customers) ? customers.length : 0,
          currencies: Array.isArray(currencies) ? currencies.length : 0,
          recycleBin: Array.isArray(recycleBin) ? recycleBin.length : 0,
        })
      } catch (err) {
        console.error('获取统计数据失败:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const statCards = [
    {
      title: '产品总数',
      value: stats.products,
      icon: '📦',
      gradient: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
      shadow: 'rgba(79, 70, 229, 0.3)',
    },
    {
      title: '成本记录',
      value: stats.costs,
      icon: '💰',
      gradient: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
      shadow: 'rgba(16, 185, 129, 0.3)',
    },
    {
      title: '客户分段',
      value: stats.customers,
      icon: '👥',
      gradient: 'linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)',
      shadow: 'rgba(59, 130, 246, 0.3)',
    },
    {
      title: '货币种类',
      value: stats.currencies,
      icon: '💱',
      gradient: 'linear-gradient(135deg, #F59E0B 0%, #FB923C 100%)',
      shadow: 'rgba(245, 158, 11, 0.3)',
    },
  ]

  const quickActions = [
    { label: '添加新产品', icon: '➕', path: '/products' },
    { label: '管理成本数据', icon: '📊', path: '/costs' },
    { label: '货币汇率换算', icon: '💱', path: '/currencies' },
    { label: '海运费模拟', icon: '🚢', path: '/freight-simulator' },
    { label: '查看回收站', icon: '🗑️', path: '/recycle-bin' },
  ]

  return (
    <div className="dashboard-container">
      <style>{dashboardStyles}</style>

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: '700',
          color: 'var(--text-primary)',
          marginBottom: '6px',
          letterSpacing: '-0.5px',
        }}>
          {getGreeting()}
        </h1>
        <p style={{
          fontSize: '15px',
          color: 'var(--text-tertiary)',
          fontWeight: '400',
        }}>
          欢迎使用 SalesForce 价格管理系统
        </p>
      </div>

      {/* Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '20px',
        marginBottom: '28px',
      }}>
        {statCards.map((card, i) => (
          <div
            key={i}
            className="stat-card"
            style={{
              background: card.gradient,
              boxShadow: `0 4px 14px ${card.shadow}`,
              animationDelay: `${i * 0.08}s`,
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              position: 'relative',
              zIndex: 1,
            }}>
              <div>
                <div style={{
                  fontSize: '13px',
                  fontWeight: '500',
                  opacity: 0.85,
                  marginBottom: '8px',
                }}>
                  {card.title}
                </div>
                <div style={{
                  fontSize: '36px',
                  fontWeight: '800',
                  letterSpacing: '-1px',
                  lineHeight: 1,
                }}>
                  {loading ? '—' : card.value}
                </div>
              </div>
              <div style={{
                fontSize: '32px',
                opacity: 0.7,
              }}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 340px',
        gap: '24px',
      }}>
        {/* Welcome Message */}
        <div className="welcome-card">
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: 'var(--text-primary)',
            marginBottom: '12px',
          }}>
            🎯 系统概览
          </h3>
          <p style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            lineHeight: '1.8',
            marginBottom: '20px',
          }}>
            SalesForce 提供完整的价格管理功能，涵盖产品目录、成本数据、客户分段、货币管理、
            税费设置、市场渠道管理以及海运费模拟等核心模块。所有数据实时同步，助力高效决策。
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
          }}>
            <div className="info-card" style={{ padding: '18px 20px' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>回收站</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--accent-red)' }}>
                {loading ? '—' : stats.recycleBin}
                <span style={{ fontSize: '13px', fontWeight: '400', color: 'var(--text-tertiary)', marginLeft: '6px' }}>
                  项待处理
                </span>
              </div>
            </div>
            <div className="info-card" style={{ padding: '18px 20px' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>数据保留</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--accent-green)' }}>
                30
                <span style={{ fontSize: '13px', fontWeight: '400', color: 'var(--text-tertiary)', marginLeft: '6px' }}>天回收站</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="info-card">
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: 'var(--text-primary)',
            marginBottom: '16px',
          }}>
            ⚡ 快速操作
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {quickActions.map((action, i) => (
              <Link key={i} to={action.path} className="quick-action">
                <span className="quick-action-icon">{action.icon}</span>
                {action.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
