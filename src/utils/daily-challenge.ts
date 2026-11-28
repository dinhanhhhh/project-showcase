import { z } from 'zod'
import { getDailyDateKey, pickSeededItems } from './daily-seed'

export interface DailyChallengeDefinition {
  id: string
  appSlug: string
  appName: string
  icon: string
  title: string
  hint: string
  xpReward: number
  route: string
}

export const DAILY_CHALLENGE_CATALOG: readonly DailyChallengeDefinition[] = [
  {
    id: 'dc_ngare_life',
    appSlug: 'ngare',
    appName: 'Ngã Rẽ Cuộc Đời',
    icon: '🧭',
    title: 'Hoàn tất 1 cuộc đời mới',
    hint: 'Khám phá thêm 1 kết cục hoặc ghi danh Bảng Vàng.',
    xpReward: 40,
    route: '/ngare',
  },
  {
    id: 'dc_cotuong_match',
    appSlug: 'co-tuong',
    appName: 'Cờ Tướng Master',
    icon: '♟️',
    title: 'Thắng 1 ván Cờ hoặc giải 1 Cờ Thế',
    hint: 'Thử sức độ khó Trung bình / Khó hoặc tàn cuộc.',
    xpReward: 45,
    route: '/co-tuong',
  },
  {
    id: 'dc_saigon_deal',
    appSlug: 'saigon-tycoon',
    appName: 'Cờ Tỷ Phú Sài Gòn',
    icon: '🎲',
    title: 'Gom trọn 1 bộ màu trên bàn cờ',
    hint: 'Xây nhà đều tay hoặc thương lượng trao đổi với AI.',
    xpReward: 45,
    route: '/saigon-tycoon',
  },
  {
    id: 'dc_farm_order',
    appSlug: 'anime-farm',
    appName: 'Nông Trại Anime 2.5D',
    icon: '🌾',
    title: 'Giao 1 đơn hàng thị trấn',
    hint: 'Tưới nước & dùng ⚡Bón phân để thu hoạch nhanh.',
    xpReward: 35,
    route: '/anime-farm',
  },
  {
    id: 'dc_oop_quiz',
    appSlug: 'oop-flashcards',
    appName: 'OOP Flashcards',
    icon: '🎴',
    title: 'Ôn 5 thẻ hoặc vượt Quiz >= 80%',
    hint: 'Kiểm tra kiến thức SOLID & Design Patterns.',
    xpReward: 30,
    route: '/oop-flashcards',
  },
  {
    id: 'dc_typing_run',
    appSlug: 'neon-typing',
    appName: 'Neon Typing',
    icon: '⌨️',
    title: 'Chinh phục mốc 50+ WPM',
    hint: 'Thử chế độ Daily Seed hoặc Tiếng Việt có dấu.',
    xpReward: 35,
    route: '/neon-typing',
  },
  {
    id: 'dc_piano_song',
    appSlug: 'mini-piano',
    appName: 'Mini Piano',
    icon: '🎹',
    title: 'Chơi 1 thử thách giai điệu',
    hint: 'Bật Sustain và đạt hạng cao ở 1 bản nhạc bất kỳ.',
    xpReward: 30,
    route: '/mini-piano',
  },
  {
    id: 'dc_color_streak',
    appSlug: 'color-game',
    appName: 'Color Game',
    icon: '🎨',
    title: 'Đạt chuỗi 5 đáp án màu đúng',
    hint: 'Dùng phím 1–9 nhanh trong chế độ Time Attack.',
    xpReward: 30,
    route: '/color-game',
  },
  {
    id: 'dc_tarot_spread',
    appSlug: 'oracle-tarot',
    appName: 'Bói Bài Oracle',
    icon: '🔮',
    title: 'Trải bài 3 lá chiêm nghiệm hôm nay',
    hint: 'Đặt câu hỏi tâm niệm và lưu lại nhật ký bói.',
    xpReward: 25,
    route: '/oracle-tarot',
  },
  {
    id: 'dc_food_plan',
    appSlug: 'hom-nay-an-gi',
    appName: 'Hôm Nay Ăn Gì',
    icon: '🍜',
    title: 'Lập thực đơn 4 bữa trong ngày',
    hint: 'Bấm Gợi ý cả ngày để chọn đủ Sáng · Trưa · Tối · Vặt.',
    xpReward: 25,
    route: '/hom-nay-an-gi',
  },
]

