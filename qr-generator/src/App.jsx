import { useState, useRef, useCallback } from 'react'
import QRCode from 'qrcode'
import { HexColorPicker } from 'react-colorful'
import './App.css'
import { useEffect } from 'react'

const PRESETS = [
  { label: 'URL', placeholder: 'https://ornek.com', icon: '🔗' },
  { label: 'E-posta', placeholder: 'mailto:ad@ornek.com', icon: '✉️' },
  { label: 'Telefon', placeholder: 'tel:+905001234567', icon: '📞' },
  { label: 'WiFi', placeholder: 'WIFI:T:WPA;S:AgAdi;P:Sifre;;', icon: '📶' },
  { label: 'Metin', placeholder: 'Herhangi bir metin...', icon: '📝' },
]

const SIZES = [128, 256, 512, 1024]

export default function App() {
  const [text, setText] = useState('https://vercel.com')
  const [fgColor, setFgColor] = useState('#0f0e17')
  const [bgColor, setBgColor] = useState('#fffffe')
  const [size, setSize] = useState(256)
  const [errorLevel, setErrorLevel] = useState('M')
  const [activePreset, setActivePreset] = useState(0)
  const [showFgPicker, setShowFgPicker] = useState(false)
  const [showBgPicker, setShowBgPicker] = useState(false)
  const [copied, setCopied] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState('')

  const generateQR = useCallback(async () => {
    if (!text.trim()) return
    try {
      const url = await QRCode.toDataURL(text, {
        width: size,
        margin: 2,
        color: { dark: fgColor, light: bgColor },
        errorCorrectionLevel: errorLevel,
      })
      setQrDataUrl(url)
    } catch (e) {
      console.error(e)
    }
  }, [text, fgColor, bgColor, size, errorLevel])

  useEffect(() => { generateQR() }, [generateQR])

  const downloadPNG = () => {
    const a = document.createElement('a')
    a.href = qrDataUrl
    a.download = `qr-${Date.now()}.png`
    a.click()
  }

  const downloadSVG = async () => {
    try {
      const svg = await QRCode.toString(text, {
        type: 'svg', width: size, margin: 2,
        color: { dark: fgColor, light: bgColor },
        errorCorrectionLevel: errorLevel,
      })
      const blob = new Blob([svg], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `qr-${Date.now()}.svg`; a.click()
      URL.revokeObjectURL(url)
    } catch (e) { console.error(e) }
  }

  const copyToClipboard = async () => {
    try {
      const res = await fetch(qrDataUrl)
      const blob = await res.blob()
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
    } catch {}
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="app" onClick={() => { setShowFgPicker(false); setShowBgPicker(false) }}>
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
      </header>

      <main className="main">
        <div className="panel left-panel">
          <section className="section">
            <label className="section-label">Tip</label>
            <div className="preset-tabs">
              {PRESETS.map((p, i) => (
                <button key={i} className={`preset-tab ${activePreset === i ? 'active' : ''}`}
                  onClick={() => { setActivePreset(i); setText(p.placeholder) }}>
                  <span>{p.icon}</span>{p.label}
                </button>
              ))}
            </div>
          </section>

          <section className="section">
            <label className="section-label">İçerik</label>
            <textarea className="text-input" value={text}
              onChange={e => setText(e.target.value)}
              placeholder={PRESETS[activePreset].placeholder} rows={3} />
          </section>

          <section className="section">
            <label className="section-label">Renkler</label>
            <div className="color-row">
              {[
                { label: 'QR Rengi', color: fgColor, setColor: setFgColor, show: showFgPicker, setShow: setShowFgPicker, closeOther: () => setShowBgPicker(false) },
                { label: 'Arkaplan', color: bgColor, setColor: setBgColor, show: showBgPicker, setShow: setShowBgPicker, closeOther: () => setShowFgPicker(false) },
              ].map(({ label, color, setColor, show, setShow, closeOther }) => (
                <div key={label} className="color-item">
                  <span className="color-label">{label}</span>
                  <div className="color-picker-wrap" onClick={e => e.stopPropagation()}>
                    <button className="color-swatch" style={{ background: color }}
                      onClick={() => { setShow(p => !p); closeOther() }} />
                    <input type="text" value={color} onChange={e => setColor(e.target.value)} className="color-hex" />
                    {show && <div className="picker-popup"><HexColorPicker color={color} onChange={setColor} /></div>}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="section">
            <label className="section-label">Çözünürlük</label>
            <div className="choice-tabs">
              {SIZES.map(s => (
                <button key={s} className={`choice-tab ${size === s ? 'active' : ''}`} onClick={() => setSize(s)}>
                  {s}px
                </button>
              ))}
            </div>
          </section>

          <section className="section">
            <label className="section-label">Hata Düzeltme</label>
            <div className="choice-tabs ec-tabs">
              {[['L','7%'],['M','15%'],['Q','25%'],['H','30%']].map(([l, pct]) => (
                <button key={l} className={`choice-tab ec-tab ${errorLevel === l ? 'active' : ''}`} onClick={() => setErrorLevel(l)}>
                  <span className="ec-letter">{l}</span>
                  <span className="ec-pct">{pct}</span>
                </button>
              ))}
            </div>
          </section>
        </div>

        <div className="panel right-panel">
          <div className="qr-display" style={{ background: bgColor }}>
            {qrDataUrl
              ? <img src={qrDataUrl} alt="QR Kod" className="qr-image" />
              : <div className="qr-placeholder"><span>İçerik girin</span></div>}
          </div>

          <div className="actions">
            <button className="btn btn-primary" onClick={downloadPNG}>
              <DownloadIcon /> PNG İndir
            </button>
            <button className="btn btn-secondary" onClick={downloadSVG}>
              <DownloadIcon /> SVG İndir
            </button>
            <button className="btn btn-ghost" onClick={copyToClipboard}>
              {copied ? <><CheckIcon /> Kopyalandı!</> : <><CopyIcon /> Kopyala</>}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

const DownloadIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M7 1v8M4 6l3 3 3-3M2 11h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="4" y="4" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M4 4V3a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
)
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M2 7l4 4 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
