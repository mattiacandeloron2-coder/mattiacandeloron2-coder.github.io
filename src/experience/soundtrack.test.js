import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { frameHoldsSoundtrack, nextSoundtrackHold, soundtrackCanPlay, soundtrackRestart } from './soundtrack.js'

describe('frameHoldsSoundtrack', () => {
  it('leaves the song playing through Salotto', () => {
    assert.equal(frameHoldsSoundtrack('reel'), false)
  })

  it('pauses the song only for Look Behind', () => {
    assert.equal(frameHoldsSoundtrack('film'), true)
  })
})

describe('nextSoundtrackHold', () => {
  it('lets the song play when no video is on screen', () => {
    assert.equal(nextSoundtrackHold(false, { onVideo: false, audible: false }), false)
    assert.equal(nextSoundtrackHold(true, { onVideo: false, audible: true }), false)
  })

  it('pauses for a video that is playing with sound', () => {
    assert.equal(nextSoundtrackHold(false, { onVideo: true, audible: true }), true)
  })

  it('keeps playing over a video that is still muted', () => {
    assert.equal(nextSoundtrackHold(false, { onVideo: true, audible: false }), false)
  })

  it('stays paused until the video has been scrolled away', () => {
    assert.equal(nextSoundtrackHold(true, { onVideo: true, audible: false }), true)
    assert.equal(nextSoundtrackHold(true, { onVideo: false, audible: false }), false)
  })
})

describe('soundtrackCanPlay', () => {
  it('stays silent while the mute button is on', () => {
    assert.equal(soundtrackCanPlay(true, false), false)
  })

  it('stays silent while a video is holding the song', () => {
    assert.equal(soundtrackCanPlay(false, true), false)
  })

  it('plays once the button is off and the video is gone', () => {
    assert.equal(soundtrackCanPlay(false, false), true)
  })
})

describe('soundtrackRestart', () => {
  it('goes back to the start and plays when the song ends', () => {
    assert.deepEqual(soundtrackRestart(false), { time: 0, play: true })
  })

  it('goes back to the start without playing while a video is holding it', () => {
    assert.deepEqual(soundtrackRestart(true), { time: 0, play: false })
  })
})
