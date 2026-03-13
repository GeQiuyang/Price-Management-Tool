import Reveal from './Reveal'

export default function HeroSection({ stats }) {
  const statItems = [
    { label: '已同步产品', value: stats.products },
    { label: '服务客户', value: stats.customers },
  ]

  return (
    <section id="overview" className="apple-section pt-8">
      <div className="relative overflow-hidden rounded-[40px] bg-hero-glow px-6 pb-10 pt-16 md:px-10 md:pt-24 xl:px-16">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent" />
        <Reveal className="mx-auto max-w-4xl text-center">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.4em] text-slate">业务总览</p>
          <h1 className="text-balance text-[3.5rem] font-semibold leading-[0.95] tracking-[-0.06em] text-ink md:text-[4.75rem] xl:text-[5.5rem]">
            将价格管理、客户管理与报价流程集中到一个工作台。
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg leading-8 text-slate md:text-[1.75rem] md:leading-[1.35]">
            在这里处理产品资料、客户档案、报价导出,以及系统设置、审计和备份恢复。
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a href="#capabilities" className="apple-button-primary min-w-[154px]">
              查看功能
            </a>
            <a href="#modules" className="apple-button-secondary min-w-[154px]">
              进入模块
            </a>
          </div>
        </Reveal>

        <Reveal className="relative mx-auto mt-14 max-w-6xl" delay={120}>
          <div className="relative mx-auto grid min-h-[460px] overflow-hidden rounded-[36px] border border-white/70 bg-[#f7f8fa]/90 p-4 shadow-float md:grid-cols-[1.3fr_0.9fr] md:p-6">
            <div className="relative overflow-hidden rounded-[30px] bg-[radial-gradient(circle_at_top_left,rgba(0,113,227,0.18),transparent_28%),linear-gradient(180deg,#0b1220_0%,#182235_100%)] p-6 text-white md:p-8">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.32em] text-white/55">
                <span>系统概况</span>
                <span>2026</span>
              </div>
              <div className="mt-16 max-w-md">
                <p className="text-sm text-white/68">核心数据</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] md:text-5xl">
                  快速查看产品、客户与报价相关状态。
                </h2>
              </div>
              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {statItems.map((item) => (
                  <div key={item.label} className="rounded-[24px] border border-white/10 bg-white/8 p-4 backdrop-blur-xl">
                    <p className="text-3xl font-semibold tracking-[-0.05em]">{item.value}</p>
                    <p className="mt-2 text-sm text-white/68">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:mt-0">
              <div className="rounded-[30px] border border-black/5 bg-white/90 p-6">
                <p className="text-xs uppercase tracking-[0.28em] text-slate">关键指标</p>
                <div className="mt-8 space-y-4">
                  {[
                    ['已录入产品', `${stats.products}`],
                    ['已维护客户', `${stats.customers}`],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between rounded-[22px] bg-[#f5f5f7] px-4 py-3">
                      <span className="text-sm text-slate">{label}</span>
                      <span className="text-sm font-semibold text-ink">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-[30px] bg-[linear-gradient(180deg,#ffffff_0%,#eef3fb_100%)] p-6">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-slate">系统状态</p>
                    <p className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-ink">稳定</p>
                  </div>
                  <div className="h-28 w-28 rounded-full border border-black/5 bg-[radial-gradient(circle,rgba(0,113,227,0.16),rgba(255,255,255,0.95))] shadow-inner" />
                </div>
                <div className="mt-8 h-28 rounded-[24px] bg-[linear-gradient(90deg,rgba(0,113,227,0.12)_0%,rgba(17,17,17,0.02)_100%)]" />
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
