import { describe, it, expect } from 'vitest'
import resumeContext from '../../data/resumeContext'

describe('resumeContext', () => {
  it('exports a non-empty string', () => {
    expect(typeof resumeContext).toBe('string')
    expect(resumeContext.length).toBeGreaterThan(0)
  })

  it('contains Josh\'s full name', () => {
    expect(resumeContext).toContain('Josh Ryther')
  })

  it('contains contact email', () => {
    expect(resumeContext).toContain('jryther91@gmail.com')
  })

  it('contains education section', () => {
    expect(resumeContext).toContain('EDUCATION')
    expect(resumeContext).toContain('Computer Science')
    expect(resumeContext).toContain('Southern New Hampshire University')
  })

  it('contains professional experience at Pearson', () => {
    expect(resumeContext).toContain('Pearson Education')
    expect(resumeContext).toContain('Software Engineer')
  })

  it('contains key technical skills', () => {
    const skills = ['TypeScript', 'React', 'Vue', 'Node.js', 'AWS']
    for (const skill of skills) {
      expect(resumeContext).toContain(skill)
    }
  })

  it('contains notable projects section', () => {
    expect(resumeContext).toContain('NOTABLE PROJECTS')
    expect(resumeContext).toContain('Test Delivery Client Application')
  })

  it('contains GitHub profile link', () => {
    expect(resumeContext).toContain('github.com/jryther')
  })
})

