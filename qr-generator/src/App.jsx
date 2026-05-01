import { useState, useRef, useCallback, useEffect } from 'react'
import QRCode from 'qrcode'
import { HexColorPicker } from 'react-colorful'
import './App.css'

const QR_TYPES = [
  { id: 'url',        label: 'İnternet sitesi', icon: '🌐', desc: 'Web URL bağlantısı' },
  { id: 'pdf',        label: 'PDF',              icon: '📄', desc: 'PDF dosyası göster' },
  { id: 'links',      label: 'Bağlantı Listesi', icon: '🔗', desc: 'Birden fazla link' },
  { id: 'vcard',      label: 'vCard',            icon: '👤', desc: 'Elektronik kartvizit' },
  { id: 'restaurant', label: 'Menü',             icon: '🍽️', desc: 'Restoran dijital menü' },
  { id: 'video',      label: 'Video',            icon: '▶️', desc: 'Video göster' },
  { id: 'images',     label: 'Görseller',        icon: '🖼️', desc: 'Birden fazla görsel' },
  { id: 'facebook',   label: 'Facebook',         icon: '📘', desc: 'Facebook sayfası' },
  { id: 'instagram',  label: 'Instagram',        icon: '📸', desc: 'Instagram profili' },
  { id: 'social',     label: 'Sosyal Medya',     icon: '📱', desc: 'Tüm sosyal kanallar' },
  { id: 'whatsapp',   label: 'WhatsApp',         icon: '💬', desc: 'Mesaj gönder' },
  { id: 'mp3',        label: 'MP3',              icon: '🎵', desc: 'Ses dosyası paylaş' },
  { id: 'menu',       label: 'Menü QR',          icon: '📋', desc: 'Restoran menüsü oluştur' },
  { id: 'app',        label: 'Uygulamalar',      icon: '📲', desc: 'App mağazasına yönlendir' },
  { id: 'coupon',     label: 'Kupon',            icon: '🎫', desc: 'İndirim kuponu paylaş' },
  { id: 'wifi',       label: 'WiFi',             icon: '📶', desc: 'Wi-Fi ağına bağlan' },
  { id: 'business',   label: 'İşletme',          icon: '🏢', desc: 'İşletme bilgileri' },
  { id: 'event',      label: 'Etkinlik',         icon: '📅', desc: 'Takvim etkinliği' },
  { id: 'email',      label: 'E-posta',          icon: '✉️', desc: 'E-posta gönder' },
  { id: 'phone',      label: 'Telefon',          icon: '📞', desc: 'Ara veya SMS' },
  { id: 'location',   label: 'Konum',            icon: '📍', desc: 'Google Harita konumu' },
  { id: 'text',       label: 'Metin',            icon: '📝', desc: 'Serbest metin' },
]

const DOT_STYLES = [
  { id: 'square',   label: 'Kare' },
  { id: 'rounded',  label: 'Yuvarlak' },
  { id: 'dots',     label: 'Nokta' },
  { id: 'diamond',  label: 'Elmas' },
]
const EYE_STYLES = [
  { id: 'square',   label: 'Kare' },
  { id: 'rounded',  label: 'Yuvarlak' },
  { id: 'circle',   label: 'Daire' },
  { id: 'leaf',     label: 'Yaprak' },
]
const COLOR_PRESETS = [
  { fg: '#000000', bg: '#ffffff' },
  { fg: '#1a3c5e', bg: '#e8f4fd' },
  { fg: '#1a7a4a', bg: '#e8f8ee' },
  { fg: '#8b1a1a', bg: '#fdeaea' },
  { fg: '#6a1a8b', bg: '#f5eafd' },
  { fg: '#b85c00', bg: '#fdf2e8' },
]

