// Bold-direction brand sheet — built on top of brand-pieces.jsx (BoldMark, BoldWordmark, BoldLockup, UnionLogo).

const { DesignCanvas, DCSection, DCArtboard,
        UnionLogo, BoldMark, BoldWordmark, BoldLockup,
        SidebarMock } = window;

// ── shared shells ────────────────────────────────────────────────────
const Frame = ({ children, label = "Bold", subLabel, footer, dark = true, padding = 32, bg }) => (
  <div className="ab" style={{ background: bg || (dark ? 'oklch(0.12 0.02 280)' : 'oklch(0.99 0.005 280)'), color: dark ? 'var(--fg)' : 'oklch(0.18 0.01 260)' }}>
    <div style={{ height:'100%', padding, display:'flex', flexDirection:'column', gap: 16, position:'relative' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span className="tag"><span className="dot" /> {label}</span>
        {subLabel && <span className="mono" style={{ fontSize: 10, color: dark ? 'var(--muted)' : 'oklch(0.5 0.02 270)', letterSpacing:'.14em', textTransform:'uppercase' }}>{subLabel}</span>}
      </div>
      <div style={{ flex: 1, minHeight: 0, position:'relative' }}>{children}</div>
      {footer && <div style={{ font:'500 11px/1.4 JetBrains Mono', letterSpacing:'.04em', color: dark ? 'var(--muted)' : 'oklch(0.5 0.02 270)' }}>{footer}</div>}
    </div>
  </div>
);

// ── 1 · Construction ─────────────────────────────────────────────────
const Construction = () => (
  <Frame label="Logo · Construction" subLabel="12 × 12 grid · base unit u = 1/12" footer="Marke wird auf 12er Raster konstruiert. Innenkante = 1u, Block-Höhe = 1.7u, Block-Verschub = ±2u.">
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 32, height:'100%', alignItems:'center', placeItems:'center' }}>
      {/* construction view */}
      <div style={{ position:'relative', width: 280, height: 280 }}>
        <span className="mark-bold construct" style={{ width: 280, height: 280, borderRadius: 28, position:'absolute', inset:0 }}>
          <span className="construct-grid" />
          <span className="construct-clear" />
          <span className="blk b1" />
          <span className="blk b2" />
          <span className="blk b3" />
        </span>
        {/* labels */}
        <div className="spec-rule" style={{ left: -38, top: '18%', height: '14%', width: 30 }}>
          <div className="line" style={{ left: 24, top: 0, bottom: 0, width: 1 }} />
          <div className="label" style={{ position:'absolute', left: 0, top: '50%', transform:'translateY(-50%)' }}>1.7u</div>
        </div>
        <div className="spec-rule" style={{ right: -50, top: '43%', height: '14%', width: 40 }}>
          <div className="line" style={{ left: 0, top: 0, bottom: 0, width: 1 }} />
          <div className="label" style={{ position:'absolute', right: 0, top: '50%', transform:'translateY(-50%)' }}>1.7u</div>
        </div>
        <div className="spec-rule" style={{ bottom: -28, left: '16%', right: '36%', height: 24 }}>
          <div className="line" style={{ left: 0, right: 0, top: 8, height: 1 }} />
          <div className="label" style={{ position:'absolute', left: '50%', top: 12, transform:'translateX(-50%)' }}>6u</div>
        </div>
      </div>
      {/* clearspace text */}
      <div style={{ display:'flex', flexDirection:'column', gap: 14 }}>
        <div className="eyebrow">Clearspace · Schutzraum</div>
        <div style={{ font:'600 22px/1.2 Geist', letterSpacing:'-0.012em' }}>Mind. <span style={{ color:'oklch(0.88 0.22 145)' }}>1u</span> rundum frei.</div>
        <div className="body" style={{ maxWidth: 280 }}>Schutzraum entspricht der halben Block-Höhe. Andere Marken, Text, Bildkanten dürfen nicht innerhalb dieses Bereichs liegen.</div>
        <div style={{ display:'flex', gap: 8, marginTop: 6 }}>
          <span className="tag" style={{ background:'oklch(0.88 0.22 145 / 0.1)', borderColor:'oklch(0.88 0.22 145 / 0.4)', color:'oklch(0.88 0.22 145)' }}><span className="dot" style={{ background:'oklch(0.88 0.22 145)', boxShadow:'0 0 8px oklch(0.88 0.22 145)' }} /> Clearspace 1u</span>
        </div>
      </div>
    </div>
  </Frame>
);

