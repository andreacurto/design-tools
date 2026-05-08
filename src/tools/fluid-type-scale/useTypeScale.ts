import { useState, useCallback } from 'react'

export const NUMERIC_BELOW = ['075', '050', '025', '015']
export const MAX_BELOW = 4

export interface ScaleRow {
  key: string
  isBase: boolean
}

export interface Settings {
  vpMin: number
  vpMax: number
  vpUnit: string
  baseMin: number
  baseMax: number
  root: number
  rMin: number
  rMax: number
  font: string
  weight: string
  prefix: string
  namingMode: 'numeric' | 'tshirt'
}

type Overrides = Record<string, { min: number | null; max: number | null }>

const DEFAULT_SETTINGS: Settings = {
  vpMin: 390,
  vpMax: 1540,
  vpUnit: 'vw',
  baseMin: 16,
  baseMax: 18,
  root: 16,
  rMin: 1.2,
  rMax: 1.25,
  font: 'Inter',
  weight: '400',
  prefix: 'text',
  namingMode: 'tshirt',
}

function aboveKey(n: number, naming: string): string {
  if (naming === 'tshirt') {
    if (n === 1) return 'lg'
    if (n === 2) return 'xl'
    return `${n - 1}xl`
  }
  return String((n + 1) * 100)
}

function belowKey(n: number, naming: string): string {
  if (naming === 'tshirt') {
    if (n === 1) return 'sm'
    if (n === 2) return 'xs'
    return `${n - 1}xs`
  }
  return NUMERIC_BELOW[Math.min(n - 1, NUMERIC_BELOW.length - 1)]
}

export function isAbove(key: string, naming: string): boolean {
  if (naming === 'tshirt') return /^(\d+xl|xl|lg)$/.test(key)
  return /^\d+$/.test(key) && parseInt(key) % 100 === 0
}

export function isBelow(key: string, naming: string): boolean {
  if (naming === 'tshirt') return /^(\d+xs|xs|sm)$/.test(key)
  return NUMERIC_BELOW.includes(key)
}

function reassignKeys(rows: ScaleRow[], naming: string): ScaleRow[] {
  const baseIdx = rows.findIndex((r) => r.isBase)
  return rows.map((r, i) => {
    if (r.isBase) return { ...r, key: naming === 'numeric' ? '100' : 'base' }
    const diff = baseIdx - i
    return {
      ...r,
      key: diff > 0 ? aboveKey(diff, naming) : belowKey(Math.abs(diff), naming),
    }
  })
}

function makeInitialScale(naming: string): ScaleRow[] {
  const raw: ScaleRow[] = [
    { key: '', isBase: false },
    { key: '', isBase: false },
    { key: '', isBase: false },
    { key: '', isBase: false },
    { key: '', isBase: false },
    { key: '', isBase: false },
    { key: 'base', isBase: true },
    { key: '', isBase: false },
    { key: '', isBase: false },
  ]
  return reassignKeys(raw, naming)
}

export function calcClamp(mnPx: number, mxPx: number, s: Settings): string {
  const mnR = mnPx / s.root
  const mxR = mxPx / s.root
  const slope = (mxR - mnR) / ((s.vpMax - s.vpMin) / 100)
  const ic = mnR - slope * (s.vpMin / 100)
  return `clamp(${mnR.toFixed(3)}rem, calc(${ic.toFixed(3)}rem + ${slope.toFixed(3)}${s.vpUnit}), ${mxR.toFixed(3)}rem)`
}

export function evalAt(mnPx: number, mxPx: number, vw: number, s: Settings): number {
  const t = Math.max(0, Math.min(1, (vw - s.vpMin) / (s.vpMax - s.vpMin)))
  return Math.round(mnPx + (mxPx - mnPx) * t)
}

export function generateCSS(
  scale: ScaleRow[],
  settings: Settings,
  getPxFn: (key: string, side: 'min' | 'max') => number,
  fmt: 'root' | 'scss',
): string {
  const { prefix } = settings
  const hdr = `/*\n * Font size base: ${settings.baseMin}px → ${settings.baseMax}px\n * Viewport: ${settings.vpMin}${settings.vpUnit} → ${settings.vpMax}${settings.vpUnit}\n */`
  const lines = [hdr, '']

  if (fmt === 'root') {
    lines.push(':root {')
    scale.forEach((r) => {
      lines.push(`  --${prefix}-${r.key}: ${calcClamp(getPxFn(r.key, 'min'), getPxFn(r.key, 'max'), settings)};`)
    })
    lines.push('}', '')
    scale.forEach((r) => {
      lines.push(`.${prefix}-${r.key} { font-size: var(--${prefix}-${r.key}); }`)
    })
  } else {
    scale.forEach((r) => {
      lines.push(`$${prefix}-${r.key}: ${calcClamp(getPxFn(r.key, 'min'), getPxFn(r.key, 'max'), settings)};`)
    })
  }

  return lines.join('\n')
}