function buildQRContent(type, data) {
  switch (type) {
    case 'url': return data.url || 'https://example.com'
    case 'wifi': return `WIFI:T:${data.security||'WPA'};S:${data.ssid||''};P:${data.password||''};;`
    case 'vcard': return `BEGIN:VCARD\nVERSION:3.0\nFN:${data.name||''}\nORG:${data.company||''}\nTEL:${data.phone||''}\nEMAIL:${data.email||''}\nURL:${data.website||''}\nADR:;;${data.address||''};;;;\nEND:VCARD`
    case 'whatsapp': return `https://wa.me/${(data.phone||'').replace(/\D/g,'')}?text=${encodeURIComponent(data.message||'')}`
    case 'social': return data.instagram || data.twitter || data.linkedin || data.facebook || 'https://instagram.com'
    case 'facebook': return data.url || 'https://facebook.com'
    case 'instagram': return data.url || 'https://instagram.com'
    case 'email': return `mailto:${data.to||''}?subject=${encodeURIComponent(data.subject||'')}&body=${encodeURIComponent(data.body||'')}`
    case 'phone': return `tel:${data.phone||''}`
    case 'location': return `https://maps.google.com/?q=${data.lat||''},${data.lng||''}`
    case 'coupon': return `${data.brand||''}: ${data.code||''} - %${data.discount||'10'} indirim. Son tarih: ${data.expiry||''}`
    case 'text': return data.text || ''
    case 'event': return `BEGIN:VEVENT\nSUMMARY:${data.title||''}\nDTSTART:${(data.start||'').replace(/[-:T]/g,'')}\nDTEND:${(data.end||'').replace(/[-:T]/g,'')}\nLOCATION:${data.location||''}\nDESCRIPTION:${data.desc||''}\nEND:VEVENT`
    case 'restaurant': case 'menu': return data.menuUrl || data.url || 'https://example.com/menu'
    case 'business': return `BEGIN:VCARD\nVERSION:3.0\nFN:${data.name||''}\nORG:${data.company||''}\nTEL:${data.phone||''}\nEMAIL:${data.email||''}\nURL:${data.website||''}\nADR:;;${data.address||''};;;;\nEND:VCARD`
    case 'pdf': case 'video': case 'images': case 'mp3': case 'app': case 'links':
      return data.url || 'https://example.com'
    default: return data.text || data.url || ''
  }
}

function Field({ label, placeholder, value, onChange, type='text', textarea, hint, children }) {
  return (
    <div className="field">
      <label className="field-label">{label}</label>
      {children ? children : textarea
        ? <textarea className="field-input field-textarea" placeholder={placeholder} value={value||''} onChange={onChange} rows={3}/>
        : <input className="field-input" type={type} placeholder={placeholder} value={value||''} onChange={onChange}/>}
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  )
}

