import { useState, useRef, useCallback, useEffect } from 'react'
import QRCode from 'qrcode'
import { HexColorPicker } from 'react-colorful'
import './App.css'

const QR_TYPES = [
  { id:'url',        label:'İnternet sitesi',   icon:'🌐', desc:'Herhangi bir web sitesi URL\'sine bağlantı' },
  { id:'pdf',        label:'PDF',                icon:'📄', desc:'PDF göster' },
  { id:'links',      label:'Bağlantıların Listesi', icon:'🔗', desc:'Birden fazla bağlantı paylaşın' },
  { id:'vcard',      label:'vCard',              icon:'👤', desc:'Elektronik kartvizitinizi paylaşın' },
  { id:'business',   label:'İşletme',            icon:'🏢', desc:'İşletmenizle ilgili bilgileri paylaşın' },
  { id:'video',      label:'Video',              icon:'▶️', desc:'Bir video göster' },
  { id:'images',     label:'Görseller',          icon:'🖼️', desc:'Birden fazla görsel paylaşın' },
  { id:'facebook',   label:'Facebook',           icon:'📘', desc:'Facebook sayfanızı paylaşın' },
  { id:'instagram',  label:'Instagram',          icon:'📸', desc:'Instagram\'ınızı paylaşın' },
  { id:'social',     label:'Sosyal medya',       icon:'📱', desc:'Sosyal kanallarınızı paylaşın' },
  { id:'whatsapp',   label:'WhatsApp',           icon:'💬', desc:'WhatsApp mesajlarını alın' },
  { id:'mp3',        label:'MP3',                icon:'🎵', desc:'Bir ses dosyası paylaş' },
  { id:'menu',       label:'Menü',               icon:'🍽️', desc:'Bir restoran menüsü oluşturun' },
  { id:'app',        label:'Uygulamalar',        icon:'📲', desc:'Uygulama mağazasına yönlendirin' },
  { id:'coupon',     label:'Kupon',              icon:'🎫', desc:'Kupon paylaşın' },
  { id:'wifi',       label:'Wifi',               icon:'📶', desc:'Bir Wi-Fi ağına bağlanın' },
  { id:'event',      label:'Etkinlik',           icon:'📅', desc:'Etkinlik paylaşın' },
  { id:'email',      label:'E-posta',            icon:'✉️', desc:'E-posta gönderin' },
  { id:'phone',      label:'Telefon',            icon:'📞', desc:'Telefon numarası' },
  { id:'location',   label:'Konum',              icon:'📍', desc:'Konum paylaşın' },
  { id:'text',       label:'Metin',              icon:'📝', desc:'Düz metin paylaşın' },
]

const DOT_STYLES = [
  { id:'square',  label:'Kare' },
  { id:'rounded', label:'Yuvarlak' },
  { id:'dots',    label:'Nokta' },
  { id:'diamond', label:'Elmas' },
]
const EYE_STYLES = [
  { id:'square',  label:'Kare' },
  { id:'rounded', label:'Yuvarlak' },
  { id:'circle',  label:'Daire' },
  { id:'leaf',    label:'Yaprak' },
]
const COLOR_PRESETS = [
  { fg:'#000000', bg:'#ffffff' },
  { fg:'#1a7a4a', bg:'#e8f8ee' },
  { fg:'#1a3c8b', bg:'#e8eeff' },
  { fg:'#8b1a1a', bg:'#fdeaea' },
  { fg:'#7b2d8b', bg:'#f5eafd' },
  { fg:'#b85c00', bg:'#fdf2e8' },
]