export function generateFigma(
  scale: ScaleRow[],
  settings: Settings,
  getPxFn: (key: string, side: 'min' | 'max') => number,
): string {
  const { prefix, namingMode } = settings

  const aboveRows = scale.filter((r) => !r.isBase && isAbove(r.key, namingMode))
  aboveRows.sort((a, b) => {
    if (namingMode === 'tshirt') {
      const rank = (k: string) => (k === 'lg' ? 1 : k === 'xl' ? 2 : parseInt(k) + 1)
      return rank(b.key) - rank(a.key)
    }
    return parseInt(b.key) - parseInt(a.key)
  })

  const baseRow = scale.filter((r) => r.isBase)

  const belowRows = scale.filter((r) => !r.isBase && isBelow(r.key, namingMode))
  belowRows.sort((a, b) => {
    if (namingMode === 'tshirt') {
      const rank = (k: string) => (k === 'sm' ? 1 : k === 'xs' ? 2 : parseInt(k) + 1)
      return rank(a.key) - rank(b.key)
    }
    return NUMERIC_BELOW.indexOf(a.key) - NUMERIC_BELOW.indexOf(b.key)
  })

  const ordered = [...aboveRows, ...baseRow, ...belowRows].map((r) => r.key)
  const indent = '      '

  const buildGroup = (side: 'min' | 'max') => {
    const entries = ordered.map(
      (k) =>
        `${indent}"${k}": {\n${indent}  "$type": "number",\n${indent}  "$value": ${Math.round(getPxFn(k, side))}\n${indent}}`,
    )
    return `{\n${entries.join(',\n')}\n    }`
  }

  return `{\n  "${prefix}": {\n    "@min": ${buildGroup('min')},\n    "@max": ${buildGroup('max')}\n  },\n  "$extensions": {\n    "com.figma.modeName": "Default"\n  }\n}`
}

const RESET_OVERRIDES_ON = new Set(['rMin', 'rMax', 'baseMin', 'baseMax', 'root'])

export function useTypeScale() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [scale, setScale] = useState<ScaleRow[]>(() => makeInitialScale(DEFAULT_SETTINGS.namingMode))
  const [overrides, setOverrides] = useState<Overrides>({})

  const defMult = useCallback(
    (key: string, side: 'min' | 'max', s: Settings, rows: ScaleRow[]): number => {
      const baseIdx = rows.findIndex((r) => r.isBase)
      const idx = rows.findIndex((r) => r.key === key)
      const diff = baseIdx - idx
      if (diff === 0) return 1
      if (diff > 0) return Math.pow(side === 'min' ? s.rMin : s.rMax, diff)
      return Math.pow(1 / s.rMin, Math.abs(diff))
    },
    [],
  )

  const getMult = useCallback(
    (key: string, side: 'min' | 'max', s: Settings, rows: ScaleRow[], ov: Overrides): number => {
      const entry = ov[key]
      return entry && entry[side] != null ? entry[side]! : defMult(key, side, s, rows)
    },
    [defMult],
  )

  const getPxRaw = useCallback(
    (key: string, side: 'min' | 'max', s: Settings, rows: ScaleRow[], ov: Overrides): number => {
      return (side === 'min' ? s.baseMin : s.baseMax) * getMult(key, side, s, rows, ov)
    },
    [getMult],
  )

  const updateSetting = useCallback(
    <K extends keyof Settings>(key: K, value: Settings[K]) => {
      setSettings((prev) => {
        const next = { ...prev, [key]: value }
        if (RESET_OVERRIDES_ON.has(key as string)) setOverrides({})
        if (key === 'namingMode') {
          setOverrides({})
          setScale((rows) => reassignKeys(rows, value as string))
        }
        return next
      })
    },
    [],
  )

  const addAbove = useCallback(() => {
    setOverrides({})
    setScale((prev) => {
      const next = [{ key: '', isBase: false }, ...prev]
      return reassignKeys(next, settings.namingMode)
    })
  }, [settings.namingMode])

  const addBelow = useCallback(() => {
    setScale((prev) => {
      const count = prev.filter((r) => !r.isBase && isBelow(r.key, settings.namingMode)).length
      if (count >= MAX_BELOW) return prev
      setOverrides({})
      return reassignKeys([...prev, { key: '', isBase: false }], settings.namingMode)
    })
  }, [settings.namingMode])

  const removeRow = useCallback(
    (key: string) => {
      setOverrides({})
      setScale((prev) => reassignKeys(prev.filter((r) => r.key !== key), settings.namingMode))
    },
    [settings.namingMode],
  )

  const setOverride = useCallback((key: string, side: 'min' | 'max', value: number | null) => {
    setOverrides((prev) => ({
      ...prev,
      [key]: { ...(prev[key] ?? { min: null, max: null }), [side]: value },
    }))
  }, [])

  const resetOverride = useCallback((key: string) => {
    setOverrides((prev) => ({ ...prev, [key]: { min: null, max: null } }))
  }, [])

  const getPx = useCallback(
    (key: string, side: 'min' | 'max') => getPxRaw(key, side, settings, scale, overrides),
    [getPxRaw, settings, scale, overrides],
  )

  const isMod = useCallback(
    (key: string, side: 'min' | 'max') => !!(overrides[key] && overrides[key][side] != null),
    [overrides],
  )

  const canAddBelow =
    scale.filter((r) => !r.isBase && isBelow(r.key, settings.namingMode)).length < MAX_BELOW

  // Keep viewport preview in bounds when vpMin/vpMax change
  const vpBounds = { min: settings.vpMin, max: settings.vpMax }

  return {
    settings,
    scale,
    overrides,
    vpBounds,
    updateSetting,
    addAbove,
    addBelow,
    removeRow,
    setOverride,
    resetOverride,
    getPx,
    isMod,
    canAddBelow,
  }
}

export type TypeScaleAPI = ReturnType<typeof useTypeScale>
