import { useState, useRef, useCallback, useEffect } from 'react'
import QRCode from 'qrcode'
import { HexColorPicker } from 'react-colorful'
import './App.css'

const QR_TYPES = [
  { id: 'url', label: 'Website', icon: '🌐', desc: 'URL bağlantısı' },
  { id: 'restaurant', label: 'Restoran Menüsü', icon: '🍽️', desc: 'Dijital menü' },
  { id: 'wifi', label: 'WiFi', icon: '📶', desc: 'Ağ bağlantısı' },
  { id: 'vcard', label: 'Kartvizit', icon: '👤', desc: 'Kişi bilgileri' },
  { id: 'whatsapp', label: 'WhatsApp', icon: '💬', desc: 'Mesaj gönder' },
  { id: 'social', label: 'Sosyal Medya', icon: '📱', desc: 'Profil linkleri' },
  { id: 'email', label: 'E-posta', icon: '✉️', desc: 'Mail gönder' },
  { id: 'phone', label: 'Telefon', icon: '📞', desc: 'Ara veya SMS' },
  { id: 'location', label: 'Konum', icon: '📍', desc: 'Harita konumu' },
  { id: 'coupon', label: 'Kupon', icon: '🎫', desc: 'İndirim kuponu' },
  { id: 'text', label: 'Metin', icon: '📝', desc: 'Serbest metin' },
  { id: 'event', label: 'Etkinlik', icon: '📅', desc: 'Takvim etkinliği' },
]

const DOT_STYLES = ['square', 'rounded', 'dots', 'diamond']
const EYE_STYLES = ['square', 'rounded', 'circle', 'leaf']
const FRAME_STYLES = ['none', 'simple', 'rounded', 'shadow']

const COLOR_PRESETS = [
  { fg: '#000000', bg: '#ffffff', label: 'Klasik' },
  { fg: '#1a1a2e', bg: '#e8f4fd', label: 'Gece Mavisi' },
  { fg: '#2d6a4f', bg: '#d8f3dc', label: 'Orman' },
  { fg: '#9b2226', bg: '#fff3e0', label: 'Kırmızı' },
  { fg: '#7b2d8b', bg: '#f3e5f5', label: 'Mor' },
  { fg: '#e76f51', bg: '#fdf0e8', label: 'Turuncu' },
]

const STEPS = ['Tip Seç', 'İçerik', 'Tasarım', 'İndir']

function buildQRContent(type, data) {
  switch (type) {
    case 'url': return data.url || 'https://example.com'
    case 'wifi': return `WIFI:T:${data.security || 'WPA'};S:${data.ssid || ''};P:${data.password || ''};;`
    case 'vcard': return `BEGIN:VCARD\nVERSION:3.0\nFN:${data.name || ''}\nORG:${data.company || ''}\nTEL:${data.phone || ''}\nEMAIL:${data.email || ''}\nURL:${data.website || ''}\nEND:VCARD`
    case 'whatsapp': return `https://wa.me/${(data.phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(data.message || '')}`
    case 'social': {
      const links = [data.instagram, data.twitter, data.linkedin, data.facebook].filter(Boolean)
      return links[0] || 'https://instagram.com'
    }
    case 'email': return `mailto:${data.to || ''}?subject=${encodeURIComponent(data.subject || '')}&body=${encodeURIComponent(data.body || '')}`
    case 'phone': return `tel:${data.phone || ''}`
    case 'location': return `https://maps.google.com/?q=${data.lat || ''},${data.lng || ''}`
    case 'coupon': return `${data.brand || 'Marka'}: ${data.code || 'KOD'} - %${data.discount || '10'} indirim`
    case 'text': return data.text || ''
    case 'event': return `BEGIN:VEVENT\nSUMMARY:${data.title || ''}\nDTSTART:${(data.start || '').replace(/[-:]/g, '')}\nDTEND:${(data.end || '').replace(/[-:]/g, '')}\nLOCATION:${data.location || ''}\nDESCRIPTION:${data.desc || ''}\nEND:VEVENT`
    case 'restaurant': return data.menuUrl || 'https://example.com/menu'
    default: return data.text || ''
  }
}

