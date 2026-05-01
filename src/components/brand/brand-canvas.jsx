// Builds the design canvas: 3 sections × 5 artboards (lockup + 4 applications).

const { DesignCanvas, DCSection, DCArtboard } = window;

// shared shells ───────────────────────────────────────────────────────
const Hero = ({ children, className = "ab", padding = 32, footer, tagDot, tagLabel = "Lockup" }) => (
  <div className={className} style={{ height:'100%' }}>
    <div className="aurora grain" style={{ position:'absolute', inset:0 }} />
    <div className="pad" style={{ position:'relative', display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
      <div className="row" style={{ justifyContent:'space-between' }}>
        <span className="tag" style={{ borderColor:'var(--line)' }}><span className="dot" style={{ background: tagDot, boxShadow: `0 0 8px ${tagDot}` }} /> {tagLabel}</span>
        <span className="mono" style={{ fontSize: 10, color:'var(--muted)', letterSpacing:'.14em', textTransform:'uppercase' }}>1080 × 720</span>
      </div>
      <div style={{ display:'grid', placeItems:'center', flex: 1 }}>{children}</div>
      <div style={{ font:'500 11px/1.4 JetBrains Mono', letterSpacing:'.04em', color:'var(--muted)' }}>{footer}</div>
    </div>
  </div>
);

const VarGrid = ({ children, footer }) => (
  <div className="ab" style={{ background:'oklch(0.12 0.02 280)' }}>
    <div className="pad" style={{ display:'grid', gridTemplateColumns:'1fr', gap: 18 }}>
      <div className="row" style={{ justifyContent:'space-between' }}>
        <span className="tag"><span className="dot" /> Wordmark · Mark · Mono</span>
        <span className="mono" style={{ fontSize: 10, color:'var(--muted)', letterSpacing:'.14em', textTransform:'uppercase' }}>Variations</span>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 12 }}>
        {children}
      </div>
      <div style={{ font:'500 11px/1.4 JetBrains Mono', letterSpacing:'.04em', color:'var(--muted)' }}>{footer}</div>
    </div>
  </div>
);

const VarCell = ({ label, bg = 'oklch(0.16 0.02 280)', children }) => (
  <div style={{
    border:'1px solid var(--line)', borderRadius: 14, background: bg,
    height: 220, display:'flex', flexDirection:'column', justifyContent:'space-between', padding: 16,
  }}>
    <div className="mono" style={{ fontSize: 9, letterSpacing:'.18em', textTransform:'uppercase', color:'var(--muted)' }}>{label}</div>
    <div style={{ display:'grid', placeItems:'center', flex:1 }}>{children}</div>
    <div style={{ display:'flex', justifyContent:'flex-end' }}>
      <div style={{ width: 40, height: 1, background:'var(--line)' }} />
    </div>
  </div>
);

// ── Direction 1 — SAFE ───────────────────────────────────────────────
const SafePrimary = () => (
  <Hero tagDot="var(--neon-violet)" tagLabel="Primary Lockup" footer={"Safe · refined evolution · keeps neon-text wordmark, fixes kerning + lockup hierarchy."}>
    <SafeLockup size={84} />
  </Hero>
);

const SafeVariations = () => (
  <VarGrid footer="Wordmark only · monochrome · reversed · favicon-cut.">
    <VarCell label="Wordmark · Color"><SafeWordmark size={44} /></VarCell>
    <VarCell label="Wordmark · Mono" bg="oklch(0.99 0.005 280)">
      <span style={{ fontFamily:'Geist', fontWeight: 800, letterSpacing:'-0.04em', fontSize: 44, color:'oklch(0.18 0.01 260)' }}>MySession</span>
    </VarCell>
    <VarCell label="Reversed · on tone" bg="linear-gradient(135deg, oklch(0.65 0.26 295), oklch(0.72 0.24 350))">
      <span style={{ fontFamily:'Geist', fontWeight: 800, letterSpacing:'-0.04em', fontSize: 40, color:'white' }}>MySession</span>
    </VarCell>
    <VarCell label="App icon · 'M' cut">
      <div style={{
        width: 110, height: 110, borderRadius: 26, position:'relative',
        background:'linear-gradient(135deg, oklch(0.82 0.16 200), oklch(0.65 0.26 295) 55%, oklch(0.72 0.24 350))',
        boxShadow:'0 10px 40px -10px oklch(0.65 0.26 295 / 0.7)',
        display:'grid', placeItems:'center'
      }}>
        <span style={{ font: '900 70px/1 Geist', letterSpacing:'-0.06em', color:'oklch(0.10 0.02 280)' }}>M</span>
      </div>
    </VarCell>
  </VarGrid>
);

