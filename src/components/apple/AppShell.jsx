import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

const navItems = [
  { path: '/', label: '首页总览' },
  { path: '/products', label: '产品管理' },
  { path: '/customers', label: '客户管理' },
  { path: '/quote-generator', label: '报价中心' },
  { path: '/audit-logs', label: '审计日志' },
  { path: '/backup-restore', label: '备份恢复' },
  { path: '/system-settings', label: '系统设置' },
  { path: '/recycle-bin', label: '回收站' },
]

export default function AppShell({ children, user }) {
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const contentClassName =
    location.pathname === '/'
      ? 'pb-14'
      : location.pathname === '/quote-generator'
        ? 'overflow-hidden rounded-[32px] border border-white/60 bg-white/[0.74] py-4 shadow-apple backdrop-blur-2xl md:py-6 xl:py-7'
        : 'rounded-[32px] border border-white/60 bg-white/[0.74] p-4 shadow-apple backdrop-blur-2xl md:p-6 xl:p-7'

  const asideClassName = `${mobileOpen ? 'flex' : 'hidden'} glass-panel flex-col p-4 lg:sticky lg:top-5 lg:flex lg:max-h-[calc(100vh-40px)] lg:self-start lg:overflow-y-auto lg:p-5`
  const mainClassName = `min-w-0 ${contentClassName}`

  return (
    <div className="apple-shell">
      <div className="apple-section py-5 md:py-6">
        <div className="grid gap-5 xl:gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside
            className={asideClassName}
          >
            <div className="mb-4 flex min-h-[180px] items-center justify-center rounded-[28px] bg-[linear-gradient(180deg,#ffffff_0%,#eef2f7_100%)] p-5 text-center">
              <h2 className="text-3xl font-semibold tracking-[-0.04em] text-ink">工作台</h2>
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const active = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={`flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm tracking-[0.08em] transition ${
                      active ? 'bg-black text-white shadow-float' : 'text-slate hover:bg-black/[0.04] hover:text-ink'
                    }`}
                  >
                    <span className="block w-full text-center">{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </aside>

          <main className={mainClassName}>{children}</main>
        </div>
      </div>
    </div>
  )
}