function TypeStep({ selected, onSelect }) {
  return (
    <div className="step-content">
      <h2 className="step-title">QR Kodu Türünü Seçin</h2>
      <div className="type-grid">
        {QR_TYPES.map(t => (
          <button key={t.id} className={`type-card ${selected === t.id ? 'active' : ''}`} onClick={() => onSelect(t.id)}>
            <span className="type-icon">{t.icon}</span>
            <span className="type-label">{t.label}</span>
            <span className="type-desc">{t.desc}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function ContentStep({ type, data, onChange }) {
  const f = (key) => ({ value: data[key] || '', onChange: e => onChange({ ...data, [key]: e.target.value }) })

  const fields = {
    url: () => (
      <>
        <Field label="Website URL" placeholder="https://ornek.com" {...f('url')} />
      </>
    ),
    restaurant: () => (
      <>
        <Field label="Restoran Adı" placeholder="Lezzet Durağı" {...f('name')} />
        <Field label="Menü URL" placeholder="https://restoran.com/menu" {...f('menuUrl')} />
        <Field label="Adres" placeholder="Bağcılar, İstanbul" {...f('address')} />
        <Field label="Telefon" placeholder="+90 212 000 0000" {...f('phone')} />
      </>
    ),
    wifi: () => (
      <>
        <Field label="Ağ Adı (SSID)" placeholder="EvWifi" {...f('ssid')} />
        <Field label="Şifre" placeholder="••••••••" type="password" {...f('password')} />
        <div className="field">
          <label className="field-label">Güvenlik Tipi</label>
          <select className="field-select" value={data.security || 'WPA'} onChange={e => onChange({ ...data, security: e.target.value })}>
            <option>WPA</option><option>WEP</option><option>nopass</option>
          </select>
        </div>
      </>
    ),
    vcard: () => (
      <>
        <Field label="Ad Soyad" placeholder="Ahmet Yılmaz" {...f('name')} />
        <Field label="Şirket" placeholder="Acme A.Ş." {...f('company')} />
        <Field label="Telefon" placeholder="+90 555 000 0000" {...f('phone')} />
        <Field label="E-posta" placeholder="ahmet@ornek.com" {...f('email')} />
        <Field label="Website" placeholder="https://ahmetyilmaz.com" {...f('website')} />
      </>
    ),
    whatsapp: () => (
      <>
        <Field label="Telefon Numarası" placeholder="+905001234567" {...f('phone')} />
        <Field label="Hazır Mesaj (opsiyonel)" placeholder="Merhaba!" {...f('message')} textarea />
      </>
    ),
    social: () => (
      <>
        <Field label="Instagram" placeholder="https://instagram.com/kullanici" {...f('instagram')} />
        <Field label="Twitter / X" placeholder="https://twitter.com/kullanici" {...f('twitter')} />
        <Field label="LinkedIn" placeholder="https://linkedin.com/in/kullanici" {...f('linkedin')} />
        <Field label="Facebook" placeholder="https://facebook.com/kullanici" {...f('facebook')} />
      </>
    ),
    email: () => (
      <>
        <Field label="E-posta Adresi" placeholder="ornek@mail.com" {...f('to')} />
        <Field label="Konu" placeholder="Merhaba" {...f('subject')} />
        <Field label="Mesaj" placeholder="Mesajınız..." {...f('body')} textarea />
      </>
    ),
    phone: () => (
      <>
        <Field label="Telefon Numarası" placeholder="+90 555 000 0000" {...f('phone')} />
      </>
    ),
    location: () => (
      <>
        <Field label="Enlem (Latitude)" placeholder="41.0082" {...f('lat')} />
        <Field label="Boylam (Longitude)" placeholder="28.9784" {...f('lng')} />
        <p className="field-hint">Google Maps'ten koordinat kopyalayabilirsiniz</p>
      </>
    ),
    coupon: () => (
      <>
        <Field label="Marka / Firma Adı" placeholder="Lezzet Durağı" {...f('brand')} />
        <Field label="Kupon Kodu" placeholder="YAZA2024" {...f('code')} />
        <Field label="İndirim Oranı (%)" placeholder="20" {...f('discount')} />
        <Field label="Son Kullanma Tarihi" type="date" {...f('expiry')} />
      </>
    ),
    text: () => (
      <>
        <Field label="Metin İçeriği" placeholder="İstediğiniz metni girin..." {...f('text')} textarea />
      </>
    ),
    event: () => (
      <>
        <Field label="Etkinlik Adı" placeholder="Yıllık Toplantı" {...f('title')} />
        <Field label="Başlangıç" type="datetime-local" {...f('start')} />
        <Field label="Bitiş" type="datetime-local" {...f('end')} />
        <Field label="Konum" placeholder="İstanbul Kongre Merkezi" {...f('location')} />
        <Field label="Açıklama" placeholder="Etkinlik detayları..." {...f('desc')} textarea />
      </>
    ),
  }

  const render = fields[type]
  return (
    <div className="step-content">
      <h2 className="step-title">İçerik Bilgilerini Girin</h2>
      <div className="fields-container">
        {render ? render() : <Field label="Metin" {...f('text')} textarea />}
      </div>
    </div>
  )
}

function Field({ label, placeholder, value, onChange, type = 'text', textarea, hint }) {
  return (
    <div className="field">
      <label className="field-label">{label}</label>
      {textarea
        ? <textarea className="field-input field-textarea" placeholder={placeholder} value={value} onChange={onChange} rows={3} />
        : <input className="field-input" type={type} placeholder={placeholder} value={value} onChange={onChange} />}
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  )
}

function DesignStep({ design, onChange, qrDataUrl, logoRef, onLogoUpload }) {
  const [activePicker, setActivePicker] = useState(null)

  return (
    <div className="step-content design-layout">
      <div className="design-controls">
        <h2 className="step-title">Tasarımı Özelleştir</h2>

        <section className="design-section">
          <label className="design-section-label">Renk Şablonları</label>
          <div className="preset-colors">
            {COLOR_PRESETS.map(p => (
              <button key={p.label} className="preset-color-btn" title={p.label}
                onClick={() => onChange({ ...design, fgColor: p.fg, bgColor: p.bg })}
                style={{ background: `linear-gradient(135deg, ${p.fg} 50%, ${p.bg} 50%)` }} />
            ))}
          </div>
        </section>

        <section className="design-section">
          <label className="design-section-label">Renkler</label>
          <div className="color-row">
            {[
              { key: 'fgColor', label: 'QR Rengi' },
              { key: 'bgColor', label: 'Arkaplan' },
            ].map(({ key, label }) => (
              <div key={key} className="color-item" onClick={e => e.stopPropagation()}>
                <span className="color-label">{label}</span>
                <div className="color-picker-wrap">
                  <button className="color-swatch" style={{ background: design[key] }}
                    onClick={() => setActivePicker(activePicker === key ? null : key)} />
                  <input className="color-hex" value={design[key]}
                    onChange={e => onChange({ ...design, [key]: e.target.value })} />
                  {activePicker === key && (
                    <div className="picker-popup">
                      <HexColorPicker color={design[key]} onChange={v => onChange({ ...design, [key]: v })} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="design-section">
          <label className="design-section-label">Piksel Şekli</label>
          <div className="shape-tabs">
            {DOT_STYLES.map(s => (
              <button key={s} className={`shape-tab ${design.dotStyle === s ? 'active' : ''}`}
                onClick={() => onChange({ ...design, dotStyle: s })}>
                <DotPreview style={s} color={design.fgColor} />
                <span>{s}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="design-section">
          <label className="design-section-label">Göz Şekli</label>
          <div className="shape-tabs">
            {EYE_STYLES.map(s => (
              <button key={s} className={`shape-tab ${design.eyeStyle === s ? 'active' : ''}`}
                onClick={() => onChange({ ...design, eyeStyle: s })}>
                <EyePreview style={s} color={design.fgColor} />
                <span>{s}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="design-section">
          <label className="design-section-label">Çerçeve</label>
          <div className="choice-tabs">
            {FRAME_STYLES.map(s => (
              <button key={s} className={`choice-tab ${design.frame === s ? 'active' : ''}`}
                onClick={() => onChange({ ...design, frame: s })}>
                {s === 'none' ? 'Yok' : s === 'simple' ? 'Sade' : s === 'rounded' ? 'Yuvarlak' : 'Gölge'}
              </button>
            ))}
          </div>
        </section>

        <section className="design-section">
          <label className="design-section-label">Logo Ekle</label>
          <label className="logo-upload">
            <input type="file" accept="image/*" style={{ display: 'none' }}
              onChange={onLogoUpload} ref={logoRef} />
            <span>📁 Görsel Seç (PNG, SVG)</span>
          </label>
          {design.logo && (
            <div className="logo-preview-row">
              <img src={design.logo} className="logo-thumb" alt="logo" />
              <button className="logo-remove" onClick={() => onChange({ ...design, logo: null })}>✕ Kaldır</button>
            </div>
          )}
        </section>

        <section className="design-section">
          <label className="design-section-label">Çözünürlük</label>
          <div className="choice-tabs">
            {[256, 512, 1024].map(s => (
              <button key={s} className={`choice-tab ${design.size === s ? 'active' : ''}`}
                onClick={() => onChange({ ...design, size: s })}>
                {s}px
              </button>
            ))}
          </div>
        </section>

        <section className="design-section">
          <label className="design-section-label">Hata Düzeltme</label>
          <div className="choice-tabs">
            {[['L','7%'],['M','15%'],['Q','25%'],['H','30%']].map(([l,p]) => (
              <button key={l} className={`choice-tab ec-tab ${design.errorLevel === l ? 'active' : ''}`}
                onClick={() => onChange({ ...design, errorLevel: l })}>
                <b>{l}</b> <small>{p}</small>
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className="qr-preview-panel">
        <label className="design-section-label" style={{ textAlign: 'center', display: 'block', marginBottom: '1rem' }}>Önizleme</label>
        <QRPreview dataUrl={qrDataUrl} design={design} />
      </div>
    </div>
  )
}

function QRPreview({ dataUrl, design }) {
  const frameClass = `qr-frame frame-${design.frame || 'none'}`
  return (
    <div className={frameClass} style={{ background: design.bgColor }}>
      {dataUrl
        ? <img src={dataUrl} alt="QR" className="qr-image" />
        : <div className="qr-placeholder">Oluşturuluyor...</div>}
    </div>
  )
}

function DotPreview({ style, color }) {
  const size = 28
  return (
    <svg width={size} height={size} viewBox="0 0 28 28">
      {[0,1,2].map(r => [0,1,2].map(c => {
        const x = 2 + c * 9, y = 2 + r * 9, s = 7
        if (style === 'dots') return <circle key={`${r}${c}`} cx={x+s/2} cy={y+s/2} r={s/2} fill={color} />
        if (style === 'rounded') return <rect key={`${r}${c}`} x={x} y={y} width={s} height={s} rx={2} fill={color} />
        if (style === 'diamond') return <polygon key={`${r}${c}`} points={`${x+s/2},${y} ${x+s},${y+s/2} ${x+s/2},${y+s} ${x},${y+s/2}`} fill={color} />
        return <rect key={`${r}${c}`} x={x} y={y} width={s} height={s} fill={color} />
      }))}
    </svg>
  )
}

function EyePreview({ style, color }) {
  if (style === 'circle') return (
    <svg width={28} height={28} viewBox="0 0 28 28">
      <circle cx={14} cy={14} r={12} stroke={color} strokeWidth={2.5} fill="none" />
      <circle cx={14} cy={14} r={5} fill={color} />
    </svg>
  )
  if (style === 'rounded') return (
    <svg width={28} height={28} viewBox="0 0 28 28">
      <rect x={2} y={2} width={24} height={24} rx={6} stroke={color} strokeWidth={2.5} fill="none" />
      <rect x={8} y={8} width={12} height={12} rx={3} fill={color} />
    </svg>
  )
  if (style === 'leaf') return (
    <svg width={28} height={28} viewBox="0 0 28 28">
      <rect x={2} y={2} width={24} height={24} rx={0} ry={12} stroke={color} strokeWidth={2.5} fill="none" />
      <rect x={8} y={8} width={12} height={12} fill={color} />
    </svg>
  )
  return (
    <svg width={28} height={28} viewBox="0 0 28 28">
      <rect x={2} y={2} width={24} height={24} stroke={color} strokeWidth={2.5} fill="none" />
      <rect x={8} y={8} width={12} height={12} fill={color} />
    </svg>
  )
}

function DownloadStep({ qrDataUrl, design, qrContent, onDownloadPNG, onDownloadSVG }) {
  return (
    <div className="step-content">
      <h2 className="step-title">QR Kodunuzu İndirin</h2>
      <div className="download-layout">
        <div className="download-preview">
          <QRPreview dataUrl={qrDataUrl} design={design} />
        </div>
        <div className="download-actions">
          <div className="download-info">
            <p>✅ QR kodunuz hazır!</p>
            <p className="muted">Boyut: {design.size}px × {design.size}px</p>
          </div>
          <button className="btn btn-primary big" onClick={onDownloadPNG}>
            ⬇️ PNG İndir
          </button>
          <button className="btn btn-secondary big" onClick={onDownloadSVG}>
            ⬇️ SVG İndir
          </button>
          <div className="qr-content-preview">
            <label className="field-label">QR İçeriği</label>
            <code className="qr-code-text">{qrContent.slice(0, 120)}{qrContent.length > 120 ? '...' : ''}</code>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [step, setStep] = useState(0)
  const [qrType, setQrType] = useState('url')
  const [contentData, setContentData] = useState({ url: 'https://ornek.com' })
  const [design, setDesign] = useState({
    fgColor: '#0f0e17', bgColor: '#fffffe',
    dotStyle: 'square', eyeStyle: 'square',
    frame: 'none', size: 256, errorLevel: 'M', logo: null
  })
  const [qrDataUrl, setQrDataUrl] = useState('')
  const logoRef = useRef(null)

  const qrContent = buildQRContent(qrType, contentData)

  const generateQR = useCallback(async () => {
    if (!qrContent.trim()) return
    try {
      const url = await QRCode.toDataURL(qrContent, {
        width: design.size, margin: 2,
        color: { dark: design.fgColor, light: design.bgColor },
        errorCorrectionLevel: design.errorLevel,
      })
      setQrDataUrl(url)
    } catch (e) { console.error(e) }
  }, [qrContent, design.fgColor, design.bgColor, design.size, design.errorLevel])

  useEffect(() => { generateQR() }, [generateQR])

  const handleLogoUpload = e => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setDesign(d => ({ ...d, logo: ev.target.result }))
    reader.readAsDataURL(file)
  }

  const downloadPNG = () => {
    const a = document.createElement('a')
    a.href = qrDataUrl; a.download = `qr-${qrType}-${Date.now()}.png`; a.click()
  }

  const downloadSVG = async () => {
    try {
      const svg = await QRCode.toString(qrContent, {
        type: 'svg', width: design.size, margin: 2,
        color: { dark: design.fgColor, light: design.bgColor },
        errorCorrectionLevel: design.errorLevel,
      })
      const blob = new Blob([svg], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = `qr-${qrType}-${Date.now()}.svg`; a.click()
      URL.revokeObjectURL(url)
    } catch (e) { console.error(e) }
  }

  const canNext = step === 0 ? !!qrType : step === 1 ? !!qrContent.trim() : step < 3

  return (
    <div className="app" onClick={() => {}}>
      <header className="header">
        <div className="logo">
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
            <rect x="1" y="1" width="10" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.5"/>
            <rect x="15" y="1" width="10" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.5"/>
            <rect x="1" y="15" width="10" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.5"/>
            <rect x="4" y="4" width="4" height="4" rx="1" fill="currentColor"/>
            <rect x="18" y="4" width="4" height="4" rx="1" fill="currentColor"/>
            <rect x="4" y="18" width="4" height="4" rx="1" fill="currentColor"/>
            <rect x="15" y="15" width="4" height="4" rx="1" fill="currentColor"/>
            <rect x="21" y="15" width="4" height="4" rx="1" fill="currentColor"/>
            <rect x="15" y="21" width="4" height="4" rx="1" fill="currentColor"/>
            <rect x="21" y="21" width="4" height="4" rx="1" fill="currentColor"/>
          </svg>
          <span>QR Üretici</span>
        </div>
        <div className="step-indicator">
          {STEPS.map((s, i) => (
            <div key={i} className={`step-dot ${i === step ? 'active' : i < step ? 'done' : ''}`}
              onClick={() => i < step && setStep(i)}>
              <span className="step-num">{i < step ? '✓' : i + 1}</span>
              <span className="step-name">{s}</span>
            </div>
          ))}
        </div>
      </header>

      <main className="main">
        {step === 0 && <TypeStep selected={qrType} onSelect={t => { setQrType(t); setContentData({}) }} />}
        {step === 1 && <ContentStep type={qrType} data={contentData} onChange={setContentData} />}
        {step === 2 && <DesignStep design={design} onChange={setDesign} qrDataUrl={qrDataUrl} logoRef={logoRef} onLogoUpload={handleLogoUpload} />}
        {step === 3 && <DownloadStep qrDataUrl={qrDataUrl} design={design} qrContent={qrContent} onDownloadPNG={downloadPNG} onDownloadSVG={downloadSVG} />}
      </main>

      <footer className="footer">
        <button className="btn btn-ghost" onClick={() => setStep(s => s - 1)} disabled={step === 0}>
          ← Geri
        </button>
        <div className="step-progress">
          <div className="step-progress-bar" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>
        {step < STEPS.length - 1
          ? <button className="btn btn-primary" onClick={() => setStep(s => s + 1)} disabled={!canNext}>
              İleri →
            </button>
          : <button className="btn btn-success" onClick={downloadPNG}>
              ⬇️ PNG İndir
            </button>}
      </footer>
    </div>
  )
}