// ── Direction 2 — BOLD ───────────────────────────────────────────────
const BoldPrimary = () => (
  <Hero tagDot="var(--neon-cyan)" tagLabel="Primary Lockup" footer={"Bold · rename to ‘Sessions’ · custom mark = 3 timeline-blocks fitted into an S-silhouette."}>
    <BoldLockup size={64} />
  </Hero>
);

const BoldVariations = () => (
  <VarGrid footer="Solo mark · vertical · monochrome · in-context tag.">
    <VarCell label="Mark · Solo"><BoldMark size={120} /></VarCell>
    <VarCell label="Vertical lockup"><BoldLockup size={36} vertical /></VarCell>
    <VarCell label="Mono · light" bg="oklch(0.99 0.005 280)">
      <div style={{ display:'flex', alignItems:'center', gap: 14 }}>
        <span style={{
          width: 60, height: 60, borderRadius: 10, background:'oklch(0.18 0.01 260)', position:'relative', display:'inline-block'
        }}>
          <span style={{ position:'absolute', left:'16%', right:'36%', top:'18%', height:'14%', background:'oklch(0.99 0.005 280)', borderRadius: 3 }} />
          <span style={{ position:'absolute', left:'24%', right:'16%', top:'43%', height:'14%', background:'oklch(0.99 0.005 280)', opacity:.85, borderRadius: 3 }} />
          <span style={{ position:'absolute', left:'16%', right:'36%', top:'68%', height:'14%', background:'oklch(0.99 0.005 280)', opacity:.65, borderRadius: 3 }} />
        </span>
        <span style={{ font:'700 36px/.9 Geist', letterSpacing:'-0.035em', color:'oklch(0.18 0.01 260)' }}>Sessions</span>
      </div>
    </VarCell>
    <VarCell label="Tag · 'Powered by'">
      <div style={{ display:'inline-flex', alignItems:'center', gap: 10, padding:'10px 14px', borderRadius: 999, border:'1px solid var(--line)', background:'oklch(1 0 0 / 0.04)' }}>
        <BoldMark size={22} />
        <span style={{ fontFamily:'Geist', fontWeight: 600, fontSize: 14, letterSpacing:'-0.01em' }}>Sessions</span>
        <span className="mono" style={{ fontSize: 10, color:'var(--muted)', letterSpacing:'.14em', textTransform:'uppercase' }}>· by</span>
        <UnionLogo size={11} />
      </div>
    </VarCell>
  </VarGrid>
);

// ── Direction 3 — WILD ───────────────────────────────────────────────
const WildPrimary = () => (
  <Hero tagDot="var(--neon-pink)" tagLabel="Primary Lockup" footer={"Wild · spectral kinetic wordmark · ‘live signal’ ribbon mark · animates subtly in product."}>
    <WildLockup size={72} />
  </Hero>
);

