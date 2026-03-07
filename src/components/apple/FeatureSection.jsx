import Reveal from './Reveal'

const features = [
  {
    id: 'capabilities',
    eyebrow: '核心流程',
    title: '围绕实际业务场景组织日常工作。',
    description:
      '从产品管理、客户管理，到报价生成，常用操作都集中在统一入口中，减少页面切换成本。',
    points: ['产品资料与价格集中维护', '客户与成交信息集中管理', '报价流程集中处理'],
  },
  {
    id: 'intelligence',
    eyebrow: '系统管理',
    title: '系统配置、审计与恢复能力集中可见。',
    description:
      '系统参数、审计日志和备份恢复都保留在系统内，便于日常维护和风险追踪。',
    points: ['系统参数集中配置', '审计日志保留操作轨迹', '备份与恢复支持数据维护'],
  },
]

export default function FeatureSection() {
  return (
    <section className="apple-section space-y-8 py-8 md:space-y-10">
      {features.map((feature, index) => (
        <div
          id={feature.id}
          key={feature.id}
          className="grid min-h-[85vh] items-center gap-8 overflow-hidden rounded-[36px] bg-white/70 p-6 shadow-apple md:grid-cols-2 md:p-10 xl:p-16"
        >
          <Reveal className={`${index % 2 ? 'md:order-2' : ''}`}>
            <p className="text-sm font-medium uppercase tracking-[0.32em] text-slate">{feature.eyebrow}</p>
            <h2 className="mt-5 max-w-xl text-balance text-4xl font-semibold leading-tight tracking-[-0.05em] text-ink md:text-6xl">
              {feature.title}
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate">{feature.description}</p>
            <div className="mt-8 space-y-3">
              {feature.points.map((point) => (
                <div key={point} className="flex items-center gap-3 text-sm text-ink">
                  <span className="h-2.5 w-2.5 rounded-full bg-accent" />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal className={`${index % 2 ? 'md:order-1' : ''}`} delay={120}>
            <div className="relative rounded-[32px] bg-aurora p-4">
              <div className="rounded-[28px] border border-white/70 bg-white/80 p-5 backdrop-blur-xl">
                <div className="grid gap-4">
                  <div className="rounded-[24px] bg-[#111111] p-6 text-white">
                    <p className="text-xs uppercase tracking-[0.28em] text-white/56">业务入口</p>
                    <div className="mt-8 grid grid-cols-3 gap-3">
                      {[56, 78, 42].map((height, itemIndex) => (
                        <div
                          key={height}
                          className="rounded-[20px] bg-white/10"
                          style={{ height: `${height + itemIndex * 20}px` }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-[24px] bg-[#f5f5f7] p-5">
                      <p className="text-sm text-slate">系统配置</p>
                      <div className="mt-6 h-28 rounded-[20px] bg-[linear-gradient(135deg,rgba(0,113,227,0.12),rgba(17,17,17,0.04))]" />
                    </div>
                    <div className="rounded-[24px] bg-[#f5f5f7] p-5">
                      <p className="text-sm text-slate">报价处理</p>
                      <div className="mt-6 flex h-28 items-end gap-2">
                        {[36, 52, 68, 44, 88].map((bar) => (
                          <div key={bar} className="flex-1 rounded-t-[16px] bg-black/85" style={{ height: `${bar}px` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      ))}
    </section>
  )
}