function buildQRContent(type, data) {
  switch(type) {
    case 'url': case 'pdf': case 'video': case 'images': case 'mp3':
      return data.url || 'https://example.com'
    case 'links': return data.url || 'https://example.com'
    case 'wifi': return `WIFI:T:${data.security||'WPA'};S:${data.ssid||''};P:${data.password||''};;`
    case 'vcard': return `BEGIN:VCARD\nVERSION:3.0\nFN:${data.name||''}\nORG:${data.company||''}\nTEL:${data.phone||''}\nEMAIL:${data.email||''}\nURL:${data.website||''}\nADR:;;${data.address||''};;;;\nEND:VCARD`
    case 'whatsapp': return `https://wa.me/${(data.phone||'').replace(/\D/g,'')}?text=${encodeURIComponent(data.message||'')}`
    case 'facebook': case 'instagram': return data.url || 'https://instagram.com'
    case 'social': return data.instagram||data.twitter||data.linkedin||data.facebook||'https://instagram.com'
    case 'email': return `mailto:${data.to||''}?subject=${encodeURIComponent(data.subject||'')}&body=${encodeURIComponent(data.body||'')}`
    case 'phone': return `tel:${data.phone||''}`
    case 'location': return `https://maps.google.com/?q=${data.lat||''},${data.lng||''}`
    case 'coupon': return `${data.brand||''}: %${data.discount||'10'} indirim - Kod: ${data.code||''}`
    case 'event': return `BEGIN:VEVENT\nSUMMARY:${data.title||''}\nDTSTART:${(data.start||'').replace(/[-:T]/g,'')}\nDTEND:${(data.end||'').replace(/[-:T]/g,'')}\nLOCATION:${data.location||''}\nDESCRIPTION:${data.desc||''}\nEND:VEVENT`
    case 'menu': case 'business': return data.url||data.menuUrl||'https://example.com'
    case 'app': return data.android||data.ios||'https://play.google.com'
    default: return data.text||data.url||''
  }
}

function Field({ label, placeholder, value, onChange, type='text', textarea, hint, children }) {
  return (
    <div className="field">
      <label className="field-label">{label}</label>
      {children ? children
        : textarea
          ? <textarea className="field-input field-textarea" placeholder={placeholder} value={value||''} onChange={onChange} rows={3}/>
          : <input className="field-input" type={type} placeholder={placeholder} value={value||''} onChange={onChange}/>}
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  )
}

