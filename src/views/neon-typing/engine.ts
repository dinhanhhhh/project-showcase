import type { GameState, TypingRank, WordPackId, WordPackMeta } from './types'

export const WORD_PACKS: Record<WordPackId, WordPackMeta> = {
  dev: {
    id: 'dev',
    label: 'Dev & Tech',
    icon: '💻',
    words: [
      'typescript', 'javascript', 'vuejs', 'reactive', 'component',
      'composition', 'interface', 'generic', 'frontend', 'developer',
      'antigravity', 'vibe', 'platform', 'showcase', 'project',
      'application', 'debugging', 'refactor', 'optimization', 'performance',
      'neon', 'glassmorphism', 'coding', 'senior', 'fullstack',
      'architecture', 'pipeline', 'container', 'middleware', 'endpoint',
      'database', 'algorithm', 'compiler', 'protocol', 'framework',
      'scalable', 'telemetry', 'sandbox',
    ],
  },
  vietnamese: {
    id: 'vietnamese',
    label: 'Tiếng Việt',
    icon: '🇻🇳',
    words: [
      'saigon', 'hanoi', 'danang', 'congnghe', 'sangtao',
      'laptrinh', 'giaodien', 'duan', 'thuattoan', 'tocdo',
      'chinhxac', 'nangluong', 'khampha', 'trainghiem', 'tuonglai',
      'caphe', 'phobo', 'banhmi', 'hoanghon', 'binhminh',
      'dongluc', 'thanhcong', 'kieuhanh', 'thuthach', 'phattrien',
      'ketnoi', 'tritue', 'khoinghiep', 'chuyengia', 'tinhhoa',
      'dongdoi', 'banchat', 'giatri', 'benvung', 'vuonlen',
      'tuduy',
    ],
  },
  syntax: {
    id: 'syntax',
    label: 'Code Syntax',
    icon: '⚡',
    words: [
      'const', 'async', 'await', 'return', 'import',
      'export', 'typeof', 'keyof', 'readonly', 'extends',
      'implements', 'interface', 'promise', 'filter', 'reduce',
      'forEach', 'switch', 'default', 'finally', 'continue',
      'compute', 'watch()', 'ref()', 'pinia', 'router',
      'vitest', 'eslint', 'docker', 'commit', 'rebase',
      'branch', 'schema', 'socket', 'stream', 'worker',
      'buffer',
    ],
  },
  english: {
    id: 'english',
    label: 'English Flow',
    icon: '🌐',
    words: [
      'velocity', 'horizon', 'quantum', 'crystal', 'phantom',
      'spark', 'motion', 'rhythm', 'digital', 'gravity',
      'aurora', 'stellar', 'eclipse', 'cascade', 'venture',
      'precision', 'momentum', 'harmony', 'radiant', 'zenith',
      'catalyst', 'voyager', 'network', 'dynamic', 'kinetic',
      'matrix', 'vector', 'pulse', 'signal', 'spectrum',
      'circuit', 'beacon', 'prism', 'vertex', 'orbit',
      'nexus',
    ],
  },
}

export const WORD_PACK_LIST: readonly WordPackMeta[] = [
  WORD_PACKS.dev,
  WORD_PACKS.vietnamese,
  WORD_PACKS.syntax,
  WORD_PACKS.english,
]

export function getRandomWords(
  count: number,
  pack: WordPackId = 'dev',
  rng: () => number = Math.random,
): string[] {
  const pool = WORD_PACKS[pack].words
  const result: string[] = []
  let prev = ''

  for (let i = 0; i < count; i++) {
    let pick = pool[Math.floor(rng() * pool.length)] ?? pool[0]
    if (pool.length > 1 && pick === prev) {
      const nextIdx = (pool.indexOf(pick) + 1) % pool.length
      pick = pool[nextIdx]
    }
    result.push(pick)
    prev = pick
  }

  return result
}

export function calculateWPM(correctWords: number, timeSpentSeconds: number): number {
  if (timeSpentSeconds <= 0) return 0
  const minutes = timeSpentSeconds / 60
  return Math.round(correctWords / minutes)
}

export function calculateAccuracy(correctWords: number, totalWords: number): number {
  if (totalWords <= 0) return 100
  return Math.round((correctWords / totalWords) * 100)
}

export function calculateTypingRank(wpm: number, accuracy: number): TypingRank {
  if (wpm >= 75 && accuracy >= 95) return 'S+'
  if (wpm >= 60 && accuracy >= 90) return 'S'
  if (wpm >= 45 && accuracy >= 85) return 'A'
  if (wpm >= 30 && accuracy >= 75) return 'B'
  return 'C'
}

export function createInitialState(
  wordCount: number = 30,
  pack: WordPackId = 'dev',
  durationSeconds: number = 30,
): GameState {
  return {
    isActive: false,
    isFinished: false,
    words: getRandomWords(wordCount, pack),
    currentIndex: 0,
    inputValue: '',
    timeLeft: durationSeconds,
    score: {
      wpm: 0,
      accuracy: 100,
      correctCount: 0,
      totalTyped: 0,
    },
  }
}
