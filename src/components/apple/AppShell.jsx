import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

const primaryNavItems = [
  { path: '/products', label: '产品管理' },
  { path: '/customers', label: '客户管理' },
  { path: '/quote-generator', label: '报价中心' },
]

const secondaryNavItems = [
  { path: '/audit-logs', label: '审计日志' },
  { path: '/backup-restore', label: '备份恢复' },
  { path: '/system-settings', label: '系统设置' },
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

  const asideClassName = `${mobileOpen ? 'flex' : 'hidden'} glass-panel flex-col p-4 lg:sticky lg:top-5 lg:flex lg:h-[calc(100vh-40px)] lg:self-start lg:overflow-y-auto lg:p-5`
  const mainClassName = `min-w-0 ${contentClassName}`

  return (
    <div className="apple-shell">
      <div className="apple-section py-5 md:py-6">
        <div className="grid gap-5 xl:gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside
            className={asideClassName}
          >
            <div className="mb-6 flex h-14 w-full items-center justify-center rounded-[16px] bg-[linear-gradient(180deg,#ffffff_0%,#eef2f7_100%)] px-5 text-center">
              <h2 className="text-2xl font-semibold tracking-[0.07em] text-ink">Vector</h2>
            </div>

            <div className="flex flex-1 flex-col">
              <div className="rounded-[24px] bg-[linear-gradient(180deg,#ffffff_0%,#f6f7fa_100%)] p-5">
                <div className="px-2 pb-4 text-sm font-semibold uppercase tracking-[0.2em] text-[#8b8b90]">
                  业务功能
                </div>
                <nav className="space-y-2.5">
                  {primaryNavItems.map((item) => {
                    const active = location.pathname === item.path
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileOpen(false)}
                        className={`flex w-full items-center justify-start rounded-2xl px-5 py-3.5 text-base tracking-[0.1em] transition ${
                          active ? 'bg-black text-white shadow-float' : 'text-[#666666] hover:bg-black/[0.04] hover:text-ink'
                        }`}
                      >
                        <span className="block w-full text-left">{item.label}</span>
                      </Link>
                    )
                  })}
                </nav>
              </div>

              <div className="mt-auto rounded-[24px] bg-[linear-gradient(180deg,#ffffff_0%,#f6f7fa_100%)] p-5">
                <div className="px-2 pb-4 text-sm font-semibold uppercase tracking-[0.2em] text-[#8b8b90]">
                  系统配置
                </div>
                <nav className="space-y-2.5">
                  {secondaryNavItems.map((item) => {
                    const active = location.pathname === item.path
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileOpen(false)}
                        className={`flex w-full items-center justify-start rounded-2xl px-5 py-3.5 text-base tracking-[0.1em] transition ${
                          active ? 'bg-black text-white shadow-float' : 'text-[#666666] hover:bg-black/[0.04] hover:text-ink'
                        }`}
                      >
                        <span className="block w-full text-left">{item.label}</span>
                      </Link>
                    )
                  })}
                </nav>
              </div>
            </div>
          </aside>

          <main className={mainClassName}>{children}</main>
        </div>
      </div>
    </div>
  )
}