export function getDailyChallengesForDate(
  dateKey: string = getDailyDateKey(),
): DailyChallengeDefinition[] {
  return pickSeededItems(DAILY_CHALLENGE_CATALOG, 3, `vibe-daily-${dateKey}`)
}

export const DailyChallengePersistSchema = z.object({
  completedIdsByDate: z.record(z.string(), z.array(z.string())),
  totalXp: z.number().int().min(0),
  streakDays: z.number().int().min(0),
  lastFullCompleteDate: z.string().nullable(),
  isCollapsed: z.boolean(),
})

export type DailyChallengePersistState = z.infer<typeof DailyChallengePersistSchema>

export function sanitizeDailyChallengeState(raw: unknown): DailyChallengePersistState {
  const fallback: DailyChallengePersistState = {
    completedIdsByDate: {},
    totalXp: 0,
    streakDays: 0,
    lastFullCompleteDate: null,
    isCollapsed: false,
  }
  const parsed = DailyChallengePersistSchema.safeParse(raw)
  return parsed.success ? parsed.data : fallback
}

function safeReadJson(storage: Storage, key: string): unknown {
  try {
    const raw = storage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as unknown
  } catch {
    return null
  }
}

const CoTuongSchema = z.object({
  stats: z
    .object({
      wins: z.number().optional(),
      losses: z.number().optional(),
      draws: z.number().optional(),
    })
    .optional(),
  solvedPuzzleIds: z.array(z.string()).optional(),
})

const NgareSchema = z.object({
  unlockedEndings: z.array(z.string()).optional(),
  hallOfFame: z.array(z.unknown()).optional(),
})

const OopSchema = z.object({
  masteredIds: z.array(z.string()).optional(),
  bestQuizPercent: z.number().optional(),
})

const TypingSchema = z.object({
  bestWpm: z.number().optional(),
  totalGamesPlayed: z.number().optional(),
  dailyBestByDate: z.record(z.string(), z.number()).optional(),
})

const ColorSchema = z.object({
  bestStreak: z.number().optional(),
  bestTimeAttackScore: z.number().optional(),
  dailyBestByDate: z.record(z.string(), z.number()).optional(),
})

const OracleSchema = z.object({
  history: z.array(z.unknown()).optional(),
})

const PianoSchema = z.object({
  bestScoreBySong: z.record(z.string(), z.number()).optional(),
  savedMelodies: z.array(z.unknown()).optional(),
  dailyBestByDate: z.record(z.string(), z.number()).optional(),
})

const AnimeFarmSchema = z.object({
  stats: z
    .object({
      totalHarvests: z.number().optional(),
      ordersCompleted: z.number().optional(),
    })
    .optional(),
  coins: z.number().optional(),
})

export interface CrossAppProgressSummary {
  chessWins: number
  chessPuzzlesSolved: number
  ngareEndingsUnlocked: number
  ngareRunsRecorded: number
  oopMasteredCount: number
  oopBestQuiz: number
  typingBestWpm: number
  colorBestStreak: number
  oracleReadings: number
  pianoMelodies: number
  farmHarvests: number
  saigonAchievements: number
  activeAppsCount: number
}

