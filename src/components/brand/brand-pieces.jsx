// Reusable brand pieces — the UNION wordmark, three logo directions,
// and small in-product mocks (sidebar, login card, beamer, share header).

// ── UNION wordmark (from the existing /public/union-logo.svg) ─────────
const UnionLogo = ({ size = 18, color = "currentColor", style }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 320 75"
    fill={color}
    style={{ height: size, width: 'auto', display: 'inline-block', ...style }}
    aria-label="UNION"
  >
    <path d="M31.92 74.22c-9.44 0-17.09-2.49-22.94-7.48C3 61.75 0 54.63 0 45.39V1.6h19.95v44c0 3.72 1.03 6.58 3.09 8.57 2.13 2 5.09 2.99 8.88 2.99s6.72-.99 8.78-2.99c2.13-2 3.19-4.85 3.19-8.57v-44h19.95v43.79c0 9.38-2.89 16.53-8.68 21.45-5.85 4.92-13.6 7.39-23.24 7.39Z" />
    <path d="M118.18 13.17V1.59h18.95v71.03h-21.05L101.02 47.38c-4.06-6.85-7.32-12.7-9.78-17.56.34 9.78.5 20.19.5 31.23v11.57H72.79V1.6h21.05l15.06 25.24c3.59 6.12 6.85 12 9.78 17.66-.33-9.78-.5-20.22-.5-31.33Z" />
    <path d="M167.06 72.62h-19.95V1.59h19.95v71.03Z" />
    <path d="M238.38 64.05c-6.85 6.78-15.86 10.17-27.03 10.17s-20.18-3.39-27.03-10.17c-6.85-6.65-10.28-15.63-10.28-26.94s3.43-20.25 10.28-27.03C191.23 3.36 200.24 0 211.35 0s20.12 3.36 27.03 10.08c6.85 6.78 10.28 15.79 10.28 27.03s-3.43 20.29-10.28 26.94Zm-39.1-12.37c2.99 3.52 7.01 5.29 12.07 5.29s9.07-1.76 12.07-5.29c2.99-3.46 4.49-8.31 4.49-14.57s-1.5-10.94-4.49-14.46c-2.99-3.59-7.02-5.39-12.07-5.39s-9.08 1.8-12.07 5.39c-2.99 3.53-4.49 8.34-4.49 14.46s1.5 10.96 4.49 14.57Z" />
    <path d="M301.05 13.17V1.59h18.96v71.03h-21.05L283.9 47.38c-4.06-6.85-7.32-12.7-9.78-17.56.33 9.78.5 20.19.5 31.23v11.57h-18.96V1.6h21.05l15.06 25.24c3.59 6.12 6.85 12 9.78 17.66-.34-9.78-.5-20.22-.5-31.33Z" />
  </svg>
);

// ─────────────────────────────────────────────────────────────────────
// DIRECTION 1 · SAFE — refined "MySession" wordmark, current DNA
// ─────────────────────────────────────────────────────────────────────
const SafeWordmark = ({ size = 64 }) => (
  <span
    className="wm-safe"
    style={{ fontSize: size, lineHeight: .9 }}
  >
    <span className="neon-text">MySession</span>
  </span>
);

