import assert from 'node:assert/strict'
import vm from 'node:vm'
import { describe, it } from 'node:test'
import {
  landscapeViewport,
  phoneRotateClient,
  phoneRotateDecision,
  phoneViewport,
} from './phoneRotate.js'

describe('phoneRotateDecision', () => {
  it('leaves a computer alone, even with a narrow window', () => {
    assert.deepEqual(phoneRotateDecision({ coarse: false, shortSide: 390, portrait: true }), {
      phone: false,
      needsRotate: false,
      viewport: null,
    })
    assert.deepEqual(phoneRotateDecision({ coarse: false, shortSide: 1080, portrait: false }), {
      phone: false,
      needsRotate: false,
      viewport: null,
    })
  })

  it('asks a phone in portrait to rotate', () => {
    assert.deepEqual(phoneRotateDecision({ coarse: true, shortSide: 390, portrait: true }), {
      phone: true,
      needsRotate: true,
      viewport: phoneViewport,
    })
  })

  it('gives a landscape phone the desktop layout width', () => {
    assert.deepEqual(phoneRotateDecision({ coarse: true, shortSide: 430, portrait: false }), {
      phone: true,
      needsRotate: false,
      viewport: landscapeViewport,
    })
    assert.equal(landscapeViewport, 'width=1280, viewport-fit=cover')
  })

  it('does not treat a tablet as a phone', () => {
    assert.equal(phoneRotateDecision({ coarse: true, shortSide: 768, portrait: true, pixelRatio: 2 }).phone, false)
    assert.equal(phoneRotateDecision({ coarse: true, shortSide: 501, portrait: false }).phone, false)
  })

  it('asks to rotate when the phone reports device pixels', () => {
    assert.equal(
      phoneRotateDecision({ coarse: true, shortSide: 1170, portrait: true, pixelRatio: 3 }).needsRotate,
      true,
    )
  })
})

function runClient({ coarse, shortSide, longSide, portrait, content, pixelRatio = 1 }) {
  const state = { coarse, shortSide, longSide, portrait }
  const calls = { set: 0, listeners: [] }
  const html = {
    classes: new Set(),
    classList: null,
  }
  html.classList = {
    remove(name) {
      html.classes.delete(name)
    },
    toggle(name, on) {
      if (on) html.classes.add(name)
      else html.classes.delete(name)
    },
    contains(name) {
      return html.classes.has(name)
    },
  }
  const meta = {
    content,
    getAttribute() {
      return this.content
    },
    setAttribute(_name, value) {
      calls.set += 1
      this.content = value
    },
  }
  const matchMedia = (query) => {
    const matches = query.includes('pointer: coarse')
      ? state.coarse
      : query.includes('orientation: portrait')
        ? state.portrait
        : false
    return {
      get matches() {
        return matches
      },
      addEventListener(type, fn) {
        calls.listeners.push({ type, fn, kind: 'media' })
      },
    }
  }
  const context = {
    window: null,
    document: {
      documentElement: html,
      querySelector() {
        return meta
      },
    },
    screen: {
      get width() {
        return state.portrait ? state.shortSide : state.longSide
      },
      get height() {
        return state.portrait ? state.longSide : state.shortSide
      },
    },
    matchMedia,
    devicePixelRatio: pixelRatio,
    addEventListener(type, fn) {
      calls.listeners.push({ type, fn, kind: 'window' })
    },
  }
  context.window = context
  vm.runInNewContext(phoneRotateClient(), context)
  return { html, meta, calls, state }
}

describe('phone rotate script', () => {
  const original = 'width=device-width, initial-scale=1.0'

  it('does not touch the viewport or listen on a computer', () => {
    const page = runClient({
      coarse: false,
      shortSide: 1080,
      longSide: 1920,
      portrait: false,
      content: original,
    })
    assert.equal(page.meta.content, original)
    assert.equal(page.calls.set, 0)
    assert.equal(page.html.classes.has('needs-rotate'), false)
    assert.equal(page.calls.listeners.length, 0)
  })

  it('covers a portrait phone and clears the prompt after rotation', () => {
    const page = runClient({
      coarse: true,
      shortSide: 390,
      longSide: 844,
      portrait: true,
      content: original,
    })
    assert.equal(page.html.classes.has('needs-rotate'), true)
    assert.equal(page.meta.content, phoneViewport)

    page.state.portrait = false
    const resize = page.calls.listeners.find((listener) => listener.type === 'resize')
    resize.fn()
    assert.equal(page.html.classes.has('needs-rotate'), false)
    assert.equal(page.meta.content, landscapeViewport)
  })

  it('asks to rotate when the screen size is in device pixels', () => {
    const page = runClient({
      coarse: true,
      shortSide: 1170,
      longSide: 2532,
      portrait: true,
      pixelRatio: 3,
      content: original,
    })
    assert.equal(page.html.classes.has('needs-rotate'), true)
    assert.equal(page.meta.content, phoneViewport)
  })
})
