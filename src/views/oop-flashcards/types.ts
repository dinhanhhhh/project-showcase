export type Difficulty = 'Cơ bản' | 'Trung bình' | 'Nâng cao'

export interface Flashcard {
  id: string
  topicId: number
  question: string
  answerTitle: string
  answerPoints: string[]
  codeExample?: string
  difficulty: Difficulty
}

export interface Topic {
  id: number
  title: string
}

export type TopicFilter = number | 'all' | 'review' | 'unmastered'
export type StudyMode = 'flashcard' | 'quiz'

export interface KnowledgeGroupProgress {
  id: 'oop-core' | 'oop-pillars' | 'solid-patterns'
  title: string
  mastered: number
  total: number
  percent: number
}

export interface QuizOption {
  id: string
  text: string
  isCorrect: boolean
}

export interface QuizQuestion {
  cardId: string
  topicId: number
  difficulty: Difficulty
  question: string
  answerTitle: string
  explanation: string[]
  options: QuizOption[]
}

export type CodeTokenKind = 'plain' | 'comment' | 'string' | 'keyword' | 'func'

export interface CodeToken {
  kind: CodeTokenKind
  text: string
}
