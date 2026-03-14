# Premium HTML to PDF

Turkce odakli, premium tasarimli bir Next.js uygulamasi. Kullanici HTML yapistirarak veya public bir URL vererek PDF indirebilir.

## Ozellikler

- HTML editor + canli sanitize onizleme
- Public URL to PDF akisi
- Browserless PDF proxy entegrasyonu
- Cloudflare Turnstile dogrulamasi
- IP bazli rate-limit ve aktif donusum kilidi
- Docker ve Render deployment dosyalari
- Vitest ve Playwright testleri

## Teknoloji

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS v4
- Monaco Editor
- Zod
- ioredis

## Yerel calistirma

1. Bagimliliklari kurun:

```bash
pnpm install
```

2. Ortam dosyasini hazirlayin:

```bash
cp .env.example .env.local
```

3. Gerekli degiskenleri doldurun:

- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`
- `BROWSERLESS_TOKEN`
- `REDIS_URL`

Not: Turnstile secret yoksa gelistirme modunda local bypass aktif kalir.

4. Uygulamayi baslatin:

```bash
pnpm dev
```

## Scriptler

```bash
pnpm lint
pnpm test
pnpm test:e2e
pnpm build
```

## API

### `POST /api/v1/pdf-conversions`

HTML veya public URL kaynagindan PDF uretir.

Istek govdesi:

```json
{
  "source": {
    "type": "html",
    "html": "<h1>Merhaba</h1>"
  },
  "options": {
    "format": "A4",
    "orientation": "portrait",
    "marginMm": 12,
    "printBackground": true,
    "preferCssPageSize": false,
    "scale": 1
  },
  "turnstileToken": "token"
}
```

### `GET /api/v1/health`

Health-check ve konfigurasyon durumu dondurur.

## Deployment

- Docker image: [Dockerfile](./Dockerfile)
- Render blueprint: [render.yaml](./render.yaml)
- Env ornegi: [.env.example](./.env.example)

Render uzerinde bir web service ve bir key-value instance ile calisacak sekilde hazirlanmistir.
