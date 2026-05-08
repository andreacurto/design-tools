import { useState, useEffect } from 'react'
import { useTypeScale, generateCSS, generateFigma, evalAt } from './useTypeScale'
import type { Settings } from './useTypeScale'

// ── Colour tokens (mirroring the original palette) ──────────────────────────
const C = {
  bg: '#f0f0ee',
  white: '#fff',
  text: '#1a1a1a',
  border: '#e8e8e4',
  borderLight: '#f0f0ee',
  borderInput: '#e4e4de',
  inputBg: '#fafaf8',
  muted: '#c0c0ba',
  mutedDark: '#888',
  subtle: '#555',
  hover: '#f5f5f2',
  dark: '#1a1a1a',
  dark2: '#333',
  badge: '#f0f0ee',
  badgeBase: '#e4e4de',
  mod: '#d4a830',
  modBg: '#fffdf0',
  del: '#d84040',
  delBg: '#fceaea',
  prevBg: '#f8f8f5',
  previewBorder: '#ececea',
} as const

// ── Tiny shared primitives ───────────────────────────────────────────────────

function ColHeader({ label }: { label: string }) {
  return (
    <div
      style={{
        padding: '10px 14px',
        borderBottom: `1px solid ${C.borderLight}`,
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '.5px',
          textTransform: 'uppercase',
          color: C.muted,
        }}
      >
        {label}
      </span>
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ display: 'block', fontSize: 12, color: C.mutedDark, marginBottom: 5 }}>
      {children}
    </label>
  )
}

function DrawerInput({
  type = 'text',
  value,
  min,
  max,
  onChange,
}: {
  type?: string
  value: string | number
  min?: number
  max?: number
  onChange: (v: string) => void
}) {
  return (
    <input
      type={type}
      value={value}
      min={min}
      max={max}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%',
        padding: '7px 10px',
        border: `1px solid ${C.borderInput}`,
        borderRadius: 7,
        background: C.inputBg,
        color: C.text,
        outline: 'none',
        fontSize: 12,
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = '#999'
        e.currentTarget.style.background = C.white
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = C.borderInput
        e.currentTarget.style.background = C.inputBg
      }}
    />
  )
}

function DrawerSelect({
  value,
  onChange,
  children,
}: {
  value: string
  onChange: (v: string) => void
  children: React.ReactNode
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%',
        padding: '7px 10px',
        border: `1px solid ${C.borderInput}`,
        borderRadius: 7,
        background: C.inputBg,
        color: C.text,
        outline: 'none',
        fontSize: 12,
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = '#999'
        e.currentTarget.style.background = C.white
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = C.borderInput
        e.currentTarget.style.background = C.inputBg
      }}
    >
      {children}
    </select>
  )
}

// ── Settings Drawer ──────────────────────────────────────────────────────────