function ContentForm({ type, data, onChange }) {
  const f = k => ({ value: data[k]||'', onChange: e => onChange({...data,[k]:e.target.value}) })
  const forms = {
    url:       ()=><><Field label="Website URL *" placeholder="https://ornek.com" {...f('url')}/></>,
    pdf:       ()=><><Field label="PDF Linki *" placeholder="https://ornek.com/dosya.pdf" {...f('url')}/></>,
    video:     ()=><><Field label="Video URL *" placeholder="https://youtube.com/watch?v=..." {...f('url')}/></>,
    mp3:       ()=><><Field label="MP3 / Ses URL *" placeholder="https://ornek.com/muzik.mp3" {...f('url')}/></>,
    images:    ()=><><Field label="Galeri URL *" placeholder="https://ornek.com/galeri" {...f('url')}/></>,
    links:     ()=><><Field label="Başlık" placeholder="Linklerim" {...f('title')}/><Field label="Link 1 *" placeholder="https://ornek.com" {...f('url')}/><Field label="Link 2" placeholder="https://ornek2.com" {...f('url2')}/><Field label="Link 3" placeholder="https://ornek3.com" {...f('url3')}/></>,
    vcard:     ()=><><Field label="Ad Soyad *" placeholder="Ahmet Yılmaz" {...f('name')}/><Field label="Şirket" placeholder="Acme A.Ş." {...f('company')}/><Field label="Unvan" placeholder="Yazılım Geliştirici" {...f('title')}/><Field label="Telefon" placeholder="+90 555 000 0000" {...f('phone')}/><Field label="E-posta" placeholder="ahmet@ornek.com" {...f('email')}/><Field label="Website" placeholder="https://ornek.com" {...f('website')}/><Field label="Adres" placeholder="Beşiktaş, İstanbul" {...f('address')}/></>,
    business:  ()=><><Field label="İşletme Adı *" placeholder="Lezzet Durağı" {...f('name')}/><Field label="Kategori" placeholder="Restoran, Kafe..." {...f('company')}/><Field label="Telefon" placeholder="+90 212 000 0000" {...f('phone')}/><Field label="E-posta" placeholder="info@isletme.com" {...f('email')}/><Field label="Website" placeholder="https://isletme.com" {...f('url')}/><Field label="Adres" placeholder="Beşiktaş, İstanbul" {...f('address')}/><Field label="Açıklama" placeholder="İşletme hakkında..." {...f('desc')} textarea/></>,
    wifi:      ()=><><Field label="Ağ Adı (SSID) *" placeholder="EvWifi" {...f('ssid')}/><Field label="Şifre" placeholder="••••••••" type="password" {...f('password')}/><Field label="Güvenlik Tipi"><select className="field-input" value={data.security||'WPA'} onChange={e=>onChange({...data,security:e.target.value})}><option>WPA</option><option>WEP</option><option value="nopass">Şifresiz</option></select></Field></>,
    whatsapp:  ()=><><Field label="Telefon Numarası *" placeholder="+905001234567" {...f('phone')} hint="Ülke koduyla girin, örn: +905001234567"/><Field label="Hazır Mesaj" placeholder="Merhaba! Size ulaşmak istedim." {...f('message')} textarea/></>,
    facebook:  ()=><><Field label="Facebook URL *" placeholder="https://facebook.com/sayfaniz" {...f('url')}/></>,
    instagram: ()=><><Field label="Instagram URL *" placeholder="https://instagram.com/kullanici" {...f('url')}/></>,
    social:    ()=><><Field label="Instagram" placeholder="https://instagram.com/kullanici" {...f('instagram')}/><Field label="Twitter / X" placeholder="https://twitter.com/kullanici" {...f('twitter')}/><Field label="LinkedIn" placeholder="https://linkedin.com/in/kullanici" {...f('linkedin')}/><Field label="Facebook" placeholder="https://facebook.com/kullanici" {...f('facebook')}/><Field label="YouTube" placeholder="https://youtube.com/@kanal" {...f('youtube')}/></>,
    email:     ()=><><Field label="Alıcı E-posta *" placeholder="ornek@mail.com" {...f('to')}/><Field label="Konu" placeholder="Merhaba" {...f('subject')}/><Field label="Mesaj" placeholder="Mesajınız..." {...f('body')} textarea/></>,
    phone:     ()=><><Field label="Telefon Numarası *" placeholder="+90 555 000 0000" {...f('phone')}/></>,
    location:  ()=><><Field label="Enlem" placeholder="41.0082" {...f('lat')}/><Field label="Boylam" placeholder="28.9784" {...f('lng')} hint="Google Maps'ten koordinat kopyalayabilirsiniz"/></>,
    coupon:    ()=><><Field label="Marka / Firma *" placeholder="Lezzet Durağı" {...f('brand')}/><Field label="Kupon Kodu *" placeholder="YAZA2024" {...f('code')}/><Field label="İndirim (%)" placeholder="20" {...f('discount')}/><Field label="Son Kullanma" type="date" {...f('expiry')}/><Field label="Açıklama" placeholder="Kampanya detayları..." {...f('desc')} textarea/></>,
    menu:      ()=><><Field label="Restoran Adı *" placeholder="Lezzet Durağı" {...f('name')}/><Field label="Menü URL *" placeholder="https://restoran.com/menu" {...f('url')}/><Field label="Telefon" placeholder="+90 212 000 0000" {...f('phone')}/><Field label="Adres" placeholder="Kadıköy, İstanbul" {...f('address')}/></>,
    app:       ()=><><Field label="App Store (iOS)" placeholder="https://apps.apple.com/..." {...f('ios')}/><Field label="Google Play (Android)" placeholder="https://play.google.com/..." {...f('android')}/></>,
    event:     ()=><><Field label="Etkinlik Adı *" placeholder="Yıllık Toplantı" {...f('title')}/><Field label="Başlangıç" type="datetime-local" {...f('start')}/><Field label="Bitiş" type="datetime-local" {...f('end')}/><Field label="Konum" placeholder="İstanbul Kongre Merkezi" {...f('location')}/><Field label="Açıklama" placeholder="Detaylar..." {...f('desc')} textarea/></>,
    text:      ()=><><Field label="Metin *" placeholder="İstediğiniz metin..." {...f('text')} textarea/></>,
  }
  const render = forms[type]
  return <div className="fields-wrap">{render ? render() : <Field label="URL" placeholder="https://ornek.com" {...f('url')}/>}</div>
}

