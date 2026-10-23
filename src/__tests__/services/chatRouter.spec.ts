import { describe, it, expect } from 'vitest'
import { matchKeywords, resolveReply } from '../../services/chatRouter'
import { TOPICS, TOPIC_LIST, WELCOME, AI_EXAMPLES, MORE_ID, UNKNOWN_ID, ES_TOPICS, topicLabel } from '../../data/chatTree'
import { AI_EXAMPLES_ES } from '../../data/chatTree.es'

// Answers in every language, for the checks that apply to whatever ships
const allAnswers = (topic: (typeof TOPIC_LIST)[number]) => [topic.answer, ...Object.values(topic.translations ?? {}).map(t => t.answer)]

// Terms that must never appear in a public answer. Stored as SHA-256 hashes so the
// repo never spells them out; each word of every answer is hashed and checked against them
const BANNED_WORD_HASHES = new Set([
  '839cd11692e82b35399802778a0d4b08fb21690eb757a7d9e5030d9a2bcc2b97',
  'b3eff28ac9bf48d348ed16c0081876ead7a07f72eeb4e8e16f713c75350e3dbd',
  '7fd690e20d081646429b8b6a37835c428a6406013aa2499209837334ae3f1456',
  '8f0c5da76a8d480ea311de7a082840ab39ba73a392511ddc909ea03fe39a05bd',
  '554e79e652b29f3a01dcf98e494b9928a1dc12cc83b83e730574c9b37ca6359f',
  'c7e6673590d2426f635c9be70bd8f057389d4a1680f062ffd58c5d20a19720e4',
  '422f240e43a3226f329ba4a0236f587c3f2226e05c511c8d9151b2320473a1a8',
  '3f3af1ecebbd1410ab417ec0d27bbfcb5d340e177ae159b59fc8626c2dfd9175',
  '1225ae6c1ae69dcb4ee4781b703e12206f3b549cd3ca151070a8d8d8f371dd71',
  '3c469e9d6c5875d37a43f353d4f88e61fcf812c66eee3457465a40b0da4153e0',
  'c51e455b41df6c017327e16001dd064b8b6733faeaa69b23d9bd79c8079237d5',
])

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('')
}

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

  it('keeps private terms out of the public answers', async () => {
    const words = new Set(TOPIC_LIST.flatMap(allAnswers).join(' ').toLowerCase().match(/[a-z0-9]+(?:,\d{3})*/g))
    const banned: string[] = []
    for (const word of words) if (BANNED_WORD_HASHES.has(await sha256Hex(word))) banned.push(word)
    expect(banned).toEqual([])
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

  it('does not read "his" as the greeting "hi"', () => {
    expect(route('When is his birthday?').best).toBeNull()
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