export function readCrossAppProgress(storage: Storage): CrossAppProgressSummary {
  const coTuong = CoTuongSchema.safeParse(safeReadJson(storage, 'vibe_co_tuong'))
  const ngare = NgareSchema.safeParse(safeReadJson(storage, 'ngare_game_state'))
  const oop = OopSchema.safeParse(safeReadJson(storage, 'vibe_oop_flashcards'))
  const typing = TypingSchema.safeParse(safeReadJson(storage, 'vibe_neon_typing'))
  const color = ColorSchema.safeParse(safeReadJson(storage, 'vibe_color_game'))
  const oracle = OracleSchema.safeParse(safeReadJson(storage, 'vibe_oracle_tarot'))
  const piano = PianoSchema.safeParse(safeReadJson(storage, 'vibe_mini_piano'))
  const farm = AnimeFarmSchema.safeParse(safeReadJson(storage, 'FAM_FARM_GAME_SAVE_V6_3PLOTS'))
  const saigonRaw = safeReadJson(storage, 'monopoly_saigon_achievements')

  const chessWins = coTuong.success ? coTuong.data.stats?.wins ?? 0 : 0
  const chessPuzzlesSolved = coTuong.success ? coTuong.data.solvedPuzzleIds?.length ?? 0 : 0
  const ngareEndingsUnlocked = ngare.success ? ngare.data.unlockedEndings?.length ?? 0 : 0
  const ngareRunsRecorded = ngare.success ? ngare.data.hallOfFame?.length ?? 0 : 0
  const oopMasteredCount = oop.success ? oop.data.masteredIds?.length ?? 0 : 0
  const oopBestQuiz = oop.success ? oop.data.bestQuizPercent ?? 0 : 0
  const typingBestWpm = typing.success ? typing.data.bestWpm ?? 0 : 0
  const colorBestStreak = color.success ? color.data.bestStreak ?? 0 : 0
  const oracleReadings = oracle.success ? oracle.data.history?.length ?? 0 : 0
  const pianoMelodies = piano.success ? piano.data.savedMelodies?.length ?? 0 : 0
  const farmHarvests = farm.success ? farm.data.stats?.totalHarvests ?? 0 : 0

  let saigonAchievements = 0
  if (saigonRaw && typeof saigonRaw === 'object' && !Array.isArray(saigonRaw)) {
    for (const entry of Object.values(saigonRaw as Record<string, unknown>)) {
      if (
        entry &&
        typeof entry === 'object' &&
        'unlocked' in entry &&
        (entry as { unlocked?: unknown }).unlocked === true
      ) {
        saigonAchievements += 1
      }
    }
  }

  const activeSignals = [
    chessWins + chessPuzzlesSolved > 0,
    ngareEndingsUnlocked + ngareRunsRecorded > 0,
    oopMasteredCount + oopBestQuiz > 0,
    typingBestWpm > 0,
    colorBestStreak > 0,
    oracleReadings > 0,
    pianoMelodies > 0,
    farmHarvests > 0,
    saigonAchievements > 0,
  ]

  return {
    chessWins,
    chessPuzzlesSolved,
    ngareEndingsUnlocked,
    ngareRunsRecorded,
    oopMasteredCount,
    oopBestQuiz,
    typingBestWpm,
    colorBestStreak,
    oracleReadings,
    pianoMelodies,
    farmHarvests,
    saigonAchievements,
    activeAppsCount: activeSignals.filter(Boolean).length,
  }
}

export interface TodayCompletedDetection {
  completedSlugs: string[]
  challengeIds: string[]
}

export function detectTodayCompletedApps(
  storage: Storage,
  dateKey: string = getDailyDateKey(),
): TodayCompletedDetection {
  const typing = TypingSchema.safeParse(safeReadJson(storage, 'vibe_neon_typing'))
  const piano = PianoSchema.safeParse(safeReadJson(storage, 'vibe_mini_piano'))
  const color = ColorSchema.safeParse(safeReadJson(storage, 'vibe_color_game'))

  const completedSlugs: string[] = []
  const challengeIds: string[] = []

  const typingDaily = typing.success ? typing.data.dailyBestByDate?.[dateKey] ?? 0 : 0
  if (typingDaily > 0) {
    completedSlugs.push('neon-typing')
    if (typingDaily >= 50) {
      challengeIds.push('dc_typing_run')
    }
  }

  const pianoDaily = piano.success ? piano.data.dailyBestByDate?.[dateKey] ?? 0 : 0
  if (pianoDaily > 0) {
    completedSlugs.push('mini-piano')
    challengeIds.push('dc_piano_song')
  }

  const colorDaily = color.success ? color.data.dailyBestByDate?.[dateKey] ?? 0 : 0
  if (colorDaily > 0) {
    completedSlugs.push('color-game')
    challengeIds.push('dc_color_streak')
  }

  return { completedSlugs, challengeIds }
}