function DotSVG({ style, color='#111' }) {
  const cells = [[0,0],[0,1],[0,2],[1,0],[1,1],[1,2],[2,0],[2,1],[2,2]]
  return (
    <svg width={36} height={36} viewBox="0 0 36 36">
      {cells.map(([r,c]) => {
        const x=2+c*11, y=2+r*11, s=9
        if(style==='dots')    return <circle   key={`${r}${c}`} cx={x+s/2} cy={y+s/2} r={s/2-0.5} fill={color}/>
        if(style==='rounded') return <rect     key={`${r}${c}`} x={x} y={y} width={s} height={s} rx={3} fill={color}/>
        if(style==='diamond') return <polygon  key={`${r}${c}`} points={`${x+s/2},${y} ${x+s},${y+s/2} ${x+s/2},${y+s} ${x},${y+s/2}`} fill={color}/>
        return <rect key={`${r}${c}`} x={x} y={y} width={s} height={s} fill={color}/>
      })}
    </svg>
  )
}
function EyeSVG({ style, color='#111' }) {
  if(style==='circle')  return <svg width={36} height={36} viewBox="0 0 36 36"><circle cx={18} cy={18} r={15} stroke={color} strokeWidth={3.5} fill="none"/><circle cx={18} cy={18} r={6} fill={color}/></svg>
  if(style==='rounded') return <svg width={36} height={36} viewBox="0 0 36 36"><rect x={2} y={2} width={32} height={32} rx={9} stroke={color} strokeWidth={3.5} fill="none"/><rect x={10} y={10} width={16} height={16} rx={4} fill={color}/></svg>
  if(style==='leaf')    return <svg width={36} height={36} viewBox="0 0 36 36"><rect x={2} y={2} width={32} height={32} rx={16} ry={3} stroke={color} strokeWidth={3.5} fill="none"/><rect x={10} y={10} width={16} height={16} fill={color}/></svg>
  return <svg width={36} height={36} viewBox="0 0 36 36"><rect x={2} y={2} width={32} height={32} stroke={color} strokeWidth={3.5} fill="none"/><rect x={10} y={10} width={16} height={16} fill={color}/></svg>
}

