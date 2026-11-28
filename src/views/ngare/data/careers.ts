import type { Career, CareerLevel, CareerLevelContext } from '../types'

export const CAREERS: Record<string, Career> = {
  programmer: {
    id: 'programmer',
    name: 'Lập Trình Viên',
    emoji: '💻',
    description: 'Phát triển phần mềm, ứng dụng web và di động. Thu nhập tốt nhưng áp lực cao.',
    startStats: {
      money: 45,
      skill: 35,
      happiness: 60,
      stress: 35,
      health: 75,
      relationships: 35,
    },
    salary: 15,
    levels: [
      { title: 'Lập trình viên tập sự', minSkill: 0, salary: 15 },
      { title: 'Lập trình viên chính thức', minSkill: 30, salary: 25 },
      { title: 'Lập trình viên cao cấp', minSkill: 55, salary: 40 },
      { title: 'Trưởng nhóm kỹ thuật', minSkill: 70, salary: 55 },
      { title: 'Quản lý kỹ thuật', minSkill: 85, salary: 70 },
      { title: 'Giám đốc công nghệ (CTO)', minSkill: 95, salary: 100, isExecutive: true },
      {
        title: 'Nhà Sáng Lập Công Nghệ (Tech Founder)',
        minSkill: 98,
        minRelationships: 70,
        minNetWorth: 300,
        salary: 135,
        isExecutive: true,
      },
      {
        title: 'Chủ Tịch Tập Đoàn Công Nghệ',
        minSkill: 100,
        minRelationships: 85,
        minNetWorth: 800,
        salary: 180,
        isExecutive: true,
      },
    ],
  },
  business: {
    id: 'business',
    name: 'Kinh Doanh',
    emoji: '📊',
    description: 'Bán hàng, phát triển thị trường, xây dựng mối quan hệ. Cơ hội kiếm nhiều tiền.',
    startStats: {
      money: 40,
      skill: 25,
      happiness: 65,
      stress: 30,
      health: 80,
      relationships: 55,
    },
    salary: 12,
    levels: [
      { title: 'Nhân viên kinh doanh', minSkill: 0, salary: 12 },
      { title: 'Trưởng nhóm bán hàng', minSkill: 30, salary: 22 },
      { title: 'Giám đốc kinh doanh', minSkill: 55, salary: 45 },
      { title: 'Phó TGĐ kinh doanh', minSkill: 75, salary: 65 },
      { title: 'CEO', minSkill: 90, salary: 90, isExecutive: true },
      {
        title: 'Chủ Tịch HĐQT',
        minSkill: 95,
        minRelationships: 75,
        minNetWorth: 300,
        salary: 130,
        isExecutive: true,
      },
      {
        title: 'Tỷ Phú Tập Đoàn Đa Ngành',
        minSkill: 100,
        minRelationships: 90,
        minNetWorth: 800,
        salary: 175,
        isExecutive: true,
      },
    ],
  },
  design: {
    id: 'design',
    name: 'Thiết Kế',
    emoji: '🎨',
    description: 'Sáng tạo giao diện, thương hiệu và trải nghiệm người dùng. Công việc đòi hỏi thẩm mỹ.',
    startStats: {
      money: 35,
      skill: 30,
      happiness: 75,
      stress: 20,
      health: 80,
      relationships: 45,
    },
    salary: 13,
    levels: [
      { title: 'Thiết kế viên tập sự', minSkill: 0, salary: 13 },
      { title: 'Thiết kế viên UI/UX', minSkill: 30, salary: 22 },
      { title: 'Thiết kế viên cao cấp', minSkill: 55, salary: 35 },
      { title: 'Giám đốc nghệ thuật', minSkill: 75, salary: 50 },
      { title: 'Giám đốc sáng tạo', minSkill: 90, salary: 70, isExecutive: true },
      {
        title: 'Nhà Sáng Lập Studio Thiết Kế',
        minSkill: 95,
        minRelationships: 70,
        minNetWorth: 250,
        salary: 105,
        isExecutive: true,
      },
      {
        title: 'Huyền Thoại Thiết Kế Quốc Tế',
        minSkill: 100,
        minRelationships: 85,
        minNetWorth: 650,
        salary: 145,
        isExecutive: true,
      },
    ],
  },
  media: {
    id: 'media',
    name: 'Truyền Thông',
    emoji: '📰',
    description: 'Sản xuất nội dung, quản lý truyền thông xã hội. Sáng tạo và năng động.',
    startStats: {
      money: 30,
      skill: 25,
      happiness: 70,
      stress: 25,
      health: 80,
      relationships: 60,
    },
    salary: 10,
    levels: [
      { title: 'Người sáng tạo nội dung', minSkill: 0, salary: 10 },
      { title: 'Quản lý truyền thông', minSkill: 30, salary: 18 },
      { title: 'Trưởng phòng Marketing', minSkill: 55, salary: 35 },
      { title: 'Giám đốc Marketing', minSkill: 75, salary: 50 },
      { title: 'Giám đốc điều hành Marketing (CMO)', minSkill: 90, salary: 70, isExecutive: true },
      {
        title: 'Chủ Tịch Tập Đoàn Truyền Thông',
        minSkill: 95,
        minRelationships: 75,
        minNetWorth: 250,
        salary: 105,
        isExecutive: true,
      },
      {
        title: 'Ông Trùm Truyền Thông',
        minSkill: 100,
        minRelationships: 90,
        minNetWorth: 650,
        salary: 145,
        isExecutive: true,
      },
    ],
  },
  medical: {
    id: 'medical',
    name: 'Y Tế',
    emoji: '🏥',
    description: 'Chăm sóc sức khỏe cộng đồng. Ổn định nhưng đòi hỏi kiên trì và lòng tận tâm.',
    startStats: {
      money: 35,
      skill: 40,
      happiness: 55,
      stress: 40,
      health: 70,
      relationships: 40,
    },
    salary: 14,
    levels: [
      { title: 'Bác sĩ thực tập', minSkill: 0, salary: 14 },
      { title: 'Bác sĩ nội trú', minSkill: 30, salary: 25 },
      { title: 'Bác sĩ chuyên khoa', minSkill: 55, salary: 45 },
      { title: 'Trưởng khoa', minSkill: 75, salary: 60 },
      { title: 'Giám đốc bệnh viện', minSkill: 90, salary: 80, isExecutive: true },
      {
        title: 'Viện Trưởng Nghiên Cứu Y Khoa',
        minSkill: 95,
        minRelationships: 70,
        minNetWorth: 250,
        salary: 115,
        isExecutive: true,
      },
      {
        title: 'Chủ Tịch Hệ Thống Y Tế Quốc Tế',
        minSkill: 100,
        minRelationships: 85,
        minNetWorth: 700,
        salary: 155,
        isExecutive: true,
      },
    ],
  },
  education: {
    id: 'education',
    name: 'Giáo Dục',
    emoji: '📚',
    description: 'Giảng dạy, nghiên cứu và truyền cảm hứng. Ổn định, ý nghĩa nhưng thu nhập khiêm tốn.',
    startStats: {
      money: 25,
      skill: 35,
      happiness: 70,
      stress: 20,
      health: 85,
      relationships: 55,
    },
    salary: 9,
    levels: [
      { title: 'Giáo viên', minSkill: 0, salary: 9 },
      { title: 'Giáo viên giỏi', minSkill: 30, salary: 15 },
      { title: 'Phó Hiệu trưởng', minSkill: 55, salary: 25 },
      { title: 'Hiệu trưởng', minSkill: 75, salary: 40 },
      { title: 'Giáo sư / Chuyên gia', minSkill: 90, salary: 55, isExecutive: true },
      {
        title: 'Hiệu Trưởng Đại Học Danh Tiếng',
        minSkill: 95,
        minRelationships: 70,
        minNetWorth: 200,
        salary: 85,
        isExecutive: true,
      },
      {
        title: 'Chủ Tịch Hệ Thống Giáo Dục',
        minSkill: 100,
        minRelationships: 85,
        minNetWorth: 550,
        salary: 120,
        isExecutive: true,
      },
    ],
  },
}