function SettingsDrawer({
  open,
  onClose,
  settings,
  onUpdate,
}: {
  open: boolean
  onClose: () => void
  settings: Settings
  onUpdate: <K extends keyof Settings>(key: K, value: Settings[K]) => void
}) {
  return (
    <>
      {/* overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,.18)',
          zIndex: 100,
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'all' : 'none',
          transition: 'opacity .25s',
        }}
      />
      {/* drawer */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: 480,
          background: C.white,
          zIndex: 101,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform .3s cubic-bezier(.32,.72,0,1)',
        }}
      >
        {/* header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            borderBottom: `1px solid ${C.borderLight}`,
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600 }}>Impostazioni</span>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: '#bbb',
              fontSize: 20,
              lineHeight: 1,
              padding: '2px 6px',
              borderRadius: 5,
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = C.borderLight
              e.currentTarget.style.color = C.subtle
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'none'
              e.currentTarget.style.color = '#bbb'
            }}
          >
            ×
          </button>
        </div>

        {/* body */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {/* Tipografia */}
          <DrawerSection title="Tipografia">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <DrawerField label="Font family">
                <DrawerInput value={settings.font} onChange={(v) => onUpdate('font', v)} />
              </DrawerField>
              <DrawerField label="Font weight">
                <DrawerSelect value={settings.weight} onChange={(v) => onUpdate('weight', v)}>
                  {['300', '400', '500', '600', '700'].map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </DrawerSelect>
              </DrawerField>
            </div>
          </DrawerSection>

          {/* Viewport */}
          <DrawerSection title="Viewport">
            <div
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}
            >
              <DrawerField label="Min (px)">
                <DrawerInput
                  type="number"
                  value={settings.vpMin}
                  min={200}
                  max={1600}
                  onChange={(v) => onUpdate('vpMin', +v || 390)}
                />
              </DrawerField>
              <DrawerField label="Max (px)">
                <DrawerInput
                  type="number"
                  value={settings.vpMax}
                  min={400}
                  max={3000}
                  onChange={(v) => onUpdate('vpMax', +v || 1540)}
                />
              </DrawerField>
            </div>
            <DrawerField label="Viewport unit">
              <DrawerSelect value={settings.vpUnit} onChange={(v) => onUpdate('vpUnit', v)}>
                {['vw', 'cqi', 'dvw', 'svw'].map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </DrawerSelect>
            </DrawerField>
          </DrawerSection>

          {/* Dimensioni base */}
          <DrawerSection title="Dimensioni base">
            <div
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}
            >
              <DrawerField label="Min (px)">
                <DrawerInput
                  type="number"
                  value={settings.baseMin}
                  min={8}
                  max={32}
                  onChange={(v) => onUpdate('baseMin', +v || 16)}
                />
              </DrawerField>
              <DrawerField label="Max (px)">
                <DrawerInput
                  type="number"
                  value={settings.baseMax}
                  min={8}
                  max={48}
                  onChange={(v) => onUpdate('baseMax', +v || 18)}
                />
              </DrawerField>
            </div>
            <DrawerField label="Root font size (px)">
              <DrawerInput
                type="number"
                value={settings.root}
                min={10}
                max={32}
                onChange={(v) => onUpdate('root', +v || 16)}
              />
            </DrawerField>
          </DrawerSection>

          {/* Scala */}
          <DrawerSection title="Scala tipografica">
            <DrawerField label="Ratio per viewport min">
              <DrawerSelect value={String(settings.rMin)} onChange={(v) => onUpdate('rMin', +v)}>
                {RATIO_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </DrawerSelect>
            </DrawerField>
            <DrawerField label="Ratio per viewport max" style={{ marginTop: 12 }}>
              <DrawerSelect value={String(settings.rMax)} onChange={(v) => onUpdate('rMax', +v)}>
                {RATIO_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </DrawerSelect>
            </DrawerField>
          </DrawerSection>

          {/* Export */}
          <DrawerSection title="Export" last>
            <DrawerField label="Nomenclatura scala">
              <DrawerSelect
                value={settings.namingMode}
                onChange={(v) => onUpdate('namingMode', v as Settings['namingMode'])}
              >
                <option value="numeric">Numerica (100, 200… / 075, 050…)</option>
                <option value="tshirt">T-shirt (lg, xl, 2xl… / sm, xs, 2xs…)</option>
              </DrawerSelect>
            </DrawerField>
            <DrawerField label="Prefisso token" style={{ marginTop: 12 }}>
              <DrawerInput value={settings.prefix} onChange={(v) => onUpdate('prefix', v)} />
            </DrawerField>
          </DrawerSection>
        </div>
      </div>
    </>
  )
}

const RATIO_OPTIONS = [
  { value: '1.067', label: 'Minor Second (1.067)' },
  { value: '1.125', label: 'Major Second (1.125)' },
  { value: '1.200', label: 'Minor Third (1.200)' },
  { value: '1.250', label: 'Major Third (1.250)' },
  { value: '1.333', label: 'Perfect Fourth (1.333)' },
  { value: '1.414', label: 'Aug. Fourth (1.414)' },
  { value: '1.500', label: 'Perfect Fifth (1.500)' },
  { value: '1.618', label: 'Golden Ratio (1.618)' },
]

function DrawerSection({
  title,
  last,
  children,
}: {
  title: string
  last?: boolean
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        padding: 20,
        borderBottom: last ? 'none' : `1px solid ${C.borderLight}`,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '.6px',
          textTransform: 'uppercase',
          color: C.muted,
          marginBottom: 14,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  )
}

function DrawerField({
  label,
  children,
  style,
}: {
  label: string
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <div style={style}>
      <FieldLabel>{label}</FieldLabel>
      {children}
    </div>
  )
}

// ── Scale Column ─────────────────────────────────────────────────────────────

function ScaleColumn({ ts }: { ts: ReturnType<typeof useTypeScale> }) {
  const {
    settings,
    scale,
    getPx,
    isMod,
    addAbove,
    addBelow,
    removeRow,
    setOverride,
    resetOverride,
    canAddBelow,
  } = ts
  const { prefix } = settings

  return (
    <div
      style={{
        background: C.white,
        borderRight: `1px solid ${C.border}`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <ColHeader label="Livelli della scala" />
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
        {/* Add above */}
        <AddBtn onClick={addAbove}>+ Aggiungi livello sopra</AddBtn>

        {scale.map((row) => {
          const mMin = getPx(row.key, 'min')
          const mMax = getPx(row.key, 'max')
          const pMin = mMin
          const pMax = mMax
          const rMin = (pMin / settings.root).toFixed(3)
          const rMax = (pMax / settings.root).toFixed(3)

          // multiplier values for inputs
          const multMin = getPx(row.key, 'min') / settings.baseMin
          const multMax = getPx(row.key, 'max') / settings.baseMax

          return (
            <div
              key={row.key}
              style={{
                padding: '8px 10px 8px 12px',
                borderBottom: `1px solid #f5f5f2`,
                background: row.isBase ? C.inputBg : undefined,
              }}
            >
              {/* header row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 7,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    fontFamily: 'ui-monospace, monospace',
                    color: row.isBase ? '#111' : '#444',
                    background: row.isBase ? C.badgeBase : C.badge,
                    padding: '2px 7px',
                    borderRadius: 4,
                  }}
                >
                  --{prefix}-{row.key}
                </span>
                <div style={{ display: 'flex', gap: 1 }}>
                  <IconBtn title="Ripristina" onClick={() => resetOverride(row.key)}>
                    ↺
                  </IconBtn>
                  {!row.isBase && (
                    <IconBtn title="Rimuovi" danger onClick={() => removeRow(row.key)}>
                      ×
                    </IconBtn>
                  )}
                </div>
              </div>

              {/* min / max inputs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {(['min', 'max'] as const).map((side) => {
                  const mult = side === 'min' ? multMin : multMax
                  const px = side === 'min' ? pMin : pMax
                  const rem = side === 'min' ? rMin : rMax
                  const modified = isMod(row.key, side)
                  return (
                    <div key={side} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: '.4px',
                          textTransform: 'uppercase',
                          color: C.muted,
                        }}
                      >
                        {side === 'min' ? 'Min' : 'Max'}
                      </span>
                      <input
                        type="number"
                        value={mult.toFixed(4)}
                        min={0.05}
                        max={100}
                        step={0.001}
                        style={{
                          width: '100%',
                          padding: '4px 7px',
                          border: `1px solid ${modified ? C.mod : C.borderInput}`,
                          borderRadius: 5,
                          background: modified ? C.modBg : C.inputBg,
                          color: C.text,
                          outline: 'none',
                          fontSize: 12,
                        }}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value)
                          setOverride(row.key, side, isNaN(v) ? null : v)
                        }}
                        onFocus={(e) => {
                          if (!modified) e.currentTarget.style.borderColor = '#999'
                        }}
                        onBlur={(e) => {
                          if (!modified) e.currentTarget.style.borderColor = C.borderInput
                        }}
                      />
                      <div style={{ fontSize: 11, color: C.subtle, fontWeight: 500, marginTop: 2 }}>
                        {Math.round(px)}px
                      </div>
                      <div style={{ fontSize: 11, color: '#c8c8c4' }}>{rem}rem</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Add below */}
        <AddBtn onClick={addBelow} disabled={!canAddBelow}>
          + Aggiungi livello sotto
        </AddBtn>
      </div>
    </div>
  )
}

function AddBtn({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        fontSize: 11,
        fontWeight: 500,
        padding: '6px 12px',
        border: 'none',
        borderRadius: 6,
        cursor: disabled ? 'not-allowed' : 'pointer',
        width: 'calc(100% - 24px)',
        margin: '5px 12px',
        background: disabled ? C.border : C.dark,
        color: disabled ? '#b0b0a8' : C.white,
        transition: 'all .15s',
      }}
      onMouseOver={(e) => {
        if (!disabled) e.currentTarget.style.background = C.dark2
      }}
      onMouseOut={(e) => {
        if (!disabled) e.currentTarget.style.background = C.dark
      }}
    >
      {children}
    </button>
  )
}

function IconBtn({
  children,
  onClick,
  title,
  danger,
}: {
  children: React.ReactNode
  onClick: () => void
  title?: string
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        border: 'none',
        background: 'none',
        cursor: 'pointer',
        padding: '4px 6px',
        borderRadius: 5,
        lineHeight: 1,
        color: '#c8c8c4',
        fontSize: 15,
        transition: 'all .15s',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.background = danger ? C.delBg : C.borderLight
        e.currentTarget.style.color = danger ? C.del : C.subtle
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.background = 'none'
        e.currentTarget.style.color = '#c8c8c4'
      }}
    >
      {children}
    </button>
  )
}

// ── Preview Column ───────────────────────────────────────────────────────────

function PreviewColumn({
  ts,
  viewport,
  setViewport,
  sampleText,
  setSampleText,
}: {
  ts: ReturnType<typeof useTypeScale>
  viewport: number
  setViewport: (v: number) => void
  sampleText: string
  setSampleText: (t: string) => void
}) {
  const { settings, scale, getPx } = ts

  function syncVp(val: number) {
    const clamped = Math.max(settings.vpMin, Math.min(settings.vpMax, Math.round(val)))
    setViewport(clamped)
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: C.prevBg,
      }}
    >
      {/* toolbar */}
      <div
        style={{
          background: C.white,
          borderBottom: `1px solid ${C.border}`,
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexShrink: 0,
        }}
      >
        <label style={{ fontSize: 11, color: '#b0b0a8', whiteSpace: 'nowrap' }}>Viewport</label>
        <input
          type="range"
          min={settings.vpMin}
          max={settings.vpMax}
          value={viewport}
          step={1}
          style={{ flex: 1, minWidth: 0 }}
          onInput={(e) => syncVp(+(e.target as HTMLInputElement).value)}
        />
        <input
          type="number"
          value={viewport}
          min={settings.vpMin}
          max={settings.vpMax}
          style={{
            width: 58,
            padding: '4px 7px',
            border: `1px solid ${C.borderInput}`,
            borderRadius: 5,
            background: C.inputBg,
            color: C.text,
            outline: 'none',
            fontSize: 12,
            fontWeight: 500,
            textAlign: 'right',
          }}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10)
            if (!isNaN(v)) syncVp(v)
          }}
          onBlur={(e) => {
            const v = parseInt(e.target.value, 10)
            syncVp(isNaN(v) ? settings.vpMin : v)
          }}
        />
        <span style={{ fontSize: 11, color: C.muted }}>px</span>
        <div
          style={{ width: 1, height: 16, background: C.border, flexShrink: 0, margin: '0 2px' }}
        />
        <input
          type="text"
          value={sampleText}
          placeholder="Testo di esempio…"
          style={{
            flex: 1,
            minWidth: 0,
            padding: '5px 9px',
            border: `1px solid ${C.borderInput}`,
            borderRadius: 5,
            background: C.inputBg,
            color: '#999',
            outline: 'none',
            fontSize: 12,
          }}
          onChange={(e) => setSampleText(e.target.value)}
          onFocus={(e) => {
            e.currentTarget.style.color = C.text
            e.currentTarget.style.background = C.white
            e.currentTarget.style.borderColor = '#999'
          }}
          onBlur={(e) => {
            e.currentTarget.style.color = '#999'
            e.currentTarget.style.background = C.inputBg
            e.currentTarget.style.borderColor = C.borderInput
          }}
        />
      </div>

      {/* canvas */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
        {scale.map((row) => {
          const mn = getPx(row.key, 'min')
          const mx = getPx(row.key, 'max')
          const px = evalAt(mn, mx, viewport, settings)
          return (
            <div
              key={row.key}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 12,
                padding: '7px 0',
                borderBottom: `1px solid ${C.previewBorder}`,
              }}
            >
              <div style={{ width: 92, flexShrink: 0 }}>
                <div
                  style={{
                    fontSize: 10,
                    fontFamily: 'ui-monospace, monospace',
                    color: row.isBase ? '#aaa' : '#ccc',
                  }}
                >
                  --{settings.prefix}-{row.key}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: row.isBase ? '#bbb' : '#ddd',
                    marginTop: 1,
                  }}
                >
                  {px}px
                </div>
              </div>
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  lineHeight: 1.15,
                  fontSize: px,
                  fontFamily: `'${settings.font}', sans-serif`,
                  fontWeight: settings.weight,
                  transition: 'font-size .1s ease',
                }}
              >
                {sampleText || 'The quick brown fox jumps over the lazy dog'}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Export Column ─────────────────────────────────────────────────────────────

