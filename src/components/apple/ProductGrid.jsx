import Reveal from './Reveal'

export default function ProductGrid({ modules }) {
  return (
    <section id="modules" className="apple-section py-8">
      <Reveal className="mb-10 text-center">
        <p className="text-sm font-medium uppercase tracking-[0.34em] text-slate">功能模块</p>
        <h2 className="mt-5 text-balance text-4xl font-semibold tracking-[-0.05em] text-ink md:text-6xl">
          保留与系统实际业务直接相关的模块入口。
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate">
          这里展示的都是可以直接进入并执行实际工作的模块,不再包含展示型或概念型内容。
        </p>
      </Reveal>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {modules.map((module, index) => (
          <Reveal key={module.title} delay={index * 90}>
            <a
              href={module.href}
              className="group block h-full rounded-[28px] border border-black/[0.06] bg-white/[0.78] p-6 shadow-apple transition duration-500 hover:-translate-y-1.5 hover:scale-[1.01] hover:shadow-float"
            >
              <div className={`h-52 rounded-[22px] ${module.visual}`} />
              <div className="mt-6">
                <p className="text-xs uppercase tracking-[0.28em] text-slate">{module.kicker}</p>
                <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-ink">{module.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate">{module.description}</p>
              </div>
            </a>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