export function isExecutiveLevel(
  careerId: string,
  currentLevel: string,
  careers: Record<string, Career> = CAREERS,
): boolean {
  const career = careers[careerId]
  if (!career) return false
  return Boolean(career.levels.find((lvl) => lvl.title === currentLevel)?.isExecutive)
}

function meetsLevelRequirements(
  level: CareerLevel,
  skillLevel: number,
  context?: CareerLevelContext,
): boolean {
  if (skillLevel < level.minSkill) return false
  if (level.minRelationships !== undefined && (context?.relationships ?? 0) < level.minRelationships) {
    return false
  }
  if (level.minNetWorth !== undefined && (context?.netWorth ?? 0) < level.minNetWorth) {
    return false
  }
  if (level.minAge !== undefined && (context?.age ?? 0) < level.minAge) {
    return false
  }
  return true
}

export function getCareerLevel(
  careerId: string,
  skillLevel: number,
  careers: Record<string, Career> = CAREERS,
  context?: CareerLevelContext,
): CareerLevel | null {
  const career = careers[careerId]
  if (!career) return null
  let currentLevel = career.levels[0]
  for (const level of career.levels) {
    if (meetsLevelRequirements(level, skillLevel, context)) {
      currentLevel = level
    }
  }
  return currentLevel
}

export function getNextCareerLevel(
  careerId: string,
  skillLevel: number,
  careers: Record<string, Career> = CAREERS,
  context?: CareerLevelContext,
): CareerLevel | null {
  const career = careers[careerId]
  if (!career) return null
  const current = getCareerLevel(careerId, skillLevel, careers, context)
  if (!current) return null
  const idx = career.levels.findIndex((lvl) => lvl.title === current.title)
  if (idx === -1 || idx >= career.levels.length - 1) return null
  return career.levels[idx + 1]
}