// ── 2 · Mindestgrößen ────────────────────────────────────────────────
const MinSizes = () => (
  <Frame label="Logo · Mindestgrößen" subLabel="Print · Screen · Favicon" footer="Unter 16 px nur das Mark verwenden. Wordmark erst ab 64 px lesbar.">
    <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 18, alignItems:'end', height:'100%' }}>
      {[
        { size: 16, label: '16 px', sub: 'favicon · solo mark' },
        { size: 24, label: '24 px', sub: 'app sidebar · min wordmark off' },
        { size: 48, label: '48 px', sub: 'header · standard' },
        { size: 96, label: '96 px', sub: 'marketing hero' },
      ].map((s, i) => (
        <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap: 12 }}>
          <div style={{ height: 110, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
            {s.size < 24 ? <BoldMark size={s.size} /> : <BoldLockup size={s.size * 0.7} />}
          </div>
          <div style={{ width: '100%', height: 1, background:'var(--line)' }} />
          <div className="mono" style={{ fontSize: 10, color:'var(--fg)', letterSpacing:'.1em' }}>{s.label}</div>
          <div className="mono" style={{ fontSize: 9, color:'var(--muted)', letterSpacing:'.12em', textTransform:'uppercase' }}>{s.sub}</div>
        </div>
      ))}
    </div>
  </Frame>
);

