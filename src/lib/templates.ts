export const htmlTemplates = [
  {
    id: "executive-brief",
    title: "Yonetici Ozeti",
    blurb: "Premium rapor duzeni",
    html: `<!DOCTYPE html>
<html lang="tr">
  <head>
    <meta charset="utf-8" />
    <style>
      body { font-family: 'Segoe UI', Arial, sans-serif; background: #f7f1e4; margin: 0; color: #1a1a1a; }
      .wrap { max-width: 820px; margin: 0 auto; padding: 48px; }
      .hero { background: linear-gradient(135deg, #111827, #334155); color: #fff; padding: 40px; border-radius: 28px; }
      h1 { margin: 0 0 8px; font-size: 42px; }
      .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 28px; }
      .card { background: #fff; border-radius: 20px; padding: 24px; box-shadow: 0 16px 40px rgba(17,24,39,.08); }
      .label { font-size: 12px; letter-spacing: .18em; text-transform: uppercase; color: #9a7b42; }
      .value { margin-top: 10px; font-size: 28px; font-weight: 700; }
      p { line-height: 1.7; color: #475569; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <section class="hero">
        <div class="label">Q1 Strateji Notu</div>
        <h1>Donusum kalitesini premium sunumla birlestirin.</h1>
        <p>Bu sablon; yonetici ozeti, performans metrikleri ve kisa aksiyon maddeleri icin optimize edildi.</p>
      </section>
      <section class="grid">
        <article class="card">
          <div class="label">Gelir</div>
          <div class="value">%38</div>
          <p>Onceki doneme gore daha yuksek yeni musteri kazanimi.</p>
        </article>
        <article class="card">
          <div class="label">Pipeline</div>
          <div class="value">24 gun</div>
          <p>Ortalama kapanis suresi sade bir operasyon akisi ile kisaldi.</p>
        </article>
        <article class="card">
          <div class="label">Odak</div>
          <div class="value">3 alan</div>
          <p>Karlilik, NPS ve kurumsal onboard sureci onceliklendirildi.</p>
        </article>
      </section>
    </div>
  </body>
</html>`,
  },
  {
    id: "invoice",
    title: "Fatura",
    blurb: "Kurumsal A4 tahsilat sayfasi",
    html: `<!DOCTYPE html>
<html lang="tr">
  <head>
    <meta charset="utf-8" />
    <style>
      body { font-family: Inter, Arial, sans-serif; background: #fff; color: #111827; margin: 0; }
      .sheet { max-width: 860px; margin: 0 auto; padding: 56px; }
      .top { display: flex; justify-content: space-between; align-items: start; margin-bottom: 40px; }
      .brand { font-size: 28px; font-weight: 800; letter-spacing: -.03em; }
      .muted { color: #64748b; }
      table { width: 100%; border-collapse: collapse; margin-top: 32px; }
      th, td { padding: 16px 12px; border-bottom: 1px solid #e2e8f0; text-align: left; }
      th { font-size: 12px; text-transform: uppercase; letter-spacing: .16em; color: #64748b; }
      .total { display: flex; justify-content: flex-end; margin-top: 28px; }
      .total-box { width: 280px; background: #f8fafc; border-radius: 24px; padding: 24px; }
      .grand { font-size: 30px; font-weight: 800; }
    </style>
  </head>
  <body>
    <div class="sheet">
      <section class="top">
        <div>
          <div class="brand">Northline Studio</div>
          <div class="muted">Barbaros Bulvari 21, Istanbul</div>
          <div class="muted">finance@northline.co</div>
        </div>
        <div>
          <div class="muted">Fatura No</div>
          <strong>INV-2026-014</strong>
        </div>
      </section>
      <section>
        <div class="muted">Musteri</div>
        <h1>Atlas Commerce A.S.</h1>
        <table>
          <thead>
            <tr><th>Hizmet</th><th>Aciklama</th><th>Tutar</th></tr>
          </thead>
          <tbody>
            <tr><td>UX Tasarim</td><td>Landing ve donusum akisi tasarimi</td><td>38.000 TL</td></tr>
            <tr><td>Front-end Gelistirme</td><td>Next.js tabanli premium arayuz</td><td>52.000 TL</td></tr>
            <tr><td>QA ve Yayin</td><td>Test, deploy ve teslim</td><td>12.000 TL</td></tr>
          </tbody>
        </table>
        <div class="total">
          <div class="total-box">
            <div class="muted">Genel Toplam</div>
            <div class="grand">102.000 TL</div>
          </div>
        </div>
      </section>
    </div>
  </body>
</html>`,
  },
  {
    id: "event-program",
    title: "Etkinlik Programi",
    blurb: "Sunum ve davet akisi",
    html: `<!DOCTYPE html>
<html lang="tr">
  <head>
    <meta charset="utf-8" />
    <style>
      body { margin: 0; background: radial-gradient(circle at top left, #f6d585, #f5f1e8 45%, #ffffff 100%); font-family: Georgia, serif; color: #18181b; }
      .page { max-width: 860px; margin: 0 auto; padding: 60px 52px; }
      .eyebrow { letter-spacing: .2em; text-transform: uppercase; font-size: 12px; color: #7c5b20; }
      h1 { font-size: 52px; margin: 14px 0 12px; line-height: 1.05; }
      .timeline { margin-top: 36px; display: grid; gap: 18px; }
      .item { display: grid; grid-template-columns: 160px 1fr; gap: 24px; background: rgba(255,255,255,.82); border: 1px solid rgba(255,255,255,.6); backdrop-filter: blur(8px); border-radius: 26px; padding: 24px; }
      .time { font-weight: 700; font-size: 24px; }
      .summary { color: #52525b; line-height: 1.7; }
    </style>
  </head>
  <body>
    <div class="page">
      <div class="eyebrow">Executive Session</div>
      <h1>Istanbul Product Summit 2026</h1>
      <p class="summary">Konusmacilar, ara oturumlar ve kapanis yemegi ile tek sayfalik premium etkinlik akisi.</p>
      <section class="timeline">
        <article class="item">
          <div class="time">09:30</div>
          <div><strong>Kayit ve Kahve</strong><div class="summary">Konuk girisi, networking ve acilis muzigi.</div></div>
        </article>
        <article class="item">
          <div class="time">11:00</div>
          <div><strong>Urun Stratejisi Paneli</strong><div class="summary">SaaS ekiplerinde kalite, hiz ve marj dengesi.</div></div>
        </article>
        <article class="item">
          <div class="time">14:15</div>
          <div><strong>AI ile Operasyon Tasarimi</strong><div class="summary">Otomasyon, veri ritmi ve ekip verimliligi icin canli ornekler.</div></div>
        </article>
      </section>
    </div>
  </body>
</html>`,
  },
] as const;
