import type { Career } from '../types'

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
      { title: 'Giám đốc công nghệ (CTO)', minSkill: 95, salary: 100 },
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
      { title: 'CEO', minSkill: 90, salary: 90 },
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
      { title: 'Giám đốc sáng tạo', minSkill: 90, salary: 70 },
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
      { title: 'Giám đốc điều hành Marketing (CMO)', minSkill: 90, salary: 70 },
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
      { title: 'Giám đốc bệnh viện', minSkill: 90, salary: 80 },
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
      { title: 'Giáo sư / Chuyên gia', minSkill: 90, salary: 55 },
    ],
  },
}

export function getCareerLevel(careerId: string, skillLevel: number) {
  const career = CAREERS[careerId]
  if (!career) return null
  let currentLevel = career.levels[0]
  for (const level of career.levels) {
    if (skillLevel >= level.minSkill) {
      currentLevel = level
    }
  }
  return currentLevel
}
