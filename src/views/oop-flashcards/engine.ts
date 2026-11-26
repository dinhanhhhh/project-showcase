import type { CodeToken, Flashcard, TopicFilter } from './types'

const TOKEN_REGEX =
  /(\/\/[^\n]*|"(?:\\.|[^"\\])*"|\b(?:public|private|protected|static|final|abstract|class|interface|extends|implements|new|return|if|else|throw|void|try|catch|import|package|int|double|boolean|String|System|out|println|instanceof|this)\b|\b[a-zA-Z_][a-zA-Z0-9_]*(?=\s*\())/g

const KEYWORD_SET = new Set([
  'public',
  'private',
  'protected',
  'static',
  'final',
  'abstract',
  'class',
  'interface',
  'extends',
  'implements',
  'new',
  'return',
  'if',
  'else',
  'throw',
  'void',
  'try',
  'catch',
  'import',
  'package',
  'int',
  'double',
  'boolean',
  'String',
  'System',
  'out',
  'println',
  'instanceof',
  'this',
])

export function shuffleCards<T>(items: readonly T[], rng: () => number = Math.random): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const temp = result[i]
    result[i] = result[j]
    result[j] = temp
  }
  return result
}

export function buildDeck(
  allCards: readonly Flashcard[],
  filter: TopicFilter,
  reviewIds: readonly string[],
  shuffle: boolean,
  rng: () => number = Math.random,
): Flashcard[] {
  let filtered: Flashcard[]

  if (filter === 'all') {
    filtered = [...allCards]
  } else if (filter === 'review') {
    const reviewSet = new Set(reviewIds)
    filtered = allCards.filter((card) => reviewSet.has(card.id))
  } else {
    filtered = allCards.filter((card) => card.topicId === filter)
  }

  if (shuffle) {
    return shuffleCards(filtered, rng)
  }

  return filtered.sort((a, b) => {
    if (a.topicId !== b.topicId) return a.topicId - b.topicId
    return a.id.localeCompare(b.id, undefined, { numeric: true })
  })
}

export function tokenizeJavaCode(code: string): CodeToken[] {
  const tokens: CodeToken[] = []
  let lastIndex = 0

  for (const match of code.matchAll(TOKEN_REGEX)) {
    const matchText = match[0]
    const matchIndex = match.index ?? 0

    if (matchIndex > lastIndex) {
      tokens.push({ kind: 'plain', text: code.slice(lastIndex, matchIndex) })
    }

    if (matchText.startsWith('//')) {
      tokens.push({ kind: 'comment', text: matchText })
    } else if (matchText.startsWith('"')) {
      tokens.push({ kind: 'string', text: matchText })
    } else if (KEYWORD_SET.has(matchText)) {
      tokens.push({ kind: 'keyword', text: matchText })
    } else {
      tokens.push({ kind: 'func', text: matchText })
    }

    lastIndex = matchIndex + matchText.length
  }

  if (lastIndex < code.length) {
    tokens.push({ kind: 'plain', text: code.slice(lastIndex) })
  }

  return tokens
}

export function getAccuracyPercent(knownCount: number, total: number): number {
  if (total <= 0) return 0
  return Math.round((knownCount / total) * 100)
}

export function getCompletionTitle(knownCount: number, total: number): string {
  const pct = getAccuracyPercent(knownCount, total)
  if (pct === 100) return 'Xuất sắc! Đã thuộc 100%!'
  if (pct >= 70) return 'Làm tốt lắm!'
  return 'Cố lên nhé, ôn lại là nhớ ngay!'
}
