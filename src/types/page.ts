export type PageCategory = 'creative' | 'tool' | 'game' | 'learning' | 'other'

export interface PageMeta {
  name: string
  description: string
  author?: string
  category: string
}

export interface PageEntry extends PageMeta {
  slug: string
  path: string
}
