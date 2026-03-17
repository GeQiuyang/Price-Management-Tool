export default function Footer() {
  const columns = [
    {
      title: '浏览',
      items: ['产品管理', '客户管理', '报价中心', '系统设置'],
    },
    {
      title: '运营',
      items: ['报价中心', '审计日志', '备份恢复', '系统设置'],
    },
    {
      title: '平台',
      items: ['首页总览', '系统设置', '支持服务', '联系我们'],
    },
    {
      title: '资源',
      items: ['使用文档', '版本更新', '隐私政策', '服务条款'],
    },
  ]

  return (
    <footer id="support" className="apple-section py-8 pb-14">
      <div className="rounded-[36px] bg-[#ebedf0] px-6 py-10 md:px-10">
        <div className="grid gap-8 border-b border-black/8 pb-10 md:grid-cols-4">
          {columns.map((column) => (
            <div key={column.title}>
              <p className="text-sm font-semibold text-ink">{column.title}</p>
              <div className="mt-5 space-y-3 text-sm text-slate">
                {column.items.map((item) => (
                  <a key={item} href="#" className="block transition hover:text-ink">
                    {item}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-col gap-3 text-xs text-slate md:flex-row md:items-center md:justify-between">
          <p>Copyright 2026 QuoteFlow 价格管理平台。</p>
          <p>基于 React + TailwindCSS 构建。</p>
        </div>
      </div>
    </footer>
  )
}
