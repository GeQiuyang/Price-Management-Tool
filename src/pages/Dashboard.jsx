import { useEffect, useState } from 'react'
import Navbar from '../components/apple/Navbar'
import HeroSection from '../components/apple/HeroSection'
import FeatureSection from '../components/apple/FeatureSection'
import ProductGrid from '../components/apple/ProductGrid'
import Footer from '../components/apple/Footer'

const API_URL = 'http://localhost:3001/api'

const defaultStats = {
  products: 0,
  customers: 0,
}

export default function Dashboard() {
  const [stats, setStats] = useState(defaultStats)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [products, customers] = await Promise.all([
          fetch(`${API_URL}/products`).then((response) => response.json()),
          fetch(`${API_URL}/customers`).then((response) => response.json()),
        ])

        setStats({
          products: Array.isArray(products) ? products.length : 0,
          customers: Array.isArray(customers) ? customers.length : 0,
        })
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error)
      }
    }

    fetchStats()
  }, [])

  const modules = [
    {
      kicker: '产品目录',
      title: '产品管理',
      description: `维护 ${stats.products} 条有效产品记录,统一管理名称、规格、价格与经销商价。`,
      href: '/products',
      visual: 'bg-[radial-gradient(circle_at_top_left,rgba(0,113,227,0.16),transparent_35%),linear-gradient(180deg,#ffffff_0%,#eef2f7_100%)]',
    },
    {
      kicker: '客户关系',
      title: '客户管理',
      description: `查看 ${stats.customers} 条客户档案,管理客户类型、国家城市、联系方式和成交次数。`,
      href: '/customers',
      visual: 'bg-[linear-gradient(135deg,rgba(17,17,17,0.92)_0%,rgba(38,42,51,1)_100%)]',
    },
    {
      kicker: '系统治理',
      title: '系统管理',
      description: '查看系统设置、审计日志与备份恢复状态,集中处理系统级维护工作。',
      href: '/system-settings',
      visual: 'bg-[linear-gradient(180deg,#f6f6f6_0%,#e5e9f0_100%)]',
    },
  ]

  return (
    <div className="space-y-8">
      <Navbar />
      <HeroSection stats={stats} />
      <FeatureSection />
      <ProductGrid modules={modules} />
      <Footer />
    </div>
  )
}
