const navItems = [
  { label: '总览', href: '#overview' },
  { label: '核心能力', href: '#capabilities' },
  { label: '智能中枢', href: '#intelligence' },
  { label: '功能模块', href: '#modules' },
  { label: '支持服务', href: '#support' },
]

export default function Navbar() {
  return (
    <header className="sticky top-5 z-30 apple-section">
      <div className="glass-panel mx-auto flex items-center justify-between px-5 py-3 md:px-7">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-sm font-semibold text-white">
            V
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.32em] text-slate">Vector</p>
            <p className="text-sm font-semibold tracking-[-0.02em] text-ink">价格管理平台</p>
          </div>
        </div>

        <nav className="hidden items-center gap-7 text-sm text-slate lg:flex">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className="transition hover:text-ink">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a href="#support" className="apple-button-secondary hidden sm:inline-flex">
            了解更多
          </a>
          <a href="#modules" className="apple-button-primary">
            立即查看
          </a>
        </div>
      </div>
    </header>
  )
}
