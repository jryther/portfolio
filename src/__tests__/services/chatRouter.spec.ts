import { describe, it, expect } from 'vitest'
import { matchKeywords, resolveReply } from '../../services/chatRouter'
import { TOPICS, TOPIC_LIST, WELCOME, AI_EXAMPLES, MORE_ID, UNKNOWN_ID, ES_TOPICS, topicLabel } from '../../data/chatTree'
import { AI_EXAMPLES_ES } from '../../data/chatTree.es'

// Answers in every language, for the checks that apply to whatever ships
const allAnswers = (topic: (typeof TOPIC_LIST)[number]) => [topic.answer, ...Object.values(topic.translations ?? {}).map(t => t.answer)]

describe('chatTree', () => {
  it('only links to topics that exist', () => {
    for (const topic of TOPIC_LIST) {
      for (const id of topic.followUps) expect(TOPICS[id], `${topic.id} → ${id}`).toBeDefined()
    }
    for (const id of WELCOME.followUps) expect(TOPICS[id]).toBeDefined()
  })

  it('uses unique IDs', () => {
    const ids = TOPIC_LIST.map(t => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('gives every topic example questions for the embedding model', () => {
    for (const topic of TOPIC_LIST) expect(topic.examples?.length, topic.id).toBeGreaterThan(0)
  })

  it('translates every topic into Spanish, and nothing that isn\'t a topic', () => {
    for (const topic of TOPIC_LIST) {
      expect(topic.translations?.es?.label, topic.id).toBeTruthy()
      expect(topic.translations?.es?.answer, topic.id).toBeTruthy()
      expect(ES_TOPICS[topic.id].examples.length, topic.id).toBeGreaterThan(0)
    }
    expect(Object.keys(ES_TOPICS).sort()).toEqual(TOPIC_LIST.map(t => t.id).sort())
  })

  it('keeps the contact details identical in both languages', () => {
    for (const topic of TOPIC_LIST) {
      const emails = (text: string) => text.match(/\S+@\S+\.\w+/g) ?? []
      expect(emails(topic.translations!.es!.answer), topic.id).toEqual(emails(topic.answer))
    }
  })

  it('keeps private details out of the public answers', () => {
    const all = TOPIC_LIST.flatMap(allAnswers).join(' ')
    expect(all).not.toMatch(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]\d{4}/)   // any phone number
    // Skills Josh doesn't have are left out, never called out
    expect(all).not.toMatch(/graphql/i)
    // Public-safe wording only
    expect(all).not.toMatch(/\$\d/)                      // no stray template $ before a number
    // Framing settled on the site: current numbers and wording only
    expect(all).not.toMatch(/full WCAG|parts of the release|25% faster development|50% fewer bugs|zero-error/i)
    // jQuery can be mentioned honestly, but an answer never leads with it
    for (const topic of TOPIC_LIST) {
      for (const answer of allAnswers(topic)) expect(answer.split('. ')[0], topic.id).not.toMatch(/jquery/i)
    }
  })
})

describe('matchKeywords', () => {
  const route = (q: string) => matchKeywords(q)

  it.each([
    ['Does Josh know React?', 'skill_react'],
    ['Has he used Redux?', 'skill_state'],
    ['Has he worked at a startup?', 'startup'],
    ['Does he know Vue?', 'skill_vue'],
    ['Has he built a serverless service?', 'proj_ai_feature'],
    ['What is his experience with Playwright?', 'proj_playwright'],
    ['Where did he go to college?', 'education'],
    ['How can I contact him?', 'contact'],
    ['Has he used GraphQL?', 'skill_api'],
    ['What does he do for fun?', 'interests'],
    ['Tell me about his accessibility work', 'accessibility'],
    ['What did he do before software engineering?', 'pharmacy'],
    ['hi', 'greeting'],
    ['thanks!', 'thanks'],
  ])('routes "%s" to %s confidently', (q, id) => {
    const { best, confident } = route(q)
    expect(best?.id).toBe(id)
    expect(confident).toBe(true)
  })

  it('prefers a specific topic over a hub', () => {
    expect(route('What projects use TypeScript?').best?.id).toBe('skill_typescript')
  })

  it('treats a bare "tell me more" as a continuation', () => {
    expect(route('tell me more').best?.id).toBe(MORE_ID)
  })

  it('does not treat greetings inside a real question as small talk', () => {
    expect(route('hi, what languages does he know?').best?.id).toBe('skill_languages')
  })

  it.each([
    ['¿Sabe React?', 'skill_react'],
    ['¿Dónde estudió?', 'education'],
    ['¿Cómo puedo contactarlo?', 'contact'],
    ['¿Qué hace en su tiempo libre?', 'interests'],
    ['¿Ha trabajado en una startup?', 'startup'],
    ['¿Qué hacía antes del software?', 'pharmacy'],
    ['Háblame de su trabajo en accesibilidad', 'accessibility'],
    ['¿Cuántos años de experiencia tiene?', 'experience'],
    ['¿Usa lectores de pantalla?', 'proj_screen_reader'],
    ['¿Qué experiencia tiene con inteligencia artificial?', 'skill_ai'],
    ['hola', 'greeting'],
    ['¡Muchas gracias!', 'thanks'],
  ])('routes the Spanish question "%s" to %s confidently', (q, id) => {
    const { best, confident } = route(q)
    expect(best?.id).toBe(id)
    expect(confident).toBe(true)
  })

  it('ignores accents, so unaccented Spanish still matches', () => {
    expect(route('educacion').best?.id).toBe('education')
    expect(route('¿Qué tecnologías conoce?').best?.id).toBe(route('que tecnologias conoce').best?.id)
  })

  it('does not route on words that mean something else in the other language or in passing', () => {
    expect(route('¿En qué ha estado trabajando?').best?.id).not.toBe('skill_state')   // "ha estado" = "has been"
    expect(route('Yo soy reclutadora').best?.id).not.toBe('greeting')                 // Spanish "yo" = "I"
    expect(route('He seems genial').best?.id).not.toBe('thanks')
  })

  it('treats a bare "cuéntame más" as a continuation', () => {
    expect(route('cuéntame más').best?.id).toBe(MORE_ID)
  })

  it.each([...AI_EXAMPLES, ...AI_EXAMPLES_ES])('leaves the AI-only example "%s" to the model (no keyword match at all)', (q) => {
    expect(route(q).best).toBeNull()
  })

  it('is not confident about vague questions, leaving them for the model', () => {
    expect(route('Is he a good engineer?').confident).toBe(false)
    expect(route('What is the capital of France?').best).toBeNull()
  })
})

describe('resolveReply', () => {
  it('returns the topic answer and follow-ups', () => {
    const reply = resolveReply('education', null, new Set())
    expect(reply.text).toBe(TOPICS.education.answer)
    expect(reply.followUps).toEqual(TOPICS.education.followUps)
  })

  it('continues "more" with the first unseen follow-up of the previous topic', () => {
    const [first, second] = TOPICS.projects.followUps
    expect(resolveReply(MORE_ID, 'projects', new Set(['projects'])).topicId).toBe(first)
    expect(resolveReply(MORE_ID, 'projects', new Set(['projects', first])).topicId).toBe(second)
  })

  it('answers in the requested language', () => {
    const reply = resolveReply('education', null, new Set(), 'es')
    expect(reply.text).toBe(TOPICS.education.translations?.es?.answer)
    expect(reply.followUps).toEqual(TOPICS.education.followUps)
    expect(topicLabel('education', 'es')).toBe('¿Dónde estudió?')
  })

  it('falls back to unknown when "more" has nothing to continue', () => {
    expect(resolveReply(MORE_ID, null, new Set()).topicId).toBe(UNKNOWN_ID)
    expect(resolveReply('not_a_topic', null, new Set()).topicId).toBe(UNKNOWN_ID)
  })
})
