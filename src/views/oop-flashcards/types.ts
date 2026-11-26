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

export type TopicFilter = number | 'all' | 'review'

export type CodeTokenKind = 'plain' | 'comment' | 'string' | 'keyword' | 'func'

export interface CodeToken {
  kind: CodeTokenKind
  text: string
}
