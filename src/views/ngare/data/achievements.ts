import type { Achievement, EngineRef, Stats } from '../types'

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'rich_30',
    title: 'Triệu phú tuổi 30',
    emoji: '💎',
    description: 'Đạt tài chính từ 80 trở lên trước tuổi 30',
    condition: (s: Stats, engine: EngineRef) =>
      engine.state !== null && engine.state.age <= 30 && s.money >= 80,
  },
  {
    id: 'workaholic',
    title: 'Kẻ cuồng việc',
    emoji: '🧠',
    description: 'Đạt kỹ năng 90',
    condition: (s: Stats) => s.skill >= 90,
  },
  {
    id: 'zen_master',
    title: 'Bậc thầy Zen',
    emoji: '🧘',
    description: 'Giữ stress <= 10 trong 5 năm liên tiếp',
    condition: (_s: Stats, engine: EngineRef) =>
      engine.state !== null && (engine.state.lowStressStreak ?? 0) >= 5,
  },
  {
    id: 'social_butterfly',
    title: 'Giao thiệp rộng',
    emoji: '🤝',
    description: 'Đạt quan hệ 90',
    condition: (s: Stats) => s.relationships >= 90,
  },
  {
    id: 'healthy_life',
    title: 'Sống khỏe dẻo dai',
    emoji: '🏃',
    description: 'Giữ sức khỏe trên 80 sau tuổi 50',
    condition: (s: Stats, engine: EngineRef) =>
      engine.state !== null && engine.state.age >= 50 && s.health >= 80,
  },
  {
    id: 'cto_master',
    title: 'Huyền thoại Công nghệ',
    emoji: '🚀',
    description: 'Trở thành CTO hoặc lãnh đạo cấp cao ngành Công nghệ',
    condition: (_s: Stats, engine: EngineRef) =>
      [
        'Giám đốc công nghệ (CTO)',
        'Nhà Sáng Lập Công Nghệ (Tech Founder)',
        'Chủ Tịch Tập Đoàn Công Nghệ',
      ].includes(engine.state?.currentLevel ?? ''),
  },
  {
    id: 'ceo_legend',
    title: 'Đế chế Kinh doanh',
    emoji: '👑',
    description: 'Trở thành CEO / Giám đốc bệnh viện hoặc Chủ tịch tập đoàn',
    condition: (_s: Stats, engine: EngineRef) =>
      [
        'CEO',
        'Chủ Tịch HĐQT',
        'Tỷ Phú Tập Đoàn Đa Ngành',
        'Giám đốc bệnh viện',
        'Viện Trưởng Nghiên Cứu Y Khoa',
        'Chủ Tịch Hệ Thống Y Tế Quốc Tế',
      ].includes(engine.state?.currentLevel ?? ''),
  },
  {
    id: 'stress_free',
    title: 'Cuộc sống không áp lực',
    emoji: '🌈',
    description: 'Đạt hạnh phúc 90 và stress dưới 20',
    condition: (s: Stats) => s.happiness >= 90 && s.stress <= 20,
  },
  {
    id: 'wealthy_sage',
    title: 'Giàu có và sáng suốt',
    emoji: '💰',
    description: 'Đạt tài chính 90 và kỹ năng 85',
    condition: (s: Stats) => s.money >= 90 && s.skill >= 85,
  },
  {
    id: 'survivor',
    title: 'Người sống sót',
    emoji: '💪',
    description: 'Phục hồi sức khỏe >= 50 sau khi từng nguy kịch (<= 25)',
    condition: (s: Stats, engine: EngineRef) =>
      engine.state !== null && Boolean(engine.state.hadCriticalHealth) && s.health >= 50,
  },
  {
    id: 'investor_pro',
    title: 'Nhà Đầu Tư Đa Kênh',
    emoji: '📈',
    description: 'Sở hữu ít nhất 2 loại tài sản đầu tư khác nhau',
    condition: (_s: Stats, engine: EngineRef) =>
      (engine.state?.assets?.filter((a) => a.units > 0).length ?? 0) >= 2,
  },
  {
    id: 'story_founder',
    title: 'Nhà Sáng Lập Đột Phá',
    emoji: '🦄',
    description: 'Hoàn thành thương vụ gọi vốn hoặc IPO thành công',
    condition: (_s: Stats, engine: EngineRef) =>
      Boolean(
        engine.state?.flags?.includes('startup_ipo') ||
          engine.state?.flags?.includes('startup_funded'),
      ),
  },
]
