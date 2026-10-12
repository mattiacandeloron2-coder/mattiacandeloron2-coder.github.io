import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { colors } from '../config.js'
import {
  applyCvWheel,
  blowHintAllowed,
  cvContactIcon,
  cvContactMarkup,
  cvContacts,
  cvCometCenter,
  cvCometTrail,
  cvSharpStart,
  cvSheetFill,
  cvSheetOpen,
  cvSheetStart,
} from './cvSheet.js'

describe('cvSheetStart', () => {
  it('starts as the still core inside the nebula', () => {
    const start = cvSheetStart({ left: 1200, top: 640, width: 12, height: 12 })
    assert.equal(start.left, 1200)
    assert.equal(start.top, 640)
    assert.equal(start.width, 12)
    assert.equal(start.height, 12)
    assert.equal(start.radius, '50%')
  })
})

describe('cvCometCenter', () => {
  it('stays as small as the core when it reaches the middle', () => {
    const core = { left: 1200, top: 640, width: 12, height: 12 }
    const center = cvCometCenter(1440, 900, core)
    assert.equal(center.radius, '50%')
    assert.equal(center.width, core.width)
    assert.equal(center.height, core.height)
    assert.equal(center.width, center.height)
    assert.equal(center.left + center.width / 2, 720)
    assert.equal(center.top + center.height / 2, 450)
  })
})

describe('cvCometTrail', () => {
  it('points the tail back toward the corner the ball left', () => {
    const angle = cvCometTrail({ left: 1200, top: 640, width: 12, height: 12 }, 1440, 900)
    assert.ok(angle > 0)
    assert.ok(angle < 90)
  })
})

describe('cvSharpStart', () => {
  it('is a flat plane with sharp corners, born in the center', () => {
    const plane = cvSharpStart(1440, 900, { width: 12, height: 12 })
    assert.equal(plane.radius, '0px')
    assert.ok(plane.width > plane.height * 2)
    assert.ok(plane.width < 1440)
    assert.ok(plane.height < 200)
    assert.equal(plane.left + plane.width / 2, 720)
    assert.equal(plane.top + plane.height / 2, 450)
  })
})

describe('cvSheetOpen', () => {
  it('becomes a full-screen dark sheet', () => {
    const open = cvSheetOpen(1440, 900)
    assert.equal(open.left, 0)
    assert.equal(open.top, 0)
    assert.equal(open.width, 1440)
    assert.equal(open.height, 900)
    assert.equal(open.radius, '0px')
  })
})

describe('cvSheetFill', () => {
  it('is not the 3d paper', () => {
    assert.notEqual(cvSheetFill().toLowerCase(), colors.paper.toLowerCase())
  })
})

describe('cvContacts', () => {
  it('orders email then phone as working links', () => {
    const contacts = cvContacts()
    assert.equal(contacts.length, 2)
    assert.equal(contacts[0].href, 'mailto:mattiacandeloro.design@gmail.com')
    assert.equal(contacts[0].icon, 'mail')
    assert.equal(contacts[1].href, 'tel:+393483198226')
    assert.equal(contacts[1].icon, 'phone')
    const markup = cvContactMarkup()
    assert.ok(markup.indexOf('mailto:mattiacandeloro.design@gmail.com') < markup.indexOf('tel:+393483198226'))
    assert.ok(markup.includes('viewBox="0 0 24 24"'))
    assert.ok(cvContactIcon('phone').includes('M22 16.92'))
    assert.ok(cvContactIcon('mail').includes('<rect'))
  })
})

describe('applyCvWheel', () => {
  it('scrolls the page and blocks the 3d when the sheet is open', () => {
    const page = { scrollTop: 0 }
    assert.equal(applyCvWheel(true, page, 80), true)
    assert.equal(page.scrollTop, 80)
  })

  it('leaves the 3d alone when the sheet is closed', () => {
    const page = { scrollTop: 0 }
    assert.equal(applyCvWheel(false, page, 80), false)
    assert.equal(page.scrollTop, 0)
  })
})

describe('blowHintAllowed', () => {

  it('stays off on a computer, even in a narrow window', () => {
    assert.equal(blowHintAllowed(false, true), false)
    assert.equal(blowHintAllowed(false, false), false)
  })

  it('is allowed on a phone', () => {
    assert.equal(blowHintAllowed(true, true), true)
  })

  it('stays off on a computer that also has a touch screen', () => {
    assert.equal(blowHintAllowed(true, false), false)
  })
})