const WildVariations = () => (
  <VarGrid footer="Mark solo · animation frame · type-only · in-app tag.">
    <VarCell label="Signal mark"><WildMark size={150} /></VarCell>
    <VarCell label="Wordmark · plain">
      <WildWordmark size={48} />
    </VarCell>
    <VarCell label="Live status pill">
      <div style={{ display:'inline-flex', alignItems:'center', gap: 10, padding:'10px 16px', borderRadius: 999,
        background:'oklch(0.18 0.02 280)', border:'1px solid oklch(0.65 0.26 295 / 0.5)',
        boxShadow:'0 0 24px -4px oklch(0.65 0.26 295 / 0.4)'
      }}>
        <span style={{ width: 8, height: 8, borderRadius: 999, background:'oklch(0.88 0.22 145)', boxShadow:'0 0 10px oklch(0.88 0.22 145)' }} />
        <span className="mono" style={{ fontSize: 11, letterSpacing:'.18em', textTransform:'uppercase' }}>live · 14:02</span>
      </div>
    </VarCell>
    <VarCell label="Inverse · light" bg="oklch(0.99 0.005 280)">
      <div style={{ display:'flex', alignItems:'center', gap: 12 }}>
        <span className="mark-wild" style={{ width: 56, height: 56, display:'inline-block', background:'oklch(0.99 0.005 280)' }}>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width:'100%', height:'100%' }}>
            <defs>
              <linearGradient id="wild-light" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%"  stopColor="oklch(0.55 0.20 200)"/>
                <stop offset="50%" stopColor="oklch(0.45 0.24 295)"/>
                <stop offset="100%" stopColor="oklch(0.55 0.22 350)"/>
              </linearGradient>
            </defs>
            <path d="M 14 28 Q 50 4, 86 28 T 86 72 Q 50 96, 14 72" fill="none" stroke="url(#wild-light)" strokeWidth="2.5"/>
            <circle cx="50" cy="50" r="3.5" fill="oklch(0.55 0.20 145)"/>
          </svg>
        </span>
        <span style={{ font:'900 30px/.9 Geist', letterSpacing:'-0.04em', color:'oklch(0.18 0.01 260)' }}>Sessions</span>
      </div>
    </VarCell>
  </VarGrid>
);

// ─────────────────────────────────────────────────────────────────────
// Sidebar lockups per direction
// ─────────────────────────────────────────────────────────────────────
const SafeSidebarLockup = ({ size = 22 }) => (
  <div style={{ display:'flex', flexDirection:'column', gap: 4 }}>
    <SafeWordmark size={size} />
    <div style={{ display:'flex', alignItems:'center', gap: 6, color:'var(--muted)', fontWeight: 500, fontSize: 10 }}>
      by <UnionLogo size={9} />
    </div>
  </div>
);

const BoldSidebarLockup = ({ size = 22 }) => (
  <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
    <BoldMark size={28} />
    <div style={{ display:'flex', flexDirection:'column', gap: 2 }}>
      <BoldWordmark size={size} />
      <div style={{ display:'flex', alignItems:'center', gap: 6, color:'var(--muted)', fontWeight: 500, fontSize: 9 }}>
        by <UnionLogo size={8} />
      </div>
    </div>
  </div>
);

const WildSidebarLockup = ({ size = 22 }) => (
  <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
    <WildMark size={28} />
    <div style={{ display:'flex', flexDirection:'column', gap: 2 }}>
      <WildWordmark size={size} />
      <div style={{ display:'flex', alignItems:'center', gap: 6, color:'var(--muted)', fontWeight: 500, fontSize: 9 }}>
        <span className="mono" style={{ fontSize: 8, letterSpacing:'.14em', textTransform:'uppercase' }}>live · by</span>
        <UnionLogo size={8} />
      </div>
    </div>
  </div>
);

// Application artboards
const AppArtboard = ({ children, label }) => (
  <div className="ab" style={{ background:'oklch(0.12 0.02 280)' }}>
    <div className="browserbar">
      <span className="dot3" /><span className="dot3" /><span className="dot3" />
      <div className="url">{label}</div>
    </div>
    <div style={{ display:'flex', height: 'calc(100% - 36px)' }}>{children}</div>
  </div>
);