function ContentForm({ type, data, onChange }) {
  const f = key => ({ value: data[key]||'', onChange: e => onChange({...data,[key]:e.target.value}) })
  const forms = {
    url: () => <Field label="Website URL *" placeholder="https://ornek.com" {...f('url')}/>,
    pdf: () => <Field label="PDF URL" placeholder="https://ornek.com/dosya.pdf" {...f('url')}/>,
    links: () => (<>
      <Field label="Başlık" placeholder="Linklerim" {...f('title')}/>
      <Field label="Link 1" placeholder="https://ornek.com" {...f('url')}/>
      <Field label="Link 2" placeholder="https://ornek2.com" {...f('url2')}/>
    </>),
    vcard: () => (<>
      <Field label="Ad Soyad *" placeholder="Ahmet Yılmaz" {...f('name')}/>
      <Field label="Şirket" placeholder="Acme A.Ş." {...f('company')}/>
      <Field label="Unvan" placeholder="Yazılım Geliştirici" {...f('title')}/>
      <Field label="Telefon" placeholder="+90 555 000 0000" {...f('phone')}/>
      <Field label="E-posta" placeholder="ahmet@ornek.com" {...f('email')}/>
      <Field label="Website" placeholder="https://ornek.com" {...f('website')}/>
      <Field label="Adres" placeholder="Beşiktaş, İstanbul" {...f('address')}/>
    </>),
    restaurant: () => (<>
      <Field label="Restoran Adı *" placeholder="Lezzet Durağı" {...f('name')}/>
      <Field label="Menü URL *" placeholder="https://restoran.com/menu" {...f('menuUrl')}/>
      <Field label="Adres" placeholder="Kadıköy, İstanbul" {...f('address')}/>
      <Field label="Telefon" placeholder="+90 212 000 0000" {...f('phone')}/>
      <Field label="Açıklama" placeholder="Günlük taze yemekler..." {...f('desc')} textarea/>
    </>),
    wifi: () => (<>
      <Field label="Ağ Adı (SSID) *" placeholder="EvWifi" {...f('ssid')}/>
      <Field label="Şifre" placeholder="••••••••" type="password" {...f('password')}/>
      <Field label="Güvenlik Tipi">
        <select className="field-input" value={data.security||'WPA'} onChange={e=>onChange({...data,security:e.target.value})}>
          <option>WPA</option><option>WEP</option><option value="nopass">Şifresiz</option>
        </select>
      </Field>
    </>),
    whatsapp: () => (<>
      <Field label="Telefon Numarası *" placeholder="+905001234567" {...f('phone')} hint="Ülke kodu ile birlikte girin"/>
      <Field label="Hazır Mesaj" placeholder="Merhaba! Size ulaşmak istedim." {...f('message')} textarea/>
    </>),
    facebook: () => <Field label="Facebook Sayfa URL *" placeholder="https://facebook.com/sayfaniz" {...f('url')}/>,
    instagram: () => <Field label="Instagram Profil URL *" placeholder="https://instagram.com/kullanici" {...f('url')}/>,
    social: () => (<>
      <Field label="Instagram" placeholder="https://instagram.com/kullanici" {...f('instagram')}/>
      <Field label="Twitter / X" placeholder="https://twitter.com/kullanici" {...f('twitter')}/>
      <Field label="LinkedIn" placeholder="https://linkedin.com/in/kullanici" {...f('linkedin')}/>
      <Field label="Facebook" placeholder="https://facebook.com/kullanici" {...f('facebook')}/>
      <Field label="YouTube" placeholder="https://youtube.com/@kanal" {...f('youtube')}/>
    </>),
    email: () => (<>
      <Field label="Alıcı E-posta *" placeholder="ornek@mail.com" {...f('to')}/>
      <Field label="Konu" placeholder="Merhaba" {...f('subject')}/>
      <Field label="Mesaj" placeholder="Mesajınız..." {...f('body')} textarea/>
    </>),
    phone: () => <Field label="Telefon Numarası *" placeholder="+90 555 000 0000" {...f('phone')}/>,
    location: () => (<>
      <Field label="Enlem" placeholder="41.0082" {...f('lat')}/>
      <Field label="Boylam" placeholder="28.9784" {...f('lng')} hint="Google Maps'ten koordinat kopyalayabilirsiniz"/>
    </>),
    coupon: () => (<>
      <Field label="Marka / Firma *" placeholder="Lezzet Durağı" {...f('brand')}/>
      <Field label="Kupon Kodu *" placeholder="YAZA2024" {...f('code')}/>
      <Field label="İndirim Oranı (%)" placeholder="20" {...f('discount')}/>
      <Field label="Son Kullanma Tarihi" type="date" {...f('expiry')}/>
      <Field label="Açıklama" placeholder="Minimum 100 TL alışveriş..." {...f('desc')} textarea/>
    </>),
    event: () => (<>
      <Field label="Etkinlik Adı *" placeholder="Yıllık Toplantı" {...f('title')}/>
      <Field label="Başlangıç" type="datetime-local" {...f('start')}/>
      <Field label="Bitiş" type="datetime-local" {...f('end')}/>
      <Field label="Konum" placeholder="İstanbul Kongre Merkezi" {...f('location')}/>
      <Field label="Açıklama" placeholder="Etkinlik detayları..." {...f('desc')} textarea/>
    </>),
    business: () => (<>
      <Field label="İşletme Adı *" placeholder="Lezzet Durağı" {...f('name')}/>
      <Field label="Kategori" placeholder="Restoran, Kafe..." {...f('company')}/>
      <Field label="Telefon" placeholder="+90 212 000 0000" {...f('phone')}/>
      <Field label="E-posta" placeholder="info@isletme.com" {...f('email')}/>
      <Field label="Website" placeholder="https://isletme.com" {...f('website')}/>
      <Field label="Adres" placeholder="Beşiktaş, İstanbul" {...f('address')}/>
    </>),
    text: () => <Field label="Metin *" placeholder="İstediğiniz metni girin..." {...f('text')} textarea/>,
    mp3: () => <Field label="MP3 / Ses URL" placeholder="https://ornek.com/muzik.mp3" {...f('url')}/>,
    video: () => <Field label="Video URL" placeholder="https://youtube.com/watch?v=..." {...f('url')}/>,
    images: () => <Field label="Galeri / Görsel URL" placeholder="https://ornek.com/galeri" {...f('url')}/>,
    app: () => (<>
      <Field label="App Store URL" placeholder="https://apps.apple.com/..." {...f('ios')}/>
      <Field label="Google Play URL" placeholder="https://play.google.com/..." {...f('android')}/>
    </>),
    menu: () => (<>
      <Field label="Menü URL *" placeholder="https://ornek.com/menu" {...f('menuUrl')}/>
      <Field label="İşletme Adı" placeholder="Restoran Adı" {...f('name')}/>
    </>),
  }
  const render = forms[type]
  return (
    <div className="fields-container">
      {render ? render() : <Field label="URL" placeholder="https://ornek.com" {...f('url')}/>}
    </div>
  )
}