// ── 3 · Mark-Varianten ───────────────────────────────────────────────
const MarkVariants = () => (
  <Frame label="Mark · Varianten" subLabel="Color · Mono · Reversed · Outline" footer="Vier zugelassene Auftritte. Auf Bildern grundsätzlich Reversed oder Outline.">
    <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 14, height:'100%' }}>
      {/* color */}
      <div style={{ borderRadius: 14, border:'1px solid var(--line)', background:'oklch(0.16 0.02 280)', padding: 18, display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
        <div className="eyebrow">Color · primary</div>
        <div style={{ display:'grid', placeItems:'center', flex:1 }}><BoldMark size={88} /></div>
      </div>
      {/* mono dark */}
      <div style={{ borderRadius: 14, border:'1px solid var(--line)', background:'oklch(0.16 0.02 280)', padding: 18, display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
        <div className="eyebrow">Mono · on dark</div>
        <div style={{ display:'grid', placeItems:'center', flex:1 }}>
          <span style={{ width: 88, height: 88, borderRadius: 12, background:'oklch(0.18 0.02 280)', border:'1px solid var(--line)', position:'relative', display:'inline-block' }}>
            {[18,43,68].map((t,i) => (
              <span key={i} style={{
                position:'absolute', left: i===0?'16%': i===1?'24%':'16%', right: i===0?'36%': i===1?'16%':'36%',
                top:`${t}%`, height:'14%', borderRadius: 4,
                background:'oklch(0.99 0.005 280)', opacity: 1 - i*0.18
              }} />
            ))}
          </span>
        </div>
      </div>
      {/* mono light */}
      <div style={{ borderRadius: 14, border:'1px solid var(--line-strong)', background:'oklch(0.99 0.005 280)', padding: 18, display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
        <div className="eyebrow" style={{ color:'oklch(0.5 0.02 270)' }}>Mono · on light</div>
        <div style={{ display:'grid', placeItems:'center', flex:1 }}>
          <span style={{ width: 88, height: 88, borderRadius: 12, background:'oklch(0.99 0.005 280)', border:'1px solid oklch(0.85 0.01 280)', position:'relative', display:'inline-block' }}>
            {[18,43,68].map((t,i) => (
              <span key={i} style={{
                position:'absolute', left: i===0?'16%': i===1?'24%':'16%', right: i===0?'36%': i===1?'16%':'36%',
                top:`${t}%`, height:'14%', borderRadius: 4,
                background:'oklch(0.18 0.01 260)', opacity: 1 - i*0.18
              }} />
            ))}
          </span>
        </div>
      </div>
      {/* outline */}
      <div style={{ borderRadius: 14, border:'1px solid var(--line)', background:'oklch(0.16 0.02 280)', padding: 18, display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
        <div className="eyebrow">Outline · over image</div>
        <div style={{ display:'grid', placeItems:'center', flex:1 }}>
          <span style={{ width: 88, height: 88, borderRadius: 12, background:'transparent', border:'1.5px solid oklch(0.99 0.005 280 / 0.9)', position:'relative', display:'inline-block' }}>
            {[18,43,68].map((t,i) => (
              <span key={i} style={{
                position:'absolute', left: i===0?'16%': i===1?'24%':'16%', right: i===0?'36%': i===1?'16%':'36%',
                top:`${t}%`, height:'14%', borderRadius: 3,
                border:'1.5px solid oklch(0.99 0.005 280 / 0.9)'
              }} />
            ))}
          </span>
        </div>
      </div>
    </div>
  </Frame>
);

// ── 4 · Motion Spec ──────────────────────────────────────────────────
const MotionSpec = () => (
  <Frame label="Motion · Mark Reveal" subLabel="2.4s · cubic-bezier(.22,.61,.36,1)" footer="Beim Laden, beim Wechsel zwischen Live-Status, sowie subtil im Sidebar-Header.">
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 24, height:'100%' }}>
      {/* live animation */}
      <div style={{ display:'grid', placeItems:'center', borderRadius: 14, border:'1px dashed var(--line-strong)', background:'oklch(0.10 0.02 280)' }}>
        <span className="mark-bold motion-mark pulse" style={{ width: 160, height: 160 }}>
          <span className="blk b1" />
          <span className="blk b2" />
          <span className="blk b3" />
        </span>
      </div>
      {/* keyframes */}
      <div style={{ display:'flex', flexDirection:'column', gap: 12 }}>
        <div className="eyebrow">Keyframes</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 8 }}>
          {[
            { t: '0%',  o:[0,0,0],     x:[-30, 30, -30] },
            { t: '30%', o:[1,0,0],     x:[ -8, 18, -22] },
            { t: '60%', o:[1,1,0.5],   x:[ -2,  4, -10] },
            { t: '100%',o:[1,1,1],     x:[  0,  0,   0] },
          ].map((k, i) => (
            <div key={i} style={{ borderRadius: 10, border:'1px solid var(--line)', background:'oklch(0.16 0.02 280)', padding: 8, display:'flex', flexDirection:'column', alignItems:'center', gap: 6 }}>
              <div style={{ width: 56, height: 56, position:'relative' }}>
                {[18,43,68].map((tp, j) => (
                  <span key={j} style={{
                    position:'absolute',
                    left: `calc(${j===0?16: j===1?24:16}% + ${k.x[j]*0.5}px)`,
                    right: `calc(${j===0?36: j===1?16:36}% + ${-k.x[j]*0.5}px)`,
                    top:`${tp}%`, height:'14%', borderRadius: 2,
                    background:'linear-gradient(135deg, var(--neon-cyan), var(--neon-violet) 60%, var(--neon-pink))',
                    opacity: k.o[j],
                  }} />
                ))}
              </div>
              <div className="mono" style={{ fontSize: 9, color:'var(--muted)', letterSpacing:'.1em' }}>{k.t}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 6, padding: 12, borderRadius: 10, border:'1px solid var(--line)', background:'oklch(0.10 0.02 280)' }}>
          <div className="mono" style={{ fontSize: 11, lineHeight: 1.6, color:'var(--muted)' }}>
            <div><span style={{ color:'var(--neon-cyan)' }}>blk1</span>: 0 → 100% · delay 0.00s</div>
            <div><span style={{ color:'var(--neon-violet)' }}>blk2</span>: 0 → 100% · delay 0.15s · pulse on live</div>
            <div><span style={{ color:'var(--neon-pink)' }}>blk3</span>: 0 → 100% · delay 0.30s</div>
            <div style={{ marginTop: 6, color:'var(--fg)' }}>easing: cubic-bezier(.22,.61,.36,1)</div>
          </div>
        </div>
      </div>
    </div>
  </Frame>
);

// ── 5 · Brand Sheet — Color ──────────────────────────────────────────
const ColorSheet = () => (
  <Frame label="Brand · Farbe" subLabel="OKLCH · neon trio + neutral stack" footer="Neon-Trio nur als Akzent. Hintergrund-Stack trägt 80 % der Fläche.">
    <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gridTemplateRows:'1fr 1fr', gap: 12, height:'100%' }}>
      {/* neon */}
      <div className="swatch" style={{ background:'linear-gradient(135deg, var(--neon-cyan), oklch(0.7 0.18 220))' }}>
        <div className="name">Neon Cyan</div>
        <div className="meta">oklch(.82 .16 200)</div>
      </div>
      <div className="swatch" style={{ background:'linear-gradient(135deg, var(--neon-violet), oklch(0.55 0.27 290))' }}>
        <div className="name">Neon Violet</div>
        <div className="meta">oklch(.65 .26 295)</div>
      </div>
      <div className="swatch" style={{ background:'linear-gradient(135deg, var(--neon-pink), oklch(0.62 0.24 350))' }}>
        <div className="name">Neon Pink</div>
        <div className="meta">oklch(.72 .24 350)</div>
      </div>
      <div className="swatch" style={{ background:'oklch(0.88 0.22 145)' }}>
        <div className="name" style={{ color:'oklch(0.18 0.05 145)' }}>Live Lime</div>
        <div className="meta" style={{ color:'oklch(0.25 0.05 145)' }}>oklch(.88 .22 145)</div>
      </div>
      {/* neutrals */}
      <div className="swatch" style={{ background:'oklch(0.99 0.005 280)' }}>
        <div className="name" style={{ color:'oklch(0.18 0.01 260)' }}>Paper</div>
        <div className="meta" style={{ color:'oklch(0.4 0.02 270)' }}>oklch(.99 .005 280)</div>
      </div>
      <div className="swatch" style={{ background:'oklch(0.18 0.02 280)' }}>
        <div className="name">Surface</div>
        <div className="meta" style={{ color:'oklch(0.7 0.02 280)' }}>oklch(.18 .02 280)</div>
      </div>
      <div className="swatch" style={{ background:'oklch(0.14 0.02 280)' }}>
        <div className="name">Base</div>
        <div className="meta" style={{ color:'oklch(0.7 0.02 280)' }}>oklch(.14 .02 280)</div>
      </div>
      <div className="swatch" style={{ background:'oklch(0.10 0.02 280)' }}>
        <div className="name">Ink</div>
        <div className="meta" style={{ color:'oklch(0.7 0.02 280)' }}>oklch(.10 .02 280)</div>
      </div>
    </div>
  </Frame>
);

// ── 6 · Brand Sheet — Typografie ─────────────────────────────────────
const TypeSheet = () => (
  <Frame label="Brand · Typografie" subLabel="Geist + JetBrains Mono" footer="Geist trägt Display, UI und Body. Mono nur für Zeit, Codes und Eyebrows.">
    <div style={{ display:'flex', flexDirection:'column', gap: 4, height:'100%', overflow:'hidden' }}>
      <div className="type-row">
        <div className="mono" style={{ fontSize: 10, color:'var(--muted)', letterSpacing:'.14em', textTransform:'uppercase' }}>Display · 56/64</div>
        <div style={{ font:'700 40px/1 Geist', letterSpacing:'-0.025em' }}>Workshop-Planung,<br/>radikal klar.</div>
      </div>
      <div className="type-row">
        <div className="mono" style={{ fontSize: 10, color:'var(--muted)', letterSpacing:'.14em', textTransform:'uppercase' }}>H1 · 28/32</div>
        <div style={{ font:'600 22px/1.15 Geist', letterSpacing:'-0.018em' }}>Strategy Offsite — Spring '26</div>
      </div>
      <div className="type-row">
        <div className="mono" style={{ fontSize: 10, color:'var(--muted)', letterSpacing:'.14em', textTransform:'uppercase' }}>Body · 14/22</div>
        <div style={{ font:'400 14px/1.55 Geist', color:'var(--muted)', maxWidth: 360 }}>14 Blöcke, 2 Breakouts, 8 Methoden aus der Bibliothek. Live-Modus aktiv ab 09:00.</div>
      </div>
      <div className="type-row">
        <div className="mono" style={{ fontSize: 10, color:'var(--muted)', letterSpacing:'.14em', textTransform:'uppercase' }}>Mono · 11/16</div>
        <div className="mono" style={{ fontSize: 13, color:'var(--fg)', letterSpacing:'.04em' }}>09:42 · 12:34 / 20:00 · sessions.hellopure.io/live/8a3-fxk</div>
      </div>
      <div className="type-row">
        <div className="mono" style={{ fontSize: 10, color:'var(--muted)', letterSpacing:'.14em', textTransform:'uppercase' }}>Eyebrow · 11</div>
        <div className="eyebrow" style={{ fontSize: 12 }}>Methode · Reflexion · 20 min</div>
      </div>
    </div>
  </Frame>
);

// ── 7 · Editor Block-Timeline ────────────────────────────────────────
const blocks = [
  { time: '09:00', dur: '15',  label: 'Check-in: Stimmungs-Wetter',     acc: 'var(--neon-cyan)',   type: 'Energizer' },
  { time: '09:15', dur: '20',  label: 'Werte-Sortierung in Trios',      acc: 'var(--neon-violet)', type: 'Übung' },
  { time: '09:35', dur: '30',  label: 'Plenum: Cluster bilden',          acc: 'var(--neon-pink)',   type: 'Diskussion' },
  { time: '10:05', dur: '15',  label: 'Pause',                            acc: 'oklch(0.5 0.02 280)', type: 'Pause' },
  { time: '10:20', dur: '40',  label: 'Strategie-Werkstatt · Breakout',   acc: 'var(--neon-violet)', type: 'Breakout', live: true },
  { time: '11:00', dur: '20',  label: 'Reflexion · stille Notizen',      acc: 'var(--neon-cyan)',   type: 'Reflexion' },
];

const EditorMock = () => (
  <div className="ab" style={{ background:'oklch(0.12 0.02 280)' }}>
    <div className="browserbar">
      <span className="dot3" /><span className="dot3" /><span className="dot3" />
      <div className="url">sessions.hellopure.io/sessions/strat-26-q1</div>
    </div>
    <div style={{ display:'flex', height: 'calc(100% - 36px)' }}>
      <SidebarMock Lockup={({size}) => (
        <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
          <BoldMark size={26} />
          <div style={{ display:'flex', flexDirection:'column', gap: 2 }}>
            <BoldWordmark size={18} />
            <div style={{ display:'flex', alignItems:'center', gap: 6, color:'var(--muted)', fontWeight: 500, fontSize: 9 }}>
              by <UnionLogo size={8} />
            </div>
          </div>
        </div>
      )} />
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth: 0 }}>
        {/* header */}
        <div style={{ padding:'18px 24px', borderBottom:'1px solid var(--line)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div className="eyebrow">Workshop · Tag 1 von 2</div>
            <div style={{ font:'600 20px/1.15 Geist', letterSpacing:'-0.018em', marginTop: 4 }}>Strategy Offsite — Spring '26</div>
          </div>
          <div style={{ display:'flex', gap: 8 }}>
            <span className="tag"><span className="dot" style={{ background:'oklch(0.88 0.22 145)', boxShadow:'0 0 8px oklch(0.88 0.22 145)' }} /> Live · Tag 1</span>
            <span className="tag">14 Blöcke · 4:25 h</span>
          </div>
        </div>
        {/* timeline */}
        <div style={{ flex:1, overflow:'hidden', padding:'16px 24px', display:'flex', flexDirection:'column', gap: 6 }}>
          {blocks.map((b, i) => (
            <div key={i} className="block-row" style={{ background: b.live ? 'linear-gradient(90deg, oklch(0.65 0.26 295 / 0.12), oklch(0.16 0.02 280) 40%)' : 'var(--bg-2)', borderColor: b.live ? 'oklch(0.65 0.26 295 / 0.45)' : 'var(--line)' }}>
              <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
                <span className="acc" style={{ background: b.acc }} />
                <span className="time">{b.time}</span>
              </div>
              <span className="dur">{b.dur} min</span>
              <div>
                <div className="label">{b.label}</div>
                <div className="mono" style={{ fontSize: 10, color:'var(--muted)', marginTop: 3, letterSpacing:'.1em', textTransform:'uppercase' }}>{b.type}</div>
              </div>
              {b.live && (
                <span className="tag" style={{ background:'oklch(0.88 0.22 145 / 0.12)', borderColor:'oklch(0.88 0.22 145 / 0.4)', color:'oklch(0.88 0.22 145)' }}>
                  <span className="dot" style={{ background:'oklch(0.88 0.22 145)', boxShadow:'0 0 8px oklch(0.88 0.22 145)' }} /> läuft · 12:34
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// ── 8 · Method Library ───────────────────────────────────────────────
const methods = [
  { t: 'Werte-Sortierung', cat: 'Reflexion', dur: '20 min', g: 'linear-gradient(135deg, var(--neon-cyan), var(--neon-violet))' },
  { t: 'Cluster-Mapping',  cat: 'Synthese',  dur: '30 min', g: 'linear-gradient(135deg, var(--neon-violet), var(--neon-pink))' },
  { t: 'Trio-Interview',   cat: 'Übung',     dur: '25 min', g: 'linear-gradient(135deg, var(--neon-pink), oklch(0.6 0.18 30))' },
  { t: 'Stimmungs-Wetter', cat: 'Energizer', dur: '10 min', g: 'linear-gradient(135deg, var(--neon-lime), var(--neon-cyan))' },
  { t: 'Stille Notizen',   cat: 'Reflexion', dur: '15 min', g: 'linear-gradient(135deg, var(--neon-violet), oklch(0.45 0.18 280))' },
  { t: 'Plenum-Debrief',   cat: 'Diskussion', dur: '20 min', g: 'linear-gradient(135deg, var(--neon-cyan), var(--neon-pink))' },
];

const MethodLibrary = () => (
  <div className="ab" style={{ background:'oklch(0.12 0.02 280)' }}>
    <div className="browserbar">
      <span className="dot3" /><span className="dot3" /><span className="dot3" />
      <div className="url">sessions.hellopure.io/dashboard/library</div>
    </div>
    <div style={{ display:'flex', height: 'calc(100% - 36px)' }}>
      <SidebarMock Lockup={({size}) => (
        <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
          <BoldMark size={26} />
          <div style={{ display:'flex', flexDirection:'column', gap: 2 }}>
            <BoldWordmark size={18} />
            <div style={{ display:'flex', alignItems:'center', gap: 6, color:'var(--muted)', fontWeight: 500, fontSize: 9 }}>
              by <UnionLogo size={8} />
            </div>
          </div>
        </div>
      )} />
      <div style={{ flex:1, padding:'24px 28px', display:'flex', flexDirection:'column', gap: 18, minWidth: 0 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
          <div>
            <div className="eyebrow">Methodik</div>
            <div style={{ font:'600 24px/1.15 Geist', letterSpacing:'-0.02em', marginTop: 4 }}>Methoden-Bibliothek</div>
            <div className="body" style={{ marginTop: 4 }}>42 Methoden · 6 Kategorien · von UNION + Community.</div>
          </div>
          <div style={{ display:'flex', gap: 8 }}>
            {['Alle', 'Reflexion', 'Übung', 'Energizer'].map((c, i) => (
              <span key={c} className="tag" style={i===0 ? { background:'oklch(0.65 0.26 295 / 0.18)', borderColor:'oklch(0.65 0.26 295 / 0.5)', color:'var(--fg)' } : {}}><span className="dot" style={i!==0 ? { background:'oklch(0.5 0.02 280)', boxShadow:'none' } : {}}/>{c}</span>
            ))}
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 12, flex:1, minHeight: 0 }}>
          {methods.map((m, i) => (
            <div key={i} className="meth-card">
              <div className="swirl" style={{ background: m.g }} />
              <div style={{ position:'relative' }}>
                <span className="tag"><span className="dot" /> {m.cat}</span>
              </div>
              <div style={{ position:'relative' }}>
                <div style={{ font:'600 16px/1.2 Geist', letterSpacing:'-0.01em' }}>{m.t}</div>
                <div className="mono" style={{ fontSize: 10, color:'var(--muted)', marginTop: 6, letterSpacing:'.12em', textTransform:'uppercase' }}>{m.dur} · 4–24 Pers.</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// ── 9 · App Icon Set ─────────────────────────────────────────────────
const AppIconCard = ({ size = 96, radius = 22, bg, label, dark = true, content }) => (
  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap: 10 }}>
    <div style={{
      width: size, height: size, borderRadius: radius, background: bg,
      display:'grid', placeItems:'center',
      boxShadow: '0 10px 30px -10px oklch(0 0 0 / 0.6)',
      border: dark ? 'none' : '1px solid oklch(0.85 0.01 280)',
      position:'relative', overflow:'hidden',
    }}>
      {content}
    </div>
    <div className="mono" style={{ fontSize: 10, color:'var(--muted)', letterSpacing:'.12em', textTransform:'uppercase' }}>{label}</div>
  </div>
);

const InnerMark = ({ s = 64, mode = 'color' }) => {
  const blkBg = mode === 'color'
    ? 'linear-gradient(135deg, var(--neon-cyan), var(--neon-violet) 60%, var(--neon-pink))'
    : mode === 'mono-light' ? 'oklch(0.18 0.01 260)' : 'oklch(0.99 0.005 280)';
  return (
    <span style={{ width: s, height: s, position:'relative', display:'inline-block' }}>
      {[18,43,68].map((t, i) => (
        <span key={i} style={{
          position:'absolute',
          left: i===0?'16%': i===1?'24%':'16%',
          right: i===0?'36%': i===1?'16%':'36%',
          top:`${t}%`, height:'14%', borderRadius: 4,
          background: blkBg, opacity: mode==='color' ? (1 - i*0.18) : (1 - i*0.18),
          boxShadow: mode === 'color' ? '0 0 12px oklch(0.65 0.26 295 / 0.45)' : 'none',
        }} />
      ))}
    </span>
  );
};

const IconSet = () => (
  <Frame label="App Icon · Favicon Set" subLabel="iOS · macOS · Web · Notification" footer="Mark immer auf 56% der Fläche, optisch zentriert. Neon-Farbe nur für Primary.">
    <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap: 18, alignItems:'center', height:'100%' }}>
      <AppIconCard label="iOS · primary" size={96} radius={22}
        bg="linear-gradient(180deg, oklch(0.22 0.03 280), oklch(0.10 0.02 280))"
        content={<InnerMark s={56} />}
      />
      <AppIconCard label="macOS · light" size={96} radius={22} dark={false}
        bg="oklch(0.99 0.005 280)"
        content={<InnerMark s={56} mode="mono-light" />}
      />
      <AppIconCard label="Tinted" size={96} radius={22}
        bg="linear-gradient(135deg, oklch(0.55 0.22 295), oklch(0.4 0.22 295))"
        content={<InnerMark s={56} mode="mono" />}
      />
      <AppIconCard label="Notification · 32" size={56} radius={12}
        bg="oklch(0.10 0.02 280)"
        content={<InnerMark s={36} />}
      />
      <AppIconCard label="Favicon · 16" size={32} radius={6}
        bg="oklch(0.10 0.02 280)"
        content={<InnerMark s={22} />}
      />
    </div>
  </Frame>
);

// ── canvas ───────────────────────────────────────────────────────────
const App = () => (
  <DesignCanvas>
    <DCSection id="logo" title="Logo-System" subtitle="Construction · Mindestgrößen · Mark-Varianten">
      <DCArtboard id="lockup-primary" label="Primary Lockup · groß"     width={620} height={360}>
        <Frame label="Primary Lockup" subLabel="100 % size · dark"
          footer="Sessions wird in Geist 700 gesetzt, ‘by UNION’ in 0.2× Höhe untergeordnet.">
          <div style={{ display:'grid', placeItems:'center', height:'100%' }}>
            <BoldLockup size={84} />
          </div>
        </Frame>
      </DCArtboard>
      <DCArtboard id="construction" label="Construction · 12er Raster" width={760} height={420}><Construction /></DCArtboard>
      <DCArtboard id="min-sizes"    label="Mindestgrößen"               width={760} height={360}><MinSizes /></DCArtboard>
      <DCArtboard id="mark-vars"    label="Mark · Varianten"            width={760} height={360}><MarkVariants /></DCArtboard>
    </DCSection>

    <DCSection id="motion" title="Motion" subtitle="Wie das Mark sich verhält — Reveal & Live-Pulse">
      <DCArtboard id="motion-spec" label="Motion · Reveal + Pulse"      width={900} height={460}><MotionSpec /></DCArtboard>
    </DCSection>

    <DCSection id="brand" title="Brand Sheet" subtitle="Farbe · Typografie">
      <DCArtboard id="color-sheet" label="Farbe · neon trio + neutral"  width={760} height={460}><ColorSheet /></DCArtboard>
      <DCArtboard id="type-sheet"  label="Typografie · Geist + Mono"    width={760} height={460}><TypeSheet /></DCArtboard>
    </DCSection>

    <DCSection id="apps" title="In-Product" subtitle="Workshop-Editor · Method Library">
      <DCArtboard id="editor-mock" label="Workshop-Editor · Block-Timeline" width={1040} height={620}><EditorMock /></DCArtboard>
      <DCArtboard id="library-mock" label="Method Library"                 width={1040} height={620}><MethodLibrary /></DCArtboard>
    </DCSection>

    <DCSection id="icons" title="App Icon · Favicon" subtitle="iOS · macOS · Web · Notification · 16er Favicon">
      <DCArtboard id="icon-set" label="App Icon Set" width={900} height={420}><IconSet /></DCArtboard>
    </DCSection>
  </DesignCanvas>
);

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
