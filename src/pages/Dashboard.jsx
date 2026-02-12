import { useState, useEffect } from 'react'

export default function Dashboard() {
  const [stats, setStats] = useState([
    { title: '产品总数', value: 0, color: '#4e73df' },
    { title: 'SKU数量', value: 0, color: '#1cc88a' },
    { title: '客户分段', value: 0, color: '#36b9cc' },
    { title: '货币种类', value: 0, color: '#f6c23e' },
  ])

  useEffect(() => {
    const updateStats = () => {
      const products = JSON.parse(localStorage.getItem('products') || '[]')
      const customers = JSON.parse(localStorage.getItem('customers') || '[]')
      const currencies = JSON.parse(localStorage.getItem('currencies') || '[]')

      const productCount = products.length
      const skuCount = products.length
      const customerCount = customers.length
      const currencyCount = currencies.length

      setStats([
        { title: '产品总数', value: productCount, color: '#4e73df' },
        { title: 'SKU数量', value: skuCount, color: '#1cc88a' },
        { title: '客户分段', value: customerCount, color: '#36b9cc' },
        { title: '货币种类', value: currencyCount, color: '#f6c23e' },
      ])
    }

    updateStats()

    const handleStorageChange = () => {
      updateStats()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('products-updated', handleStorageChange)
    window.addEventListener('customers-updated', handleStorageChange)
    window.addEventListener('currencies-updated', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('products-updated', handleStorageChange)
      window.removeEventListener('customers-updated', handleStorageChange)
      window.removeEventListener('currencies-updated', handleStorageChange)
    }
  }, [])

  return (
    <div>
      <h2 style={styles.pageTitle}>总览</h2>
      <div style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <div key={index} style={{ ...styles.statCard, borderLeft: `4px solid ${stat.color}` }}>
            <div style={styles.statTitle}>{stat.title}</div>
            <div style={styles.statValue}>{stat.value}</div>
          </div>
        ))}
      </div>
      <div style={styles.welcomeCard}>
        <h3 style={styles.welcomeTitle}>欢迎使用价格管理工具</h3>
        <p style={styles.welcomeText}>
          本系统提供完整的价格管理功能，包括产品目录、成本数据、客户分段、货币管理、税费设置以及市场渠道管理等模块。
        </p>
      </div>
    </div>
  )
}

const styles = {
  pageTitle: {
    fontSize: '24px',
    fontWeight: '600',
    marginBottom: '24px',
    color: '#333',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '20px',
    marginBottom: '24px',
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    padding: '24px',
    borderRadius: '8px',
    border: '1px solid #E8ECF1',
  },
  statTitle: {
    fontSize: '14px',
    color: '#5a6a85',
    marginBottom: '8px',
  },
  statValue: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#333',
  },
  welcomeCard: {
    backgroundColor: '#FFFFFF',
    padding: '32px',
    borderRadius: '8px',
    border: '1px solid #E8ECF1',
  },
  welcomeTitle: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '12px',
    color: '#333',
  },
  welcomeText: {
    fontSize: '14px',
    color: '#5a6a85',
    lineHeight: '1.6',
  },
}
