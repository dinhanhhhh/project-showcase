import type { Square } from '../types'

export const BOARD_SQUARES: Square[] = [
  { id: 0, name: 'BẮT ĐẦU\n(Nhận $200)', type: 'go' },
  { id: 1, name: 'Đất nền A', type: 'property', price: 60, rent: 10, colorGroup: 'var(--property-group-a)' },
  { id: 2, name: 'Khí vận', type: 'chance' },
  { id: 3, name: 'Đất nền B', type: 'property', price: 60, rent: 10, colorGroup: 'var(--property-group-a)' },
  { id: 4, name: 'Thuế thu nhập', type: 'tax', rent: 200 },
  { id: 5, name: 'Nhà Tù / Vô can', type: 'jail' },
  { id: 6, name: 'Biệt thự 1', type: 'property', price: 100, rent: 30, colorGroup: 'var(--property-group-b)' },
  { id: 7, name: 'Khí vận', type: 'chance' },
  { id: 8, name: 'Biệt thự 2', type: 'property', price: 100, rent: 30, colorGroup: 'var(--property-group-b)' },
  { id: 9, name: 'Cửa hàng', type: 'property', price: 120, rent: 40, colorGroup: 'var(--property-group-b)' },
  { id: 10, name: 'Bãi đỗ xe', type: 'parking' },
  { id: 11, name: 'Quán Trà Sữa', type: 'property', price: 140, rent: 50, colorGroup: 'var(--property-group-c)' },
  { id: 12, name: 'Công ty Tech', type: 'property', price: 200, rent: 80, colorGroup: 'var(--property-group-c)' },
  { id: 13, name: 'Khí vận', type: 'chance' },
  { id: 14, name: 'Quán Cafe', type: 'property', price: 160, rent: 60, colorGroup: 'var(--property-group-c)' },
  { id: 15, name: 'Lệnh bắt giam', type: 'gotojail' },
  { id: 16, name: 'Resort Biển', type: 'property', price: 250, rent: 120, colorGroup: 'var(--property-group-d)' },
  { id: 17, name: 'Sân Golf', type: 'property', price: 280, rent: 140, colorGroup: 'var(--property-group-d)' },
  { id: 18, name: 'Khí vận', type: 'chance' },
  { id: 19, name: 'Căn hộ Siêu cấp', type: 'property', price: 350, rent: 200, colorGroup: 'var(--property-group-d)' },
]
