export type ColorFormat = 'rgb' | 'hex' | 'hsl'

export type ColorGameMode = 'classic' | 'time_attack' | 'daily_seed'

export type GridSize = 4 | 6 | 9

export interface HslValue {
  h: number
  s: number
  l: number
}

export interface ColorSwatch {
  r: number
  g: number
  b: number
  rgb: string
  hex: string
  hsl: string
  hslValue: HslValue
}

export interface ColorRound {
  target: ColorSwatch
  options: ColorSwatch[]
}