const SafeLockup = ({ size = 56 }) => (
  <div style={{ display:'flex', flexDirection:'column', gap: 6 }}>
    <SafeWordmark size={size} />
    <div style={{ display:'flex', alignItems:'center', gap: 8, color:'var(--muted)', fontWeight: 500, fontSize: size * 0.18 }}>
      <span style={{ fontStyle:'italic', letterSpacing:'.02em' }}>by</span>
      <UnionLogo size={size * 0.18} />
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────
// DIRECTION 2 · BOLD — "Sessions by UNION" + custom block-stack mark
// ─────────────────────────────────────────────────────────────────────
const BoldMark = ({ size = 72 }) => (
  <span
    className="mark-bold"
    style={{ width: size, height: size }}
    aria-label="Sessions mark"
  >
    <span className="blk b1" />
    <span className="blk b2" />
    <span className="blk b3" />
  </span>
);

const BoldWordmark = ({ size = 56, color }) => (
  <span
    style={{
      fontFamily: 'Geist, sans-serif',
      fontWeight: 700,
      fontSize: size,
      letterSpacing: '-0.035em',
      lineHeight: .9,
      color: color || 'var(--fg)',
    }}
  >
    Sessions
  </span>
);

const BoldLockup = ({ size = 56, vertical = false }) => (
  vertical ? (
    <div style={{ display:'flex', flexDirection:'column', gap: 14, alignItems:'flex-start' }}>
      <BoldMark size={size * 1.1} />
      <div style={{ display:'flex', flexDirection:'column', gap: 4 }}>
        <BoldWordmark size={size} />
        <div style={{ display:'flex', alignItems:'center', gap: 8, color:'var(--muted)', fontWeight: 500, fontSize: size * 0.2 }}>
          <span style={{ letterSpacing:'.02em' }}>by</span>
          <UnionLogo size={size * 0.2} />
        </div>
      </div>
    </div>
  ) : (
    <div style={{ display:'flex', alignItems:'center', gap: 16 }}>
      <BoldMark size={size * 1.1} />
      <div style={{ display:'flex', flexDirection:'column', gap: 4 }}>
        <BoldWordmark size={size} />
        <div style={{ display:'flex', alignItems:'center', gap: 8, color:'var(--muted)', fontWeight: 500, fontSize: size * 0.2 }}>
          <span style={{ letterSpacing:'.02em' }}>by</span>
          <UnionLogo size={size * 0.2} />
        </div>
      </div>
    </div>
  )
);

// ─────────────────────────────────────────────────────────────────────
// DIRECTION 3 · WILD — kinetic chromatic wordmark + "signal ribbon" mark
// ─────────────────────────────────────────────────────────────────────
const WildWordmark = ({ size = 72, text = "Sessions" }) => (
  <span
    className="wm-wild"
    data-text={text}
    style={{ fontSize: size }}
  >
    {text}
  </span>
);

const WildMark = ({ size = 88 }) => (
  <span className="mark-wild" style={{ width: size, height: size, display:'inline-block' }}>
    <svg viewBox="0 0 100 100" preserveAspectRatio="none">
      <defs>
        <linearGradient id="wild-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"  stopColor="oklch(0.82 0.16 200)"/>
          <stop offset="50%" stopColor="oklch(0.65 0.26 295)"/>
          <stop offset="100%" stopColor="oklch(0.72 0.24 350)"/>
        </linearGradient>
        <filter id="wild-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.2" />
        </filter>
      </defs>
      {/* three "live signal" ribbons that read as an S */}
      <path d="M 14 28 Q 50 4, 86 28 T 86 72 Q 50 96, 14 72" fill="none" stroke="url(#wild-g)" strokeWidth="2.5" />
      <path d="M 18 36 Q 50 16, 82 36 T 82 64 Q 50 84, 18 64" fill="none" stroke="oklch(0.82 0.16 200 / 0.55)" strokeWidth="1.4" />
      <path d="M 24 44 Q 50 28, 76 44 T 76 56 Q 50 72, 24 56" fill="none" stroke="oklch(0.72 0.24 350 / 0.55)" strokeWidth="1.4" />
      {/* live dot */}
      <circle cx="50" cy="50" r="3.5" fill="oklch(0.88 0.22 145)" filter="url(#wild-glow)"/>
      <circle cx="50" cy="50" r="1.6" fill="white"/>
    </svg>
  </span>
);

const WildLockup = ({ size = 56, text = "Sessions" }) => (
  <div style={{ display:'flex', alignItems:'center', gap: 18 }}>
    <WildMark size={size * 1.4} />
    <div style={{ display:'flex', flexDirection:'column', gap: 6 }}>
      <WildWordmark size={size} text={text} />
      <div style={{ display:'flex', alignItems:'center', gap: 8, color:'var(--muted)', fontWeight: 500, fontSize: size * 0.2 }}>
        <span className="mono" style={{ letterSpacing:'.06em', textTransform:'uppercase' }}>live · by</span>
        <UnionLogo size={size * 0.2} />
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────
// Application mocks — sidebar, login, beamer, share header
// each takes a `brand` prop with { Lockup, accent }
// ─────────────────────────────────────────────────────────────────────
const NavItem = ({ label, active }) => (
  <div className={"nav-item" + (active ? " active" : "")}>
    <span className="ico" />
    {label}
  </div>
);

const SidebarMock = ({ Lockup, lockupSize = 22 }) => (
  <div className="sb">
    <div className="brandcell">
      <Lockup size={lockupSize} />
    </div>
    <div className="nav">
      <NavItem label="Sessions" active />
      <NavItem label="Vorlagen" />
      <NavItem label="Methoden" />
      <NavItem label="Boards" />
      <NavItem label="Hilfe & FAQ" />
    </div>
    <div style={{ padding: '14px 18px', borderTop: '1px solid var(--line)' }}>
      <div style={{ font: '500 12px/1.2 Geist' }}>Lena Frank</div>
      <div className="mono" style={{ fontSize: 10, color:'var(--muted)', marginTop: 4 }}>@lena · trainer</div>
    </div>
  </div>
);

const LoginMock = ({ Lockup, lockupSize = 30, tagline = "Workshop-Planung neu gedacht." }) => (
  <div className="aurora grain" style={{ position:'relative', height:'100%', display:'grid', placeItems:'center', padding: 28 }}>
    <div className="glass" style={{ width: 360, borderRadius: 22, padding: 28, boxShadow:'0 8px 60px -12px oklch(0.65 0.26 295 / 0.35)' }}>
      <div style={{ display:'flex', justifyContent:'center', marginBottom: 22 }}>
        <Lockup size={lockupSize} />
      </div>
      <div style={{ font:'600 20px/1.2 Geist', letterSpacing:'-0.015em', marginBottom: 6 }}>Willkommen zurück</div>
      <div className="body" style={{ marginBottom: 18 }}>{tagline}</div>
      <div style={{ display:'flex', flexDirection:'column', gap: 10 }}>
        <div style={{ height: 38, borderRadius: 10, border:'1px solid var(--line)', background:'oklch(1 0 0 / 0.04)', padding:'0 12px', display:'flex', alignItems:'center', color:'var(--muted)', fontSize: 13 }}>lena@hellopure.io</div>
        <div style={{ height: 38, borderRadius: 10, border:'1px solid var(--line)', background:'oklch(1 0 0 / 0.04)', padding:'0 12px', display:'flex', alignItems:'center', color:'var(--muted)', fontSize: 13 }}>••••••••</div>
        <div style={{
          height: 40, borderRadius: 10,
          background:'linear-gradient(120deg, var(--neon-cyan), var(--neon-violet) 50%, var(--neon-pink))',
          color:'oklch(0.14 0.02 280)', font:'600 13px/40px Geist', textAlign:'center', letterSpacing:'.01em', marginTop: 4
        }}>Anmelden</div>
      </div>
    </div>
  </div>
);

const BeamerMock = ({ Lockup, lockupSize = 26, accent = 'var(--neon-violet)' }) => (
  <div style={{ position:'relative', height:'100%', background:'oklch(0.10 0.02 280)', overflow:'hidden' }}>
    {/* subtle aurora */}
    <div className="aurora" style={{ position:'absolute', inset:0, opacity:.55 }} />
    <div style={{ position:'relative', height:'100%', padding: 36, display:'flex', flexDirection:'column' }}>
      {/* top strip */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <Lockup size={lockupSize} />
        <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: 'oklch(0.7 0.23 25)', boxShadow:'0 0 12px oklch(0.7 0.23 25)' }} />
          <span className="mono" style={{ fontSize: 11, letterSpacing:'.16em', textTransform:'uppercase', color:'var(--muted)' }}>live · day 1 · 09:42</span>
        </div>
      </div>
      {/* main */}
      <div style={{ flex: 1, display:'flex', flexDirection:'column', justifyContent:'center', gap: 22 }}>
        <div className="mono" style={{ fontSize: 12, letterSpacing: '.18em', textTransform:'uppercase', color: accent }}>Aktueller Block · 03 / 14</div>
        <div className="beam-now" style={{ maxWidth: 700 }}>Werte-Sortierung in Trios.</div>
        <div style={{ display:'flex', alignItems:'baseline', gap: 22 }}>
          <div className="beam-timer">12:34</div>
          <div className="body" style={{ color:'var(--muted)' }}>von 20 min · läuft.</div>
        </div>
      </div>
      {/* footer */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', borderTop:'1px solid var(--line)', paddingTop: 14, color:'var(--muted)', fontSize: 12 }}>
        <span>Nächster: <span style={{ color:'var(--fg)' }}>Plenum-Reflexion</span></span>
        <span className="mono">sessions.hellopure.io / live / 8a3-fxk</span>
      </div>
    </div>
  </div>
);

const ShareHeaderMock = ({ Lockup, lockupSize = 22 }) => (
  <div className="ab light" style={{ height:'100%' }}>
    <div className="browserbar" style={{ background:'oklch(0.97 0.005 280)', borderColor:'oklch(0.92 0.01 280)' }}>
      <span className="dot3" /><span className="dot3" /><span className="dot3" />
      <div className="url" style={{ background:'white', borderColor:'oklch(0.92 0.01 280)', color:'oklch(0.4 0.02 280)' }}>sessions.hellopure.io/share/p7w-3kf</div>
    </div>
    <div style={{ padding: '22px 28px', borderBottom: '1px solid oklch(0.92 0.01 280)', display:'flex', alignItems:'center', justifyContent:'space-between', background:'white' }}>
      <Lockup size={lockupSize} />
      <div style={{ display:'flex', alignItems:'center', gap: 12 }}>
        <span style={{ fontFamily:'JetBrains Mono', fontSize: 11, letterSpacing:'.1em', textTransform:'uppercase', color:'oklch(0.5 0.02 270)' }}>geteilt von Lena</span>
        <div style={{ width: 28, height: 28, borderRadius: 999, background:'linear-gradient(135deg, var(--neon-cyan), var(--neon-violet))' }} />
      </div>
    </div>
    <div style={{ padding: '24px 28px' }}>
      <div style={{ font:'500 11px/1 JetBrains Mono', letterSpacing:'.14em', textTransform:'uppercase', color:'oklch(0.5 0.02 270)', marginBottom: 10 }}>Workshop · 2 Tage</div>
      <div style={{ font:'700 28px/1.1 Geist', letterSpacing:'-0.018em', color:'oklch(0.18 0.01 260)' }}>Strategy Offsite — Spring '26</div>
      <div style={{ font:'400 14px/1.55 Geist', color:'oklch(0.5 0.02 270)', marginTop: 8, maxWidth: 460 }}>14 Blöcke · 2 Breakouts · 8 Methoden aus der Bibliothek.</div>
      <div style={{ display:'flex', gap: 8, marginTop: 18 }}>
        {['Day 1', 'Day 2', 'Materialien'].map((t,i) => (
          <div key={t} style={{
            padding:'7px 12px', borderRadius: 999, fontSize: 12, fontWeight: 500,
            border: '1px solid oklch(0.92 0.01 280)',
            background: i===0 ? 'oklch(0.65 0.26 295 / 0.08)' : 'white',
            color: i===0 ? 'oklch(0.45 0.18 295)' : 'oklch(0.4 0.02 270)',
          }}>{t}</div>
        ))}
      </div>
    </div>
  </div>
);

Object.assign(window, {
  UnionLogo,
  SafeWordmark, SafeLockup,
  BoldMark, BoldWordmark, BoldLockup,
  WildWordmark, WildMark, WildLockup,
  SidebarMock, LoginMock, BeamerMock, ShareHeaderMock,
});
