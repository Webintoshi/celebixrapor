import { PdfStudio } from "@/components/pdf-studio";

const metrics = [
  { value: "2 akista", label: "HTML yapistir veya public link ver" },
  { value: "Aninda", label: "PDF indirme ile biten tek ekran deneyim" },
  { value: "Stateless", label: "Dosya saklamayan v1 mimarisi" },
];

const highlights = [
  {
    title: "Guvenli donusum kontrati",
    body: "Public URL denetimi, private adres engellemesi ve IP bazli rate-limit ile gereksiz risk almaz.",
  },
  {
    title: "Premium arayuz",
    body: "Landing ve calisma alani tek yerde bulusur. Kullanici once degeri gorur, sonra aninda belgeye gecer.",
  },
  {
    title: "Operasyonel olarak hazir",
    body: "Render veya Coolify uzerinde deploy, gomulu Chromium renderer ve health-check rotasi ile canliya alinabilir.",
  },
];

const steps = [
  {
    step: "01",
    title: "Kaynagi sec",
    body: "HTML sekmesinde editor kullanin ya da URL sekmesinde public bir link verin.",
  },
  {
    step: "02",
    title: "Ayar gerekiyorsa ac",
    body: "Format, yon, margin, arka plan ve CSS page size gibi ayarlari gelismis panelden degistirin.",
  },
  {
    step: "03",
    title: "PDF'i alin",
    body: "Belge stream edilir, diske yazilmaz ve hazir oldugunda indirme otomatik baslar.",
  },
];

export default function Home() {
  return (
    <main className="relative overflow-hidden">
      <section className="mx-auto flex max-w-7xl flex-col gap-10 px-6 pb-8 pt-6 sm:px-8 lg:px-12 lg:pt-10">
        <div className="glass-panel reveal-up rounded-[2rem] px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--accent)]">
                Premium HTML to PDF
              </div>
              <div className="mt-2 text-sm text-[var(--ink-soft)]">
                Online, tek ekranli ve canliya alinabilir premium donusum deneyimi.
              </div>
            </div>
            <a
              href="#studio"
              className="metal-button inline-flex w-full items-center justify-center rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white sm:w-auto"
            >
              Studioyu Ac
            </a>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div className="reveal-up">
            <div className="mb-5 inline-flex rounded-full border border-white/70 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
              HTML veya linkten PDF
            </div>
            <h1 className="max-w-4xl font-serif text-5xl leading-[0.92] tracking-[-0.04em] text-[var(--ink)] sm:text-6xl lg:text-7xl">
              Premium kaliteyle HTML&apos;i veya bir public sayfayi PDF olarak alin.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--ink-soft)] sm:text-xl">
              Bu urun; ust duzey SaaS gorunumu, guvenli donusum kontrati ve
              stateless altyapi mantigini tek akista birlestirir.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#studio"
                className="metal-button inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-6 py-4 text-sm font-semibold text-[var(--ink)]"
              >
                Donusume Basla
              </a>
              <a
                href="#neden"
                className="inline-flex items-center justify-center rounded-full border border-[var(--line)] bg-white/70 px-6 py-4 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--accent)]"
              >
                Mimarinin Mantigi
              </a>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-1">
            {metrics.map((metric) => (
              <article
                key={metric.label}
                className="section-panel rounded-[2rem] p-6"
              >
                <div className="text-3xl font-semibold tracking-[-0.05em] text-[var(--ink)]">
                  {metric.value}
                </div>
                <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
                  {metric.label}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="studio" className="mx-auto max-w-7xl px-6 py-8 sm:px-8 lg:px-12">
        <PdfStudio />
      </section>

      <section
        id="neden"
        className="mx-auto grid max-w-7xl gap-6 px-6 py-8 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-12"
      >
        <div className="section-panel rounded-[2rem] p-8">
          <div className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent)]">
            Neden bu urun
          </div>
          <h2 className="mt-4 max-w-xl font-serif text-4xl leading-tight tracking-[-0.04em] text-[var(--ink)]">
            Tek amaca odakli, pazarlama ve islevi ayni ekranda toplayan premium bir arac.
          </h2>
          <p className="mt-4 max-w-xl text-base leading-8 text-[var(--ink-soft)]">
            Kullanicinin karar aninda arac ve aciklama birlikte gorunur. Bu,
            landing ile uygulama arasinda kopukluk yaratmadan donusumu hizlandirir.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {highlights.map((item) => (
            <article
              key={item.title}
              className="glass-panel rounded-[2rem] p-6"
            >
              <h3 className="text-xl font-semibold tracking-[-0.03em] text-[var(--ink)]">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
                {item.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8 sm:px-8 lg:px-12">
        <div className="glass-panel rounded-[2.25rem] p-6 sm:p-8">
          <div className="max-w-2xl">
            <div className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--accent)]">
              Akis
            </div>
            <h2 className="mt-4 font-serif text-4xl tracking-[-0.04em] text-[var(--ink)]">
              Kullanici belirsizlik yasamadan uc adimda sonucu alir.
            </h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {steps.map((item) => (
              <article
                key={item.step}
                className="section-panel rounded-[1.75rem] p-6"
              >
                <div className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--accent)]">
                  {item.step}
                </div>
                <h3 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-[var(--ink)]">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
                  {item.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-7xl flex-col gap-2 px-6 pb-12 pt-4 text-sm text-[var(--ink-soft)] sm:px-8 lg:px-12">
        <div className="font-semibold text-[var(--ink)]">Premium HTML to PDF</div>
        <div>
          Gomulu Chromium renderer ve Render odakli mimari ile canli ortam icin
          hazirlanan tek ekran premium donusum uygulamasi.
        </div>
      </footer>
    </main>
  );
}