function DotSVG({ style, color='#111' }) {
  const cells = [[0,0],[0,1],[0,2],[1,0],[1,1],[1,2],[2,0],[2,1],[2,2]]
  return (
    <svg width={32} height={32} viewBox="0 0 32 32">
      {cells.map(([r,c]) => {
        const x=2+c*10, y=2+r*10, s=8
        if(style==='dots') return <circle key={`${r}${c}`} cx={x+s/2} cy={y+s/2} r={s/2-0.5} fill={color}/>
        if(style==='rounded') return <rect key={`${r}${c}`} x={x} y={y} width={s} height={s} rx={2.5} fill={color}/>
        if(style==='diamond') return <polygon key={`${r}${c}`} points={`${x+s/2},${y} ${x+s},${y+s/2} ${x+s/2},${y+s} ${x},${y+s/2}`} fill={color}/>
        return <rect key={`${r}${c}`} x={x} y={y} width={s} height={s} fill={color}/>
      })}
    </svg>
  )
}
function EyeSVG({ style, color='#111' }) {
  if(style==='circle') return <svg width={32} height={32} viewBox="0 0 32 32"><circle cx={16} cy={16} r={13} stroke={color} strokeWidth={3} fill="none"/><circle cx={16} cy={16} r={5} fill={color}/></svg>
  if(style==='rounded') return <svg width={32} height={32} viewBox="0 0 32 32"><rect x={2} y={2} width={28} height={28} rx={8} stroke={color} strokeWidth={3} fill="none"/><rect x={9} y={9} width={14} height={14} rx={4} fill={color}/></svg>
  if(style==='leaf') return <svg width={32} height={32} viewBox="0 0 32 32"><rect x={2} y={2} width={28} height={28} rx={14} ry={2} stroke={color} strokeWidth={3} fill="none"/><rect x={9} y={9} width={14} height={14} fill={color}/></svg>
  return <svg width={32} height={32} viewBox="0 0 32 32"><rect x={2} y={2} width={28} height={28} stroke={color} strokeWidth={3} fill="none"/><rect x={9} y={9} width={14} height={14} fill={color}/></svg>
}

