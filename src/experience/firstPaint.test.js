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
})
