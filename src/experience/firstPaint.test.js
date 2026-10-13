import assert from 'node:assert/strict'
import fs from 'node:fs'
import { describe, it } from 'node:test'

const page = fs.readFileSync(new URL('../pages/index.astro', import.meta.url), 'utf8')
const frontmatter = page.split('---')[1]

describe('first paint', () => {
  it('loads the site css from the page head, before the module script', () => {
    assert.match(frontmatter, /import\s+['"]\.\.\/style\.css['"]/)
  })

  it('keeps the portrait and its text out of the first paint', () => {
    assert.match(page, /<aside class="cv-sheet"[^>]*\shidden\b/)
  })

  it('covers the page with a loading mark until the script can take it down', () => {
    assert.match(page, /<div class="boot" data-boot/)
    assert.match(page, /<p class="boot-label">loading<\/p>/)
    assert.match(page, /data-boot-percent>0%</)
    const bootAt = page.indexOf('data-boot')
    const scriptAt = page.indexOf('<script src="../main.js">')
    assert.ok(bootAt > 0 && bootAt < scriptAt)
  })
})

describe('boot gate', () => {
  const css = fs.readFileSync(new URL('../style.css', import.meta.url), 'utf8')
  const experience = fs.readFileSync(new URL('./Experience.js', import.meta.url), 'utf8')
  const scroll = fs.readFileSync(new URL('./ScrollController.js', import.meta.url), 'utf8')

  it('keeps an opaque veil over the whole screen until it is done', () => {
    assert.match(css, /\.boot\s*\{[^}]*position:\s*fixed/)
    assert.match(css, /\.boot\s*\{[^}]*inset:\s*0/)
    assert.match(css, /\.boot\.is-done\s*\{[^}]*opacity:\s*0/)
    assert.match(css, /\.boot-mark\s*\{[^}]*width:\s*120px/)
    assert.match(css, /--boot-ink/)
  })

  it('opens the page only after the model, the fonts, and a painted frame', () => {
    const start = experience.slice(experience.indexOf('async start()'), experience.indexOf('reveal() {'))
    const steps = ['figure.load(', 'document.fonts', 'compileAsync', 'onFrame()', 'reveal()']
    let at = -1
    for (const step of steps) {
      const next = start.indexOf(step)
      assert.ok(next > at, step)
      at = next
    }
  })

  it('ignores scroll until the page is revealed', () => {
    assert.match(scroll, /this\.armed = false/)
    assert.match(scroll, /if \(!this\.armed\) return/)
    const reveal = experience.slice(
      experience.indexOf('reveal() {'),
      experience.indexOf('applyLayout() {'),
    )
    assert.match(reveal, /this\.scroll\.arm\(\)/)
  })
})