export default function App() {
  const [step, setStep] = useState(0) // 0=type,1=content,2=design
  const [qrType, setQrType] = useState('url')
  const [contentData, setContentData] = useState({ url: 'https://vercel.com' })
  const [design, setDesign] = useState({
    fgColor:'#1a7a4a', bgColor:'#ffffff',
    dotStyle:'square', eyeStyle:'square',
    size:256, errorLevel:'M', logo:null
  })
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [activePicker, setActivePicker] = useState(null)
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
    } catch(e) { console.error(e) }
  }, [qrContent, design.fgColor, design.bgColor, design.size, design.errorLevel])

  useEffect(() => { generateQR() }, [generateQR])

  const handleLogoUpload = e => {
    const file = e.target.files[0]; if(!file) return
    const reader = new FileReader()
    reader.onload = ev => setDesign(d=>({...d, logo:ev.target.result}))
    reader.readAsDataURL(file)
  }

  const downloadPNG = () => {
    const a = document.createElement('a')
    a.href = qrDataUrl; a.download = `qr-${qrType}.png`; a.click()
  }
  const downloadSVG = async () => {
    const svg = await QRCode.toString(qrContent, {
      type:'svg', width:design.size, margin:2,
      color:{dark:design.fgColor,light:design.bgColor},
      errorCorrectionLevel:design.errorLevel,
    })
    const blob = new Blob([svg],{type:'image/svg+xml'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href=url; a.download=`qr-${qrType}.svg`; a.click()
    URL.revokeObjectURL(url)
  }

  const STEPS = ['QR kodu türü','İçerik','QR tasarımı']
  const activeType = QR_TYPES.find(t=>t.id===qrType)

  return (
    <div className="app" onClick={()=>setActivePicker(null)}>
      {/* HEADER */}
      <header className="header">
        <div className="brand">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect x="2" y="2" width="12" height="12" rx="2" fill="#1a7a4a"/>
            <rect x="18" y="2" width="12" height="12" rx="2" fill="#1a7a4a"/>
            <rect x="2" y="18" width="12" height="12" rx="2" fill="#1a7a4a"/>
            <rect x="5" y="5" width="6" height="6" rx="1" fill="white"/>
            <rect x="21" y="5" width="6" height="6" rx="1" fill="white"/>
            <rect x="5" y="21" width="6" height="6" rx="1" fill="white"/>
            <rect x="18" y="18" width="5" height="5" rx="1" fill="#1a7a4a"/>
            <rect x="25" y="18" width="5" height="5" rx="1" fill="#1a7a4a"/>
            <rect x="18" y="25" width="5" height="5" rx="1" fill="#1a7a4a"/>
            <rect x="25" y="25" width="5" height="5" rx="1" fill="#1a7a4a"/>
          </svg>
          <div>
            <div className="brand-name">Online</div>
            <div className="brand-sub">QR Generator</div>
          </div>
        </div>
        <nav className="wizard-nav">
          {STEPS.map((s,i)=>(
            <div key={i} className={`wizard-step ${i===step?'active':i<step?'done':''}`}
              onClick={()=>i<step&&setStep(i)}>
              <div className="wizard-num">{i<step?'✓':i+1}</div>
              <span>{s}</span>
              {i<STEPS.length-1&&<div className="wizard-arrow">→</div>}
            </div>
          ))}
        </nav>
        <div className="header-actions">
          <button className="btn-outline-sm">Giriş Yap</button>
          <button className="btn-green-sm">Ücretsiz Kayıt</button>
        </div>
      </header>

      <div className="layout">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <p className="sidebar-title">QR Kod Türleri</p>
          {QR_TYPES.map(t=>(
            <button key={t.id}
              className={`sidebar-item ${qrType===t.id?'active':''}`}
              onClick={()=>{setQrType(t.id);setContentData({});setStep(1)}}>
              <span className="sidebar-icon">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </aside>

        {/* MAIN CONTENT */}
        <main className="content">
          {/* Step 0: Type selection */}
          {step===0 && (
            <div className="panel">
              <h2 className="panel-title">Bir QR kodu türü seçin</h2>
              <div className="type-grid">
                {QR_TYPES.map(t=>(
                  <button key={t.id}
                    className={`type-card ${qrType===t.id?'active':''}`}
                    onClick={()=>{setQrType(t.id);setContentData({});setStep(1)}}>
                    <span className="type-icon">{t.icon}</span>
                    <span className="type-label">{t.label}</span>
                    <span className="type-desc">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Content */}
          {step===1 && (
            <div className="panel">
              <div className="panel-header">
                <span className="panel-type-badge">{activeType?.icon} {activeType?.label}</span>
                <h2 className="panel-title">İçerik Bilgilerini Girin</h2>
              </div>
              <ContentForm type={qrType} data={contentData} onChange={setContentData}/>
            </div>
          )}

          {/* Step 2: Design */}
          {step===2 && (
            <div className="panel">
              <h2 className="panel-title">QR Tasarımını Özelleştir</h2>
              <div className="design-grid">
                {/* Color presets */}
                <div className="design-block">
                  <label className="block-label">Renk Şablonları</label>
                  <div className="presets-row">
                    {COLOR_PRESETS.map((p,i)=>(
                      <button key={i} className="preset-swatch"
                        style={{background:`linear-gradient(135deg,${p.fg} 50%,${p.bg} 50%)`}}
                        onClick={()=>setDesign(d=>({...d,fgColor:p.fg,bgColor:p.bg}))}/>
                    ))}
                  </div>
                </div>

                {/* Colors */}
                <div className="design-block">
                  <label className="block-label">Renkler</label>
                  <div className="color-row" onClick={e=>e.stopPropagation()}>
                    {[['fgColor','QR Rengi'],['bgColor','Arkaplan']].map(([key,label])=>(
                      <div key={key} className="color-item">
                        <span className="color-lbl">{label}</span>
                        <div className="color-picker-wrap">
                          <button className="c-swatch" style={{background:design[key]}}
                            onClick={()=>setActivePicker(activePicker===key?null:key)}/>
                          <input className="c-hex" value={design[key]}
                            onChange={e=>setDesign(d=>({...d,[key]:e.target.value}))}/>
                          {activePicker===key&&(
                            <div className="picker-popup" onClick={e=>e.stopPropagation()}>
                              <HexColorPicker color={design[key]} onChange={v=>setDesign(d=>({...d,[key]:v}))}/>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dot style */}
                <div className="design-block">
                  <label className="block-label">Piksel Şekli</label>
                  <div className="style-row">
                    {DOT_STYLES.map(s=>(
                      <button key={s.id} className={`style-btn ${design.dotStyle===s.id?'active':''}`}
                        onClick={()=>setDesign(d=>({...d,dotStyle:s.id}))}>
                        <DotSVG style={s.id} color={design.dotStyle===s.id?design.fgColor:'#999'}/>
                        <span>{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Eye style */}
                <div className="design-block">
                  <label className="block-label">Göz Şekli</label>
                  <div className="style-row">
                    {EYE_STYLES.map(s=>(
                      <button key={s.id} className={`style-btn ${design.eyeStyle===s.id?'active':''}`}
                        onClick={()=>setDesign(d=>({...d,eyeStyle:s.id}))}>
                        <EyeSVG style={s.id} color={design.eyeStyle===s.id?design.fgColor:'#999'}/>
                        <span>{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Logo */}
                <div className="design-block">
                  <label className="block-label">Logo Ekle</label>
                  <label className="logo-upload-btn">
                    <input type="file" accept="image/*" style={{display:'none'}} onChange={handleLogoUpload} ref={logoRef}/>
                    <span>📁 Görsel Seç (PNG, SVG)</span>
                  </label>
                  {design.logo && (
                    <div className="logo-row">
                      <img src={design.logo} className="logo-thumb" alt="logo"/>
                      <button className="logo-remove" onClick={()=>setDesign(d=>({...d,logo:null}))}>✕ Kaldır</button>
                    </div>
                  )}
                </div>

                {/* Resolution */}
                <div className="design-block">
                  <label className="block-label">Çözünürlük</label>
                  <div className="tab-row">
                    {[256,512,1024].map(s=>(
                      <button key={s} className={`tab-btn ${design.size===s?'active':''}`}
                        onClick={()=>setDesign(d=>({...d,size:s}))}>{s}px</button>
                    ))}
                  </div>
                </div>

                {/* Error correction */}
                <div className="design-block">
                  <label className="block-label">Hata Düzeltme</label>
                  <div className="tab-row">
                    {[['L','7%'],['M','15%'],['Q','25%'],['H','30%']].map(([l,p])=>(
                      <button key={l} className={`tab-btn ec ${design.errorLevel===l?'active':''}`}
                        onClick={()=>setDesign(d=>({...d,errorLevel:l}))}>
                        <b>{l}</b><small>{p}</small>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="nav-bar">
            <button className="btn-back" onClick={()=>setStep(s=>Math.max(0,s-1))} disabled={step===0}>
              ← Geri
            </button>
            <div className="nav-steps">
              {[0,1,2].map(i=>(
                <div key={i} className={`nav-dot ${i===step?'active':i<step?'done':''}`}
                  onClick={()=>i<step&&setStep(i)}/>
              ))}
            </div>
            {step<2
              ? <button className="btn-next" onClick={()=>setStep(s=>s+1)}>İleri →</button>
              : <button className="btn-next" onClick={downloadPNG}>⬇ PNG İndir</button>}
          </div>
        </main>

        {/* RIGHT: QR PREVIEW */}
        <aside className="preview-panel">
          <div className="preview-tabs">
            <button className="preview-tab active">Önizleme</button>
            <button className="preview-tab">QR kod</button>
          </div>
          {/* Phone mockup */}
          <div className="phone-frame">
            <div className="phone-screen" style={{background:design.bgColor}}>
              <div className="phone-content">
                {activeType && (
                  <div className="phone-header" style={{background:'#1a7a4a'}}>
                    <span style={{fontSize:24}}>{activeType.icon}</span>
                    <p style={{color:'white',fontWeight:600,fontSize:13,marginTop:4}}>{contentData.name || contentData.title || activeType.label}</p>
                  </div>
                )}
                <div className="phone-qr">
                  {qrDataUrl
                    ? <img src={qrDataUrl} alt="QR" style={{width:'100%',imageRendering:'pixelated'}}/>
                    : <div className="phone-qr-placeholder">QR oluşturuluyor...</div>}
                </div>
                {contentData.desc && <p className="phone-desc">{contentData.desc}</p>}
              </div>
            </div>
            <div className="phone-notch"/>
          </div>

          {/* Download buttons */}
          <div className="download-btns">
            <button className="btn-dl-green" onClick={downloadPNG}>⬇ PNG İndir</button>
            <button className="btn-dl-outline" onClick={downloadSVG}>⬇ SVG İndir</button>
          </div>
        </aside>
      </div>
    </div>
  )
}
