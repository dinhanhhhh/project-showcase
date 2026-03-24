import type { Component } from 'vue'
import { z } from 'zod'

/**
 * Zod Schema để validate Meta (Runtime side)
 */
export const PageMetaSchema = z.object({
  name: z.string().min(1, 'Name không được để trống'),
  description: z.string().min(5, 'Description phải có ít nhất 5 ký tự'),
  author: z.string().optional(),
  category: z.string().min(1, 'Category không được để trống'),
})

/**
 * Suy luận Type từ Schema (TypeScript side)
 */
export type PageMeta = z.infer<typeof PageMetaSchema>

export interface PageEntry extends PageMeta {
  slug: string
  path: string
}

/**
 * Định nghĩa chuẩn cho một Mini App Module (file index.vue)
 */
export interface MiniAppModule {
  default: Component
}

/**
 * Kiểu dữ liệu cho hàm loader dùng trong import.meta.glob
 */
export type MiniAppLoader = () => Promise<MiniAppModule>

/**
 * Định nghĩa chuẩn cho một Meta Module (file meta.ts)
 */
export interface MetaModule {
  default: PageMeta
}

/**
 * Kiểu dữ liệu cho hàm loader dùng cho meta.ts
 */
export type MetaLoader = () => Promise<MetaModule>
