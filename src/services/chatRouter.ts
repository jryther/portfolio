import {
  TOPICS, TOPIC_LIST, MORE_KEYWORDS, topicAnswer,
  MORE_ID, OFF_TOPIC_ID, UNKNOWN_ID, GREETING_ID, THANKS_ID,
} from '../data/chatTree'
import type { Locale } from '../i18n/locales'

// Routes a visitor's question to a topic in the decision tree.
//
// Keyword matching runs first and answers instantly. Only when it's unsure does the
// in-browser embedding model compare the question with each topic's example questions
// (services/topicIndex.ts). Either way the reply is a pre-written answer from the tree.

export interface KeywordMatch {
  id: string
  score: number
}

export interface KeywordResult {
  /** Best topic, or null when nothing matched */
  best: KeywordMatch | null
  /** True when the best match is clear enough to skip the model */
  confident: boolean
}

// Small talk only counts when it's most of the message ("hi" yes, "hi, what does he do" no)
const SMALL_TALK = new Set([GREETING_ID, THANKS_ID])
const SMALL_TALK_MAX_WORDS = 4

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/\p{M}/gu, '')   // "educación" matches "educacion", "ñ" matches "n"
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9+#]+/g, ' ')
    .trim()
}

interface Phrase { text: string, stem: string, weight: number }

// Keyword lists are fixed, so each is normalized once rather than on every question
const prepared = new WeakMap<readonly string[], Phrase[]>()
function preparePhrases(phrases: readonly string[]): Phrase[] {
  let list = prepared.get(phrases)
  if (!list) {
    list = phrases.map(normalize).filter(Boolean).map(text => ({
      text,
      // "projects" and "project" share a stem; short words ("his") and "-ss" endings ("class") keep theirs
      stem: text.length > 3 && text.endsWith('s') && !text.endsWith('ss') ? text.slice(0, -1) : text,
      // Longer phrases count a little more
      weight: 1 + 0.5 * (text.split(' ').length - 1),
    }))
    prepared.set(phrases, list)
  }
  return list
}

/** Sums whole-word phrase matches. Longer phrases count a little more; "project" and
 * "projects" count once */
function scorePhrases(padded: string, phrases: readonly string[]): number {
  const seen = new Set<string>()
  let score = 0
  for (const { text, stem, weight } of preparePhrases(phrases)) {
    if (seen.has(stem)) continue
    // Plurals count too, except for two-letter keywords ("hi" must not match "his")
    if (padded.includes(` ${text} `) || (text.length > 2 && padded.includes(` ${text}s `))) {
      seen.add(stem)
      score += weight
    }
  }
  return score
}

export function matchKeywords(question: string): KeywordResult {
  const text = normalize(question)
  const words = text ? text.split(' ').length : 0
  const padded = ` ${text} `

  const scores: KeywordMatch[] = []
  for (const topic of TOPIC_LIST) {
    if (SMALL_TALK.has(topic.id) && words > SMALL_TALK_MAX_WORDS) continue
    let score = scorePhrases(padded, topic.keywords)
    // Hubs ("what are his skills") lose ties to specific topics ("does he know React")
    if (topic.hub) score *= 0.5
    if (score > 0) scores.push({ id: topic.id, score })
  }

  // "Tell me more" only when the message names no topic of its own ("more about his projects"
  // should go to projects)
  if (scores.length === 0 && words <= 6) {
    const moreScore = scorePhrases(padded, MORE_KEYWORDS)
    if (moreScore > 0) scores.push({ id: MORE_ID, score: moreScore })
  }

  scores.sort((a, b) => b.score - a.score)
  const [best, second] = scores
  if (!best) return { best: null, confident: false }

  // Clear when the winner has a full match and at least double the runner-up
  const confident = best.score >= 1 && best.score >= 2 * (second?.score ?? 0)
  return { best, confident }
}

// ── Conversation ─────────────────────────────────────────────────────────────

export interface Reply {
  topicId: string
  text: string
  followUps: string[]
}

/**
 * Resolves a routed ID to the reply to show. "more" continues the previous topic with the
 * first follow-up the visitor hasn't seen yet. The text is in the visitor's language.
 */
export function resolveReply(
  routedId: string, previousTopicId: string | null, visited: ReadonlySet<string>, locale: Locale = 'en',
): Reply {
  let id = routedId
  if (id === MORE_ID) {
    const previous = previousTopicId ? TOPICS[previousTopicId] : null
    id = previous?.followUps.find(f => !visited.has(f)) ?? previous?.followUps[0] ?? UNKNOWN_ID
  }
  const topic = TOPICS[id] ?? TOPICS[UNKNOWN_ID]
  return { topicId: topic.id, text: topicAnswer(topic.id, locale), followUps: topic.followUps }
}

/** Topics that don't move the conversation; "tell me more" after them uses the topic before */
export function isConversational(id: string): boolean {
  return id === GREETING_ID || id === THANKS_ID || id === OFF_TOPIC_ID || id === UNKNOWN_ID
}
