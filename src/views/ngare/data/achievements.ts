export const ACHIEVEMENTS = [
  {
    id: 'rich_30',
    title: 'Triệu phú tuổi 30',
    emoji: '💎',
    description: 'Đạt tài chính 80 trước tuổi 30',
    condition: (s: any, engine: any) => engine.state.age <= 30 && s.money >= 80,
  },
  {
    id: 'workaholic',
    title: 'Kẻ cuồng việc',
    emoji: '🧠',
    description: 'Đạt kỹ năng 90',
    condition: (s: any) => s.skill >= 90,
  },
  {
    id: 'zen_master',
    title: 'Bậc thầy Zen',
    emoji: '🧘',
    description: 'Giữ stress dưới 10 trong 5 năm liên tiếp',
    condition: (s: any) => s.stress <= 10,
  },
  {
    id: 'social_butterfly',
    title: 'Giao thiệp rộng',
    emoji: '🤝',
    description: 'Đạt quan hệ 90',
    condition: (s: any) => s.relationships >= 90,
  },
  {
    id: 'healthy_life',
    title: 'Sống khỏe dẻo dai',
    emoji: '🏃',
    description: 'Giữ sức khỏe trên 80 sau tuổi 50',
    condition: (s: any, engine: any) => engine.state.age >= 50 && s.health >= 80,
  },
  {
    id: 'cto_master',
    title: 'Huyền thoại Công nghệ',
    emoji: '🚀',
    description: 'Trở thành CTO',
    condition: (_s: any, engine: any) => engine.state.currentLevel === 'Giám đốc công nghệ (CTO)',
  },
  {
    id: 'ceo_legend',
    title: 'Đế chế Kinh doanh',
    emoji: '👑',
    description: 'Trở thành CEO/Tổng giám đốc',
    condition: (_s: any, engine: any) =>
      engine.state.currentLevel === 'CEO' || engine.state.currentLevel === 'Giám đốc bệnh viện',
  },
]