function ExportColumn({ ts }: { ts: ReturnType<typeof useTypeScale> }) {
  const { settings, scale, getPx } = ts
  const [activeTab, setActiveTab] = useState<'css' | 'figma'>('css')
  const [fmt, setFmt] = useState<'root' | 'scss'>('root')
  const [cssCopied, setCssCopied] = useState(false)
  const [figmaCopied, setFigmaCopied] = useState(false)

  const cssOutput = generateCSS(scale, settings, getPx, fmt)
  const figmaOutput = generateFigma(scale, settings, getPx)

  function copy(text: string, setCopied: (v: boolean) => void) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  function downloadFigma() {
    const blob = new Blob([figmaOutput], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${settings.prefix}.tokens.json`
    a.click()
  }

  return (
    <div
      style={{
        background: C.white,
        borderLeft: `1px solid ${C.border}`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: `1px solid ${C.border}`,
          padding: '0 12px',
          flexShrink: 0,
        }}
      >
        {(['css', 'figma'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              fontSize: 12,
              padding: '9px 10px',
              cursor: 'pointer',
              border: 'none',
              borderBottom: `2px solid ${activeTab === tab ? C.dark : 'transparent'}`,
              color: activeTab === tab ? C.dark : '#aaa',
              background: 'none',
              marginBottom: -1,
              transition: 'color .15s',
              textTransform: 'uppercase',
              letterSpacing: '.3px',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* CSS pane */}
      {activeTab === 'css' && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            overflow: 'hidden',
            minHeight: 0,
          }}
        >
          <div
            style={{
              padding: '8px 12px',
              borderBottom: `1px solid ${C.borderLight}`,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              flexShrink: 0,
            }}
          >
            {(['root', 'scss'] as const).map((f) => (
              <FmtBtn key={f} active={fmt === f} onClick={() => setFmt(f)}>
                {f === 'root' ? 'CSS + :root' : 'SCSS & PostCSS'}
              </FmtBtn>
            ))}
            <ActBtn style={{ marginLeft: 'auto' }} onClick={() => copy(cssOutput, setCssCopied)}>
              {cssCopied ? 'Copiato!' : 'Copia'}
            </ActBtn>
          </div>
          <div
            style={{
              flex: 1,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
            }}
          >
            <pre
              style={{
                margin: 0,
                padding: '14px 16px',
                fontFamily: 'ui-monospace, monospace',
                fontSize: 11,
                lineHeight: 1.8,
                color: '#333',
                overflow: 'auto',
                flex: 1,
                whiteSpace: 'pre',
                tabSize: 2,
              }}
            >
              {cssOutput}
            </pre>
          </div>
        </div>
      )}

      {/* Figma pane */}
      {activeTab === 'figma' && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            overflow: 'hidden',
            minHeight: 0,
          }}
        >
          <div
            style={{
              padding: '8px 12px',
              borderBottom: `1px solid ${C.borderLight}`,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 11, color: C.muted }}>Design Tokens JSON</span>
            <ActBtn
              style={{ marginLeft: 'auto' }}
              onClick={() => copy(figmaOutput, setFigmaCopied)}
            >
              {figmaCopied ? 'Copiato!' : 'Copia'}
            </ActBtn>
            <ActBtn onClick={downloadFigma}>Download</ActBtn>
          </div>
          <div
            style={{
              flex: 1,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
            }}
          >
            <pre
              style={{
                margin: 0,
                padding: '14px 16px',
                fontFamily: 'ui-monospace, monospace',
                fontSize: 11,
                lineHeight: 1.8,
                color: '#333',
                overflow: 'auto',
                flex: 1,
                whiteSpace: 'pre',
                tabSize: 2,
              }}
            >
              {figmaOutput}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

function FmtBtn({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      style={{
        fontSize: 11,
        fontWeight: 500,
        padding: '5px 10px',
        border: 'none',
        borderRadius: 6,
        cursor: 'pointer',
        background: active ? C.dark : C.borderLight,
        color: active ? C.white : C.subtle,
        transition: 'all .15s',
      }}
      onMouseOver={(e) => {
        if (!active) e.currentTarget.style.background = C.badgeBase
      }}
      onMouseOut={(e) => {
        if (!active) e.currentTarget.style.background = C.borderLight
      }}
    >
      {children}
    </button>
  )
}

function ActBtn({
  onClick,
  children,
  style,
}: {
  onClick: () => void
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <button
      onClick={onClick}
      style={{
        fontSize: 11,
        padding: '5px 10px',
        border: `1px solid ${C.borderInput}`,
        borderRadius: 6,
        background: C.white,
        cursor: 'pointer',
        color: C.subtle,
        whiteSpace: 'nowrap',
        transition: 'all .15s',
        ...style,
      }}
      onMouseOver={(e) => (e.currentTarget.style.background = C.hover)}
      onMouseOut={(e) => (e.currentTarget.style.background = C.white)}
    >
      {children}
    </button>
  )
}

// ── Root component ────────────────────────────────────────────────────────────

export default function FluidTypeScale() {
  const ts = useTypeScale()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [viewport, setViewport] = useState(ts.settings.vpMin)
  const [sampleText, setSampleText] = useState('The quick brown fox jumps over the lazy dog')

  // Keep viewport in bounds when vpMin/vpMax change
  useEffect(() => {
    setViewport((v) => Math.max(ts.settings.vpMin, Math.min(ts.settings.vpMax, v)))
  }, [ts.settings.vpMin, ts.settings.vpMax])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        fontFamily: 'system-ui, sans-serif',
        fontSize: 13,
        color: C.text,
        background: C.bg,
      }}
    >
      {/* Topbar */}
      <header
        style={{
          background: C.white,
          borderBottom: `1px solid ${C.border}`,
          height: 44,
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: 8,
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-.2px', flex: 1 }}>
          Fluid Type Scale Generator
        </span>
        <button
          onClick={() => setDrawerOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            border: `1px solid ${C.borderInput}`,
            borderRadius: 7,
            background: C.white,
            cursor: 'pointer',
            color: C.subtle,
            fontSize: 12,
            fontWeight: 500,
            transition: 'all .15s',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = C.hover
            e.currentTarget.style.borderColor = '#ccc'
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = C.white
            e.currentTarget.style.borderColor = C.borderInput
          }}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            <line x1="2" y1="4" x2="14" y2="4" />
            <line x1="2" y1="8" x2="14" y2="8" />
            <line x1="2" y1="12" x2="14" y2="12" />
          </svg>
          Impostazioni
        </button>
      </header>

      {/* Settings drawer */}
      <SettingsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        settings={ts.settings}
        onUpdate={ts.updateSetting}
      />

      {/* Workspace */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(340px,.5fr) 1fr minmax(340px,.5fr)',
          flex: 1,
          overflow: 'hidden',
          minHeight: 0,
        }}
      >
        <ScaleColumn ts={ts} />
        <PreviewColumn
          ts={ts}
          viewport={viewport}
          setViewport={setViewport}
          sampleText={sampleText}
          setSampleText={setSampleText}
        />
        <ExportColumn ts={ts} />
      </div>
    </div>
  )
}