const SidebarApp = ({ Lockup, name }) => (
  <AppArtboard label={`sessions.hellopure.io/dashboard`}>
    <SidebarMock Lockup={Lockup} />
    <div style={{ flex:1, padding: 28, position:'relative' }}>
      <div className="aurora-soft" style={{ position:'absolute', inset:0, opacity:.6 }} />
      <div style={{ position:'relative' }}>
        <div className="eyebrow">Dashboard · Sessions</div>
        <div className="title-lg" style={{ marginTop: 8 }}>Hallo Lena.</div>
        <div className="body" style={{ marginTop: 6, maxWidth: 320 }}>3 Workshops in Vorbereitung · 1 läuft heute.</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 12, marginTop: 24 }}>
          {[
            { t: "Strategy Offsite", d: "2 Tage · 14 Blöcke", c: 'var(--neon-violet)' },
            { t: "Onboarding Q2",   d: "1 Tag · 8 Blöcke",  c: 'var(--neon-cyan)' },
          ].map(c => (
            <div key={c.t} className="glass" style={{ borderRadius: 14, padding: 14 }}>
              <div className="mono" style={{ fontSize: 10, letterSpacing:'.14em', textTransform:'uppercase', color: c.c }}>aktiv</div>
              <div style={{ font:'600 15px/1.2 Geist', letterSpacing:'-0.01em', marginTop: 6 }}>{c.t}</div>
              <div className="body" style={{ fontSize: 12, marginTop: 4 }}>{c.d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </AppArtboard>
);

// ── canvas ───────────────────────────────────────────────────────────
const App = () => (
  <DesignCanvas>
    <DCSection id="safe" title="Direction 1 · Safe" subtitle="Refined evolution — kerning, lockup, app icon. ‘MySession’ name retained.">
      <DCArtboard id="safe-primary"   label="Safe · Primary Lockup"   width={520} height={360}><SafePrimary /></DCArtboard>
      <DCArtboard id="safe-vars"      label="Safe · Variations"        width={520} height={360}><SafeVariations /></DCArtboard>
      <DCArtboard id="safe-sidebar"   label="Safe · App Sidebar"       width={760} height={460}><SidebarApp Lockup={SafeSidebarLockup} /></DCArtboard>
      <DCArtboard id="safe-login"     label="Safe · Login"             width={520} height={460}><LoginMock Lockup={SafeLockup} lockupSize={28} /></DCArtboard>
      <DCArtboard id="safe-beamer"    label="Safe · Beamer / Display"  width={760} height={460}><BeamerMock Lockup={SafeLockup} lockupSize={20} accent="var(--neon-violet)" /></DCArtboard>
      <DCArtboard id="safe-share"     label="Safe · Geteilter Workshop" width={520} height={460}><ShareHeaderMock Lockup={SafeLockup} lockupSize={20} /></DCArtboard>
    </DCSection>

    <DCSection id="bold" title="Direction 2 · Bold" subtitle="Rename to ‘Sessions’ · custom block-stack mark · clearer signature with UNION.">
      <DCArtboard id="bold-primary"   label="Bold · Primary Lockup"   width={520} height={360}><BoldPrimary /></DCArtboard>
      <DCArtboard id="bold-vars"      label="Bold · Variations"        width={520} height={360}><BoldVariations /></DCArtboard>
      <DCArtboard id="bold-sidebar"   label="Bold · App Sidebar"       width={760} height={460}><SidebarApp Lockup={BoldSidebarLockup} /></DCArtboard>
      <DCArtboard id="bold-login"     label="Bold · Login"             width={520} height={460}><LoginMock Lockup={BoldLockup} lockupSize={36} /></DCArtboard>
      <DCArtboard id="bold-beamer"    label="Bold · Beamer / Display"  width={760} height={460}><BeamerMock Lockup={BoldLockup} lockupSize={22} accent="var(--neon-cyan)" /></DCArtboard>
      <DCArtboard id="bold-share"     label="Bold · Geteilter Workshop" width={520} height={460}><ShareHeaderMock Lockup={BoldLockup} lockupSize={22} /></DCArtboard>
    </DCSection>

    <DCSection id="wild" title="Direction 3 · Wild" subtitle="Spectral kinetic wordmark + signal-ribbon mark. Treats the brand as a live entity.">
      <DCArtboard id="wild-primary"   label="Wild · Primary Lockup"   width={520} height={360}><WildPrimary /></DCArtboard>
      <DCArtboard id="wild-vars"      label="Wild · Variations"        width={520} height={360}><WildVariations /></DCArtboard>
      <DCArtboard id="wild-sidebar"   label="Wild · App Sidebar"       width={760} height={460}><SidebarApp Lockup={WildSidebarLockup} /></DCArtboard>
      <DCArtboard id="wild-login"     label="Wild · Login"             width={520} height={460}><LoginMock Lockup={WildLockup} lockupSize={36} tagline="Werkstatt für lebendige Workshops." /></DCArtboard>
      <DCArtboard id="wild-beamer"    label="Wild · Beamer / Display"  width={760} height={460}><BeamerMock Lockup={WildLockup} lockupSize={22} accent="var(--neon-pink)" /></DCArtboard>
      <DCArtboard id="wild-share"     label="Wild · Geteilter Workshop" width={520} height={460}><ShareHeaderMock Lockup={WildLockup} lockupSize={22} /></DCArtboard>
    </DCSection>
  </DesignCanvas>
);

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