export default function App() {
  const [step, setStep] = useState(0)
  const [qrType, setQrType] = useState(null)
  const [contentData, setContentData] = useState({})
  const [design, setDesign] = useState({ fgColor:'#1a7a4a', bgColor:'#ffffff', dotStyle:'square', eyeStyle:'square', size:256, errorLevel:'M', logo:null })
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [activePicker, setActivePicker] = useState(null)
  const logoRef = useRef(null)

  const qrContent = qrType ? buildQRContent(qrType, contentData) : ''
  const activeType = QR_TYPES.find(t=>t.id===qrType)

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
    reader.onload = ev => setDesign(d=>({...d,logo:ev.target.result}))
    reader.readAsDataURL(file)
  }
  const downloadPNG = () => {
    const a = document.createElement('a'); a.href=qrDataUrl; a.download=`qr-${qrType||'code'}.png`; a.click()
  }
  const downloadSVG = async () => {
    const svg = await QRCode.toString(qrContent,{type:'svg',width:design.size,margin:2,color:{dark:design.fgColor,light:design.bgColor},errorCorrectionLevel:design.errorLevel})
    const blob = new Blob([svg],{type:'image/svg+xml'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href=url; a.download=`qr-${qrType||'code'}.svg`; a.click()
    URL.revokeObjectURL(url)
  }

  const STEPS = ['QR kodu türü','İçerik','QR tasarımı']

  const selectType = (id) => { setQrType(id); setContentData({}); setStep(1) }

  return (
    <div className="app" onClick={()=>setActivePicker(null)}>
      {/* ─── HEADER ─── */}
      <header className="header">
        <div className="brand" onClick={()=>{setStep(0);setQrType(null)}}>
          <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
            <rect x="2" y="2" width="14" height="14" rx="3" fill="#1a7a4a"/>
            <rect x="22" y="2" width="14" height="14" rx="3" fill="#1a7a4a"/>
            <rect x="2" y="22" width="14" height="14" rx="3" fill="#1a7a4a"/>
            <rect x="6" y="6" width="6" height="6" rx="1" fill="white"/>
            <rect x="26" y="6" width="6" height="6" rx="1" fill="white"/>
            <rect x="6" y="26" width="6" height="6" rx="1" fill="white"/>
            <rect x="22" y="22" width="6" height="6" rx="1" fill="#1a7a4a"/>
            <rect x="30" y="22" width="6" height="6" rx="1" fill="#1a7a4a"/>
            <rect x="22" y="30" width="6" height="6" rx="1" fill="#1a7a4a"/>
            <rect x="30" y="30" width="6" height="6" rx="1" fill="#1a7a4a"/>
          </svg>
          <div className="brand-text">
            <span className="brand-top">Online</span>
            <span className="brand-bottom">QR Generator</span>
          </div>
        </div>

        <div className="wizard-bar">
          {STEPS.map((s,i)=>(
            <div key={i} className={`wz-step ${i===step?'active':i<step?'done':''}`}
              onClick={()=>{ if(i<step||(i===1&&qrType)) setStep(i) }}>
              <div className="wz-num">{i<step?'✓':i+1}</div>
              <span className="wz-label">{s}</span>
              {i<2 && <span className="wz-arrow">→</span>}
            </div>
          ))}
        </div>

        <div className="hdr-btns">
          <button className="btn-hdr-ghost">Giriş Yap</button>
          <button className="btn-hdr-green">Ücretsiz Dene</button>
        </div>
      </header>

      {/* ─── BODY ─── */}
      <div className="body-wrap">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <p className="sidebar-heading">QR KOD TÜRLERİ</p>
          {QR_TYPES.map(t=>(
            <button key={t.id}
              className={`sb-item ${qrType===t.id?'active':''}`}
              onClick={()=>selectType(t.id)}>
              <span className="sb-icon">{t.icon}</span>
              <span className="sb-label">{t.label}</span>
            </button>
          ))}
        </aside>

        {/* MAIN */}
        <main className="main" onClick={()=>setActivePicker(null)}>

          {/* STEP 0 — Type selector */}
          {step===0 && (
            <div className="card">
              <h1 className="card-title">Bir QR kodu türü seçin</h1>
              <div className="type-grid">
                {QR_TYPES.map(t=>(
                  <button key={t.id} className={`type-card ${qrType===t.id?'active':''}`} onClick={()=>selectType(t.id)}>
                    <span className="tc-icon">{t.icon}</span>
                    <span className="tc-name">{t.label}</span>
                    <span className="tc-desc">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 1 — Content */}
          {step===1 && (
            <div className="card">
              <div className="card-badge">
                <span>{activeType?.icon}</span>
                <span>{activeType?.label}</span>
              </div>
              <h2 className="card-title">İçerik Bilgilerini Girin</h2>
              <ContentForm type={qrType} data={contentData} onChange={setContentData}/>
            </div>
          )}

          {/* STEP 2 — Design */}
          {step===2 && (
            <div className="card">
              <h2 className="card-title">QR Tasarımını Özelleştir</h2>
              <div className="design-grid">

                <section className="dsec">
                  <label className="dsec-label">Renk Şablonları</label>
                  <div className="presets-row">
                    {COLOR_PRESETS.map((p,i)=>(
                      <button key={i} className="preset-btn"
                        style={{background:`linear-gradient(135deg,${p.fg} 50%,${p.bg} 50%)`}}
                        onClick={()=>setDesign(d=>({...d,fgColor:p.fg,bgColor:p.bg}))}
                        title={`${p.fg} / ${p.bg}`}/>
                    ))}
                  </div>
                </section>

                <section className="dsec">
                  <label className="dsec-label">Renkler</label>
                  <div className="clr-row" onClick={e=>e.stopPropagation()}>
                    {[['fgColor','QR Rengi'],['bgColor','Arkaplan']].map(([key,lbl])=>(
                      <div key={key} className="clr-item">
                        <span className="clr-lbl">{lbl}</span>
                        <div className="clr-wrap">
                          <button className="clr-swatch" style={{background:design[key]}}
                            onClick={()=>setActivePicker(v=>v===key?null:key)}/>
                          <input className="clr-hex" value={design[key]}
                            onChange={e=>setDesign(d=>({...d,[key]:e.target.value}))}/>
                          {activePicker===key&&(
                            <div className="clr-popup" onClick={e=>e.stopPropagation()}>
                              <HexColorPicker color={design[key]} onChange={v=>setDesign(d=>({...d,[key]:v}))}/>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="dsec">
                  <label className="dsec-label">Piksel Şekli</label>
                  <div className="shape-row">
                    {DOT_STYLES.map(s=>(
                      <button key={s.id} className={`shape-btn ${design.dotStyle===s.id?'active':''}`}
                        onClick={()=>setDesign(d=>({...d,dotStyle:s.id}))}>
                        <DotSVG style={s.id} color={design.dotStyle===s.id?design.fgColor:'#bbb'}/>
                        <span>{s.label}</span>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="dsec">
                  <label className="dsec-label">Göz Şekli</label>
                  <div className="shape-row">
                    {EYE_STYLES.map(s=>(
                      <button key={s.id} className={`shape-btn ${design.eyeStyle===s.id?'active':''}`}
                        onClick={()=>setDesign(d=>({...d,eyeStyle:s.id}))}>
                        <EyeSVG style={s.id} color={design.eyeStyle===s.id?design.fgColor:'#bbb'}/>
                        <span>{s.label}</span>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="dsec">
                  <label className="dsec-label">Çözünürlük</label>
                  <div className="tab-row">
                    {[256,512,1024].map(s=>(
                      <button key={s} className={`tab-btn ${design.size===s?'active':''}`}
                        onClick={()=>setDesign(d=>({...d,size:s}))}>{s}px</button>
                    ))}
                  </div>
                </section>

                <section className="dsec">
                  <label className="dsec-label">Hata Düzeltme</label>
                  <div className="tab-row">
                    {[['L','7%'],['M','15%'],['Q','25%'],['H','30%']].map(([l,p])=>(
                      <button key={l} className={`tab-btn ec-tab ${design.errorLevel===l?'active':''}`}
                        onClick={()=>setDesign(d=>({...d,errorLevel:l}))}>
                        <b>{l}</b><small>{p}</small>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="dsec" style={{gridColumn:'1/-1'}}>
                  <label className="dsec-label">Logo Ekle</label>
                  <label className="logo-area">
                    <input type="file" accept="image/*" style={{display:'none'}} onChange={handleLogoUpload} ref={logoRef}/>
                    <span>📁 Görsel Seç (PNG, SVG önerilir)</span>
                  </label>
                  {design.logo&&(
                    <div className="logo-row">
                      <img src={design.logo} className="logo-preview" alt="logo"/>
                      <button className="logo-rm" onClick={()=>setDesign(d=>({...d,logo:null}))}>✕ Kaldır</button>
                    </div>
                  )}
                </section>
              </div>
            </div>
          )}

          {/* NAV */}
          <div className="nav-bar">
            <button className="btn-geri"
              onClick={()=>setStep(s=>Math.max(0,s-1))}
              disabled={step===0}>← Geri</button>
            <div className="nav-progress">
              <div className="nav-bar-fill" style={{width:`${((step+1)/3)*100}%`}}/>
            </div>
            {step<2
              ? <button className="btn-ileri"
                  onClick={()=>setStep(s=>s+1)}
                  disabled={step===0&&!qrType}>
                  İleri →
                </button>
              : <button className="btn-ileri" onClick={downloadPNG}>⬇ İndir</button>}
          </div>
        </main>

        {/* PREVIEW PANEL */}
        <aside className="preview">
          <div className="preview-tabs">
            <button className="ptab active">Önizleme</button>
            <button className="ptab">QR kod</button>
          </div>

          {/* Phone */}
          <div className="phone">
            <div className="phone-inner">
              <div className="phone-notch"/>
              <div className="phone-screen" style={{background:design.bgColor}}>
                {activeType ? (
                  <>
                    <div className="ps-header">
                      <span className="ps-icon">{activeType.icon}</span>
                      <p className="ps-title">{contentData.name||contentData.title||activeType.label}</p>
                      {contentData.desc&&<p className="ps-sub">{contentData.desc.slice(0,60)}</p>}
                    </div>
                    <div className="ps-qr">
                      {qrDataUrl
                        ? <img src={qrDataUrl} alt="QR" style={{width:'100%',display:'block',imageRendering:'pixelated'}}/>
                        : <div className="ps-qr-ph">QR oluşturuluyor...</div>}
                    </div>
                    {contentData.address&&<p className="ps-addr">📍 {contentData.address}</p>}
                    {contentData.phone&&<p className="ps-phone">📞 {contentData.phone}</p>}
                  </>
                ) : (
                  <div className="ps-empty">
                    <div style={{fontSize:40,marginBottom:8}}>📱</div>
                    <p>QR türü seçin</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="dl-btns">
            <button className="btn-dl-primary" onClick={downloadPNG} disabled={!qrDataUrl}>⬇ PNG İndir</button>
            <button className="btn-dl-sec" onClick={downloadSVG} disabled={!qrDataUrl}>⬇ SVG İndir</button>
          </div>

          {qrDataUrl&&(
            <div className="qr-mini-wrap">
              <img src={qrDataUrl} alt="QR" className="qr-mini"/>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
