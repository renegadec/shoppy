import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#052e1a',
          color: 'white',
          padding: 64,
          fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 54, fontWeight: 800, letterSpacing: -1 }}>
            shoppy<span style={{ color: '#34d399' }}>.co.zw</span>
          </div>
          <div style={{ fontSize: 22, opacity: 0.9 }}>Pay with EcoCash or Crypto</div>
        </div>

        <div>
          <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.05, letterSpacing: -1 }}>
            Digital products
            <br />
            Airtime &amp; ZESA
            <br />
            Event tickets
          </div>
          <div style={{ marginTop: 20, fontSize: 28, opacity: 0.9 }}>
            Fast checkout • Zimbabwe services • Secure payments
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {['EcoCash', 'USDT', 'BTC', 'ETH'].map((t) => (
            <div
              key={t}
              style={{
                padding: '10px 18px',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.16)',
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              {t}
            </div>
          ))}
        </div>
      </div>
    ),
    size
  )
}
